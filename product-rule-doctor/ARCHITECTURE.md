# ARCHITECTURE.md: Skill + Agents Automation Pattern

Reusable architecture for every automation built with Claude Code.
Based on the LinkedIn automation taught in class (3–4 Oct), applied to my Salesforce CPQ projects.

**How to use this file**

1. Copy this file into the root of every new project folder.
2. Add this line to the project's `CLAUDE.md`: `Follow ARCHITECTURE.md for every design and build step.`
3. Before building anything, ask Claude: *"Read ARCHITECTURE.md and give me a plan. Do not build yet."*

---

## 1. Core principles

1. **Skill is a recipe, agent is a helper.** One skill orchestrates the workflow; agents each do one job and return only their output.
2. **Design the system first, then build step by step.** Have the flow in mind (or on paper) before the first prompt.
3. **Stay in control.** If I cannot explain what happens in the background, it is not my product. No unplanned agents.
4. **Plan before build.** Always ask for a plan first; build only after I approve it.
5. **Test after every step.** Move to the next step only when the current one passes.
6. **No guessing.** Facts come from data, files or verified sources. Calculations run in code (Python), not in the model.
7. **Human decides.** Any action outside the project (posting, writing to Salesforce, sending) needs my approval.
8. **Document everything.** Every run leaves a trace I can read later.
9. **Synthetic or approved data only.** Never use real company or customer data without approval.

---

## 2. Folder structure

```
<project>/
  CLAUDE.md                 project rules; points to this file
  ARCHITECTURE.md           this file
  config/
    my_context.md           my settings, domains, opinions, rules (I edit this)
  knowledge/
    <topic>_anatomy.md      deep-research output the skill relies on
  rules/                    machine-readable rules (json) and answer keys
  .claude/
    skills/<skill-name>/    the orchestrator skill (project-local, not root)
    agents/                 specialist and review agents
  scripts/                  Python helpers called by the skill
  runs/
    <YYYY-MM-DD>_<slug>/    one folder per run (see section 9)
    INDEX.md                one line per run
  history/                  records of things done outside the system
  docs/
    workflow.png            current workflow diagram
    prompts.md              every prompt used to build the system
  logs/
    tokens.csv              tokens per run
```

**Skill and agent scope:** store them in the project folder (`.claude/`) unless I explicitly say they should be global (root `~/.claude/`).

---

## 3. Components

### 3.1 Knowledge file (deep research)
- Run deep research once on "what good looks like" (e.g. anatomy of a LinkedIn post, CPQ setup rules).
- Save the result in `knowledge/`. Review and refine it before using it.

### 3.2 Skill (the orchestrator)
- One skill per workflow, called with `/skill-name`.
- Holds the recipe and the order of steps; keeps itself short.
- Calls agents for heavy or independent work; calls scripts for calculations.
- Prefer explicit invocation: add to SKILL.md that it runs only when called by name.
- After creating or changing a skill: `/exit` and relaunch Claude Code.

### 3.3 Config file (my context)
- `config/my_context.md`: domains, opinions, business rules, regions, anything I want reflected.
- If the skill is run without input, it takes its input from here (and rotates when there are several options).
- I can edit it any time; new runs follow the new version.

### 3.4 Specialist agents
- Each agent has: one job, defined input, allowed tools, defined output.
- Runs in its own context, so the main session stays clean and the agent stays objective.
- Pattern for research agents: input → search → candidates → rank on written criteria → self-debate → return the top result (and save the rest).
- Agents are reusable across skills. Skills call agents; agents may call sub-agents; agents do not call skills.

### 3.5 Guardrails (inside the flow)
- Put the **cheap check early** (before work is done) and the **expensive check late**.
- Example: duplicate-idea check in the research agent; content-overlap check in the skill before finalising.
- Checks only count records I marked as final or published.

### 3.6 Review panel (agents)
| Reviewer | Checks | Type |
| --- | --- | --- |
| Fact / data checker | Every claim, number and evidence against sources or records | **Hard stop** |
| Compliance checker | Legal, defamation, copyright, disclosure, cultural, company policy | **Hard stop** |
| Editorial / quality | Clarity, audience fit, usefulness | Soft (improves) |

- Reviewers work independently and do not see each other's reports.
- Order: editorial first (it rewrites), then fact and compliance on the final wording.
- On failure: fix if possible; otherwise stop and go back to the next option.
- Every reviewer writes its report into the run folder.

### 3.7 Human approval gate
- Before any external action, show the final output and ask for approval.
- No approval, no action. The gate is only removed if I explicitly decide so.

### 3.8 Action channels (in this order)
1. **API** (official, most secure)
2. **Connector / MCP server**
3. **Browser automation** (Claude in Chrome; I stay logged in; Claude never logs in for me)

- Try in order, fall back on failure, and log which channel was used.
- Keep volume low and human-like. Never bulk actions.
- Never paste keys or secrets in chat; store them in a local file that is not shared or pushed.

### 3.9 History
- Pull and store what happened **outside** the system (e.g. posts written manually, records changed by others) so checks see the full picture.

---

## 4. Documentation (every run)

```
runs/<YYYY-MM-DD>_<slug>/
  01_input/        what was asked, config used
  02_research/     sources, searches, candidates, ranking, debate
  03_draft/        drafts and alternatives
  04_review/       one report per reviewer
  05_final/        final output file with metadata
                   (status, approved yes/no, approved on, channel, URL or record Id)
```

- Add one line to `runs/INDEX.md` per run.
- Keep `docs/workflow.png` updated whenever the flow changes.
- Append every build prompt to `docs/prompts.md`.
- Log tokens per run in `logs/tokens.csv`.

---

## 5. Build order (step by step)

| Step | Build | Test before moving on |
| --- | --- | --- |
| 1 | Deep research → knowledge file | I read and approve it |
| 2 | Skill from the knowledge file | Runs on one input; output correct |
| 3 | Config file wired into the skill | Runs with no input; uses config |
| 4 | Specialist agent(s) | Agent output matches sources; not-found case handled |
| 5 | Guardrails | Deliberate duplicate / bad input is caught |
| 6 | Review panel | Deliberate wrong fact or risky line is blocked |
| 7 | Approval gate | Nothing happens without approval |
| 8 | Action channel(s) | Action done once; record saved; fallback works |
| 9 | History pull | Outside items appear and are used by checks |
| 10 | Workflow diagram, prompts log, token log | Files exist and are current |
| 11 | Scheduling (`/loop <interval> /skill-name`) | Only after all above pass |

---

## 6. Rules for Claude in this project

- Read this file and `CLAUDE.md` before planning.
- Give a plan first; wait for my approval before building.
- Ask whether a new check belongs in the skill or in an agent if unsure.
- Read only by default. Write to Salesforce or any external system only with my approval.
- Stop on any error and show the exact error. No workarounds without asking.
- Do not invent data, products, rules or results. Blank stays blank; not found is reported as not found.
- Put arithmetic and comparisons in scripts; the model explains the script output only.
- Label statements that come from domain rules (not from data) as such.
- Send only field names plus one or two sample rows when writing code.
- Keep secrets out of chat and out of any file that is shared or pushed.

---

## 7. Prompt templates

**Plan first**
```
Read ARCHITECTURE.md and CLAUDE.md. I want to build: <goal>.
Give me a plan: the skill, the agents, the config file, guardrails, review panel, approval gate,
action channel, folder structure and the test for each step. Do not build yet.
```

**Create the skill**
```
Convert knowledge/<file> into a project-local skill named <skill-name> in .claude/skills.
It runs only when I call /<skill-name>. It must follow the build order in ARCHITECTURE.md
and document every run in runs/ as described. Show me SKILL.md.
```

**Create an agent**
```
Create a project-local agent named <agent-name>. Input: <input>. Tools: <tools>.
Job: <one job>. Rank using: <criteria>. Output: <output> saved to the run folder.
Then edit <skill-name> to call it at step <n>.
```

**Add the review panel**
```
Add a review panel after the draft step: fact/data checker (hard stop), compliance (hard stop),
editorial (soft). Independent contexts, no shared reports. Editorial first, then fact and
compliance on the final wording. Give me the plan first.
```

**Approval gate and action**
```
After the review panel passes, show me the final output and ask for approval.
On approval, act via API; if it fails, connector; if it fails, browser (Claude in Chrome).
Verify the result and record status, channel and link in the final file.
```

**Workflow diagram**
```
Create docs/workflow.png showing the complete current workflow of <skill-name> and its agents.
Update it whenever the workflow changes.
```

---

## 8. Example mapping

| Part | LinkedIn automation (class) | CPQ Spares Advisor (my project) |
| --- | --- | --- |
| Skill | `/li-writer` | `/spares-advisor` |
| Config | `my_views.md` (domains, opinions) | `spares_rules.json`, regions, as-of date |
| Specialist agent | Trend Captain | Installed Base reader (planned) |
| Guardrails | Duplicate idea, 25% content overlap | No rule → no recommendation |
| Review panel | Fact, Compliance, Editorial | Evidence check vs records, rules check (planned) |
| Approval gate | Before posting | Before adding quote lines (planned) |
| Action channels | LinkedIn API → browser | Salesforce CLI/API → MCP → browser (planned) |
| Answer key | — | `expected_recommendations.json` |

---

## 9. Ethics and cost

- Automation must match what I genuinely know. Ask for a regular digest and stay on top of the domain.
- Add disclosures where needed (e.g. no ties to a vendor I praise).
- Track tokens per run; optimise context, and consider smaller or local models for repeated high-volume work.
