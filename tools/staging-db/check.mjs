import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { commandSucceeded, evaluateBuildJournal } from '../../scripts/ci/policy.mjs';
import { migrationFiles, validateDatabaseLock, validateDatabaseResult } from './policy.mjs';

assert.equal(process.argv.length, 2, 'database-wrapper-no-arguments');
const root = fs.realpathSync(fileURLToPath(new URL('../../', import.meta.url)));
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex');
const files = ['tools/staging-db/run.mjs', 'tools/staging-db/check.mjs', 'tools/staging-db/policy.mjs', 'tools/staging-db/package.json', 'tools/staging-db/package-lock.json',
  'supabase/migrations/20261012120000_accounts.sql', 'supabase/migrations/20261012120001_leaderboard.sql',
  'supabase/migrations/20261012195000_table_grants.sql', 'evidence/cycle-73/network-guard.cjs'];
assert(fs.readdirSync(root).every(name => !/^\.env(?:\.|$)/.test(name) || name === '.env.example'), 'database-env-file-present');
const before = Object.fromEntries(files.map(file => [file, hash(file)]));
validateDatabaseLock(JSON.parse(fs.readFileSync(path.join(root, 'tools/staging-db/package.json'))),
  JSON.parse(fs.readFileSync(path.join(root, 'tools/staging-db/package-lock.json'))));
const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', windowsHide: true }).trim();
const runId = crypto.randomBytes(16).toString('hex');
const directory = path.join(root, '.tmp/staging-db', runId); fs.mkdirSync(directory, { recursive: true });
const journal = path.join(root, `evidence/cycle-73/guard-build-${runId}.jsonl`); fs.writeFileSync(journal, '', { flag: 'wx' });
const env = { CI: 'true', NODE_ENV: 'test', COACHFI_C73_GUARD_JOURNAL: journal,
  NODE_OPTIONS: `--require="${path.join(root, 'evidence/cycle-73/network-guard.cjs').replaceAll('\\', '/')}"` };
for (const key of ['PATH', 'SYSTEMROOT', 'WINDIR', 'COMSPEC', 'PATHEXT', 'TEMP', 'TMP', 'OS', 'PROCESSOR_ARCHITECTURE', 'NUMBER_OF_PROCESSORS', 'SYSTEMDRIVE']) {
  if (process.env[key] !== undefined) env[key] = process.env[key];
}
const result = spawnSync(process.execPath, ['tools/staging-db/run.mjs'], { cwd: root, env, shell: false, windowsHide: true,
  encoding: 'utf8', timeout: 120_000, maxBuffer: 8 * 1024 * 1024 });
fs.writeFileSync(path.join(directory, 'raw.json'), JSON.stringify({ status: result.status, signal: result.signal,
  errorCode: result.error?.code ?? null, pid: result.pid, stdout: result.stdout, stderr: result.stderr, before,
  environmentNames: Object.keys(env).sort(), head }, null, 2), { flag: 'wx' });
const summary = { status: 'FAIL', head, runId, node: process.version, details: null, guard: null, reason: null };
try {
  summary.guard = evaluateBuildJournal(fs.readFileSync(journal), runId, result.pid);
  assert(commandSucceeded(result), 'database-process-failed');
  const lines = result.stdout.split(/\r?\n/).filter(line => line.startsWith('DATABASE_CHECK_RESULT '));
  assert.equal(lines.length, 1, 'database-report-count');
  const report = JSON.parse(lines[0].slice('DATABASE_CHECK_RESULT '.length));
  validateDatabaseResult(report, migrationFiles.map(file => ({ file, sha256: before[`supabase/migrations/${file}`] })));
  assert.deepEqual(Object.fromEntries(files.map(file => [file, hash(file)])), before, 'database-source-drift');
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8', windowsHide: true }).trim(), head, 'database-head-drift');
  summary.details = report; summary.status = 'PASS';
} catch (error) { summary.reason = /^database-[a-z-]+$/.test(error?.message) ? error.message : 'database-validation-failed'; }
fs.writeFileSync(path.join(directory, 'summary.json'), JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ ...summary, evidence: path.relative(root, directory).replaceAll('\\', '/') }, null, 2));
if (summary.status !== 'PASS') process.exitCode = 1;
