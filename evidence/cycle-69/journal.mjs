import assert from 'node:assert/strict';

const schema = {
  'capture-ready': ['event', 'pid', 'runId'],
  'native-ready': ['event', 'pid', 'runId'],
  'worker-ready': ['devDbDeny', 'event', 'file', 'pid', 'runId'],
  'native-denial': ['event', 'kind', 'pid', 'runId'],
  'db-denial': ['event', 'kind', 'pid', 'runId'],
};
const probeKinds = ['net.connect', 'tls.connect', 'http.request', 'https.request', 'dns.lookup', 'fetch'];
const nativeKinds = new Set(['net.Socket.connect', ...probeKinds, 'http.get', 'https.get',
  ...['lookup', 'resolve', 'resolve4', 'resolve6', 'resolveAny', 'reverse'].flatMap(n => ['dns.' + n, 'dns.promises.' + n]), 'dgram.send']);

/** One infrastructure main, then complete sequential worker initialization epochs.
 * PID identity is local to an epoch: the operating system may reuse a PID later.
 * This requires the reviewed runner's --maxWorkers=1 execution contract.
 */
export function parseJournal(bytes, { mode, runId, mainPid, expectedFiles }) {
  assert(Buffer.isBuffer(bytes), 'Journal bytes required');
  assert(['app', 'probe', 'typecheck'].includes(mode), 'Known mode required');
  assert.match(runId, /^[a-f0-9]{32}$/);
  assert(Number.isSafeInteger(mainPid) && mainPid > 0, 'Valid main PID');
  assert(Array.isArray(expectedFiles), 'Expected files required');
  assert.equal(new Set(expectedFiles).size, expectedFiles.length, 'Unique expected files');
  assert(expectedFiles.every(f => typeof f === 'string' && f.length > 0 && !f.includes('..') && !f.includes('\\') && !f.startsWith('/')), 'Known relative files');
  const text = bytes.toString('utf8');
  assert(Buffer.from(text, 'utf8').equals(bytes), 'Strict UTF8');
  assert(text.length > 0 && text.endsWith('\n'), 'Nonempty complete final line');
  const records = text.slice(0, -1).split('\n').map(line => {
    assert(line.length > 0, 'No empty interior line');
    const row = JSON.parse(line);
    assert(row && typeof row === 'object' && !Array.isArray(row));
    assert(Object.hasOwn(schema, row.event), 'Known event');
    assert.deepEqual(Object.keys(row).sort(), schema[row.event].toSorted(), 'Exact event fields');
    assert.equal(row.runId, runId, 'Exact run identity');
    assert(Number.isSafeInteger(row.pid) && row.pid > 0, 'Valid event PID');
    if (row.event === 'worker-ready') {
      assert.equal(row.devDbDeny, true);
      assert(expectedFiles.includes(row.file), 'Known test file');
    }
    if (row.event === 'native-denial') assert(nativeKinds.has(row.kind), 'Known native denial');
    if (row.event === 'db-denial') assert(['dev-db.getDevDb', 'dev-db.devDbPath'].includes(row.kind), 'Known DB denial');
    return row;
  });
  assert.deepEqual(records[0], { event: 'capture-ready', pid: mainPid, runId }, 'Main capture first');
  const nativeDenials = records.filter(r => r.event === 'native-denial');
  const dbDenials = records.filter(r => r.event === 'db-denial');
  const epochs = [];
  if (mode === 'probe') {
    assert.equal(expectedFiles.length, 0);
    assert.equal(records.length, 8, 'Exact negative probe evidence');
    assert.deepEqual(records[1], { event: 'native-ready', pid: mainPid, runId });
    assert.deepEqual(records.slice(2), probeKinds.map(kind => ({ event: 'native-denial', kind, pid: mainPid, runId })));
  } else {
    assert.equal(nativeDenials.length, 0, 'No native denial, including caught or late calls');
    assert.equal(dbDenials.length, 0, 'No DB denial, including caught or late calls');
    if (mode === 'typecheck') {
      assert.equal(expectedFiles.length, 0);
      assert.equal(records.length, 1, 'TypeScript main capture-only');
    } else {
      assert(expectedFiles.length > 0, 'No vacuous app coverage');
      assert.equal(records.length, 1 + 3 * expectedFiles.length, 'Complete epoch count');
      for (let i = 1; i < records.length; i += 3) {
        const [capture, native, worker] = records.slice(i, i + 3);
        assert.deepEqual([capture.event, native.event, worker.event], ['capture-ready', 'native-ready', 'worker-ready'], 'Ordered complete epoch');
        assert.notEqual(capture.pid, mainPid, 'Main remains capture-only');
        assert.equal(native.pid, capture.pid);
        assert.equal(worker.pid, capture.pid);
        epochs.push({ captureRowZeroBased: i, pid: capture.pid, file: worker.file });
      }
      assert.equal(new Set(epochs.map(e => e.file)).size, expectedFiles.length, 'No duplicate file epoch');
      assert.deepEqual(epochs.map(e => e.file).sort(), expectedFiles.toSorted(), 'Exact file coverage');
    }
  }
  return { records, epochs, captureEpochs: 1 + epochs.length, workerEpochs: epochs.length, nativeDenials, dbDenials };
}
