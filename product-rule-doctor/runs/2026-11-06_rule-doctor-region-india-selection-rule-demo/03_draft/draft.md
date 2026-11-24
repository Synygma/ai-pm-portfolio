# Rule Doctor draft: Region India Selection Rule (Demo)

## What the rule does
- Region India Selection Rule (Demo) is an active Selection rule with Scope Product and Evaluation Event Always. [rule.SBQQ__Active__c = true, rule.SBQQ__Type__c = Selection, rule.SBQQ__Scope__c = Product, rule.SBQQ__EvaluationEvent__c = Always]
- Evaluation Order is blank. [rule.SBQQ__EvaluationOrder__c = null]
- The rule has no Message. [rule.SBQQ__ErrorMessage__c = null]
- Condition 000000 (index 1) tests the Configuration Attributes field Demo_Region__c equals the value India. [conditions.0]
- Conditions Met is All, so the one condition must be true (checklist #9). [rule.SBQQ__ConditionsMet__c = All, check 9 = INFO]
- Action PA-0000000 is Show & Add for Sunshade Cover (Demo). [actions.0.SBQQ__Type__c = Show & Add, actions.0.SBQQ__Product__r.Name = Sunshade Cover (Demo)]
- Action PA-0000001 is Hide & Remove for Wireless Gateway (Demo). [actions.1.SBQQ__Type__c = Hide & Remove, actions.1.SBQQ__Product__r.Name = Wireless Gateway (Demo)]
- The rule runs on Process Instrumentation Pack (Demo) through the active configuration rule CR-000000, which names no feature. [configuration_rules.0.SBQQ__Active__c = true, configuration_rules.0.SBQQ__Product__r.Name = Process Instrumentation Pack (Demo), configuration_rules.0.SBQQ__ProductFeature__c = null]

## What is fine
- Checks 1, 2, 3, 4, 6 and 10 pass. [checks.json results 1, 2, 3, 4, 6, 10 = PASS]
- A Selection rule needs at least one Product Action, and this rule has 2 (checklist #2). [actions.count = 2, check 2 = PASS]
- The Tested Field Demo_Region__c exists in the picklist and is included under Tested Object Configuration Attributes (checklist #3, checklist #10). [check 3 = PASS, check 10 = PASS]
- Sunshade Cover (Demo) and Wireless Gateway (Demo) each exist exactly once by name. [products_by_action_name, check 6 = PASS]

## What is broken
- Nothing blocking. [checks.json overall = NO_BLOCKING_PROBLEM]
- INFO: the Sunshade Cover (Demo) and Wireless Gateway (Demo) options have Quantity Editable false and blank Min Quantity and Max Quantity; check 7 found no limit that blocks the rule's scenario. [options_used.0, options_used.1, check 7 = INFO]
- INFO: in feature Accessories (Min Options 1, Max Options 2, 4 options) the rep must select at least 1 option before saving; a "too few options" message there comes from the feature, not from the rule (checklist #11). [features_used, check 11 = INFO]
- INFO: feature Communication & Services has Min Options 0, Max Options 3 and 3 options. [features_used, check 11 = INFO]

## Most likely cause
- No blocking problem found. [checks.json overall = NO_BLOCKING_PROBLEM]

## Suggested fix
- No fix is needed. [checks.json overall = NO_BLOCKING_PROBLEM]
