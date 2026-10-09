-- Local development accounts. Same rows as supabase/accounts.sql.
-- SQLite has no row-level security. Only server code in this repo opens the file.
-- Snapshot version 1 may hold profile, SRS cards, manual stage progress, streak,
-- token balance, avatar, vault, and challenge day.
-- Leave out consent, voice settings, and health fields unless persistHealth is on.

create table if not exists accounts (
  privy_user_id text primary key,
  email text,
  display_name text,
  created_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

create table if not exists account_state (
  privy_user_id text primary key references accounts (privy_user_id) on delete cascade,
  state text not null default '{}',
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- One row per user and certificate. status is owned or transferred.
-- A transfer keeps the row and updates status and owner_address.
create table if not exists certificates (
  privy_user_id text not null references accounts (privy_user_id) on delete cascade,
  certificate_id text not null check (certificate_id in ('money-mindset', 'saving-habit', 'inflation-fighter')),
  status text not null check (status in ('owned', 'transferred')),
  asset_address text not null,
  owner_address text not null,
  tx_hash text,
  chain_checked_at text,
  updated_at text not null default (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  primary key (privy_user_id, certificate_id)
);
