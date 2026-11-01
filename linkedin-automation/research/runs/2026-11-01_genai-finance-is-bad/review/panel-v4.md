# Review panel: editorial on writing/draft-v4.md
Date: 2026-11-01 · Report saved verbatim (HTML entity "&amp;" in the agent output normalised to "&").

## Editorial
VERDICT: EDITED
Scores before: hook 4 · clarity 4 · rhythm 3 · value 4 · voice 4 · comments 5  (avg 4.0)
Scores after:  hook 4 · clarity 5 · rhythm 4 · value 4 · voice 4 · comments 5  (avg 4.3)

Reasoning (before):
- **Hook 4:** It's specific and the two numbers create tension. But line 1 reads like a general claim about AI, and "the real GenAI-in-finance story" is clunky.
- **Clarity 4:** The 87.8% "general quantitative analysis" figure sits under "pulling facts and summarizing" but doesn't match it. It also seems to contradict "they break on normalizing numbers."
- **Rhythm 3:** At about 1,661 characters it's over the 1,500 target, and the middle has three dense stat paragraphs in a row.
- **Value 4:** The ship-now versus keep-deterministic rule is concrete and useful to builders.
- **Voice 4:** Plain and practitioner-like. There's a little filler ("the real … story", "finance leaders" twice in one line).
- **Comments 5:** The question can be answered from experience and asks for specifics.

## Edited post
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
The post is now about 1,490 characters and the hook is 104. There are no hashtags, no links in the body and no banned phrases. The first comment is unchanged because it's locked.

## Changes
| # | Before | After | Why |
|---|---|---|---|
| 1 | "That gap is the real GenAI-in-finance story." | "Same benchmark." | Follows the fact-checker's advice: it says above the fold that these are scores from one benchmark, so line 1 no longer reads as a general claim about AI. It also cuts 29 characters, and the 57 vs 93 contrast still carries the tension. |
| 2 | "Where models do well: … results. General quantitative analysis tops out at 87.8%." | Cut the 87.8% sentence (the whole locked sentence; nothing reworded) | The category doesn't match "pulling facts and summarizing," and it invites a "but they're good at numbers?" objection against the next paragraph. The 93.0% in the hook already covers the strong side. |
| 3 | "Finance leaders are feeling it too." | "It shows up outside the benchmarks too." | The old line said "finance leaders" twice in a row. The new one marks the move from benchmark data to field data. |
| 4 | "Forecasting and insight generation were among the lowest-rated use cases for impact." | Cut (whole locked sentence; nothing reworded) | The reviewer notes allow dropping one supporting stat, and this was the only way to get under 1,500 without stripping the transitions. The forecast advice still rests on the 57.0% modeling and multi-step results. |
| 5 | "For those running AI in FP&A or accounting: which task…" | "Running AI in FP&A or accounting? Which task…" | Shorter and more direct. Same audience, same question. |

## Changed sentences containing claims, names or opinions
- "On earnings analysis it's 93.0%. Same benchmark." (the locked sentence is unchanged; "Same benchmark." is accurate because P2 says both numbers come from Vals AI's Finance Agent v2.1)
- "It shows up outside the benchmarks too." (a framing line for the Gartner survey data that follows; no new fact)
- "Running AI in FP&A or accounting? Which task did you pull back from the model, and what replaced it?"
- Removed (verbatim, whole sentences): "General quantitative analysis tops out at 87.8%." and "Forecasting and insight generation were among the lowest-rated use cases for impact."

## Skeptic read
1. **"Benchmarks aren't production. A real deployment has your tools, your data and your controls."** Partly answered. The post adds Gartner field data, and the advice is about tool design rather than the models' raw ability. It doesn't claim the benchmark predicts how a given deployment will perform.
2. **"One missing fact scores zero, so of course the numbers look low. How would a human analyst score?"** Half answered. The strict scoring is disclosed openly, which helps credibility. There's no human baseline, so that comment will come up (see Advisory).
3. **"Top score from which model and setup? These change every month."** Mostly answered. The post is dated (October 2026, v2.1) and says "top out at." Not naming the leading model is deliberate (compliance and O1) and defensible. If asked, reply with the leaderboard link already in the first comment.

## Advisory
- If the author wants the Gartner forecasting stat back (it speaks directly to FP&A leaders), something else of about 85 characters has to go to stay under 1,500. The best candidate is the "Same benchmark." line combined with a shorter P2. Otherwise accept about 1,575 characters, which is still well under the 3,000 cap.
- A human-analyst baseline from Vals or Fin-RATE, if one is published, would answer skeptic #2 head-on. It would need verifying before use.
- Don't use alternative hook 1. It uses the original 2025 Vals numbers (46.8%, $3.79), and the fact-checker said not to put those next to v2.1 numbers. Alternative hook 2 rounds the locked figures (93%, 57%), so the current hook is safer.
- Finance is outside the author's listed domains (D1/D2). The audience is broadly AI builders, but the author may want to add a finance domain to my-views.md or label this as an off-lane post.

Files reviewed: draft-v4.md, my-views.md, references/anatomy.md, references/hooks.md

## Orchestrator actions
- All 5 edits applied → writing/draft-v5.md. Locked sentences are unchanged (two were cut whole, as allowed).
- Alternative hook 1 dropped from the draft, as editorial advised.
- Edited claim and framing sentences sent to fact-checker + compliance (DELTA). Results are appended below.


---
# Delta re-check of editorial edits (writing/draft-v5.md)
Reports saved verbatim (HTML entity "&amp;" normalised to "&").

## Fact-checker (DELTA)
VERDICT: FIX
Claims checked: 7 · Verified: 4 · Secondary-only: 0 · Issues: 1

| # | Claim (as written) | Verdict | Source (publisher, date) | URL | Note |
|---|---|---|---|---|---|
| C1 | "On earnings analysis it's 93.0%. Same benchmark." | VERIFIED | Vals AI, Finance Agent v2.1 page (updated Oct 29, 2026) | https://www.vals.ai/benchmarks/fabv2-1 | Earnings Analysis is led by DeepSeek V4.1 Flash at 93.0%. Financial Modeling is led by Claude Opus 5.5 at 57.0%. Both are categories of the same v2.1 leaderboard, so "Same benchmark" is accurate. A different model leads each category, but "best score" in each case is still correct. |
| C2 | "Where models do well: pulling facts from filings and summarizing results." (87.8% sentence removed) | VERIFIED | Vals AI, Oct 29, 2026 | https://www.vals.ai/benchmarks/fabv2-1 | Still supported without a number. Earnings Analysis is 93.0%, General Quantitative Analysis (extraction and calculation) is 87.8%, and Disclosure Analysis is 83.3%. Dropping the 87.8% doesn't make the do-well/break framing misleading. See the Advisory note on calculations. |
| C3 | "Keep calculations and anything that feeds a forecast on deterministic tools, with a human signing off." (Gartner forecasting sentence removed) | OPINION-OK | Vals AI, Oct 29, 2026 | https://www.vals.ai/benchmarks/fabv2-1 | This is framed as a recommendation after "My read", not as a fact. Financial Modeling at 57.0%, Precedents at 49.3% and Fin-RATE at 43–44% on multi-year questions still support it. It no longer leans on the Gartner forecasting finding, and it doesn't need to. |
| C4 | "In Gartner's March 2026 survey of 204 finance leaders, 63% said AI implementation was slower than expected in 2025." | VERIFIED-SECONDARY | CPA Practice Advisor reporting Gartner, May 28, 2026 | https://cpapracticeadvisor.com/2026/05/28/gartner-says-cfos-must-stop-mistaking-finance-ai-deployment-for-value-creation/184094 | The figure matches exactly: "63% of finance organizations said AI implementation was slower than expected in 2025", March 2026 survey, n=204. It comes from trade press, not a Gartner release (same as in v4). |
| C5 | "It shows up outside the benchmarks too." (framing for C4) | IMPRECISE (misleading context) | CPA Practice Advisor, May 28, 2026 | same as C4 | "It" points back to the benchmark weakness (modeling and multi-step errors). That implies the slow rollout is caused by that weakness. The article gives no cause for the slowness. The only blockers it names are "cost overruns and rigid team mindsets", plus a need for data, talent, process and governance foundations. So the link to accuracy goes beyond the evidence. |
| C6 | "Running AI in FP&A or accounting? Which task did you pull back from the model, and what replaced it?" | OPINION-OK | n/a | n/a | This is a question, so there's nothing to check. It assumes pullbacks happen, which is fair as a prompt. |
| C7 | Hook juxtaposition, "57.0% … 93.0%. Same benchmark.", read with the rest of the post | VERIFIED | Vals AI, Oct 29, 2026 | https://www.vals.ai/benchmarks/fabv2-1 | Paragraph 2 still names Finance Agent v2.1 (October 2026). The update date of Oct 29, 2026 is consistent with that. |

## Required corrections
- C5: replace "It shows up outside the benchmarks too." with "Rollouts are proving harder than expected, too." (or "Finance teams are finding adoption hard, too."). Reason: as written, the line suggests Gartner's 63% slower-than-expected figure is caused by the accuracy gap the benchmarks show. Gartner gives no such cause, and the only stall points the article names are cost overruns and rigid team mindsets. Source: CPA Practice Advisor, May 28, 2026.

## First-comment link check
- https://www.vals.ai/benchmarks/fabv2-1: loads yes · supports claims C1, C2, C7 yes (updated Oct 29, 2026, consistent with "updated Oct 2026")
- https://arxiv.org/html/2602.07294: not re-checked in delta mode (Fin-RATE sentences unchanged from v4)
- https://cpapracticeadvisor.com/2026/05/28/gartner-says-cfos-must-stop-mistaking-finance-ai-deployment-for-value-creation/184094: loads yes · supports claim C4 yes (and the unchanged 66% claim; that figure is a share of AI adopters, which the post's "finance teams using AI" correctly reflects)

## Advisory
- Change 2: cutting the 87.8% line actually removes a tension. General Quantitative Analysis covers extraction and calculation and scores 87.8%, which sat awkwardly next to "keep calculations on deterministic tools". Be aware that a reader who checks Vals will see simple calculation scoring fairly high. The advice still holds because even the best model gets roughly 1 in 8 wrong and the multi-step and modeling scores are low. If you want it tighter, say "multi-step calculations" instead of "calculations".
- Change 3: the forecasting advice now rests on the Vals modeling and precedents scores and Fin-RATE's multi-year results. That support is enough for a clearly framed recommendation. Restoring the Gartner forecasting sentence isn't required.
- C4 is still secondary-only. If a Gartner newsroom release for the May 2026 finance AI survey can be found, cite it in the first comment ahead of the CPA Practice Advisor link.

## Compliance (DELTA)
VERDICT: PASS

| # | Area (1–8) | Severity | Text in post | Risk | Safer wording |
|---|---|---|---|---|---|
| 1 | 4 / 7 | ADVISORY | "It shows up outside the benchmarks too. In Gartner's March 2026 survey of 204 finance leaders, 63% said AI implementation was slower than expected in 2025." | Removing the forecasting sentence broke the link between "it" (the weakness on modeling tasks) and the Gartner figure. Gartner asked about implementation speed, not about how accurate the models are, so the line now suggests the survey confirms the benchmark finding when it doesn't. This is a small case of overstating a survey. | "Adoption is running slower than planned, too. In Gartner's March 2026 survey of 204 finance leaders, 63% said AI implementation was slower than expected in 2025." |
| 2 | 4 | ADVISORY | "survey of 204 finance leaders, 63% said" | The source says the chart came from "a March 2026 survey of 204 finance leaders". It does not clearly say the 63% figure comes from that same group of 204, and it phrases the figure as "63% of finance organizations". The risk is low because it is the same Gartner release. | Optional: "In a March 2026 Gartner survey of finance leaders, 63% of finance organizations said…" |
| 3 | 8 | ADVISORY | "Running AI in FP&A or accounting?" | "FP&A" is jargon. Finance readers will know it, but people reading in a second language may not. The question asks about their own experience, not for a reaction, so it is not engagement bait. | Optional: "Running AI in financial planning (FP&A) or accounting?" |
| 4 | n/a (process) | ADVISORY | Hooks table, row 1, still reads "...That gap is the real GenAI-in-finance story." | The notes no longer match the post. If someone copies the hook from the table, the old wording gets published. | Change row 1 to "...On earnings analysis it's 93.0%. Same benchmark." |

Checked with no issue:
- **Change 1:** "On earnings analysis it's 93.0%. Same benchmark." is neutral. It says nothing negative about Vals AI or any model vendor. Making clear that both numbers come from the same benchmark actually lowers the risk of overstating.
- **Changes 2 and 3:** These are cuts, so they add no new risk. "Where models do well" is still backed by the 93.0% figure. The advice to keep forecasts on deterministic tools is still backed by the modeling scores.
- **Change 6:** Dropping alt hook 1 removes the mix of 2025 and v2.1 figures, which is a risk reduction.

## Escalations for the author
- None

## Checklist coverage
1 Defamation ✓ · 2 Copyright ✓ · 3 Trademarks ✓ · 4 Financial/regulatory: advisories only (how the Gartner survey is linked and attributed) · 5 Disclosure ✓ (the earlier note still applies: the finance topic is outside D1/D2, so the author should confirm there is no employer conflict) · 6 Privacy ✓ · 7 LinkedIn policy ✓ (the CTA asks a real question and is not bait) · 8 Cultural sensitivity: advisory only ("FP&A" acronym)

## Resolution (orchestrator)
Both reviewers flagged the same framing line. They offered different wording, and **compliance wins conflicts**, so this is applied: "It shows up outside the benchmarks too." → "Adoption is running slower than planned, too." Also applied:
- "Keep calculations" → "Keep multi-step calculations" (fact-checker advisory; narrows the claim)
- Hooks table row 1 updated (compliance #4)
Not applied: compliance #2 (wording is already accurate to the release) and #3 (FP&A is standard for the target audience).
Every change narrows the claim and uses reviewer-supplied wording, so no further round is needed → writing/draft-v6.md (FINAL)
