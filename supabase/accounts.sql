-- Private Coach FI accounts. The id is the Privy user id from a verified access token.
-- Writes go through /api/account with SUPABASE_SERVICE_ROLE_KEY.
-- Do not add anon or authenticated policies. Service role bypasses RLS.

create table if not exists public.accounts (
  privy_user_id text primary key,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.account_state (
  privy_user_id text primary key references public.accounts (privy_user_id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.accounts enable row level security;
alter table public.account_state enable row level security;

-- Snapshot version 1 may hold profile, SRS cards, manual stage progress, streak,
-- token balance, avatar, vault, and challenge day.
-- Leave out consent, voice settings, and health fields unless persistHealth is on.
