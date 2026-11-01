from html import escape as E
import os, subprocess

D = r"C:\Users\PRAVIN\Desktop\LinkedInAutomation\docs"
S = os.path.dirname(os.path.abspath(__file__))
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
INK, MUTED = "#0F172A", "#475569"


class SVG:
    def __init__(s, w, h):
        s.w, s.h, s.o = w, h, []
        cols = ["#334155", "#1D4ED8", "#6D28D9", "#15803D", "#BE123C", "#0369A1", "#B45309", "#0F766E", "#C2410C", "#A16207"]
        s.defs = "".join(f'<marker id="a{c[1:]}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="{c}"/></marker>' for c in cols)

    def t(s, x, y, txt, size=14, w=400, c=INK, a="start", it=False):
        st = ' font-style="italic"' if it else ""
        s.o.append(f'<text xml:space="preserve" x="{x}" y="{y}" font-size="{size}" font-weight="{w}" fill="{c}" text-anchor="{a}"{st}>{E(txt)}</text>')

    def r(s, x, y, w, h, fill, stroke, rx=12, sw=2, dash=False):
        d = ' stroke-dasharray="7 5"' if dash else ""
        s.o.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{d}/>')

    def line(s, pts, c="#334155", dash=False, w=2.4):
        d = ' stroke-dasharray="7 5"' if dash else ""
        p = " ".join(f"{x},{y}" for x, y in pts)
        s.o.append(f'<polyline points="{p}" fill="none" stroke="{c}" stroke-width="{w}" marker-end="url(#a{c[1:]})"{d}/>')

    def badge(s, x, y, n, c, r=14):
        s.o.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{c}"/>')
        s.t(x, y + 5, str(n), 13, 800, "#FFFFFF", "middle")

    def card(s, x, y, w, h, fill, stroke, title, lines, size=13, tag=None, title_size=16):
        s.r(x, y, w, h, fill, stroke)
        if tag:
            tw = 14 + len(tag) * 8.2
            s.r(x + w - tw - 10, y + 9, tw, 20, stroke, stroke, rx=10, sw=0)
            s.t(x + w - tw / 2 - 10, y + 23, tag, 11.5, 700, "#FFFFFF", "middle")
        s.t(x + 14, y + 27, title, title_size, 700, stroke)
        for i, l in enumerate(lines):
            s.t(x + 14, y + 50 + i * (size + 6), l, size)

    def save(s, name):
        svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{s.w}" height="{s.h}" viewBox="0 0 {s.w} {s.h}" font-family="Segoe UI, Arial, sans-serif"><defs>{s.defs}</defs>{"".join(s.o)}</svg>'
        sp = os.path.join(D, name + ".svg"); open(sp, "w", encoding="utf-8").write(svg)
        hp = os.path.join(S, name + ".html")
        open(hp, "w", encoding="utf-8").write(f'<!doctype html><html><head><meta charset="utf-8"><style>html,body{{margin:0;background:#fff}}</style></head><body>{svg}</body></html>')
        png = os.path.join(D, name + ".png")
        subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--window-size={s.w},{s.h}", f"--screenshot={png}", "file:///" + hp.replace("\\", "/")], capture_output=True, timeout=120)
        print(png, os.path.getsize(png))


# =================== 1. Simple client diagram ===================
g = SVG(1600, 600)
g.r(0, 0, 1600, 600, "#FFFFFF", "#FFFFFF", rx=0, sw=0)
g.t(800, 52, "How the LinkedIn automation works", 32, 800, INK, "middle")
g.t(800, 86, "From an idea to a published, fact-checked post: you set the direction and approve; the system does the rest", 17, 400, MUTED, "middle")
steps = [
    ("1", "Choose", "Topic", ["You give a topic, or the", "system picks one of your", "focus areas and opinions"], "#475569", "#EEF2F7"),
    ("2", "Find", "What's trending", ["Scans the last 3 days of", "industry news and ranks", "the best story for LinkedIn"], "#6D28D9", "#EDE9FE"),
    ("3", "Write", "The post", ["Builds the post from", "verified facts, in your", "voice and opinions"], "#1D4ED8", "#DBEAFE"),
    ("4", "Check", "3 expert reviewers", ["Facts · Legal & sensitivity", "· Engagement. Nothing", "unverified gets through"], "#15803D", "#DCFCE7"),
    ("5", "Publish", "With your OK", ["You see the final post;", "it goes live on LinkedIn", "only when you say \u201cPost\u201d"], "#C2410C", "#FFEDD5"),
]
cw, gap, x0, y0 = 272, 36, 40, 140
for i, (n, verb, noun, ls, c, f) in enumerate(steps):
    x = x0 + i * (cw + gap)
    g.r(x, y0, cw, 300, f, c, rx=18, sw=2.5)
    g.o.append(f'<circle cx="{x + cw/2}" cy="{y0}" r="30" fill="{c}"/>')
    g.t(x + cw / 2, y0 + 10, n, 28, 800, "#FFFFFF", "middle")
    g.t(x + cw / 2, y0 + 82, verb, 30, 800, c, "middle")
    g.t(x + cw / 2, y0 + 114, noun, 18, 600, INK, "middle")
    for j, l in enumerate(ls):
        g.t(x + cw / 2, y0 + 170 + j * 28, l, 16.5, 400, INK, "middle")
    if i < 4:
        g.line([(x + cw + 4, y0 + 150), (x + cw + gap - 4, y0 + 150)], "#334155", w=3)
# human checkpoints
g.r(x0, 470, 1520, 54, "#FEF9C3", "#A16207", rx=12)
g.t(800, 504, "You stay in control: you choose or approve the topic area, and every post needs your \u201cPost now\u201d before it goes live.", 17, 600, "#A16207", "middle")
g.t(800, 566, "Every step (sources, reviews, drafts, final post, LinkedIn link) is saved in the project folder for audit.", 15, 400, MUTED, "middle")
g.save("client-overview")

# =================== 2. Architecture diagram ===================
a = SVG(1700, 1380)
a.r(0, 0, 1700, 1380, "#F8FAFC", "#F8FAFC", rx=0, sw=0)
a.r(0, 0, 1700, 80, "#0F172A", "#0F172A", rx=0, sw=0)
a.t(40, 40, "LinkedIn Automation: architecture", 28, 800, "#FFFFFF")
a.t(40, 66, "Layers, components and data flow · numbers show the order of a run · dashed = human checkpoint or optional", 15, 400, "#CBD5E1")

bands = [
    (100, 170, "1  TRIGGERS & INPUTS", "#475569", "#EEF2F7"),
    (290, 200, "2  ORCHESTRATION (Claude Code skills)", "#1D4ED8", "#EFF6FF"),
    (510, 210, "3  AGENT LAYER (Claude subagents)", "#6D28D9", "#F5F3FF"),
    (740, 200, "4  TOOLS & EXTERNAL SYSTEMS", "#B45309", "#FFFBEB"),
    (960, 200, "5  STORAGE (project folder)", "#0F766E", "#F0FDFA"),
    (1180, 140, "6  OUTPUT & PUBLISHING", "#C2410C", "#FFF7ED"),
]
for y, h, label, c, f in bands:
    a.r(20, y, 1660, h, f, c, rx=14, sw=1.5)
    a.t(40, y + 26, label, 14, 800, c)

# layer 1
a.card(60, 140, 360, 116, "#FFFFFF", "#475569", "Author (you)", ["/vi-writer <topic | domain | empty>", "answers questions · says \u201cPost now\u201d", "tells the system a post went live"], tag="HUMAN")
a.card(450, 140, 360, 116, "#FFFFFF", "#475569", "my-views.md", ["focus areas (domains) & rotation", "opinions + guardrails · voice", "used when no topic is given"])
a.card(840, 140, 360, 116, "#FFFFFF", "#475569", "Published-post registry", ["posts/*.md front matter", "status · URL · thesis", "basis for the overlap check"])
a.card(1230, 140, 410, 116, "#FFFFFF", "#475569", "Scheduler (optional, not built)", ["Claude Code /schedule or LinkedIn", "native scheduling could start runs", "on a cadence, e.g. Tue\u2013Thu"], tag="FUTURE")
a.o.append('<rect x="1230" y="140" width="410" height="116" rx="12" fill="none" stroke="#475569" stroke-width="2" stroke-dasharray="7 5"/>')

# layer 2
a.card(60, 330, 960, 140, "#DBEAFE", "#1D4ED8", "vi-writer skill (orchestrator)", [
    "route input \u2192 call trend-captain \u2192 accept top trend \u2192 verify key facts \u2192 choose post type & format",
    "\u2192 write post (hook \u2264140, context, beats, takeaway, CTA, first comment) \u2192 run checks \u2192 call review panel",
    "\u2192 deliver final post \u2192 save & index everything \u2192 offer publish options"], size=13.5, tag="SKILL")
a.card(1060, 330, 580, 140, "#F1F5F9", "#334155", "review-panel skill", [
    "round 1: fact-checker \u2225 compliance",
    "apply fixes (compliance > facts > editorial)",
    "round 2 on changed lines (max 2) \u2192 editorial",
    "\u2192 re-check edited claims \u2192 FINAL"], size=13.5, tag="SKILL")

# layer 3
ag = [("trend-captain", "#6D28D9", "#EDE9FE", ["finds & ranks trends", "(last 3 days, /100)", "evidence pack for #1"]),
      ("fact-checker", "#15803D", "#DCFCE7", ["verifies every claim", "at primary source", "PASS / FIX / BLOCK"]),
      ("compliance", "#BE123C", "#FFE4E6", ["legal, defamation,", "copyright, disclosure,", "cultural sensitivity"]),
      ("editorial", "#0369A1", "#E0F2FE", ["engagement score,", "edits within locks,", "predicts pushback"])]
for i, (n, c, f, ls) in enumerate(ag):
    x = 60 + i * 400
    a.card(x, 550, 370, 150, f, c, n, ls, size=14, tag="AGENT")

# layer 4
a.card(60, 780, 480, 150, "#FFFFFF", "#B45309", "Web search & fetch", ["news, research papers, regulators,", "company filings, surveys", "(sources recorded with dates)"], size=13.5)
a.card(570, 780, 520, 150, "#FFFFFF", "#B45309", "Python check scripts", ["check_post: hook, length, bait, links", "check_overlap: \u226525% vs published = FAIL", "record_checks \u00b7 publish (registry)"], size=13.5)
a.card(1120, 780, 520, 150, "#FFFFFF", "#C2410C", "Claude in Chrome \u2192 LinkedIn", ["your logged-in Chrome session", "compose \u2192 exact-text check \u2192", "preview \u2192 your \u201cPost now\u201d \u2192 post once"], size=13.5)

# layer 5
st = [("research/runs/<run>/", ["trend-scan \u00b7 sources \u00b7 analysis", "writing drafts \u00b7 review \u00b7 publish logs"]),
      ("posts/", ["final posts + status", "URL \u00b7 thesis"]),
      ("research/INDEX.md \u00b7 backlog.md", ["one row per run", "runner-up ideas"]),
      ("docs/", ["diagrams \u00b7 design docs", "this document"])]
ws = [540, 280, 380, 270]
x = 60
for (n, ls), w in zip(st, ws):
    a.card(x, 1000, w - 20, 120, "#FFFFFF", "#0F766E", n, ls, size=13.5)
    x += w + 10

# layer 6
a.card(60, 1220, 760, 84, "#FFFFFF", "#C2410C", "Final post delivered", ["paste-ready text + first comment + evidence + review summary"], size=13.5)
a.card(850, 1220, 790, 84, "#FFFFFF", "#C2410C", "Live LinkedIn post", ["published only after your confirmation; URL saved"], size=13.5)

# flows (numbered)
a.line([(400, 256), (400, 328)], "#1D4ED8"); a.badge(420, 292, 1, "#1D4ED8")
a.line([(630, 256), (630, 328)], "#1D4ED8")
a.line([(1020, 256), (1020, 300), (800, 300), (800, 328)], "#1D4ED8")
a.line([(1435, 256), (1435, 300), (1030, 300)], "#475569", dash=True)
a.line([(400, 470), (400, 548)], "#6D28D9"); a.badge(420, 510, 2, "#6D28D9")
a.line([(400, 700), (400, 778)], "#B45309"); a.badge(380, 740, 3, "#B45309")
a.line([(1150, 470), (1150, 520), (645, 520), (645, 548)], "#334155"); a.badge(1170, 500, 5, "#334155")
a.line([(1020, 400), (1058, 400)], "#1D4ED8"); a.badge(1040, 386, 4, "#334155")
a.line([(1300, 470), (1300, 530), (1045, 530), (1045, 548)], "#334155")
a.line([(1450, 470), (1450, 548)], "#0369A1"); a.badge(1470, 510, 6, "#0369A1")
a.line([(560, 700), (560, 740), (480, 740), (480, 778)], "#15803D")
a.line([(960, 700), (960, 755), (520, 755), (520, 778)], "#BE123C")
a.line([(830, 470), (830, 778)], "#B45309", dash=True)
a.line([(450, 930), (450, 998)], "#0F766E"); a.badge(470, 965, 7, "#0F766E")
a.line([(520, 1120), (520, 1218)], "#C2410C"); a.badge(540, 1170, 8, "#C2410C")
a.line([(1600, 930), (1600, 1218)], "#C2410C", dash=True); a.badge(1620, 1170, 9, "#C2410C")
a.line([(820, 1262), (848, 1262)], "#C2410C", dash=True)
a.t(1500, 1212, "you approve", 12.5, 700, "#A16207")
a.t(860, 545, "", 10)
a.t(40, 1352, "1 trigger  2 trend research  3 web evidence  4 hand-off to review  5\u20136 reviewers  7 save  8 deliver  9 publish (confirmed)  \u00b7 feedback: published posts feed the overlap check of the next run", 13, 600, MUTED)
a.save("architecture")
