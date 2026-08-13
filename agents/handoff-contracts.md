# Specialist Handoff Contracts

These packet schemas are the only routine interfaces between the Content Director, specialists and Operations. Emit the smallest complete packet. Use `null` only when a field is explicitly optional; do not invent missing values.

## Idea Candidate

- `Candidate ID`: stable within the current chat selection round.
- `Topic`.
- `Audience Problem`.
- `Category`.
- `Preliminary Evidence Lead`: source type and original URL or registered Product Truth source.
- `Why Useful`.
- `Risk or Limitation`.
- `Preliminary Gate Evaluations`: G1 and G2 when applicable.

Completion requires a preliminary `Pass` for G1. A product-led candidate also requires a preliminary G2 packet and result.

## Channel Proposal

- `Candidate ID`.
- `Channel`: `LinkedIn`, `Instagram`, `X` or `YouTube`.
- `Topic`: exact tracker value.
- `Approach`: exact tracker value and applicant decision.
- `Category`: exact tracker value.
- `Format`: exact tracker value.
- `Channel Rationale`.
- `G9 Evaluation`: required for YouTube, otherwise omitted.

This packet is what Priyansh approves at G3. Approval of one proposal does not approve another channel adaptation.

## Research Packet

- `Research Packet ID`.
- `Approved Channel Proposal`.
- `Supported Claims`: each mapped to one or more original sources.
- `Original Source URLs`.
- `Research Coverage`: one entry for each required group (`Primary or Official`, `News and Web Search`, `X`, `LinkedIn`, `YouTube`, `Instagram`, `Reddit`, `Specialist Sources`) with status, references and access limitations.
- `Publisher`.
- `Publication or Verification Date`.
- `Source Limitations`.
- `Relevant Product References`: capability row, truth status, safe wording, limitations, evidence source, last verified and claim decision; required when G2 applies.
- `Prohibited or Unsupported Implications`.
- `Consent Reference`: required for any case, recruiter contribution, voice or likeness.
- `Gate Evaluations`: G1 and G2.

Research supplies evidence, not polished copy.

## Production Packet

- `Approved Channel Proposal`.
- `Research Packet ID`.
- `Final Copy or Script`.
- `On-screen or Slide Text`: required when the format uses it; otherwise `Not Applicable` with reason.
- `Visual or Shot Instructions`: required when the format uses them; otherwise `Not Applicable` with reason.
- `Narration`: `Human` for narrated formats; otherwise `Not Applicable` with reason.
- `CTA`: exactly one.
- `Source Links`.
- `G6 Evaluation`.

The packet contains only material needed to make the approved asset.

## Review Report

- `Decision`: `Pass`, `Revise` or `Block`.
- `Reviewed Asset Identifier`.
- `Checks`: evidence, Product Truth, privacy/consent, natural language, applicant usefulness, duplication and platform fit.
- `Exact Affected Claim or Line`: required for `Revise` or `Block`.
- `Reason`: required for `Revise` or `Block`.
- `Required Correction`: required for `Revise`; state why repair is impossible for `Block`.
- `Responsible Specialist`.
- `G7 Evaluation`.

Editorial never silently changes a material claim.

## Gate Evaluation

- `Gate ID`.
- `Result`: exactly `Pass`, `Revise`, `Block` or `Not Applicable`.
- `Evaluator`.
- `Evaluated At`: ISO 8601 date-time with timezone.
- `Inputs Checked`.
- `Evidence References`.
- `Reason`: mandatory for `Revise`, `Block` and `Not Applicable`.
- `Allowed Next State`: copied from the canonical registry; never inferred.

Silence, missing evidence and an absent evaluation never count as `Pass`.

## Operations Command

- `Command ID`.
- `Action`: `Create approved treatment`, `Update production material`, `Advance status` or `Repair link`.
- `Approved Channel Proposal`.
- `Content Doc Payload`: required only when material is written.
- `Required Gate Evaluations`.
- `Current Status`.
- `Requested Status`.
- `Existing Tracker Row Identifier`: when present.
- `Existing Content Doc Identifier`: when present.
- `Idempotency Key`: channel plus exact topic, approach, category and format.

Operations returns observed row/Doc identifiers, performed/no-op result, before/after status and any failure condition. A failed command leaves the prior state unchanged.
