import Link from 'next/link';
import { CHI_SIAMO, dataLunga, revisione, type Biotipo } from '@/lib/dati';
import { Ritratto } from '@/components/Persone';

// IL CONSIGLIO DEL MEDICO (7/11/2026, voto d-compat: «una parte per ogni biotipo con scritto: Consiglio del medico»).
// Il testo sta nel biotipo (admin › Biotipi); compare solo se Sofia l'ha approvato così com'è (admin › Revisioni).
export default function ConsiglioMedico({ b }: { b: Biotipo }) {
  const rev = revisione(`consiglio:${b.id}`);
  const sofia = CHI_SIAMO.persone.find((p) => p.id === 'sofia');
  if (!b.consiglio_medico || !rev) return null;
  return (
    <aside className="consiglio-medico" aria-label="Consiglio del medico">
      <b className="etichetta">Consiglio del medico →</b>
      <p className="testo">{b.consiglio_medico}</p>
      {sofia && (
        <Link href="/chi-siamo#sofia" className="firma">
          <Ritratto p={sofia} lato={36} />
          <span className="piccolo">{sofia.nome}, medico estetico · {dataLunga(rev.data)}</span>
        </Link>
      )}
    </aside>
  );
}
