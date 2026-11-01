---
status: superseded
published_url: 
published_date: 
post_type: Contrarian field note
run_folder: research/runs/2026-11-01_genai-finance-is-bad/
thesis: SUPERSEDED by 2026-11-01-genai-finance-numbers-v3.md (pre-review version). GenAI is strong at finance retrieval/summaries (~80% on Vals v2) but weak at financial modeling (~35%); keep numbers on deterministic tools.
---
# GenAI in finance: the modeling gap

- **Topic (as given):** gen ai for finance is bad
- **Date:** 2026-11-01
- **Post type:** Contrarian field note (industry evidence) · **Format:** Text-only · **Lane:** Enterprise AI adoption
- **Hook pattern:** Number + consequence · **Length:** 1,494 chars · **Hook (above fold):** 133 chars
- **Check script:** PASS (no placeholders)

## Post (final, copy-paste ready)

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

## First comment

```
Sources:
• Vals AI Finance Agent v2 results (Aug 2026), summarized by AllMind: https://allmind.ai/research/ai-financial-research-benchmarks-explained
• Original Finance Agent Benchmark paper (2025): https://arxiv.org/abs/2508.00828
• Fin-RATE benchmark review (Feb 2026 paper): https://beancount.io/bean-labs/research-logs/2026/06/29/fin-rate-real-world-financial-analytics-tracking-evaluation-benchmark
• Gartner finance AI survey (May 2026): https://cpapracticeadvisor.com/2026/05/28/gartner-says-cfos-must-stop-mistaking-finance-ai-deployment-for-value-creation/184094

One more detail from Fin-RATE: with retrieval (RAG) instead of hand-picked context, every model scored below 27%. Getting the right document in front of the model is still half the problem.
```

## Alternative hooks

1. *Test result:* Finance experts wrote 537 analyst questions for AI. The best model got 46.8% right, at $3.79 a question. (Vals, 2025)
2. *Paradox:* AI can summarize an earnings call better than it can build the model behind it. The benchmarks show by how much.

## Evidence used

- Financial modeling best score 34.5%; precedent transactions 36.4%; earnings analysis 79.1%; general quant 81.8%; dealbreaker-gated scoring → Vals AI Finance Agent v2, 19 Aug 2026 (via AllMind review)
- Best Fin-RATE setup GPT-5 + web search 43–44%; 2,472 SEC filings; all models <27% under RAG → Fin-RATE (Yale-led), Feb 2026 (via Beancount research log)
- 204 finance leaders, March 2026; 63% slower than expected; forecasting/insight among lowest-rated use cases; 66% cite efficiency as top benefit → Gartner via CPA Practice Advisor, 28 May 2026
- Original benchmark: 537 expert questions, o3 46.8% at $3.79/query → arXiv 2508.00828, 2025 (alt hook only)

## Posting notes

- Your original stance ("GenAI for finance is bad") was adjusted. The evidence shows it's strong at retrieval and summaries (~80%) and weak at modeling (~35%). A blanket "bad" claim would be easy to rebut.
- The Vals v2 and Fin-RATE numbers come from secondary write-ups. Gartner's own page blocked access, so its figures come from CPA Practice Advisor's report. Vals v1 and v2 scores aren't directly comparable.
- Attach an image: a simple bar chart of the Vals category scores (34.5% → 81.8%).
- Post Tue–Thu when you can reply for 60–90 minutes. If someone says "agents with tool use fix this", ask which modeling task they've seen it work on.

---
Run folder: research/runs/2026-11-01_genai-finance-is-bad/
