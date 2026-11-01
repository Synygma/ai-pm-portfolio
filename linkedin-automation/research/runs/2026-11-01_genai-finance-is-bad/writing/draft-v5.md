# Draft v5: GenAI in finance: the modeling gap (editorial edits applied)
- Run: research/runs/2026-11-01_genai-finance-is-bad/
- Date: 2026-11-01 · Format: text · Post type: Contrarian field note · Hook pattern: Number + consequence
- Status: superseded by v6 (delta re-check fix)

## Post
```
The best AI score on financial modeling tasks is 57.0%.
On earnings analysis it's 93.0%. Same benchmark.

Both numbers come from Vals AI's Finance Agent v2.1 benchmark (October 2026). The questions are analyst-style and reviewed by finance experts, and missing one critical fact can score an answer as zero.

Where models do well: pulling facts from filings and summarizing results.

Where they break: normalizing numbers, deal conventions, multi-step models. Precedent transactions top out at 49.3%. Financial modeling, 57.0%.

Academic work points the same way. Fin-RATE, a benchmark from Yale-affiliated researchers built on 2,472 SEC filings, found that even with the right documents supplied, the best models reached only 43–44% on cross-company and multi-year questions.

It shows up outside the benchmarks too. In Gartner's March 2026 survey of 204 finance leaders, 63% said AI implementation was slower than expected in 2025.

The upside is real, though. In the same survey, 66% of finance teams using AI named efficiency and productivity as a top benefit.

My read: GenAI isn't bad at finance. It's bad at the part of finance where one wrong number costs money.

If you build for finance teams, ship retrieval-plus-citation and drafting now, with source links a human can check. Keep calculations and anything that feeds a forecast on deterministic tools, with a human signing off.

Running AI in FP&A or accounting? Which task did you pull back from the model, and what replaced it?
```

## First comment
```
Sources:
• Vals AI Finance Agent v2.1 (updated Oct 2026): https://www.vals.ai/benchmarks/fabv2-1
• Fin-RATE paper (Feb 2026): https://arxiv.org/html/2602.07294
• Gartner finance AI survey (fielded Mar 2026, published May 2026), via CPA Practice Advisor: https://cpapracticeadvisor.com/2026/05/28/gartner-says-cfos-must-stop-mistaking-finance-ai-deployment-for-value-creation/184094

One more detail from Fin-RATE: with retrieval (RAG) instead of hand-picked documents, every model tested scored below 27%. Getting the right document in front of the model is still half the problem.
```

## Hooks considered
| # | Hook | Pattern | Chars | Status / why |
|---|---|---|---|---|
| 1 | The best AI score on financial modeling tasks is 57.0%. / On earnings analysis it's 93.0%. That gap is the real GenAI-in-finance story. | Number + consequence | ~132 | Chosen. Updated to current Vals v2.1 data (fact-checker C1/C2 BLOCK) |
| 2 | (dropped: mixes original 2025 Vals figures with v2.1; editorial advice) | — | — | Rejected |
| 3 | The best AI scores 93% on earnings analysis and 57% on financial modeling. The benchmarks show where the line is. | Number + consequence | ~112 | Alternative (replaces the "summarize an earnings call" wording, per C23) |

## Changes from previous version
Editorial (review/panel-v4.md), avg 4.0 → 4.3:
1. "That gap is the real GenAI-in-finance story." → "Same benchmark." (scopes the hook above the fold)
2. Cut the locked sentence "General quantitative analysis tops out at 87.8%." (it didn't fit the 'do well' line)
3. "Finance leaders are feeling it too." → "It shows up outside the benchmarks too."
4. Cut the locked sentence "Forecasting and insight generation were among the lowest-rated use cases for impact." (length)
5. CTA: "Running AI in FP&A or accounting? Which task…"
The remaining locked sentences are verbatim. Alt hook 1 dropped.

## Quality check (check_post.py)
```
INFO  Total length: 1492 chars
INFO  Hook (first 2 non-empty lines): 104 chars
RESULT PASS
```

## Overlap check (check_overlap.py)
```
INFO  Compared against 0 published post(s) in C:\Users\PRAVIN\Desktop\LinkedInAutomation\posts
INFO  No published posts yet. Nothing to overlap with.
RESULT PASS
```

## Overlap judgement
No posts are marked as published, so there's nothing to overlap with. Overall overlap: 0%.

## Views alignment
- This run was written before my-views.md existed. The finance topic is outside the listed domains D1/D2 (noted by both fact-checker and compliance).
- No opinion is contradicted. O3 (productivity) is consistent with "66% … efficiency" and "the upside is real". O4 (process work) is consistent with the build advice. O1/O2 are not touched.
- The opinion is first-person ("My read").

## Review panel
(pending: delta re-check)
