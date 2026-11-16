'use client';

import { useEffect, useMemo, useState } from 'react';
import { CATALOGO, ATTIVI, conAttivo } from '@/lib/dati';
import { PRODOTTI, inCategoria, type Prodotto } from '@/lib/catalogo';
import { SENZA, type Senza } from '@/lib/products';
import SchedaProdotto from '@/components/SchedaProdotto';
import CLIC from '@/data/clic.json';

// Il catalogo per informarsi da soli (Federico, 15/10: «tutti i filtri che funzionano con i tag e
// ordina per prezzo, consigliati in base ai clic e agli attivi»). Filtri: categoria, selezioni (i tag
// di src/data/catalogo.json), attivo (src/data/attivi.json), tipo di pelle, problema, marca, ricerca.
// Ordini: consigliati (attivi + clic), più scelti (clic degli ultimi 90 giorni, scripts/catalogo/clic.py),
// più ricchi di attivi, prezzo. Tutto sta nell'indirizzo, così una ricerca si condivide.
const PASSO = 24;
const clic = (CLIC as { clic: Record<string, number> }).clic;
const valore = (p: Prodotto) => p.scheda?.valore ?? p.scheda?.completezza ?? 0;
const ORDINI: [string, string, (a: Prodotto, b: Prodotto) => number][] = [
  ['consigliati', 'Consigliati', (a, b) => valore(b) + 8 * Math.log2(1 + (clic[b.id] || 0)) - valore(a) - 8 * Math.log2(1 + (clic[a.id] || 0))],
  ['scelti', 'I più scelti', (a, b) => (clic[b.id] || 0) - (clic[a.id] || 0) || valore(b) - valore(a)],
  ['attivi', 'Più ricchi di attivi', (a, b) => valore(b) - valore(a)],
  ['prezzo', 'Prezzo: dal più basso', (a, b) => a.price - b.price],
  ['prezzo-alto', 'Prezzo: dal più alto', (a, b) => b.price - a.price],
];
// ⚠️ I FILTRI PER AREA (16/11/2026, Federico: «i filtri vanno riorganizzati e attribuiti correttamente, stabilire quali
// hanno senso di esistere»). Prima ogni filtro stava ovunque: «Pelle» sugli shampoo e sugli integratori (0 prodotti),
// «Per cosa» con la protezione solare (che è una categoria) e con brufoli e caduta sugli integratori, e quattro
// selezioni doppie (Senza profumo e Senza alcol = i bottoni «Senza», Per pelli sensibili = Pelle sensibile,
// SkinCeuticals = una marca). Ora si sceglie l'area e compaiono solo i filtri che lì hanno un senso:
// - viso: per cosa (concerns), la tua pelle, attivo, senza, gravidanza;
// - capelli: per cosa (hairConcerns), attivo, senza, gravidanza;
// - integratori: per cosa dal lavoro scritto nella scheda (lib/integratori.ts), vegani.
// Il tipo di marca vale ovunque. Le selezioni tolte dai bottoni restano pagine (/catalogo/<tag>) e continuano a
// funzionare dai vecchi link, dove compaiono come filtro attivo da togliere.
type Area = 'viso' | 'capelli' | 'integratori';
const AREE: [Area, string, string[]][] = [
  ['viso', 'Viso', ['detergenti', 'sieri', 'creme', 'solari', 'attivi', 'maschere', 'occhi', 'cerotti', 'barba']],
  ['capelli', 'Capelli', ['shampoo', 'capelli']],
  ['integratori', 'Integratori', ['integratori']],
];
const areaDi = (categoria: string): Area | '' => AREE.find(([, , cc]) => cc.includes(categoria))?.[0] || '';
const PELLI: [string, string][] = [['secca', 'Secca'], ['grassa', 'Grassa'], ['mista', 'Mista'], ['normale', 'Normale'], ['sensibile', 'Sensibile']];
const lavora = (p: Prodotto, chiavi: string[]) => (p.scheda?.lavoro || []).some((l) => l.split('+').some((x) => chiavi.includes(x)));
const PER_COSA: Record<Area, [string, string, (p: Prodotto) => boolean][]> = {
  viso: [
    ['idratazione', 'Idratazione', (p) => !!p.concerns?.includes('idratazione')],
    ['imperfezioni', 'Imperfezioni e brufoli', (p) => !!p.concerns?.includes('acne-sebo')],
    ['macchie', 'Macchie e luminosità', (p) => !!p.concerns?.includes('macchie-luminosita')],
    ['tempo', 'Segni del tempo', (p) => !!p.concerns?.includes('anti-age')],
    ['rossori', 'Rossori', (p) => !!p.concerns?.includes('rossori-sensibilita')],
    ['barriera', 'Barriera', (p) => !!p.concerns?.includes('barriera-cutanea')],
    ['pori', 'Pori dilatati', (p) => !!p.concerns?.includes('pori-dilatati')],
  ],
  capelli: [
    ['caduta', 'Caduta', (p) => !!p.hairConcerns?.includes('caduta')],
    ['forfora', 'Forfora', (p) => !!p.hairConcerns?.includes('forfora')],
    ['crespi', 'Secchi e crespi', (p) => !!p.hairConcerns?.includes('secchi-crespi')],
    ['quotidiano', 'Uso quotidiano', (p) => !!p.hairConcerns?.includes('mantenimento')],
  ],
  integratori: [
    ['int-capelli', 'Capelli e unghie', (p) => lavora(p, ['capelli', 'unghie'])],
    ['int-pelle', 'Pelle', (p) => lavora(p, ['tono', 'pelle-secca', 'imperfezioni'])],
    ['int-sole', 'Prima del sole', (p) => lavora(p, ['sole'])],
    ['int-difese', 'Difese', (p) => lavora(p, ['difese', 'vitamina-d'])],
    ['int-energia', 'Energia e stanchezza', (p) => lavora(p, ['energia', 'stress', 'b12'])],
    ['int-sonno', 'Sonno', (p) => lavora(p, ['sonno'])],
    ['int-omega', 'Omega 3', (p) => lavora(p, ['omega-3'])],
  ],
};
const BISOGNO = new Map(Object.values(PER_COSA).flat().map((x) => [x[0], x]));
// i bottoni delle selezioni: il tipo di marca e i due pubblici; gravidanza sta con i «Senza»
const TIPI = ['farmacia', 'medicale', 'k-beauty', 'alta-cosmesi', 'qualita-prezzo', 'premium', 'uomo', 'vegani'];
const NOME_CORTO: Record<string, string> = { uomo: 'Per lui', 'qualita-prezzo': 'Qualità/prezzo', medicale: 'Medicale', farmacia: 'Da farmacia', gravidanza: 'In gravidanza' };
type Filtri = { area: Area | ''; categoria: string; tag: string[]; senza: string[]; attivo: string; pelle: string; problema: string; marca: string; q: string; ordina: string };
const VUOTE = new Set('a ad al alla allo ai agli con col da dal dalla dei del della delle di e ed gli i il in la le lo l per su un una uno che mi serve cerco vorrei qualcosa'.split(' '));
const norma = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const VUOTI: Filtri = { area: '', categoria: '', tag: [], senza: [], attivo: '', pelle: '', problema: '', marca: '', q: '', ordina: 'consigliati' };

export default function Catalogo({ categoria: c0 = '', tag: t0 = '' }: { categoria?: string; tag?: string }) {
  const [f, setF] = useState<Filtri>({ ...VUOTI, area: areaDi(c0), categoria: c0, tag: t0 ? [t0] : [] });
  const [quanti, setQuanti] = useState(PASSO);
  const cambia = (x: Partial<Filtri>) => { setF((v) => ({ ...v, ...x })); setQuanti(PASSO); };
  // i filtri dall'indirizzo, all'apertura (?categoria=sieri&tag=k-beauty&attivo=niacinamide&ordina=prezzo)
  useEffect(() => {
    const u = new URLSearchParams(window.location.search);
    const t = u.getAll('tag');
    if (u.get('kbeauty') === '1') t.push('k-beauty');
    // «problema=sole» dei vecchi link è la categoria dei solari
    const categoria = c0 || u.get('categoria') || (u.get('problema') === 'sole' ? 'solari' : '');
    const area = areaDi(categoria) || (AREE.some(([a]) => a === u.get('area')) ? (u.get('area') as Area) : '');
    setF((v) => ({
      ...v, area, categoria, tag: [...new Set([...(t0 ? [t0] : []), ...t])], senza: u.getAll('senza').filter((x) => SENZA.some(([k]) => k === x)),
      attivo: u.get('attivo') || '', pelle: u.get('pelle') || '', problema: BISOGNO.has(u.get('problema') || '') ? u.get('problema')! : '', marca: u.get('marca') || '', q: u.get('q') || '',
      ordina: ORDINI.some((o) => o[0] === u.get('ordina')) ? u.get('ordina')! : 'consigliati',
    }));
  }, [c0, t0]);
  useEffect(() => {
    const u = new URLSearchParams();
    if (f.categoria && !c0) u.set('categoria', f.categoria);
    else if (f.area && !c0) u.set('area', f.area);
    f.tag.filter((t) => t !== t0).forEach((t) => u.append('tag', t));
    f.senza.forEach((x) => u.append('senza', x));
    (['attivo', 'pelle', 'problema', 'marca', 'q'] as const).forEach((k) => f[k] && u.set(k, f[k]));
    if (f.ordina !== 'consigliati') u.set('ordina', f.ordina);
    history.replaceState(null, '', u.toString() ? `?${u}` : location.pathname);
  }, [f, c0, t0]);

  const cat = CATALOGO.categorie.find((x) => x.id === f.categoria);
  const att = ATTIVI.find((a) => a.id === f.attivo);
  const pro = BISOGNO.get(f.problema);
  const area = f.area;
  const areaCat = AREE.find(([a]) => a === area)?.[2] || [];
  // ⚠️ LA RICERCA SI SCRIVE COME SI PARLA (18/10/2026, con la ricerca al centro della home): «crema per pelle
  // secca» trovava 3 prodotti, perché voleva ogni parola tale e quale, «per» compreso. Ora le parole vuote non
  // contano, il singolare trova il plurale (pelle/pelli, secca/secche), gli accenti non pesano, e conta anche il
  // tipo di pelle della scheda.
  const parole = norma(f.q).split(/[^a-z0-9%]+/).filter((w) => w && !VUOTE.has(w))
    .map((w) => (w.length > 4 ? w.replace(/[aeiou]$/, '').replace(/([cg])h$/, '$1') : w));
  // ogni filtro, da solo: così ogni menu conta i prodotti tenendo conto degli altri filtri
  const regole: Record<string, (p: Prodotto) => boolean> = {
    categoria: (p) => (cat ? inCategoria(p, cat) : !area || areaCat.includes(p.category)),
    tag: (p) => f.tag.every((t) => p.tag.includes(t)),
    // «Senza…»: solo i prodotti di cui lo sappiamo (Federico, 16/10)
    senza: (p) => f.senza.every((x) => !!p.scheda?.senza?.includes(x as Senza)),
    attivo: (p) => !att || conAttivo(p, att),
    pelle: (p) => !f.pelle || !!p.skinTypes?.includes(f.pelle as never),
    problema: (p) => !pro || pro[2](p),
    marca: (p) => !f.marca || p.brand === f.marca,
    q: (p) => {
      if (!parole.length) return true;
      const t = norma(`${p.brand} ${p.name} ${p.subtitle || ''} ${p.description} ${(p.scheda?.attivi || []).map((a) => a.nome).join(' ')} ${(p.skinTypes || []).map((x) => `pelle ${x}`).join(' ')}`);
      return parole.every((w) => t.includes(w));
    },
  };
  const tranne = (k: string) => PRODOTTI.filter((p) => Object.entries(regole).every(([r, fn]) => r === k || fn(p)));
  const lista = useMemo(() => {
    const ord = ORDINI.find((o) => o[0] === f.ordina)![2];
    return tranne('').sort((a, b) => ord(a, b) || a.brand.localeCompare(b.brand));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f]);
  const conta = (k: string, fn: (p: Prodotto) => boolean) => tranne(k).filter(fn).length;
  const marche = [...new Set(tranne('marca').map((p) => p.brand))].sort((a, b) => a.localeCompare(b, 'it'));
  const attivi = f.tag.length + f.senza.length + [f.attivo, f.pelle, f.problema, f.marca, f.q].filter(Boolean).length - (t0 ? 1 : 0) + ((f.categoria || f.area) && !c0 ? 1 : 0);
  // cambiare area toglie i filtri che lì non hanno senso
  const scegliArea = (a: Area | '') => cambia({
    area: a, categoria: '', problema: '', pelle: a === 'viso' ? f.pelle : '',
    attivo: a === 'integratori' ? '' : f.attivo, senza: a === 'integratori' ? [] : f.senza,
    tag: f.tag.filter((t) => t === t0 || !(a === 'integratori' && t === 'gravidanza')),
  });
  const tagChip = (id: string) => {
    const x = CATALOGO.tag.find((t) => t.id === id);
    if (!x || id === t0 || !(f.tag.includes(id) || conta('tag', (p) => p.tag.includes(id)))) return null;
    return (
      <button key={id} type="button" className="chip" aria-pressed={f.tag.includes(id)} title={x.descrizione}
        onClick={() => cambia({ tag: f.tag.includes(id) ? f.tag.filter((y) => y !== id) : [...f.tag, id] })}>{NOME_CORTO[id] || x.nome}</button>
    );
  };
  // le selezioni senza un bottone loro (SkinCeuticals, Per pelli sensibili, Senza profumo/alcol) arrivate da un vecchio link
  const altre = f.tag.filter((t) => t !== t0 && t !== 'gravidanza' && !TIPI.includes(t));

  return (
    <div className="pila" style={{ ['--gap' as string]: '18px' }}>
      <div className="pila" style={{ ['--gap' as string]: '12px' }}>
        {!c0 && (
          <div className="riga-chip aree" role="group" aria-label="Area">
            <button type="button" className="chip" aria-pressed={!area} onClick={() => scegliArea('')}>Tutto</button>
            {AREE.map(([a, nome]) => <button key={a} type="button" className="chip" aria-pressed={area === a} onClick={() => scegliArea(area === a ? '' : a)}>{nome}</button>)}
          </div>
        )}
        {!c0 && area && areaCat.length > 1 && (
          <div className="riga-chip" role="group" aria-label="Categoria">
            <button type="button" className="chip tenue-filtro" aria-pressed={!f.categoria} onClick={() => cambia({ categoria: '' })}>Tutti</button>
            {CATALOGO.categorie.filter((x) => areaCat.includes(x.id) && conta('categoria', (p) => inCategoria(p, x))).map((x) => (
              <button key={x.id} type="button" className="chip tenue-filtro" aria-pressed={f.categoria === x.id} onClick={() => cambia({ categoria: f.categoria === x.id ? '' : x.id, problema: '' })}>{x.nome}</button>
            ))}
          </div>
        )}
        {area && (
          <div className="gruppo-filtro"><span>Per cosa</span>
            <div className="riga-chip" role="group" aria-label="Per cosa">
              {PER_COSA[area].map(([v, n, fn]) => [v, n, conta('problema', fn)] as const).filter(([v, , c]) => c || v === f.problema).map(([v, n, c]) => (
                <button key={v} type="button" className="chip" aria-pressed={f.problema === v} onClick={() => cambia({ problema: f.problema === v ? '' : v })}>{n} <span className="conta">{c}</span></button>
              ))}
            </div>
          </div>
        )}
        <div className="filtri">
          <label className="campo-filtro cerca-filtro"><span>Cerca</span>
            <input type="search" value={f.q} onChange={(e) => cambia({ q: e.target.value })} placeholder="Marca, prodotto o attivo" />
          </label>
          {area === 'viso' && (
            <label className="campo-filtro"><span>La tua pelle</span>
              <select value={f.pelle} onChange={(e) => cambia({ pelle: e.target.value })}>
                <option value="">Ogni pelle</option>
                {PELLI.map(([v, n]) => [v, n, conta('pelle', (p) => !!p.skinTypes?.includes(v as never))] as const).filter(([v, , c]) => c || v === f.pelle).map(([v, n, c]) => <option key={v} value={v}>{n} ({c})</option>)}
              </select>
            </label>
          )}
          {area !== 'integratori' && (
            <label className="campo-filtro"><span>Attivo</span>
              <select value={f.attivo} onChange={(e) => cambia({ attivo: e.target.value })}>
                <option value="">Tutti gli attivi</option>
                {ATTIVI.map((a) => [a, conta('attivo', (p) => conAttivo(p, a))] as const).filter(([a, n]) => n || a.id === f.attivo).map(([a, n]) => <option key={a.id} value={a.id}>{a.nome} ({n})</option>)}
              </select>
            </label>
          )}
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
        {area !== 'integratori' && (
          <div className="gruppo-filtro"><span>Senza</span>
            <div className="riga-chip" role="group" aria-label="Senza">
              {SENZA.filter(([k]) => f.senza.includes(k) || conta('senza', (p) => !!p.scheda?.senza?.includes(k))).map(([k, nome]) => (
                <button key={k} type="button" className="chip" aria-pressed={f.senza.includes(k)}
                  onClick={() => cambia({ senza: f.senza.includes(k) ? f.senza.filter((y) => y !== k) : [...f.senza, k] })}>{nome.replace(/^Senza /, '')}</button>
              ))}
              {tagChip('gravidanza')}
            </div>
          </div>
        )}
        <div className="gruppo-filtro"><span>Tipo</span>
          <div className="riga-chip" role="group" aria-label="Tipo di prodotto">
            {TIPI.map(tagChip)}
            {altre.map((t) => <button key={t} type="button" className="chip" aria-pressed onClick={() => cambia({ tag: f.tag.filter((y) => y !== t) })}>{CATALOGO.tag.find((x) => x.id === t)?.nome || t} ×</button>)}
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 16px' }}>
          <span className="piccolo" role="status">{lista.length} prodotti{f.ordina === 'scelti' && !Object.keys(clic).length ? ' · i clic si contano da pochi giorni: per ora l’ordine segue gli attivi' : ''}</span>
          {attivi > 0 && <button type="button" className="link-btn" onClick={() => cambia({ ...VUOTI, area: areaDi(c0), categoria: c0, tag: t0 ? [t0] : [], ordina: f.ordina })}>Togli i filtri</button>}
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
