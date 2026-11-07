// LA RICERCA AL CENTRO (18/10/2026, Federico: «su tutti i siti dove manca aggiungi una funzione centrale di
// ricerca, come un blocco di testo»). Una frase della pagina, non una scatola: «Cerco ______», e il campo è
// la riga su cui si scrive. Porta al catalogo con ?q=, dove la ricerca capisce la frase (components/Catalogo).
// ⚠️ UN MODULO VERO, SENZA JAVASCRIPT: action="/catalogo" e method="get" bastano.
const ESEMPI = ['niacinamide', 'crema per pelle secca', 'solare per pelle sensibile', 'retinolo', 'shampoo antiforfora'];

// ⚠️ SENZA IL NUMERO DEI PRODOTTI IN HOME (7/11/2026, voto l-home): «fra 854 prodotti» è il linguaggio di un comparatore
export default function RicercaCentrale({ quanti }: { quanti?: number }) {
  return (
    <form className="ricerca-centrale" action="/catalogo" method="get" role="search">
      <label htmlFor="rc-q" className="rc-cerco">Cerco</label>
      <input id="rc-q" name="q" type="search" placeholder="un prodotto" enterKeyHint="search" autoComplete="off" aria-describedby="rc-esempi" />
      <button type="submit">Cerca</button>
      <p id="rc-esempi" className="rc-esempi">
        {quanti ? `Fra ${quanti} prodotti. ` : ''}Per esempio{' '}
        {ESEMPI.map((e, i) => (
          <span key={e}>{i ? ', ' : ''}<a href={`/catalogo?q=${encodeURIComponent(e)}`}>{e}</a></span>
        ))}.
      </p>
    </form>
  );
}
