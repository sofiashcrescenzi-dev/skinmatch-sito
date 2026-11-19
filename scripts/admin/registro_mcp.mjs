// IL SERVER MCP NEL REGISTRO UFFICIALE (19/11/2026, Federico: «registra l'mcp»).
// Pubblica mcp/server.json su registry.modelcontextprotocol.io con l'autenticazione HTTP del registro:
// il registro legge la chiave pubblica su https://skinmatch.it/.well-known/mcp-registry-auth (MCP_REGISTRY_AUTH in
// wrangler.jsonc) e noi firmiamo l'ora con la privata, che sta solo in ~/.skinmatch-segreti.env (MCP_REGISTRY_KEY).
// Uso: node scripts/admin/registro_mcp.mjs            → pubblica la versione di mcp/server.json
//      node scripts/admin/registro_mcp.mjs --controlla → legge cosa c'è nel registro, senza pubblicare
// ⚠️ A ogni cambio degli strumenti o della descrizione: alza "version" in mcp/server.json (il registro non
// accetta due volte la stessa versione). ⚠️ L'ora del Mac deve essere giusta: il registro tollera 15 secondi.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { createPrivateKey, sign } from 'node:crypto';

const REGISTRO = 'https://registry.modelcontextprotocol.io';
const DOMINIO = 'skinmatch.it';
const server = JSON.parse(readFileSync(new URL('../../mcp/server.json', import.meta.url), 'utf8'));

if (process.argv.includes('--controlla')) {
  const r = await fetch(`${REGISTRO}/v0/servers?search=${encodeURIComponent(server.name)}`);
  const j = await r.json();
  for (const s of j.servers || []) console.log(s.server?.name, s.server?.version, s._meta?.['io.modelcontextprotocol.registry/official']?.status || '');
  if (!(j.servers || []).length) console.log('non ancora nel registro');
  process.exit(0);
}

const env = readFileSync(`${homedir()}/.skinmatch-segreti.env`, 'utf8');
const seme = env.match(/^MCP_REGISTRY_KEY=([0-9a-f]{64})$/m)?.[1];
if (!seme) throw new Error('manca MCP_REGISTRY_KEY in ~/.skinmatch-segreti.env');
// la chiave privata ed25519 dal seme di 32 byte (intestazione PKCS#8 fissa + seme)
const chiave = createPrivateKey({ key: Buffer.concat([Buffer.from('302e020100300506032b657004220420', 'hex'), Buffer.from(seme, 'hex')]), format: 'der', type: 'pkcs8' });

const ora = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
const firma = sign(null, Buffer.from(ora), chiave).toString('hex');
const login = await fetch(`${REGISTRO}/v0/auth/http`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ domain: DOMINIO, timestamp: ora, signed_timestamp: firma }),
});
if (!login.ok) throw new Error(`accesso al registro: ${login.status} ${await login.text()}`);
const { registry_token: token } = await login.json();

const pub = await fetch(`${REGISTRO}/v0/publish`, {
  method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
  body: JSON.stringify(server),
});
const testo = await pub.text();
if (!pub.ok) throw new Error(`pubblicazione: ${pub.status} ${testo}`);
console.log('pubblicato:', server.name, server.version);
