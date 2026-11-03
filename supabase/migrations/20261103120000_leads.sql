-- Leads captured by the Health Check email gate (POST /api/leads).
-- Stores only: email, locale, marketing consent (+ when it was recorded),
-- score band and source. Never raw money amounts or the exact score.

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (char_length(email) <= 254 and email = lower(email)),
  locale text not null default 'en' check (char_length(locale) <= 10),
  marketing_consent boolean not null default false,
  -- Time the marketing-consent choice (true or false) was recorded.
  marketing_consent_at timestamptz not null default now(),
  score_band text check (score_band in ('0-39', '40-69', '70-100')),
  source text not null default 'health-check' check (source in ('health-check', 'other')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);

-- RLS on with no policies: anon and authenticated roles can neither read nor
-- write. Inserts go through /api/leads with SUPABASE_SERVICE_ROLE_KEY.
alter table public.leads enable row level security;

revoke all on table public.leads from anon, authenticated;
grant select, insert, update, delete on table public.leads to service_role;
