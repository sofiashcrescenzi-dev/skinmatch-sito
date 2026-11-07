'use client';

import { CHI_SIAMO, type Membro } from '@/lib/dati';
import { useDocumento, BarraSalva, Campo, Testo, Titolo, Vuoto, nuovoId } from './base';

// CHI SIAMO (7/11/2026, voto d-nome: «con loro immagine che caricheremo noi dall'admin e testo che possiamo modificare
// da là»). La foto si riduce qui, nel browser, a 640 px in webp, e si salva nel documento; la pubblicazione la scrive in
// public/immagini (scripts/admin/pubblica.py, foto_persone). «Pubblica le schede» accende la sezione sul sito: finché è
// spento si vede solo con /chi-siamo#anteprima.
type Doc = { pubblica: boolean; persone: Membro[] };

async function riduci(file: File): Promise<string> {
  const img = await createImageBitmap(file);
  const lato = Math.min(640, Math.max(img.width, img.height));
  const k = lato / Math.max(img.width, img.height);
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/webp', 0.86);
}

export default function ChiSiamo() {
  const doc = useDocumento<Doc>('chisiamo', CHI_SIAMO);
  const d = doc.dati;
  if (doc.errore) return <Vuoto>Non riesco a leggere la pagina: {doc.errore}</Vuoto>;
  if (!d) return <Vuoto>Carico…</Vuoto>;
  const metti = (i: number, p: Membro) => doc.setDati({ ...d, persone: d.persone.map((x, j) => (j === i ? p : x)) });
  return (
    <div className="pila" style={{ ['--gap' as string]: '20px' }}>
      <Titolo sotto="Le persone della pagina skinmatch.it/chi-siamo: foto, nome, ruolo, testo e un link. In questa pagina niente prodotti e niente prezzi: il link di Sofia porta al suo studio o a una pagina professionale.">Chi siamo</Titolo>
      <label className="carta" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input type="checkbox" checked={d.pubblica} onChange={(e) => doc.setDati({ ...d, pubblica: e.target.checked })} />
        <span><b>Pubblica le schede sul sito</b><br /><span className="piccolo">Spento: le schede si vedono solo su <a className="link" href="/chi-siamo#anteprima" target="_blank" rel="noopener">/chi-siamo#anteprima</a>. I testi di partenza sono una storia di prova: riscriveteli prima di accenderlo.</span></span>
      </label>
      {d.persone.map((p, i) => (
        <details key={p.id} className="carta" open>
          <summary><b>{p.nome || 'Senza nome'}</b> <span className="piccolo">· {p.ruolo}</span></summary>
          <div className="pila" style={{ ['--gap' as string]: '10px', marginTop: 10 }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.foto ? <img src={p.foto} alt="" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover' }} /> : <span className="chip tenue">Nessuna foto</span>}
              <label className="bottone secondario" style={{ cursor: 'pointer' }}>
                Carica la foto
                <input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) metti(i, { ...p, foto: await riduci(f) }); }} />
              </label>
              {p.foto && <button type="button" className="chip" onClick={() => metti(i, { ...p, foto: '' })}>Togli la foto</button>}
            </div>
            <div className="adm-due">
              <Campo etichetta="Nome"><Testo valore={p.nome} cambia={(v) => metti(i, { ...p, nome: v })} /></Campo>
              <Campo etichetta="Ruolo" aiuto="Una riga, sotto il nome."><Testo valore={p.ruolo} cambia={(v) => metti(i, { ...p, ruolo: v })} /></Campo>
            </div>
            <Campo etichetta="Testo" aiuto="Un paragrafo per riga vuota."><textarea className="adm-input" rows={8} value={p.testo.join('\n\n')} onChange={(e) => metti(i, { ...p, testo: e.target.value.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean) })} /></Campo>
            <div className="adm-due">
              <Campo etichetta="Testo del link"><Testo valore={p.link.testo} cambia={(v) => metti(i, { ...p, link: { ...p.link, testo: v } })} /></Campo>
              <Campo etichetta="Indirizzo del link" aiuto="Vuoto: il link non compare."><Testo valore={p.link.url} placeholder="https://…" cambia={(v) => metti(i, { ...p, link: { ...p.link, url: v.trim() } })} /></Campo>
            </div>
            <button type="button" className="chip" style={{ justifySelf: 'end' }} onClick={() => confirm(`Togliere ${p.nome}?`) && doc.setDati({ ...d, persone: d.persone.filter((_, j) => j !== i) })}>Togli la persona</button>
          </div>
        </details>
      ))}
      <button type="button" className="bottone secondario" style={{ justifySelf: 'start' }} onClick={() => {
        const nome = prompt('Il nome della persona nuova'); if (!nome) return;
        doc.setDati({ ...d, persone: [...d.persone, { id: nuovoId(nome, d.persone.map((x) => x.id)), nome, ruolo: '', testo: [], foto: '', link: { testo: '', url: '' } }] });
      }}>+ persona</button>
      <BarraSalva doc={doc} cosa="chi siamo" />
    </div>
  );
}
