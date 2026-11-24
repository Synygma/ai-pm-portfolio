#!/usr/bin/env python3
"""Rule Doctor - read a product rule and everything connected to it (called by the rule-reader agent).

READ ONLY: uses only `sf data query --json` and `sf sobject describe --json` against the default org.
Collects data; never judges it (all checks are in scripts/rule_doctor_checks.py).
All field and relationship names were confirmed with `sf sobject describe` before writing this script.
Features and their option counts use the two-query approach (no child-relationship subqueries).

Usage:
    python scripts/rule_doctor_read.py "<RUN_DIR>"

Input:  <RUN_DIR>/01_input/request.json      (rule_name)
        <RUN_DIR>/01_input/config_snapshot.md ('- Bundle: <name>')
Output: <RUN_DIR>/02_research/rule_data.json, <RUN_DIR>/02_research/query_log.json
Exit:   0 ok | 2 rule not found | 3 several rules with that name | 1 error
"""
from __future__ import annotations

import base64
import json
import re
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

LOG: list[dict] = []
_DESCRIBE: dict[str, dict] = {}


def fail(msg, code=1):
    print(f"ERROR: {msg}")
    sys.exit(code)


def sf(args, label):
    exe = shutil.which("sf") or shutil.which("sf.cmd")
    if not exe:
        fail("Salesforce CLI 'sf' not found on PATH.")
    p = subprocess.run([exe, *args, "--json"], capture_output=True, text=True, encoding="utf-8")
    try:
        payload = json.loads(p.stdout)
    except json.JSONDecodeError:
        fail(f"could not parse sf output for {label}.\nSTDOUT:\n{p.stdout}\nSTDERR:\n{p.stderr}")
    if payload.get("status") != 0:
        fail(f"{label} failed.\n{json.dumps(payload, indent=2)[:2000]}")
    return payload["result"]


def strip(o):
    if isinstance(o, dict):
        return {k: strip(v) for k, v in o.items() if k != "attributes"}
    if isinstance(o, list):
        return [strip(v) for v in o]
    return o


def q(soql, purpose):
    r = sf(["data", "query", "--query", soql], f"query ({purpose})")
    rows = strip(r["records"])
    LOG.append({"type": "soql", "purpose": purpose, "query": soql, "records": len(rows), "totalSize": r.get("totalSize")})
    return rows, r.get("totalSize")


def describe(obj):
    if obj not in _DESCRIBE:
        _DESCRIBE[obj] = sf(["sobject", "describe", "--sobject", obj], f"describe {obj}")
        LOG.append({"type": "describe", "purpose": f"field metadata for {obj}", "sobject": obj})
    return _DESCRIBE[obj]


def field_info(obj, field):
    f = next((x for x in describe(obj)["fields"] if x["name"] == field), None)
    if f is None:
        return {"object": obj, "field": field, "visible_to_running_user": False}
    return {"object": obj, "field": field, "visible_to_running_user": True, "label": f["label"],
            "type": f["type"], "calculated": f.get("calculated"), "formula": f.get("calculatedFormula")}


def picklist(obj, field):
    fields = describe(obj)["fields"]
    f = next((x for x in fields if x["name"] == field), None)
    if f is None:
        return {"object": obj, "field": field, "found": False, "values": []}
    out = {"object": obj, "field": field, "found": True, "dependent": bool(f.get("dependentPicklist")),
           "controller": f.get("controllerName"), "values": []}
    ctrl = []
    if out["controller"]:
        c = next(x for x in fields if x["name"] == out["controller"])
        ctrl = [p["value"] for p in c["picklistValues"] if p["active"]]
    for p in f["picklistValues"]:
        if not p["active"]:
            continue
        v = {"value": p["value"]}
        if out["dependent"]:
            bits = base64.b64decode(p["validFor"]) if p.get("validFor") else b""
            v["valid_for"] = [cv for i, cv in enumerate(ctrl) if i // 8 < len(bits) and (bits[i // 8] >> (7 - i % 8)) & 1]
        out["values"].append(v)
    return out


def esc(s):
    return s.replace("\\", "\\\\").replace("'", "\\'")


def in_list(vals):
    return ",".join(f"'{esc(v)}'" for v in sorted(set(vals)))


def main():
    if len(sys.argv) != 2:
        fail('usage: python scripts/rule_doctor_read.py "<RUN_DIR>"')
    run = Path(sys.argv[1])
    req_f, cfg_f = run / "01_input" / "request.json", run / "01_input" / "config_snapshot.md"
    if not req_f.exists() or not cfg_f.exists():
        fail(f"missing {req_f} or {cfg_f}; start the run with scripts/rule_doctor_start.py first.")
    req = json.loads(req_f.read_text(encoding="utf-8"))
    name = (req.get("rule_name") or "").strip()
    if not name:
        fail(f"no rule_name in {req_f}")
    m = re.search(r"^\s*-\s*Bundle:\s*(.+?)\s*$", cfg_f.read_text(encoding="utf-8"), re.M)
    if not m:
        fail(f"no '- Bundle:' line in {cfg_f}")
    bundle_name = m.group(1)

    # 1. Rule (by name; must be exactly one)
    rules, _ = q("SELECT Id, Name, SBQQ__Active__c, SBQQ__Type__c, SBQQ__Scope__c, SBQQ__EvaluationEvent__c, "
                 "SBQQ__EvaluationOrder__c, SBQQ__ConditionsMet__c, SBQQ__AdvancedCondition__c, SBQQ__ErrorMessage__c, "
                 f"LastModifiedDate FROM SBQQ__ProductRule__c WHERE Name = '{esc(name)}'", "the product rule")
    if not rules:
        print(f"NOT_FOUND: no SBQQ__ProductRule__c named '{name}'. Nothing written.")
        return 2
    if len(rules) > 1:
        print(f"DUPLICATE: {len(rules)} rules named '{name}': {[r['Id'] for r in rules]}. Nothing written.")
        return 3
    rule = rules[0]
    rid = rule["Id"]

    # 2. Conditions
    conditions, _ = q("SELECT Id, Name, SBQQ__Index__c, SBQQ__TestedObject__c, SBQQ__TestedField__c, SBQQ__TestedVariable__c, "
                      "SBQQ__TestedVariable__r.Name, SBQQ__TestedAttribute__c, SBQQ__Operator__c, SBQQ__FilterType__c, "
                      "SBQQ__FilterValue__c, SBQQ__FilterVariable__c, SBQQ__FilterVariable__r.Name, LastModifiedDate "
                      f"FROM SBQQ__ErrorCondition__c WHERE SBQQ__Rule__c = '{rid}' ORDER BY SBQQ__Index__c", "error conditions")
    # 3. Actions
    actions, _ = q("SELECT Id, Name, SBQQ__Type__c, SBQQ__Product__c, SBQQ__Product__r.Name, SBQQ__Product__r.ProductCode, "
                   "SBQQ__Product__r.IsActive, SBQQ__Required__c, SBQQ__FilterField__c, SBQQ__Operator__c, SBQQ__FilterValue__c, "
                   "SBQQ__ValueObject__c, SBQQ__ValueField__c, SBQQ__ParentRuleIsActive__c, LastModifiedDate "
                   f"FROM SBQQ__ProductAction__c WHERE SBQQ__Rule__c = '{rid}' ORDER BY Name", "product actions")
    # 4. Configuration rules (+ product, feature)
    config_rules, _ = q("SELECT Id, Name, SBQQ__Active__c, SBQQ__Product__c, SBQQ__Product__r.Name, SBQQ__Product__r.IsActive, "
                        "SBQQ__ProductFeature__c, SBQQ__ProductFeature__r.Name, SBQQ__ProductFeature__r.SBQQ__OptionSelectionMethod__c, "
                        "SBQQ__ProductFeature__r.SBQQ__ConfiguredSKU__c, SBQQ__RuleType__c, SBQQ__RuleEvaluationEvent__c, "
                        f"LastModifiedDate FROM SBQQ__ConfigurationRule__c WHERE SBQQ__ProductRule__c = '{rid}' ORDER BY Name",
                        "configuration rules")
    # 5. Summary variables referenced by conditions
    var_ids = {c[k] for c in conditions for k in ("SBQQ__TestedVariable__c", "SBQQ__FilterVariable__c") if c.get(k)}
    variables = q("SELECT Id, Name, SBQQ__AggregateFunction__c, SBQQ__AggregateField__c, SBQQ__TargetObject__c, "
                  "SBQQ__FilterField__c, SBQQ__Operator__c, SBQQ__FilterValue__c, SBQQ__Scope__c, SBQQ__CombineWith__c, "
                  f"SBQQ__CompositeOperator__c, LastModifiedDate FROM SBQQ__SummaryVariable__c WHERE Id IN ({in_list(var_ids)})",
                  "summary variables used by conditions")[0] if var_ids else []
    # 6. Bundle from config
    bundles, _ = q(f"SELECT Id, Name, IsActive, LastModifiedDate FROM Product2 WHERE Name = '{esc(bundle_name)}'", "bundle from config")

    # 7. Product codes used (collected, not judged)
    used = []
    for c in conditions:
        if c.get("SBQQ__TestedField__c") in ("SBQQ__ProductCode__c", "Product Code") and c.get("SBQQ__FilterValue__c"):
            used.append({"source": f"condition {c['Name']}", "code": c["SBQQ__FilterValue__c"]})
    for a in actions:
        if a.get("SBQQ__FilterField__c") == "Product Code" and a.get("SBQQ__FilterValue__c"):
            used.append({"source": f"action {a['Name']}", "code": a["SBQQ__FilterValue__c"]})
        if (a.get("SBQQ__Product__r") or {}).get("ProductCode"):
            used.append({"source": f"action {a['Name']} product", "code": a["SBQQ__Product__r"]["ProductCode"]})
    for v in variables:
        if v.get("SBQQ__FilterField__c") == "Product Code" and v.get("SBQQ__FilterValue__c"):
            used.append({"source": f"summary variable {v['Name']}", "code": v["SBQQ__FilterValue__c"]})
    codes = {u["code"] for u in used}
    by_code = q(f"SELECT Id, Name, ProductCode, IsActive, Family FROM Product2 WHERE ProductCode IN ({in_list(codes)}) "
                "ORDER BY ProductCode, Name", "products with codes used by the rule")[0] if codes else []
    # 8. Products with the same names as action products
    names = {(a.get("SBQQ__Product__r") or {}).get("Name") for a in actions} - {None}
    by_name = q(f"SELECT Id, Name, ProductCode, IsActive, Family FROM Product2 WHERE Name IN ({in_list(names)}) "
                "ORDER BY Name, CreatedDate", "products with action product names")[0] if names else []
    # 9. Options used by the rule in the configured bundle
    pids = {a["SBQQ__Product__c"] for a in actions if a.get("SBQQ__Product__c")} | {p["Id"] for p in by_code}
    options = []
    if pids and len(bundles) == 1:
        options = q("SELECT Id, SBQQ__OptionalSKU__c, SBQQ__OptionalSKU__r.Name, SBQQ__ProductCode__c, SBQQ__Feature__c, "
                    "SBQQ__Feature__r.Name, SBQQ__Type__c, SBQQ__Number__c, SBQQ__Quantity__c, SBQQ__QuantityEditable__c, "
                    "SBQQ__MinQuantity__c, SBQQ__MaxQuantity__c, SBQQ__Selected__c, SBQQ__Required__c, LastModifiedDate "
                    f"FROM SBQQ__ProductOption__c WHERE SBQQ__ConfiguredSKU__c = '{bundles[0]['Id']}' "
                    f"AND SBQQ__OptionalSKU__c IN ({in_list(pids)}) ORDER BY SBQQ__Number__c", "bundle options used by the rule")[0]
    # 10. Features of those options - two-query approach (no child relationships)
    fids = {o["SBQQ__Feature__c"] for o in options if o.get("SBQQ__Feature__c")}
    features = []
    if fids:
        features = q("SELECT Id, Name, SBQQ__Number__c, SBQQ__MinOptionCount__c, SBQQ__MaxOptionCount__c, "
                     f"SBQQ__OptionSelectionMethod__c, LastModifiedDate FROM SBQQ__ProductFeature__c WHERE Id IN ({in_list(fids)}) "
                     "ORDER BY SBQQ__Number__c", "features of options used (query 1 of 2)")[0]
        for f in features:
            _, n = q(f"SELECT COUNT() FROM SBQQ__ProductOption__c WHERE SBQQ__Feature__c = '{f['Id']}'",
                     f"option count for feature {f['Name']} (query 2 of 2)")
            f["option_count"] = n
    # 11. Field metadata
    meta = {"error_condition_tested_field": picklist("SBQQ__ErrorCondition__c", "SBQQ__TestedField__c"),
            "product_action_filter_field": picklist("SBQQ__ProductAction__c", "SBQQ__FilterField__c"),
            "custom_filter_fields": []}
    for a in actions:
        ff = a.get("SBQQ__FilterField__c")
        if ff and ff.endswith("__c"):
            meta["custom_filter_fields"].append({"action": a["Name"], "field": ff,
                                                 "on_product2": field_info("Product2", ff),
                                                 "on_product_option": field_info("SBQQ__ProductOption__c", ff)})

    data = {"read_at_utc": datetime.now(timezone.utc).isoformat(timespec="seconds"), "request": req,
            "config": {"bundle_name": bundle_name}, "rule": rule, "conditions": conditions, "actions": actions,
            "configuration_rules": config_rules, "summary_variables": variables, "bundle": bundles,
            "used_product_codes": used, "products_by_code": by_code, "products_by_action_name": by_name,
            "options_used": options, "features_used": features, "metadata": meta}
    out = run / "02_research"
    out.mkdir(parents=True, exist_ok=True)
    (out / "rule_data.json").write_text(json.dumps(data, indent=2), encoding="utf-8")
    (out / "query_log.json").write_text(json.dumps(LOG, indent=2), encoding="utf-8")
    print(f"READ_OK: {rule['Name']} ({rid})")
    print(f"conditions={len(conditions)} actions={len(actions)} configuration_rules={len(config_rules)} "
          f"summary_variables={len(variables)} products_by_code={len(by_code)} products_by_action_name={len(by_name)} "
          f"options_used={len(options)} features_used={len(features)} log_entries={len(LOG)}")
    print(f"WROTE {out / 'rule_data.json'}")
    print(f"WROTE {out / 'query_log.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
