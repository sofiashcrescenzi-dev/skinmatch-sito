import Link from 'next/link';

// LE DUE SCHEDE DELLA RIVISTA (23/10/2026): gli articoli e le nozioni dei test, «Lo sapevi che».
export default function SchedeRivista({ qui }: { qui: 'articoli' | 'nozioni' }) {
  return (
    <nav className="schede-rivista" aria-label="La Rivista">
      <Link href="/rivista" className={`chip${qui === 'articoli' ? ' attivo' : ''}`} aria-current={qui === 'articoli' ? 'page' : undefined}>Articoli</Link>
      <Link href="/rivista/lo-sapevi-che" className={`chip${qui === 'nozioni' ? ' attivo' : ''}`} aria-current={qui === 'nozioni' ? 'page' : undefined}>Lo sapevi che</Link>
    </nav>
  );
}
