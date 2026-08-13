# HireNudge Content Governance Design

## Purpose

Add an explicit governance layer to the HireNudge content system: one **Content Systems Architect** and a declarative gate registry that the Content Director and specialist roles must follow. The Architect protects system integrity; it does not become another content approver or a routine step in every asset.

This design extends the existing Content Director, five-specialist and Operations Bot architecture. It does not create a second tracker, research database, approval ledger or publishing system.

## Approaches considered

### 1. Central Architect plus declarative gate registry — selected

Create one callable Architect role outside the production chain and store every gate in a structured local registry. Role instructions reference stable Gate IDs instead of paraphrasing the controls independently.

This gives Priyansh one place to inspect the workflow, makes contradictions visible and keeps routine production lean. It is the recommended approach because it combines human-readable governance with deterministic validation.

### 2. Embed all gates inside every role file

Each specialist could carry its own copy of the relevant rules. This is initially simple, but wording and behaviour would drift as agents change. Auditing the whole workflow would require comparing several files, so this approach is rejected.

### 3. Build an automated workflow engine

A service could manage tasks, statuses and approvals programmatically. This would be more enforceable, but it is unnecessary for the current lean launch and would introduce infrastructure, state and maintenance before the content workflow is proven. This remains a possible later phase, not version one.

## Architecture

The user continues to work only with the **Content Director** during normal content production. The Director invokes specialists and evaluates the gate registry before each handoff or status change.

The **Content Systems Architect** sits outside that chain. The Director invokes it only when:

- an agent role, handoff contract, gate, status or source-of-truth rule is added or changed;
- the tracker or Product Truth schema changes;
- two project rules or sources conflict;
- a gate fails repeatedly or a workflow produces an unsafe or inconsistent result;
- Priyansh asks for a system audit or redesign.

The Architect may inspect local rules and live Drive metadata, identify conflicts, design migrations and issue an architecture review. It cannot select topics, approve copy, change Product Truth decisions, mutate the tracker, publish content or override Priyansh.

## Authority boundaries

- **Priyansh** is the final authority for topic approval, system changes and publication.
- **Content Director** owns routine orchestration and must not bypass a gate.
- **Content Systems Architect** owns structural analysis and gate integrity but gives recommendations, not business approval.
- **Research & Verification** owns evidence packets and Product Truth grounding.
- **Editorial & Trust** owns content-level `Pass`, `Revise` or `Block` decisions.
- **Content Operations Bot** is the only routine role allowed to mutate the tracker and production Docs.
- **Product Truth Sheet** controls product-capability status, safe wording, limitations and claim decisions.
- **Content tracker and linked production Docs** control approved treatments, production material and workflow status.

No role may use architectural approval to override a failed evidence, Product Truth, consent, editorial or user-approval gate.

## Gate registry

The implementation will create `system/content-gates.json`. Every gate has:

- stable `id`;
- `name`;
- `owner`;
- `appliesWhen`;
- `checkpoint`;
- `requiredInputs`;
- `passCriteria`;
- `failureAction`;
- `allowedNextState`.

Gate evaluations use exactly four results: `Pass`, `Revise`, `Block` and `Not Applicable`. `Not Applicable` requires an explicit reason; silence never counts as a pass.

### G0 — Intake and scope

**Owner:** Content Director  
**Checkpoint:** Before ideation  
**Pass:** The request has a usable goal or problem, the audience is explicit or defaults to the approved HireNudge audience, and any requested channel, format, country, route or product module is recorded without inventing missing constraints.  
**Failure:** Ask one focused question or apply the documented audience default. Do not create Drive records.

### G1 — Evidence eligibility

**Owner:** Research & Verification Agent  
**Checkpoint:** Before presenting an idea for approval  
**Pass:** The idea begins with a live original job source, consented anonymised case, attributable recruiter observation or verified product/labour-market data. The source, date and important limitation are available.  
**Failure:** Remove or replace the idea. Unsupported candidates do not reach Priyansh as approval-ready options.

### G2 — Product Truth

**Owner:** Research & Verification Agent; enforced again by Editorial & Trust  
**Checkpoint:** Before product-led ideation, drafting and final editorial pass  
**Pass:** The current capability row, truth status, safe wording, limitations, evidence source, verification date and relevant claim decision are recorded. The treatment does not upgrade a non-live status or use a blocked claim.  
**Failure:** Remove the product claim, narrow it to the recorded safe wording, or request product-owner/production verification. A blocked or contradictory capability cannot proceed as a product claim.

### G3 — Channel-treatment approval

**Owner:** Priyansh; coordinated by Content Director  
**Checkpoint:** Before any tracker row or production Doc is created  
**Pass:** Priyansh has approved the exact `Channel`, `Topic`, `Approach`, `Category` and `Format`.  
**Failure:** Keep the proposal in chat. Operations receives no write command.

### G4 — Duplicate and reuse control

**Owner:** Content Director; checked by Content Operations Bot before writing  
**Checkpoint:** Before creation and before a later-week reuse  
**Pass:** The treatment does not violate the active Concept Key and Hook Key rules. Same-week channel adaptations share the allowed Parent Pack; later treatments use a new applicant decision, source input and Concept Key.  
**Failure:** Reframe the concept or reuse the already-matching approved record. Never create a silent duplicate.

The gate follows the active tracker rules during the approved lean-tracker migration. The Architect must review any proposal to remove or replace Concept Key, Hook Key or Parent Pack controls so duplicate protection is not accidentally lost.

### G5 — Operations write authorisation

**Owner:** Content Operations Bot  
**Checkpoint:** Immediately before every Drive mutation  
**Pass:** G3 and G4 have passed, the target tracker schema matches the manifest, the proposed status transition is permitted and a read-before-write idempotency check has completed.  
**Failure:** Make no mutation, preserve the current status and return a failure report with the exact unmet condition.

### G6 — Production completeness

**Owner:** Copy & Production Agent; checked by Content Director  
**Checkpoint:** Before moving `Drafting` to `Review`  
**Pass:** The production Doc contains only the material needed to make the approved asset: final copy or script, required on-screen/slide text, visual or shot instructions where applicable, one CTA and source links. Narrated assets specify human narration. Product wording preserves G2.  
**Failure:** Keep the asset in `Drafting` and return the missing fields to Production.

### G7 — Editorial and trust

**Owner:** Editorial & Trust Agent  
**Checkpoint:** Before moving `Review` to `Ready`  
**Pass:** Sources support material claims; Product Truth, privacy, consent, natural language, applicant usefulness, duplication and platform fit pass review. The report explicitly returns `Pass`.  
**Failure:** Return `Revise` with the exact line, reason, required correction and responsible role, or `Block` when evidence, consent or product truth cannot be repaired.

### G8 — Final human approval

**Owner:** Priyansh  
**Checkpoint:** At `Ready`  
**Pass:** Priyansh explicitly approves the finished asset for the next human-controlled publishing action.  
**Failure:** Return to the named specialist for revision or keep the asset at `Ready`/hold. No agent schedules, publishes or marks it `Published` in version one.

### G9 — YouTube phase gate

**Owner:** Content Director; reviewed by Content Systems Architect when the phase changes  
**Checkpoint:** Before approving YouTube production  
**Pass:** At least three comparable short-form executions demonstrate a repeatable applicant decision, sufficiently strong evidence and credible human production capacity. Calendar time alone is not a pass.  
**Failure:** Keep YouTube in research/Phase 2 and do not create a production-ready treatment.

## State control

For the approved lean workflow, Operations may move content only through:

`Approved Topic` → `Drafting` → `Review` → `Ready`

Each transition requires the matching gate result:

- creation at `Approved Topic`: G3, G4 and G5;
- `Approved Topic` to `Drafting`: G1, G2 when applicable, and G5;
- `Drafting` to `Review`: G6 and G5;
- `Review` to `Ready`: G7 and G5;
- any action after `Ready`: G8 and human execution outside the agent system.

The older Week 01 status model remains operational until the separately approved tracker migration occurs. The Architect must review that migration and map the old statuses to the lean states before Operations is allowed to use the new transitions.

## Content Systems Architect contract

### Accepted input

- change request or observed workflow failure;
- affected files, Sheet/Doc schemas or agent roles;
- current and desired behaviour;
- known constraints and source-of-truth conflicts.

### Required output: Architecture Review

- `Decision`: `Approve`, `Revise` or `Block`;
- `Scope`;
- `Current State`;
- `Affected Roles and Gate IDs`;
- `Source-of-Truth Conflicts`;
- `Recommended Design`;
- `Migration or Rollback Plan`;
- `Verification Checks`;
- `Residual Risks`;
- `Priyansh Decision Required`.

### Prohibited actions

The Architect cannot:

- approve a topic, treatment, claim or final asset;
- change Product Truth rows or decisions;
- create tracker rows or production Docs;
- move content statuses;
- schedule, publish or manage replies;
- treat a recommendation as implemented;
- broaden a system-change request into unrelated restructuring.

## Failure and conflict handling

- A gate with missing evidence returns `Revise` or `Block`, never an assumed `Pass`.
- Conflicts between Product Truth and promotional copy are resolved in favour of Product Truth for content use.
- Conflicts between a local rule and the live operational Sheet/Doc are reported to the Architect; no role silently chooses the easier version.
- A failed Drive mutation leaves the previous state unchanged.
- Repeated failure of the same gate triggers an Architect audit, but does not let the Architect bypass the gate.
- When a source changes after review, the asset returns to the earliest affected gate.

## Implementation structure

The governance implementation will add:

```text
agents/
  content-systems-architect.md
  gate-contracts.md
system/
  content-gates.json
scripts/
  validate-content-gates.py
```

It will also update:

```text
AGENTS.md
README.md
system/project-handoff.md
docs/superpowers/specs/2026-08-12-content-agent-system-design.md
```

The validator will use only the Python standard library. It will reject duplicate Gate IDs, missing fields, unknown owners or outcomes, invalid workflow states and any automated transition beyond `Ready`.

The existing seven production-role files remain a separate implementation scope. This governance layer defines the contract they must consume; it does not pretend those uncreated roles already exist.

## Verification

The governance layer passes implementation review only when:

1. `system/content-gates.json` parses and passes the semantic validator;
2. every Gate ID from G0 through G9 appears exactly once;
3. the Architect and gate-contract files reference the same names, owners, outcomes and state transitions as the registry;
4. G2 preserves the Product Truth taxonomy and limitations;
5. no automated action after `Ready` exists;
6. an intentionally malformed registry fails validation;
7. AGENTS and the Content Director design identify the Architect as change-triggered governance, not a routine content approver;
8. no Google Sheet, Doc or Product Truth row is changed by this implementation.

## Deferred work

- Creating the Content Director, five specialist and Operations Bot role files.
- Migrating the current Week 01 workbook to the approved lean four-channel tracker.
- Building a persistent workflow service or automated approval ledger.
- Scheduling, publishing, reply management or analytics automation.
