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


module.exports = { fs, path, P, OUT, rd, K, INK, MUTED, CW, run, para, p, rich, h1, h2, h3, bullet, numbered, pageBreak, table, callout, codeBlock, chip, legend, cover, numbering, styles, sectionProps, footer, D: require("docx") };
