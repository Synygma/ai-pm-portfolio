# Product Rule Doctor (Salesforce CPQ)

A **read-only** diagnostic for Salesforce CPQ product rules, built with Claude Code, the Salesforce CLI and Python.

`/rule-doctor <rule name>` reads a product rule and everything connected to it, runs 12 checks in Python, and writes a plain-English report:
- what the rule does;
- what is fine;
- what is broken;
- the most likely cause;
- a suggested fix.

It never changes anything in Salesforce. **All data is synthetic:** it comes from a practice Developer Edition org with a demo bundle, "Process Instrumentation Pack (Demo)".

## How it works

| Step | Who | Output |
|---|---|---|
| A. Start | `scripts/rule_doctor_start.py` | Run folder `runs/<date>_rule-doctor-<rule>/` |
| B. Read | **rule-reader** agent → `scripts/rule_doctor_read.py` | `02_research/rule_data.json`: rule, conditions, actions, configuration rules, options, features. API names are checked with `sf sobject describe` first |
| C. Check | `scripts/rule_doctor_checks.py` | `03_draft/checks.json`: 12 checks from `knowledge/product_rule_anatomy.md`. Blocking = FAIL in checks 1–5, 8, 10 or 12 |
| D. Draft | Skill | `03_draft/draft.md`: every bullet cites its evidence |
| E. Review | **evidence-checker** agent (hard stop) | `04_review/evidence.md`: blocks any statement not backed by the data. At most 2 fix rounds |
| F. Final | Skill | `05_final/report.md` + `metadata.json` |

Calculations and judgements live in Python. The model only reads data and explains the script's output.

## Folder guide
- `.claude/skills/rule-doctor/SKILL.md`: the orchestrator, steps A–G.
- `.claude/agents/`: the `rule-reader` and `evidence-checker` agents.
- `scripts/`: start, read and checks scripts.
- `knowledge/product_rule_anatomy.md`: the signed-off 12-item checklist.
- `rules/`: the human-written answer key and a saved test fixture.
- `tests/rule_doctor/`: step tests, plus 4 evidence-checker cases (correct, wrong number, invented field, unlabelled claim).
- `runs/2026-11-06_rule-doctor-region-india-selection-rule-demo/`: a complete sample run. Result: no blocking problem; evidence review passed.
- `docs/prompts.md`: every build prompt and its result, including the errors and lessons.
- `ARCHITECTURE.md`, `CLAUDE.md`: the build rules the project follows.

## Test results (from `docs/prompts.md`)
- **Checks script:** 15 of 15 assertions passed on the saved fixture.
- **Evidence checker:** blocked all 3 planted bad drafts on the exact planted line, and passed the correct draft.

## Known limits
- The evidence checker is a model, so its verdicts can vary between runs.
- Two features are not built yet:
  - listing a bundle's rules when no name is given;
  - a cheap "rule exists and is unique" check that runs before reading.
- It needs Claude Code and an authenticated Salesforce CLI (`sf`) default org. Salesforce record IDs in the sample run belong to a practice org.
