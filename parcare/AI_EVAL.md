# AI evaluation: the "meta list" (setup step e)

**What the AI does.** In setup step e the child describes the parent's day, by voice or by
typing. The AI turns that description into a short list of suggested check-ins. Each item has a
label, one of the 8 check-in types and an approximate parent-local time. The child then edits
the list. Nothing is checked until the parent consents item by item (G1), so the AI only drafts;
it never decides.

## Providers

| Provider | When | Notes |
|---|---|---|
| `MockProvider` (`src/ai/mock.ts`) | No `GEMINI_API_KEY`, and in all automated tests | Deterministic keyword and time rules for English. Free, offline. |
| `GeminiProvider` (`src/ai/gemini.ts`) | `GEMINI_API_KEY` set | Google Gemini free tier, model from `GEMINI_MODEL`. Gets a fixed instruction plus a JSON schema, temperature 0. |

Safety rails, whichever provider runs:
- Every answer goes through `sanitizeMetaList` (`src/ai/types.ts`):
  - only the 8 known types
  - only valid `HH:MM` times
  - labels of 80 characters at most
  - no duplicates
  - at most 15 items
- If Gemini fails (no network, quota used up, bad JSON), the app falls back to the mock and tells
  the child.
- The transcript is never logged (G14).
- **Only fictional data goes to Gemini.** The free tier may use inputs to improve Google's
  products. When Gemini is on, step e says so on screen.
- The instruction tells the model never to diagnose, never to give medical advice and never to
  invent events (G13).

## Evaluation set

`tests/fixtures/ai-eval.json` holds 6 fictional descriptions with the expected (type, time) pairs:

| Case | What it tests |
|---|---|
| kamla-full-day | Full routine; a medicine taken twice (08:30 and 20:30); bedtime "by 9" read as 21:00 |
| papa-short | am/pm; two events in one sentence sharing a time; a cook arriving |
| amma-dayparts | Parts of the day only ("morning", "after breakfast", "evening") → typical times; "friends at the temple" is social time, not puja |
| appointment | A one-off doctor appointment plus medicine at 1 pm |
| numbers-that-are-not-times | "78" (age) and "2 rounds" must not become times |
| nothing-to-check | No check-in events at all → empty list |
| parent-own-words | Parent app (A2): the parent speaking about herself ("I wake up…", "again at night at 9") |
| parent-three-parts | A2 with the morning / afternoon / evening fallback joined; "In the evening … at 5 and … tablet at 8" → 20:00 (this case found a real miss: the evening did not carry to the second half of the sentence; rule fixed) |
| parent-sparse | A2 with almost nothing to check: only bedtime |
| parent-again-at-night | Found by the P6 end-to-end test: "… at 8:30 and again at 8:30 at night" lost the evening tablet, and the closing "at night" moved the earlier "wake up at 6" to 18:00. Both fixed ("again" repeats the previous kind; a day-part only applies to what comes after it) |
| parent-help-and-friends | A2: help arriving, insulin at 1 pm, friends at 6 in the evening |

**How it is scored** (`src/ai/eval.ts`):
- A suggestion matches an expected item when the type is the same and the time is within 30
  minutes (null matches only null).
- Each expected item can be matched once.
- We report precision (how many suggestions were right) and recall (how many expected items were
  found).

## Follow-up questions (A3, parent app)

After the parent describes her day, the companion asks about items the **child** described that
she did not mention, **at most 3** (G4). This step is deterministic code, not AI
(`src/domain/parent-setup.ts`): an item counts as mentioned when she named the same kind of
check-in within 90 minutes of the child's time (or either has no time). Unit tests cover: the
morning dose never stands in for the evening one; at most 3 questions, earliest first; nothing is
asked when everything was mentioned. She answers Yes / No; "Yes" adds the item to her list, and
it is still checked only if she then agrees to it (G1).

## Reading her answers (parent app, P3)

When the parent answers a check-in in her own words, the app decides whether the activity
happened: **yes / no / unclear** (`classifyAnswer`: rule-based mock, or Gemini with a fixed
instruction and a one-field JSON schema; on any Gemini error the mock is used). Her words are always
stored exactly, whatever the reading; it only feeds the digest's "usual pattern" notes. Button
answers ("Yes, done", "Not today") need no AI.

Evaluation set: `tests/fixtures/answer-eval.json`, 12 fictional answers (done, not done, "not
yet", "tired but I went", Hindi "haan", answers that do not say). Mock: 12/12 (the rules were
written against these cases, so this shows they work as intended, not how well they generalise).
Gemini: not run yet.

## The evening question (parent app, P5; handoff task A6)

The last check-in of the day asks a personalised question ("How did your walk go today?"). This is
deterministic code, not AI (`src/domain/last-question.ts`): questions about her own consented
check-ins first, then general ones; never one asked in the last 7 days; no medical questions.
Unit tests check: 7 days without a repeat, every question exists and addresses her by name, none
mentions medicine, pain or health, and prompt 2 repeats the same question.

## How to run

```bat
npm test            :: includes tests/unit/ai.test.ts (mock, must stay at 100%)
npm run ai:eval     :: uses Gemini if GEMINI_API_KEY is in .env.local, otherwise the mock
```

## Results

| Date | Provider | Precision | Recall | Notes |
|---|---|---|---|---|
| 2026-11-10 | Mock | 100% | 100% (36/36) | 1 case added from the end-to-end test; two real misses fixed first. |
| 2026-11-07 | Mock | 100% | 100% (32/32) | 4 parent-app cases added (A2); one real miss found and fixed first (see parent-three-parts). |
| 2026-11-05 | Mock | 100% | 100% (18/18) | The mock's rules were written against these same cases. This shows the rules work as intended, not how well they handle new descriptions. |
| — | Gemini (`gemini-2.5-flash`) | not run yet | not run yet | Needs a free key in `.env.local`. Run `npm run ai:eval` and add a row here. |

## Known limits (honest, G17)

- **Small set.** Six cases cannot show general accuracy, and the mock was tuned on them. Before
  any claim about quality, add held-out descriptions written by teammates who have not seen the
  rules.
- **English only.** Hinglish words such as "puja", "bai" and "satsang" are partly covered; Hindi
  is a later phase.
- **Typical times are guesses.** For "morning" or "evening", the mock picks a fixed typical time.
  The child (and later the parent) is expected to correct it.
- **Speech errors carry through.** Mistakes in browser speech-to-text end up in the transcript.
  The child sees and can edit the text before the list is made.
