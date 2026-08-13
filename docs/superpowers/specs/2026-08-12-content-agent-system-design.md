# HireNudge Codex Content Agent System

## Purpose

Build a lean Codex project system in which Priyansh works with one Content Director. The Director coordinates five specialist agents and one operations bot to take a content request from evidence-backed ideation to a production-ready asset. The system stops at `Ready` for Priyansh's final approval and never schedules, publishes or manages replies.

The system operates against the simplified HireNudge content tracker, linked production Docs and the separate HireNudge Product Truth Sheet. The tracker controls content status and production links; Product Truth controls product-capability status, safe wording, limitations and claim decisions. Candidate ideas and review feedback remain in chat. Only explicitly approved channel treatments may be written to Google Drive.

## Implementation status

The local role files, handoff contracts and G0–G9 registry are implemented. The manifest now identifies a native lean tracker with the four expected channel tabs and six-column schema. The tracker started empty and no old Week 01 content was migrated. Operations must still re-read the live schema and required gates before every mutation.

## Architecture

The user-facing Content Director coordinates these internal roles:

1. **Ideation Agent** — proposes three focused topic directions using approved content categories, applicant needs, verified HireNudge modules and current conversations. It cannot draft posts or write to Drive.
2. **Research & Verification Agent** — searches authoritative web sources, official company career pages and relevant public social discussions. For product-led work, it also returns the matching Product Truth capability row, evidence source, verification date, limitations and claim decision. It returns evidence and verification requirements, not polished copy.
3. **Channel Strategy Agent** — converts a selected idea into exact channel treatments containing `Topic`, `Approach`, `Category` and `Format`. It recommends only channels that suit the idea.
4. **Copy & Production Agent** — creates channel-native copy or scripts, on-screen or slide text, visual instructions, CTA and source links in natural Indian English. Product language must use the matching Product Truth `Safe Wording` and preserve its limitations. Human narration is mandatory for narrated content.
5. **Editorial & Trust Agent** — checks source support, Product Truth status, safe wording, limitations, claim decision, voice, usefulness, duplication, privacy, consent and platform fit. It returns `Pass`, `Revise` or `Block` and never silently changes a material claim.
6. **Content Operations Bot** — performs deterministic Drive work only: creating approved rows and Docs, linking them and applying permitted status changes. It cannot select ideas, rewrite content or approve claims.

These are callable Codex roles, not persistent services. The Director creates bounded specialist tasks, supplies a fixed handoff packet and ends each task after its assignment. Only the Operations Bot may mutate the tracker or production Docs.

## Workflow and approval gates

1. Priyansh supplies a goal, category, applicant problem, product module or open-ended request.
2. Ideation returns three candidates. Research performs a preliminary evidence check so unsupported or stale ideas are removed before presentation.
3. Channel Strategy proposes exact tracker values for suitable channels only.
4. **Approval Gate 1:** Priyansh approves exact channel rows. Rejected and unapproved proposals remain only in chat.
5. Operations creates one tracker row and one lean production Doc for each approved treatment with status `Approved Topic`.
6. Research prepares the full verified source packet. Production fills only the material needed to make the asset and advances the work to `Drafting` through Operations.
7. Operations moves a complete draft to `Review`. Editorial either passes it or sends a precise correction request to the responsible specialist.
8. A passing asset moves to `Ready` through Operations.
9. **Approval Gate 2:** the Director presents the finished asset to Priyansh and stops. Publishing is outside version one.

An unverifiable claim, opening, product capability or application link cannot be rescued with vague caveats. The work returns to Research or Ideation, or remains in `Drafting`.

## Handoff contracts

All specialist responses use one of these interfaces:

### Idea Candidate

- Topic
- Audience problem
- Category
- Preliminary evidence lead
- Why it is useful
- Risk or limitation

### Channel Proposal

- Channel
- Topic
- Approach
- Category
- Format

### Research Packet

- Supported claims
- Original source URLs
- Publisher
- Publication date or verification date
- Source limitations
- Relevant product references
- Prohibited or unsupported implications

### Production Packet

- Final copy or script
- On-screen or slide text, when applicable
- Visual or shot instructions, when applicable
- One CTA
- Source links

### Review Report

- Decision: `Pass`, `Revise` or `Block`
- Exact affected claim or line
- Reason
- Required correction
- Responsible specialist

### Operations Command

- Approved channel row
- Content Doc payload
- Current status
- Requested status
- Existing tracker row or Doc identifier, when present

## Shared rules

- The tracker and linked production Docs are the operational source of truth.
- Chat contains proposals and review feedback; it is not a shadow tracker.
- Every role receives only the minimum packet needed for its task.
- No unapproved topic is written to Drive.
- No role invents evidence, openings, recruiter opinions, applicant outcomes or product capabilities.
- Real company openings are permitted only as verified alerts and cannot be used as educational examples or teardowns.
- Before/after clinics use synthetic or explicitly consented, anonymised material only.
- Product-led content must reverify the current capability and its limitations against the HireNudge product reference before drafting.
- Research must cite the matching Product Truth capability row and registered source. Production must use its safe wording. Editorial must enforce its limitation and the corresponding claim decision.
- The Content Operations Bot may read or link Product Truth but cannot edit its statuses, decisions or wording.
- Cross-channel treatments must be independently approved and written for the channel rather than copied verbatim.
- Version one creates no research database, agent log Sheet or approval ledger.

## Operations safeguards

The Operations Bot must perform read-before-write checks and make mutations idempotent:

- Match an existing item using the approved channel, topic, approach, category and format before creating a row.
- Reuse the linked production Doc when the matching row already exists.
- Create a Doc only for an approved row and keep it within that channel's production folder.
- Accept only these forward status transitions: `Approved Topic` to `Drafting`, `Drafting` to `Review`, and `Review` to `Ready`.
- Never set `Published` in version one.
- If a Drive operation fails, leave the prior status unchanged and return a failure report to the Director.

## Failure handling

- **Weak evidence:** Research returns `Block`; Production is not invoked.
- **Conflicting sources:** Research states the conflict and recommends the narrowest supportable treatment.
- **Unverified opening:** discard the candidate; do not replace the original employer application page with an aggregator.
- **Unverified product capability:** remove the product claim or request product confirmation.
- **Generic or artificial copy:** Editorial returns `Revise`, quoting the exact lines and the needed change.
- **Duplicate row or Doc:** Operations reuses the existing artifact and reports its link.
- **Invalid status transition:** Operations refuses the command and reports current and requested states.
- **Drive failure:** no status advancement and no claim of completion.

## Project structure

The implementation includes these role definitions:

```text
agents/
  content-director.md
  ideation-agent.md
  research-agent.md
  channel-strategy-agent.md
  production-agent.md
  editorial-trust-agent.md
  content-operations-bot.md
  handoff-contracts.md
```

`AGENTS.md` will make the Content Director the default entry point and explicitly authorise bounded delegation to the defined specialists. Each role file will specify its purpose, accepted input contract, required output contract, tools and sources it may use, prohibited actions, failure behavior and completion criteria.

## Controlled test

The first test uses one synthetic, employer-neutral topic and does not publish:

1. Generate three evidence-worthy ideas.
2. Run preliminary research and remove any unsupported candidate.
3. Present exact channel treatments for Priyansh's approval.
4. Verify that Operations creates only the approved tracker row and Doc.
5. Research and produce one content piece.
6. Run Editorial review with one deliberately unsupported claim to confirm it is rejected.
7. Correct the draft, rerun review and move the passing asset to `Ready`.
8. Confirm the Director stops for Priyansh's final approval.

The test passes only when role boundaries hold, sources support material claims, the copy reads naturally, Drive contains no unapproved or duplicate artifacts, status transitions are valid and nothing progresses beyond `Ready`.
