# Product Rule checklist (from my CPQ hands-on)
1. Rule is Active.
2. Type matches its parts: Validation and Alert need a Message and no Product Actions; Selection and Filter need at least one Product Action.
3. Each condition's Tested Field value exists in the SBQQ__TestedField__c picklist (skip conditions that use a Tested Variable).
4. At least one active Configuration Rule points to a real bundle. Filter rules must name a feature whose Option Selection Method is Dynamic.
5. Every product code used in a condition, action or summary variable filter exists on exactly one active product.
6. Every product named in an action exists exactly once by name; duplicates are reported as INFO.
7. For options used by the rule: report Quantity Editable, Min Quantity and Max Quantity; flag INFO if a limit could block the rule's scenario.
8. Conditions Met = Custom needs an Advanced Condition that uses only existing Index numbers.
9. Conditions Met = All means every condition must be true; Any means at least one must be true; Custom uses the Advanced Condition.
10. Each condition's Tested Field is included under its Tested Object in the SBQQ__TestedObject__c → SBQQ__TestedField__c field dependency.
11. For features used by the rule's options: report Min Options and Max Options; flag INFO if they could block the rule's scenario.
12. Filter rules: the action's Filter Field exists with the same API name on Product2 and SBQQ__ProductOption__c, the user can read both, and the value exists in the SBQQ__FilterField__c picklist.
