-- Tables created by the migration role did not receive read and write grants.
-- The app connects as service_role, so those grants are required to save progress.

grant select, insert, update, delete on table
  public.accounts,
  public.account_state,
  public.progress,
  public.certificates,
  public.leaderboard
to service_role;

grant select on table public.leaderboard to anon, authenticated;

alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to service_role;
