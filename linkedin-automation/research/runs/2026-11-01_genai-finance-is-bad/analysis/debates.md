# Debates, conflicts and pushback

## Stance check
User stance: "gen AI for finance is bad". **Verdict: nuances.** The evidence shows strong performance on retrieval and summarization (about 80%) and weak performance on modeling and deal conventions (about 35%). The post argues "bad at the part where one wrong number costs money" rather than "bad overall".

## Conflicting figures and how they were resolved
- Vals v1 abstract says o3 46.8% / $3.79. A search snippet said 48.3% / $3.69. Used the abstract.
- KuCoin (May 2026) claims GPT-5.5 scored about 52% on v2. AllMind says a widely copied v2 table didn't match vals.ai. Not used.
- Vals v1 vs v2 scores are not comparable (different question sets). Avoided any "progress" comparison across versions.
- Gartner adoption 59% (2025) seen only in snippets. Not used.

## Strongest counter-arguments
1. "Agents with tools (calculators, code execution, ledger access) fix the numbers problem." Partly true: the benchmarks already give agents tools, and modeling still scores about 35%.
2. "Specialist finance products score much higher" (e.g. Fintool claims 90%). That was on a 50-question public subset, so it isn't comparable.
3. "Benchmarks aren't production." Fair. Gartner's survey (slower than expected, forecasting rated low for impact) is the production-side signal.

## Likely pushback and suggested replies
- "My team uses it daily for FP&A." -> "Which tasks? The data says drafting and retrieval work. I'm curious whether anyone has it doing the modeling itself."
- "Benchmarks are too harsh." -> "Dealbreaker scoring is harsh by design. In finance, one wrong load-bearing number is a real failure."
