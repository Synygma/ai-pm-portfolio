# Draft v1: UBS's 12,700 AI agents (long version)
- Run: research/runs/2026-11-01_genai-is-good-for-finance/
- Date: 2026-11-01 · Format: image · Post type: Contrarian field note · Hook pattern: Number + consequence
- Status: superseded by v2 (1,348 chars, too long for an image caption)

## Post
```
UBS employees now run more than 12,700 AI personal agents.
Not a pilot. That's roughly one for every nine people at the bank.

The number is in UBS's Q3 2026 results this week. The same release lists 608 live AI use cases in production, up 81% in a year, with 1,090+ more in development.

And it isn't just UBS. A Bank of England and FCA survey published on 26 October found 86% of UK financial firms now use AI. Generative AI makes up 56% of the AI systems they reported.

So yes, GenAI is good for finance. But look at where it's working.
80% of UK firms have AI agents deployed. Only 2% give them broad autonomy.

The value is coming from thousands of small assistants that help people search, prepare and draft, while a human still decides and acts. Not from an AI analyst running the books.

The gap is measurement. UBS reports counts, not dollars. It says 18,000 developers using AI tools have seen "measurable productivity gains", but gives no number.

My read: GenAI in finance has won the adoption argument. The next argument is about proof.

If you're building for a bank, ship the unglamorous platform: an owner for every agent, scoped data access, a human-executes default, and one outcome metric per agent defined before launch.

For those in banking and finance: what's the one metric you'd use to prove an internal AI agent paid off?
```

## Hooks considered
| # | Hook | Pattern | Chars | Status |
|---|---|---|---|---|
| 1 | UBS employees now run more than 12,700 AI personal agents. / Not a pilot. That's roughly one for every nine people at the bank. | Number + consequence | 125 | Chosen: named bank, hard primary number, scale made concrete |
| 2 | 80% of UK financial firms now run AI agents. Only 2% let them act on their own. That gap is where GenAI actually works in finance. | Number + consequence (gap) | ~131 | Alternative: regulator data, strong, slightly less fresh |
| 3 | 608 live AI use cases at UBS, up 81% in a year. Not one dollar of savings attributed to them. | Paradox | ~93 | Alternative: sharper, but leads with the caveat rather than the stance |
| seed | "…Earlier today I said GenAI is bad at financial modeling…" | Callback | — | Rejected: refers to a post the user may not have published |

## Changes from previous version
First draft.

## Quality check (check_post.py)
```
INFO  Total length: 1348 chars
INFO  Hook (first 2 non-empty lines): 125 chars
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
No posts were marked as published when this draft was made (or at migration on 2026-11-01), so there was nothing to overlap with. Overall overlap: 0%.
