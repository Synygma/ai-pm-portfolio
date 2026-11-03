# Meri Kahani — Project Rules for Claude

## What we are building
"Meri Kahani" is a simple **website** (not a Play Store app). It opens in the
browser on phones and computers. Indian parents enter their child's details and
get a personalized bedtime story in **English, Hindi or Marathi**, with their
child as the hero. We use **Next.js** only as the tool to build the website.

## How to work with me
1. **Simple English.** I am a beginner. Explain things in plain, simple words.
   Avoid jargon. If a technical word is needed, explain what it means.
2. **Small steps.** Do one small step at a time. After each step, stop, explain
   what you did, and **wait for my approval** before moving on.
3. **Update the docs after EVERY change.** After any change, update:
   - `docs/PROGRESS.md` — add a dated entry of what we did.
   - `docs/DECISIONS.md` — if we made an important choice, write it and why.
   - `docs/PLAN.md` — tick off finished items or adjust the plan.
   - `docs/HOW-TO-RUN.md` — if the way to start or run the project changed.
4. **Never put API keys or secrets in code.** Keep them only in `.env.local`.
   `.env.local` must never be committed to git (it is listed in `.gitignore`).
5. **Do NOT use git or make commits until I ask.** No `git add`, `git commit`,
   or other git commands. We will commit at the end, when I say so.

## Docs folder
Start at `docs/README.md` (index of all documents).
- `docs/PLAN.md` — the 5 build steps
- `docs/PROGRESS.md` — dated log of what we did
- `docs/DECISIONS.md` — important choices and why
- `docs/HOW-TO-RUN.md` — how to start the project and deploy to Vercel
- `docs/PRD.md`, `docs/USER-FLOW.md`, `docs/ROADMAP.md` — product
- `docs/TECHNICAL-DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/AI-PROMPTS.md` — technical
- `docs/SAFETY-AND-PRIVACY.md`, `docs/TESTING.md` — safety, privacy and tests

When code changes, also update any of these that describe the changed part (only facts from the code; mark unbuilt things "Planned").
