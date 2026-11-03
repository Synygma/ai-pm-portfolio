# Roadmap — Meri Kahani

Status on 2026-11-03: **MVP is live** at https://meri-kahani-nine.vercel.app (free prototype).
Everything below is **Planned** unless marked done. Order can change after testing with parents.

---

## ✅ Done (MVP)
- Bedtime Story and Fun Poem pages, separate files and designs
- English, Hindi, Marathi output; English interface
- Gemini Flash-Lite with streaming (first words ~2 s, finished ~5 s)
- Read aloud (device voices), Slow/Normal speed, Marathi → Hindi voice fallback
- Share on WhatsApp, Copy, New Story/Poem
- Input checks, blocked-word filter on input and output, prompt safety rules
- 5 per hour usage limit, no data stored by our server
- Deployed on Vercel Hobby

---

## 🟢 Now (next 2–4 weeks): make the prototype trustworthy
| Item | Why | Notes |
|---|---|---|
| Test with 5–10 real parents (Plan Step 5) | Learn if stories feel warm, correct and safe | Use TESTING.md + a short feedback form (no child data stored) |
| Listen by ear on real Android + desktop Chrome, all 3 languages | Voice is untested on real devices | Note which phones lack Hindi/Marathi voices |
| Prompt tuning | Name spellings, rhymes, story length (one test: 437 words) | AI-PROMPTS.md |
| **Decide on the AI data terms** | Free-tier terms (training, human review, under-18 clause) | SAFETY-AND-PRIVACY.md §3: move to paid tier or limit sharing |
| Commit the work to git | Most work since the first commits is not committed | User asked to commit at the end |
| Basic privacy-friendly analytics | Needed for success metrics (PRD §7) | Count events only; no names or story text |

## 🟡 Next (1–3 months): better experience
| Item | Why | Notes |
|---|---|---|
| **Better Indian voices** | Device voices vary; many phones lack Marathi | Cloud text-to-speech with natural Hindi/Marathi voices; costs money; needs a privacy check |
| **Switch to a paid AI API when scaling** | Free-tier limits (e.g. 20/day on 3.6-flash) and data terms | Only `lib/ai.js` changes (Gemini paid, or Claude API) |
| Optional AI safety check after streaming | Word list can't judge meaning | Run while the parent reads; hide if unsafe |
| Exact usage limits | In-memory limit is per server copy | Shared store (e.g. Redis) or per-account limits |
| Nickname option | Reduce personal data sent to the AI | "Use a nickname" hint in the form |
| GitHub + automatic deploys | Safer updates, history | Connect the repo to Vercel |
| Automated tests | Catch regressions | Unit tests for safety, rate limit, text splitting |

## 🔵 Later (3+ months): grow
| Item | Why | Pre-requisites |
|---|---|---|
| **Login and saved stories** | Re-read favourites, story history | Privacy policy, parental consent, secure database, delete option (SAFETY-AND-PRIVACY.md §5) |
| **WhatsApp daily voice note** | A story delivered every evening | WhatsApp Business API, opt-in consent, phone number storage, better voices, paid AI tier |
| **More languages** | Gujarati, Tamil, Telugu, Kannada, Bengali, ... | Prompt rules per language, voice availability, native-speaker review |
| **Payments / premium** | Sustainability (e.g. daily WhatsApp story, more stories per day) | Paid hosting (Hobby is non-commercial), payment gateway, terms, refunds, tax review (SAFETY-AND-PRIVACY.md §6) |
| Illustrations | Richer experience | Cost, safety review of images |
| Offline / save as PDF or audio | Use without internet | — |

---

## Decision gates
1. **Before sharing beyond friends:** resolve the free-tier data terms (paid tier + legal advice).
2. **Before collecting any data:** privacy policy, consent, delete option, secure storage.
3. **Before charging money:** paid hosting, payment gateway, terms and refunds.
