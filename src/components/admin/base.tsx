'use client';

// I PEZZI DELL'ADMIN (15/10/2026): letture e scritture verso il Worker (/api/admin/*), il
// documento in lavorazione con la sua barra «Salva / Pubblica», e i campi dei moduli.
// ⚠️ Salvare scrive una versione nuova su D1 (si torna indietro dalla storia); pubblicare mette
// in coda la richiesta che il Mac esegue entro un quarto d'ora (scripts/admin/pubblica.py):
// esporta i dati, li prova con i guardiani, fa il commit e il deploy.

import { useCallback, useEffect, useMemo, useState } from 'react';

export async function leggi<T = unknown>(url: string): Promise<T> {
  const r = await fetch(url, { credentials: 'same-origin', cache: 'no-store' });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.errore || `errore ${r.status}`);
  return j as T;
}
export async function invia<T = unknown>(url: string, corpo: unknown): Promise<T> {
  const r = await fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify(corpo) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.errore || `errore ${r.status}`);
  return j as T;
}

export function useApi<T = unknown>(url: string | null) {
  const [dati, setDati] = useState<T | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!url) return;
    let vivo = true;
    leggi<T>(url).then((d) => vivo && (setDati(d), setErrore(null)), (e) => vivo && setErrore(e.message));
    return () => { vivo = false; };
  }, [url, n]);
  return { dati, errore, caricando: !dati && !errore, ricarica: useCallback(() => setN((x) => x + 1), []) };
}

type Storia = { id: number; chi: string; nota: string | null; creato_il: string; pubblicato_il: string | null };
// Il documento in lavorazione: l'ultima versione salvata su D1 o, se non ce n'è, quella online.
export function useDocumento<T>(tipo: 'test' | 'biotipi' | 'glossario' | 'catalogo' | 'negozi', online: T) {
  const api = useApi<{ ultimo: { id: number; dati: T; chi: string; creato_il: string; pubblicato_il: string | null } | null; storia: Storia[] }>(`/api/admin/documento?tipo=${tipo}`);
  const [dati, setDati] = useState<T | null>(null);
  const [base, setBase] = useState<number | null>(null);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    if (!api.dati) return;
    setDati(structuredClone(api.dati.ultimo ? api.dati.ultimo.dati : online));
    setBase(api.dati.ultimo?.id ?? null);
  }, [api.dati]); // eslint-disable-line react-hooks/exhaustive-deps
  const salvato = useMemo(() => JSON.stringify(api.dati?.ultimo ? api.dati.ultimo.dati : online), [api.dati, online]);
  const sporco = !!dati && JSON.stringify(dati) !== salvato;
  const salva = async (nota: string) => {
    setMsg('Salvo…');
    try {
      const r = await invia<{ id: number }>('/api/admin/documento', { tipo, dati, base, nota });
      setBase(r.id); setMsg('Salvato. Per metterlo online, «Pubblica».'); api.ricarica();
    } catch (e) { setMsg((e as Error).message); }
  };
  const nonPubblicato = !!api.dati?.ultimo && !api.dati.ultimo.pubblicato_il;
  return { dati, setDati, sporco, salva, msg, setMsg, errore: api.errore, storia: api.dati?.storia || [], nonPubblicato, caricando: api.caricando };
}

export function BarraSalva({ doc, cosa }: { doc: { sporco: boolean; salva: (n: string) => Promise<void>; msg: string; setMsg: (s: string) => void; nonPubblicato: boolean }; cosa: string }) {
  const [nota, setNota] = useState('');
  const pubblica = async () => {
    doc.setMsg('Metto in coda la pubblicazione…');
    try { await invia('/api/admin/pubblica', { cosa }); doc.setMsg('In coda: va online entro un quarto d\'ora, dopo i controlli dei guardiani. Lo stato è nella scheda «Squadra».'); }
    catch (e) { doc.setMsg((e as Error).message); }
  };
  return (
    <div className="adm-barra">
      <span className="piccolo" role="status">{doc.msg || (doc.sporco ? 'Ci sono modifiche non salvate.' : doc.nonPubblicato ? 'Salvato, non ancora online.' : 'Tutto salvato.')}</span>
      {doc.sporco && <input value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Cosa hai cambiato (facoltativo)" className="adm-input" style={{ flex: '1 1 200px' }} />}
      <button type="button" className="bottone" disabled={!doc.sporco} onClick={() => doc.salva(nota).then(() => setNota(''))}>Salva</button>
      <button type="button" className="bottone secondario" disabled={doc.sporco || !doc.nonPubblicato} onClick={pubblica}>Pubblica</button>
    </div>
  );
}

export function Campo({ etichetta, children, aiuto }: { etichetta: string; children: React.ReactNode; aiuto?: string }) {
  return (
    <label className="adm-campo">
      <span className="adm-etichetta">{etichetta}</span>
      {children}
      {aiuto && <span className="piccolo">{aiuto}</span>}
    </label>
  );
}
export function Testo({ valore, cambia, lungo, placeholder }: { valore: string | undefined; cambia: (v: string) => void; lungo?: boolean; placeholder?: string }) {
  return lungo
    ? <textarea className="adm-input" rows={4} value={valore || ''} placeholder={placeholder} onChange={(e) => cambia(e.target.value)} />
    : <input className="adm-input" value={valore || ''} placeholder={placeholder} onChange={(e) => cambia(e.target.value)} />;
}
// un elenco, una voce per riga
export function Righe({ valore, cambia, righe = 4 }: { valore: string[] | undefined; cambia: (v: string[]) => void; righe?: number }) {
  const [t, setT] = useState((valore || []).join('\n'));
  useEffect(() => setT((valore || []).join('\n')), [valore]);
  return <textarea className="adm-input" rows={righe} value={t} onChange={(e) => setT(e.target.value)} onBlur={() => cambia(t.split('\n').map((x) => x.trim()).filter(Boolean))} />;
}
export function Scegli({ valori, scelti, cambia, nomi }: { valori: string[]; scelti: string[] | undefined; cambia: (v: string[]) => void; nomi?: Record<string, string> }) {
  const s = scelti || [];
  return (
    <div className="riga-chip">
      {valori.map((v) => (
        <button key={v} type="button" className="chip" aria-pressed={s.includes(v)} onClick={() => cambia(s.includes(v) ? s.filter((x) => x !== v) : [...s, v])}>{nomi?.[v] || v}</button>
      ))}
    </div>
  );
}
export function Vuoto({ children }: { children: React.ReactNode }) {
  return <div className="carta piccolo" style={{ fontSize: 14.5 }}>{children}</div>;
}
export function Titolo({ children, sotto }: { children: React.ReactNode; sotto?: string }) {
  return (
    <div className="pila" style={{ ['--gap' as string]: '6px' }}>
      <h1 className="titolo-2">{children}</h1>
      {sotto && <p className="piccolo" style={{ fontSize: 14.5, maxWidth: '75ch' }}>{sotto}</p>}
    </div>
  );
}
export const quando = (s: string | null | undefined) => (s ? new Date(s.replace(' ', 'T') + (s.includes('Z') || s.includes('+') ? '' : 'Z')).toLocaleString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
export const nuovoId = (testo: string, gia: string[]) => {
  const base = testo.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'nuovo';
  let id = base, i = 2;
  while (gia.includes(id)) id = `${base}-${i++}`;
  return id;
};
