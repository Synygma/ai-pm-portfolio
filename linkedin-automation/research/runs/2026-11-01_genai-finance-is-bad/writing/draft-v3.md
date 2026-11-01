# Draft v3: GenAI in finance: the modeling gap (panel fixes applied; current Vals v2.1 data)
- Run: research/runs/2026-11-01_genai-finance-is-bad/
- Date: 2026-11-01 · Format: text · Post type: Contrarian field note · Hook pattern: Number + consequence
- Status: superseded by v4 (round-2 fixes)

## Post
```
The best AI score on financial modeling tasks is 57.0%.
On earnings analysis it's 93.0%. That gap is the real GenAI-in-finance story.

Both numbers come from Vals AI's Finance Agent v2.1 benchmark (October 2026). The questions are analyst-style and reviewed by finance experts, and missing one critical fact can score an answer as zero.

Where models do well: pulling facts from filings and summarizing results. General quantitative analysis tops out at 87.8%.

Where they break: normalizing numbers, deal conventions, multi-step models. Precedent transactions top out at 49.3%. Financial modeling, 57.0%.

Academic work points the same way. Fin-RATE, a benchmark from Yale-affiliated researchers built on 2,472 SEC filings, found that even with the right documents supplied, the best models reached only 43–44% on cross-company and multi-year questions.

Finance leaders are feeling it too. In Gartner's March 2026 survey of 204 finance leaders, 63% said AI implementation was slower than expected in 2025. Forecasting and insight generation were among the lowest-rated use cases for impact.

The upside is real, though. In the same survey, 66% of finance teams using AI named efficiency and productivity as a top benefit.

My read: GenAI isn't bad at finance. It's bad at the part of finance where one wrong number costs money.

If you build for finance teams, ship retrieval-plus-citation and drafting now, with source links a human can check. Keep calculations and anything that feeds a forecast on deterministic tools, with a human signing off.

For those running AI in FP&A or accounting: which task did you pull back from the model, and what replaced it?
```

## First comment
```
Sources:
• Vals AI Finance Agent v2.1 (updated Oct 2026): https://www.vals.ai/benchmarks/fabv2-1
• Fin-RATE paper (Feb 2026): https://arxiv.org/abs/2602.07294
• Gartner finance AI survey (fielded Mar 2026, published May 2026), via CPA Practice Advisor: https://cpapracticeadvisor.com/2026/05/28/gartner-says-cfos-must-stop-mistaking-finance-ai-deployment-for-value-creation/184094

One more detail from Fin-RATE: with retrieval (RAG) instead of hand-picked documents, every model scored below 27%. Getting the right document in front of the model is still half the problem.
```

## Hooks considered
| # | Hook | Pattern | Chars | Status / why |
|---|---|---|---|---|
| 1 | The best AI score on financial modeling tasks is 57.0%. / On earnings analysis it's 93.0%. That gap is the real GenAI-in-finance story. | Number + consequence | ~132 | Chosen. Updated to current Vals v2.1 data (fact-checker C1/C2 BLOCK) |
| 2 | Finance experts wrote 537 analyst questions for AI. The best model (OpenAI o3) got 46.8% right, at $3.79 a question. That was Vals' original 2025 benchmark. | Test result | ~150 | Alternative (model named per C22); dated |
| 3 | AI scores 93% on earnings analysis and 57% on financial modeling. The benchmarks show exactly where the line is. | Number + consequence | ~112 | Alternative (replaces the "summarize an earnings call" wording, per C23) |

## Changes from previous version
Round-1 review panel (review/panel-v2.md, "Fix resolution"). The fact-checker BLOCKed because Vals has archived v2 and replaced it with v2.1, which made the August figures out of date. Switched to current v2.1 data:
- Hook: 34.5% / 79.1% → 57.0% / 93.0%; "v2 (August 2026)" → "v2.1 (October 2026)"; 81.8% → 87.8%; 36.4% → "top out at 49.3%"; modeling 34.5% → 57.0%
- "written by" → "reviewed by finance experts" (C5, compliance MUST-FIX)
- "one wrong load-bearing fact can zero an answer" → "missing one critical fact can score an answer as zero" (C6 + compliance idiom advisory; compliance wording wins)
- "Academic work agrees" → "points the same way"; "Yale-led" → "from Yale-affiliated researchers"; Fin-RATE result rewritten (C12, C14)
- "slower than expected" → "slower than expected in 2025" (C16, compliance #4)
- Retrieval advice → "retrieval-plus-citation … with source links a human can check" (fact-checker advisory)
- First comment switched to primary links (Vals v2.1, arXiv Fin-RATE) and Gartner dating clarified; AllMind, beancount and arXiv 2508.00828 links removed
- Alternative hooks fixed (C22, C23)

## Quality check (check_post.py)
```
INFO  Total length: 1661 chars
INFO  Hook (first 2 non-empty lines): 133 chars
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
(pending: round 2 and editorial)
