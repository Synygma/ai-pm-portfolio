"""Run the quality check and the overlap check on a draft .md file and write
both results into that same file (replacing earlier results if present).

Usage: python record_checks.py <run>/writing/draft-vN.md --format text|image|document|video|poll [--exclude NAME]

The draft file must contain the post inside a fenced code block under a '## Post' heading.
Sections written/replaced: '## Quality check (check_post.py)' and '## Overlap check (check_overlap.py)'.
Exit code 1 if either check FAILs.
"""
import argparse
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import postlib  # noqa: E402

SECTIONS = ["## Quality check (check_post.py)", "## Overlap check (check_overlap.py)"]


def run(args):
    env = dict(os.environ, PYTHONIOENCODING="utf-8")
    p = subprocess.run([sys.executable] + args, capture_output=True, text=True, encoding="utf-8", env=env)
    return p.returncode, (p.stdout + p.stderr).strip()


def replace_section(text, heading, content):
    block = f"{heading}\n```\n{content}\n```\n"
    pat = re.compile(rf"^{re.escape(heading)}\n```\n.*?\n```\n?", re.S | re.M)
    if pat.search(text):
        return pat.sub(lambda _: block, text)
    # insert before '## Overlap judgement' if present, else append
    m = re.search(r"^## Overlap judgement", text, re.M)
    if m and heading == SECTIONS[0] and SECTIONS[1] in text:
        m = re.search(rf"^{re.escape(SECTIONS[1])}", text, re.M)
    if m:
        return text[:m.start()] + block + "\n" + text[m.start():]
    return text.rstrip("\n") + "\n\n" + block


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("draft")
    ap.add_argument("--format", default="text")
    ap.add_argument("--exclude", action="append", default=[])
    a = ap.parse_args()

    q_code, q_out = run([os.path.join(HERE, "check_post.py"), a.draft, "--format", a.format])
    o_args = [os.path.join(HERE, "check_overlap.py"), a.draft]
    for x in a.exclude:
        o_args += ["--exclude", x]
    o_code, o_out = run(o_args)

    text = postlib.read(a.draft)
    text = replace_section(text, SECTIONS[0], q_out)
    text = replace_section(text, SECTIONS[1], o_out)
    with open(a.draft, "w", encoding="utf-8") as f:
        f.write(text)

    print("Quality check:", q_out.splitlines()[-1] if q_out else "no output")
    print("Overlap check:", o_out.splitlines()[-1] if o_out else "no output")
    sys.exit(1 if (q_code or o_code) else 0)


if __name__ == "__main__":
    main()
