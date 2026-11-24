---
name: rule-doctor
description: Read-only Product Rule Doctor for Salesforce CPQ (synthetic demo). Runs ONLY when the user explicitly types /rule-doctor <rule name>. Never invoke automatically.
argument-hint: <product rule name>  |  --data <saved rule_data.json>
disable-model-invocation: true
allowed-tools: Bash(python scripts/rule_doctor_start.py:*), Bash(python scripts/rule_doctor_checks.py:*), Bash(date:*), Agent, Read, Write, Edit
---

# Product Rule Doctor (read only)

Arguments: `$ARGUMENTS`

Follow `ARCHITECTURE.md`, `CLAUDE.md` and `config/my_context.md`. The checks come from `knowledge/product_rule_anatomy.md`, items 1–12.

## Rules (always)
- **Run only when called** explicitly as `/rule-doctor`.
- **Read only.** Never create, update or delete Salesforce records.
  - Don't run any `sf` command yourself.
  - Salesforce is read only by the **rule-reader** agent.
- **Never calculate or judge anything yourself.** Every result comes from `scripts/rule_doctor_checks.py`. You only explain its output.
- **Stop on any error,** and show the exact error.
- **Blank stays blank, and not found is reported as not found.** Never invent data.
- **Not applicable for this tool** (read only, no external action), and recorded as such:
  - compliance review;
  - approval gate;
  - action channels;
  - history.

## Step A. Start the run
- If `$ARGUMENTS` is empty, ask which product rule to check, then stop.
  - Listing the bundle's rules from config isn't built yet (plan step 3).
- **Live run:** `python scripts/rule_doctor_start.py --rule "<rule name>"`
- **Saved-data run, for tests:** `python scripts/rule_doctor_start.py --data <file>`

Keep the `RUN_DIR=` path it prints. If the exit code isn't 0, show the output and stop.

The cheap check (rule exists and is unique, before any reading) isn't built yet (plan step 5). Until then, the reader reports not-found and duplicates in step B.

## Step B. Read the data (rule-reader agent)
- **Saved-data run:** the data is already in `02_research/rule_data.json`, so skip this step.
- **Live run:** call the **rule-reader** agent with `RUN_DIR: <RUN_DIR>`. Act on its reply:

  | Reply | What to do |
  |---|---|
  | `NOT_FOUND` or `DUPLICATE` | Show the reply and stop. Write nothing to `05_final`. |
  | `READ_FAILED` | Show the exact output and stop. |
  | `READ_OK` | Continue. Keep the counts line it returns. |

## Step C. Checks
```bash
python scripts/rule_doctor_checks.py "<RUN_DIR>"
```
This writes `03_draft/checks.json`. If the exit code isn't 0, show the output and stop.

## Step D. Draft
Write `<RUN_DIR>/03_draft/draft.md` using **only** `02_research/rule_data.json` and `03_draft/checks.json`.

**Headings, in this order:**
1. `# Rule Doctor draft: <rule name>`
2. `## What the rule does`: type, scope, event, evaluation order, conditions, actions, message and configuration rules, from the data.
3. `## What is fine`: the PASS checks, cited by check number.
4. `## What is broken`:
   - the FAIL checks with their details;
   - "Nothing blocking." if `overall` is `NO_BLOCKING_PROBLEM`;
   - then every INFO flag, starting with "INFO:".
5. `## Most likely cause`:
   - the lowest-numbered blocking check, with its details; or
   - "No blocking problem found."
6. `## Suggested fix`:
   - for each FAIL check, what the checklist item requires, labelled `(checklist #N)`; or
   - "No fix is needed."
   - A fix is always for the human to make. The Doctor never makes changes.

**Writing rules:**
- **Every bullet ends with evidence** in brackets, for example `[rule.SBQQ__Type__c = Alert]` or `[check 4 = PASS]`.
- **Label domain statements** (how CPQ works, or what a rule needs) with the checklist item they come from, for example `(checklist #9)`. If no checklist item supports a statement, leave it out.
- **Only use values** that appear in the two files.

## Step E. Review (evidence-checker agent, hard stop)
1. Call the **evidence-checker** agent with `RUN_DIR: <RUN_DIR>`. It writes `04_review/evidence.md`.
2. If the verdict is **FAIL** (blocked):
   - Fix only the failed statements in `03_draft/draft.md`, using the data. The safe fix is usually to remove the statement or cite the right value.
   - Save the failed review as `04_review/evidence_attempt_<n>.md`, then call the evidence-checker again.
   - **At most 2 fix rounds.** If it's still blocked after round 2, stop. Show the failed statements and write `05_final/metadata.json` with `"status": "BLOCKED_BY_REVIEW"`, but no `report.md`.
3. Write `<RUN_DIR>/04_review/compliance.md` with exactly:
   ```
   # Compliance review
   Not applicable: read only. Synthetic data, internal diagnostic report; no external action.
   ```

## Step F. Final
Only after the evidence-checker returns **VERDICT: PASS**:

1. **`05_final/report.md`:** a copy of the approved draft, with the title `# Rule Doctor report: <rule name>` and a metadata block at the top:
   ```
   - Status: final (evidence review passed)
   - Rule: <name> (<Id>)
   - Run folder: <RUN_DIR>
   - Overall: <overall> | Blocking checks: <list or none>
   - Evidence review: PASS after <n> fix round(s)
   - Data read at: <read_at_utc from rule_data.json>
   - Approval gate / action channel / history: not applicable (read only)
   ```

2. **`05_final/metadata.json`:**
   ```json
   {"status": "final", "rule_name": "...", "rule_id": "...", "overall": "...", "blocking_checks": [],
    "evidence_review": "PASS", "fix_rounds": 0, "compliance": "not applicable: read only",
    "approved": "not applicable", "approval_gate": "not applicable: read only",
    "action_channel": "not applicable: read only", "history": "not applicable: read only",
    "salesforce_changes": "none", "run_dir": "...", "finished_at_utc": "..."}
   ```

3. **`runs/INDEX.md`:** append one row, keeping the existing columns:
   `| <YYYY-MM-DD> | Rule Doctor: <rule name> | <run folder name>/05_final/report.md |`

4. **`logs/tokens.csv`:**
   - If the file doesn't exist, create it with this header:
     `date,run_folder,rule,rule_reader_tokens,evidence_checker_tokens,fix_rounds,note`
   - Append one row.
   - Token counts come only from the agents' reported usage. If a count isn't reported, write `not reported`. Never estimate.

## Step G. Reply to the user
Your reply has these parts:
- **The result:** the overall result and the most likely cause.
- **Fix rounds:** how many were needed.
- **Read-only confirmation:** one line saying nothing in Salesforce was changed.
- **Paths:** the full paths to `05_final/report.md`, `runs/INDEX.md` and `logs/tokens.csv`.
