import Link from 'next/link';

// GLI INVITI DI SKINMATCH (scelti da Federico e Sofia il 15/10/2026 nell'artifact «Inviti di Skinmatch»):
// al posto di «testo + freccetta», segni presi dall'identità Fototipi. Si muovono solo con
// transform e al passaggio o al tocco; con «riduci movimento» restano fermi e completi.

// i1 · Il segno che si chiude: le due mezze lune si uniscono. Per «Fai il test».
export function Invito({ href, children, scuro }: { href: string; children: React.ReactNode; scuro?: boolean }) {
  return (
    <Link href={href} className={`invito${scuro ? ' scuro' : ''}`}>
      <span className="s" aria-hidden="true"><i /><i /></span>
      {children}
    </Link>
  );
}

// i3 · La scala che si stende: i sei fototipi si allargano sotto il testo. Per i link che portano avanti.
export function Stendi({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="stendi">
      {children}
      <span className="barra" aria-hidden="true"><i /><i /><i /><i /><i /><i /></span>
    </Link>
  );
}

// i5 · La luna che si riempie: il tempo del percorso. Dentro una carta con classe «con-luna».
export function Luna({ children }: { children: React.ReactNode }) {
  return (
    <span className="tempo">
      <span className="luna" aria-hidden="true"><i /><i /></span>
      {children}
    </span>
  );
}
