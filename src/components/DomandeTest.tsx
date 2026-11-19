// LE DOMANDE DI CHI CERCA UN TEST DELLA PELLE (19/11/2026, voto r-test). Sono quelle che Google mostra sotto «che tipo
// di pelle ho test» («Come faccio a sapere che tipo di pelle ho?», «Dove posso trovare un'analisi gratuita della pelle?»).
// Le mostra la pagina del test sotto la scelta del percorso; il layout del test le dà a Google come FAQPage.
// ⚠️ Niente promesse cliniche: il test non è una diagnosi, e lo diciamo.

export const DOMANDE_TEST = [
  {
    domanda: 'Come faccio a sapere che tipo di pelle ho?',
    risposta: 'Guarda la pelle a metà giornata, senza crema. Se è lucida solo sulla fronte, sul naso e sul mento è mista; se è lucida dappertutto, con i pori evidenti, è grassa; se tira e si squama è secca; se tira ma luccica è grassa e disidratata. Il test fa queste domande una alla volta e mette insieme le risposte.',
  },
  {
    domanda: 'Il test della pelle è gratis? Devo registrarmi?',
    risposta: 'È gratis e senza registrazione. Le risposte restano sul tuo telefono: al sito arriva solo il conteggio dei test fatti, non quello che hai risposto.',
  },
  {
    domanda: 'Quanto è affidabile un test della pelle online?',
    risposta: 'Riconosce il tipo di pelle da quello che vedi allo specchio, con le domande che il medico fa in una visita. Non è una diagnosi: dermatite atopica, psoriasi e rosacea le indichi tu, se te le ha diagnosticate un medico, e il test sceglie prodotti delicati che accompagnano la cura.',
  },
  {
    domanda: 'In cosa è diverso dai test delle marche?',
    risposta: 'I test delle marche consigliano i loro prodotti. Skinmatch non produce cosmetici: sceglie fra prodotti di molte marche, dalla farmacia alla cosmetica coreana, e per ognuno ti dà un’alternativa simile, di solito più economica, con il prezzo nei negozi.',
  },
];

export default function DomandeTest() {
  return (
    <section className="pila" style={{ ['--gap' as string]: '14px', maxWidth: '68ch' }} aria-labelledby="domande-test">
      <h2 id="domande-test" className="titolo-2">Le domande sul test</h2>
      {DOMANDE_TEST.map((d) => (
        <details key={d.domanda} className="carta">
          <summary className="titolo-3" style={{ cursor: 'pointer' }}>{d.domanda}</summary>
          <p className="testo" style={{ marginTop: 8 }}>{d.risposta}</p>
        </details>
      ))}
    </section>
  );
}
