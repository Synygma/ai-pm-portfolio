const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell,
  WidthType, ShadingType, BorderStyle, LevelFormat, PageBreak, ImageRun, Footer, Header, PageNumber,
  TableOfContents,
} = require("docx");

const P = "C:/Users/PRAVIN/Desktop/LinkedInAutomation";
const OUT = path.join(P, "docs");
const rd = (p) => fs.readFileSync(path.join(P, p), "utf8").replace(/\r\n/g, "\n");

// ---------- palette (matches the workflow diagram) ----------
const K = {
  input: { fill: "EEF2F7", line: "475569", name: "Input / config" },
  orch: { fill: "DBEAFE", line: "1D4ED8", name: "vi-writer skill" },
  panel: { fill: "F1F5F9", line: "334155", name: "review-panel skill" },
  trend: { fill: "EDE9FE", line: "6D28D9", name: "trend-captain agent" },
  check: { fill: "FEF3C7", line: "B45309", name: "Scripts / checks" },
  fact: { fill: "DCFCE7", line: "15803D", name: "fact-checker agent" },
  comp: { fill: "FFE4E6", line: "BE123C", name: "compliance agent" },
  edit: { fill: "E0F2FE", line: "0369A1", name: "editorial agent" },
  gate: { fill: "FEF9C3", line: "A16207", name: "User / decision" },
  store: { fill: "CCFBF1", line: "0F766E", name: "Storage / references" },
  pub: { fill: "FFEDD5", line: "C2410C", name: "Publishing" },
};
const INK = "0F172A", MUTED = "475569";
const CW = 9026; // A4 content width in DXA with 1" margins

// ---------- helpers ----------
const run = (text, o = {}) => new TextRun({ text, font: o.font || "Calibri", size: o.size || 21, bold: o.bold, italics: o.italics, color: o.color || INK });
const para = (children, o = {}) => new Paragraph({ children: Array.isArray(children) ? children : [children], spacing: { after: o.after ?? 100, before: o.before ?? 0, line: o.line }, alignment: o.align, heading: o.heading, numbering: o.numbering, shading: o.shading, border: o.border, indent: o.indent, keepNext: o.keepNext });
const p = (text, o = {}) => para(run(text, o), o);
const rich = (parts, o = {}) => para(parts.map((x) => (typeof x === "string" ? run(x, o) : run(x[0], { ...o, ...x[1] }))), o);
const h1 = (text, color = "1D4ED8") => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, color, bold: true, font: "Calibri", size: 34 })], spacing: { before: 280, after: 140 }, keepNext: true, keepLines: true, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color, space: 4 } } });
const h2 = (text, color = INK) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, color, bold: true, font: "Calibri", size: 27 })], spacing: { before: 220, after: 100 }, keepNext: true });
const h3 = (text, color = MUTED) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text, color, bold: true, font: "Calibri", size: 23 })], spacing: { before: 160, after: 80 }, keepNext: true });
const bullet = (text, o = {}) => (Array.isArray(text) ? rich(text, { ...o, numbering: { reference: "bullets", level: o.level || 0 }, after: 50 }) : para(run(text, o), { numbering: { reference: "bullets", level: o.level || 0 }, after: 50 }));
const numbered = (text, ref = "steps") => para(Array.isArray(text) ? text.map((x) => (typeof x === "string" ? run(x) : run(x[0], x[1]))) : run(text), { numbering: { reference: ref, level: 0 }, after: 60 });
const pageBreak = () => new Paragraph({ children: [new PageBreak()] });
const border = (c) => ({ top: { style: BorderStyle.SINGLE, size: 4, color: c }, bottom: { style: BorderStyle.SINGLE, size: 4, color: c }, left: { style: BorderStyle.SINGLE, size: 4, color: c }, right: { style: BorderStyle.SINGLE, size: 4, color: c } });

function table(headers, rows, widths, o = {}) {
  const head = o.head || "0F172A";
  const mk = (cells, isHead, ri) =>
    new TableRow({
      tableHeader: isHead,
      cantSplit: true,
      children: cells.map((c, i) => {
        const kind = !isHead && o.kindCol !== undefined ? K[rows[ri][o.kindCol + 100] || ""] : null;
        const cellKind = typeof c === "object" && c && c.kind ? K[c.kind] : null;
        const txt = typeof c === "object" && c && c.text !== undefined ? c.text : String(c);
        const fill = isHead ? head : cellKind ? cellKind.fill : ri % 2 ? "F8FAFC" : "FFFFFF";
        return new TableCell({
          width: { size: widths[i], type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, color: "auto", fill },
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          borders: border("CBD5E1"),
          children: txt.split("\n").map((ln) => new Paragraph({ spacing: { after: 30 }, children: [new TextRun({ text: ln, font: o.mono && i === o.mono ? "Consolas" : "Calibri", size: isHead ? 19 : o.size || 18, bold: (isHead || (cellKind && i === 0)) ? true : undefined, color: isHead ? "FFFFFF" : cellKind && i === 0 ? cellKind.line : INK })] })),
        });
      }),
    });
  return new Table({ width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths, rows: [mk(headers, true, -1), ...rows.map((r, i) => mk(r, false, i))] });
}

function callout(kind, title, lines) {
  const k = K[kind];
  return new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [CW],
    rows: [new TableRow({ cantSplit: true, children: [new TableCell({
      width: { size: CW, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, color: "auto", fill: k.fill },
      margins: { top: 100, bottom: 100, left: 160, right: 160 },
      borders: { top: { style: BorderStyle.SINGLE, size: 4, color: k.fill }, bottom: { style: BorderStyle.SINGLE, size: 4, color: k.fill }, right: { style: BorderStyle.SINGLE, size: 4, color: k.fill }, left: { style: BorderStyle.SINGLE, size: 24, color: k.line } },
      children: [
        ...(title ? [new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: title, bold: true, color: k.line, font: "Calibri", size: 22 })] })] : []),
        ...lines.map((l) => new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: l, font: "Calibri", size: 20, color: INK })] })),
      ],
    })] })],
  });
}

// verbatim file / prompt block: monospace lines in a tinted box with coloured left rule
function codeBlock(kind, text) {
  const k = K[kind];
  const lines = text.replace(/\t/g, "    ").split("\n");
  const children = lines.map((ln) => {
    const isHead = /^#{1,6} /.test(ln);
    const isFm = /^---$/.test(ln) || /^(name|description|tools|argument-hint|allowed-tools):/.test(ln);
    return new Paragraph({
      spacing: { after: 0, line: 252 },
      children: [new TextRun({ text: ln.length ? ln : " ", font: "Consolas", size: 16, bold: isHead, color: isHead ? k.line : isFm ? "7C3AED" : "1E293B" })],
    });
  });
  return new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [CW],
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CW, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, color: "auto", fill: k.fill },
      margins: { top: 100, bottom: 100, left: 160, right: 120 },
      borders: { top: { style: BorderStyle.SINGLE, size: 4, color: k.line }, bottom: { style: BorderStyle.SINGLE, size: 4, color: k.line }, right: { style: BorderStyle.SINGLE, size: 4, color: k.line }, left: { style: BorderStyle.SINGLE, size: 28, color: k.line } },
      children,
    })] })],
  });
}

function chip(kind, label, sub) {
  const k = K[kind];
  return new Paragraph({
    spacing: { before: 120, after: 80 }, keepNext: true,
    shading: { type: ShadingType.CLEAR, color: "auto", fill: k.line },
    children: [new TextRun({ text: "  " + label + "  ", bold: true, color: "FFFFFF", font: "Calibri", size: 24 }), ...(sub ? [new TextRun({ text: "   " + sub, color: "FFFFFF", font: "Calibri", size: 19 })] : [])],
  });
}

function legend() {
  const ks = Object.keys(K);
  const rows = [];
  for (let i = 0; i < ks.length; i += 2) {
    rows.push([{ text: K[ks[i]].name, kind: ks[i] }, ks[i + 1] ? { text: K[ks[i + 1]].name, kind: ks[i + 1] } : ""]);
  }
  return new Table({
    width: { size: CW, type: WidthType.DXA }, columnWidths: [CW / 2, CW / 2],
    rows: rows.map((r) => new TableRow({ children: r.map((c) => new TableCell({
      width: { size: CW / 2, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, color: "auto", fill: c ? K[c.kind].fill : "FFFFFF" },
      margins: { top: 60, bottom: 60, left: 120, right: 120 },
      borders: { top: { style: BorderStyle.SINGLE, size: 4, color: "FFFFFF" }, bottom: { style: BorderStyle.SINGLE, size: 4, color: "FFFFFF" }, right: { style: BorderStyle.SINGLE, size: 4, color: "FFFFFF" }, left: { style: BorderStyle.SINGLE, size: 24, color: c ? K[c.kind].line : "FFFFFF" } },
      children: [new Paragraph({ children: [new TextRun({ text: c ? c.text : "", bold: true, color: c ? K[c.kind].line : INK, font: "Calibri", size: 20 })] })],
    })) })),
  });
}

function cover(title, subtitle, meta) {
  return [
    new Paragraph({ spacing: { before: 1800, after: 120 }, children: [new TextRun({ text: "LinkedIn Automation · vi-writer", color: "1D4ED8", bold: true, font: "Calibri", size: 26 })] }),
    new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: title, bold: true, color: INK, font: "Calibri", size: 56 })] }),
    new Paragraph({ spacing: { after: 400 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: "1D4ED8", space: 8 } }, children: [new TextRun({ text: subtitle, color: MUTED, font: "Calibri", size: 26 })] }),
    ...meta.map(([a, b]) => rich([[a + ": ", { bold: true, color: MUTED }], b], { size: 21, after: 60 })),
  ];
}

const numbering = {
  config: [
    { reference: "bullets", levels: [
      { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } },
      { level: 1, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 1080, hanging: 270 } } } }] },
    ...["steps", "s2", "s3", "s4", "s5", "s6", "s7", "s8"].map((r) => ({ reference: r, levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 360 } } } }] })),
  ],
};
const styles = {
  default: { document: { run: { font: "Calibri", size: 21 } } },
  paragraphStyles: [
    { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 34, bold: true, font: "Calibri" }, paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 0 } },
    { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 27, bold: true, font: "Calibri" }, paragraph: { spacing: { before: 220, after: 100 }, outlineLevel: 1 } },
    { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 23, bold: true, font: "Calibri" }, paragraph: { spacing: { before: 160, after: 80 }, outlineLevel: 2 } },
  ],
};
const sectionProps = { page: { size: { width: 11906, height: 16838 }, margin: { top: 1300, right: 1440, bottom: 1300, left: 1440 } } };
const footer = (label) => ({ default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: label + "   ·   page ", color: MUTED, size: 16 }), new TextRun({ children: [PageNumber.CURRENT], color: MUTED, size: 16 })] })] }) });

// =====================================================================
// DOCUMENT 1: Prompts & descriptions
// =====================================================================
const d1 = [];
d1.push(...cover("Prompts & Descriptions", "Every prompt, instruction set and description used to build and run the vi-writer system", [
  ["Project", "C:\\Users\\PRAVIN\\Desktop\\LinkedInAutomation"],
  ["Date", "1 November 2026"],
  ["Contents", "1 Your requests · 2 Component descriptions · 3 Skill and agent prompts (verbatim) · 4 Reference prompts · 5 Runtime prompts sent to agents · 6 Script descriptions"],
]));
d1.push(new Paragraph({ spacing: { before: 400, after: 100 }, children: [new TextRun({ text: "Colour key (same as the workflow diagram)", bold: true, color: MUTED, size: 21 })] }), legend(), pageBreak());

// ---- 1. user requests ----
d1.push(h1("1. Your requests, in order", "475569"));
d1.push(p("The prompts you gave in this project, abridged, and what each one produced. Your exact words are kept where they define a rule the system now follows."));
const reqs = [
  ["1", "Deep research on the anatomy of a high-performing LinkedIn post for the AI / AI PM niche (hook, body, formats, CTA, algorithm, tone, mistakes, AI specifics, 5–8 post breakdowns, checklist, 3 templates, sources; save as artifact)", "Research report artifact “Anatomy of an AI Post”", "store"],
  ["2", "“save this file in folder with html format”", "anatomy-of-an-ai-post.html in the project", "store"],
  ["3", "Convert the research into a skill named Vi-writer, stored only in the local folder; invoked with a topic it creates a post following the anatomy", "/vi-writer skill + references + check_post.py", "orch"],
  ["4", "“gen ai for finance is bad” (first run)", "Draft with placeholders (v1)", "orch"],
  ["5", "“any post is creating please save in folder”", "posts/ folder, auto-save step", "store"],
  ["6", "Root posts in what is happening in the industry, no placeholders, final copy-paste post", "Web research step, no-placeholder rule, finance post v2", "orch"],
  ["7", "Create agent trend-captain: domain → trending topics of the last 3 days → rank → top 3 → send the top one to the skill; skill calls it automatically", "trend-captain agent + routing in vi-writer", "trend"],
  ["8", "“whenever I invoke vi-writer with a topic or domain … send to the agent and get the top ranked one”", "Always-on trend-captain (+ --no-trend escape)", "trend"],
  ["9", "Store all research work, debates, summaries systematically in folders", "research/runs/<run>/ layout, INDEX, backlog, storage.md", "store"],
  ["10", "“genai is good for finance”", "UBS post via trend-captain", "orch"],
  ["11", "Check each post for overlap with my published posts; record published + URL; only published posts count; 25% = fail", "publish.py, check_overlap.py, Step 5b", "check"],
  ["12", "Store the post in an md file with all other details instead of txt and separate files; migrate existing", "One draft-vN.md per version, record_checks.py", "check"],
  ["13", "Create my-views.md with domains (GenAI in marketing; Claude & GPT updates → marketing) and opinions O1–O4; use it when no input; content must agree with my views", "my-views.md + alignment rules (Step 5c)", "input"],
  ["14", "Plan a review panel: fact-checker, compliance (legal, defamation, copyright, cultural sensitivity), editorial (engagement); suggest more agents", "Panel plan", "panel"],
  ["15", "“build the panel and add the skill”", "3 agents + /review-panel skill + Step 5d", "panel"],
  ["16", "Run the panel on the two posts; document/log all panel work in the folder", "Reviewed posts, review/ logs, panel reports", "panel"],
  ["17", "Plan posting through Claude in Chrome on my logged-in LinkedIn", "Publishing plan (option B)", "pub"],
  ["18", "“post one post related to genai for finance on linkedin using … claude in chrome” → “connected now, go ahead”", "Published post + publish/ log", "pub"],
  ["19", "Complete workflow as a colour-coded image, saved to file", "docs/vi-writer-workflow.png / .svg", "store"],
  ["20", "All prompts and descriptions + a technical design document, in Word format", "This document + the TDD", "store"],
];
d1.push(table(["#", "Your request (abridged)", "Result"], reqs.map((r) => [{ text: r[0], kind: r[3] }, r[1], r[2]]), [600, 5426, 3000]));
d1.push(pageBreak());

// ---- 2. component descriptions ----
d1.push(h1("2. Component descriptions", "1D4ED8"));
d1.push(p("The one-line descriptions Claude Code uses to decide when to load each skill or agent (from each file’s front matter)."));
const fm = (file) => {
  const t = rd(file); const m = t.match(/^---\n([\s\S]*?)\n---/); const o = {};
  if (m) m[1].split("\n").forEach((l) => { const i = l.indexOf(":"); if (i > 0) o[l.slice(0, i).trim()] = l.slice(i + 1).trim(); });
  return o;
};
const comps = [
  [".claude/skills/vi-writer/SKILL.md", "Skill", "orch"],
  [".claude/skills/review-panel/SKILL.md", "Skill", "panel"],
  [".claude/agents/trend-captain.md", "Agent", "trend"],
  [".claude/agents/fact-checker.md", "Agent", "fact"],
  [".claude/agents/compliance.md", "Agent", "comp"],
  [".claude/agents/editorial.md", "Agent", "edit"],
];
d1.push(table(["Name", "Type", "Description", "Tools"], comps.map(([f, t, k]) => { const o = fm(f); return [{ text: o.name, kind: k }, t, o.description || "", o.tools || o["allowed-tools"] || ""]; }), [1500, 800, 5126, 1600], { size: 17 }));
d1.push(pageBreak());

// ---- 3. verbatim prompts ----
d1.push(h1("3. Skill and agent prompts (verbatim)", "6D28D9"));
d1.push(p("Full text of every instruction file, exactly as stored on disk. Headings are shown in the component’s colour, front-matter keys in violet."));
for (const [f, t, k] of comps) {
  d1.push(chip(k, fm(f).name, t + " · " + f));
  d1.push(codeBlock(k, rd(f)));
  d1.push(pageBreak());
}

// ---- 4. references ----
d1.push(h1("4. Reference prompts (vi-writer/references/)", "0F766E"));
d1.push(p("Rule files the skill loads during a run. They distil the research report into instructions."));
const refs = ["anatomy", "hooks", "post-types", "ai-niche", "research", "checklist", "storage"];
for (const r of refs) {
  d1.push(chip("store", r + ".md", ".claude/skills/vi-writer/references/" + r + ".md"));
  d1.push(codeBlock("store", rd(".claude/skills/vi-writer/references/" + r + ".md")));
}
d1.push(chip("input", "my-views.md", "author’s domains, opinions, voice (project root)"));
d1.push(codeBlock("input", rd("my-views.md")));
d1.push(pageBreak());

// ---- 5. runtime prompts ----
d1.push(h1("5. Runtime prompts sent to agents", "BE123C"));
d1.push(p("The templates live in the skill files (section 3). Below are the actual prompts used in this project’s runs. Post text inside prompts is shortened here with “[post text …]” where it repeats the final post shown in the run folder."));
const rt = [
  ["trend", "trend-captain: “genai is good for finance” run", `Run folder: C:\\Users\\PRAVIN\\Desktop\\LinkedInAutomation\\research\\runs\\2026-11-01_genai-is-good-for-finance
Input type: TOPIC
Domain: AI in finance (generative AI in finance functions, banking, financial services)
Focus topic / stance (TOPIC only): genai is good for finance
Today's date: 2026-11-01
Audience: LinkedIn, AI / AI Product Management practitioners (PMs, builders, enterprise AI leaders).
User's extra notes (experience, angle, format), if any: none. Note: an earlier post by this creator (today) argued GenAI is weak at financial modeling, using Vals AI Finance Agent v2 category scores, the Fin-RATE benchmark, and Gartner's May 2026 CFO survey. Prefer fresh evidence that is NOT those same sources, so the new post doesn't repeat it.
Find the trending topics from the last 3 days (roughly 2026-10-29 to 2026-11-01), rank them for LinkedIn potential (giving priority to trends tied to the focus topic, if any), pick the top 3, and return your TREND-CAPTAIN REPORT with the evidence pack for the #1 topic. Save your search log, candidates, source notes and report into the run folder as described in your instructions.`],
  ["fact", "fact-checker: round 1, FULL (UBS post)", `MODE: FULL
Today's date: 2026-11-01
Draft file: ...\\2026-11-01_genai-is-good-for-finance\\writing\\draft-v3.md   (read only the ## Post block, the first comment and the header; do NOT open the run's sources/, analysis/ or trend-scan/ folders)
Author's views: C:\\Users\\PRAVIN\\Desktop\\LinkedInAutomation\\my-views.md
Post:
[post text of draft-v3 …]
First comment:
[sources: UBS Q3 2026 results, Bank of England & FCA survey; 9% detail via Resultsense]
Alternative hooks (also verify, since the author may swap one in):
1. 80% of UK financial firms now run AI agents. Only 2% let them act on their own. …
2. 608 live AI use cases at UBS, up 81% in a year. Not one dollar of savings attributed to them.
Note: the "one for every nine people" ratio was derived by the writer from UBS headcount. Recompute it from UBS's own figures.
Verify every claim independently and return your report in the required format.`],
  ["comp", "compliance: round 1, FULL (UBS post)", `MODE: FULL
Today's date: 2026-11-01
Draft file: ...\\writing\\draft-v3.md
Author's views: ...\\my-views.md
Format and planned visual: image post. Planned visual: an author-made stat card with four numbers: "12,700 agents · 608 use cases (+81%) · 80% have agents · 2% broad autonomy". Not yet designed; flag any logo or rights concerns (e.g. using the UBS or Bank of England logos).
Audience: LinkedIn, AI / AI PM practitioners and banking/financial-services technology leaders
Post: [post text …]
First comment: [sources …]
Note: the post discusses a listed bank's quarterly results. Check carefully for anything that could read as investment commentary.
Screen against your full checklist and return your report in the required format.`],
  ["fact", "fact-checker: round 2, DELTA (finance post)", `MODE: DELTA
Today's date: 2026-11-01
Draft file: ...\\2026-11-01_genai-finance-is-bad\\writing\\draft-v3.md (read only the ## Post, ## First comment and ## Hooks considered sections; do not open sources/ or analysis/)
Context: in round 1 you BLOCKED draft-v2 because the Vals Finance Agent v2 figures were out of date (v2 has been archived and replaced by v2.1). Your option (a), switching to current v2.1 data, was applied together with your other corrections. Verify ONLY the changed sentences below and any claim whose meaning they affect. Pay special attention to whether "reviewed by finance experts" and the scoring rule ("missing one critical fact can score an answer as zero") also hold for v2.1, not just v2. If they don't, give the exact fix.
1. "The best AI score on financial modeling tasks is 57.0%. / On earnings analysis it's 93.0%. …"
2. "Both numbers come from Vals AI's Finance Agent v2.1 benchmark (October 2026). …"
… (9 changed items listed)
Return your report in the required format.`],
  ["edit", "editorial: UBS post (draft-v5)", `Draft file: ...\\2026-11-01_genai-is-good-for-finance\\writing\\draft-v5.md
Format: image post (caption ideal ~700–1,000 chars; currently ~1,100; planned stat card attached) · Audience: LinkedIn, AI/AI PM practitioners and banking/financial-services technology and product leaders
LOCKED lines (keep verbatim; you may move them, but not change their words):
- "Not a pilot. That's roughly one agent for every eight employees."
- "A Bank of England and FCA survey (26 October) found 86% of the UK financial firms it surveyed use AI, …"
- "So yes, I think GenAI is good for finance."
- "80% of the UK firms surveyed have AI agents deployed. Only 2% give them broad autonomy."
- "My read: the value comes from thousands of small assistants that support people while a human decides."
- "In my view, that gap is telling: UBS's Q3 results report how many agents and use cases it has, not what they've saved or earned."
- First comment, entire text.
Reviewer suggestions you may act on (not locked):
- Compliance advisory: "Not from an AI analyst running the books." is an idiom … Suggested: "Not from an AI analyst making the decisions."
- Fact-checker clarity note: "that gap is telling" could refer to the 80%-vs-2% gap or the counts-vs-dollars gap. …
Post: [post text …]
Review, score, edit if it clearly helps, and return your report in the required format.`],
  ["comp", "compliance: DELTA on editorial edits (UBS)", `MODE: DELTA
Context: the editorial reviewer edited draft-v5, which you had passed. Review ONLY these editorial changes, and anything they affect:
1. "UBS's Q3 2026 results also list 608 AI use cases in production, up 81% in a year." ("live" dropped)
2. New line: "What's missing is the payoff." placed directly before "In my view, that gap is telling: …" Check especially whether "What's missing is the payoff" reads as a factual negative claim about a named listed company (implying its AI has no payoff), as opposed to the reporting gap.
3. "Building for a bank? Ship the unglamorous platform: …"
4. "If you build AI in banking or finance: what metric would prove an internal agent paid off?"
5. Removed: "Not from an AI analyst running the books."
Return your report in the required format.`],
];
for (const [k, title, text] of rt) { d1.push(chip(k, title)); d1.push(codeBlock(k, text)); }
d1.push(h2("User-confirmation prompt used when posting via Chrome", "C2410C"));
d1.push(codeBlock("gate", `Q1 (Publish?): The LinkedIn composer (logged in as "Pravin", visibility "Post to Anyone") now holds the reviewed finance "modeling gap" post, exactly as in posts/2026-11-01-genai-finance-numbers-v3.md (1,509 characters; opens "The best AI score on financial modeling tasks is 57.0%."). Should I click Post?
   Options: Post now · Don't post, keep draft · Cancel                      → answer: Post now
Q2 (Disclosure): Compliance asked about disclosure: do you have any work or commercial tie to an AI or finance-software vendor, Vals AI, Gartner, OpenAI or Anthropic? If yes, a disclosure line goes into the first comment.
   Options: No disclosure needed · Yes, I'll specify                          → answer: No disclosure needed`));
d1.push(pageBreak());

// ---- 6. scripts ----
d1.push(h1("6. Script descriptions", "B45309"));
const scripts = [
  ["record_checks.py", "Runs check_post.py and check_overlap.py on a draft .md and writes both results into the same file. Exit 1 on any FAIL.", "python record_checks.py <run>/writing/draft-vN.md --format text|image|document|video|poll"],
  ["check_post.py", "Quality gate: hook ≤140 chars, length per format, ≤3,000 cap, paragraph rhythm, links in body, hashtag count, @mentions, banned/bait phrases, emoji density, markdown, placeholders (FAIL), invented first-person experience (WARN).", "python check_post.py <draft.md> --format text"],
  ["check_overlap.py", "Compares a draft with every PUBLISHED post: 0.45 TF-IDF content cosine + 0.30 shared 3-word phrases + 0.10 hook cosine + 0.15 shared statistics. FAIL ≥25%, WARN ≥15%.", "python check_overlap.py <draft.md> [--fail 25] [--warn 15]"],
  ["publish.py", "Publication registry over posts/ front matter: list, mark published with URL/date, unpublish, initialise, and a published-posts summary for trend-captain.", "python publish.py <post> --url <linkedin-url>  ·  --list  ·  --published-summary"],
  ["postlib.py", "Shared helpers: read/write YAML-style front matter, extract the paste-ready post from a ## Post code block, list posts.", "(imported by the other scripts)"],
];
d1.push(table(["Script", "What it does", "Usage"], scripts.map((s) => [{ text: s[0], kind: "check" }, s[1], s[2]]), [1700, 4426, 2900], { size: 17, mono: 2 }));

// =====================================================================
// DOCUMENT 2: Technical design document
// =====================================================================
const d2 = [];
d2.push(...cover("Technical Design Document", "vi-writer: an agentic system that researches, writes, reviews and publishes evidence-based LinkedIn posts", [
  ["Version", "1.0 · 1 November 2026 (as built)"],
  ["Owner", "Pravin"],
  ["Location", "C:\\Users\\PRAVIN\\Desktop\\LinkedInAutomation (project-local; nothing in the user-level .claude folder)"],
  ["Runtime", "Claude Code (skills + subagents), Python 3.13 scripts, Claude in Chrome extension"],
]));
d2.push(pageBreak());
d2.push(new Paragraph({ children: [new TextRun({ text: "Contents", bold: true, size: 30, color: INK })], spacing: { after: 120 } }));
d2.push(new TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }));
d2.push(p("(If the table is empty, right-click it in Word and choose Update Field.)", { italics: true, color: MUTED, size: 18 }));
d2.push(pageBreak());

// 1 overview
d2.push(h1("1. Overview"));
d2.push(p("vi-writer turns a topic, a domain, or nothing at all into one final LinkedIn post that can be pasted or published without edits. Each post is grounded in verified, current industry evidence, follows a research-based post anatomy, agrees with the author’s recorded opinions, avoids overlap with posts already published, and passes an independent review panel before delivery. Every artifact of every run is stored in a fixed folder structure."));
d2.push(h2("1.1 Goals"));
["Final, paste-ready posts with zero placeholders and zero invented facts or experiences.", "Evidence from the last 3 days of industry news (trend-captain), verified at source.", "Consistent structure: hook ≤140 characters, context, 3–5 beats, takeaway, CTA, first comment with links.", "Alignment with the author’s opinions in my-views.md; never argue against one.", "No significant overlap (≥25%) with published posts.", "Independent fact, compliance and editorial review with an auditable trail.", "Optional browser publishing with an explicit human ‘Post now’ for each post."].forEach((t) => d2.push(bullet(t)));
d2.push(h2("1.2 Non-goals"));
["Bulk or scheduled auto-posting without a human in the loop.", "Engagement actions on other people’s content (likes, comments, DMs, connection requests).", "Writing from the author’s private experience unless the author supplies it.", "Legal advice: compliance is a risk screen that escalates to the author."].forEach((t) => d2.push(bullet(t)));

// 2 architecture
d2.push(h1("2. Architecture"));
d2.push(p("The system is an orchestrator skill (vi-writer) that delegates to specialised subagents, deterministic Python checks, and a second skill (review-panel). The colour key below is used throughout this document."));
d2.push(legend());
const png = fs.readFileSync(path.join(OUT, "vi-writer-workflow.png"));
d2.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 80 }, children: [new ImageRun({ type: "png", data: png, transformation: { width: 590, height: 771 }, altText: { title: "Workflow", description: "vi-writer end-to-end workflow diagram", name: "workflow" } })] }));
d2.push(p("Figure 1. End-to-end workflow (docs/vi-writer-workflow.png).", { italics: true, color: MUTED, size: 18, align: AlignmentType.CENTER }));
d2.push(h2("2.1 Components"));
d2.push(table(["Component", "Type", "Responsibility", "Tools / runtime"], [
  [{ text: "vi-writer", kind: "orch" }, "Skill (orchestrator)", "Routes input, calls agents, writes the post, runs checks, invokes the review panel, saves and indexes everything", "Agent, Skill, AskUserQuestion, WebSearch, WebFetch, Read, Write, Edit, Bash"],
  [{ text: "trend-captain", kind: "trend" }, "Subagent", "Finds trends from the last 3 days, scores them for LinkedIn, returns top 3 + evidence pack for #1", "WebSearch, WebFetch, Write, Read, Glob"],
  [{ text: "review-panel", kind: "panel" }, "Skill", "Runs fact-checker + compliance, applies fixes, runs editorial and delta re-checks, finalises", "Agent, Read, Write, Edit, Bash"],
  [{ text: "fact-checker", kind: "fact" }, "Subagent", "Independently verifies every claim against primary sources; flags opinions stated as facts", "WebSearch, WebFetch, Read"],
  [{ text: "compliance", kind: "comp" }, "Subagent", "8-area risk screen: defamation, copyright, trademarks, financial/regulatory, disclosure, privacy, LinkedIn policy, cultural sensitivity", "Read, WebSearch, WebFetch"],
  [{ text: "editorial", kind: "edit" }, "Subagent", "Scores engagement, edits wording within locks, predicts critical comments", "Read"],
  [{ text: "check scripts", kind: "check" }, "Python", "record_checks, check_post, check_overlap, publish, postlib", "Python 3.13 (stdlib only)"],
  [{ text: "my-views.md", kind: "input" }, "Config", "Domains, opinions, guardrails, voice, usage log", "Markdown"],
  [{ text: "Claude in Chrome", kind: "pub" }, "Browser tool", "Opens LinkedIn in the author’s logged-in Chrome, composes, posts after confirmation", "Chrome extension MCP tools"],
], [1500, 1300, 3726, 2500], { size: 17 }));

// 3 workflow
d2.push(h1("3. Workflow specification"));
const steps = [
  ["S", "orch", "Open run folder", "Create research/runs/YYYY-MM-DD_<input-slug>/ and request.md; load my-views.md; run publish.py --published-summary."],
  ["R", "gate", "Route input", "Empty → domain from my-views.md (oldest ‘Last used’, priority tie-break) + its opinions. Topic/stance → derive parent domain. Domain → scan domain. --no-trend → skip trend-captain."],
  ["0", "trend", "trend-captain", "Sweep 6–10 searches → cluster and date-check (≤3 days) → score /100 → adjust (+10 focus, +≤10 views fit, −20 overlap) → top 3 → deep-dive #1 into an evidence pack."],
  ["G", "gate", "Accept #1", "≥4 sourced facts incl. a number and a named example, dated in window, thesis ≠ any published thesis. Else #2/#3 or fallback."],
  ["1–2", "orch", "Understand + research", "Sharpen stance to the most defensible version aligned with my-views; verify the 1–3 key numbers at source; save source notes and analysis (summary, evidence pack, debates)."],
  ["3–4", "orch", "Type, format, write", "Choose post type and format; write hook (3 options), context, beats with caveat, takeaway, CTA, first comment."],
  ["5", "check", "Self-checks", "draft-vN.md → record_checks.py (quality + overlap); 5b angle-overlap judgement; 5c views alignment."],
  ["5d", "panel", "Review panel", "Round 1 fact-checker ∥ compliance → fixes → round 2 DELTA (max 2) → editorial → DELTA re-check of edited claims → final."],
  ["6–7", "store", "Output + save", "Reply with trend table, post, first comment, evidence, review summary, notes; save final/, posts/, README, INDEX, backlog, my-views usage log."],
  ["8", "pub", "Publish", "A copy-paste · B Claude in Chrome (confirmed) · C later. publish.py marks the post published with its URL."],
];
d2.push(table(["Step", "Name", "Behaviour"], steps.map((s) => [{ text: s[0], kind: s[1] }, s[2], s[3]]), [800, 1900, 6326], { size: 18 }));

// 4 agent contracts
d2.push(h1("4. Agent contracts"));
d2.push(h2("4.1 trend-captain", "6D28D9"));
d2.push(table(["Aspect", "Specification"], [
  ["Input", "Run folder, input type (DOMAIN/TOPIC), domain, focus stance, today’s date, audience, notes, published-post summary, author’s views"],
  ["Window", "Publish date of the triggering event verified on the page, last 72 hours; widen to 7 days only if none qualify (labelled); ‘recent updates’ domains: latest releases over several weeks"],
  ["Scoring", "Weighted 1–5 ratings: relevance ×4, evidence ×4, practitioner angle ×3, conversation ×3, freshness ×2, low saturation ×2, durability ×1, hype-risk (inverted) ×1 → /100; +10 focus, +≤10 views fit, −20 or drop for overlap with a published thesis"],
  ["Disqualify", "Stock/funding gossip without a product angle, rumours/leaks, tragedy or politics without a professional angle, BREAKING-only stories"],
  ["Output", "TREND-CAPTAIN REPORT: Top 3 table, score breakdown, selected topic (angle, post type, format, lane, hook seeds, caveat, PM decision), STANCE / OVERLAP / VIEWS FIT checks, evidence pack, other candidates, notes, files saved"],
  ["Writes", "trend-scan/search-log.md, candidates.md, trend-report.md; sources/NN-*.md"],
], [1800, 7226], { size: 18 }));
d2.push(h2("4.2 fact-checker", "15803D"));
d2.push(table(["Aspect", "Specification"], [
  ["Independence", "Reads only the post, first comment and header; never the writer’s sources/ or analysis/"],
  ["Checks", "Exactness, context (survey vs adoption, benchmark vs production, version), recency, attribution, link support, recomputed ratios, opinion-as-fact, misleading omissions"],
  ["Verdicts", "VERIFIED, VERIFIED-SECONDARY, IMPRECISE, UNSUPPORTED, FALSE, OPINION-OK, OPINION-AS-FACT → overall PASS / FIX / BLOCK"],
  ["Modes", "FULL (whole post) or DELTA (changed sentences only)"],
], [1800, 7226], { size: 18 }));
d2.push(h2("4.3 compliance", "BE123C"));
d2.push(table(["Aspect", "Specification"], [
  ["Checklist", "1 Defamation/disparagement · 2 Copyright · 3 Trademarks/endorsement · 4 Financial & regulatory · 5 Disclosure/conflicts · 6 Privacy · 7 LinkedIn Professional Community Policies · 8 Cultural sensitivity & inclusive language"],
  ["Severity", "BLOCK, MUST-FIX, ADVISORY, ESCALATE → overall PASS / FIX / ESCALATE / BLOCK"],
  ["Output", "Issue table with safer wording, escalations for the author, image/carousel notes, checklist coverage"],
], [1800, 7226], { size: 18 }));
d2.push(h2("4.4 editorial", "0369A1"));
d2.push(table(["Aspect", "Specification"], [
  ["Scores", "Hook, clarity, rhythm & length, audience value, voice, comment potential (1–5 each)"],
  ["Edit rule", "Edit only if average <4.5 or any score <4; never change facts, numbers, sources, stance, opinion framing, format or LOCKED lines"],
  ["Extras", "Skeptic read (top 3 critical comments), changed-claim list for delta re-check, advisory"],
], [1800, 7226], { size: 18 }));
d2.push(h2("4.5 Panel protocol", "334155"));
["Precedence on conflict: compliance > fact-checker > editorial > original draft.", "Every fixed line becomes LOCKED for editorial.", "Maximum 2 fact/compliance rounds; a BLOCK still open after round 2 stops delivery.", "ESCALATE pauses for the author via AskUserQuestion.", "Narrowing fixes with reviewer-supplied wording may be applied without a third round (logged).", "Reports are saved verbatim; the orchestrator’s decisions are appended as a ‘Resolution’ section."].forEach((t) => d2.push(bullet(t)));

// 5 data model
d2.push(h1("5. Data model and storage"));
d2.push(h2("5.1 Folder layout"));
d2.push(codeBlock("store", `LinkedInAutomation/
├─ anatomy-of-an-ai-post.html        research report (source of the rules)
├─ my-views.md                       domains, opinions, voice, usage log
├─ docs/                             workflow image, these Word documents
├─ posts/                            final posts (one .md per post, with front matter)
├─ research/
│  ├─ INDEX.md                       one row per run
│  ├─ backlog.md                     runner-up trends / unused angles
│  ├─ reviews/                       standalone /review-panel runs
│  └─ runs/YYYY-MM-DD_<input>/
│     ├─ README.md · request.md
│     ├─ trend-scan/                 search-log.md · candidates.md · trend-report.md
│     ├─ sources/                    NN-<publisher>-<slug>.md (one per page opened)
│     ├─ analysis/                   summary.md · evidence-pack.md · debates.md
│     ├─ writing/                    draft-v1.md … draft-vN.md
│     ├─ review/                     panel-vN.md · review-log.md
│     ├─ final/                      post.md · post-v2.md
│     └─ publish/                    publish-log.md · composer-preview.jpg · live-post.jpg · posting.gif
└─ .claude/
   ├─ skills/vi-writer/              SKILL.md · references/ · scripts/
   ├─ skills/review-panel/           SKILL.md
   └─ agents/                        trend-captain · fact-checker · compliance · editorial`));
d2.push(h2("5.2 Post file front matter (posts/*.md)"));
d2.push(table(["Field", "Values", "Used by"], [
  ["status", "draft · published · superseded", "check_overlap.py (only ‘published’ counts), publish.py"],
  ["published_url", "LinkedIn post URL", "publish.py, INDEX"],
  ["published_date", "YYYY-MM-DD", "publish.py --published-summary"],
  ["post_type", "e.g. Contrarian field note", "reporting"],
  ["run_folder", "research/runs/<run>/", "traceability"],
  ["thesis", "one sentence: core claim + key evidence", "trend-captain overlap penalty, Step 5b angle judgement"],
], [1800, 3200, 4026], { size: 18, mono: 0 }));
d2.push(h2("5.3 Draft file (writing/draft-vN.md)"));
d2.push(p("One Markdown file per version containing: header (run, date, format, type, hook pattern, status), ## Post (fenced, paste-ready), ## First comment, ## Hooks considered, ## Changes from previous version, ## Quality check, ## Overlap check, ## Overlap judgement, ## Views alignment, ## Review panel. Earlier versions are marked ‘superseded by vN+1’ and never deleted."));

// 6 algorithms
d2.push(h1("6. Algorithms and thresholds"));
d2.push(h2("6.1 Quality gate (check_post.py)"));
d2.push(table(["Check", "Rule", "Result"], [
  ["Hook", "Line 1 ≤140 chars; first two lines ≤180", "FAIL / WARN"],
  ["Length", "text 900–1,500 (min 700) · image 700–1,000 · video 400–1,000 · poll 200–800 · document caption ≤100 · cap 3,000", "WARN / FAIL at cap"],
  ["Rhythm", ">4 lines or >400 chars per paragraph; >60% tiny one-liners", "WARN"],
  ["Links / hashtags / mentions", "Any URL in body; >2 hashtags; >3 @mentions", "FAIL / FAIL / WARN"],
  ["Bait & cringe phrases", "‘Agree?’, ‘comment YES’, ‘I’ll DM’, ‘BREAKING’, ‘game-changer’, ‘let that sink in’…", "FAIL"],
  ["Markdown", "**bold** or # headers", "FAIL"],
  ["Placeholders", "[..], TBD, TODO, XX, <..>", "FAIL"],
  ["Invented experience", "‘we tested’, ‘my team’, ‘our clients’…", "WARN"],
], [2200, 5126, 1700], { size: 18 }));
d2.push(h2("6.2 Overlap score (check_overlap.py)"));
d2.push(callout("check", "overlap% = 100 × (0.45·content + 0.30·phrases + 0.10·hook + 0.15·stats)", [
  "content: TF-IDF cosine over content words (stop-words removed) · phrases: share of the draft’s 3-word phrases found in the published post",
  "hook: TF-IDF cosine of the first two lines · stats: share of the draft’s numbers (years excluded) present in the published post",
  "Computed against every post with status ‘published’; highest score reported. FAIL ≥25%, WARN 15–24%.",
  "Calibration: same-domain different-angle 6% · rewritten same thesis 11% · identical 100% → the semantic angle judgement (Step 5b) is required; overall = max(script, judgement).",
]));
d2.push(h2("6.3 Angle-overlap judgement (Step 5b)"));
d2.push(table(["Band", "Meaning"], [["0–10%", "different topic"], ["10–20%", "same domain, different thesis and evidence"], ["25–50%", "same thesis with new evidence, or same key evidence reframed"], ["50%+", "same thesis and same evidence"]], [1800, 7226], { size: 18 }));

// 7 publishing
d2.push(h1("7. Publishing design (Claude in Chrome)", "C2410C"));
d2.push(table(["#", "Step", "Control"], [
  ["1", "Gates: reviewed final, checks pass, disclosure answered, image ready, not already published", "refuse to start otherwise"],
  ["2", "New tab → linkedin.com/feed; verify the logged-in profile (Pravin)", "wrong/absent account → stop"],
  ["3", "Start a post; type exact text", "read back from the editor; must match file character-for-character (1,509/1,509 verified)"],
  ["4", "Screenshot + AskUserQuestion: Post now / keep draft / cancel", "no posting without an explicit answer"],
  ["5", "Click Post once; capture URL from ‘View post’", "never click twice; check activity before any retry"],
  ["6", "Add first comment (sources); verify one post and one comment exist", "duplicate check"],
  ["7", "publish.py --url; INDEX/README; publish/ log, screenshots, GIF", "audit trail"],
], [500, 5326, 3200], { size: 18 }));
d2.push(callout("gate", "Prohibited actions", ["Likes, comments on others’ posts, DMs, connection requests, profile/settings changes, bulk or unattended posting. Stop on dialogs, layout changes after 2–3 attempts, or extension errors."]));

// 8 security/compliance
d2.push(h1("8. Risk, security and compliance"));
d2.push(table(["Risk", "Mitigation"], [
  ["Fabricated or outdated facts", "Primary-source verification by an independent fact-checker; BLOCK on FALSE/unsupported core claims (real case: archived Vals v2 data caught and replaced by v2.1)"],
  ["Defamation of named companies", "Compliance area 1; opinions framed in first person; real case: ‘What’s missing is the payoff’ → ‘a payoff number’"],
  ["Bias / undisclosed promotion", "Disclosure question to the author; models leading benchmarks not named; reviewer self-disclosure (compliance noted it is an Anthropic model) recorded for the author"],
  ["LinkedIn automation terms", "Human ‘Post now’ per post, low volume, no engagement automation; official Posts API listed as a future option"],
  ["Prompt injection from web pages", "Fetched content treated as data; agents only return reports; publishing requires the user’s explicit confirmation"],
  ["Credential exposure", "No passwords handled; uses the author’s existing Chrome session only"],
  ["Data loss", "Save-as-you-go, versioned files, never overwrite, verbatim reports"],
], [2600, 6426], { size: 18 }));

// 9 verification
d2.push(h1("9. Verification performed"));
["check_post.py: verified on a good and a deliberately bad sample (7 FAILs detected on the bad one).", "check_overlap.py: calibrated on test copies (6% / 11% / 100%), leading to the mandatory angle judgement.", "End-to-end runs: ‘gen ai for finance is bad’ and ‘genai is good for finance’ (trend-captain: 11 candidates, UBS 97/100).", "Review panel on both posts: 2 rounds + editorial + delta re-checks; all reports in review/.", "Live publication on 1 Nov 2026 with exact-text verification and duplicate checks; logged in publish/."].forEach((t) => d2.push(bullet(t)));

// 10 limitations and roadmap
d2.push(h1("10. Known limitations and roadmap"));
d2.push(table(["Item", "Status / next step"], [
  ["/linkedin-post skill", "Planned; publishing so far done by following the plan manually"],
  ["Finance domain", "Both runs fall outside my-views D1/D2; add a finance domain or treat as one-offs"],
  ["O2 wording", "Clarify whether ‘language output’ means writing quality or multilingual output"],
  ["Voice samples", "Add 3–5 real posts to my-views.md for the editorial reviewer"],
  ["Gartner primary access", "Gartner newsroom returns 403; secondary reporting used and labelled"],
  ["Cost/latency", "Each run uses up to ~8 agent calls; consider skipping delta re-checks for non-claim edits"],
  ["LinkedIn Posts API", "Optional compliant publishing path (developer app + OAuth w_member_social)"],
  ["Carousels / images", "Stat card for the UBS post still to be produced with per-number source labels"],
], [2600, 6426], { size: 18 }));

// 11 appendix
d2.push(h1("11. Appendix: file inventory"));
const inv = [];
const walk = (rel) => { for (const f of fs.readdirSync(path.join(P, rel), { withFileTypes: true })) { const r = rel ? rel + "/" + f.name : f.name; if (f.name === "__pycache__" || f.name === "node_modules") continue; if (f.isDirectory()) walk(r); else inv.push(r); } };
walk(".claude");
inv.push("my-views.md", "anatomy-of-an-ai-post.html");
d2.push(table(["Configuration and code files"], inv.sort().map((f) => [f]), [CW], { size: 17, mono: 0 }));

// ---------- write ----------
async function save(children, file, label) {
  const doc = new Document({ creator: "Claude Code", title: label, styles, numbering, features: { updateFields: true }, sections: [{ properties: sectionProps, footers: footer(label), children }] });
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(OUT, file), buf);
  console.log("wrote", file, buf.length);
}
(async () => {
  await save(d1, "vi-writer-prompts-and-descriptions.docx", "vi-writer · Prompts & Descriptions");
  await save(d2, "vi-writer-technical-design.docx", "vi-writer · Technical Design Document");
})();
