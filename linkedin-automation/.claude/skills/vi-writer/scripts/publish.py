"""Track whether posts are published on LinkedIn.

Usage:
  python publish.py --list
  python publish.py <post-file-or-name> --url <linkedin-url> [--date YYYY-MM-DD]
  python publish.py <post-file-or-name> --unpublish
  python publish.py --init            (add 'status: draft' front matter to any post file missing it)
  python publish.py --published-summary   (date, title, thesis of each published post; fed to trend-captain)

Only posts with status 'published' are used by check_overlap.py.
"""
import argparse
import datetime
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))
import postlib  # noqa: E402


def resolve(name):
    if os.path.isfile(name):
        return os.path.abspath(name)
    cands = [p for p, _ in postlib.list_posts() if name.lower() in os.path.basename(p).lower()]
    if len(cands) == 1:
        return cands[0]
    if not cands:
        sys.exit(f"No post file matches '{name}'. Use --list to see names.")
    sys.exit(f"'{name}' matches several files:\n  " + "\n  ".join(os.path.basename(c) for c in cands))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("post", nargs="?")
    ap.add_argument("--url")
    ap.add_argument("--date")
    ap.add_argument("--unpublish", action="store_true")
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--init", action="store_true")
    ap.add_argument("--published-summary", action="store_true", help="one line per published post: date, title, thesis")
    a = ap.parse_args()

    if a.init:
        for p, meta in postlib.list_posts():
            if "status" not in meta:
                postlib.set_front_matter(p, {"status": "draft", "published_url": "", "published_date": ""})
                print("initialised", os.path.basename(p))
        return

    if a.published_summary:
        rows = [(p, m) for p, m in postlib.list_posts() if m.get("status") == "published"]
        if not rows:
            print("No published posts yet.")
        for p, m in rows:
            _, body = postlib.parse_front_matter(postlib.read(p))
            title = next((l[2:].strip() for l in body.split("\n") if l.startswith("# ")), os.path.basename(p))
            print(f"- {m.get('published_date', '')} · {title} · thesis: {m.get('thesis', 'n/a')} · {os.path.basename(p)}")
        return

    if a.list or not a.post:
        rows = postlib.list_posts()
        if not rows:
            print("No posts yet.")
        for p, meta in rows:
            st = meta.get("status", "draft (no front matter)")
            extra = f"  {meta.get('published_date', '')}  {meta.get('published_url', '')}" if st == "published" else ""
            print(f"{st:<10} {os.path.basename(p)}{extra}")
        return

    path = resolve(a.post)
    if a.unpublish:
        postlib.set_front_matter(path, {"status": "draft", "published_url": "", "published_date": ""})
        print("Marked as draft:", os.path.basename(path))
        return
    if not a.url:
        sys.exit("Give --url <linkedin post url> to mark as published (or --unpublish).")
    if "linkedin.com" not in a.url:
        print("WARN  URL doesn't look like a LinkedIn link; saved anyway.")
    date = a.date or datetime.date.today().isoformat()
    postlib.set_front_matter(path, {"status": "published", "published_url": a.url, "published_date": date})
    print(f"Marked as published: {os.path.basename(path)}  ({date})  {a.url}")


if __name__ == "__main__":
    main()
