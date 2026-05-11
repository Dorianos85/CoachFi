create table if not exists public.leaderboard (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  score integer not null default 0 check (score >= 0 and score <= 100),
  streak integer not null default 0 check (streak >= 0 and streak <= 3650),
  updated_at timestamptz not null default now()
);

create index if not exists leaderboard_score_idx
  on public.leaderboard (score desc, updated_at desc);

create unique index if not exists leaderboard_name_lower_idx
  on public.leaderboard (lower(name));

alter table public.leaderboard enable row level security;

drop policy if exists "leaderboard read all" on public.leaderboard;
create policy "leaderboard read all"
  on public.leaderboard
  for select
  using (true);

-- Writes should go through /api/leaderboard with SUPABASE_SERVICE_ROLE_KEY.
-- Do not enable direct anonymous insert/update policies for production.
