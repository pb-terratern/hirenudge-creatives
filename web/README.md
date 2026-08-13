# HireNudge Content Operations Tool

Single-owner Next.js application for evidence-led content ideation, gated approvals, immutable drafting, Google Workspace production handoff and weekly scheduling.

## Local setup

1. Copy `.env.example` to `.env.local` and provide the private credentials.
2. Run `npm install`.
3. Run `npm run db:migrate` against a Neon Postgres database (requires the standard `psql` client).
4. Run `npm run dev`.
5. Connect Google Workspace from Settings. OAuth requests offline access; the encrypted refresh token stays server-side.

Copy `OPERATIONAL_SHEET_ID`, `PRODUCT_TRUTH_SHEET_ID`, and `PRODUCTION_FOLDER_ID` from the authoritative repository `system/drive-manifest.json` into the deployment environment. Public demos may set `NEXT_PUBLIC_DEMO_MODE=true` and `DEMO_PUBLIC_ACCESS=true`; both must be false for the connected production tool.

Google writes and daily generation are both off by default. Set `ENABLE_GOOGLE_WRITES=true` only after test Sheet/Doc verification, and `ENABLE_DAILY_GENERATION=true` only after one successful manual batch.

## Required research coverage

Every idea generation run checks and records eight groups: primary/official sources, broad web/news, X, LinkedIn, YouTube, Instagram, Reddit and relevant specialist sources. Platform access failures remain visible and prevent the idea from being presented as fully validated. Social listening informs applicant language and problems; it cannot independently prove legal, visa, tax, labour-market or product claims.

## Verification

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

The repository-level content system must also pass `python3 scripts/validate_content_system.py` and `python3 -m unittest -v` from the project root.
