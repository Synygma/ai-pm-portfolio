# Storage conventions: where every artifact of a run goes

Project root: `C:\Users\PRAVIN\Desktop\LinkedInAutomation\`

```
LinkedInAutomation/
├─ anatomy-of-an-ai-post.html        foundation research report (do not move)
├─ posts/                            final posts only, one .md per post (quick-access copy)
│                                    each starts with front matter: status (draft|published), published_url,
│                                    published_date, post_type, run_folder, thesis. Manage it with scripts/publish.py
└─ research/
   ├─ INDEX.md                       one row per run (newest at the top)
   ├─ backlog.md                     runner-up trends and unused angles → future post ideas
   └─ runs/
      └─ YYYY-MM-DD_<input-slug>/    one folder per /vi-writer invocation
         ├─ README.md                run summary: input, routing, selected trend, outcome, file map
         ├─ request.md               the raw input, classification, notes, timestamp
         ├─ trend-scan/              written by trend-captain
         │  ├─ search-log.md         every query run, mode, # results, useful hits
         │  ├─ candidates.md         all candidates: date, sources, scores, keep/drop reason
         │  └─ trend-report.md       the full TREND-CAPTAIN REPORT as returned
         ├─ sources/                 one file per source actually opened (agent + skill share this)
         │  └─ NN-<publisher>-<short-slug>.md
         ├─ analysis/                written by vi-writer
         │  ├─ summary.md            what happened, why it matters, who's affected, PM decision
         │  ├─ evidence-pack.md      final fact table used for the post
         │  └─ debates.md            counter-arguments, conflicting figures, stance check, expected pushback + replies
         ├─ writing/
         │  ├─ draft-v1.md           ONE file per version: the post, hooks considered, changes,
         │  │                        quality check, overlap check, overlap judgement, status
         │  └─ draft-v2.md …         each revision (earlier ones marked "superseded")
         ├─ review/                  review panel reports (saved verbatim)
         │  └─ panel-vN.md           fact-checker + compliance (+ editorial) reports for draft vN
         └─ final/
            └─ post.md               the full Step 6 output (identical to the posts/ copy)
```

## Naming
- Run folder: `YYYY-MM-DD_<input-slug>`, where the slug is lowercase with hyphens, max ~6 words, taken from the user's input (e.g. `2026-11-01_ai-agents`, `2026-11-01_genai-finance-is-bad`). If it exists, append `_2`, `_3`.
- Source files: two-digit sequence + publisher + short slug: `03-gartner-cfo-ai-value-survey.md`. Continue numbering from the highest existing number (`ls sources/`).
- Revisions of the same post (shorter, carousel…) stay in the **same run folder**: `writing/draft-v3.md`, `final/post-v2.md`, and a new `posts/…-v2.md`.

## Source note template (`sources/NN-….md`)
```
# <Title of the page>
- URL: <url>
- Publisher: <name> · Author: <if known>
- Published: <YYYY-MM-DD> (verified on page | from snippet only)
- Accessed: <YYYY-MM-DD>
- Tier: primary | survey | reputable reporting | practitioner | secondary write-up of <original>
- Opened by: trend-captain | vi-writer

## Summary (3–5 lines)
## Key facts (exact numbers and wording)
- ...
## Caveats / methodology notes
## Used for: <trend name / post claim>
```
Pages that returned errors (403, paywall) also get a source note marked `NOT ACCESSIBLE`, with what was learned from snippets instead.

## INDEX.md row format
`| YYYY-MM-DD | <input> | topic/domain | <selected trend> | <post type> | [run](runs/<folder>/README.md) | [post](../posts/<file>.md) |`
Create the file with a header row if missing:
`| Date | Input | Routed as | Selected trend | Post type | Run | Post |`

## backlog.md entry format
`- [ ] YYYY-MM-DD · <trend> · score <N> · rank #<r> in <run folder> · suggested type: <type> · why: <one line>`
Tick (`[x]`) an entry and add the post link when it gets written.

## Rules
- Save as you go (after each step), not only at the end, so a failed run still leaves its research.
- Never delete or overwrite earlier runs, sources or drafts.
- Files are plain Markdown/text, UTF-8.
