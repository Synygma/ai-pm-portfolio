# ParCare parent app: plan (for approval)

Draft of 2026-11-06 (P-012). Sources: team handoff `docs/source/CLAUDE handoff md.md` sections 6.1,
7.1 (parent side A–F), 7.2, 7.5–7.7, 8, 9.2–9.4; the child app as built (C0–C8 + P-011).
Same rules as the child app: free only, fictional data only, English strings in `messages/en.json`,
build in slices and stop for the user's OK after each.

## Decisions already made (P-012)

| # | Question | Decision |
|---|---|---|
| 1 | Language | **English only for now** (Hindi later via `hi.json`, as for the child app). |
| 2 | Parent login | **Invite link, no password.** The child's one-time link signs the parent in on that phone for 90 days. If the phone changes, the child makes a new link in Settings. |
| 3 | Companion voice | **Yes: the browser's free built-in voice** reads companion messages aloud, with a mute button. The text bubble always shows too. |
| 4 | Demo | **Child and parent signed in at once in one browser** (two tabs/windows). Demo tools get "Open Maa's app". Sample data includes Kamla's set-up parent account. |

## Defaults I will use unless you say otherwise

| # | Topic | Default (source) |
|---|---|---|
| 5 | "Tell me about your day" | One broad question, with an optional morning / afternoon / evening fallback (handoff 14.2). |
| 6 | Setup length | Save-and-resume after every step; at about 12 minutes the companion says "we can finish this later" (handoff 7.4). |
| 7 | Parent vs child voice on the speaker call | **Push-to-talk**: only what the parent says while holding the mic is captured; the child helps over the phone call (handoff 9.3 fallback, G3). |
| 8 | SOS | Always visible. Shows "Please contact local help" and the family's emergency contact (name + number shown, **never dialled**, G6). |
| 9 | Snooze / "I'm okay today" (F3) | Snooze 30 min counts as a reply; the check-in comes back at the snooze time and the escalation starts again from prompt 1 only if that one goes unanswered. "I'm okay today" answers the current check-in in her words. |
| 10 | Last check-in question (N13, AI task A6) | Picked in code from a question bank, based on her recent check-ins, never the same as the last 7 days. "Share a photo with <child's pet name>" opens the share link (the chat app is never named). |
| 11 | Parent deletion (G15) | Parent Settings: "Delete my recordings and words" (her voice clips and transcripts). Whole-family deletion stays with the child. |

## How it works

### Access (decision 2, 4)
- `/p/[token]` redeems the one-time invite (hash checked, expiry, single use) and sets a signed
  **parent session cookie** (`parcare_parent`, 90 days), separate from the child's login, so both
  can be signed in in one browser.
- Parent data is read and written on the server through a **parent access layer** that always
  scopes to that parent's household (like the child's `requireChild`). In Supabase mode this uses
  the service role on the server only; the parent never gets a database login. (Reason: Supabase
  allows only one signed-in user per browser, which would break decision 4.)
- Child Settings: "Make a new link for <pet name>'s phone" (old links stop working).

### Parent screens (large text, ≥ 18px, big buttons)
- **Home = the companion chat** (WhatsApp-style, like the child's, but the parent can reply):
  companion bubbles are read aloud (decision 3). The current check-in shows as a card with
  **hold-to-talk**, "Yes, done", "Not today", "Snooze 30 min", "I'm okay today".
- Always-visible bar: **SOS** · **Ask for help** (helper) · **Settings**.
- **Ringing page** (full screen, looping sound, wake lock): prompt #2 of a check-in (alarm-like,
  F2) and the child's voice reminders, which repeat **until the parent says OK** or snoozes (N14).
- **Helper**: hold-to-talk request; on an emergency word the recording stops, the screen shows
  **PAUSE**, "Please contact local help now", and the child's distinct alarm rings (G5).
- **Settings "Who can see what"** (G2, F23): each check-in with Pause / Stop / Resume and "share
  in Gudiya's digest" on/off; companion (change any time, N1); alarm gaps A/B; terms; delete my
  recordings and words; language shows English (Hindi coming soon).

### Parent setup (handoff 7.1 A–F), with save-and-resume
A. **Choose your companion** (11; each says "I am an AI voice, not a person", G16).
B. **Your day**: one broad question, hold-to-talk or type → **recap** (AI task A2: her schedule
   with times) → **up to 3 follow-up questions** about meta-list items she did not mention (A3,
   G4) → tick / untick to remove wrong items (N4).
C. **Consent, item by item**: the companion reads the recap ("I will check in with you 5 times: …
   I do not want to micromanage you…"); each item gets its own Yes and its own "share in the
   digest" (G1, N5).
D. **Thank-you note** ("Your kids want to be a bigger part of your day even though they live away").
E. **Daily summary to <child's pet name>**: confirm (per-item sharing from C applies).
F. **Alarm gaps**: first reminder → second reminder after A min → <child> alerted after B min
   (choices 5 / 10 / 15 / 30 / 60), "decide this together with <child>".
Then **can / cannot + terms tick** by the parent (G10), recorded like the child's
(`terms_acceptances` role parent + the agreement record).

Her items become `meta_items` with `source = parent`; consents are created only here (G1). The
child's meta items that she did not confirm are never checked.

### Check-ins live (replaces the simulator's role; the simulator stays for demos)
- The engine's prompt 1 / prompt 2 now **reach the parent**: a bubble in her chat + web push to
  her phone; prompt 2 opens the ringing page. Escalation to the child is unchanged (C5).
- Her answer is stored in her own words (transcript, optional short voice clip with the family's
  keeping period); the outcome (done / not done / unclear) comes from the buttons, or from the AI
  reading her words (Mock rules + Gemini, fictional data only), checked into `docs/AI_EVAL.md`.
- Emergency words in any answer → PAUSE + child's alarm (G5), as in Helper.
- Review prompt at +2 weeks and every 3 months appears in **her** chat: "Did <child> speak to you?
  Do you want to change any check-in?" with a button to Settings (G9).

## Data changes (migration `0004_parent_app.sql`)
- `parent_profiles`: `setup_completed_at`, `last_seen_at`.
- `parent_sessions` (hash of the session secret, parent id, expiry) — sessions can be revoked
  when the child makes a new link.
- `chat_messages`: `audience` (`child` | `parent`); the parent gets her own companion chat.
- `checkins`: `snoozed_until`, status `snoozed`.
- `setup_drafts`: `audience` (`child` | `parent`) for the parent's save-and-resume.
- `push_subscriptions`: `audience`.
- `responses`: `source` (`button` | `voice` | `typed`).
- RLS: unchanged for children; parent access goes through the server only (see Access).

## Slices (stop for your OK after each)

| Slice | Content |
|---|---|
| **P1** | Parent access + shell: invite redemption → parent session; migration 0004; parent access layer; parent home (companion chat, read-aloud with mute, SOS / Help / Settings bar); SOS page; child Settings "new link"; Demo tools "Open Maa's app"; seeded Kamla session; e2e both apps in one browser. |
| **P2** | Parent setup A–F + terms: companion choice, "your day" (hold-to-talk / typed) → recap (A2) → max 3 follow-ups (A3) → edit → consent per item + sharing → thank-you → summary confirm → alarm gaps → terms; AI eval rows A2/A3; save-and-resume; child sees her consented list. |
| **P3** | Check-ins live: prompts in her chat + push, prompt 2 ringing page, answer by voice / buttons, snooze, "I'm okay today", outcome reading, emergency-word PAUSE, voice clip; digest shows her real words. |
| **P4** | Helper by voice (PAUSE on emergency words) and the child's voice reminders ringing on her phone until OK / snooze. |
| **P5** | Last check-in personalised question + photo-share prompt; her review prompts (+2 weeks, every 3 months); "Who can see what" settings (pause / stop / resume, sharing, companion, gaps, delete my recordings). |
| **P6** | Final: one Playwright flow across both apps (child setup → invite → parent setup → check-in answered by voice/typed → one missed → child alarm → digest → helper → reminder rings → OK), README demo script, AI_EVAL update, CLAUDE.md for the parent phase. |

## Known limits (will be stated in the app and README)
- A browser app cannot ring when fully closed (push + ringing page is the best a PWA can do).
- Browser voices (speech in and out) depend on the phone; typing and buttons always work.
- English only in this phase.
