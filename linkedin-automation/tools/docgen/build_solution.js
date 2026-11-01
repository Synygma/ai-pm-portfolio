const H = require("./helpers.js");
const { fs, path, OUT, K, INK, MUTED, CW, run, p, rich, h1, h2, h3, bullet, numbered, pageBreak, table, callout, chip, legend, cover, numbering, styles, sectionProps, footer } = H;
const { Document, Packer, Paragraph, TextRun, ImageRun, AlignmentType, TableOfContents } = H.D;

const img = (file, w, h, caption) => [
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 160, after: 60 }, children: [new ImageRun({ type: "png", data: fs.readFileSync(path.join(OUT, file)), transformation: { width: w, height: h }, altText: { title: caption, description: caption, name: file } })] }),
  p(caption, { italics: true, color: MUTED, size: 18, align: AlignmentType.CENTER, after: 160 }),
];

const c = [];
c.push(...cover("LinkedIn Automation", "Purpose, how it works, when it runs, and its architecture: one document for owners, clients and builders", [
  ["Owner", "Pravin"],
  ["Version", "1.0 · 1 November 2026"],
  ["Audience", "Section 1–4 for clients and decision makers · Section 5–9 for technical readers"],
  ["Location", "C:\\Users\\PRAVIN\\Desktop\\LinkedInAutomation"],
]));
c.push(pageBreak());
c.push(new Paragraph({ children: [new TextRun({ text: "Contents", bold: true, size: 30, color: INK })], spacing: { after: 120 } }));
c.push(new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }));
c.push(pageBreak());

// ---------------- 1 purpose ----------------
c.push(h1("1. Purpose"));
c.push(p("Posting consistently on LinkedIn about AI and AI product management takes hours per post: finding what is new, checking facts, writing in a format that performs, and making sure nothing is wrong, risky or repetitive. This automation does that work end to end, so the author spends minutes, not hours, and only on decisions that need a human."));
c.push(h2("1.1 The problem it solves"));
c.push(table(["Without automation", "With this automation"], [
  ["Hours searching news for something worth saying", "An agent scans the last 3 days of industry news and ranks the best story for LinkedIn"],
  ["Numbers copied from secondary blogs, sometimes outdated", "Every number is verified at its original source by an independent fact-checker"],
  ["Posts that read like generic AI hype", "Posts follow a researched post anatomy and the author’s own opinions and voice"],
  ["Risk of defamation, copyright or insensitive wording", "A compliance reviewer screens 8 risk areas before anything is published"],
  ["Repeating the same point across posts", "Every draft is compared with already-published posts; ≥25% overlap fails"],
  ["No record of where facts came from", "Every source, review and draft is saved in an auditable folder"],
], [CW / 2, CW / 2], { size: 18 }));
c.push(h2("1.2 Goals"));
["Publish-ready posts with zero placeholders and zero invented facts.", "Topics grounded in what is happening now in AI, AI product management and enterprise AI adoption.", "Content that always agrees with the author’s stated opinions (my-views.md).", "Independent quality gates: facts, legal/sensitivity, engagement.", "The author stays in control: nothing goes live without an explicit “Post now”."].forEach((t) => c.push(bullet(t)));
c.push(h2("1.3 Benefits"));
c.push(table(["Benefit", "How"], [
  [{ text: "Speed", kind: "orch" }, "Research, writing and review run automatically; the author reviews one final post"],
  [{ text: "Credibility", kind: "fact" }, "Primary-source numbers, named sources in the post, links in the first comment"],
  [{ text: "Safety", kind: "comp" }, "Defamation, copyright, disclosure and cultural checks; risky claims softened or removed"],
  [{ text: "Consistency", kind: "edit" }, "Same proven structure every time; engagement scored and improved by an editor agent"],
  [{ text: "Traceability", kind: "store" }, "A run folder per post with sources, debates, reviews, drafts and publishing evidence"],
], [2000, CW - 2000], { size: 18 }));

// ---------------- 2 at a glance ----------------
c.push(h1("2. At a glance (client view)"));
c.push(p("The simplest way to explain the system: five steps, with the author in control at the start and at the end."));
c.push(...img("client-overview.png", 600, 225, "Figure 1. How the LinkedIn automation works, in five steps (docs/client-overview.png)."));
c.push(table(["Step", "What happens", "Who"], [
  [{ text: "1 Choose", kind: "input" }, "The author gives a topic (e.g. “genai is good for finance”), a domain (“AI agents”), or nothing; then the system picks one of the author’s focus areas and opinions", "Author or system"],
  [{ text: "2 Find", kind: "trend" }, "The trend agent scans the last 3 days of news, papers, regulator updates and company announcements and picks the strongest story for LinkedIn", "System"],
  [{ text: "3 Write", kind: "orch" }, "The writer builds the post from verified facts, in the author’s voice and opinions, following the post anatomy", "System"],
  [{ text: "4 Check", kind: "fact" }, "Three reviewers: fact-checker, compliance, editorial. Problems are fixed and re-checked", "System (author decides escalations)"],
  [{ text: "5 Publish", kind: "pub" }, "The author sees the final post and either copies it or lets the system post it via Chrome after saying “Post now”", "Author approves"],
], [1500, 5726, 1800], { size: 18 }));
c.push(pageBreak());

// ---------------- 3 how it works ----------------
c.push(h1("3. How it works: step by step"));
c.push(p("Every run follows the same ordered steps. Each step saves its output before the next one starts, so an interrupted run still leaves its work behind."));
const steps = [
  ["S", "orch", "Start a run", "Create a run folder research/runs/<date>_<topic>/ and record the request; load the author’s opinions (my-views.md) and the list of published posts.", "request.md"],
  ["1", "gate", "Decide what to write about", "No input → pick the focus area used longest ago from my-views.md. Topic → find its wider domain. Domain → scan it. --no-trend → skip trend search.", "request.md"],
  ["2", "trend", "Find trends (trend-captain)", "6–10 web searches; keep stories published in the last 3 days; score each out of 100 for LinkedIn (relevance, evidence, practical angle, debate potential, freshness, originality, durability, hype risk); bonus if it fits the author’s opinions, penalty if it repeats a published post; pick the top 3.", "trend-scan/, sources/"],
  ["3", "gate", "Accept the top trend", "The #1 trend must have ≥4 sourced facts including a real number and a named example, all recent, and a thesis not already published. Otherwise use #2/#3.", "backlog.md"],
  ["4", "orch", "Verify and plan", "Re-open the key sources to confirm the 1–3 most important numbers; choose post type (e.g. contrarian note, research translation) and format (text, image, document).", "analysis/"],
  ["5", "orch", "Write", "Hook ≤140 characters (3 options), context, 3–5 evidence beats with a caveat, one-line takeaway, a question for practitioners, and a first comment holding the source links.", "writing/draft-v1.md"],
  ["6", "check", "Automatic checks", "Quality (length, hook, bait phrases, links, hashtags, placeholders), overlap with published posts (≥25% fails), angle overlap, and alignment with the author’s opinions.", "writing/draft-vN.md"],
  ["7", "panel", "Review panel", "Fact-checker and compliance review in parallel → fixes applied → re-check of changed lines (max 2 rounds) → editorial improves engagement → final re-check of edited claims.", "review/"],
  ["8", "store", "Deliver and save", "The author receives the final post, first comment, evidence list, review summary and posting notes; everything is filed and indexed.", "final/, posts/, INDEX.md"],
  ["9", "pub", "Publish", "Option A copy-paste · Option B Claude in Chrome (exact-text check, preview, “Post now”, post once, first comment) · Option C later. The post is then marked published with its URL.", "publish/, posts/"],
];
c.push(table(["#", "Step", "What happens", "Saved to"], steps.map((s) => [{ text: s[0], kind: s[1] }, s[2], s[3], s[4]]), [600, 1800, 4826, 1800], { size: 17 }));
c.push(h2("3.1 The review panel in detail"));
c.push(table(["Reviewer", "Checks", "Can change the post?"], [
  [{ text: "fact-checker", kind: "fact" }, "Every number, date, name, quote and comparison against primary sources; recomputes derived figures; flags opinions written as facts", "No: gives exact corrections"],
  [{ text: "compliance", kind: "comp" }, "Defamation, copyright, trademarks, financial/regulatory claims, disclosure, privacy, LinkedIn policy, cultural sensitivity", "No: gives safer wording; escalates legal judgement to the author"],
  [{ text: "editorial", kind: "edit" }, "Hook, clarity, rhythm, audience value, voice, comment potential (scored 1–5); predicts critical comments", "Yes, wording only: never facts, numbers, sources or stance"],
], [1700, 4826, 2500], { size: 18 }));
c.push(callout("panel", "Panel rules", [
  "Conflicts: compliance wins over fact-checker, which wins over editorial.",
  "Lines fixed by reviewers are locked; editorial cannot reword them.",
  "If a blocking problem remains after two rounds, the post is not delivered.",
]));
c.push(pageBreak());

// ---------------- 4 when it triggers ----------------
c.push(h1("4. When it runs and when it posts"));
c.push(p("Today every run is started by the author; nothing runs or posts on its own. The table lists every trigger, what it does, and whether a human is involved."));
c.push(table(["Trigger", "Example", "What happens", "Human step"], [
  [{ text: "Topic or opinion", kind: "input" }, "/vi-writer genai is good for finance", "Trend search focused on the topic → full run → final post", "Author starts it"],
  [{ text: "Domain", kind: "input" }, "/vi-writer AI agents", "Trend search across the domain → best trend → full run", "Author starts it"],
  [{ text: "No input", kind: "input" }, "/vi-writer", "Picks the focus area used longest ago in my-views.md (D1 GenAI in marketing, D2 Claude/GPT updates → marketing) with its opinions", "Author starts it"],
  [{ text: "Exact topic", kind: "input" }, "/vi-writer <topic> --no-trend", "Skips trend search; researches that topic directly", "Author starts it"],
  [{ text: "Follow-up", kind: "orch" }, "“write #2”", "Writes the runner-up trend from the last run’s backlog", "Author asks"],
  [{ text: "Revision", kind: "orch" }, "“make it shorter / a carousel”", "New draft version, checks and review again", "Author asks"],
  [{ text: "Review only", kind: "panel" }, "/review-panel <post>", "Runs the three reviewers on any post", "Author starts it"],
  [{ text: "Publish", kind: "pub" }, "Choose option B after a run", "Chrome opens LinkedIn, fills the post, shows a preview", "Author must say “Post now”"],
  [{ text: "Mark published", kind: "pub" }, "“I published the UBS post: <url>”", "Post marked published; counts for future overlap checks", "Author tells the system"],
], [1700, 2300, 3326, 1700], { size: 17 }));
c.push(h2("4.1 Recommended cadence"));
["3–5 posts per week (research data: 2–5 posts/week raises impressions per post; 4–5 has the highest median engagement rate).", "Post Tuesday to Thursday, at a time when the author can reply to comments for 60–90 minutes.", "Never two posts within 24 hours.", "Topical posts (e.g. company results) within 1–3 days of the news."].forEach((t) => c.push(bullet(t)));
c.push(h2("4.2 Automatic scheduling (optional, not yet built)"));
c.push(p("Runs could be started on a schedule (for example every Tuesday and Thursday morning) with Claude Code scheduled tasks, and posts could be timed with LinkedIn’s own scheduler. Even then, the design keeps one rule: a post goes live only after the author approves it."));
c.push(callout("gate", "What never happens automatically", [
  "Posting without the author’s explicit “Post now”.",
  "Liking, commenting on other people’s posts, sending messages or connection requests, or changing the profile.",
  "Posting a draft that failed any check or still has an open blocking issue.",
]));
c.push(pageBreak());

// ---------------- 5 architecture ----------------
c.push(h1("5. Architecture"));
c.push(p("The system has six layers. The numbers on the diagram follow the order of a run; dashed lines are human checkpoints or optional parts."));
c.push(...img("architecture.png", 600, 487, "Figure 2. Architecture-level flow (docs/architecture.png)."));
c.push(table(["Layer", "Components", "Role"], [
  [{ text: "1 Triggers & inputs", kind: "input" }, "Author · my-views.md · published-post registry · scheduler (future)", "Start a run and supply opinions and history"],
  [{ text: "2 Orchestration", kind: "orch" }, "vi-writer skill · review-panel skill", "Control the order of steps, decisions and hand-offs"],
  [{ text: "3 Agents", kind: "trend" }, "trend-captain · fact-checker · compliance · editorial", "Specialist work, each with its own instructions and tools"],
  [{ text: "4 Tools & external", kind: "check" }, "Web search & fetch · Python check scripts · Claude in Chrome → LinkedIn", "Evidence gathering, automatic checks, publishing"],
  [{ text: "5 Storage", kind: "store" }, "research/runs · posts · INDEX & backlog · docs", "Audit trail and memory between runs"],
  [{ text: "6 Output & publishing", kind: "pub" }, "Final post · live LinkedIn post", "What the author receives and what goes live"],
], [2000, 3926, 3100], { size: 18 }));
c.push(h2("5.1 Detailed workflow"));
c.push(p("The full step-level diagram with every rule and threshold is in docs/vi-writer-workflow.png; it is reproduced in the appendix."));
c.push(pageBreak());

// ---------------- 6 controls ----------------
c.push(h1("6. Quality and safety controls"));
c.push(table(["Control", "Rule", "Effect"], [
  [{ text: "No invented content", kind: "orch" }, "No placeholders, no unverified facts, no invented personal experiences", "Script fails the draft"],
  [{ text: "Source verification", kind: "fact" }, "Key numbers re-opened at source; independent fact-check", "Outdated data caught (real case: archived benchmark replaced)"],
  [{ text: "Risk screen", kind: "comp" }, "8 compliance areas; escalation to the author", "Real case: wording about a listed bank softened"],
  [{ text: "Overlap", kind: "check" }, "≥25% similarity with a published post", "Draft rewritten or another trend chosen"],
  [{ text: "Views alignment", kind: "input" }, "Must agree with my-views.md; opinions in first person", "Never argues against the author"],
  [{ text: "Engagement", kind: "edit" }, "Editorial edits if average score <4.5", "Real case: scores 3.7 → 4.2 and 4.0 → 4.3"],
  [{ text: "Publishing", kind: "pub" }, "Exact-text check, preview, “Post now”, post once", "No duplicates, no unapproved posts"],
], [2000, 3926, 3100], { size: 18 }));

// ---------------- 7 roles ----------------
c.push(h1("7. Who does what"));
c.push(table(["The author", "The system"], [
  ["Keeps my-views.md up to date (focus areas, opinions, voice)", "Finds and ranks current trends"],
  ["Starts a run (or asks for a revision / the next trend)", "Researches, verifies and writes"],
  ["Answers escalations and the disclosure question", "Checks quality, overlap and opinion alignment"],
  ["Approves publishing with “Post now”, or posts manually", "Runs fact, compliance and editorial review"],
  ["Tells the system when a manual post went live", "Saves, indexes and (when approved) publishes and logs"],
], [CW / 2, CW / 2], { size: 18 }));

// ---------------- 8 outputs ----------------
c.push(h1("8. Outputs and where they are stored"));
c.push(table(["Output", "Location"], [
  ["Final post (paste-ready) and first comment", "posts/<date>-<topic>.md and research/runs/<run>/final/"],
  ["Trend ranking and research", "research/runs/<run>/trend-scan/, sources/, analysis/"],
  ["Every draft with its checks", "research/runs/<run>/writing/draft-vN.md"],
  ["Reviewer reports and log", "research/runs/<run>/review/"],
  ["Publishing evidence (log, screenshots, recording)", "research/runs/<run>/publish/"],
  ["Run index and future ideas", "research/INDEX.md, research/backlog.md"],
  ["Diagrams and documents", "docs/"],
], [4000, 5026], { size: 18, mono: 1 }));

// ---------------- 9 example ----------------
c.push(h1("9. Example: one real run"));
c.push(table(["Stage", "What happened"], [
  [{ text: "Input", kind: "input" }, "“gen ai for finance is bad” (1 Nov 2026)"],
  [{ text: "Research", kind: "trend" }, "Benchmarks (Vals AI Finance Agent), Fin-RATE paper, Gartner CFO survey"],
  [{ text: "Write", kind: "orch" }, "Stance sharpened to “strong at retrieval, weak where one wrong number costs money”"],
  [{ text: "Review", kind: "fact" }, "Fact-checker BLOCKED: the benchmark version had been archived; post rebuilt on current data (57.0% modeling vs 93.0% earnings)"],
  [{ text: "Compliance", kind: "comp" }, "“written by experts” corrected to “reviewed by experts”; idiom simplified; disclosure confirmed"],
  [{ text: "Editorial", kind: "edit" }, "Score 4.0 → 4.3; trimmed to 1,509 characters"],
  [{ text: "Publish", kind: "pub" }, "Posted via Chrome after “Post now”; text verified 1,509/1,509 characters; sources added as first comment; URL recorded"],
], [1700, CW - 1700], { size: 18 }));

// ---------------- appendix ----------------
c.push(pageBreak());
c.push(h1("Appendix A. Detailed workflow diagram"));
c.push(...img("vi-writer-workflow.png", 600, 784, "Figure 3. Complete step-level workflow (docs/vi-writer-workflow.png)."));
c.push(h1("Appendix B. Glossary"));
c.push(table(["Term", "Meaning"], [
  ["Skill", "A reusable instruction set Claude Code runs on command (e.g. /vi-writer)"],
  ["Agent", "A specialist Claude helper with its own instructions and tools (e.g. fact-checker)"],
  ["Run folder", "The folder holding everything produced for one post"],
  ["my-views.md", "The author’s focus areas, opinions and voice"],
  ["Overlap", "Similarity between a draft and an already-published post"],
  ["Hook", "The first one or two lines shown before LinkedIn’s “…see more”"],
  ["First comment", "The comment added right after posting, holding source links"],
  ["BLOCK / FIX / PASS", "Reviewer verdicts: stop, correct, or approve"],
], [2200, CW - 2200], { size: 18 }));
c.push(new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Colour key used in this document", bold: true, color: MUTED, size: 20 })] }));
c.push(legend());

(async () => {
  const doc = new Document({ creator: "Claude Code", title: "LinkedIn Automation: Solution Overview", styles, numbering, features: { updateFields: true }, sections: [{ properties: sectionProps, footers: footer("LinkedIn Automation · Solution Overview"), children: c }] });
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(OUT, "linkedin-automation-solution-overview.docx"), buf);
  console.log("wrote", buf.length);
})();
