'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CATALOGO, ATTIVI, conAttivo } from '@/lib/dati';
import { PRODOTTI, inCategoria, type Prodotto } from '@/lib/catalogo';
import { SENZA, type Senza } from '@/lib/products';
import SchedaProdotto from '@/components/SchedaProdotto';
import Icona from '@/components/Icona';
import FiltroPrezzo, { eur } from '@/components/FiltroPrezzo';
import CLIC from '@/data/clic.json';

// Il catalogo per informarsi da soli (Federico, 15/10: «tutti i filtri che funzionano con i tag e
// ordina per prezzo, consigliati in base ai clic e agli attivi»). Filtri: categoria, selezioni (i tag
// di src/data/catalogo.json), attivo (src/data/attivi.json), tipo di pelle, problema, marca, prezzo, ricerca.
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
// SkinCeuticals = una marca). Ora ogni tipologia ha solo i filtri che lì hanno un senso:
// - viso: per cosa (concerns), la tua pelle, attivo, senza, gravidanza;
// - capelli: per cosa (hairConcerns), attivo, senza, gravidanza;
// - integratori: per cosa dal lavoro scritto nella scheda (lib/integratori.ts), vegani.
// Il prezzo, la marca e il tipo di marca valgono ovunque. Le selezioni tolte dai bottoni restano pagine
// (/catalogo/<tag>) e continuano a funzionare dai vecchi link, dove compaiono come filtro attivo da togliere.
type Area = 'viso' | 'capelli' | 'integratori';
const AREE: [Area, string, string[]][] = [
  ['viso', 'Viso', ['detergenti', 'sieri', 'creme', 'solari', 'attivi', 'maschere', 'occhi', 'cerotti', 'barba']],
  ['capelli', 'Capelli', ['shampoo', 'capelli']],
  ['integratori', 'Integratori', ['integratori']],
];
const areaDi = (categoria: string): Area | '' => AREE.find(([, , cc]) => cc.includes(categoria))?.[0] || '';
// ⚠️ PRIMA LA TIPOLOGIA, POI I FILTRI (24/11/2026, Federico: «sul catalogo fammi selezionare prima la tipologia es crema
// viso, detergente, siero, integratori, capelli etc. Poi si attivano i filtri sotto. da aggiungere quello sul prezzo»).
// Le tipologie sono le categorie del catalogo con un nome corto e la loro icona; i filtri compaiono solo dopo, come
// pillole che aprono il loro pannello uno alla volta (al telefono stanno in una riga che scorre, come le tipologie).
const TIPOLOGIE: Record<string, [string, Parameters<typeof Icona>[0]['nome']]> = {
  detergenti: ['Detergenti', 'goccia'], sieri: ['Sieri', 'siero'], creme: ['Creme viso', 'crema'], solari: ['Solari', 'sole'],
  attivi: ['Retinolo e acidi', 'laboratorio'], maschere: ['Maschere', 'tubo'], occhi: ['Contorno occhi', 'occhio'],
  cerotti: ['Cerotti brufoli', 'cerotto'], barba: ['Barba', 'barba'], shampoo: ['Shampoo', 'flacone'],
  capelli: ['Trattamenti capelli', 'capelli'], integratori: ['Integratori', 'capsula'],
};
const ORDINE_TIPOLOGIE = AREE.flatMap(([, , cc]) => cc);
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
// ⚠️ I TIPI (16/11/2026, Federico: «i filtri come alta cosmesi: elimina quelli che non servono e riempi quelli che ne
// hanno… rifacciamo una classificazione dei filtri ben fatta»). Sono le famiglie di marche (segmento in
// scripts/catalogo/decisioni_marche.json): ogni marca ne ha una. Eliminati Premium (ripeteva alta cosmesi e medicale),
// SkinCeuticals (una marca), Per pelli sensibili, Senza profumo e Senza alcol (doppioni di Pelle e Senza), Per lui
// (30 prodotti sparsi): rinvii 301 in public/_redirects e i vecchi link ?tag= diventano il filtro che li sostituisce.
const TIPI = ['farmacia', 'medicale', 'alta-cosmesi', 'salone', 'k-beauty', 'j-beauty', 'naturali', 'attivi-essenziali', 'qualita-prezzo', 'vegani'];
const NOME_CORTO: Record<string, string> = { 'qualita-prezzo': 'Qualità/prezzo', medicale: 'Medicale', farmacia: 'Da farmacia', gravidanza: 'In gravidanza' };
type Filtri = { area: Area | ''; categoria: string; tag: string[]; senza: string[]; attivo: string; pelle: string; problema: string; marca: string; q: string; ordina: string; pmin: number | null; pmax: number | null };
type Pannello = '' | 'prezzo' | 'cosa' | 'pelle' | 'attivo' | 'marca' | 'senza' | 'tipo';
const VUOTE = new Set('a ad al alla allo ai agli con col da dal dalla dei del della delle di e ed gli i il in la le lo l per su un una uno che mi serve cerco vorrei qualcosa'.split(' '));
const norma = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
// il prezzo nell'indirizzo: ?prezzo=10-30, ?prezzo=-25 (fino a), ?prezzo=40- (da)
const leggiPrezzo = (s: string | null): [number | null, number | null] => {
  const m = (s || '').match(/^(\d+(?:\.\d+)?)?-(\d+(?:\.\d+)?)?$/);
  return m ? [m[1] ? Number(m[1]) : null, m[2] ? Number(m[2]) : null] : [null, null];
};

const VUOTI: Filtri = { area: '', categoria: '', tag: [], senza: [], attivo: '', pelle: '', problema: '', marca: '', q: '', ordina: 'consigliati', pmin: null, pmax: null };

export default function Catalogo({ categoria: c0 = '', tag: t0 = '' }: { categoria?: string; tag?: string }) {
  const [f, setF] = useState<Filtri>({ ...VUOTI, area: areaDi(c0), categoria: c0, tag: t0 ? [t0] : [] });
  const [quanti, setQuanti] = useState(PASSO);
  const [aperto, setAperto] = useState<Pannello>('');
  const [letto, setLetto] = useState(false);
  // al telefono la riga delle tipologie scorre: quella scelta (anche da un link) si porta in vista
  const rigaTipologie = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const riga = rigaTipologie.current;
    const scelta = riga?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (riga && scelta && riga.scrollWidth > riga.clientWidth) riga.scrollTo({ left: Math.max(0, scelta.offsetLeft - riga.offsetLeft - 16), behavior: letto ? 'smooth' : 'auto' });
  }, [f.categoria, letto]);
  const cambia = (x: Partial<Filtri>) => { setF((v) => ({ ...v, ...x })); setQuanti(PASSO); };
  // i filtri dall'indirizzo, all'apertura (?categoria=sieri&tag=k-beauty&attivo=niacinamide&prezzo=10-30&ordina=prezzo)
  useEffect(() => {
    const u = new URLSearchParams(window.location.search);
    // i filtri tolti il 16/11/2026 arrivano ancora dai vecchi link: diventano il filtro che li sostituisce
    const vecchi = u.getAll('tag');
    const t = vecchi.filter((x) => CATALOGO.tag.some((g) => g.id === x));
    if (vecchi.includes('premium')) t.push('alta-cosmesi');
    if (vecchi.includes('senza-profumo')) u.append('senza', 'profumo');
    if (vecchi.includes('senza-alcol')) u.append('senza', 'alcol');
    if (vecchi.includes('skinceuticals') && !u.get('marca')) u.set('marca', 'SkinCeuticals');
    if (vecchi.includes('pelli-sensibili') && !u.get('pelle')) { u.set('pelle', 'sensibile'); if (!u.get('area')) u.set('area', 'viso'); }
    if (u.get('kbeauty') === '1') t.push('k-beauty');
    // «problema=sole» dei vecchi link è la categoria dei solari
    const categoria = c0 || u.get('categoria') || (u.get('problema') === 'sole' ? 'solari' : '');
    const area = areaDi(categoria) || (AREE.some(([a]) => a === u.get('area')) ? (u.get('area') as Area) : '');
    const [pmin, pmax] = leggiPrezzo(u.get('prezzo'));
    setF((v) => ({
      ...v, area, categoria, tag: [...new Set([...(t0 ? [t0] : []), ...t])], senza: u.getAll('senza').filter((x) => SENZA.some(([k]) => k === x)),
      attivo: u.get('attivo') || '', pelle: u.get('pelle') || '', problema: BISOGNO.has(u.get('problema') || '') ? u.get('problema')! : '', marca: u.get('marca') || '', q: u.get('q') || '',
      ordina: ORDINI.some((o) => o[0] === u.get('ordina')) ? u.get('ordina')! : 'consigliati', pmin, pmax,
    }));
    setLetto(true);
  }, [c0, t0]);
  // ⚠️ L'indirizzo si riscrive solo dopo averlo letto (24/11/2026): prima la scrittura partiva con i filtri ancora vuoti
  // e, dove gli effetti girano due volte (React in sviluppo), la seconda lettura trovava l'indirizzo già svuotato.
  useEffect(() => {
    if (!letto) return;
    const u = new URLSearchParams();
    if (f.categoria && !c0) u.set('categoria', f.categoria);
    else if (f.area && !c0) u.set('area', f.area);
    f.tag.filter((t) => t !== t0).forEach((t) => u.append('tag', t));
    f.senza.forEach((x) => u.append('senza', x));
    (['attivo', 'pelle', 'problema', 'marca', 'q'] as const).forEach((k) => f[k] && u.set(k, f[k]));
    if (f.pmin != null || f.pmax != null) u.set('prezzo', `${f.pmin ?? ''}-${f.pmax ?? ''}`);
    if (f.ordina !== 'consigliati') u.set('ordina', f.ordina);
    history.replaceState(null, '', u.toString() ? `?${u}` : location.pathname);
  }, [f, c0, t0, letto]);

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
    prezzo: (p) => (f.pmin == null || p.price >= f.pmin) && (f.pmax == null || p.price <= f.pmax),
    q: (p) => {
      if (!parole.length) return true;
      const t = norma(`${p.brand} ${p.name} ${p.subtitle || ''} ${p.description} ${(p.scheda?.attivi || []).map((a) => a.nome).join(' ')} ${(p.skinTypes || []).map((x) => `pelle ${x}`).join(' ')}`);
      return parole.every((w) => t.includes(w));
    },
  };
  // i prodotti con tutti i filtri tranne uno, una volta sola per filtro (il cursore del prezzo ridisegna spesso)
  const giaFiltrati = new Map<string, Prodotto[]>();
  const tranne = (...kk: string[]) => {
    const chiave = kk.join('|');
    let r = giaFiltrati.get(chiave);
    if (!r) { r = PRODOTTI.filter((p) => Object.entries(regole).every(([n, fn]) => kk.includes(n) || fn(p))); giaFiltrati.set(chiave, r); }
    return r;
  };
  // le tipologie si contano senza il prezzo, che riparte quando si cambia tipologia
  const contaTipologia = (fn: (p: Prodotto) => boolean) => tranne('categoria', 'prezzo').filter(fn).length;
  const lista = useMemo(() => {
    const ord = ORDINI.find((o) => o[0] === f.ordina)![2];
    return [...tranne('')].sort((a, b) => ord(a, b) || a.brand.localeCompare(b.brand));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f]);
  const conta = (k: string, fn: (p: Prodotto) => boolean) => tranne(k).filter(fn).length;
  const conPrezzo = f.pmin != null || f.pmax != null;
  const attivi = f.tag.length + f.senza.length + [f.attivo, f.pelle, f.problema, f.marca, f.q].filter(Boolean).length + (conPrezzo ? 1 : 0) - (t0 ? 1 : 0) + ((f.categoria || f.area) && !c0 ? 1 : 0);
  // i filtri si attivano dopo la tipologia (sulle pagine di una categoria la tipologia c'è già)
  const conFiltri = !!(c0 || f.categoria || area);

  // scegliere la tipologia toglie i filtri che lì non hanno senso; il prezzo riparte, perché ogni tipologia ha i suoi
  const scegliTipologia = (c: string) => {
    const a = areaDi(c);
    cambia({
      area: a, categoria: c, pmin: null, pmax: null, problema: a && a === area ? f.problema : '', pelle: a === 'viso' ? f.pelle : '',
      attivo: a === 'integratori' ? '' : f.attivo, senza: a === 'integratori' ? [] : f.senza,
      tag: f.tag.filter((t) => t === t0 || !(a === 'integratori' && t === 'gravidanza')),
    });
    setAperto('');
  };
  const chipTag = (id: string) => {
    const x = CATALOGO.tag.find((t) => t.id === id);
    const n = x && id !== t0 ? conta('tag', (p) => p.tag.includes(id)) : 0;
    if (!x || id === t0 || !(f.tag.includes(id) || n)) return null;
    return (
      <button key={id} type="button" className="chip" aria-pressed={f.tag.includes(id)} title={x.descrizione}
        onClick={() => cambia({ tag: f.tag.includes(id) ? f.tag.filter((y) => y !== id) : [...f.tag, id] })}>{NOME_CORTO[id] || x.nome} <span className="conta">{n}</span></button>
    );
  };

  // ⚠️ I FILTRI CHIUSI (16/11/2026, Federico: «in catalogo alla ricerca i filtri dopo il titolo e il testo vanno nascosti,
  // perché da mobile occupano tutta la visibilità»). Per questo ogni filtro è una pillola e il suo pannello si apre solo
  // quando lo tocchi; senza tipologia, i filtri arrivati da un link (?attivo=…) si vedono come bottoni da togliere.
  const tipiScelti = f.tag.filter((t) => t !== t0 && TIPI.includes(t));
  const senzaScelti = f.senza.length + (f.tag.includes('gravidanza') && t0 !== 'gravidanza' ? 1 : 0);
  const perCosa = area ? PER_COSA[area].map(([v, n, fn]) => [v, n, conta('problema', fn)] as const).filter(([v, , c]) => c || v === f.problema) : [];
  const pillole: [Pannello, string, string | null, boolean][] = [
    ['prezzo', 'Prezzo', f.pmin != null && f.pmax != null ? `${eur(f.pmin).replace(' €', '')}–${eur(f.pmax)}` : f.pmin != null ? `Da ${eur(f.pmin)}` : f.pmax != null ? `Fino a ${eur(f.pmax)}` : null, true],
    ['cosa', 'Per cosa', pro ? pro[1] : null, perCosa.length > 0],
    ['pelle', 'La tua pelle', f.pelle ? `Pelle ${(PELLI.find(([v]) => v === f.pelle)?.[1] || f.pelle).toLowerCase()}` : null, area === 'viso'],
    ['attivo', 'Attivo', att ? att.nome.split(' (')[0] : null, area !== 'integratori'],
    ['marca', 'Marca', f.marca || null, true],
    ['senza', 'Senza', senzaScelti ? `Senza · ${senzaScelti}` : null, area !== 'integratori'],
    ['tipo', 'Tipo di marca', tipiScelti.length === 1 ? NOME_CORTO[tipiScelti[0]] || CATALOGO.tag.find((x) => x.id === tipiScelti[0])?.nome || null : tipiScelti.length ? `Tipo · ${tipiScelti.length}` : null, true],
  ];
  const azzera: Record<Exclude<Pannello, ''>, Partial<Filtri>> = {
    prezzo: { pmin: null, pmax: null }, cosa: { problema: '' }, pelle: { pelle: '' }, attivo: { attivo: '' }, marca: { marca: '' },
    senza: { senza: [], tag: f.tag.filter((t) => t !== 'gravidanza' || t === t0) }, tipo: { tag: f.tag.filter((t) => t === t0 || !TIPI.includes(t)) },
  };
  const scelti: [string, () => void][] = [
    ...(pro ? [[pro[1], () => cambia({ problema: '' })] as [string, () => void]] : []),
    ...(f.pelle ? [[`Pelle ${(PELLI.find(([v]) => v === f.pelle)?.[1] || f.pelle).toLowerCase()}`, () => cambia({ pelle: '' })] as [string, () => void]] : []),
    ...(att ? [[att.nome, () => cambia({ attivo: '' })] as [string, () => void]] : []),
    ...(f.marca ? [[f.marca, () => cambia({ marca: '' })] as [string, () => void]] : []),
    ...(conPrezzo ? [[pillole[0][2]!, () => cambia({ pmin: null, pmax: null })] as [string, () => void]] : []),
    ...f.senza.map((x) => [SENZA.find(([k]) => k === x)?.[1] || x, () => cambia({ senza: f.senza.filter((y) => y !== x) })] as [string, () => void]),
    ...f.tag.filter((t) => t !== t0).map((t) => [NOME_CORTO[t] || CATALOGO.tag.find((x) => x.id === t)?.nome || t, () => cambia({ tag: f.tag.filter((y) => y !== t) })] as [string, () => void]),
  ];

  const pannello = () => {
    switch (aperto) {
      case 'prezzo':
        return <FiltroPrezzo prezzi={tranne('prezzo').map((p) => p.price)} min={f.pmin} max={f.pmax} onCambia={(pmin, pmax) => cambia({ pmin, pmax })} />;
      case 'cosa':
        return (
          <div className="riga-chip" role="group" aria-label="Per cosa">
            {perCosa.map(([v, n, c]) => <button key={v} type="button" className="chip" aria-pressed={f.problema === v} onClick={() => cambia({ problema: f.problema === v ? '' : v })}>{n} <span className="conta">{c}</span></button>)}
          </div>
        );
      case 'pelle':
        return (
          <div className="riga-chip" role="group" aria-label="La tua pelle">
            {PELLI.map(([v, n]) => [v, n, conta('pelle', (p) => !!p.skinTypes?.includes(v as never))] as const).filter(([v, , c]) => c || v === f.pelle).map(([v, n, c]) => (
              <button key={v} type="button" className="chip" aria-pressed={f.pelle === v} onClick={() => cambia({ pelle: f.pelle === v ? '' : v })}>{n} <span className="conta">{c}</span></button>
            ))}
          </div>
        );
      case 'attivo':
        return (
          <div className="riga-chip" role="group" aria-label="Attivo">
            {ATTIVI.map((a) => [a, conta('attivo', (p) => conAttivo(p, a))] as const).filter(([a, n]) => n || a.id === f.attivo).map(([a, n]) => (
              <button key={a.id} type="button" className="chip" aria-pressed={f.attivo === a.id} onClick={() => cambia({ attivo: f.attivo === a.id ? '' : a.id })}>{a.nome.split(' (')[0]} <span className="conta">{n}</span></button>
            ))}
          </div>
        );
      case 'marca': {
        const marche = [...new Set(tranne('marca').map((p) => p.brand))].sort((a, b) => a.localeCompare(b, 'it'));
        return (
          <label className="campo-filtro" style={{ maxWidth: 420 }}><span>Marca ({marche.length})</span>
            <select value={f.marca} onChange={(e) => cambia({ marca: e.target.value })}>
              <option value="">Tutte le marche</option>
              {marche.map((m) => <option key={m} value={m}>{m} ({conta('marca', (p) => p.brand === m)})</option>)}
            </select>
          </label>
        );
      }
      case 'senza':
        return (
          <div className="riga-chip" role="group" aria-label="Senza">
            {SENZA.map(([k, nome]) => [k, nome, conta('senza', (p) => !!p.scheda?.senza?.includes(k))] as const).filter(([k, , n]) => n || f.senza.includes(k)).map(([k, nome, n]) => (
              <button key={k} type="button" className="chip" aria-pressed={f.senza.includes(k)}
                onClick={() => cambia({ senza: f.senza.includes(k) ? f.senza.filter((y) => y !== k) : [...f.senza, k] })}>{nome.replace(/^Senza /, '')} <span className="conta">{n}</span></button>
            ))}
            {chipTag('gravidanza')}
          </div>
        );
      case 'tipo':
        return <div className="riga-chip" role="group" aria-label="Tipo di marca">{TIPI.map(chipTag)}</div>;
      default:
        return null;
    }
  };
  const pillolaAperta = pillole.find(([k, , , si]) => k === aperto && si);

  return (
    <div className="pila" style={{ ['--gap' as string]: '18px' }}>
      <div className="pila" style={{ ['--gap' as string]: '14px' }}>
        <label className="campo-filtro cerca-filtro cerca-catalogo"><span className="vh">Cerca</span>
          <input type="search" value={f.q} onChange={(e) => cambia({ q: e.target.value })} placeholder="Marca, prodotto o attivo" />
        </label>
        {!c0 && (
          <div className="pila" style={{ ['--gap' as string]: '8px' }}>
            <span className="passo-filtri" id="titolo-tipologia">Cosa cerchi</span>
            <div ref={rigaTipologie} className="tipologie scorri-x" role="group" aria-labelledby="titolo-tipologia">
              <button type="button" className="tipologia" aria-pressed={!f.categoria && !area} onClick={() => scegliTipologia('')}>
                <Icona nome="ingredienti" size={20} /><span className="nome">Tutto</span><span className="conta">{tranne('categoria', 'prezzo').length}</span>
              </button>
              {ORDINE_TIPOLOGIE.map((id) => {
                const c = CATALOGO.categorie.find((x) => x.id === id);
                const n = c ? contaTipologia((p) => inCategoria(p, c)) : 0;
                if (!c || !TIPOLOGIE[id] || !(n || f.categoria === id)) return null;
                return (
                  <button key={id} type="button" className="tipologia" aria-pressed={f.categoria === id} title={c.nome} onClick={() => scegliTipologia(f.categoria === id ? '' : id)}>
                    <Icona nome={TIPOLOGIE[id][1]} size={20} /><span className="nome">{TIPOLOGIE[id][0]}</span><span className="conta">{n}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {conFiltri ? (
          <div className="pila" style={{ ['--gap' as string]: '10px' }}>
            {!c0 && <span className="passo-filtri">Filtra</span>}
            <div className="pillole scorri-x" role="group" aria-label="Filtri">
              {pillole.filter(([, , , si]) => si).map(([k, nome, val]) => (
                <button key={k} type="button" className={`pillola${val ? ' pieno' : ''}`} aria-expanded={aperto === k} aria-controls="pannello-filtri" onClick={() => setAperto(aperto === k ? '' : k)}>
                  {val || nome}<Icona nome="giu" size={16} />
                </button>
              ))}
            </div>
            {pillolaAperta && (
              <div id="pannello-filtri" className="pannello-filtri pila" role="region" aria-label={pillolaAperta[1]} style={{ ['--gap' as string]: '14px' }}>
                {pannello()}
                <div className="pannello-piede">
                  <button type="button" className="bottone" onClick={() => setAperto('')}>Mostra {lista.length} prodotti</button>
                  {pillolaAperta[2] && <button type="button" className="link-btn" onClick={() => cambia(azzera[pillolaAperta[0] as Exclude<Pannello, ''>])}>Azzera</button>}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {scelti.length > 0 && (
              <div className="riga-chip" aria-label="Filtri attivi">
                {scelti.map(([n, togli]) => <button key={n} type="button" className="chip" aria-pressed onClick={togli}>{n} <span aria-hidden="true">×</span><span className="vh"> (togli)</span></button>)}
              </div>
            )}
            <p className="piccolo suggerimento-filtri"><Icona nome="filtri" size={16} />Scegli una tipologia: poi filtri per prezzo, pelle, attivo e marca.</p>
          </>
        )}
        <div className="riga-conta">
          <span className="piccolo" role="status">{lista.length} prodotti{f.ordina === 'scelti' && !Object.keys(clic).length ? ' · i clic si contano da pochi giorni: per ora l’ordine segue gli attivi' : ''}</span>
          {attivi > 0 && <button type="button" className="link-btn" onClick={() => { cambia({ ...VUOTI, area: areaDi(c0), categoria: c0, tag: t0 ? [t0] : [], ordina: f.ordina }); setAperto(''); }}>Togli i filtri</button>}
          <label className="ordina-compatto"><Icona nome="ordina" size={16} /><span className="vh">Ordina</span>
            <select value={f.ordina} onChange={(e) => cambia({ ordina: e.target.value })}>
              {ORDINI.map(([v, n]) => <option key={v} value={v}>{n}</option>)}
            </select>
          </label>
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
