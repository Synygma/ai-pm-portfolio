#!/usr/bin/env python3
"""Rule Doctor - all checks from knowledge/product_rule_anatomy.md (items 1-12).

Works ONLY on rule data JSON (02_research/rule_data.json). Never contacts Salesforce.
Every result carries the data paths and values it used.

Usage:
    python scripts/rule_doctor_checks.py "<RUN_DIR>"                  # 02_research/rule_data.json -> 03_draft/checks.json
    python scripts/rule_doctor_checks.py --data <file> [--out <file>]  # tests / fixtures

Statuses: PASS, FAIL, INFO, NOT_APPLICABLE
Blocking: any FAIL in checks 1-5, 8, 10 or 12 (definition from the human answer key's _note).
Item 9 is a definition (how Conditions Met works); it is reported, never FAIL.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

BLOCKING_CHECKS = {1, 2, 3, 4, 5, 8, 10, 12}
TITLES = {
    1: "Rule is Active",
    2: "Type matches its parts",
    3: "Condition Tested Field values exist in the picklist",
    4: "Active configuration rule on a real bundle (Filter: Dynamic feature)",
    5: "Product codes used exist on exactly one active product",
    6: "Action products exist exactly once by name",
    7: "Quantity settings of options used by the rule",
    8: "Custom Conditions Met has a valid Advanced Condition",
    9: "How Conditions Met combines the conditions",
    10: "Tested Field is mapped under its Tested Object",
    11: "Min and Max Options of features used by the rule",
    12: "Filter rule's Filter Field exists on both objects, is readable and is in the picklist",
}


def ev(path, value):
    return {"path": path, "value": value}


def res(n, status, summary, evidence, details=None):
    return {"check": n, "title": TITLES[n], "status": status, "summary": summary,
            "evidence": evidence, "details": details or [],
            "blocking": n in BLOCKING_CHECKS and status == "FAIL"}


def num(x):
    try:
        return float(x)
    except (TypeError, ValueError):
        return None


def tested_field_values(d):
    return {v["value"]: v for v in d["metadata"]["error_condition_tested_field"].get("values", [])}


def field_conditions(d):
    """Conditions that test a field (not a Tested Variable), with their list index."""
    return [(i, c) for i, c in enumerate(d["conditions"]) if not c.get("SBQQ__TestedVariable__c")]


# ---------------------------------------------------------------- 1-9
def check1(d):
    a = d["rule"].get("SBQQ__Active__c")
    return res(1, "PASS" if a is True else "FAIL",
               "Rule is active." if a is True else "Rule is not active.", [ev("rule.SBQQ__Active__c", a)])


def check2(d):
    t, msg, n = d["rule"].get("SBQQ__Type__c"), d["rule"].get("SBQQ__ErrorMessage__c"), len(d["actions"])
    e = [ev("rule.SBQQ__Type__c", t), ev("rule.SBQQ__ErrorMessage__c", msg), ev("actions.count", n)]
    if t in ("Validation", "Alert"):
        p = (["Message is blank"] if not (msg and str(msg).strip()) else []) + ([f"has {n} product action(s)"] if n else [])
        return res(2, "FAIL", f"{t} rule: " + " and ".join(p) + ".", e) if p else \
            res(2, "PASS", f"{t} rule has a Message and no product actions.", e)
    if t in ("Selection", "Filter"):
        return res(2, "PASS", f"{t} rule has {n} product action(s).", e) if n else \
            res(2, "FAIL", f"{t} rule has no product actions.", e)
    return res(2, "FAIL", f"Unknown rule Type {t!r}.", e)


def check3(d):
    if not d["conditions"]:
        return res(3, "NOT_APPLICABLE", "Rule has no conditions.", [ev("conditions.count", 0)])
    vals = tested_field_values(d)
    fc = field_conditions(d)
    if not fc:
        return res(3, "NOT_APPLICABLE", "All conditions use a Tested Variable; skipped.",
                   [ev("conditions[].SBQQ__TestedVariable__c", [c.get("SBQQ__TestedVariable__c") for c in d["conditions"]])])
    e, det, bad = [ev("metadata.error_condition_tested_field.values", sorted(vals))], [], 0
    for i, c in fc:
        tf = c.get("SBQQ__TestedField__c")
        e.append(ev(f"conditions.{i}.SBQQ__TestedField__c", tf))
        ok = tf in vals
        bad += not ok
        det.append(f"Condition {c['Name']}: Tested Field {tf!r} " + ("exists in the picklist." if ok else "is NOT in the picklist."))
    return res(3, "FAIL" if bad else "PASS",
               f"{bad} of {len(fc)} condition(s) use a Tested Field value that does not exist." if bad
               else f"All {len(fc)} condition(s) with a Tested Field use an existing picklist value.", e, det)


def check4(d):
    t = d["rule"].get("SBQQ__Type__c")
    e, det, good = [ev("rule.SBQQ__Type__c", t), ev("configuration_rules.count", len(d["configuration_rules"]))], [], []
    for i, cr in enumerate(d["configuration_rules"]):
        b, prod, feat = f"configuration_rules.{i}", cr.get("SBQQ__Product__r") or {}, cr.get("SBQQ__ProductFeature__r") or {}
        e += [ev(f"{b}.Name", cr.get("Name")), ev(f"{b}.SBQQ__Active__c", cr.get("SBQQ__Active__c")),
              ev(f"{b}.SBQQ__Product__r.Name", prod.get("Name")), ev(f"{b}.SBQQ__Product__r.IsActive", prod.get("IsActive"))]
        why = []
        if cr.get("SBQQ__Active__c") is not True:
            why.append("configuration rule is not active")
        if not cr.get("SBQQ__Product__c"):
            why.append("no product")
        elif prod.get("IsActive") is not True:
            why.append("product is not active")
        if t == "Filter":
            e += [ev(f"{b}.SBQQ__ProductFeature__r.Name", feat.get("Name")),
                  ev(f"{b}.SBQQ__ProductFeature__r.SBQQ__OptionSelectionMethod__c", feat.get("SBQQ__OptionSelectionMethod__c"))]
            if not cr.get("SBQQ__ProductFeature__c"):
                why.append("Filter rule's configuration rule names no feature")
            elif feat.get("SBQQ__OptionSelectionMethod__c") != "Dynamic":
                why.append(f"feature {feat.get('Name')!r} Option Selection Method is "
                           f"{feat.get('SBQQ__OptionSelectionMethod__c')!r}, not 'Dynamic'")
        det.append(f"{cr.get('Name')}: " + ("OK" if not why else "; ".join(why)) + ".")
        if not why:
            good.append(cr.get("Name"))
    if good:
        return res(4, "PASS", f"Usable configuration rule(s): {', '.join(good)}.", e, det)
    return res(4, "FAIL", "No configuration rule points to this rule." if not d["configuration_rules"]
               else "No configuration rule meets the requirements.", e, det)


def check5(d):
    used = d.get("used_product_codes", [])
    if not used:
        return res(5, "NOT_APPLICABLE", "Rule uses no product codes.", [ev("used_product_codes", [])])
    by = {}
    for p in d.get("products_by_code", []):
        by.setdefault(p.get("ProductCode"), []).append(p)
    e, det, bad = [ev("used_product_codes", used)], [], 0
    for code in sorted({u["code"] for u in used}):
        act = [p for p in by.get(code, []) if p.get("IsActive") is True]
        e.append(ev(f"products_by_code[{code}]", [{"Id": p["Id"], "Name": p["Name"], "IsActive": p.get("IsActive")} for p in by.get(code, [])]))
        if len(act) == 1:
            det.append(f"{code}: exactly one active product ({act[0]['Name']}, {act[0]['Id']}).")
        else:
            bad += 1
            det.append(f"{code}: {len(act)} active products (expected exactly 1).")
    return res(5, "FAIL" if bad else "PASS",
               f"{bad} product code(s) do not match exactly one active product." if bad
               else "Every product code used matches exactly one active product.", e, det)


def check6(d):
    names = [(a["Name"], (a.get("SBQQ__Product__r") or {}).get("Name")) for a in d["actions"] if a.get("SBQQ__Product__c")]
    if not names:
        return res(6, "NOT_APPLICABLE", "No product action names a product.", [ev("actions.count", len(d["actions"]))])
    cnt = {}
    for p in d.get("products_by_action_name", []):
        cnt[p["Name"]] = cnt.get(p["Name"], 0) + 1
    det = [f"{a}: product {n!r} exists {cnt.get(n, 0)} time(s) by name." for a, n in names]
    dup = sum(cnt.get(n, 0) != 1 for _, n in names)
    e = [ev("actions[].SBQQ__Product__r.Name", [n for _, n in names]),
         ev("products_by_action_name", [{"Id": p["Id"], "Name": p["Name"]} for p in d.get("products_by_action_name", [])])]
    return res(6, "INFO" if dup else "PASS",
               f"{dup} action product name(s) are not unique." if dup else "Every action product name exists exactly once.", e, det)


def check7(d):
    opts = d.get("options_used", [])
    if not opts:
        return res(7, "NOT_APPLICABLE", "No bundle options are used by this rule.", [ev("options_used", [])])
    e, det, flags = [], [], []
    by_code = {o.get("SBQQ__ProductCode__c"): o for o in opts if o.get("SBQQ__ProductCode__c")}
    for i, o in enumerate(opts):
        nm = (o.get("SBQQ__OptionalSKU__r") or {}).get("Name")
        e.append(ev(f"options_used.{i}", {"product": nm, "QuantityEditable": o.get("SBQQ__QuantityEditable__c"),
                                          "MinQuantity": o.get("SBQQ__MinQuantity__c"), "MaxQuantity": o.get("SBQQ__MaxQuantity__c"),
                                          "Quantity": o.get("SBQQ__Quantity__c")}))
        det.append(f"{nm}: Quantity Editable {o.get('SBQQ__QuantityEditable__c')}, Min Quantity {o.get('SBQQ__MinQuantity__c')}, "
                   f"Max Quantity {o.get('SBQQ__MaxQuantity__c')}.")
    codes = [c for c in d["conditions"] if c.get("SBQQ__TestedField__c") == "SBQQ__ProductCode__c" and c.get("SBQQ__Operator__c") == "equals"]
    qtys = [c for c in d["conditions"] if c.get("SBQQ__TestedField__c") == "SBQQ__Quantity__c" and c.get("SBQQ__FilterType__c") == "Value"]
    for cc in codes:
        o = by_code.get(cc.get("SBQQ__FilterValue__c"))
        if not o:
            continue
        nm = (o.get("SBQQ__OptionalSKU__r") or {}).get("Name")
        for qc in qtys:
            lim, op = num(qc.get("SBQQ__FilterValue__c")), qc.get("SBQQ__Operator__c")
            mx, mn, q = num(o.get("SBQQ__MaxQuantity__c")), num(o.get("SBQQ__MinQuantity__c")), num(o.get("SBQQ__Quantity__c"))
            if o.get("SBQQ__QuantityEditable__c") is False:
                flags.append(f"{nm}: Quantity Editable is false, so the rep cannot change the quantity to reach "
                             f"'quantity {op} {qc.get('SBQQ__FilterValue__c')}' (default quantity {q}).")
            if lim is not None and mx is not None and ((op == "greater than" and mx <= lim) or (op == "greater or equals" and mx < lim)):
                flags.append(f"{nm}: Max Quantity {mx:g} means quantity can never be {op} {lim:g}.")
            if lim is not None and mn is not None and ((op == "less than" and mn >= lim) or (op == "less or equals" and mn > lim)):
                flags.append(f"{nm}: Min Quantity {mn:g} means quantity can never be {op} {lim:g}.")
    det += [f"FLAG: {f}" for f in flags]
    return res(7, "INFO", f"{len(flags)} quantity limit(s) could block the rule's scenario." if flags
               else "Quantity settings reported; no limit found that blocks the rule's scenario.", e, det)


def check8(d):
    cm, adv = d["rule"].get("SBQQ__ConditionsMet__c"), d["rule"].get("SBQQ__AdvancedCondition__c")
    e = [ev("rule.SBQQ__ConditionsMet__c", cm), ev("rule.SBQQ__AdvancedCondition__c", adv)]
    if cm != "Custom":
        return res(8, "NOT_APPLICABLE", f"Conditions Met is {cm!r}, not Custom.", e)
    if not adv or not str(adv).strip():
        return res(8, "FAIL", "Conditions Met is Custom but Advanced Condition is blank.", e)
    idx = {int(c["SBQQ__Index__c"]) for c in d["conditions"] if c.get("SBQQ__Index__c") is not None}
    used = {int(x) for x in re.findall(r"\d+", adv)}
    e += [ev("conditions[].SBQQ__Index__c", sorted(idx)), ev("advanced_condition.numbers", sorted(used))]
    miss = sorted(used - idx)
    return res(8, "FAIL", f"Advanced Condition uses index number(s) {miss} that no condition has.", e) if miss else \
        res(8, "PASS", "Advanced Condition uses only existing index numbers.", e)


def check9(d):
    cm = d["rule"].get("SBQQ__ConditionsMet__c")
    n = len(d["conditions"])
    e = [ev("rule.SBQQ__ConditionsMet__c", cm), ev("conditions.count", n)]
    if n == 0:
        return res(9, "NOT_APPLICABLE", "Rule has no conditions to combine.", e)
    text = {"All": f"all {n} condition(s) must be true",
            "Any": f"at least one of the {n} condition(s) must be true",
            "Custom": "the Advanced Condition decides"}.get(cm, f"unknown Conditions Met value {cm!r}")
    return res(9, "INFO", f"Conditions Met is {cm!r}: {text}.", e)


# ---------------------------------------------------------------- 10-12
def check10(d):
    fc = field_conditions(d)
    if not fc:
        return res(10, "NOT_APPLICABLE", "No condition tests a field (none, or all use a Tested Variable).",
                   [ev("conditions.count", len(d["conditions"]))])
    pick = d["metadata"]["error_condition_tested_field"]
    vals = tested_field_values(d)
    e = [ev("metadata.error_condition_tested_field.dependent", pick.get("dependent")),
         ev("metadata.error_condition_tested_field.controller", pick.get("controller"))]
    det, bad = [], 0
    for i, c in fc:
        tf, to = c.get("SBQQ__TestedField__c"), c.get("SBQQ__TestedObject__c")
        e += [ev(f"conditions.{i}.SBQQ__TestedObject__c", to), ev(f"conditions.{i}.SBQQ__TestedField__c", tf)]
        if tf not in vals:
            bad += 1
            det.append(f"Condition {c['Name']}: Tested Field {tf!r} is not in the picklist, so it cannot be mapped.")
            continue
        vf = vals[tf].get("valid_for")
        e.append(ev(f"metadata.error_condition_tested_field.values[{tf}].valid_for", vf))
        if not pick.get("dependent"):
            det.append(f"Condition {c['Name']}: Tested Field is not a dependent picklist; no mapping needed.")
        elif to in (vf or []):
            det.append(f"Condition {c['Name']}: {tf!r} is included under Tested Object {to!r}.")
        else:
            bad += 1
            det.append(f"Condition {c['Name']}: {tf!r} is NOT included under Tested Object {to!r} (included under {vf}).")
    return res(10, "FAIL" if bad else "PASS",
               f"{bad} condition(s) use a Tested Field that is not mapped under their Tested Object." if bad
               else f"All {len(fc)} condition(s) use a Tested Field mapped under their Tested Object.", e, det)


def check11(d):
    feats = d.get("features_used", [])
    if not feats:
        return res(11, "NOT_APPLICABLE", "No features found for options used by the rule.", [ev("features_used", [])])
    e, det, flags = [], [], []
    for i, f in enumerate(feats):
        mn, mx, cnt = num(f.get("SBQQ__MinOptionCount__c")), num(f.get("SBQQ__MaxOptionCount__c")), f.get("option_count")
        e.append(ev(f"features_used.{i}", {"Name": f.get("Name"), "MinOptions": f.get("SBQQ__MinOptionCount__c"),
                                           "MaxOptions": f.get("SBQQ__MaxOptionCount__c"), "option_count": cnt}))
        det.append(f"{f.get('Name')}: Min Options {f.get('SBQQ__MinOptionCount__c')}, Max Options "
                   f"{f.get('SBQQ__MaxOptionCount__c')}, {cnt} option(s) in the feature.")
        if mx is not None and mx == 0:
            flags.append(f"{f.get('Name')}: Max Options is 0, so no option in this feature can be selected.")
        if mn is not None and cnt is not None and mn > cnt:
            flags.append(f"{f.get('Name')}: Min Options {mn:g} is more than the {cnt} option(s) in the feature, so the configuration can never be saved.")
        elif mn is not None and mn > 0:
            flags.append(f"{f.get('Name')}: the rep must select at least {mn:g} option(s) in this feature before saving; "
                         f"a 'too few options' message here comes from the feature, not from the rule.")
        if mn is not None and mx is not None and mn > mx:
            flags.append(f"{f.get('Name')}: Min Options {mn:g} is more than Max Options {mx:g}.")
    det += [f"FLAG: {x}" for x in flags]
    return res(11, "INFO", f"{len(flags)} feature setting(s) could block the rule's scenario." if flags
               else "Feature settings reported; nothing found that blocks the rule's scenario.", e, det)


def check12(d):
    t = d["rule"].get("SBQQ__Type__c")
    if t != "Filter":
        return res(12, "NOT_APPLICABLE", f"Rule Type is {t!r}, not Filter.", [ev("rule.SBQQ__Type__c", t)])
    pv = {v["value"] for v in d["metadata"]["product_action_filter_field"].get("values", [])}
    custom = {x["action"]: x for x in d["metadata"].get("custom_filter_fields", [])}
    e = [ev("rule.SBQQ__Type__c", t), ev("metadata.product_action_filter_field.values", sorted(pv))]
    det, bad, seen = [], 0, 0
    for i, a in enumerate(d["actions"]):
        ff = a.get("SBQQ__FilterField__c")
        if not ff:
            continue
        seen += 1
        e.append(ev(f"actions.{i}.SBQQ__FilterField__c", ff))
        probs = []
        if ff not in pv:
            probs.append(f"{ff!r} is not a value in the SBQQ__FilterField__c picklist")
        if ff.endswith("__c"):
            cf = custom.get(a["Name"])
            if not cf:
                probs.append("no field metadata was read for this custom field")
            else:
                p2, po = cf["on_product2"], cf["on_product_option"]
                e += [ev(f"metadata.custom_filter_fields[{a['Name']}].on_product2.visible_to_running_user", p2.get("visible_to_running_user")),
                      ev(f"metadata.custom_filter_fields[{a['Name']}].on_product_option.visible_to_running_user", po.get("visible_to_running_user"))]
                if not p2.get("visible_to_running_user"):
                    probs.append(f"Product2.{ff} does not exist or the user cannot read it")
                if not po.get("visible_to_running_user"):
                    probs.append(f"SBQQ__ProductOption__c.{ff} does not exist or the user cannot read it")
        if probs:
            bad += 1
        det.append(f"{a['Name']}: Filter Field {ff!r}: " + ("; ".join(probs) if probs else "OK") + ".")
    if not seen:
        return res(12, "FAIL", "Filter rule has no action with a Filter Field.", e, det)
    return res(12, "FAIL" if bad else "PASS",
               f"{bad} filter action(s) have a Filter Field problem." if bad
               else f"All {seen} filter action(s) use a Filter Field that exists on both objects, is readable and is in the picklist.", e, det)


CHECKS = [check1, check2, check3, check4, check5, check6, check7, check8, check9, check10, check11, check12]


def run_checks(data):
    results = [c(data) for c in CHECKS]
    blocking = [r["check"] for r in results if r["blocking"]]
    return {"rule": {"Id": data["rule"]["Id"], "Name": data["rule"]["Name"]},
            "source_read_at_utc": data.get("read_at_utc"),
            "overall": "BLOCKING_PROBLEM" if blocking else "NO_BLOCKING_PROBLEM",
            "blocking_checks": blocking,
            "blocking_definition": "any FAIL in checks 1 to 5, 8, 10 or 12",
            "results": results}


def main():
    ap = argparse.ArgumentParser(description="Rule Doctor checks (no Salesforce access).")
    ap.add_argument("run_dir", nargs="?")
    ap.add_argument("--data")
    ap.add_argument("--out")
    a = ap.parse_args()
    if a.run_dir:
        src, out = Path(a.run_dir) / "02_research" / "rule_data.json", Path(a.run_dir) / "03_draft" / "checks.json"
    elif a.data:
        src, out = Path(a.data), (Path(a.out) if a.out else None)
    else:
        print("ERROR: give a RUN_DIR or --data <file>")
        return 1
    if not src.exists():
        print(f"ERROR: data file not found: {src}")
        return 1
    result = run_checks(json.loads(src.read_text(encoding="utf-8")))
    if out:
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(result, indent=2), encoding="utf-8")
        print(f"WROTE {out}")
    for r in result["results"]:
        print(f"  {r['check']:>2}. {r['status']:<14} {r['title']}: {r['summary']}")
    print(f"OVERALL: {result['overall']}" + (f" (checks {result['blocking_checks']})" if result["blocking_checks"] else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
