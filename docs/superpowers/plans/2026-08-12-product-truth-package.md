# HireNudge Product Truth Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a standalone, evidence-backed Google Sheet that tells the HireNudge content system which product capabilities and claims are safe to use, qualify or block.

**Architecture:** Build one native Google Sheet with exactly three tabs: `Capabilities`, `Claims & Conflicts` and `Source Register`. The Sheet is the canonical product-truth reference; the repository stores only its Drive identifier and the agent rules for consulting it, so product data is not duplicated locally.

**Tech Stack:** Google Sheets, Google Drive, local `.xlsx` staging with `@oai/artifact-tool`, JSON manifest and Markdown operating rules.

## Global Constraints

- Preserve the publishing tracker as a separate, simple operational artifact.
- Treat the supplied Nudge Studio screenshots as evidence of a development build, not public-production verification.
- Use only these truth statuses: `Verified Live`, `Owner Confirmed Live`, `Demonstrated in Development`, `Publicly Claimed`, `Planned or Proposed`, and `Blocked or Unknown`.
- Use only these claim decisions: `Approved`, `Qualify`, and `Block`.
- Do not convert recommendations, workbook proposals, testimonials or marketing wording into verified product facts.
- Do not store user resumes, personal data, credentials or private application information in the Product Truth Sheet.
- The local repository may store the Sheet ID, URL and operating rules, but must not duplicate the product-truth rows.

---

### Task 1: Build and verify the three-tab workbook

**Files:**
- Create: temporary conversation-scoped workbook builder
- Create: `outputs/<thread>/HireNudge Product Truth.xlsx`

**Interfaces:**
- Consumes: the approved three-tab schema, the current HireNudge strategy workbook, public product pages and policies, and the 20 user-supplied Nudge Studio screenshots.
- Produces: a visually verified `.xlsx` with populated evidence rows, finite status/decision dropdowns, frozen headers, filters and source URLs.

- [ ] **Step 1: Create the workbook with exact headers**

  Use these columns:

  - `Capabilities`: `Module`, `Capability`, `User Value`, `Truth Status`, `Environment`, `Safe Wording`, `Limitations`, `Evidence Source`, `Last Verified`
  - `Claims & Conflicts`: `Module`, `Existing Claim`, `Evidence`, `Conflict`, `Decision`, `Replacement Wording`, `Last Reviewed`
  - `Source Register`: `Source ID`, `Source`, `Source Type`, `Authority`, `Applicable Modules`, `Accessed / Verified`, `Notes`

- [ ] **Step 2: Populate the capability inventory**

  Record current evidence for Landing and Activation, Onboarding and Tour, Dashboard, Resume Nudge, Nudge Studio, AI Job Matcher, Job Supply and Freshness, Email Outreach, Job Tracker, Interview Prep, browser extension, LinkedIn Optimizer, pricing and credits. Use the narrowest supportable status for every row.

- [ ] **Step 3: Populate claim conflicts and safe replacements**

  Include public outcome/testimonial claims, ATS guarantees and universal parsing language, auto-apply or auto-submit implications, automatic inbox-status coverage, job freshness, Nudge Studio availability, job-link fetching, exports, direct LinkedIn import, pricing contradictions and employment guarantees.

- [ ] **Step 4: Populate the source register**

  Include the strategy workbook, supplied Figma URL, supplied Nudge Studio screenshots, official website feature pages, pricing, privacy policy, terms of use and Chrome Web Store listing. Record the evidence scope and authority rather than applying one global source hierarchy.

- [ ] **Step 5: Add operational formatting and controls**

  Freeze row 1, enable filters, wrap long text, set readable widths, use restrained HireNudge blue headers, apply dropdown validation to `Truth Status` and `Decision`, and apply conditional colours that distinguish approved, qualified and blocked material.

- [ ] **Step 6: Inspect data and render every populated tab**

  Verify headers, representative rows, URLs, validation options and date formats. Scan for formula errors, clipped text and unreadable wrapping; repair severe defects before export.

### Task 2: Import and verify the canonical native Google Sheet

**Files:**
- No repository file changes.

**Interfaces:**
- Consumes: the verified `.xlsx` from Task 1.
- Produces: a standalone native Google Sheet named `HireNudge Product Truth` with a stable Drive ID and URL.

- [ ] **Step 1: Import with native conversion**

  Import the `.xlsx` using `upload_mode: native_google_sheets` and confirm the result is `application/vnd.google-apps.spreadsheet`.

- [ ] **Step 2: Read metadata and bounded ranges**

  Confirm that the three expected tabs exist, their used ranges match the authored tables, and the content is populated.

- [ ] **Step 3: Verify Google-rendered structure**

  Inspect each tab at normal zoom when available. Confirm frozen headers, filters, dropdowns, wrapping and legibility survived conversion.

- [ ] **Step 4: Move the Sheet into the HireNudge Creatives Drive folder**

  Add parent folder `1YmGS569qImWr5ht2W0WXWW6GJ6kEHZJc`, preserve unrelated parents and verify the file appears in the target folder.

### Task 3: Connect the Product Truth Sheet to the content-agent system

**Files:**
- Modify: `system/drive-manifest.json`
- Modify: `AGENTS.md`
- Modify: `README.md`
- Modify: `system/project-handoff.md`
- Modify: `docs/superpowers/specs/2026-08-12-content-agent-system-design.md`

**Interfaces:**
- Consumes: the verified Sheet ID and URL from Task 2.
- Produces: one canonical manifest reference and consistent pre-draft/review rules for product-led content.

- [ ] **Step 1: Add the Drive identifier**

  Add `drive.productTruth` with the observed name, ID and URL. Do not replace or reinterpret `drive.masterSheet` in this task.

- [ ] **Step 2: Add source-of-truth rules**

  State that the publishing tracker controls content status and production links, while the Product Truth Sheet controls product capability and claim wording. Require the current row and `Last Verified` date to be checked before product-led drafting.

- [ ] **Step 3: Add agent enforcement**

  Require Research to cite a capability row and source, Production to use `Safe Wording`, Editorial to enforce limitations and blocked claims, and Operations to avoid changing product-truth decisions.

- [ ] **Step 4: Validate repository references**

  Run `python3 -m json.tool system/drive-manifest.json`, search for stale statements that imply workbook recommendations are shipped functionality, and inspect the diff for unrelated changes.

### Task 4: Run the final evidence audit

**Files:**
- No new files.

**Interfaces:**
- Consumes: the native Product Truth Sheet and updated repository rules.
- Produces: a completion report that distinguishes what was created from what remains unverified.

- [ ] **Step 1: Re-read representative rows**

  Check at least one row each for Nudge Studio, Job Matcher, Email Outreach, Job Tracker, Interview Prep, extension and pricing.

- [ ] **Step 2: Test the main safety boundaries**

  Confirm Nudge Studio is `Demonstrated in Development`, no ATS or employment guarantee is approved, extension wording does not imply auto-submit, and policy constraints are represented.

- [ ] **Step 3: Confirm source separation**

  Verify the Product Truth Sheet is separate from the publishing tracker and that no product rows were copied into local rule files.

- [ ] **Step 4: Report the remaining verification queue**

  Identify capabilities that still require current-production testing, product-owner confirmation, export testing, job-link testing, scoring-method review or claim substantiation.
