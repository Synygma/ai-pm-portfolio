#!/usr/bin/env python3
"""Rule Doctor - create a run folder (ARCHITECTURE.md section 4).

Step 2 scope: start a run from a SAVED rule data file (no Salesforce access).
Later steps add: no-name listing from config (step 3), live reads (step 4), cheap check (step 5).

Usage:
    python scripts/rule_doctor_start.py --data <saved rule_data.json>

Creates runs/<YYYY-MM-DD>_rule-doctor-<rule-slug>/ with 01_input .. 05_final,
writes 01_input/request.json and 01_input/config_snapshot.md, and copies the data to
02_research/rule_data.json. Prints RUN_DIR=<path>. Exit 0 ok, 1 error.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from datetime import date, datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "config" / "my_context.md"
RUNS = ROOT / "runs"
SUBFOLDERS = ["01_input", "02_research", "03_draft", "04_review", "05_final"]


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def start_for_rule(name):
    """Live run (step 4): folder + request only. No Salesforce access; the cheap check is added in step 5."""
    if not CONFIG.exists():
        print(f"ERROR: config file not found: {CONFIG}")
        return 1
    run_dir = RUNS / f"{date.today().isoformat()}_rule-doctor-{slug(name)}"
    for s in SUBFOLDERS:
        (run_dir / s).mkdir(parents=True, exist_ok=True)
    (run_dir / "01_input" / "request.json").write_text(json.dumps({
        "rule_name": name, "source": "live read",
        "requested_at_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }, indent=2), encoding="utf-8")
    shutil.copyfile(CONFIG, run_dir / "01_input" / "config_snapshot.md")
    print(f"RULE: {name}")
    print(f"RUN_DIR={run_dir}")
    return 0


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--data", help="saved rule_data.json")
    g.add_argument("--rule", help="product rule name for a live read")
    a = ap.parse_args()
    if a.rule:
        return start_for_rule(a.rule.strip())
    src = Path(a.data)
    if not src.exists():
        print(f"ERROR: data file not found: {src}")
        return 1
    if not CONFIG.exists():
        print(f"ERROR: config file not found: {CONFIG}")
        return 1
    data = json.loads(src.read_text(encoding="utf-8"))
    rule = data.get("rule") or {}
    if not rule.get("Name") or not rule.get("Id"):
        print(f"ERROR: {src} has no rule.Name / rule.Id")
        return 1

    run_dir = RUNS / f"{date.today().isoformat()}_rule-doctor-{slug(rule['Name'])}"
    for s in SUBFOLDERS:
        (run_dir / s).mkdir(parents=True, exist_ok=True)
    (run_dir / "01_input" / "request.json").write_text(json.dumps({
        "rule_name": rule["Name"], "rule_id": rule["Id"],
        "source": "saved file", "saved_file": str(src.resolve().relative_to(ROOT)) if ROOT in src.resolve().parents else str(src),
        "requested_at_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }, indent=2), encoding="utf-8")
    shutil.copyfile(CONFIG, run_dir / "01_input" / "config_snapshot.md")
    shutil.copyfile(src, run_dir / "02_research" / "rule_data.json")
    print(f"RULE: {rule['Name']} ({rule['Id']})")
    print(f"RUN_DIR={run_dir}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
