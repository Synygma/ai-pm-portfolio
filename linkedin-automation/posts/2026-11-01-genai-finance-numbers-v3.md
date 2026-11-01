---
status: published
published_url: https://www.linkedin.com/feed/update/urn:li:activity:7522692657287196672/
published_date: 2026-11-01
post_type: Contrarian field note
run_folder: research/runs/2026-11-01_genai-finance-is-bad/
thesis: On Vals AI Finance Agent v2.1 (Oct 2026) the best AI scores 93.0% on earnings analysis but 57.0% on financial modeling; GenAI is weak where one wrong number costs money, so ship retrieval-plus-citation and keep multi-step calculations deterministic.
---
# GenAI in finance: the modeling gap (reviewed)

- **Input (as given):** gen ai for finance is bad
- **Routing:** TOPIC, researched directly; review panel run afterwards
- **Date:** 2026-11-01 · reviewed by the review panel on 2026-11-01
- **Post type:** Contrarian field note · **Format:** Text · **Lane:** Enterprise AI adoption
- **Length:** 1509 chars · **Hook (above fold):** 104 chars
- **Checks:** quality PASS · overlap PASS (0 posts published yet)
- **Review panel:** see below · final draft: writing/draft-v6.md
- **Run folder:** research/runs/2026-11-01_genai-finance-is-bad/

## Post (final, copy-paste ready)

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

## Alternative hooks (reviewed)
| # | Hook | Pattern | Chars | Status / why |
|---|---|---|---|---|
| 1 | The best AI score on financial modeling tasks is 57.0%. / On earnings analysis it's 93.0%. Same benchmark. | Number + consequence | 104 | Chosen (v2.1 data; 'Same benchmark.' per editorial) |
| 2 | (dropped: mixes original 2025 Vals figures with v2.1; editorial advice) | — | — | Rejected |
| 3 | The best AI scores 93% on earnings analysis and 57% on financial modeling. The benchmarks show where the line is. | Number + consequence | ~112 | Alternative (replaces the "summarize an earnings call" wording, per C23) |

## Evidence used (as verified by the fact-checker)
- Financial modeling best 57.0%, earnings analysis best 93.0%, precedent transactions best 49.3% → Vals AI Finance Agent v2.1, updated 29 Oct 2026 (primary)
- Questions reviewed by finance experts; failing a "dealbreaker" scores an answer zero → Vals AI v2.1 page (primary)
- Fin-RATE: 2,472 SEC filings; best 43.64% / 43.52% on cross-entity / multi-year questions with gold context; below 27% with retrieval (4 models tested) → arXiv 2602.07294 (primary)
- Gartner: March 2026 survey of 204 finance leaders; 63% slower than expected in 2025; 66% of adopters cite efficiency → CPA Practice Advisor, 28 May 2026 (secondary; Gartner page 403)

## Review panel summary
- Fact-checker: **BLOCK** → FIX → FIX (delta) · round 1: 24 claims, the Vals v2 figures were out of date (v2 archived and replaced by v2.1) → switched to current v2.1 data; round 2: 18 claims, 2 wording fixes; editorial delta: 7 claims, 1 framing fix · reports: review/panel-v2.md, panel-v3.md, panel-v4.md
- Compliance: FIX → PASS → PASS (delta) · 1 must-fix ("written by" → "reviewed by" experts) applied; idiom, attribution and dating advisories applied; no escalations; disclosure question open for the author · same reports
- Editorial: EDITED · avg score 4.0 → 4.3 · 5 changes · length 1,661 → about 1,500 · report: review/panel-v4.md
- Rounds: 2 + editorial delta · Final draft: v6 · log: review/review-log.md

## Posting notes
- **Disclosure (from compliance):** if you work for, or have a commercial tie to, an AI or finance-software vendor, a benchmark company, or OpenAI/Anthropic and their competitors, add "Disclosure: I work with X" to the first comment.
- **Don't name the model that leads a category.** The financial-modeling leader is an Anthropic model, and with your Claude preference (O1) naming it could look like promotion. The compliance reviewer is itself a Claude model and said so; weigh its judgement on this point accordingly.
- **Don't mix benchmark versions:** v2.1 scores are not comparable with v2 or the 2025 original.
- **Optional chart:** recreate the Vals v2.1 category bars yourself, with no logos. Caption it "Source: Vals AI Finance Agent v2.1 (Oct 2026). Best score per category; different models lead different categories." and add alt text.
- **Expected pushback (editorial skeptic read):** "benchmarks aren't production", "how would a human analyst score?", "which model?" Reply with the leaderboard link and the Gartner adoption data.
- **Off-lane:** finance isn't in your my-views domains (D1/D2). Consider adding a finance domain or treat this as a one-off.
- **Timing:** Tue–Thu, when you can reply for 60–90 minutes.

---
Run folder: research/runs/2026-11-01_genai-finance-is-bad/
