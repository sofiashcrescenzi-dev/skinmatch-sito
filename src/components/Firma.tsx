'use client';

import { CHI_SIAMO, dataLunga, type Revisione } from '@/lib/dati';
import { Ritratto } from '@/components/Persone';

// LA FIRMA DEGLI ARTICOLI. 7/11/2026 (voto d-nome): «redatti e controllati da dr.ssa Sofia Crescenzi, con il suo cerchietto
// con la sua foto». 15/11/2026, Federico: «quando esce redatto da Sofia o da redazione con Sofia, deve uscire la sua foto in
// piccolo, con nome dr.ssa Sofia Crescenzi e il suo link al sito». Quindi: con la firma «sofia» o «redazione» si vedono
// sempre la foto, il nome e il link a sofiacrescenzi.it; «controllato il…» solo quando c'è la sua revisione in admin ›
// Revisioni (non si scrive che ha controllato quello che non ha controllato). Senza firma resta «Redazione Skinmatch».
// Sta in testa all'articolo, lontana dai prodotti (codice deontologico).
export default function Firma({ firma, rev, pubblicato }: { firma?: 'redazione' | 'sofia'; rev: Revisione | null; pubblicato: string }) {
  const sofia = CHI_SIAMO.persone.find((p) => p.id === 'sofia');
  if (!sofia || !firma) return <span className="piccolo">Redazione Skinmatch · {dataLunga(pubblicato)}</span>;
  const sito = sofia.link?.url ? sofia.link.url.replace(/^https?:\/\//i, 'https://') : '';
  const dominio = sito ? sito.replace(/^https:\/\/(www\.)?/, '').replace(/\/.*$/, '') : '';
  const nome = sito
    ? <a className="link" href={sito} target="_blank" rel="noopener">{sofia.nome}</a>
    : <span>{sofia.nome}</span>;
  return (
    <div className="firma">
      {sito
        ? <a href={sito} target="_blank" rel="noopener" aria-label={`${sofia.nome}, il suo sito`}><Ritratto p={sofia} lato={40} /></a>
        : <Ritratto p={sofia} lato={40} />}
      <span className="piccolo">
        {firma === 'sofia' ? <>Redatto da {nome}</> : <>Redazione Skinmatch con {nome}</>}, medico estetico
        {rev ? ` · controllato il ${dataLunga(rev.data)}` : ` · ${dataLunga(pubblicato)}`}
        {dominio && <> · <a className="link" href={sito} target="_blank" rel="noopener">{dominio} ↗</a></>}
      </span>
    </div>
  );
}
