# Technical Design Document (TDD) — Meri Kahani

Describes the code as it is on 2026-11-03. Diagrams are in [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 1. Tech stack

| Part | Choice (version) | Why |
|---|---|---|
| Framework | **Next.js 16.4.4**, App Router | Website and server code (API routes) in one project; easy Vercel hosting; streaming responses built in. |
| UI library | **React 19.3.0** | Comes with Next.js; simple components with state. |
| Language | **JavaScript** (no TypeScript) | Easier for a beginner. |
| Styling | **Tailwind CSS 4** (via `@tailwindcss/turbopack`) | Fast styling inside components; mobile-first utilities. |
| Font | **Baloo 2** via `next/font/google` (latin + devanagari) | Friendly, rounded, supports Hindi/Marathi letters; self-hosted by Next.js. |
| AI | **Google Gemini API** via `@google/genai` **2.32.0** (Interactions API) | Free tier for a prototype; official SDK; supports streaming and `thinking_level`. |
| Server safety | `server-only` | Makes `lib/ai.js` fail to build if it is ever imported in browser code. |
| Voice | Browser **Web Speech API** (`speechSynthesis`) | Free, no key, works on Android Chrome and desktop Chrome. |
| Hosting | **Vercel** Hobby (free) | Made by the Next.js team; streaming works; environment variables for secrets. |
| Code checks | ESLint 9 + `eslint-config-next` | Catches common mistakes (`npm run lint`). |
| Runtime used locally | Node.js 24 | — |

`next.config.mjs` enables `cacheComponents`, `partialPrefetching`, and the Tailwind Turbopack loader for CSS.

---

## 2. Folder structure

```
stories/
├── app/                          # Pages, API routes and components (Next.js App Router)
│   ├── layout.js                 # Root HTML, Baloo 2 font, site title, theme colour
│   ├── globals.css               # Tailwind, night-sky colours, stars, theme-night / theme-masti
│   ├── page.js                   # "/" Home: two cards (Bedtime Story, Fun Poem)
│   ├── kahani/page.js            # "/kahani" story page (night theme)
│   ├── kavita/page.js            # "/kavita" poem page (bright theme)
│   ├── api/
│   │   ├── story/route.js        # POST /api/story  → streams a story
│   │   └── kavita/route.js       # POST /api/kavita → streams a poem
│   └── components/
│       ├── kahani/StoryForm.js   # Story form + result (client component)
│       ├── kavita/PoemForm.js    # Poem form + result (client component)
│       └── shared/
│           ├── VoicePlayer.js    # Listen / Pause / Stop / Speed (Web Speech API)
│           ├── ShareButtons.js   # Share on WhatsApp + Copy
│           ├── readTextStream.js # Reads the streamed text in the browser
│           ├── HomeButton.js     # "← Home"
│           └── PrivacyFooter.js  # "We don't save your child's details."
├── lib/                          # Server-side logic
│   ├── ai.js                     # THE ONLY FILE THAT TALKS TO THE AI (provider switch point)
│   ├── storyPrompt.js            # Story rules + builds the request from form details
│   ├── poemPrompt.js             # Poem rules + topic list + builds the request
│   ├── safety.js                 # Input checks + blocked-word list + finished-text check
│   ├── rateLimit.js              # 5 per person per hour (in memory)
│   └── streamResponse.js         # Streams text to the browser + end marker (OK/UNSAFE/ERROR)
├── public/                       # Static files (currently empty)
├── docs/                         # This documentation
├── vercel.json                   # Tells Vercel the framework is Next.js
├── .vercelignore                 # Files never uploaded to Vercel (.env*, docs, node_modules...)
├── .gitignore                    # Files never committed (.env*, node_modules, .next, .vercel...)
├── .env.local                    # Secret keys on this computer only (never uploaded/committed)
├── CLAUDE.md / AGENTS.md         # Instructions for AI coding helpers
└── package.json                  # Dependencies and scripts (dev, build, start, lint)
```

**Separation rule:** story files and poem files are separate (`kahani/` vs `kavita/`, `story` vs `kavita`
routes, `storyPrompt.js` vs `poemPrompt.js`). Only general parts are shared (`shared/`, `ai.js`, `safety.js`,
`rateLimit.js`, `streamResponse.js`).

---

## 3. Pages

| URL | File | Rendering | Notes |
|---|---|---|---|
| `/` | `app/page.js` | Static | Home with two `Link` cards |
| `/kahani` | `app/kahani/page.js` | Static shell + client form | `theme-night` |
| `/kavita` | `app/kavita/page.js` | Static shell + client form | `theme-masti`; browser theme colour `#fde047` |

**Theming:** shared components use theme colour names (`accent`, `on-accent`, `field`, `ink`, `line`) defined
in `globals.css`. The page wrapper picks `.theme-night` or `.theme-masti`, so the same VoicePlayer and
ShareButtons match each page.

---

## 4. API routes

Both routes: `POST`, JSON body, `maxDuration = 60` seconds (for Vercel).

### 4.1 `POST /api/story`
**Request (JSON):**
```json
{
  "childName": "Aarav",
  "age": "5",
  "language": "Hindi",
  "family": "Dadi, dog Bruno",
  "favourites": "cricket, mango",
  "value": "Sharing"
}
```
- `age`: "2"–"10" · `language`: English | Hindi | Marathi
- `value`: Sharing | Honesty | Courage | Kindness | Being brave at night | Listening to elders

### 4.2 `POST /api/kavita`
Same fields, but `topic` instead of `value`:
Animals | Rain | Train | Food | Festivals | Playing outside | Surprise me

### 4.3 Processing order (both routes)
1. Parse JSON (bad JSON → 400 "Something went wrong. Please try again.").
2. Tidy text: collapse spaces, trim, cut to limit + 1 character.
3. Check choices are from the allowed lists → 400 "Please fill the form properly."
4. `checkInput()` (name, lengths, blocked words) → 400 with a polite message.
5. `allowStory(address)` usage limit → 429 limit message.
6. `streamToBrowser(streamAI(rules, request, { maxTokens }))`: story 4096 tokens, poem 1536.

### 4.4 Responses
| Case | Status | Content-Type | Body |
|---|---|---|---|
| Success | 200 | `text/plain; charset=utf-8` | The text, streamed piece by piece, then the end marker `\u001E` + `OK` / `UNSAFE` / `ERROR` |
| Invalid input | 400 | JSON | `{ "error": "<polite message>" }` |
| Usage limit reached | 429 | JSON | `{ "error": "That's a lot of stories for now! Please try again in a little while 🌙" }` (poem: "...poems... 🎉") |
| AI busy / free limit (all models) | 429 | JSON | `{ "error": "The story maker is busy right now. Please try again in a little while. 🌙" }` |
| Other AI failure before any text | 500 | JSON | `{ "error": "Sorry, the story couldn't be created. Please try again in a little while." }` |

Streaming headers: `Cache-Control: no-cache, no-transform`, `X-Accel-Buffering: no`.

**End marker meaning (read by `readTextStream.js`):**
- `OK`: finished and passed the word check → show Listen/Share/Copy/New.
- `UNSAFE`: a blocked word was found → the browser hides the text.
- `ERROR`: the stream broke halfway → the browser hides the text.
- No marker (connection dropped) → treated as `ERROR`.

---

## 5. AI integration

### 5.1 Provider switch: `lib/ai.js`
- The **only** file that talks to the AI. It exports `streamAI(systemPrompt, userPrompt, { maxTokens })`,
  an async generator that yields text pieces.
- To switch to another provider (for example the Claude API), rewrite only this file, keeping the same
  function and the rule: throw an error with `code = "RATE_LIMIT"` when busy/limited before the first text.
- Imports `server-only`, so it can never be bundled into browser code.

### 5.2 Models and settings
| Setting | Value | Why |
|---|---|---|
| Model order | `gemini-3.5-flash-lite`, then `gemini-3.6-flash` (backup) | Flash-Lite measured fastest; 3.6-flash showed a 20 requests/day free limit |
| `thinking_level` | `"minimal"` | Removes long "thinking" before writing |
| `stream` | `true` | Text arrives piece by piece (`step.delta` events with `delta.type === "text"`) |
| `store` | `false` | Asks Google not to store the interaction |
| `max_output_tokens` | 4096 (story), 1536 (poem) | Length safety cap |
| SDK `maxRetries` | `0` | The default retries wasted 36–56 s per failed call |
| SDK `timeout` | 30 s per model | Give up and try the backup |
| API key | `process.env.GEMINI_API_KEY` | From `.env.local` locally, Vercel env vars in production |

**Fallback:** if a model fails **before any text** with a busy/limit error (429, 503, 504,
RESOURCE_EXHAUSTED, UNAVAILABLE, quota, rate limit, high demand, overloaded, timeout), try the next model.
If text was already sent, the error is passed on (the stream ends with `ERROR`). If all models are busy,
throw `RATE_LIMIT`.

### 5.3 Prompt files
- `lib/storyPrompt.js`: `STORY_RULES` (system instruction) + `buildStoryRequest(details)`.
- `lib/poemPrompt.js`: `POEM_RULES` + `POEM_TOPICS` + `buildPoemRequest(details)`.
- Details in [AI-PROMPTS.md](AI-PROMPTS.md).

### 5.4 Streaming path
`streamAI()` (yields text) → `streamToBrowser()` waits for the first piece (so pre-text errors can still
return JSON), then streams a `ReadableStream`; at the end it runs `isTextClean(fullText)` and sends the
end marker → browser `readTextStream()` updates the page on every piece → shows the result.
If the parent leaves the page, the stream's `cancel()` stops the AI request.

---

## 6. Voice (Web Speech API): `VoicePlayer.js`

- Language → voice code: English `en-IN`, Hindi `hi-IN`, Marathi `mr-IN`.
- Voice match: exact code first, then any voice of the same base language; `hi_IN` style is normalised.
- Marathi with no Marathi voice → Hindi voice + note. No voice at all → note on how to download one.
- Speeds: Slow = 0.8, Normal = 1.0. Story page default Slow; poem page default Normal. Speed changes apply from the next piece.
- **Chunking:** title and each paragraph/line read separately; long parts cut at `.`, `!`, `?`, `।` into pieces of at most 180 characters (stops Chrome going silent on long text).
- **Pause** = cancel speech and remember the current piece (Android Chrome has no reliable real pause). "Continue Listening" restarts that piece.
- A reference to the current utterance is kept (Chrome can drop it mid-speech otherwise); a 100 ms delay after `cancel()` avoids skipped first pieces.
- Listen is shown only after the text is complete; each new story remounts the player (`key`), which stops old speech.

**Limits:**
- Voice quality and availability depend on the device and OS. Some phones have no Hindi/Marathi voice.
- Works best in Google Chrome; other browsers may differ or not support it.
- Sound may stop if the phone screen locks (browser behaviour).
- Tested only with code checks and text-splitting tests. **Not yet tested by ear on real devices**
  (see TESTING.md).

---

## 7. Safety (details in [SAFETY-AND-PRIVACY.md](SAFETY-AND-PRIVACY.md))

| Layer | Where | What |
|---|---|---|
| Form limits | Forms (`maxLength`, `pattern`) | Name ≤ 30, letters only; other boxes ≤ 100 |
| Server input check | `lib/safety.js` `checkInput()` | Name required, ≤ 30, pattern `^[\p{L}\p{M}]+( [\p{L}\p{M}]+)*$`; boxes ≤ 100; blocked words |
| Allowed choices | Both routes | Age, language, value/topic must be from fixed lists |
| Prompt rules | `storyPrompt.js`, `poemPrompt.js` | Strictly child-safe; nothing scary, violent, romantic or sad; no brands or celebrities; avoid violent words |
| Finished-text check | `lib/safety.js` `isTextClean()` | Same blocked-word list on the full output; fails → browser hides the text |

Blocked-word matching: lower-case, split into words with Unicode letters/marks, whole-word match
(so "skill" is fine even though "kill" is blocked), plus phrase match for entries with spaces.

---

## 8. Rate limiting: `lib/rateLimit.js`
- 5 requests per address per rolling hour, **shared** between stories and poems.
- Address: first value of `x-forwarded-for`, else `x-real-ip`, else `"local"`.
- Stored in a `Map` in server memory (times only; no child details). Old entries are cleaned when the map has ≥ 1000 addresses.
- Counted only after the form passes validation.
- **Limits:** resets when the server restarts; on Vercel each server copy keeps its own count (approximate);
  families on one Wi-Fi share a limit.

## 9. Error handling (user-facing, all in English)

| Situation | Message |
|---|---|
| Network error in browser | "Please check your internet and try again." |
| Name missing / too long / not letters | "Please enter your child's name." / "Please keep the name to 30 letters or fewer." / "Please use letters only in the name (no numbers or symbols)." |
| Box too long | "Please keep each box to 100 letters or fewer." |
| Blocked word in form | "Please use kind words. This is for young children. 🙏" |
| Usage limit | "That's a lot of stories for now! Please try again in a little while 🌙" |
| AI busy (all models) | "The story maker is busy right now. Please try again in a little while. 🌙" |
| Finished text failed word check | "Sorry, we couldn't create a good story this time. Please try again. 🌙" |
| Stream broke halfway | "Sorry, something went wrong while writing. Please try again." |
| Copy failed | "Couldn't copy. Please select the text and copy it." |

Server logs contain only error messages, never the child's details.

## 10. Privacy (summary)
- No database, no files written, no cookies set by our code, no analytics.
- Form details exist only in the request while the story is generated; the story is not saved on the server.
- `store: false` is sent to Gemini. **However**, on the free tier Google's terms allow use and human review of
  prompts. See SAFETY-AND-PRIVACY.md.

## 11. Performance (measured 2026-11-03)

| Where | Test | First words | Finished |
|---|---|---|---|
| Before changes | Story / poem (non-streaming, AI safety check, SDK retries) | — (nothing until the end) | ~85–93 s |
| Local | Hindi story (437 words) | 1.8 s | 4.4 s |
| Local | Hindi poem (12 lines) | 1.2 s | 1.7 s |
| Live (Vercel) | English story (527 words) | 1.7 s | 4.5 s |
| Live (Vercel) | Marathi poem, first request ("waking up") | 9.3 s | 9.3 s |
| Live (Vercel) | English poem, second request | 2.4 s | 3.0 s |

**Why it was slow before:** the main model was out of free requests or busy; the SDK retried up to 5 times
(36–56 s per failed call); this happened twice per story (writing + AI safety check).
**What fixed it:** Flash-Lite first, `thinking_level: "minimal"`, streaming, `maxRetries: 0`, and removing the
second AI call.

## 12. Environment variables (names only)

| Name | Where | Used by | Notes |
|---|---|---|---|
| `GEMINI_API_KEY` | `.env.local` (local); Vercel → Settings → Environment Variables (Production, Preview) | `lib/ai.js` | Required. Never in code, never committed or uploaded. |
| `VERCEL_OIDC_TOKEN` | `.env.local` (added by `vercel link`) | Not used by our code | Temporary Vercel token for local tools. Kept private. |

Secret files are excluded by `.gitignore` (`.env*`) and `.vercelignore` (`.env*`).

## 13. Build, run, deploy
- Local: `npm install`, `npm run dev` → http://localhost:3000
- Checks: `npm run lint`, `npm run build`
- Deploy: `vercel deploy --prod --yes` → https://meri-kahani-nine.vercel.app
- Full steps: [HOW-TO-RUN.md](HOW-TO-RUN.md)

## 14. Known gaps (Planned)
- No automated tests (manual checklist in TESTING.md).
- No analytics or monitoring.
- No shared store for an exact usage limit.
- No AI-based meaning check of the output (word list only).
- Git: only the first 2 commits exist; later work is not committed yet (by the user's choice).
