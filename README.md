# HireNudge Creatives

This project runs HireNudge's weekly social-content workflow across LinkedIn, YouTube, Instagram and X.

## Content operations application

The production-ready web workspace is in [`web/`](web/README.md). It provides the Idea Wall, mandatory eight-group internet research coverage, gated approvals, immutable draft versions, Google Docs/Sheets sync and cadence-aware scheduling. The application database is interactive state; the manifest's native Google Sheet and production Docs remain the required operational mirror and handoff layer.

## Agent system

Normal content work starts with [`agents/content-director.md`](agents/content-director.md). The Director coordinates five specialist roles and the Content Operations Bot using [`agents/handoff-contracts.md`](agents/handoff-contracts.md). [`system/content-gates.json`](system/content-gates.json) is the canonical G0–G9 registry; run `python3 scripts/validate_content_system.py` plus the unit suite after structural changes.

Only Operations may mutate routine tracker/production-Doc state. The Content Systems Architect is invoked for structural changes or conflicts, not ordinary content approval. The controlled test is not yet complete; it must stop at G3 before any test row or Doc is created.

## Source of truth

- Open the Google Sheet and Docs listed in [`system/drive-manifest.json`](system/drive-manifest.json).
- Google Drive workspace: [HireNudge Creatives](https://drive.google.com/drive/folders/1YmGS569qImWr5ht2W0WXWW6GJ6kEHZJc)
- Current master index: [HireNudge Content Tracker](https://docs.google.com/spreadsheets/d/1OlCaxvJeUdgLvz25mvP11ZloTbQ550EzZGJXnPf6NZo/edit). The previous Week 01 Sheet is retained as `drive.legacyMasterSheet` for read-only recovery and is not the operational tracker.
- Product reference: [HireNudge Product Truth](https://docs.google.com/spreadsheets/d/1LmCE-H3E6SdDURC1sOzNpYZwj2Z493hkRfusd4jTkME/edit)
- Use the master Sheet for asset IDs, status, production links and duplicate checks.
- Use the Product Truth Sheet for capability status, safe product wording, limitations, claim conflicts and evidence sources.
- Use the shared weekly Research and Selection Doc to choose one evidence-backed concept.
- Use each channel's Production Brief for hooks, copy, scripts, visuals, voiceover, captions, claims and approvals.

## Legacy Week 01 state

Week 01 is a structure-only setup. No topic, hook or script is approved yet. Every asset remains in `Research backlog` until weekly options are researched and selected.

## Legacy status flow

`Research backlog` → `Options ready` → `Selected` → `Brief ready` → `In production` → `Review` → `Approved` → `Scheduled` → `Published`

Use `Hold` when evidence, consent, route accuracy, product capability or production quality is unresolved.

The implemented v1 agent contract and current tracker use `Approved Topic` → `Drafting` → `Review` → `Ready`. `Published` remains available for Priyansh's later manual recordkeeping; agents cannot set it.

## Add a week

1. Duplicate the Week 01 Drive folder structure.
2. Add four channel tabs and one registry block for the new week.
3. Create new Asset IDs and one provisional Parent Pack ID.
4. Research three options in the shared weekly Doc.
5. Select one option only after the duplicate check passes.
6. Fill the channel Docs, then advance statuses in the Sheet.

Do not copy a previous week's content into a new week and rename it.

## Codex project handoff

New tasks in the `Hirenudge Creatives` Codex project should read `AGENTS.md`, then [`system/project-handoff.md`](system/project-handoff.md), before changing the Sheet or Docs.
