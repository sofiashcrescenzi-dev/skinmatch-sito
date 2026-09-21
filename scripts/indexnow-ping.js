#!/usr/bin/env node
// Notifica IndexNow (Bing, Yandex e altri motori aderenti) con l'elenco completo
// di URL del sito, ogni volta che gira `npm run build` (quindi a ogni deploy).
// Non copre Google (nessuna API pubblica equivalente per siti normali): la
// leva per Google resta la sitemap, sempre tenuta aggiornata da sitemap.ts.
//
// Fallisce in silenzio (non deve mai bloccare la build/il deploy del sito):
// un problema con IndexNow non è mai un motivo per non pubblicare il sito.

const fs = require('fs');
const path = require('path');
const https = require('https');

const HOST = 'skinmatch.it';
const OUT_DIR = path.join(__dirname, '..', 'out');

function findIndexNowKey() {
  const files = fs.readdirSync(OUT_DIR);
  const match = files.find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
  return match ? match.replace('.txt', '') : null;
}

function readSitemapUrls() {
  const sitemapPath = path.join(OUT_DIR, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) return [];
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)];
  return matches.map((m) => m[1]);
}

function ping(key, urls) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      host: HOST,
      key,
      keyLocation: `https://${HOST}/${key}.txt`,
      urlList: urls,
    });
    const req = https.request(
      {
        hostname: 'api.indexnow.org',
        path: '/indexnow',
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': Buffer.byteLength(body) },
        timeout: 8000,
      },
      (res) => {
        console.log(`[indexnow] risposta: ${res.statusCode}`);
        resolve();
      }
    );
    req.on('error', (err) => {
      console.log(`[indexnow] non raggiungibile, continuo comunque: ${err.message}`);
      resolve();
    });
    req.on('timeout', () => { req.destroy(); resolve(); });
    req.write(body);
    req.end();
  });
}

(async () => {
  try {
    const key = findIndexNowKey();
    const urls = readSitemapUrls();
    if (!key || urls.length === 0) {
      console.log('[indexnow] chiave o sitemap non trovate, salto (non blocco la build)');
      return;
    }
    console.log(`[indexnow] notifico ${urls.length} URL...`);
    await ping(key, urls);
  } catch (err) {
    console.log(`[indexnow] errore ignorato: ${err.message}`);
  }
})();
