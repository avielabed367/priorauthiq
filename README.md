# PriorAuthIQ V2

PriorAuthIQ V2 is a fake-data pre-visit case-readiness and exception-management demo for billing and RCM teams.

It helps a reviewer organize:

- date-of-service eligibility and benefits;
- Coordination of Benefits;
- network status and patient responsibility;
- CPT-specific coverage, authorization, referral, and visit/unit limits;
- ICD-10 information and supporting documentation;
- payer evidence, source dates, and reference numbers;
- unresolved exceptions, owners, priorities, and deadlines;
- human decisions, resolution notes, and audit history.

The product principle is: **readiness over generic risk scoring, evidence over unsupported claims, and visible exceptions over memory-based follow-up.**

## Safety boundary

This project is a fake/sample-data demo only.

Do not enter real names, addresses, dates of birth, member IDs, insurance-card images, medical records, or other protected health information. PriorAuthIQ does not make final payer, medical, coding, legal, or coverage decisions. Human review is required.

## What changed in V2

The old broad high/medium/low denial-risk cards were replaced by an operational workflow:

1. Review a fictional case.
2. Verify the available evidence.
3. Show Ready, Query, Warning, Manual Review, or Blocked status.
4. Create one exception for every unresolved check.
5. Assign an owner, priority, and due date.
6. Record payer response and resolution.
7. Preserve a printable Benefits Verification Record and audit history.

The review engine is deterministic. It flags only structured facts and missing evidence supplied in the case. It does not use a language model to invent payer rules.

## Included fictional workflows

- Physical therapy
- Behavioral health
- Pain management

These are demonstration cases, not validated payer rules or universal specialty templates.

## Tech stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase Auth and Postgres
- `pdf-parse` for the existing fake-document extraction endpoint

## Important routes

- `/` — product homepage
- `/new-case` — guided fictional case review
- `/dashboard` — case and exception queue
- `/cases/[id]` — full readiness workspace
- `/feedback` — workflow feedback form
- `/feedback-inbox` — admin feedback inbox
- `/usage` — admin review-usage monitor

## Local setup

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Then open `http://localhost:3000`.

The UI and built-in fictional cases work without a configured Supabase project. Saving, authentication, feedback storage, and admin usage monitoring require Supabase.

## Supabase migration

Read `SUPABASE_SETUP.md`, then run these files in order:

1. `supabase/migrations/20260716_priorauthiq_v2.sql`
2. `supabase/verify_v2.sql`

The migration is backward-compatible: it preserves the legacy fields and stores the complete V2 case in `case_data` JSONB while duplicating important queue fields into indexed columns.

## Quality checks

```bash
npm run lint
npm run build
```

## Deployment

Deploy the project to Vercel and configure:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DAILY_ANALYSIS_LIMIT` (optional)

No `OPENAI_API_KEY` is required for V2.

## Validation target

The first useful measurement is not a promise of denial reduction. Test whether the workflow reduces the percentage of exceptions that remain unresolved as the service deadline approaches, without creating extra work for the reviewer.
