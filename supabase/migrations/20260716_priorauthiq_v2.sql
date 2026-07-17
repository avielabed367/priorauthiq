-- PriorAuthIQ V2 migration
-- Date: 2026-07-16
-- Purpose: migrate the fake-data demo from a generic risk-score model to a
-- pre-visit case-readiness and exception-management model.
--
-- Safe rollout strategy:
-- 1. Existing legacy columns are preserved.
-- 2. V2 data is stored in case_data JSONB plus queryable operational columns.
-- 3. Existing rows remain readable through the application's compatibility mapper.
-- 4. Real PHI must not be used in this demo database.

begin;

create extension if not exists pgcrypto;

-- Create the base table only when this is a new Supabase project. Existing
-- projects keep their current table and receive the V2 columns below.
create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  patient_label text not null default '',
  payer text not null default '',
  service text not null default '',
  denial_reason text,
  status text not null default 'Manual Review Required',
  urgency text,
  missing_items text[] not null default '{}',
  summary text,
  appeal_draft text,
  denial_text text,
  notes_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Queryable V2 columns. The full structured case is stored in case_data.
alter table public.cases
  add column if not exists schema_version integer not null default 1,
  add column if not exists case_identifier text,
  add column if not exists practice_name text,
  add column if not exists appointment_at timestamptz,
  add column if not exists date_of_service date,
  add column if not exists specialty text,
  add column if not exists provider_name text,
  add column if not exists facility_name text,
  add column if not exists readiness_status text,
  add column if not exists priority text,
  add column if not exists owner text,
  add column if not exists follow_up_due_at timestamptz,
  add column if not exists payer_reference_number text,
  add column if not exists verification_source text,
  add column if not exists human_confirmed boolean not null default false,
  add column if not exists human_confirmed_at timestamptz,
  add column if not exists case_data jsonb;

-- Backfill only searchable metadata for legacy rows. case_data intentionally
-- remains NULL so the application knows to use the legacy compatibility mapper.
update public.cases
set
  schema_version = coalesce(schema_version, 1),
  case_identifier = coalesce(
    nullif(case_identifier, ''),
    'LEGACY-' || upper(left(id::text, 8))
  ),
  practice_name = coalesce(nullif(practice_name, ''), 'Sample Practice'),
  appointment_at = coalesce(appointment_at, created_at),
  date_of_service = coalesce(date_of_service, created_at::date),
  specialty = coalesce(nullif(specialty, ''), 'Legacy workflow'),
  readiness_status = coalesce(
    nullif(readiness_status, ''),
    case
      when status in (
        'Ready',
        'Ready with warning',
        'Insurance Query',
        'Authorization Query',
        'Referral Query',
        'Missing Documentation',
        'Manual Review Required',
        'Blocked'
      ) then status
      else 'Manual Review Required'
    end
  ),
  priority = coalesce(nullif(priority, ''), 'Soon'),
  owner = coalesce(nullif(owner, ''), 'Human Reviewer'),
  follow_up_due_at = coalesce(follow_up_due_at, updated_at, created_at),
  payer_reference_number = coalesce(payer_reference_number, ''),
  verification_source = coalesce(
    nullif(verification_source, ''),
    'Insufficient information'
  )
where
  schema_version is null
  or case_identifier is null
  or readiness_status is null
  or priority is null
  or owner is null;

-- Helpful indexes for the operational queue. These indexes avoid assuming that
-- case identifiers are globally unique across users.
create index if not exists cases_user_appointment_idx
  on public.cases (user_id, appointment_at);

create index if not exists cases_user_readiness_idx
  on public.cases (user_id, readiness_status);

create index if not exists cases_user_priority_due_idx
  on public.cases (user_id, priority, follow_up_due_at);

create index if not exists cases_user_identifier_idx
  on public.cases (user_id, case_identifier);

create index if not exists cases_case_data_gin_idx
  on public.cases using gin (case_data);

-- Constraints are added as NOT VALID so existing data is not blocked during the
-- migration. New and updated rows are still checked immediately.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'cases_readiness_status_check'
      and conrelid = 'public.cases'::regclass
  ) then
    alter table public.cases
      add constraint cases_readiness_status_check
      check (
        readiness_status is null
        or readiness_status in (
          'Ready',
          'Ready with warning',
          'Insurance Query',
          'Authorization Query',
          'Referral Query',
          'Missing Documentation',
          'Manual Review Required',
          'Blocked'
        )
      ) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'cases_priority_check'
      and conrelid = 'public.cases'::regclass
  ) then
    alter table public.cases
      add constraint cases_priority_check
      check (
        priority is null
        or priority in (
          'Routine',
          'Soon',
          'Urgent',
          'Appointment within 24 hours',
          'Overdue'
        )
      ) not valid;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'cases_case_data_object_check'
      and conrelid = 'public.cases'::regclass
  ) then
    alter table public.cases
      add constraint cases_case_data_object_check
      check (case_data is null or jsonb_typeof(case_data) = 'object') not valid;
  end if;
end
$$;

-- Keep updated_at accurate without relying on every client call to provide it.
create or replace function public.set_priorauthiq_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_priorauthiq_cases_updated_at on public.cases;
create trigger set_priorauthiq_cases_updated_at
before update on public.cases
for each row execute function public.set_priorauthiq_updated_at();

-- User-owned case access. Reset existing policies so an older permissive demo
-- policy cannot accidentally remain active after this migration.
alter table public.cases enable row level security;

do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'cases'
  loop
    execute format(
      'drop policy if exists %I on public.cases',
      existing_policy.policyname
    );
  end loop;
end
$$;

create policy "Users can read own cases"
on public.cases for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create own cases"
on public.cases for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own cases"
on public.cases for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own cases"
on public.cases for delete
to authenticated
using ((select auth.uid()) = user_id);

-- Analysis/review event log. The service-role server routes write and read this
-- table. No direct browser policies are added.
create table if not exists public.analysis_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  user_email text,
  created_at timestamptz not null default now()
);

create index if not exists analysis_logs_user_created_idx
  on public.analysis_logs (user_id, created_at desc);

alter table public.analysis_logs enable row level security;

do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'analysis_logs'
  loop
    execute format(
      'drop policy if exists %I on public.analysis_logs',
      existing_policy.policyname
    );
  end loop;
end
$$;

-- General product feedback. This table must never receive patient information.
create table if not exists public.feedback_entries (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  role text,
  organization text,
  usefulness text not null default 'Not sure yet',
  biggest_problem text,
  missing_feature text,
  would_use text not null default 'Maybe',
  extra_notes text,
  created_at timestamptz not null default now()
);

create index if not exists feedback_entries_created_idx
  on public.feedback_entries (created_at desc);

alter table public.feedback_entries enable row level security;

do $$
declare
  existing_policy record;
begin
  for existing_policy in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'feedback_entries'
  loop
    execute format(
      'drop policy if exists %I on public.feedback_entries',
      existing_policy.policyname
    );
  end loop;
end
$$;

create policy "Anyone can submit demo feedback"
on public.feedback_entries for insert
to anon, authenticated
with check (true);

create policy "Admin can read feedback"
on public.feedback_entries for select
to authenticated
using (((select auth.jwt()) ->> 'email') = 'avielabed3@gmail.com');

-- Delete is performed by a protected server route using the service-role key.

comment on table public.cases is
  'Fake/de-identified PriorAuthIQ case-readiness records. Do not store real PHI in the demo.';
comment on column public.cases.case_data is
  'V2 structured case, including eligibility, COB, CPT/ICD-10, authorization, documents, evidence, exceptions, and audit history.';
comment on table public.feedback_entries is
  'General workflow feedback only. Do not submit patient or clinic-confidential information.';

commit;
