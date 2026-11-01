---
name: vi-writer
description: Write a final, ready-to-paste LinkedIn post in the AI / AI Product Management niche, grounded in current, verified industry evidence and following the evidence-based "Anatomy of an AI Post" (hook, context, body, takeaway, CTA, first comment). For every input, whether a topic or a domain, it automatically calls the trend-captain agent to find and rank the last 3 days' trends, then writes about the top-ranked one (skip with --no-trend). Posts always agree with the author's opinions in my-views.md; with no input, it picks the domain and opinions from my-views.md automatically. Use when the user invokes /vi-writer, or asks to draft/write a LinkedIn post about AI tools, enterprise AI adoption, AI product management or AI careers, or asks for a post on "what's trending" in a domain.
argument-hint: [topic or domain; leave empty to use my-views.md] [optional: angle, opinion, format] [--no-trend]
allowed-tools: Agent, Skill, AskUserQuestion, WebSearch, WebFetch, Read, Write, Edit, Bash
---

# Vi-writer: LinkedIn post writer (AI / AI PM niche)

You turn a topic into **one final LinkedIn post the user can copy and paste with no editing**. The post follows the anatomy in the research report `anatomy-of-an-ai-post.html` (project root). Its evidence comes from **what is happening in the industry right now**: research you do on the web at invocation time, not the user's private context. The rules are distilled into the `references/` files next to this one; read them as instructed rather than re-reading the HTML.

The topic and any notes are in: `$ARGUMENTS`

## The author's views: `my-views.md` (read on every run)
`my-views.md` in the project root lists the user's **domains** (D1, D2…) and **opinions** (O1, O2…), with strength, how to use each one, guardrails, and rules. Read it at the start of every run.
- **If `$ARGUMENTS` is empty:** pick the domain from its Domains table. Choose the active domain with the oldest `Last used` date, using Priority as the tie-break. Use that domain plus its main related opinions as the input. Classify it as a TOPIC whose stance is the chosen opinion(s), and tell the user in one line: `No topic given. Using D<n> "<domain>" with views O<x>, O<y> from my-views.md.` If the file is missing or has no active domain, ask the user for a topic and stop.
- **If `$ARGUMENTS` is given:** use it as normal, but still find the opinions that relate to it, and make sure the post agrees with them.
- **Alignment is required.** The post must agree with the user's opinions and must never argue against one. Express opinions in first person as the author's views ("my pick is…", "in my view…"). Back them with verified evidence where it exists, and never present an opinion as data. Follow each opinion's guardrails. Use one or two opinions per post.
- **If evidence contradicts an opinion,** don't flip the stance and don't hide the evidence. Prefer another trend. Otherwise write the nuanced version that keeps the view and honestly acknowledges the counterpoint, and flag it in the posting notes.
- This **overrides the "write the version the evidence supports" instruction** in Steps 0 and 1 wherever a related opinion exists in `my-views.md`. Facts still must be real: never misstate evidence to fit a view.

## Non-negotiable rules

1. **No placeholders. Ever.** The output post must contain zero `[brackets]` or blanks to fill. If a beat needs a fact you could not verify, rewrite the beat so it no longer needs it, or drop it.
2. **Every fact is real and sourced.** Each number, study, company action, quote or event in the post must come from a source you actually opened in Step 2 (not from memory alone, and not from a search snippet you didn't verify when it's a key number). Record source name, date and URL for each. If two sources conflict, use the more primary one or say the range.
3. **Never fabricate the user's personal experience.** Do not write "we tested", "my team", "I shipped", "at my company", or invent meetings, clients or anecdotes. Opinions and observations the user recorded in `my-views.md` may be stated in first person as their views, but don't embellish them with invented specifics. Write as an informed practitioner reading the industry: "Here's what the data shows", "[Company] disclosed…", "The pattern I keep seeing in these reports…". The opinion, interpretation and PM recommendation are the author's voice; the evidence belongs to named sources. Use first-person experience only if the user supplied it in `$ARGUMENTS`.
4. **Practitioner framing.** Credibility comes from specific sourced numbers + a clear interpretation + a concrete decision a PM/team should make. See `references/ai-niche.md` and `references/research.md`.
5. **No engagement bait.** No "comment X / agree?", no keyword-for-DM, no stacked follow/repost asks (LinkedIn demotes these, March 2026).
6. **Links never in the body.** Name sources in the body in plain words ("per Gartner's 2026 survey"); put URLs in the first comment.
7. **0–2 hashtags**, specific ones. Tag people/companies only if they genuinely appear in the post.
8. Plain, human language. Avoid the AI cadence and banned phrases in `references/anatomy.md`.

## Workflow

### Storage (applies to every step)
All research, debates, summaries, drafts and the final post are saved systematically under `research/runs/<run-folder>/` in the project, plus a copy of the final post in `posts/`. Read `references/storage.md` for the full folder layout, naming and file templates, and follow it. **Save as you go**, after each step, so even an interrupted run keeps its research.

**Step S: open the run folder (before anything else).** Create `research/runs/YYYY-MM-DD_<input-slug>/` (add `_2` if it exists). Write `request.md` with the raw input, the classification (DOMAIN/TOPIC/--no-trend), the derived domain, any notes, and a timestamp. Create `research/INDEX.md` and `research/backlog.md` with headers if missing.

Then load the user's **published** posts. Run `python "<this skill's folder>/scripts/publish.py" --published-summary` and keep the output (date, title, thesis per published post). Only posts marked published count for overlap. Drafts never do. See "Publication tracking and overlap" below.

### Step 0: Always send the input to trend-captain first (automatic, don't ask the user)
Every invocation, whether the input is a broad domain ("AI in finance") or a specific topic or stance ("gen AI for finance is bad"), goes to the trend-captain agent first. The post is then written about the **top-ranked trend** it returns.

The only exception is when the user explicitly adds `--no-trend` (or says "skip trends" / "write exactly this topic"). Then skip to Step 1 and research the topic directly.

**Classify the input to brief the agent:**
- **DOMAIN:** a field or area with no claim, event or company action ("AI agents", "LLM evals", "AI PM careers"). The agent scans the whole domain.
- **TOPIC:** a stance, claim, named event, company, product or study ("gen AI for finance is bad", "Klarna's AI support reversal"). Derive the parent domain (for example "AI in finance"). The agent scans that domain, **gives priority to trends connected to the topic or stance**, and reports whether recent evidence supports, contradicts or nuances the stance.
- Any user-supplied experience, angle or format preference is passed along as notes and kept for the writing steps.

**Call trend-captain:**
1. Tell the user in one line: `Sending "<input>" to trend-captain for the last 3 days' trends…`
2. Launch the agent with the Agent tool, `subagent_type: "trend-captain"`, using this prompt (fill in the values; today's date comes from your context):
   ```
   Run folder: <absolute path of the run folder from Step S>
   Input type: <DOMAIN | TOPIC>
   Domain: <domain, or parent domain derived from the topic>
   Focus topic / stance (TOPIC only): <the user's topic or stance, verbatim, or "none">
   Today's date: <YYYY-MM-DD>
   Audience: LinkedIn, AI / AI Product Management practitioners (PMs, builders, enterprise AI leaders).
   User's extra notes (experience, angle, format), if any: <notes or "none">
   Already published by the user (avoid overlap; apply your overlap penalty): <output of publish.py --published-summary, or "none">
   Author's views (from my-views.md; prefer trends where these can be expressed with real evidence): <the related opinions: ID, refined stance, strength, guardrails>
   Domain source: <"user input" or "my-views.md D<n>, chosen automatically">
   (For D2-type domains about "recent updates", find the latest relevant releases, usually 2, from the last few weeks, even if they're older than 3 days. Say so in Notes.)
   Find the trending topics from the last 3 days, rank them for LinkedIn potential (giving priority to trends tied to the focus topic, if any), pick the top 3, and return your TREND-CAPTAIN REPORT with the evidence pack for the #1 topic. Save your search log, candidates, source notes and report into the run folder as described in your instructions.
   ```
3. Wait for the report. Never write the post before it arrives, and never invent its contents. When it arrives, confirm `trend-scan/trend-report.md` exists in the run folder. If the agent didn't save it, save the returned report there yourself.
4. **Evaluate the #1 pick before accepting it.** Accept it if its evidence pack has at least 4 sourced facts, including a real number and a named example, all dated within the window, **and** its thesis is not the same as a published post's thesis (a pre-check of the angle-overlap rubric in Step 5b). Otherwise take #2 (or #3) if it's stronger. If the report shows no qualifying trend at all:
   - For a TOPIC input, fall back to Step 1 with the user's topic and research it directly. Tell the user no fresh trend matched.
   - For a DOMAIN input, tell the user and ask whether to write on the domain as an evergreen topic.
   For TOPIC inputs, if the agent reports that recent evidence contradicts the user's stance, write the version the evidence supports and say so in the posting notes.
5. **Hand-off into the writing steps:**
   - The selected topic and ANGLE become the topic and stance for Step 1.
   - Use POST TYPE, FORMAT and LANE as the default choices in Step 3 (override only with a stated reason).
   - The evidence pack becomes your Step 2 evidence pack. Only verify the 1–3 numbers you'll put in the hook or rely on most, by opening the source. Do not redo the whole research.
   - Use HOOK SEEDS, CAVEAT and PM DECISION as raw material in Step 4.
6. Keep the Top 3 table for the output (Step 6) and the saved files (Step 7). Append ranks #2 and #3 (and any strong "other candidates") to `research/backlog.md`.

### Step 1: Understand the input
From `$ARGUMENTS`, extract the topic, any stance the user wants (for example "X is bad", "X is overhyped"), any first-hand detail they gave, and any format preference. Map it to a lane: evals/quality, enterprise AI adoption, AI tools, AI PM career, AI news, building with AI.

If the user gives a blanket opinion ("gen AI for finance is bad"), don't just repeat it. Sharpen it into the most defensible, specific version the evidence supports (for example "GenAI is unreliable at producing numbers, which is the part of finance that matters most"). If the evidence contradicts the stance, say so to the user in the posting notes and write the version the evidence supports.

### Step 2: Research the industry (required; skip if trend-captain already supplied an evidence pack)
Read `references/research.md` and follow it. In short:
- Run 3–6 web searches in one batch (WebSearch), prioritizing the **last 6–12 months** and primary or credible sources: research papers and benchmarks, regulator/standards bodies, major surveys (Gartner, McKinsey, BCG, Deloitte, Stanford AI Index…), company filings/earnings/official blogs, reputable reporting (Reuters, FT, WSJ, Bloomberg, The Information).
- Open (WebFetch) the 2–4 most useful sources to verify the exact numbers, dates and wording you will use.
- Build an **evidence pack**: 4–8 facts, each with number/claim, source, date, URL, and a tier (primary / credible secondary).
- Look for: one headline number, one concrete real-world example (a company, product, incident or regulator action), one counter-point or caveat, and what's changed recently.

If you cannot find enough verified evidence for the angle, pick a narrower angle the evidence supports. Never fill the gap with invented facts.

**Save the research (always, including when trend-captain supplied the evidence):**
- Every page you open (WebFetch), including the 1–3 verification fetches after trend-captain, gets a source note in `sources/`, numbered after the agent's files.
- `analysis/evidence-pack.md`: the final fact table (claim, exact number, source file link, date, URL, tier), noting which facts appear in the post.
- `analysis/debates.md`: the strongest counter-arguments, conflicting figures across sources and how you resolved them, the stance check (supports/contradicts/nuances the user's input), and 2–3 likely pushback comments with suggested replies.
- `analysis/summary.md`: what happened, why it matters now, who is affected, the PM decision, and the angle chosen for the post.

### Step 3: Choose the post type and format
Read `references/post-types.md`. For industry-sourced posts, the best fits are usually:
- **Contrarian field note**: common belief → what the evidence shows → caveat → reframe.
- **Research translation**: one study/benchmark → what it changes for product teams.
- **Prediction with evidence**: bounded prediction → 3–4 sourced signals → why.
- **Industry post-mortem**: a public incident or failed rollout → what went wrong → lesson.
- **Release verdict**: only from published evaluations and reviews, never claiming the user used it.
- **Framework carousel**: a reusable checklist/rubric distilled from multiple sources.
Choose format from the format guide (text default; document for frameworks).

### Step 4: Write the post using the anatomy
Read `references/anatomy.md` and `references/hooks.md`.
1. **Hook** (lines 1–2): core idea within **≤140 characters**, built on a real number, named company/tool or named event from the evidence pack. Open the tension above the fold. Draft 3 hooks with different patterns; use the best and show the other 2.
2. **Context** (1–3 lines): why this matters now: the recent event/report and its scale. Name the source.
3. **Body** (3–5 beats): paragraphs ≤3 lines, varied rhythm, one sourced number per beat, include one caveat or counter-evidence. Lists only for real sets.
4. **Takeaway**: one quotable sentence that is the author's own interpretation.
5. **CTA**: an experience question practitioners can answer, or a clean statement ending.
6. **First comment**: the source list (short names + URLs) and one extra detail that didn't fit.

Length: text ~900–1,500 characters (cap 3,000); document captions ≤100 characters with 8–10 slides; image captions ~800–900. For video, write the caption plus a 5-beat talking outline.

### Step 5: Self-check
Each draft version is **one Markdown file**: `writing/draft-vN.md`. It holds the post and every detail about that version. No separate .txt, .log or hooks files. Each revision gets the next N. Create it with this layout:

````
# Draft vN: <working title>
- Run: research/runs/<run folder>/
- Date: YYYY-MM-DD · Format: <format> · Post type: <type> · Hook pattern: <pattern>
- Status: candidate | superseded by vN+1 | final

## Post
```
<post body exactly as it will be pasted, no first comment>
```

## Hooks considered
| # | Hook | Pattern | Chars | Status / why |
(all hooks drafted for this version; in later versions, only list them if the hooks changed, otherwise write "Same as v1")

## Changes from previous version
<what changed and why, or "First draft">

## Quality check (check_post.py)
## Overlap check (check_overlap.py)
(both filled in by record_checks.py)

## Overlap judgement
<written in Step 5b>

## Views alignment
<written in Step 5c>

## Review panel
<written by the review panel (Step 5d) on the final draft>
````

Then run both checks. The results are written into the same file:
```
python "<this skill's folder>/scripts/record_checks.py" <run folder>/writing/draft-vN.md --format text|image|document|video|poll
```
Read the two result sections in the file.

Fix every FAIL (placeholders are a FAIL). Consider every WARN. Then do the manual checks in `references/checklist.md`, especially: every fact traces to the evidence pack, no invented personal experience, and the numbers and dates match the sources exactly. Revise once.

### Step 5b: Overlap check against published posts (required; FAIL at 25%)
A post must not overlap significantly with anything the user has **already published on LinkedIn**. Drafts and unpublished posts are ignored.

1. **Text overlap (script).** This was already run by `record_checks.py` in Step 5; its result is in the draft's "Overlap check" section. It compares the draft with every post file in `posts/` marked `status: published`. It blends content similarity, reused 3-word phrases, hook similarity and shared statistics into an overlap % per post, and reports the highest.
2. **Angle overlap (your judgement).** The script can't see paraphrase: the same thesis in different words. Compare the draft's thesis, takeaway and key evidence with each published post's `thesis` (front matter) and post body, and rate it:
   - 0–10%: different topic.
   - 10–20%: same domain, different thesis and different evidence.
   - 25–50%: same thesis with new evidence, or the same key evidence or numbers framed differently.
   - 50%+: same thesis and same evidence.
   A deliberate follow-up that explicitly builds on a published post ("Last week I wrote X. Here's what changed") can score lower, but only if at least two-thirds of the evidence is new.
3. **Overall overlap = the higher of the two.** Fill in the draft's `## Overlap judgement` section with your angle rating per relevant published post, the reasoning, and the overall %. Then set the draft's Status line.
4. **If overall ≥ 25%, the post FAILS.** Do not deliver it. Change the angle, evidence or hook and re-check, or switch to trend #2/#3, then re-run Steps 4–5b. After two failed attempts, stop and tell the user which published post it collides with and what you tried.
5. 15–24% is a WARN. Deliver it, but name the closest published post in the posting notes.
Report the result in the output as `**Overlap:** <N>% vs <closest published post or "none published">`.

### Step 5c: Views alignment check (required)
Fill in the draft's `## Views alignment` section with:
- each opinion used (ID and stance) and the exact line(s) in the post that express it;
- every related opinion **not** used, and a confirmation that the post doesn't contradict it;
- each guardrail checked (for example O1: "no claim that Claude wins every benchmark"; O2: "no invented incidents");
- any evidence that pushes against an opinion, and how the post handles it.
If any line contradicts a firm opinion, or states an opinion as fact, revise and re-check. Report it in the output as `**Views:** O<x>, O<y> ✓`.

### Step 5d: Review panel (required, automatic)
Once the draft passes Steps 5–5c, run it through the review panel. Follow `C:\Users\PRAVIN\Desktop\LinkedInAutomation\.claude\skills\review-panel\SKILL.md` exactly, with the current `writing/draft-vN.md` as input. You can invoke it via the Skill tool (`review-panel`) or follow its steps directly. It runs:
1. **fact-checker** and **compliance** in parallel. They verify every claim independently and screen legal, copyright, defamation, disclosure, privacy, policy and cultural-sensitivity risk. You apply their fixes; compliance wins conflicts. ESCALATE items go to the user.
2. **editorial**, which scores engagement for the target audience and edits if it clearly helps, without touching facts, stance or locked lines. A delta re-check covers any edited sentence with claims or opinions.
3. At most 2 rounds. If a BLOCK remains, don't deliver. Tell the user why.

Reports are saved in `<run folder>/review/panel-vN.md`, and every fix or edit creates the next `writing/draft-vN.md`. **The post you deliver in Step 6 is the panel's final draft**, never the pre-review one.

### Step 6: Output
Respond in this structure. When trend-captain was used, start with the trend block:

```
[Only if trend-captain was used:]
**Trends in <domain>, <window>** (via trend-captain)
| Rank | Trend | Date | Score | Why |
|---|---|---|---|---|
| 1 ✅ | ... (selected) |
| 2 | ... |
| 3 | ... |
<one line: why #1 was accepted, or why a lower-ranked trend was chosen instead>

**Post type:** <type> · **Format:** <format> · **Lane:** <lane>
**Hook pattern:** <pattern> · **Length:** <N> chars · **Hook (above fold):** <N> chars
**Overlap:** <N>% vs <closest published post, or "none published yet"> (limit 25%) · **Views:** <O-ids used> ✓ (domain <D-id> if from my-views.md)
**Review panel:** Fact-checker <verdict, n claims verified> · Compliance <verdict> · Editorial <NO CHANGES | EDITED, avg score a→b> · <n> round(s)

---
<the final post, ready to paste, plain text: no markdown bold/headers>
---

**First comment:**
<sources with URLs + one extra detail>

**Alternative hooks:**
1. <hook>
2. <hook>

[If carousel: **Slides:** numbered slide content]
[If video: **Talking outline:** 5 beats]

**Evidence used:** <one line per fact: claim → source, date>

**Editorial changes:** <the editorial changes table (before → after → why), or "None: editorial approved the draft as is">

**Posting notes:** <2–4 bullets, including any compliance ADVISORY items and the skeptic-read comments to expect: attachment suggestion, timing (Tue–Thu, when you can reply 60–90 min), likely pushback and how to reply, any place where the evidence was thin or the user's original stance was adjusted>
```

Use plain line breaks for structure; `→` and simple numbering are fine. Use emoji only as sparse markers in verdict posts.

### Step 7: Save and index (always)
1. **`final/post.md`** in the run folder: a header (input as given, routing, date, post type, format, lane, check result, run folder path), then the full Step 6 output.
2. **`posts/YYYY-MM-DD-<short-topic-slug>.md`**: the same content plus a line linking back to the run folder. Use the selected trend for the slug, not the raw input. If the name exists, append `-v2`, `-v3`. Never overwrite. The file **must start with this front matter**:
   ```
   ---
   status: draft
   published_url:
   published_date:
   post_type: <type>
   run_folder: research/runs/<run folder>/
   thesis: <one sentence: the post's core claim + its key evidence>
   ---
   ```
   The `thesis` line is what future runs compare against, so make it specific.
3. **`README.md`** in the run folder: input, routing, selected trend and why, post type, final file links, and a file map of everything in the folder.
4. **`research/INDEX.md`**: add a row at the top of the table (format in `references/storage.md`).
5. **`research/backlog.md`**: make sure the runners-up are listed. If this post came from a backlog item, tick it and link the post.
5b. **`my-views.md`**: if the domain came from my-views.md (or the input clearly matches one of its domains), set that domain's `Last used` to today's date and add a row to its Usage log (date, domain ID, opinion IDs, run folder, post file). Don't change anything else in that file. If the run found evidence against an opinion, mention it in your reply so the user can decide whether to update the file.
6. Tell the user the run folder and the post path at the end of your reply.

## Publication tracking and overlap
Each post file in `posts/` carries `status: draft | published`, `published_url` and `published_date` in its front matter. Only published posts count for the overlap check.

- **When the user says a post went live** ("I published the UBS post: <url>", "mark X as published"), run:
  ```
  python "<this skill's folder>/scripts/publish.py" <post file or part of its name> --url <linkedin url> [--date YYYY-MM-DD]
  ```
  Then add `(published <date>)` after the post link in that run's row in `research/INDEX.md`, and confirm to the user.
- **Undo:** `publish.py <post> --unpublish`. **See status:** `publish.py --list`.
- If the user asks "is this too close to my other posts?" about any text, save it to a scratch file and run Step 5b on it.
- If they've published two versions of the same post (for example -v2 replacing the original), only the one they mark as published counts.

## Follow-ups after a trend run
If the user says "write #2" or "do the next one", write about that trend from the saved report (`trend-scan/trend-report.md` or `research/backlog.md`). Use the report's row and run Step 2 research for it, since only #1 has an evidence pack. Do not call trend-captain again unless the user asks for fresh trends. Open a new run folder for it (`YYYY-MM-DD_<trend-slug>`). Write `request.md` noting it came from the backlog, with a link to the original run, and reuse any relevant source notes by linking to them rather than copying.

## Revisions
For changes ("shorter", "more contrarian", "make it a carousel"), keep the same anatomy and rules, and re-use the evidence pack (research more only if the new angle needs it, and save new sources). Save the new version as the next `writing/draft-vN.md` (with its own checks) in the **same run folder**, then `final/post-v2.md` and a new versioned file in `posts/`. Mark the earlier draft "superseded" and update the run README.
