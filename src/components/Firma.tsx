'use client';

import Link from 'next/link';
import { CHI_SIAMO, dataLunga, type Revisione } from '@/lib/dati';
import { Ritratto, useAnteprima } from '@/components/Persone';

// LA FIRMA DEGLI ARTICOLI (7/11/2026, voto d-nome: «redatti e controllati da dr.ssa Sofia Crescenzi, con il suo
// cerchietto con la sua foto, cliccabile, che rimanda al chi siamo»). Il nome di Sofia compare solo con la sua revisione
// (admin › Revisioni); «Redatto e controllato» solo per i pezzi scritti da lei, gli altri «Redazione Skinmatch ·
// controllato da». Con /rivista/…#anteprima si vede com'è, prima della revisione. Sta in testa all'articolo, lontana
// dai prodotti (codice deontologico).
export default function Firma({ firma, rev, pubblicato }: { firma?: 'redazione' | 'sofia'; rev: Revisione | null; pubblicato: string }) {
  const anteprima = useAnteprima();
  const sofia = CHI_SIAMO.persone.find((p) => p.id === 'sofia');
  if (!sofia || (!rev && !anteprima)) return <span className="piccolo">Redazione Skinmatch · {dataLunga(pubblicato)}</span>;
  const quando = rev ? dataLunga(rev.data) : null;
  return (
    <div className="firma">
      <Link href="/chi-siamo#sofia" aria-label={`${sofia.nome}, chi siamo`}><Ritratto p={sofia} lato={44} /></Link>
      <span className="piccolo">
        {firma === 'sofia'
          ? <>Redatto e controllato da <Link className="link" href="/chi-siamo#sofia">{sofia.nome}</Link>, medico estetico{quando && ` · ${quando}`}</>
          : <>Redazione Skinmatch · controllato da <Link className="link" href="/chi-siamo#sofia">{sofia.nome}</Link>, medico estetico{quando && `, il ${quando}`}</>}
        {!rev && ' · anteprima, prima della revisione'}
      </span>
    </div>
  );
}
