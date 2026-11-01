# Review panel: round 2 (DELTA) on writing/draft-v3.md
Date: 2026-11-01 · Mode: DELTA · Reports saved verbatim.

## Compliance
VERDICT: PASS

| # | Area (1–8) | Severity | Text in post | Risk | Safer wording |
|---|---|---|---|---|---|
| 1 | 5 / 1 | ADVISORY | Alt hook 2: "The best model (OpenAI o3) got 46.8% right, at $3.79 a question. That was Vals' original 2025 benchmark." | This hook names only OpenAI's model, and only its weaker score on the old benchmark. Today an Anthropic model leads v2.1, but the post doesn't name it. Your views (O1) favour Claude, so a reader who knows both facts could see this as picking numbers that make GPT look bad. It's accurate and dated, so it isn't defamatory. The risk is how it looks. | If you use this hook, either name no model ("The best model got 46.8% right…"), or also say which model leads now so the comparison is even. The chosen hook 1 doesn't name any model, which is the most neutral option. |
| 2 | 7 | ADVISORY | Alt hook 3: "AI scores 93% on earnings analysis and 57% on financial modeling. The benchmarks show exactly where the line is." | "AI scores" reads as if all AI scores this, when it's the best model's result. "Exactly" overstates what one benchmark can show. | "The best AI scores 93% on earnings analysis and 57% on financial modeling. The benchmarks show where the line is." |
| 3 | 2 / 7 | ADVISORY | Alt hook 2: "Finance experts wrote 537 analyst questions…" | Last round, "written by" was changed to "reviewed by" for v2.1. Keep this wording only if Vals' 2025 methodology says experts wrote the questions. Otherwise it's the same overstatement. | Ask the fact-checker to confirm. If it isn't confirmed, use "Finance experts helped build 537 analyst questions…" |

## Escalations for the author
- None. One thing changed since round 1: the top v2.1 financial-modeling score now belongs to an Anthropic model (Claude Opus 5.5). The post doesn't name it and presents the numbers as limits of AI in general, so it doesn't read as promotion and needs no new disclosure. If you later name the model in the post, comments or replies, the round-1 disclosure question applies again.
- You should also know that I'm an Anthropic model (Claude Opus 5.5), the same model that tops this benchmark. I checked the promotion risk with that in mind, and you or another reviewer may want to double-check how I graded it.

## Image / carousel notes
- No change from round 1.

## Checklist coverage
1 Defamation ✓ (claims about the model are factual, sourced and dated) · 2 Copyright ✓ (benchmark figures are facts with sources linked; hook 2 wording is an advisory) · 3 Trademarks ✓ (Vals AI, Gartner and OpenAI named only for reference) · 4 Financial/regulatory ✓ (the Gartner survey is dated "in 2025" and isn't overstated; the build advice is product guidance, not regulated advice) · 5 Disclosure ✓ (advisory 1 on how alt hook 2 looks; the Anthropic lead isn't named, so no new disclosure is needed) · 6 Privacy ✓ · 7 LinkedIn policy ✓ (advisory 2 on the generalisation in alt hook 3; the first comment links to primary sources) · 8 Cultural sensitivity ✓ ("missing one critical fact" fixes last round's idiom concern; nothing new)

Files reviewed:
- C:\Users\PRAVIN\Desktop\LinkedInAutomation\research\runs\2026-11-01_genai-finance-is-bad\writing\draft-v3.md
- C:\Users\PRAVIN\Desktop\LinkedInAutomation\my-views.md

## Fact-checker
VERDICT: FIX
Claims checked: 18 · Verified: 13 · Secondary-only: 2 · Issues: 2

| # | Claim (as written) | Verdict | Source (publisher, date) | URL | Note |
|---|---|---|---|---|---|
| C1 | "The best AI score on financial modeling tasks is 57.0%." | VERIFIED | Vals AI, Finance Agent v2.1 page, updated Oct 29, 2026 | https://www.vals.ai/benchmarks/fabv2-1 | Financial Modeling leader is Claude Opus 5.5 at 57.0%. This is the top score on this one benchmark, not on financial modeling in general. See Advisory. |
| C2 | "On earnings analysis it's 93.0%." | VERIFIED | Vals AI, Oct 29, 2026 | https://www.vals.ai/benchmarks/fabv2-1 | Earnings Analysis leader is DeepSeek V4.1 Flash 1017 at 93.0%. A different model leads each category. |
| C3 | "Vals AI's Finance Agent v2.1 benchmark (October 2026)" | VERIFIED | Vals AI, Oct 29, 2026 | https://www.vals.ai/benchmarks/fabv2-1 | Page says "Last updated October 29, 2026". |
| C4 | "The questions are analyst-style and reviewed by finance experts" | VERIFIED | Vals AI, Oct 29, 2026 | https://www.vals.ai/benchmarks/fabv2-1 | **Holds for v2.1.** Questions "target the analytical depth expected of a 2nd or 3rd-year investment banking analyst". The page credits "financial experts who worked on Finance Agent v2", and v2.1 adds fixes "following expert reviews". The page gives no number of experts, and the post doesn't claim one. |
| C5 | "missing one critical fact can score an answer as zero" | VERIFIED | Vals AI, Oct 29, 2026 | https://www.vals.ai/benchmarks/fabv2-1 | **Holds for v2.1.** Some checks are flagged as load-bearing "dealbreakers", and "Failing any dealbreaker means the answer receives no credit for that question". "Can" is the right hedge, because not every check is a dealbreaker. |
| C6 | "General quantitative analysis tops out at 87.8%." | VERIFIED | Vals AI, Oct 29, 2026 | https://www.vals.ai/benchmarks/fabv2-1 | Category "General Quantitative", led by Claude Haiku 5.5 at 87.8%. |
| C7 | "Precedent transactions top out at 49.3%. Financial modeling, 57.0%." | VERIFIED | Vals AI, Oct 29, 2026 | https://www.vals.ai/benchmarks/fabv2-1 | Category "Precedents", led by MiMo V2.6 Flash at 49.3%. Precedents is the lowest category and Financial Modeling the second lowest. |
| C8 | "Fin-RATE, a benchmark from Yale-affiliated researchers" | VERIFIED | arXiv 2602.07294 (full text) | https://arxiv.org/html/2602.07294 | Most authors are at Yale, including the corresponding author Rex Ying. Others are at Tongji, UCSD and Goldman Sachs. |
| C9 | "built on 2,472 SEC filings" | VERIFIED | arXiv 2602.07294 | https://arxiv.org/html/2602.07294 | "15,311 document chunks derived from 2,472 filings". |
| C10 | "even with the right documents supplied, the best models reached only 43–44% on cross-company and multi-year questions" | VERIFIED | arXiv 2602.07294, Table 2 | https://arxiv.org/html/2602.07294 | Gold context: cross-entity (EC-QA) 43.64% and cross-year (LT-QA) 43.52%. Both are GPT-5-websearch. |
| C11 | "In Gartner's March 2026 survey of 204 finance leaders, 63% said AI implementation was slower than expected in 2025. Forecasting and insight generation were among the lowest-rated use cases" | VERIFIED-SECONDARY | CPA Practice Advisor, May 28, 2026 | https://cpapracticeadvisor.com/2026/05/28/gartner-says-cfos-must-stop-mistaking-finance-ai-deployment-for-value-creation/184094 | The article quotes "a March 2026 survey of 204 finance leaders" and says "63% of finance organizations said AI implementation was slower than expected in 2025". The Gartner primary release was not checked. |
| C12 | "66% of finance teams using AI named efficiency and productivity as a top benefit" (meaning unchanged) and first-comment dating "fielded Mar 2026, published May 2026" | VERIFIED-SECONDARY | CPA Practice Advisor, May 28, 2026 | same as C11 | The article says "66% reported greater efficiency and productivity as a top benefit" among organizations that have adopted AI, so the post's "finance teams using AI" scope is correct. |
| C13 | First comment: "with retrieval (RAG) instead of hand-picked documents, every model scored below 27%" | IMPRECISE | arXiv 2602.07294, Table 4 | https://arxiv.org/html/2602.07294 | The paper says accuracy "remains below 27% across all tasks" (highest 26.20%, GPT-5). But the retrieval test covered only 4 models (GPT-5, DeepSeek-V3, Qwen3-235B, Fin-R1) on a 500-question sample per task type. "Every model" overstates it. |
| C14 | "Fin-RATE paper (Feb 2026)" | VERIFIED | arXiv 2602.07294 | https://arxiv.org/abs/2602.07294 | v1 was submitted Feb 7, 2026. The latest version is v4, revised Jun 10, 2026. |
| C15 | "ship retrieval-plus-citation and drafting now, with source links a human can check" | OPINION-OK | n/a | n/a | Advice that follows the "My read" framing. It doesn't contradict my-views.md. |
| C16 | Alt hook 2: "Finance experts wrote 537 analyst questions… OpenAI o3 got 46.8% right, at $3.79 a question… Vals' original 2025 benchmark" | VERIFIED | arXiv 2508.00828 abstract, v1 May 20, 2025 | https://arxiv.org/abs/2508.00828 | The abstract has "537 expert-authored questions" and o3 at "46.8% accuracy at an average cost of $3.79 per query". Some secondary sites quote 48.3% or $3.69. Use the arXiv figures. |
| C17 | Alt hook 3: "AI scores 93% on earnings analysis and 57% on financial modeling." | IMPRECISE | Vals AI, Oct 29, 2026 | https://www.vals.ai/benchmarks/fabv2-1 | These are the top single-model scores per category, not what AI typically scores. Each number comes from a different model. |
| C18 | First comment: "Vals AI Finance Agent v2.1 (updated Oct 2026)" | VERIFIED | Vals AI, Oct 29, 2026 | https://www.vals.ai/benchmarks/fabv2-1 | |

## Required corrections
- C13: replace "with retrieval (RAG) instead of hand-picked documents, every model scored below 27%." with "with retrieval (RAG) instead of hand-picked documents, every model tested scored below 27%." Only 4 models were tested in the retrieval setting, on a 500-question sample per task type. Source: arXiv 2602.07294, Table 4 and text ("remains below 27% across all tasks").
- C17 (alternative hook only, needed only if it gets used): replace "AI scores 93% on earnings analysis and 57% on financial modeling." with "The best AI scores 93% on earnings analysis and 57% on financial modeling." Both numbers are category maximums from different models. Source: Vals Finance Agent v2.1 page.

On the two points you asked about: both hold for v2.1, so no fix is needed for C4 or C5. The v2.1 page credits the finance experts who worked on v2 and lists v2.1 fixes made "following expert reviews". It also keeps the dealbreaker rule: "Failing any dealbreaker means the answer receives no credit for that question."

## First-comment link check
- https://www.vals.ai/benchmarks/fabv2-1: loads yes · supports C1–C7 and C18 yes
- https://arxiv.org/abs/2602.07294: loads yes · supports C14 yes. The abstract page alone doesn't show C9, C10 or C13. Those are in the full text at https://arxiv.org/html/2602.07294.
- https://cpapracticeadvisor.com/2026/05/28/gartner-says-cfos-must-stop-mistaking-finance-ai-deployment-for-value-creation/184094: loads yes · supports C11 and C12 yes

## Advisory
- Hook scope: line 1 reads as a general claim about AI. Consider "The best AI score on Vals' financial modeling tasks is 57.0%", or rely on line 3 for the context, which already names the benchmark. Also note that Vals says "Scores are not comparable with Finance Agent v2". Don't put v2.1 numbers next to the old v2 or v1 figures anywhere in the post or comments.
- The Vals page doesn't say whether the category accuracies are Partial Credit (the primary metric) or All-Pass. The post doesn't need to say which, but avoid saying "got X% of questions fully right".
- Gartner: if you can find Gartner's own press release for the March 2026 survey, link it as the primary source instead of the CPA Practice Advisor article. Otherwise the current "via CPA Practice Advisor" label is the right one.
- Fin-RATE: consider linking https://arxiv.org/html/2602.07294 so readers can find the 2,472 filings, the 43–44% and the under-27% figures, which aren't on the abstract page.
- Topic: finance is outside domains D1/D2 in my-views.md. That's not a factual issue, just noted for the editorial reviewer.

Sources: Vals AI v2.1 · arXiv 2602.07294 (abstract + full text) · CPA Practice Advisor, May 28 2026 · arXiv 2508.00828 · the-decoder and Fintool (secondary only, not relied on)

Draft checked: C:\Users\PRAVIN\Desktop\LinkedInAutomation\research\runs\2026-11-01_genai-finance-is-bad\writing\draft-v3.md

## Resolution (orchestrator)
Round 2 is the last allowed round. No BLOCK remains. The remaining FIX items only narrow wording, and the fact-checker supplied the exact wording, so they're applied without a third round → writing/draft-v4.md:
- C13 (first comment): "every model scored below 27%" → "every model tested scored below 27%"
- Fin-RATE link in the first comment → full text https://arxiv.org/html/2602.07294 (advisory)
- Alt hook 3: "AI scores…" → "The best AI scores 93% on earnings analysis and 57% on financial modeling. The benchmarks show where the line is." (C17 + compliance #2)
- Alt hook 2: model name removed ("The best model got 46.8% right…") to avoid looking like selective comparison (compliance #1). "Experts wrote" is kept, because the fact-checker verified "expert-authored" for v1 (C16), which settles compliance #3.
- Hook-scope advisory: passed to editorial. Line 3 already names the benchmark.
LOCKED for editorial: every round-1 and round-2 line.
