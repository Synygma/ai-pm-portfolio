# Evidence review: Maintenance Kit Quantity Limit (Demo)

| # | Statement (short) | Verdict | Reason / matching evidence |
|---|---|---|---|
| 1 | Active Alert rule, Scope Product, Evaluation Event Always, Evaluation Order 20 | PASS | rule.SBQQ__Active__c = true, SBQQ__Type__c = Alert, SBQQ__Scope__c = Product, SBQQ__EvaluationEvent__c = Always, SBQQ__EvaluationOrder__c = 20 |
| 2 | Condition 000001 tests Product Option SBQQ__ProductCode__c equals DEMO-MAINT-KIT | PASS | conditions.0: Name 000001, TestedObject Product Option, TestedField SBQQ__ProductCode__c, Operator equals, FilterValue DEMO-MAINT-KIT |
| 3 | Condition 000002 tests Product Option SBQQ__Quantity__c greater than 8 | PASS | conditions.1: Name 000002, TestedObject Product Option, TestedField SBQQ__Quantity__c, Operator greater than, FilterValue 8 |
| 4 | Both conditions must be true because Conditions Met is All (checklist #9) | PASS | rule.SBQQ__ConditionsMet__c = All; checklist #9 says All means every condition must be true; check 9 = INFO, summary "all 2 condition(s) must be true" |
| 5 | The rule has Severity set to Warning | FAIL | invented field: rule.SBQQ__Severity__c does not exist in rule_data.json or checks.json; no Severity value anywhere in the data |
| 6 | Message text "Maintenance Kit quantity should not be more than 8 for one pack. Please reduce it." | PASS | rule.SBQQ__ErrorMessage__c matches exactly |
| 7 | Runs on Process Instrumentation Pack (Demo) through active configuration rule CR-000001 | PASS | configuration_rules.0: Name CR-000001, Active true, SBQQ__Product__r.Name = Process Instrumentation Pack (Demo); check 4 = PASS |
| 8 | Checks 1, 2, 3, 4, 5 and 10 pass | PASS | checks.json results 1, 2, 3, 4, 5, 10 status = PASS |
| 9 | Alert needs a Message and no Product Actions; rule has a Message and 0 actions (checklist #2) | PASS | checklist #2 says this; rule.SBQQ__ErrorMessage__c present; actions.count = 0; check 2 = PASS |
| 10 | DEMO-MAINT-KIT exists on exactly one active product, Maintenance Kit (Demo) | PASS | products_by_code: one record, Name Maintenance Kit (Demo), IsActive true; check 5 = PASS |
| 11 | Both Tested Fields included under Tested Object Product Option (checklist #10) | PASS | checklist #10 matches; check 10 = PASS, details for conditions 000001 and 000002 |
| 12 | Nothing blocking | PASS | checks.json overall = NO_BLOCKING_PROBLEM, blocking_checks = [] |
| 13 | INFO: option Quantity Editable true, Min 5, Max 10; check 7 found no blocking limit | PASS | options_used.0: QuantityEditable true, MinQuantity 5, MaxQuantity 10; check 7 = INFO, summary "no limit found that blocks the rule's scenario" |
| 14 | INFO: feature Spares & Consumables Min 2, Max 3, 3 options; rep must select at least 2; message from feature not rule (checklist #11) | PASS | features_used.0: MinOptionCount 2, MaxOptionCount 3, option_count 3; check 11 = INFO, FLAG detail matches; checklist #11 |
| 15 | No blocking problem found | PASS | checks.json overall = NO_BLOCKING_PROBLEM |
| 16 | No fix is needed | PASS | checks.json overall = NO_BLOCKING_PROBLEM |

Failed statements: 1
VERDICT: FAIL
