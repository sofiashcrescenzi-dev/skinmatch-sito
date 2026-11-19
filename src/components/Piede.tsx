import Link from 'next/link';
import { SOCIAL, RETI } from '@/lib/social';

// Il piede: le pagine, e le due frasi che servono sempre (tappa 9): non è una diagnosi,
// e i link verso i negozi sono di affiliazione.
export default function Piede({ rivista }: { rivista: boolean }) {
  return (
    <footer className="piede">
      <div className="contenitore pila" style={{ ['--gap' as string]: '28px' }}>
        <div className="griglia" style={{ ['--min' as string]: '180px' }}>
          <div className="pila" style={{ ['--gap' as string]: '8px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo.svg" alt="Skinmatch" width={154} height={22} style={{ height: 22, width: 'auto' }} />
            <span className="piccolo">Skincare spiegata: le schede dei prodotti, gli attivi e un test che parte dalla tua pelle.</span>
          </div>
          <nav className="pila piccolo" style={{ ['--gap' as string]: '6px' }} aria-label="Il test">
            <Link href="/test?percorso=viso">Test della pelle</Link>
            <Link href="/test?percorso=cute">Test di cute e capelli</Link>
            <Link href="/test?percorso=integrazione">Test dell&apos;integrazione</Link>
            <Link href="/test">I tuoi risultati</Link>
          </nav>
          <nav className="pila piccolo" style={{ ['--gap' as string]: '6px' }} aria-label="Le pagine">
            <Link href="/biotipi">I biotipi</Link>
            <Link href="/catalogo">Il catalogo</Link>
            <Link href="/catalogo/k-beauty">K-beauty</Link>
            <Link href="/glossario">Il glossario</Link>
            {rivista && <Link href="/rivista">La Rivista</Link>}
          </nav>
          <nav className="pila piccolo" style={{ ['--gap' as string]: '6px' }} aria-label="Skinmatch">
            <Link href="/chi-siamo">Chi siamo</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/cookie">Cookie e dati salvati</Link>
            <Link href="/note-legali">Note legali</Link>
          </nav>
        </div>
        {/* LE ICONE SOCIAL (19/11/2026, Federico: «su tutti i siti devono essere presenti le icone social»): i profili
            sono quelli di admin › Social (documento «social»), quindi cambiano lì. rel="me": i profili sono di questo sito. */}
        <nav aria-label="Skinmatch sui social" className="piede-social">
          {RETI.filter((r) => SOCIAL.profili[r.k]?.url).map((r) => (
            <a key={r.k} href={SOCIAL.profili[r.k].url} target="_blank" rel="me noopener" aria-label={`Skinmatch su ${r.nome}`} title={r.nome}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true"><path d={r.d} /></svg>
            </a>
          ))}
        </nav>
        <div className="pila piccolo" style={{ ['--gap' as string]: '6px', maxWidth: '78ch' }}>
          <p>Skinmatch non fa diagnosi: il test aiuta a scegliere i cosmetici, non sostituisce il parere di un medico. Se qualcosa ti preoccupa, parlane con un dermatologo.</p>
          <p>Alcuni link verso i negozi sono di affiliazione: se compri, Skinmatch riceve una piccola commissione, a te non costa nulla in più.</p>
        </div>
      </div>
    </footer>
  );
}
