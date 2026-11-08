// I SOCIAL DI SKINMATCH (8/11/2026, il PO: «creare nell'admin di skinmatch anche tutta l'infrastruttura social: il
// linktree con la stessa struttura degli altri, tutti i loghi, background, descrizioni per instagram, tiktok, threads e
// youtube»). I dati stanno in src/data/social.json (documento dell'admin «social», admin › Social) e i post in
// src/data/social-post.json, che scrive il motore dei video (Agoranomos/social/remotion) con i file in public/social/.
import social from '@/data/social.json';
import indice from '@/data/social-post.json';
import RETI_JSON from '@/lib/reti-social.json';
import { ARTICOLI } from '@/lib/dati';

export type Rete = 'instagram' | 'tiktok' | 'threads' | 'youtube';
export type Profilo = { nome: string; handle: string; bio: string; url: string; categoria: string };
export type Bottone = { etichetta: string; url: string; colore: Stile; attivo: boolean };
export type Vetrina = { mostra: boolean; scelti: string[] | null };
export type Social = { profili: Record<Rete, Profilo>; link: { titolo: string; frase: string; bottoni: Bottone[]; vetrina: Vetrina; piede: string } };
export type Post = {
  id: string; data: string; ora: string; tipo: 'video' | 'carosello'; titolo: string; slug: string; pagina: string;
  base: string; copertina: string; file: string[]; didascalie: Record<string, string>; hashtag: string[]; alt: string[];
  note?: string; sofia?: string;
};

export const SOCIAL = social as unknown as Social;
export const POST = ((indice as unknown as { post: Post[] }).post || []).slice().sort((a, b) => `${b.data} ${b.ora}`.localeCompare(`${a.data} ${a.ora}`));
export const RETI = RETI_JSON as { k: Rete; nome: string; base: string; d: string }[];

// I LIMITI DI CARATTERI di ogni piattaforma, per i contatori dell'admin (verificati l'8/11/2026)
export const LIMITI: Record<Rete, { nome: number; bio: number; handle: number }> = {
  instagram: { nome: 30, bio: 150, handle: 30 },
  tiktok: { nome: 30, bio: 80, handle: 24 },
  threads: { nome: 30, bio: 150, handle: 30 },
  youtube: { nome: 100, bio: 1000, handle: 30 },
};

// I CINQUE COLORI DEI BOTTONI, dalla palette Fototipi (media/brand/IDENTITA.md): cacao pieno, fototipo II, velo,
// contorno su latte, fototipo V. Il primo bottone di solito è il pieno.
export type Stile = 'pieno' | 'pesca' | 'velo' | 'contorno' | 'terra';
export const STILI: Record<Stile, { nome: string; fondo: string; testo: string; bordo: string }> = {
  pieno: { nome: 'Cacao', fondo: '#2E1C15', testo: '#FAF6F4', bordo: '#2E1C15' },
  pesca: { nome: 'Fototipo II', fondo: '#EBC3A6', testo: '#2E1C15', bordo: '#EBC3A6' },
  velo: { nome: 'Velo', fondo: '#F1E9E4', testo: '#2E1C15', bordo: '#F1E9E4' },
  contorno: { nome: 'Contorno', fondo: '#FFFFFF', testo: '#2E1C15', bordo: 'rgba(46, 28, 21, 0.28)' },
  terra: { nome: 'Fototipo V', fondo: '#7B4B33', testo: '#FAF6F4', bordo: '#7B4B33' },
};

// Oggi, alla build: i post compaiono dal giorno di uscita (la pagina si rifà a ogni pubblicazione, tutti i giorni)
const oggi = () => new Date().toISOString().slice(0, 10);
export const usciti = () => POST.filter((p) => p.data <= oggi());

// LA VETRINA DI /link: i post usciti e gli articoli della Rivista. Il PO sceglie in admin quali e in che ordine, o la
// spegne; senza scelta, i quattro più recenti (due righe da due).
export type Box = { tipo: string; titolo: string; href: string; immagine: string | null; data: string };
export function candidati(): Box[] {
  const post = usciti().map((p) => ({ tipo: p.tipo === 'video' ? 'Video' : 'Carosello', titolo: p.titolo, href: p.pagina, immagine: `${p.base}/${p.copertina}`, data: p.data }));
  const articoli = ARTICOLI.map((a) => ({ tipo: 'Rivista', titolo: a.titolo, href: `/rivista/${a.slug}`, immagine: a.immagine?.file ? `/immagini/${a.immagine.file}-800.webp` : null, data: a.pubblicato_il }));
  // un post e il suo articolo portano allo stesso posto: resta il post, che ha la copertina del video
  const visti = new Set(post.map((p) => p.href));
  return [...post, ...articoli.filter((a) => !visti.has(a.href))].sort((a, b) => b.data.localeCompare(a.data));
}
export function vetrina(conf: Vetrina = SOCIAL.link.vetrina): Box[] {
  if (conf?.mostra === false) return [];
  const tutti = candidati();
  if (Array.isArray(conf?.scelti)) return conf.scelti.map((h) => tutti.find((x) => x.href === h)).filter((x): x is Box => !!x);
  return tutti.slice(0, 4);
}

// «L'ultimo video, spiegato» (bottone @ultimo-video): la pagina d'arrivo dell'ultimo post uscito; senza post, il bottone non c'è
export const ultimoVideo = () => usciti()[0]?.pagina || null;
export const indirizzoBottone = (b: Bottone) => (b.url === '@ultimo-video' ? ultimoVideo() : b.url);
