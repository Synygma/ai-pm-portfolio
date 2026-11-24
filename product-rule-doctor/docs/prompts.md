# Build prompts: Product Rule Doctor (rebuild)

Every prompt used to build the system, in order, with its result (ARCHITECTURE.md section 4).
Attempt 1 is archived in `archive/rule-doctor-attempt1/`, including its own `docs/prompts.md`.

---

## 1. CLAUDE.md project rules (2026-11-06)

> Add these lines to CLAUDE.md below the first line. Keep the first line as it is:
> Project: Product Rule Doctor, a read-only diagnostic for Salesforce CPQ product rules.
> Org: my default Salesforce org (Developer Edition). All data is SYNTHETIC; never use real customer or company data.
> Bundle under test: Process Instrumentation Pack (Demo).
> Read only by default: never create, update or delete Salesforce records unless I explicitly approve that exact change.
> Send only field names plus 1 or 2 sample rows when writing code. Run analysis locally.
> Stop on any error and show the exact error.
> Show me the file.

Result: CLAUDE.md now has 7 lines, with the first line unchanged.

## 2. Plan (2026-11-06)

> Read ARCHITECTURE.md and CLAUDE.md. I want to build a read-only "Product Rule Doctor" for Salesforce CPQ:
> /rule-doctor <rule name> reads a product rule and everything connected to it (conditions, actions, configuration rules, summary variables, related products and options), runs checks in Python, and gives a plain-English report: what the rule does, what is fine, what is broken, the most likely cause and a suggested fix.
> Design: skill rule-doctor (orchestrator), agent rule-reader (reads data), script scripts/rule_doctor_checks.py (all checks), agent evidence-checker (review panel, hard stop: every statement must match the data), config file, knowledge checklist, human answer key, run folders as in ARCHITECTURE.md.
> Decisions already made: no editorial reviewer (internal report); record compliance, approval gate, action channels and history as "not applicable: read only"; cheap check first (rule exists and is unique); label checklist-based statements like "(checklist #4)"; test fixtures in rules/fixtures/ for broken scenarios; with no rule name, list the bundle's rules and ask.
> Give me the plan with folder structure and the test for each step. Do not build yet.

Result: a plan mapped to the ARCHITECTURE.md §5 build order, with 3 open decisions (naming, checklist items 10–12, answer key).

## 3. Approval and step 1 files (2026-11-06)

> Approved. Use the ARCHITECTURE.md names (config/my_context.md, knowledge/product_rule_anatomy.md, 02_research, 03_draft).
> Now create these three files exactly as given. Do not change or calculate anything.
> 1. knowledge/product_rule_anatomy.md: (checklist items 1–9)
> 2. config/my_context.md: (org, bundle, read-only mode, run paths)
> 3. rules/expected_rule_doctor.json: (answer key: 4 healthy rules, 2 broken scenarios)
> I sign off the checklist as written. Also create docs/prompts.md and log every build prompt from now on with its result. Confirm the three files exist. Do not build anything else yet.

Result:
- The three files were created exactly as given. The full content is in the files themselves.
- `docs/prompts.md` was created (this file).
- **Decisions recorded:**
  - ARCHITECTURE.md names are used.
  - The checklist is items 1–9 only, so items 10–12 were not added.
  - The answer key is as given.
- **Step 1 (knowledge file):** signed off by the user.

## 4. Checklist items 10–12 and blocking definition (2026-11-06)

> Add these items to knowledge/product_rule_anatomy.md exactly, below item 9. Do not change items 1 to 9:
> 10. Each condition's Tested Field is included under its Tested Object in the SBQQ__TestedObject__c → SBQQ__TestedField__c field dependency.
> 11. For features used by the rule's options: report Min Options and Max Options; flag INFO if they could block the rule's scenario.
> 12. Filter rules: the action's Filter Field exists with the same API name on Product2 and SBQQ__ProductOption__c, the user can read both, and the value exists in the SBQQ__FilterField__c picklist.
> In rules/expected_rule_doctor.json change only the _note to: "Answer key written by a human. Blocking = any FAIL in checks 1 to 5, 8, 10 or 12."
> I sign off items 10 to 12. Log this in docs/prompts.md. Confirm both files.

Result:
- `knowledge/product_rule_anatomy.md`: items 10–12 added exactly; items 1–9 unchanged.
- `rules/expected_rule_doctor.json`: only `_note` changed. The `healthy` and `broken_scenarios` entries are unchanged.
- **Signed off:** items 10–12 by the user. The checklist now has 12 items.

## 5. Build step 2: skill + checks script on one saved input (2026-11-06)

> Build the next step of the plan only. Then run its test from the plan and show PASS or FAIL. Stop after that.

Result: **stopped on an error** before anything was built (CLAUDE.md: stop on any error). See the lesson below.

### Lesson: never guess relationship names

- **What happened:** to get the option's feature for check 11, I wrote a read-only query with a guessed child relationship, `(SELECT Id FROM SBQQ__FeatureOptions__r)` on `SBQQ__ProductFeature__c`.
- **Exact error:** `INVALID_TYPE: ... Didn't understand relationship 'SBQQ__FeatureOptions__r' in FROM part of query call.`
- **Cause:** the relationship name was guessed, not checked. Attempt 1 hit the same kind of error with `SBQQ__Options__r`.
- **Fix:** two simple queries that avoid relationships, with field names confirmed first by `sf sobject describe`:
  1. `SELECT Id, Name, SBQQ__Number__c, SBQQ__MinOptionCount__c, SBQQ__MaxOptionCount__c, SBQQ__OptionSelectionMethod__c FROM SBQQ__ProductFeature__c WHERE SBQQ__ConfiguredSKU__c = '<bundle Id>' AND Name = '<feature>'`
  2. `SELECT COUNT() FROM SBQQ__ProductOption__c WHERE SBQQ__Feature__c = '<feature Id>'`

  The reader (step 4) will use the same two-query approach.
- **Rule added to CLAUDE.md (line 8):** "Never guess API names or relationship names. Check them with sf sobject describe first, or use simple queries that avoid relationships."

> Yes, continue step 2 with the two-query approach, and use it in the reader too.
> Also add this line to CLAUDE.md: "Never guess API names or relationship names. Check them with sf sobject describe first, or use simple queries that avoid relationships."
> Log this error and the fix in docs/prompts.md as a lesson. Then finish step 2, run its test, and show PASS or FAIL. Stop after that.

Result:
- **Built:**
  - `rules/fixtures/healthy/maintenance-kit-quantity-limit-demo.json`: the saved input, from the attempt-1 live read plus `features_used` from the two queries.
  - `scripts/rule_doctor_checks.py`: checks 1–12. Blocking means a FAIL in 1–5, 8, 10 or 12.
  - `scripts/rule_doctor_start.py`: a run folder from a saved file.
  - `.claude/skills/rule-doctor/SKILL.md`: steps A (run folder), B (checks) and C (draft), and it runs only as `/rule-doctor`.
  - `tests/rule_doctor/test_step2.py`.
- **Test:** 15 of 15 assertions passed. The run folder follows the config, 12 checks are reported with evidence, the overall result is `NO_BLOCKING_PROBLEM` as the answer key expects, the script never calls Salesforce, and it never reads the answer key. **Step 2: PASS.**
- **Not tested yet:** the skill itself and its draft step (C). That needs `/exit` and a relaunch of Claude Code.

## 6. Build step 4: rule-reader agent (2026-11-06) — stopped on error

> Build the rule-reader agent from the plan only (.claude/agents/rule-reader.md, using scripts/rule_doctor_read.py with the two-query approach for features and options). Run its test for "Extra Services Filter (Demo)": compare 02_research with a direct read, and confirm no record's LastModifiedDate changed. Show PASS or FAIL. Stop after that.

- **Built:**
  - `scripts/rule_doctor_read.py`: read only. All field and relationship names were confirmed with `sf sobject describe` first. Features use the two-query approach.
  - `.claude/agents/rule-reader.md`.
  - `--rule` mode in `scripts/rule_doctor_start.py`: folder only, no Salesforce access.
  - Test helpers: `tests/rule_doctor/org_snapshot.py` and `tests/rule_doctor/test_step4.py`.
- **Run:** the agent isn't registered until a restart, so separate agents followed `rule-reader.md` exactly.
  - **Not-found case** ("Extra Service Filter"): `NOT_FOUND`, nothing written. Correct.
  - **"Extra Services Filter (Demo)": `READ_FAILED`**
    ```
    ERROR: could not parse sf output for describe SBQQ__ErrorCondition__c.
    STDOUT:

    STDERR:

    ```
    (exit code 1)
- **Org:** LastModifiedDate was unchanged for every record after the failed run.
- **Stopped** as CLAUDE.md requires. The comparison test was not run.

## 7. Build step 6: evidence-checker agent (2026-11-06)

> Build the evidence-checker agent from the plan only (.claude/agents/evidence-checker.md). Test it with four drafts: one correct, one with a wrong number, one with an invented field, one with an unlabelled CPQ claim. Show: case, expected, result, PASS or FAIL. Stop after that.

- **Built:**
  - `.claude/agents/evidence-checker.md`: hard stop. It reads only `03_draft/draft.md`, `02_research/rule_data.json`, `03_draft/checks.json` and `knowledge/product_rule_anatomy.md`, and writes `04_review/evidence.md`.
  - `tests/rule_doctor/evidence_cases/`: 4 cases, built from the saved Maintenance Kit input and its real `checks.json`.
- **How it ran:** the new agent isn't registered until a reload. Separate agents followed the file exactly, without being told which case was which.

| Case | Expected | Result | Test |
|---|---|---|---|
| correct | Pass | VERDICT: PASS, 0 failed | PASS |
| wrong_number | Block (25 vs 20) | VERDICT: FAIL, 1 failed: Evaluation Order line | PASS |
| invented_field | Block (`SBQQ__Severity__c`) | VERDICT: FAIL, 1 failed: Severity line | PASS |
| unlabelled_claim | Block | VERDICT: FAIL, 1 failed: the Alert / "lets the rep save" line | PASS |

- **Step 6: PASS.** Each bad draft was blocked on exactly its planted line.
- **Known limitation** (from attempt 1, still applies): the checker is a model, and its verdicts can vary between runs.
- **Still open:** the step 4 reader failure (the empty `sf sobject describe` output).

## 8. Full skill flow (2026-11-06)

> Update the rule-doctor skill so it calls the rule-reader agent for step B, the checks script for the checks, writes the draft to 03_draft, calls the evidence-checker agent for 04_review (if BLOCKED, fix the draft and check again), writes 04_review/compliance.md as "Not applicable: read only", and saves 05_final/report.md with metadata, plus a line in runs/INDEX.md and logs/tokens.csv. Keep it read only. Show me SKILL.md. Do not run it yet.

- **Result:** `.claude/skills/rule-doctor/SKILL.md` was rewritten with steps A–G: start, rule-reader, checks, draft, evidence review with a fix loop and compliance, final with `report.md`, `metadata.json`, INDEX and tokens, then the reply. **Not run.**
- **Choices I added:**
  - The fix loop is limited to **2 rounds**, then the run stops with `BLOCKED_BY_REVIEW` and no report (ARCHITECTURE §3.6: "fix if possible; otherwise stop").
  - Token counts come only from the agents' reported usage, or "not reported". They're never estimated.
  - The skill itself runs no `sf` commands. Only the rule-reader agent reads Salesforce.
- **Not built yet, and noted in the skill:** step 3 (listing the bundle's rules when no name is given) and step 5 (cheap check). The step 4 reader failure is still open.
