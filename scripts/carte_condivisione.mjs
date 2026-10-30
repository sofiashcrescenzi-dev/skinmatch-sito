// LE CARTE DEI RISULTATI CONDIVISI (30/10/2026, Federico: «il contenuto condiviso deve far capire la skincare della
// persona e spingere a fare il test»). Una carta 1200×630 per biotipo, in public/condividi/<biotipo>.jpg: è
// l'anteprima che WhatsApp, Telegram e Messaggi mostrano sotto il link /risultato/<biotipo>#<codice>.
// I colori e i segni della carta generica del sito (media/brand/condivisione-1200x630.png): fondo cacao, logo, la
// striscia dei sei fototipi, la foto nelle due mezze lune del segno (una foto sola, divisa; la metà destra scende).
// ⚠️ IL TESTO STA TUTTO NEL QUADRATO CENTRALE (30/10/2026, Federico: «nell'immagine ci deve entrare tutto, invece lo
// vedo a metà»): WhatsApp e altre app ritagliano l'anteprima al centro, in un quadrato. Le due metà della foto vanno
// ai lati, fuori dal quadrato: nella carta intera incorniciano il risultato, in quella ritagliata non tagliano niente.
//
// Uso:  node scripts/carte_condivisione.mjs            tutte le carte che mancano
//       node scripts/carte_condivisione.mjs --tutte    rifà anche quelle che ci sono (titolo, motto o foto cambiati)
// Serve Chrome installato sul Mac (playwright-core lo usa, non scarica browser).
import { chromium } from 'playwright-core';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const R = join(import.meta.dirname, '..');
const OUT = join(R, 'public', 'condividi');
const tutte = process.argv.includes('--tutte');
const { biotipi } = JSON.parse(readFileSync(join(R, 'src/data/biotipi.json'), 'utf8'));
const crediti = JSON.parse(readFileSync(join(R, 'public/immagini/crediti.json'), 'utf8'));
const b64 = (f) => readFileSync(f).toString('base64');
const font = (f) => `url(data:font/woff2;base64,${b64(join(R, 'src/app/fonts', f))}) format('woff2')`;
const logo = readFileSync(join(R, 'media/brand/logo-chiaro.svg'), 'utf8');

// la foto come la sceglie il sito (src/lib/dati.ts fotoDi): quella del biotipo se c'è, se no quella della famiglia
const fotoDi = (b) => (crediti.some((c) => c.nome === `biotipo-${b.id}`) ? `biotipo-${b.id}` : b.famiglia);
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function pagina(b) {
  const nome = fotoDi(b);
  const fuoco = crediti.find((c) => c.nome === nome)?.fuoco || '50% 40%';
  const foto = `data:image/webp;base64,${b64(join(R, 'public/immagini', `${nome}-1600.webp`))}`;
  const io = b.area === 'integrazione' ? 'Il mio profilo' : 'Il mio biotipo';
  const invito = b.area === 'integrazione' ? 'Scopri il tuo profilo' : 'Scopri il tuo biotipo';
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  @font-face { font-family: T; src: ${font('familjen-grotesk-latin.woff2')}; font-weight: 400 700; }
  @font-face { font-family: S; src: ${font('inclusive-sans-latin.woff2')}; font-weight: 300 700; }
  @font-face { font-family: S; src: ${font('inclusive-sans-corsivo-latin.woff2')}; font-weight: 300 700; font-style: italic; }
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; background: #2e1c15; color: #faf6f4; font-family: S; position: relative; overflow: hidden; }
  /* tutto il testo nel quadrato centrale (x 285-915): WhatsApp e altri ritagliano l'anteprima al centro */
  .centro { position: absolute; left: 320px; width: 560px; top: 44px; bottom: 46px; display: flex; flex-direction: column; align-items: center; text-align: center; }
  .logo svg { height: 30px; width: auto; display: block; }
  .corpo { margin: auto 0; display: flex; flex-direction: column; align-items: center; gap: 16px; }
  .etichetta { font-weight: 700; font-size: 20px; letter-spacing: .1em; text-transform: uppercase; color: #ebc3a6; }
  h1 { font-family: T; font-weight: 700; line-height: 1.04; letter-spacing: -.012em; font-size: 60px; text-wrap: balance; }
  .scala { display: grid; grid-template-columns: repeat(6, 1fr); width: 200px; height: 9px; border-radius: 5px; overflow: hidden; }
  .scala i:nth-child(1){background:#f6ddcc}.scala i:nth-child(2){background:#ebc3a6}.scala i:nth-child(3){background:#d29e78}
  .scala i:nth-child(4){background:#a8714e}.scala i:nth-child(5){background:#7b4b33}.scala i:nth-child(6){background:#4a2c1f;box-shadow:inset 0 0 0 1px #6b4a3c}
  .motto { font-style: italic; font-size: 24px; line-height: 1.3; color: #d9c8be; text-wrap: balance; }
  .invito { display: inline-flex; align-items: center; gap: 12px; background: #ebc3a6; color: #2e1c15; font-weight: 700; font-size: 22px; border-radius: 999px; padding: 12px 26px 12px 20px; }
  .invito .s { position: relative; width: 24px; height: 24px; }
  .invito .s i { position: absolute; top: 0; width: 12px; height: 24px; }
  .invito .s i:first-child { left: 0; border-radius: 12px 0 0 12px; background: #7b4b33; transform: translate(-3px,-2px); }
  .invito .s i:last-child { right: 0; border-radius: 0 12px 12px 0; background: #a8714e; transform: translate(3px,3px); }
  .invito em { font-style: normal; font-weight: 400; opacity: .78; }
  /* il segno aperto: le due metà della foto ai lati, la destra più in basso, il risultato in mezzo */
  .mezza { position: absolute; width: 240px; height: 480px; overflow: hidden; }
  .mezza.a { left: 30px; top: 66px; border-radius: 240px 0 0 240px; }
  .mezza.b { right: 30px; top: 98px; border-radius: 0 240px 240px 0; }
  .mezza img { position: absolute; top: 0; width: 480px; height: 480px; object-fit: cover; object-position: ${fuoco}; }
  .mezza.a img { left: 0; }
  .mezza.b img { left: -240px; }
  </style></head><body>
  <div class="mezza a"><img src="${foto}" alt=""></div><div class="mezza b"><img src="${foto}" alt=""></div>
  <div class="centro">
    <div class="logo">${logo.replace(/<\?xml[^>]*>/, '')}</div>
    <div class="corpo">
      <span class="etichetta">${io}</span>
      <h1>${esc(b.titolo)}</h1>
      <div class="scala"><i></i><i></i><i></i><i></i><i></i><i></i></div>
      <p class="motto">${esc(b.motto)}</p>
    </div>
    <span class="invito"><span class="s"><i></i><i></i></span>${invito} <em>· skinmatch.it</em></span>
  </div>
  </body></html>`;
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const pg = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
let fatte = 0;
for (const b of biotipi.filter((x) => x.tipo === 'biotipo')) {
  const dest = join(OUT, `${b.id}.jpg`);
  if (existsSync(dest) && !tutte) continue;
  await pg.setContent(pagina(b), { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  // il titolo resta in tre righe al massimo: si stringe finché non ci sta
  await pg.evaluate(() => {
    const h = document.querySelector('h1');
    let s = 60;
    while (s > 34 && h.getBoundingClientRect().height > s * 1.04 * 3 + 2) { s -= 2; h.style.fontSize = `${s}px`; }
  });
  await pg.screenshot({ path: dest, type: 'jpeg', quality: 84 });
  fatte++;
}
await browser.close();
console.log(`${fatte} carte in public/condividi`);
