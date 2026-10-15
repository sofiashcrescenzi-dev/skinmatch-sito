import Markdown from '@/components/Markdown';
import { aggiornato, completo } from '@/lib/legale';

export default function PaginaLegale({ titolo, testo }: { titolo: string; testo: string }) {
  return (
    <main className="contenitore stretto sezione pila" style={{ ['--gap' as string]: '20px' }}>
      <header className="pila" style={{ ['--gap' as string]: '10px' }}>
        <span className="etichetta">Skinmatch</span>
        <h1 className="sopratitolo" style={{ fontSize: 'clamp(32px, 5vw, 48px)' }}>{titolo}</h1>
        <span className="piccolo">Aggiornata il {aggiornato()}</span>
        {!completo() && <p className="avviso">Alcuni dati di chi pubblica il sito sono ancora da completare.</p>}
      </header>
      <Markdown testo={testo} semplice />
    </main>
  );
}
