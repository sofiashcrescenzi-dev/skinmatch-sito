import type { Metadata } from 'next';
import Link from 'next/link';
import Foto from '@/components/Foto';
import { LEGALE } from '@/lib/legale';
import { Invito } from '@/components/Inviti';

// CHI SIAMO (15/10/2026). ⚠️ Il medico che ha costruito il metodo non è nominato e non compare in
// foto: il codice deontologico chiede che l'immagine di un medico non promuova prodotti commerciali
// (tappa 9 delle «Tappe di Skinmatch»). Se Sofia decide diversamente, si cambia qui.

export const metadata: Metadata = {
  title: 'Chi siamo: perché esiste Skinmatch e come sceglie i prodotti',
  description: 'Skinmatch è nato dalla domanda che i medici si sentono fare ogni giorno: «e io, che crema uso?». Le nostre regole, come scegliamo i prodotti e come guadagniamo.',
  alternates: { canonical: '/chi-siamo' },
};

const REGOLE: [string, string][] = [
  ['Non facciamo diagnosi', 'Il test aiuta a scegliere i cosmetici. Quando una risposta fa pensare a qualcosa da far vedere a un medico, il risultato lo dice per primo e lascia solo prodotti delicati.'],
  ['Domande su quello che vedi', 'Non ti chiediamo «che pelle hai?»: ti chiediamo com\'è la fronte a metà giornata, se la pelle tira dopo la detersione, quanto dura un rossore. Così il risultato non dipende da come pensi di essere.'],
  ['Un\'alternativa simile', 'Accanto al prodotto consigliato, quando c\'è, uno simile: stesso passaggio, stesso attivo principale, formato vicino. Di solito costa meno, con una percentuale di attivi più bassa. Una buona routine non deve essere la più cara.'],
  ['Le tue risposte restano tue', 'Il test gira sul tuo telefono: le risposte, anche quelle sulla salute, non arrivano ai nostri server. Contiamo solo quanti test vengono fatti.'],
  ['Diciamo come guadagniamo', 'Alcuni link ai negozi sono di affiliazione: se compri, il negozio ci riconosce una piccola commissione e a te il prezzo non cambia. Nessun marchio paga per comparire.'],
];

export default function ChiSiamo() {
  return (
    <main className="contenitore sezione pila" style={{ ['--gap' as string]: 'clamp(36px, 6vw, 72px)' }}>
      <header style={{ display: 'grid', gap: 'clamp(20px, 4vw, 56px)', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', alignItems: 'center' }}>
        <div className="pila" style={{ ['--gap' as string]: '14px' }}>
          <span className="etichetta">Chi siamo</span>
          <h1 className="sopratitolo">«E io, che crema uso?»</h1>
          <p className="intro">È la domanda che chi fa il medico della pelle si sente fare più spesso, di solito sulla porta, a visita finita. La risposta onesta è: dipende. Dalla pelle, dal cuoio capelluto, da quello che hai già provato, da quanto vuoi spendere. Skinmatch è il tentativo di dare quella risposta a tutti, con lo stesso metodo di una visita e senza promettere quello che un cosmetico non può fare.</p>
        </div>
        <Foto nome="test-completo" priorita style={{ aspectRatio: '4 / 5', maxHeight: 600 }} sizes="(max-width: 760px) 100vw, 45vw" credito />
      </header>

      <section className="pila stretto" style={{ ['--gap' as string]: '14px' }}>
        <h2 className="titolo-2">Come è nato</h2>
        <div className="testo pila" style={{ ['--gap' as string]: '12px' }}>
          <p>Skinmatch nasce in Italia nel 2026, dall&apos;incontro fra un medico estetico e chi progetta prodotti digitali. In studio le domande erano sempre le stesse, e le risposte trovate online quasi sempre sbagliate per la persona che le cercava: classifiche uguali per tutti, «la crema migliore» senza dire per chi, prodotti scelti perché pagano di più.</p>
          <p>Allora abbiamo messo per iscritto quello che in una visita si fa senza pensarci: guardare la pelle prima di chiedere, distinguere una pelle grassa da una pelle disidratata, capire quando un rossore è solo sensibilità e quando va visto dal vivo. Ne sono uscite le domande del test, i biotipi e le regole con cui scegliamo i prodotti.</p>
          <p>Il metodo lo rivede un medico estetico, che non compare sul sito e non presta il suo nome ai prodotti: il marchio è Skinmatch, il medico consiglia in studio.</p>
        </div>
      </section>

      <section className="pila" style={{ ['--gap' as string]: '18px' }}>
        <h2 className="titolo-2">Cinque regole che non cambiamo</h2>
        <ol className="griglia" style={{ ['--min' as string]: '240px', listStyle: 'none', padding: 0, margin: 0 }}>
          {REGOLE.map(([t, d], i) => (
            <li key={t} className="carta pila" style={{ ['--gap' as string]: '8px' }}>
              <span className="titolo" style={{ fontSize: 34, lineHeight: 1, color: 'var(--terra)' }}>{i + 1}</span>
              <span className="titolo-3">{t}</span>
              <span className="piccolo" style={{ fontSize: 15 }}>{d}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="pila stretto" style={{ ['--gap' as string]: '14px' }}>
        <h2 className="titolo-2">Come scegliamo i prodotti</h2>
        <div className="testo pila" style={{ ['--gap' as string]: '12px' }}>
          <p>Ogni prodotto del catalogo ha una scheda con le stesse informazioni: per quale pelle è, per cosa lavora, se va bene in gravidanza e sulle pelli sensibili, in che fascia di prezzo sta. Le leggiamo dalle schede dei produttori e dagli ingredienti (l&apos;INCI), non dalle pubblicità. Il test incrocia la scheda con il tuo biotipo e sceglie il più adatto per ogni passaggio della routine.</p>
          <p>Il catalogo copre la dermocosmesi da farmacia, la cosmetica coreana, i marchi di ricerca e quelli di fascia alta, perché ogni biotipo trovi qualcosa in ogni budget. Quando un prodotto non va più bene, lo togliamo.</p>
        </div>
      </section>

      <section className="pila stretto" style={{ ['--gap' as string]: '14px' }}>
        <h2 className="titolo-2">Chi c&apos;è dietro</h2>
        <div className="testo pila" style={{ ['--gap' as string]: '12px' }}>
          <p>Una piccola redazione: chi cura il metodo e il catalogo, chi scrive la <Link className="link" href="/rivista">Rivista</Link>, chi controlla che il sito funzioni e si trovi. Lavoriamo anche con strumenti di intelligenza artificiale, per tenere aggiornati prezzi e schede e per scrivere le prime bozze; ogni testo che riguarda la salute lo rilegge una persona.</p>
          <p>Le fotografie vengono da <a className="link" href="https://www.pexels.com" target="_blank" rel="noopener">Pexels</a>: pelle vera, poco ritoccata, di età e carnagioni diverse. Il nome di chi le ha scattate è sulle foto.</p>
          <p>Hai una domanda, una correzione, un prodotto da segnalarci? {LEGALE.email ? <>Scrivici a <a className="link" href={`mailto:${LEGALE.email}`}>{LEGALE.email}</a>.</> : <>L&apos;indirizzo per scriverci arriva a giorni.</>}</p>
        </div>
      </section>

      <section className="carta" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="pila" style={{ ['--gap' as string]: '4px' }}>
          <span className="titolo-3">Il modo migliore per conoscerci</span>
          <span className="piccolo">Tre minuti di domande, un biotipo, una routine.</span>
        </div>
        <Invito href="/test">Fai il test</Invito>
      </section>
    </main>
  );
}
