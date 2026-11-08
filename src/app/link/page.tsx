import type { Metadata } from 'next';
import { SOCIAL, RETI, STILI, vetrina, indirizzoBottone } from '@/lib/social';
import Utm from './Utm';

// IL LINK IN BIO DI SKINMATCH (8/11/2026, il PO: «anche qui il linktree, stessa struttura degli altri»): una pagina
// propria su skinmatch.it, separata da agoranomos.cloud. In alto il segno su cacao con la striscia dei fototipi e le
// icone dei profili; poi gli articoli e i video, due per riga; poi i bottoni nei colori della palette. Tutto si
// cambia da admin › Social (src/data/social.json).
export const metadata: Metadata = {
  title: { absolute: 'Skinmatch · i link' },
  description: SOCIAL.link.frase,
  alternates: { canonical: '/link' },
  robots: { index: false, follow: true },
};

const data = (d: string) => new Date(d.slice(0, 10) + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' });

export default function LinkInBio() {
  const l = SOCIAL.link;
  const reti = RETI.filter((r) => /^https:\/\/\S+$/.test(SOCIAL.profili[r.k]?.url || ''));
  const box = vetrina(l.vetrina);
  const bottoni = l.bottoni.filter((b) => b.attivo !== false).map((b) => ({ ...b, href: indirizzoBottone(b) })).filter((b) => b.href);
  return (
    <main className="bio">
      <style>{CSS}</style>
      <header className="bio-testa">
        <div className="bio-col">
          <svg className="bio-segno" viewBox="0 -74.79 84 81" aria-hidden="true"><path d="M37.23,-74.79A37.23,37.23 0 0 0 37.23,-0.34Z" fill="#EBC3A6" /><path d="M41.54,-68.91A37.23,37.23 0 0 1 41.54,5.54Z" fill="#A8714E" /></svg>
          <h1>{l.titolo}</h1>
          <div className="bio-striscia" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
          {l.frase && <p>{l.frase}</p>}
          {reti.length > 0 && (
            <nav className="bio-reti" aria-label="Skinmatch sui social">
              {reti.map((r) => (
                <a key={r.k} href={SOCIAL.profili[r.k].url} target="_blank" rel="noopener noreferrer" aria-label={`Skinmatch su ${r.nome}`} title={r.nome}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d={r.d} /></svg>
                </a>
              ))}
            </nav>
          )}
        </div>
      </header>
      <div className="bio-col bio-corpo">
        {box.length > 0 && (
          <section aria-labelledby="bio-ultimi">
            <h2 id="bio-ultimi">Da guardare</h2>
            <ul className="bio-vetrina">
              {box.map((x) => (
                <li key={x.href}>
                  <a className="bio-box" href={x.href} data-bio="vetrina">
                    {x.immagine
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={x.immagine} alt="" width="240" height="300" loading="lazy" />
                      : <span className="bio-tessera" aria-hidden="true" />}
                    <span className="bio-tipo">{x.tipo} · {data(x.data)}</span>
                    <strong>{x.titolo}</strong>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}
        <nav aria-label="I link di Skinmatch">
          <ul className="bio-bottoni">
            {bottoni.map((b, i) => {
              const c = STILI[b.colore] || STILI.contorno;
              return (
                <li key={b.etichetta + i}>
                  <a className={`bio-bottone${i === 0 ? ' primo' : ''}`} href={b.href!} data-bio={b.url === '@ultimo-video' ? 'ultimo-video' : 'bottone'}
                    style={{ background: c.fondo, color: c.testo, borderColor: c.bordo }}>
                    <span>{b.etichetta}</span><span aria-hidden="true">→</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
        {l.piede && <p className="bio-piede">{l.piede}</p>}
        <a className="bio-casa" href="/" data-bio="home">skinmatch.it</a>
      </div>
      <Utm />
    </main>
  );
}

const CSS = `
.bio { min-height: 100vh; background: var(--latte); color: var(--cacao); }
.bio-col { width: 100%; max-width: 520px; margin: 0 auto; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); box-sizing: border-box; }
.bio-testa { background: var(--cacao); color: var(--latte); }
.bio-testa .bio-col { padding-block: clamp(28px, 7vw, 44px) clamp(24px, 6vw, 34px); display: grid; justify-items: center; text-align: center; gap: 12px; }
.bio-segno { width: 72px; height: 70px; }
.bio-testa h1 { margin: 0; font-family: var(--font-titoli); font-weight: 700; font-size: clamp(30px, 8vw, 38px); letter-spacing: -0.02em; line-height: 1; }
.bio-striscia { display: grid; grid-template-columns: repeat(6, 1fr); gap: 3px; width: 168px; height: 10px; }
.bio-striscia i { border-radius: 5px; }
.bio-striscia i:nth-child(1) { background: #F6DDCC; } .bio-striscia i:nth-child(2) { background: #EBC3A6; } .bio-striscia i:nth-child(3) { background: #D29E78; }
.bio-striscia i:nth-child(4) { background: #A8714E; } .bio-striscia i:nth-child(5) { background: #7B4B33; } .bio-striscia i:nth-child(6) { background: #4A2C1F; outline: 1px solid #66574F; }
.bio-testa p { margin: 0; max-width: 34ch; color: #D9C8BE; font-size: 16px; line-height: 1.45; text-wrap: balance; }
.bio-reti { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 4px; }
.bio-reti a { width: 46px; height: 46px; border-radius: 50%; display: grid; place-items: center; background: rgba(250, 246, 244, 0.08); border: 1px solid rgba(250, 246, 244, 0.22); transition: background .15s, transform .15s; }
.bio-reti a:hover { background: rgba(250, 246, 244, 0.16); }
.bio-reti a:active { transform: scale(.94); }
.bio-reti a:focus-visible { outline: 3px solid #EBC3A6; outline-offset: 2px; }
.bio-reti svg { width: 20px; height: 20px; fill: var(--latte); }
.bio-corpo { padding-block: 22px 40px; display: grid; gap: 22px; }
.bio-corpo h2 { margin: 0 0 10px; font-family: var(--font-sans); font-size: 12.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #7B4B33; }
.bio ul { list-style: none; margin: 0; padding: 0; }
.bio-vetrina { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.bio-vetrina li:last-child:nth-child(odd) { grid-column: 1 / -1; }
.bio-box { display: grid; align-content: start; gap: 6px; height: 100%; box-sizing: border-box; padding: 8px 8px 12px; border-radius: 18px; background: #FFFFFF; border: 1px solid rgba(46, 28, 21, 0.12); color: var(--cacao); text-decoration: none; transition: border-color .15s, transform .15s; }
.bio-box:hover { border-color: #A8714E; }
.bio-box:active { transform: scale(.985); }
.bio-box:focus-visible { outline: 3px solid #A8714E; outline-offset: 2px; }
.bio-box img, .bio-tessera { width: 100%; height: auto; aspect-ratio: 4 / 5; object-fit: cover; border-radius: 12px; display: block; background: #F1E9E4; margin-bottom: 4px; }
.bio-vetrina li:last-child:nth-child(odd) .bio-box img, .bio-vetrina li:last-child:nth-child(odd) .bio-tessera { aspect-ratio: 16 / 9; }
.bio-tipo { padding-inline: 4px; font-size: 11.5px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #7B4B33; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bio-box strong { padding-inline: 4px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; font-family: var(--font-titoli); font-weight: 700; font-size: 15.5px; line-height: 1.22; letter-spacing: -0.01em; }
.bio-bottoni { display: grid; gap: 10px; }
.bio-bottone { display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 58px; padding: 14px 20px; border-radius: 999px; border: 2px solid; text-decoration: none; font-family: var(--font-sans); font-weight: 700; font-size: 17px; line-height: 1.25; transition: transform .15s, filter .15s; }
.bio-bottone.primo { min-height: 66px; font-size: 18px; }
.bio-bottone:hover { filter: brightness(1.06); }
.bio-bottone:active { transform: scale(.985); }
.bio-bottone:focus-visible { outline: 3px solid #A8714E; outline-offset: 3px; }
.bio-piede { margin: 0; font-size: 13.5px; line-height: 1.5; color: #66574F; text-align: center; }
.bio-casa { justify-self: center; color: #7B4B33; font-weight: 700; text-decoration: none; font-size: 14px; }
@media (prefers-reduced-motion: reduce) { .bio-box, .bio-bottone, .bio-reti a { transition: none; } }
`;
