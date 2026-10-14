// IL WORKER DI SKINMATCH: il sito resta statico (out/), il Worker fa tre cose sole.
// 1. /api/evento: somma i conteggi del sito (test iniziati e finiti, clic verso i negozi) per
//    giorno, senza dati personali: niente risposte, niente IP, niente cookie (tappa 9).
// 2. /admin e /api/admin: solo per chi passa da Cloudflare Access ed è nell'elenco ADMIN_EMAILS
//    (Federico e Sofia). Il Worker ricontrolla il gettone di Access da sé: se Access non c'è
//    ancora, o il gettone non torna, l'admin non si apre (meglio chiuso che aperto).
// 3. tutto il resto: i file statici, come prima.
//
// ⚠️ ACCESS: si attiva nella dashboard di Cloudflare (Zero Trust → Access → Applications), sul
// percorso skinmatch.it/admin*; poi ACCESS_TEAM (il nome del team) e ACCESS_AUD (l'«Application
// Audience tag») vanno in wrangler.jsonc, vars. Istruzioni in DEPLOY.md.

const TIPI_EVENTO = new Set(['test_inizio', 'test_fine', 'clic']);
const DOCUMENTI = new Set(['test', 'biotipi', 'glossario', 'catalogo']);
const STATI_ARTICOLO = new Set(['in_approvazione', 'da_correggere', 'approvato', 'online', 'scartato']);
const breve = (s, n = 80) => String(s ?? '').replace(/[^\p{L}\p{N}_.\- ]/gu, '').slice(0, n);
const json = (dati, stato = 200) => new Response(JSON.stringify(dati), { status: stato, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const oggi = () => new Date().toISOString().slice(0, 10);

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const p = url.pathname;
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
    return env.ASSETS.fetch(req);
  },
};

// ── 1. i conteggi ────────────────────────────────────────────────────────────
async function evento(req, env) {
  if (req.method !== 'POST') return new Response(null, { status: 405 });
  let e;
  try { e = JSON.parse((await req.text()).slice(0, 2000)); } catch { return new Response(null, { status: 400 }); }
  if (!e || !TIPI_EVENTO.has(e.e)) return new Response(null, { status: 400 });
  const g = oggi(), righe = [];
  if (e.e === 'test_inizio') righe.push(['test_inizio', breve(e.p, 20)]);
  if (e.e === 'test_fine') {
    righe.push(['test_fine', breve(e.p, 20)]);
    for (const b of (Array.isArray(e.b) ? e.b : []).slice(0, 3)) righe.push(['biotipo', breve(b, 40)]);
  }
  if (e.e === 'clic') righe.push(['clic', breve(e.id)], ['clic_negozio', breve(e.m, 40)], ['clic_da', breve(e.da)]);
  const st = env.DB.prepare('INSERT INTO eventi_giorno (giorno, tipo, chiave, n) VALUES (?1, ?2, ?3, 1) ON CONFLICT (giorno, tipo, chiave) DO UPDATE SET n = n + 1');
  await env.DB.batch(righe.filter(([, k]) => k).map(([t, k]) => st.bind(g, t, k)));
  return new Response(null, { status: 204 });
}

// ── 2. l'accesso: il gettone di Cloudflare Access, ricontrollato qui ─────────────
let CERTI = null, CERTI_IL = 0;
const b64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), (c) => c.charCodeAt(0));
async function accesso(req, env) {
  // solo in prova sul Mac (wrangler dev, .dev.vars): mai online, dove l'indirizzo non è localhost
  if (env.ADMIN_SVILUPPO === 'si' && new URL(req.url).hostname === 'localhost') return { ok: true, email: 'prova@localhost' };
  const team = env.ACCESS_TEAM, aud = env.ACCESS_AUD;
  const ammessi = String(env.ADMIN_EMAILS || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean);
  if (!team || !aud) return { ok: false, motivo: 'Cloudflare Access non è ancora attivo per l\'admin di Skinmatch.' };
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
async function admin(req, env, url, email) {
  const DB = env.DB, q = url.searchParams, via = url.pathname.slice('/api/admin/'.length);
  const corpo = req.method === 'POST' ? await req.json() : null;
  const tutti = async (sql, ...v) => (await DB.prepare(sql).bind(...v).all()).results;

  if (via === 'chi') return json({ email });

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
    if (aperta) return json({ ok: true, id: aperta.id, gia: true });
    const r = await DB.prepare('INSERT INTO pubblicazioni (chi, cosa) VALUES (?1, ?2) RETURNING id').bind(email, cosa).first();
    return json({ ok: true, id: r.id });
  }

  if (via === 'articoli') {
    if (req.method === 'GET') return json({ articoli: await tutti('SELECT * FROM articoli ORDER BY id DESC LIMIT 200') });
    const { id, stato, feedback, campi } = corpo || {};
    const a = await DB.prepare('SELECT stato FROM articoli WHERE id = ?1').bind(id).first();
    if (!a) return json({ errore: 'articolo non trovato' }, 404);
    if (stato && !STATI_ARTICOLO.has(stato)) return json({ errore: 'stato sconosciuto' }, 400);
    if (stato === 'online') return json({ errore: 'online lo segna la pubblicazione' }, 400);
    const ok = ['titolo', 'sommario', 'testo'];
    const set = Object.entries(campi || {}).filter(([k, v]) => ok.includes(k) && typeof v === 'string');
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

  if (via === 'squadra') {
    return json({
      rapporti: await tutti('SELECT id, agente, tipo, titolo, sintesi, corpo, esito, creato_il FROM squadra ORDER BY id DESC LIMIT 30'),
      pubblicazioni: await tutti('SELECT * FROM pubblicazioni ORDER BY id DESC LIMIT 10'),
    });
  }

  return json({ errore: 'non trovato' }, 404);
}

const PAGINA_CHIUSA = (motivo) => `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Admin di Skinmatch</title>
<style>body{margin:0;font:16px/1.6 system-ui,sans-serif;background:#fbf8f4;color:#231c16;display:grid;place-items:center;min-height:100vh;padding:24px;box-sizing:border-box}main{max-width:460px;display:grid;gap:12px}h1{font:600 26px/1.2 Georgia,serif;margin:0}p{margin:0;color:#6b6058}a{color:#9a5a3c}</style></head>
<body><main><h1>Area riservata</h1><p>${String(motivo).replace(/[<>&]/g, '')}</p><p>L'admin di Skinmatch si apre solo con l'accesso di Cloudflare, per gli account di Federico e di Sofia.</p><p><a href="/">Torna al sito</a></p></main></body></html>`;
