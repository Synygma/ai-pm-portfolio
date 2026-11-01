# Draft v1: GenAI for finance: the numbers problem (placeholder version)
- Run: research/runs/2026-11-01_genai-finance-is-bad/
- Date: 2026-11-01 · Format: text · Post type: Contrarian field note · Hook pattern: Test result
- Status: superseded by v2 (needed the user's private data; rewritten from industry research)

## Post
```
GenAI is bad at the part of finance that matters most: the numbers.
We tested [model] on [N] [finance task]. [X] of them had a wrong figure.

Context: I'm [your role] at [type of company]. We ran this for [time period] before deciding whether to roll it out to [team].

How we tested:
Every output was checked line by line against [source of truth, e.g. the GL or the approved Excel model].

What went wrong:
→ [failure 1, e.g. a subtotal that didn't tie to the ledger]
→ [failure 2, e.g. a prior-period figure quoted as current]

The worst part was that the wrong answers read exactly as confidently as the right ones. Our reviewers caught [Y] of the [X] errors.

Where it did help:
[task where it worked, e.g. drafting variance commentary from numbers we supplied]. That saved [time saved] per [cycle], with no change to accuracy, because the model never produced a number itself.

So my rule for finance teams is simple.
Let the model write the words. Let deterministic systems produce the numbers.

If you've put GenAI into a finance workflow: which task did you pull it back from, and what replaced it?
```

## Hooks considered
| # | Hook | Pattern | Chars | Status |
|---|---|---|---|---|
| 1 | The best AI score on financial modeling tasks is 34.5%. / On earnings analysis it's 79.1%. That gap is the real GenAI-in-finance story. | Number + consequence | 133 | Chosen: two real numbers, and the tension resolves below the fold |
| 2 | Finance experts wrote 537 analyst questions for AI. The best model got 46.8% right, at $3.79 a question. | Test result | ~105 | Alternative: 2025 data, less fresh |
| 3 | AI can summarize an earnings call better than it can build the model behind it. The benchmarks show by how much. | Paradox | ~112 | Alternative |
| v1 | GenAI is bad at the part of finance that matters most: the numbers. / We tested [model]... | Test result (placeholders) | 140 | Rejected: needed the user's private data |

## Changes from previous version
First draft. Written from the user's context, with [placeholders] for every fact.

## Quality check (check_post.py)
```
INFO  Total length: 1107 chars
INFO  Hook (first 2 non-empty lines): 140 chars
WARN  First-person experience phrase 'We tested': allowed only if the user supplied that experience.
FAIL  16 placeholder(s) found; the post must be final: [model], [N], [finance task], [X], [your role], [type of company], [time period], [team], [source of truth, e.g. the GL or the approved Excel model], [failure 1, e.g. a subtotal that didn't tie to the ledger], [failure 2, e.g. a prior-period figure quoted as current], [Y], [X], [task where it worked, e.g. drafting variance commentary from numbers we supplied], [time saved], [cycle]
RESULT FAIL
```

## Overlap check (check_overlap.py)
```
INFO  Compared against 0 published post(s) in C:\Users\PRAVIN\Desktop\LinkedInAutomation\posts
INFO  No published posts yet. Nothing to overlap with.
RESULT PASS
```

## Overlap judgement
No posts were marked as published when this draft was made (or at migration on 2026-11-01), so there was nothing to overlap with. Overall overlap: 0%.
