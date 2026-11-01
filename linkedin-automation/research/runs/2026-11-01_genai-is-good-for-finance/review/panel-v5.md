# Review panel: editorial on writing/draft-v5.md
Date: 2026-11-01 · Report saved verbatim.

## Editorial
**VERDICT: EDITED**

Scores before: hook 4 · clarity 3 · rhythm 3 · value 4 · voice 4 · comments 4  (avg 3.7)
Scores after:  hook 4 · clarity 5 · rhythm 4 · value 4 · voice 4 · comments 4  (avg 4.2)

**Reasons for the scores before editing**
- **Hook (4):** It's specific (UBS, 12,700, one agent per eight employees) and fits in about 123 characters. But it shows scale rather than tension. The real tension (lots of agents, no reported payoff) only shows up below the fold.
- **Clarity (3):** "That gap is telling" could point to the 80%-vs-2% gap or to the counts-vs-money gap. "Running the books" is an idiom that won't travel well, and it sits close to "cooking the books" in a finance post. "A human-executes default" is awkward to read.
- **Rhythm (3):** Paragraphs are short and varied, but the caption is about 1,098 characters. The image-caption target is 800–900, and anything over 1,000 adds nothing.
- **Value (4):** The four-part platform checklist is concrete and reusable for both AI PMs and bank tech leaders.
- **Voice (4):** It sounds plain and practitioner-like, and the opinions are first-person. Two "Not X" lines ("Not a pilot." / "Not from an AI analyst…") lean toward AI cadence.
- **Comments (4):** A good experience-based question, but "For those in banking and finance" leaves out the AI PMs and builders who are half the audience.

## Edited post
```
UBS employees now run more than 12,700 AI personal agents.
Not a pilot. That's roughly one agent for every eight employees.

UBS's Q3 2026 results also list 608 AI use cases in production, up 81% in a year.

It isn't just UBS. A Bank of England and FCA survey (26 October) found 86% of the UK financial firms it surveyed use AI, and GenAI is 56% of the systems they reported.

So yes, I think GenAI is good for finance. But look at where it works.
80% of the UK firms surveyed have AI agents deployed. Only 2% give them broad autonomy.

My read: the value comes from thousands of small assistants that support people while a human decides.

What's missing is the payoff.
In my view, that gap is telling: UBS's Q3 results report how many agents and use cases it has, not what they've saved or earned.

Building for a bank? Ship the unglamorous platform: an owner per agent, scoped data access, humans execute by default, and one outcome metric per agent, set before launch.

If you build AI in banking or finance: what metric would prove an internal agent paid off?
```
The post is now about 1,065 characters (down from about 1,098). The hook is still 123 characters. No hashtags and no links in the body. Every LOCKED line is unchanged, and the first comment is unchanged.

## Changes
| # | Before | After | Why |
|---|---|---|---|
| 1 | "…608 live AI use cases in production…" | "…608 AI use cases in production…" | "Live" and "in production" say the same thing. Trims the length; the number and meaning are unchanged. |
| 2 | "Not from an AI analyst running the books." | (removed) | Fixes the compliance idiom concern, cuts a second "Not X" line, and saves characters. The locked "My read" sentence already says the whole opinion. |
| 3 | (nothing before the locked "that gap" line) | "What's missing is the payoff." (added on the line before it) | Makes "that gap" clearly mean the counts-vs-payoff gap, as the fact-checker asked. The locked line is moved into this paragraph without changing a word. |
| 4 | "If you're building for a bank, ship the unglamorous platform: … a human-executes default, and one outcome metric per agent set before launch." | "Building for a bank? Ship the unglamorous platform: … humans execute by default, and one outcome metric per agent, set before launch." | Easier to read on a phone. The comma stops "set before launch" from reading as describing "agent". Same four items. |
| 5 | "For those in banking and finance: what metric would you use to prove an internal AI agent paid off?" | "If you build AI in banking or finance: what metric would prove an internal agent paid off?" | Invites the AI PMs and builders as well as bank leaders. Shorter. Still asks people to answer from their own experience. |

## Changed sentences containing claims, names or opinions
- "UBS's Q3 2026 results also list 608 AI use cases in production, up 81% in a year." (please re-check: I dropped "live", which I read as meaning the same as "in production")
- "What's missing is the payoff." (restates the locked claim that the results report counts, not savings or earnings)
- "Building for a bank? Ship the unglamorous platform: an owner per agent, scoped data access, humans execute by default, and one outcome metric per agent, set before launch."
- "If you build AI in banking or finance: what metric would prove an internal agent paid off?"
- Removed: "Not from an AI analyst running the books."

## Skeptic read
1. **"12,700 'personal agents' are probably just custom chatbots, and counting them proves nothing."** Holds up: yes. The post makes this point itself in the locked "counts, not savings" line, and it asks for outcome metrics.
2. **"UBS is Swiss. Why mix it with a UK-only survey?"** Holds up: mostly. "It isn't just UBS" presents the survey as wider context, and every survey figure is limited to "the UK firms surveyed." A pedantic reader might still raise it.
3. **"Only 2% with broad autonomy is about regulation and risk appetite, not proof that small assistants are where the value is."** Holds up: partly. The claim is clearly labeled "My read," so it isn't stated as data. But the post has no measured productivity figure to back it, which is the weakest point.

## Advisory
- **Length:** about 1,065 characters is still over the image-caption ideal (800–900). Getting there would mean cutting locked content, most likely the UK survey sentence or the 80%/2% line. That's your call.
- **Evidence for the "value" claim:** if UBS or the BoE/FCA report includes any measured outcome (hours saved, cost per task), one figure would answer skeptic #3. It needs a fact-check before it goes in.
- **Hook:** alternative 2 ("608 live AI use cases… no dollar figure") puts the tension above the fold. But it would repeat the 608 line and the locked counts-vs-payoff line, so I kept the current hook.
- **Topic fit:** banking is outside the D1/D2 marketing domains in my-views.md (the earlier reviewers flagged this too), so the post may blur your profile's focus. Consider tying it to O4 (process work is where value is won) in your reply comments.
- **Stat card:** make sure the numbers on the card are the same as the hook (12,700 agents; one per eight employees) or the 80%/2% pair, with no new figures.

Files used: draft-v5.md, my-views.md, references/anatomy.md, references/hooks.md

## Orchestrator actions
- All 5 edits applied as written → writing/draft-v6.md. Locked lines verified unchanged.
- Edited sentences with claims or names sent to fact-checker + compliance (DELTA). Results below.


---
# Delta re-check of editorial edits (writing/draft-v6.md)
Reports saved verbatim.

## Fact-checker (DELTA)
VERDICT: FIX
Claims checked: 6 · Verified: 2 · Secondary-only: 0 · Issues: 1

| # | Claim (as written) | Verdict | Source (publisher, date) | URL | Note |
|---|---|---|---|---|---|
| C1 | "UBS's Q3 2026 results also list 608 AI use cases in production, up 81% in a year." | VERIFIED | UBS, 3Q26 results release, 28 Oct 2026 | https://www.ubs.com/global/en/media/display-page-ndp/en-20261028-3q26-quarterly-result.html | UBS wrote: "608 live AI use cases in production (81% YoY increase, with another 1,090+ applications in development)". "In production" already means live, so dropping "live" doesn't change the meaning. "Up 81% in a year" matches "81% YoY". |
| C2 | "What's missing is the payoff." | OPINION-AS-FACT | UBS, 3Q26 results release, 28 Oct 2026 | same as above | This is stated flatly, as a fact, and it overreaches. UBS does claim a payoff: its AI tools for developers are "leading to measurable productivity gains", and STAAT has "generated over 30 million insights" year to date. What's missing is a number for the payoff, not the payoff itself. As written, it suggests UBS's AI has no payoff, which the source doesn't support. |
| C3 | "UBS's Q3 results report how many agents and use cases it has, not what they've saved or earned." | VERIFIED | UBS, 3Q26 results release, 28 Oct 2026 | same as above | Correct. The release gives counts (12,700+ agents, 608 use cases, 18,000+ developers, 30M+ insights) but no savings or revenue figure for AI. The USD 13.2bn in cumulative gross cost savings (USD ~13.7bn expected by end-2026) comes from the Credit Suisse integration, not from AI. "In my view, that gap is telling" is correctly framed as opinion. Small nuance: the release does mention "measurable productivity gains", just without numbers (see Advisory). |
| C4 | "Building for a bank? Ship the unglamorous platform: an owner per agent, scoped data access, humans execute by default, and one outcome metric per agent, set before launch." | OPINION-OK | n/a | n/a | This is advice, written as an imperative, with no factual claim in it. "Humans execute by default" fits the BoE/FCA data already verified in v5 (2% give broad autonomy; no more than 9% expect agents to approve, trade, pay or change limits). |
| C5 | "If you build AI in banking or finance: what metric would prove an internal agent paid off?" | OPINION-OK | n/a | n/a | This is a question to readers, with no factual claim. |
| C6 | "My read: the value comes from thousands of small assistants that support people while a human decides." (after removing "Not from an AI analyst running the books.") | OPINION-OK | n/a | n/a | "My read" marks it as opinion. Taking out the contrast sentence doesn't make it misleading. It still fits UBS's own wording ("agents to support them in their daily activities") and the BoE/FCA autonomy figures. |

## Required corrections
- C2: replace "What's missing is the payoff." with "What's missing is a payoff number." This keeps the editor's clarity fix, and "that gap" in the next line still has something to refer to. Reason: UBS says its developer AI tools lead to "measurable productivity gains". It just doesn't put a number on them. Saying the payoff itself is missing goes beyond the evidence. Source: UBS 3Q26 results release, 28 Oct 2026.

## First-comment link check
- https://www.ubs.com/global/en/media/display-page-ndp/en-20261028-3q26-quarterly-result.html: loads yes · supports C1 yes, C3 yes
- https://www.bankofengland.co.uk/report/2026/artificial-intelligence-in-uk-financial-services-2026: not rechecked in delta mode (passed in v5, and none of the edits touch it)

## Advisory
- For fairness, you could make the C3 line acknowledge UBS's own claim: "UBS's Q3 results count agents and use cases and cite 'measurable productivity gains', but put no number on what they've saved or earned." This heads off any reader who quotes UBS's "measurable productivity gains" line back at you.

## Compliance (DELTA)
VERDICT: FIX

| # | Area (1–8) | Severity | Text in post | Risk | Safer wording |
|---|---|---|---|---|---|
| 1 | 1 Defamation | MUST-FIX | "What's missing is the payoff." | This is a short, flat sentence on a line of its own, and it comes before "In my view". Many readers only skim the first words of each line, and they could take it as a factual claim that UBS, a named listed bank, has had no payoff from its AI. The draft's real point is narrower: UBS's Q3 results don't report a payoff figure. The next line does make that clear. But a negative statement that sounds like fact about a listed company shouldn't depend on the following sentence to correct it. | "What's missing is a payoff figure." (or "What's missing is the payoff number."). This makes clear that the gap is in what UBS reports, not in what its AI delivers, and "that gap" in the next line still makes sense. |
| 2 | 4 Financial/regulatory | ADVISORY | "Building for a bank? Ship the unglamorous platform: …" | This is fine as practical advice from a practitioner. It doesn't claim to be regulatory guidance, and it doesn't tell readers what the BoE or FCA require. No change is needed. Just don't add wording such as "regulators expect" or "to stay compliant" in later edits. | No change needed. |

Changes reviewed and cleared without issues:
- "UBS's Q3 2026 results also list 608 AI use cases in production, up 81% in a year." Dropping "live" doesn't change the meaning, the claim is still attributed to the Q3 results, and no new risk appears. (Unused alternative hook #3 still says "608 live". That doesn't matter unless it's used later.)
- "If you build AI in banking or finance: what metric would prove an internal agent paid off?" This is a genuine question for practitioners, not engagement bait, and the wording is inclusive.
- Removing "Not from an AI analyst running the books." clears my earlier idiom advisory. The line before it ("My read: … while a human decides.") still reads well on its own.

## Escalations for the author
- None

## Checklist coverage
1 Defamation: issue (row 1) · 2 Copyright ✓ · 3 Trademarks ✓ · 4 Financial/regulatory ✓ (advisory only) · 5 Disclosure ✓ (unchanged from v5) · 6 Privacy ✓ · 7 LinkedIn policy ✓ · 8 Cultural sensitivity ✓ (idiom removal resolves earlier advisory)

## Resolution (orchestrator)
Both reviewers flagged the same line and suggested near-identical fixes. Applied: "What's missing is the payoff." → "What's missing is a payoff number." This is fact-checker's exact wording and one of compliance's two options. It is a narrowing fix and both reviewers supplied the wording, so no further round is needed. Every other editorial edit was cleared. → writing/draft-v7.md (FINAL)
Fact-checker's fairness advisory (acknowledge UBS's "measurable productivity gains") goes into the posting notes as a ready-made reply. It isn't applied, because the locked compliance line already scopes the claim.
