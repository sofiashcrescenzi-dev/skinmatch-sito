'use client';

import { useEffect, useMemo, useState } from 'react';
import { CATALOGO, ATTIVI, conAttivo } from '@/lib/dati';
import { PRODOTTI, inCategoria, type Prodotto } from '@/lib/catalogo';
import SchedaProdotto from '@/components/SchedaProdotto';
import CLIC from '@/data/clic.json';

// Il catalogo per informarsi da soli (Federico, 15/10: «tutti i filtri che funzionano con i tag e
// ordina per prezzo, consigliati in base ai clic e agli attivi»). Filtri: categoria, selezioni (i tag
// di src/data/catalogo.json), attivo (src/data/attivi.json), tipo di pelle, problema, marca, ricerca.
// Ordini: consigliati (attivi + clic), più scelti (clic degli ultimi 90 giorni, scripts/catalogo/clic.py),
// più ricchi di attivi, prezzo, prezzo ogni 10 ml. Tutto sta nell'indirizzo, così una ricerca si condivide.
const PASSO = 24;
const clic = (CLIC as { clic: Record<string, number> }).clic;
const valore = (p: Prodotto) => p.scheda?.valore ?? p.scheda?.completezza ?? 0;
const ORDINI: [string, string, (a: Prodotto, b: Prodotto) => number][] = [
  ['consigliati', 'Consigliati', (a, b) => valore(b) + 8 * Math.log2(1 + (clic[b.id] || 0)) - valore(a) - 8 * Math.log2(1 + (clic[a.id] || 0))],
  ['scelti', 'I più scelti', (a, b) => (clic[b.id] || 0) - (clic[a.id] || 0) || valore(b) - valore(a)],
  ['attivi', 'Più ricchi di attivi', (a, b) => valore(b) - valore(a)],
  ['prezzo', 'Prezzo: dal più basso', (a, b) => a.price - b.price],
  ['prezzo-alto', 'Prezzo: dal più alto', (a, b) => b.price - a.price],
  ['al-10', 'Prezzo ogni 10 ml', (a, b) => (a.scheda?.al_10 ?? 1e9) - (b.scheda?.al_10 ?? 1e9)],
];
const PELLI: [string, string][] = [['secca', 'Secca'], ['normale', 'Normale'], ['mista', 'Mista'], ['grassa', 'Grassa'], ['sensibile', 'Sensibile']];
const PROBLEMI: [string, string, (p: Prodotto) => boolean][] = [
  ['idratazione', 'Idratazione', (p) => !!p.concerns?.includes('idratazione')],
  ['imperfezioni', 'Imperfezioni e brufoli', (p) => !!p.concerns?.includes('acne-sebo')],
  ['macchie', 'Macchie e luminosità', (p) => !!p.concerns?.includes('macchie-luminosita')],
  ['tempo', 'Segni del tempo', (p) => !!p.concerns?.includes('anti-age')],
  ['rossori', 'Rossori e pelle che reagisce', (p) => !!p.concerns?.includes('rossori-sensibilita')],
  ['barriera', 'Barriera della pelle', (p) => !!p.concerns?.includes('barriera-cutanea')],
  ['pori', 'Pori dilatati', (p) => !!p.concerns?.includes('pori-dilatati')],
  ['sole', 'Protezione solare', (p) => !!p.concerns?.includes('protezione-solare')],
  ['caduta', 'Caduta dei capelli', (p) => !!p.hairConcerns?.includes('caduta')],
  ['forfora', 'Forfora', (p) => !!p.hairConcerns?.includes('forfora')],
  ['crespi', 'Capelli secchi e crespi', (p) => !!p.hairConcerns?.includes('secchi-crespi')],
];
type Filtri = { categoria: string; tag: string[]; attivo: string; pelle: string; problema: string; marca: string; q: string; ordina: string };
const VUOTI: Filtri = { categoria: '', tag: [], attivo: '', pelle: '', problema: '', marca: '', q: '', ordina: 'consigliati' };

export default function Catalogo({ categoria: c0 = '', tag: t0 = '' }: { categoria?: string; tag?: string }) {
  const [f, setF] = useState<Filtri>({ ...VUOTI, categoria: c0, tag: t0 ? [t0] : [] });
  const [quanti, setQuanti] = useState(PASSO);
  const cambia = (x: Partial<Filtri>) => { setF((v) => ({ ...v, ...x })); setQuanti(PASSO); };
  // i filtri dall'indirizzo, all'apertura (?categoria=sieri&tag=k-beauty&attivo=niacinamide&ordina=prezzo)
  useEffect(() => {
    const u = new URLSearchParams(window.location.search);
    const t = u.getAll('tag');
    if (u.get('kbeauty') === '1') t.push('k-beauty');
    setF((v) => ({
      ...v, categoria: c0 || u.get('categoria') || '', tag: [...new Set([...(t0 ? [t0] : []), ...t])],
      attivo: u.get('attivo') || '', pelle: u.get('pelle') || '', problema: u.get('problema') || '', marca: u.get('marca') || '', q: u.get('q') || '',
      ordina: ORDINI.some((o) => o[0] === u.get('ordina')) ? u.get('ordina')! : 'consigliati',
    }));
  }, [c0, t0]);
  useEffect(() => {
    const u = new URLSearchParams();
    if (f.categoria && !c0) u.set('categoria', f.categoria);
    f.tag.filter((t) => t !== t0).forEach((t) => u.append('tag', t));
    (['attivo', 'pelle', 'problema', 'marca', 'q'] as const).forEach((k) => f[k] && u.set(k, f[k]));
    if (f.ordina !== 'consigliati') u.set('ordina', f.ordina);
    history.replaceState(null, '', u.toString() ? `?${u}` : location.pathname);
  }, [f, c0, t0]);

  const cat = CATALOGO.categorie.find((x) => x.id === f.categoria);
  const att = ATTIVI.find((a) => a.id === f.attivo);
  const pro = PROBLEMI.find((x) => x[0] === f.problema);
  const parole = f.q.trim().toLowerCase().split(/\s+/).filter(Boolean);
  // ogni filtro, da solo: così ogni menu conta i prodotti tenendo conto degli altri filtri
  const regole: Record<string, (p: Prodotto) => boolean> = {
    categoria: (p) => !cat || inCategoria(p, cat),
    tag: (p) => f.tag.every((t) => p.tag.includes(t)),
    attivo: (p) => !att || conAttivo(p, att),
    pelle: (p) => !f.pelle || !!p.skinTypes?.includes(f.pelle as never),
    problema: (p) => !pro || pro[2](p),
    marca: (p) => !f.marca || p.brand === f.marca,
    q: (p) => parole.every((w) => `${p.brand} ${p.name} ${p.description} ${(p.scheda?.attivi || []).map((a) => a.nome).join(' ')}`.toLowerCase().includes(w)),
  };
  const tranne = (k: string) => PRODOTTI.filter((p) => Object.entries(regole).every(([r, fn]) => r === k || fn(p)));
  const lista = useMemo(() => {
    const ord = ORDINI.find((o) => o[0] === f.ordina)![2];
    return tranne('').sort((a, b) => ord(a, b) || a.brand.localeCompare(b.brand));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f]);
  const conta = (k: string, fn: (p: Prodotto) => boolean) => tranne(k).filter(fn).length;
  const marche = [...new Set(tranne('marca').map((p) => p.brand))].sort((a, b) => a.localeCompare(b, 'it'));
  const attivi = f.tag.length + [f.attivo, f.pelle, f.problema, f.marca, f.q].filter(Boolean).length - (t0 ? 1 : 0) + (f.categoria && !c0 ? 1 : 0);

  return (
    <div className="pila" style={{ ['--gap' as string]: '18px' }}>
      <div className="pila" style={{ ['--gap' as string]: '12px' }}>
        {!c0 && (
          <div className="riga-chip" role="group" aria-label="Categoria">
            <button type="button" className="chip" aria-pressed={!f.categoria} onClick={() => cambia({ categoria: '' })}>Tutto</button>
            {CATALOGO.categorie.filter((x) => conta('categoria', (p) => inCategoria(p, x))).map((x) => (
              <button key={x.id} type="button" className="chip" aria-pressed={f.categoria === x.id} onClick={() => cambia({ categoria: f.categoria === x.id ? '' : x.id })}>{x.nome}</button>
            ))}
          </div>
        )}
        <div className="riga-chip" role="group" aria-label="Selezioni">
          {CATALOGO.tag.filter((x) => x.id !== t0 && (f.tag.includes(x.id) || conta('tag', (p) => p.tag.includes(x.id)))).map((x) => (
            <button key={x.id} type="button" className="chip" aria-pressed={f.tag.includes(x.id)} title={x.descrizione}
              onClick={() => cambia({ tag: f.tag.includes(x.id) ? f.tag.filter((y) => y !== x.id) : [...f.tag, x.id] })}>{x.nome}</button>
          ))}
        </div>
        <div className="filtri">
          <label className="campo-filtro cerca-filtro"><span>Cerca</span>
            <input type="search" value={f.q} onChange={(e) => cambia({ q: e.target.value })} placeholder="Marca, prodotto o attivo" />
          </label>
          <label className="campo-filtro"><span>Attivo</span>
            <select value={f.attivo} onChange={(e) => cambia({ attivo: e.target.value })}>
              <option value="">Tutti gli attivi</option>
              {ATTIVI.map((a) => [a, conta('attivo', (p) => conAttivo(p, a))] as const).filter(([a, n]) => n || a.id === f.attivo).map(([a, n]) => <option key={a.id} value={a.id}>{a.nome} ({n})</option>)}
            </select>
          </label>
          <label className="campo-filtro"><span>Pelle</span>
            <select value={f.pelle} onChange={(e) => cambia({ pelle: e.target.value })}>
              <option value="">Ogni pelle</option>
              {PELLI.map(([v, n]) => [v, n, conta('pelle', (p) => !!p.skinTypes?.includes(v as never))] as const).filter(([v, , c]) => c || v === f.pelle).map(([v, n, c]) => <option key={v} value={v}>{n} ({c})</option>)}
            </select>
          </label>
          <label className="campo-filtro"><span>Per cosa</span>
            <select value={f.problema} onChange={(e) => cambia({ problema: e.target.value })}>
              <option value="">Ogni bisogno</option>
              {PROBLEMI.map(([v, n, fn]) => [v, n, conta('problema', fn)] as const).filter(([v, , c]) => c || v === f.problema).map(([v, n, c]) => <option key={v} value={v}>{n} ({c})</option>)}
            </select>
          </label>
          <label className="campo-filtro"><span>Marca</span>
            <select value={f.marca} onChange={(e) => cambia({ marca: e.target.value })}>
              <option value="">Tutte le marche</option>
              {marche.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label className="campo-filtro"><span>Ordina</span>
            <select value={f.ordina} onChange={(e) => cambia({ ordina: e.target.value })}>
              {ORDINI.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
            </select>
          </label>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 16px' }}>
          <span className="piccolo" role="status">{lista.length} prodotti{f.ordina === 'scelti' && !Object.keys(clic).length ? ' · i clic si contano da pochi giorni: per ora l’ordine segue gli attivi' : ''}</span>
          {attivi > 0 && <button type="button" className="link-btn" onClick={() => cambia({ ...VUOTI, categoria: c0, tag: t0 ? [t0] : [], ordina: f.ordina })}>Togli i filtri</button>}
        </div>
        {att && (
          <p className="piccolo attivo-nota"><b>{att.nome}</b>: {att.cosa} {att.attenzione}</p>
        )}
      </div>
      <div className="griglia" style={{ ['--min' as string]: '300px' }}>
        {lista.slice(0, quanti).map((p) => <SchedaProdotto key={p.id} p={p} da={c0 || t0 ? `catalogo-${c0 || t0}` : 'catalogo'} />)}
      </div>
      {lista.length > quanti && <button type="button" className="bottone secondario" style={{ justifySelf: 'center' }} onClick={() => setQuanti(quanti + PASSO)}>Mostra altri {Math.min(PASSO, lista.length - quanti)}</button>}
      {!lista.length && <p className="avviso">Nessun prodotto con tutti questi filtri insieme. Prova a toglierne uno.</p>}
      <p className="piccolo">I prezzi sono quelli del negozio all’ultimo aggiornamento e possono cambiare. I link sono di affiliazione: se compri, Skinmatch riceve una piccola commissione, a te non costa nulla in più.</p>
    </div>
  );
}
