-- Private Coach FI accounts. The id is the Coinbase CDP user id from a verified access token.
-- Writes go through /api/account with SUPABASE_SERVICE_ROLE_KEY.
-- Do not add anon or authenticated policies. Service role bypasses RLS.

create table if not exists public.accounts (
  cdp_user_id text primary key,
  email text,
  display_name text,
  solana_address text,
  evm_address text,
  auth_provider text,
  cdp_created_at timestamptz,
  last_authenticated_at timestamptz,
  cdp_profile jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.account_state (
  cdp_user_id text primary key references public.accounts (cdp_user_id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Learning progress loaded back into the browser on sign-in.
create table if not exists public.progress (
  cdp_user_id text primary key references public.accounts (cdp_user_id) on delete cascade,
  srs jsonb,
  learn_manual jsonb,
  tokens integer,
  streak jsonb,
  updated_at timestamptz not null default now()
);

-- One row per user and certificate. status is owned or transferred.
-- A transfer keeps the row and updates status and owner_address.
-- Writes go through server helpers with the service role. No client policies.
create table if not exists public.certificates (
  cdp_user_id text not null references public.accounts (cdp_user_id) on delete cascade,
  certificate_id text not null check (certificate_id in ('money-mindset', 'saving-habit', 'inflation-fighter')),
  status text not null check (status in ('owned', 'transferred')),
  minted boolean not null default false,
  asset_address text not null,
  owner_address text not null,
  tx_hash text,
  chain_checked_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (cdp_user_id, certificate_id)
);

alter table public.accounts enable row level security;
alter table public.account_state enable row level security;
alter table public.progress enable row level security;
alter table public.certificates enable row level security;

alter table public.certificates add column if not exists minted boolean not null default false;
update public.certificates set minted = true where status = 'owned' and minted = false;

-- Snapshot version 1 may hold profile, SRS cards, manual stage progress, streak,
-- token balance, avatar, vault, and challenge day.
-- Leave out consent, voice settings, and health fields unless persistHealth is on.

alter table public.accounts add column if not exists solana_address text;
alter table public.accounts add column if not exists evm_address text;
alter table public.accounts add column if not exists auth_provider text;
alter table public.accounts add column if not exists cdp_created_at timestamptz;
alter table public.accounts add column if not exists last_authenticated_at timestamptz;
alter table public.accounts add column if not exists cdp_profile jsonb;

-- Existing databases created with the old column name.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'accounts' and column_name = 'privy_user_id'
  ) then
    alter table public.accounts rename column privy_user_id to cdp_user_id;
    alter table public.account_state rename column privy_user_id to cdp_user_id;
    alter table public.certificates rename column privy_user_id to cdp_user_id;
  end if;
end $$;
