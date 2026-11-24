"""Step 2 test: skill steps A+B on one saved input; result must match the human answer key.

Run: python tests/rule_doctor/test_step2.py
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
KEY = json.loads((ROOT / "rules" / "expected_rule_doctor.json").read_text(encoding="utf-8"))
RULE = "Maintenance Kit Quantity Limit (Demo)"
FIXTURE = ROOT / "rules" / "fixtures" / "healthy" / "maintenance-kit-quantity-limit-demo.json"
fails = 0


def check(ok, label, detail=""):
    global fails
    fails += not ok
    print(("PASS " if ok else "FAIL ") + label + (f"  ({detail})" if detail else ""))


def run(args):
    p = subprocess.run([sys.executable, *args], cwd=ROOT, capture_output=True, text=True, encoding="utf-8")
    return p.returncode, p.stdout + p.stderr


# Step A
code, out = run(["scripts/rule_doctor_start.py", "--data", str(FIXTURE)])
m = re.search(r"^RUN_DIR=(.+)$", out, re.M)
check(code == 0 and m is not None, "step A: run folder started", out.strip().splitlines()[-1] if out.strip() else "")
run_dir = Path(m.group(1).strip()) if m else None
if run_dir:
    for s in ["01_input", "02_research", "03_draft", "04_review", "05_final"]:
        check((run_dir / s).is_dir(), f"step A: {s}/ exists")
    check(run_dir.name.endswith("_rule-doctor-maintenance-kit-quantity-limit-demo"), "step A: folder name follows config", run_dir.name)
    check((run_dir / "01_input" / "request.json").exists() and (run_dir / "01_input" / "config_snapshot.md").exists(),
          "step A: request.json and config_snapshot.md written")
    check((run_dir / "02_research" / "rule_data.json").read_bytes() == FIXTURE.read_bytes(), "step A: data copied unchanged")

    # Step B
    code, out = run(["scripts/rule_doctor_checks.py", str(run_dir)])
    cj = run_dir / "03_draft" / "checks.json"
    check(code == 0 and cj.exists(), "step B: checks.json written")
    if cj.exists():
        res = json.loads(cj.read_text(encoding="utf-8"))
        check(len(res["results"]) == 12 and [r["check"] for r in res["results"]] == list(range(1, 13)), "step B: 12 checks reported")
        check(all(r["evidence"] for r in res["results"]), "step B: every check has evidence")
        check(res["overall"] == KEY["healthy"][RULE], f"answer key: {RULE}",
              f"expected {KEY['healthy'][RULE]}, got {res['overall']} blocking={res['blocking_checks']}")
        print("\nPer-check results:\n" + "\n".join(l for l in out.splitlines() if l.startswith("  ") or l.startswith("OVERALL")))

src = (ROOT / "scripts" / "rule_doctor_checks.py").read_text(encoding="utf-8")
check(not any(b in src for b in ("subprocess", "os.system", "'sf'", '"sf"', "sf.cmd", "requests", "urllib")),
      "checks script never calls Salesforce")
check("expected_rule_doctor" not in src, "checks script never reads the answer key")

print("\nSTEP 2 RESULT:", "PASS" if not fails else f"FAIL ({fails})")
sys.exit(1 if fails else 0)
