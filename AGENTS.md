# HireNudge Creatives operating rules

This repository is the operating home for HireNudge social media and creative production.

## Working model

- The master Google Sheet in `system/drive-manifest.json` is the content-status and production-link index.
- The separate Product Truth Sheet in the manifest is authoritative for product-capability status, safe wording, limitations and blocked claims.
- The linked Google Docs hold weekly research choices and production briefs.
- This repository holds the operating rules, templates and Drive identifiers. It does not duplicate published copy or production briefs.
- The earlier `/Users/priyansh/Documents/HIRE NUDGE` repository is a strategy and research archive. Read it when useful; do not copy its content packages into this repository.

## Agent operating model

- The Content Director is the default content entry point. Its executable contract is `agents/content-director.md`.
- The Director may use bounded delegation to the Ideation Agent, Research & Verification Agent, Channel Strategy Agent, Copy & Production Agent, Editorial & Trust Agent and Content Operations Bot defined under `agents/`.
- All roles use the packet schemas in `agents/handoff-contracts.md` and the canonical gates in `system/content-gates.json`.
- Only the Content Operations Bot may perform routine tracker or production-Doc mutations. It must pass G5 and complete a read-before-write check before every mutation.
- The Content Systems Architect is change-triggered governance. Invoke it only for role/gate/source-of-truth changes, tracker or Product Truth schema changes, conflicts, repeated gate failures, unsafe workflow results or a requested system audit/redesign.
- Before claiming a structural change is complete, run `python3 scripts/validate_content_system.py` and the project tests. An Architect recommendation does not override Priyansh or a failed evidence, Product Truth, consent or editorial gate.

## Content standard

- Write for Indian applicants considering global remote, contractor, EOR, relocation or sponsored roles.
- Use natural Indian English. Be informed, direct and calm.
- Start from a real job description, a consented anonymised case, a named recruiter observation or verified product/labour-market data.
- Human narration only. No synthetic voice, fake testimonial, invented recruiter quote or guaranteed outcome.
- Do not publish generic career advice, ATS folklore, artificial urgency or unsupported claims.

## Product truth

- Before proposing or drafting product-led content, read the matching current row in `Capabilities`, its `Evidence Source` and `Last Verified` date, then check `Claims & Conflicts` for the same module.
- Use `Safe Wording` and preserve every stated limitation. A `Publicly Claimed`, `Planned or Proposed`, `Demonstrated in Development`, or `Blocked or Unknown` row must never be rewritten as a verified-live capability.
- If the row is stale, missing, contradictory or blocked, remove the product claim or return it for product-owner or production verification.
- Research must cite the capability row and registered source. Production may use only the approved safe wording. Editorial must enforce the limitation and claim decision.
- The Content Operations Bot may link to Product Truth but cannot change its statuses, decisions or wording.

## Weekly workflow

1. Run G0, then prepare three evidence-backed Idea Candidates and preliminary G1/G2 evaluations in chat.
2. Prepare exact channel treatments and stop at G3 for Priyansh's approval.
3. Run G4 and G5; Operations creates only approved rows and linked Docs.
4. Research and Production complete their packets; Operations may move only `Approved Topic` → `Drafting` → `Review` → `Ready` after the required gates pass.
5. Editorial runs G7. A failed review stays in `Review` until corrected and rechecked.
6. Stop at G8 for Priyansh. Agents do not schedule, publish or mark `Published`.

## Duplicate rules

- Same-week cross-channel adaptations share one Parent Pack ID and are allowed.
- A Concept Key cannot be reused by a different Parent Pack ID.
- A Concept Key cannot appear in a later week, even if a Parent Pack ID is copied by mistake.
- A Hook Key cannot repeat across assets.
- Factual source wording and the approved CTA may repeat when accurate.
- A later treatment of the same subject needs a different applicant decision, source input and Concept Key.

## Data safety

- Never store passports, visas, bank details, personal identification numbers or unredacted offers.
- Record consent before using a case, recruiter contribution, voice or likeness.
- Treat visa, employment, tax and legal material as sourced orientation, not individual advice.
