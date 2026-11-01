# Review panel: round 2 (DELTA) on writing/draft-v4.md
Date: 2026-11-01 · Mode: DELTA (8 changed lines) · Reports saved verbatim.

## Fact-checker
VERDICT: PASS
Claims checked: 14 · Verified: 10 · Secondary-only: 0 · Issues: 0

| # | Claim (as written) | Verdict | Source (publisher, date) | URL | Note |
|---|---|---|---|---|---|
| C1 | "Not a pilot." | VERIFIED | UBS 3Q26 release, 28 Oct 2026 | https://www.ubs.com/global/en/media/display-page-ndp/en-20261028-3q26-quarterly-result.html | UBS says employees are "running over 12,700 AI personal agents to support them in their daily activities". That is ongoing use, not a trial, so the description is fair. |
| C2 | "roughly one agent for every eight employees" | VERIFIED | UBS 3Q26 release, 28 Oct 2026 | same | My recalculation: 97,593 internal FTE ÷ 12,700 = 7.68, so "roughly one in eight" holds. Using all internal and external personnel (109,990) gives 1 in 8.66, which still rounds to about 8–9. The ratio is the writer's own calculation. UBS doesn't state it. |
| C3 | BoE and FCA survey published "26 October" | VERIFIED | Bank of England, 26 Oct 2026 | https://www.bankofengland.co.uk/report/2026/artificial-intelligence-in-uk-financial-services-2026 | The page says "Published on 26 October 2026". |
| C4 | "86% of the UK financial firms it surveyed use AI" | VERIFIED | BoE/FCA, 26 Oct 2026 | same | "86% of respondents reported using artificial intelligence". The added qualifier ("it surveyed") fixes the round-1 scope issue. |
| C5 | "GenAI is 56% of the systems they reported" | VERIFIED | BoE/FCA, 26 Oct 2026 | same | "Generative AI accounted for 56% of all reported AI systems." |
| C6 | "So yes, I think GenAI is good for finance." | OPINION-OK | n/a | n/a | Written in the first person. The finance topic falls outside D1/D2 in my-views.md but doesn't contradict any opinion there. |
| C7 | "80% of firms surveyed have AI agents deployed." | VERIFIED | BoE/FCA, 26 Oct 2026 | same | "80% of respondents reported having AI agents deployed." |
| C8 | "Only 2% give them broad autonomy." | VERIFIED | BoE/FCA, 26 Oct 2026 | same | "Only 2% reported deploying agents with broad autonomy." |
| C9 | "My read: … small assistants that support people while a human decides. Not from an AI analyst running the books." | OPINION-OK | BoE/FCA (supporting context) | same | Framed as the author's opinion. The report backs it up: most agents in production are decision-support tools, where humans make and carry out the decisions. |
| C10 | "UBS reports how many agents and use cases it has, not what they've saved or earned." | VERIFIED (factual part); OPINION-OK ("In my view, that gap is telling") | UBS 3Q26 release, 28 Oct 2026 | UBS URL | The release gives no dollar savings or revenue for AI. The USD 13.2bn in cost savings it cites comes from the Credit Suisse integration, not from AI. |
| C11 | First comment: "no more than 9% of respondents expect agents to approve customer outcomes, place trades, move payments or change limits", "even counting planned deployments" | VERIFIED | BoE/FCA, 26 Oct 2026 | BoE URL | The report says "no more than 9% of respondents expected agents to" approve or decline customer outcomes, execute trades or place orders, initiate, execute or block payments, and change limits, thresholds and controls. This includes deployments planned over the next 12 months. The paraphrase is accurate. |
| C12 | Alt hook 2: "80% of UK financial firms surveyed run AI agents. Only 2% give them broad autonomy." | VERIFIED | BoE/FCA, 26 Oct 2026 | BoE URL | "Run" is an acceptable paraphrase of "have deployed". |
| C13 | Alt hook 3: "608 live AI use cases at UBS, up 81% in a year." | VERIFIED | UBS 3Q26 release, 28 Oct 2026 | UBS URL | The release says "608 live AI use cases in production (81% YoY increase…)". |
| C14 | Alt hook 3: "UBS's results don't put a dollar figure on them." | VERIFIED | UBS 3Q26 release, 28 Oct 2026 | UBS URL | The release gives no dollar value for AI (same finding as C10). |

## Required corrections
None

## First-comment link check
- https://www.ubs.com/global/en/media/display-page-ndp/en-20261028-3q26-quarterly-result.html: loads yes · supports claims C1, C2, C10, C13 and C14: yes
- https://www.bankofengland.co.uk/report/2026/artificial-intelligence-in-uk-financial-services-2026: loads yes · supports claims C3, C4, C5, C7, C8, C11 and C12: yes

## Advisory
- Sample size: 196 firms responded (101 larger, 95 smaller). Only 105 completed the full questionnaire, and the report uses just those 105 unless it says otherwise. So the 80% and 2% may come from a different base than the 86%. "Firms surveyed" covers both cases, but adding "(196 respondents)" to the first comment would make the scope clear.
- One agent per eight employees: the ratio divides the agent count by headcount. It doesn't mean one in eight staff uses an agent, because UBS doesn't say how many employees run them. The wording is fine as it stands, but don't rephrase it to mean "1 in 8 staff use agents".
- "That gap is telling" in line 20 could point to the 80%-vs-2% gap above it or to the counts-vs-dollars gap. This is about clarity, not accuracy.
- In the BoE report I read only the first 100,000 characters, and every quoted figure was in that portion.

Sources:
- [UBS 3Q26 quarterly results, 28 Oct 2026](https://www.ubs.com/global/en/media/display-page-ndp/en-20261028-3q26-quarterly-result.html)
- [Bank of England & FCA, Artificial intelligence in UK financial services 2026, 26 Oct 2026](https://www.bankofengland.co.uk/report/2026/artificial-intelligence-in-uk-financial-services-2026)

Draft checked: C:\Users\PRAVIN\Desktop\LinkedInAutomation\research\runs\2026-11-01_genai-is-good-for-finance\writing\draft-v4.md

## Compliance
VERDICT: PASS

| # | Area (1–8) | Severity | Text in post | Risk | Safer wording |
|---|---|---|---|---|---|
| 1 | 4 | ADVISORY | "80% of firms surveyed have AI agents deployed. Only 2% give them broad autonomy." | The UK survey is named two paragraphs earlier, with the "So yes, I think…" line in between. A reader who skims might not link "firms surveyed" to the BoE/FCA survey, or might read the 80% as a global figure. The fact-checker should also confirm whether 80% is out of all respondents or only out of firms that use AI, because the post states 86% use AI just above it. | "80% of the UK firms surveyed have AI agents deployed. Only 2% give them broad autonomy." |
| 2 | 1 | ADVISORY | "In my view, that gap is telling: UBS reports how many agents and use cases it has, not what they've saved or earned." | This is framed as opinion and is fair. The factual part ("UBS reports… not what they've saved") covers everything UBS reports. If UBS has published an AI-related saving anywhere else, such as investor-day material or its cost programme, this could read as inaccurate about a named company. Limiting it to the cited document removes that risk and matches alt hook 3. | "In my view, that gap is telling: UBS's Q3 results report how many agents and use cases it has, not what they've saved or earned." |
| 3 | 8 | ADVISORY | "Not from an AI analyst running the books." | "Running the books" is an English idiom that may not be clear to a multilingual audience. It is also close to "cooking the books", which could be misread in a finance post. | "Not from an AI analyst making the decisions." |

## Escalations for the author
- None. The disclosure question (ties to UBS, banks, BoE/FCA or AI vendors) is still open and is being passed on separately. Nothing in these changes affects it.

## Image / carousel notes
- No change to the visual in this delta. The stat-card source labels from round 1 are being passed to the author separately.

## Checklist coverage
1 Defamation ✓ (sentence 6 is opinion-framed; optional scoping in advisory #2) · 2 Copyright ✓ · 3 Trademarks ✓ · 4 Financial/regulatory ✓ (the survey is called a survey, scoped to UK firms surveyed, and dated; first comment's 9% is limited to respondents and cited; advisory #1 on the 80% base) · 5 Disclosure ✓ (unchanged, pending with author) · 6 Privacy ✓ · 7 LinkedIn policy ✓ (closing question is a genuine practitioner question, not engagement bait) · 8 Cultural sensitivity ✓ (advisory #3 on idiom; region claims now scoped to the UK)

All eight changed items were checked:
- **Sentences 1, 3, 5 and 7:** no risk found apart from the idiom in advisory #3. The "one agent for every eight employees" ratio is the fact-checker's call.
- **Sentence 2:** fixes the earlier overstatement.
- **Alt hooks:** both are scoped correctly ("UK financial firms surveyed"; "UBS's results"). Neither is disparaging.

Files reviewed:
- C:\Users\PRAVIN\Desktop\LinkedInAutomation\research\runs\2026-11-01_genai-is-good-for-finance\writing\draft-v4.md
- C:\Users\PRAVIN\Desktop\LinkedInAutomation\my-views.md

## Resolution (orchestrator)
Both reviewers PASS, so no BLOCK or MUST-FIX remains. The advisory items narrow claims (they make them safer and don't add facts), so they're applied before editorial in writing/draft-v5.md:
- Compliance #1: "80% of the UK firms surveyed have AI agents deployed." (this also settles the fact-checker's base advisory)
- Compliance #2: "UBS's Q3 results report how many agents and use cases it has, not what they've saved or earned."
- Fact-checker advisory: first comment now says "(196 respondents)"
- Compliance #3 (idiom "running the books") and the fact-checker's "that gap" clarity note are passed to editorial as suggestions, not applied here.
LOCKED for editorial: all round-1 lines, plus the three lines above.
