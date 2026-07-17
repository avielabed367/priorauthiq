# PriorAuthIQ V2 Supabase Setup

This build preserves the existing `cases` table and adds the V2 readiness fields. It does not delete the older columns, so existing demo rows remain readable while you validate the new workflow.

## Before running anything

1. Open the current Supabase project.
2. In **Database → Backups**, confirm a recent backup exists. On a free project, export the `cases`, `feedback_entries`, and `analysis_logs` tables before changing the schema.
3. Confirm this database contains only fake/sample or properly de-identified data. Do not migrate real patient information into this demo.

## Run the migration

1. Open **SQL Editor** in Supabase.
2. Create a new query.
3. Paste the complete contents of:
   `supabase/migrations/20260716_priorauthiq_v2.sql`
4. Run it once.

The migration is designed to be rerunnable. It:

- keeps every old `cases` column;
- adds searchable V2 operational columns;
- adds `case_data` JSONB for the complete structured case;
- backfills safe metadata for legacy rows without pretending they are fully migrated;
- adds indexes for the exception queue;
- resets older demo policies and enables strict user-owned row-level security;
- creates or verifies the usage and feedback tables.

## Verify the migration

1. Open a second SQL Editor tab.
2. Run `supabase/verify_v2.sql`.
3. Check that:
   - all three required tables appear;
   - `case_data` is a `jsonb` column;
   - RLS is enabled;
   - the expected case and feedback policies appear;
   - the invalid JSON query returns zero rows.

Legacy rows are expected to show `case_data = null`. The app loads them through a compatibility mapper and tells the reviewer to rerun them through V2.

## Add environment variables

For local development, copy `.env.example` to `.env.local` and replace the placeholders.

For Vercel, add the same variables under **Project Settings → Environment Variables**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DAILY_ANALYSIS_LIMIT` (optional; defaults to 50 in the review route)

The service-role key is server-only. Never prefix it with `NEXT_PUBLIC_` and never put it in client code.

No OpenAI key is required for the V2 readiness review. The core review is deterministic and evidence-first so the demo does not invent payer requirements.

## Authentication

Supabase email/password authentication is used only to save and edit fictional reviews. The built-in demo cases and readiness review can be explored without logging in.

For a private testing phase, disable public sign-ups in Supabase Auth or restrict access through your deployment settings.

## First post-deployment test

1. Open the homepage and confirm the fake-data warning is visible.
2. Open **New Review** and load the PT sample.
3. Run the readiness review.
4. Confirm unresolved COB, CPT, authorization/referral, document, and evidence items appear as exceptions.
5. Log in and save a copy.
6. Change an exception owner, deadline, status, payer response, and resolution note.
7. Save again and refresh the page.
8. Print the Benefits Verification Record.
9. Open the dashboard and confirm the case is filterable by status, priority, owner, and query type.

## Rollout rule

Use this in shadow mode beside an existing workflow. It is not a replacement for payer verification, coding judgment, medical judgment, or the current billing system. Human review remains mandatory.
