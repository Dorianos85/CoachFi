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

-- One row per user and certificate. status is owned or transferred.
-- A transfer keeps the row and updates status and owner_address.
-- Writes go through server helpers with the service role. No client policies.
create table if not exists public.certificates (
  privy_user_id text not null references public.accounts (privy_user_id) on delete cascade,
  certificate_id text not null check (certificate_id in ('money-mindset', 'saving-habit', 'inflation-fighter')),
  status text not null check (status in ('owned', 'transferred')),
  asset_address text not null,
  owner_address text not null,
  tx_hash text,
  chain_checked_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (privy_user_id, certificate_id)
);

alter table public.accounts enable row level security;
alter table public.account_state enable row level security;
alter table public.certificates enable row level security;

-- Snapshot version 1 may hold profile, SRS cards, manual stage progress, streak,
-- token balance, avatar, vault, and challenge day.
-- Leave out consent, voice settings, and health fields unless persistHealth is on.
