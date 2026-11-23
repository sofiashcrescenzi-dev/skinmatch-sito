// Il server MCP non deve accettare lotti JSON-RPC senza limite (prova delle skill, 23/11/2026):
// una richiesta con mille messaggi valeva mille esecuzioni e mille scritture su D1.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mcp } from '../worker/mcp.js';

const finto = () => {
  const scritture = [];
  const env = { DB: { prepare: () => ({ bind: (...v) => ({ run: async () => { scritture.push(v); } }) }) } };
  const attese = [];
  const ctx = { waitUntil: (p) => attese.push(p) };
  return { env, ctx, scritture, attese };
};
const lotto = (n) => Array.from({ length: n }, (_, i) => ({ jsonrpc: '2.0', id: i + 1, method: 'initialize', params: {} }));
const chiama = (corpo, { env, ctx }) => mcp(new Request('https://skinmatch.it/mcp', { method: 'POST', body: JSON.stringify(corpo), headers: { 'content-type': 'application/json' } }), env, ctx);

test('un lotto piccolo risponde a ogni messaggio', async () => {
  const f = finto();
  const r = await chiama(lotto(5), f);
  assert.equal(r.status, 200);
  assert.equal((await r.json()).length, 5);
});

test('un lotto oltre il limite si rifiuta tutto, senza scritture', async () => {
  const f = finto();
  const r = await chiama(lotto(1000), f);
  await Promise.all(f.attese);
  assert.equal(r.status, 400);
  const d = await r.json();
  assert.equal(d.error.code, -32600);
  assert.equal(f.scritture.length, 0);
});

test('un lotto vuoto è una richiesta non valida', async () => {
  const f = finto();
  const r = await chiama([], f);
  assert.equal(r.status, 400);
});
