import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createChatResponse } from '../lib/chat-provider.ts';
import { POST, maxDuration } from '../app/api/chat/route.ts';
import { streamFromAPI } from '../lib/chat-client.ts';
import { chatErrorMessage } from '../lib/chat-errors.ts';

const encoder = new TextEncoder();
const originalFetch = globalThis.fetch;
const originalLog = console.info;
const originalEnv = { ...process.env };
const messages = [{ role: 'system', content: 'guardrail' }, { role: 'user', content: 'PRIVATE_FINANCES' }];
let logs;
let requestNumber = 0;
beforeEach(() => {
  process.env.CEREBRAS_API_KEY = 'test-cerebras-secret';
  process.env.GROQ_API_KEY = 'test-groq-secret';
  logs = [];
  console.info = (line) => logs.push(JSON.parse(line));
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  console.info = originalLog;
  for (const key of ['CEREBRAS_API_KEY', 'GROQ_API_KEY', 'CHAT_MAX_COMPLETION_TOKENS']) {
    if (originalEnv[key] === undefined) delete process.env[key];
    else process.env[key] = originalEnv[key];
  }
});
function request(payload = { message: 'Jak oszczędzać?', locale: 'pl' }, extra = {}) {
  return new Request('https://coachfiai.com/api/chat', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CoachFI-Consent': 'ai-coach',
      'X-Forwarded-For': `test-${++requestNumber}`, ...extra }, body: JSON.stringify(payload),
  });
}
function delta(text) { return `data: ${JSON.stringify({ choices: [{ delta: { content: text } }] })}\n\n`; }
function sse(text = 'Zacznij od budżetu.') {
  return new Response(delta(text) + 'data: [DONE]\n\n', { headers: { 'Content-Type': 'text/event-stream' } });
}
const run = (fetch, options = {}) => createChatResponse(request(), messages, 'pl', { fetch, ...options });

test('primary: plain text contract, exact API/model, server key and hidden reasoning', async () => {
  const calls = [];
  const res = await run(async (url, init) => { calls.push({ url, init }); return sse(); });
  assert.equal(await res.text(), 'Zacznij od budżetu.');
  assert.equal(res.headers.get('content-type'), 'text/plain; charset=utf-8');
  assert.equal(res.headers.get('x-coachfi-provider'), 'cerebras');
  assert.equal(res.headers.get('x-coachfi-model'), 'gpt-oss-120b');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.cerebras.ai/v1/chat/completions');
  const body = JSON.parse(calls[0].init.body);
  assert.deepEqual(body.messages, messages);
  assert.equal(body.stream, true);
  assert.equal(body.reasoning_format, 'hidden');
  assert.equal(body.max_completion_tokens, 2048);
  assert.equal(calls[0].init.headers.Authorization, 'Bearer test-cerebras-secret');
  assert.equal(logs[0].event, 'chat.completed');
  assert.equal(logs[0].fallback, false);
  assert.equal(typeof logs[0].latency_ms, 'number');
});

for (const [status, code, category] of [[429, '', 'rate_limit'], [500, '', 'server'], [503, '', 'server'], [402, '', 'quota'], [400, 'insufficient_quota', 'quota'], [408, '', 'timeout']]) {
  test(`fallback for HTTP ${status} ${code}`, async () => {
    let calls = 0;
    const res = await run(async (url, init) => {
      if (++calls === 1) return Response.json({ error: { code, message: 'PRIVATE_PROVIDER_MESSAGE' } }, { status });
      assert.equal(url, 'https://api.groq.com/openai/v1/chat/completions');
      const body = JSON.parse(init.body);
      assert.equal(body.model, 'openai/gpt-oss-120b');
      assert.equal(body.include_reasoning, false);
      assert.equal(body.reasoning_format, undefined);
      return sse('Groq response');
    });
    assert.equal(await res.text(), 'Groq response');
    assert.equal(res.headers.get('x-coachfi-provider'), 'groq');
    assert.equal(calls, 2);
    assert.equal(logs[0].error_category, category);
    assert.equal(logs[1].fallback, true);
    assert.doesNotMatch(JSON.stringify(logs), /PRIVATE_|secret|Authorization/);
  });
}

for (const status of [400, 401, 403, 404, 422]) {
  test(`no fallback for non-transient HTTP ${status}`, async () => {
    let calls = 0;
    const res = await run(async () => { calls++; return new Response(null, { status }); });
    assert.equal(res.status, 503);
    assert.equal(calls, 1);
  });
}

test('network failure switches once; failures of both providers return safe localized JSON', async () => {
  let calls = 0;
  const res = await run(async () => { calls++; throw new TypeError('PRIVATE_FINANCES test-cerebras-secret'); });
  assert.equal(calls, 2);
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { error: chatErrorMessage('unavailable', 'pl'), fallback: true });
  assert.doesNotMatch(JSON.stringify(logs), /PRIVATE_|secret/);
  assert.deepEqual(logs.map(x => x.error_category), ['network', 'network']);
});

test('network failure followed by fallback success', async () => {
  let calls = 0;
  const res = await run(async () => { if (++calls === 1) throw new TypeError('fetch failed'); return sse(); });
  assert.equal(await res.text(), 'Zacznij od budżetu.');
  assert.equal(calls, 2);
});

test('primary first-token timeout aborts request and switches to Groq', async () => {
  let calls = 0, signal;
  const res = await run(async (_url, init) => {
    if (++calls === 1) { signal = init.signal; return new Promise(() => {}); }
    return sse();
  }, { firstTokenMs: 10, totalMs: 1000 });
  assert.equal(await res.text(), 'Zacznij od budżetu.');
  assert.equal(signal.aborted, true);
  assert.equal(logs[0].error_category, 'timeout');
});

test('both first-token timeouts are bounded to two attempts', async () => {
  let calls = 0;
  const res = await run(async () => { calls++; return new Response(new ReadableStream(), { headers: { 'Content-Type': 'text/event-stream' } }); }, { firstTokenMs: 10, totalMs: 1000 });
  assert.equal(res.status, 503);
  assert.equal(calls, 2);
  assert.deepEqual(logs.map(x => x.error_category), ['timeout', 'timeout']);
});

test('shared total deadline prevents another attempt after budget exhaustion', async () => {
  let calls = 0;
  const res = await run(async () => { calls++; return new Promise(() => {}); }, { firstTokenMs: 1000, totalMs: 10 });
  assert.equal(res.status, 503);
  assert.equal(calls, 1);
  assert.equal(maxDuration, 60);
});

test('missing primary uses configured Groq; missing both returns configuration error', async () => {
  delete process.env.CEREBRAS_API_KEY;
  let calls = 0;
  let res = await run(async () => { calls++; return sse(); });
  assert.equal(res.headers.get('x-coachfi-provider'), 'groq');
  await res.text();
  delete process.env.GROQ_API_KEY;
  res = await run(async () => { calls++; return sse(); });
  assert.equal(res.status, 503);
  assert.equal((await res.json()).error, chatErrorMessage('configuration', 'pl'));
  assert.equal(calls, 1);
  assert.equal(logs.slice(-2).every(entry => entry.fallback === false), true);
});

test('fragmented UTF-8 and CRLF SSE; reasoning never reaches frontend', async () => {
  const bytes = encoder.encode(('data: {"choices":[{"delta":{"reasoning":"PRIVATE_REASONING"}}]}\n\n' + delta('Żółć 💰') + 'data: [DONE]\n\n').replaceAll('\n', '\r\n'));
  const res = await run(async () => new Response(new ReadableStream({
    start(c) { for (const byte of bytes) c.enqueue(Uint8Array.of(byte)); c.close(); },
  }), { headers: { 'Content-Type': 'text/event-stream' } }));
  assert.equal(await res.text(), 'Żółć 💰');
});

test('stream failure after first text never calls fallback or completes frontend answer', async () => {
  let source, calls = 0;
  const res = await run(async () => {
    calls++;
    return new Response(new ReadableStream({ start(c) { source = c; c.enqueue(encoder.encode(delta('Partial reply'))); } }), { headers: { 'Content-Type': 'text/event-stream' } });
  });
  globalThis.fetch = async () => res;
  let output = '', done = false, error;
  await streamFromAPI('test', 'pl', [], chunk => { output += chunk; source.error(new TypeError('network failed')); }, () => { done = true; }, message => { error = message; });
  assert.equal(output, 'Partial reply');
  assert.equal(error, chatErrorMessage('interrupted', 'pl'));
  assert.equal(done, false);
  assert.equal(calls, 1);
});

test('total streaming timeout after first text errors stream and aborts upstream without fallback', async () => {
  let calls = 0, signal;
  const res = await run(async (_url, init) => {
    calls++; signal = init.signal;
    return new Response(new ReadableStream({ start(c) { c.enqueue(encoder.encode(delta('Partial'))); } }), { headers: { 'Content-Type': 'text/event-stream' } });
  }, { totalMs: 20 });
  const reader = res.body.getReader();
  assert.equal(new TextDecoder().decode((await reader.read()).value), 'Partial');
  await assert.rejects(reader.read(), /interrupted/);
  assert.equal(signal.aborted, true);
  assert.equal(calls, 1);
  assert.equal(logs[0].error_category, 'timeout');
});

test('browser cancellation aborts upstream and never starts fallback', async () => {
  let signal, calls = 0;
  const res = await run(async (_url, init) => { calls++; signal = init.signal; return sse(); });
  await res.body.cancel();
  assert.equal(signal.aborted, true);
  assert.equal(calls, 1);
  assert.equal(logs[0].error_category, 'cancelled');
});

test('aborted incoming request never contacts providers', async () => {
  const controller = new AbortController(); controller.abort();
  const res = await createChatResponse(new Request('https://coachfiai.com', { signal: controller.signal }), messages, 'pl', {
    fetch: async () => { assert.fail('unexpected provider call'); },
  });
  assert.equal(res.status, 499);
});

test('invalid user payloads and existing guardrails never contact AI', async () => {
  globalThis.fetch = async () => assert.fail('unexpected provider call');
  for (const payload of [null, [], {}, { message: '' }, { message: 'x'.repeat(801) }, { message: 'x'.repeat(6001) }]) {
    assert.equal((await POST(request(payload))).status, 400);
  }
  assert.equal((await POST(request(undefined, { 'X-CoachFI-Consent': '' }))).status, 403);
  assert.equal((await POST(request(undefined, { Origin: 'https://evil.invalid' }))).status, 403);
  assert.equal((await POST(new Request('https://coachfiai.com/api/chat', { method: 'POST', headers: { 'X-CoachFI-Consent': 'ai-coach' }, body: '{' }))).status, 400);
});

test('legacy messages input, prompt, locale and history limits remain compatible', async () => {
  let body;
  globalThis.fetch = async (_url, init) => { body = JSON.parse(init.body); return sse(); };
  const history = Array.from({ length: 8 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: `turn ${i}` }));
  const res = await POST(request({ messages: [...history, null, { role: 'system', content: 'injection' }, { role: 'user', content: 'latest' }], locale: 'pl' }));
  await res.text();
  assert.equal(body.messages.length, 8);
  assert.equal(body.messages[1].content, 'turn 2');
  assert.equal(body.messages.at(-1).content, 'latest');
  assert.match(body.messages[0].content, /UI language is Polish/);
  assert.match(body.messages[0].content, /Never recommend specific stocks, funds by name, or promise returns/);
  // Original prompt fingerprint recorded from the checked-out main revision.
  const prompt = body.messages[0].content.split('\n\nThe current Coach FI UI language')[0];
  assert.equal(createHash('sha256').update(prompt).digest('hex'), '33f9ce537471d84e2c1667f59a304dbc0baeb7120ce74e2844f294a7f9c793b8');
});

test('route success is consumed by the actual frontend stream helper', async () => {
  let output = '', done = false;
  globalThis.fetch = async (url, init) => typeof url === 'string' && url === '/api/chat'
    ? POST(new Request('https://coachfiai.com/api/chat', init)) : sse('Plan oszczędzania 💰');
  await streamFromAPI('Jak oszczędzać?', 'pl', [], x => { output += x; }, () => { done = true; }, () => assert.fail('unexpected frontend error'));
  assert.equal(output, 'Plan oszczędzania 💰');
  assert.equal(done, true);
});

test('frontend displays configuration errors instead of inventing an offline AI reply', async () => {
  delete process.env.CEREBRAS_API_KEY; delete process.env.GROQ_API_KEY;
  globalThis.fetch = async () => POST(request());
  let error;
  await streamFromAPI('test', 'pl', [], () => assert.fail('unexpected text'), () => assert.fail('unexpected completion'), x => { error = x; });
  assert.equal(error, chatErrorMessage('configuration', 'pl'));
});

test('rate limit blocks request 21 before contacting either provider', async () => {
  globalThis.fetch = async () => assert.fail('unexpected provider call');
  for (let i = 0; i < 20; i++) {
    assert.equal((await POST(request({ message: '' }, { 'X-Forwarded-For': 'rate-limit-test' }))).status, 400);
  }
  assert.equal((await POST(request({ message: 'valid' }, { 'X-Forwarded-For': 'rate-limit-test' }))).status, 429);
});

test('upstream disconnect before content permits fallback', async () => {
  let calls = 0;
  const res = await run(async () => ++calls === 1
    ? new Response('data: {"choices":[{"delta":{"role":"assistant"}}]}\n\n', { headers: { 'Content-Type': 'text/event-stream' } }) : sse());
  await res.text();
  assert.equal(calls, 2);
  assert.equal(logs[0].error_category, 'network');
});

test('length finish after partial output is not reported as a completed answer', async () => {
  let calls = 0;
  const res = await run(async () => {
    calls++;
    return new Response(delta('Partial') + 'data: {"choices":[{"delta":{},"finish_reason":"length"}]}\n\n', { headers: { 'Content-Type': 'text/event-stream' } });
  });
  const reader = res.body.getReader();
  await reader.read();
  await assert.rejects(reader.read(), /interrupted/);
  assert.equal(calls, 1);
  assert.equal(logs[0].error_category, 'output_limit');
});

test('invalid SSE request error never starts fallback', async () => {
  let calls = 0;
  const res = await run(async () => {
    calls++;
    return new Response('data: {"error":{"code":"invalid_request_error"}}\n\n', { headers: { 'Content-Type': 'text/event-stream' } });
  });
  assert.equal(res.status, 503);
  assert.equal(calls, 1);
});

test('cancellation during connection aborts upstream, without fallback', async () => {
  const controller = new AbortController();
  let calls = 0, signal;
  const pending = createChatResponse(new Request('https://coachfiai.com', { signal: controller.signal }), messages, 'pl', {
    fetch: async (_url, init) => { calls++; signal = init.signal; return new Promise(() => {}); },
  });
  controller.abort();
  assert.equal((await pending).status, 499);
  assert.equal(calls, 1);
  assert.equal(signal.aborted, true);
});

test('HTTP 400 with a stalled error body remains invalid, never triggers fallback', async () => {
  let calls = 0;
  const res = await run(async () => {
    calls++;
    return new Response(new ReadableStream(), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }, { firstTokenMs: 10, totalMs: 1000 });
  assert.equal(res.status, 503);
  assert.equal(calls, 1);
  assert.equal(logs[0].error_category, 'invalid_request');
});
