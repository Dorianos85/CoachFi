create table if not exists public.coachfi_accounts (
cdp_user_id text primary key, email text, display_name text, solana_address text, evm_address text,
auth_provider text, cdp_created_at timestamptz, last_authenticated_at timestamptz, cdp_profile jsonb,
created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.coachfi_account_state (
cdp_user_id text primary key references public.coachfi_accounts(cdp_user_id) on delete cascade,
state jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now());
create table if not exists public.coachfi_progress (
cdp_user_id text primary key references public.coachfi_accounts(cdp_user_id) on delete cascade,
srs jsonb, learn_manual jsonb, tokens integer check(tokens is null or tokens >= 0), streak jsonb,
updated_at timestamptz not null default now());
create table if not exists public.coachfi_certificates (
cdp_user_id text not null references public.coachfi_accounts(cdp_user_id) on delete cascade,
certificate_id text not null check(certificate_id in ('money-mindset','saving-habit','inflation-fighter')),
status text not null check(status in ('owned','transferred')), minted boolean not null default false,
asset_address text not null, owner_address text not null, tx_hash text, chain_checked_at timestamptz,
updated_at timestamptz not null default now(), primary key(cdp_user_id,certificate_id));
create index if not exists coachfi_accounts_updated_idx on public.coachfi_accounts(updated_at desc);
create index if not exists coachfi_accounts_auth_idx on public.coachfi_accounts(last_authenticated_at desc);
alter table public.coachfi_accounts enable row level security;
alter table public.coachfi_account_state enable row level security;
alter table public.coachfi_progress enable row level security;
alter table public.coachfi_certificates enable row level security;
revoke all on public.coachfi_accounts, public.coachfi_account_state, public.coachfi_progress, public.coachfi_certificates from anon, authenticated;
grant select,insert,update,delete on public.coachfi_accounts, public.coachfi_account_state, public.coachfi_progress, public.coachfi_certificates to service_role;
notify pgrst, 'reload schema';
