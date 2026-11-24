@AGENTS.md

# CLAUDE.md: ParCare build spec (child app phase)

This is the **build** source of truth. It is trimmed from the team handoff
(`docs/source/CLAUDE handoff md.md`, sections 4–9 and 15) plus the decisions in prompt P-001
(`docs/PROMPTS_LOG.md`) and the approved plan (`docs/PLAN.md`). Marketing, deck and calendar
material stays in the handoff, not here.

**Status: both apps built** (child app C0–C8 + P-011; parent app P1–P6, plan in
`docs/PLAN-PARENT.md`, approved P-012). Where the sections below still say "parent app = next
phase", "placeholder" or "out of scope", the parent-app plan and the notes at the end of section 10
are what was built. Still English only. Not done yet: hosting (Vercel + Supabase), Hindi.

---

## 0. Rules for Claude Code in this repo

1. Work from this file. If a request conflicts with **section 2 (what the app is NOT)** or
   **section 6 (guardrails)**, stop and ask.
2. Build in the sub-slices of section 9. After **each** sub-slice: run `npm run build`,
   `npm test`, `npm run e2e` and start the app; tell the user what to click to check it;
   append the prompt to `docs/PROMPTS_LOG.md`; then **stop and wait for the user's OK**.
3. Never report "done" without running it.
4. Every user-facing string lives in `messages/en.json`. Never hard-code UI text. **Exception:** avatar
   names and style lines are fixed English brand text in `src/config/brand.ts`, never translated.
5. **Free only.** No paid services, libraries, APIs or templates. Do not call the Claude/Anthropic
   API from the app.
6. Windows-first: the user runs Command Prompt. npm scripts must be cross-platform
   (no bash-only syntax; `&&` is fine).
7. Never use real personal data (code, seed, commits, AI calls). Only fictional data goes to Gemini.
8. No secrets in the repo. Keys go in `.env.local` (git-ignored); `.env.example` lists them all.
9. Never use the WhatsApp name, logo or icons in the app. "WhatsApp-style" is for docs only.
10. When the spec is unclear, add it to section 10 (open questions) instead of guessing.
11. Next.js here is **16.4** with Cache Components on. Read `node_modules/next/dist/docs/` before
    using a Next API you are unsure of.

---

## 1. Product in one paragraph

**ParCare** connects an adult child with an ageing parent who lives apart (launched in India only;
capstone demo, not a market product). With the parent's consent, an AI companion avatar (a "friend
standing in for the child") checks in with the parent by voice at times the parent chose, and the
child gets a daily digest in the parent's own words plus factual alerts when check-ins go
unanswered. Core promise: *"Your kids want to be a bigger part of your day even though they live
away."* Connect, do not monitor.

---

## 2. What the app is NOT (v1 boundaries)

- **Not inside WhatsApp.** A WhatsApp-look-alike web app (PWA). Real WhatsApp integration = v2.
  The only WhatsApp touchpoint is a `wa.me` share link for the invite.
- **No phone calls from the app** (no VoIP, telephony, or `tel:` dialing). The offline world is
  left to the family.
- **No camera, no covert or ambient listening, no location tracking, no wearables, no photo-proof
  visit log, no voice sentiment.**
- **No marketplace or vendor integration.** Helper requests go to the child as a list.
- **Single child per parent.** One managed parent in v1 (a second parent may be stored, not managed).
- **Not a medical or emergency service.** The app says plainly what it can and cannot do.

---

## 3. Approved architecture

| Layer | Choice |
|---|---|
| Front end | Next.js 16 (App Router) + TypeScript + Tailwind 4, installable PWA (`app/manifest.ts` + hand-written `public/sw.js`), mobile-first phone-width column, centred phone frame on desktop |
| i18n | next-intl, English only, no locale prefix in URLs. `messages/en.json`; Hindi = add `hi.json` + `src/i18n/config.ts` |
| Data | Repository interfaces in `src/data/` with **two adapters**: Supabase (real) and in-memory (tests, and whenever Supabase keys are missing; dev snapshot in `.data/dev-db.json`). The deployed URL requires Supabase (serverless instances do not share memory) |
| DB/Auth/Storage | Supabase free plan: Postgres + row-level security (a child sees only their own household), email+password auth + one-tap "Demo login", private Storage bucket for short voice clips (signed URLs) |
| AI | Google Gemini free tier via `@google/genai`, model from `GEMINI_MODEL`, behind `AiProvider`; deterministic `MockProvider` in tests and when no key |
| Speech | `SpeechProvider` interface; English via browser Web Speech API; typed-text fallback always offered. Sarvam = later provider |
| Notifications | Web Push via `web-push` (VAPID from env) + in-app looping alarm page with Screen Wake Lock. Alarm sound generated with Web Audio (no audio asset); one tap needed to unlock sound (browser autoplay rule) |
| Scheduling | **All timing logic is pure functions** (`state + now → actions`) in `src/domain/`. One route `/api/tick` (protected by `CRON_SECRET`) runs them. Production: Supabase `pg_cron` + `pg_net` calls it every minute (Vercel Hobby cron is daily only). Dev: the Demo clock calls it |
| Hosting | Vercel Hobby; code on GitHub |
| Tests | Vitest (unit, `tests/unit`) + Playwright (e2e, `tests/e2e`, Pixel 7 viewport, Chromium). GitHub Actions: lint, typecheck, Vitest, build, Playwright on every push |
| Branding | `src/config/brand.ts`: app name "ParCare", colours, icon paths, avatar list (id, name, style line, image, selectable). Avatar names and style lines always stay in English, whatever the app language |

---

## 4. Look and feel (WhatsApp-style, Android)

- Green top bar `#008069`; chat list with the avatar chat pinned at top, unread count, last message preview.
- Chat background beige `#EFEAE2`; incoming bubbles white; outgoing `#D9FDD3`; bubble tails;
  timestamps inside bubbles; ticks (grey sent, blue read).
- Voice-note bubble: play button, waveform, duration, speed chip (1× / 1.5× / 2×).
- Input bar: rounded field, mic on the right, send replaces mic when text exists.
- Avatars shown in circles. Large touch targets (≥ 48px), readable sizes (≥ 16px body), good contrast.
- The ParCare icon replaces any WhatsApp branding. Icon on the entry screen and in the header.

### Brand assets
- Source images: `assets/source/APP_Icon.jpg`, `assets/source/avataar_sample_icons.png`.
- `npm run icons` (`scripts/make-icons.mjs`, sharp): favicon 32 + .ico, apple-touch 180, PWA 192/512,
  maskable 512 (icon centred with safe padding on soft light blue).
- `npm run avatars` (`scripts/crop-avatars.mjs`, sharp): crop only the portrait of each card
  (3 columns × 4 rows) → `public/avatars/<id>.webp`, 256×256. Verify visually.
- Outputs are committed, so the scripts only need re-running when a source image changes.
  Icons: `src/app/{favicon.ico,icon.png,apple-icon.png}` (auto-linked by Next.js) and
  `public/icons/{favicon-32,icon-192,icon-512,maskable-512}.png` (manifest `src/app/manifest.ts`).
- `src/components/wa/AvatarCircle.tsx`: round avatar with optional helper badge (gender-neutral figure carrying a cloth bag).

### Avatars (id — name — style line)
1. krishna — Krishna — spiritual and devotional
2. shiva — Shiva — calm, powerful, meditative
3. guruji — Guruji — wise, disciplined, guiding
4. trekker — Trekker — active, outdoorsy, adventurous
5. champ — Champ — sporty, energetic, fitness-minded
6. explorer — Explorer — curious, travel-loving
7. sangeet-saathi — Sangeet Saathi — musical, expressive, soulful
8. kalakaar — Kalakaar — artistic, creative
9. garden-mitra — Garden Mitra — nature-loving, nurturing
10. masterchef — MasterChef — food-loving, warm, enthusiastic cook
11. vidya — Vidya — intelligent, book-loving, inspiring
12. my-child — My Child — reminders from your child

**Avatar rules**
- **"My Child" is NOT an AI companion** and is never selectable. It is only the picture shown with
  the child's own recorded voice reminders (N14). The AI never speaks as the child (G16).
- The other 11 are selectable AI companions. Whichever the parent picks must say it is an AI at setup.
  Always phrase as "<Name>, your ParCare AI companion"; the AI never claims to be a deity or a real person.
- Helper look: the same chosen avatar with a small "helper" badge at the bottom-right of the circle: a
  gender-neutral figure (plain head and shoulders, no gender cues) carrying a cloth bag.
- The parent chooses the avatar (parent app, next phase). The child app shows it read-only
  ("Your parent chooses this") on the avatar chat and in Settings, plus the full gallery in Settings.

---

## 5. Child app: screens and flows

### 5.1 Entry and login
- Entry: ParCare icon + name, then "I am the child" / "I am the parent". Parent → friendly
  "Parent app coming in the next build" placeholder (also at `/p/[token]` for invite links).
- Login: email + password, plus "Demo login" (when `DEMO_MODE=true`).

### 5.2 Setup wizard (progress bar, save-and-resume after every step)
a. **Child details**: name, pet name your parents use for you, country, city, age, time zone (auto-detected via `Intl`, editable).
b. **Parent details**: one or both; name, pet name, gender, age, country, city; which one(s) to manage. v1 manages one: if both chosen, explain and ask which.
c. **How setup works**: short bullets.
d. **How to introduce the app**: bullet script presenting the companion as a friend standing in for you so you can be part of their day; must also say honestly that the companion is an **AI voice, not a person** (G16). Show the 11 selectable avatars so the child can tell the parent they will pick one.
e. **Describe your parent's day**: push-to-talk with visible mic-on indicator, or type. Transcript → AI → **meta list** of must-check items with approximate times and check-in type. Editable checklist (tick/untick, edit text/time, add item). Explain the parent will later give their own version and confirm or change it.
f. **Emergency contact (optional)**: name + phone. Ask "Have you told this person they are the first point of contact in an emergency?" Store **only on Yes**; on No, do not store and explain why (G7).
g. **Invite link**: one-time secure parent token (store hash only, expiry, single use) + `wa.me` share button with a pre-written message.
h. **Call your parent now**: call on the phone, put them on speaker, open the link.
i. **What this service can and cannot do** + T&C in short bullets + child's tick. Record acceptance with terms version and time. Note that the parent will also tick it in their app. **Setup cannot finish without the tick.**

### 5.3 Home (chat-list style), tabs: Chats · Digest · Helper · Reminders · Settings
- Avatar chat (parent's chosen companion, pinned): setup messages, daily digests, alerts, review prompts as bubbles.

### 5.4 Check-in types (v1)
woken up · medicine · help arrived · social activity · physical activity · puja/spiritual ·
appointments/tests · last check-in of the day.

### 5.5 Escalation (missed check-in), F2/F5/F7
```
check-in due → parent prompt #1
  → no reply within parent-chosen gap A → parent prompt #2 (alarm-like)
  → no reply within parent-chosen gap B → CHILD ALARM
```
- Child alarm: full-screen page, looping sound, keeps ringing until the child taps **Switch off**.
- Wording is factual: "I checked in with [pet name] twice and did not hear back."
  **Never the word "emergency" for missed check-ins.**
- Show the emergency contact only if confirmed. The app never places calls. Also send a web push.
- Alert history list with acknowledged time.

### 5.6 Emergency-word alarm (G5/N10)
If a parent recording or helper request contains an emergency word, the child gets a **distinct**
alarm: "[pet name] used an emergency word. The app asked them to contact local help."
English keyword list in `src/config/emergency-words.ts` (emergency, urgent, help me, ambulance,
I fell, can't breathe, chest pain, …) with exclusions (e.g. "fell asleep", "help arrived").
Deterministic match is primary; bare "help" is not a trigger.

### 5.7 Daily digest (F19–F22)
- Sent at the child's chosen local time (default 19:00 child time), covering the parent's 24 hours before it.
- Quotes the parent's own words (quotes must match stored responses exactly).
- Flags change from usual pattern ("usually walks at 6:30; no walk mentioned today"), computed in code; **never diagnoses** (blocked-word check).
- Shows only consented items. Buttons "Matched what my parent told me" / "Did not match", stored.

### 5.8 Helper list (7.7)
Parent's non-urgent requests with the helper-badge avatar: voice note, transcript, time, status New / Seen / Done.

### 5.9 Reminders for the parent (N14)
Child records a short voice note (MediaRecorder), sets date/time in the **parent's** time zone
(child's local time shown too) and repeat. Shown with the "My Child" image.
Status: Scheduled / Ringing / Parent said OK / Snoozed.

### 5.10 Settings
Parent's consented check-ins (**read-only**, "Your parent controls these"); parent's chosen companion
(read-only) + gallery; digest time; time zone; emergency contact; notifications on/off (web push);
language selector (English; "Hindi coming soon"); "What we can and cannot do" + T&C (always reachable).

### 5.11 Review prompts (7.5) and "all disabled" (N7)
- Child prompt at setup + 1 week ("Check with your parent that all is OK and ask if they want to change any check-in"), then every 3 months.
- Parent prompt at + 2 weeks: recorded in data only (parent app phase).
- If the parent has no active consents: "All check-ins are switched off. Please talk to [pet name]."

### 5.12 Demo tools (`/demo`, only when `DEMO_MODE=true`)
- Demo clock: simulated now; +5 min, +1 hour, +1 day, +1 week, +3 months, reset; each change runs the tick.
- Parent simulator: answer the next due check-in (typed); let one go unanswered; send a helper request
  (typed, option with an emergency word); switch off all check-ins; change the parent's companion;
  acknowledge ("OK") or snooze a child reminder.

---

## 6. Guardrails (requirements)

| # | Guardrail |
|---|---|
| G1 | Consent first: nothing is checked without the parent's recorded consent, item by item. |
| G2 | Parent controls sharing ("who can see what", pause/stop). In the child app consents are read-only. |
| G3 | No covert listening. Mic only while the user holds/taps record, with a visible indicator. |
| G4 | Max 3 follow-up prompts after the parent's free speech (parent app). |
| G5 | Emergency-word stop: pause, stop recording, tell parent to contact local help, alarm the child. |
| G6 | SOS shows local help; the app never places calls. |
| G7 | Emergency contact stored only after the child confirms the person knows. |
| G8 | No scraped emergency numbers; the family supplies them. |
| G9 | Revocable consent; review prompts at +1 week (child), +2 weeks (parent), then every 3 months; "all disabled" alert. |
| G10 | Plain "can and cannot do" + T&C, bulleted, ticked by child and parent, always reachable. Not an emergency or medical service. |
| G11 | Language option throughout (selector shows English; Hindi coming soon). |
| G12 | The parent is not a score: no compliance scores, streaks, or "proof she was fine". |
| G13 | No diagnosis: flag change from pattern; never label illness or mood. |
| G14 | Data minimisation (design as if India's DPDP Rules apply now): purpose limitation, consent records, deletion on request, no health data in logs. |
| G15 | Voice data: transcripts + short-lived audio (**30-day retention**, stated in T&C); deletable; never used for training. |
| G16 | Honesty about AI: the avatar is an AI voice, not a person; say so at setup. The AI never speaks as the child. |
| G17 | Do not overstate evidence in product copy. |

---

## 7. Data model (child phase; parent app plugs in later)

`profiles` · `households` (child_id, managed parent, parent_avatar_id, escalation gaps A/B, digest
local time, demo clock offset) · `parent_profiles` · `setup_drafts` · `meta_items` · `consents`
(granted_at, revoked_at, share_in_digest) · `checkins` (scheduled / prompted1 / prompted2 / answered /
escalated / acknowledged) · `responses` · `alerts` (missed_checkin / emergency_word / all_disabled /
review; ack_at) · `digests` · `digest_feedback` · `helper_requests` · `child_reminders` ·
`emergency_contacts` · `terms_acceptances` (who, version, at) · `review_prompts` (audience child/parent) ·
`push_subscriptions` · `parent_invites` (token hash, expiry, used_at) · `chat_messages`.
RLS: rows visible only where `household.child_id = auth.uid()`; service role for tick and seed.
Migration: `supabase/migrations/0001_init.sql`.

### Seed data (fictional only)
- Child: **Priya Sharma**, 41, London (Europe/London); mother's pet name for her "Gudiya".
  Login `demo.child@example.com` (password in README).
- Parent: **Kamla Sharma**, 72, Lucknow (Asia/Kolkata); Priya calls her "Maa". Companion: **Vidya**.
- Consents: woken up ~06:00; BP medicine 08:30 and 20:30; morning walk 06:30; evening puja 18:30;
  last check-in 21:00; one doctor appointment next week.
- Escalation: prompt 2 after 10 min; child alarm 20 min after that.
- One week of history: digests with quotes; one day with no walk (pattern flag); two helper requests
  (one Done); one past escalation (acknowledged); one child reminder (generated tone, labelled "sample").
- Emergency contact: neighbour "Mrs. Verma", confirmed as told.

---

## 8. Required tests

**Vitest:** escalation timing (prompt 1 → 2 → child alarm with parent gaps); alarm stays active
until acknowledged; consent revocation removes future check-ins; "all disabled" alert;
emergency-word detection (positives + false positives); emergency contact not stored without Yes;
T&C gating; review-prompt timing (+1 week, then every 3 months); digest shows only consented items;
time-zone conversion London↔IST; meta-list parsing with the Mock AI provider; "My Child" not selectable.
**Playwright:** demo login → setup wizard (typed fallback) → home → `/demo` missed check-in →
alarm → switch off → digest → "Matched".

---

## 9. Build order (stop after each)

C0 housekeeping & scaffold · C1 brand assets (icons, avatar crops, manifest, `/avatars-preview`) ·
C2 data layer (repos, memory adapter, seed, Supabase migration + RLS + adapter, auth + demo login) ·
C3 WhatsApp-style shell · C4 setup wizard + AI meta list (+ `docs/AI_EVAL.md`) ·
C5 check-in engine, `/api/tick`, demo clock, parent simulator, alarm, alerts, push ·
C6 daily digest · C7 helper list + reminders · C8 settings, review prompts, all-disabled,
can/cannot + T&C, final Playwright, README demo steps.

Parent app (`docs/PLAN-PARENT.md`): P1 access + shell · P2 parent setup A–F · P3 live check-ins ·
P4 help requests + child's reminders on her phone · P5 personal evening question, her review
prompts, "Who can see what" · P6 end-to-end test across both apps, README demo script, docs.

**Out of scope now:** parent app screens, Hindi/other languages, Sarvam, real WhatsApp integration,
calls of any kind, location, camera, covert listening, voice sentiment, siblings, payments.

---

## 10. Open questions / known limits

- A browser app cannot ring when fully closed; push + alarm page is the best a PWA can do (iOS stricter).
- Alarm sound needs one user tap per session to unlock audio (autoplay policy).
- Supabase free projects pause after ~1 week of inactivity; open the dashboard before a demo.
- Web Speech API sends audio to the browser vendor's servers and works best in Chrome; typed fallback always available.
- Next.js allows one dev server per folder: stop `npm run dev` before `npm run e2e` (Playwright starts its own, with `DEV_DB_FILE=off`).
- Supabase sign-up needs **Confirm email** switched off (demo accounts use made-up addresses); see README.
- The Supabase adapter is unit-tested for mapping and checked against the migration, but runs against a real project only once keys are added.
- Design choice (C3): the companion chat is read-only for the child ("Only <Name> writes here"); the spec gives the child nothing to send there. The input bar component is used in setup step e (C4) and reminders (C7).
- C8: the temporary pages `/avatars-preview` and `/ui-preview` are removed (gallery now at `/settings/companions`). `InputBar` stays (unit-tested) for the parent app's chat; the child app has nothing to type in a chat.
- Setup (C4): the child's day description becomes `meta_items` only. No consents are created, so nothing is checked until the parent consents in their app (G1). New households start with escalation gaps 10/20 min and digest 19:00 as placeholders; the parent chooses the gaps in the parent app.
- Setup (C4): the invite share button is labelled "Share the link" and opens a `wa.me` URL; the chat app is never named on screen. The invite token is shown once; only its SHA-256 hash is stored.
- Setup (C4): when Gemini is on, step e warns on screen that the text goes to Google's free AI service and must be made up.
- Engine (C5): extra check-in status `lapsed` (migration 0002). A check-in whose prompt-1 window passed while the scheduler was not running gets no prompts and no alarm, so "I checked in twice" is always true. Gaps are measured from the real prompt times.
- Engine (C5): parent prompts are recorded on the check-in (prompted1At / prompted2At) only; delivering them is the parent app's job (next phase).
- Demo (C5): with `DEMO_MODE=true`, the open app's alarm poll (`/api/alarm`, every 10 s) also runs the tick for that household, so a live demo escalates in real time without cron. Production uses pg_cron (`supabase/cron.example.sql`).
- Demo (C5): answering or snoozing the child's voice reminders in the parent simulator arrives with the Reminders screen (C7).
- Tests (C5): Playwright runs with one worker, because the tests share one server and the demo data. On the dev server a click during a page's first compile can be dropped, so tests open the demo page directly; a production-only test checks the real click.
- Digest (C6): sent by the tick when the child's digest time passes (so it also arrives in real time in a demo); covers the 24 h before that moment; a slot is sent once and changing the time never back-fills old days. Items = responses to check-ins whose consent is active and shared at the end of the period (G1/G2). Pattern notes: an item is a habit when answered "yes" on at least 3 of the previous 7 days; "not done" = the parent said no, "not mentioned" = due in the period with no answer. ParCare's own sentences pass the blocked-word check (`src/config/blocked-words.ts`); quotes are the parent's words, shown exactly.
- Settings (C6): the digest time setting is already in Settings (rest of 5.10 in C8).
- Helper (C7): opening the list marks New requests as Seen; the child marks Done (and can reopen). Requests that contained an emergency word are labelled. No booking or vendors.
- Reminders (C7): voice note (MediaRecorder, max 60 s / 1 MB, mic indicator while recording) and/or a short typed note; date and time are entered in the parent's time zone with the child's time shown. Status: Scheduled → Ringing (at the due time; the parent app plays it) → Parent said OK / Snoozed (10 min). Daily/weekly repeats move to the next occurrence at the same local time (DST-safe). Server-action body limit raised to 1.2 MB for the clip.
- Voice storage (C7): Supabase private bucket `voice` with 1-hour signed URLs; memory mode keeps files in `.data/voice` and serves them via `/api/voice/<household>/<file>` only to that household's signed-in child. Clips older than 30 days are deleted by the tick (G15); the words stay.
- Tests (C7): Playwright starts Chromium with its fake microphone (`--use-fake-device-for-media-stream`), so recording is tested end to end.
- Review prompts (C8): child at setup + 1 week, then every 13 weeks ("3 months", 91 days, so a demo-clock "+3 months" always reaches the next one); parent at + 2 weeks then every 13 weeks, recorded in data only. Shown by the tick as a `review` alert (chat bubble + notification, not an alarm) with "Done, we talked" (sets the prompt's `done_at` and the alert's `ack_at`). After a long clock jump only the latest due prompt is shown.
- Settings (C8): check-ins and companion are read-only (G2); before the parent consents, Settings lists the child's described items as "Waiting for <pet name> to agree". The emergency contact can be changed only with "Yes" to "Have you told this person…" (G7); "No" leaves the saved one as it was. Language selector shows English with Hindi disabled ("coming soon").
- Terms (C8): one public page `/terms` (can / cannot + T&C, version) linked from the entry screen, login and Settings (PLAN's separate `/can-cannot` merged into it). Settings shows which terms version the child accepted and when.
- Deletion (C8, G14/G15): Settings → "Delete all our data" (tick required) removes every voice clip, every household row and the profile, signs out; the login stays. In demo memory mode, Demo login restores the sample data if Priya's household is gone.
- Home (C8): an amber banner when nothing is checked: "All check-ins are switched off. Please talk to <pet name>." or, before any consent, "Nothing is checked yet."
- P-011 (after C8), decided by the user:
  - Terms before first use: after the first sign-in or sign-up, `/agree` shows can/cannot + terms with an "I understand" tick; every signed-in page (`requireChild`) sends users there until they agree to the current `TERMS_VERSION` (now `2026-11-v2`). The record (`terms_agreements`: user, version, time, salted SHA-256 fingerprint of the IP, never the IP itself; salt `IP_HASH_SALT`) is kept even after "Delete all our data" (no foreign key, no delete policy); the terms say so. Exception to G14 approved by the user.
  - Keeping period (`households.retention_days` 8 / 15 / 30, default 30): the tick deletes the parent's words (responses, helper requests), voice clips and digests older than that. Never longer than a month (G15).
  - Weekly / monthly summaries (`/digest/week`, `/digest/month`): per shared check-in, in words with dates ("Did not happen on Tue 3 Nov"), plus up to 5 of the parent's quotes; no totals or percentages (G12), blocked-word checked (G13).
  - Digest feedback has a third choice "Skip, I have not checked".
  - Helper: once Done, no buttons remain (no reopen in the UI).
  - Places: country from a list, city from the world list (GeoNames 1,000+ people), checked on the server; picking a city sets the time zone. Time zone is a list (`TimeZoneSelect`), not free text.
  - The "start a new setup" demo account is a new login each time in memory mode too (so it always starts with the agreement).
- Parent app P1: `/p/[token]` only checks the invite; "Open my ParCare" (a form) uses it up, signs older phones out and sets the parent cookie `parcare_parent` (90 days; table `parent_sessions` keeps a hash of the secret). Parent pages live under `/p` (`src/app/p/(parent)`) and read data only through `src/data/parent-access.ts` (server-side, scoped to her household; she has no database login). Each side has its own chat (`chat_messages.audience`); the child's chat filters out the parent's. Demo: `/api/demo/open-parent` opens Maa's app in the same browser. Child Settings can make a new link for the parent's phone. Migration 0004.
- Parent app P2: her setup at `/p/setup` (home sends her there until `parent_profiles.setup_completed_at`): companion (11, AI voice) → her day (hold-to-talk / typed / three-part fallback) → what the companion understood (A2, same AI provider as the child's meta list) → up to 3 follow-ups about the child's items she did not mention (A3, deterministic: same check-in kind within 90 min) → tick / untick → consent per item, nothing pre-ticked (G1), "share with <child>" per item (G2) → thank-you + daily summary on/off → reminder gaps 5/10/15/20/30/60 → terms tick. Her items are stored as `meta_items` source parent with consents; the child's described items stay unconsented. Draft saved after every step (`setup_drafts.audience = parent`); soft 12-minute "we can finish this later" note. Child's chat gets "<pet name> finished their setup and agreed to N check-ins".
- Parent app P3: the tick now delivers prompts to the parent: prompt 1 = a question in her chat + push to her phone; prompt 2 = "asking again" + her app's ringing page (`/p/ringing`, looping sound). Push is per side (`push_subscriptions.audience`): child alarms never go to her phone. She answers on the answer card: "Yes, done" / "Not today" / "I'm okay today" (stored as that short sentence), her own words typed or held-to-talk (stored exactly; done / not done / unclear read by `classifyAnswer`: rule-based mock, Gemini when a key is set), or "Snooze 30 min" (status `snoozed`; counts as a reply; at the snooze time prompt 1 again and the chain restarts, or `lapsed` if the app was not running). An emergency word in her answer: the child's distinct alarm + PAUSE in her app (G5). She may still answer after the child was alerted (the alarm stays until switched off). `/api/parent/poll` (every 10 s while her app is open) refreshes her chat, opens the ringing page, and in demo mode runs the tick. Demo tools: "Ask Maa the next check-in now". Voice clips for check-in answers are not recorded (her words are transcribed by the browser); clips come with helper requests in P4.
- Parent app P4: "Ask for help" (`/p/help`): her words and/or a short voice note (the same recorder as the child's reminders) go to the child's Helper list (`createParentHelpRequest`; voice clip in the voice store; both chats told; push to the child). An emergency word in her words raises the child's distinct alarm and opens PAUSE; with hold-to-talk the request is sent the moment an emergency word is heard (recording stops). She sees her requests with Sent / "<child> has seen it" / Done. The child's voice reminders: when one starts ringing her chat says so and her phone is notified; her app opens `/p/reminder` (My Child picture, the child's recording in a loop, generated tone for the sample) until "OK, thank you" or "Snooze 10 min". The voice-clip route also serves the household's parent. `docs/PRODUCT_FEATURES.md` lists built / planned / v2 features and the inputs for the marketing and pricing plan.
- Parent app P5: the last check-in of the day asks a personalised question (`src/domain/last-question.ts`: questions about her own consented check-ins first, then general ones, never one from the last 7 days; stored with the chat message so prompt 2 and her answer card show the same one); after she answers it, the companion suggests sharing a photo with the child through the family's own chat app (a share link; ParCare stores no photos). Her review prompts (+2 weeks, then every 3 months) now appear in her chat with "All is fine" / "Change my check-ins". Her Settings: "Who can see what" (per check-in Pause / Turn on again = revoke / new consent, keeping her sharing choice; "Let <child> see it" / "Keep it to myself"; "Stop all check-ins", which tells the child), companion, reminder gaps, "Delete my recordings and words" (her answers, the digests made of them, all her voice clips; help requests stay as text). Adding a brand-new check-in after setup: added in P-040.
- Parent app P6: `tests/e2e/zz-both-apps.spec.ts` runs the whole product across two browsers (child setup → invite link opened on "her phone" → her setup → answer in her own words → a missed check-in and the child's alarm → the digest quoting her → help request → the child's reminder ringing for her → OK). It found two real misses in the rule-based day reader ("… and again at 8:30 at night" lost the evening dose; a day-part at the end of a sentence moved earlier times); both fixed and added to the AI evaluation set. README demo script covers both apps.
- Hosting (P-019): live at https://parcare-six.vercel.app (Vercel Hobby + Supabase free). Found live: two scheduler runs at the same moment (pg_cron + the open apps' demo polls) both sent prompt 2. Fix: every scheduler step is compare-and-set (`Table.updateIf`), creation of check-ins / digests / review prompts is `insertUnique`, backed by unique indexes (migration 0005); the parent's answer claims the check-in first (a double tap stores one answer). Tests: Playwright blanks the Supabase and Gemini keys for its server; the app reads the Supabase settings at run time (`src/config/env.ts`, computed names, so nothing is written into the build) and `tests/e2e/global-setup.ts` stops a run that is not on the built-in sample data. (A test run once reached the real project through a build with the address in it and deleted the demo family; it was re-seeded.)
- Forgot password (P-020, changed to a link at the user's request): `/forgot` → Supabase's standard reset email (no custom SMTP needed; site listed under Redirect URLs, README step 7) → `/auth/reset` (PKCE code, same browser) → `/reset-password` (open only for 15 min after a valid link, via a signed `parcare_recovery` cookie) → signed in, other devices signed out. Memory mode: one-time link (hash only, 1 hour, 1 per minute), shown on screen in demo mode. Same answer whether or not an account exists; demo logins cannot be reset.
- Mic (P-021): tap to talk / tap to stop everywhere (not hold-to-talk: on phones the permission question makes a held button useless). Auto-off after 60 s, stuck-browser resets, words passed on as heard, phrase-by-phrase on phones. G3 still holds: on only after a tap, visible indicator.
- Setup (P-024): "Save and finish later" on every step → `/setup/paused`; form steps save first; login resumes at the saved step (wizard keyed by progress so a kept client state never shows an older step).
- Drafts (P-025): migration 0006 makes `setup_drafts` unique per (household, audience); the memory adapter mirrors every database unique rule (`UNIQUE_KEYS` in `src/data/memory.ts`, checked against the migrations by a unit test).
- Read aloud and notifications (P-026): reading aloud in her app is optional and starts Off (On / Off bar at the top of her chat and in her Settings; bubble speaker buttons and auto-reading only while On). Notifications in both apps show On and Off side by side (`src/components/ui/OnOffChoice.tsx`); "On" is greyed out when push is not possible.
- Admin (P-027): `/admin` with its own login (`ADMIN_EMAIL`, `ADMIN_PASSWORD`; `src/auth/admin.ts`), not a child account. Logins list with activity bands (`src/domain/admin.ts`: last 14 days, answered before the child's alarm / asked; Active >= 80, Partly 50-79, Low < 50, Not started), admin only and never shown to families (G12 note: a service-health view, not a score of the parent). "Delete user" removes the family, voice clips and the login (sample family locked). Gentle check-in notes (4 fixed + own words, `checkGentleNote` refuses marketing / links / health words) go to the child's chat (kind `note`) + push, only where all is OK; logged in `admin_broadcasts` (migration 0007).
- One list + voices + chat delete (P-028): her setup has ONE check-in list (time drop-down every 15 min, "Yes, check in with me", "Share it with <child>"; 7 steps, `stepFromOldLayout` resumes old drafts); later steps only show it with a big "Edit my check-ins" button. On finishing, the child's unconsented described items are removed (one set). Her Settings lists every item on her list ("Not checked" ones can be turned on) and changes times (`setCheckinTime`: not-yet-asked check-ins re-planned; the child's chat is told). Child app stays read-only (user chose "Parent only"). Reading aloud picks a male / female voice to match the companion (`voice` in brand.ts, `src/domain/voice-pick.ts`). Her chat shows her help request (words + playable voice note) as her own bubble; "Delete for me" hides a bubble in her chat (`data.hidden`); "Delete for everyone" (only her help requests and answers) removes the words, clip, both chats' bubbles, the Helper item and digest quotes (`src/services/parent-messages.ts`).
- Team test fixes (P-029): her setup's "If you do not answer" step asks for notifications, and her chat shows a "Notifications are off" banner until they are on. The second reminder's push is marked `alarm` (long vibration; a closed web app cannot loop a sound). Every check-in she can still answer (asked, unanswered, due in the last 24 h, including after the child was told) has its answer buttons right under its question in her chat (`answerableCheckins`, `loadAnswerable`); the newest has testid `answer-card`, older ones `answer-card-earlier`.
- Replies (P-030): chat kind `reply` (migration 0008). 👍 / 👎 and voice replies between parent and child under bubbles about the other person (`replyAbout` in `src/domain/replies.ts`; service `src/services/replies.ts`; `ReplyBar`). The child's chat has "Delete for me" on every bubble (+ "Delete for everyone" on the child's own voice reply). Chat history still ends at the keeping period (user kept G15).
- Push per role (P-034): `push_subscriptions` is unique per (endpoint, household, audience) (migration 0009), so one phone can be a child in one family and a parent in another. The toggle re-saves the phone's subscription on each visit and shows On only when saved for that side; her chat has the "Notifications are off" banner.
- Sample family + alarms (P-036): the every-minute scheduler (`tickAllHouseholds`) skips the shared sample family; it runs only while someone has the demo open. The alarm page offers "Switch off all N missed check-in alarms" when several ring; emergency-word alarms are switched off one by one.
- Alarm on iPhone + Next.js 16.4.6 (P-037): Switch off shows "Switching off…" and, when another alarm is still ringing, "Switched off. This is the next alarm." (`/alarm?next=1`); the "turn on the alarm sound" button appears when sound has not started within a second (iPhone). Next.js and eslint-config-next 16.4.6 (security patch).
- Stay signed in + capstone checks (P-038): the start screen and /login send a signed-in user straight in (the icon opens the start screen). Security headers on every page and no X-Powered-By (next.config.ts). Accessibility scan `tests/e2e/a11y.spec.ts` (axe-core, WCAG 2.1 AA, serious/critical fail); colours adjusted to pass. How to re-run every check: `docs/CAPSTONE_CHECKS.md`.
- Add a check-in (P-040): her setup list and her Settings have "+ Add a check-in" (what / kind / time); in Settings adding it is her consent (with her sharing choice) and the child's chat is told. Her day step can be skipped ("I will add my check-ins myself"); an empty list may be finished. Child app unchanged (setup already has "Add item"; Settings read-only).
