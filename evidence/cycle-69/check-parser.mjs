import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { parseJournal } from './journal.mjs';

const dir = 'evidence/cycle-69/';
const hash = x => crypto.createHash('sha256').update(x).digest('hex');
const sha = p => hash(fs.readFileSync(p));
const read = p => JSON.parse(fs.readFileSync(p));
assert.equal(process.argv.length, 2);
assert(!fs.existsSync(dir + 'parser-check-run.json'), 'Preserve one-shot parser evidence');
const releasePath = dir + 'parser-release.json', release = read(releasePath), releaseSHA = sha(releasePath);
assert.equal(release.status, 'INDEPENDENT_PARSER_AND_CASES_STATIC_GO');
const boundary = () => {
  assert.equal(sha(releasePath), releaseSHA);
  for (const p of release.pins) assert.equal(sha(p.path), p.sha256, p.path);
};
boundary();
const startedAt = new Date().toISOString(), casesDataSHA256 = sha(dir + 'parser-cases.json'), data = read(dir + 'parser-cases.json');
assert.equal(data.cases.length, 30);
assert.equal(new Set(data.cases.map(c => c.id)).size, 30);
const facts = x => ({ recordCount: x.records.length, captureEpochCount: x.captureEpochs, workerEpochCount: x.workerEpochs,
  nativeReadyCount: x.records.filter(r => r.event === 'native-ready').length, workerFilesInJournalOrder: x.epochs.map(e => e.file),
  nativeDenialCount: x.nativeDenials.length, dbDenialCount: x.dbDenials.length });
const cases = data.cases.map(c => {
  const bytes = Buffer.from(c.input.data, c.input.encoding);
  assert.equal(bytes.length, c.input.byteLength);
  assert.equal(hash(bytes), c.input.sha256);
  let result = null, error = null;
  try { result = parseJournal(bytes, c.context); } catch (e) { error = String(e); }
  let mismatch = null;
  try {
    assert.equal(result !== null, c.expected.admit);
    if (result) assert.deepEqual(facts(result), c.expected.facts);
  } catch (e) { mismatch = String(e); }
  return { id: c.id, expectedAdmit: c.expected.admit, actualAdmit: result !== null, error, facts: result && facts(result), ok: mismatch === null, mismatch };
});
const oldRunPath = 'evidence/cycle-68/inventory-run.json';
let old = null, replay = null, replayError = null, boundaryError = null;
try {
  old = read(oldRunPath);
  const oldChild = read(old.childReceipt.path);
  assert.equal(sha(oldRunPath), '4af610b42623d489c75af3ca6dd1c6343cf85e910ff6ed3e42458625502a9881');
  assert.equal(sha(old.durableJournal.path), old.durableJournal.sha256);
  assert.equal(sha(old.childReceipt.path), old.childReceipt.sha256);
  replay = parseJournal(fs.readFileSync(old.durableJournal.path), { mode: 'app', runId: old.durableJournal.runId,
    mainPid: oldChild.pid, expectedFiles: old.selectedTests });
  assert.equal(replay.records.length, 517);
  assert.equal(replay.workerEpochs, 172);
  assert.equal(replay.captureEpochs, 173);
  assert.equal(new Set(replay.records.filter(r => r.event === 'capture-ready').map(r => r.pid)).size, 172);
} catch (e) { replayError = String(e); }
try { boundary(); } catch (e) { boundaryError = String(e); }
const failed = cases.filter(c => !c.ok);
const ok = !failed.length && replayError === null && boundaryError === null;
const record = { cycle: 69, startedAt, completedAt: new Date().toISOString(), status: ok ? 'PASS_PURE_PARSER_CASES_AND_OLD_COMPLETED_JOURNAL_REPLAY' : 'FAIL',
  release: { path: releasePath, sha256: releaseSHA }, casesData: { path: dir + 'parser-cases.json', sha256: casesDataSHA256 },
  caseCount: 30, expectedAdmit: 5, expectedReject: 25, passed: cases.length - failed.length, failed: failed.length, cases,
  oldJournalReplay: { wrapperPath: oldRunPath, expectedWrapperSHA256: '4af610b42623d489c75af3ca6dd1c6343cf85e910ff6ed3e42458625502a9881', journalPath: old?.durableJournal?.path ?? null, journalSHA256: old?.durableJournal?.sha256 ?? null, facts: replay && facts(replay), error: replayError,
    qualification: 'Read-only replay of alreadycompleted C68 journal; original wrapperFAIL and25actualtestFAIL retained. No Vitest/app rerun.' },
  boundaryError, appExecutions: 0, qualification: 'Synthetic journal parser infrastructure cases, separate from application test cases. No provider/network/database/compiler/browser/build.' };
fs.writeFileSync(dir + 'parser-check-run.json', JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ status: record.status, caseCount: 30, passed: record.passed, failed: record.failed, replayRows: replay?.records.length ?? null, replayEpochs: replay?.workerEpochs ?? null, replayError, boundaryError, appExecutions: 0 }));
process.exitCode = ok ? 0 : 1;
