-- PriorAuthIQ V2 post-migration verification queries.
-- Run these in Supabase SQL Editor after the migration. These are read-only.

-- 1. Confirm the V2 columns exist.
select
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name = 'cases'
  and column_name in (
    'schema_version',
    'case_identifier',
    'appointment_at',
    'date_of_service',
    'readiness_status',
    'priority',
    'owner',
    'follow_up_due_at',
    'payer_reference_number',
    'verification_source',
    'human_confirmed',
    'case_data'
  )
order by ordinal_position;

-- 2. Confirm the three required tables exist.
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('cases', 'analysis_logs', 'feedback_entries')
order by table_name;

-- 3. Inspect row counts and migration state.
select
  count(*) as total_cases,
  count(*) filter (where schema_version = 2) as v2_cases,
  count(*) filter (where case_data is not null) as structured_v2_cases,
  count(*) filter (where case_data is null) as legacy_compatible_cases
from public.cases;

-- 4. Confirm no invalid JSON values were stored.
select id, case_identifier
from public.cases
where case_data is not null
  and jsonb_typeof(case_data) <> 'object';

-- Expected: zero rows.

-- 5. Inspect queue-ready top-level fields.
select
  id,
  case_identifier,
  readiness_status,
  priority,
  owner,
  appointment_at,
  follow_up_due_at,
  human_confirmed,
  schema_version
from public.cases
order by updated_at desc
limit 25;

-- 6. Confirm indexes.
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('cases', 'analysis_logs', 'feedback_entries')
order by tablename, indexname;

-- 7. Confirm RLS is enabled.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('cases', 'analysis_logs', 'feedback_entries')
order by c.relname;

-- 8. Confirm policies.
select
  tablename,
  policyname,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('cases', 'feedback_entries')
order by tablename, policyname;
