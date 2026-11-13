import { ConTermini } from '@/components/Termini';

// Un markdown piccolo, per gli articoli della Rivista: titoli (## e ###), paragrafi, elenchi,
// citazioni, tabelle, **grassetto**, *corsivo* e [link](indirizzo). I termini del glossario si accendono
// da soli nel testo semplice.
// ⚠️ LE TABELLE (13/11/2026, Federico su «L'ordine giusto dei prodotti»: «cos'è sto schifo di segni negli articoli?»).
// Il lettore di prima conosceva solo blocchi separati da una riga vuota, e una tabella diventava un paragrafo di «|» e
// «---». Ora si legge riga per riga: una fila di righe che cominciano con «|» è una tabella (la riga dei trattini si
// salta), e titoli, elenchi e citazioni valgono anche se attaccati al testo senza riga vuota. Sul telefono ogni riga
// della tabella diventa una scheda con le etichette delle colonne (globals.css, .tabella-articolo).
function inline(t: string, k: string, semplice = false): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let ultimo = 0, i = 0;
  for (const m of t.matchAll(re)) {
    if (m.index! > ultimo) out.push(semplice ? t.slice(ultimo, m.index) : <ConTermini key={`${k}-${i++}`} testo={t.slice(ultimo, m.index)} />);
    if (m[1]) out.push(<strong key={`${k}-${i++}`}>{m[1]}</strong>);
    else if (m[2]) out.push(<em key={`${k}-${i++}`}>{m[2]}</em>);
    else {
      const esterno = /^https?:/.test(m[4]) && !m[4].includes('skinmatch.it');
      out.push(<a key={`${k}-${i++}`} href={m[4]} {...(esterno ? { target: '_blank', rel: 'noopener' } : {})}>{m[3]}</a>);
    }
    ultimo = m.index! + m[0].length;
  }
  if (ultimo < t.length) out.push(semplice ? t.slice(ultimo) : <ConTermini key={`${k}-${i++}`} testo={t.slice(ultimo)} />);
  return out;
}

type Blocco =
  | { t: 'h2' | 'h3' | 'p' | 'citazione'; testo: string }
  | { t: 'ul'; voci: string[] }
  | { t: 'ol'; voci: string[] }
  | { t: 'tabella'; testa: string[]; righe: string[][] };

const celle = (r: string) => r.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
const separatore = (r: string) => /^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(r.trim());
const PUNTO = /^[-*] /;
const NUMERO = /^\d+[.)] /;

export function blocchi(testo: string): Blocco[] {
  const righe = testo.replace(/\r/g, '').split('\n');
  const out: Blocco[] = [];
  let par: string[] = [];
  const chiudi = () => { if (par.length) out.push({ t: 'p', testo: par.join(' ') }); par = []; };
  for (let i = 0; i < righe.length; i++) {
    const r = righe[i].trim();
    if (!r) { chiudi(); continue; }
    if (/^#{1,2} /.test(r)) { chiudi(); out.push({ t: 'h2', testo: r.replace(/^#+ /, '') }); continue; }
    if (/^#{3,4} /.test(r)) { chiudi(); out.push({ t: 'h3', testo: r.replace(/^#+ /, '') }); continue; }
    if (r.startsWith('|')) {
      chiudi();
      const fila: string[] = [];
      while (i < righe.length && righe[i].trim().startsWith('|')) fila.push(righe[i++].trim());
      i--;
      const utili = fila.filter((x) => !separatore(x));
      const conTesta = fila.length > 1 && separatore(fila[1]);
      out.push({ t: 'tabella', testa: conTesta ? celle(utili[0]) : [], righe: (conTesta ? utili.slice(1) : utili).map(celle) });
      continue;
    }
    if (r.startsWith('>')) {
      chiudi();
      const c: string[] = [];
      while (i < righe.length && righe[i].trim().startsWith('>')) c.push(righe[i++].trim().replace(/^> ?/, ''));
      i--;
      out.push({ t: 'citazione', testo: c.join(' ') });
      continue;
    }
    if (PUNTO.test(r) || NUMERO.test(r)) {
      chiudi();
      const tipo = PUNTO.test(r) ? 'ul' : 'ol';
      const re = tipo === 'ul' ? PUNTO : NUMERO;
      const voci: string[] = [];
      while (i < righe.length && righe[i].trim()) {
        const x = righe[i].trim();
        if (re.test(x)) voci.push(x.replace(re, ''));
        else if (/^\s/.test(righe[i]) && voci.length) voci[voci.length - 1] += ' ' + x;   // la voce che va a capo
        else break;
        i++;
      }
      i--;
      out.push(tipo === 'ul' ? { t: 'ul', voci } : { t: 'ol', voci });
      continue;
    }
    par.push(r);
  }
  chiudi();
  return out;
}

// `semplice`: senza la «i» del glossario (le pagine legali)
export default function Markdown({ testo, semplice = false }: { testo: string; semplice?: boolean }) {
  const il = (x: string, k: string) => inline(x, k, semplice);
  return (
    <div className="articolo">
      {blocchi(testo).map((b, i) => {
        const k = `b${i}`;
        if (b.t === 'h2') return <h2 key={k}>{il(b.testo, k)}</h2>;
        if (b.t === 'h3') return <h3 key={k}>{il(b.testo, k)}</h3>;
        if (b.t === 'citazione') return <blockquote key={k}>{il(b.testo, k)}</blockquote>;
        if (b.t === 'ul' || b.t === 'ol') {
          const voci = b.voci.map((v, j) => <li key={j}>{il(v, `${k}-${j}`)}</li>);
          return b.t === 'ul' ? <ul key={k}>{voci}</ul> : <ol key={k}>{voci}</ol>;
        }
        if (b.t === 'tabella') {
          return (
            <div key={k} className="tabella-articolo">
              <table>
                {b.testa.length > 0 && <thead><tr>{b.testa.map((c, j) => <th key={j} scope="col">{il(c, `${k}-h${j}`)}</th>)}</tr></thead>}
                <tbody>
                  {b.righe.map((r, j) => (
                    <tr key={j}>{r.map((c, n) => <td key={n} data-etichetta={b.testa[n] || undefined}>{il(c, `${k}-${j}-${n}`)}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return <p key={k}>{il(b.testo, k)}</p>;
      })}
    </div>
  );
}
