'use client';

import { useEffect } from 'react';
import { segna } from '@/lib/eventi';

// DA DOVE ARRIVA CHI ENTRA (13/11/2026, Federico: «predisporre … dati search console e IA»). Una volta per visita
// (sessionStorage, niente cookie) si manda solo la famiglia della fonte e la sezione d'ingresso: l'indirizzo di
// provenienza non lascia il telefono. Così la Dashboard vede quante persone mandano ChatGPT, Perplexity, Gemini,
// Google o Instagram, e su quali pagine atterrano.
const FAMIGLIE: [RegExp, string][] = [
  [/(^|\.)(chatgpt\.com|chat\.openai\.com|openai\.com)$/, 'chatgpt'],
  [/(^|\.)perplexity\.ai$/, 'perplexity'],
  [/(^|\.)gemini\.google\.com$|(^|\.)bard\.google\.com$/, 'gemini'],
  [/(^|\.)claude\.ai$/, 'claude'],
  [/(^|\.)copilot\.microsoft\.com$/, 'copilot'],
  [/(^|\.)(you\.com|phind\.com|meta\.ai|grok\.com|x\.ai|mistral\.ai|chat\.deepseek\.com|poe\.com)$/, 'altra_ia'],
  [/(^|\.)google\.[a-z.]+$/, 'google'],
  [/(^|\.)bing\.com$/, 'bing'],
  [/(^|\.)(duckduckgo\.com|ecosia\.org|yahoo\.com|search\.brave\.com|qwant\.com|startpage\.com)$/, 'altro_motore'],
  [/(^|\.)instagram\.com$/, 'instagram'],
  [/(^|\.)tiktok\.com$/, 'tiktok'],
  [/(^|\.)(facebook\.com|fb\.com|m\.facebook\.com|l\.facebook\.com)$/, 'facebook'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'youtube'],
  [/(^|\.)threads\.(net|com)$/, 'threads'],
  [/(^|\.)pinterest\.[a-z.]+$/, 'pinterest'],
];

function fonte(): string {
  const q = new URLSearchParams(location.search);
  const utm = (q.get('utm_source') || '').toLowerCase();
  if (utm === 'chatgpt.com' || utm === 'chatgpt') return 'chatgpt';
  if (utm === 'perplexity') return 'perplexity';
  // dalla pagina /link: utm_source è la piattaforma (instagram, tiktok…), utm_medium=linkinbio
  if (q.get('utm_medium') === 'linkinbio') return ['instagram', 'tiktok', 'facebook', 'youtube', 'threads', 'pinterest'].includes(utm) ? utm : 'link_in_bio';
  let host = '';
  if (document.referrer) {
    try { host = new URL(document.referrer).hostname.toLowerCase(); } catch { host = ''; }
  }
  if (host && host === location.hostname) return '';
  // ⚠️ LE APP SI RICONOSCONO DALLO USER AGENT (20/11/2026, Federico: «su skinmatch facebook rappresenta tiktok?»). Il
  // browser dentro TikTok non manda il referrer (le visite finivano in «Diretto o app»), quello di Instagram passa
  // spesso da l.facebook.com (finivano in «Facebook»). Il nome dell'app sta nello user agent: vale prima del referrer.
  const ua = navigator.userAgent || '';
  if (/musical_ly|BytedanceWebview|TikTok|trill_\d/i.test(ua)) return 'tiktok';
  if (/Instagram/i.test(ua)) return 'instagram';
  if (/Barcelona/.test(ua)) return 'threads';
  if (/FBAN|FBAV|FB_IAB|FBIOS/.test(ua)) return 'facebook';
  if (/Pinterest/i.test(ua)) return 'pinterest';
  if (!host) return 'diretto';
  for (const [re, f] of FAMIGLIE) if (re.test(host)) return f;
  return 'altro_sito';
}

function sezione(): string {
  const p = location.pathname.split('/')[1] || 'home';
  return ['test', 'risultato', 'biotipi', 'catalogo', 'rivista', 'glossario', 'integratori', 'chi-siamo', 'link'].includes(p) ? p : p === 'home' ? 'home' : 'altro';
}

// ⚠️ LA FONTE RESTA PER TUTTA LA VISITA (24/11/2026, Federico: «voglio che lo adegui anche per skinmatch», dopo la
// Panoramica di Agoranomos con «Comprano» diviso per canale). Al posto dell'«1» di prima, sessionStorage tiene il nome
// della famiglia (google, chatgpt, instagram…): la stessa cosa che parte col conteggio, nessun identificativo. Il clic
// verso un negozio la rilegge (fonteVisita) per contare i clic di ogni fonte e scriverla nel SubID (lib/subid.ts).
// «-» = la visita era già cominciata su Skinmatch (il referrer siamo noi): la fonte non si sa.
let fonteMemoria = '';
export function fonteVisita(): string {
  if (fonteMemoria) return fonteMemoria;
  try { const v = sessionStorage.getItem('sm-arrivo'); if (v && v !== '1') return v; } catch { /* niente */ }
  return '';
}

export default function Arrivi() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem('sm-arrivo')) return;
    } catch { /* senza sessionStorage si conta lo stesso, al massimo due volte */ }
    const f = fonte();
    fonteMemoria = f || '-';
    try { sessionStorage.setItem('sm-arrivo', fonteMemoria); } catch { /* niente */ }
    if (f) segna({ e: 'arrivo', f, pg: sezione() });
  }, []);
  return null;
}
