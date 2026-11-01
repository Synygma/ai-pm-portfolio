# Fin-RATE: real-world financial analytics tracking evaluation benchmark (research log)
- URL: https://beancount.io/bean-labs/research-logs/2026/06/29/fin-rate-real-world-financial-analytics-tracking-evaluation-benchmark
- Publisher: Beancount Bean Labs (review of a Feb 2026 paper by Yidong Jiang, Junrong Chen et al., Yale and collaborators)
- Published: 2026-06-29 (review); paper Feb 2026
- Accessed: 2026-11-01
- Tier: secondary write-up of an academic paper (arXiv ID not given)
- Opened by: vi-writer

## Summary
Benchmark built on SEC filings, testing detail retrieval, cross-entity comparison and longitudinal tracking tasks.

## Key facts (exact)
- 2,472 SEC filings, 43 companies, 36 industries, 2020-2025; 7,500 QA pairs (3 x 2,500)
- Top: GPT-5 with web search, peak accuracy 43-44% across the three task types
- Under RAG, all models score below 27%, versus up to 57.48% with gold context
- Missing Evidence = 75.44% of errors on EC-QA under RAG
- Finance-specialized models showed higher hallucination rates on complex tasks

## Caveats / methodology notes
Reviewer notes that the 43-company sample is thin. The original paper wasn't opened.

## Used for
Body beat 3; first-comment extra detail (below 27% under RAG).
