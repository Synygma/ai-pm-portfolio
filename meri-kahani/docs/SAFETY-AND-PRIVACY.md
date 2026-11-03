# Safety and Privacy — Meri Kahani

> This document explains what the website does today and what should be done before growing it.
> It is **not legal advice**. Before collecting user data, taking payments, or sharing the site widely,
> please consult a qualified lawyer.

---

## 1. Child safety approach (as built)

The website is used by **parents**. Children only hear or see the stories their parents choose.

Safety works in **four layers**:

| # | Layer | How it works | File |
|---|---|---|---|
| 1 | **Form limits** | Name: letters only, max 30. Other boxes: max 100. Choices (age, language, value, topic) come from fixed lists. | Forms + routes |
| 2 | **Input word check** | Blocked words (violence, adult, swear words in English, Hindi/Marathi in English letters and Devanagari) in any box → no story; polite message: "Please use kind words. This is for young children. 🙏" | `lib/safety.js` `checkInput()` |
| 3 | **Prompt rules** | Strictly child-safe: nothing scary, violent, romantic or sad; no villains, monsters, injuries or death; no brands or real celebrities; avoid violent words; Indian, warm, calm. | `lib/storyPrompt.js`, `lib/poemPrompt.js` |
| 4 | **Finished-text word check** | After the full text arrives, the same blocked-word list is checked. If it fails, the browser hides the text and shows: "Sorry, we couldn't create a good story this time. Please try again." | `lib/safety.js` `isTextClean()`, `lib/streamResponse.js` |

**Matching:** whole words, case-insensitive, Unicode-aware (works for Devanagari), plus phrases with spaces
(e.g. "मार डालो"). So "skill" passes even though "kill" is blocked.

### Known limits (be honest with parents and testers)
- **A word list can't understand meaning.** A story that is unsuitable without using any blocked word would not be caught.
- **Brief exposure:** because text streams word by word, a parent could briefly see text before it is hidden.
- **No AI safety review** of the output since 2026-11-03 (removed for speed: it doubled waiting time).
  **Planned option:** an AI check that runs after streaming, while the parent reads.
- The word list can be avoided with spelling tricks (in the form). Prompt rules are the main protection.
- The AI can make mistakes. Parents should read or listen first.

### Editing the blocked-word list
In `lib/safety.js`, add lower-case words to `BLOCKED_WORDS`. Avoid common innocent words. For example,
"kutta" (dog) and "maar" are deliberately **not** blocked. Test after editing (TESTING.md, section 4).

---

## 2. Data handling (as built)

| Data | Where it goes | Stored by us? |
|---|---|---|
| Child's name, age, language, family/pet names, favourite things, value/topic | Browser → our server (Vercel) → Google Gemini | **No.** Kept only in memory during the request. No database, no files. |
| Generated story / poem | Gemini → our server → browser | **No.** Shown in the browser only; gone when the page is closed or "New Story" is pressed. |
| Internet address (IP) + request times | Server memory, for the usage limit | Temporarily in memory only (max 1 hour of times; cleared on restart). No names. |
| Server logs | Vercel logs | Only error messages (e.g. "Generation failed: ..."). Our code never logs the child's details. |
| Cookies / analytics / tracking | — | **None** set by our code. |
| WhatsApp share | Opens WhatsApp with the title, first lines and link. The parent decides to send. | No. |
| Copy | Copies text to the parent's clipboard | No. |
| Voice | The device's built-in voices (Web Speech API) | No. Our code sends nothing to a voice service. Some devices or browsers may use their own online voices, under their own policies. |

We send `store: false` to Gemini, asking Google not to store the interaction.

Footer on every page: "🔒 We don't save your child's details." This is true for **our** server.
See the free-tier note below about Google.

---

## 3. ⚠️ Gemini free-tier data note (important)

We use the **unpaid (free) tier** of the Gemini API. Google's Gemini API Additional Terms
(checked 2026-11-03 at https://aistudio.google.com/docs/terms) say, for **Unpaid Services**:

- Google may use prompts and responses to provide, improve and develop Google products and machine-learning technologies.
- **Human reviewers may read, annotate and process** API input and output (Google says it disconnects this from your account, API key and project first).
- "Do not submit sensitive, confidential, or personal information to the Unpaid Services."
- Users of the APIs must be 18 or older, and API clients must not be "directed towards or is likely to be accessed by individuals under the age of 18."
- The free tier is for professional or business purposes, not consumer use. For users in the EEA, Switzerland or the UK, only Paid Services may be used.

**What this means for us:**
- Children's names and family names are **personal information**, and they are sent to Gemini.
  On the free tier, Google may keep and review this content, even though **our** server stores nothing.
- A children's bedtime-story site may count as "likely to be accessed by" under-18s.
- **Paid tier:** Google says it doesn't use prompts or responses to improve its products. It keeps logs
  for a limited time for abuse detection and legal reasons, under a Data Processing Addendum.
  The API counts as paid only through a Cloud project with an active billing account.

**Recommendation (before sharing beyond a small group of friends):**
1. Move to the **paid** Gemini tier (or another provider with suitable terms; `lib/ai.js` is the switch point).
2. Get legal advice on these terms for a children's product.
3. Consider letting parents use a nickname instead of the real name (Planned option).
4. Update the footer and add a privacy policy that mentions the AI provider.

---

## 4. Hosting note
- Vercel **Hobby** plan: free, for personal, non-commercial use. Upgrade before any commercial use or payments.
- The Gemini key is stored only in Vercel's encrypted environment variables and in `.env.local` on the
  developer's computer. It is excluded by `.gitignore` and `.vercelignore`, and is never in code or docs.
- Checked live: `/.env.local`, `/.env`, `/docs/...`, `/lib/ai.js`, `/package.json` all return 404.

---

## 5. Before collecting any user data (login, saved stories, email, WhatsApp numbers)

| Step | Why |
|---|---|
| Legal review (India: Digital Personal Data Protection Act, 2023, and its rules; other countries if users are outside India) | Children's data has stricter rules (for example verifiable parental consent). Confirm the current requirements with a lawyer. |
| Write a **privacy policy** and **terms of use** | Explain what is collected, why, how long, who it's shared with (AI provider, hosting, WhatsApp provider). |
| Collect **only what's needed** (data minimisation) | A story needs a first name, not a full name, school or photo. |
| **Clear, opt-in consent** from the parent | Especially for WhatsApp messages and saved stories. |
| **Delete-my-data** option | Parents must be able to remove saved stories and their account. |
| Secure storage | Encrypted database, access control, no child details in logs, backups policy. |
| **Paid AI tier** first | Avoid free-tier training and human review of children's data. |
| Breach plan | Know who to inform and how, if data leaks. |
| Age gate / parent-only accounts | Accounts for adults only; children never sign up. |

## 6. Before taking payments

| Step | Why |
|---|---|
| Upgrade hosting (Vercel Pro or similar) | Hobby is non-commercial. |
| Paid AI tier + budget alerts | Avoid surprise costs and free-tier limits. |
| Use a trusted payment gateway (e.g. Razorpay, Stripe); never store card data ourselves | Security and compliance (PCI DSS handled by the gateway). |
| Terms, refund and cancellation policy; GST/tax review | Legal and consumer requirements in India. |
| Customer support contact | Required by many payment gateways and good for trust. |
| Exact usage limits per account (shared store) | The in-memory limit is approximate. |

---

## 7. Safety checklist for every change
- [ ] No API keys or secrets in code, docs, chat or commits.
- [ ] `npm run lint` and `npm run build` pass.
- [ ] Bad-word tests still blocked (TESTING.md section 4).
- [ ] One story and one poem per language read by a person before deploying.
- [ ] Footer and docs still truthful about data handling.
