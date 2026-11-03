# Progress Log — Meri Kahani

A dated log of what we did. Newest entries at the bottom.

## 2026-11-03 — Project setup (before Step 1)
- Created `CLAUDE.md` with project rules.
- Created the `docs/` folder with `PLAN.md`, `PROGRESS.md`, `DECISIONS.md`, `HOW-TO-RUN.md`.
- Added `.gitignore` so secrets (`.env.local`) are never saved in git.
- Set up git and made the first commit.
- No app code written yet.
- New rule added to `CLAUDE.md`: no git commands or commits until asked; we commit at the end.

## 2026-11-03 — Step 2A: Website created with the story form (part of Plan Step 1)
- Created the Next.js website (version 16.4.4) with App Router, JavaScript and Tailwind.
- Built one page (`app/page.js`) with a moon, twinkling stars and a dark-blue night sky.
- Built the form (`app/components/StoryForm.js`): child's name, age dropdown (2–10),
  language buttons (English default / Hindi / Marathi), family or pet names (optional),
  favourite things, value to teach dropdown, and a big "Kahani Banao" button.
- When the button is clicked, the details are shown below the form. No AI yet.
- Used the "Baloo 2" font because it is friendly and also supports Hindi/Marathi letters.
- Checked: the project builds with no errors, and the page loads at http://localhost:3000.
- Filled in `docs/HOW-TO-RUN.md`.
- Committed to git (the user asked for this commit).

## 2026-11-03 — Secret key file
- Created `.env.local` in the project root with one line: `GEMINI_API_KEY=` (the user pastes the key themselves).
- Confirmed git ignores `.env.local` (it is listed in `.gitignore`).
- No code reads `GEMINI_API_KEY` yet. That comes when we connect the AI (Plan Step 1).

## 2026-11-03 — Step 2B: AI writes the story (part of Plan Step 1)
- Installed Google's official SDK `@google/genai` (version 2.32.0) and `server-only`.
- `lib/ai.js`: the only file that talks to the AI. Reads `GEMINI_API_KEY` from `.env.local`.
  Uses `gemini-3.6-flash` (stable and free tier per Google's docs on 2026-11-03), with
  `gemini-3.5-flash-lite` as a backup if the main model is busy or out of free limit.
  Asks Google not to store the request (`store: false`).
- `lib/storyPrompt.js`: all story rules (language, simple words, child as hero, Indian setting,
  value without lecture, 600–800 words, sleepy ending, title first, strict child safety).
- `app/api/story/route.js`: a server-side route. It checks the form data, calls `lib/ai.js`,
  and sends back the story or a friendly error.
- Form now shows "Kahani ban rahi hai... 🌙" while waiting, then the story in large text.
  If the free limit is reached or Google is busy: "Thodi der baad try karein. 🌙".
- Tested: the first try failed because Google said `gemini-3.6-flash` was busy (503, "high demand").
  Added the backup model and the friendly message for this case. The second try worked:
  a Hindi story in Devanagari, "आरव का मीठा आम", about 560 words, with a calm sleepy ending.
- `.env.local` already existed with the key filled in; it was not changed and is ignored by git.
- Not committed (the user did not ask this time).

## 2026-11-03 — "Step 3": Voice — read the story aloud (Plan Step 2)
- New file `app/components/StoryPlayer.js`, shown below the story.
- Big "▶️ Suniye" button, plus Pause and Stop. After Pause the button says "▶️ Aage Suniye".
- Voice chosen by language: English → en-IN, Hindi → hi-IN, Marathi → mr-IN.
  If there's no Marathi voice, it uses the Hindi voice and shows a small note.
  If there's no voice at all for the language, a note explains how to download one in phone settings.
- Speed: Slow (0.8, default) or Normal (1.0). A change applies from the next piece.
- The story is read in small pieces: the title, then each paragraph, with long paragraphs
  cut at sentence ends (max 180 characters). Tested on the Hindi story: 22 pieces, no words lost.
- Pause works by stopping and remembering the current piece, because Chrome on Android
  doesn't support real pause. Pressing play again restarts that piece from its beginning.
- A new story or leaving the page stops any voice that is playing.
- Checked: code check (lint) passes and the page loads. Not yet heard on a real device:
  the browser tool wasn't connected, so the sound needs testing by the user.
- Not committed (the user did not ask).

## 2026-11-03 — "Step 4": Safety & sharing (Plan Step 3)
- New `lib/safety.js`:
  - Name: max 30 characters, letters only (English or Hindi/Marathi letters, spaces between words).
  - Family and favourite things: max 100 characters each.
  - A list of blocked words (violent, adult, swear words in English, Hindi/Marathi in
    English letters, and Devanagari). If any box has one, no story is made and a polite message appears.
  - `isStorySafe()`: asks the AI to reply SAFE or UNSAFE for each story. An unclear reply counts as unsafe.
- `app/api/story/route.js`: write story → AI safety check → if unsafe, write once more →
  if still unsafe, show "Maaf kijiye, abhi achhi kahani nahi ban paayi...".
- New `lib/rateLimit.js`: max 5 stories per person (internet address) per hour, kept only in
  server memory. The 6th shows "Aaj ke liye bahut kahaniyan ho gayi, thodi der baad aana 🌙".
  Only real story attempts count (not forms rejected for bad input).
- `lib/ai.js`: function renamed from `generateStory` to `askAI`, because it now also does safety checks.
- Footer: "🔒 Hum aapke bachche ki jaankari save nahi karte." Server logs no longer
  include the child's details (only error messages).
- New `app/components/ShareButtons.js`: "💬 WhatsApp par bhejein" (title, first ~220 characters,
  website link) and "📋 Copy kahani" (full story; has a backup copy method for phones opening
  the site over Wi-Fi).
- "✨ Nayi Kahani" button: clears the story, scrolls back to the form, and keeps the details filled in.
- Form boxes now have the same length limits, so parents can't type too much.
- Tests: the 6 bad-input cases (numbers in name, name too long, "gun", a Hindi swear word,
  120 characters, a wrong value) all got the right polite message. The usage limit test
  allowed 5, blocked the 6th, allowed a different person, and allowed again after 1 hour.
  Hindi names like "आरव कुमार" pass the name check. One real Marathi story
  ("इरा आणि रात्रीची जादू") passed the AI safety check, but took ~1.5 minutes and was ~390 words.
- Not committed (the user did not ask).

## 2026-11-03 — Separate Kahani and Masti Kavita pages
- The user asked to remove a "Kahani/Kavita toggle" from the form. There was no such toggle in
  the code, so nothing was removed. The poem feature was built new.
- New layout:
  - `/` (`app/page.js`): "Meri Kahani" welcome and two big cards, 📖 Kahani and 🎉 Masti Kavita.
  - `/kahani` (`app/kahani/page.js`): the story form and result, working as before (Slow voice).
  - `/kavita` (`app/kavita/page.js`): new poem form with bright yellow/orange/green colours.
  - Both pages have a "← Home" button at the top and the privacy footer at the bottom.
- Separate files for stories and poems:
  - Stories: `app/components/kahani/StoryForm.js`, `app/api/story/route.js`, `lib/storyPrompt.js`
  - Poems: `app/components/kavita/PoemForm.js`, `app/api/kavita/route.js`, `lib/poemPrompt.js`
  - Shared by both: `app/components/shared/` (VoicePlayer, ShareButtons, HomeButton,
    PrivacyFooter), plus `lib/ai.js`, `lib/safety.js`, `lib/rateLimit.js`
- Poem form: name, age, language, family/pets, favourite things, "Kavita kis baare mein?"
  (Animals, Rain, Train, Food, Festivals, Playing outside, Surprise me), and a "🎉 Kavita Banao" button.
  Result: verses shown line by line, voice at Normal speed, WhatsApp, Copy, "✨ Nayi Kavita".
- Moved files: `StoryForm.js` → `components/kahani/`; `StoryPlayer.js` → `components/shared/VoicePlayer.js`
  (now takes a default speed and the word "Kahani"/"Kavita"); `ShareButtons.js` → `components/shared/`
  (now shares the link to the current page, /kahani or /kavita).
- Page colours: shared parts use theme colours ("theme-night" for stories, "theme-masti" for poems) in `app/globals.css`.
- `lib/safety.js`: `isStorySafe` renamed to `isSafeForChildren` (checks stories and poems).
  The bad-word message no longer says "kahani".
- The usage limit is shared: 5 stories + poems together per person per hour.
- Tests: lint passes; `/`, `/kahani` and `/kavita` all load; the poem route rejects a wrong topic
  and a bad word; the story route still rejects a bad name. One real Hindi poem about rain worked
  (~85 seconds). Quality issues seen: the dog's name came out in English letters ("Bruno"), and a few
  made-up words or weak rhymes. Added two rules to `lib/poemPrompt.js` (names in Devanagari, no invented words).
- Not committed (the user did not ask).

## 2026-11-03 — All website text in simple English
- Changed every button, label, heading, loading message, error message, limit message,
  voice note and footer from Hinglish to simple English (61 text changes in 11 files).
  Examples: "Create Story", "Create Poem", "Listen" / "Continue Listening", "Share on WhatsApp",
  "Copy", "New Story" / "New Poem", "Creating your story... 🌙", "What should the poem be about?",
  "We don't save your child's details.", "That's a lot of stories for now! Please try again in a little while 🌙".
- Home cards: "📖 Bedtime Story" and "🎉 Fun Poem". Page headings and browser tab titles match.
- Kept: the website name "Meri Kahani", the web addresses /kahani and /kavita, and the story/poem
  rule files (`lib/storyPrompt.js`, `lib/poemPrompt.js`). The blocked-word list in `lib/safety.js`
  still has Hindi/Marathi words, because it must catch bad words typed in those languages.
- The Language choice still only controls the language of the story or poem.
- Searched all code files for leftover Hinglish or Devanagari website text: none found.
  (The only Devanagari left is the "।" full stop, which the voice player uses to split sentences.)
- Tests: lint passes; all 3 pages load with the new English text; error messages come back in English.
- Not committed (the user did not ask).

## 2026-11-03 — Much faster: streaming, no thinking, no second AI call
**Where the time went (measured):**
- `gemini-3.6-flash` (the main model) allows only **20 requests per day** on the free tier, and today's
  were used up. It was also often "busy" (503).
- The Gemini toolkit **retries a failed call up to 5 times** with growing waits. Each failed call to
  3.6-flash took **36–56 seconds** before giving up. Only then did our code switch to the backup model.
- Every story/poem did this twice (once to write, once for the AI safety check). That explains ~85 seconds.
- `gemini-3.5-flash-lite` with thinking at "minimal": first words in 1.1 s, full story in 3.6 s.
- With retries off, a failed call gives up in 3.1 s instead of 36–56 s.

**Changes:**
- `lib/ai.js`: now `streamAI()` (was `askAI()`). It sends text piece by piece (streaming), with
  `thinking_level: "minimal"`, a length cap, no automatic retries, and a 30 s timeout. Main model is now
  `gemini-3.5-flash-lite` (fastest); `gemini-3.6-flash` is the backup. It only switches model before any text is sent.
- Removed the second AI safety-check call. `lib/safety.js` now has `isTextClean()`: a fast check of the
  finished text against the blocked-word list. The strict safety rules stay in the story/poem prompts,
  plus one new line asking the AI never to use words like "dead", "kill", "gun", "खून".
- New `lib/streamResponse.js` (shared): streams the text to the browser, then sends an end marker:
  OK, UNSAFE (blocked word found) or ERROR (broke halfway). Errors before any text still come as normal messages.
- New `app/components/shared/readTextStream.js` (shared): reads the text in the browser as it arrives.
- Both forms: show "Creating your story/poem..." until the first words, then the text grows word by
  word with "✍️ Still writing...". If the end marker is UNSAFE or ERROR, the text is hidden and a friendly
  message shown. Listen is greyed out ("when the story is finished") until the text is complete;
  then Listen, Share, Copy and New Story/Poem appear.
- Length: stories 450–600 words (about 4 minutes); poems 3–4 verses of 4 lines (12–16 lines).

**New times (measured through the website, Hindi):**
- Story: first words **1.8 s**, finished **4.4 s** (437 words, word check OK).
- Poem: first words **1.2 s**, finished **1.7 s** (12 lines, word check OK; "Bruno" now written ब्रूनो).
- Not committed (the user did not ask).

## 2026-11-03 — Online on Vercel (Plan Step 4)
- Checked first: `npm run build` passes.
- Installed the Vercel CLI (65.10.0) globally.
- Added `export const maxDuration = 60` to both API routes (a story takes ~5 s).
- Added `.vercelignore` so `.env*` files, `node_modules`, `.next`, `.git`, `docs`, `CLAUDE.md`
  and `AGENTS.md` are never uploaded.
- Login: the user's first login was on the Vercel website only, so the CLI stayed "Logged out".
  Fixed by starting `vercel login` from here; the user approved the device code in the browser.
- Created project `meri-kahani` in team `checkmate16` and linked the folder. `vercel link` added a
  `VERCEL_OIDC_TOKEN` line to `.env.local`; the Gemini key in that file was not changed.
- The user added `GEMINI_API_KEY` in the Vercel dashboard for Production and Preview (checked with
  `vercel env ls`: the value shows as "Hidden").
- First deploy failed: "The Output Directory 'public' is empty", because Vercel didn't detect Next.js.
  Added `vercel.json` with `"framework": "nextjs"`. The second deploy worked.
- **Live: https://meri-kahani-nine.vercel.app**
- Live tests:
  - `/`, `/kahani` and `/kavita` open publicly (no login wall).
  - `/.env.local`, `/.env`, `/.vercel/project.json`, `/docs/PLAN.md`, `/CLAUDE.md`, `/lib/ai.js` and
    `/package.json` all give 404. No key-like text in the page.
  - English story: first words 1.7 s, finished 4.5 s, 527 words, word check OK (streaming works).
  - Marathi poem: 9.3 s (first request, Vercel waking up), 12 lines, OK. A second English poem:
    first words 2.4 s, finished 3.0 s, OK.
  - Usage limit not tested live: it would need 6 real requests and would lock the user's own internet
    address out for an hour. Same code as tested locally; online it is counted per server copy.
- Not committed (the user did not ask).

## 2026-11-03 — Full documentation set
- Reread the code and existing docs, then created: `docs/README.md` (index), `PRD.md`, `USER-FLOW.md`,
  `TECHNICAL-DESIGN.md`, `ARCHITECTURE.md`, `AI-PROMPTS.md`, `SAFETY-AND-PRIVACY.md`, `ROADMAP.md`, `TESTING.md`.
- Only facts from the code; unbuilt features are marked "Planned". No keys or secrets in any document.
- Checked Google's Gemini API terms (2026-11-03). The free tier allows use and human review of prompts,
  asks not to send personal information, and says API apps must not be directed at or likely accessed by
  under-18s. Recorded as an open risk in SAFETY-AND-PRIVACY.md, PRD.md, ROADMAP.md and DECISIONS.md.
- Competitor section in PRD.md is high-level and marked "needs research"; no specific competitor claims.
- Success metrics in PRD.md are marked as not measured (no analytics is built).
- Made the existing docs consistent: PLAN.md (status line, links, Step 5 items), DECISIONS.md (two older
  entries marked superseded; new entries for documentation and the free-tier risk), HOW-TO-RUN.md (links),
  CLAUDE.md (docs list).
- Not committed (the user did not ask).
