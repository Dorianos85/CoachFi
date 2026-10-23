import assert from 'node:assert/strict';

export const migrationFiles = ['20261012120000_accounts.sql', '20261012120001_leaderboard.sql', '20261012195000_table_grants.sql'];
export const expectedCases = [
  'canonical migrations apply to a fresh in-memory PostgreSQL',
  'four CDP private tables retain RLS and no client policies',
  'all three child foreign keys require atomic parent cascade',
  'canonical grants deny every private table to client roles',
  'service-role fixture seeds only two synthetic CDP owners',
  ...['anon', 'authenticated'].flatMap(role => ['fixture-cdp-a', 'fixture-cdp-b'].flatMap(user => [
    `${role} synthetic ${user} claims cannot read either owner's private rows`,
    `${role} synthetic ${user} claims cannot mutate or reassign either owner`,
  ])),
  'RLS-negative probes leave both owners unchanged',
  'a forced child failure rolls back the whole parent deletion',
  'one parent DELETE removes A and all children while preserving B',
  'repeating A deletion is idempotent and cannot delete B',
];
export function validateDatabaseLock(manifest, lock) {
  assert(manifest?.private === true && manifest?.dependencies?.['@electric-sql/pglite'] === '0.5.10', 'database-manifest');
  assert.deepEqual(Object.keys(manifest.dependencies), ['@electric-sql/pglite'], 'database-dependency-count');
  assert(!manifest.devDependencies && !manifest.optionalDependencies && !manifest.overrides, 'database-unexpected-dependencies');
  assert.equal(lock?.lockfileVersion, 3, 'database-lock-version');
  assert.deepEqual(Object.keys(lock.packages ?? {}).sort(), ['', 'node_modules/@electric-sql/pglite'], 'database-lock-graph');
  assert.deepEqual(lock.packages[''].dependencies, manifest.dependencies, 'database-lock-root');
  const entry = lock.packages['node_modules/@electric-sql/pglite'];
  assert.equal(entry.version, '0.5.10', 'database-runtime-version');
  assert.equal(entry.resolved, 'https://registry.npmjs.org/@electric-sql/pglite/-/pglite-0.5.10.tgz', 'database-runtime-registry');
  assert.equal(entry.integrity, 'sha512-tXc/25U3ulOkiRQuTFdwIv+JhBqtMdAF7Gvo6CfZZWtSB4+hgC4Wr2vwK5ngvvN5PJfAAEGIsfyCVy1JhCOBYw==', 'database-runtime-integrity');
  assert(!entry.hasInstallScript && !entry.link && !entry.dependencies && !entry.optionalDependencies, 'database-runtime-shape');
}
export function validateDatabaseResult(report, migrations) {
  assert(report?.status === 'PASS' && Array.isArray(report.cases), 'database-case-failure');
  assert.deepEqual(report.cases.map(test => test.name), expectedCases, 'database-case-identities');
  assert(report.cases.every(test => test.status === 'passed'), 'database-case-failure');
  assert.equal(typeof report.engine, 'string', 'database-engine-version');
  assert(/^\d+\.\d+(?:\.\d+)?(?: \([^\r\n]{1,80}\))?$/.test(report.engine), 'database-engine-version');
  assert.deepEqual(report.migrations, migrations, 'database-migration-binding');
}
