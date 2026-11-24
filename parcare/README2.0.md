# ParCare: Parent Care Application

> **Connect, don't monitor.** "Your kids want to be a bigger part of your day even though they live away."

ParCare is a pair of phone web apps, one for an adult child and one for their ageing parent. It helps the child stay part of the parent's day, **with the parent's consent**. Capstone project, Product Management with AI, Group 6. It is a demo for India, not a product on the market.

- **Live demo:** https://parcare-six.vercel.app (one-tap **Demo login** on the login page)
- **Code:** GitHub `ftgroup6/ParCare`
- **All names and data in the app are fictional.**

---

## Contents

1. [Problem statement](#1-problem-statement)
2. [Project objective](#2-project-objective)
3. [Target users](#3-target-users)
4. [Features](#4-features)
5. [User workflow](#5-user-workflow)
6. [Technology stack](#6-technology-stack)
7. [AI implementation](#7-ai-implementation)
8. [Installation instructions](#8-installation-instructions)
9. [Screenshots](#9-screenshots)
10. [Limits and safeguards](#10-limits-and-safeguards)

---

## 1. Problem statement

Many Indian families now live apart. A son or daughter works in another city or abroad, and an ageing parent lives alone or with a spouse. The child worries every day:
- Did Maa wake up well?
- Did she take her BP tablet?
- Did she go for her walk?

The tools they have today don't fit:

| What families use today | Why it falls short |
|---|---|
| Phone calls | Hard across time zones; parents say "all is fine" to avoid worrying the child |
| Family chat groups | Unstructured; important things get lost; the parent has to type |
| CCTV, location trackers, wearables | Feel like surveillance; take away the parent's dignity and control |
| Medical alert services | Built for emergencies, not for being part of everyday life |

The gap is a respectful, low-effort way for the child to **stay part of the parent's day**, where the parent decides what is shared and nothing happens without their consent.

## 2. Project objective

ParCare aims to:

1. **Keep the child connected** to the parent's day in the parent's own words, through a daily digest. It doesn't track or score the parent.
2. **Let the parent decide.** The parent chooses each check-in and its time, and whether the child sees each answer. They can pause or stop any check-in at any time.
3. **Raise a clear, factual alert** when check-ins go unanswered, so the family can act. The app itself never calls anyone.
4. **Make it easy for an older person.** It looks like a familiar chat app, uses big buttons and plain words, has voice input and read-aloud, and needs no password for the parent.
5. **Be honest and safe.** The companion always says it is an AI voice. The app is not a medical or emergency service, and it collects only the data it needs.

## 3. Target users

| User | Who they are | What they need |
|---|---|---|
| **The child** (primary buyer) | Adult son or daughter, 25–50, living in another city or country (for example Priya, 41, London) | Peace of mind; to hear about the parent's day; to know quickly if something seems wrong |
| **The parent** (primary user) | Elderly parent, 60+, living apart, often not very confident with technology (for example Kamla "Maa", 72, Lucknow) | Company and gentle reminders, without feeling watched; control over what is shared |
| **The family's emergency contact** | A neighbour or relative the child names, such as "Mrs. Verma, neighbour" | Saved only if the child confirms this person has agreed |

## 4. Features

### Child app

| Feature | What it does |
|---|---|
| **Setup wizard (9 steps)** | Details of the child and parent, how to introduce the app, describe the parent's day (voice or typing), emergency contact, one-time invite link, terms. Progress is saved after every step. |
| **AI check-in list** | The child's description of the parent's day becomes a list of check-ins with times (for example "BP medicine 08:30"). Nothing is checked until the parent agrees. |
| **Check-ins** | Woken up, medicine, help arrived, social activity, physical activity, puja / spiritual, appointments, last check-in of the day |
| **Missed check-in alarm** | The parent is asked twice. If there's no reply, the child's phone shows a full-screen alarm that rings until switched off: *"I checked in with Maa twice and did not hear back."* It never uses the word "emergency" for this. |
| **Emergency-word alarm (emergency assistance)** | If the parent says or types an emergency word ("I fell", "chest pain", "ambulance" …), she is told to contact local help, and the child gets a separate, distinct alarm with the emergency contact. **The app never places calls.** |
| **Daily digest** | Every evening: the parent's own words, quoted exactly, plus factual notes when something differs from her usual day ("usually walks at 6:30; no walk mentioned today"). It never diagnoses. Weekly and monthly summaries are written in words, with dates. |
| **Helper list (caregiver coordination)** | The parent's non-urgent requests (voice note or words) go to the child's Helper list with the status New → Seen → Done. The child arranges the help through their own contacts. |
| **Voice reminders** | The child records a reminder in their own voice and sets it in the parent's time zone. It rings on the parent's phone until she taps OK. |
| **Settings** | The parent's check-ins (read-only: "Your parent controls these"), the companion gallery, digest time, how long data is kept (8 / 15 / 30 days), notifications, "Delete all our data", and terms. |

### Parent app

| Feature | What it does |
|---|---|
| **No-password login** | She opens the one-time link the child sends and taps "Open my ParCare". |
| **AI companion** | She chooses one of 11 companions (spiritual, musical, sporty, food-loving, bookish …). Each one says it is **an AI voice, not a person**. |
| **Her own setup** | She tells the companion about her day. It asks up to 3 questions about things the child mentioned, then she ticks yes or no for **each check-in**, picks the time, and chooses whether to share it. She can add any check-in by hand. |
| **Answering check-ins** | She taps **Yes, done / Not today / I'm okay today / Snooze**, or answers in her own words, by voice or typing. |
| **Ask for help** | A voice note or words go to the child's Helper list. She can see when the child has seen it. |
| **SOS** | Shows "contact local help now" and the family's emergency contact. The app never calls. |
| **"Who can see what"** | She can pause, resume, retime or **add** check-ins, keep any answer to herself, stop all check-ins, change her companion, and delete her recordings and words. |
| **Read aloud and big text** | Optional read-aloud in a voice that matches the companion. Large buttons and text throughout. |

### Both apps
Installable as a phone app (PWA), notifications (Web Push), review prompts (after 1–2 weeks, then every 3 months), and a plain "What ParCare can and cannot do" page readable before signing in.

## 5. User workflow

```
CHILD (Priya, London)                          PARENT (Maa, Lucknow)
─────────────────────                          ─────────────────────
1. Opens ParCare → "I am the child"
   → signs up / logs in (email + password)
2. Agrees to "can and cannot do"
3. Setup wizard: details → describes Maa's day
   → AI makes a check-in list → invite link
4. Sends the one-time link and calls Maa  ──►  5. Opens the link → "Open my ParCare"
                                                  (no password; stays signed in)
                                               6. Chooses her AI companion
                                               7. Tells it about her day; says YES or NO
                                                  to each check-in; picks times and
                                                  what Priya may see; agrees to terms
8. Told: "Maa agreed to N check-ins"   ◄──────
                       ── DAILY USE ──
                                               9. At each time she chose, the companion
                                                  asks; she taps an answer or speaks
                                               10. No reply → asked again (full screen)
11. Still no reply → Priya's alarm rings  ◄──
    (factual; shows emergency contact; no call)
12. Evening: daily digest in Maa's own words  ◄─ (only the check-ins she shares)
                                               13. Needs something → "Ask for help"
14. Helper list: New → Seen → Done        ◄────
15. Records a voice reminder  ─────────────►  16. It rings with Priya's voice → "OK"
                       ── OVER TIME ──
Review prompts (+1 week child, +2 weeks parent, then every 3 months).
Maa can pause, add or stop check-ins at any time; Priya is told.
```

## 6. Technology stack

| Layer | Technology |
|---|---|
| **Languages** | TypeScript, SQL (PostgreSQL), CSS (Tailwind) |
| **Front end** | Next.js 16.4 (App Router, React 19), Tailwind CSS 4, installable PWA (web app manifest and service worker), next-intl (all on-screen text in `messages/en.json`, ready for Hindi) |
| **Back end** | Next.js server actions and API routes; the check-in engine is pure functions (`state + time → actions`) run by `/api/tick` |
| **Database, login and storage** | Supabase (free plan): PostgreSQL with row-level security (a child sees only their own family), email and password login, a private bucket for short voice clips (30-day limit). Built-in in-memory database for local use and tests. |
| **AI** | Google Gemini (free tier, `@google/genai`) reads a described day into a check-in list and reads the parent's free-text answers as done / not done. A rule-based mock is used in tests and when no key is set. |
| **Speech** | Browser Web Speech API (speech to text, read aloud), MediaRecorder (voice notes); typing always works |
| **Notifications** | Web Push (`web-push`, VAPID) plus a full-screen alarm page with a generated sound (Web Audio) and the Screen Wake Lock |
| **Scheduling** | Supabase `pg_cron` calls `/api/tick` every minute |
| **Hosting and CI** | Vercel (Hobby plan), GitHub, GitHub Actions (lint, typecheck, unit tests, build, end-to-end tests on every push) |
| **Testing** | Vitest (273 unit tests), Playwright (65 end-to-end tests on a phone-size screen, both apps), axe-core accessibility scan (WCAG 2.1 AA) |
| **Tools** | sharp (icons and avatars), ESLint |

Everything is free; there are no paid services or libraries.

## 7. AI implementation

### 7.1 How Claude Code was used during development

The whole application was built with **Claude Code** (Anthropic's AI coding assistant, inside VS Code / Cursor). The team acted as product managers, and Claude Code acted as the engineer:

1. **A written spec first.** The team's product handoff was condensed into [CLAUDE.md](CLAUDE.md). It records what the app is and is **not**, 17 guardrails (G1–G17, for example "consent first", "no diagnosis", "the AI never speaks as the child"), the data model and the build order. Claude Code reads it at the start of every session and must stop and ask if a request conflicts with a guardrail.
2. **Small slices, a human OK after each.** The work was split into slices: child app C0–C8 and parent app P1–P6. Plans were written and approved first ([docs/PLAN.md](docs/PLAN.md), [docs/PLAN-PARENT.md](docs/PLAN-PARENT.md)). After each slice Claude Code ran the build, the unit tests and the end-to-end tests, said what to click to check it, and waited for the team's approval.
3. **Every prompt logged.** All 41 prompts so far (P-001 to P-040) are recorded in [docs/PROMPTS_LOG.md](docs/PROMPTS_LOG.md), with the decision taken and the test results.
4. **Testing as part of every change.** Claude Code wrote the unit tests and end-to-end tests with the code. Real bugs found this way were fixed; for example, the day reader lost "again at 8:30 at night", and two scheduler runs at the same moment both sent a reminder.
5. **Feedback from team testing.** Teammates tested on their own phones (Android and iPhone). Their screenshots went back to Claude Code, which found the root cause and fixed it, for example the microphone permission on Android Chrome and the alarm switch-off on iPhone.
6. **Quality checks for submission.** Claude Code ran and documented security headers, a package vulnerability audit (0 found), a secrets scan, an accessibility scan and Lighthouse ([docs/CAPSTONE_CHECKS.md](docs/CAPSTONE_CHECKS.md)).
7. **Product documents.** Claude Code also drafted the feature list, roadmap and pricing inputs ([docs/PRODUCT_FEATURES.md](docs/PRODUCT_FEATURES.md)) from the team's decisions, along with the demo video and this README.

Rules Claude Code followed throughout: free tools only, no real personal data (only fictional data goes to the AI), no secrets in the code, and no WhatsApp name or logo in the app.

### 7.2 AI inside the app

| Where | What the AI does | Safeguards |
|---|---|---|
| Child's setup step "Describe your parent's day" | Turns free text into a list of check-ins with type and approximate time | Shown as an editable list; nothing is checked until the parent agrees (G1); a warning that text goes to Google's free AI service |
| Parent's setup | Same reader for her own description, plus up to 3 follow-up questions (rule-based) | At most 3 questions (G4); she ticks each item herself |
| Parent's free-text answers | Reads "done / not done / unclear" | Her words are stored and shown exactly as she said them |
| Companion voice | A fixed, honest script (not generated) | Always "an AI voice, not a person"; never speaks as the child (G16) |

**Evaluation:** [docs/AI_EVAL.md](docs/AI_EVAL.md). On a set of 36 fictional check-in items the day reader scores 100% precision and 100% recall (`npm run ai:eval`). The app never calls the Claude / Anthropic API; the in-app AI is Gemini's free tier, with a deterministic mock as fallback.

## 8. Installation instructions

**You need (all free):** Node.js 24 or newer (https://nodejs.org) and Git (https://git-scm.com). No accounts are needed: without keys, the app uses built-in fictional sample data and the mock AI.

In Windows **Command Prompt**:

```bat
git clone https://github.com/ftgroup6/ParCare.git
cd ParCare
npm install
copy .env.example .env.local
npm run dev
```

Open **http://localhost:3000** → **I am the child** → **Demo login** (Priya Sharma, fictional). Then go to **Settings → Demo tools → Open Maa's app** to see the parent app next to it.

| Command | What it does |
|---|---|
| `npm run dev` | Start the app at http://localhost:3000 |
| `npm test` | Unit tests (Vitest) |
| `npm run e2e:install` then `npm run e2e` | End-to-end tests (Playwright; stop `npm run dev` first) |
| `npm run build` and `npm start` | Production build and run |
| `npm run lint`, `npm run typecheck` | Code checks |
| `npm run db:reset` | Fresh sample data (stop the app first) |

**Demo login (fictional):** `demo.child@example.com` / `ParCare-demo-2026`. The password is public on purpose; never reuse it.

**Optional:** to connect a real database (Supabase), the AI (a Google AI Studio key), push notifications (VAPID keys), the every-minute scheduler and the admin page, follow the step-by-step guide in [README.md](README.md). Every setting is listed with a comment in [.env.example](.env.example).

## 9. Screenshots

All screenshots show the fictional sample family on a phone-size screen. Files are in [docs/screenshots/](docs/screenshots/).

### Getting started

| Start screen | Child login | Parent: open the link | Parent: one tap, no password |
|---|---|---|---|
| ![Start screen](docs/screenshots/01-start.png) | ![Child login](docs/screenshots/02-child-login.png) | ![Parent opens the link](docs/screenshots/05-parent-open-link.png) | ![Parent invite](docs/screenshots/06-parent-invite.png) |

### Child app (Priya)

| Chats | Companion chat | Missed check-in alarm | Daily digest |
|---|---|---|---|
| ![Chats](docs/screenshots/03-child-chats.png) | ![Companion chat](docs/screenshots/04-child-companion-chat.png) | ![Alarm](docs/screenshots/12-child-alarm.png) | ![Digest](docs/screenshots/13-child-digest.png) |

| Helper list | Voice reminders | Settings (read-only check-ins) |
|---|---|---|
| ![Helper](docs/screenshots/14-child-helper.png) | ![Reminders](docs/screenshots/15-child-reminders.png) | ![Settings](docs/screenshots/16-child-settings.png) |

### Parent app (Maa)

| Answering a check-in | Choosing a companion | Adding a check-in |
|---|---|---|
| ![Check-in](docs/screenshots/07-parent-checkin.png) | ![Companions](docs/screenshots/08-parent-companions.png) | ![Add a check-in](docs/screenshots/09-parent-add-checkin.png) |

| Ask for help | SOS (never calls) |
|---|---|
| ![Help](docs/screenshots/10-parent-help.png) | ![SOS](docs/screenshots/11-parent-sos.png) |

## 10. Limits and safeguards

**What ParCare is not:** not inside WhatsApp (it is a separate web app that looks familiar), no phone calls, no camera, no location tracking, no listening in the background (the microphone is on only after a tap, with a visible indicator), no wearables, no compliance scores, no diagnosis, **not a medical or emergency service.**

**Privacy (designed as if India's DPDP Rules applied):** consent is recorded per check-in; the parent controls sharing; words and voice clips are kept for 8, 15 or 30 days at most; "Delete all our data" is available; voice is never used for training.

**Known technical limits:** a web app cannot ring while the browser is fully closed (it sends a phone notification instead); iPhone notifications work only from the home-screen icon; voice input works best in Chrome, and typing always works; Supabase free projects pause after a week without use.

---

*ParCare capstone · Product Management with AI · Group 6 · Built with Claude Code · All people and data are fictional.*
