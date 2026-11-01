"""Check a draft post for overlap with the user's PUBLISHED LinkedIn posts.

Usage: python check_overlap.py <draft.md | draft.txt> [--posts-dir DIR] [--fail 25] [--warn 15] [--exclude NAME]

Only post files in posts/ whose front matter says `status: published` are compared.
Overlap score (0-100%) per published post = weighted blend of:
  - content similarity (TF-IDF cosine over content words)          weight 0.45
  - phrase reuse (share of the draft's 3-word phrases also in it)   weight 0.30
  - hook similarity (TF-IDF cosine of the first two lines)          weight 0.10
  - shared statistics (share of the draft's numbers also in it)     weight 0.15
FAIL if the highest score >= --fail (default 25%), WARN if >= --warn (default 15%).
Exit code 1 on FAIL.
"""
import argparse
import math
import os
import re
import sys
from collections import Counter

sys.path.insert(0, os.path.dirname(__file__))
import postlib  # noqa: E402

STOP = set("""a about above after again against all am an and any are as at be because been before being below between both but by
can could did do does doing down during each few for from further had has have having he her here hers herself him himself his how
i if in into is it its itself just me more most my myself no nor not now of off on once only or other our ours ourselves out over own
same she should so some such than that the their theirs them themselves then there these they this those through to too under until up
very was we were what when where which while who whom why will with would you your yours yourself yourselves s t don it's that's
i'm you're isn't aren't wasn't weren't doesn't didn't won't can't also one yes""".split())

W = {"content": 0.45, "phrases": 0.30, "hook": 0.10, "stats": 0.15}


def words(t):
    return re.findall(r"[a-z][a-z'\-]+|\d[\d,.]*%?", t.lower())


def content_words(t):
    return [w for w in words(t) if w not in STOP and not w[0].isdigit() and len(w) > 2]


def trigrams(t):
    ws = [w for w in words(t) if w not in STOP]
    return {" ".join(ws[i:i + 3]) for i in range(len(ws) - 2)}


def numbers(t):
    nums = re.findall(r"\d[\d,]*(?:\.\d+)?\s?%?", t)
    out = set()
    for n in nums:
        n = n.replace(",", "").replace(" ", "")
        if re.fullmatch(r"(19|20)\d\d", n):  # years are not statistics
            continue
        if len(n.rstrip("%")) <= 1 and not n.endswith("%"):  # single digits like "2 things"
            continue
        out.add(n)
    return out


def tfidf_cos(a_tokens, b_tokens, corpus):
    n = len(corpus)
    df = Counter()
    for doc in corpus:
        df.update(set(doc))

    def vec(toks):
        tf = Counter(toks)
        return {w: c * (math.log((1 + n) / (1 + df[w])) + 1) for w, c in tf.items()}

    va, vb = vec(a_tokens), vec(b_tokens)
    dot = sum(va[w] * vb.get(w, 0) for w in va)
    na = math.sqrt(sum(v * v for v in va.values()))
    nb = math.sqrt(sum(v * v for v in vb.values()))
    return dot / (na * nb) if na and nb else 0.0


def hook(t):
    lines = [l for l in t.split("\n") if l.strip()]
    return " ".join(lines[:2])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("draft")
    ap.add_argument("--posts-dir", default=postlib.POSTS_DIR)
    ap.add_argument("--fail", type=float, default=25)
    ap.add_argument("--warn", type=float, default=15)
    ap.add_argument("--exclude", action="append", default=[], help="post file name(s) to skip, e.g. the draft's own saved copy")
    a = ap.parse_args()

    draft = postlib.read(a.draft).strip()
    if a.draft.lower().endswith(".md"):
        draft = postlib.extract_post_body(draft)
    published = []
    for p, meta in postlib.list_posts(a.posts_dir):
        if meta.get("status") != "published":
            continue
        if any(x.lower() in os.path.basename(p).lower() for x in a.exclude):
            continue
        published.append((p, meta, postlib.extract_post_body(postlib.read(p))))

    print(f"INFO  Compared against {len(published)} published post(s) in {a.posts_dir}")
    if not published:
        print("INFO  No published posts yet. Nothing to overlap with.")
        print("RESULT PASS")
        return

    corpus = [content_words(draft)] + [content_words(b) for _, _, b in published]
    hcorpus = [content_words(hook(draft))] + [content_words(hook(b)) for _, _, b in published]
    d_tri, d_num = trigrams(draft), numbers(draft)

    rows = []
    for p, meta, body in published:
        content = tfidf_cos(corpus[0], content_words(body), corpus)
        hk = tfidf_cos(hcorpus[0], content_words(hook(body)), hcorpus)
        tri = len(d_tri & trigrams(body)) / len(d_tri) if d_tri else 0.0
        shared_nums = sorted(d_num & numbers(body))
        st = len(shared_nums) / len(d_num) if d_num else 0.0
        score = 100 * (W["content"] * content + W["phrases"] * tri + W["hook"] * hk + W["stats"] * st)
        shared_phr = sorted(d_tri & trigrams(body))[:8]
        rows.append((score, p, meta, content, tri, hk, st, shared_nums, shared_phr))

    rows.sort(key=lambda r: -r[0])
    for score, p, meta, content, tri, hk, st, nums, phr in rows:
        print(f"\nPOST  {os.path.basename(p)}  ({meta.get('published_date', '')}  {meta.get('published_url', '')})")
        print(f"      overlap {score:.1f}%  | content {content*100:.0f}%  phrases {tri*100:.0f}%  hook {hk*100:.0f}%  stats {st*100:.0f}%")
        if nums:
            print("      shared numbers: " + ", ".join(nums))
        if phr:
            print("      shared phrases: " + "; ".join(phr))

    top = rows[0][0]
    print()
    if top >= a.fail:
        print(f"FAIL  Highest overlap {top:.1f}% with {os.path.basename(rows[0][1])} (limit {a.fail:.0f}%).")
        print("RESULT FAIL")
        sys.exit(1)
    if top >= a.warn:
        print(f"WARN  Highest overlap {top:.1f}% with {os.path.basename(rows[0][1])}; make sure the angle and hook are clearly different.")
    print("RESULT PASS")


if __name__ == "__main__":
    main()
