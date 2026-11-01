# My Views

The domains I post about on LinkedIn and the opinions my posts stand on. The `vi-writer` skill reads this file on every run:
- **No input** (`/vi-writer` on its own): it picks a domain from the Domains table and writes a post that expresses one or more of my opinions.
- **With input** (`/vi-writer <topic>`): it still checks the post against my opinions so nothing I publish contradicts them.

Edit freely. Keep the IDs (D1, O1…) stable, because run folders refer to them. The skill updates only the `Last used` column and the usage log at the bottom.

---

## Domains

| ID | Domain | Active | Priority | Last used |
|---|---|---|---|---|
| D1 | Generative AI in marketing | yes | 1 | never |
| D2 | Recent Claude and GPT updates and their impact on marketing | yes | 1 | never |

### D1: Generative AI in marketing
- **Scope:** how marketing teams use GenAI for content, campaigns, personalization, research, analytics and operations, and what it changes about marketing workflows and roles.
- **Angles I like:** real productivity numbers; where GenAI fails or needs heavy process work; the gap between "we bought a tool" and "we changed the process"; what marketing leaders should do next.
- **Look for:** surveys and studies (Gartner, McKinsey, Salesforce State of Marketing, HubSpot, Adobe), company case studies with numbers, agency and brand rollouts, tool launches aimed at marketers.
- **Related opinions:** O3, O4 (main), O1 (when tools are compared).

### D2: Recent Claude and GPT updates and their impact on marketing
- **Scope:** the most recent model and product updates from Anthropic (Claude) and OpenAI (GPT/ChatGPT), usually the latest 2 from the last few weeks, and what they change for marketing work: copywriting, brand voice, multilingual content, research, campaign ops, agents.
- **Angles I like:** side-by-side "what changed and does it matter for marketers"; release verdicts based on published evaluations and credible reviews; where an update helps or hurts real marketing tasks.
- **Look for:** official release notes and model cards (anthropic.com, openai.com), credible hands-on reviews, benchmark results, reported regressions, marketer and agency reactions.
- **Related opinions:** O1, O2 (main), O3.

---

## Opinions

Strength: **firm** means I hold it strongly and posts should state it clearly. **Lean** means my current view, open to nuance.

### O1: Claude is better than GPT for professional work
- **My words:** "Claude is better than GPT."
- **Refined stance:** for professional knowledge work, especially writing, editing and long-form reasoning, Claude is the stronger choice over GPT.
- **Strength:** firm
- **Domains:** D2, D1
- **How to use it:** state it as my view ("My pick is still Claude, and here's why"), backed by sourced evidence: published evaluations, benchmark results, credible reviews, or specific differences in the release notes. Compare on specific marketing tasks (copy quality, brand voice, long briefs, research), never as a blanket fan claim.
- **Guardrails:** don't claim Claude wins on every benchmark. Acknowledge where GPT is ahead if the evidence shows it, while keeping my overall preference clear.

### O2: Fable 5 and Opus 5 have problems with their language output
- **My words:** "Fable 5 and Opus 5 messed up their languages output."
- **Refined stance:** the Claude Fable 5 and Opus 5 releases had noticeable problems in their language output, which matters for marketing teams that depend on output quality.
- **Note to confirm:** does "language output" mean writing quality and tone, or non-English / multilingual output? Until that's clarified, posts should describe the specific issue the evidence shows and not generalize.
- **Strength:** firm (my experience)
- **Domains:** D2
- **How to use it:** present it as my view or observation ("In my view, Fable 5 and Opus 5 stumbled on language output"). Support it with public evidence where it exists: user reports, reviews, release-note fixes, follow-up versions. Be specific about what went wrong and what marketers should check before relying on the output.
- **Guardrails:** don't invent incidents, numbers or quotes. If no public evidence is found, keep it a clearly labelled personal opinion in one or two sentences, not the post's factual backbone. This sits alongside O1: Claude can be better overall and still have had a bad release.

### O3: GenAI for marketing can improve productivity
- **My words:** "Gen AI for marketing can improve productivity."
- **Refined stance:** GenAI produces real productivity gains for marketing teams, such as faster drafting, research, variations and campaign prep.
- **Strength:** firm
- **Domains:** D1, D2
- **How to use it:** lead with measured gains from credible sources (time saved, output per marketer, campaign speed), then connect to O4.
- **Guardrails:** say "can", not "will". The gains are real but not automatic.

### O4: Process improvement in marketing with GenAI takes a lot of work
- **My words:** "Process improvements in marketing using gen AI require a lot of work."
- **Refined stance:** getting lasting process gains (not one-off speedups) takes serious work: redesigning workflows, brand-voice guidelines, review and approval steps, data and tool integration, training and governance. Buying the tool is the easy part.
- **Strength:** firm
- **Domains:** D1
- **How to use it:** pair it with O3 as "the productivity is real, but the process work is where the value is won or lost". Give concrete examples of the work involved and a practical recommendation.
- **Guardrails:** not anti-AI. The point is that the effort is necessary and worth it.

### How the opinions fit together
O3 + O4: GenAI makes marketers faster, but turning that into better marketing processes is real work. O1 + O2: I prefer Claude, and I still call out its releases when they slip, which makes my preference credible rather than fandom.

---

## Voice
Used by the editorial reviewer to keep posts sounding like me. These are starter defaults based on the research report. Edit them to match how I actually write.
- **Tone:** practitioner, plain-spoken, confident but not hype-y. Opinions stated clearly as mine.
- **Do:** short sentences, concrete numbers, one clear takeaway, a question practitioners can answer.
- **Don't:** buzzwords, "game-changer", emoji walls, "Agree?", fake humility.

### Sample posts (optional, add 3–5 of my real LinkedIn posts here)
_None added yet._

---

## Rules for posts written from this file
1. Every post must agree with these opinions. A post may add nuance, but must never argue against an opinion I hold.
2. Opinions are expressed as **my views**, in first person ("I think", "my pick", "in my view"). Facts in the post must still come from verified sources. My opinion is never presented as data.
3. If fresh evidence contradicts an opinion, don't flip my stance and don't hide the evidence. Choose another trend, or write the nuanced version that keeps my view and acknowledges the counterpoint honestly. Flag it in the posting notes so I can update this file.
4. Use one or two opinions per post, not all four.
5. Rotate domains. Pick the active domain with the oldest `Last used` date, with Priority as the tie-break.

---

## Usage log
| Date | Domain | Opinions used | Run folder | Post |
|---|---|---|---|---|
