'use client';

import { useState } from 'react';
import { euro } from '@/lib/formato';
import { fonteDalSubid } from '@/lib/subid';
import { useApi } from './base';
import { Barre } from './grafici';

// QUANTI CI VEDONO, QUANTI ARRIVANO, QUANTI COMPRANO (24/11/2026, Federico: «voglio che lo adegui anche per skinmatch»,
// dopo la Panoramica di Agoranomos). Tre riquadri e cinque linguette: Google e ricerca, TikTok, YouTube, Instagram, IA.
// Toccandone una si apre il suo percorso: ci vedono → arrivano → cliccano un negozio → comprano.
// · Ci vedono: Search Console (impressioni) e gli assistenti che aprono le pagine per rispondere a qualcuno (/api/admin/ia,
//   tipo «utente»). I social di Skinmatch non sono ancora collegati via API: lo si dice, senza inventare numeri.
// · Arrivano: il conteggio senza cookie (eventi_giorno, tipo arrivo, per famiglia della fonte).
// · Cliccano: dal 24/11 ogni clic porta la fonte della visita (tipo clic_fonte). Il tasso arrivi → clic di una fonte si
//   misura sui giorni in cui c'è quel conteggio (almeno 30 arrivi); prima, o con pochi arrivi, vale la media del sito.
// · Comprano: esatte quando il SubID ha la fonte (lib/subid.ts, dal 24/11); le altre si dividono come i clic stimati (≈).
type Riga = { giorno: string; tipo: string; chiave: string; n: number };
type Vendita = { commissione: number; subid: string };

const LINGUETTE = [
  { k: 'ricerca', nome: 'Google e ricerca', famiglie: ['google', 'bing', 'altro_motore'], colore: 'var(--f4)', vede: 'impressioni su Google',
    spiega: ['Chi cerca su Google un problema o un prodotto («crema per pelle sensibile», «Sensibio H2O») vede le nostre pagine fra i risultati: ogni volta è un’impressione.',
      'Chi sceglie noi arriva su Skinmatch, fa il test o apre una scheda e va al negozio. Search Console conta le impressioni; gli arrivi li contiamo noi, senza cookie.'] },
  { k: 'tiktok', nome: 'TikTok', famiglie: ['tiktok'], colore: 'var(--f6)', vede: 'visualizzazioni dei video',
    spiega: ['Nei video non ci sono link: si arriva da skinmatch.it/link in bio o cercandoci.',
      'Riconosciamo chi arriva dal browser dentro l’app di TikTok; chi copia l’indirizzo finisce in «Diretto o app».'] },
  { k: 'youtube', nome: 'YouTube', famiglie: ['youtube'], colore: 'var(--f5)', vede: 'visualizzazioni degli Short',
    spiega: ['Il link sta sul canale e nella descrizione degli Short.', 'Chi arriva dall’app senza dirlo finisce in «Diretto o app».'] },
  { k: 'instagram', nome: 'Instagram', famiglie: ['instagram'], colore: 'var(--f3)', vede: 'visualizzazioni dei post',
    spiega: ['Il link sta nella bio (skinmatch.it/link) e nelle storie.', 'Riconosciamo chi arriva dal browser dentro l’app di Instagram.'] },
  { k: 'ia', nome: 'IA', famiglie: ['chatgpt', 'perplexity', 'gemini', 'claude', 'copilot', 'altra_ia'], colore: 'var(--f2)', vede: 'pagine aperte dagli assistenti per rispondere',
    spiega: ['ChatGPT, Perplexity, Claude e gli altri aprono le nostre pagine (o chiamano il server MCP) mentre rispondono a qualcuno.',
      'Chi poi tocca la fonte nella risposta arriva su Skinmatch, e da lì il percorso è lo stesso degli altri.'] },
];
const ALTRI = [
  { k: 'diretto', nome: 'Diretto o app', famiglie: ['diretto'], colore: 'var(--f1)' },
  { k: 'altro', nome: 'Altro (Facebook, Pinterest, altri siti)', famiglie: ['facebook', 'threads', 'pinterest', 'link_in_bio', 'altro_sito'], colore: 'var(--riga)' },
];
const TUTTE = [...LINGUETTE, ...ALTRI];
const linguettaDi = (famiglia: string) => TUTTE.find((l) => l.famiglie.includes(famiglia))?.k || 'altro';

const n = (x: number | null | undefined) => (x == null ? '—' : Math.round(x).toLocaleString('it-IT'));
const circa = (x: number) => (x > 0 && x < 1 ? '<1' : n(x));
const pct = (a: number, b: number | null | undefined) => (b ? Math.round((a / b) * 1000) / 10 : null);
const pc = (x: number | null) => (x == null ? '—' : `${x.toLocaleString('it-IT', { maximumFractionDigits: 1 })}%`);

export default function Percorso({ righe, vendite, giorni }: { righe: Riga[]; vendite: Vendita[]; giorni: number }) {
  const [aperta, setAperta] = useState<string | null>(null);
  const google = useApi<{ collegato: boolean; totali?: { impressioni: number } }>(`/api/admin/google?periodo=${giorni <= 7 ? '7g' : '30g'}`);
  const ia = useApi<{ perRobot: { tipo: string; n: number }[] }>(`/api/admin/ia?periodo=${giorni}g`);

  // arrivi e clic per linguetta
  const arrivi: Record<string, number> = {}, clicFonte: Record<string, number> = {}, arriviDaClic: Record<string, number> = {};
  const primoClicFonte = righe.filter((r) => r.tipo === 'clic_fonte').map((r) => r.giorno).sort()[0] || null;
  for (const r of righe) {
    if (r.tipo === 'arrivo') {
      const k = linguettaDi(r.chiave);
      arrivi[k] = (arrivi[k] || 0) + r.n;
      if (primoClicFonte && r.giorno >= primoClicFonte) arriviDaClic[k] = (arriviDaClic[k] || 0) + r.n;
    } else if (r.tipo === 'clic_fonte' && r.chiave !== 'ignota') {
      const k = linguettaDi(r.chiave);
      clicFonte[k] = (clicFonte[k] || 0) + r.n;
    }
  }
  const totArrivi = Object.values(arrivi).reduce((t, x) => t + x, 0);
  const totClic = righe.filter((r) => r.tipo === 'clic').reduce((t, r) => t + r.n, 0);
  const tassoMedio = totArrivi ? totClic / totArrivi : 0;

  // le vendite: esatte se il SubID ha la fonte, le altre da dividere
  const esatte: Record<string, { n: number; c: number }> = {};
  let senzaN = 0, senzaC = 0;
  for (const v of vendite) {
    const f = fonteDalSubid(v.subid);
    if (f) { const x = (esatte[linguettaDi(f)] ||= { n: 0, c: 0 }); x.n += 1; x.c += v.commissione || 0; }
    else { senzaN += 1; senzaC += v.commissione || 0; }
  }
  const vedeIa = (ia.dati?.perRobot || []).filter((r) => r.tipo === 'utente').reduce((t, r) => t + r.n, 0);
  const vedeGoogle = google.dati?.collegato ? google.dati.totali?.impressioni ?? null : null;
  const canali = TUTTE.map((c) => {
    const a = arrivi[c.k] || 0, misurato = (arriviDaClic[c.k] || 0) >= 30;
    const tasso = misurato ? (clicFonte[c.k] || 0) / (arriviDaClic[c.k] || 1) : tassoMedio;
    return { ...c, arrivi: a, tasso, misurato, campione: arriviDaClic[c.k] || 0, clic: a * tasso,
      vede: c.k === 'ricerca' ? vedeGoogle : c.k === 'ia' ? vedeIa : null };
  });
  const totClicStimati = canali.reduce((t, c) => t + c.clic, 0);
  const righeCanali = canali.map((c) => {
    const quota = totClicStimati ? c.clic / totClicStimati : 0;
    const e = esatte[c.k] || { n: 0, c: 0 };
    return { ...c, venditeEsatte: e.n, venditeStimate: senzaN * quota, vendite: e.n + senzaN * quota, comm: e.c + senzaC * quota };
  });
  const totEsatte = Object.values(esatte).reduce((t, x) => t + x.n, 0);
  const commissioni = vendite.reduce((t, v) => t + (v.commissione || 0), 0);
  const scelta = righeCanali.find((c) => c.k === aperta);
  const linguetta = LINGUETTE.find((l) => l.k === aperta);

  return (
    <section className="pila" style={{ ['--gap' as string]: '12px' }}>
      <h2 className="titolo-2">Quanti ci vedono, quanti arrivano, quanti comprano</h2>
      <p className="piccolo" style={{ margin: 0 }}>Google e gli assistenti per chi ci vede, il nostro conteggio senza cookie per chi arriva e clicca, le reti di affiliazione per chi compra. Ultimi {giorni} giorni.</p>
      <div className="prc-tre">
        <div className="carta pila" style={{ ['--gap' as string]: '10px' }}>
          <span className="piccolo prc-etichetta">Ci vedono</span>
          <b className="prc-numero">{n((vedeGoogle || 0) + vedeIa)}</b>
          <Barre righe={[
            { k: 'g', nome: 'Google · impressioni', valore: vedeGoogle || 0, colore: 'var(--f4)', sotto: vedeGoogle == null ? 'Search Console non risponde' : `Search Console, ${giorni <= 7 ? '7' : '30'} giorni` },
            { k: 'ia', nome: 'IA · pagine aperte per rispondere', valore: vedeIa, colore: 'var(--f2)', sotto: 'assistenti che leggono per qualcuno' },
          ]} />
          <span className="piccolo">TikTok, YouTube e Instagram di Skinmatch non sono ancora collegati via API: le visualizzazioni restano nelle app.</span>
        </div>
        <div className="carta pila" style={{ ['--gap' as string]: '10px' }}>
          <span className="piccolo prc-etichetta">Arrivano</span>
          <b className="prc-numero">{n(totArrivi)}</b>
          <Barre righe={righeCanali.filter((c) => c.arrivi > 0).sort((a, b) => b.arrivi - a.arrivi).map((c) => ({ k: c.k, nome: c.nome, valore: c.arrivi, colore: c.colore }))} vuoto="Nessuna visita contata nel periodo." />
          <span className="piccolo">Visite, non persone: senza cookie chi torna conta due volte.</span>
        </div>
        <div className="carta pila" style={{ ['--gap' as string]: '10px' }}>
          <span className="piccolo prc-etichetta">Comprano</span>
          <b className="prc-numero">{n(vendite.length)}</b>
          <span className="piccolo"><b>{euro(commissioni)}</b> di commissioni. {totEsatte} con la fonte esatta (nel SubID dal 24/11); le altre {senzaN} divise come i clic stimati di ogni fonte (≈).</span>
          <Barre righe={righeCanali.filter((c) => c.vendite > 0).sort((a, b) => b.vendite - a.vendite).map((c) => ({ k: c.k, nome: c.nome, valore: c.vendite, colore: c.colore,
            testo: c.venditeStimate > 0.005 ? `≈ ${circa(c.vendite)}` : n(c.venditeEsatte),
            sotto: `${c.venditeEsatte} esatte${c.venditeStimate ? ` + ≈ ${circa(c.venditeStimate)} stimate` : ''} · ${euro(c.comm)}` }))}
            vuoto="Nessuna vendita nel periodo." />
        </div>
      </div>
      <div className="riga-chip" role="tablist" aria-label="Il percorso di una fonte">
        {LINGUETTE.map((l) => (
          <button key={l.k} type="button" role="tab" className="chip" aria-pressed={aperta === l.k} aria-selected={aperta === l.k}
            onClick={() => setAperta(aperta === l.k ? null : l.k)}>
            <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: aperta === l.k ? 'var(--fondo)' : l.colore, display: 'inline-block' }} />{l.nome}
          </button>
        ))}
      </div>
      {!scelta || !linguetta ? <p className="piccolo" style={{ margin: 0 }}>Tocca una fonte per vedere il suo percorso, da quanti ci vedono a quanti comprano.</p> : (
        <div className="pila" style={{ ['--gap' as string]: '10px' }}>
          <ol className="prc-passi">
            <Passo n={1} titolo="Ci vedono" valore={scelta.vede == null ? '—' : n(scelta.vede)} sotto={scelta.vede == null ? 'non collegato per questa fonte' : linguetta.vede} />
            <Freccia q={scelta.vede ? pct(scelta.arrivi, scelta.vede) : null} />
            <Passo n={2} titolo="Arrivano" valore={n(scelta.arrivi)} sotto="visite contate senza cookie" />
            <Freccia q={pct(scelta.clic, scelta.arrivi)} />
            <Passo n={3} titolo="Cliccano un negozio" valore={`≈ ${circa(scelta.clic)}`}
              sotto={scelta.misurato ? `${pc(Math.round(scelta.tasso * 1000) / 10)} delle visite, contato su ${n(scelta.campione)} visite` : `media del sito (${pc(Math.round(tassoMedio * 1000) / 10)}): per ${scelta.nome} ancora pochi clic con la fonte`} />
            <Freccia q={pct(scelta.vendite, scelta.clic)} />
            <Passo n={4} titolo="Comprano" valore={scelta.venditeStimate ? `≈ ${circa(scelta.vendite)}` : n(scelta.venditeEsatte)}
              sotto={`${scelta.venditeEsatte} esatte${scelta.venditeStimate ? ` + ≈ ${circa(scelta.venditeStimate)} stimate` : ''} · ${euro(scelta.comm)}`} />
          </ol>
          <div className="carta pila" style={{ ['--gap' as string]: '6px' }}>{linguetta.spiega.map((t) => <p key={t} className="piccolo" style={{ margin: 0, fontSize: 14 }}>{t}</p>)}</div>
        </div>
      )}
    </section>
  );
}

function Passo({ n: num, titolo, valore, sotto }: { n: number; titolo: string; valore: string; sotto: string }) {
  return (
    <li className="carta prc-passo">
      <span className="piccolo prc-etichetta">{num} · {titolo}</span>
      <b className="prc-numero">{valore}</b>
      <span className="piccolo">{sotto}</span>
    </li>
  );
}
function Freccia({ q }: { q: number | null }) {
  return <li aria-hidden={q == null} className="prc-freccia">{q == null ? '→' : `${pc(q)} →`}</li>;
}
