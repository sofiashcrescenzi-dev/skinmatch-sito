#!/usr/bin/env node
// LE MINIATURE QUADRATE DEI POST DI SKINMATCH (23/11/2026), per il calendario di admin › Social. Il PO: «questa sorta di
// calendario con i post attaccati sul giorno giusto come riassunto fallo pure su elea e skinmatch» e «voglio l'immagine
// di copertina quadrata in piccolo».
// Per ogni cartella di public/social con una copertina scrive mini.webp, 192 × 192 (circa 7 KB al posto dei 250 della
// copertina): per i video il quadrato poco sotto la testata, per i caroselli dall'alto. Si rifà solo se la copertina è
// più recente. Uso: node scripts/miniature-social.mjs (dopo aver reso i post; le miniature vanno nel repository).
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const SOCIAL = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'social');
let fatte = 0;
for (const c of readdirSync(SOCIAL)) {
  const dir = join(SOCIAL, c);
  if (!statSync(dir).isDirectory()) continue;
  const fonte = ['copertina.jpg', 'copertina.png', '01.png', '01.jpg'].find((f) => existsSync(join(dir, f)));
  if (!fonte) continue;
  const mini = join(dir, 'mini.webp');
  if (existsSync(mini) && statSync(mini).mtimeMs >= statSync(join(dir, fonte)).mtimeMs) continue;
  const img = sharp(join(dir, fonte));
  const { width: W, height: H } = await img.metadata();
  const lato = Math.min(W, H);
  const top = H / W > 1.5 ? Math.round(Math.min(H - lato, H * 0.13)) : 0;
  await img.extract({ left: Math.round((W - lato) / 2), top, width: lato, height: lato }).resize(192, 192).webp({ quality: 78 }).toFile(mini);
  fatte++;
}
console.log(`miniature: ${fatte} fatte`);
