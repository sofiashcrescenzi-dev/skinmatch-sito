#!/usr/bin/env node
// Scarica dai merchant CJ i prodotti delle marche indicate e li salva come
// "candidati" da valutare prima di aggiungerli al catalogo (src/lib/products.ts).
// Strumento solo locale: le credenziali stanno in ~/.secrets/cj-affiliate.env,
// mai nel repo né su Cloudflare.
//
// Uso:
//   node scripts/feeds/cj-candidates.mjs
//   node scripts/feeds/cj-candidates.mjs --brands "Caudalie,SVR" --partners 4917850 --limit 30

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const MERCHANTS = {
  4917850: 'Notino.it',
  6585019: 'Marionnaud IT',
  7202609: 'QVC IT',
};

const DEFAULT_BRANDS = [
  'Medicube', 'Caudalie', 'Sisley', 'SVR', 'La Roche-Posay', 'Avène', 'Beauty of Joseon', 'COSRX',
  'Anua', 'SKIN1004', 'Round Lab', 'Torriden', 'Dr. Althea', 'CeraVe', 'Bioderma', 'La Mer',
  'Dermalogica', 'Vichy', 'Ducray', 'ISDIN', 'Collistar', 'Filorga', 'Missha',
];

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
}

const env = Object.fromEntries(
  readFileSync(join(homedir(), '.secrets/cj-affiliate.env'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('='))
    .map((l) => l.trim().split(/=(.*)/s).slice(0, 2))
);
const { CJ_PERSONAL_ACCESS_TOKEN: TOKEN, CJ_COMPANY_ID: CID, CJ_PID: PID } = env;

const brands = arg('brands', DEFAULT_BRANDS.join(',')).split(',').map((s) => s.trim());
const partners = arg('partners', Object.keys(MERCHANTS).join(',')).split(',').map((s) => s.trim());
const limit = Number(arg('limit', 50));

const normalize = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

async function query(gql) {
  const res = await fetch('https://ads.api.cj.com/query', {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: gql }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`CJ ${res.status}: ${text.slice(0, 200)}`);
  return JSON.parse(text);
}

const candidates = [];
const summary = [];

for (const brand of brands) {
  const row = { brand };
  for (const partnerId of partners) {
    const gql = `{ products(companyId: "${CID}", partnerIds: ["${partnerId}"], keywords: [${JSON.stringify(brand)}], limit: ${limit}) {
      resultList { id title brand description imageLink link joinedStatus advertiserId advertiserName
        price { amount currency } salePrice { amount currency }
        linkCode(pid: "${PID}") { clickUrl } } } }`;
    let list = [];
    try {
      list = (await query(gql)).data.products.resultList;
    } catch (e) {
      console.error(`  ${brand} @ ${MERCHANTS[partnerId] || partnerId}: ${e.message}`);
    }
    const key = normalize(brand).split(' ')[0];
    const matches = list.filter((p) => normalize(p.brand).includes(key));
    row[partnerId] = matches.length;
    for (const p of matches) {
      candidates.push({
        source: 'cj',
        merchant: p.advertiserName,
        advertiserId: p.advertiserId,
        joined: p.joinedStatus,
        brand: p.brand,
        title: p.title,
        description: (p.description || '').replace(/\s+/g, ' ').trim(),
        price: Number(p.salePrice?.amount || p.price?.amount),
        currency: p.price?.currency,
        image: p.imageLink,
        productUrl: p.link,
        affiliateUrl: p.linkCode?.clickUrl || null,
        cjProductId: p.id,
      });
    }
  }
  summary.push(row);
}

const outDir = join(process.cwd(), 'feeds-out');
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, `cj-${new Date().toISOString().slice(0, 10)}.json`);
writeFileSync(outFile, JSON.stringify(candidates, null, 2));

const header = ['marca'.padEnd(18), ...partners.map((p) => (MERCHANTS[p] || p).padEnd(14))].join(' | ');
console.log(header);
for (const row of summary) {
  console.log([row.brand.padEnd(18), ...partners.map((p) => String(row[p]).padEnd(14))].join(' | '));
}
const withLink = candidates.filter((c) => c.affiliateUrl).length;
console.log(`\n${candidates.length} prodotti candidati, ${withLink} con link tracciato (merchant già approvati).`);
console.log(`Salvati in ${outFile}`);
