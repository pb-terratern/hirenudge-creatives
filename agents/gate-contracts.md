# Gate Contracts

`system/content-gates.json` is the canonical, machine-validated definition of every gate, owner, input, result and allowed state. This guide explains when each gate is used. If this guide and the registry differ, stop and invoke the Content Systems Architect; do not silently reconcile them.

Every gate emits the `Gate Evaluation` defined in `agents/handoff-contracts.md`. Allowed results are exactly `Pass`, `Revise`, `Block` and `Not Applicable`. `Not Applicable` requires a reason and can be used only when `appliesWhen` is false.

## G0 — Intake and scope

The Content Director runs this before ideation. It records the usable goal or applicant problem, audience and supplied constraints. No Drive artifact may be created at intake.

## G1 — Evidence eligibility

Research & Verification runs this before an idea is presented as approval-ready and again before drafting. Unsupported options are removed rather than softened with vague caveats.

## G2 — Product Truth

Research & Verification runs this whenever a treatment names, shows or implies a HireNudge capability. Editorial & Trust enforces the same evidence packet before `Ready`. Non-live statuses and blocked claims cannot be upgraded through copy.

## G3 — Channel-treatment approval

Priyansh approves the exact `Channel`, `Topic`, `Approach`, `Category` and `Format`. Until that explicit approval exists, the proposal stays in chat and Operations receives no write command.

## G4 — Duplicate and reuse control

The Content Director checks concept, hook and parent-pack history before creation or later reuse. Operations repeats the live match check immediately before writing and reuses a matching artifact.

## G5 — Operations write authorisation

The Content Operations Bot runs this before every tracker or production-Doc mutation. It verifies upstream gates, the live schema, permitted state movement and a read-before-write idempotency result. Failure means no mutation.

## G6 — Production completeness

Copy & Production owns this before `Drafting` can move to `Review`; the Director confirms the packet is complete. The production Doc must contain only usable asset material, one CTA, source links and human-narration instructions where applicable.

## G7 — Editorial and trust

Editorial & Trust runs this before `Review` can move to `Ready`. It verifies sources, Product Truth, consent, privacy, natural language, usefulness, duplication and platform fit. Only an explicit `Pass` allows the transition.

## G8 — Final human approval

Priyansh reviews a finished asset at `Ready`. Version one stops here: agents cannot schedule, publish or mark the item `Published`.

## G9 — YouTube phase gate

The Content Director applies this before requesting approval for YouTube production. Three comparable short-form executions, a repeatable applicant decision, strong evidence and credible human production capacity are required; calendar time is insufficient.

## State transitions

Operations may perform only these forward movements, and only after the registry's required gates pass:

`new → Approved Topic → Drafting → Review → Ready`

There is no automated transition after `Ready`. Revision may keep the current status or return work to the responsible specialist, but it cannot skip a gate.
