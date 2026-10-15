import './foto-prodotto.css';

// La foto di un prodotto (Zeno, 15/10/2026). Tre varianti:
// - 'carta': la carta prodotto (catalogo, risultato, biotipi). Il packshot sta su una carnagione
//   tenue e il bianco sparisce col multiply; sotto, un'ombra d'appoggio.
// - 'pagina': la scheda del prodotto. Il packshot su una lastra bianca, dietro il segno di
//   Skinmatch (due mezzelune sfalsate) nel tono del prodotto; al passaggio le due metà si incontrano.
// - 'mini': il confronto. Come la carta, senza ombra.
// Il tono (1-6) è una delle sei carnagioni del marchio, scelto dal prodotto (vedi tonoProdotto).
// Senza foto: il segno vero, con l'alt come etichetta. Tutto CSS, niente immagini in più.

export type Tono = 1 | 2 | 3 | 4 | 5 | 6;

const LATO: Record<'carta' | 'pagina' | 'mini', number> = { carta: 208, pagina: 600, mini: 192 };

// Il tono dalla categoria: un colore fisso per ogni famiglia, così in catalogo si leggono a colpo
// d'occhio. Mai dal prezzo: una carnagione non deve mai sembrare «più cara» di un'altra.
const TONO_CATEGORIA: Record<string, Tono> = {
  detergenti: 1, cerotti: 1,
  creme: 2,
  sieri: 3,
  attivi: 4,
  capelli: 5, shampoo: 5, barba: 5,
  integratori: 6,
};
export function tonoProdotto(categoria?: string | null): Tono {
  return (categoria && TONO_CATEGORIA[categoria]) || 2;
}

export default function FotoProdotto({
  src, alt, variante, tono = 2, priorita = false,
}: { src?: string; alt: string; variante: 'carta' | 'pagina' | 'mini'; tono?: Tono; priorita?: boolean }) {
  const classe = `fp fp-${variante} fp-t${tono}`;
  const segno = (
    <span className="fp-segno" aria-hidden="true"><span /><span /></span>
  );

  if (!src) {
    return <span className={`${classe} fp-vuota`} role="img" aria-label={alt}>{segno}</span>;
  }

  const lato = LATO[variante];
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="fp-img"
      src={src}
      alt={alt}
      width={lato}
      height={lato}
      decoding="async"
      loading={priorita ? 'eager' : 'lazy'}
      fetchPriority={priorita ? 'high' : undefined}
    />
  );

  if (variante === 'pagina') {
    return <span className={classe}>{segno}<span className="fp-lastra">{img}</span></span>;
  }
  return (
    <span className={classe}>
      {variante === 'carta' && <span className="fp-ombra" aria-hidden="true" />}
      {img}
    </span>
  );
}
