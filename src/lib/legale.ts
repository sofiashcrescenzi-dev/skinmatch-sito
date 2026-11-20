// LE PAGINE LEGALI (15/10/2026): privacy, cookie, note legali. Testi in markdown, con i dati di chi
// pubblica presi da src/data/legale.json.
//
// ⚠️ NON SONO UN PARERE LEGALE: descrivono quello che il sito fa davvero (vedi worker/index.js,
// src/lib/eventi.ts, il test che salva solo sul telefono). Se il sito cambia — un'analisi del
// traffico con cookie, un modulo di contatto, la vendita diretta — questi testi vanno aggiornati
// insieme, e vanno fatti rileggere a un consulente prima dell'apertura ai pazienti (tappa 9).

import legale from '@/data/legale.json';

export const LEGALE = legale as { titolare: string; codice_fiscale?: string; indirizzo: string; partita_iva: string; email: string; aggiornato_il: string };
// ⚠️ SOLO LA PARTITA IVA, MAI IL CODICE FISCALE (20/11/2026, Federico, dalla revisione privacy: «ok allora togli codice
// fiscale»). Nessuna legge chiede di pubblicarlo e facilita i furti d'identità; la partita IVA arriva con la società.
const codici = () => (LEGALE.partita_iva ? ` (partita IVA ${LEGALE.partita_iva})` : '');
export const MANCA = '**[da completare]**';
export const completo = () => !!(LEGALE.titolare && LEGALE.indirizzo && LEGALE.email);
const v = (x: string) => x || MANCA;
const email = () => (LEGALE.email ? `[${LEGALE.email}](mailto:${LEGALE.email})` : MANCA);
export const aggiornato = () => new Date(LEGALE.aggiornato_il).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

export const PRIVACY = () => `
Questa informativa spiega quali dati personali tratta skinmatch.it, perché e con quali diritti per te, come chiede il Regolamento europeo 2016/679 (GDPR). In breve: **il test non ci manda le tue risposte**, non usiamo cookie di profilazione e non vendiamo dati a nessuno.

## Chi è il titolare

${v(LEGALE.titolare)}${codici()}, ${v(LEGALE.indirizzo)}. Per qualsiasi domanda sui tuoi dati: ${email()}.

## Le risposte al test restano sul tuo telefono

Le risposte che dai al test (compresi i dati sulla salute, come una condizione diagnosticata o una gravidanza) vengono elaborate **solo dal tuo browser** e salvate nella sua memoria locale, per farti ritrovare il risultato; se tocchi «Salva il risultato», il risultato resta lì finché non lo togli. Non arrivano ai nostri server e non le vediamo. Puoi cancellarle quando vuoi rifacendo il test o cancellando i dati del sito dalle impostazioni del browser.

## Quali dati trattiamo

- **Dati tecnici di navigazione.** Il sito è ospitato da Cloudflare, che per farlo funzionare e proteggerlo dagli attacchi tratta l'indirizzo IP e i dati tecnici della richiesta (browser, pagina, ora). Non li usiamo per sapere chi sei.
- **Conteggi d'uso, anonimi.** Contiamo quanti test vengono iniziati e finiti, quali biotipi escono e quanti clic portano ai negozi, sommati per giorno. All'ingresso contiamo anche da che tipo di fonte arriva la visita (un motore di ricerca, un social, un altro sito, diretto) e la sezione in cui entra, mai l'indirizzo completo della pagina di provenienza: per riconoscere le app (Instagram, TikTok) il browser legge il proprio user agent, che non ci viene mandato. Per non contare due volte la stessa visita il browser tiene un segno nella memoria della scheda (sessionStorage), che si cancella quando la chiudi. Il conteggio non contiene indirizzi IP, identificativi o cookie e non permette di risalire a una persona: non è un dato personale.
- **Le email che ci scrivi.** Se ci contatti, usiamo il tuo indirizzo e quello che ci scrivi solo per risponderti.
- **L'area riservata.** Chi gestisce il sito entra nell'area riservata con il proprio indirizzo email, verificato da Cloudflare.

## Perché e su quale base

- Far funzionare il sito e tenerlo sicuro: legittimo interesse del titolare (art. 6.1.f GDPR).
- Rispondere a chi ci scrive: richiesta dell'interessato e legittimo interesse (art. 6.1.b e 6.1.f).
- Gestire l'area riservata: legittimo interesse e rapporto con chi collabora al sito.

## A chi arrivano i dati

- **Cloudflare, Inc.**, che ospita il sito, il database dei conteggi e protegge l'area riservata, come responsabile del trattamento. Cloudflare può trattare dati anche negli Stati Uniti: il trasferimento avviene nel quadro dell'EU-US Data Privacy Framework e delle clausole contrattuali standard della Commissione europea.
- **Zoho**, che gestisce la casella email con cui ti rispondiamo, come responsabile del trattamento, con i dati nell'Unione europea.
- **I negozi.** Le immagini dei prodotti vengono caricate dai server dei negozi (per esempio Liki24), che ricevono il tuo indirizzo IP come per qualsiasi immagine sul web.
- Nessuno riceve i tuoi dati per fini di marketing.

## Quando vai su un negozio

I link verso i prodotti portano al sito del negozio o di una rete di affiliazione (oggi Adtraction e Awin). Da quel momento i tuoi dati li tratta il negozio, con la sua informativa e i suoi cookie, compresi quelli che servono a riconoscere che sei arrivato da Skinmatch. Leggi le informative di quei siti prima di comprare.

## Per quanto tempo

I dati tecnici restano nei sistemi di Cloudflare per il tempo previsto dalle sue regole di sicurezza; le email per il tempo necessario a risponderti e a gestire la richiesta; i conteggi anonimi senza scadenza, perché non sono dati personali.

## I tuoi diritti

Puoi chiedere di accedere ai tuoi dati, correggerli, cancellarli, limitarne il trattamento, opporti e riceverli in un formato leggibile (articoli 15-22 del GDPR), scrivendo a ${email()}. Se pensi che il trattamento non sia corretto puoi rivolgerti al Garante per la protezione dei dati personali ([garanteprivacy.it](https://www.garanteprivacy.it)).

## Minori

Skinmatch non raccoglie dati di chi fa il test. I contatti via email sono pensati per chi ha almeno 14 anni.

## Modifiche

Se il sito cambia il modo in cui tratta i dati, questa pagina si aggiorna e la data in alto cambia.
`;

export const COOKIE = () => `
**Skinmatch non usa cookie di profilazione né cookie di statistica.** Usa solo strumenti tecnici, che servono a far funzionare quello che chiedi: per questo non ti chiede il consenso con un banner.

## Cosa salva il sito su questo telefono

Non sono cookie ma la memoria del browser, e restano sul tuo dispositivo: a noi non arrivano.

- **I risultati che salvi** (memoria locale, «skinmatch-risultati»). Quando tocchi «Salva il risultato», il telefono tiene un risultato per test, con la data, per fartelo rivedere in «I tuoi risultati». Resta finché non lo togli.
- **Le risposte del test** (memoria locale, «skinmatch-test-2»). Le risposte del test in corso o dell'ultimo fatto, per riprendere da dove eri. Comprendono anche dati sulla salute, se li indichi: per questo non escono mai dal browser.
- **Le curiosità già lette** (memoria locale, «skinmatch-nozioni-viste»). Per non mostrarti due volte lo stesso «Lo sapevi che».
- **La visita già contata** (memoria della sessione, «sm-arrivo»). Un segno che si cancella quando chiudi la scheda, perché la stessa visita non si conti due volte. Il sito riceve solo la famiglia della fonte (un motore di ricerca, un social, un'IA) e la sezione d'ingresso, senza sapere chi sei.
- **La ricarica dopo un errore** (memoria della sessione, «skinmatch-ricaricata»). L'ora dell'ultima ricarica automatica, perché non si ripeta di continuo.

Al sito arrivano solo dei conteggi: test iniziati e finiti, clic verso i negozi, errori delle pagine. Mai le risposte, mai chi sei.

## Cookie tecnici

- **Cloudflare**, che ospita e protegge il sito, può usare cookie tecnici di breve durata per distinguere le persone dai programmi automatici.
- **Nell'area riservata**, un cookie di accesso per chi gestisce il sito.
- **I caratteri tipografici** sono serviti dal sito stesso: il tuo browser non contatta Google per caricarli.

## Cookie dei negozi

Quando tocchi «Vedi su…» e passi a un negozio, il negozio e la rete di affiliazione possono usare i loro cookie, anche per riconoscere che sei arrivato da Skinmatch e riconoscerci una commissione se compri. Li trovi descritti nelle cookie policy di quei siti. Le immagini dei prodotti arrivano dai server dei negozi, che non installano cookie attraverso Skinmatch.

## Perché non c'è un banner

Gli strumenti tecnici, che servono a darti un servizio che hai chiesto, non hanno bisogno del consenso (art. 122 del Codice privacy e Linee guida del Garante del 10 giugno 2021). Se un giorno aggiungessimo statistiche o altri strumenti che lo richiedono, te lo chiederemo prima, con «Accetta» e «Rifiuta» sullo stesso piano.

## Come gestirli

Qui sotto vedi cosa c'è adesso in questo browser e puoi cancellarlo con un tasto. Puoi farlo anche dalle impostazioni del browser (in genere: Impostazioni → Privacy → Dati dei siti). Cancellando perdi solo i risultati salvati e le risposte del test, che puoi rifare quando vuoi.

Per tutto il resto vale l'[informativa privacy](/privacy).
`;

export const NOTE = () => `
## Chi pubblica il sito

skinmatch.it è pubblicato da ${v(LEGALE.titolare)}${codici()}, ${v(LEGALE.indirizzo)}. Contatti: ${email()}.

## Non è una diagnosi

Skinmatch aiuta a scegliere i cosmetici e gli integratori adatti a una pelle e a un cuoio capelluto, partendo da quello che si vede allo specchio. **Non fa diagnosi, non prescrive cure e non sostituisce il parere di un medico.** Quando una risposta fa pensare a qualcosa da far vedere a un medico, il risultato lo dice per primo. I cosmetici non curano malattie della pelle; gli integratori non sostituiscono una dieta varia. In gravidanza, in allattamento o se prendi farmaci, chiedi sempre al tuo medico.

## Prodotti e prezzi

Le informazioni sui prodotti vengono dalle schede dei produttori e dai negozi. Prezzi e disponibilità sono indicativi e si aggiornano con i cataloghi dei negozi: fa fede quello che vedi sul sito del negozio al momento dell'acquisto. L'acquisto avviene sul sito del negozio, che ne è l'unico responsabile, comprese spedizione, resi e garanzie.

## I link di affiliazione

Alcuni link verso i negozi sono di affiliazione: se compri, Skinmatch riceve una piccola commissione dal negozio, **a te il prezzo non cambia**. Le commissioni non decidono quali prodotti consigliamo: il test li sceglie sul biotipo, e per ognuno mostriamo anche un'alternativa simile, di solito più economica.

## Contenuti, marchi e immagini

Testi, test, biotipi, glossario e grafica di Skinmatch sono protetti dal diritto d'autore: puoi citarli con il link alla pagina, non copiarli per intero. I marchi dei prodotti appartengono ai rispettivi titolari e sono citati solo per descrivere i prodotti. Le fotografie vengono da Pexels, con licenza Pexels, e il nome dell'autore è indicato dove compaiono.

## Responsabilità

Curiamo i contenuti con attenzione e li aggiorniamo, ma non possiamo garantire che siano sempre completi o privi di errori. Se ne trovi uno, scrivici: lo correggiamo. Skinmatch non risponde dei siti esterni a cui rimanda.

## Legge applicabile

Valgono la legge italiana e, per i consumatori, le tutele del Codice del consumo.
`;
