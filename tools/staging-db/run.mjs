import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { migrationFiles, expectedCases } from './policy.mjs';

assert.equal(process.argv.length, 2, 'database-no-arguments');
const guard = globalThis[Symbol.for('coachfi.c73.real-network-guard.v2')];
assert(guard?.ready && guard.attempts.length === 0, 'database-network-guard-required');
const root = fs.realpathSync(fileURLToPath(new URL('../../', import.meta.url)));
assert.equal(fs.realpathSync(process.cwd()), root, 'database-root');
const migrations = migrationFiles.map(file => {
  const bytes = fs.readFileSync(path.join(root, 'supabase/migrations', file));
  return { file, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), sql: bytes.toString('utf8') };
});
const tables = ['accounts', 'account_state', 'progress', 'certificates'];
const users = ['fixture-cdp-a', 'fixture-cdp-b'];
const cases = [];
const originalRows = new Map();
let db, engine = null;
async function check(name, body) {
  try { await body(); cases.push({ name, status: 'passed' }); }
  catch (error) { cases.push({ name, status: 'failed', code: /^[0-9A-Z]{5}$/.test(error?.code) ? error.code : 'ASSERTION_OR_RUNTIME' }); }
}
const query = async (sql, params = []) => (await db.query(sql, params)).rows;
async function asRole(role, body) {
  assert(['anon', 'authenticated', 'service_role'].includes(role));
  await db.exec(`set role ${role}`);
  try { return await body(); } finally { await db.exec('reset role'); }
}
async function counts(user) {
  const out = {};
  for (const table of tables) out[table] = Number((await query(`select count(*) as n from public.${table} where cdp_user_id=$1`, [user]))[0].n);
  return out;
}
async function snapshot(user) {
  const out = {};
  for (const table of tables) out[table] = await query(`select * from public.${table} where cdp_user_id=$1 order by ${table === 'certificates' ? 'certificate_id' : 'cdp_user_id'}`, [user]);
  return out;
}
try {
  // No path, socket, connection string or remote service can be supplied.
  db = new PGlite();
  await db.waitReady;
  engine = (await query('show server_version'))[0].server_version;
  assert(typeof engine === 'string' && engine.length < 100, 'database-engine-version');
  await check('canonical migrations apply to a fresh in-memory PostgreSQL', async () => {
    await db.exec('create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;');
    for (const migration of migrations) await db.exec(migration.sql);
  });
  await check('four CDP private tables retain RLS and no client policies', async () => {
    const flags = await query("select c.relname,c.relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=any($1::text[]) order by c.relname", [tables]);
    assert.equal(flags.length, 4); assert(flags.every(row => row.relrowsecurity === true));
    const policies = await query("select tablename from pg_policies where schemaname='public' and tablename=any($1::text[])", [tables]);
    assert.equal(policies.length, 0);
  });
  await check('all three child foreign keys require atomic parent cascade', async () => {
    const constraints = await query("select c.relname, k.confdeltype from pg_constraint k join pg_class c on c.oid=k.conrelid where k.contype='f' and k.confrelid='public.accounts'::regclass order by c.relname");
    assert.deepEqual(constraints.map(row => [row.relname, row.confdeltype]), [['account_state', 'c'], ['certificates', 'c'], ['progress', 'c']]);
  });
  await check('canonical grants deny every private table to client roles', async () => {
    for (const role of ['anon', 'authenticated']) for (const table of tables) {
      const row = (await query('select has_table_privilege($1,$2,$3) as allowed', [role, `public.${table}`, 'SELECT,INSERT,UPDATE,DELETE']))[0];
      assert.equal(row.allowed, false);
    }
  });
  await check('service-role fixture seeds only two synthetic CDP owners', async () => {
    await asRole('service_role', async () => {
      for (const [index, user] of users.entries()) {
        await db.query('insert into public.accounts(cdp_user_id) values($1)', [user]);
        await db.query('insert into public.account_state(cdp_user_id,state) values($1,$2::jsonb)', [user, JSON.stringify({ version: 1, tokens: index + 10 })]);
        await db.query('insert into public.progress(cdp_user_id,tokens) values($1,$2)', [user, index + 10]);
        await db.query("insert into public.certificates(cdp_user_id,certificate_id,status,asset_address,owner_address) values($1,'money-mindset','owned',$2,$3)", [user, `fixture-asset-${index}`, `fixture-wallet-${index}`]);
      }
    });
    for (const user of users) {
      assert.deepEqual(await counts(user), { accounts: 1, account_state: 1, progress: 1, certificates: 1 });
      originalRows.set(user, await snapshot(user));
    }
  });
  // Fixture-only grants prove RLS itself still denies access if grants are later broadened.
  // These grants exist only in this disposable memory database; never apply them remotely.
  await db.exec(`grant select,insert,update,delete on public.accounts,public.account_state,public.progress,public.certificates to anon,authenticated`);
  for (const role of ['anon', 'authenticated']) for (const user of users) {
    await check(`${role} synthetic ${user} claims cannot read either owner's private rows`, async () => {
      await asRole(role, async () => {
        await db.query("select set_config('request.jwt.claims',$1,false)", [JSON.stringify({ sub: user, role })]);
        for (const table of tables) assert.equal((await query(`select * from public.${table}`)).length, 0);
      });
    });
    await check(`${role} synthetic ${user} claims cannot mutate or reassign either owner`, async () => {
      await asRole(role, async () => {
        for (const table of tables) {
          assert.equal((await query(`update public.${table} set cdp_user_id=$1 where cdp_user_id=$2 returning cdp_user_id`, ['fixture-foreign-owner', user])).length, 0);
          assert.equal((await query(`delete from public.${table} where cdp_user_id=$1 returning cdp_user_id`, [user])).length, 0);
        }
        // Existing parents ensure the child failures test RLS, not missing foreign keys.
        for (const [sql, params] of [
          ['insert into public.accounts(cdp_user_id) values($1)', ['fixture-injected-owner']],
          ['insert into public.account_state(cdp_user_id) values($1)', [user]],
          ['insert into public.progress(cdp_user_id) values($1)', [user]],
          ["insert into public.certificates(cdp_user_id,certificate_id,status,asset_address,owner_address) values($1,'saving-habit','owned','fixture-asset','fixture-wallet')", [user]],
        ]) await assert.rejects(db.query(sql, params), error => error.code === '42501');
      });
    });
  }
  await check('RLS-negative probes leave both owners unchanged', async () => {
    for (const user of users) assert.deepEqual(await snapshot(user), originalRows.get(user));
  });
  await check('a forced child failure rolls back the whole parent deletion', async () => {
    await db.exec("create function public.fixture_reject_delete() returns trigger language plpgsql as $$ begin raise exception 'fixture-only failure'; end $$; create trigger fixture_reject_delete before delete on public.progress for each row execute function public.fixture_reject_delete();");
    try {
      await asRole('service_role', async () => {
        await assert.rejects(db.query('delete from public.accounts where cdp_user_id=$1', [users[0]]), error => error.code === 'P0001');
      });
      for (const user of users) assert.deepEqual(await snapshot(user), originalRows.get(user));
    } finally { await db.exec('drop trigger fixture_reject_delete on public.progress; drop function public.fixture_reject_delete();'); }
  });
  await check('one parent DELETE removes A and all children while preserving B', async () => {
    await asRole('service_role', async () => {
      assert.equal((await query('delete from public.accounts where cdp_user_id=$1 returning cdp_user_id', [users[0]])).length, 1);
    });
    assert.deepEqual(await counts(users[0]), { accounts: 0, account_state: 0, progress: 0, certificates: 0 });
    assert.deepEqual(await counts(users[1]), { accounts: 1, account_state: 1, progress: 1, certificates: 1 });
    assert.deepEqual(await snapshot(users[1]), originalRows.get(users[1]));
  });
  await check('repeating A deletion is idempotent and cannot delete B', async () => {
    await asRole('service_role', async () => {
      assert.equal((await query('delete from public.accounts where cdp_user_id=$1 returning cdp_user_id', [users[0]])).length, 0);
    });
    assert.deepEqual(await counts(users[1]), { accounts: 1, account_state: 1, progress: 1, certificates: 1 });
    assert.deepEqual(await snapshot(users[1]), originalRows.get(users[1]));
  });
} catch { cases.push({ name: 'database harness initialization and prerequisites', status: 'failed', code: 'HARNESS_FAILURE' }); }
finally { if (db) await db.close(); }
const result = { status: cases.length === expectedCases.length && cases.every((test, index) => test.status === 'passed' && test.name === expectedCases[index]) ? 'PASS' : 'FAIL',
  engine, runtime: 'PGlite 0.5.10 / in-memory PostgreSQL', cases,
  migrations: migrations.map(({ file, sha256 }) => ({ file, sha256 })),
  boundaries: 'Actual PostgreSQL SQL/RLS/FK/rollback with synthetic roles and claims. No HTTP/PostgREST/GoTrue/CDP identity verification, session revocation, hosted staging or production acceptance.' };
console.log('DATABASE_CHECK_RESULT ' + JSON.stringify(result));
if (result.status !== 'PASS') process.exitCode = 1;
