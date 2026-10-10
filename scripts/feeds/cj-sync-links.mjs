#!/usr/bin/env node
// Sostituisce i link "in attesa" (pagina del negozio senza tracciamento) con i link
// tracciati CJ, per i prodotti dei merchant che hanno approvato l'account.
// Legge i prodotti con feedId 'cj:<advertiserId>:<productId>' e linkPending: true.
// Credenziali in ~/.secrets/cj-affiliate.env (mai nel repo).
//
// Uso: node scripts/feeds/cj-sync-links.mjs   (poi npm run build e deploy)

import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const FILES = ['src/lib/products.ts', 'src/lib/products-feed.ts'];

const env = Object.fromEntries(
  readFileSync(join(homedir(), '.secrets/cj-affiliate.env'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => l.trim().split(/=(.*)/s).slice(0, 2))
);
const { CJ_PERSONAL_ACCESS_TOKEN: TOKEN, CJ_COMPANY_ID: CID, CJ_PID: PID } = env;

const blockRe = /  \{\n[\s\S]*?\n  \},/g;
const pending = []; // { file, block, advertiserId, productId }
for (const file of FILES) {
  for (const block of readFileSync(file, 'utf8').match(blockRe) ?? []) {
    const m = block.match(/feedId: ['"]cj:(\d+):([^'"]+)['"]/);
    if (m && /linkPending: true/.test(block)) pending.push({ file, block, advertiserId: m[1], productId: m[2] });
  }
}

const byAdvertiser = Map.groupBy(pending, (p) => p.advertiserId);
const links = new Map();
for (const [advertiserId, items] of byAdvertiser) {
  for (let i = 0; i < items.length; i += 50) {
    const ids = items.slice(i, i + 50).map((p) => JSON.stringify(p.productId)).join(', ');
    const res = await fetch('https://ads.api.cj.com/query', {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `{ products(companyId: "${CID}", partnerIds: ["${advertiserId}"], productIds: [${ids}], limit: 50) {
          resultList { id linkCode(pid: "${PID}") { clickUrl } } } }`,
      }),
    });
    const json = await res.json();
    for (const p of json.data?.products?.resultList ?? []) {
      if (p.linkCode?.clickUrl) links.set(`${advertiserId}:${p.id}`, p.linkCode.clickUrl);
    }
  }
}

let updated = 0;
const contents = Object.fromEntries(FILES.map((f) => [f, readFileSync(f, 'utf8')]));
for (const p of pending) {
  const url = links.get(`${p.advertiserId}:${p.productId}`);
  if (!url) continue;
  const next = p.block
    .replace(/affiliateUrl: (['"]).*?\1,/, `affiliateUrl: ${JSON.stringify(url)},`)
    .replace(/\n    linkPending: true,/, '');
  contents[p.file] = contents[p.file].replace(p.block, next);
  updated++;
}
for (const f of FILES) writeFileSync(f, contents[f]);

const waiting = [...byAdvertiser.keys()].filter((a) => ![...links.keys()].some((k) => k.startsWith(`${a}:`)));
console.log(`${pending.length} prodotti in attesa, ${updated} aggiornati con link tracciato.`);
if (waiting.length) console.log(`Merchant non ancora approvati (nessun link generato): ${waiting.join(', ')}`);
