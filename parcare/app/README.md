# ParCare

A WhatsApp-style web app (PWA) that helps an adult child stay part of an ageing parent's day, with
the parent's consent. Capstone project (Product Management with AI, Group 6). India-only demo,
not a market product. **This build: both apps**: the child's app and the parent's app (English).

- Build spec: [CLAUDE.md](CLAUDE.md)
- Plans and decisions: [docs/PLAN.md](docs/PLAN.md) (child app), [docs/PLAN-PARENT.md](docs/PLAN-PARENT.md) (parent app)
- Features, roadmap and inputs for marketing and pricing: [docs/PRODUCT_FEATURES.md](docs/PRODUCT_FEATURES.md)
- AI evaluation: [docs/AI_EVAL.md](docs/AI_EVAL.md)
- Prompt log: [docs/PROMPTS_LOG.md](docs/PROMPTS_LOG.md)
- Source documents: [docs/source/](docs/source/)

> All names and data in this app are fictional.

---

## What you need (all free)

- **Node.js 24 or newer**: https://nodejs.org (LTS installer)
- **Git**: https://git-scm.com/download/win
- Optional, later: a Supabase account, a Google AI Studio key, a GitHub account, a Vercel account.
  The app runs without any of them, using built-in sample data and a mock AI.

Check the installs in **Command Prompt**:

```bat
node -v
npm -v
git --version
```

## First-time setup (Command Prompt)

```bat
cd C:\CapstoneProject
npm install
npm run e2e:install
copy .env.example .env.local
```

`.env.local` holds your keys and is never committed. With it left as is, the app uses the
in-memory database and the Mock AI provider.

## Everyday commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the app at http://localhost:3000 |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm test` | Unit tests (Vitest) |
| `npm run e2e` | End-to-end tests (Playwright, phone-size Chromium; starts the app itself) |
| `npm run lint` | Lint |
| `npm run typecheck` | TypeScript check |
| `npm run check` | Lint + typecheck + unit tests |
| `npm run icons` | Rebuild all app icons from `assets/source/APP_Icon.jpg` |
| `npm run avatars` | Re-crop the 12 avatar portraits from `assets/source/avataar_sample_icons.png` |
| `npm run db:reset` | Delete the local sample database (`.data/dev-db.json`); the next start reloads fresh sample data. Stop the app first |
| `npm run ai:eval` | Run the AI check-in-list evaluation (Gemini if `GEMINI_API_KEY` is set, otherwise the built-in mock). See [docs/AI_EVAL.md](docs/AI_EVAL.md) |
| `npm run seed:supabase` | Load the fictional demo data into Supabase (needs the Supabase keys, see below) |

To stop the app, press `Ctrl+C` in the Command Prompt window.

> `npm run e2e` starts its own copy of the app. Next.js allows only one dev server per folder, so
> **stop `npm run dev` before running `npm run e2e`**.

## Demo logins

All demo data is fictional.

| Who | Email | Password |
|---|---|---|
| Priya Sharma (child, London) | `demo.child@example.com` | `ParCare-demo-2026` |

With `DEMO_MODE=true` the login page also has two one-tap buttons:

- **Demo login**: Priya, with a week of sample history.
- **Demo: start a new setup**: a fresh fictional account (`demo.newsetup@example.com`, same password), wiped every time, that opens the 9-step setup wizard.

 The demo password is
public on purpose; never reuse it for anything real.

Without Supabase keys the app uses a built-in database filled with sample data (Priya, her mother
Kamla "Maa" in Lucknow, one week of check-ins and digests). In development it is saved to
`.data/dev-db.json` so it survives restarts; `npm run db:reset` starts it fresh.

## Supabase (optional locally, needed for the deployed URL)

1. Create a free project at https://supabase.com.
2. **SQL Editor** → **New query** → paste all of `supabase/all-migrations.sql` (every file in
   `supabase/migrations/`, joined in order) → **Run**. From Command Prompt you can copy it with
   `type supabase\all-migrations.sql | clip`. This creates the tables, row-level security (each
   child sees only their own household) and the private `voice` storage bucket.
3. **Authentication → Sign In / Providers → Email**: keep Email on and switch **Confirm email** off
   (demo accounts use made-up addresses).
4. **Project Settings → API**: copy the Project URL, the `anon` key and the `service_role` key into
   `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
5. `npm run seed:supabase` loads the demo data (safe to re-run: it replaces the demo account).
6. Restart `npm run dev`. The signed-in page now says "Data: Supabase".
7. **Forgot password (link by email)**: **Authentication → URL Configuration**: set **Site URL** to your
   site (for example `https://parcare-six.vercel.app`) and add `https://parcare-six.vercel.app/**` under
   **Redirect URLs** (add `http://localhost:3000/**` too for local use). Nothing else: the link comes in
   Supabase's standard "Reset password" email, opens ParCare's "Choose a new password" page, and must be
   opened in the browser where it was asked for. Supabase's built-in email sends only a few emails an hour
   (fine for a demo). The demo logins cannot be reset (they are shared). Without Supabase (sample data,
   demo mode) no email is sent and the link is shown on the screen.

## Parent app (Maa's phone)

- **Demo:** Settings → Demo tools → **Open Maa's app** opens Kamla's app in a new tab. Priya stays
  signed in, so both apps can sit side by side.
- **Real use:** the child sends the one-time invite link (setup step g, or Settings → "Make a new
  link"). On the parent's phone the link shows "Open my ParCare"; tapping it signs her in for 90
  days, with no password. A link works once; opening a new link signs the old phone out.
- Her app: chat with her companion (messages can be read aloud with the phone's voice; switch it
  off in her Settings), and always-visible **SOS** (local help + the family's emergency contact;
  never calls), **Ask for help** and **Settings**.
- **Ask for help:** a voice note and/or her words go to the child's Helper list; she sees when the
  child has seen it. Not for emergencies: an emergency word shows PAUSE and rings the child's alarm.
- **Her Settings ("Who can see what"):** pause or turn on each check-in, choose whether the child
  sees each answer, stop all check-ins (the child is told), change her companion and reminder gaps,
  delete her recordings and words. Her review question (after two weeks, then every 3 months)
  appears in her chat. The evening check-in asks a personal question and then offers to share a
  photo with the child through the family's chat app.
- **Child's voice reminders** ring on her phone (the child's own recording, repeating) until she
  taps **OK, thank you** or **Snooze 10 min**.
- **Live check-ins:** at each check-in time her companion asks in her chat (and notifies her phone
  if she turned notifications on in her Settings). She answers with **Yes, done**, **Not today**,
  **I'm okay today**, **Snooze 30 min**, or in her own words (tap the mic or type). If she does not
  answer, the second reminder rings full screen. An emergency word shows **PAUSE** and rings the
  child's distinct alarm. Demo tools → **Ask Maa the next check-in now** makes the next one happen
  at once.
- **Her setup** (first time she opens the app): choose her companion → tell it about her day (hold
  the mic or type; or answer in three parts) → at most 3 questions about things her child mentioned
  that she did not → untick anything wrong → say yes to each check-in she wants and whether her
  child may see it → thank-you and daily summary → reminder gaps → terms. To try it: **Demo: start
  a new setup**, finish the child's setup, then Demo tools → **Open Maa's app**.

## Demo tools (DEMO_MODE=true)

Settings → **Demo tools** (or go to `/demo`):

- **Open Maa's app**: the parent app in a new tab, signed in as Maa, next to Priya's.
- **Demo clock**: +5 min, +1 hour, +1 day, +1 week, +3 months, Reset. Every change runs the
  check-in engine, the same as the server does every minute in production.
- **Parent simulator** (the parent app does the same for real):
  - **Ask Maa the next check-in now** (she answers in her app)
  - answer the next check-in (typed)
  - let the next check-in go unanswered (prompt 1 → prompt 2 → your alarm)
  - send a helper request (with or without an emergency word)
  - switch all check-ins off or on
  - change the parent’s companion
  - answer your ringing voice reminder: “Parent says OK” or “Snooze 10 min”
- **Reset demo data**: back to the original sample data (built-in database only).

The alarm page rings until you tap **Switch off**. Browsers need one tap before they play sound;
if the page shows "Tap to turn on the alarm sound", tap it.

### Real-time check of the daily digest (no clock jumps)

1. Demo login → Settings → **Demo tools** → under "Answer the next check-in", type something
   (the line above the box shows which check-in it goes to) → **Send answer**.
2. Settings → **Daily digest time** → set the next minute (your time) → **Save**.
3. Open **Chats** and wait. The open app runs the engine every 10 seconds, so within about a
   minute the new digest appears in Vidya’s chat. **Open digest** shows your typed words, quoted exactly.

### Real-time check of a voice reminder

1. **Reminders** → **New reminder** → **Record your voice** (allow the microphone), speak, **Stop**.
2. Set the date and time two minutes from now in **Maa’s** time (the line below shows your time) →
   **Save reminder**.
3. Stay on Reminders. Within about two minutes it changes from Scheduled to **Ringing**. Then
   Demo tools → **Parent says OK** → it shows **Parent said OK**.

## Demo script (about 15 minutes, both apps)

Use Chrome, press F12 and switch to a phone view. Run `npm run db:reset` first for fresh sample
data. Tip for the presentation: two Chrome windows side by side, Priya (child) on the left and
Maa (parent) on the right.

**Part 1: a new family (consent first)**

1. **Entry**: the ParCare icon, "I am the child" / "I am the parent", and **What ParCare can and
   cannot do**, readable before signing in.
2. **Child setup**: Log in → **Demo: start a new setup** → **Before you start** (can / cannot, "I
   understand" tick, kept as proof of consent) → the 9 steps:
   - your details (country from the list, city picked from the list, which fills in the time zone)
   - Amma's details; how it works; how to introduce the app (11 companions, an AI voice, not a person)
   - describe Amma's day (type, or tap the mic and speak) → **Make the check-in list**
   - emergency contact (answer **No**: nothing is stored)
   - the one-time **invite link**; call your parent; terms tick
3. **Nothing is checked yet**: home says "Amma chooses the check-ins in their app".
4. **Amma's setup**: open the invite link in a private window (Ctrl+Shift+N) → **Open my ParCare**
   (no password) →
   - choose a companion; tell it about her day
   - it reads back what it understood and asks at most 3 questions about things Asha mentioned
   - untick anything wrong; **agree to each check-in one by one**; choose what Asha may see
   - thank-you; reminder gaps; terms
5. Back in Asha's app: "Amma finished their setup and agreed to N check-ins"; Settings lists them.

**Part 2: a week of use (Priya and Maa)**

6. **Demo login** (Priya) → Settings → Demo tools → **Open Maa's app** (opens next to it).
   Priya's chat: digests, a past alarm, a review prompt. Maa's chat: her companion Vidya, her
   answers in her own words; every message has **Read aloud**.
7. **A check-in**: Demo tools → **Ask Maa the next check-in now**. Maa answers **Yes, done**, **Not
   today**, **Snooze 30 min**, or in her own words (type or tap the mic). The companion thanks her.
8. **The missed call moment**: Demo tools → **Let the next check-in go unanswered**. Maa is asked
   twice (the second time full screen with a sound); then Priya's alarm rings: "I checked in with
   Maa twice and did not hear back", with Mrs. Verma's number. No call is ever placed.
   **Switch off**.
9. **Emergency word**: in Maa's **Ask for help**, type "Help me, I fell" → **PAUSE** on her screen
   ("contact local help now"), a distinct alarm for Priya. Switch it off.
10. **Digest**: Priya's **Digest** tab → the day with "1 change from usual" → Maa's own words, a
    factual note, "not medical advice" → **Matched what my parent told me** (or **Skip**).
    **Weekly / Monthly summary**: in words, with dates, no totals.
11. **Help and reminders**: Maa → **Ask for help** (words or a voice note) → Priya's **Helper** tab
    (New → Seen → Done). Priya → **Reminders** → a voice reminder a few minutes ahead in Maa's time
    → Demo tools **+5 min** → it plays on Maa's phone until **OK, thank you**; Priya sees "Parent said OK".
12. **Maa is in control**: Maa → **Settings → Who can see what**: pause a check-in, keep one to
    herself, change her companion or reminder gaps, delete her recordings and words. Priya's
    Settings follows (read-only: "Your parent controls these"). **Stop all check-ins** → Priya:
    "All check-ins are switched off. Please talk to Maa."
13. **Over time**: Demo tools **+1 week** → Maa's review question in her chat; **+3 months** → Priya's
    review prompt. The evening check-in asks Maa a personal question, then offers to share a photo
    with Gudiya through the family's chat app.
14. **Privacy**: Priya's Settings → how long data is kept (8 / 15 days / 1 month), **Delete all our
    data**. Finish with Demo tools → **Reset demo data**.

## Admin page (ParCare team only)

`/admin` has its own login (not a child account): set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (at least 10
characters, make them up) in `.env.local`, and in Vercel under **Settings → Environment Variables**,
then redeploy. Leave them empty to switch the page off. On Supabase, run
`supabase/migrations/0007_admin.sql` once in the SQL Editor.

- **Logins**: every account, when it joined, whether the child and the parent finished setup.
- **Activity bands** (last 14 days): the share of check-ins the parent answered before the child's
  alarm. Active 80% or more, Partly active 50–79%, Low under 50%, Not started = nothing asked yet.
  Only the team sees this; families never do (G12).
- **Delete user**: removes the family's data, voice clips and the login, so the same email can sign up
  and test again. The sample family (Demo login) cannot be deleted here.
- **Send a gentle check-in**: one of four fixed notes or your own words (up to 160 characters, with a
  tick that it is not marketing). Offers, prices, sales words, links and health words are refused.
  It goes to the child's app only (a chat note "A note from the ParCare team: …" plus a notification),
  and only to families where all is OK (setup done, no alarm ringing).

## Alarm notifications (Web Push, free)

1. `npx web-push generate-vapid-keys`
2. Put the keys in `.env.local` (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`) and restart.
3. Settings → **Alarm notifications** → **On** → allow notifications.

## Scheduler in production

`/api/tick` runs the check-in engine. It needs `Authorization: Bearer <CRON_SECRET>`. After
deploying, fill in your URL and secret in `supabase/cron.example.sql` and run it in the Supabase
SQL Editor, so the database calls `/api/tick` every minute.

## Environment variables

See [.env.example](.env.example): every variable has a comment on where to get it.

## Known limits

- A browser app cannot ring when the browser is fully closed. Web Push + an in-app alarm page is
  the best a PWA can do (Android Chrome works best; iOS needs the app installed to the home screen).
- Browsers need one tap before they will play the alarm sound.
- Supabase free projects pause after about a week without activity: open the Supabase dashboard
  before a demo.
- Voice input uses the browser's speech recognition (best in Chrome). Typing always works.
- Phone install: ParCare is an installable web app (PWA). A phone can install it only from an
  https address, i.e. once it is hosted (Vercel + Supabase). On a computer, Chrome can install it
  from http://localhost:3000 (install icon in the address bar). No app-store version.

## Tests never touch your Supabase project

Tests always run on the built-in sample database, even when `.env.local` has Supabase keys: the
test server blanks the keys, the app reads them at run time (nothing of Supabase is written into
the build), and every test run first checks it is on the sample data and stops if it is not.

## Credits

City names: [GeoNames](https://www.geonames.org/) (CC BY 4.0), via the MIT-licensed
`all-the-cities` package; city time zones via the MIT-licensed `city-timezones` package.

## Continuous integration

`.github/workflows/ci.yml` runs lint, typecheck, unit tests, build and Playwright on every push.
