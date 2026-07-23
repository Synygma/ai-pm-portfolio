# Pravin — AI Product Management Portfolio

**Aspiring AI Product Manager**

---

## About

I work at the intersection of enterprise technology and AI-driven product strategy. My approach to product problems is research-led: combine real user data with AI-assisted synthesis, hold every finding to a real-vs-synthetic standard, and arrive at recommendations precise enough to act on.

This portfolio is updated as new projects are completed. **Seven projects** are live below, spanning consumer research, market intelligence, and applied product architecture — each executed end-to-end with the rigor expected of a strategy function inside a product organization.

**Connect:** [LinkedIn](#) · [Email](#)

---

## Project 1 — Consumer Persona Research
### Flight Booking Behavior on OTA Platforms (Goibibo / MakeMyTrip)

**What it is:** A qualitative consumer research project studying flight booking behavior on the Nagpur–Bangalore route, using a real interview as primary data and AI-assisted synthesis to extend it into a complete, evidence-based consumer persona.

**Process:**
- Conducted a real structured interview (45 minutes) on booking behavior, pain points, and decision triggers
- Used Claude AI to extract insights from the transcript, tagged as REAL vs IMPLIED
- Synthesized 2 additional realistic traveler profiles to stress-test the findings (clearly labeled AI SYNTHESIS)
- Consolidated into one final persona — **Kavya Iyer** — anchored in real data, extended with AI synthesis
- Documented every prompt used at every stage

**Key Skill Demonstrated:** Distinguishing real user data from AI-generated extension — critical for any PM using AI in research, where over-trusting synthetic data is a common and costly mistake.

📄 [View Full Persona Report](./Assignment1_Consumer_Persona.docx)

---

## Project 2 — Market Intelligence Report
### Lovable.dev — AI App Builder Market & Competitive Analysis

**What it is:** A full market and competitive intelligence report on Lovable.dev, the fastest-growing software company in history by ARR velocity ($0 to $200M ARR in 11 months). Covers company background, product strategy, digital strategy, ecosystem, competitive landscape, and product manager recommendations.

**Process — 6 research phases, each independently sourced and documented:**
1. **Company Background** — Founders, $882.5M funding history, business model
2. **Product Analysis** — Jobs-to-be-done framing, feature differentiation vs Cursor/Replit
3. **Digital Strategy** — SimilarWeb traffic data: 98.94M visits, 67% direct traffic, geographic trends
4. **Ecosystem & Growth** — 13+ MCP connectors, 7 partner programs, platform strategy
5. **Competitive Analysis** — 5-competitor comparison (Cursor, Replit, Bolt.new, Bubble, Webflow) with positioning map
6. **PM Recommendations** — 6 data-backed recommendations, prioritized P0/P1, each tied to a measurable success metric

**The Central Finding:** Lovable has 8 million users but only 180,000 paying subscribers — a sub-3% free-to-paid conversion rate. Every recommendation in the report traces back to fixing this single metric, rather than treating each finding as an isolated observation.

**Tools Used:** Perplexity AI (research), SimilarWeb (traffic data), SEMrush (SEO, free-tier substitute for SpyFu), Claude AI (synthesis), Gamma (presentation)

**Key Skill Demonstrated:** Synthesizing six independent research threads into one strategic narrative — the PM skill of finding the single root problem that explains the most data, rather than producing a list of disconnected facts.

📄 [View Full Market Intelligence Report](./MiniProject_FINAL_UPLOAD_Lovable_Report.pdf)
📊 [View Presentation](./Lovable_Market_Intelligence_Presentation.pdf)
📄 [View AI Prompt Documentation](./MiniProject_AI_Prompts_Documentation.pdf)

---

## Project 3 — SunQuote AI
### Solar Panel Installation Quotation Manager

**What it is:** An AI-powered quotation management tool for solar panel installation businesses. Automates system sizing, feasibility checking, and cost estimation — reducing what typically takes a site engineer days into an instant, transparent first-pass assessment.

**Process:**
- Mapped the manual quotation workflow (customer enquiry → feasibility check → cost estimation → leadership approval → sent) into a structured 4-layer architecture — Frontend, API, Backend, Database
- Designed role-based access control across 3 user types — Sales, Site Engineer, Manager — each restricted to their own workflow and data visibility, with no cross-role access
- Built an AI layer that estimates system size (kW), cost (with subsidy), and feasibility from customer inputs (electricity bill, roof type, roof area, shading conditions)
- Implemented a confidence-based safety mechanism — low-confidence cases are automatically flagged and routed to a human Site Engineer instead of the AI silently guessing
- Iteratively tested and fixed access-control and status-transition bugs across each user role before finalizing

**Key Skill Demonstrated:** Applying a structured product architecture (RBAC + AI validation discipline) to a real business workflow — not just prompting an AI tool to generate an app, but deliberately designing where AI should make autonomous decisions and where it must defer to a human.

🔗 [Live Demo](https://tidy-solar-quote-flow.base44.app)

---

## Project 4 — Ticket Triage Assistant
### AI-Powered Salesforce Support Ticket Categorization & Effort Estimation

**What it is:** An AI-powered triage tool that takes a raw support ticket description and instantly returns its category, estimated resolution effort, priority level, recommended first troubleshooting step, and a draft response — replacing inconsistent manual triage with a repeatable, pattern-grounded process.

**Process:**
- Documented the manual triage workflow support leads actually follow — category → effort estimate → priority → first action → response
- Built a Claude AI project trained on a knowledge base of real resolved-ticket patterns (Configuration Change, Apex/Code Bug, Integration Issue, Data Fix, Training/How-To)
- Validated the model's output against known past tickets before treating any estimate as reliable
- Converted the validated logic into a working artifact, then into a deployed end-to-end application
- Instructed the system to flag low-confidence classifications explicitly rather than presenting a guess as certain

**Key Skill Demonstrated:** Taking a validated AI reasoning process — not just a prompt — and turning it into a structured, repeatable tool. Estimates are grounded in documented past patterns rather than the model's untethered judgment, which is the difference between an AI feature and an AI feature you can actually trust in production.

🔗 [Live Demo](https://capable-triage-flow-desk.base44.app)

---

## Project 5 — GradeX
### AI-Powered Multi-Evaluator Answer Grading System

**What it is:** An AI-powered answer evaluation tool that grades a student's response against a rubric using two independent AI evaluators, then reconciles their scores through a moderator pass — flagging low-confidence checkpoints for human review instead of trusting a single AI's grade blindly.

**Process:**
- Studied a real-world AI exam evaluation system design and identified the core gap: single-model AI grading has no way to signal when its own judgment is uncertain
- Designed a three-call evaluation pipeline — two independent evaluators score the same answer against rubric checkpoints without seeing each other's output, then a moderator model compares both and assigns per-checkpoint confidence (high/low)
- Built the app on Base44 with Groq (Llama 3.1 8B Instant) powering all three evaluation calls, using role-differentiated system prompts to simulate independent grading
- Structured output as a checkpoint-level breakdown rather than a single opaque score — surfacing exactly where a human reviewer should double-check the AI's grading versus where it can be trusted
- Documented the prototype's current limitation honestly — both evaluators run on the same underlying model, simulating independence via prompt design rather than true model diversity

**Key Skill Demonstrated:** Designing confidence-aware AI systems — where the product surfaces its own uncertainty instead of presenting every output as equally reliable. This is the same human-in-the-loop discipline applied in Project 3 and Project 4, now applied to a grading/evaluation context.

🔗 [Live Demo](https://gradex-grade-smart.base44.app)

---

## Project 6 — SparkBox
### AI-Powered Employee Innovation & Suggestion Management Platform

**What it is:** An AI-powered innovation management platform that fixes a common enterprise failure point — employee suggestions that go unread. Employees submit raw, unstructured ideas; AI restructures them into clear proposals; department managers and an innovation lead move them through a defined review-to-implementation pipeline.

**Process:**
- Identified the three-sided organizational failure this solves: employees can't articulate ideas clearly, managers don't have time to parse unstructured submissions, and leadership has zero visibility into what's being submitted or actioned org-wide
- Designed role-based access control across 3 user types — Employee, Department Manager, Innovation Head — with Managers strictly isolated to their own department's submissions only
- Scoped AI to a single, deliberate responsibility: converting a raw submission into a structured proposal (Problem Statement, Proposed Solution, Benefit, Effort Estimate, Cost Estimate) with a stated confidence level — never replacing or hiding the original raw input
- Mapped a full idea-lifecycle status workflow — Submitted → Under Review → Endorsed/Returned → Approved/Rejected → Implemented — with an Employee-initiated Withdraw path
- Built the entire application from a single, comprehensive, well-structured prompt on a no-code platform (Base44) rather than iterating with many small piecemeal instructions
- Validated the role-based access design with named test users across two different departments — confirming true department-level data isolation rather than assuming it worked

**Key Skill Demonstrated:** Designing role-based access control and a deliberate AI-scope boundary *before* writing a single prompt — the product thinking happens ahead of the build tool, not inside it. This is the same human-in-the-loop discipline applied in Project 3, 4, and 5, now applied to an internal enterprise workflow tool.

🔗 [Live Demo](https://sparkbox-idea-flow.base44.app)

---

## Project 7 — InvoiceIQ
### AI-Powered Vendor Invoice Verification & Approval System

**What it is:** An AI-powered application that automates vendor invoice verification against purchase orders — replacing a manual, error-prone cross-checking process with automated PO matching, duplicate detection, and AI-generated verification reasoning that a Finance Manager can act on immediately.

**Process:**
- Identified a real operational bottleneck — accounts teams manually cross-checking every vendor invoice against purchase orders, with inconsistent verification and no structured reasoning passed to the approver
- Designed role-based access control across 2 user types — Accounts Executive (submits invoices) and Finance Manager (reviews and approves/rejects) — each restricted to their own screens and permissions
- Mapped a full status workflow — Submitted → AI Verified → Flagged → Approved/Rejected → Paid
- Scoped AI to a single, deliberate responsibility: matching invoice amount against the referenced PO, detecting duplicate invoice numbers, and generating a plain-language explanation for every flag — so the reviewer gets ready-made reasoning instead of a blind approval request
- Built the entire application from one comprehensive, structured prompt on Base44, covering entities, roles, workflow, and AI logic in a single pass to minimize costly re-generation cycles
- Iteratively fixed UI-level issues (notification behavior, branding consistency) through scoped follow-up prompts that explicitly preserved existing functionality rather than risking a full re-build

**Key Skill Demonstrated:** Replacing a manual verification step with an AI layer that produces auditable reasoning rather than an opaque score — the same human-in-the-loop discipline applied across Projects 3, 4, 5, and 6, now applied to a finance/procurement workflow. Also demonstrates disciplined, credit-aware prompt engineering on a constrained no-code platform.

🔗 [Live Demo](https://smart-invoice-iq.base44.app)

---

## What These Projects Demonstrate

| Skill | Where It Shows |
|---|---|
| Real vs AI-synthesized data discipline | Consumer Persona project — REAL/IMPLIED/AI tagging throughout |
| Structured AI-assisted research at scale | Market Intelligence Report — 6 independent research phases, fully documented |
| Strategic synthesis | Tracing 6 recommendations back to one root metric (sub-3% conversion) |
| Applied product architecture design | SunQuote AI — role-based access control and AI confidence-routing built from a mapped business process |
| Validated, pattern-grounded AI reasoning | Ticket Triage Assistant — estimates grounded in documented past tickets, not untethered model judgment |
| Confidence-aware AI system design | GradeX — dual-evaluator + moderator pipeline that flags its own uncertainty instead of hiding it |
| Prompt-first, single-shot product design | SparkBox — full RBAC + AI-scope boundary designed before a single prompt was written, built in one comprehensive prompt |
| AI as auditable decision-support, not a black box | InvoiceIQ — AI generates plain-language reasoning for every flagged invoice instead of a silent score |
| Narrative & communication | Translating dense research into a clear, presentation-ready story |
| Tool fluency | Perplexity, SimilarWeb, SEMrush, Claude, Gamma, Base44 — used deliberately, limitations documented honestly |

---

## Approach

I treat AI as a research and synthesis accelerator, not a shortcut. Every project in this portfolio follows the same discipline: separate real data from AI-generated extension, trace every recommendation back to a measurable problem, and communicate findings the way a strategy team would present them to leadership — clear, evidence-backed, and free of unnecessary complexity.

I am building toward AI Product Management and AI Consulting roles, with a focus on enterprise-grade product strategy.
