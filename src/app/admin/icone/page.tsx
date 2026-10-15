import Icona, { ICONE, type NomeIcona } from '@/components/Icona';

// Il catalogo delle icone (components/Icona.tsx): nome, disegno a tre misure, per copiarle dove servono.
const GRUPPI: [string, NomeIcona[]][] = [
  ['Interfaccia', ['menu', 'chiudi', 'cerca', 'filtri', 'ordina', 'indietro', 'avanti', 'su', 'giu', 'piu', 'meno', 'spunta', 'info', 'aiuto', 'attenzione', 'condividi', 'esterno', 'copia', 'scarica', 'aggiorna', 'modifica', 'elimina', 'occhio', 'lucchetto', 'campanella', 'casa', 'utente', 'cuore', 'stella', 'orologio', 'calendario', 'posta', 'telefono', 'messaggio', 'confronta']],
  ['Negozio', ['carrello', 'borsa', 'spedizione', 'codice', 'regalo', 'negozio', 'euro', 'percentuale']],
  ['Pelle, routine, prodotti', ['goccia', 'sole', 'luna', 'gravidanza', 'sensibile', 'barriera', 'luminosita', 'imperfezioni', 'foglia', 'siero', 'crema', 'tubo', 'flacone', 'capsula', 'cerotto', 'capelli', 'barba', 'specchio', 'ingredienti', 'laboratorio', 'scala', 'segno']],
];

export default function AdminIcone() {
  const tutte = Object.keys(ICONE).length;
  return (
    <div className="pila" style={{ ['--gap' as string]: '24px' }}>
      <div className="pila" style={{ ['--gap' as string]: '6px' }}>
        <h1 className="titolo-2">Le icone</h1>
        <p className="piccolo" style={{ maxWidth: '70ch' }}>{tutte} icone con lo stesso disegno: griglia 24, tratto 1,75, estremi tondi, colore del testo. Nel codice: <code>&lt;Icona nome=&quot;spedizione&quot; /&gt;</code>; 18 px nel testo, 22-24 nei bottoni. Sul telefono un bottone con solo l&apos;icona deve essere almeno 44 × 44 e avere un nome (etichetta).</p>
      </div>
      {GRUPPI.map(([g, nomi]) => (
        <section key={g} className="pila" style={{ ['--gap' as string]: '10px' }}>
          <h2 className="titolo-3">{g}</h2>
          <div className="adm-icone">
            {nomi.map((n) => (
              <div key={n} className="carta adm-icona">
                <span className="adm-icona-tre"><Icona nome={n} size={18} /><Icona nome={n} size={24} /><Icona nome={n} size={36} spessore={1.5} /></span>
                <code>{n}</code>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
