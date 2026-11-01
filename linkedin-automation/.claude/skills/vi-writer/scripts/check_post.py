"""Automated checks for a LinkedIn post draft (vi-writer skill).

Usage: python check_post.py <draft.md | post.txt> [--format text|image|document|video|poll]
For .md files, only the post inside the fenced block under '## Post' is checked.
For other files, the file must contain only the post body as it will be pasted (no first comment).
Exit code 1 if any FAIL.
"""
import argparse
import re
import sys

HOOK_LIMIT = 140
HARD_CAP = 3000
RANGES = {  # (min_ok, ideal_low, ideal_high)
    "text": (700, 900, 1500),
    "image": (400, 700, 1000),
    "video": (200, 400, 1000),
    "poll": (100, 200, 800),
}
DOC_CAPTION_MAX = 100

BANNED = [
    r"breaking", r"this changes everything", r"game[- ]?changer", r"revolutioni[sz]e",
    r"\bunlock", r"fast-paced world", r"humbled (and|&) honou?red", r"thrilled to (share|announce)",
    r"here'?s the thing", r"let that sink in", r"read that again", r"and that'?s okay",
    r"most people don'?t know", r"\bagree\?", r"^\s*thoughts\?\s*$", r"comment (yes|\"|'|[A-Z]{2,})",
    r"(and|&) i'?ll (dm|send)", r"repost (to|if)", r"follow me for", r"\bdelve\b", r"in today'?s",
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("path")
    ap.add_argument("--format", default="text", choices=["text", "image", "document", "video", "poll"])
    a = ap.parse_args()
    with open(a.path, encoding="utf-8") as f:
        post = f.read().replace("\r\n", "\n").strip("\n")
    if a.path.lower().endswith(".md"):  # draft/post .md file: check only the post inside '## Post'
        import os as _os
        sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
        import postlib
        post = postlib.extract_post_body(post)

    fails, warns, info = [], [], []
    n = len(post)
    info.append(f"Total length: {n} chars")

    # Hook: first two non-empty lines; the fold also counts blank lines as lines.
    raw_lines = post.split("\n")
    first_three = raw_lines[:3]
    nonempty = [l for l in raw_lines if l.strip()]
    hook = " ".join(nonempty[:2])
    info.append(f"Hook (first 2 non-empty lines): {len(hook)} chars")
    if len(nonempty[0] if nonempty else "") > HOOK_LIMIT:
        fails.append(f"Line 1 is {len(nonempty[0])} chars; the hook's core idea must land within {HOOK_LIMIT}.")
    elif len(hook) > HOOK_LIMIT + 40:
        warns.append(f"First two lines total {len(hook)} chars; on mobile only ~{HOOK_LIMIT} show before 'see more'.")
    if len(first_three) >= 2 and not first_three[1].strip():
        warns.append("Blank line right after line 1 uses a full line of the preview; check line 2 still lands above the fold.")

    # Length
    if n > HARD_CAP:
        fails.append(f"Over LinkedIn's {HARD_CAP}-character cap.")
    if a.format == "document":
        if n > DOC_CAPTION_MAX:
            warns.append(f"Document caption is {n} chars; captions of 0-{DOC_CAPTION_MAX} chars perform best (1.28x reach).")
    else:
        lo, il, ih = RANGES[a.format]
        if n < lo:
            warns.append(f"Short for a {a.format} post ({n} chars). Fine only if it carries one sharp, verified finding.")
        elif n < il or n > ih:
            warns.append(f"Outside the ideal {il}-{ih} char range for {a.format} posts.")

    # Paragraph rhythm
    paras = [p for p in re.split(r"\n\s*\n", post) if p.strip()]
    long_paras = [p for p in paras if len(p.split("\n")) > 4 or len(p) > 400]
    if long_paras:
        warns.append(f"{len(long_paras)} paragraph(s) longer than 4 lines/400 chars; break them up.")
    one_liners = sum(1 for p in paras if len(p.split("\n")) == 1 and len(p) < 40)
    if paras and one_liners / len(paras) > 0.6 and len(paras) > 5:
        warns.append("Mostly very short one-line paragraphs: reads as 'broetry'. Vary the rhythm.")

    # Links, hashtags, mentions
    if re.search(r"https?://|www\.|lnkd\.in", post, re.I):
        fails.append("Link found in the body. Move it to the first comment.")
    tags = re.findall(r"(?<!\w)#\w+", post)
    if len(tags) > 2:
        fails.append(f"{len(tags)} hashtags; use 0-2.")
    mentions = re.findall(r"(?<!\w)@\w+", post)
    if len(mentions) > 3:
        warns.append(f"{len(mentions)} @mentions; tag only people actually in the post (max ~3).")

    # Banned phrases
    for pat in BANNED:
        m = re.search(pat, post, re.I | re.M)
        if m:
            fails.append(f"Banned/bait phrase: '{m.group(0)}'")

    # Emoji density
    emoji = re.findall(r"[\U0001F300-\U0001FAFF☀-➿]", post)
    if len(emoji) > 6:
        warns.append(f"{len(emoji)} emoji; keep them as sparse markers only.")

    # Markdown that LinkedIn won't render
    if re.search(r"\*\*[^*]+\*\*|^#{1,6}\s", post, re.M):
        fails.append("Markdown bold/headers found; LinkedIn shows them as raw symbols.")

    # Placeholders: the post must be final, copy-paste ready
    ph = re.findall(r"\[[^\]]+\]|\b(?:TBD|TODO|XX+)\b|<[^>]+>", post)
    if ph:
        fails.append(f"{len(ph)} placeholder(s) found; the post must be final: " + ", ".join(ph))

    # Invented personal experience (only allowed if the user supplied it)
    pe = re.search(r"\b(we tested|we ran|we shipped|we built|my team|our team|at my company|our company|our clients?)\b", post, re.I)
    if pe:
        warns.append(f"First-person experience phrase '{pe.group(0)}': allowed only if the user supplied that experience.")

    for line in info:
        print("INFO ", line)
    for w in warns:
        print("WARN ", w)
    for f_ in fails:
        print("FAIL ", f_)
    print("RESULT", "FAIL" if fails else "PASS")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
