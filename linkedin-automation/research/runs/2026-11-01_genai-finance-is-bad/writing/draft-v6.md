# Draft v6: GenAI in finance: the modeling gap (FINAL, reviewed)
- Run: research/runs/2026-11-01_genai-finance-is-bad/
- Date: 2026-11-01 · Format: text · Post type: Contrarian field note · Hook pattern: Number + consequence
- Status: final

## Post
```
The best AI score on financial modeling tasks is 57.0%.
On earnings analysis it's 93.0%. Same benchmark.

Both numbers come from Vals AI's Finance Agent v2.1 benchmark (October 2026). The questions are analyst-style and reviewed by finance experts, and missing one critical fact can score an answer as zero.

Where models do well: pulling facts from filings and summarizing results.

Where they break: normalizing numbers, deal conventions, multi-step models. Precedent transactions top out at 49.3%. Financial modeling, 57.0%.

Academic work points the same way. Fin-RATE, a benchmark from Yale-affiliated researchers built on 2,472 SEC filings, found that even with the right documents supplied, the best models reached only 43–44% on cross-company and multi-year questions.

Adoption is running slower than planned, too. In Gartner's March 2026 survey of 204 finance leaders, 63% said AI implementation was slower than expected in 2025.

The upside is real, though. In the same survey, 66% of finance teams using AI named efficiency and productivity as a top benefit.

My read: GenAI isn't bad at finance. It's bad at the part of finance where one wrong number costs money.

If you build for finance teams, ship retrieval-plus-citation and drafting now, with source links a human can check. Keep multi-step calculations and anything that feeds a forecast on deterministic tools, with a human signing off.

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
| 1 | The best AI score on financial modeling tasks is 57.0%. / On earnings analysis it's 93.0%. Same benchmark. | Number + consequence | 104 | Chosen (v2.1 data; 'Same benchmark.' per editorial) |
| 2 | (dropped: mixes original 2025 Vals figures with v2.1; editorial advice) | — | — | Rejected |
| 3 | The best AI scores 93% on earnings analysis and 57% on financial modeling. The benchmarks show where the line is. | Number + consequence | ~112 | Alternative (replaces the "summarize an earnings call" wording, per C23) |

## Changes from previous version
Delta re-check of the editorial edits (review/panel-v4.md):
- "It shows up outside the benchmarks too." → "Adoption is running slower than planned, too." (fact-checker C5 + compliance #1; compliance wording wins)
- "Keep calculations" → "Keep multi-step calculations" (fact-checker advisory)
- Hooks table row 1 updated (compliance #4)

## Quality check (check_post.py)
```
INFO  Total length: 1509 chars
INFO  Hook (first 2 non-empty lines): 104 chars
WARN  Outside the ideal 900-1500 char range for text posts.
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
- Fact-checker: **BLOCK** → FIX → FIX (delta) · round 1: 24 claims, the Vals v2 figures were out of date (v2 archived and replaced by v2.1) → switched to current v2.1 data; round 2: 18 claims, 2 wording fixes; editorial delta: 7 claims, 1 framing fix · reports: review/panel-v2.md, panel-v3.md, panel-v4.md
- Compliance: FIX → PASS → PASS (delta) · 1 must-fix ("written by" → "reviewed by" experts) applied; idiom, attribution and dating advisories applied; no escalations; disclosure question open for the author · same reports
- Editorial: EDITED · avg score 4.0 → 4.3 · 5 changes · length 1,661 → about 1,500 · report: review/panel-v4.md
- Rounds: 2 + editorial delta · Final draft: v6 · log: review/review-log.md
