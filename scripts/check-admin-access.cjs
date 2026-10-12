const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');

function guard(user, authError = null, configured = true, cdpEmail) {
  const source = fs.readFileSync(path.join(__dirname, '..', 'lib', 'admin-access.ts'), 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const values = { NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SECRET_KEY: configured ? 'server-test-key' : '', COACHFI_ADMIN_EMAILS: 'owner@example.com' };
  const exports = {};
  vm.runInNewContext(compiled, { exports, Response, require(name) {
    if (name === '@supabase/supabase-js') return { createClient: () => ({ auth: { getUser: async () => ({ data: { user }, error: authError }) } }) };
    if (name === '@/lib/server-env') return { getOptionalEnv: (key) => values[key] || undefined };
    if (name === '@/lib/cdp-server') return { cdpAuthConfigured: () => cdpEmail !== undefined, verifyCdpUser: async () => { if (cdpEmail === null) throw new Error('invalid CDP token'); return { email: cdpEmail, userId: 'verified-cdp-id' }; } };
    throw new Error(`Unexpected module ${name}`);
  } });
  return exports.requireAdmin;
}
const request = () => new Request('https://coachfiai.com/api/admin/overview', { headers: { Authorization: 'Bearer test-user-token' } });
test('missing token is denied before database access', async () => assert.equal((await guard(null)(new Request('https://coachfiai.com/api/admin/overview'))).response.status, 401));
test('invalid token is denied', async () => assert.equal((await guard(null, new Error('invalid'))(request())).response.status, 401));
test('unconfirmed owner email is denied', async () => assert.equal((await guard({ email: 'owner@example.com' })(request())).response.status, 403));
test('confirmed non-admin is denied', async () => assert.equal((await guard({ email: 'other@example.com', email_confirmed_at: '2026-10-12' })(request())).response.status, 403));
test('confirmed allowlisted owner is admitted', async () => assert.ok((await guard({ email: 'owner@example.com', email_confirmed_at: '2026-10-12' })(request())).client));
test('missing server secret fails closed', async () => assert.equal((await guard({ email: 'owner@example.com', email_confirmed_at: '2026-10-12' }, null, false)(request())).response.status, 503));
test('verified allowlisted CDP owner is admitted', async () => assert.ok((await guard(null, null, true, 'owner@example.com')(request())).client));
test('verified non-admin CDP account is denied', async () => assert.equal((await guard(null, null, true, 'other@example.com')(request())).response.status, 403));
test('invalid CDP token is denied', async () => assert.equal((await guard(null, null, true, null)(request())).response.status, 401));
