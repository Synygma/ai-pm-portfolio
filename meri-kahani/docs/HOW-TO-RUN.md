# How to Run — Meri Kahani

## 🌐 Live website
**https://meri-kahani-nine.vercel.app**  (Vercel project `meri-kahani`, team `checkmate16`, free Hobby plan)
Share this link with friends. See "Putting the website online (Vercel)" at the bottom for how to update it.

> Before sharing widely, read the free-tier data note in [SAFETY-AND-PRIVACY.md](SAFETY-AND-PRIVACY.md).
> All documents: [README.md](README.md). Test checklist: [TESTING.md](TESTING.md).

## What you need first (one time only)
- **Node.js** (version 20 or newer). Check by typing `node -v` in a terminal.
  This project was set up with Node.js 24.

## First time only: install the packages
Open a terminal in the project folder (`C:\Users\PRAVIN\Desktop\stories`) and run:

```
npm install
```

This downloads the building blocks the website needs into a `node_modules` folder.

## Start the website on your computer
In the project folder, run:

```
npm run dev
```

Then open this link in your browser: **http://localhost:3000**

To stop the website, go back to the terminal and press **Ctrl + C**.

## Open it on your phone
1. Your phone and computer must be on the **same Wi-Fi**.
2. When you run `npm run dev`, the terminal shows a line like
   `Network: http://192.168.x.x:3000`.
3. Type that link into your phone's browser.

## Secret key (Gemini)
The AI key goes in this file:
`C:\Users\PRAVIN\Desktop\stories\.env.local`

It has one line. Paste your key right after the `=` sign, with no spaces or quotes:

```
GEMINI_API_KEY=your-key-here
```

Save the file, then restart the website (Ctrl + C, then `npm run dev` again).
This file is never saved to git, so your key stays private.
You can get a free key from Google AI Studio (aistudio.google.com).

## The pages
- **http://localhost:3000**: home page, choose 📖 Bedtime Story or 🎉 Fun Poem
- **http://localhost:3000/kahani**: bedtime story
- **http://localhost:3000/kavita**: fun poem

## Making a story or poem
1. Start the website (`npm run dev`) and open http://localhost:3000
2. Choose a card, fill the form, and press **Create Story** or **Create Poem**.
3. The first words appear in about 2 seconds and the text grows as it is written. A story is finished
   in about 5 seconds, a poem in about 2 (measured 2026-11-03). The **Listen** button turns on when it's finished.
4. If you see "...busy right now. Please try again in a little while", the free AI limit was reached or Google is busy.
   Wait a few minutes and try again.
5. Each person can make **5 per hour in total** (stories + poems together). After that: "That's a lot of stories for now!..."
   While testing on your own computer, restarting the website (Ctrl + C, then `npm run dev`) resets this count.

## Sharing
- **Share on WhatsApp** opens WhatsApp with the title, the first few lines and the website link.
  On your own computer the link is a "localhost" link that only works for you; on the live website it is the real public link.
- **Copy** copies the full story or poem, to paste anywhere.

## Listening to a story
- Below the story or poem, press **▶️ Listen**. Use **Pause** and **Stop** as needed.
- Choose **Slow** (bedtime, default) or **Normal** speed.
- Use **Google Chrome** (on Android or computer) for best results.
- No sound? Check the phone isn't on silent, and turn up the media volume.
- No Hindi or Marathi voice? On Android go to Settings → search "Text-to-speech" →
  Speech Services by Google → Install voice data → download Hindi / Marathi.

## Editing how stories and poems are written
- Stories: open `lib/storyPrompt.js`
- Poems: open `lib/poemPrompt.js`

Change the rules in plain English and save the file. The next story or poem uses the new rules.

## Putting the website online (Vercel)

The website is online at **https://meri-kahani-nine.vercel.app**.
We use the Vercel tool (CLI) on this computer. No GitHub needed.

### One-time setup (already done on 2026-11-03)
1. **Install the Vercel tool:** `npm install -g vercel`
2. **Log in the Vercel tool:** run `vercel login`. It shows a link with a code
   (like `https://vercel.com/oauth/device?user_code=XXXX-XXXX`). Open it, check the code,
   choose your team, and click **Confirm**.
   Note: being logged in on the Vercel *website* is not enough. The *tool* needs its own login.
   Check with `vercel whoami` (it should show your username, not "Logged out").
3. **Create and link the project** (in the project folder):
   `vercel project add meri-kahani` then `vercel link --yes --project meri-kahani`
   (This also adds a `VERCEL_OIDC_TOKEN` line to `.env.local`. That's normal and stays private.)
4. **Add the Gemini key to Vercel (you do this yourself, never in chat):**
   - Open https://vercel.com/checkmate16/meri-kahani/settings/environment-variables
   - Key: `GEMINI_API_KEY`
   - Value: paste your key (the part after `GEMINI_API_KEY=` in `.env.local`)
   - Environments: tick **Production** (and Preview). Click **Save**.
   - Check (shows names only, never the key): `vercel env ls`

### Every time you want to update the live website
In the project folder, run:
```
vercel deploy --prod --yes
```
Wait about 1 minute. At the end it shows `Production URL: https://meri-kahani-nine.vercel.app`.
If you change the key in the Vercel dashboard, run this command again so the website uses the new key.

### What is NOT uploaded
`.vercelignore` lists files Vercel must never receive: `.env.local` and all `.env*` files (secret keys),
`node_modules`, `.next`, `.git`, `docs`, `CLAUDE.md`, `AGENTS.md`.
On the live site, `/.env.local`, `/docs/...` and the code files all give "not found" (404).

### Good to know (free Hobby plan)
- The first story or poem after the site has been quiet for a while can take ~10 seconds
  (Vercel "waking up"). After that: first words in ~2 s, finished in ~3–5 s.
- The usage limit (5 per hour per person) is counted separately by each Vercel server copy,
  so it is approximate online.
- `vercel.json` tells Vercel this is a Next.js website. Without it, the first deploy failed
  ("The Output Directory 'public' is empty").
