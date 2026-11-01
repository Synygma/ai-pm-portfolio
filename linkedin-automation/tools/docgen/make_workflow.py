from html import escape as E
import os, subprocess

W, H = 1760, 2300
out = []
def add(s): out.append(s)

C = {
    "input":  ("#EEF2F7", "#475569"),
    "orch":   ("#DBEAFE", "#1D4ED8"),
    "trend":  ("#EDE9FE", "#6D28D9"),
    "check":  ("#FEF3C7", "#B45309"),
    "fact":   ("#DCFCE7", "#15803D"),
    "comp":   ("#FFE4E6", "#BE123C"),
    "edit":   ("#E0F2FE", "#0369A1"),
    "store":  ("#CCFBF1", "#0F766E"),
    "pub":    ("#FFEDD5", "#C2410C"),
    "gate":   ("#FEF9C3", "#A16207"),
    "panel":  ("#FFFFFF", "#334155"),
}
INK, MUTED = "#0F172A", "#475569"

def text(x, y, s, size=14, weight=400, color=INK, anchor="start", italic=False):
    st = ' font-style="italic"' if italic else ""
    add(f'<text xml:space="preserve" x="{x}" y="{y}" font-size="{size}" font-weight="{weight}" fill="{color}" text-anchor="{anchor}"{st}>{E(s)}</text>')

def box(x, y, w, h, kind, title=None, lines=(), size=13.5, tag=None, dash=False, radius=10, title_size=15.5):
    fill, stroke = C[kind]
    d = ' stroke-dasharray="7 5"' if dash else ""
    add(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke}" stroke-width="2"{d}/>')
    cy = y + 24
    if tag:
        tw = 9 + len(tag) * 7.2
        add(f'<rect x="{x+w-tw-10}" y="{y+8}" width="{tw}" height="20" rx="10" fill="{stroke}"/>')
        text(x + w - tw / 2 - 10, y + 22, tag, 11.5, 700, "#FFFFFF", "middle")
    if title:
        text(x + 14, cy, title, title_size, 700, stroke)
        cy += 22
    for ln in lines:
        if isinstance(ln, tuple):
            s, opts = ln
        else:
            s, opts = ln, {}
        text(x + 14, cy, s, opts.get("size", size), opts.get("weight", 400), opts.get("color", INK))
        cy += size + 6

def arrow(x1, y1, x2, y2, color="#334155", label=None, dash=False, lx=None, ly=None):
    d = ' stroke-dasharray="6 5"' if dash else ""
    add(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="2.2" marker-end="url(#ah{color[1:]})"{d}/>')
    if label:
        text(lx if lx is not None else (x1 + x2) / 2 + 8, ly if ly is not None else (y1 + y2) / 2 + 4, label, 12, 600, color)

def poly_arrow(points, color="#334155", dash=False, label=None, lpos=None):
    d = ' stroke-dasharray="6 5"' if dash else ""
    pts = " ".join(f"{x},{y}" for x, y in points)
    add(f'<polyline points="{pts}" fill="none" stroke="{color}" stroke-width="2.2" marker-end="url(#ah{color[1:]})"{d}/>')
    if label and lpos:
        text(lpos[0], lpos[1], label, 12, 600, color)

def step_badge(x, y, s, kind="orch"):
    _, stroke = C[kind]
    add(f'<circle cx="{x}" cy="{y}" r="15" fill="{stroke}"/>')
    text(x, y + 5, s, 12.5, 800, "#FFFFFF", "middle")

colors_for_markers = {"#334155", "#B91C1C", "#15803D", "#6D28D9", "#B45309", "#C2410C", "#0369A1", "#BE123C", "#A16207"}
defs = "".join(
    f'<marker id="ah{c[1:]}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{c}"/></marker>'
    for c in colors_for_markers)

# ---------------- header ----------------
add(f'<rect x="0" y="0" width="{W}" height="{H}" fill="#F8FAFC"/>')
add(f'<rect x="0" y="0" width="{W}" height="92" fill="#0F172A"/>')
text(40, 44, "vi-writer: complete LinkedIn content workflow", 30, 800, "#FFFFFF")
text(40, 74, "Skills: vi-writer · review-panel   |   Agents: trend-captain · fact-checker · compliance · editorial   |   Publish: copy-paste or Claude in Chrome   |   State as of 2026-11-01", 15, 400, "#CBD5E1")

MX, MW = 40, 1150  # main column
RX, RW = 1230, 490  # right column
cx = MX + MW / 2

# ---------------- row 1: inputs ----------------
y = 120
text(MX, y - 6, "INPUTS", 12.5, 800, MUTED)
box(MX, y, 360, 112, "input", "/vi-writer  <input>", [
    "• a topic or opinion: “genai is good for finance”",
    "• a domain: “AI agents”",
    "• empty → use my-views.md",
    "• flags: --no-trend   (format/angle notes optional)"], size=13)
box(MX + 395, y, 360, 112, "input", "my-views.md", [
    "Domains D1 GenAI in marketing, D2 Claude/GPT",
    "updates → marketing (rotation by ‘Last used’)",
    "Opinions O1–O4 + guardrails · Voice notes",
    "Rules: posts must agree with my opinions"], size=13)
box(MX + 790, y, 360, 112, "input", "posts/  registry", [
    "front matter: status draft | published |",
    "superseded · published_url · thesis",
    "Only PUBLISHED posts count for overlap",
    "managed by scripts/publish.py"], size=13)
for x0 in (MX + 180, MX + 575, MX + 970):
    arrow(x0, y + 112, x0 if x0 == MX + 575 else cx, 268)

# ---------------- row 2: step S ----------------
y = 270
step_badge(MX - 2, y + 2, "S")
box(MX + 20, y, MW - 20, 74, "orch", "Open run folder · load context", [
    "Create research/runs/YYYY-MM-DD_<input>/ + request.md   ·   load my-views.md opinions   ·   publish.py --published-summary (date, title, thesis of published posts)"], size=13.5, tag="vi-writer")
arrow(cx, y + 74, cx, 372)

# ---------------- row 3: routing ----------------
y = 374
box(MX + 20, y, MW - 20, 92, "gate", "Route the input  (automatic, no question to the user)", [
    "Empty → pick domain from my-views.md (oldest ‘Last used’, priority tie-break) + its opinions → treated as TOPIC with that stance",
    "Topic/stance → derive parent domain, focus on topic   ·   Domain → scan whole domain   ·   --no-trend → skip trend-captain, go to Step 2 research",
    "Every post must agree with my-views opinions (never argue against one; evidence never misstated)"], size=13)
poly_arrow([(MX + MW - 10, y + 46), (MX + MW + 10, y + 46), (MX + MW + 10, 1000), (MX + MW - 5, 1000)], "#A16207", True)
text(MX + MW + 14, 700, "--no-trend", 12, 700, "#A16207")
arrow(cx, y + 92, cx, 494)

# ---------------- row 4: trend-captain ----------------
y = 496
step_badge(MX - 2, y + 2, "0", "trend")
box(MX + 20, y, MW - 20, 236, "trend", "trend-captain agent  (WebSearch · WebFetch · Write)", [], tag="AGENT")
sx = MX + 36
sub = [
    ("1  Sweep", ["6–10 searches in one batch:", "news, launches, papers, surveys,", "regulation, funding, debates"]),
    ("2  Cluster + date-check", ["one story per trend;", "publish date verified on", "the page; last 3 days"]),
    ("3  Score /100 for LinkedIn", ["relevance×4 · evidence×4", "practitioner×3 · conversation×3", "freshness×2 · saturation×2 · …"]),
    ("4  Adjust + pick top 3", ["+10 tied to topic focus", "+≤10 fits my-views opinions", "−20 / drop if repeats published"]),
    ("5  Deep-dive #1", ["open 2–4 sources →", "evidence pack (4–8 facts)", "angle · hooks · caveat · PM call"]),
]
bw = (MW - 52 - 4 * 12) / 5
for i, (t, ls) in enumerate(sub):
    bx = sx + i * (bw + 12)
    add(f'<rect x="{bx}" y="{y+40}" width="{bw}" height="118" rx="8" fill="#FFFFFF" stroke="#6D28D9" stroke-width="1.4"/>')
    text(bx + 10, y + 62, t, 13.5, 700, "#6D28D9")
    for j, l in enumerate(ls):
        text(bx + 10, y + 84 + j * 19, l, 12.2)
    if i < 4:
        arrow(bx + bw + 1, y + 99, bx + bw + 11, y + 99, "#6D28D9")
text(sx, y + 184, "Saves: trend-scan/search-log.md · candidates.md (all scores + keep/drop reasons) · trend-report.md · sources/NN-*.md (one note per page opened)", 13, 600, "#6D28D9")
text(sx, y + 208, "Returns: TREND-CAPTAIN REPORT → Top 3 table · score breakdown · selected topic (angle, post type, format, lane) · STANCE / OVERLAP / VIEWS FIT checks · evidence pack", 13, 400, INK)
arrow(cx, y + 236, cx, 760)

# ---------------- row 5: gate ----------------
y = 762
box(MX + 20, y, MW - 20, 66, "gate", "Accept #1?  ≥4 sourced facts incl. a real number + a named example · dated in window · thesis ≠ any published post", [
    "No → take #2/#3   ·   nothing qualifies → TOPIC: research it directly · DOMAIN: ask user   ·   ranks #2/#3 → research/backlog.md"], size=13, title_size=14.5)
arrow(cx, y + 66, cx, 856)

# ---------------- row 6: writing steps ----------------
y = 858
text(MX + 20, y - 6, "WRITE  (vi-writer + references/)", 12.5, 800, "#1D4ED8")
ws = [
    ("1", "Understand", ["sharpen stance to the most", "defensible version; map lane;", "align with my-views opinions"]),
    ("2", "Research / verify", ["use evidence pack; open the 1–3", "key sources (or 3–6 searches if", "--no-trend); save sources/ + analysis/"]),
    ("3", "Post type + format", ["field note · research translation ·", "prediction · post-mortem · verdict ·", "carousel  |  text · image · document"]),
    ("4", "Write the anatomy", ["hook ≤140 chars (3 options) · context", "· 3–5 beats w/ caveat · takeaway ·", "CTA question · first comment (links)"]),
]
bw = (MW - 20 - 3 * 14) / 4
for i, (n, t, ls) in enumerate(ws):
    bx = MX + 20 + i * (bw + 14)
    box(bx, y, bw, 118, "orch", f"{n}  {t}", ls, size=12.6)
    if i < 3:
        arrow(bx + bw + 1, y + 59, bx + bw + 13, y + 59, "#1D4ED8")
text(MX + 20, y + 140, "Rules: no placeholders · every fact sourced · never invent personal experience · opinions in first person · no bait · links only in first comment · 0–2 hashtags", 13, 600, "#1D4ED8")
arrow(cx, y + 150, cx, 1030)

# ---------------- row 7: checks ----------------
y = 1032
step_badge(MX - 2, y + 2, "5", "check")
box(MX + 20, y, MW - 20, 196, "check", "Self-checks on writing/draft-vN.md  (one .md per version: post · hooks · changes · results)", [], tag="SCRIPTS")
cks = [
    ("record_checks.py runs ↓", ["writes both results into", "the draft .md file"]),
    ("check_post.py  (quality)", ["hook ≤140 · length by format", "links/hashtags/@ · bait phrases", "markdown · placeholders = FAIL"]),
    ("check_overlap.py  (5b)", ["vs PUBLISHED posts only:", "content · phrases · hook · stats", "≥25% FAIL · 15–24% WARN"]),
    ("5b angle overlap  (judgement)", ["same thesis / same evidence?", "overall = max(script, angle)", "≥25% → rewrite or switch trend"]),
    ("5c views alignment", ["lines expressing O-ids ·", "no contradiction · guardrails", "opinion never stated as fact"]),
]
bw = (MW - 52 - 4 * 10) / 5
for i, (t, ls) in enumerate(cks):
    bx = MX + 36 + i * (bw + 10)
    add(f'<rect x="{bx}" y="{y+40}" width="{bw}" height="104" rx="8" fill="#FFFFFF" stroke="#B45309" stroke-width="1.4"/>')
    text(bx + 10, y + 62, t, 13, 700, "#B45309")
    for j, l in enumerate(ls):
        text(bx + 10, y + 84 + j * 19, l, 12.2)
text(MX + 36, y + 172, "FAIL anywhere → revise (back to Step 4); overlap fails twice → stop and tell the user which published post it collides with", 13, 600, "#B91C1C")
poly_arrow([(MX + 20, y + 120), (MX + 6, y + 120), (MX + 6, 920), (MX + 18, 920)], "#B91C1C", True)
arrow(cx, y + 196, cx, 1258)

# ---------------- row 8: review panel ----------------
y = 1260
step_badge(MX - 2, y + 2, "5d", "panel")
box(MX + 20, y, MW - 20, 470, "panel", "Review panel  (skill: review-panel · runs automatically · reports saved verbatim in review/panel-vN.md + review/review-log.md)", [], title_size=15)
# round 1
ry = y + 46
text(MX + 36, ry + 4, "ROUND 1 (parallel, independent)", 12.5, 800, MUTED)
box(MX + 36, ry + 14, 520, 150, "fact", "fact-checker  (WebSearch · WebFetch · Read)", [
    "• extracts every claim: numbers, dates, names, quotes,",
    "  attributions, comparisons; recomputes derived ratios",
    "• verifies from primary sources, never the writer’s notes",
    "• opinion-as-fact check · first-comment links load",
    ("VERIFIED · SECONDARY · IMPRECISE · UNSUPPORTED · FALSE  →  PASS / FIX / BLOCK", {"weight": 700, "size": 12.4, "color": "#15803D"})], size=12.8, tag="AGENT")
box(MX + 576, ry + 14, 558, 150, "comp", "compliance  (Read · WebSearch · WebFetch)", [
    "1 defamation/disparagement 2 copyright 3 trademarks/endorsement",
    "4 financial & regulatory 5 disclosure/conflicts 6 privacy",
    "7 LinkedIn community policy 8 cultural sensitivity & inclusion",
    "• safer wording for every issue · image/logo rules",
    ("BLOCK · MUST-FIX · ADVISORY · ESCALATE  →  PASS / FIX / ESCALATE / BLOCK", {"weight": 700, "size": 12.4, "color": "#BE123C"})], size=12.8, tag="AGENT")
# fixes
fy = ry + 184
box(MX + 36, fy, 1098, 56, "orch", None, [
    ("Apply fixes → next draft-vN.md   ·   precedence: compliance > fact-checker > editorial   ·   fixed lines become LOCKED", {"weight": 700, "color": "#1D4ED8"}),
    "ESCALATE → ask the user (AskUserQuestion)   ·   BLOCK → rebuild from VERIFIED facts   ·   any fix → ROUND 2 in DELTA mode (changed lines only), max 2 rounds"], size=12.8)
arrow(MX + 296, ry + 164, MX + 296, fy, "#15803D")
arrow(MX + 855, ry + 164, MX + 855, fy, "#BE123C")
# editorial
ey = fy + 76
box(MX + 36, ey, 700, 118, "edit", "editorial  (Read)  ·  last reviewer, the only one that rewrites", [
    "scores 1–5: hook · clarity · rhythm · audience value · voice · comment potential",
    "edits if avg < 4.5 or any < 4 · may NOT change facts, numbers, sources, stance, LOCKED lines",
    "skeptic read: top 3 critical comments + whether the post survives them",
    ("→ NO CHANGES / EDITED (diff table + changed claim sentences)", {"weight": 700, "color": "#0369A1"})], size=12.6, tag="AGENT")
arrow(MX + 386, fy + 56, MX + 386, ey, "#0369A1")
box(MX + 756, ey, 378, 118, "gate", "Delta re-check", [
    "edited sentences with claims/names/",
    "opinions → fact-checker + compliance",
    "(DELTA); flagged edits reverted/fixed",
    ("→ FINAL draft  (Status: final)", {"weight": 700, "color": "#15803D"})], size=12.6)
arrow(MX + 736, ey + 59, MX + 754, ey + 59, "#0369A1")
text(MX + 36, y + 456, "Stop rule: BLOCK still open after 2 rounds → post is NOT delivered; user sees the blocking issues", 13, 700, "#B91C1C")
arrow(cx, y + 470, cx, 1758)

# ---------------- row 9: output + save ----------------
y = 1760
step_badge(MX - 2, y + 2, "6", "store")
box(MX + 20, y, 555, 150, "store", "Step 6 · Output to the user", [
    "Top-3 trend table · post type / format / lane",
    "hook & length · Overlap % · Views ✓ · Review panel line",
    "the FINAL post (paste-ready) · first comment",
    "alternative hooks · evidence used · editorial changes",
    "posting notes (disclosure, image rules, pushback)"], size=12.8)
box(MX + 595, y, 555, 150, "store", "Step 7 · Save & index", [
    "final/post.md (+ post-v2 after review) in the run",
    "posts/YYYY-MM-DD-<slug>.md with front matter (status,",
    "thesis…) · run README file map · research/INDEX.md",
    "research/backlog.md (#2/#3) · my-views.md ‘Last used’",
    "+ Usage log  ·  never overwrite (-v2, -v3)"], size=12.8)
step_badge(MX + 595 - 2, y + 2, "7", "store")
arrow(cx, y + 150, cx, 1938)

# ---------------- row 10: publish ----------------
y = 1940
step_badge(MX - 2, y + 2, "8", "pub")
box(MX + 20, y, MW - 20, 330, "pub", "Publish  (user chooses each time)", [], tag="USER-CONFIRMED")
box(MX + 36, y + 42, 250, 92, "input", "A · Copy-paste", ["user posts manually,", "then: ‘I published X: <url>’", "→ publish.py marks it"], size=12.6)
box(MX + 36, y + 146, 250, 70, "input", "C · Later", ["stays status: draft;", "not counted for overlap"], size=12.6)
text(MX + 306, y + 58, "B · Claude in Chrome  (done once manually 2026-11-01 · reusable /linkedin-post skill planned)", 13.5, 700, "#C2410C")
chain = [
    ("Gates", ["reviewed final", "checks pass", "disclosure set"]),
    ("Open + verify", ["new tab →", "linkedin.com/feed", "profile = Pravin"]),
    ("Compose", ["Start a post", "type exact text", "read back = file"]),
    ("Preview", ["screenshot →", "user: Post now /", "keep / cancel"]),
    ("Post once", ["click Post 1×", "get URL from", "‘View post’"]),
    ("First comment", ["sources + extra", "detail; verify", "no duplicates"]),
    ("Record", ["publish.py --url", "INDEX + README", "publish/ log"]),
]
cw, gap = 116, 12
for i, (t, ls) in enumerate(chain):
    bx = MX + 306 + i * (cw + gap)
    gate = t == "Preview"
    add(f'<rect x="{bx}" y="{y+72}" width="{cw}" height="100" rx="8" fill="{"#FEF9C3" if gate else "#FFFFFF"}" stroke="{"#A16207" if gate else "#C2410C"}" stroke-width="{2.2 if gate else 1.4}"/>')
    text(bx + 9, y + 92, t, 13, 700, "#A16207" if gate else "#C2410C")
    for j, l in enumerate(ls):
        text(bx + 9, y + 112 + j * 18, l, 11.8)
    if i < len(chain) - 1:
        arrow(bx + cw + 1, y + 122, bx + cw + gap - 1, y + 122, "#C2410C")
text(MX + 306, y + 198, "Never: likes, comments on others, DMs, connection requests, profile changes · stop on wrong account, layout change, dialogs", 12.8, 600, "#B91C1C")
text(MX + 306, y + 220, "Saved: runs/<run>/publish/publish-log.md · composer-preview.jpg · live-post.jpg · posting.gif", 12.8, 600, "#0F766E")
text(MX + 36, y + 256, "After publishing: posts/<file> → status: published + URL  ⇒  future runs check overlap against it (loop back to trend-captain’s −20 penalty and Step 5b).", 13.5, 700, "#334155")
text(MX + 36, y + 282, "First publication: 2026-11-01 · “The best AI score on financial modeling tasks is 57.0%…” · linkedin.com/feed/update/urn:li:activity:7522692657287196672", 13, 400, MUTED)
text(MX + 36, y + 306, "Note: automation is a gray area under LinkedIn’s User Agreement → low volume, one explicit ‘Post now’ per post, official Posts API = possible option 3", 12.6, 400, MUTED, italic=True)
poly_arrow([(MX + 20, y + 300), (12, y + 300), (12, 176), (MX - 2, 176)], "#15803D", True)
text(16, 1200, "feedback", 12, 700, "#15803D")

# ---------------- right column ----------------
y = 120
text(RX, y - 6, "LEGEND", 12.5, 800, MUTED)
leg = [("input", "Inputs & config"), ("orch", "vi-writer orchestration steps"), ("trend", "trend-captain agent"),
       ("check", "Scripts / automatic checks"), ("fact", "fact-checker agent"), ("comp", "compliance agent"),
       ("edit", "editorial agent"), ("gate", "Decision gate / user decision"), ("store", "Output & storage"), ("pub", "Publishing")]
for i, (k, l) in enumerate(leg):
    lx = RX + (i % 2) * 245
    ly = y + 6 + (i // 2) * 30
    f, s = C[k]
    add(f'<rect x="{lx}" y="{ly}" width="26" height="18" rx="4" fill="{f}" stroke="{s}" stroke-width="2"/>')
    text(lx + 34, ly + 14, l, 13)
ly = y + 6 + 5 * 30
add(f'<line x1="{RX}" y1="{ly+9}" x2="{RX+40}" y2="{ly+9}" stroke="#B91C1C" stroke-width="2.2" stroke-dasharray="6 5" marker-end="url(#ahB91C1C)"/>')
text(RX + 50, ly + 14, "fail / revise loop", 13)
add(f'<line x1="{RX+245}" y1="{ly+9}" x2="{RX+285}" y2="{ly+9}" stroke="#15803D" stroke-width="2.2" stroke-dasharray="6 5" marker-end="url(#ah15803D)"/>')
text(RX + 295, ly + 14, "feedback into next run", 13)

y = 330
box(RX, y, RW, 352, "panel", "Components (all local to the project)", [
    ("SKILLS  .claude/skills/", {"weight": 800, "color": MUTED, "size": 12}),
    "/vi-writer   orchestrates research → write → check → review",
    "/review-panel   fact → compliance → editorial (also standalone)",
    "/linkedin-post   (planned: Chrome publishing as a skill)",
    ("AGENTS  .claude/agents/", {"weight": 800, "color": MUTED, "size": 12}),
    "trend-captain · fact-checker · compliance · editorial",
    ("SCRIPTS  vi-writer/scripts/", {"weight": 800, "color": MUTED, "size": 12}),
    "record_checks.py · check_post.py · check_overlap.py",
    "publish.py (--list, --url, --unpublish, --published-summary)",
    "postlib.py (front matter + post extraction)",
    ("REFERENCES  vi-writer/references/", {"weight": 800, "color": MUTED, "size": 12}),
    "anatomy · hooks · post-types · ai-niche · research ·",
    "checklist · storage    (from anatomy-of-an-ai-post.html)",
    ("CONFIG", {"weight": 800, "color": MUTED, "size": 12}),
    "my-views.md (domains, opinions, voice, usage log)"], size=12.8)

y = 704
box(RX, y, RW, 560, "store", "Storage layout", [
    ("LinkedInAutomation/", {"weight": 700}),
    "├─ anatomy-of-an-ai-post.html   research report",
    "├─ my-views.md",
    "├─ posts/   final posts + front matter",
    "└─ research/",
    "   ├─ INDEX.md   one row per run",
    "   ├─ backlog.md   runner-up trends",
    "   └─ runs/YYYY-MM-DD_<input>/",
    "      ├─ README.md · request.md",
    "      ├─ trend-scan/   search-log · candidates ·",
    "      │                trend-report",
    "      ├─ sources/   NN-<publisher>-<slug>.md",
    "      ├─ analysis/   summary · evidence-pack ·",
    "      │              debates",
    "      ├─ writing/   draft-v1.md … draft-vN.md",
    "      │   (post · hooks · changes · checks ·",
    "      │    overlap · views · review panel)",
    "      ├─ review/   panel-vN.md · review-log.md",
    "      ├─ final/   post.md · post-v2.md",
    "      └─ publish/   publish-log · screenshots · gif",
    "",
    ("Save as you go · never overwrite · reports verbatim", {"weight": 700, "color": "#0F766E"})], size=12.6)

y = 1286
box(RX, y, RW, 300, "gate", "Human-in-the-loop points", [
    "• Escalations from compliance (legal judgement)",
    "• Disclosure question (ties to named companies)",
    "• Domain input with no qualifying trend",
    "• BLOCK still open after 2 review rounds",
    "• Overlap ≥25% after two rewrites",
    "• Evidence that contradicts a my-views opinion",
    "  (flagged so the user can update the file)",
    "• Publish choice A / B / C every time",
    "• ‘Post now’ confirmation on the live preview",
    "• Telling the skill a manual post went live (URL)"], size=13)

y = 1608
box(RX, y, RW, 300, "input", "Key thresholds", [
    "Trend window: last 3 days (7 if empty; weeks for",
    "‘recent updates’ domains)",
    "Trend score: weighted /100, +10 topic focus,",
    "+≤10 views fit, −20 overlap with a published post",
    "Hook ≤140 chars · text 900–1,500 · image 700–1,000",
    "· document caption ≤100 · hard cap 3,000",
    "Hashtags 0–2 · links only in first comment",
    "Overlap: ≥25% FAIL · 15–24% WARN",
    "Review: max 2 rounds + editorial delta re-check",
    "Editorial edits when avg <4.5 or any score <4"], size=12.8)

y = 1930
box(RX, y, RW, 340, "panel", "Example run: “genai is good for finance”", [
    "trend-captain: 11 candidates → UBS Q3 (97/100)",
    "draft v1 → v3 (self-checks, length trims)",
    "panel R1: fact FIX (7 issues) · compliance FIX",
    "  → v4 (ratio 1:9 → 1:8, survey scope, opinions)",
    "panel R2 (delta): PASS / PASS → v5",
    "editorial: 3.7 → 4.2, 5 edits → v6",
    "delta re-check: “payoff” line fixed → v7 FINAL",
    "",
    "“gen ai for finance is bad” → fact-checker BLOCK",
    "(benchmark v2 archived) → rebuilt on v2.1 data →",
    "v6 FINAL → published via Chrome 2026-11-01"], size=12.8)

svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" '
       f'font-family="Segoe UI, Arial, sans-serif"><defs>{defs}</defs>' + "".join(out) + "</svg>")

D = r"C:\Users\PRAVIN\Desktop\LinkedInAutomation\docs"
os.makedirs(D, exist_ok=True)
sp = os.path.join(D, "vi-writer-workflow.svg")
open(sp, "w", encoding="utf-8").write(svg)
hp = os.path.join(os.path.dirname(os.path.abspath(__file__)), "wf.html")
open(hp, "w", encoding="utf-8").write(f'<!doctype html><html><head><meta charset="utf-8"><style>html,body{{margin:0;padding:0;background:#F8FAFC}}</style></head><body>{svg}</body></html>')
png = os.path.join(D, "vi-writer-workflow.png")
chrome = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
r = subprocess.run([chrome, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--window-size={W},{H}",
                    f"--screenshot={png}", "file:///" + hp.replace("\\", "/")], capture_output=True, text=True, timeout=120)
print(r.returncode, r.stderr[-500:])
print(sp, os.path.getsize(sp)); print(png, os.path.exists(png) and os.path.getsize(png))
