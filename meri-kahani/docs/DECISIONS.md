# Decisions — Meri Kahani

> Newer decisions may replace older ones; replaced entries are marked "superseded". For the current design see [TECHNICAL-DESIGN.md](TECHNICAL-DESIGN.md).

Important choices we made, and why.

## 2026-11-03 — It is a website, not a mobile app
**Decision:** Meri Kahani is a website that opens in the browser on phones and computers. It is not a Play Store / App Store app.
**Why:** Parents can use it instantly with a link — no download or install. One website works on every phone and computer. It is simpler and cheaper to build and update, which suits a beginner.

## 2026-11-03 — Use Next.js to build the website
**Decision:** We use Next.js as the tool to build the website.
**Why:** It is popular, well documented, and lets us keep the website and the "behind the scenes" part (talking to the AI safely) in one project. It is also easy to put online later.

## 2026-11-03 — Next.js setup choices
**Decision:** App Router, plain JavaScript (not TypeScript), and Tailwind for styling.
**Why:** App Router is the current, recommended way to build Next.js sites. JavaScript is easier for a beginner than TypeScript. Tailwind lets us style things quickly right inside the page code.

## 2026-11-03 — Night-sky design, mobile-first
**Decision:** Dark blue background, twinkling stars, a soft yellow moon, big rounded buttons. Designed for phone screens first.
**Why:** It feels calm and fits bedtime. Most parents will use it on their phone, often in a dark room, so a dark screen is gentle on the eyes.

## 2026-11-03 — "Baloo 2" font
**Decision:** Use the Baloo 2 font for the whole website.
**Why:** It looks friendly and rounded, and it supports Devanagari letters, so Hindi and Marathi stories will look good too.

## 2026-11-03 — Three languages: English, Hindi, Marathi
**Decision:** Stories can be made in English, Hindi or Marathi.
**Why:** These are the languages our target Indian parents use at home for bedtime stories.

## 2026-11-03 — Use Google Gemini for story writing
**Decision:** The AI key is named `GEMINI_API_KEY`, so we will use Google's Gemini AI to write stories.
**Why:** The user chose Gemini. The key was set up in `.env.local`.

## 2026-11-03 — Model: Gemini 3.6 Flash, with a backup (superseded: see "Speed: Flash-Lite first")
**Decision:** Use `gemini-3.6-flash`. If it is busy or out of free limit, try `gemini-3.5-flash-lite`.
**Why:** This is a free prototype. Google's docs (checked 2026-11-03) list 3.6 Flash as the stable Flash model, and both models are free. During testing 3.6 Flash was briefly "busy", so a backup makes the website more reliable.

## 2026-11-03 — AI code kept in one file (`lib/ai.js`)
**Decision:** Only `lib/ai.js` talks to the AI. Story rules live separately in `lib/storyPrompt.js`.
**Why:** Later we can switch to the Claude API by changing only `lib/ai.js`. The user can edit story rules without touching any AI code.

## 2026-11-03 — AI is called only from the server
**Decision:** The browser sends the form to our own route `/api/story`. Only the server talks to Gemini.
**Why:** The secret key never reaches the parent's phone or browser, so nobody can copy it.

## 2026-11-03 — Voice: the browser's built-in speech (Web Speech API)
**Decision:** Read stories aloud with the voices already built into the phone or computer.
**Why:** It's free, needs no key, and works offline once the story is shown. The downside is that voice quality depends on the device, and some devices have no Marathi voice (then we use the Hindi voice).

## 2026-11-03 — Read aloud in small pieces; Pause = stop and remember
**Decision:** Speak the story one small piece at a time (title, paragraphs, sentences up to 180 characters). Pause stops the voice and remembers which piece we were on.
**Why:** Chrome often goes silent partway through long text, especially on Android. Small pieces avoid this. Android Chrome doesn't support real pause, so "stop and remember" works the same everywhere.

## 2026-11-03 — Slow speed by default
**Decision:** The default speed is Slow (0.8×). Normal (1×) is the other choice.
**Why:** It's for bedtime: a slower, calmer voice helps children relax and fall asleep.

## 2026-11-03 — Two safety layers: a word list for input, the AI for stories (superseded: see "Replaced the AI safety check")
**Decision:** What parents type is checked against a simple list of blocked words. Each story is checked by the AI (SAFE / UNSAFE), with one retry.
**Why:** The word list is instant and free, and catches obvious bad words before we use the AI. A story can only be judged properly by reading it, so the AI does that. The downside is that each story now uses at least 2 AI requests (up to 4 with a retry), so the free limit runs out faster. Also, a word list can't catch everything (spelling tricks), but the AI story check is a second guard.

## 2026-11-03 — Usage limit by internet address, kept in memory
**Decision:** Max 5 stories per internet address per hour, remembered only in server memory.
**Why:** It's simple, needs no login, and saves the free AI limit. Limits to know about:
- Families on the same Wi-Fi share one address, so they share the 5.
- Restarting the server resets the counts.
- Once online on Vercel, there may be several server copies, each with its own count, so the limit is approximate. That's fine for a prototype. A shared store (like Upstash Redis) would make it exact later.

## 2026-11-03 — Full product and technical documentation
**Decision:** Added README (index), PRD, USER-FLOW, TECHNICAL-DESIGN, ARCHITECTURE, AI-PROMPTS, SAFETY-AND-PRIVACY, ROADMAP and TESTING to docs/. They are written only from the actual code, with anything not built marked "Planned".
**Why:** So anyone (or any AI helper) can understand, run, test and extend the project, and so the open risks are written down.

## 2026-11-03 — Gemini free-tier terms are an open risk (not yet decided)
**Status:** Open. To decide before sharing beyond friends.
**Facts:** Google's terms for the unpaid Gemini API (checked 2026-11-03) allow use and human review of prompts, say not to send personal information, and say API apps must not be directed at or likely accessed by under-18s. We send children's first names and family names.
**Options:** move to the paid Gemini tier (only `lib/ai.js` settings and billing change), switch provider, or keep sharing to a small test group. Get legal advice. See [SAFETY-AND-PRIVACY.md](SAFETY-AND-PRIVACY.md).

## 2026-11-03 — Hosting: Vercel Hobby (free), deployed with the CLI
**Decision:** Host on Vercel's free Hobby plan, deploying from this computer with `vercel deploy --prod`. No GitHub for now. The Gemini key lives only in Vercel's encrypted environment variables. `vercel.json` sets the framework to Next.js, and `.vercelignore` keeps secret and unneeded files out.
**Why:** Free, made by the Next.js team, and streaming works out of the box. The CLI keeps it simple for a beginner. GitHub automatic deploys can be added later.
**Note:** The Hobby plan is meant for personal, non-commercial use.

## 2026-11-03 — Speed: Flash-Lite first, minimal thinking, streaming, no retries
**Decision:** Use `gemini-3.5-flash-lite` as the main model (`gemini-3.6-flash` as backup), with thinking set to "minimal", streaming on, and the toolkit's automatic retries off.
**Why:** Measured: Flash-Lite shows first words in ~1 s and finishes a story in ~4 s. 3.6-flash allows only 20 free requests per day and was often busy. The toolkit's automatic retries wasted 36–56 seconds on every failed call. Streaming lets parents start reading within ~2 seconds.
**Trade-off:** Flash-Lite may write slightly simpler stories than 3.6-flash. So far the quality looks good; keep checking.

## 2026-11-03 — Replaced the AI safety check with a word check (supersedes "Two safety layers")
**Decision:** No second AI call to check stories. Instead: strict safety rules in the prompts, plus a fast blocked-word check on the finished text. If it fails, the text is hidden and a friendly message is shown.
**Why:** The second AI call doubled the waiting time and used twice the free limit.
**Trade-off:** A word list can't judge meaning, so a story that is unsuitable but uses no blocked words would not be caught. Because of streaming, a parent might briefly see text that is then hidden. If this becomes a problem, we can bring back an AI check later (for example, a quick check that runs while the parent reads).

## 2026-11-03 — Shorter stories (450–600 words) and poems (12–16 lines)
**Decision:** Stories about 4 minutes read aloud. Poems 3–4 verses of 4 lines.
**Why:** Faster to create, and a good length for bedtime. The user asked for this.

## 2026-11-03 — Website text in simple English; only the story/poem is in the chosen language
**Decision:** All buttons, labels and messages are in simple English. The Language choice only changes the story or poem. The name "Meri Kahani" and the web addresses /kahani and /kavita stay the same.
**Why:** The user chose one clear language for the website. Keeping the addresses the same means links don't break.

## 2026-11-03 — Stories and poems on separate pages and in separate files
**Decision:** Home (/) lets parents choose 📖 Kahani (/kahani) or 🎉 Masti Kavita (/kavita). Each has its own form, server route and AI instructions. Only general parts are shared: voice, share buttons, Home button, footer, the AI connection, safety checks and the usage limit.
**Why:** The user wanted them completely separate so changing one doesn't break the other. The shared parts are the same for both, so sharing them avoids fixing the same bug twice.

## 2026-11-03 — Different look and voice speed for poems
**Decision:** Poems use bright yellow/orange/green colours and Normal voice speed. Stories keep the calm night sky and Slow speed.
**Why:** Poems are for fun and play, while stories are for falling asleep. The look and voice match each mood.

## 2026-11-03 — One usage limit for stories and poems together
**Decision:** 5 per person per hour in total, not 5 of each.
**Why:** Both use the same free AI limit, which is what we're protecting. This is easy to change in `lib/rateLimit.js` if the user prefers 5 of each.

## 2026-11-03 — Don't store children's details
**Decision:** We don't save the form details anywhere, and we ask Google not to store the request (`store: false`).
**Why:** Children's names and family details are private. We only keep what we need, for as long as we need it.

## 2026-11-03 — API keys only in `.env.local`
**Decision:** Secret keys (like the AI service key) are kept only in `.env.local`, which is never committed to git.
**Why:** If a key is put in code or uploaded to GitHub, others could steal it and run up bills.
