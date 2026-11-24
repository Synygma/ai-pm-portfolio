"""Read-only snapshot of Id + LastModifiedDate for every object the Rule Doctor touches.

Usage: python tests/rule_doctor/org_snapshot.py <out.json>
"""
import json
import shutil
import subprocess
import sys

QUERIES = {
    "SBQQ__ProductRule__c": "SELECT Id, LastModifiedDate FROM SBQQ__ProductRule__c ORDER BY Id",
    "SBQQ__ErrorCondition__c": "SELECT Id, LastModifiedDate FROM SBQQ__ErrorCondition__c ORDER BY Id",
    "SBQQ__ProductAction__c": "SELECT Id, LastModifiedDate FROM SBQQ__ProductAction__c ORDER BY Id",
    "SBQQ__ConfigurationRule__c": "SELECT Id, LastModifiedDate FROM SBQQ__ConfigurationRule__c ORDER BY Id",
    "SBQQ__SummaryVariable__c": "SELECT Id, LastModifiedDate FROM SBQQ__SummaryVariable__c ORDER BY Id",
    "SBQQ__ProductFeature__c": "SELECT Id, LastModifiedDate FROM SBQQ__ProductFeature__c ORDER BY Id",
    "SBQQ__ProductOption__c": "SELECT Id, LastModifiedDate FROM SBQQ__ProductOption__c ORDER BY Id",
    "Product2": "SELECT Id, LastModifiedDate FROM Product2 ORDER BY Id",
}

exe = shutil.which("sf") or shutil.which("sf.cmd")
snap = {}
for obj, soql in QUERIES.items():
    p = json.loads(subprocess.run([exe, "data", "query", "--query", soql, "--json"],
                                  capture_output=True, text=True, encoding="utf-8").stdout)
    if p.get("status") != 0:
        print(f"ERROR: {obj}: {json.dumps(p)[:800]}")
        sys.exit(1)
    snap[obj] = {r["Id"]: r["LastModifiedDate"] for r in p["result"]["records"]}
json.dump(snap, open(sys.argv[1], "w"), indent=1)
print("snapshot:", {k: len(v) for k, v in snap.items()})
