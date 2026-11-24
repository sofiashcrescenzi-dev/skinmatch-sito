'use client';

import { useEffect, useState } from 'react';
import CalendarioPost, { quandoDi, type Cal } from './CalendarioPost';
import { SOCIAL, POST, RETI, STILI, LIMITI, candidati, type Social as Doc, type Rete, type Stile, type Bottone, type Post } from '@/lib/social';
import { ARTICOLI } from '@/lib/dati';
import { useDocumento, useApi, invia, BarraSalva, Campo, Testo, Titolo, Vuoto, quando } from './base';

// I SOCIAL DI SKINMATCH (8/11/2026, il PO: «creare nell'admin di skinmatch anche tutta l'infrastruttura social. quindi
// anche qui il linktree stessa struttura degli altri, tutti i loghi, background, descrizioni che servono per instagram,
// tiktok, thread e youtube»). Quattro parti: i profili (testi pronti da copiare, coi caratteri contati), la pagina dei
// link (skinmatch.it/link), il kit delle immagini e la voce, il piano dei post con didascalie e file. I profili e la
// pagina sono il documento «social» (Salva, poi Pubblica); lo stato dei post si salva subito (D1 social_stato).

const PAGINE: [string, string][] = [
  ['Il test della pelle', '/test?percorso=viso'], ['Il test del cuoio capelluto', '/test?percorso=cute'], ['Il giro integrativo', '/test?percorso=integrazione'],
  ['I tre test', '/test'], ['L’ultimo video, spiegato (cambia da solo)', '@ultimo-video'], ['I biotipi', '/biotipi'], ['La Rivista', '/rivista'],
  ['Gli attivi (glossario)', '/glossario'], ['Il catalogo', '/catalogo'], ['Gli integratori', '/integratori'], ['Chi siamo', '/chi-siamo'], ['La home', '/'],
];
// ⚠️ GLI ARTICOLI NEI BOTTONI (19/11/2026, Federico: «sul linktree di Skinmatch non fa mettere gli articoli»): prima
// c'erano solo le pagine fisse e un articolo andava scritto a mano dopo «Un'altra pagina…». Ora ci sono tutti.
const ARTICOLI_LINK: [string, string][] = ARTICOLI.map((a) => [a.titolo, `/rivista/${a.slug}`]);
const NOTE: [string, string][] = [...PAGINE, ...ARTICOLI_LINK];
const KIT: { file: string; nome: string; misura: string; uso: string }[] = [
  { file: 'avatar-1080.png', nome: 'Foto profilo', misura: '1080 × 1080', uso: 'Instagram, TikTok, Threads: il segno su cacao, leggibile anche a 110 px' },
  { file: 'youtube-avatar-800.png', nome: 'Foto del canale YouTube', misura: '800 × 800', uso: 'YouTube › Personalizza canale › Branding' },
  { file: 'youtube-banner-2560x1440.png', nome: 'Copertina YouTube', misura: '2560 × 1440', uso: 'YouTube › Branding › Immagine del banner (la scritta sta nella zona sicura)' },
  { file: 'evidenza-test.png', nome: 'Storia in evidenza «Il test»', misura: '1080 × 1920', uso: 'Instagram › Storie in evidenza › copertina' },
  { file: 'evidenza-biotipi.png', nome: 'Storia in evidenza «Biotipi»', misura: '1080 × 1920', uso: 'Instagram › Storie in evidenza › copertina' },
  { file: 'evidenza-attivi.png', nome: 'Storia in evidenza «Attivi»', misura: '1080 × 1920', uso: 'Instagram › Storie in evidenza › copertina' },
  { file: 'evidenza-routine.png', nome: 'Storia in evidenza «Routine»', misura: '1080 × 1920', uso: 'Instagram › Storie in evidenza › copertina' },
  { file: 'evidenza-miti.png', nome: 'Storia in evidenza «Miti»', misura: '1080 × 1920', uso: 'Instagram › Storie in evidenza › copertina' },
  { file: 'sfondo-storia-1080x1920.png', nome: 'Sfondo per le storie', misura: '1080 × 1920', uso: 'Storie e video verticali: cacao con la striscia dei fototipi' },
  { file: 'sfondo-post-1080x1350.png', nome: 'Sfondo per i post, scuro', misura: '1080 × 1350', uso: 'Post e caroselli su cacao' },
  { file: 'sfondo-chiaro-1080x1350.png', nome: 'Sfondo per i post, chiaro', misura: '1080 × 1350', uso: 'Post e caroselli su latte' },
];
// 8/11, il PO su Aida: «troppo sensuale, va cambiata con qualcosa di simile ma meno sensuale» → Samanta è la voce in uso.
// Le altre restano qui da ascoltare: per cambiare basta dirlo, rifare le voci di tutti i video costa circa 4.300 caratteri.
const VOCI = [
  { file: 'samanta.mp3', nome: 'Samanta, la voce in uso', nota: '«Reassuring, Warm and Deep»: calda e profonda come Aida, senza il tono sussurrato.' },
  { file: 'aida.mp3', nome: 'Aida, la voce di prima', nota: 'Per il PO troppo sensuale: profonda e intima, 1,8 parole al secondo.' },
  { file: 'beatrice.mp3', nome: 'Beatrice, «Warm and Reassuring»', nota: 'Rassicurante e raffinata, più chiara di Samanta. 2,5 parole al secondo.' },
  { file: 'violetta.mp3', nome: 'Violetta, «Warm, Clear and Engaging»', nota: 'Calda e chiara, la voce femminile italiana più usata della libreria. 2,7 parole al secondo.' },
  { file: 'luna.mp3', nome: 'Luna, «Natural, Measured and Confident»', nota: 'Giovane, misurata, nata per spiegare. 2,8 parole al secondo.' },
];
// ⚠️ UNA DIDASCALIA SOLA (19/11/2026, Federico: «togliere le caption su Threads, uniformare caption TikTok e Instagram,
// anche YouTube, ma mettermi comunque il titolo per YT a parte; per i caroselli eliminare YouTube oltre che Threads»).
// La didascalia di Instagram vale per TikTok e YouTube; il titolo YouTube a parte, solo nei video.
const didascalieDi = (p: Post): [string, string, number][] => {
  const d = p.didascalie as Record<string, string>;
  const una = d.instagram || d.tiktok || '';
  const out: [string, string, number][] = [[p.tipo === 'video' ? 'Instagram, TikTok e YouTube' : 'Instagram e TikTok', una, 2200]];
  if (p.tipo === 'video' && d.youtube_titolo) out.push(['YouTube, titolo', d.youtube_titolo, 100]);
  return out.filter(([, t]) => t);
};

function Copia({ testo, etichetta = 'Copia' }: { testo: string; etichetta?: string }) {
  const [fatto, setFatto] = useState(false);
  return (
    <button type="button" className="chip" onClick={() => { navigator.clipboard?.writeText(testo).then(() => { setFatto(true); setTimeout(() => setFatto(false), 1500); }).catch(() => {}); }}>
      {fatto ? 'Copiato' : etichetta}
    </button>
  );
}
const Conta = ({ n, max }: { n: number; max: number }) => <span className="piccolo" style={{ color: n > max ? 'var(--attenzione)' : undefined }}>{n}/{max}</span>;

function Profili({ d, metti }: { d: Doc; metti: (r: Rete, k: string, v: string) => void }) {
  const [rete, setRete] = useState<Rete>('instagram');
  const p = d.profili[rete], lim = LIMITI[rete];
  const bio = `https://skinmatch.it/link?utm_source=${rete}&utm_medium=bio`;
  return (
    <section className="carta pila" style={{ ['--gap' as string]: '12px' }}>
      <h2 className="titolo-3">I profili</h2>
      <div className="riga-chip">{RETI.map((r) => <button key={r.k} type="button" className="chip" aria-pressed={rete === r.k} onClick={() => setRete(r.k)}>{r.nome}</button>)}</div>
      <div className="adm-due">
        <Campo etichetta="Nome visualizzato"><Testo valore={p.nome} cambia={(v) => metti(rete, 'nome', v)} /></Campo>
        <Campo etichetta="Handle (senza @)"><Testo valore={p.handle} cambia={(v) => metti(rete, 'handle', v.replace(/^@/, '').trim())} /></Campo>
      </div>
      <div className="riga-chip"><Conta n={[...p.nome].length} max={lim.nome} /><Copia testo={p.nome} etichetta="Copia il nome" /><Copia testo={p.handle} etichetta="Copia l’handle" /></div>
      <Campo etichetta={rete === 'youtube' ? 'Descrizione del canale' : 'Bio'}><Testo lungo valore={p.bio} cambia={(v) => metti(rete, 'bio', v)} /></Campo>
      <div className="riga-chip"><Conta n={[...p.bio].length} max={lim.bio} /><Copia testo={p.bio} etichetta={rete === 'youtube' ? 'Copia la descrizione' : 'Copia la bio'} /></div>
      <div className="adm-due">
        <Campo etichetta="Indirizzo del profilo" aiuto="Quando il profilo esiste: l’icona compare sulla pagina dei link."><Testo valore={p.url} placeholder={`${RETI.find((r) => r.k === rete)?.base}…`} cambia={(v) => metti(rete, 'url', v.trim())} /></Campo>
        <Campo etichetta="Categoria del profilo"><Testo valore={p.categoria} cambia={(v) => metti(rete, 'categoria', v)} /></Campo>
      </div>
      <div className="riga-chip"><span className="piccolo">Il link da mettere nella bio: <b>{bio}</b></span><Copia testo={bio} etichetta="Copia il link" /></div>
      {/* ⚠️ LA VOCE SINTETICA SI DICHIARA SU OGNI RETE (20/11/2026, revisione privacy punto 10): non solo su TikTok. */}
      {rete === 'tiktok' && <p className="piccolo">Su TikTok, per ogni video con la voce sintetica: «Contenuto generato dall’IA» attivo.</p>}
      {rete === 'instagram' && <p className="piccolo">Su Instagram, per ogni video con la voce sintetica: Impostazioni avanzate › «Etichetta IA» attiva.</p>}
      {rete === 'youtube' && <p className="piccolo">Su YouTube, per ogni video con la voce sintetica: «Contenuti alterati o sintetici» › Sì.</p>}
    </section>
  );
}

function PaginaLink({ d, cambia }: { d: Doc; cambia: (l: Doc['link']) => void }) {
  const l = d.link;
  const metti = (i: number, b: Partial<Bottone>) => cambia({ ...l, bottoni: l.bottoni.map((x, j) => (j === i ? { ...x, ...b } : x)) });
  const sposta = (i: number, dd: number) => { const b = [...l.bottoni]; const [x] = b.splice(i, 1); b.splice(i + dd, 0, x); cambia({ ...l, bottoni: b }); };
  const tutti = candidati();
  const scelti = l.vetrina.scelti || tutti.slice(0, 4).map((x) => x.href);
  // scegliere gli articoli accende il riquadro: prima si potevano scegliere con «si vedono» spento, e non comparivano
  const setScelti = (s: string[] | null) => cambia({ ...l, vetrina: { ...l.vetrina, scelti: s, mostra: s && s.length ? true : l.vetrina.mostra } });
  return (
    <section className="carta pila" style={{ ['--gap' as string]: '12px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 className="titolo-3">La pagina dei link</h2>
        <span className="riga-chip"><a className="link" href="/link" target="_blank" rel="noopener">skinmatch.it/link</a><Copia testo="https://skinmatch.it/link" /></span>
      </div>
      <div className="adm-due">
        <Campo etichetta="Titolo"><Testo valore={l.titolo} cambia={(v) => cambia({ ...l, titolo: v })} /></Campo>
        <Campo etichetta="Frase sotto il titolo"><Testo valore={l.frase} cambia={(v) => cambia({ ...l, frase: v })} /></Campo>
      </div>
      <div className="pila" style={{ ['--gap' as string]: '8px' }}>
        <div className="riga-chip">
          <b className="piccolo">Gli articoli e i video in cima, due per riga</b>
          <label className="piccolo" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><input id="bio-vetrina" type="checkbox" checked={l.vetrina.mostra} onChange={(e) => cambia({ ...l, vetrina: { ...l.vetrina, mostra: e.target.checked } })} /> si vedono</label>
        </div>
        {l.vetrina.mostra && (
          <>
            <div className="riga-chip">
              <button type="button" className="chip" aria-pressed={!l.vetrina.scelti} onClick={() => setScelti(null)}>I quattro più recenti</button>
              <button type="button" className="chip" aria-pressed={!!l.vetrina.scelti} onClick={() => setScelti(scelti)}>Li scelgo io</button>
            </div>
            {!tutti.length && <Vuoto>Ancora nessun articolo o video da mostrare.</Vuoto>}
            <div className="pila" style={{ ['--gap' as string]: '6px' }}>
              {(l.vetrina.scelti ? [...scelti.map((h) => tutti.find((x) => x.href === h)).filter((x): x is NonNullable<typeof x> => !!x), ...tutti.filter((x) => !scelti.includes(x.href))] : tutti.slice(0, 8)).map((x) => {
                const i = scelti.indexOf(x.href), dentro = i >= 0;
                return (
                  <div key={x.href} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', opacity: l.vetrina.scelti && !dentro ? 0.65 : 1 }}>
                    <span className="piccolo" style={{ flex: '1 1 220px' }}><b>{x.tipo}</b> · {x.titolo}</span>
                    {l.vetrina.scelti && dentro && <><button type="button" className="chip" disabled={i === 0} onClick={() => { const s = [...scelti]; s.splice(i - 1, 0, s.splice(i, 1)[0]); setScelti(s); }}>↑</button>
                      <button type="button" className="chip" disabled={i === scelti.length - 1} onClick={() => { const s = [...scelti]; s.splice(i + 1, 0, s.splice(i, 1)[0]); setScelti(s); }}>↓</button></>}
                    {l.vetrina.scelti && <button type="button" className="chip" onClick={() => setScelti(dentro ? scelti.filter((h) => h !== x.href) : [...scelti, x.href].slice(0, 8))}>{dentro ? 'Togli' : 'Metti'}</button>}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <b className="piccolo">I bottoni, in ordine</b>
      {l.bottoni.map((b, i) => (
        <div key={i} className="pila" style={{ ['--gap' as string]: '8px', padding: 12, borderRadius: 14, border: '1px solid var(--riga)', opacity: b.attivo === false ? 0.6 : 1 }}>
          <div className="adm-due">
            <Campo etichetta="Testo del bottone"><Testo valore={b.etichetta} cambia={(v) => metti(i, { etichetta: v })} /></Campo>
            <Campo etichetta="Porta a">
              <select className="adm-input" value={NOTE.some(([, u]) => u === b.url) ? b.url : 'altro'} onChange={(e) => metti(i, { url: e.target.value === 'altro' ? '/' : e.target.value })}>
                <optgroup label="Le pagine">{PAGINE.map(([n, u]) => <option key={u} value={u}>{n}</option>)}</optgroup>
                <optgroup label="Gli articoli della Rivista">{ARTICOLI_LINK.map(([n, u]) => <option key={u} value={u}>{n}</option>)}</optgroup>
                <option value="altro">Un’altra pagina o un indirizzo esterno…</option>
              </select>
            </Campo>
          </div>
          {!NOTE.some(([, u]) => u === b.url) && <Campo etichetta="Indirizzo" aiuto="Una pagina del sito (/rivista/…) o un indirizzo https://"><Testo valore={b.url} cambia={(v) => metti(i, { url: v.trim() })} /></Campo>}
          <div className="riga-chip" role="radiogroup" aria-label="Colore del bottone">
            {(Object.keys(STILI) as Stile[]).map((k) => (
              <button key={k} type="button" role="radio" aria-checked={b.colore === k} onClick={() => metti(i, { colore: k })}
                style={{ minHeight: 36, padding: '6px 12px', borderRadius: 999, cursor: 'pointer', fontWeight: 700, fontSize: 13, background: STILI[k].fondo, color: STILI[k].testo, border: `2px solid ${STILI[k].bordo}`, outline: b.colore === k ? '3px solid var(--terra)' : 'none', outlineOffset: 2 }}>
                {STILI[k].nome}{b.colore === k ? ' ✓' : ''}
              </button>
            ))}
          </div>
          <div className="riga-chip">
            <label className="piccolo" style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={b.attivo !== false} onChange={(e) => metti(i, { attivo: e.target.checked })} /> si vede</label>
            <button type="button" className="chip" disabled={i === 0} onClick={() => sposta(i, -1)}>↑</button>
            <button type="button" className="chip" disabled={i === l.bottoni.length - 1} onClick={() => sposta(i, 1)}>↓</button>
            <button type="button" className="chip" onClick={() => cambia({ ...l, bottoni: l.bottoni.filter((_, j) => j !== i) })}>Togli</button>
          </div>
        </div>
      ))}
      <button type="button" className="bottone secondario" style={{ justifySelf: 'start' }} onClick={() => cambia({ ...l, bottoni: [...l.bottoni, { etichetta: '', url: '/', colore: 'contorno', attivo: true }] })}>+ bottone</button>
      <Campo etichetta="Nota in fondo"><Testo lungo valore={l.piede} cambia={(v) => cambia({ ...l, piede: v })} /></Campo>
    </section>
  );
}

function Kit() {
  return (
    <section className="carta pila" style={{ ['--gap' as string]: '12px' }}>
      <h2 className="titolo-3">Il kit delle immagini</h2>
      <p className="piccolo">Dal marchio Fototipi (media/brand/IDENTITA.md). Tocca un’immagine per aprirla e salvarla.</p>
      <div className="griglia" style={{ ['--min' as string]: '170px' }}>
        {KIT.map((k) => (
          <a key={k.file} href={`/social/kit/${k.file}`} target="_blank" rel="noopener" className="pila" style={{ ['--gap' as string]: '6px', textDecoration: 'none', color: 'inherit' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/social/kit/${k.file}`} alt="" loading="lazy" style={{ width: '100%', aspectRatio: k.misura.includes('1920') ? '9 / 16' : k.misura.includes('1440') ? '16 / 9' : k.misura.includes('1350') ? '4 / 5' : '1', objectFit: 'cover', borderRadius: 12, background: 'var(--velo)' }} />
            <b style={{ fontSize: 14 }}>{k.nome}</b>
            <span className="piccolo">{k.misura} · {k.uso}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

function Voce() {
  return (
    <section className="carta pila" style={{ ['--gap' as string]: '10px' }}>
      <h2 className="titolo-3">La voce dei video</h2>
      <p className="piccolo">In uso: Samanta, calda e profonda ma meno sensuale di Aida. Tutti i video sono fatti con lei; le altre si ascoltano qui, con la stessa frase.</p>
      {VOCI.map((v) => (
        <div key={v.file} className="pila" style={{ ['--gap' as string]: '4px' }}>
          <b style={{ fontSize: 15 }}>{v.nome}</b>
          <audio controls preload="none" src={`/social/voce/${v.file}`} style={{ width: '100%', maxWidth: 420 }} />
          <span className="piccolo">{v.nota}</span>
        </div>
      ))}
    </section>
  );
}

type Stato = { id: string; stato: string; link: string | null; chi: string | null; aggiornato_il: string };
// ⚠️ SALVARE I FILE DAL TELEFONO (13/11/2026, Federico: «serve un modo semplice di scaricare le immagini e i video»).
// Sul telefono si passa tutto al foglio di condivisione del sistema (una volta sola, tutte le slide insieme): da li
// «Salva in Foto». Dove la condivisione di file non c'e (il computer), ogni file si scarica con un clic.
function Salva({ p }: { p: Post }) {
  const [msg, setMsg] = useState('');
  const salva = async () => {
    setMsg('Preparo i file…');
    try {
      const file = await Promise.all(p.file.map(async (f) => {
        const r = await fetch(`${p.base}/${f}`);
        const b = await r.blob();
        return new File([b], `${p.slug || p.id}-${f}`, { type: b.type || (f.endsWith('.mp4') ? 'video/mp4' : 'image/png') });
      }));
      if (navigator.canShare?.({ files: file })) { await navigator.share({ files: file, title: p.titolo }); setMsg(''); return; }
      for (const f of file) {
        const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name; document.body.appendChild(a); a.click(); a.remove();
        await new Promise((r) => setTimeout(r, 300));
      }
      setMsg('Scaricati.');
    } catch (e) { setMsg((e as Error).name === 'AbortError' ? '' : `Non riesco: ${(e as Error).message}`); }
  };
  return (
    <span className="riga-chip">
      <button type="button" className="bottone" onClick={salva}>{p.file.length > 1 ? `Salva le ${p.file.length} immagini sul telefono` : p.file[0]?.endsWith('.mp4') ? 'Salva il video sul telefono' : 'Salva sul telefono'}</button>
      {msg && <span className="piccolo" role="status">{msg}</span>}
    </span>
  );
}
function UnPost({ p, stato, poi, aperto, quando: q }: { p: Post; stato?: Stato; poi: () => void; aperto?: boolean; quando: { giorno: string; ora: string; spostato: boolean } }) {
  const [err, setErr] = useState('');
  const [fatto, setFatto] = useState('');
  // ⚠️ 24/11/2026, Federico: «ci sono pulsanti che non cliccano». «Da pubblicare» su un post già da pubblicare non cambiava
  // niente a vista: ora il bottone dello stato attuale è acceso e ogni tocco dice cosa ha segnato.
  const segna = async (s: string) => { setErr(''); setFatto('Segno…'); try { await invia('/api/admin/social-stato', { id: p.id, stato: s }); setFatto(`Segnato: ${s === 'pubblicato' ? 'pubblicato' : s === 'saltato' ? 'saltato' : 'da pubblicare'}.`); poi(); } catch (e) { setFatto(''); setErr((e as Error).message); } };
  const ora = stato?.stato || 'da_pubblicare';
  const video = p.file.find((f) => f.endsWith('.mp4'));
  return (
    <details className="carta" id={`post-${p.id}`} open={aperto || undefined}>
      <summary><span style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
        <span><b>{q.giorno.slice(8, 10)}/{q.giorno.slice(5, 7)} · {p.titolo}</b> <span className="piccolo">· {p.tipo === 'video' ? 'video' : 'carosello'}{p.sofia ? ' · da far rileggere a Sofia' : ''}</span></span>
        <span className="chip tenue">{stato?.stato === 'pubblicato' ? `pubblicato ${quando(stato.aggiornato_il)}` : stato?.stato === 'saltato' ? 'saltato' : 'da pubblicare'}</span>
      </span></summary>
      <div className="pila" style={{ ['--gap' as string]: '10px', marginTop: 10 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {video
            ? <video controls preload="none" poster={`${p.base}/${p.copertina}`} src={`${p.base}/${video}`} style={{ width: 220, maxWidth: '100%', borderRadius: 12, background: 'var(--cacao)' }} />
            // eslint-disable-next-line @next/next/no-img-element
            : <img src={`${p.base}/${p.copertina}`} alt="" style={{ width: 220, maxWidth: '100%', borderRadius: 12 }} />}
          <div className="pila" style={{ ['--gap' as string]: '6px', flex: '1 1 260px', minWidth: 0 }}>
            <span className="piccolo">Esce il {q.giorno.slice(8, 10)}/{q.giorno.slice(5, 7)} alle {q.ora}{q.spostato ? ' (spostato nel calendario)' : ''} · porta a <a className="link" href={p.pagina} target="_blank" rel="noopener">{p.pagina}</a></span>
            {p.sofia && <p className="avviso" style={{ fontSize: 14 }}><b>Sofia:</b> {p.sofia}</p>}
            <Salva p={p} />
            <span className="riga-chip">{p.file.map((f) => <a key={f} className="chip" href={`${p.base}/${f}`} download={`${p.slug || p.id}-${f}`}>⬇ {f}</a>)}</span>
            {p.note && <span className="piccolo">{p.note}</span>}
          </div>
        </div>
        {didascalieDi(p).map(([nome, t, lim]) => (
          <div key={nome} className="pila" style={{ ['--gap' as string]: '4px' }}>
            <div className="riga-chip"><b className="piccolo">{nome}</b><span className="piccolo" style={{ color: [...t].length > lim ? 'var(--attenzione)' : undefined }}>{[...t].length}/{lim} caratteri</span><Copia testo={t} /></div>
            <p className="testo" style={{ fontSize: 14.5, whiteSpace: 'pre-line', background: 'var(--velo)', borderRadius: 12, padding: '10px 12px' }}>{t}</p>
          </div>
        ))}
        <div className="riga-chip">
          <button type="button" className="bottone" aria-pressed={ora === 'pubblicato'} onClick={() => segna('pubblicato')}>{ora === 'pubblicato' ? 'Pubblicato ✓' : 'L’ho pubblicato'}</button>
          <button type="button" className="chip" aria-pressed={ora === 'saltato'} onClick={() => segna('saltato')}>Saltato</button>
          <button type="button" className="chip" aria-pressed={ora === 'da_pubblicare'} onClick={() => segna('da_pubblicare')}>Da pubblicare</button>
          {fatto && <span className="piccolo" role="status">{fatto}</span>}
        </div>
        {err && <p className="piccolo" style={{ color: 'var(--attenzione)' }}>{err}</p>}
      </div>
    </details>
  );
}

// il calendario (23/11/2026) e il piano leggono gli stessi stati; dal calendario un tocco apre il post nel piano
function Piano({ apri, cal }: { apri?: string | null; cal: Record<string, Cal> }) {
  const api = useApi<{ stati: Stato[] }>('/api/admin/social-stato');
  const stati = Object.fromEntries((api.dati?.stati || []).map((s) => [s.id, s]));
  // nell'ordine del calendario: il giorno e l'ora spostati dal PO valgono più di quelli del piano
  const prossimi = POST.map((p) => ({ p, q: quandoDi(p, cal[p.id]) })).sort((a, b) => `${a.q.giorno} ${a.q.ora}`.localeCompare(`${b.q.giorno} ${b.q.ora}`));
  useEffect(() => { if (apri) document.getElementById(`post-${apri}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, [apri]);
  return (
    <section className="pila" style={{ ['--gap' as string]: '10px' }}>
      <h2 className="titolo-3">Il piano dei post</h2>
      <p className="piccolo">Un’uscita ogni tre giorni: un video per Reels, TikTok e Shorts, un carosello per Instagram e TikTok. Prima di pubblicare, Sofia rilegge quelli segnati.</p>
      {!prossimi.length && <Vuoto>I post compaiono qui quando il motore dei video li ha preparati.</Vuoto>}
      {prossimi.map(({ p, q }) => <UnPost key={p.id} p={p} quando={q} stato={stati[p.id]} poi={api.ricarica} aperto={apri === p.id} />)}
    </section>
  );
}

// I NUMERI DI TIKTOK (19/11/2026): dall'API ufficiale, scritti dal Mac ogni 6 ore (scripts/admin/social_tiktok.py).
// Le visualizzazioni del periodo sono la crescita del totale da 30 giorni fa; finché lo storico non ci arriva, quelle dei
// video usciti negli ultimi 30 giorni.
type ProfiloSocial = { giorno: string; piattaforma: string; account: string; follower: number; like_totali: number; video: number; visualizzazioni: number; aggiornato: string };
// le piattaforme lette dall'API (TikTok dal 19/11, Instagram dal 20/11/2026: scripts/admin/social_instagram.py)
const PIATTAFORMA_API: Record<string, string> = { tiktok: 'TikTok', instagram: 'Instagram' };
type VideoSocial = { id: string; account: string; titolo: string; creato: string; visualizzazioni: number; mi_piace: number; commenti: number; condivisioni: number; link: string };
const cifra = (n: number | null | undefined) => (n == null ? '—' : Number(n).toLocaleString('it-IT'));

function Numeri() {
  const api = useApi<{ profili: ProfiloSocial[]; storico: { giorno: string; piattaforma?: string; account: string; visualizzazioni: number }[]; video: (VideoSocial & { piattaforma?: string })[] }>('/api/admin/social-numeri');
  if (api.errore) return <Vuoto>Non riesco a leggere i numeri: {api.errore}</Vuoto>;
  if (!api.dati) return <Vuoto>Carico…</Vuoto>;
  const { profili, storico, video } = api.dati;
  if (!profili.length) return <Vuoto>Nessun profilo collegato ancora: i numeri arrivano dopo il primo giro del Mac.</Vuoto>;
  const inizio = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  return (
    <section className="pila" style={{ ['--gap' as string]: '14px' }}>
      {profili.map((p) => {
        const prima = [...storico].reverse().find((s) => s.account === p.account && (s.piattaforma ?? p.piattaforma) === p.piattaforma && s.giorno <= inizio);
        const recenti = video.filter((v) => v.account === p.account && (v.piattaforma ?? p.piattaforma) === p.piattaforma && v.creato >= inizio);
        const nome = PIATTAFORMA_API[p.piattaforma] || p.piattaforma;
        const pezzi = p.piattaforma === 'instagram' ? 'post' : 'video';
        const viste30 = prima ? Math.max(0, p.visualizzazioni - prima.visualizzazioni) : recenti.reduce((t, v) => t + (v.visualizzazioni || 0), 0);
        return (
          <div key={p.piattaforma + p.account} className="pila" style={{ ['--gap' as string]: '8px' }}>
            <h2 className="titolo-3">{nome} · @{p.account}</h2>
            <div className="adm-numeri">
              <div><span className="piccolo">Follower</span><b>{cifra(p.follower)}</b></div>
              <div><span className="piccolo">Visualizzazioni, 30 giorni</span><b>{cifra(viste30)}</b><span className="piccolo">{prima ? `crescita di tutti i ${pezzi}` : `${recenti.length} ${pezzi} usciti nel periodo`}</span></div>
              <div><span className="piccolo">Visualizzazioni in tutto</span><b>{cifra(p.visualizzazioni)}</b></div>
              <div><span className="piccolo">Mi piace</span><b>{cifra(p.like_totali)}</b></div>
              <div><span className="piccolo">{pezzi === 'post' ? 'Post' : 'Video'}</span><b>{cifra(p.video)}</b></div>
            </div>
            <p className="piccolo">Aggiornato {quando(p.aggiornato)} · dall’API di {nome}, ogni 6 ore.</p>
          </div>
        );
      })}
      {video.length > 0 && (
        <div className="pila" style={{ ['--gap' as string]: '6px' }}>
          <h3 className="titolo-3">I video e i post</h3>
          <div className="adm-tabella">
            <table style={{ minWidth: 520 }}>
              <thead><tr><th>Video</th><th>Uscito</th><th className="num">Viste</th><th className="num">Mi piace</th><th className="num">Commenti</th><th className="num">Condivisioni</th></tr></thead>
              <tbody>{video.map((v) => (
                <tr key={v.id}>
                  <td style={{ maxWidth: 280 }}>{v.link ? <a className="link" href={v.link} target="_blank" rel="noopener noreferrer">{v.titolo || 'senza titolo'}</a> : (v.titolo || 'senza titolo')}</td>
                  <td>{quando(v.creato)}</td><td className="num">{cifra(v.visualizzazioni)}</td><td className="num">{cifra(v.mi_piace)}</td>
                  <td className="num">{cifra(v.commenti)}</td><td className="num">{cifra(v.condivisioni)}</td>
                </tr>))}</tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}

export default function Social() {
  const doc = useDocumento<Doc>('social', SOCIAL);
  const [parte, setParte] = useState<'calendario' | 'profili' | 'link' | 'kit' | 'piano' | 'numeri'>('calendario');
  const [apri, setApri] = useState<string | null>(null);
  const statiApi = useApi<{ stati: Stato[] }>('/api/admin/social-stato');
  const statoDi = (p: Post) => (statiApi.dati?.stati || []).find((s) => s.id === p.id)?.stato || 'da_pubblicare';
  const calApi = useApi<{ calendario: (Cal & { id: string })[] }>('/api/admin/social-calendario');
  const cal: Record<string, Cal> = Object.fromEntries((calApi.dati?.calendario || []).map((c) => [c.id, c]));
  const d = doc.dati;
  if (doc.errore) return <Vuoto>Non riesco a leggere i social: {doc.errore}</Vuoto>;
  if (!d) return <Vuoto>Carico…</Vuoto>;
  const metti = (r: Rete, k: string, v: string) => doc.setDati({ ...d, profili: { ...d.profili, [r]: { ...d.profili[r], [k]: v } } });
  return (
    <div className="pila" style={{ ['--gap' as string]: '20px' }}>
      <Titolo sotto="I profili di Instagram, TikTok, Threads e YouTube, la pagina skinmatch.it/link, il kit delle immagini, la voce e il piano dei post con le didascalie da copiare.">I social</Titolo>
      <div className="riga-chip">
        {([['calendario', 'Il calendario'], ['piano', 'Il piano'], ['numeri', 'I numeri'], ['profili', 'I profili'], ['link', 'La pagina dei link'], ['kit', 'Kit e voce']] as const).map(([k, n]) => <button key={k} type="button" className="chip" aria-pressed={parte === k} onClick={() => setParte(k)}>{n}</button>)}
      </div>
      {parte === 'calendario' && (calApi.dati || calApi.errore) && <CalendarioPost post={POST} statoDi={statoDi} cal={cal} poi={calApi.ricarica} onApri={(id) => { setApri(id); setParte('piano'); }} />}
      {parte === 'calendario' && calApi.caricando && <Vuoto>Carico il calendario…</Vuoto>}
      {parte === 'piano' && <Piano apri={apri} cal={cal} />}
      {parte === 'numeri' && <Numeri />}
      {parte === 'profili' && <Profili d={d} metti={metti} />}
      {parte === 'link' && <PaginaLink d={d} cambia={(l) => doc.setDati({ ...d, link: l })} />}
      {parte === 'kit' && <><Kit /><Voce /></>}
      {(parte === 'profili' || parte === 'link') && <BarraSalva doc={doc} cosa="social" />}
    </div>
  );
}
