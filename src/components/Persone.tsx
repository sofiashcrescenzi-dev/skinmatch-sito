'use client';

import { useEffect, useState } from 'react';
import { CHI_SIAMO, type Membro } from '@/lib/dati';

// LE PERSONE DI CHI SIAMO (7/11/2026, voto d-nome). Testi e foto da admin › Chi siamo. Finché la pagina non è
// «pubblica» le schede si vedono solo con /chi-siamo#anteprima: i testi di partenza sono una storia di prova.
export function Ritratto({ p, lato = 96 }: { p: Pick<Membro, 'nome' | 'foto'>; lato?: number }) {
  // senza foto: le iniziali su due fototipi, come il segno di Skinmatch (mai una foto finta)
  const iniziali = p.nome.replace(/^dr\.?(ssa)?\s+/i, '').split(/\s+/).map((x) => x[0]).slice(0, 2).join('').toUpperCase();
  return p.foto
    // eslint-disable-next-line @next/next/no-img-element
    ? <img className="ritratto" src={p.foto} alt={p.nome} width={lato} height={lato} style={{ width: lato, height: lato }} />
    : <span className="ritratto ritratto-vuoto" style={{ width: lato, height: lato, fontSize: lato * 0.36 }} aria-hidden="true">{iniziali}</span>;
}

export function useAnteprima() {
  const [si, setSi] = useState(false);
  useEffect(() => {
    const leggi = () => setSi(window.location.hash === '#anteprima');
    leggi();
    window.addEventListener('hashchange', leggi);
    return () => window.removeEventListener('hashchange', leggi);
  }, []);
  return si;
}

export default function Persone() {
  const anteprima = useAnteprima();
  if (!CHI_SIAMO.pubblica && !anteprima) return null;
  return (
    <section id="persone" className="pila" style={{ ['--gap' as string]: '18px' }}>
      {!CHI_SIAMO.pubblica && <p className="avviso">Anteprima: le schede non sono ancora pubbliche, e i testi sono di prova.</p>}
      <h2 className="titolo-2">Le persone</h2>
      {/* ⚠️ A TUTTA PAGINA (13/11/2026, Federico: «i box delle persone vanno ampliati a tutta pagina e messi all'inizio»):
          una persona per riga, la foto grande a sinistra e il testo accanto; sul telefono la foto sopra. */}
      <div className="pila" style={{ ['--gap' as string]: '18px' }}>
        {CHI_SIAMO.persone.map((p) => (
          <article key={p.id} id={p.id} className="carta persona persona-larga">
            <Ritratto p={p} lato={168} />
            <div className="pila" style={{ ['--gap' as string]: '12px', minWidth: 0 }}>
              <div className="pila" style={{ ['--gap' as string]: '4px' }}>
                <h3 className="titolo-2">{p.nome}</h3>
                <span className="piccolo" style={{ fontSize: 15.5 }}>{p.ruolo}</span>
              </div>
              <div className="testo pila" style={{ ['--gap' as string]: '10px', fontSize: 17, maxWidth: '68ch' }}>{p.testo.map((t) => <p key={t}>{t}</p>)}</div>
              {p.link.url && p.link.testo && <a className="link" href={p.link.url} target="_blank" rel="noopener">{p.link.testo} →</a>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
