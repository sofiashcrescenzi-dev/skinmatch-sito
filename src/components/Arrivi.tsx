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
  if (!document.referrer) return 'diretto';
  let host = '';
  try { host = new URL(document.referrer).hostname.toLowerCase(); } catch { return 'diretto'; }
  if (host === location.hostname) return '';
  for (const [re, f] of FAMIGLIE) if (re.test(host)) return f;
  return 'altro_sito';
}

function sezione(): string {
  const p = location.pathname.split('/')[1] || 'home';
  return ['test', 'risultato', 'biotipi', 'catalogo', 'rivista', 'glossario', 'integratori', 'chi-siamo', 'link'].includes(p) ? p : p === 'home' ? 'home' : 'altro';
}

export default function Arrivi() {
  useEffect(() => {
    try {
      if (sessionStorage.getItem('sm-arrivo')) return;
      sessionStorage.setItem('sm-arrivo', '1');
    } catch { /* senza sessionStorage si conta lo stesso, al massimo due volte */ }
    const f = fonte();
    if (f) segna({ e: 'arrivo', f, pg: sezione() });
  }, []);
  return null;
}
