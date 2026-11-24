# Evidence review: Region India Selection Rule (Demo)

| # | Statement (short) | Verdict | Reason / matching evidence |
|---|---|---|---|
| 1 | Active Selection rule, Scope Product, Evaluation Event Always | PASS | rule.Name = Region India Selection Rule (Demo); rule.SBQQ__Active__c = true; rule.SBQQ__Type__c = Selection; rule.SBQQ__Scope__c = Product; rule.SBQQ__EvaluationEvent__c = Always |
| 2 | Evaluation Order is blank | PASS | rule.SBQQ__EvaluationOrder__c = null |
| 3 | The rule has no Message | PASS | rule.SBQQ__ErrorMessage__c = null |
| 4 | Condition 000000 (index 1) tests Configuration Attributes field Demo_Region__c equals value India | PASS | conditions.0.Name = 000000; SBQQ__Index__c = 1; SBQQ__TestedObject__c = Configuration Attributes; SBQQ__TestedField__c = Demo_Region__c; SBQQ__Operator__c = equals; SBQQ__FilterType__c = Value; SBQQ__FilterValue__c = India |
| 5 | Conditions Met is All, so the one condition must be true (checklist #9) | PASS | rule.SBQQ__ConditionsMet__c = All; conditions.count = 1; checklist #9 says All means every condition must be true; check 9 status = INFO |
| 6 | Action PA-0000000 is Show & Add for Sunshade Cover (Demo) | PASS | actions.0.Name = PA-0000000; actions.0.SBQQ__Type__c = Show & Add; actions.0.SBQQ__Product__r.Name = Sunshade Cover (Demo) |
| 7 | Action PA-0000001 is Hide & Remove for Wireless Gateway (Demo) | PASS | actions.1.Name = PA-0000001; actions.1.SBQQ__Type__c = Hide & Remove; actions.1.SBQQ__Product__r.Name = Wireless Gateway (Demo) |
| 8 | Rule runs on Process Instrumentation Pack (Demo) through active config rule CR-000000, which names no feature | PASS | configuration_rules.0.Name = CR-000000; SBQQ__Active__c = true; SBQQ__Product__r.Name = Process Instrumentation Pack (Demo); SBQQ__ProductFeature__c = null; check 4 summary "Usable configuration rule(s): CR-000000." |
| 9 | Checks 1, 2, 3, 4, 6 and 10 pass | PASS | checks.json results 1, 2, 3, 4, 6, 10 status = PASS (all PASS results; 5, 8, 12 NOT_APPLICABLE; 7, 9, 11 INFO) |
| 10 | Selection rule needs at least one Product Action; this rule has 2 (checklist #2) | PASS | checklist #2 says Selection needs at least one Product Action; actions.count = 2; check 2 = PASS |
| 11 | Demo_Region__c exists in picklist and is included under Configuration Attributes (checklist #3, #10) | PASS | check 3 = PASS ("exists in the picklist"); check 10 = PASS ("included under Tested Object 'Configuration Attributes'"); metadata values[Demo_Region__c].valid_for = [Configuration Attributes] |
| 12 | Sunshade Cover (Demo) and Wireless Gateway (Demo) each exist exactly once by name | PASS | products_by_action_name has one record each; check 6 = PASS, details "exists 1 time(s) by name" |
| 13 | Nothing blocking | PASS | checks.json overall = NO_BLOCKING_PROBLEM; blocking_checks = [] |
| 14 | INFO: both options Quantity Editable false, blank Min/Max Quantity; check 7 found no blocking limit | PASS | options_used.0/1 SBQQ__QuantityEditable__c = false, SBQQ__MinQuantity__c = null, SBQQ__MaxQuantity__c = null; check 7 = INFO, summary "no limit found that blocks the rule's scenario" |
| 15 | INFO: Accessories (Min 1, Max 2, 4 options) rep must select at least 1; "too few options" message comes from feature (checklist #11) | PASS | features_used.0: SBQQ__MinOptionCount__c = 1, SBQQ__MaxOptionCount__c = 2, option_count = 4; check 11 = INFO, FLAG detail matches; checklist #11 |
| 16 | INFO: Communication & Services Min 0, Max 3, 3 options | PASS | features_used.1: SBQQ__MinOptionCount__c = 0, SBQQ__MaxOptionCount__c = 3, option_count = 3; check 11 = INFO |
| 17 | No blocking problem found | PASS | checks.json overall = NO_BLOCKING_PROBLEM |
| 18 | No fix is needed | PASS | checks.json overall = NO_BLOCKING_PROBLEM |

Failed statements: 0
VERDICT: PASS
