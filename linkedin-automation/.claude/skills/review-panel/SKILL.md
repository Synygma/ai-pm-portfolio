---
name: review-panel
description: Runs a LinkedIn post through the three-agent review panel (fact-checker, compliance, editorial) and returns a verified, compliance-cleared, engagement-edited final post. vi-writer runs this automatically after every draft. Use it directly when the user wants any post reviewed, invoking /review-panel with a draft file path or the post text.
argument-hint: <path to draft-vN.md or post .md file, or pasted post text>
allowed-tools: Agent, Read, Write, Edit, Bash
---

# Review panel: fact-checker · compliance · editorial

Input: `$ARGUMENTS`. This is a draft `.md` file (with the post inside a fenced block under `## Post`) or pasted post text. When called from vi-writer, it's the current `writing/draft-vN.md` in a run folder.

Skill scripts: `C:\Users\PRAVIN\Desktop\LinkedInAutomation\.claude\skills\vi-writer\scripts\`
Author's views: `C:\Users\PRAVIN\Desktop\LinkedInAutomation\my-views.md`

## Setup
- **Inside a vi-writer run:** the run folder is the parent of `writing/`. Reports go in `<run folder>/review/`.
- **Standalone** (pasted text or a file outside a run): create `C:\Users\PRAVIN\Desktop\LinkedInAutomation\research\reviews\YYYY-MM-DD_<slug>\`. Save the post as `writing/draft-v1.md` using vi-writer's draft layout (header, `## Post` block, first comment if given). Run `record_checks.py` on it. Use that folder as the run folder.
- Note the format (text/image/document/video/poll), the audience/domain (from the draft header, the run's request.md, or my-views.md), and the first comment.

## Precedence and limits
- If reviewers conflict: **compliance > fact-checker > editorial > original draft**.
- **At most 2 rounds** of fact-checker + compliance. If a BLOCK remains after round 2, stop. Don't deliver the post. Show the user the blocking issues and what was tried.
- **ESCALATE** from compliance: pause and ask the user (AskUserQuestion) with the options compliance gave. Continue with their choice.
- Editorial edits are **applied automatically** (the delivered post must be paste-ready), but the full diff is shown to the user.

## Round 1: fact-checker and compliance (in parallel, one message, two Agent calls)
Prompt for **fact-checker** (`subagent_type: "fact-checker"`):
```
MODE: FULL
Today's date: <YYYY-MM-DD>
Draft file: <absolute path>   (read only the ## Post block, the first comment and the header; do NOT open the run's sources/ or analysis/ folders)
Author's views: C:\Users\PRAVIN\Desktop\LinkedInAutomation\my-views.md
Post:
<post text>
First comment:
<first comment text>
Verify every claim independently and return your report in the required format.
```
Prompt for **compliance** (`subagent_type: "compliance"`):
```
MODE: FULL
Today's date: <YYYY-MM-DD>
Draft file: <absolute path>
Author's views: C:\Users\PRAVIN\Desktop\LinkedInAutomation\my-views.md
Format and planned visual: <format; describe the planned image/carousel if any>
Audience: <domain / audience>
Post:
<post text>
First comment:
<first comment text>
Screen against your full checklist and return your report in the required format.
```
Wait for both. Save their reports verbatim to `review/panel-vN.md`, where N is the draft version reviewed, under `## Fact-checker` and `## Compliance`.

## Apply fixes
- **PASS / PASS:** go to Editorial.
- **FIX:** apply every required correction and every MUST-FIX safer wording exactly as given. Where the two conflict, compliance wins.
- **BLOCK:** if the problem is fixable (remove or replace the claim, reframe as opinion, cut the copied passage), fix it. If the claim was the hook or the core of the argument, rebuild that part using only VERIFIED facts from the fact-checker's table. If it can't be fixed, stop (see limits).
- **ESCALATE:** ask the user first, then apply their choice.
- Save the result as the next `writing/draft-vN+1.md`. In "Changes from previous version", list each fix and its reviewer and claim/issue ID. Mark the reviewed draft "superseded". Run `record_checks.py` on the new draft and fill in its Overlap judgement and Views alignment, as vi-writer Steps 5b–5c require.
- If any BLOCK or FIX was applied, run **round 2** (same two agents, `MODE: DELTA`, listing only the changed sentences) on the new draft. Save as `review/panel-vN+1.md`.
- Every line changed by a fix is now **LOCKED** for editorial.

## Editorial
Prompt (`subagent_type: "editorial"`):
```
Draft file: <absolute path of the current draft>
Format: <format> · Audience: <domain/audience>
LOCKED lines (keep verbatim): <list, or "none">
Post:
<post text>
First comment:
<first comment text>
Alternative hooks: <from the draft>
Review, score, edit if it clearly helps, and return your report in the required format.
```
Append the report to the current `review/panel-vN.md` under `## Editorial`.
- **NO CHANGES:** the current draft is final.
- **EDITED:** save the edited post (and first comment, if changed) as the next `writing/draft-vN.md`, with the changes table in "Changes from previous version". Run `record_checks.py`. Redo the Overlap judgement and Views alignment.
  - If quality or overlap now FAILs, or a LOCKED line changed, reject the specific edits that caused it and keep the rest.
  - If editorial listed **changed sentences containing claims, names or opinions**, run fact-checker + compliance in `MODE: DELTA` on just those sentences. Save to `review/panel-vN.md`. Revert any edit they flag.

## Finish
1. In the final draft, add a `## Review panel` section:
   ```
   - Fact-checker: <verdict> · <n> claims checked · <n> verified · <fixes applied> · report: review/panel-vX.md
   - Compliance: <verdict> · <issues fixed / escalations and the user's choice> · report: review/panel-vX.md
   - Editorial: <NO CHANGES | EDITED> · avg score <before> → <after> · report: review/panel-vY.md
   - Rounds: <n> · Final draft: vN
   ```
   Set its Status to `final`.
2. **Standalone use:** reply with the final post (ready to paste), the first comment, the review summary lines, the editorial diff, and the folder path. Write `final/post.md` in the review folder.
3. **Called from vi-writer:** return to vi-writer Step 6. It delivers the reviewed final draft with the review summary.

## Rules
- Reviewers' reports are saved verbatim. Never edit them.
- Never apply an edit that adds an unverified fact.
- The post delivered must be the version after the panel. Never deliver a pre-review draft as final.
