import Link from 'next/link';

// Il piede: le pagine, e le due frasi che servono sempre (tappa 9): non è una diagnosi,
// e i link verso i negozi sono di affiliazione.
export default function Piede({ rivista }: { rivista: boolean }) {
  return (
    <footer className="piede">
      <div className="contenitore pila" style={{ ['--gap' as string]: '28px' }}>
        <div className="griglia" style={{ ['--min' as string]: '180px' }}>
          <div className="pila" style={{ ['--gap' as string]: '8px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo.svg" alt="Skinmatch" width={146} height={22} style={{ height: 22, width: 'auto' }} />
            <span className="piccolo">Il test che riconosce il tuo biotipo e ti consiglia i prodotti giusti, ognuno con un&apos;alternativa che costa meno.</span>
          </div>
          <nav className="pila piccolo" style={{ ['--gap' as string]: '6px' }} aria-label="Il test">
            <Link href="/test?percorso=viso">Test della pelle</Link>
            <Link href="/test?percorso=cute">Test di cute e capelli</Link>
            <Link href="/test?percorso=integrazione">Test dell&apos;integrazione</Link>
            <Link href="/test?percorso=completo">Test completo</Link>
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
            <Link href="/cookie">Cookie</Link>
            <Link href="/note-legali">Note legali</Link>
          </nav>
        </div>
        <div className="pila piccolo" style={{ ['--gap' as string]: '6px', maxWidth: '78ch' }}>
          <p>Skinmatch non fa diagnosi: il test aiuta a scegliere i cosmetici, non sostituisce il parere di un medico. Se qualcosa ti preoccupa, parlane con un dermatologo.</p>
          <p>Alcuni link verso i negozi sono di affiliazione: se compri, Skinmatch riceve una piccola commissione, a te non costa nulla in più. In qualità di Affiliato Amazon, Skinmatch riceve un guadagno dagli acquisti idonei.</p>
        </div>
      </div>
    </footer>
  );
}
