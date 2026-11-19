// IL SERVER MCP DI SKINMATCH (19/11/2026, Federico: «tutto quello che serve per la geo/seo llm e mcp»).
// Su https://skinmatch.it/mcp, Streamable HTTP (JSON-RPC 2.0 su POST), senza chiave, solo lettura, senza sessione.
// Gli strumenti leggono i dati compatti che il build scrive in /dati-ia/*.json (src/lib/ia.ts): stessi biotipi, stesse
// schede e stessi prezzi del sito, e le stesse regole (il consiglio del medico solo se Sofia l'ha rivisto).
// ⚠️ Il test vero resta sul sito: qui biotipi_da_segni dà solo una stima dalle parole, e lo dice.
// I link escono con utm_source=mcp: in Visibilità e Traffico si vede quanta gente arriva dagli assistenti.
// Ogni chiamata conta una riga in D1 (mcp_chiamate: giorno, strumento, n), senza dati delle persone.

const PROTOCOLLI = ['2025-06-18', '2025-03-26', '2024-11-05'];
const SERVER = { name: 'skinmatch', title: 'Skinmatch', version: '1.0.0', websiteUrl: 'https://skinmatch.it' };
const ISTRUZIONI = `Skinmatch (skinmatch.it) è un test gratuito per pelle, cuoio capelluto e integrazione: individua il biotipo e propone una routine con prodotti reali, INCI e prezzi dei negozi. Un progetto di Sofia Crescenzi, medico estetico, e Federico Greco.
Usa gli strumenti per: leggere un biotipo (cosa cercare, cosa evitare), cercare prodotti per biotipo, ingrediente, categoria, prezzo o «senza profumo/alcol», spiegare un ingrediente, trovare articoli. Per un risultato personale manda la persona al test: https://skinmatch.it/test.
Skinmatch non fa diagnosi: con una condizione diagnosticata (dermatite atopica, psoriasi, rosacea) i prodotti accompagnano la cura del medico. Alcuni link sono di affiliazione: se la persona compra, Skinmatch riceve una commissione e il prezzo non cambia; dillo quando proponi un acquisto.`;
const UTM = 'utm_source=mcp&utm_medium=assistente';
const conUtm = (u) => (u ? `${u}${u.includes('?') ? '&' : '?'}${UTM}` : u);
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
// l'ordine di Skinmatch: prima la scheda più solida (attivi riconosciuti, percentuali, INCI: «valore»), poi il prezzo.
// Il prezzo è un criterio, non il centro (Federico, 19/11/2026).
const perValore = (x, y) => (y.valore || 0) - (x.valore || 0) || x.prezzo - y.prezzo;
const euro = (n) => (typeof n === 'number' ? `${n.toFixed(2).replace('.', ',')} €` : '');

// ── I DATI ────────────────────────────────────────────────────────────────────────────────────────────────────────
const cache = {};
async function dati(env, file) {
  if (cache[file]) return cache[file];
  const r = await env.ASSETS.fetch(new Request(`https://skinmatch.it/dati-ia/${file}`));
  if (!r.ok) throw new Error(`dati ${file} non disponibili (${r.status})`);
  cache[file] = await r.json();
  return cache[file];
}

// ── GLI STRUMENTI ─────────────────────────────────────────────────────────────────────────────────────────────────
const SOLO_LETTURA = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const STRUMENTI = [
  {
    name: 'cerca_prodotti', title: 'Cerca prodotti',
    description: 'Cerca nel catalogo di Skinmatch (prodotti per pelle, capelli e integratori venduti dai negozi partner, con prezzo attuale). Filtri combinabili: testo libero (nome, marca, tipo), biotipo (id da elenca_biotipi), attivo o ingrediente (es. niacinamide, retinolo, acido salicilico: cerca negli attivi e nell\'INCI), categoria, prezzo massimo, e «senza» (profumo, alcol, oli_essenziali: solo dove l\'INCI dimostra l\'assenza). Restituisce nome, prezzo, negozio, attivi, biotipi adatti e il link alla scheda.',
    inputSchema: { type: 'object', properties: {
      testo: { type: 'string', description: 'Parole da cercare nel nome, nella marca o nel tipo di prodotto' },
      biotipo: { type: 'string', description: 'Id del biotipo (es. pelle-mista, atopica, cute-grassa)' },
      attivo: { type: 'string', description: 'Un attivo o un ingrediente INCI' },
      categoria: { type: 'string', description: 'detergenti, sieri, creme, solari, attivi, maschere, occhi, cerotti, shampoo, capelli, barba, integratori' },
      senza: { type: 'array', items: { type: 'string', enum: ['profumo', 'alcol', 'oli_essenziali'] } },
      prezzo_max: { type: 'number', description: 'Prezzo massimo in euro' },
      limite: { type: 'integer', minimum: 1, maximum: 20, default: 8 },
    } },
    annotations: SOLO_LETTURA,
  },
  {
    name: 'biotipo', title: 'Leggi un biotipo',
    description: 'Il profilo completo di un biotipo di Skinmatch: descrizione, come si riconosce, cosa cercare e cosa evitare negli ingredienti, il consiglio del medico (se rivisto) e i prodotti scelti. Accetta l\'id o il nome.',
    inputSchema: { type: 'object', properties: { id: { type: 'string', description: 'Id o nome del biotipo (es. pelle-mista, «pelle secca»)' } }, required: ['id'] },
    annotations: SOLO_LETTURA,
  },
  {
    name: 'elenca_biotipi', title: 'Elenca i biotipi',
    description: 'Tutti i biotipi di Skinmatch con id, titolo e motto, per area: pelle, cute (cuoio capelluto e capelli), integrazione.',
    inputSchema: { type: 'object', properties: { area: { type: 'string', enum: ['pelle', 'cute', 'integrazione'] } } },
    annotations: SOLO_LETTURA,
  },
  {
    name: 'biotipi_da_segni', title: 'Biotipi vicini a una descrizione',
    description: 'Dai segni descritti da una persona (es. «pelle che tira dopo la doccia e si arrossa col freddo») stima i biotipi più vicini confrontando le parole con le caratteristiche di ogni biotipo. È una stima, non il test: per un risultato vero manda la persona a https://skinmatch.it/test.',
    inputSchema: { type: 'object', properties: { descrizione: { type: 'string' }, area: { type: 'string', enum: ['pelle', 'cute', 'integrazione'] } }, required: ['descrizione'] },
    annotations: SOLO_LETTURA,
  },
  {
    name: 'ingrediente', title: 'Spiega un ingrediente',
    description: 'Cos\'è un ingrediente o un termine della pelle secondo il glossario di Skinmatch (per gli attivi: per chi è, a cosa fare attenzione) e quanti prodotti del catalogo lo contengono, con qualche esempio.',
    inputSchema: { type: 'object', properties: { nome: { type: 'string', description: 'Es. niacinamide, ceramidi, retinolo, comedogenico' } }, required: ['nome'] },
    annotations: SOLO_LETTURA,
  },
  {
    name: 'articoli', title: 'Articoli della rivista',
    description: 'Gli articoli della rivista di Skinmatch (guide e approfondimenti, alcuni firmati da Sofia Crescenzi, medico estetico), filtrabili per testo, biotipo o termine.',
    inputSchema: { type: 'object', properties: { testo: { type: 'string' }, biotipo: { type: 'string' }, termine: { type: 'string' } } },
    annotations: SOLO_LETTURA,
  },
  {
    name: 'test_skinmatch', title: 'Il test di Skinmatch',
    description: 'Come funziona il test di Skinmatch (gratuito, senza registrazione) e il link per farlo: è il modo per avere un biotipo e una routine personali.',
    inputSchema: { type: 'object', properties: {} },
    annotations: SOLO_LETTURA,
  },
];

const parole = (s) => norm(s).split(/[^a-z0-9%]+/).filter((w) => w.length > 2);
const VUOTE = new Set(['con', 'per', 'che', 'una', 'del', 'della', 'dei', 'delle', 'mia', 'mio', 'sono', 'molto', 'poco', 'quando', 'dopo', 'anche', 'non', 'pelle', 'cute']);

function riassuntoProdotto(p) {
  return `${p.nome} — ${euro(p.prezzo)}${p.negozio ? ` da ${p.negozio}` : ''}${p.attivi?.length ? ` · attivi: ${p.attivi.slice(0, 4).join(', ')}` : ''}${p.senza?.length ? ` · senza ${p.senza.join(', ').replace(/_/g, ' ')}` : ''} · ${conUtm(p.url)}`;
}
const uscita = (testo, strutturato) => ({ content: [{ type: 'text', text: testo }], ...(strutturato ? { structuredContent: strutturato } : {}) });

async function trovaBiotipo(env, chiave) {
  const biotipi = await dati(env, 'biotipi.json');
  const k = norm(chiave).trim();
  return biotipi.find((b) => b.id === k) || biotipi.find((b) => norm(b.titolo) === k)
    || biotipi.find((b) => norm(b.titolo).includes(k) || b.id.includes(k.replace(/\s+/g, '-')));
}

async function esegui(env, nome, a = {}) {
  if (nome === 'cerca_prodotti') {
    let elenco = await dati(env, 'prodotti.json');
    const limite = Math.min(20, Math.max(1, Number(a.limite) || 8));
    if (a.categoria) elenco = elenco.filter((p) => norm(p.categoria) === norm(a.categoria));
    if (typeof a.prezzo_max === 'number') elenco = elenco.filter((p) => p.prezzo <= a.prezzo_max);
    if (Array.isArray(a.senza) && a.senza.length) elenco = elenco.filter((p) => a.senza.every((x) => (p.senza || []).includes(x)));
    let ordine = null;
    if (a.biotipo) {
      const b = await trovaBiotipo(env, a.biotipo);
      if (!b) return uscita(`Biotipo «${a.biotipo}» non trovato: usa elenca_biotipi per gli id.`);
      ordine = b.prodotti;
      elenco = elenco.filter((p) => (p.biotipi || []).includes(b.id) || b.prodotti.includes(p.id));
    }
    if (a.attivo) {
      const w = norm(a.attivo);
      const inci = await dati(env, 'inci.json');
      elenco = elenco.filter((p) => (p.attivi || []).some((x) => norm(x).includes(w)) || norm(inci[p.id] || '').includes(w));
    }
    if (a.testo) {
      const ww = parole(a.testo);
      elenco = elenco.map((p) => ({ p, v: ww.filter((w) => norm(`${p.nome} ${p.sottotitolo || ''} ${p.categoria}`).includes(w)).length })).filter((x) => x.v > 0)
        .sort((x, y) => y.v - x.v || perValore(x.p, y.p)).map((x) => x.p);
    } else if (ordine) {
      elenco = [...elenco].sort((x, y) => ((ordine.indexOf(x.id) + 1 || 999) - (ordine.indexOf(y.id) + 1 || 999)) || x.prezzo - y.prezzo);
    } else elenco = [...elenco].sort(perValore);
    const scelti = elenco.slice(0, limite);
    if (!scelti.length) return uscita('Nessun prodotto con questi filtri. Prova a toglierne uno (il prezzo massimo o «senza»).', { prodotti: [], totale: 0 });
    return uscita(`${elenco.length} prodotti trovati, i primi ${scelti.length}:\n${scelti.map((p) => `- ${riassuntoProdotto(p)}`).join('\n')}\n\nPrezzi dei negozi all'ultimo aggiornamento di Skinmatch. Link di affiliazione: il prezzo per chi compra non cambia.`,
      { totale: elenco.length, prodotti: scelti.map((p) => ({ ...p, url: conUtm(p.url) })) });
  }
  if (nome === 'biotipo') {
    const b = await trovaBiotipo(env, a.id || '');
    if (!b) return uscita(`Biotipo «${a.id}» non trovato: usa elenca_biotipi per gli id.`);
    const tutti = await dati(env, 'prodotti.json');
    const prodotti = b.prodotti.map((id) => tutti.find((p) => p.id === id)).filter(Boolean);
    const testo = `# ${b.titolo}\n${b.motto}\n\n${b.descrizione}\n\nCome si riconosce:\n${b.caratteristiche.map((x) => `- ${x}`).join('\n')}\n\nCosa cercare:\n${b.cerca.map((x) => `- ${x}`).join('\n')}\n\nCosa evitare:\n${b.evita.map((x) => `- ${x}`).join('\n')}${b.consiglio_medico ? `\n\nIl consiglio del medico (rivisto da Sofia Crescenzi):\n${b.consiglio_medico}` : ''}${prodotti.length ? `\n\nProdotti scelti da Skinmatch:\n${prodotti.map((p) => `- ${riassuntoProdotto(p)}`).join('\n')}` : ''}\n\nPagina: ${conUtm(b.url)} · Per un risultato personale: ${conUtm('https://skinmatch.it/test')}`;
    return uscita(testo, { ...b, url: conUtm(b.url), prodotti: prodotti.map((p) => ({ ...p, url: conUtm(p.url) })) });
  }
  if (nome === 'elenca_biotipi') {
    const biotipi = (await dati(env, 'biotipi.json')).filter((b) => !a.area || b.area === a.area);
    return uscita(biotipi.map((b) => `- ${b.id} (${b.area}): ${b.titolo} — ${b.motto}`).join('\n'), { biotipi: biotipi.map(({ id, area, tipo, titolo, motto, url }) => ({ id, area, tipo, titolo, motto, url: conUtm(url) })) });
  }
  if (nome === 'biotipi_da_segni') {
    const ww = parole(a.descrizione).filter((w) => !VUOTE.has(w));
    if (!ww.length) return uscita('Descrivi qualche segno (es. «lucida sulla fronte, tira sulle guance»).');
    const biotipi = (await dati(env, 'biotipi.json')).filter((b) => b.tipo === 'biotipo' && (!a.area || b.area === a.area));
    const voti = biotipi.map((b) => {
      const corpo = norm([b.titolo, b.descrizione, ...b.caratteristiche].join(' '));
      return { b, v: ww.reduce((s, w) => s + (corpo.includes(w.slice(0, Math.max(4, w.length - 2))) ? 1 : 0), 0) };
    }).filter((x) => x.v > 0).sort((x, y) => y.v - x.v).slice(0, 3);
    if (!voti.length) return uscita(`Dalle parole non riconosco un biotipo. Il test lo fa meglio: ${conUtm('https://skinmatch.it/test')}`);
    return uscita(`Una STIMA dalle parole (non è il test):\n${voti.map(({ b, v }) => `- ${b.titolo} (${b.id}): ${v} segni in comune — ${conUtm(b.url)}`).join('\n')}\n\nPer il risultato vero, con la routine: ${conUtm('https://skinmatch.it/test')}`,
      { stima: true, biotipi: voti.map(({ b, v }) => ({ id: b.id, titolo: b.titolo, segni_in_comune: v, url: conUtm(b.url) })), test: conUtm('https://skinmatch.it/test') });
  }
  if (nome === 'ingrediente') {
    const k = norm(a.nome || '').trim();
    if (!k) return uscita('Dimmi quale ingrediente.');
    const termini = await dati(env, 'termini.json');
    const t = termini.find((x) => norm(x.nome) === k || (x.nomi || []).some((n) => norm(n) === k)) || termini.find((x) => norm(x.nome).includes(k) || (x.nomi || []).some((n) => norm(n).includes(k)));
    const prodotti = await dati(env, 'prodotti.json');
    const inci = await dati(env, 'inci.json');
    const cerca = norm(t?.nomi?.[0] || a.nome);
    const con = prodotti.filter((p) => (p.attivi || []).some((x) => norm(x).includes(cerca)) || norm(inci[p.id] || '').includes(cerca));
    const esempi = [...con].sort(perValore).slice(0, 5);
    const testo = `${t ? `${t.nome}: ${t.testo}${t.per_chi ? `\nPer chi: ${t.per_chi}` : ''}${t.attenzione ? `\nAttenzione: ${t.attenzione}` : ''}\nGlossario: ${conUtm(t.url)}` : `«${a.nome}» non è nel glossario di Skinmatch.`}\n\n${con.length} prodotti del catalogo lo contengono${esempi.length ? `; alcuni dei più completi:\n${esempi.map((p) => `- ${riassuntoProdotto(p)}`).join('\n')}` : '.'}`;
    return uscita(testo, { termine: t || null, prodotti_con: con.length, esempi: esempi.map((p) => ({ ...p, url: conUtm(p.url) })) });
  }
  if (nome === 'articoli') {
    let elenco = await dati(env, 'articoli.json');
    if (a.biotipo) elenco = elenco.filter((x) => x.biotipi.includes(a.biotipo));
    if (a.termine) elenco = elenco.filter((x) => x.termini.includes(norm(a.termine)) || norm(x.titolo + x.sommario).includes(norm(a.termine)));
    if (a.testo) { const ww = parole(a.testo); elenco = elenco.filter((x) => ww.some((w) => norm(x.titolo + ' ' + x.sommario).includes(w))); }
    if (!elenco.length) return uscita('Nessun articolo trovato.', { articoli: [] });
    return uscita(elenco.map((x) => `- ${x.titolo} (${x.firma}, ${x.data}): ${x.sommario} — ${conUtm(x.url)} · markdown: ${x.md}`).join('\n'), { articoli: elenco.map((x) => ({ ...x, url: conUtm(x.url) })) });
  }
  if (nome === 'test_skinmatch') {
    const biotipi = await dati(env, 'biotipi.json');
    return uscita(`Il test di Skinmatch è gratuito e senza registrazione: domande su quello che si vede allo specchio e sulle abitudini, per pelle, cuoio capelluto e integrazione. Il risultato è un biotipo per area (${biotipi.length} in tutto) e una routine mattina e sera con prodotti reali, i loro INCI e i prezzi. Si fa qui: ${conUtm('https://skinmatch.it/test')}`,
      { url: conUtm('https://skinmatch.it/test'), biotipi: biotipi.length, gratuito: true, registrazione: false });
  }
  return null;
}

// ── IL PROTOCOLLO ─────────────────────────────────────────────────────────────────────────────────────────────────
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, GET, OPTIONS',
  'access-control-allow-headers': 'content-type, accept, mcp-protocol-version, mcp-session-id, authorization',
  'access-control-expose-headers': 'mcp-session-id, mcp-protocol-version',
};
const risposta = (dati, stato = 200) => new Response(dati === null ? null : JSON.stringify(dati), { status: stato, headers: { ...CORS, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

function conta(env, ctx, strumento) {
  if (!env.DB || !ctx) return;
  const giorno = new Date().toISOString().slice(0, 10);
  ctx.waitUntil(env.DB.prepare('INSERT INTO mcp_chiamate (giorno, strumento, n) VALUES (?1, ?2, 1) ON CONFLICT (giorno, strumento) DO UPDATE SET n = n + 1')
    .bind(giorno, strumento).run().catch(() => {}));
}

async function messaggio(env, ctx, m) {
  const id = m && m.id;
  const errore = (code, message) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
  if (!m || m.jsonrpc !== '2.0' || typeof m.method !== 'string') return errore(-32600, 'Richiesta non valida');
  if (id === undefined) return null;   // una notifica (es. notifications/initialized): niente risposta
  const ok = (result) => ({ jsonrpc: '2.0', id, result });
  switch (m.method) {
    case 'initialize': {
      const chiesto = m.params?.protocolVersion;
      conta(env, ctx, 'initialize');
      return ok({ protocolVersion: PROTOCOLLI.includes(chiesto) ? chiesto : PROTOCOLLI[0], capabilities: { tools: { listChanged: false } }, serverInfo: SERVER, instructions: ISTRUZIONI });
    }
    case 'ping': return ok({});
    case 'tools/list': return ok({ tools: STRUMENTI });
    case 'resources/list': return ok({ resources: [] });
    case 'resources/templates/list': return ok({ resourceTemplates: [] });
    case 'prompts/list': return ok({ prompts: [] });
    case 'tools/call': {
      const nome = m.params?.name;
      if (!STRUMENTI.some((s) => s.name === nome)) return errore(-32602, `Strumento sconosciuto: ${nome}`);
      conta(env, ctx, nome);
      try { return ok(await esegui(env, nome, m.params?.arguments || {})); }
      catch (e) { return ok({ content: [{ type: 'text', text: `Errore: ${String(e && e.message || e)}` }], isError: true }); }
    }
    default: return errore(-32601, `Metodo non supportato: ${m.method}`);
  }
}

export async function mcp(req, env, ctx) {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method === 'GET') {
    // niente flusso SSE dal server (non manda notifiche): la specifica vuole 405
    return new Response(JSON.stringify({ server: SERVER, protocollo: 'Streamable HTTP (POST JSON-RPC 2.0)', descrizione: 'https://skinmatch.it/.well-known/mcp.json' }),
      { status: 405, headers: { ...CORS, allow: 'POST, OPTIONS', 'content-type': 'application/json; charset=utf-8' } });
  }
  if (req.method !== 'POST') return new Response(null, { status: 405, headers: { ...CORS, allow: 'POST, GET, OPTIONS' } });
  let corpo;
  try { corpo = await req.json(); } catch { return risposta({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'JSON non valido' } }, 400); }
  if (Array.isArray(corpo)) {
    const fuori = (await Promise.all(corpo.map((m) => messaggio(env, ctx, m)))).filter(Boolean);
    return fuori.length ? risposta(fuori) : new Response(null, { status: 202, headers: CORS });
  }
  const r = await messaggio(env, ctx, corpo);
  return r ? risposta(r) : new Response(null, { status: 202, headers: CORS });
}

// la descrizione del server, per chi lo cerca sul sito (/.well-known/mcp.json e /.well-known/mcp/server-card.json)
export function schedaServer() {
  return new Response(JSON.stringify({
    $schema: 'https://static.modelcontextprotocol.io/schemas/mcp-server-card/v1.json',
    ...SERVER, description: 'Biotipi di pelle e cuoio capelluto, prodotti con INCI e prezzi, glossario degli ingredienti e articoli di Skinmatch.',
    remotes: [{ type: 'streamable-http', url: 'https://skinmatch.it/mcp' }],
    authentication: { required: false }, capabilities: { tools: { listChanged: false } },
    tools: STRUMENTI.map(({ name, title, description }) => ({ name, title, description })),
    documentation: 'https://skinmatch.it/llms.txt', contact: 'skinmatch@agoranomos.cloud',
  }, null, 1), { headers: { ...CORS, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
}
