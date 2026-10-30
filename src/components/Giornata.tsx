'use client';

import FotoProdotto from '@/components/FotoProdotto';
import { euro } from '@/lib/formato';
import type { Giornata as G, Passo } from '@/lib/giornata';

// LA TUA GIORNATA: la fascia dall'alba alla notte con i prodotti all'ora in cui si usano, e sotto quelli che non sono
// di ogni giorno. Il fondo va dai toni chiari ai toni scuri della scala dei fototipi: la luce del giorno, col marchio.
// Ogni foto porta al suo passaggio più sotto. Vedi lib/giornata.ts.
const ORE = [6, 9, 12, 15, 18, 21, 24];

function Bolla({ p, piccola, k }: { p: Passo; piccola?: boolean; k?: number }) {
  const x = p.scelta.consigliato.prodotto;
  return (
    <a href={`#passo-${p.scelta.passaggio.id}`} className={`gi-bolla${p.orario.ogni ? ' gi-ogni' : ''}${piccola ? ' gi-piccola' : ''}`}
      title={`${k ? `${k} · ` : ''}${p.scelta.passaggio.nome}${p.orario.ogni ? ` (${p.orario.ogni})` : ''}: ${x.brand} ${x.name}`}>
      <FotoProdotto src={x.image} alt="" variante="mini" />
      {k ? <b aria-hidden="true">{k}</b> : null}
    </a>
  );
}

export default function Giornata({ g }: { g: G }) {
  const mattina = g.momenti.find((m) => m.id === 'mattina')?.passi.length || 0;
  const sera = g.momenti.find((m) => m.id === 'sera')?.passi.length || 0;
  const risparmio = g.costoTop - g.costoAlternative;
  return (
    <section className="gi pila" aria-labelledby="gi-titolo" style={{ ['--gap' as string]: '18px' }}>
      <div className="pila" style={{ ['--gap' as string]: '6px' }}>
        <span className="etichetta">Il resoconto</span>
        <h2 id="gi-titolo" className="titolo-2">La tua giornata</h2>
      </div>

      <div className="gi-fascia" role="img" aria-label={g.momenti.filter((m) => m.passi.length).map((m) => `${m.nome}, verso le ${m.ora}: ${m.passi.map((p) => p.scelta.passaggio.nome.toLowerCase()).join(', ')}`).join('. ')}>
        <div className="gi-cielo" aria-hidden="true" />
        <ol className="gi-ore" aria-hidden="true">{ORE.map((h) => <li key={h} style={{ left: `${((h - 6) / 18) * 100}%` }}>{h === 24 ? '0' : h}</li>)}</ol>
        {/* tre colonne fisse, anche vuote: la mattina resta a sinistra e la sera a destra, come sulla fascia delle ore */}
        {g.momenti.map((m) => (
          <div key={m.id} className={`gi-momento gi-${m.id}${m.passi.length ? '' : ' gi-vuoto'}`}>
            {m.passi.length > 0 && <>
              <span className="gi-quando"><b>{m.ora}</b>{m.nome.replace(/^(La|A) /, '')}</span>
              <div className="gi-pila">{m.passi.map((p, i) => <Bolla key={p.scelta.passaggio.id} p={p} k={i + 1} />)}</div>
            </>}
          </div>
        ))}
      </div>
      <p className="piccolo">Gli orari sono indicativi. I numeri dicono in che ordine stenderli: prima il più leggero, la protezione solare per ultima. Tocca un prodotto per vederlo.</p>

      {g.settimana.length > 0 && (
        <div className="pila" style={{ ['--gap' as string]: '10px' }}>
          <span className="titolo-3" style={{ fontSize: 17 }}>Non tutti i giorni</span>
          <ul className="gi-settimana">
            {g.settimana.map((p) => (
              <li key={p.scelta.passaggio.id}><Bolla p={p} piccola /><span><b>{p.scelta.passaggio.nome}</b><small>{p.orario.ogni}</small></span></li>
            ))}
          </ul>
        </div>
      )}

      <dl className="gi-numeri">
        {mattina > 0 && <div><dt>La mattina</dt><dd>{mattina} {mattina === 1 ? 'prodotto' : 'prodotti'}</dd></div>}
        {sera > 0 && <div><dt>La sera</dt><dd>{sera} {sera === 1 ? 'prodotto' : 'prodotti'}</dd></div>}
        {g.minuti > 0 && <div><dt>Al giorno</dt><dd>circa {g.minuti} minuti</dd></div>}
        <div><dt>Con le scelte top</dt><dd>{euro(g.costoTop)}</dd></div>
        {g.conAlternativa > 0 && risparmio > 0.5 && <div><dt>Con le alternative</dt><dd>{euro(g.costoAlternative)}</dd></div>}
      </dl>
    </section>
  );
}
