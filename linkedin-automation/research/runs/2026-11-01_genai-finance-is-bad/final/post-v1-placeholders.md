# GenAI for finance: the numbers problem

- **Topic (as given):** gen ai for finance is bad
- **Date:** 2026-11-01
- **Post type:** Contrarian field note · **Format:** Text-only · **Lane:** Enterprise AI adoption
- **Hook pattern:** Test result · **Length:** ~1,080 chars · **Hook (above fold):** 140 chars
- **Check script:** PASS (16 placeholders to fill)

## Post (ready to paste once the placeholders are filled)

```
GenAI is bad at the part of finance that matters most: the numbers.
We tested [model] on [N] [finance task]. [X] of them had a wrong figure.

Context: I'm [your role] at [type of company]. We ran this for [time period] before deciding whether to roll it out to [team].

How we tested:
Every output was checked line by line against [source of truth, e.g. the GL or the approved Excel model].

What went wrong:
→ [failure 1, e.g. a subtotal that didn't tie to the ledger]
→ [failure 2, e.g. a prior-period figure quoted as current]

The worst part was that the wrong answers read exactly as confidently as the right ones. Our reviewers caught [Y] of the [X] errors.

Where it did help:
[task where it worked, e.g. drafting variance commentary from numbers we supplied]. That saved [time saved] per [cycle]. The difference: the model never had to produce a number itself.

So my rule for finance teams is simple.
Let the model write the words. Let deterministic systems produce the numbers.

If you've put GenAI into a finance workflow: which task did you pull it back from, and what replaced it?
```

## First comment

```
How we set up the test: [prompt/rubric or a short description of the eval set]. One thing that didn't fit in the post: [extra detail, e.g. what happened when we gave the model a calculator tool or retrieval from the ledger].
```

## Alternative hooks

1. *Number + consequence:* Our finance copilot drafted [N] variance reports in [time]. [X] had a number that didn't tie to the ledger.
2. *Paradox:* The more fluent our AI finance assistant got, the harder its mistakes were to catch. (Use this only if your experience actually showed it.)

## Fill before posting

- **[model], [N], [finance task], [X]:** Which model did you test, on which task (for example reconciliations, variance analysis, forecasting commentary), how many outputs, and how many had a wrong figure?
- **[your role], [type of company], [time period], [team]:** What's your role, what kind of company, how long did the test run, and which team was it meant for?
- **[source of truth], [failure 1], [failure 2], [Y]:** What did you check outputs against, what were 2 real errors, and how many errors did your reviewers catch?
- **[task where it worked], [time saved], [cycle]:** Where did it help, and how much time did it save per cycle (for example per month-end close)?

## Posting notes

- **If you haven't run a test like this,** don't post it in this form. Either rewrite it as an opinion with your actual reasoning and drop the "we tested" framing, or run a small test first (for example 20 real outputs checked against your books).
- **Attach a screenshot.** An anonymized side-by-side of one AI output and the correct figure would add credibility.
- **Timing:** post Tuesday to Thursday when you can reply for 60–90 minutes.
- **Replies:** answer the first person who pushes back (for example "it works with tool calling") with a follow-up question about their setup.
