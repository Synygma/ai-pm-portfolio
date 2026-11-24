# ParCare: features, roadmap and inputs for the marketing and pricing plan

Status as of 19 November 2026, version 1 (both apps complete for the submission; hosting live at https://parcare-six.vercel.app; Hindi not done yet). Version 1 changes: pricing section 5.4 now matches the marketing plan (v3); hosting status, pilot size and open questions updated. For the team writing D3 (product marketing strategy, pricing and
business model, execution plan) and D4 (the deck).

How to read the status labels:

- **Built**: working in the app now, with automated tests, and can be shown in a demo.
- **Built, awaiting sign-off**: working and tested, but not yet approved as a finished step.
- **Planned (this build)**: will be built before the submission.
- **Version 2**: designed and documented, not built. Belongs on the roadmap slide.
- **Not building**: ruled out on purpose. Several of these are part of the positioning.

Sources: the build spec (`CLAUDE.md`), the parent-app plan (`docs/PLAN-PARENT.md`), the team
handoff (`docs/source/CLAUDE handoff md.md`, sections 6, 10, 11 and 12) and the research synthesis
(Round 2, 1 Nov).

---

## 1. The product in brief

ParCare connects an adult child with an ageing parent who lives apart (India launch). With the
parent's consent, an AI companion checks in with the parent by voice at times the parent chose. The
child gets a daily summary in the parent's own words, and a factual alert only when check-ins go
unanswered.

- **Promise:** "Your kids want to be a bigger part of your day even though they live away."
- **Stance:** connect, do not monitor. The parent decides what is checked and what the child sees.
- **Two users, two apps:**
  - the **child** (likely payer) sets up and receives summaries and alerts
  - the **parent** (user, never charged in current thinking) answers check-ins on her own phone

Both apps are web apps that work in the phone's browser and can be added to the home screen. No app
store is needed.

---

## 2. Current features

### 2.1 Child app (Built)

| Feature | What it does | Why it matters for marketing |
|---|---|---|
| Sign-up, login, demo login | Email and password; a one-tap demo account with a week of sample history | A reviewer or prospect sees a full account at once |
| Agreement before first use | "What ParCare can and cannot do" shown before anything else, with an "I understand" tick; the record is kept as proof of consent | Trust and honesty up front; not an emergency or medical service |
| 9-step setup wizard | Child's details, parent's details (real countries and cities only), how to introduce the app, describe the parent's day (speak or type), emergency contact, invite link, call your parent, terms | About 10 minutes; saves after every step |
| AI day list | The child's description of the parent's day becomes a draft checklist with times (AI, with a rule-based fallback) | Shows AI used carefully; the parent still decides |
| Emergency contact rule | Saved only if the child confirms the person knows they are the first contact | Responsible by design |
| One-time invite link | Sent to the parent through the family's chat app; works once, expires in 7 days | Fits how families already communicate |
| Companion chat | Chat-style screen: setup messages, daily summaries, alerts, review prompts | Familiar look; no learning curve |
| Daily digest | At the child's chosen time: the parent's own words, quoted exactly, only for items she shares. Notes a change from her usual pattern as a fact ("usually walks at 6:30; said it did not happen"), never a diagnosis. Buttons: Matched / Did not match / Skip | Main daily value. "Matched" is the trust measure: research suggests trust is earned over about 30 days |
| Weekly and monthly summaries | Each check-in in words with dates; her quotes; no totals, scores or percentages | Bigger picture without turning the parent into a score |
| Missed check-in alarm | Parent asked → asked again → child alerted: "I checked in with Maa twice and did not hear back." Full-screen, rings until switched off; shows the emergency contact; never calls | The "missed call" moment from research: the hero scenario |
| Emergency-word alarm | If the parent uses an emergency word, the child gets a separate, more urgent alarm | Safety net without surveillance |
| Helper list | The parent's non-urgent requests (medicines, groceries, repairs), New → Seen → Done | Everyday logistics, which research found under-served |
| Voice reminders | The child records a short voice note for a date and time in the parent's time zone; it plays in the child's voice | Emotional differentiator: your voice, not a robot's |
| Settings | Parent's check-ins (read-only: the parent controls them), companion gallery, digest time, time zone, how long data is kept (8 / 15 days / 1 month), emergency contact, notifications, new link for the parent's phone, terms, delete all data | Control and privacy are visible |
| Review prompts | A week after setup, then every 3 months: "check with your parent that all is OK" | Keeps consent alive |
| "All check-ins off" notice | If the parent switches everything off, the child is told plainly to talk to her | Respects the parent's veto |

### 2.2 Parent app

| Feature | Status | What it does |
|---|---|---|
| Sign-in from the invite link, no password | Built | Signed in on her phone for 90 days; a new link signs the old phone out |
| Her own setup | Built | Chooses her companion (11 options) → tells it about her day (speak or type) → the companion reads back what it understood → at most 3 questions about things the child mentioned → she ticks off wrong items → she agrees to each check-in one by one and chooses what the child may see → thank-you → reminder gaps → terms |
| Chat with her companion | Built | Large text; every message can be read aloud by the phone's own voice |
| Live check-ins | Built | At each time the companion asks. She answers with Yes, done / Not today / I'm okay today / Snooze 30 min, or in her own words, spoken or typed. Her words are stored exactly |
| Second reminder | Built | If she does not answer, the reminder rings full screen with a sound |
| Emergency stop (PAUSE) | Built | An emergency word stops everything: she sees "Please contact local help now", the family's contact, and that her child has been told. Never calls |
| SOS button | Built | Always visible; shows local help advice and the family's emergency contact; never calls |
| Ask for help | Built | A voice note and/or words go to the child's Helper list; she sees when her child has seen it |
| Child's voice reminders on her phone | Built | Plays the child's recording in a loop until she taps OK or snoozes; shown with a "My Child" picture, never the AI companion |
| Notifications | Built | The companion's questions reach her phone when the app is in the background (needs hosting) |
| Personal evening question + photo prompt | Built | The last check-in asks something personal (never the same within a week); afterwards she is offered to share a photo with her child through the family's chat app |
| Her review prompts | Built | After 2 weeks, then every 3 months: "Did Gudiya speak to you? Would you like to change any check-in?" |
| "Who can see what" | Built | Pause / turn on each check-in, choose per item whether the child sees it, stop all, change companion and reminder gaps, delete her recordings and words |

### 2.3 Guardrails built into the product

These are design rules the app enforces. Each one is a positioning point.

| Rule | In the app |
|---|---|
| Consent first, item by item | Nothing is checked until the parent says yes to that item in her app |
| Parent controls sharing | She chooses per item what the child sees; the child cannot change it |
| No covert listening | The microphone is on only after she taps it, with a visible indicator, until she taps again (it switches off by itself after a minute) |
| At most 3 follow-up questions | The setup conversation never turns into an interrogation |
| Honest about AI | The companion always says it is an AI voice, not a person; it never speaks as the child |
| Not a score | No streaks, percentages or "proof she was fine" |
| No diagnosis | ParCare's own wording is checked against a list of diagnosis and mood words |
| Not an emergency service | No calls from the app; stated before first use and on the SOS screen |
| Data minimisation | Voice clips, words and digests deleted after 8 / 15 days or 1 month (family's choice); "delete all our data" in Settings; the internet address is never stored, only a one-way fingerprint with the consent record |

### 2.4 AI in the product (and how it is checked)

| Task | Where | How it is checked |
|---|---|---|
| Child's description → draft checklist | Child setup | Evaluation set of fictional descriptions; rule-based fallback if the AI fails |
| Parent's own words → her schedule | Parent setup | Same evaluation set, with parent cases added |
| Follow-up questions (at most 3) | Parent setup | Fixed rules, not AI, so it is predictable; unit-tested |
| Reading her answer as done / not done / unclear | Check-ins | Evaluation set of 12 answers; her exact words are always kept |
| Emergency words | Answers and help requests | Fixed word list first (not AI), with exclusions such as "fell asleep" |

The AI provider is Google Gemini on its free tier, with a rule-based fallback, so the demo works
offline and at no cost. Only fictional data goes to the AI. Details: `docs/AI_EVAL.md`.

---

## 3. Planned features and phases

### 3.1 Build phases

| Phase | Content | Status |
|---|---|---|
| C0–C8 | Child app: data, chat look, setup, check-in engine, alarms, digest, helper, reminders, settings, terms | Built |
| P-011 | Agreement before first use, data-keeping choice, weekly/monthly summaries, Skip, real places | Built |
| P1 | Parent sign-in and app shell, SOS | Built |
| P2 | Parent's own setup | Built |
| P3 | Live check-ins in the parent app | Built |
| P4 | Ask for help; child's voice reminders on the parent's phone | Built |
| P5 | Personalised last question of the day and photo prompt; parent's own review prompts; "Who can see what" settings | Built |
| P6 | One end-to-end test across both apps; README demo script; AI evaluation update | Built |
| Hosting | Free hosting (Vercel + Supabase) so the parent app can be installed on a real phone and reviewers get a link | Built: live at https://parcare-six.vercel.app (free plans) |
| Hindi | Both apps in Hindi (language is "mandatory" for parents per the research) | Next language; the app is prepared for it |

### 3.2 Version 2 roadmap (designed, not built)

From the handoff, section 6.2. These make the roadmap slide.

| Item | Why later |
|---|---|
| Inside WhatsApp itself (WhatsApp Business) | About 2 months of work; prove the core first |
| Helpers through WhatsApp (pharmacy, groceries, payment) | Needs vendor partners |
| A local contact on the app (neighbour or building guard) who gets escalations | The other person needs the app; adds complexity |
| Calls from the app; an SOS that dials | Out of scope at this stage |
| Siblings / a second child | v1 is one child per parent |
| Phone-movement wake-up check ("are you awake?") | Needs phone sensor data |
| Voice customisation (tone, the child's voice for the companion, speed) | Enhancement |
| Local emergency numbers directory | Scraped numbers are unreliable; families supply their own today |
| Voice-mood flags | Not decided; needs consent and an ethics review (G13 today: no mood labels) |
| Neighbourhood-level insights across households | Privacy-sensitive |
| Cab and urgent booking | Needs immediacy |

### 3.3 Not building (and should never be claimed)

Cameras, ambient or covert listening, constant location tracking, wearables by default,
photo-proof visit logs, compliance scores, showing relatives every answer, a human call centre.
Research says families reject these. The parent's independence is a veto (6 of 6 children, 4 of
5 parents).

---

## 4. Inputs for the marketing plan

### 4.1 Value proposition, tied to features

| For | Value | Proven by these features |
|---|---|---|
| Child | Know early and calmly, without calling ten times | Daily digest in her words; alert only when check-ins go unanswered; voice reminders in your own voice |
| Child | Help with everyday logistics | Helper list (her requests reach you); reminders across time zones |
| Parent | A friendly check-in on my terms | She picks the times, the companion and what is shared; she can pause or stop |
| Parent | Not being watched | No camera, no listening, no location, no scores; she sees exactly what the child sees |
| Both | Simple and familiar | Chat-style screens, voice or one tap, works on the phone she already has |

### 4.2 Proof points the demo can show live

1. The missed check-in: Maa does not answer twice → Priya's phone rings → factual message, no call.
2. The digest: Maa's own words, quoted exactly, plus a factual "change from usual" note.
3. Consent: Maa says yes item by item, and switches sharing off for one item; Priya's app shows it.
4. The emergency word: Maa says "Help me, I fell" → PAUSE on her screen, a distinct alarm for Priya.
5. The child's voice reminder plays on Maa's phone until she taps OK.

### 4.3 Words to use and to avoid

- **Use:**
  - stay part of their day
  - they decide what you see
  - know when something is off
  - in their words
  - a friendly voice
- **Avoid:**
  - monitoring
  - tracking
  - surveillance
  - safety guarantee
  - emergency service
  - anything suggesting proof, scores or diagnosis
- **The rule behind it:** guardrail G17 says do not overstate evidence. The interviews show
  **permission to test**, not proven demand.

---

## 5. Inputs for the pricing and business model

### 5.1 What we know and do not know

| Item | Status |
|---|---|
| Who pays | Hypothesis: the child pays, the parent is free. Not yet tested |
| Willingness to pay | **Unknown.** No usable price came out of any interview (research synthesis) |
| Price (team decision, 17 Nov 2026; billing periods added in the marketing plan) | **ParCare Plus at Rs 399/month**, Rs 2,299 for 6 months or Rs 3,999 a year, after a 30-day free trial (see 5.4). Replaces the earlier domestic idea of Rs 299/month. Still a price to **test**, not a finding |
| Earlier price ideas | Domestic test around Rs 299/month; NRI test at **US$10+/month**; pass bar: at least 30% of NRI respondents choose paid at US$10+. These are **our own earlier estimates**, not findings |
| Trial length | About 30 days is suggested by research (trust earned over ~30 days of the digest matching what the parent says) |
| Market size | TAM/SAM/SOM figures from the earlier dossier are **our estimates built on assumptions**; re-verify before use and label them as estimates |
| NRI-first | **Not supported** by the evidence yet; do not lead with it unless new evidence arrives |

Suggested next step: add Van Westendorp price questions to the next 3–5 interviews (too cheap /
cheap / expensive / too expensive).

### 5.2 What it costs to run

| Part | Today (demo) | What would change at scale |
|---|---|---|
| Hosting (Vercel) | Free hobby plan | A paid plan for commercial use and more traffic |
| Database, login, voice storage (Supabase) | Free plan (pauses after about a week without use) | A paid plan for always-on service, storage and backups |
| AI (Gemini) | Free tier; rule-based fallback | Paid usage per request; free-tier inputs may be used by Google, so real family data needs a paid tier with data protection |
| Speech to text / voice | The phone browser's own engines, free | Indian-language quality may need a paid speech provider (Sarvam is the candidate) |
| Notifications | Web push, free | Stays free; SMS or email fallback would cost per message |
| Every-minute scheduler | Supabase pg_cron, free | Included in the database plan |

Main cost drivers per family: voice minutes (speech), AI calls per check-in, voice-clip storage
(already capped at 1 month), and notifications if SMS is added. Check current prices before putting
numbers in the deck; none are quoted here.

### 5.3 Ways to package it (options for the team, not decisions)

| Option | Free | Paid | Fits the evidence? |
|---|---|---|---|
| Free trial, then one plan | 30 days of everything | Everything after the trial | Matches the ~30-day trust finding; simplest to explain |
| Freemium (the chosen model, detailed in 5.4) | Check-ins, missed check-in alarm, weekly summary | Daily digest in her words, voice reminders, monthly summary, helper list | Keeps the safety part free (ethically cleaner); the "in her words" digest is the paid value |
| Family plan (v2) | — | Siblings share one household | Needs the sibling feature (v2) |
| Partners (B2B2C, later) | Free to families | Paid by an insurer, employer, bank or hospital (discharge desks) | Channel idea from the handoff; untested |
| Marketplace (v2) | — | Take-rate on helper services | Needs vendor partners (v2) |

**A rule worth keeping in any option:** never put the safety alarm (missed check-in, emergency word,
SOS screen) behind a paywall. It is the product's ethical floor and part of the trust story.

### 5.4 Chosen pricing: Free + ParCare Plus, sold monthly, 6-monthly or yearly (matches marketing plan v3)

Freemium, with the child as the payer. Every family gets the safety core and a **short daily
digest** free. **Plus adds the special part: her day in her own words** (the quotes she actually
said, notes on what changed from her usual day, and the weekly and monthly picture). Safety stays
free on every plan. New families get a **30-day free trial of Plus, no card**; if it ends unpaid
they move to Free and nothing about safety switches off.

*Earlier version (17 Nov): a three-plan ladder with a "Digest Only" decoy at Rs 349. The marketing
plan replaced it: the decoy is now the 6-month billing period. A "Plus Lite" at Rs 349 is held as a
later test, not launched.*

| | **Free** | **ParCare Plus** | **Employer-sponsored Plus** |
|---|---|---|---|
| Price | Rs 0, forever | **Rs 399/month**, **Rs 2,299 for 6 months** (the decoy), **Rs 3,999/year** (the plan we want most families to choose); GST included; first 30 days free | Rs 149 per enrolled family per month plus GST, paid by the employer; minimum 50 families |
| Check-ins at the times she chose, with her consent | Yes | Yes | Yes |
| Missed check-in alarm, emergency-word alarm, SOS screen | Yes | Yes | Yes |
| Daily digest | **Short digest**: each check-in as done / not done / not answered | Digest **in her own words**, with "changed from her usual day" notes | As Plus |
| Weekly and monthly summaries | – | Yes | As Plus |
| Voice reminders in the child's own voice ("My Child") | Limited (2 a week, planned limit) | Unlimited | Unlimited |
| Voice replies and 👍 / 👎 between child and parent | 👍 / 👎 only | Yes, with voice | As Plus |
| Helper list (her non-urgent requests) | Yes | Yes | Yes |
| How long her words and voice clips are kept | Family chooses 8 / 15 / 30 days; never more than 30 (G15) | Same | Same |

**What is special for Plus, in one line:** *"Hear her day in her own words, and answer in yours."*
The AI companion never speaks as the child (G16).

**How the decoy works.** The 6-month plan is a real plan with the same features. It is priced so
that it is rarely the best choice: annual costs Rs 50 a month less, and the extra 6 months cost
about Rs 283 each ("the next 6 months cost just Rs 283 a month"). Two 6-month plans (Rs 4,598) cost
more than one annual plan (Rs 3,999). It is a compromise option, not a pure "dominated" decoy, and
the plan treats its effect as a test result to be read at the pricing gate, not a promise.

**Why these features sit where they do:**
- **Free** keeps everything that protects her (alarms, SOS, check-ins, the helper list) and still
  shows the child that ParCare works every evening. That keeps the trust story and the "never
  paywall safety" rule intact.
- **Plus** charges for the emotional value the research points to: hearing her own words, and the
  child's own voice reaching her. These cost more to run (voice storage, AI, speech).
- **The keeping period** follows G15: never longer than 30 days on any plan, so it is not a paid
  feature. (The marketing plan's "7 days free / 90 days Plus" is being corrected to match.)

**Not built yet:** payments, plan limits, the short free digest, the employer plan, the 30-day trial
and the 6-month / annual billing are not in the app; today every family gets everything. Payment
for the pilot is handled by the plan (see open question 6).

**How to present it (G17):** show Rs 399 as **the price we will test**, not a proven price. Test it
with the next 3-5 interviews (Van Westendorp questions) and the 15-family pilot. Read the 6-month
plan as working if most buyers still choose annual. For NRI families, keep the separate US$10+/month
test from 5.1.

---

## 6. Go-to-market phases, tied to features

From the handoff, section 12.2. Targets marked X are for the team to set.

| Phase | When (after the course) | Goal | Features needed |
|---|---|---|---|
| 0 Prove | Weeks 1–4 | Does the check-in work with real families? | Everything built, plus hosting and Hindi; 15 families, 30-day pilot; digest "Matched" rate; willingness-to-pay test |
| 1 Early adopters | Months 2–3 | First paying users | Payments (not built); referral link; partners (hospitals, pharmacies) |
| 2 Inside WhatsApp | Months 3–6 | The parent needs no app install | WhatsApp Business (v2); local contact role (v2) |
| 3 Services | Months 6–12 | Everyday help as revenue | Helper partners and marketplace (v2); siblings (v2); insurer / employer deals |

Success measures to define:
- share of families with check-ins still on at day 30
- digest "Matched" rate
- parent comfort score
- paid conversion against the 30% bar

---

## 7. Open questions for the team

1. Who is the paying customer in the deck: the working child in India (segment C) first, as the research suggests?
2. ~~Free trial or freemium?~~ Decided: freemium with a short digest on Free; Plus at Rs 399/month, Rs 2,299 for 6 months (decoy) or Rs 3,999/year, with a 30-day free trial (5.4). Safety stays free.
3. ~~Do we show price points in the deck?~~ Decided: show Rs 399/month as the price we will test (5.4).
4. Which 2–3 launch channels? Candidates: family referral, employer wellness programmes, hospital discharge desks and pharmacies, senior-living and RWA associations, Hindi/English video content.
5. Competitor check: verify the current status of Emoha, Samarth, Anvayaa and wearable or camera products, and note Amazon Alexa Together as a failed precedent.
6. Payment collection is not built. The marketing plan puts real payments (UPI AutoPay through a payment gateway on the company's name) in the second pilot stage, around mid-February 2027; confirm that the pilot stays manual until then.
