"""Shared helpers for reading post files in posts/ (front matter + post body)."""
import os
import re

PROJECT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
POSTS_DIR = os.path.join(PROJECT, "posts")

FM_RE = re.compile(r"\A---\n(.*?)\n---\n", re.S)


def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read().replace("\r\n", "\n")


def parse_front_matter(text):
    m = FM_RE.match(text)
    meta = {}
    if m:
        for line in m.group(1).split("\n"):
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip().strip('"')
        text = text[m.end():]
    return meta, text


def set_front_matter(path, updates):
    text = read(path)
    meta, body = parse_front_matter(text)
    # keep key order stable
    order = ["status", "published_url", "published_date", "post_type", "run_folder", "thesis"]
    meta.update({k: v for k, v in updates.items() if v is not None})
    keys = [k for k in order if k in meta] + [k for k in meta if k not in order]
    fm = "---\n" + "\n".join(f"{k}: {meta[k]}" for k in keys) + "\n---\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(fm + body.lstrip("\n"))
    return meta


def extract_post_body(text):
    """Return the paste-ready post text from a post file (first code block under '## Post')."""
    _, body = parse_front_matter(text)
    m = re.search(r"^## Post[^\n]*\n+```[^\n]*\n(.*?)\n```", body, re.S | re.M)
    if m:
        return m.group(1).strip()
    m = re.search(r"\n---\n(.*?)\n---\n", body, re.S)  # fallback: chat-style separators
    return m.group(1).strip() if m else body.strip()


def list_posts(posts_dir=POSTS_DIR):
    out = []
    if not os.path.isdir(posts_dir):
        return out
    for fn in sorted(os.listdir(posts_dir)):
        if fn.endswith(".md") and not fn.startswith("_"):
            p = os.path.join(posts_dir, fn)
            meta, _ = parse_front_matter(read(p))
            out.append((p, meta))
    return out
