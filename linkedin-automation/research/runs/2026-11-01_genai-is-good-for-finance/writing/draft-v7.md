# Draft v7: UBS's 12,700 AI agents (FINAL, reviewed)
- Run: research/runs/2026-11-01_genai-is-good-for-finance/
- Date: 2026-11-01 · Format: image · Post type: Contrarian field note · Hook pattern: Number + consequence
- Status: final

## Post
```
UBS employees now run more than 12,700 AI personal agents.
Not a pilot. That's roughly one agent for every eight employees.

UBS's Q3 2026 results also list 608 AI use cases in production, up 81% in a year.

It isn't just UBS. A Bank of England and FCA survey (26 October) found 86% of the UK financial firms it surveyed use AI, and GenAI is 56% of the systems they reported.

So yes, I think GenAI is good for finance. But look at where it works.
80% of the UK firms surveyed have AI agents deployed. Only 2% give them broad autonomy.

My read: the value comes from thousands of small assistants that support people while a human decides.

What's missing is a payoff number.
In my view, that gap is telling: UBS's Q3 results report how many agents and use cases it has, not what they've saved or earned.

Building for a bank? Ship the unglamorous platform: an owner per agent, scoped data access, humans execute by default, and one outcome metric per agent, set before launch.

If you build AI in banking or finance: what metric would prove an internal agent paid off?
```

## First comment
```
Sources:
• UBS Q3 2026 results (28 Oct 2026): https://www.ubs.com/global/en/media/display-page-ndp/en-20261028-3q26-quarterly-result.html
• Bank of England & FCA, AI in UK financial services 2026 (26 Oct 2026): https://www.bankofengland.co.uk/report/2026/artificial-intelligence-in-uk-financial-services-2026

One more detail from the same UK survey (196 respondents): even counting planned deployments, no more than 9% of respondents expect agents to approve customer outcomes, place trades, move payments or change limits.
```

## Hooks considered
| # | Hook | Pattern | Chars | Status / why |
|---|---|---|---|---|
| 1 | UBS employees now run more than 12,700 AI personal agents. / Not a pilot. That's roughly one agent for every eight employees. | Number + consequence | 122 | Chosen (ratio corrected per fact-checker C3) |
| 2 | 80% of UK financial firms surveyed run AI agents. Only 2% give them broad autonomy. | Number + consequence (gap) | ~83 | Alternative (reworded per C18) |
| 3 | 608 live AI use cases at UBS, up 81% in a year. UBS's results don't put a dollar figure on them. | Paradox | ~97 | Alternative (reworded per C19) |

## Changes from previous version
Delta re-check of the editorial edits (review/panel-v5.md): "What's missing is the payoff." → "What's missing is a payoff number." (fact-checker C2 OPINION-AS-FACT + compliance MUST-FIX, defamation risk about a named listed company).

## Quality check (check_post.py)
```
INFO  Total length: 1069 chars
INFO  Hook (first 2 non-empty lines): 123 chars
WARN  Outside the ideal 700-1000 char range for image posts.
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
- This run was written before my-views.md existed. Its finance topic falls outside the listed domains D1/D2. Fact-checker and compliance both noted this.
- Related opinions: O3 (GenAI improves productivity) and O4 (process improvement takes real work) are about marketing, but neither is contradicted. The post's PM advice (owner per agent, metrics) is consistent with O4's spirit.
- O1/O2 (Claude vs GPT, Fable 5/Opus 5) are not touched.
- Opinions in the post are now first-person ("I think", "My read", "In my view"). No opinion is stated as fact.

## Review panel
- Fact-checker: FIX → PASS → FIX (delta) · round 1: 19 claims, 11 verified, 7 issues; round 2: 14 claims, 0 issues; editorial delta: 6 claims, 1 issue · all fixes applied · reports: review/panel-v3.md, panel-v4.md, panel-v5.md
- Compliance: FIX → PASS → FIX (delta) · 2 must-fixes applied (survey base; payoff line); advisories applied or passed on; no escalations; disclosure question open for the author · same reports
- Editorial: EDITED · avg score 3.7 → 4.2 · 5 changes · report: review/panel-v5.md
- Rounds: 2 + editorial delta · Final draft: v7 · log: review/review-log.md
