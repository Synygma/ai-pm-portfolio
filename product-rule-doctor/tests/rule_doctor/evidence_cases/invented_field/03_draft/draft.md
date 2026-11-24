# Rule Doctor draft: Maintenance Kit Quantity Limit (Demo)

## What the rule does
- Maintenance Kit Quantity Limit (Demo) is an active Alert rule with Scope Product, Evaluation Event Always and Evaluation Order 20. [rule.SBQQ__Active__c = true, rule.SBQQ__Type__c = Alert, rule.SBQQ__Scope__c = Product, rule.SBQQ__EvaluationEvent__c = Always, rule.SBQQ__EvaluationOrder__c = 20]
- Condition 000001 tests the Product Option field SBQQ__ProductCode__c equals DEMO-MAINT-KIT. [conditions.0]
- Condition 000002 tests the Product Option field SBQQ__Quantity__c greater than 8. [conditions.1]
- Both conditions must be true, because Conditions Met is All (checklist #9). [rule.SBQQ__ConditionsMet__c = All, check 9 = INFO]
- The rule has Severity set to Warning. [rule.SBQQ__Severity__c = Warning]
- The message is "Maintenance Kit quantity should not be more than 8 for one pack. Please reduce it." [rule.SBQQ__ErrorMessage__c]
- The rule runs on Process Instrumentation Pack (Demo) through the active configuration rule CR-000001. [configuration_rules.0, check 4 = PASS]

## What is fine
- Checks 1, 2, 3, 4, 5 and 10 pass. [checks.json results 1-5 and 10 = PASS]
- An Alert rule needs a Message and no Product Actions, and this rule has a Message and 0 product actions (checklist #2). [rule.SBQQ__ErrorMessage__c, actions.count = 0, check 2 = PASS]
- DEMO-MAINT-KIT exists on exactly one active product, Maintenance Kit (Demo). [products_by_code, check 5 = PASS]
- Both Tested Fields are included under Tested Object Product Option (checklist #10). [check 10 = PASS]

## What is broken
- Nothing blocking. [checks.json overall = NO_BLOCKING_PROBLEM]
- INFO: the Maintenance Kit (Demo) option has Quantity Editable true, Min Quantity 5 and Max Quantity 10; check 7 found no limit that blocks the rule's scenario. [options_used.0, check 7 = INFO]
- INFO: in feature Spares & Consumables (Min Options 2, Max Options 3, 3 options) the rep must select at least 2 options before saving; a "too few options" message there comes from the feature, not from the rule (checklist #11). [features_used.0, check 11 = INFO]

## Most likely cause
- No blocking problem found. [checks.json overall = NO_BLOCKING_PROBLEM]

## Suggested fix
- No fix is needed. [checks.json overall = NO_BLOCKING_PROBLEM]
