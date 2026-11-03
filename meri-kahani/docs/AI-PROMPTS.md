# AI Prompts — Meri Kahani

How the instructions we give the AI work, and how to change them safely.

---

## 1. How a prompt is built

Every story or poem is made from **two parts**:

| Part | What it is | Where |
|---|---|---|
| **Rules** (system instruction) | Fixed instructions the AI must always follow | `STORY_RULES` in `lib/storyPrompt.js`, `POEM_RULES` in `lib/poemPrompt.js` |
| **Request** (input) | This child's details from the form | `buildStoryRequest()` / `buildPoemRequest()` in the same files |

`lib/ai.js` sends both to Gemini (`system_instruction` = rules, `input` = request).

**Example request (story):**
```
Please write tonight's bedtime story.

Child's name: Aarav
Age: 5 years
Language: Hindi
Family members or pets: Dadi, dog Bruno
Favourite things: cricket, mango
Value to teach: Sharing
```
Empty optional fields are sent as "(none given)". The poem request is the same, with
"Please write a fun poem." and "Poem topic: ..." instead of the value.

---

## 2. Story rules (`lib/storyPrompt.js`)

Role: *a loving Indian grandparent who tells gentle bedtime stories to young children.*

| Section | Rule (summary) |
|---|---|
| LANGUAGE | Whole story in the chosen language. English = simple, warm Indian English (Dadi, Nani, aangan, chai, roti welcome). Hindi/Marathi = Devanagari only, never Roman letters. |
| WORDS | Simple words, short sentences for the child's age. |
| THE HERO | Child is the hero; use the real name; use family/pet names and favourite things naturally. |
| SETTING | Warm Indian setting (home, aangan, school, festivals, mango trees, trains, rain, village or town). No foreign settings. |
| THE VALUE | Teach the value through events. Never lecture; no "moral of the story". |
| LENGTH | 450–600 words (~4 minutes aloud). Never more than 600. |
| ENDING | Slow, calm, sleepy ending; child feels safe, warm and loved. |
| FORMAT | First line = short title only; blank line; short paragraphs; plain text; no markdown or emojis. |
| SAFETY | Strictly child-safe. Nothing scary, violent, romantic or sad; no villains, monsters, injuries or death; no brands or real celebrities; never use words about killing, death, blood, weapons or bombs (e.g. "dead", "kill", "gun", "खून"). |

## 3. Poem rules (`lib/poemPrompt.js`)

Role: *writes fun, bouncy, happy poems for young Indian children.*

| Section | Rule (summary) |
|---|---|
| LANGUAGE | Chosen language; Hindi/Marathi in Devanagari; **all names in Devanagari too** (e.g. Bruno → ब्रूनो); only real, common words, never invented words for rhyme. |
| STYLE | Playful, musical, nursery-rhyme feel; rhyme and bouncy rhythm; fun sounds welcome (chhap-chhap, chuk-chuk); simple words. |
| THE CHILD | Child is the star; real name; family/pet names; favourite things. |
| TOPIC | Write about the chosen topic; "Surprise me" = any happy topic. Warm Indian setting. |
| LENGTH | 3–4 verses × 4 lines (12–16 lines). Never more than 16. |
| FORMAT | First line = short fun title; blank line; one poem line per line; blank line between verses; plain text, no emojis. |
| SAFETY | Happy and kind; nothing scary, violent, romantic or sad; no insults or teasing; no brands or celebrities; the same "never use" list of violent words. |

`POEM_TOPICS` (in the same file) must match the topic list in `app/components/kavita/PoemForm.js`.

---

## 4. Why the format rules matter (the code depends on them)

| Rule | Code that depends on it |
|---|---|
| First line is the title | Forms show line 1 as the heading; WhatsApp share uses it as the title. |
| Blank line between paragraphs/verses | Forms split paragraphs/verses on blank lines; WhatsApp share uses the first paragraph. |
| Plain text, no markdown/emojis | Text is shown as-is and read aloud; `#` or `*` would appear or be spoken. |
| Never use violent words | `isTextClean()` hides any finished text containing blocked words, so using them causes a failed story. |
| Length limits | Speed (~5 s), 4-minute bedtime reading, and the token caps in routes (4096 story / 1536 poem). |

---

## 5. Settings sent with every prompt (`lib/ai.js`)
- Model: `gemini-3.5-flash-lite` (backup `gemini-3.6-flash`)
- `thinking_level: "minimal"`, `stream: true`, `store: false`
- `max_output_tokens`: 4096 (story) / 1536 (poem), set in each route

---

## 6. How to edit prompts safely

1. **Edit only the text inside the backticks** (`` ` ... ` ``) of `STORY_RULES` or `POEM_RULES`.
   Don't remove the backticks, `export const`, or `.trim();`.
2. **Don't use a backtick (`` ` ``) or `${` inside the rules.** They would break the code.
3. **Keep these rules** (the code depends on them): title on the first line, blank lines between
   paragraphs/verses, plain text, the SAFETY section, and the length limits.
4. **Change one thing at a time**, then test (below).
5. **Adding a value or topic** needs changes in **three places**:
   - Value: the `VALUES` lists in `app/components/kahani/StoryForm.js` **and** `app/api/story/route.js`.
   - Topic: `TOPICS` in `app/components/kavita/PoemForm.js` **and** `POEM_TOPICS` in `lib/poemPrompt.js`
     (the poem route reads `POEM_TOPICS`).
6. **Adding a language** needs: the `LANGUAGES` lists in both forms and both routes, a language rule
   in both prompts, a voice code in `VoicePlayer.js` (`LANG_CODES`) and the `langCode` map in both forms.
   See ROADMAP.md (Planned).
7. **Making stories longer** may need a higher `maxTokens` in `app/api/story/route.js` and will be slower.

### Testing a prompt change
1. Run `npm run dev` and open http://localhost:3000.
2. Create one story or poem in **each** language (English, Hindi, Marathi).
3. Check: correct language and script, child's name and details used, Indian setting, length,
   calm ending (story) or rhyme (poem), title on line 1, no blocked words, and that Listen works.
4. Remember the free limit: each test uses one request, and the website allows 5 per hour.
   Restarting `npm run dev` resets the website's own counter.
5. When happy, deploy: `vercel deploy --prod --yes`.

---

## 7. Known prompt-quality issues (from tests on 2026-11-03)
- Hindi/Marathi poems sometimes have weak rhymes or odd words (a rule against invented words was added).
- Names are sometimes spelled slightly differently in Devanagari (e.g. "आराव" instead of "आरव").
- Stories sometimes land just under 450 words (one test: 437).
- Flash-Lite may write slightly simpler text than larger models. Keep checking with real parents (Plan Step 5).
