# Testing — Meri Kahani

Manual test checklist. There are **no automated tests yet** (Planned).
Run these locally (`npm run dev` → http://localhost:3000) and/or on the live site
(https://meri-kahani-nine.vercel.app).

> **Free limit reminder:** each story or poem uses one AI request, and the website allows **5 per hour**
> per internet address (stories + poems together). Plan your tests. Locally, restarting `npm run dev` resets the website's counter.
> Tests that don't call the AI (sections 1, 4 and parts of 9) don't use the limit.

Tick each box: ✅ pass · ❌ fail (write what happened).

---

## 0. Before testing
- [ ] `npm run lint` shows no errors
- [ ] `npm run build` finishes successfully
- [ ] `.env.local` has `GEMINI_API_KEY=` filled (check it's filled without showing the value)
- [ ] Use Google Chrome (Android phone + computer if possible)

## 1. Home and navigation
- [ ] `/` shows the moon, "Meri Kahani", "What shall we make today? ✨"
- [ ] Two cards: "📖 Bedtime Story" and "🎉 Fun Poem"
- [ ] Bedtime Story card opens `/kahani` (night sky); Fun Poem card opens `/kavita` (bright colours)
- [ ] "← Home" on both pages returns to `/`
- [ ] Footer "🔒 We don't save your child's details." on all 3 pages
- [ ] Phone width: no sideways scrolling; buttons large and easy to tap
- [ ] All interface text is English (no Hinglish)

## 2. Story (one per language)
Use e.g. name "Aarav", age 5, family "Dadi, dog Bruno", favourites "cricket, mango".

| Check | English | Hindi | Marathi |
|---|---|---|---|
| "Creating your story... 🌙" shows, button disabled | [ ] | [ ] | [ ] |
| First words within ~3 s | [ ] | [ ] | [ ] |
| Text grows word by word; "✍️ Still writing..." shown | [ ] | [ ] | [ ] |
| Listen greyed out while writing | [ ] | [ ] | [ ] |
| Finished within ~30 s | [ ] | [ ] | [ ] |
| Title on top, then paragraphs | [ ] | [ ] | [ ] |
| Correct language; Hindi/Marathi in Devanagari | [ ] | [ ] | [ ] |
| Uses child's name, family/pet, favourites | [ ] | [ ] | [ ] |
| Indian setting; value shown without a lecture | [ ] | [ ] | [ ] |
| Calm, sleepy ending; nothing scary or sad | [ ] | [ ] | [ ] |
| Roughly 450–600 words | [ ] | [ ] | [ ] |
| Listen, Share on WhatsApp, Copy, New Story appear at the end | [ ] | [ ] | [ ] |

## 3. Poem (one per language)
| Check | English | Hindi | Marathi |
|---|---|---|---|
| "Creating your poem... 🎶"; lines appear one by one | [ ] | [ ] | [ ] |
| Title + 3–4 verses × 4 lines (12–16 lines) | [ ] | [ ] | [ ] |
| Rhymes, fun rhythm, real words | [ ] | [ ] | [ ] |
| Chosen topic used (try "Surprise me" once) | [ ] | [ ] | [ ] |
| Names in Devanagari for Hindi/Marathi | — | [ ] | [ ] |
| Listen default speed = Normal | [ ] | [ ] | [ ] |
| Share on WhatsApp, Copy, New Poem appear at the end | [ ] | [ ] | [ ] |

## 4. Input safety (no AI used)
| Input | Expected message | Result |
|---|---|---|
| Name "Aarav123" | "Please use letters only in the name (no numbers or symbols)." | [ ] |
| Name of 35 letters (the box stops at 30; send via a tool to test the server) | "Please keep the name to 30 letters or fewer." | [ ] |
| Name "आरव कुमार" (Hindi with a space) | Accepted | [ ] |
| Favourites "cricket and a gun" | "Please use kind words. This is for young children. 🙏" | [ ] |
| Family with a Hindi swear word (Latin letters) | Same polite message | [ ] |
| Favourites "skill" | Accepted (not blocked) | [ ] |
| Box over 100 characters (via a tool) | "Please keep each box to 100 letters or fewer." | [ ] |
| Wrong value/topic (via a tool) | "Please fill the form properly." | [ ] |

## 5. Output safety
- [ ] Read several stories/poems: nothing scary, violent, romantic, sad, no brands or celebrities
- [ ] (Developer test) temporarily add a common word (e.g. "mango") to `BLOCKED_WORDS`, create a story
      about mangoes → text disappears and "Sorry, we couldn't create a good story this time..." shows.
      **Remove the word afterwards.**

## 6. Voice (Listen)
| Check | Android Chrome | Desktop Chrome |
|---|---|---|
| English story read with an Indian English voice | [ ] | [ ] |
| Hindi story read with a Hindi voice | [ ] | [ ] |
| Marathi: Marathi voice, or Hindi voice + note "This device has no Marathi voice..." | [ ] | [ ] |
| Whole story read to the end without stopping midway | [ ] | [ ] |
| Pause → "▶️ Continue Listening" continues near the same place | [ ] | [ ] |
| Stop → next Listen starts from the beginning | [ ] | [ ] |
| Slow vs Normal speed sounds different | [ ] | [ ] |
| Pressing New Story while playing stops the voice | [ ] | [ ] |
| A short pause between title and story | [ ] | [ ] |

## 7. Sharing and New
- [ ] Share on WhatsApp opens WhatsApp with 🌙/🎉 + title + first lines + "Create a story like this for your child: <link>"
- [ ] On the live site the link is `https://meri-kahani-nine.vercel.app/kahani` (or `/kavita`)
- [ ] Copy → "Story copied ✓" / "Poem copied ✓"; pasting gives the full text
- [ ] Copy works on a phone opening the local site via the Wi-Fi address (backup copy method)
- [ ] New Story / New Poem clears the result, scrolls to the form, details still filled in

## 8. Usage limit
- [ ] 6th story/poem within an hour (same address) shows "That's a lot of stories for now! Please try again in a little while 🌙" (poem page: "...poems... 🎉")
- [ ] Stories and poems share the same 5
- [ ] Forms refused for bad words do **not** count
- [ ] Note: testing this locks your address for up to an hour (live), so test locally where a restart resets it

## 9. Errors and edge cases
- [ ] Turn off internet → press Create → "Please check your internet and try again."
- [ ] Remove the key locally (and restart) → "Sorry, the story couldn't be created..." (put the key back!)
- [ ] When Gemini is busy/out of limit → "The story maker is busy right now..."
- [ ] Double-tapping Create while writing does nothing (button disabled)
- [ ] Leaving the page while writing doesn't break the next visit

## 10. Deployment and privacy (live site)
- [ ] https://meri-kahani-nine.vercel.app opens without any login
- [ ] `/.env.local`, `/.env`, `/docs/PLAN.md`, `/CLAUDE.md`, `/lib/ai.js`, `/package.json` → 404
- [ ] Page source contains no API key
- [ ] `vercel env ls` shows `GEMINI_API_KEY` for Production (value "Hidden")
- [ ] Vercel logs don't contain children's names

---

## Results so far (2026-11-03, from PROGRESS.md)
| Area | Result |
|---|---|
| Lint / build | ✅ Pass |
| Input safety (6 cases) + Hindi name | ✅ Pass (via direct requests) |
| Usage limit logic | ✅ Pass locally (5 allowed, 6th blocked, other person allowed, resets after 1 hour); not tested live |
| Story streaming | ✅ Local Hindi 1.8 s / 4.4 s; live English 1.7 s / 4.5 s |
| Poem streaming | ✅ Local Hindi 1.2 s / 1.7 s; live 9.3 s (first request), then 2.4 s / 3.0 s |
| Live pages + secret files 404 | ✅ Pass |
| Voice by ear on real devices | ⬜ Not done yet |
| Buttons clicked in a real browser (Share, Copy, New, Listen) | ⬜ Not done yet (the browser tool wasn't available) |
| Parent testing (Plan Step 5) | ⬜ Not started |
