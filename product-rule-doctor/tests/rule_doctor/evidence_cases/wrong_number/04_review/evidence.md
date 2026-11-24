# Evidence review: Maintenance Kit Quantity Limit (Demo)

| # | Statement (short) | Verdict | Reason / matching evidence |
|---|---|---|---|
| 1 | Active Alert rule, Scope Product, Evaluation Event Always, Evaluation Order 25 | FAIL | draft says 25; rule.SBQQ__EvaluationOrder__c = 20 (Active true, Type Alert, Scope Product, Event Always match) |
| 2 | Condition 000001 tests Product Option SBQQ__ProductCode__c equals DEMO-MAINT-KIT | PASS | conditions.0: Name 000001, TestedObject Product Option, TestedField SBQQ__ProductCode__c, Operator equals, FilterValue DEMO-MAINT-KIT |
| 3 | Condition 000002 tests Product Option SBQQ__Quantity__c greater than 8 | PASS | conditions.1: Name 000002, TestedObject Product Option, TestedField SBQQ__Quantity__c, Operator greater than, FilterValue 8 |
| 4 | Both conditions must be true because Conditions Met is All (checklist #9) | PASS | rule.SBQQ__ConditionsMet__c = All; checklist #9; check 9 = INFO "all 2 condition(s) must be true" |
| 5 | Message text quoted | PASS | rule.SBQQ__ErrorMessage__c matches exactly |
| 6 | Runs on Process Instrumentation Pack (Demo) through active CR-000001 | PASS | configuration_rules.0: Name CR-000001, Active true, Product__r.Name Process Instrumentation Pack (Demo); check 4 = PASS |
| 7 | Checks 1, 2, 3, 4, 5 and 10 pass | PASS | checks.json results 1-5 and 10 status = PASS |
| 8 | Alert needs Message and no Product Actions; has Message and 0 actions (checklist #2) | PASS | checklist #2; rule.SBQQ__ErrorMessage__c present; actions.count = 0; check 2 = PASS |
| 9 | DEMO-MAINT-KIT exists on exactly one active product, Maintenance Kit (Demo) | PASS | products_by_code: 1 record, Maintenance Kit (Demo), IsActive true; check 5 = PASS |
| 10 | Both Tested Fields included under Tested Object Product Option (checklist #10) | PASS | checklist #10; check 10 = PASS, details for 000001 and 000002 |
| 11 | Nothing blocking | PASS | checks.json overall = NO_BLOCKING_PROBLEM; blocking_checks = [] |
| 12 | INFO: option Quantity Editable true, Min 5, Max 10; check 7 found no blocking limit | PASS | options_used.0: QuantityEditable true, MinQuantity 5, MaxQuantity 10; check 7 = INFO, summary matches |
| 13 | INFO: feature Spares & Consumables Min 2, Max 3, 3 options; too-few message from feature (checklist #11) | PASS | features_used.0: MinOptionCount 2, MaxOptionCount 3, option_count 3; check 11 = INFO, FLAG detail matches; checklist #11 |
| 14 | No blocking problem found | PASS | checks.json overall = NO_BLOCKING_PROBLEM |
| 15 | No fix is needed | PASS | checks.json overall = NO_BLOCKING_PROBLEM |

Failed statements: 1
VERDICT: FAIL
