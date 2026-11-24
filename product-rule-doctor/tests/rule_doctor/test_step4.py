"""Step 4 test: compare a run's 02_research with a DIRECT read (independent, relationship-free queries),
check the not-found run wrote nothing, and compare org snapshots (LastModifiedDate unchanged).

Usage: python tests/rule_doctor/test_step4.py <RUN_DIR> <NOT_FOUND_RUN_DIR> <before.json> <after.json>
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

run, nf_run, before_f, after_f = (Path(a) for a in sys.argv[1:5])
exe = shutil.which("sf") or shutil.which("sf.cmd")
fails = 0


def check(ok, label, detail=""):
    global fails
    fails += not ok
    print(("PASS " if ok else "FAIL ") + label + (f"  ({detail})" if detail and not ok else ""))


def q(soql):
    p = json.loads(subprocess.run([exe, "data", "query", "--query", soql, "--json"],
                                  capture_output=True, text=True, encoding="utf-8").stdout)
    if p.get("status") != 0:
        print("ERROR in direct read:", json.dumps(p)[:800])
        sys.exit(1)
    return [{k: v for k, v in r.items() if k != "attributes"} for r in p["result"]["records"]]


d = json.loads((run / "02_research" / "rule_data.json").read_text(encoding="utf-8"))
name = json.loads((run / "01_input" / "request.json").read_text(encoding="utf-8"))["rule_name"]

# --- direct read: simple queries, no relationship fields
R = q("SELECT Id, Name, SBQQ__Active__c, SBQQ__Type__c, SBQQ__Scope__c, SBQQ__EvaluationEvent__c, SBQQ__EvaluationOrder__c, "
      "SBQQ__ConditionsMet__c, SBQQ__AdvancedCondition__c, SBQQ__ErrorMessage__c FROM SBQQ__ProductRule__c "
      f"WHERE Name = '{name}'")
check(len(R) == 1, "direct read: rule found once")
R = R[0]
for k in R:
    check(d["rule"].get(k) == R[k], f"rule.{k}", f"reader {d['rule'].get(k)!r} vs direct {R[k]!r}")

C = q(f"SELECT Id FROM SBQQ__ErrorCondition__c WHERE SBQQ__Rule__c = '{R['Id']}'")
check(len(d["conditions"]) == len(C), "conditions count", f"{len(d['conditions'])} vs {len(C)}")

A = q("SELECT Id, Name, SBQQ__Type__c, SBQQ__Product__c, SBQQ__FilterField__c, SBQQ__Operator__c, SBQQ__FilterValue__c, "
      f"SBQQ__ParentRuleIsActive__c FROM SBQQ__ProductAction__c WHERE SBQQ__Rule__c = '{R['Id']}' ORDER BY Name")
check(len(d["actions"]) == len(A), "actions count", f"{len(d['actions'])} vs {len(A)}")
for ra, da in zip(A, d["actions"]):
    for k in ra:
        check(da.get(k) == ra[k], f"action {ra['Name']}.{k}", f"reader {da.get(k)!r} vs direct {ra[k]!r}")

CR = q("SELECT Id, Name, SBQQ__Active__c, SBQQ__Product__c, SBQQ__ProductFeature__c FROM SBQQ__ConfigurationRule__c "
       f"WHERE SBQQ__ProductRule__c = '{R['Id']}' ORDER BY Name")
check(len(d["configuration_rules"]) == len(CR), "configuration rules count", f"{len(d['configuration_rules'])} vs {len(CR)}")
for rc, dc in zip(CR, d["configuration_rules"]):
    for k in rc:
        check(dc.get(k) == rc[k], f"configuration rule {rc['Name']}.{k}", f"reader {dc.get(k)!r} vs direct {rc[k]!r}")
    P = q(f"SELECT Name, IsActive FROM Product2 WHERE Id = '{rc['SBQQ__Product__c']}'")[0]
    check(dc["SBQQ__Product__r"]["Name"] == P["Name"] and dc["SBQQ__Product__r"]["IsActive"] == P["IsActive"],
          f"configuration rule {rc['Name']} product name/active")
    if rc.get("SBQQ__ProductFeature__c"):
        F = q("SELECT Name, SBQQ__OptionSelectionMethod__c, SBQQ__ConfiguredSKU__c FROM SBQQ__ProductFeature__c "
              f"WHERE Id = '{rc['SBQQ__ProductFeature__c']}'")[0]
        fr = dc["SBQQ__ProductFeature__r"]
        check(fr["Name"] == F["Name"] and fr["SBQQ__OptionSelectionMethod__c"] == F["SBQQ__OptionSelectionMethod__c"]
              and fr["SBQQ__ConfiguredSKU__c"] == F["SBQQ__ConfiguredSKU__c"],
              f"configuration rule {rc['Name']} feature name / selection method / bundle")

for i, f in enumerate(d.get("features_used", [])):
    F = q("SELECT Id, Name, SBQQ__MinOptionCount__c, SBQQ__MaxOptionCount__c, SBQQ__OptionSelectionMethod__c "
          f"FROM SBQQ__ProductFeature__c WHERE Id = '{f['Id']}'")[0]
    n = len(q(f"SELECT Id FROM SBQQ__ProductOption__c WHERE SBQQ__Feature__c = '{f['Id']}'"))
    check(all(f.get(k) == F[k] for k in F) and f.get("option_count") == n, f"feature {F['Name']} settings and option count",
          f"reader {f} vs direct {F} count {n}")

log = json.loads((run / "02_research" / "query_log.json").read_text(encoding="utf-8"))
check(all(e["type"] in ("soql", "describe") for e in log), "query log: only queries and describes", str(len(log)))
check(all(e["query"].lstrip().upper().startswith("SELECT") for e in log if e["type"] == "soql"), "query log: every query is SELECT")
check(not any("__r)" in e.get("query", "") or "(SELECT" in e.get("query", "") for e in log), "query log: no child-relationship subqueries")

# --- not-found case
nf = nf_run / "02_research"
check(nf.is_dir() and not any(nf.iterdir()), "not-found run: nothing written to 02_research")

# --- org unchanged
b, a = json.load(open(before_f)), json.load(open(after_f))
changed = {o: [i for i in b[o] if a.get(o, {}).get(i) != b[o][i]] for o in b}
changed = {o: v for o, v in changed.items() if v}
check(not changed and b.keys() == a.keys() and all(len(a[o]) == len(b[o]) for o in b),
      f"org unchanged: LastModifiedDate identical for {sum(len(v) for v in b.values())} records in {len(b)} objects",
      str(changed))

print("\nSTEP 4 RESULT:", "PASS" if not fails else f"FAIL ({fails})")
sys.exit(1 if fails else 0)
