// LE PAGINE LEGALI (15/10/2026): privacy, cookie, note legali. Testi in markdown, con i dati di chi
// pubblica presi da src/data/legale.json.
//
// ⚠️ NON SONO UN PARERE LEGALE: descrivono quello che il sito fa davvero (vedi worker/index.js,
// src/lib/eventi.ts, il test che salva solo sul telefono). Se il sito cambia — un'analisi del
// traffico con cookie, un modulo di contatto, la vendita diretta — questi testi vanno aggiornati
// insieme, e vanno fatti rileggere a un consulente prima dell'apertura ai pazienti (tappa 9).

import legale from '@/data/legale.json';

export const LEGALE = legale as { titolare: string; indirizzo: string; partita_iva: string; email: string; aggiornato_il: string };
export const MANCA = '**[da completare]**';
export const completo = () => !!(LEGALE.titolare && LEGALE.indirizzo && LEGALE.email);
const v = (x: string) => x || MANCA;
const email = () => (LEGALE.email ? `[${LEGALE.email}](mailto:${LEGALE.email})` : MANCA);
export const aggiornato = () => new Date(LEGALE.aggiornato_il).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });

export const PRIVACY = () => `
Questa informativa spiega quali dati personali tratta skinmatch.it, perché e con quali diritti per te, come chiede il Regolamento europeo 2016/679 (GDPR). In breve: **il test non ci manda le tue risposte**, non usiamo cookie di profilazione e non vendiamo dati a nessuno.

## Chi è il titolare

${v(LEGALE.titolare)}, ${v(LEGALE.indirizzo)}${LEGALE.partita_iva ? `, partita IVA ${LEGALE.partita_iva}` : ''}. Per qualsiasi domanda sui tuoi dati: ${email()}.

## Le risposte al test restano sul tuo telefono

Le risposte che dai al test (compresi i dati sulla salute, come una condizione diagnosticata o una gravidanza) vengono elaborate **solo dal tuo browser** e salvate nella sua memoria locale, per farti ritrovare il risultato. Non arrivano ai nostri server e non le vediamo. Puoi cancellarle quando vuoi rifacendo il test o cancellando i dati del sito dalle impostazioni del browser.

## Quali dati trattiamo

- **Dati tecnici di navigazione.** Il sito è ospitato da Cloudflare, che per farlo funzionare e proteggerlo dagli attacchi tratta l'indirizzo IP e i dati tecnici della richiesta (browser, pagina, ora). Non li usiamo per sapere chi sei.
- **Conteggi d'uso, anonimi.** Contiamo quanti test vengono iniziati e finiti, quali biotipi escono e quanti clic portano ai negozi, sommati per giorno. Il conteggio non contiene indirizzi IP, identificativi o cookie e non permette di risalire a una persona: non è un dato personale.
- **Le email che ci scrivi.** Se ci contatti, usiamo il tuo indirizzo e quello che ci scrivi solo per risponderti.
- **L'area riservata.** Chi gestisce il sito entra nell'area riservata con il proprio indirizzo email, verificato da Cloudflare.

## Perché e su quale base

- Far funzionare il sito e tenerlo sicuro: legittimo interesse del titolare (art. 6.1.f GDPR).
- Rispondere a chi ci scrive: richiesta dell'interessato e legittimo interesse (art. 6.1.b e 6.1.f).
- Gestire l'area riservata: legittimo interesse e rapporto con chi collabora al sito.

## A chi arrivano i dati

- **Cloudflare, Inc.**, che ospita il sito, il database dei conteggi e protegge l'area riservata, come responsabile del trattamento. Cloudflare può trattare dati anche negli Stati Uniti: il trasferimento avviene nel quadro dell'EU-US Data Privacy Framework e delle clausole contrattuali standard della Commissione europea.
- **I negozi.** Le immagini dei prodotti vengono caricate dai server dei negozi (per esempio Notino), che ricevono il tuo indirizzo IP come per qualsiasi immagine sul web.
- Nessuno riceve i tuoi dati per fini di marketing.

## Quando vai su un negozio

I link verso i prodotti portano al sito del negozio o di una rete di affiliazione (oggi Adtraction, per Liki24). Da quel momento i tuoi dati li tratta il negozio, con la sua informativa e i suoi cookie, compresi quelli che servono a riconoscere che sei arrivato da Skinmatch. Leggi le informative di quei siti prima di comprare.

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
**Skinmatch non usa cookie di profilazione né cookie di statistica**, e per questo non ti chiede il consenso con un banner.

## Cosa usa il sito

- **La memoria locale del browser** per ricordare le risposte del test e il risultato su questo dispositivo. Serve solo al servizio che hai chiesto (fare il test) e non esce dal tuo telefono: è uno strumento tecnico, esente dal consenso (art. 122 del Codice privacy e Linee guida del Garante del 10 giugno 2021).
- **Cookie tecnici di Cloudflare**, quando servono a distinguere le persone dai programmi automatici e a proteggere il sito.
- **Nell'area riservata**, un cookie di accesso per chi gestisce il sito.
- **I caratteri tipografici** sono serviti dal sito stesso: il tuo browser non contatta Google per caricarli.

## Cookie di terze parti

Quando tocchi «Vedi su…» e passi a un negozio, il negozio e la rete di affiliazione possono usare i loro cookie, anche per riconoscere che sei arrivato da Skinmatch e riconoscerci una commissione se compri. Li trovi descritti nelle cookie policy di quei siti. Le immagini dei prodotti arrivano dai server dei negozi, che non installano cookie attraverso Skinmatch.

## Come gestirli

Puoi cancellare la memoria locale e i cookie dalle impostazioni del browser (in genere: Impostazioni → Privacy → Dati dei siti). Cancellandoli perdi solo il risultato del test salvato, che puoi rifare quando vuoi.

Per tutto il resto vale l'[informativa privacy](/privacy).
`;

export const NOTE = () => `
## Chi pubblica il sito

skinmatch.it è pubblicato da ${v(LEGALE.titolare)}, ${v(LEGALE.indirizzo)}${LEGALE.partita_iva ? `, partita IVA ${LEGALE.partita_iva}` : ''}. Contatti: ${email()}.

## Non è una diagnosi

Skinmatch aiuta a scegliere i cosmetici e gli integratori adatti a una pelle e a un cuoio capelluto, partendo da quello che si vede allo specchio. **Non fa diagnosi, non prescrive cure e non sostituisce il parere di un medico.** Quando una risposta fa pensare a qualcosa da far vedere a un medico, il risultato lo dice per primo. I cosmetici non curano malattie della pelle; gli integratori non sostituiscono una dieta varia. In gravidanza, in allattamento o se prendi farmaci, chiedi sempre al tuo medico.

## Prodotti e prezzi

Le informazioni sui prodotti vengono dalle schede dei produttori e dai negozi. Prezzi e disponibilità sono indicativi e si aggiornano con i cataloghi dei negozi: fa fede quello che vedi sul sito del negozio al momento dell'acquisto. L'acquisto avviene sul sito del negozio, che ne è l'unico responsabile, comprese spedizione, resi e garanzie.

## I link di affiliazione

Alcuni link verso i negozi sono di affiliazione: se compri, Skinmatch riceve una piccola commissione dal negozio, **a te il prezzo non cambia**. Le commissioni non decidono quali prodotti consigliamo: il test li sceglie sul biotipo, e per ognuno mostriamo anche un'alternativa che costa meno.

## Contenuti, marchi e immagini

Testi, test, biotipi, glossario e grafica di Skinmatch sono protetti dal diritto d'autore: puoi citarli con il link alla pagina, non copiarli per intero. I marchi dei prodotti appartengono ai rispettivi titolari e sono citati solo per descrivere i prodotti. Le fotografie vengono da Pexels, con licenza Pexels, e il nome dell'autore è indicato dove compaiono.

## Responsabilità

Curiamo i contenuti con attenzione e li aggiorniamo, ma non possiamo garantire che siano sempre completi o privi di errori. Se ne trovi uno, scrivici: lo correggiamo. Skinmatch non risponde dei siti esterni a cui rimanda.

## Legge applicabile

Valgono la legge italiana e, per i consumatori, le tutele del Codice del consumo.
`;
