# Draft v2: GenAI in finance: the modeling gap
- Run: research/runs/2026-11-01_genai-finance-is-bad/
- Date: 2026-11-01 · Format: text · Post type: Contrarian field note · Hook pattern: Number + consequence
- Status: superseded by v3 (review-panel round-1 BLOCK: out-of-date Vals v2 figures)

## Post
```
The best AI score on financial modeling tasks is 34.5%.
On earnings analysis it's 79.1%. That gap is the real GenAI-in-finance story.

Both numbers come from Vals AI's Finance Agent v2 benchmark (August 2026). The questions are analyst-style and written by finance experts, and one wrong load-bearing fact can zero an answer.

Where models do well: pulling facts from filings and summarizing results. General quantitative analysis tops out at 81.8%.

Where they break: normalizing numbers, deal conventions, multi-step models. Precedent transactions score 36.4%. Financial modeling, 34.5%.

Academic work agrees. Fin-RATE, a Yale-led benchmark built on 2,472 SEC filings, found the best setup (GPT-5 with web search) reached only 43–44% accuracy.

Finance leaders are feeling it too. In Gartner's March 2026 survey of 204 finance leaders, 63% said AI implementation was slower than expected. Forecasting and insight generation were among the lowest-rated use cases for impact.

The upside is real, though. In the same survey, 66% of finance teams using AI named efficiency and productivity as a top benefit.

My read: GenAI isn't bad at finance. It's bad at the part of finance where one wrong number costs money.

If you build for finance teams, ship retrieval and drafting now. Keep calculations and anything that feeds a forecast on deterministic tools, with a human signing off.

For those running AI in FP&A or accounting: which task did you pull back from the model, and what replaced it?
```

## Hooks considered
| # | Hook | Pattern | Chars | Status |
|---|---|---|---|---|
| 1 | The best AI score on financial modeling tasks is 34.5%. / On earnings analysis it's 79.1%. That gap is the real GenAI-in-finance story. | Number + consequence | 133 | Chosen: two real numbers, and the tension resolves below the fold |
| 2 | Finance experts wrote 537 analyst questions for AI. The best model got 46.8% right, at $3.79 a question. | Test result | ~105 | Alternative: 2025 data, less fresh |
| 3 | AI can summarize an earnings call better than it can build the model behind it. The benchmarks show by how much. | Paradox | ~112 | Alternative |
| v1 | GenAI is bad at the part of finance that matters most: the numbers. / We tested [model]... | Test result (placeholders) | 140 | Rejected: needed the user's private data |

## Changes from previous version
Rewritten from verified industry evidence (Vals Finance Agent v2, Fin-RATE, Gartner May 2026). Placeholders removed and first-person 'we tested' framing dropped. Trimmed one phrase to stay within 1,500 characters.

## Quality check (check_post.py)
```
INFO  Total length: 1494 chars
INFO  Hook (first 2 non-empty lines): 133 chars
RESULT PASS
```

## Overlap check (check_overlap.py)
```
INFO  Compared against 0 published post(s) in C:\Users\PRAVIN\Desktop\LinkedInAutomation\posts
INFO  No published posts yet. Nothing to overlap with.
RESULT PASS
```

## Overlap judgement
No posts were marked as published when this draft was made (or at migration on 2026-11-01), so there was nothing to overlap with. Overall overlap: 0%.
