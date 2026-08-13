# HireNudge Content System V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the complete approved HireNudge content-system v1: governance gates, Content Systems Architect, Content Director, five specialist agents, Operations Bot, lean four-channel tracker, source-of-truth wiring and a controlled test that stops at Priyansh's approval gates.

**Architecture:** Local Markdown contracts define the callable roles and handoffs; `system/content-gates.json` is the machine-readable gate registry; a standard-library Python validator enforces the registry and cross-file contract. Google Drive holds a new empty native content tracker with four channel tabs and the approved six-column schema. Product Truth remains a separate authoritative Sheet.

**Tech Stack:** Markdown, JSON, Python 3 standard library and `unittest`, `@oai/artifact-tool` for local spreadsheet construction, Google Drive native Sheets conversion.

## Global Constraints

- Priyansh interacts with one Content Director during normal production.
- Only the Content Operations Bot may mutate the tracker and production Docs.
- Nothing is written to Drive before Priyansh approves the exact `Channel`, `Topic`, `Approach`, `Category` and `Format`.
- Product claims must use the Product Truth Sheet's current status, `Safe Wording`, limitations, evidence source and claim decision.
- Status movement is limited to `Approved Topic` → `Drafting` → `Review` → `Ready`.
- No agent schedules, publishes, marks `Published` or manages replies.
- The new tracker starts empty; no old Week 01 content is migrated.
- Real jobs may be verified alerts but may not become educational examples or teardowns.
- Human narration only; no synthetic voice, fake testimonial, invented recruiter quote or guaranteed outcome.
- The Content Systems Architect is change-triggered governance, not a routine content approver.

---

### Task 1: Gate registry and validator

**Files:**
- Create: `system/content-gates.json`
- Create: `scripts/validate_content_system.py`
- Create: `tests/test_content_system.py`

**Interfaces:**
- Consumes: G0–G9 and state rules from `docs/superpowers/specs/2026-08-13-content-governance-design.md`.
- Produces: `validate_registry(registry: dict) -> list[str]`, `load_registry(path: Path) -> dict`, a CLI returning exit code 0 only for a valid system, and tests that prove invalid gates and transitions fail.

- [ ] **Step 1: Write failing unit tests for the registry contract**

  Add tests asserting that the final registry has exactly G0–G9; only `Pass`, `Revise`, `Block`, `Not Applicable`; the exact required gate fields; known owners; no duplicate IDs; no transition beyond `Ready`; and G2 contains Product Truth inputs.

- [ ] **Step 2: Run the tests and verify RED**

  Run `python3 -m unittest tests.test_content_system -v`. The tests must fail because the validator and registry do not exist.

- [ ] **Step 3: Implement the minimal validator and registry**

  Use only `argparse`, `json`, `pathlib` and standard-library typing. The registry must include top-level `schemaVersion`, `evaluationOutcomes`, `workflowStates`, `automatedTransitions`, `knownOwners` and `gates`.

- [ ] **Step 4: Run the tests and verify GREEN**

  Run `python3 -m unittest tests.test_content_system -v` and `python3 scripts/validate_content_system.py`. Both must exit 0.

- [ ] **Step 5: Prove malformed input fails**

  Run the test that removes G2 and the test that adds `Ready` → `Published`; both must pass by detecting the invalid registries.

### Task 2: Governance and handoff contracts

**Files:**
- Create: `agents/content-systems-architect.md`
- Create: `agents/gate-contracts.md`
- Create: `agents/handoff-contracts.md`
- Modify: `tests/test_content_system.py`

**Interfaces:**
- Consumes: `system/content-gates.json`, Product Truth rules in `AGENTS.md`, and the two approved design specs.
- Produces: a change-triggered Architect contract, a human-readable gate guide and exact specialist packet schemas.

- [ ] **Step 1: Add failing tests for governance documentation**

  Test that the Architect file contains its accepted input, Architecture Review fields, prohibited actions and every trigger; that gate-contracts references G0–G9 exactly once as headings; and that handoff contracts define Idea Candidate, Channel Proposal, Research Packet, Production Packet, Review Report, Gate Evaluation and Operations Command.

- [ ] **Step 2: Run the tests and verify RED**

  Run the targeted documentation tests and confirm they fail because the files are missing.

- [ ] **Step 3: Create the three contracts**

  Write bounded role instructions with purpose, accepted input, output, required sources/tools, prohibited actions, failure behaviour and completion criteria. Do not duplicate the full gate definitions in agent files; reference `system/content-gates.json` as canonical.

- [ ] **Step 4: Run the tests and verify GREEN**

  Run the full unit suite and CLI validator.

### Task 3: Content Director and specialist roles

**Files:**
- Create: `agents/content-director.md`
- Create: `agents/ideation-agent.md`
- Create: `agents/research-agent.md`
- Create: `agents/channel-strategy-agent.md`
- Create: `agents/production-agent.md`
- Create: `agents/editorial-trust-agent.md`
- Create: `agents/content-operations-bot.md`
- Modify: `tests/test_content_system.py`

**Interfaces:**
- Consumes: the handoff contracts, gate registry and manifest.
- Produces: seven callable Codex role definitions with explicit gate ownership, allowed tools, mutation limits and completion criteria.

- [ ] **Step 1: Add failing role-contract tests**

  Assert every role file exists and contains `Purpose`, `Accepted input`, `Required output`, `Required gates`, `Allowed actions`, `Prohibited actions`, `Failure behaviour` and `Completion criteria`. Assert only Operations contains routine tracker/Doc mutation permission; all other roles prohibit it. Assert Director stops at G3 and G8; Research owns G1/G2; Editorial owns G7; Operations owns G5.

- [ ] **Step 2: Run the tests and verify RED**

  Confirm the role tests fail due to missing files.

- [ ] **Step 3: Implement the seven roles**

  Use the approved contracts exactly. Each role must emit only its required packet and must return unresolved work instead of inventing inputs.

- [ ] **Step 4: Run the tests and verify GREEN**

  Run the full suite and validator.

### Task 4: Make the agent system the project entry point

**Files:**
- Modify: `AGENTS.md`
- Modify: `README.md`
- Modify: `system/project-handoff.md`
- Modify: `docs/superpowers/specs/2026-08-12-content-agent-system-design.md`
- Modify: `tests/test_content_system.py`

**Interfaces:**
- Consumes: the implemented role files and gate registry.
- Produces: consistent entry-point, governance and source-of-truth instructions across the repository.

- [ ] **Step 1: Add failing integration tests**

  Assert AGENTS makes the Content Director the default content entry point, authorises bounded delegation to the named roles, invokes the Architect only on governance triggers and requires the registry validator before structural changes are claimed complete.

- [ ] **Step 2: Run the integration tests and verify RED**

  Confirm the current project rules do not yet satisfy these requirements.

- [ ] **Step 3: Update project documentation**

  Preserve all current content, Product Truth, duplicate and data-safety rules. Add the implemented system status without claiming the tracker migration or live test is complete prematurely.

- [ ] **Step 4: Run the tests and verify GREEN**

  Run the full suite, JSON validation for both system JSON files and `git diff --check`.

### Task 5: Build and verify the lean tracker locally

**Files:**
- Create: conversation-scoped spreadsheet builder outside the repository
- Create: conversation-scoped `HireNudge Content Tracker.xlsx`

**Interfaces:**
- Consumes: the approved tabs `LinkedIn`, `Instagram`, `X`, `YouTube`; columns `Topic`, `Approach`, `Category`, `Format`, `Status`, `Content Doc`; status options `Approved Topic`, `Drafting`, `Review`, `Ready`, `Published`.
- Produces: a visually verified empty workbook with one valid seeded example row per tab only for native dropdown/table preservation; the seed rows are removed in Google Sheets before handoff.

- [ ] **Step 1: Create the workbook with exact structure**

  Use `@oai/artifact-tool`; create four native Excel tables, frozen headers, filters, wrapped text, readable widths, restrained HireNudge blue styling and a finite Status validation list. Do not add idea, research, approval or agent-log tabs.

- [ ] **Step 2: Inspect and render all four tabs**

  Verify exact headers, tab names, validation options and the absence of formulas/errors. Visually inspect each populated seed view.

- [ ] **Step 3: Export one `.xlsx` build artifact**

  Save it in the conversation-scoped output directory; do not link the local file in the user handoff.

### Task 6: Import and activate the native Google tracker

**Files:**
- Modify: `system/drive-manifest.json`
- Modify: `README.md`
- Modify: `system/project-handoff.md`

**Interfaces:**
- Consumes: the locally verified workbook and Drive root folder ID `1YmGS569qImWr5ht2W0WXWW6GJ6kEHZJc`.
- Produces: a separate native Sheet named `HireNudge Content Tracker`, empty channel tables, and manifest `drive.masterSheet` pointing to the new Sheet; the legacy tracker remains in Drive but is no longer operational.

- [ ] **Step 1: Import with native conversion and move to the Drive folder**

  Use `upload_mode: native_google_sheets`, verify the native MIME type and move the result into the HireNudge Creatives folder.

- [ ] **Step 2: Verify metadata before editing**

  Confirm four tab names, four native tables, exact table ranges, filters, frozen headers and Status validation.

- [ ] **Step 3: Remove all seed rows**

  Use precise Sheets batch updates so each tab contains only the header row while preserving native table/dropdown metadata. Re-read every tab and verify no topic is present.

- [ ] **Step 4: Update the manifest and handoff**

  Replace only `drive.masterSheet` with the observed new ID/URL. Add `drive.legacyMasterSheet` for the previous file so the migration is recoverable. Do not delete or trash the old Sheet.

- [ ] **Step 5: Run local and Drive verification**

  Validate JSON, run unit tests, verify the new Sheet is in the folder and confirm all four tabs remain empty.

### Task 7: Controlled system test through G3

**Files:**
- No Drive mutations in this task.
- Create: `tests/fixtures/controlled-test-scenario.json`
- Modify: `tests/test_content_system.py`

**Interfaces:**
- Consumes: the implemented roles, gate registry and Product Truth Sheet.
- Produces: one synthetic employer-neutral Nudge Studio test scenario, a preliminary evidence/Product Truth packet, three candidate ideas and exact channel proposals for Priyansh's G3 approval.

- [ ] **Step 1: Add the synthetic scenario fixture**

  Use no real applicant, vacancy, testimonial or personal data. Include one deliberately blocked ATS-guarantee claim for the later Editorial rejection check.

- [ ] **Step 2: Run G0, Ideation, G1 and G2 manually through the implemented contracts**

  Read the live Product Truth rows immediately before preparing the proposals. Record gate results and remove any unsupported treatment.

- [ ] **Step 3: Present G3 to Priyansh and stop**

  Present exact channel proposals in chat. Do not create a tracker row or production Doc until Priyansh explicitly approves one or more treatments.

### Task 8: Complete the approved controlled test

**Files:**
- Google tracker row and linked production Doc only after G3 approval.
- Update test evidence in `system/project-handoff.md` only after completion.

**Interfaces:**
- Consumes: Priyansh's approved channel treatment(s).
- Produces: one approved test asset progressed through G4–G7 to `Ready`, an Editorial rejection of the deliberately unsupported claim, a corrected asset and a final G8 handoff to Priyansh.

- [ ] **Step 1: Run G4 and G5, then create only approved artifacts**

  Operations performs read-before-write matching and creates the approved tracker row and one lean production Doc with status `Approved Topic`.

- [ ] **Step 2: Produce the evidence-backed test asset**

  Research produces the full packet; Production fills only the required asset material and advances through Operations to `Drafting`.

- [ ] **Step 3: Run G6 and move to Review**

  Keep the asset in `Drafting` until every required production field is present.

- [ ] **Step 4: Prove G7 rejects the unsupported claim**

  Editorial returns `Block` or `Revise` for the ATS guarantee, naming the exact line and Product Truth conflict. The status must remain `Review`.

- [ ] **Step 5: Correct and rerun G7**

  Production replaces the guarantee with Product Truth safe wording. Editorial passes the corrected asset and Operations moves it to `Ready`.

- [ ] **Step 6: Present G8 and stop**

  Present the finished test asset to Priyansh. Do not publish, schedule or set `Published`.

### Task 9: Final verification and handoff

**Files:**
- Modify: `system/project-handoff.md`

**Interfaces:**
- Consumes: completed implementation and controlled test evidence.
- Produces: an accurate operational handoff with remaining limitations.

- [ ] **Step 1: Run the complete local verification suite**

  Run `python3 -m unittest discover -s tests -v`, `python3 scripts/validate_content_system.py`, `python3 -m json.tool system/drive-manifest.json`, `python3 -m json.tool system/content-gates.json` and `git diff --check`.

- [ ] **Step 2: Verify live sources and artifacts**

  Re-read tracker metadata and all four used ranges, the created test row/Doc if G3 was approved, and representative Product Truth rows.

- [ ] **Step 3: Record exact implementation status**

  Distinguish implemented contracts, automated validation, Drive migration and test results from deferred publishing, scheduling, reply management and analytics.
