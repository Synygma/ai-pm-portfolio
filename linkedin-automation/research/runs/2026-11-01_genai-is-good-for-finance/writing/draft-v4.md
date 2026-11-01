# Draft v4: UBS's 12,700 AI agents (panel fixes applied)
- Run: research/runs/2026-11-01_genai-is-good-for-finance/
- Date: 2026-11-01 · Format: image · Post type: Contrarian field note · Hook pattern: Number + consequence
- Status: superseded by v5 (round-2 PASS; advisories applied)

## Post
```
UBS employees now run more than 12,700 AI personal agents.
Not a pilot. That's roughly one agent for every eight employees.

UBS's Q3 2026 results also list 608 live AI use cases in production, up 81% in a year.

It isn't just UBS. A Bank of England and FCA survey (26 October) found 86% of the UK financial firms it surveyed use AI, and GenAI is 56% of the systems they reported.

So yes, I think GenAI is good for finance. But look at where it works.
80% of firms surveyed have AI agents deployed. Only 2% give them broad autonomy.

My read: the value comes from thousands of small assistants that support people while a human decides. Not from an AI analyst running the books.

In my view, that gap is telling: UBS reports how many agents and use cases it has, not what they've saved or earned.

If you're building for a bank, ship the unglamorous platform: an owner per agent, scoped data access, a human-executes default, and one outcome metric per agent set before launch.

For those in banking and finance: what metric would you use to prove an internal AI agent paid off?
```

## First comment
```
Sources:
• UBS Q3 2026 results (28 Oct 2026): https://www.ubs.com/global/en/media/display-page-ndp/en-20261028-3q26-quarterly-result.html
• Bank of England & FCA, AI in UK financial services 2026 (26 Oct 2026): https://www.bankofengland.co.uk/report/2026/artificial-intelligence-in-uk-financial-services-2026

One more detail from the same UK survey: even counting planned deployments, no more than 9% of respondents expect agents to approve customer outcomes, place trades, move payments or change limits.
```

## Hooks considered
| # | Hook | Pattern | Chars | Status / why |
|---|---|---|---|---|
| 1 | UBS employees now run more than 12,700 AI personal agents. / Not a pilot. That's roughly one agent for every eight employees. | Number + consequence | 122 | Chosen (ratio corrected per fact-checker C3) |
| 2 | 80% of UK financial firms surveyed run AI agents. Only 2% give them broad autonomy. | Number + consequence (gap) | ~83 | Alternative (reworded per C18) |
| 3 | 608 live AI use cases at UBS, up 81% in a year. UBS's results don't put a dollar figure on them. | Paradox | ~97 | Alternative (reworded per C19) |

## Changes from previous version
Round-1 review panel fixes (see review/panel-v3.md, "Fix resolution"):
- C3: "one for every nine people at the bank" → "one agent for every eight employees" (fact-checker; compliance #4)
- C7: "86% of UK financial firms use AI" → "86% of the UK financial firms it surveyed use AI" (both)
- C9: "80% of UK firms have AI agents deployed" → "80% of firms surveyed have AI agents deployed" (compliance MUST-FIX #1; fact-checker)
- C11: "So yes, GenAI is good for finance" → "So yes, I think GenAI is good for finance" (both)
- C12: unsupported task list removed; framed as "My read:" (fact-checker)
- C14: "The gap is proof. UBS reports counts, not dollars." → compliance wording (#3)
- First comment: the 9% detail is now cited to the BoE/FCA report, and the Resultsense link was removed (C17, compliance #7)
- Alternative hooks reworded (C18, C19)

## Quality check (check_post.py)
```
INFO  Total length: 1079 chars
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
(pending: round 2 and editorial)
