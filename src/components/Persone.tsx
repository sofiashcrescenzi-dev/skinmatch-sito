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
      <div className="griglia" style={{ ['--min' as string]: '300px' }}>
        {CHI_SIAMO.persone.map((p) => (
          <article key={p.id} id={p.id} className="carta pila persona" style={{ ['--gap' as string]: '12px' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <Ritratto p={p} />
              <div className="pila" style={{ ['--gap' as string]: '4px', minWidth: 0 }}>
                <h3 className="titolo-3">{p.nome}</h3>
                <span className="piccolo">{p.ruolo}</span>
              </div>
            </div>
            <div className="testo pila" style={{ ['--gap' as string]: '10px', fontSize: 16 }}>{p.testo.map((t) => <p key={t}>{t}</p>)}</div>
            {p.link.url && p.link.testo && <a className="link" href={p.link.url} target="_blank" rel="noopener">{p.link.testo} →</a>}
          </article>
        ))}
      </div>
    </section>
  );
}
