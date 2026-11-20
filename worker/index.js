// IL WORKER DI SKINMATCH: il sito resta statico (out/), il Worker fa tre cose sole.
// 1. /api/evento: somma i conteggi del sito (test iniziati e finiti, clic verso i negozi) per
//    giorno, senza dati personali: niente risposte, niente IP, niente cookie (tappa 9).
// 2. /admin e /api/admin: solo per chi passa da Cloudflare Access ed è nell'elenco ADMIN_EMAILS
//    (Federico e Sofia). Il Worker ricontrolla il gettone di Access da sé: se Access non c'è
//    ancora, o il gettone non torna, l'admin non si apre (meglio chiuso che aperto).
// 3. tutto il resto: i file statici, come prima.
// 4. le pagine che non ci sono: i prodotti usciti rinviano alla categoria, il resto ha il 404.
//
// ⚠️ ACCESS: si attiva nella dashboard di Cloudflare (Zero Trust → Access → Applications), sul
// percorso skinmatch.it/admin*; poi ACCESS_TEAM (il nome del team) e ACCESS_AUD (l'«Application
// Audience tag») vanno in wrangler.jsonc, vars. Istruzioni in DEPLOY.md.

import { mcp, schedaServer } from './mcp.js';
import test from '../src/data/test.json';
import biotipi from '../src/data/biotipi.json';

const TIPI_EVENTO = new Set(['test_inizio', 'test_fine', 'clic', 'guasto', 'arrivo']);
// da dove arriva chi entra (13/11/2026, Federico: «dashboard … dati search console e IA»): solo la famiglia
// della fonte e la sezione d'ingresso, decise nel telefono (src/components/Arrivi.tsx). Niente indirizzi interi.
const FONTI = new Set(['chatgpt', 'perplexity', 'gemini', 'claude', 'copilot', 'altra_ia', 'google', 'bing', 'altro_motore', 'instagram', 'tiktok', 'facebook', 'youtube', 'threads', 'pinterest', 'link_in_bio', 'altro_sito', 'diretto']);
const SEZIONI = new Set(['home', 'test', 'risultato', 'biotipi', 'catalogo', 'rivista', 'glossario', 'integratori', 'chi-siamo', 'link', 'altro']);
// solo percorsi e biotipi che esistono: nessuno scrive righe a caso nel Traffico (Friday, 15/10)
const PERCORSI = new Set(test.percorsi.map((p) => p.id));
const BIOTIPI = new Set(biotipi.biotipi.map((b) => b.id));
// chisiamo (7/11/2026, d-nome): le persone della pagina Chi siamo, con le foto caricate dall'admin
// social (8/11/2026): i profili e la pagina skinmatch.it/link, da admin › Social
const DOCUMENTI = new Set(['test', 'biotipi', 'glossario', 'catalogo', 'negozi', 'nozioni', 'chisiamo', 'social', 'cruscotto']);
const STATI_ARTICOLO = new Set(['in_approvazione', 'da_correggere', 'approvato', 'online', 'scartato']);
const STATI_SEGNALAZIONE = new Set(['aperta', 'in_lavoro', 'dopo', 'fatta', 'scartata']);
const STATI_MARCA = new Set(['da_studiare', 'da_contattare', 'contattata', 'risposto', 'decisa']);
const breve = (s, n = 80) => String(s ?? '').replace(/[^\p{L}\p{N}_.\- ]/gu, '').slice(0, n);
const json = (dati, stato = 200) => new Response(JSON.stringify(dati), { status: stato, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const oggi = () => new Date().toISOString().slice(0, 10);

// le intestazioni di sicurezza, le stesse di public/_headers (che vale solo per i file statici)
const SICUREZZA = {
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'SAMEORIGIN',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'content-security-policy': "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'",
};
function sicura(r) {
  if (r.status === 101) return r;
  const h = new Headers(r.headers);
  for (const [k, v] of Object.entries(SICUREZZA)) if (!h.has(k)) h.set(k, v);
  return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
}

export default {
  async fetch(req, env, ctx) {
    return sicura(await servi(req, env, ctx));
  },
};

async function servi(req, env, ctx) {
  const url = new URL(req.url);
  const p = url.pathname;
  // il server MCP e la sua descrizione (worker/mcp.js)
  if (p === '/mcp' || p === '/mcp/') return mcp(req, env, ctx);
  if (p === '/.well-known/mcp.json' || p === '/.well-known/mcp/server-card.json') return schedaServer();
  // la prova che il dominio è nostro per il registro ufficiale dei server MCP (registry.modelcontextprotocol.io):
  // la chiave pubblica sta nella variabile MCP_REGISTRY_AUTH di wrangler.jsonc, la privata solo sul Mac
  if (p === '/.well-known/mcp-registry-auth' && env.MCP_REGISTRY_AUTH) return new Response(env.MCP_REGISTRY_AUTH, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
  if (p === '/api/evento') return evento(req, env);
  if (p.startsWith('/api/admin/') || p === '/admin' || p.startsWith('/admin/')) {
    const chi = await accesso(req, env);
    if (!chi.ok) {
      if (p.startsWith('/api/')) return json({ errore: chi.motivo }, 401);
      return new Response(PAGINA_CHIUSA(chi.motivo), { status: 403, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex' } });
    }
    if (p.startsWith('/api/admin/')) {
      try { return await admin(req, env, url, chi.email); } catch (e) { return json({ errore: String(e && e.message || e) }, 500); }
    }
    const r = await env.ASSETS.fetch(req);
    const h = new Headers(r.headers); h.set('x-robots-tag', 'noindex'); h.set('cache-control', 'no-store');
    return new Response(r.body, { status: r.status, headers: h });
  }
  contaIa(req, env, ctx, p);
  const r = await env.ASSETS.fetch(req);
  if (r.status !== 404) return r;
  return nonTrovata(req, env, url);
}

// ⚠️ LE VISITE DEGLI ASSISTENTI (19/11/2026, Federico: «tracciamo le chiamate e citazioni sull'admin»). Il Worker passa
// prima su tutte le pagine (wrangler.jsonc, run_worker_first) e conta, per giorno, chi è un robot delle IA: chi apre la
// pagina MENTRE risponde a una persona («utente»: è una citazione), chi la legge per la ricerca dell'assistente
// («ricerca») e chi per addestrare i modelli («addestramento»). Solo il nome del robot e la sezione del sito: niente IP,
// niente indirizzi interi. In admin › Visibilità › Assistenti IA, con le chiamate al server MCP.
const ROBOT_IA = [
  [/ChatGPT-User/i, 'ChatGPT', 'utente'], [/OAI-SearchBot/i, 'ChatGPT', 'ricerca'], [/GPTBot/i, 'OpenAI', 'addestramento'],
  [/Claude-User/i, 'Claude', 'utente'], [/Claude-SearchBot/i, 'Claude', 'ricerca'], [/ClaudeBot|anthropic-ai/i, 'Anthropic', 'addestramento'],
  [/Perplexity-User/i, 'Perplexity', 'utente'], [/PerplexityBot/i, 'Perplexity', 'ricerca'],
  [/MistralAI-User/i, 'Mistral', 'utente'], [/DuckAssistBot/i, 'DuckDuckGo', 'utente'],
  [/meta-externalfetcher/i, 'Meta AI', 'utente'], [/meta-externalagent/i, 'Meta AI', 'addestramento'],
  [/Google-CloudVertexBot|Gemini/i, 'Gemini', 'ricerca'], [/Amazonbot/i, 'Amazon', 'ricerca'], [/Applebot/i, 'Apple', 'ricerca'],
  [/Bytespider/i, 'ByteDance', 'addestramento'], [/CCBot/i, 'Common Crawl', 'addestramento'], [/cohere-ai/i, 'Cohere', 'addestramento'],
];
function sezioneDi(p) {
  if (p === '/' || p === '') return 'home';
  if (p === '/llms.txt' || p === '/llms-full.txt') return 'llms.txt';
  if (p.startsWith('/md/')) return 'markdown';
  return p.split('/')[1] || 'home';
}
function contaIa(req, env, ctx, p) {
  if (!env.DB || !ctx || req.method !== 'GET') return;
  const ua = req.headers.get('user-agent') || '';
  const r = ROBOT_IA.find(([re]) => re.test(ua));
  if (!r) return;
  const giorno = new Date().toISOString().slice(0, 10);
  ctx.waitUntil(env.DB.prepare('INSERT INTO ia_visite (giorno, robot, tipo, sezione, n) VALUES (?1, ?2, ?3, ?4, 1) ON CONFLICT (giorno, robot, tipo, sezione) DO UPDATE SET n = n + 1')
    .bind(giorno, r[1], r[2], sezioneDi(p)).run().catch(() => {}));
}

// ── 4. le pagine che non ci sono ─────────────────────────────────────────────
// Un prodotto spostato di categoria rinvia alla sua pagina nuova (public: /indirizzi.json); uno uscito dal
// catalogo rinvia per sempre alla sua categoria, o al catalogo se la categoria non c'è più: mai un 404.
// Il resto riceve la pagina 404 del sito, con lo stato giusto.
async function nonTrovata(req, env, url) {
  const m = url.pathname.match(/^\/catalogo\/([a-z0-9-]+)\/([^/]+?)\/?$/);
  if (m) {
    // il prodotto c'è ancora ma è cambiata la categoria (admin): alla sua pagina di oggi
    try {
      const ora = (await (await env.ASSETS.fetch(new Request(new URL('/indirizzi.json', url)))).json())[m[2]];
      if (ora && ora !== url.pathname) return new Response(null, { status: 301, headers: { location: ora, 'cache-control': 'public, max-age=3600' } });
    } catch { /* senza l'elenco si va alla categoria */ }
    const cat = await env.ASSETS.fetch(new Request(new URL(`/catalogo/${m[1]}`, url)));
    return new Response(null, { status: 301, headers: { location: cat.ok ? `/catalogo/${m[1]}` : '/catalogo', 'cache-control': 'public, max-age=3600' } });
  }
  // LE PAGINE CHE NASCONO DAI PRODOTTI (19/11/2026, lib/percorsi.ts): «crema viso per pelle mista» esiste finché ha almeno
  // 4 prodotti, un ingrediente finché qualcuno lo contiene, una marca finché ne ha 10. Quando sparisce, si va alla pagina
  // madre (il tipo di pelle, l'elenco degli ingredienti o delle marche), mai al 404.
  const madre = url.pathname.match(/^\/biotipi\/([a-z0-9-]+)\/[^/]+\/?$/) ? `/biotipi/${url.pathname.split('/')[2]}`
    : /^\/ingredienti\/[^/]+\/?$/.test(url.pathname) ? '/ingredienti' : /^\/marche\/[^/]+\/?$/.test(url.pathname) ? '/marche' : null;
  if (madre) {
    const ok = (await env.ASSETS.fetch(new Request(new URL(madre, url)))).ok;
    return new Response(null, { status: 301, headers: { location: ok ? madre : madre.startsWith('/biotipi') ? '/biotipi' : '/', 'cache-control': 'public, max-age=3600' } });
  }
  const p = await env.ASSETS.fetch(new Request(new URL('/404', url)));
  return new Response(req.method === 'HEAD' ? null : p.body, { status: 404, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' } });
}

// ── 1. i conteggi ────────────────────────────────────────────────────────────
async function evento(req, env) {
  if (req.method !== 'POST') return new Response(null, { status: 405 });
  let e;
  try { e = JSON.parse((await req.text()).slice(0, 2000)); } catch { return new Response(null, { status: 400 }); }
  if (!e || !TIPI_EVENTO.has(e.e)) return new Response(null, { status: 400 });
  const g = oggi(), righe = [];
  if (e.e === 'test_inizio' && PERCORSI.has(e.p)) righe.push(['test_inizio', e.p]);
  if (e.e === 'test_fine' && PERCORSI.has(e.p)) {
    righe.push(['test_fine', e.p]);
    for (const b of (Array.isArray(e.b) ? e.b : []).slice(0, 3)) if (BIOTIPI.has(b)) righe.push(['biotipo', b]);
    // la durata, a mezzi minuti: l'admin ne ricava il tempo medio di ogni percorso (16/10)
    const sec = Math.round(Number(e.s));
    if (sec >= 15 && sec <= 1800) righe.push(['durata', `${e.p}:${Math.round(sec / 30) * 30}`]);
  }
  if (e.e === 'clic' && /^[a-z0-9-]{2,80}$/.test(String(e.id))) righe.push(['clic', e.id], ['clic_negozio', breve(e.m, 40)], ['clic_da', breve(e.da)]);
  // un errore JavaScript (src/lib/guasti.ts): la pagina senza query e il messaggio, niente altro (30/10/2026)
  if (e.e === 'guasto') {
    const pagina = (String(e.pg || '').match(/^\/[a-z0-9/-]{0,60}/) || ['/'])[0].replace(/\/(catalogo|rivista|biotipi)\/.+/, '/$1/…');
    const m = String(e.m || '').replace(/https?:\/\/\S+/g, '').replace(/[^\p{L}\p{N}_.,:;'()\- ]/gu, '').trim().slice(0, 120);
    if (m) righe.push(['guasto', `${pagina} · ${m}`]);
  }
  if (e.e === 'arrivo' && FONTI.has(e.f)) righe.push(['arrivo', e.f], ['arrivo_pagina', `${e.f}:${SEZIONI.has(e.pg) ? e.pg : 'altro'}`]);
  if (!righe.length) return new Response(null, { status: 400 });
  const st = env.DB.prepare('INSERT INTO eventi_giorno (giorno, tipo, chiave, n) VALUES (?1, ?2, ?3, 1) ON CONFLICT (giorno, tipo, chiave) DO UPDATE SET n = n + 1');
  await env.DB.batch(righe.filter(([, k]) => k).map(([t, k]) => st.bind(g, t, k)));
  return new Response(null, { status: 204 });
}

// ── 2. l'accesso: il gettone di Cloudflare Access, ricontrollato qui ─────────────
let CERTI = null, CERTI_IL = 0;
const b64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
async function accesso(req, env) {
  // ⚠️ ADMIN APERTO (il PO, 15/10/2026: «disattivare temporaneamente il blocco alla sezione admin,
  // poi metteremo il block con Cloudflare una volta gestito dall'account di Sofia»). Con
  // ADMIN_APERTO = "si" in wrangler.jsonc chiunque conosca l'indirizzo vede e modifica l'admin:
  // resta fuori dai motori (robots e noindex). Si chiude rimettendo "no" quando Access è attivo.
  if (env.ADMIN_APERTO === 'si') return { ok: true, email: 'admin aperto' };
  // solo in prova sul Mac (wrangler dev, .dev.vars): mai online, dove l'indirizzo non è localhost
  if (env.ADMIN_SVILUPPO === 'si' && new URL(req.url).hostname === 'localhost') return { ok: true, email: 'prova@localhost' };
  // la chiave temporanea del 15/10 (ADMIN_CHIAVE, ?chiave=…) è stata tolta il 7/11/2026: su workers.dev, dove Access non
  // c'è, apriva l'admin a chiunque avesse il link. Resta solo Cloudflare Access.
  const team = env.ACCESS_TEAM, aud = env.ACCESS_AUD;
  const ammessi = String(env.ADMIN_EMAILS || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean);
  if (!team || !aud) return { ok: false, motivo: 'Cloudflare Access non è configurato per l\'admin di Skinmatch.' };
  const cookie = (req.headers.get('cookie') || '').match(/(?:^|;\s*)CF_Authorization=([^;]+)/);
  const tok = req.headers.get('cf-access-jwt-assertion') || (cookie && cookie[1]);
  if (!tok) return { ok: false, motivo: 'Serve l\'accesso con Cloudflare Access.' };
  try {
    const [h, c, f] = tok.split('.');
    const testa = JSON.parse(new TextDecoder().decode(b64u(h)));
    const corpo = JSON.parse(new TextDecoder().decode(b64u(c)));
    const emittente = `https://${team}.cloudflareaccess.com`;
    if (!CERTI || Date.now() - CERTI_IL > 3600e3) {
      CERTI = (await (await fetch(`${emittente}/cdn-cgi/access/certs`)).json()).keys || [];
      CERTI_IL = Date.now();
    }
    const jwk = CERTI.find((k) => k.kid === testa.kid);
    if (!jwk) return { ok: false, motivo: 'Gettone di accesso non riconosciuto.' };
    const chiave = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const buono = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', chiave, b64u(f), new TextEncoder().encode(`${h}.${c}`));
    const auds = Array.isArray(corpo.aud) ? corpo.aud : [corpo.aud];
    if (!buono || corpo.iss !== emittente || !auds.includes(aud) || corpo.exp * 1000 < Date.now()) return { ok: false, motivo: 'Gettone di accesso non valido o scaduto.' };
    const email = String(corpo.email || '').toLowerCase();
    if (!ammessi.includes(email)) return { ok: false, motivo: `L'account ${email} non è tra quelli ammessi all'admin.` };
    return { ok: true, email };
  } catch {
    return { ok: false, motivo: 'Gettone di accesso illeggibile.' };
  }
}

// ── 3. le API dell'admin ──────────────────────────────────────────────────────
// ── VISIBILITÀ SU GOOGLE (15/11/2026, Federico: «una dashboard ben fatta sull'admin … visibilità 24h 7gg 30gg») ──
// Il Worker legge Search Console in diretta con l'account di servizio di Skinmatch (skinmatch123@gmail.com, niente
// di Agoranomos): la chiave è il segreto GSC_CHIAVE del Worker (wrangler secret put), mai nel codice. Solo lettura.
// Le date di Search Console sono in ora del Pacifico; le 24 ore sono le ultime 24 ore con i dati orari (hourly_all),
// 7 e 30 giorni sono giorni interi fino a oggi (dataState all, i dati freschi compresi). Ogni periodo ha il suo
// confronto col periodo prima. La risposta resta in cache 30 minuti («Aggiorna» la rifà).
const SITO_GSC = 'sc-domain:skinmatch.it';
const API_GSC = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITO_GSC)}`;
let gettoneGoogle = null;
const a64u = (s) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
async function accessoGoogle(env) {
  if (gettoneGoogle && gettoneGoogle.scade > Date.now() + 60e3) return gettoneGoogle.valore;
  const k = JSON.parse(env.GSC_CHIAVE);
  const ora = Math.floor(Date.now() / 1000);
  const testa = a64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const corpo = a64u(JSON.stringify({ iss: k.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: 'https://oauth2.googleapis.com/token', iat: ora, exp: ora + 3600 }));
  const der = Uint8Array.from(atob(k.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '')), (c) => c.charCodeAt(0));
  const chiave = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const firma = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', chiave, new TextEncoder().encode(`${testa}.${corpo}`)));
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${testa}.${corpo}.${a64u(String.fromCharCode(...firma))}`,
  });
  const t = await r.json();
  if (!t.access_token) throw new Error(`Google non dà l'accesso: ${t.error_description || t.error || r.status}`);
  gettoneGoogle = { valore: t.access_token, scade: Date.now() + (t.expires_in || 3600) * 1000 };
  return gettoneGoogle.valore;
}
async function gsc(env, percorso, corpo) {
  const r = await fetch(API_GSC + percorso, {
    method: corpo ? 'POST' : 'GET',
    headers: { authorization: `Bearer ${await accessoGoogle(env)}`, ...(corpo ? { 'content-type': 'application/json' } : {}) },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const d = await r.json();
  if (!r.ok) throw new Error(`Search Console: ${d.error?.message || r.status}`);
  return d;
}
const giornoPT = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date());
const piuGiorni = (iso, n) => new Date(Date.parse(`${iso}T12:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
// somma righe di Search Console: clic e impressioni si sommano, la posizione si media pesata sulle impressioni
function somma(righe) {
  const t = { impressioni: 0, clic: 0, pos: 0 };
  for (const r of righe) { t.impressioni += r.impressions; t.clic += r.clicks; t.pos += r.position * r.impressions; }
  return { impressioni: t.impressioni, clic: t.clic, ctr: t.impressioni ? t.clic / t.impressioni : 0, posizione: t.impressioni ? t.pos / t.impressioni : null };
}
function perChiave(righe, i, n = 25) {
  const m = new Map();
  for (const r of righe) { const k = r.keys[i]; if (!m.has(k)) m.set(k, []); m.get(k).push(r); }
  return [...m].map(([k, rr]) => ({ k, ...somma(rr) })).sort((a, b) => b.impressioni - a.impressioni || b.clic - a.clic).slice(0, n);
}
async function visibilita(env, periodo) {
  const oggiPT = giornoPT();
  const sitemap = (await gsc(env, '/sitemaps')).sitemap || [];
  const out = { periodo, aggiornato: new Date().toISOString(), sitemap: sitemap.map((x) => ({
    indirizzo: x.path, inviata: x.lastSubmitted || null, letta: x.lastDownloaded || null, in_attesa: !!x.isPending,
    errori: +x.errors || 0, avvisi: +x.warnings || 0, indirizzi: (x.contents || []).reduce((t, c) => t + (+c.submitted || 0), 0) || null,
  })) };
  if (periodo === '24h') {
    const base = { startDate: piuGiorni(oggiPT, -3), endDate: oggiPT, dataState: 'hourly_all', rowLimit: 25000 };
    const [ore, oreQ, oreP, oreD] = await Promise.all([
      gsc(env, '/searchAnalytics/query', { ...base, dimensions: ['hour'] }),
      gsc(env, '/searchAnalytics/query', { ...base, dimensions: ['hour', 'query'] }),
      gsc(env, '/searchAnalytics/query', { ...base, dimensions: ['hour', 'page'] }),
      gsc(env, '/searchAnalytics/query', { ...base, dimensions: ['hour', 'device'] }),
    ]);
    const adesso = Date.now(), dentro = (r, da, a) => { const t = Date.parse(r.keys[0]); return t > adesso - a * 36e5 && t <= adesso - da * 36e5; };
    const ultime = (d) => (d.rows || []).filter((r) => dentro(r, 0, 24));
    out.totali = somma(ultime(ore));
    out.prima = somma((ore.rows || []).filter((r) => dentro(r, 24, 48)));
    const perOra = new Map((ore.rows || []).map((r) => [Math.floor(Date.parse(r.keys[0]) / 36e5), r]));
    const ultimaOra = Math.floor(adesso / 36e5);
    out.serie = Array.from({ length: 24 }, (_, i) => {
      const h = ultimaOra - 23 + i, r = perOra.get(h);
      return { t: new Date(h * 36e5).toISOString(), impressioni: r?.impressions || 0, clic: r?.clicks || 0 };
    });
    out.ricerche = perChiave(ultime(oreQ), 1);
    out.pagine = perChiave(ultime(oreP), 1);
    out.pagine_viste = new Set(ultime(oreP).filter((r) => r.impressions > 0).map((r) => r.keys[1])).size;
    out.dispositivi = perChiave(ultime(oreD), 1, 5);
    return out;
  }
  const n = periodo === '7g' ? 7 : 30, da = piuGiorni(oggiPT, -(n - 1));
  const base = { startDate: da, endDate: oggiPT, dataState: 'all', rowLimit: 25000 };
  const [giorni, q, p, d] = await Promise.all([
    gsc(env, '/searchAnalytics/query', { ...base, startDate: piuGiorni(oggiPT, -(2 * n - 1)), dimensions: ['date'] }),
    gsc(env, '/searchAnalytics/query', { ...base, dimensions: ['query'], rowLimit: 100 }),
    gsc(env, '/searchAnalytics/query', { ...base, dimensions: ['page'] }),
    gsc(env, '/searchAnalytics/query', { ...base, dimensions: ['device'] }),
  ]);
  const righe = giorni.rows || [];
  out.totali = somma(righe.filter((r) => r.keys[0] >= da));
  out.prima = somma(righe.filter((r) => r.keys[0] < da));
  const perGiorno = new Map(righe.map((r) => [r.keys[0], r]));
  out.serie = Array.from({ length: n }, (_, i) => { const g = piuGiorni(da, i), r = perGiorno.get(g); return { t: g, impressioni: r?.impressions || 0, clic: r?.clicks || 0 }; });
  out.ricerche = perChiave(q.rows || [], 0);
  out.pagine = perChiave(p.rows || [], 0);
  out.pagine_viste = (p.rows || []).filter((r) => r.impressions > 0).length;
  out.dispositivi = perChiave(d.rows || [], 0, 5);
  return out;
}

// Il flusso «Redazione» su GitHub (repository di Sofia): un repository_dispatch «pubblica». Token fine-grained con
// «Contents: Read and write» sul solo skinmatch-sito, nel segreto GITHUB_DISPATCH (wrangler secret put). Un errore non
// ferma niente: la richiesta resta in coda e la recupera il prossimo «Pubblica» o il giro del mattino.
async function chiamaRedazione(env) {
  if (!env.GITHUB_DISPATCH) return false;
  try {
    const r = await fetch('https://api.github.com/repos/sofiashcrescenzi-dev/skinmatch-sito/dispatches', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.GITHUB_DISPATCH}`, Accept: 'application/vnd.github+json', 'User-Agent': 'skinmatch-admin', 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'pubblica' }),
    });
    return r.status === 204;
  } catch { return false; }
}

async function admin(req, env, url, email) {
  const DB = env.DB, q = url.searchParams, via = url.pathname.slice('/api/admin/'.length);
  const corpo = req.method === 'POST' ? await req.json() : null;
  const tutti = async (sql, ...v) => (await DB.prepare(sql).bind(...v).all()).results;

  if (via === 'chi') return json({ email });

  if (via === 'google') {
    const periodo = ['24h', '7g', '30g'].includes(q.get('periodo')) ? q.get('periodo') : '7g';
    if (!env.GSC_CHIAVE) return json({ collegato: false });
    // la cache sta sotto /api/admin/, dove ogni richiesta da fuori passa da Access: nessuno la legge senza entrare
    const chiave = new Request(`https://skinmatch.it/api/admin/__cache/google/${periodo}`);
    const cache = caches.default;
    if (q.get('aggiorna') !== '1') { const c = await cache.match(chiave); if (c) return json(await c.json()); }
    try {
      const dati = { collegato: true, ...(await visibilita(env, periodo)) };
      await cache.put(chiave, new Response(JSON.stringify(dati), { headers: { 'content-type': 'application/json', 'cache-control': 'max-age=1800' } }));
      return json(dati);
    } catch (e) {
      return json({ collegato: true, errore: String(e.message || e).slice(0, 300) }, 502);
    }
  }

  if (via === 'ia') {
    // GLI ASSISTENTI (19/11/2026): le visite dei robot delle IA (ia_visite, contate dal Worker) e le chiamate al server MCP
    const giorni = { '7g': 7, '30g': 30, '90g': 90 }[q.get('periodo')] || 30;
    const da = new Date(Date.now() - giorni * 864e5).toISOString().slice(0, 10);
    const vuoto = () => [];
    const [perRobot, perSezione, perGiorno, mcpStrumenti, mcpGiorni] = await Promise.all([
      tutti('SELECT robot, tipo, SUM(n) AS n FROM ia_visite WHERE giorno >= ?1 GROUP BY robot, tipo ORDER BY n DESC', da).catch(vuoto),
      tutti("SELECT sezione, SUM(CASE WHEN tipo = 'utente' THEN n ELSE 0 END) AS citazioni, SUM(n) AS tutte FROM ia_visite WHERE giorno >= ?1 GROUP BY sezione ORDER BY citazioni DESC, tutte DESC", da).catch(vuoto),
      tutti("SELECT giorno, SUM(CASE WHEN tipo = 'utente' THEN n ELSE 0 END) AS citazioni, SUM(CASE WHEN tipo <> 'utente' THEN n ELSE 0 END) AS letture FROM ia_visite WHERE giorno >= ?1 GROUP BY giorno ORDER BY giorno", da).catch(vuoto),
      tutti("SELECT strumento, SUM(n) AS n FROM mcp_chiamate WHERE giorno >= ?1 AND strumento <> 'initialize' GROUP BY strumento ORDER BY n DESC", da).catch(vuoto),
      tutti("SELECT giorno, SUM(CASE WHEN strumento = 'initialize' THEN n ELSE 0 END) AS collegamenti, SUM(CASE WHEN strumento <> 'initialize' THEN n ELSE 0 END) AS chiamate FROM mcp_chiamate WHERE giorno >= ?1 GROUP BY giorno ORDER BY giorno", da).catch(vuoto),
    ]);
    return json({ giorni, da, perRobot, perSezione, perGiorno, mcpStrumenti, mcpGiorni });
  }

  if (via === 'traffico') {
    const giorni = Math.min(365, Math.max(1, +q.get('giorni') || 30));
    const da = new Date(Date.now() - (giorni - 1) * 864e5).toISOString().slice(0, 10);
    const righe = await tutti('SELECT giorno, tipo, chiave, n FROM eventi_giorno WHERE giorno >= ?1 ORDER BY giorno', da);
    const vendite = await tutti('SELECT id, rete, negozio, data, importo, commissione, stato, subid FROM vendite WHERE data >= ?1 ORDER BY data DESC LIMIT 200', da);
    return json({ da, giorni, righe, vendite });
  }

  if (via === 'documento') {
    if (req.method === 'GET') {
      const tipo = q.get('tipo');
      if (!DOCUMENTI.has(tipo)) return json({ errore: 'tipo sconosciuto' }, 400);
      const r = await DB.prepare('SELECT id, tipo, dati, chi, nota, creato_il, pubblicato_il FROM documenti WHERE tipo = ?1 ORDER BY id DESC LIMIT 1').bind(tipo).first();
      const storia = await tutti('SELECT id, chi, nota, creato_il, pubblicato_il FROM documenti WHERE tipo = ?1 ORDER BY id DESC LIMIT 15', tipo);
      return json({ ultimo: r ? { ...r, dati: JSON.parse(r.dati) } : null, storia });
    }
    const { tipo, dati, base, nota } = corpo || {};
    if (!DOCUMENTI.has(tipo) || !dati || typeof dati !== 'object') return json({ errore: 'dati mancanti' }, 400);
    const ultimo = await DB.prepare('SELECT id FROM documenti WHERE tipo = ?1 ORDER BY id DESC LIMIT 1').bind(tipo).first();
    if ((ultimo?.id || null) !== (base || null)) return json({ errore: 'Qualcuno ha salvato prima di te: ricarica la pagina, le tue modifiche vanno rifatte sulla versione nuova.', conflitto: true }, 409);
    const testo = JSON.stringify(dati);
    if (testo.length > 900000) return json({ errore: 'documento troppo grande' }, 413);
    const r = await DB.prepare('INSERT INTO documenti (tipo, dati, chi, nota) VALUES (?1, ?2, ?3, ?4) RETURNING id').bind(tipo, testo, email, breve(nota, 300) || null).first();
    return json({ ok: true, id: r.id });
  }

  if (via === 'pubblica') {
    if (req.method === 'GET') return json({ pubblicazioni: await tutti('SELECT * FROM pubblicazioni ORDER BY id DESC LIMIT 15') });
    const cosa = breve(corpo?.cosa || 'tutto', 200);
    const aperta = await DB.prepare("SELECT id FROM pubblicazioni WHERE stato = 'in_coda' LIMIT 1").first();
    // ⚠️ LA PUBBLICAZIONE PARTE SU GITHUB, NON PIÙ DAL MAC (20/11/2026, Federico: «skinmatch staccalo dal mac»): oltre a
    // mettere in coda, si chiama il flusso «Redazione» (.github/workflows/redazione.yml) con un repository_dispatch. Anche
    // quando c'è già una richiesta in coda: se la chiamata di prima non fosse partita, questa la recupera (GitHub tiene
    // un giro solo in attesa). Senza il segreto GITHUB_DISPATCH resta la coda, come prima.
    const avvia = () => chiamaRedazione(env);
    if (aperta) { await avvia(); return json({ ok: true, id: aperta.id, gia: true }); }
    const r = await DB.prepare('INSERT INTO pubblicazioni (chi, cosa) VALUES (?1, ?2) RETURNING id').bind(email, cosa).first();
    await avvia();
    return json({ ok: true, id: r.id });
  }

  if (via === 'articoli') {
    if (req.method === 'GET') return json({ articoli: await tutti('SELECT * FROM articoli ORDER BY id DESC LIMIT 200') });
    const { id, stato, feedback, campi } = corpo || {};
    const a = await DB.prepare('SELECT stato FROM articoli WHERE id = ?1').bind(id).first();
    if (!a) return json({ errore: 'articolo non trovato' }, 404);
    if (stato && !STATI_ARTICOLO.has(stato)) return json({ errore: 'stato sconosciuto' }, 400);
    if (stato === 'online') return json({ errore: 'online lo segna la pubblicazione' }, 400);
    const ok = ['titolo', 'sommario', 'testo', 'approfondisce', 'firma'];
    // approfondisce: i termini del glossario che l'articolo spiega, come JSON (al massimo tre)
    const valido = (k, v) => (k === 'firma' ? ['redazione', 'sofia'].includes(v) : k !== 'approfondisce') || (() => { try { const x = JSON.parse(v); return Array.isArray(x) && x.length <= 3 && x.every((t) => /^[a-z0-9-]{1,40}$/.test(t)); } catch { return false; } })();
    const set = Object.entries(campi || {}).filter(([k, v]) => ok.includes(k) && typeof v === 'string' && valido(k, v));
    await DB.prepare(`UPDATE articoli SET ${[stato ? 'stato = ?2' : null, 'feedback = ?3', "aggiornato_il = datetime('now')", ...set.map(([k], i) => `${k} = ?${i + 4}`)].filter(Boolean).join(', ')} WHERE id = ?1`)
      .bind(id, stato || null, feedback ?? null, ...set.map(([, v]) => v)).run();
    return json({ ok: true });
  }

  if (via === 'arricchimenti') {
    if (req.method === 'GET') return json({ arricchimenti: await tutti('SELECT * FROM arricchimenti ORDER BY id DESC LIMIT 300') });
    const { id, stato } = corpo || {};
    if (!['approvato', 'scartato', 'proposto'].includes(stato)) return json({ errore: 'stato sconosciuto' }, 400);
    await DB.prepare('UPDATE arricchimenti SET stato = ?2, chi = ?3 WHERE id = ?1').bind(id, stato, email).run();
    return json({ ok: true });
  }

  if (via === 'riscritture') {
    // le riscritture dei testi del test proposte da Zeno (16/10): «Usa questa» le mette nella bozza (lo fa la pagina),
    // qui si segna la scelta
    if (req.method === 'GET') return json({ riscritture: await tutti("SELECT * FROM riscritture WHERE stato = 'proposta' OR aggiornato_il >= datetime('now', '-30 days') ORDER BY stato = 'proposta' DESC, id DESC LIMIT 300") });
    const { id, stato, nota } = corpo || {};
    if (!['proposta', 'approvata', 'scartata'].includes(stato)) return json({ errore: 'stato sconosciuto' }, 400);
    await DB.prepare("UPDATE riscritture SET stato = ?2, nota = ?3, chi = ?4, aggiornato_il = datetime('now') WHERE id = ?1")
      .bind(id, stato, typeof nota === 'string' && nota.trim() ? nota.trim().slice(0, 2000) : null, email).run();
    return json({ ok: true });
  }

  if (via === 'marche') {
    // le marche da conoscere meglio (16/10): si leggono tutte; si aggiungono, si cambiano, si tolgono
    if (req.method === 'GET') return json({ marche: await tutti('SELECT * FROM marche_studio ORDER BY gruppo, marca') });
    const { id, togli, campi } = corpo || {};
    if (togli && id) { await DB.prepare('DELETE FROM marche_studio WHERE id = ?1').bind(id).run(); return json({ ok: true }); }
    const ok = ['marca', 'gruppo', 'perche', 'origine', 'sito', 'email', 'email_fonte', 'contatto_nota', 'stato', 'note'];
    const set = Object.entries(campi || {}).filter(([k, v]) => ok.includes(k) && (typeof v === 'string' || v === null)).map(([k, v]) => [k, v === null ? null : String(v).slice(0, 3000)]);
    if (!set.length) return json({ errore: 'niente da salvare' }, 400);
    if (set.some(([k, v]) => k === 'stato' && !STATI_MARCA.has(v))) return json({ errore: 'stato sconosciuto' }, 400);
    if (id) {
      await DB.prepare(`UPDATE marche_studio SET ${set.map(([k], i) => `${k} = ?${i + 3}`).join(', ')}, chi = ?2, aggiornato_il = datetime('now') WHERE id = ?1`)
        .bind(id, email, ...set.map(([, v]) => v)).run();
      return json({ ok: true });
    }
    const c = Object.fromEntries(set);
    if (!c.marca || !c.gruppo) return json({ errore: 'servono la marca e il gruppo' }, 400);
    const r = await DB.prepare(`INSERT INTO marche_studio (${set.map(([k]) => k).join(', ')}, chi) VALUES (${set.map((_, i) => `?${i + 1}`).join(', ')}, ?${set.length + 1}) RETURNING id`)
      .bind(...set.map(([, v]) => v), email).first().catch((e) => ({ errore: String(e.message || e) }));
    if (!r || r.errore) return json({ errore: /UNIQUE/.test(r?.errore || '') ? 'questa marca c\'è già' : 'non salvata' }, 400);
    return json({ ok: true, id: r.id });
  }

  if (via === 'social-stato') {
    // LO STATO DEI POST SOCIAL (8/11/2026): pubblicato, saltato o da pubblicare, segnato dall'admin › Social
    if (req.method === 'GET') return json({ stati: await tutti('SELECT * FROM social_stato ORDER BY aggiornato_il DESC LIMIT 500') });
    const { id, stato, link } = corpo || {};
    if (!/^[a-z0-9-]{3,120}$/.test(id || '')) return json({ errore: 'post sconosciuto' }, 400);
    if (!['da_pubblicare', 'pubblicato', 'saltato'].includes(stato)) return json({ errore: 'stato sconosciuto' }, 400);
    const l = typeof link === 'string' && /^https:\/\/\S+$/.test(link) ? link.slice(0, 300) : null;
    await DB.prepare("INSERT INTO social_stato (id, stato, link, chi, aggiornato_il) VALUES (?1, ?2, ?3, ?4, datetime('now')) ON CONFLICT (id) DO UPDATE SET stato = excluded.stato, link = coalesce(excluded.link, social_stato.link), chi = excluded.chi, aggiornato_il = excluded.aggiornato_il")
      .bind(id, stato, l, email).run();
    return json({ ok: true });
  }

  if (via === 'social-numeri') {
    // I NUMERI DI TIKTOK (19/11/2026, il PO: «mettiamo anche skinmatch, ma lo mandiamo sull'admin suo»): li scrive il Mac
    // (scripts/admin/social_tiktok.py, dall'API ufficiale, ogni 6 ore). Qui l'ultimo giorno di ogni profilo, i 90 giorni
    // di storico e gli ultimi video. Prima del primo giro le tabelle non ci sono: liste vuote, non un errore.
    const vuoto = () => [];
    const [profili, storico, video] = await Promise.all([
      tutti(`SELECT * FROM social_profili p WHERE p.giorno = (SELECT MAX(r.giorno) FROM social_profili r
               WHERE r.piattaforma = p.piattaforma AND r.account = p.account)`).catch(vuoto),
      tutti("SELECT giorno, piattaforma, account, follower, visualizzazioni FROM social_profili WHERE giorno >= date('now', '-90 day') ORDER BY giorno").catch(vuoto),
      tutti('SELECT * FROM social_video ORDER BY creato DESC LIMIT 60').catch(vuoto),
    ]);
    return json({ profili, storico, video });
  }

  if (via === 'revisioni') {
    // IL REGISTRO DELLE REVISIONI (7/11/2026, voto l-revisione): si aggiunge, non si cambia. L'ultima riga per chiave vale.
    if (req.method === 'GET') return json({ revisioni: await tutti('SELECT * FROM revisioni ORDER BY id DESC LIMIT 1000') });
    const { chiave, contenuto, esito, nota } = corpo || {};
    if (!/^(metodo|biotipo:[a-z0-9-]+|consiglio:[a-z0-9-]+|articolo:[a-z0-9-]+)$/.test(chiave || '')) return json({ errore: 'chiave sconosciuta' }, 400);
    if (!['approvato', 'da_cambiare'].includes(esito)) return json({ errore: 'esito sconosciuto' }, 400);
    if (typeof contenuto !== 'string' || !contenuto || contenuto.length > 200000) return json({ errore: 'contenuto mancante' }, 400);
    const r = await DB.prepare('INSERT INTO revisioni (chiave, contenuto, esito, nota, chi) VALUES (?1, ?2, ?3, ?4, ?5) RETURNING id')
      .bind(chiave, contenuto, esito, typeof nota === 'string' && nota.trim() ? nota.trim().slice(0, 2000) : null, email).first();
    return json({ ok: true, id: r.id });
  }

  if (via === 'squadra') {
    if (req.method === 'POST') {
      // la decisione su una segnalazione: sì (in_lavoro), dopo, no (scartata), con una nota
      const { id, stato, nota } = corpo || {};
      if (!STATI_SEGNALAZIONE.has(stato) || stato === 'fatta') return json({ errore: 'stato sconosciuto' }, 400);
      const r = await DB.prepare("UPDATE segnalazioni SET stato = ?2, nota_po = ?3, chi = ?4, aggiornato_il = datetime('now') WHERE id = ?1")
        .bind(id, stato, typeof nota === 'string' && nota.trim() ? nota.trim().slice(0, 2000) : null, email).run();
      if (!r.meta?.changes) return json({ errore: 'segnalazione non trovata' }, 404);
      return json({ ok: true });
    }
    return json({
      rapporti: await tutti('SELECT id, agente, tipo, titolo, sintesi, corpo, esito, creato_il FROM squadra ORDER BY id DESC LIMIT 30'),
      pubblicazioni: await tutti('SELECT * FROM pubblicazioni ORDER BY id DESC LIMIT 10'),
      segnalazioni: await tutti("SELECT * FROM segnalazioni WHERE stato != 'fatta' OR aggiornato_il >= datetime('now', '-30 days') ORDER BY id DESC LIMIT 150"),
    });
  }

  return json({ errore: 'non trovato' }, 404);
}

const PAGINA_CHIUSA = (motivo) => `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Admin di Skinmatch</title>
<style>body{margin:0;font:16px/1.6 system-ui,sans-serif;background:#fbf8f4;color:#231c16;display:grid;place-items:center;min-height:100vh;padding:24px;box-sizing:border-box}main{max-width:460px;display:grid;gap:12px}h1{font:600 26px/1.2 Georgia,serif;margin:0}p{margin:0;color:#6b6058}a{color:#9a5a3c}</style></head>
<body><main><h1>Area riservata</h1><p>${String(motivo).replace(/[<>&]/g, '')}</p><p>L'admin di Skinmatch si apre solo con l'accesso di Cloudflare, per gli account di Federico e di Sofia.</p><p><a href="/">Torna al sito</a></p></main></body></html>`;
