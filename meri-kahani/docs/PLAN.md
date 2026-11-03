# Build Plan — Meri Kahani

We build the website in 5 steps. Each step is done in small pieces, with
approval before moving on.

> Status 2026-11-03: Steps 1–4 are done (MVP live at https://meri-kahani-nine.vercel.app). Step 5 is next.
> What comes after the MVP: [ROADMAP.md](ROADMAP.md). Test checklist: [TESTING.md](TESTING.md). All docs: [README.md](README.md).

## Step 1: Story generator
- [x] Create the Next.js website (App Router, JavaScript, Tailwind) — done 2026-11-03 ("Step 2A")
- [x] A simple form: child's name, age (2–10), language (English / Hindi / Marathi),
      family/pet names (optional), favourite things, value to teach, and a "Create Story" button (was "Kahani Banao").
      For now the button just shows the form data below the form (no AI yet).
- [x] Send the details to an AI model and get back a bedtime story — done 2026-11-03 ("Step 2B", Google Gemini free tier)
- [x] Show the story nicely on the page (big text, loading message, friendly error message)
- [ ] Try stories in all 3 languages and fine-tune the instructions in `lib/storyPrompt.js`

## Step 2: Voice
- [x] Add a "▶️ Listen" button with Pause and Stop, and a Slow/Normal speed choice — done 2026-11-03 ("Step 3", browser's free built-in voice)
- [x] Pick the voice by language (en-IN / hi-IN / mr-IN), Hindi voice as backup for Marathi
- [ ] Test by ear on a real Android phone (Chrome) and desktop Chrome, in all 3 languages

## Step 3: Safety & sharing — done 2026-11-03 ("Step 4")
- [x] Input safety: name max 30 letters only; other boxes max 100; bad words blocked
- [x] Story safety: strict rules in the prompts + fast word check on the finished text (the AI check was removed for speed)
- [x] Usage limit: max 5 stories per person per hour (no login)
- [x] Privacy: nothing saved on the server; footer line says so
- [x] Sharing: "Share on WhatsApp" and "Copy"
- [x] "New Story" / "New Poem" button (keeps the child's details filled in)
- [x] Speed: first words in ~2 s, full story in ~5 s (was ~85 s) — streaming, minimal thinking, Flash-Lite, no retries
- [ ] Check story quality with Flash-Lite in all 3 languages (stories now 450–600 words)

## Extra: Fun Poem (Masti Kavita) — added 2026-11-03
- [x] Home page with two cards: 📖 Bedtime Story (/kahani) and 🎉 Fun Poem (/kavita)
- [x] Separate poem page, form, server route and instructions (`lib/poemPrompt.js`); bright colours
- [x] Voice (Normal speed), WhatsApp, Copy, usage limit and safety work on both pages
- [ ] Improve poem quality (rhymes, made-up words) after trying more poems

## Extra: Website text in simple English — done 2026-11-03
- [x] All buttons, labels and messages in simple English; only the story/poem uses the chosen language

## Step 4: Deploy — done 2026-11-03
- [x] Put the website on the internet: **https://meri-kahani-nine.vercel.app** (Vercel Hobby, CLI deploy)
- [x] Store API keys safely on the hosting service: `GEMINI_API_KEY` set in Vercel (Production + Preview)
- [ ] Optional later: connect GitHub for automatic deploys; a shared store for an exact usage limit

## Step 5: Testing with parents (next)
- [ ] Run the manual checklist in [TESTING.md](TESTING.md) (voice by ear on real phones is still open)
- [ ] Decide on the Gemini free-tier data terms before sharing beyond friends ([SAFETY-AND-PRIVACY.md](SAFETY-AND-PRIVACY.md))
- [ ] Ask a few real parents to try it
- [ ] Collect their feedback
- [ ] Fix the most important problems
