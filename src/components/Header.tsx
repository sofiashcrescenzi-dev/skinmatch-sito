import Link from 'next/link';

export default function Header() {
  return (
    <header className="border-b" style={{ borderColor: 'var(--border)' }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-semibold text-lg">
          SkinMatch
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link href="/catalogo">Catalogo</Link>
          <Link href="/catalogo?kbeauty=1">K-beauty</Link>
          <Link
            href="/test"
            className="px-4 py-2 rounded-full text-white"
            style={{ background: 'var(--accent)' }}
          >
            Trova il tuo SkinMatch
          </Link>
        </nav>
      </div>
    </header>
  );
}
