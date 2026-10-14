import { ConTermini } from '@/components/Termini';

// Un markdown piccolo, per gli articoli della Rivista: titoli (## e ###), paragrafi, elenchi,
// citazioni, **grassetto**, *corsivo* e [link](indirizzo). I termini del glossario si accendono
// da soli nel testo semplice.
function inline(t: string, k: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let ultimo = 0, i = 0;
  for (const m of t.matchAll(re)) {
    if (m.index! > ultimo) out.push(<ConTermini key={`${k}-${i++}`} testo={t.slice(ultimo, m.index)} />);
    if (m[1]) out.push(<strong key={`${k}-${i++}`}>{m[1]}</strong>);
    else if (m[2]) out.push(<em key={`${k}-${i++}`}>{m[2]}</em>);
    else {
      const esterno = /^https?:/.test(m[4]) && !m[4].includes('skinmatch.it');
      out.push(<a key={`${k}-${i++}`} href={m[4]} {...(esterno ? { target: '_blank', rel: 'noopener' } : {})}>{m[3]}</a>);
    }
    ultimo = m.index! + m[0].length;
  }
  if (ultimo < t.length) out.push(<ConTermini key={`${k}-${i++}`} testo={t.slice(ultimo)} />);
  return out;
}

export default function Markdown({ testo }: { testo: string }) {
  const blocchi = testo.replace(/\r/g, '').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  return (
    <div className="articolo">
      {blocchi.map((b, i) => {
        const k = `b${i}`;
        if (b.startsWith('### ')) return <h3 key={k}>{inline(b.slice(4), k)}</h3>;
        if (b.startsWith('## ')) return <h2 key={k}>{inline(b.slice(3), k)}</h2>;
        if (b.startsWith('# ')) return <h2 key={k}>{inline(b.slice(2), k)}</h2>;
        if (b.startsWith('> ')) return <blockquote key={k}>{inline(b.replace(/^> ?/gm, ''), k)}</blockquote>;
        const righe = b.split('\n');
        if (righe.every((r) => /^[-*] /.test(r))) return <ul key={k}>{righe.map((r, j) => <li key={j}>{inline(r.slice(2), `${k}-${j}`)}</li>)}</ul>;
        if (righe.every((r) => /^\d+[.)] /.test(r))) return <ol key={k}>{righe.map((r, j) => <li key={j}>{inline(r.replace(/^\d+[.)] /, ''), `${k}-${j}`)}</li>)}</ol>;
        return <p key={k}>{inline(righe.join(' '), k)}</p>;
      })}
    </div>
  );
}
