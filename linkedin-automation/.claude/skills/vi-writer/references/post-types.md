# Post types, formats and templates

## Format guide [DATA: AuthoredUp Mar 2025–Feb 2026 reach multipliers; Buffer 2026 median engagement rate]

| Format | Data | Use for | Avoid |
|---|---|---|---|
| Text-only | 1.07× reach; 3.18% ER. Long beats short. | Opinions, test results, post-mortems | Short text from a small account |
| Document / carousel | 1.39× reach, 1.30× engagement (1.72× for top-5% profiles); 21.77% ER; leads above 20K followers | Eval rubrics, agent architecture, AI PM interview frameworks, tool comparison matrices | Long captions; generic "10 AI tools" decks |
| Image | 1.20× reach, 1.33× engagement; best under 5K followers | Real eval chart, whiteboard, before/after UI screenshot | Stock or AI-generated decorative images |
| Video | 0.86× reach but 7.35% ER; 3 min+ does better | Screen-recorded build demos, 2–4 min walkthroughs | Video that doesn't match its caption (demoted) |
| Poll | 1.78× reach but 0.37× engagement | One-off audience research, followed by a results post | Using polls for credibility |

Default when unsure: text + one real screenshot for builds and findings; document for reusable frameworks.

## Post types (pick one)

### A. Build log (text + 1 screenshot). Credibility 3–4. Expectation → Reality → Fix
```
I built [thing] with [tool/model] in [time].
It [good outcome with number], and [surprising failure].

Context: [who it's for, scale, why it mattered].

What worked:
1. [decision + result]
2. [decision + result]

What broke:
→ [failure, the specific example]

What I changed:
→ [fix + new number]

[One-sentence takeaway a PM can reuse].

[Experience question for people who've built similar]?
```
First comment: the rubric/prompt/repo + one extra detail.

### B. Contrarian field note (text-only, short). Credibility 3. Claim → Test → Result → Caveat
```
Everyone says [common AI belief].
We tested it on [real sample]. [Result that contradicts it].

[How you tested].
[The number].
[The caveat: where it might still hold].

[Reframe: what to do instead].

[Optional: "Method in comments."]
```
End on a statement; the caveat gives commenters something to discuss. Under ~700 chars only if the finding is sharp; otherwise add "why this happens" to reach ~1,000.

### C. Career framework (document carousel + short caption). Credibility 5
Caption (≤100 chars): `[N] [things] I [saw/learned] [doing specific work]. #[1 tag]`
Slides:
```
1  Title: [outcome promise] + [your evidence base]
2  The problem: [what most candidates/teams get wrong]
3–8  One idea per slide: [question or skill] · Weak answer: [example] · Strong answer: [example]
9  The pattern across all of them
10 [Question for the reader] (no "follow me" slide)
```

### D. Release verdict (text, optional 👍/👎 markers). Credibility 2. Upside / Downside / Verdict
```
I've used [model/tool] for [time] on [real work].
[Better at X]. [Worse at Y].

👍 [upside 1, concrete example]
👍 [upside 2]
👎 [downside 1, concrete example]
👎 [downside 2]

Best for: [who / which task]
I'm sticking with [choice] for [task] because [reason].

[Optional question: what are you seeing on [specific task]?]
```
Must include first-hand use. Post within ~48h of release.

### E. Scene story. Scene → Turn → Lesson
```
[Specific person, role/age, setting]. [One detail that sets up the tension].

[What happened, 2–4 short lines, in sequence].

[The unexpected detail: the turn].

[One-line lesson tied to an AI PM / adoption insight].
```
Person must be real (anonymize). Get consent if they're identifiable.

### F. Prediction with field notes. Setup → Numbered observations → Reflection
```
[Bounded, checkable prediction + timeframe].

What I'm seeing:
1. [first-hand observation]
2. [first-hand observation]
3. [observation or credited quote]
4. [observation]

[Punchy closing line that restates the "why"].
```

### G. Research translation. Claim → Finding → Caveat → Practice
```
[Common practice] doesn't [do what people think]. / A new study tested [X].

[What was tested, 1 line].
[Finding with number].
[Caveat].

What I'd change on a product team: [1–2 concrete actions].

Paper in comments.
```
Credit the authors by name.

### H. Enterprise adoption post-mortem. Expectation → Reality → Fix
```
Our [AI rollout] hit [vanity metric]. [Real metric] told a different story.

[Context: org size, tool, timeline].

What we expected: [1 line]
What happened: [2–3 lines with numbers]
Who/what blocked it: [stakeholder or process, anonymized]
What unblocked it: [change + result]

[Takeaway for anyone rolling out AI internally].

[Experience question]?
```
This is an under-supplied gap in the niche, so lean into it when the user has rollout experience.

## Credibility ladder
1 I read about it → 2 I tried it → 3 I measured it → 4 I shipped it → 5 I made it reusable. Aim for 3–5. Levels 1–2 only for fast news reactions, and always with a verdict.
