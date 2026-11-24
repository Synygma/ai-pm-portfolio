# ParCare: Prompt Log

Every prompt given to Claude Code / Cursor (and to any other AI tool used for the build) is appended
here, per the team handoff (section 13). At submission, merge this into
"Parent-Care Capstone — Prompt Document" (`docs/source/Parent-Care_Capstone_Prompt_Document.docx`).

Template:

```
## P-NNN | YYYY-MM-DD HH:MM IST | Tool | model:
Prompt:
> (verbatim)
Outcome: accepted / modified / rejected — why
Files touched:
```

---

## P-001 | 2026-11-03 18:20 IST | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompt (pasted together with two images: the app icon and the avatar sample sheet):

> You are building the CHILD side of "ParCare", a capstone project app. This is a usable demo for an MBA capstone, launched only in India, NOT a market product. English only in this version (Hindi comes in v2), but every user-facing string must live in a translation file (messages/en.json) so Hindi can be added later without code changes.
>
> ## 0. Read first, then plan, then WAIT
> 1. Read these files in this folder: "CLAUDE handoff md.md" (main spec: sections 4–9 and 15 are the build spec; ignore sections 10–13 about marketing/deck/calendar), "transcript-1nov-specs.txt", the Consumer Synthesis file, and the Capstone brief PDF. The two ".docx" files are actually plain text; read them as text.
> 2. Look at the two images in this folder: "APP_Icon.png" (the app icon) and "avataar_sample_icons.png" (the avatar companions).
> 3. Produce a written plan: folder structure, data model, screens, the sub-slices below, and any questions or conflicts you find. Do NOT write code until I approve the plan.
>
> ## 1. Hard constraints
> - FREE ONLY. No paid services, libraries, APIs, or templates. Do not use the Claude/Anthropic API inside the app (paid).
> - I am on Windows, using Claude Code inside Cursor, with Command Prompt. All npm scripts must work on Windows (no bash-only scripts; use cross-platform tools).
> - Never use real personal data. Never commit secrets. Keys go in .env.local (git-ignored); provide .env.example with every variable name and a comment on where to get it.
> - If something conflicts with handoff sections 4 or 8 (what the app is NOT, guardrails), stop and ask me.
> - Do not report a step "done" without running it: `npm run build`, `npm test`, and starting the app.
>
> ## 2. Approved architecture (do not change without asking)
> - Next.js (App Router) + TypeScript + Tailwind, installable PWA, mobile-first (phone-width column; centred phone frame on desktop).
> - next-intl (or equivalent free i18n) with English only for now.
> - Supabase free plan: Postgres with row-level security (a child sees only their own household), Supabase Auth (child logs in with email + password; also a one-tap "Demo login" for reviewers), Supabase Storage for short voice clips.
> - Data access through a repository layer with TWO adapters: Supabase (real) and in-memory (used by tests and when Supabase keys are missing). The app must run fully on the in-memory adapter with seed data, so I can see it before the accounts are ready.
> - LLM: Google Gemini free tier via Google's official Gen AI JavaScript SDK. Model name from env (GEMINI_MODEL) so I can change it. Wrap behind an AiProvider interface with a deterministic Mock provider used in tests and when no key exists. Free-tier data may be used by Google, so only fictional data ever goes to it.
> - Speech (English): browser Web Speech API for speech-to-text, behind a SpeechProvider interface (Sarvam will be added later as another provider). Always offer a typed-text fallback.
> - Notifications: Web Push using the free `web-push` npm package (VAPID keys from env) + an in-app looping alarm page with screen wake lock.
> - Scheduling: ALL timing logic as pure functions (input: state + "now", output: actions). One API route `/api/tick` (protected by CRON_SECRET) runs them. In production Supabase pg_cron will call it every minute (Vercel's free Hobby cron only runs once a day, so do not rely on it). In development, a "Demo clock" calls it.
> - Hosting: Vercel (Hobby). Code on GitHub. Tests: Vitest (unit) + Playwright (end-to-end, mobile viewport, Chromium). GitHub Actions workflow runs lint, typecheck, Vitest and Playwright on every push.
> - Branding: one config file (src/config/brand.ts) holds the app name ("ParCare"), icon paths and the avatar list (id, name, style line, image path), so changes happen in one place. Do NOT use the WhatsApp name, logo or icons anywhere.
>
> ## 3. Brand assets (use the images in this folder)
> App icon — from "APP_Icon.png" (a family in a circle held by hands, with a house and heart):
> - Use the free `sharp` npm package in a one-time script (scripts/make-icons.mjs, runnable on Windows with `npm run icons`) to produce: favicon (32×32 and .ico), apple-touch-icon (180×180), PWA icons 192×192 and 512×512, and a 512×512 maskable icon (icon centred with safe padding on a soft light-blue background matching the circle).
> - Wire them into the PWA manifest (name "ParCare", short_name "ParCare") and the page head. Keep the original file in assets/source/.
> - Show the icon on the entry screen and in the app header.
>
> Avatars — from "avataar_sample_icons.png" (one combined picture: a 3-column × 4-row grid of 12 cards; each card has a portrait on the left and text on the right):
> - With `sharp`, crop ONLY the portrait part of each card (no card text, no small symbol icons), as square images, 256×256 WebP, saved to public/avatars/<id>.webp. Do this in a script (scripts/crop-avatars.mjs, `npm run avatars`) so it can be re-run.
> - After cropping, open each output image and check it visually: face fully visible, no text included, no neighbouring card included. Adjust the crop coordinates until all 12 are clean. Show them to me on a temporary /avatars-preview page before moving on.
> - Display avatars in circles (like WhatsApp profile photos).
> - The 12 avatars (id — name — style line shown under the name):
>   1. krishna — Krishna — spiritual and devotional
>   2. shiva — Shiva — calm, powerful, meditative
>   3. guruji — Guruji — wise, disciplined, guiding
>   4. trekker — Trekker — active, outdoorsy, adventurous
>   5. champ — Champ — sporty, energetic, fitness-minded
>   6. explorer — Explorer — curious, travel-loving
>   7. sangeet-saathi — Sangeet Saathi — musical, expressive, soulful
>   8. kalakaar — Kalakaar — artistic, creative
>   9. garden-mitra — Garden Mitra — nature-loving, nurturing
>   10. masterchef — MasterChef — food-loving, warm, enthusiastic cook
>   11. vidya — Vidya — intelligent, book-loving, inspiring
>   12. my-child — My Child — reminders from your child
> - RULE for "My Child": it is NOT an AI companion the parent can pick. Use it only as the picture shown with the child's own recorded voice reminders (N14). The AI must never speak as the child (guardrail G16: the avatar is an AI voice, not a person). The 11 others are the selectable AI companions; whichever the parent picks must still say it is an AI at setup.
> - Helper look (handoff 7.7): the same chosen avatar with a small "helper" badge (a cloth bag icon) overlaid at the bottom-right of the circle.
> - The parent chooses the avatar in the parent app (next phase). In the child app, show the parent's chosen avatar on the avatar chat and in Settings (read-only, "Your parent chooses this"), plus the full companion gallery in Settings so the child can see the options.
>
> ## 4. Look and feel
> WhatsApp-style (Android) look-alike per handoff section 5: green top bar (~#008069), chat list with the avatar chat pinned at top with unread count, beige chat background (~#EFEAE2), white incoming bubbles, light-green outgoing bubbles (~#D9FDD3), bubble tails, timestamps inside bubbles, ticks, voice-note bubble with play button, waveform, duration and speed chip. Large touch targets, readable font sizes, good contrast. The ParCare icon replaces any WhatsApp branding.
>
> ## 5. Scope: CHILD APP ONLY (parent app is the next phase)
> Entry screen: ParCare icon and name, then "I am the child" / "I am the parent". Parent option shows a friendly "Parent app coming in the next build" placeholder.
>
> Child screens and features (from handoff 7.1 child steps I–VII, 7.5, 7.6, 7.8, 7.9, section 8):
> 1. Login (email + password) and "Demo login".
> 2. Setup wizard with progress bar and save-and-resume:
>    a. Child details: name, pet name parents use for you, country, city, age, time zone (auto-detected, editable).
>    b. Parent details: one or both parents; name, pet name, gender, age, country, city; which one(s) the child will manage (v1 manages one; if both are chosen, explain v1 handles one and ask which).
>    c. "How setup works" in short bullets.
>    d. "How to introduce the app": bullet script presenting the companion as a friend standing in for you so you can be part of their day; must also say honestly that the companion is an AI voice, not a person (G16). Show the companion gallery (11 selectable avatars) so the child can tell the parent they will pick one.
>    e. "Describe your parent's day": record by voice (push-to-talk button, visible mic-on indicator) or type. Transcript → AI → "meta list" of must-check items with approximate times and check-in type (woken up, medicine, help arrived, social, physical, puja/spiritual, appointments/tests, last check-in of the day). Show as an editable checklist (tick/untick, edit text/time, add item). Explain that the parent will later give their own version and confirm or change it.
>    f. Optional emergency contact: name + phone. Before saving, ask "Have you told this person they are the first point of contact in an emergency?" Store ONLY on "Yes"; on "No", do not store and explain why (G7).
>    g. Invite link: generate a one-time secure parent token link and a wa.me share button with a pre-written message (real WhatsApp share, no API).
>    h. "Call your parent now" step: instructions to call on the phone, put them on speaker, and open the link.
>    i. "What this service can and cannot do" (plain bullets: not an emergency or medical service; cannot place calls; cannot ring when the browser is fully closed; etc.) + T&C in short bullets + child's tick. Record terms acceptance with version and time. Note on screen that the parent will also tick it in their app.
> 3. Home (chat-list style) with tabs: Chats, Digest, Helper, Reminders, Settings.
>    - Avatar chat (shows the parent's chosen companion): setup messages, daily digests, alerts and review prompts appear as bubbles.
> 4. Daily digest (F19–F22, section 7.9): sent at the child's chosen local time; quotes the parent's own words; flags change from usual pattern ("usually walks at 6; no walk mentioned today") but NEVER diagnoses; shows only what the parent consented to share; buttons "Matched what my parent told me" / "Did not match", stored.
> 5. Alerts and alarm (section 7.6, F7): when escalation reaches the child, a full-screen alarm page with looping sound that keeps ringing until the child taps "Switch off"; factual wording: "I checked in with [pet name] twice and did not hear back." Never the word "emergency" for missed check-ins. Show the emergency contact only if confirmed. The app never places calls. Also send a web push. Alert history list with acknowledged time.
> 6. Emergency-word alarm (G5/N10): if a parent recording or helper request contains an emergency word, the child gets a distinct alarm: "[pet name] used an emergency word. The app asked them to contact local help." English keyword list in a config file (e.g. emergency, urgent, help me, ambulance, I fell, can't breathe, chest pain); deterministic match is primary.
> 7. Helper list (7.7): parent's non-urgent requests (shown with the helper-badge avatar), voice note, transcript, time, status New / Seen / Done.
> 8. Reminders for the parent (N14): child records a short voice note (MediaRecorder), sets date/time (in the parent's time zone, showing the child's local time too) and repeat; shown with the "My Child" image; status shows Scheduled / Ringing / Parent said OK / Snoozed.
> 9. Settings: parent's consented check-ins (READ-ONLY with note "Your parent controls these"), parent's chosen companion (read-only) + companion gallery, digest time, time zone, emergency contact, notifications on/off (web push subscribe), language selector showing English only with "Hindi coming soon", "What we can and cannot do" + T&C (always reachable).
> 10. Review prompts (7.5): child prompt at +1 week ("Check with your parent that all is OK and ask if they want to change any check-in"), then every 3 months. (The +2-week parent prompt is for the parent app; record it in data only.)
> 11. "All check-ins disabled" alert (N7): if the parent has no active consents, alert the child: "All check-ins are switched off. Please talk to [pet name]."
> 12. No compliance scores, streaks, or "proof she was fine" anywhere (G12).
>
> ## 6. Demo tools (essential, because the parent app is not built yet)
> Route /demo, visible only when DEMO_MODE=true:
> - Demo clock: shows simulated "now"; buttons +5 min, +1 hour, +1 day, +1 week, +3 months, reset; every change runs /api/tick logic.
> - Parent simulator: answer the next due check-in with typed text; let a check-in go unanswered; send a helper request (typed, with an option containing an emergency word); switch off all check-ins; change the parent's companion; acknowledge a child reminder ("OK") or snooze it.
> These let a reviewer walk: due check-in → parent prompt 1 → prompt 2 → child alarm → digest → helper request → reminder → review prompt → all-disabled alert.
>
> ## 7. Seed data (fictional only)
> - Child: Priya Sharma, 41, London (UK time zone, to show time-zone handling); her mother's pet name for her: "Gudiya". Login: demo.child@example.com / documented in README.
> - Parent: Kamla Sharma, 72, Lucknow (IST); Priya calls her "Maa". Chosen companion: Vidya.
> - Consented check-ins: woken up ~6:00, BP medicine 8:30 and 20:30, morning walk 6:30, evening puja 18:30, last check-in of the day 21:00; one doctor appointment next week.
> - Escalation gaps: prompt 2 after 10 min, child alarm 20 min after that.
> - A week of history: digests with quotes, one day with no walk (pattern flag), two helper requests (one Done), one past escalation that was acknowledged, one child reminder.
> - Emergency contact: neighbour "Mrs. Verma", confirmed as told.
>
> ## 8. Data model
> Use handoff section 9.5 as the base, limited to what the child side needs now but designed so the parent app plugs in later (include avatar_id on the parent profile). Include RLS policies and a SQL migration file. Keep the parent-invite token table ready for the next phase.
>
> ## 9. Tests (required)
> Vitest unit tests for: escalation timing (prompt 1 → 2 → child alarm, with parent-chosen gaps), alarm stays active until acknowledged, consent revocation removes future check-ins, "all disabled" alert, emergency-word detection (positives and false-positive checks), emergency contact not stored without "Yes", T&C gating (cannot finish setup without the tick), review-prompt timing (+1 week, then every 3 months), digest shows only consented items, time-zone conversion London↔IST, meta-list parsing with the Mock AI provider, "My Child" is not selectable as an AI companion.
> Playwright: demo login → walk the setup wizard (typed fallback) → home → use /demo to trigger a missed check-in → alarm appears → switch off → digest → matched button.
>
> ## 10. Build order (sub-slices; after EACH one: run build + tests + app, show me what to click to check it, update docs/PROMPTS_LOG.md, then stop and wait for my OK)
> C0. Housekeeping: move the source documents into docs/source/ and the two images into assets/source/; create a trimmed build-only CLAUDE.md from the handoff (sections 4–9 and 15, child app focus, plus the decisions in this prompt, including the name ParCare and the avatar rules); create docs/PROMPTS_LOG.md using the handoff template and log THIS prompt as P-001; scaffold the Next.js app at the folder root (if the scaffolder refuses a non-empty folder, scaffold in a temp folder and move the files in); .gitignore, .env.example, Vitest, Playwright, GitHub Actions; README with Windows Command Prompt instructions.
> C1. Brand assets: icon script, avatar crop script, manifest, /avatars-preview page. Stop and show me the 12 crops.
> C2. Data layer: repository interfaces, in-memory adapter, seed data, Supabase migration + RLS + adapter, auth with demo login.
> C3. WhatsApp-style shell: entry screen, home, tabs, avatar chat, brand config.
> C4. Setup wizard (all steps in section 5.2) with AI meta list via AiProvider (Gemini + Mock).
> C5. Check-in engine (pure functions), /api/tick, demo clock, parent simulator, alarm page, alerts, web push.
> C6. Daily digest with Gemini (quotes, pattern flags, no diagnosis) + matched/did-not-match.
> C7. Helper list and reminders for the parent.
> C8. Settings, review prompts, all-disabled alert, can/cannot + T&C pages, final Playwright run, README update with demo steps.
>
> ## 11. Out of scope for now
> Parent app screens, Hindi or any other language, Sarvam, real WhatsApp integration, phone calls of any kind, location, camera, covert listening, voice sentiment, siblings, payments.
>
> Start with step 0: read the files and look at the two images, then give me the plan. Ask me anything unclear before coding.

Outcome: accepted. Claude read all sources and produced the plan (now `docs/PLAN.md`) with 8 questions, and waited before writing code. Findings: Node.js and Git were not installed (the user installed them); the two ".docx" files were real Word files, so their text was extracted to `.txt` copies; the images were not in the folder, so the pasted copies were used (the icon is a JPEG with a white background).
Files touched: none (planning only).

---

## P-002 | 2026-11-03 18:45 IST | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompt:
> approved

Outcome: accepted. All 8 plan defaults adopted: in-memory adapter for local/tests with Supabase required for the deployed URL; "My Child" image as specified; companions always phrased as "<Name>, your ParCare AI companion"; digest default 19:00 child time covering the parent's previous 24 h; 30-day voice retention; seed reminder uses a generated tone labelled "sample"; Supabase inactivity pause documented. Sub-slice **C0** carried out.
Files touched: moved source docs to `docs/source/` (plus `.txt` extracts of both .docx) and images to `assets/source/`; scaffolded Next.js 16.4.4 (create-next-app in a temp folder, moved in); added next-intl, Vitest, Playwright; `CLAUDE.md`, `docs/PLAN.md`, `docs/PROMPTS_LOG.md`, `README.md`, `.env.example`, `.gitignore`, `.github/workflows/ci.yml`, `vitest.config.mts`, `playwright.config.ts`, `messages/en.json`, `src/i18n/*`, `src/app/{layout,page}.tsx`, `src/app/globals.css`, `tests/unit/i18n.test.ts`, `tests/e2e/smoke.spec.ts`; removed template SVGs and favicon.

---

## P-003 | 2026-11-04 16:30 IST | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompt:
> use ParCare as name and use mailto:ftpdmgroup6@gmail.com for git . proceed for C1

Outcome: accepted. Git identity set for this repo only (user.name "ParCare", user.email ftpdmgroup6@gmail.com; the "mailto:" prefix was dropped because git expects a plain address) and C0 committed. Sub-slice **C1** carried out:
- `scripts/make-icons.mjs` (`npm run icons`): removes the white background with a border flood fill (inside of the circle protected), writes favicon.ico (16/32/48, PNG-in-ICO written by hand), icon.png 32, apple-icon 180, PWA 192/512 and maskable 512 on light blue (#DCEFFD), art inside the 80% safe zone.
- `scripts/crop-avatars.mjs` (`npm run avatars`): card bounds found from the white gutters; per-portrait squares measured on grid overlays and checked visually. "My Child" needed a tighter crop (126 px source square) to leave out the orange sparkle and the speech-bubble icon.
- `src/config/brand.ts` (name, colours, icons, avatar list, `isSelectableCompanion`); avatar names and style lines in `messages/en.json` so Hindi can be added later.
- `src/app/manifest.ts`, viewport theme colour, `AvatarCircle` with cloth-bag helper badge, temporary `/avatars-preview` page.
- Tests: `tests/unit/brand.test.ts` ("My Child" not selectable, 11 companions, texts and files exist, manifest), `tests/e2e/brand.spec.ts`. Added `.gitattributes` (LF line endings).
Files touched: scripts/*, src/config/brand.ts, src/components/wa/AvatarCircle.tsx, src/app/{layout,page,manifest}.tsx/ts, src/app/avatars-preview/page.tsx, src/app/{favicon.ico,icon.png,apple-icon.png}, public/icons/*, public/avatars/*, messages/en.json, tests/*, package.json, CLAUDE.md, README.md, .gitattributes.

---

## P-004 | 2026-11-04 17:30 IST | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompt:
> 1. change the helper icon to a gender neutral character 2. names and lines will always be in english irrespective of language choosen . crops look right. go ahead with C2

Outcome: accepted. C1 crops approved.
- Helper badge redrawn as a gender-neutral figure (plain round head and shoulders, no hair or clothing cues) carrying a cloth tote bag (`AvatarCircle.tsx`).
- Avatar names and style lines moved from `messages/en.json` to `src/config/brand.ts` as fixed English brand text (never translated); CLAUDE.md rule 4 now notes this exception.
- Sub-slice **C2** carried out:
  - Row types for all 19 tables (`src/data/types.ts`), generic repository interface (`src/data/repo.ts`), in-memory adapter with dev snapshot `.data/dev-db.json` (`src/data/memory.ts`), Supabase adapter with camelCase↔snake_case mapping (`src/data/supabase.ts`, `case.ts`), mode switch + service repos (`src/data/index.ts`), data-access layer (`src/data/access.ts`).
  - Fictional seed (`src/data/seed.ts`): Priya / Kamla "Maa" / Vidya, 7 consents, 8 days of check-ins and answers, 7 digests with exact quotes, one no-walk flag, one acknowledged escalation, 2 helper requests, sample reminder, confirmed emergency contact, terms acceptance, review prompts.
  - `supabase/migrations/0001_init.sql`: tables, checks ("my-child" can never be stored as the companion), cascades for deletion on request, RLS (child sees only their household), private `voice` bucket.
  - Auth: memory mode = scrypt hashes + signed httpOnly cookie; Supabase mode = Supabase Auth via `@supabase/ssr` + `src/proxy.ts` session refresh. Entry screen, login with Demo login, sign-up, parent placeholder (`/parent`, `/p/[token]`), temporary `/home`.
  - `npm run seed:supabase` (tsx), `npm run db:reset`; `.env.example` gains SESSION_SECRET and DEV_DB_FILE.
  - Tests: time zones London↔IST incl. DST, memory adapter, case mapping, password + session token, seed integrity, seed↔migration column check (46 unit); e2e auth flows (11 total, dev and production mode).
Files touched: src/data/*, src/auth/*, src/domain/time.ts, src/config/{brand,env,demo,terms}.ts, src/proxy.ts, src/app/{page,login,signup,parent,p/[token],home}/*, src/components/{ui/Screen,ParentPlaceholder,auth/AuthForms,wa/AvatarCircle}.tsx, supabase/migrations/0001_init.sql, scripts/{seed-supabase.ts,reset-dev-db.mjs}, messages/en.json, tests/*, package.json, playwright.config.ts, .env.example, README.md, CLAUDE.md.

---

## P-005 | 2026-11-05 10:30 IST | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompt:
> OK

Outcome: accepted (C2 approved). Sub-slice **C3** carried out: the chat-style shell.
- Phone-width column on every screen, centred like a phone frame on desktop (root layout).
- Signed-in screens: green top bar with the ParCare icon, five bottom tabs (Chats · Digest · Helper · Reminders · Settings), static shell with data streamed behind Suspense.
- Chats tab: the parent's companion chat pinned, with last-message preview, time/day, pin icon and unread count.
- Companion chat (`/chat`): beige background, white incoming / light-green outgoing bubbles with tails, times inside bubbles, ticks (grey sent, blue read), day separators (Today / Yesterday / date in the child's time zone), opens at the newest message, marks messages read. Bubble text for setup, digest, missed check-in (factual, never "emergency"), emergency word, all disabled, review, helper, reminder; companion always introduced as an AI. Read-only footer "Only <Name> writes here".
- Components: `Bubble`, `DaySeparator`, `VoiceNoteBubble` (play/pause, waveform, duration, 1×/1.5×/2× chip, generated "sample" tone, no audio asset), `InputBar` (mic ↔ send), icons drawn in code. Temporary `/ui-preview` page shows them all.
- Placeholders for Digest, Helper, Reminders; Settings shows the account, data mode and Log out. Demo clock helper `appNow()`.
- Dev tweaks: Next dev-tools button moved to top-right (it covered the Chats tab); Playwright waits longer on the local dev server only.
- Tests: chat wording and grouping, unread count, demo-clock filtering, tone/WAV, speed cycling, InputBar and VoiceNoteBubble components (60 unit); e2e chat list → chat → read, tabs, input bar, desktop frame (15 total, dev and production mode).
Files touched: src/app/layout.tsx, src/app/globals.css, src/app/(app)/**, src/app/ui-preview/*, src/components/wa/*, src/domain/{chat,clock}.ts, src/data/chat-data.ts, src/i18n/format.ts, src/lib/audio/tone.ts, messages/en.json, tests/*, next.config.ts, playwright.config.ts, CLAUDE.md.

---

## P-006 | 2026-11-05 14:30 IST | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompt:
> OK

Outcome: accepted (C3 approved). Sub-slice **C4** carried out: setup wizard + AI meta list.
- 9-step wizard at `/setup` with progress bar, Back/Next, save-and-resume after every step (resumes on reload). Chats redirects unfinished accounts to the wizard; finished accounts are sent home.
  - a. child details with auto-detected, editable time zone (old names like Asia/Calcutta normalised)
  - b. one or two parents, choose which one is managed (v1 note)
  - c. how setup works
  - d. how to introduce the app (says the companion is an AI voice, not a person, and not the child) + the 11 selectable companions
  - e. describe the day: hold-to-talk (Web Speech, visible "Mic on" indicator) or type → AI → editable checklist (tick, edit text/time/type, add item); stored as meta items only, no consents (G1)
  - f. optional emergency contact, stored only on "Yes" (G7); on "No" nothing is kept, not even in the draft
  - g. one-time invite link (token shown once, SHA-256 hash stored, 7-day expiry, a new link revokes the old) with "Share the link" (`wa.me`) and copy
  - h. call your parent now (no `tel:` links)
  - i. can/cannot + T&C bullets; finishing is blocked without the tick (G10); records acceptance + terms version, review prompts at +1 week (child) and +2 weeks (parent), and the first chat bubble
- AI: `AiProvider` with `MockProvider` (deterministic English rules) and `GeminiProvider` (`@google/genai`, JSON schema, temperature 0, model from `GEMINI_MODEL`); every answer sanitised; Gemini failure falls back to the mock; transcripts never logged. `docs/AI_EVAL.md` + `tests/fixtures/ai-eval.json` (6 fictional cases) + `npm run ai:eval`. Mock: 18/18, honestly flagged as tuned on the same set; Gemini row pending a key.
- Speech: `SpeechProvider` interface with Web Speech implementation (`src/lib/speech`).
- Demo: "Demo: start a new setup" login (fresh fictional account each time); sign-up now goes to the wizard. `deleteChildData` service (also the basis for G14 deletion).
- Tests: 81 unit (AI parsing + sanitising, validation, G7 storage, T&C gating, invite hash, save-and-resume, deletion, companion-less setup bubble); e2e full wizard with typed fallback incl. resume, G7 "No", T&C gating, no chat-app name, no tel: links (16 total, dev and production mode).
Files touched: src/ai/*, src/lib/speech/index.ts, src/domain/{setup,invite,time,chat}.ts, src/services/{setup,household}.ts, src/app/(app)/setup/*, src/components/setup/*, src/auth/{index,actions}.ts, src/data/access.ts, src/config/demo.ts, src/components/auth/AuthForms.tsx, src/app/(app)/(tabs)/home/page.tsx, src/app/(app)/chat/page.tsx, messages/en.json, scripts/ai-eval.ts, docs/AI_EVAL.md, tests/*, package.json, README.md, CLAUDE.md.

---

## P-007 | 2026-11-05 18:30 IST | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompt:
> geneder question answer is okay ...proceed for C5

Outcome: accepted (C4 approved; gender options Female / Male / Other-prefer-not-to-say kept). Sub-slice **C5** carried out: check-in engine, tick, demo clock, parent simulator, alarm, alerts, push.
- Engine (`src/domain/engine.ts`, pure): schedules consented items at the parent's local time (36 h ahead, never before consent); prompt 1 at due time → prompt 2 after gap A → child alarm after gap B, gaps measured from the real prompt times; answered check-ins never escalate; revoked consent deletes future check-ins and stops prompting; "all check-ins are switched off" alert once; new `lapsed` status (migration 0002) when the app was not running during the prompt window, so "I checked in twice" is always true.
- Emergency words (`src/config/emergency-words.ts`, `src/domain/emergency.ts`): deterministic phrases with exclusions ("fell asleep", "help arrived", "not urgent"…); bare "help" never triggers. Parent answers and helper requests are checked; a match raises the distinct emergency-word alarm.
- `/api/tick` (Bearer CRON_SECRET, constant-time compare, 503 without secret) runs every household at its own demo-clock time; `supabase/cron.example.sql` schedules it every minute with pg_cron + pg_net. `/api/alarm` for the open app (also runs the tick in demo mode).
- Alarm: watcher in the signed-in layout (polls every 10 s and on tab focus) opens the full-screen `/alarm`: factual text, check-in name, confirmed emergency contact as plain text (no calls), looping Web Audio sound (distinct pattern for emergency words), Screen Wake Lock, "Tap to turn on the alarm sound" when the browser blocks audio, rings until **Switch off**. Alert history `/alerts` with switch-off times; alarms also appear as chat bubbles.
- Web Push: `web-push` with VAPID keys from env, hand-written `public/sw.js` (notification + click opens the alarm), no-cache headers, registration in the root layout, Settings toggle "Alarm notifications" (graceful when keys are missing / blocked / unsupported).
- Demo tools `/demo` (DEMO_MODE only): demo clock (+5 min / +1 h / +1 day / +1 week / +3 months / reset, each runs the tick) showing London and Lucknow time; next check-ins with both times and status; parent simulator (answer next check-in, let one go unanswered, helper request with/without emergency word, switch all check-ins off/on, change companion — never "My Child"); reset demo data (memory mode). Reminder answer/snooze deferred to C7.
- Tests: 116 unit (escalation timing, gaps, lapse, alarm until acknowledged, consent revocation, all-disabled, emergency words ±, answer stops escalation, let-go-unanswered, My Child never selectable); e2e: tick auth, missed check-in alarm → switch off → history → chat, emergency-word alarm, all-off + companion change, production-only real click on the demo link (21 total). Playwright now uses one worker (shared demo data).
Files touched: src/domain/{engine,emergency}.ts, src/config/emergency-words.ts, src/services/{checkins,alerts,push,demo}.ts, src/i18n/translator.ts, src/app/api/{tick,alarm}/route.ts, src/app/(app)/{layout.tsx,alarm/*,alerts/*,demo/*}, src/app/(app)/(tabs)/{home,settings}/*, src/components/{alarm/*,demo/*,settings/PushToggle.tsx,ServiceWorkerRegister.tsx}, src/app/layout.tsx, src/data/types.ts, public/sw.js, next.config.ts, supabase/migrations/0002_checkin_lapsed.sql, supabase/cron.example.sql, messages/en.json, tests/*, playwright.config.ts, README.md, CLAUDE.md.

---

## P-008 | 2026-11-05 19:30 IST | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompt:
> OK , Use real time demo for check.

Outcome: accepted (C5 approved). Sub-slice **C6** carried out and checked in real time (no demo-clock jumps).
- Digest rules (`src/domain/digest.ts`, pure): due at the child's chosen local time (default 19:00, DST-safe), covering the parent's 24 hours before it; each slot sent once; changing the time never back-fills; items only from consented + shared check-ins (G1/G2); quotes are the stored words exactly; pattern notes "not done" / "not mentioned" only against a habit (yes on ≥3 of the previous 7 days); ParCare's own sentences pass a blocked-word check (`src/config/blocked-words.ts`, stems vs whole words so "sadhana" is fine) (G13); no scores (G12).
- Sending (`src/services/digest.ts`): runs inside every tick, so the open app's 10-second poll (demo) or pg_cron (production) delivers it; adds a chat bubble and a web push; feedback "Matched what my parent told me" / "Did not match" stored, one per digest, changeable. The seed now builds its digests with the same function.
- Screens: Digest tab (list with updates, changes from usual, feedback), digest detail (own words with the parent's local time, pattern notes with "not medical advice", "only what Maa chose to share", feedback buttons); chat "Open digest" opens that digest; Settings gets the daily digest time (plain form that works before hydration).
- Demo simulator now says which check-in an answer will go to.
- Fix: URL-reading client components (bottom tabs, alarm watcher) wrapped in Suspense, required by Cache Components on dynamic routes like `/digest/[id]`.
- Real-time check: answered a check-in live, set the digest time to the next minute, kept Chats open; the digest arrived 11 s after its time with the typed words quoted exactly (screenshots taken). Same flow is an automated e2e test.
- Tests: 127 unit (timing incl. DST, no back-fill, consented/shared only, exact quotes, window edges, habit-based flags, blocked words + templates, safe labels, send-once + feedback); e2e digest list/detail/Matched and the real-time digest (23 total on the production build; 22 + 1 production-only on the dev server).
Files touched: src/domain/digest.ts, src/config/blocked-words.ts, src/services/{digest,checkins}.ts, src/data/seed.ts, src/app/(app)/(tabs)/digest/{page.tsx,actions.ts,[id]/page.tsx}, src/components/digest/DigestFeedback.tsx, src/components/settings/DigestTimeForm.tsx, src/app/(app)/(tabs)/settings/{page,actions}.ts(x), src/app/(app)/chat/page.tsx, src/app/(app)/{layout,(tabs)/layout}.tsx, src/components/wa/{BottomTabs,TabPlaceholder}.tsx, src/app/(app)/demo/page.tsx, src/components/demo/DemoTools.tsx, messages/en.json, tests/*, README.md, CLAUDE.md.

---

## P-009 | 2026-11-05 21:00 IST | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompt:
> OK

Outcome: accepted (C6 approved). Sub-slice **C7** carried out: Helper list + Reminders, checked in real time.
- Helper tab (5.8): the parent's requests with the companion avatar + helper badge, time, their words (and the voice note when there is one), New → Seen (on opening) → Done / reopen; emergency-word requests labelled; "ParCare does not book services".
- Reminders tab (5.9, N14): list with the "My Child" picture (never an AI voice), voice note (or typed note), time in the parent's zone and the child's, repeat, status Scheduled / Ringing / Parent said OK / Snoozed, delete. New reminder: MediaRecorder recording (max 60 s / 1 MB, red "Recording" indicator only while on, auto-stop, playback before saving), short note, date + time in the parent's time zone with the child's time shown live, repeat once / daily / weekly.
- Rules (`src/domain/reminders.ts`): rings at the due time; OK / snooze 10 min; daily/weekly repeats roll to the same local time (DST-safe), catching up after long clock jumps; validation (future time, note or recording, supported small audio).
- Voice storage (`src/services/voice.ts`): Supabase private bucket with signed URLs, or local files served only to the household's signed-in child (`/api/voice/...`, path-checked); 30-day deletion in the tick (G15). Voice-note bubble now reads the real length (works around Chrome's "Infinity" duration for recorded webm).
- Demo simulator: "Parent says OK" / "Snooze 10 min" for the ringing reminder.
- Real-time check: recorded a reminder for two minutes ahead (Maa's time); it turned to Ringing on its own via the open app's poll; screenshots of Helper, New reminder and Reminders.
- Tests: 137 unit (reminder timing, OK/snooze, repeats incl. DST and catch-up, input rules, storage + delete, unsafe paths, 30-day purge, helper statuses); e2e helper flow, typed reminder ringing + OK, real recording with Chromium's fake mic and playback (404 when signed out) — 26 on the production build.
Files touched: src/domain/reminders.ts, src/services/{reminders,helper,voice,voice-store,checkins}.ts, src/app/api/voice/[household]/[file]/route.ts, src/app/api/{tick,alarm}/route.ts, src/app/(app)/(tabs)/{helper,reminders}/**, src/components/{helper,reminders}/*, src/components/wa/VoiceNoteBubble.tsx, src/app/(app)/demo/{page,actions}.ts(x), src/components/demo/DemoTools.tsx, src/i18n/{date,format}.ts, next.config.ts, messages/en.json, tests/*, playwright.config.ts, README.md, CLAUDE.md; removed src/components/wa/TabPlaceholder.tsx.

---

## P-010 | 2026-11-05 23:30 IST | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompt:
> OK

Outcome: accepted (C7 approved). Sub-slice **C8** (last of the child app) carried out.
- Review prompts (5.11, G9; `src/domain/review.ts`, `src/services/review.ts`): child +1 week then every 3 months (13 weeks), parent +2 weeks then every 3 months (data only); run by the tick; a review bubble in the companion chat with "Done, we talked", also in the alert history; seed shows the +1 week prompt.
- Settings (5.10): the parent's consented check-ins read-only with both time zones and digest sharing, "waiting for consent" items before the parent agrees, the all-off message; the companion read-only + gallery (`/settings/companions`: 11 companions, chosen one marked, My Child never a companion, helper look); digest time; own time zone; emergency contact page (G7 rules, replace / remove); notifications; language (English, Hindi coming soon); next review date; terms version accepted; Delete all our data (G14/G15).
- "What ParCare can and cannot do" + T&C at public `/terms`, linked from entry, login and Settings (G10).
- Home banner when nothing is checked (N7 / G1).
- Removed `/avatars-preview` and `/ui-preview` (and their e2e tests; avatar files and the speed chip are now tested elsewhere).
- Final required Playwright flow (`tests/e2e/full-flow.spec.ts`): demo new setup → wizard (typed) → home → /demo parent agrees → missed check-in → alarm → switch off → parent answers → +1 day → digest quotes her → Matched.
- README: 10-step demo script.
- Tests: 147 unit (review timing incl. clock jumps, review done, emergency contact replace rules, deleting voice clips + rows); e2e 31 on the production build (30 + 1 production-only on dev).
Files touched: src/domain/{review,chat}.ts, src/services/{review,checkins,setup,household}.ts, src/data/{seed,sample}.ts, src/auth/actions.ts, src/app/(app)/(tabs)/settings/**, src/app/(app)/(tabs)/home/page.tsx, src/app/(app)/{chat,alerts,demo}/*, src/app/{page,login/page}.tsx, src/app/{terms,deleted}/*, src/components/settings/*, messages/en.json, tests/*, README.md, CLAUDE.md; removed src/app/{avatars-preview,ui-preview}.

---

## P-011 | 2026-11-06 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompt (summary of the user's list, before approving C8):
> 0. "What the app can and cannot do" at the start of login / first sign-in with an "I understand" checkbox; store the tick with date, time and IP address, never deleted. 1. Helper: once done, the buttons should disappear and only Done show. 2. A Skip option in the digest. 3. Show in Settings how long data, voice notes and transcripts are kept; let the user choose 8 days / 15 days / monthly; say it is deleted after a month. 4. Weekly / monthly summary of major tasks done and skipped. 5. When is a phone version available? 6. Can the parent app be built in parallel? 7. Time-zone options not working. 8. Country and city must be correct; no wrong entries.

Decisions (asked, because items 0 and 4 touch G14 / G12): keep the agreement record after deletion but store only a salted one-way fingerprint of the IP (not the IP); keeping period applies to voice clips + the parent's words + digests; summaries in words with dates, no numbers; full world city list.
Answers given: 5, ParCare is already an installable PWA; on a phone it needs the hosted https site (Vercel + Supabase), no app-store version. 6, possible on a branch but not advised while these changes touch shared tables; parent app next.

Outcome: all eight handled.
- `/agree` gate (`src/app/agree/*`, `src/services/agreement.ts`, `requireChild`), `terms_agreements` table, terms text v2.
- Settings card "How long we keep your family's data" (`RetentionForm`), purge in the tick (`src/services/retention.ts`).
- Weekly / monthly summaries (`src/domain/summary.ts`, `SummaryView`, links on the Digest tab).
- Digest "Skip, I have not checked"; Helper Done without buttons.
- Time zone: a real list (the old free-text box only suggested zones matching what was typed, so it looked broken); fixed a React key warning in it.
- Places: `src/data/places.ts` (all-the-cities + city-timezones, both MIT; GeoNames CC BY credited), `/api/places`, country select + city type-ahead in setup, server check on save, time zone filled in from the city.
- Migration `0003_terms_retention_skip.sql`; `.env.example` gets `IP_HASH_SALT`.
- Tests: 161 unit (agreement + fingerprint + kept after deletion, keeping period incl. clips, summaries, places, Skip); e2e updated + new `p011.spec.ts`.

---

## P-012 | 2026-11-06 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompt:
> OK (P-011 approved). Next step chosen: "Start the parent app".

Decisions asked and answered: English only for now; parent signs in with the invite link, no password (90 days); the companion speaks aloud with the browser's free voice (mute available); child and parent can be signed in at once in one browser for the demo.
Outcome: plan written to `docs/PLAN-PARENT.md` (access, screens, setup A–F, check-ins live, data changes, slices P1–P6). Waiting for approval before building.

---

## P-013 | 2026-11-07 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompt:
> approved (parent-app plan, docs/PLAN-PARENT.md)

Outcome: slice **P1** (parent access + shell) built.
- Invite link: `/p/[token]` checks without using it up (safe for link previews); "Open my ParCare" uses it once, signs older phones out, starts a 90-day parent session (`parent_sessions`, secret hashed; cookie `parcare_parent`, separate from the child's login).
- Parent access layer `src/data/parent-access.ts` (server-side, scoped to her household); `/parent` sends a signed-in parent to her app, others are told to open their child's link.
- Parent app under `/p`: her companion chat (WhatsApp-style, large text, opens at the newest message), read aloud with the phone's free voice (button on every companion bubble, automatic for the newest, on/off in her Settings), always-visible SOS / Ask for help / Settings. SOS: local help + the family's emergency contact, no calls. Help and full Settings arrive in P4/P5.
- Two chats: `chat_messages.audience`; the child's chat never shows the parent's. Seed: Kamla's chat (hello + last two days of prompts and her answers).
- Child Settings: "Make a new link for Maa's phone". Demo tools: "Open Maa's app" (same browser, new tab).
- Migration `0004_parent_app.sql` (also prepares snooze, parent drafts, parent push, answer source for P2–P4).
- Tests made independent of the time of day (after 19:00 London the app correctly sends today's digest).
- Tests: 168 unit; 37 e2e on the production build.

---

## P-014 | 2026-11-07 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompt:
> OK (P1 approved)

Outcome: slice **P2** (the parent's own setup, handoff 7.1 A–F + terms) built.
- `/p/setup`, 8 steps with progress and save-and-resume: companion (11, "AI voice, not a person") → her day (hold-to-talk, typed, or morning / afternoon / evening) → what the companion understood (A2) → up to 3 follow-ups about the child's items she did not mention (A3, G4) → tick / untick → consent per item, nothing pre-ticked (G1), per-item sharing (G2), spoken recap ("I do not want to micromanage you…") → thank-you + daily summary on/off → reminder gaps (5–60 min) → terms tick (recorded, with the agreement record). Companion lines have read-aloud; SOS stays visible; a soft 12-minute "we can finish this later".
- Finishing stores her items and consents, companion, gaps; tells both chats ("Amma finished their setup and agreed to 3 check-ins").
- AI evaluation: 4 parent-app cases added (32/32 with the mock); one real miss found first and fixed in the mock rules (an "evening" at the start of a sentence now applies to its later parts). A3 documented as deterministic.
- Tests: 177 unit (follow-up matching and limit, validation, consents only on Yes, sharing, no summary = nothing shared, both chats, drafts); e2e parent setup end to end incl. resume.

---

## P-015 | 2026-11-08 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompt:
> Ok (P2 approved)

Outcome: slice **P3** (live check-ins in the parent app) built.
- The tick delivers prompts to her: prompt 1 = companion question in her chat + push to her phone; prompt 2 = "asking again" + full-screen ringing page with a looping sound (F2). Push now goes per side (child alarms never reach her phone; her questions never reach the child's).
- Answer card: Yes, done / Not today / I'm okay today / Snooze 30 min / her own words (typed or hold-to-talk). Her words stored exactly; read as done / not done / unclear by a new AI task (`classifyAnswer`, mock rules + Gemini, eval set of 12). Companion thanks her; snooze says when it will ask again.
- Snooze (F3) = a reply: no prompt 2 or alarm during it; at the snooze time prompt 1 again (or lapses if the app was not running).
- Emergency word in her answer: PAUSE panel (local help, the family's contact, no calls) + the child's distinct alarm (G5).
- Her app polls every 10 s: new messages appear (and can be read aloud), the ringing page opens; demo mode runs the tick there too. Parent notifications toggle in her Settings. Demo tools: "Ask Maa the next check-in now".
- Found and fixed while testing: two regular expressions written through the shell lost their backslashes (the answer reader and a name split); all source files scanned afterwards, none left.
- Tests: 195 unit (prompts in her chat, answers stored exactly and once, emergency stop, snooze timing and lapse, answer reader cases); e2e: words, snooze + buttons, ringing page, PAUSE + child alarm.
- Also in P3: PAUSE got its own page (`/p/pause`) after a full test run showed the answer card (and with it the PAUSE panel) could be removed by the page refresh that follows her answer; the read-aloud button moved into the answer card; the alarm sound no longer reports an error when its page closes before the sound starts (also on the child's alarm page). Tests now switch off every alarm they leave ringing and no longer assume no other check-in is open (that depends on the time of day the tests run).

---

## P-016 | 2026-11-10 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompt:
> OK (P3 approved) … continue. reset local host. give a md file that covers current features, features that can be planned and their phases. needed to work on the marketing and pricing plan which is also part of the assignment

Outcome:
- Slice **P4** built: "Ask for help" in the parent app (voice note and/or words → the child's Helper list, statuses back to her, emergency word → PAUSE + the child's distinct alarm, sent at once if heard during hold-to-talk); the child's voice reminders ring on her phone (her chat line + notification; `/p/reminder` plays the child's recording in a loop until OK / snooze; My Child picture). The child's Helper screen no longer shows empty quotes for a voice-only request, and opening it no longer marks the parent's own bubbles as read.
- `docs/PRODUCT_FEATURES.md` for D3/D4: built features (child app, parent app, guardrails, AI and how it is checked), build phases, planned P5/P6/hosting/Hindi, the Version 2 roadmap, what is never built, value proposition and proof points, words to use and avoid, pricing inputs (what is known vs hypothesis, running costs and cost drivers, packaging options with "never paywall the safety alarm"), go-to-market phases tied to features, open questions.
- Tests: 200 unit; 46 e2e on the production build. (Vitest fails to start from a shell whose working directory differs in letter case, c:\ vs C:\; it passes from the normal path.)

---

## P-017 | 2026-11-10 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompt:
> OK (P4 approved). Mid-turn questions: "how to check the parents link" (answered: Demo tools → Open Maa's app, or Settings → Maa's phone → Make a new link and open it in a private window); "how many more versions are needed to finish app" (answered: P5 then P6; hosting and Hindi are optional extras).

Outcome: slice **P5** built.
- Personalised last question of the day (A6, deterministic, no repeat within 7 days, about her own check-ins first) and, after she answers it, a "Share a photo with Gudiya" link through the family's chat app (no photos stored).
- Her review prompts (+2 weeks, then every 3 months) in her chat with "All is fine" / "Change my check-ins".
- Her Settings "Who can see what": pause / turn on each check-in (revoke / new consent), sharing per item, stop all (child told), companion, reminder gaps, delete her recordings and words.
- Tests: 207 unit; e2e P5 spec (pause + sharing reflected in the child's Settings, stop all, companion + gaps, review, last question + photo link). Full production suite 49 passed before the last test fix; the P5 spec then passed 8/8 over two repeats.
- Found while testing: one more regex lost its backslash through a shell edit (name split); fixed, all files scanned. A week's demo-clock jump correctly makes the daily sample reminder ring first; tests now clear it.

---

## P-018 | 2026-11-10 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompt:
> OK (P5 approved)

Outcome: slice **P6** (final step of the parent-app plan).
- `tests/e2e/zz-both-apps.spec.ts`: the whole product across two browsers: child setup → invite link opened on the parent's own "phone" → her setup (consent per item) → she answers a check-in in her own words → the next goes unanswered → the child's alarm (factual, no call) → a day later the digest quotes her words exactly → "Matched" → her help request reaches the child's Helper list → the child's voice reminder rings for her → "OK, thank you" → the child sees "Parent said OK".
- That test found two real misses in the rule-based day reader ("… at 8:30 and again at 8:30 at night" lost the evening tablet; "at night" at the end of a sentence moved "wake up at 6" to 18:00). Both fixed; the sentence was added to the AI evaluation set (36/36).
- README: intro now says both apps; new 15-minute demo script for both apps (side by side); Demo tools list updated. CLAUDE.md: status "both apps built", parent build order. AI_EVAL: the evening question (A6). PRODUCT_FEATURES: statuses.
- Checks: lint and typecheck clean; 207 unit tests; 51 e2e on the production build; 50 + 1 production-only on the dev server.

---

## P-019 | 2026-11-10 to 11-11 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompts (summary): put the app online. The user created the Supabase project (migrations via one pasted script, Confirm email off), the GitHub repo (pushed by the user) and the Vercel project (keys pasted from .env.local), then the every-minute scheduler (pg_cron) with a scheduler key; later asked for a new key after the old one showed in a screenshot ("new key"), and did the Vercel and Supabase steps.

Outcome:
- Live at https://parcare-six.vercel.app (Vercel Hobby + Supabase free): demo login, both apps, voice clips in private storage, scheduler calling /api/tick every minute (200).
- Found live and fixed: two scheduler runs at once both sent the second reminder (now compare-and-set + unique indexes, migration 0005).
- Found and fixed: a local production test run carried the Supabase address in the build and deleted the (fictional) demo family on the real project; demo data re-seeded, two test logins removed. Now the app reads the Supabase settings at run time and a test run refuses to start unless it is on the built-in sample data.
- Help given for Windows / Command Prompt / Cursor: where .env.local is, copying SQL with `type … | clip`, a BOM in a generated file (fixed), Vercel's "NEXT_PUBLIC_ cannot be Secret" message.
- Checks: 211 unit tests; 51 e2e on the production build (built with the keys present).

---

## P-020 | 2026-11-11 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompts: "give 2 minute demo video" ("if it is below 2.5 minutes...its fine"); "fix okay thankyou first"; questions on Hindi effort and launch needs; "add password reset option . Otp based password change with otp being sent to email".

Outcome:
- Demo video (~1 min 40 s, captions, both apps side by side, sample data) recorded with Playwright; kept out of git (`/demo-video/`).
- Found while recording: the parent's "OK, thank you" button on the voice-reminder screen was white on white. Fixed and pushed.
- Forgot password: "Forgot password?" on the login page → `/forgot` → email → a 6-digit code by email → code + new password (twice) → signed in. Never says whether an email has an account. Supabase mode: Supabase's recovery email with `{{ .Token }}` (README step 7), `verifyOtp` type recovery, then the new password; other devices are signed out. Memory mode: `src/auth/reset-code.ts` (hash only, 10 minutes, 5 tries, one new code per minute); demo mode shows the code on screen since no email is sent. The shared demo logins cannot be reset. After a password mistake the typed code is kept.
- Checks: lint and typecheck clean; 217 unit tests; 52 e2e passed (+1 production-only skipped).

---

## P-021 | 2026-11-11 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompt: "fix this mic issue" (tester screenshot, setup step 5: mic allowed, button red, "Mic on, listening", but nothing recorded or transcribed; they typed instead).

Outcome:
- Cause: hold-to-talk. On a phone the first press opens the browser's microphone question, the finger lifts to answer it, and the browser can be left half-started (red "listening", no words). Also: phones handle "continuous" recognition badly, words were only passed on at the very end, and nothing was said when nothing was heard.
- Fix (all four mic places: child setup, parent setup, answer card, help request): tap to talk, tap again to stop; "Starting the microphone… allow it" until the browser really listens; words appear as they are heard; phones listen phrase by phrase until the tap; switches off by itself after 60 s (G3); resets with a message if the browser never starts (8 s) or never finishes (3 s after stop); clear messages for nothing heard, blocked, no internet, not available in this app. The help request stops the mic the moment an emergency word is heard (G5).
- Tests: `tests/unit/mic.test.tsx` (fake speech engine, 10 tests). Checks: lint, typecheck, 227 unit, 52 e2e (+1 production-only skipped).

---

## P-022 | 2026-11-11 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompts: Supabase would not let the user edit the reset email (free plan: templates need custom SMTP), so the default email has a link, not a code. "remove the code version , keep it only option B for project version".

Outcome:
- Forgot password is now a link: `/forgot` → Supabase's standard reset email → `/auth/reset` (Supabase PKCE code, same browser) → `/reset-password` "Choose a new password" → signed in, other devices signed out. Only Supabase setting needed: Site URL and Redirect URLs (README step 7).
- The new-password page is open only for 15 minutes after a valid link (signed `parcare_recovery` cookie, separate key from the session); a normal sign-in cannot use it. Memory mode: one-time link (hash only, 1 hour, one per minute), shown on screen in demo mode. The code version (`reset-code.ts`) is removed.
- Checks: lint, typecheck, 226 unit, 52 e2e (+1 production-only skipped). The Supabase path (exchangeCodeForSession) is not covered by tests (they never touch the real project); check it live.

---

## P-023 | 2026-11-11 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompt: tester notes on country / city: a wrong city asks to pick from the list but no list shows; the parent step did not check; India + Delhi + Pacific/Easter time zone was accepted.

Outcome:
- City: the matches are now a visible list of buttons under the box (the browser datalist often shows nothing on phones); "No city with that name in <country>" when nothing matches; "City found" once picked (its time zone is filled in).
- Time zone: must be one used in the chosen country (server check, `timeZonesOfCountry` from the city time-zone list); the picker lists "Used in <country>" first, fills it in when the country has one zone (India), and flags a mismatch at once.
- Parent step: the parent's city is now required (it sets her time zone), with the same checks as the child's.
- Checks: lint, typecheck, 227 unit, 52 e2e (+1 production-only skipped).

---

## P-024 | 2026-11-11 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompt: tester issue 4: a SAVE AND RESUME LATER button, at least on "Call your parent now" and ideally everywhere (the parent may not be free, or the child wants to do a better job). "add a save untill parent signs in ..keep such a button and update app and share link".

Outcome:
- "Save and finish later" under Back / Next on every setup step. Form steps (about you, parent, the day list) save the page first (an incomplete page shows what is missing); the other steps keep everything saved so far. It opens `/setup/paused`: where you stopped, that logging in again carries on there, and (after step 7) that the parent's link keeps working for 7 days, so the parent can open it when free. "Continue setup now" / "Log out".
- Found by the new test: after logging in again, Next.js could show a wizard kept from the earlier visit (step 1). The wizard now restarts from the saved progress.
- Checks: lint, typecheck, 227 unit, 53 e2e (+1 production-only skipped).

---

## P-025 | 2026-11-11 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompt: tester screenshot: "This page couldn't load" (server error) 2-3 times in the parent app right after choosing the companion.

Outcome:
- Cause: the parent's setup saves a draft after each step, in `setup_drafts` with audience "parent" (migration 0004), but 0001 made `household_id` unique, so once the child had a draft her first save was refused by Postgres. The sample-data adapter had no such rule, so no test saw it.
- Fix: migration 0006 (one draft per household and side; also in `supabase/all-migrations.sql`), to be run once in the Supabase SQL editor. A failed draft save no longer breaks her setup (logged, setup carries on).
- Prevention: the memory adapter now enforces the same unique rules as the database (`UNIQUE_KEYS`), and a unit test checks they match the migrations.
- Checks: lint, typecheck, 229 unit, 53 e2e (+1 production-only skipped).

---

## P-026 | 2026-11-12 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompt: "Edits needed - A. In the parents section - in the chat section - read out loud should be optional; B. notification on or off both options should be there".

Outcome:
- A: reading aloud is optional and starts Off. Her chat has a "Read messages aloud" bar under the header with On / Off buttons; the speaker buttons on her companion's bubbles and the automatic reading of a new message appear only while it is On. The same choice is in her Settings (remembered on this phone). The read-aloud buttons on the SOS, PAUSE, setup and answer screens stay (they speak only when tapped).
- B: notifications (child's "Alarm notifications" and the parent's "Notifications") always show both On and Off, side by side, the chosen one filled (`OnOffChoice`). When the browser cannot do it, notifications are blocked, or the server has no push keys, "On" is greyed out and the reason is shown.
- Checks: lint, typecheck, 238 unit, 56 e2e (+1 production-only skipped).

---

## P-027 | 2026-11-12 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompt: "Admin functionality to be built - add into it the delete user functionality so that same person can test multiple times", then: "We will need admin login as well. Admin should be able to see logins, 3 levels of active bands (based on %chkin on alarms). Should be able to send push notifications on child app to all if all is OK (no marketing pitch just some gentle chkin - some fixed options and also free format message where they are reminded that they cannot send marketing messages just gentle chkin)."

Outcome:
- `/admin/login`: its own login from `ADMIN_EMAIL` + `ADMIN_PASSWORD` (environment only; signed cookie for 8 hours; 5 wrong tries in 15 minutes = wait). Child logins cannot open `/admin`.
- `/admin`: every login (joined, child setup, parent setup) with its family's activity band; "Delete user" (tick to confirm) removes voice clips, every family row, the profile and the login, so the same email can sign up again. The sample family (Demo login) is locked. The terms-agreement record stays (P-011).
- Activity bands (last 14 days, decided here): the share of check-ins the parent was asked and answered before the child's alarm. Active >= 80%, Partly active 50-79%, Low < 50%, Not started (nothing asked). Lapsed check-ins (scheduler off) do not count. Admin only, never shown to families; noted against G12 (not a score of the parent).
- "Send a gentle check-in": four fixed notes or the team's own words (max 160, tick "not marketing"; offers, prices, sales words, links, emails and health words are refused). To the child's app only: a chat bubble "A note from the ParCare team: ..." and a push; only to families where all is OK (setup done, no alarm ringing). Each sending is logged (`admin_broadcasts`).
- Migration 0007 (chat kind `note`, table `admin_broadcasts`, RLS on, no policies = server only), also in `all-migrations.sql`.
- Checks: lint, typecheck, 238 unit, 56 e2e (+1 production-only skipped).

---

## P-028 | 2026-11-12 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompt (tester screenshots of the parent app): "On this page and every other page where notifications are shown or confirmed parent and child should be able both chk y/n and also change the time in drop down" · "In the previous screen it asked me, then here again it's asking. It should be only in 1 place. Rest it should show and fat button at the bottom to EDIT. That way we are sure that only 1 set of notifications is stored and parent and child don't get confused" · "Optional. For male avatar voice should be male and for female it should be female" · "Just like when I send in wa I can see both the covering message and what I sent, same way here also I should be able to get the notification audio and if I want to delete I should be able to delete from here. Then if I delete here I should ask - do you want to delete for everyone and from everywhere or delete for me (like in wa)". Asked: may the child also tick and change times? User: "Parent only" (G1/G2 unchanged).

Outcome:
- Her setup: the separate "This is what I understood" and "Which check-ins do you agree to?" screens are now ONE list (7 steps, not 8): per item a time drop-down (every 15 minutes, plus its own time), "Yes, check in with me about this" (nothing pre-ticked, G1) and "Share it with <child>". The later steps (Thank you, Terms) only show the agreed list with a big "Edit my check-ins" button back to it. Drafts saved in the old 8-step layout resume at the right step.
- One set of check-ins: when she finishes, the child's described list (only a starting point for her follow-up questions) is removed, so the family sees only her list. Items she did not tick stay on her list as "Not checked" and can be turned on later in her Settings.
- Her Settings, "Who can see what": a time drop-down + "Change time" per check-in. Check-ins not yet asked move to the new time; the child's chat says "<pet name> changed the time of "<item>" to <time>." The child's app stays read-only (G2).
- Reading aloud uses a voice that matches the companion's picture: male for the ten male companions, female for Vidya (`voice` in `src/config/brand.ts`; voice chosen by name, Indian English first; if the phone has no matching voice the pitch is nudged).
- Her chat: a help request now shows what she sent (her words and her voice note, playable) as her own green bubble, above the companion's note. Every bubble has "Delete": "Delete for me" hides it in her chat only; for what she sent (help requests, check-in answers) also "Delete for everyone", which removes her words and voice clip from her chat, the child's chat and Helper list, and any evening summary that quoted them (G14/G15).
- Checks: lint, typecheck, build, 249 unit (11 new), e2e: the 3 parent-app files (9 tests, incl. new delete + time-change checks) pass. The two-app test needed a retry-typing step (typing before the page was interactive on the slow dev server was lost). Full e2e suite not re-run this time.

## P-029 | 2026-11-13 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompt (team testing, fix one by one): "1. Saaketh (parent for shabeen) - I didnt get notifications. Once I opened the app there were checkins by the agent" · "2. Shabeen (parent for dipika) I got the notification as a pop up on my screen - no alarm even tho I had said "YES" to alarm" · "3. When i clik on notification it took me to chat - I could read aloud the notification but there is no place to CONFIRM the notification ie. send the voice confirmation back. Ideally it should be in the chat itself as a button below each chat notification where I can record or type"

Causes and outcome:
- 1 (no notifications): her phone's notifications could only be turned on in her Settings, which nobody had opened, so they were off. Now her setup asks on the "If you do not answer" step ("Let me reach you" + On / Off), and her chat shows an amber "Notifications are off on this phone…" banner with "Turn on notifications" for as long as they are off or blocked (hidden when on, or when the browser / server cannot do push).
- 2 (pop-up, no alarm): the looping alarm sound plays on her app's ringing page; while the app is closed a web app can only show a notification (known limit, section 10). Now the second reminder's notification is marked as an alarm: much longer vibration, stays on screen until tapped, with the phone's own notification sound (the child's alarm notifications too). The setup step says honestly that the alarm sound plays when the app is open and that a closed app shows a notification with the phone's sound (G17).
- 3 (nowhere to answer): the answer card disappeared once the child had been told (status escalated / acknowledged), though the server still accepted an answer, so a late tap on the notification landed in a chat with no buttons. Now every check-in she can still answer (asked, not answered, due in the last 24 h, also after the child was told) has its answer buttons directly under its question in her chat ("Answer here": Yes, done / Not today / I'm okay today / Snooze while still allowed / her own words, typed or tap to talk). After the child was told it says "<child> has been told that you did not answer. Answer now so they know you are all right." The separate card at the bottom of the chat is gone (only used if the question bubble was hidden with "Delete for me").
- Voice answers are still transcribed (her words stored exactly), not kept as an audio clip, as in P3.
- Checks: lint, typecheck, build, 251 unit (2 new, `tests/unit/p029.test.ts`), e2e: parent-app, parent-checkins, parent-settings, parent-help-reminders and the two-app test (17 tests, the two-app test now also answers a check-in after the child's alarm) pass. Full e2e suite not re-run.

## P-030 | 2026-11-13 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
Prompt (team testing): "1. All notifications and responses should stay in the chat history till parent /child deletes. Delete process same as in WhatsApp." · "2. once messages are read then a thumbs up or down or a voice reply should be applicable". Item 1 conflicts with G15 (automatic delete after the keeping period, max 30 days, promised in the terms), so asked. User: keep the automatic delete (Recommended); child gets "Delete for me" only. Item 2 asked: user chose "Both apps, to the other" and "Yes, child's own voice".

Outcome:
- Chat history: nothing else removes bubbles; they stay until someone deletes them or the family's keeping period ends (unchanged, G15). Her chat already had delete (P-028).
- Child's chat: every bubble has "Delete" → "Delete for me" (hidden in the child's chat only; the parent's chat, digests, alerts, Helper list untouched). On the child's own voice reply also "Delete for everyone".
- Reactions and voice replies (new chat kind `reply`, migration 0008): under bubbles about the other person: in the child's chat the parent's evening summary, help request, finished setup, changed time and her voice replies; in her chat the child's voice reminders and the child's voice replies (her check-in questions keep their answer buttons). 👍 / 👎 shows "You reacted 👍" on the bubble and "Maa reacted 👍 to your voice reminder “…”" in the other chat; the same reaction again takes it back. "Voice reply" records the sender's own voice (same recorder, mic indicator, 60 s max) and sends it: the sender sees "Your voice reply to …", the other side a playable voice note (in her chat with the My Child picture; never spoken by the companion, G16) plus a notification. Her recorder says "Not for emergencies." (a voice reply has no words to check for emergency words).
- Replies go at the end of the keeping period with their clips, with "Delete all our data", and her voice replies with "Delete my recordings and words".
- Checks: lint, typecheck, build, 259 unit (8 new: `tests/unit/p030.test.ts` + 1 in p029), e2e: parent-help-reminders (incl. new child delete, reaction, voice reply steps), alarm, digest, settings, admin, parent-app, parent-checkins, parent-settings and the two-app test pass (31 tests). The last-question test first failed on the dev server (a tap right after the page loaded was lost; her chat page now hydrates later); it now taps until the answer is in. Full e2e suite not re-run.

## P-031 | 2026-11-15 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
- Prompt: team test screenshot of her setup's "If you do not answer" step (notifications On, Next greyed out): "this is one error found at parents app" / "sort it".
- Cause: every new family starts with the child told after 20 minutes, but her gap list was 5/10/15/30/60, so the drop-down showed another number while Next stayed disabled.
- Fix: 20 added to `GAP_CHOICES` (setup and her Settings); `nearestGap` snaps any saved value not on the list to the nearest choice.
- Checks: typecheck, lint, build, 261 unit (2 new: `tests/unit/p031.test.ts`), e2e parent-app + two-app test (4) pass.

## P-032 | 2026-11-15 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
- Prompt: "next worked but the voice button to record didnot start up ..check that". Asked: her setup's "Tell me about your day" mic, nothing at all happened on tap, Chrome (Android).
- Likely cause (no header blocks the mic; tests record fine): on Android Chrome the first speech-recognition start opens the permission question and ends without listening; the only feedback was a small line easy to miss. Reading aloud at the same moment can also stop a phone from listening.
- Fix in `PushToTalk` (setup, answers, help): ask for the microphone with getUserMedia first (once per page), release it, then listen; stop any reading aloud first; if the first session ends without starting, retry once; "Starting…" and errors now in a larger red box; blocked mic says where to allow it in Chrome.
- Checks: typecheck, lint, build, 264 unit (3 new in `tests/unit/mic.test.tsx`), full e2e 56 passed + 1 known flaky (settings review prompt; its file re-run: 5 passed).

## P-033 | 2026-11-15 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
- Prompt: iPhone screenshot of the "Parent app" page ("Open the link your child sent you") and "i dont see add to homescreen in chrome or safari in iphone". Explained Share → Add to Home Screen; offered a paste box because an iPhone home-screen app keeps its own sign-in and has no address bar. User: "yes".
- Outcome: `/parent` has "Paste the link here" + Open (`PasteLinkForm`, `openPastedLinkAction`, `tokenFromPasted` in `src/domain/invite.ts`): takes the token from the whole link (or the bare token) and goes to `/p/<token>`, which still does every check (one use, expiry, hash only). Anything else: "That does not look like a ParCare link."
- Checks: typecheck, lint, build, 266 unit (2 new: `tests/unit/p033.test.ts`), e2e parent-app (3, incl. pasting junk and a used link) pass.

## P-034 | 2026-11-16 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
- Prompt: screenshot of her setup's notifications step: "on parent app next not working here..notification is not staying on".
- Found: `push_subscriptions.endpoint` was unique in the whole database (0001), so a phone signed up as a child (or as a parent in another family) could not be saved for the second role: the save threw and nothing was stored. The toggle said "On for this browser" because it only looked at the phone's subscription, so the parent got no notifications (also fits P-029 "I didn't get notifications"). The chat banner meant in P-029 was never placed in her chat.
- Fix: migration 0009 (unique per endpoint + household + audience; memory adapter mirrors it). Save actions are per role, write nothing when already saved, never throw. The toggle re-saves the phone's subscription on every visit and shows "On" only when ParCare has it for this side; a failed turn-on shows a message instead of quietly going Off. The "Notifications are off" banner is now at the top of her chat. Setup's reminder step: Next always works (times snap to the list).
- Run `supabase/migrations/0009_push_per_role.sql` in the Supabase SQL Editor before testing live.
- Checks: typecheck, lint, build, 267 unit (1 new: `tests/unit/p034.test.ts`); full e2e 56 passed + the known flaky settings review-prompt test, whose file then passed 5/5.

## P-035 | 2026-11-16 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
- Prompt: "unable to use tester guide with open to all or view all option...so can you share html which is generic to anyone with link" (the claude.ai organisation does not allow public artifact links).
- Outcome: `public/testers.html`, a plain static tester guide (not app UI, so its English text is in the file, not `messages/en.json`; `noindex`), public at https://parcare-six.vercel.app/testers.html. Same content as the earlier guide: what ParCare is, child steps, parent steps for Android and iPhone (paste the link), one-use links, reload to update.

## P-036 | 2026-11-17 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
- Prompt: screenshots of the live sample family's alarm ("I checked in with Maa twice and did not hear back", "25 more alarms after this one"): "why is this happening". Explained: pg_cron runs the scheduler every minute for every family, including the shared sample one; nobody plays Maa, so every check-in escalated and the alarms piled up. Proposed two fixes; user: "yes do both".
- Outcome: (1) `tickAllHouseholds` skips the sample family (child profile with `DEMO_CHILD_EMAIL`); it runs only while someone has the demo open (demo-mode polls tick their own household; missed windows meanwhile become `lapsed`, no alarm burst). (2) Alarm page: "Switch off all N missed check-in alarms" when more than one is ringing (`switchOffAllMissedAction`); an emergency-word alarm still needs its own tap.
- Tests: `tests/unit/p036.test.ts` (sample skipped, real family still runs); e2e alarm "Switch off all"; e2e "Switch off" button names made exact; `switchOffAlarms` helper uses Switch off all.
- Checks: typecheck, lint, build, 269 unit (2 new); full e2e 57 passed + settings review-prompt test, which failed because the 'Done, we talked' tap was lost on the dev server (child chat page hydrates later since P-030); the test now taps until done, settings file 5/5.

## P-037 | 2026-11-17 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
- Prompt: "1. go ahead" (Next.js security upgrade, after pros and cons) and "2. the switch off was not working on iphone" (screenshot: home-screen app, "1 more alarm after this one").
- Upgrade: `next` and `eslint-config-next` 16.4.4 → 16.4.6 (moderate advisory: information disclosure with `'use cache'` via `unstable_cache()`, which ParCare does not use). `npm audit --omit=dev`: 0 vulnerabilities.
- iPhone alarm: checked on WebKit (Playwright iPhone 13, a temporary local test): Switch off worked, but the next alarm looks the same, so it seemed to do nothing. Now the button says "Switching off…" while it works (`SwitchOffButton`, useFormStatus), and after one is switched off the page says "Switched off. This is the next alarm." (`/alarm?next=1`). The alarm sound on iPhone never started without a tap and `resume()` never answered, so the "turn on the alarm sound" button never appeared; it now appears when the sound has not started within a second.
- Checks: typecheck, lint, build, 269 unit, full e2e 58 passed (all green), plus the alarm test on WebKit (iPhone 13) locally.

## P-038 | 2026-11-17 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
- Prompts: "once the app is closed from background, it asks to login again...the login should stay untill signed out. check this issue" and "once submitted for capstone project, what could be checked in app, run those tests also".
- Sign-in: the sign-in cookies were never lost (Supabase 400 days, parent 90 days). The home-screen icon opens the start screen and "I am the child" always showed the login form, so it looked like being signed out. Now the start screen sends a phone signed in only as a child to /home, only as a parent to /p (both: the choice stays, each button goes straight in), and /login sends a signed-in child to /home. The form and the choice appear only after the check (no flash). e2e `stay-signed-in.spec.ts`; the `demoLogin` helper accepts an already signed-in phone.
- Capstone checks run: secrets (repo + full git history: none; only `.env.example` tracked), guardrail wording (no WhatsApp name, no `tel:`, no "emergency" for missed check-ins), live site (HTTPS redirect, HSTS, `/api/tick` 401 without the secret, manifest), `npm audit` 0, AI evaluation 100% precision / recall (mock), Lighthouse on the live start screen (Accessibility / Best Practices / SEO 100).
- Fixed from the checks: security headers for every page (X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy camera=() geolocation=() microphone=(self)), `poweredByHeader: false`; new axe-core accessibility scan (`tests/e2e/a11y.spec.ts`, WCAG 2.1 A/AA, fails on serious/critical) found colour-contrast problems, fixed: grey `#667781` → `#54656f`, white-on-light-green buttons and badges → `#008069`, link blue `#027eb5` → `#01699a`, faded white header/alarm text → white, Done chips → `#005c4b`, ringing chip → `#b42318`, voice-note speed chip → `#54656f`, Helper done items no longer faded. Dev dependency `@axe-core/playwright` (free).
- Checks: typecheck, lint, build, 269 unit, full e2e 63 passed (incl. 3 accessibility scans and 2 stay-signed-in tests).
- Lighthouse after deploy (live, mobile): Accessibility / Best Practices / SEO 100 on / and /terms; Performance 62-68 here, but example.com also scored 68 with 5 s blocking on this laptop, so that number is the laptop; FCP ~1.2 s, LCP ~2.5 s, CLS 0. Security headers confirmed live.

## P-039 | 2026-11-17 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
- Prompt: "for the marketing plan strategy shared earlier change pricing to 399per month, make digest features for both paid and unpaid but mention something spl for paid people, share a decoy pricing plan aswell".
- Outcome (docs only, `docs/PRODUCT_FEATURES.md` section 5): new 5.4 "Chosen pricing": Free (short daily digest: done / not done / not answered; all safety features) · Digest Only decoy Rs 349/month (digest in her own words + pattern notes only) · ParCare Plus Rs 399/month or Rs 3,999/year (digest in her own words, weekly and monthly summaries, voice reminders in the child's voice, voice replies; keeping up to 30 days). Special for Plus: "Hear her day in her own words, and answer in yours." Safety never behind a paywall; Rs 399 shown as the price to test (G17); payments and plan limits not built. 5.1 price row and open questions 2-3 updated.
- PDF: `docs/ParCare_Pricing_Plan.pdf` (2 pages, A4) made from the same content.

## P-040 | 2026-11-18 | Claude Code (VS Code / Cursor extension) | model: claude-opus-5-5
- Prompt: "add checkin tab in settings and also during setup incase it is missed by voice recording or otherwise".
- Outcome (parent app; the child's setup already had "Add item", and the child's Settings stay read-only as decided in P-028): "+ Add a check-in" (`src/components/parent/AddCheckin.tsx`: what, kind, time every 15 min) on her setup's check-in list (added ticked Yes; she can untick) and in her Settings → "Who can see what" (stored at once as her own item with a consent and her sharing choice, G1/G2; planned by the scheduler; the child's chat says "<pet name> added a check-in: … at …"; 👍/👎 / voice reply as for her setup). Her day step has "Skip this. I will add my check-ins myself" for when speaking does not work; finishing with an empty list is allowed (nothing is checked). Rules: `cleanNewCheckin` (words 1–80, known kind, real time), `addMyCheckin` (service).
- Tests: `tests/unit/p040.test.ts` (4); e2e: parent setup adds "Thyroid tablet"; Settings adds "Call my sister" and the child's chat is told.
