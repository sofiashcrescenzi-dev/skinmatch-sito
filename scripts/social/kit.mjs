// IL KIT DEI PROFILI SOCIAL DI SKINMATCH (8/11/2026, il PO: «tutti i loghi, background, descrizioni che servono per
// instagram, tiktok, thread e youtube»). Disegna in public/social/kit/ le immagini che admin › Social offre da scaricare:
// la foto profilo, la copertina e la foto di YouTube, le cinque copertine delle storie in evidenza e tre sfondi.
// Tutto dal marchio Fototipi (media/brand/IDENTITA.md): cacao, latte, la scala dei sei fototipi, il segno a due
// mezzelune, Familjen Grotesk e Inclusive Sans dai file del sito. Chromium di Playwright (cache npx del Mac).
//
// Uso: node scripts/social/kit.mjs [percorso del modulo playwright]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const QUI = path.dirname(fileURLToPath(import.meta.url));
const RADICE = path.resolve(QUI, '../..');
const OUT = path.join(RADICE, 'public/social/kit');
const FONT = path.join(RADICE, 'src/app/fonts');
const PW = process.argv[2] || '/Users/greeko/.npm/_npx/9833c18b2d85bc59/node_modules/playwright/index.mjs';
const CHROME = '/Users/greeko/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-x64/chrome-headless-shell';
const { chromium } = await import(pathToFileURL(PW).href);

const F = { I: '#F6DDCC', II: '#EBC3A6', III: '#D29E78', IV: '#A8714E', V: '#7B4B33', VI: '#4A2C1F' };
const CACAO = '#2E1C15', LATTE = '#FAF6F4';
// il segno: due mezzelune sfalsate, la destra scende (viewBox del marchio)
const segno = (sx, dx = F.IV, lato = 200) => `<svg width="${lato}" height="${lato * 81 / 84}" viewBox="-1 -75.79 86 83"><path d="M37.23,-74.79A37.23,37.23 0 0 0 37.23,-0.34Z" fill="${sx}"${sx === F.VI ? ' stroke="#66574F" stroke-width="1.2"' : ''}/><path d="M41.54,-68.91A37.23,37.23 0 0 1 41.54,5.54Z" fill="${dx}"/></svg>`;
const striscia = (largo, alto) => `<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:${Math.round(alto / 3)}px;width:${largo}px;height:${alto}px">${Object.values(F).map((c, i) => `<i style="display:block;border-radius:${alto / 2}px;background:${c};${i === 5 ? 'outline:2px solid #66574F;' : ''}"></i>`).join('')}</div>`;
// i font dentro la pagina: una pagina scritta con setContent non può leggere file locali (Chromium ripiega su Helvetica)
const dentro = (f) => `data:font/woff2;base64,${fs.readFileSync(path.join(FONT, f)).toString('base64')}`;
const testa = `<style>
@font-face { font-family: Familjen; src: url('${dentro('familjen-grotesk-latin.woff2')}') format('woff2'); font-weight: 400 700; }
@font-face { font-family: Inclusive; src: url('${dentro('inclusive-sans-latin.woff2')}') format('woff2'); font-weight: 300 700; }
* { box-sizing: border-box; margin: 0; } body { width: 100vw; height: 100vh; overflow: hidden; }
.f { font-family: Familjen, sans-serif; font-weight: 700; letter-spacing: -0.02em; } .s { font-family: Inclusive, sans-serif; }
</style>`;
const pagina = (w, h, fondo, corpo) => `<!doctype html><html><head><meta charset="utf-8">${testa}</head><body style="width:${w}px;height:${h}px;background:${fondo};position:relative">${corpo}</body></html>`;
// le grandi mezzelune di fondo, tagliate dal bordo: il gesto del marchio in grande
const lune = (w, h, a, b, op = 0.16) => `<svg style="position:absolute;inset:0" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <path d="M${w * 0.62},${-h * 0.18} A${h * 0.62},${h * 0.62} 0 0 0 ${w * 0.62},${h * 1.06} Z" fill="${a}" opacity="${op}"/>
  <path d="M${w * 0.66},${-h * 0.08} A${h * 0.62},${h * 0.62} 0 0 1 ${w * 0.66},${h * 1.16} Z" fill="${b}" opacity="${op}"/></svg>`;

const LAVORI = [
  ['youtube-banner-2560x1440.png', 2560, 1440, pagina(2560, 1440, CACAO, `${lune(2560, 1440, F.II, F.IV, 0.07)}
    <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:1546px;height:423px;display:flex;align-items:center;gap:56px;padding:0 40px">
      ${segno(F.II, F.IV, 230)}
      <div style="display:grid;gap:22px"><div class="f" style="color:${LATTE};font-size:124px;line-height:.95">La pelle spiegata.</div>
      ${striscia(380, 16)}
      <div class="s" style="color:#D9C8BE;font-size:40px">Un video ogni tre giorni · skinmatch.it</div></div></div>`)],
  // cinque copertine, cinque fototipi a sinistra (I, II, III, V, VI); a destra sempre il IV (IDENTITA.md)
  ...[['test', 'Il test', F.II], ['biotipi', 'Biotipi', F.III], ['attivi', 'Attivi', F.I], ['routine', 'Routine', F.V], ['miti', 'Miti', F.VI]].map(([k, parola, c]) => [
    `evidenza-${k}.png`, 1080, 1920, pagina(1080, 1920, CACAO, `
    <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:grid;justify-items:center;gap:56px">
      ${segno(c, F.IV, 340)}
      <div class="f" style="color:${LATTE};font-size:118px;line-height:1">${parola}</div></div>`)]),
  ['sfondo-storia-1080x1920.png', 1080, 1920, pagina(1080, 1920, CACAO, `${lune(1080, 1920, F.II, F.IV, 0.1)}
    <div style="position:absolute;left:84px;bottom:150px">${striscia(300, 14)}</div>
    <div style="position:absolute;left:84px;bottom:84px;display:flex;align-items:center;gap:18px">${segno(F.II, F.IV, 46)}<span class="f" style="color:${LATTE};font-size:40px">skinmatch</span></div>`)],
  ['sfondo-post-1080x1350.png', 1080, 1350, pagina(1080, 1350, CACAO, `${lune(1080, 1350, F.II, F.IV, 0.1)}
    <div style="position:absolute;left:84px;bottom:150px">${striscia(300, 14)}</div>
    <div style="position:absolute;left:84px;bottom:76px;display:flex;align-items:center;gap:18px">${segno(F.II, F.IV, 46)}<span class="f" style="color:${LATTE};font-size:40px">skinmatch</span></div>
    <div class="f" style="position:absolute;right:84px;bottom:82px;color:${F.II};font-size:30px">skinmatch.it</div>`)],
  ['sfondo-chiaro-1080x1350.png', 1080, 1350, pagina(1080, 1350, LATTE, `${lune(1080, 1350, F.V, F.IV, 0.07)}
    <div style="position:absolute;left:84px;bottom:150px">${striscia(300, 14)}</div>
    <div style="position:absolute;left:84px;bottom:76px;display:flex;align-items:center;gap:18px">${segno(F.V, F.IV, 46)}<span class="f" style="color:${CACAO};font-size:40px">skinmatch</span></div>
    <div class="f" style="position:absolute;right:84px;bottom:82px;color:${F.V};font-size:30px">skinmatch.it</div>`)],
  // la foto profilo: il segno su scuro, grande abbastanza da leggersi a 110 px nel cerchio
  ['avatar-1080.png', 1080, 1080, pagina(1080, 1080, CACAO, `<div style="position:absolute;left:50%;top:50%;transform:translate(-52%,-50%)">${segno(F.II, F.IV, 640)}</div>`)],
  ['youtube-avatar-800.png', 800, 800, pagina(800, 800, CACAO, `<div style="position:absolute;left:50%;top:50%;transform:translate(-52%,-50%)">${segno(F.II, F.IV, 470)}</div>`)],
];

fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ executablePath: CHROME });
for (const [nome, w, h, html] of LAVORI) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await p.setContent(html, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: path.join(OUT, nome), type: 'png' });
  await p.close();
  console.log('  ✓', nome);
}
await b.close();
