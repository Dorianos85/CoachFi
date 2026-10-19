-- ============================================================================
-- CoachFI — pełny schemat bazy Supabase
-- Wklej całość do Supabase SQL Editor i uruchom (Run).
-- Skrypt jest idempotentny — można go uruchomić ponownie bez błędów.
-- ============================================================================

create extension if not exists pgcrypto;

-- ============================================================================
-- 0. Funkcje pomocnicze
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 1. PROFIL UŻYTKOWNIKA (1:1 z auth.users)
--    odpowiednik localStorage: coachfi-user, coachfi-avatar, coachfi-locale,
--    coachfi-voice, coachfi-mode-v1
-- ============================================================================

create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  name            text not null default '',
  goal            text not null default '',
  mode            text not null default 'adult'
                  check (mode in ('adult', 'kids', 'accessibility')),
  locale          text not null default 'en'
                  check (locale in ('en','pl','es','fr','zh','ja','hi','pt-BR','tr')),
  avatar_gender   text check (avatar_gender in ('female','male')),
  avatar_style    text check (avatar_style in ('warrior','explorer','builder')),
  voice_id        text,
  onboarding_done boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using ((select auth.uid()) = id);

-- ============================================================================
-- 2. ZGODY (append-only, wersjonowane)
--    Terms / Privacy / disclaimer edukacyjny / marketing OSOBNO
--    + zgody opcjonalne (AI, voice, ranking, blockchain, zgoda rodzica)
-- ============================================================================

create table if not exists public.consents (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  doc_type    text not null check (doc_type in (
                'terms','privacy','education_disclaimer','marketing',
                'ai','voice','ranking','blockchain','kids_parent','open_banking','ocr'
              )),
  doc_version text not null,
  locale      text not null default 'en',
  granted     boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists consents_user_idx
  on public.consents (user_id, doc_type, created_at desc);

alter table public.consents enable row level security;

drop policy if exists "consents_select_own" on public.consents;
create policy "consents_select_own" on public.consents
  for select using ((select auth.uid()) = user_id);

drop policy if exists "consents_insert_own" on public.consents;
create policy "consents_insert_own" on public.consents
  for insert with check ((select auth.uid()) = user_id);
-- brak update/delete: rejestr zgód jest append-only (wycofanie = nowy wiersz granted=false)

-- ============================================================================
-- 3. ENTITLEMENTS (free / trial / premium) — zapis tylko przez service role
-- ============================================================================

create table if not exists public.entitlements (
  user_id              uuid primary key references auth.users (id) on delete cascade,
  plan                 text not null default 'free'
                       check (plan in ('free','trial','premium')),
  status               text not null default 'active'
                       check (status in ('active','past_due','canceled','expired')),
  trial_started_at     timestamptz,
  trial_ends_at        timestamptz,
  current_period_end   timestamptz,
  billing_provider     text,
  provider_customer_id text,
  updated_at           timestamptz not null default now()
);

drop trigger if exists trg_entitlements_updated_at on public.entitlements;
create trigger trg_entitlements_updated_at
  before update on public.entitlements
  for each row execute function public.set_updated_at();

alter table public.entitlements enable row level security;

drop policy if exists "entitlements_select_own" on public.entitlements;
create policy "entitlements_select_own" on public.entitlements
  for select using ((select auth.uid()) = user_id);
-- brak polityk zapisu: insert/update wyłącznie przez service role (webhooki billingu)

-- ============================================================================
-- 4. ZUŻYCIE AI/TTS/OCR (fair-use, limity trialu)
-- ============================================================================

create table if not exists public.usage_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('ai_chat','tts','ocr','convai','mint')),
  units      integer not null default 1 check (units > 0),
  meta       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_kind_idx
  on public.usage_events (user_id, kind, created_at desc);

alter table public.usage_events enable row level security;

drop policy if exists "usage_select_own" on public.usage_events;
create policy "usage_select_own" on public.usage_events
  for select using ((select auth.uid()) = user_id);

drop policy if exists "usage_insert_own" on public.usage_events;
create policy "usage_insert_own" on public.usage_events
  for insert with check ((select auth.uid()) = user_id);

-- ============================================================================
-- 5. HEALTH CHECK — historia Family Financial Health Score
-- ============================================================================

create table if not exists public.health_checks (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  answers    jsonb not null default '{}'::jsonb,
  score      integer not null check (score between 0 and 100),
  is_final   boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists health_checks_user_idx
  on public.health_checks (user_id, created_at desc);

alter table public.health_checks enable row level security;

drop policy if exists "health_select_own" on public.health_checks;
create policy "health_select_own" on public.health_checks
  for select using ((select auth.uid()) = user_id);

drop policy if exists "health_insert_own" on public.health_checks;
create policy "health_insert_own" on public.health_checks
  for insert with check ((select auth.uid()) = user_id);

-- ============================================================================
-- 6. SRS — karty SM-2 (odpowiednik coachfi-srs / lib/srs.ts)
-- ============================================================================

create table if not exists public.srs_cards (
  user_id       uuid not null references auth.users (id) on delete cascade,
  question_id   text not null,
  interval_days integer not null default 1 check (interval_days >= 1),
  repetitions   integer not null default 0 check (repetitions >= 0),
  ease_factor   numeric(4,2) not null default 2.50 check (ease_factor >= 1.30),
  next_review   date not null default current_date,
  updated_at    timestamptz not null default now(),
  primary key (user_id, question_id)
);

create index if not exists srs_cards_due_idx
  on public.srs_cards (user_id, next_review);

drop trigger if exists trg_srs_cards_updated_at on public.srs_cards;
create trigger trg_srs_cards_updated_at
  before update on public.srs_cards
  for each row execute function public.set_updated_at();

alter table public.srs_cards enable row level security;

drop policy if exists "srs_all_own" on public.srs_cards;
create policy "srs_all_own" on public.srs_cards
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================================
-- 7. POSTĘP ETAPÓW NAUKI (odpowiednik coachfi-learn-manual)
-- ============================================================================

create table if not exists public.stage_progress (
  user_id    uuid not null references auth.users (id) on delete cascade,
  stage_id   text not null check (stage_id in (
               'money-mindset','saving-habit','inflation','credit-rates',
               'emergency-fund','long-term-investing','retirement','family-plan'
             )),
  status     text not null check (status in ('started','completed')),
  updated_at timestamptz not null default now(),
  primary key (user_id, stage_id)
);

drop trigger if exists trg_stage_progress_updated_at on public.stage_progress;
create trigger trg_stage_progress_updated_at
  before update on public.stage_progress
  for each row execute function public.set_updated_at();

alter table public.stage_progress enable row level security;

drop policy if exists "stage_all_own" on public.stage_progress;
create policy "stage_all_own" on public.stage_progress
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- ============================================================================
-- 8. STREAK (odpowiednik coachfi-streak) + RPC liczone po stronie serwera
-- ============================================================================

create table if not exists public.streaks (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  last_active_date date,
  current_streak   integer not null default 0 check (current_streak >= 0),
  longest_streak   integer not null default 0 check (longest_streak >= 0),
  updated_at       timestamptz not null default now()
);

alter table public.streaks enable row level security;

drop policy if exists "streaks_select_own" on public.streaks;
create policy "streaks_select_own" on public.streaks
  for select using ((select auth.uid()) = user_id);

-- Właściciel może zapisywać własny streak (seed z localStorage + mirror).
-- RPC mark_active_today() pozostaje dostępne jako wariant serwerowy.
drop policy if exists "streaks_insert_own" on public.streaks;
create policy "streaks_insert_own" on public.streaks
  for insert with check ((select auth.uid()) = user_id);

drop policy if exists "streaks_update_own" on public.streaks;
create policy "streaks_update_own" on public.streaks
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.mark_active_today()
returns public.streaks
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  result public.streaks;
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.streaks (user_id, last_active_date, current_streak, longest_streak)
  values (uid, current_date, 1, 1)
  on conflict (user_id) do update set
    current_streak = case
      when streaks.last_active_date = current_date     then streaks.current_streak
      when streaks.last_active_date = current_date - 1 then streaks.current_streak + 1
      else 1
    end,
    longest_streak = greatest(streaks.longest_streak, case
      when streaks.last_active_date = current_date     then streaks.current_streak
      when streaks.last_active_date = current_date - 1 then streaks.current_streak + 1
      else 1
    end),
    last_active_date = current_date,
    updated_at = now()
  returning * into result;

  return result;
end;
$$;

revoke all on function public.mark_active_today() from public;
grant execute on function public.mark_active_today() to authenticated;

-- ============================================================================
-- 9. PROFILE DZIECI (Kids Mode — tylko pseudonim, konto pod rodzicem)
-- ============================================================================

create table if not exists public.kids_profiles (
  id         uuid primary key default gen_random_uuid(),
  parent_id  uuid not null references auth.users (id) on delete cascade,
  nickname   text not null check (char_length(nickname) between 1 and 40),
  avatar     jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists kids_profiles_parent_idx
  on public.kids_profiles (parent_id);

alter table public.kids_profiles enable row level security;

drop policy if exists "kids_all_parent" on public.kids_profiles;
create policy "kids_all_parent" on public.kids_profiles
  for all using ((select auth.uid()) = parent_id)
  with check ((select auth.uid()) = parent_id);

-- ============================================================================
-- 10. KSIĘGA NAGRÓD — monety (dorośli) i gwiazdki (dzieci), append-only
-- ============================================================================

create table if not exists public.reward_ledger (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  child_id   uuid references public.kids_profiles (id) on delete cascade,
  unit       text not null check (unit in ('coin','star')),
  amount     integer not null check (amount <> 0),
  reason     text not null,
  source     text not null default 'app' check (source in (
               'daily_challenge','quiz','review','shopping_list','receipt',
               'bottle_return','crisis_step','job_recovery','health_check',
               'streak_bonus','manual','app'
             )),
  meta       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists reward_ledger_user_idx
  on public.reward_ledger (user_id, created_at desc);
create index if not exists reward_ledger_child_idx
  on public.reward_ledger (child_id) where child_id is not null;

alter table public.reward_ledger enable row level security;

drop policy if exists "ledger_select_own" on public.reward_ledger;
create policy "ledger_select_own" on public.reward_ledger
  for select using ((select auth.uid()) = user_id);

drop policy if exists "ledger_insert_own" on public.reward_ledger;
create policy "ledger_insert_own" on public.reward_ledger
  for insert with check (
    (select auth.uid()) = user_id
    and (
      child_id is null
      or exists (
        select 1 from public.kids_profiles k
        where k.id = child_id and k.parent_id = (select auth.uid())
      )
    )
  );
-- brak update/delete: księga jest append-only (korekta = wiersz przeciwny)

-- Saldo monet/gwiazdek
create or replace view public.reward_balances
with (security_invoker = true) as
select user_id, child_id, unit, sum(amount)::bigint as balance
from public.reward_ledger
group by user_id, child_id, unit;

-- ============================================================================
-- 11. DAILY CHALLENGE — jedno wyzwanie dziennie
-- ============================================================================

create table if not exists public.daily_challenges (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  challenge_date date not null default current_date,
  question_id    text not null,
  is_correct     boolean not null,
  reward_coins   integer not null default 0 check (reward_coins >= 0),
  created_at     timestamptz not null default now(),
  unique (user_id, challenge_date)
);

alter table public.daily_challenges enable row level security;

drop policy if exists "challenge_select_own" on public.daily_challenges;
create policy "challenge_select_own" on public.daily_challenges
  for select using ((select auth.uid()) = user_id);

drop policy if exists "challenge_insert_own" on public.daily_challenges;
create policy "challenge_insert_own" on public.daily_challenges
  for insert with check (
    (select auth.uid()) = user_id and challenge_date = current_date
  );

-- ============================================================================
-- 12. HISTORIA QUIZÓW / POWTÓREK
-- ============================================================================

create table if not exists public.quiz_attempts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  kind          text not null default 'quiz' check (kind in ('quiz','review','kids')),
  stage_id      text,
  correct_count integer not null default 0 check (correct_count >= 0),
  total_count   integer not null default 0 check (total_count >= correct_count),
  created_at    timestamptz not null default now()
);

create index if not exists quiz_attempts_user_idx
  on public.quiz_attempts (user_id, created_at desc);

alter table public.quiz_attempts enable row level security;

drop policy if exists "quiz_select_own" on public.quiz_attempts;
create policy "quiz_select_own" on public.quiz_attempts
  for select using ((select auth.uid()) = user_id);

drop policy if exists "quiz_insert_own" on public.quiz_attempts;
create policy "quiz_insert_own" on public.quiz_attempts
  for insert with check ((select auth.uid()) = user_id);

-- ============================================================================
-- 13. CERTYFIKATY NFT (Solana Devnet, Metaplex Core)
-- ============================================================================

create table if not exists public.certificates (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  slug           text not null,
  title          text not null,
  status         text not null default 'locked'
                 check (status in ('locked','ready','minted','mock')),
  wallet_address text,
  tx_hash        text,
  asset_address  text,
  minted_at      timestamptz,
  created_at     timestamptz not null default now(),
  unique (user_id, slug)
);

alter table public.certificates enable row level security;

drop policy if exists "cert_select_own" on public.certificates;
create policy "cert_select_own" on public.certificates
  for select using ((select auth.uid()) = user_id);

drop policy if exists "cert_insert_own" on public.certificates;
create policy "cert_insert_own" on public.certificates
  for insert with check ((select auth.uid()) = user_id);
-- status 'minted' + tx_hash zapisuje /api/mint-nft przez service role

-- ============================================================================
-- 14. SŁOIKI EKERA (6-jar) — salda manualne, gotowe pod Open Banking
-- ============================================================================

create table if not exists public.jars (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  jar_type   text not null check (jar_type in (
               'necessities','financial_freedom','long_term_savings',
               'education','play','give'
             )),
  percent    numeric(5,2) not null check (percent between 0 and 100),
  balance    numeric(14,2) not null default 0,
  currency   text not null default 'PLN' check (char_length(currency) = 3),
  updated_at timestamptz not null default now(),
  unique (user_id, jar_type)
);

drop trigger if exists trg_jars_updated_at on public.jars;
create trigger trg_jars_updated_at
  before update on public.jars
  for each row execute function public.set_updated_at();

alter table public.jars enable row level security;

drop policy if exists "jars_all_own" on public.jars;
create policy "jars_all_own" on public.jars
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.jar_transactions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  jar_id     uuid not null references public.jars (id) on delete cascade,
  amount     numeric(14,2) not null check (amount <> 0),
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists jar_tx_jar_idx
  on public.jar_transactions (jar_id, created_at desc);

alter table public.jar_transactions enable row level security;

drop policy if exists "jar_tx_select_own" on public.jar_transactions;
create policy "jar_tx_select_own" on public.jar_transactions
  for select using ((select auth.uid()) = user_id);

drop policy if exists "jar_tx_insert_own" on public.jar_transactions;
create policy "jar_tx_insert_own" on public.jar_transactions
  for insert with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.jars j
      where j.id = jar_id and j.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- 15. DAILY SHOPPING LIST — listy zakupów i pauza impulsowa
-- ============================================================================

create table if not exists public.shopping_lists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  title      text not null default '',
  list_date  date not null default current_date,
  status     text not null default 'active' check (status in ('active','done','archived')),
  created_at timestamptz not null default now()
);

create index if not exists shopping_lists_user_idx
  on public.shopping_lists (user_id, list_date desc);

alter table public.shopping_lists enable row level security;

drop policy if exists "lists_all_own" on public.shopping_lists;
create policy "lists_all_own" on public.shopping_lists
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.shopping_list_items (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  list_id        uuid not null references public.shopping_lists (id) on delete cascade,
  name           text not null,
  category       text not null default 'grocery'
                 check (category in ('grocery','hygiene','home','other')),
  quantity       integer not null default 1 check (quantity > 0),
  is_checked     boolean not null default false,
  is_off_list    boolean not null default false,  -- zakup impulsowy spoza planu
  price_estimate numeric(12,2),
  created_at     timestamptz not null default now()
);

create index if not exists shopping_items_list_idx
  on public.shopping_list_items (list_id);

alter table public.shopping_list_items enable row level security;

drop policy if exists "list_items_all_own" on public.shopping_list_items;
create policy "list_items_all_own" on public.shopping_list_items
  for all using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.shopping_lists l
      where l.id = list_id and l.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- 16. PARAGONY I FAKTURY — Receipt & Invoice Analyzer
-- ============================================================================

create table if not exists public.receipts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  shopping_list_id uuid references public.shopping_lists (id) on delete set null,
  source           text not null default 'pasted_text'
                   check (source in ('pasted_text','photo','ocr_api')),
  raw_text         text,
  merchant         text,
  total_amount     numeric(12,2),
  currency         text not null default 'PLN' check (char_length(currency) = 3),
  purchased_at     date,
  created_at       timestamptz not null default now()
);

create index if not exists receipts_user_idx
  on public.receipts (user_id, created_at desc);

alter table public.receipts enable row level security;

drop policy if exists "receipts_all_own" on public.receipts;
create policy "receipts_all_own" on public.receipts
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table if not exists public.receipt_items (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id) on delete cascade,
  receipt_id           uuid not null references public.receipts (id) on delete cascade,
  name                 text not null,
  price                numeric(12,2),
  category             text not null default 'other'
                       check (category in ('grocery','hygiene','home','other')),
  classification       text not null default 'unknown'
                       check (classification in ('needed','impulse','unknown')),
  matched_list_item_id uuid references public.shopping_list_items (id) on delete set null,
  created_at           timestamptz not null default now()
);

create index if not exists receipt_items_receipt_idx
  on public.receipt_items (receipt_id);

alter table public.receipt_items enable row level security;

drop policy if exists "receipt_items_all_own" on public.receipt_items;
create policy "receipt_items_all_own" on public.receipt_items
  for all using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.receipts r
      where r.id = receipt_id and r.user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- 17. LEADERBOARD — kompatybilny z istniejącym /api/leaderboard
--     (odczyt publiczny; zapis wyłącznie przez service role)
-- ============================================================================

create table if not exists public.leaderboard (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid unique references auth.users (id) on delete set null,
  name       text not null,
  score      integer not null default 0 check (score between 0 and 100),
  streak     integer not null default 0 check (streak between 0 and 3650),
  updated_at timestamptz not null default now()
);

create index if not exists leaderboard_score_idx
  on public.leaderboard (score desc, updated_at desc);

create unique index if not exists leaderboard_name_lower_idx
  on public.leaderboard (lower(name));

alter table public.leaderboard enable row level security;

drop policy if exists "leaderboard read all" on public.leaderboard;
create policy "leaderboard read all" on public.leaderboard
  for select using (true);
-- brak polityk insert/update: zapisy idą przez /api/leaderboard
-- z SUPABASE_SERVICE_ROLE_KEY (service role omija RLS)

-- ============================================================================
-- 18. AUTOMATYCZNE TWORZENIE PROFILU PO REJESTRACJI
-- ============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', ''))
  on conflict (id) do nothing;

  insert into public.entitlements (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.streaks (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- 19. UPRAWNIENIA RÓL (GRANT)
--     PostgREST łączy się jako anon/authenticated. Oprócz polityk RLS trzeba
--     nadać uprawnienia tabelowe — bez tego pojawia się
--     "permission denied for table ...". RLS dalej filtruje wiersze.
-- ============================================================================

grant usage on schema public to anon, authenticated;

-- Publiczny odczyt tylko dla leaderboard (RLS: select using(true)).
grant select on public.leaderboard to anon;

-- Zalogowany użytkownik operuje na swoich wierszach (RLS pilnuje własności).
grant select, insert, update, delete on all tables in schema public to authenticated;

-- Widok salda nagród.
grant select on public.reward_balances to anon, authenticated;

-- service_role ma pełny dostęp (zapisy serwerowe, omija RLS).
grant all on all tables in schema public to service_role;

-- Domyślne uprawnienia dla przyszłych tabel/widoków w public.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant all on tables to service_role;

-- Funkcje wyzwalaczy/definer nie powinny być wywoływalne przez REST API.
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;

-- ============================================================================
-- Gotowe. Tabele: profiles, consents, entitlements, usage_events,
-- health_checks, srs_cards, stage_progress, streaks, kids_profiles,
-- reward_ledger (+ widok reward_balances), daily_challenges, quiz_attempts,
-- certificates, jars, jar_transactions, shopping_lists, shopping_list_items,
-- receipts, receipt_items, leaderboard.
-- RPC: mark_active_today() — wywołuj z klienta: supabase.rpc('mark_active_today')
-- ============================================================================
