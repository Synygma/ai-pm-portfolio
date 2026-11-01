# Review panel: round 1 on writing/draft-v2.md
Date: 2026-11-01 · Mode: FULL · Reports saved verbatim.

## Compliance
VERDICT: FIX

| # | Area (1–8) | Severity | Text in post | Risk | Safer wording |
|---|---|---|---|---|---|
| 1 | 7 (Accuracy / misinformation) | MUST-FIX | "The questions are analyst-style and written by finance experts" | The cited source (AllMind) says the 927 v2 questions are "expert-reviewed". It says expert authorship only for the original 537-question 2025 set. The post states the method as fact, and the source doesn't support it. | "The questions are analyst-style and reviewed by finance experts" |
| 2 | 7 (Accuracy) | ADVISORY | "The best AI score on financial modeling tasks is 34.5%." / "General quantitative analysis tops out at 81.8%" | These are the best scores per category on one benchmark, and different models may hold different categories. The hook reads as a universal claim until line 3 qualifies it. | Hook is fine as is because line 3 qualifies it. In the body or chart, add "best score per category; different models". |
| 3 | 7 (Accuracy) | ADVISORY | "Fin-RATE, a Yale-led benchmark" | The source is a secondary blog review. It names the lead authors (Jiang, Chen) with "colleagues at Yale and collaborating institutions", which doesn't clearly mean Yale led it. | "a benchmark from Yale-affiliated researchers", or check the arXiv paper's affiliations before keeping "Yale-led" |
| 4 | 4 (Overstating surveys) | ADVISORY | "In Gartner's March 2026 survey ... 63% said AI implementation was slower than expected" (post) vs "Gartner finance AI survey (May 2026)" (comment) | The source supports it: survey run in March, published in May, and the 63% refers to 2025 implementation. But the two dates look inconsistent to a reader. | In the comment: "Gartner finance AI survey (fielded Mar 2026, published May 2026)". Optional in the post: "63% said AI implementation in 2025 was slower than expected" |
| 5 | 2 (Attribution) | ADVISORY | First comment: "Vals AI Finance Agent v2 results (Aug 2026), summarized by AllMind" | The headline numbers are credited only to a third-party summary. Linking the primary source is better for attribution and accuracy. | Add the Vals AI leaderboard or results page as the primary link and keep AllMind as secondary |
| 6 | 5 (Disclosure) | ADVISORY | Named entities: Vals AI, AllMind, GPT-5, Gartner, beancount.io | I don't know the author's employer. If they work for, or have a commercial tie to, an AI or finance-software vendor, a benchmark company, or OpenAI or Anthropic and their competitors, a disclosure line is needed. | If there's a tie, add "Disclosure: I work with X." If not, no change. |
| 7 | 8 (Global audience) | ADVISORY | "one wrong load-bearing fact can zero an answer" | "Load-bearing" (a metaphor) and "zero" used as a verb may not translate well for non-native English readers. | "missing one critical fact can score an answer as zero" |

## Escalations for the author
- None. Please confirm item 6 (any commercial relationship with a named company, or an employer in AI or finance software) before publishing.

## Image / carousel notes
- The author recreating the bar chart rather than taking a screenshot is the right approach. Copy only the data, not Vals AI's chart design or layout.
- Put a credit on the image itself: "Source: Vals AI Finance Agent v2 benchmark (Aug 2026). Best score per category; categories may be led by different models."
- Don't use Vals AI, OpenAI, Gartner or other logos on the chart.
- Label the axis as accuracy (%) and list the exact categories shown (for example Financial modeling 34.5%, Precedent transactions 36.4%, Earnings analysis 79.1%, General quantitative analysis 81.8%). Every bar needs a figure the source supports.
- Add alt text, for example: "Bar chart of best AI scores by finance task on Vals AI Finance Agent v2: financial modeling 34.5%, precedent transactions 36.4%, earnings analysis 79.1%, general quantitative analysis 81.8%."

## Checklist coverage
1 Defamation ✓ (the claims are sourced benchmark results and the conclusion is framed as "My read") · 2 Copyright ✓ (short factual figures, chart recreated; see image notes on credit) · 3 Trademarks ✓ (product names used only as references, no implied endorsement) · 4 Financial/regulatory ✓ (no investment advice; the survey is presented as a survey, and the date wording is an advisory) · 5 Disclosure: confirm whether the author has any commercial relationship (item 6) · 6 Privacy ✓ (no private individuals) · 7 LinkedIn policy: issue (item 1 must-fix on accuracy). The closing question is real discussion, not engagement bait. · 8 Cultural sensitivity ✓ (one idiom advisory; job-loss themes are not touched)

Notes:
- I checked the post against all three cited sources: the AllMind summary, the beancount.io Fin-RATE review and the CPA Practice Advisor Gartner article. Apart from the items above, every figure in the post and first comment matches them, including "below 27%" with retrieval, where the source says "well below 27%".
- Not a compliance issue, but your Domains table in `C:\Users\PRAVIN\Desktop\LinkedInAutomation\my-views.md` lists only marketing topics (D1, D2). This finance post sits outside them, and the rotation and "Last used" log can't record it.

## Fact-checker
VERDICT: BLOCK
Claims checked: 24 · Verified: 9 · Secondary-only: 6 · Issues: 11

| # | Claim (as written) | Verdict | Source (publisher, date) | URL | Note |
|---|---|---|---|---|---|
| C1 | "The best AI score on financial modeling tasks is 34.5%." (hook, present tense) | FALSE (out of date) | Vals AI, Finance Agent v2 and v2.1 pages, updated 10/29/2026 | https://www.vals.ai/benchmarks/fabv2 · https://www.vals.ai/benchmarks/fabv2-1 | 34.5% (Muse Spark 1.2) is still the top Financial Modeling score on v2. But Vals has archived v2 ("superseded by Finance Agent v2.1… no longer run on new model releases"). On the current v2.1, the best Financial Modeling score is 57.0% (Claude Opus 5.5). Saying "is 34.5%" today is wrong. Vals also says v2.1 "Scores are not comparable with Finance Agent v2." |
| C2 | "On earnings analysis it's 79.1%." | FALSE (out of date) | Vals AI, v2 page, 10/29/2026; AllMind (secondary) for the August figure | https://www.vals.ai/benchmarks/fabv2 | 79.1% matches only the August 19, 2026 v2 snapshot (from AllMind, secondary). Today's v2 Earnings Analysis top is 84.8% (Gemini 4 Argon), and v2.1 shows 93.0%. |
| C3 | "That gap is the real GenAI-in-finance story." | OPINION-OK | — | — | The gap still holds on current data: 84.8 vs 34.5 on v2, 93.0 vs 57.0 on v2.1. |
| C4 | "Both numbers come from Vals AI's Finance Agent v2 benchmark (August 2026)." | VERIFIED-SECONDARY | AllMind (summary of Vals), snapshot dated Aug 19, 2026 | https://allmind.ai/research/ai-financial-research-benchmarks-explained | I couldn't reach an archived Vals page for August. The current Vals page has different numbers, and v2 is now archived. |
| C5 | "The questions are analyst-style and written by finance experts" | IMPRECISE | Vals AI v2 page; arXiv 2508.00828 | https://www.vals.ai/benchmarks/fabv2 | Vals describes v2 as "927 expert-reviewed questions." "Expert-authored" is how the v1 paper (537 questions) describes its set. |
| C6 | "one wrong load-bearing fact can zero an answer" | VERIFIED-SECONDARY (minor drift) | AllMind | https://allmind.ai/research/ai-financial-research-benchmarks-explained | The source says "a *missed* load-bearing fact can zero the question" under "dealbreaker-gated partial credit." BenchLM uses "required dealbreakers." I couldn't read the methodology section on the Vals page. |
| C7 | "Where models do well: pulling facts from filings and summarizing results." | OPINION-OK / interpretive | — | — | This is the author's reading of the categories. It is acceptable as written. |
| C8 | "General quantitative analysis tops out at 81.8%." | VERIFIED (v2) | Vals AI v2, 10/29/2026 | https://www.vals.ai/benchmarks/fabv2 | Gemini 3.7 Flash, 81.8%. On v2.1 the figure is 87.8%. |
| C9 | "Where they break: normalizing numbers, deal conventions, multi-step models." | OPINION-OK / interpretive | Vals v2 | https://www.vals.ai/benchmarks/fabv2 | These map loosely to Adjustments (60.5% now), Precedents and Modeling. It reads as the author's characterization, not a quote from Vals. |
| C10 | "Precedent transactions score 36.4%." | FALSE (out of date) | Vals AI v2, 10/29/2026 | https://www.vals.ai/benchmarks/fabv2 | The current v2 top for Precedents is 49.8% (Gemini 4 Argon). v2.1 shows 49.3%. 36.4% was the August figure. |
| C11 | "Financial modeling, 34.5%." | IMPRECISE | Vals v2 / v2.1 | (as C1) | True on archived v2. On current v2.1 it is 57.0%. |
| C12 | "Fin-RATE, a Yale-led benchmark" | VERIFIED (lightly) | arXiv 2602.07294 (HTML) | https://arxiv.org/html/2602.07294 | Authors are from Yale, Tongji, UC San Diego and Goldman Sachs. Yale is the main affiliation. "Yale-affiliated" would be safer. |
| C13 | "built on 2,472 SEC filings" | VERIFIED | arXiv 2602.07294 | https://arxiv.org/html/2602.07294 | "15,311 document chunks derived from 2,472 filings." |
| C14 | "found the best setup (GPT-5 with web search) reached only 43–44% accuracy" | IMPRECISE | arXiv 2602.07294, Table 2 | https://arxiv.org/html/2602.07294 | GPT-5-websearch leads only two of the three tasks: EC-QA 43.64% and LT-QA 43.52%. The best single score is Fin-R1 at 57.48% on DR-QA. All of these use gold (ground-truth) context. The beancount review's "43–44% across all three task types" is wrong. |
| C15 | "Gartner's March 2026 survey of 204 finance leaders" | VERIFIED-SECONDARY | CPA Practice Advisor reprint of the Gartner release, May 28, 2026 | https://cpapracticeadvisor.com/2026/05/28/gartner-says-cfos-must-stop-mistaking-finance-ai-deployment-for-value-creation/184094 | The Gartner newsroom page returned 403. |
| C16 | "63% said AI implementation was slower than expected" | VERIFIED-SECONDARY | Same, plus CFOtech UK | same | The source wording is "slower than expected **in 2025**." The post leaves out the year. |
| C17 | "Forecasting and insight generation were among the lowest-rated use cases for impact." | VERIFIED-SECONDARY | Same | same | The source says "Financial forecasting and insight generation… among the lowest-rated use cases." |
| C18 | "66% of finance teams using AI named efficiency and productivity as a top benefit" | VERIFIED-SECONDARY | Same | same | The population is "finance organizations that have adopted AI." The post matches it. |
| C19 | "My read: GenAI isn't bad at finance. It's bad at the part… where one wrong number costs money." | OPINION-OK | — | — | It is framed as the author's view. |
| C20 | "ship retrieval and drafting now. Keep calculations… on deterministic tools" | OPINION-OK | — | — | It is a recommendation. Note that the first comment's own Fin-RATE point (retrieval under 27%) undercuts "ship retrieval now." See Advisory. |
| C21 | First comment: "with retrieval (RAG)… every model scored below 27%" | VERIFIED | arXiv 2602.07294, Table 4 | https://arxiv.org/html/2602.07294 | "remains below 27% across all tasks." The highest is 26.20%. |
| C22 | Alt hook 1: "537 analyst questions… best model got 46.8% right, at $3.79 a question. (Vals, 2025)" | VERIFIED | arXiv 2508.00828 (Vals/Stanford, Aug 2025) | https://arxiv.org/abs/2508.00828 | "537 expert-authored questions"; o3 scored 46.8% at $3.79 per query. Name the model (o3) and say it is the v1 benchmark from 2025. |
| C23 | Alt hook 2: "AI can summarize an earnings call better than it can build the model behind it." | IMPRECISE | Vals v2 / v2.1 | https://www.vals.ai/benchmarks/fabv2-1 | Earnings Analysis is not "summarizing an earnings call." The direction holds (93.0 vs 57.0 on v2.1), but the wording overstates what the category measures. |
| C24 | First-comment label "Gartner finance AI survey (May 2026)" | VERIFIED-SECONDARY (label nuance) | CPA Practice Advisor | same | The survey ran in March 2026 and the release came out in May 2026. Suggested label: "Gartner release (May 2026), March 2026 survey." |

## Required corrections
- **C1/C2/C10/C11:** Vals has archived Finance Agent v2 and replaced it with v2.1, so all four figures are out of date. Choose one of two fixes:
  - **(a) Switch to current v2.1 data (Vals, updated Oct 29, 2026).** Replace the hook with: "The best AI score on financial modeling tasks is 57.0%. On earnings analysis it's 93.0%." Replace "Vals AI's Finance Agent v2 benchmark (August 2026)" with "Vals AI's Finance Agent v2.1 benchmark (October 2026)". Replace "General quantitative analysis tops out at 81.8%" with "87.8%", and "Precedent transactions score 36.4%. Financial modeling, 34.5%." with "Precedent transactions top out at 49.3%. Financial modeling, 57.0%." Source: https://www.vals.ai/benchmarks/fabv2-1
  - **(b) Keep v2 but use its current figures and say it is archived.** Replace "it's 79.1%" with "84.8%", "36.4%" with "49.8%", and "(August 2026)" with "(final results, Oct 2026)". Keep 34.5% and 81.8%. Add that v2 has since been superseded by v2.1. Source: https://www.vals.ai/benchmarks/fabv2
  - Do not mix v2 and v2.1 numbers. Vals says they are not comparable.
- **C5:** replace "written by finance experts" with "reviewed by finance experts". Reason: Vals describes v2 as "expert-reviewed." Source: Vals v2 page.
- **C6:** replace "one wrong load-bearing fact can zero an answer" with "missing one load-bearing fact can zero an answer". Reason: the source wording is "missed," not "wrong." Source: AllMind summary of Vals methodology.
- **C14:** replace "found the best setup (GPT-5 with web search) reached only 43–44% accuracy" with "found that even with the right documents supplied, the best models reached only 43–44% on cross-company and multi-year questions". Reason: GPT-5-websearch did not lead all tasks (Fin-R1 scored 57.48% on single-document questions), and the 43–44% figures are under gold context. Source: arXiv 2602.07294, Table 2.
- **C16:** replace "63% said AI implementation was slower than expected" with "63% said AI implementation was slower than expected in 2025". Reason: the source gives the year. Source: CPA Practice Advisor / Gartner, May 28, 2026.

## First-comment link check
- https://allmind.ai/research/ai-financial-research-benchmarks-explained: loads yes · supports C2, C4, C6, C8, C10, C11 yes, but only as an August 19 snapshot. It is a secondary source.
- https://arxiv.org/abs/2508.00828: loads yes · supports C22 yes. It is the v1 paper and does not support the v2 figures.
- https://beancount.io/bean-labs/research-logs/2026/06/29/fin-rate-real-world-financial-analytics-tracking-evaluation-benchmark: loads yes · supports C13 and C21 yes. It misstates C14 ("43–44% across all three task types").
- https://cpapracticeadvisor.com/2026/05/28/gartner-says-cfos-must-stop-mistaking-finance-ai-deployment-for-value-creation/184094: loads yes · supports C15–C18 yes.

## Advisory
- Use primary links in the first comment: https://www.vals.ai/benchmarks/fabv2-1 (or /fabv2) instead of AllMind, https://arxiv.org/abs/2602.07294 instead of the beancount review, and the Gartner newsroom release (https://www.gartner.com/en/newsroom/press-releases/2026-05-28-gartner-says-cfos-must-stop-mistaking-finance-ai-deployment-for-value-creation). The Gartner page returned 403 to me but is the canonical source.
- The advice "ship retrieval now" sits awkwardly next to the first comment's Fin-RATE point that retrieval is "half the problem" (under 27%). Consider changing it to "ship retrieval-plus-citation and drafting, with source links a human can check."
- "Academic work agrees" stretches a little. Fin-RATE measures cross-document consistency, not modeling. "Academic work points the same way" is safer.
- Alt hook 1: name the model ("OpenAI o3") and label it as the original 2025 benchmark.
- Outside my fact remit, but worth knowing: finance is not one of the active domains (D1/D2) in my-views.md, and the post uses none of the author's opinions O1–O4. My-views rule 1 isn't violated, but the editorial reviewer may want to check fit.

Sources:
- [Vals AI Finance Agent v2](https://www.vals.ai/benchmarks/fabv2)
- [Vals AI Finance Agent v2.1](https://www.vals.ai/benchmarks/fabv2-1)
- [Vals AI benchmarks index](https://www.vals.ai/benchmarks)
- [AllMind summary](https://allmind.ai/research/ai-financial-research-benchmarks-explained)
- [Finance Agent Benchmark paper, arXiv 2508.00828](https://arxiv.org/abs/2508.00828)
- [Fin-RATE, arXiv 2602.07294](https://arxiv.org/abs/2602.07294) / [HTML](https://arxiv.org/html/2602.07294)
- [Beancount Fin-RATE review](https://beancount.io/bean-labs/research-logs/2026/06/29/fin-rate-real-world-financial-analytics-tracking-evaluation-benchmark)
- [CPA Practice Advisor, Gartner release](https://cpapracticeadvisor.com/2026/05/28/gartner-says-cfos-must-stop-mistaking-finance-ai-deployment-for-value-creation/184094)
- [Gartner newsroom (403)](https://www.gartner.com/en/newsroom/press-releases/2026-05-28-gartner-says-cfos-must-stop-mistaking-finance-ai-deployment-for-value-creation)
- [BenchLM Finance Agent v2 mirror](https://benchlm.ai/md/benchmarks/financeagentv2.md)

## Fix resolution (applied by the review-panel orchestrator → writing/draft-v3.md)
BLOCK cause: the Vals v2 figures from August 2026 are out of date (v2 has been archived and replaced by v2.1, updated 29 Oct 2026). The block is fixable by swapping data, and the thesis still holds on current data (93.0 vs 57.0). **Fact-checker option (a), current v2.1 data, was chosen** because it's fresher, and posting archived numbers as "the best AI score" would mislead. No v2 and v2.1 numbers are mixed.

| Issue | From | Applied wording |
|---|---|---|
| C1/C2 (hook) | fact-checker BLOCK | "The best AI score on financial modeling tasks is 57.0%. / On earnings analysis it's 93.0%." |
| C4 | fact-checker | "Vals AI's Finance Agent v2.1 benchmark (October 2026)" |
| C5 / compliance #1 | both (MUST-FIX) | "reviewed by finance experts" |
| C6 / compliance #7 | fact-checker (missed, not wrong) + compliance (global-audience idiom); **compliance wording wins** | "missing one critical fact can score an answer as zero" (still to be confirmed for v2.1 in the round-2 delta) |
| C8 | fact-checker | "General quantitative analysis tops out at 87.8%." |
| C10/C11 | fact-checker | "Precedent transactions top out at 49.3%. Financial modeling, 57.0%." |
| C12 / compliance #3 | both | "a benchmark from Yale-affiliated researchers" |
| C14 | fact-checker | "found that even with the right documents supplied, the best models reached only 43–44% on cross-company and multi-year questions" |
| "Academic work agrees" | fact-checker advisory | "Academic work points the same way." |
| C16 / compliance #4 | both | "slower than expected in 2025" |
| C20 advisory | fact-checker | "ship retrieval-plus-citation and drafting now, with source links a human can check" |
| First comment / compliance #5, C24 | both | Primary links: Vals v2.1, arXiv 2602.07294. Gartner labelled "fielded Mar 2026, published May 2026". AllMind, beancount and arXiv 2508.00828 links removed |
| C22/C23 (alt hooks) | fact-checker | Alt hook 1 names OpenAI o3 and the original 2025 benchmark. Alt hook 2 reworded to use v2.1 numbers |
| Compliance #2 | compliance advisory | Not applied in the body (line 3 already qualifies the hook). Added to the image notes |
| Compliance #6 (disclosure) | compliance | Question for the author |
LOCKED for editorial: every line above.
