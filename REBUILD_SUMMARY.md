# PriorAuthIQ V2 Rebuild Summary

## Framework and original structure

- Framework: Next.js 16 App Router with React 19 and TypeScript.
- Styling: Tailwind CSS 4.
- Authentication/database: Supabase.
- Homepage: `app/page.tsx`.
- Dashboard: `app/dashboard/page.tsx`.
- New review workflow: `app/new-case/page.tsx`.
- Case workspace: `app/cases/[id]/page.tsx`.
- Fictional sample data: `lib/demoCases.ts`.
- Readiness analysis: `lib/readinessEngine.ts` and `app/api/analyze/route.ts`.
- Database mapping: `lib/supabaseCases.ts`.
- Core domain types: `lib/types.ts`.

## Product decisions implemented

1. Replaced generic high/medium/low denial-risk scoring with operational readiness states.
2. Made eligibility and benefits the first review layer.
3. Added Coordination of Benefits.
4. Added CPT-specific coverage, authorization, referral, limits, and patient responsibility.
5. Added a separate ICD-10 and diagnosis-support section.
6. Added authorization and referral details with dates, approved codes, units, letters, and sources.
7. Added a configurable document checklist.
8. Added payer evidence, source states, reference numbers, applicable dates, and human confirmation.
9. Added a consolidated exception queue.
10. Added owner, priority, due date, payer response, resolution notes, and exception status.
11. Added audit history and a printable Benefits Verification Record.
12. Added physical therapy, behavioral-health, and pain-management fictional cases.
13. Preserved human review and explicit uncertainty.
14. Prevented the engine from turning manual notes into unsupported payer facts.
15. Kept the product usable without login; Supabase is required only for saving and admin features.

## Status model

- Ready
- Ready with warning
- Insurance Query
- Authorization Query
- Referral Query
- Missing Documentation
- Manual Review Required
- Blocked

## Evidence states

- Verified from payer
- Verified from EHR
- Verified by payer phone call
- Uploaded payer document
- Manually entered
- Conflicting sources
- Not verified
- Insufficient information

## Key files replaced or added

### Replaced

- `app/page.tsx`
- `app/dashboard/page.tsx`
- `app/new-case/page.tsx`
- `app/cases/[id]/page.tsx`
- `app/layout.tsx`
- `app/globals.css`
- `app/api/analyze/route.ts`
- `components/AppShell.tsx`
- `components/CaseCard.tsx`
- `lib/types.ts`
- `lib/supabaseCases.ts`
- `lib/supabaseClient.ts`
- `README.md`

### Added

- `components/StatusBadge.tsx`
- `lib/readinessEngine.ts`
- `lib/demoCases.ts`
- `.env.example`
- `SUPABASE_SETUP.md`
- `supabase/migrations/20260716_priorauthiq_v2.sql`
- `supabase/verify_v2.sql`
- `REBUILD_SUMMARY.md`

### Updated for the new language

- `app/feedback/page.tsx`
- `app/feedback-inbox/page.tsx`
- `app/login/page.tsx`
- `app/usage/page.tsx`

## Review engine behavior

The engine is deterministic and evidence-first. It can flag:

- incomplete fictional demographics;
- missing member ID;
- inactive, unverified, or conflicting eligibility;
- unresolved COB;
- unknown or unsupported network status;
- incomplete patient responsibility;
- missing payer evidence or reference number;
- missing or noncovered CPTs;
- unknown or unresolved CPT-specific authorization/referral requirements;
- exhausted or approaching visit/unit limits;
- missing diagnosis information or diagnosis support;
- missing required documents;
- authorization date, code, unit, or letter problems.

It does not claim to know a payer rule unless the structured fictional case says the rule was verified from a source.

## Database strategy

The migration preserves the old schema and adds:

- indexed operational fields for queue filtering;
- a `case_data` JSONB column for the complete V2 case;
- safe legacy-row compatibility;
- user-owned RLS policies;
- usage and feedback table setup;
- an automatic `updated_at` trigger.

The old columns are intentionally retained during validation. Do not remove them until the V2 workflow has been tested and existing demo rows have been recreated or intentionally retired.

## Validation completed

- ESLint passed.
- Next.js production build passed.
- All main routes returned HTTP 200 in a local production server.
- A fully verified fictional case returned `Ready` with zero exceptions.
- An incomplete fictional case returned `Blocked` with ten specific exceptions across eligibility, COB, coverage, authorization, referral, documentation, network, and workflow.
- `npm audit --omit=dev` returned zero vulnerabilities after safely overriding PostCSS to 8.5.16.

## Deliberate non-features

This version does not add:

- real PHI support;
- automatic payer submissions;
- live payer scraping;
- final coding or medical-necessity decisions;
- a universal payer-rule database;
- a full appeals or denial-management suite;
- deep EHR integration;
- payments;
- enterprise analytics.

Those should wait until the fake-data workflow is tested against experienced manual reviewers.
