# ParCare child app: approved plan

Approved by the user on 2026-11-03 (P-002, "approved"). The build spec itself is `CLAUDE.md`;
this file records the plan and the decisions behind it.

## Folder structure

```
/                         Next.js 16 app at root
├─ CLAUDE.md              build spec (source of truth)
├─ README.md              Windows Command Prompt instructions, demo logins, demo walkthrough
├─ .env.example           every variable, with where to get it
├─ assets/source/         APP_Icon.jpg, avataar_sample_icons.png (originals)
├─ docs/  source/ PLAN.md PROMPTS_LOG.md AI_EVAL.md
├─ messages/en.json       every user-facing string
├─ scripts/               make-icons.mjs, crop-avatars.mjs, seed-supabase.mjs
├─ supabase/migrations/   0001_init.sql (tables + RLS + storage bucket)
├─ public/  icons/ avatars/<id>.webp sw.js
├─ src/
│  ├─ app/                routes + api/tick, api/push, api/ai/*
│  ├─ components/wa/      TopBar, ChatList, Bubble, VoiceNote, InputBar, AvatarCircle (+ helper badge)
│  ├─ config/             brand.ts, emergency-words.ts, terms.ts, escalation defaults
│  ├─ domain/             PURE logic: engine/, digest/, review/, emergency/, timezone/, consent/
│  ├─ data/               repository interfaces + adapters/memory + adapters/supabase + seed/
│  ├─ ai/                 AiProvider, GeminiProvider (@google/genai), MockProvider
│  ├─ speech/             SpeechProvider, WebSpeechProvider, typed fallback
│  ├─ i18n/               next-intl config
│  └─ push/               web-push wrapper
├─ tests/unit/  tests/e2e/
└─ .github/workflows/ci.yml
```

## Routes

`/` entry · `/parent` + `/p/[token]` placeholder · `/login` · `/setup/[step]` · `/home` (tabs Chats,
Digest, Helper, Reminders, Settings) · `/chat/avatar` · `/alarm/[alertId]` · `/alerts` · `/terms` ·
`/can-cannot` · `/demo` (DEMO_MODE only) · `/avatars-preview` (temporary, C1).

## Key design choices

- **Engine:** `advance(state, now) → actions[]`, pure. Plans each day's check-ins from active consents
  in the parent's time zone; moves check-ins through prompt1 → prompt2 → child alarm using the
  parent's gaps; fires review prompts, the all-disabled alert and the digest at the child's local time.
  `/api/tick` loads state, runs it, applies actions (safe to run twice), sends push.
- **Digest:** pattern flags and quote selection in code; Gemini only phrases. Output is checked:
  every quote must appear exactly in stored responses; diagnosis words are blocked. On failure → Mock template.
- **Emergency words:** config list, deterministic match with exclusions ("fell asleep", "help arrived").
- **Alarm:** Web Audio generated sound (no asset), Screen Wake Lock, one tap to unlock sound.
- **Invite token:** random, only its hash stored, expires, single use.

## Decisions (answers to the plan questions)

| # | Question | Decision |
|---|---|---|
| 1 | Node/Git | Installed by the user (Node 26, Git 2.56). CI uses Node 24 LTS. |
| 2 | In-memory adapter on Vercel | In-memory for local + tests (dev snapshot in `.data/dev-db.json`); deployed URL requires Supabase. |
| 3 | "My Child" picture | Use the provided image as specified. |
| 4 | Deity companions | Always "<Name>, your ParCare AI companion"; the AI never claims to be the deity or a person. |
| 5 | Digest timing | Default 19:00 child local time, covering the parent's previous 24 hours. |
| 6 | Voice retention | 30 days, stated in the T&C. |
| 7 | Seed reminder audio | Generated tone + transcript, labelled "sample". |
| 8 | Supabase inactivity pause | Documented in README. |

## Sub-slices

C0 housekeeping · C1 brand assets · C2 data layer · C3 shell · C4 setup wizard + AI ·
C5 engine/tick/demo/alarm/push · C6 digest · C7 helper + reminders · C8 settings, review prompts,
all-disabled, T&C, final e2e, README. Stop for the user's OK after each.
