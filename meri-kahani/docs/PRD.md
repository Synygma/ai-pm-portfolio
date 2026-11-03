# Product Requirements Document (PRD) — Meri Kahani

| | |
|---|---|
| **Product** | Meri Kahani ("My Story") |
| **Type** | Website (mobile-first; works in phone and computer browsers). Not a Play Store / App Store app. |
| **Status** | MVP built and live as a free prototype: https://meri-kahani-nine.vercel.app |
| **Last updated** | 2026-11-03 |

---

## 1. Problem statement

Indian parents want short, warm bedtime stories for their young children (ages 2–10). Today they usually:
- make up stories every night (tiring after a long day), or
- read the same few books again and again, or
- play generic YouTube or audio stories, often set in foreign worlds and mostly in English.

Stories in the child's **mother tongue**, in a **familiar Indian world** (Dadi's aangan, mango trees,
trains, monsoon rain, festivals), with the **child as the hero**, are hard to find and impossible to personalise.

## 2. Vision

> Every Indian child falls asleep to a story in their own language, where they are the hero,
> in a world that feels like home.

Meri Kahani turns a few details (name, age, family, favourite things, a value to teach) into a calm,
personalised bedtime story or a playful rhyming poem in seconds, which parents can read, play aloud, or share.

## 3. Target users

**Primary:** Indian parents of children aged 2–10, using a smartphone browser (mostly Android + Chrome).
**Secondary:** Grandparents and other caregivers who tell bedtime stories.
**Languages (MVP):** English (warm Indian English), Hindi and Marathi (Devanagari script).

### Persona 1 — Priya, urban working parent
- 34, software professional in Pune; one daughter, age 5.
- Tired at bedtime; wants something quick, meaningful and screen-light.
- Speaks English and Marathi at home; wants her daughter to stay connected to Marathi.
- **Needs:** a fresh story in under a minute, short enough for one bedtime, gently teaching a value (sharing, kindness).
- **Uses:** the Bedtime Story page in Marathi, the **Listen** button when her voice is tired, and **Share on WhatsApp** to send it to the grandparents.

### Persona 2 — Rajesh, tier-2 city parent
- 38, runs a shop in Nagpur; son age 7, daughter age 3.
- Comfortable in Hindi; English is limited. Uses a budget Android phone with mobile data.
- **Needs:** simple Hindi, a fast-loading page, big buttons, no sign-up, free.
- **Uses:** Hindi stories and fun poems about trains and festivals; reads aloud or uses **Listen**.

### Persona 3 — Shanta Aaji, grandparent who tells stories
- 66, retired teacher in Kolhapur; looks after her grandson (age 4) in the evenings.
- Loves telling stories but is running out of new ones. Prefers Marathi.
- **Needs:** large, easy-to-read text; calm, safe content; stories she can read in her own voice.
- **Uses:** the large Marathi story text; the **Slow** voice speed; "New Story" to get another one with the same details.

## 4. Competitor landscape

> This is a high-level view. Specific competitor names, features and prices **need to be researched and verified** before using it for decisions.

| Category | What they offer | Gap for Indian families |
|---|---|---|
| Global AI bedtime story apps and websites | Personalised AI stories, often with images or audio | Mostly English and Western settings; Indian regional languages and Indian everyday life are rare or shallow |
| Story / audio apps for kids | Large libraries of pre-made stories, audio narration | Not personalised; child is not the hero; limited regional language depth |
| YouTube kids' story channels | Free, many Hindi options | Not personal, screen-heavy at bedtime, ads, content quality varies |
| General chatbots | Can write a story if prompted well | Parents must write prompts; no child-safety guardrails built for bedtime; no read-aloud flow |

**Our angle (differentiation):**
1. **Mother-tongue stories:** Hindi and Marathi in proper Devanagari, plus warm Indian English.
2. **Indian world:** aangan, Dadi/Nani, mango trees, trains, rain, festivals. No foreign settings.
3. **Child as hero:** real name, family and pet names, favourite things.
4. **Fun poems:** a separate playful rhyming-poem mode, not just bedtime stories.
5. **Built for sharing:** WhatsApp share today; **Planned:** WhatsApp daily voice-note delivery.
6. **Zero friction:** a website, no install, no login.

## 5. Features

### 5.1 Built (MVP) — as of 2026-11-03
| # | Feature | Details |
|---|---|---|
| F1 | Home page | "Meri Kahani" title; two cards: 📖 **Bedtime Story** (`/kahani`) and 🎉 **Fun Poem** (`/kavita`). |
| F2 | Story form | Child's name, age (2–10), language (English/Hindi/Marathi; English default), family/pet names (optional), favourite things, value to teach (Sharing, Honesty, Courage, Kindness, Being brave at night, Listening to elders), **Create Story** button. |
| F3 | Poem form | Same child fields + "What should the poem be about?" (Animals, Rain, Train, Food, Festivals, Playing outside, Surprise me), **Create Poem** button. |
| F4 | AI generation | Google Gemini (free tier). Story 450–600 words; poem 3–4 verses of 4 lines (12–16 lines). |
| F5 | Streaming | Text appears word by word. Measured first words in ~1–2 s, finished in ~2–5 s. |
| F6 | Read aloud | Browser's built-in voice: **Listen**, **Pause**, **Stop**; speed Slow/Normal (story default Slow, poem default Normal); voice chosen by language; Marathi falls back to a Hindi voice with a note. Enabled only after the text is complete. |
| F7 | Sharing | **Share on WhatsApp** (title + first lines + page link) and **Copy** (full text). |
| F8 | New Story / New Poem | Clears the result and scrolls back to the form, keeping the child's details. |
| F9 | Input safety | Name ≤ 30 letters (letters only), other boxes ≤ 100 characters, blocked-word list (English, Hindi/Marathi in Latin and Devanagari). |
| F10 | Output safety | Strict safety rules in prompts + blocked-word check on the finished text; unsafe text is hidden with a friendly message. |
| F11 | Usage limit | 5 stories + poems per person (internet address) per hour, no login. |
| F12 | Privacy | No database; nothing the parent types is saved by our server; footer: "We don't save your child's details." |
| F13 | Two visual themes | Calm night sky for stories; bright yellow/orange/green for poems. Mobile-first, big buttons. |
| F14 | English interface | All buttons and messages in simple English; only the story/poem uses the chosen language. |
| F15 | Hosting | Vercel Hobby (free). Gemini key stored only in Vercel's environment variables. |

### 5.2 Planned (not built)
| Feature | Notes |
|---|---|
| Better Indian voices | Higher-quality Hindi/Marathi narration (for example a cloud text-to-speech service). |
| Login and saved stories | Save favourites, re-read past stories. Needs consent and a privacy policy first. |
| Payments / premium | Requires paid hosting/API, terms, privacy policy, refunds. |
| WhatsApp daily voice note | Daily story delivered on WhatsApp. Needs WhatsApp Business API, opt-in, and data handling. |
| More languages | For example Gujarati, Tamil, Telugu, Kannada, Bengali. Needs voice and quality checks. |
| Paid AI tier | Move from Gemini free tier to paid when scaling (data terms, limits). |
| Analytics | Privacy-friendly counting needed to measure the success metrics below. **Nothing is measured today.** |
| Automated tests | Only manual testing today (see TESTING.md). |

See [ROADMAP.md](ROADMAP.md) for order and timing.

## 6. User stories and acceptance criteria

| ID | User story | Acceptance criteria | Status |
|---|---|---|---|
| US1 | As a parent, I want to choose between a bedtime story and a fun poem, so I get the right mood. | Home shows two cards; each opens its own page; each page has a "← Home" button. | Built |
| US2 | As a parent, I want a story starring my child, in my language, so it feels personal. | Story uses the child's name, given family/pet names and favourite things; written fully in the chosen language; Hindi/Marathi in Devanagari. | Built (AI quality varies; see Risks) |
| US3 | As a tired parent, I want the story to start appearing almost immediately. | First words appear within ~3 s; full story within ~30 s under normal conditions. | Built (measured 1.7 s / 4.5 s live) |
| US4 | As a parent, I want a calm story that teaches a value without preaching. | Value is shown through events; no "moral of the story" line; slow, sleepy ending. | Built (prompt rules) |
| US5 | As a parent, I want to play the story aloud. | Listen/Pause/Stop work; voice matches language; Slow default for stories, Normal for poems; Listen enabled only after the text is complete; Marathi → Hindi voice fallback with a note. | Built (sound quality depends on the device) |
| US6 | As a parent, I want to send the story to family. | Share on WhatsApp opens WhatsApp with title, first lines and link; Copy copies the full text and confirms. | Built |
| US7 | As a parent, I want another story without retyping. | New Story/New Poem clears the result and keeps the form filled. | Built |
| US8 | As a parent, I want content that is always safe for my child. | Bad words in the form are refused politely; finished text with blocked words is hidden with a friendly message. | Built (word list cannot catch everything) |
| US9 | As the owner, I want to protect my free AI limit. | 6th request within an hour from the same address shows "That's a lot of stories for now! Please try again in a little while 🌙". | Built (approximate on Vercel) |
| US10 | As a parent, I want my child's details kept private. | No database; server does not save inputs or outputs; footer states this. | Built (see free-tier note in SAFETY-AND-PRIVACY.md) |
| US11 | As a parent, I want to save favourite stories. | — | Planned |
| US12 | As a parent, I want a story on WhatsApp every evening. | — | Planned |

## 7. Success metrics

> **Important:** no analytics is built, so none of these are measured today. Measuring them is **Planned**
> and must be done in a privacy-friendly way (no child names or story text stored).

| Metric | Definition | Early target (to validate with parents) |
|---|---|---|
| Stories per user per week | Stories + poems created per returning visitor | ≥ 3 |
| Repeat usage | % of visitors who come back within 7 days | ≥ 30% |
| Shares | % of stories shared via WhatsApp or Copy | ≥ 15% |
| Listen rate | % of stories where Listen is pressed | Track; no target yet |
| Completion | % of generations that finish successfully (not busy/unsafe/error) | ≥ 95% |
| Speed | Time to first words / finished | ≤ 3 s / ≤ 30 s (currently met) |
| Parent satisfaction | Feedback from Plan Step 5 parent testing | Qualitative |

## 8. Out of scope (for the MVP)
- Native mobile apps (Play Store / App Store).
- Images or illustrations, music, or video.
- Accounts, login, saved history, payments.
- Any database or storage of children's details.
- Languages other than English, Hindi and Marathi.
- Commercial use (the Vercel Hobby plan is for personal, non-commercial use).

## 9. Risks and assumptions

### Risks
| Risk | Impact | Mitigation |
|---|---|---|
| **Gemini free-tier terms**: Google may use and human-review prompts; says not to send personal info; API apps must not be directed at under-18s. | High: compliance and trust | Move to a paid tier and get legal advice before wider sharing. See SAFETY-AND-PRIVACY.md. |
| Free-tier limits (e.g. `gemini-3.6-flash` showed 20 requests/day) | Stories fail on busy days | Fast model first with a backup model; per-person limit; paid tier later. |
| Word filter misses unsafe meaning; streamed text may show briefly before being hidden | Child-safety | Strict prompt rules; consider bringing back an AI check that runs after streaming. |
| AI quality in Hindi/Marathi (odd words, weak rhymes, name spellings) | Trust | Prompt tuning; parent testing (Plan Step 5). |
| Device voices: some phones lack Hindi/Marathi voices | Listen less useful | Fallback note; Planned: better voices. |
| Usage limit is per server copy and per internet address | Over-use, or families on one Wi-Fi sharing a limit | Acceptable for prototype; Planned: shared store or login. |
| Hobby plan is non-commercial | Can't monetise on it | Upgrade hosting before payments. |

### Assumptions
- Parents (adults) use the website; children only listen.
- Most users are on Android phones with Chrome.
- Parents will accept AI-written stories if they are warm, safe and personal.
- A free, no-login experience drives first use; sharing on WhatsApp drives growth.
