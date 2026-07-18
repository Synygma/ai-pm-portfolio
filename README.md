# Pravin — AI Product Management Portfolio

**Aspiring AI Product Manager**

---

## About

I work at the intersection of enterprise technology and AI-driven product strategy. My approach to product problems is research-led: combine real user data with AI-assisted synthesis, hold every finding to a real-vs-synthetic standard, and arrive at recommendations precise enough to act on.

This portfolio is updated as new projects are completed. **Project 1**, **Project 2**, and **Project 3** below are live now; additional work will be added as it is finished.

This portfolio documents projects built from the ground up — consumer research, market intelligence, and applied product architecture — each executed end-to-end with the rigor expected of a strategy function inside a product organization.

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

## What These Projects Demonstrate

| Skill | Where It Shows |
|---|---|
| Real vs AI-synthesized data discipline | Consumer Persona project — REAL/IMPLIED/AI tagging throughout |
| Structured AI-assisted research at scale | Market Intelligence Report — 6 independent research phases, fully documented |
| Strategic synthesis | Tracing 6 recommendations back to one root metric (sub-3% conversion) |
| Applied product architecture design | SunQuote AI — role-based access control and AI confidence-routing built from a mapped business process |
| Narrative & communication | Translating dense research into a clear, presentation-ready story |
| Tool fluency | Perplexity, SimilarWeb, SEMrush, Claude, Gamma, Base44 — used deliberately, limitations documented honestly |

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

# AI Answer Sheet Evaluator (GradeX)

A mini prototype exploring how to make AI-based grading trustworthy — 
not just accurate.

**Live Demo:** https://gradex-grade-smart.base44.app

## The Problem

When AI grades a student's answer, the output is just a number — 
"3/4 marks." But how do you know when to trust that number, and 
when to double-check it? A single AI evaluation is a black box: 
you either accept it blindly, or manually re-check everything, 
which defeats the purpose of automation.

## The Approach

Instead of a single AI call, this evaluates each answer using:

1. **Two independent evaluators** — the same rubric and answer are 
   sent to two separate AI calls with distinct evaluator personas, 
   scoring independently without seeing each other's output.
2. **A moderator pass** — a third AI call compares both evaluations 
   checkpoint by checkpoint. Where both evaluators agree, the 
   result is marked **high confidence**. Where they disagree, it's 
   flagged **low confidence** for human review.

The output isn't just a score — it's a score plus a map of exactly 
where a human should double-check the grading, and where they don't 
need to.

## How It Works

- **Input:** Question, grading rubric (checkpoints), student's answer
- **Evaluation:** Two independent AI evaluations against the rubric, 
  checking for conceptual meaning rather than exact keyword matches
- **Moderation:** A third AI call reconciles both evaluations and 
  assigns a confidence level per checkpoint
- **Output:** Final score, checkpoint-by-checkpoint breakdown, and a 
  flagged "Needs Human Review" section for low-confidence checkpoints

## Tech Stack

- React + Tailwind CSS
- Groq API (Llama 3.1 8B Instant) for all evaluation calls
- Built on Base44

## Note

This is a simplified prototype — both evaluators currently use the 
same underlying model with different system prompts to simulate 
independent grading, rather than genuinely different model 
architectures. A production version would use distinct models 
(e.g. GPT, Claude, Grok) for true evaluator diversity.

## Inspiration

Built after studying a session on designing AI-based exam evaluation 
systems as part of the IIT Madras AI Product Management program — 
exploring how to design human-in-the-loop checkpoints into an AI 
pipeline rather than relying on a single model's output.

---

## Approach

I treat AI as a research and synthesis accelerator, not a shortcut. Every project in this portfolio follows the same discipline: separate real data from AI-generated extension, trace every recommendation back to a measurable problem, and communicate findings the way a strategy team would present them to leadership — clear, evidence-backed, and free of unnecessary complexity.

I am building toward AI Product Management and AI Consulting roles, with a focus on enterprise-grade product strategy.
