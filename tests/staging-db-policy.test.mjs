import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { expectedCases, migrationFiles, validateDatabaseLock, validateDatabaseResult } from '../tools/staging-db/policy.mjs';

const read = name => JSON.parse(fs.readFileSync(new URL(`../tools/staging-db/${name}`, import.meta.url)));
test('isolated database lock admits only the reviewed package and integrity', () => {
  validateDatabaseLock(read('package.json'), read('package-lock.json'));
});
for (const [name, mutate] of [
  ['additional locked runtime', lock => { lock.packages['node_modules/unreviewed'] = { version: '1.0.0' }; }],
  ['changed runtime version', lock => { lock.packages['node_modules/@electric-sql/pglite'].version = '0.5.11'; }],
  ['changed tarball host', lock => { lock.packages['node_modules/@electric-sql/pglite'].resolved = 'https://example.invalid/pglite.tgz'; }],
  ['changed integrity', lock => { lock.packages['node_modules/@electric-sql/pglite'].integrity = 'sha512-invalid'; }],
]) test(`isolated database lock rejects ${name}`, () => {
  const lock = read('package-lock.json'); mutate(lock);
  assert.throws(() => validateDatabaseLock(read('package.json'), lock));
});
const migrations = migrationFiles.map(file => ({ file, sha256: 'a'.repeat(64) }));
const report = () => ({ status: 'PASS', engine: '17.5', migrations: structuredClone(migrations), cases: expectedCases.map(name => ({ name, status: 'passed' })) });
test('database admission requires every exact scenario and migration binding', () => {
  assert.equal(expectedCases.length, 17);
  assert.equal(new Set(expectedCases).size, 17);
  validateDatabaseResult(report(), migrations);
});
for (const [name, mutate] of [
  ['empty cases', value => { value.cases = []; }],
  ['duplicated case', value => { value.cases[1] = value.cases[0]; }],
  ['skipped case', value => { value.cases[4].status = 'skipped'; }],
  ['changed migration bytes', value => { value.migrations[0].sha256 = 'b'.repeat(64); }],
]) test(`database admission rejects ${name}`, () => {
  const value = report(); mutate(value);
  assert.throws(() => validateDatabaseResult(value, migrations));
});
