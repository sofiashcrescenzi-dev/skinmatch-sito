# Changelog — SkinMatch

Registro di ogni modifica fatta al repository. Ordine: dal più recente al più vecchio.

---

## 2026-09-21 — Biotipi misti: nuovi tratti combinabili + pelle con psoriasi

- Su richiesta: il biotipo di pelle ora può essere **misto** (es. "pelle
  acneica" + "con tendenza a macchie"), invece di un'unica etichetta fissa.
- `src/lib/quiz.ts`:
  - Aggiunto un nono biotipo di pelle, **"Pelle con psoriasi"** — prima la
    domanda "Psoriasi" esisteva nel test ma non portava a nessun biotipo
    dedicato (finiva comunque in un altro biotipo in base alle altre
    risposte): incongruenza corretta.
  - Aggiunti 3 **tratti indipendenti**, che si sommano a qualsiasi biotipo
    di pelle di base invece di sostituirlo: "Con tendenza a macchie e
    discromie" (nuova domanda dedicata nel test), "Con tendenza a
    rosacea/couperose" (dalla domanda "condizioni diagnosticate" già
    esistente — prima la rosacea forzava il biotipo su "disidratata
    sensibile", ora è un tratto a sé che può comparire con qualunque
    biotipo), "Con segni di invecchiamento cutaneo" (dedotto quando
    l'obiettivo scelto è "Anti-age", senza bisogno di una domanda in più).
  - `getSkinTraits()` calcola i tratti applicabili; `getRecommendation()`
    li usa anche per affinare i consigli prodotto: la rosacea applica lo
    stesso filtro prudenziale `sensitiveSafe` della pelle sensibile, le
    macchie danno un bonus ai prodotti con `macchie-luminosita`.
- `src/app/test/page.tsx`: nuova domanda "Hai macchie scure, segni
  post-acne o altre discromie?" dopo l'obiettivo principale. Nella pagina
  risultati, il biotipo primario ora mostra sotto di sé dei "chip"
  cliccabili per ogni tratto aggiuntivo rilevato, ciascuno verso la propria
  pagina di dettaglio.
- `src/app/biotipi/page.tsx` e `src/app/biotipi/[id]/page.tsx`: aggiunta la
  terza sezione "Tratti che si possono aggiungere a qualsiasi biotipo" e
  l'etichetta "Tratto aggiuntivo" con una nota che spiega che non è un
  biotipo a sé. La sitemap (generata da `ALL_BIOTYPES`) passa così da 13 a
  17 pagine biotipo/tratto in automatico, senza modifiche manuali.
- Verificato via build + Playwright: percorso "pelle acneica + macchie"
  (badge combinato corretto), percorso "psoriasi" (biotipo dedicato),
  navigazione dall'indice biotipi al tratto "rosacea". Nessun errore in
  console.

## 2026-09-21 — Controllo indicizzazione: metadata, canonical, sitemap, robots, IndexNow

- Controllo completo su richiesta esplicita. Trovati e corretti diversi
  problemi reali (il sito non aveva mai avuto un controllo SEO/indicizzazione
  prima d'ora):
  - `src/app/layout.tsx`: mancava `metadataBase` (impostato su
    `https://skinmatch.it`) e non c'era nessun canonical, nemmeno sulla
    homepage.
  - `/catalogo` e `/test` sono componenti client (`'use client'`) e non
    avevano **nessun** title/description propri: mostravano entrambi il
    titolo generico "SkinMatch" ereditato dal layout — stesso problema di
    duplicazione già risolto su sofiacrescenzi.it. Risolto con due
    `layout.tsx` "ponte" (`src/app/catalogo/layout.tsx`,
    `src/app/test/layout.tsx`) che forniscono title/description/canonical
    dedicati senza dover convertire le pagine in server component.
  - `/biotipi` e `/biotipi/[id]` avevano già metadata propri ma senza
    canonical: aggiunto a entrambi.
  - **Non esisteva alcuna sitemap** (`/sitemap.xml` → 404) né un
    `robots.txt` con direttive proprie (solo il blocco automatico
    "Content Signal" iniettato da Cloudflare, senza riferimento alla
    sitemap). Aggiunti `src/app/sitemap.ts` (17 URL: pagine principali +
    generato dinamicamente da `ALL_BIOTYPES` per restare sempre
    sincronizzato, non un elenco manuale da aggiornare a mano) e
    `src/app/robots.ts` (allow-all + riferimento alla sitemap) — stesso
    schema di sofiacrescenzi-sito. Entrambi richiedono
    `export const dynamic = 'force-static'` per l'export statico in questa
    versione di Next.js.
  - **IndexNow** non era mai stato configurato su questo repo (presente solo
    su sofiacrescenzi-sito): aggiunta chiave
    (`public/8024a1b66a7bc1e8930a628e07b25337.txt`),
    `scripts/indexnow-ping.js` e script `postbuild` in `package.json` — ping
    automatico a ogni build (verificato: risposta 202, 17 URL notificati).
  - Ancora aperto, non risolvibile da qui: **verifica proprietà su Google
    Search Console** e invio della sitemap — il dominio è appena diventato
    raggiungibile, va fatta appena possibile (stesso percorso già seguito
    per sofiacrescenzi.it: DNS TXT record su Cloudflare).
- Verificato via build: 18 pagine generate, ciascuna con canonical unico e
  corretto (controllato uno per uno, nessuna duplicazione), sitemap.xml con
  tutti i 17 URL, robots.txt con `Sitemap:`/`Host:`, file chiave IndexNow
  presente nell'export statico.

## 2026-09-21 — skinmatch.it collegato al Worker (HTTP + HTTPS attivi)

- Rimosso il vecchio record DNS `A skinmatch.it → 62.149.128.40` (pagina di
  parcheggio Aruba) rimasto dall'import automatico, che bloccava l'aggiunta
  del Custom Domain ("Hostname already has externally managed DNS records").
- `skinmatch.it` collegato come Custom Domain al Worker `skinmatch-sito`.
  Verificato: HTTP serve già il sito nuovo, e il certificato SSL emesso
  automaticamente da Cloudflare è ora attivo (`https://skinmatch.it` → 200,
  `server: cloudflare`).
- Ancora da fare: `www.skinmatch.it` (CNAME + redirect 301 verso l'apex,
  stesso schema di sofiacrescenzi.it), SSL/TLS su "Full (strict)".

## 2026-09-21 — Pagine dedicate ai biotipi di pelle e cuoio capelluto

- Su richiesta: create pagine esplorabili con le caratteristiche di ogni
  biotipo (prima erano spiegati solo nel risultato del test).
- `src/lib/quiz.ts`: il modello `Biotype` è stato esteso con `kind`
  ('pelle' | 'cuoio-capelluto'), `characteristics` (elenco caratteristiche),
  `lookFor` (cosa cercare in un prodotto) e `avoid` (cosa evitare), per
  ciascuno degli 8 biotipi di pelle e 5 di cuoio capelluto. Esportati
  `ALL_BIOTYPES` e `getBiotypeById()`.
- **`src/app/biotipi/page.tsx`** (nuova): indice con tutti i biotipi divisi
  in due sezioni ("Biotipi di pelle" / "Biotipi di cuoio capelluto"), card
  cliccabili con titolo, estratto della descrizione e link alla pagina di
  dettaglio.
- **`src/app/biotipi/[id]/page.tsx`** (nuova, route dinamica con
  `generateStaticParams` per l'export statico): titolo, descrizione,
  "Caratteristiche principali", "Cosa cercare" / "Cosa evitare", CTA verso
  il test e il catalogo. Metadata (title/description) generati per pagina.
- `src/components/Header.tsx`: aggiunta voce "Biotipi" alla navigazione
  (desktop e dropdown mobile).
- `src/app/test/page.tsx`: le due card del risultato ("Il tuo biotipo
  cutaneo" / "Il tuo cuoio capelluto") ora linkano alla pagina di dettaglio
  corrispondente ("Scopri di più su questo biotipo →").
- **Bug trovato e corretto durante il test**: le 13 pagine `/biotipi/[id]`
  generavano tutte un 404 in produzione (`notFound()` sempre attivato).
  Causa: in questa versione di Next.js (16.3.5) `params` nelle route
  dinamiche è una `Promise`, non un oggetto sincrono — `generateMetadata`
  e il componente pagina leggevano `params.id` senza `await`, ottenendo
  sempre `undefined`. Risolto rendendo entrambe le funzioni `async` con
  `const { id } = await params`. Verificato sul file HTML statico generato
  (conteneva il boundary `notFound` di Next.js, non il contenuto) prima e
  dopo la correzione.
- Verificato via build + Playwright: indice con tutti i 13 biotipi, pagina
  di dettaglio (caratteristiche, cosa cercare/evitare, CTA), percorso
  completo dal test al link "Scopri di più" fino alla pagina di dettaglio
  corretta. Nessun errore in console.

## 2026-09-21 — Sezione introduttiva "Cosa significa trovare il tuo SkinMatch"

- `src/app/test/page.tsx`: aggiunta una schermata introduttiva prima della
  prima domanda (non conteggiata nella barra di avanzamento), che spiega il
  senso del test — capire prima il biotipo di pelle e cuoio capelluto,
  ricevere poi una routine coerente invece del prodotto più venduto del
  momento — con 3 card "Poche domande / Scopri il tuo biotipo / Routine su
  misura" e il pulsante "Inizia il test →". "Rifai il test" ora riporta a
  questa schermata invece che direttamente alla prima domanda.
- Verificato via build + screenshot Playwright: resa desktop e mobile, click
  su "Inizia il test" che avvia correttamente la prima domanda.

## 2026-09-21 — Identificazione del biotipo cutaneo e del cuoio capelluto nel test

- Su richiesta esplicita: prima dei consigli sui prodotti, il test ora
  identifica e **spiega** il biotipo cutaneo e del cuoio capelluto più
  probabile, come primo blocco della pagina risultati.
- `src/lib/quiz.ts`: aggiunti 8 biotipi cutanei (atopica, disidratata
  sensibile con barriera danneggiata, acneica, seborroica-secca,
  seborroica idratata, idratata mista, secca, normale-equilibrata) e 5
  biotipi del cuoio capelluto (diradamento, seborroico, secco e
  desquamante, capelli secchi/disidratati, equilibrato), ciascuno con
  titolo e spiegazione in linguaggio accessibile. Classificazione ad
  albero con priorità (condizioni diagnosticate > pelle sensibile con
  barriera compromessa > sottotipo pelle grassa/mista > pelle secca >
  normale), esposta come `getSkinBiotype` / `getScalpBiotype` e inclusa
  nel risultato di `getRecommendation` (`skinBiotype`, `scalpBiotype`).
- `src/app/test/page.tsx`: aggiunti due step condizionali per raccogliere
  il segnale necessario a distinguere i biotipi senza allungare il test
  per chi non ne ha bisogno — "Quale descrizione si avvicina di più alla
  tua pelle?" (solo se pelle grassa/mista: grassa senza imperfezioni /
  con punti neri e brufoli / grassa a chiazze con desquamazione) e "Come
  si presenta la forfora?" (solo se forfora: untuosa/giallastra o
  secca/bianca). Nella pagina risultati, due card affiancate ("Il tuo
  biotipo cutaneo" / "Il tuo cuoio capelluto") compaiono subito dopo
  l'eventuale avviso condizioni, prima della routine consigliata.
- Verificato via build + Playwright: comparsa dello step condizionale
  pelle grassa, percorso "pelle acneica + forfora secca" (entrambe le
  card biotipo corrette, routine coerente), priorità "dermatite atopica"
  sopra ogni altro segnale, resa mobile delle card biotipo. Nessun
  errore in console.

## 2026-09-21 — Test "Trova il tuo SkinMatch" (quiz reale) + catalogo integratori

- **`src/lib/products.ts`**: aggiunto il tagging necessario al test — `skinTypes`
  (secca/grassa/mista/normale/sensibile), `concerns` (idratazione, anti-age,
  acne-sebo, macchie-luminosità, rossori-sensibilità, barriera-cutanea,
  pori-dilatati, protezione-solare), `hairConcerns` (caduta, forfora,
  secchi-crespi, mantenimento), `beardConcerns` (irritazione, mantenimento),
  `pregnancySafe` e `sensitiveSafe` su tutti i 35 prodotti esistenti, assegnati
  in base alle formulazioni reali/posizionamento pubblico di ciascun prodotto
  (prudenziale: `pregnancySafe: false` per attivi ad alta concentrazione o
  anti-age con complessi brevettati, in assenza di certezza).
- Nuova categoria **`integratori`**, con 4 prodotti reali (ricercati via web,
  prezzi indicativi verificati su più farmacie online): Bioscalin TricoAge 50+
  (anticaduta, donna), Imedeen Time Perfection (anti-age pelle, donna),
  Vitabiotics Perfectil Original (pelle/capelli/unghie, unisex), Gold Collagen
  Forte Plus (collagene da bere, unisex). Catalogo totale: 39 prodotti.
- **`src/lib/quiz.ts`** (nuovo): motore di raccomandazione. Applica filtri
  prudenziali rigidi (genere, `pregnancySafe` se gravidanza/allattamento,
  `sensitiveSafe` se pelle sensibile) e poi assegna un punteggio ai prodotti
  compatibili in base a corrispondenza tipo di pelle/obiettivo/fascia di
  prezzo preferita, per proporre: routine skincare (detergente + siero +
  crema, + protezione solare se esposizione al sole medio/alta), 1-2 prodotti
  capelli, un prodotto barba (solo ramo uomo), un integratore.
- **`src/app/test/page.tsx`**: riscritta da zero (prima era un placeholder).
  Quiz a step con percorso **differenziato uomo/donna** (12 domande totali,
  di cui "gravidanza/allattamento" solo per il ramo donna e "barba" solo per
  il ramo uomo): genere, gravidanza, tipo di pelle, pelle sensibile, obiettivo
  principale, condizioni diagnosticate (dermatite/rosacea/psoriasi),
  esposizione solare, stile di vita, ambiente di vita, capelli, barba, fascia
  di prezzo preferita. Selezione singola → avanzamento automatico; selezione
  multipla → pulsante "Continua". Pagina risultati con routine completa,
  sezione capelli, sezione barba (solo se pertinente), integratore consigliato
  e avviso a consultare un dermatologo se sono state indicate condizioni
  diagnosticate. Nessuna diagnosi medica: solo un punto di partenza.
- Verificato via build + Playwright: percorso donna completo (11 domande,
  routine coerente con pelle secca/sensibile), percorso uomo completo (11
  domande inclusa barba, routine coerente con pelle grassa/fascia base),
  step multi-select su mobile, comparsa del disclaimer con una condizione
  diagnosticata selezionata. Nessun errore in console.

## 2026-09-21 — Ripresa migrazione dominio skinmatch.it

- Controllato lo stato del dominio: `skinmatch.it` è ancora sui nameserver
  Aruba e mostra la pagina di parcheggio (nessuna email attiva, solo un
  record MX di default). Il Worker `skinmatch-sito` è già live e
  raggiungibile su `skinmatch-sito.sofiashcrescenzi.workers.dev`.
- Creato `DEPLOY.md` (stesso schema di sofiacrescenzi-sito) con lo stato
  della migrazione e i passaggi ancora da fare per portare online
  `skinmatch.it`: aggiunta a Cloudflare, cambio nameserver su Aruba,
  collegamento come Custom Domain al Worker, `www` → redirect, SSL Full
  (strict), verifica WHOIS privacy, Google Search Console.

## 2026-09-19 — Nuovo header a pill fissa (stesso stile di sofiacrescenzi.it)

- Sostituito l'header statico a barra intera (che su mobile andava in
  sovrapposizione/a capo su 3 righe con logo, Catalogo, K-beauty e il
  pulsante CTA) con lo stesso pattern usato su sofiacrescenzi.it: una
  "pill" flottante fissa in alto (`position: fixed`, sfondo sfumato con
  blur, bordi arrotondati), con i link centrali visibili solo da desktop
  e un menu hamburger che apre un dropdown a schermo intero su mobile.
- `src/components/Header.tsx`: riscritto da zero su questo modello — logo
  "SkinMatch", link Catalogo/K-beauty, CTA "Trova il tuo SkinMatch" sempre
  visibile su desktop (nascosto nel dropdown su mobile), hamburger che
  anima in una X quando il menu è aperto. Aggiunto uno spacer nel flusso
  normale del documento (subito sotto la nav fissa) per evitare che il
  contenuto delle pagine finisca sotto la pill.
- `src/app/globals.css`: nuove classi `.sm-nav-links`, `.sm-nav-link`,
  `.sm-nav-cta-pill`, `.sm-nav-burger` con la stessa media query
  (`max-width: 640px`) usata sul sito medico per nascondere i link
  desktop e mostrare l'hamburger.
- Ridotto leggermente il padding-top di homepage, catalogo e pagina test
  (che prima presupponevano un header non fisso) per compensare lo
  spacer e mantenere le proporzioni corrette.
- Verificato via build + screenshot Playwright: desktop (pill centrata
  con link e CTA), mobile chiuso (solo logo + hamburger, una riga) e
  mobile con menu aperto (dropdown con Catalogo, K-beauty, CTA).

## 2026-09-19 — Immagini reali in homepage

- Recuperate dal Mac le immagini in `Desktop/SITO INTERNET/IMMAGINI SITO` (usate
  anche per sofiacrescenzi.it). Selezionate SOLO le foto a tema skincare/capelli
  generiche (pelle, creme, sieri, maschere in tessuto, gruppi di persone),
  escludendo esplicitamente tutte quelle di trattamenti medici/estetici (botox,
  filler, siringhe, PRP, radiofrequenza, ecc.) — SkinMatch non deve avere alcun
  collegamento visivo o di contenuto con l'ambito medico-estetico.
  Ogni immagine candidata è stata aperta e controllata a mano per escludere
  scritte, loghi o riferimenti al nome "Sofia Crescenzi": nessuna delle otto
  immagini scelte ne conteneva.
- Immagini ridimensionate e compresse (da 0,6–3,5 MB a 70–380 KB l'una) e
  copiate in `public/images/`: `hero-viso.jpg`, `cat-detergenti.jpg`,
  `cat-creme.jpg`, `cat-sieri.jpg`, `cat-shampoo.jpg`, `cat-barba.jpg`,
  `cat-capelli.jpg`, `kbeauty-mask.jpg`.
- `src/app/page.tsx`: aggiunta immagine hero accanto al testo introduttivo,
  ogni card categoria ora mostra una foto con overlay ed etichetta invece del
  solo testo, sezione K-beauty affiancata da un'immagine di maschera in
  tessuto coreana. Verificato via build + screenshot Playwright (desktop e
  mobile 390×844).
- Notato (non ancora corretto, fuori dallo scope di questa modifica): su
  mobile l'header (`src/components/Header.tsx`) è affollato — "SkinMatch",
  "Catalogo", "K-beauty" e il pulsante CTA si sovrappongono/vanno a capo su
  3 righe. Da sistemare in un prossimo intervento.

## 2026-09-18 — Fix pagina catalogo vuota nell'HTML statico

- Trovato un bug reale sul sito pubblicato: `/catalogo` restituiva un HTML
  statico quasi vuoto (~8 KB, nessun nome prodotto presente), perché il
  filtro-da-URL usava `useSearchParams()` dentro un `<Suspense fallback={null}>`
  — in export statico Next.js "cuoce" nell'HTML il fallback (`null`), non il
  contenuto vero, quindi i prodotti comparivano solo dopo il caricamento del
  JavaScript lato client. Non ideale per la SEO e poco affidabile.
- `src/app/catalogo/page.tsx`: rimosso `useSearchParams()`/`Suspense`; i filtri
  di default (nessun filtro attivo) sono ora quello che viene renderizzato
  nell'HTML statico, mentre la lettura di `?categoria=` e `?kbeauty=1` dalla URL
  (usata dai link diretti dalla home) avviene in un `useEffect` dopo il mount,
  con `window.location.search`. Verificato via build: `out/catalogo.html` passa
  da 8.399 byte a 48.277 byte e contiene i nomi prodotto reali (es. "Beauty of
  Joseon", "Medicube").
- Aggiornato anche il banner della pagina, rimasto obsoleto da quando i 35
  prodotti reali hanno sostituito i placeholder: da "prodotti mostrati sono
  segnaposto" a "prodotti reali — link di affiliazione in fase di attivazione".

## 2026-09-13 — Primo catalogo funzionante + homepage

- Definita insieme la struttura del sito: catalogo come impalcatura principale
  (genere, categoria, fascia Base/Top/Premium, K-beauty), test pelle come
  scorciatoia ("Trova il tuo SkinMatch") per chi non sa da dove iniziare.
- Definito insieme il flusso del test pelle (10 step, ramificato per genere —
  documentato in questa conversazione, da implementare).
- `src/lib/products.ts`: modello dati prodotto (genere, categoria, fascia,
  K-beauty, prezzo, link affiliazione) + **14 prodotti segnaposto**, chiaramente
  marcati `isPlaceholder: true` e con badge visivo "Esempio" — da sostituire con
  prodotti reali prima della pubblicazione.
- `src/app/catalogo/page.tsx`: pagina catalogo con filtri (genere, categoria,
  fascia, K-beauty), legge anche i filtri dalla URL (link diretti da home).
- `src/components/ProductCard.tsx`, `src/components/Header.tsx`: card prodotto
  e navigazione condivisa.
- `src/app/page.tsx`: homepage con hero "Trova il tuo SkinMatch", categorie in
  evidenza, sezione K-beauty.
- `src/app/test/page.tsx`: pagina segnaposto (il quiz vero è da costruire).
- Repo collegato a GitHub (`sofiashcrescenzi-dev/skinmatch-sito`).

### Da fare
- [ ] Costruire il quiz vero (10 step, logica ramificata per genere)
- [ ] Sostituire i 14 prodotti segnaposto con un catalogo reale
- [ ] Pagine legali: privacy/cookie policy + disclosure affiliazione
- [ ] Collegare Cloudflare Workers + dominio `skinmatch.it` (in attesa che Aruba
      risolva la privacy WHOIS)

---

## 2026-09-12 — Avvio progetto

- Progetto creato con `create-next-app` (Next.js, TypeScript, Tailwind, App Router,
  `src/` directory).
- **Sicurezza**: la versione iniziale (Next 14.2.5) aveva una vulnerabilità critica
  presente in tutta la linea 14.x e gran parte della 15.x. Aggiornato subito a
  **Next 16.3.5** (unica versione con la patch), con React/React-DOM 19.3.0 e
  `eslint-config-next`/`eslint` 9 allineati. `npm audit`: 0 vulnerabilità.
- `next.config.mjs`: `output: 'export'` — sito statico, stessa architettura di
  sofiacrescenzi.it (nessun server Node in produzione).
- `wrangler.jsonc` + `.nvmrc`: deploy come Cloudflare Worker "solo asset"
  (`assets.directory: ./out`), stesso schema del progetto sofiacrescenzi-sito.
- Aggiunto script `npm run deploy` (`next build && npx wrangler deploy`) per il
  deploy manuale locale, oltre a quello automatico da GitHub.
- Homepage placeholder minimale (in attesa di design/contenuti reali).
- **Decisione importante**: il sito **non è collegato all'identità professionale
  di Sofia Crescenzi (medico)** — nessun riferimento al suo nome, titolo o
  al sito sofiacrescenzi.it, per evitare conflitti di interesse deontologici
  legati a un sito di affiliazione/commerciale. Vedi conversazione del 2026-09-12.

### Da fare
- [ ] Registrare il dominio `skinmatch.it` (libero, verificato su registro .it) —
      tramite Cloudflare Registrar.
- [ ] Creare repo GitHub `skinmatch-sito` (stesso account, repo separato) e collegare.
- [ ] Creare progetto Cloudflare Workers + deploy automatico (come sofiacrescenzi-sito).
- [ ] Definire le domande del test pelle e la logica di raccomandazione.
- [ ] Costruire il catalogo prodotti (fasce di prezzo + sezione K-beauty).
- [ ] Pagine legali: privacy/cookie policy + disclosure affiliazione (obbligatoria
      per legge sui link che generano commissione).

---

## 2026-09-14 — Primi prodotti reali nel catalogo

- Rimossi gli 8 prodotti finti nelle categorie detergenti/creme/sieri/attivi,
  sostituiti con **12 prodotti reali** dei brand richiesti:
  - K-beauty: Beauty of Joseon (Relief Sun, Glow Serum), Medicube (Zero Pore
    Pad 2.0, Collagen Jelly Cream), Dr. Althea (345 Relief Cream)
  - Fascia Premium: Sisley (Sisleÿa L'Intégral, Balsamo ai Tre Oli), La Mer
    (Crème de la Mer, The Treatment Lotion)
  - Fascia intermedia: Dermalogica (Daily Microfoliant, Special Cleansing Gel,
    UltraCalming Serum Concentrate)
  - Prezzi indicativi trovati via ricerca web (alcuni confermati da rivenditori
    italiani, altri stimati) — da verificare sul rivenditore reale prima del
    lancio. Nessun link di affiliazione ancora attivo (`affiliateUrl: '#'`).
  - Restano segnaposto **solo** shampoo/barba/capelli (nessun brand fornito
    per queste categorie).
- `src/lib/products.ts`: nuovo campo `linkPending` per distinguere "prodotto
  reale, link da collegare" da "prodotto finto, da sostituire" (`isPlaceholder`).
- `src/components/ProductCard.tsx`: badge distinto per i due casi.

---

## 2026-09-14 — Shampoo, capelli, barba: prodotti reali

- Sostituiti i 6 prodotti finti residui (shampoo/capelli/barba) con **11 prodotti
  reali**, ricercati per notorietà/viralità:
  - Shampoo da farmacia: Vichy Dercos (aminexil), Ducray Anaphase, Bioscalin
    Nova Genina, ISDIN Psorisdin (antidesquamazione/psoriasi)
  - Capelli, K-beauty + farmacia: Ryo (Hanbang), Elizavecca CER-100 (trattamento
    virale sui social), Mise en Scène Perfect Serum, Bioscalin Attivatore Capillare
  - Barba: King C. Gillette Beard Balm, Vichy Homme Sensi Baume, Collistar Dopobarba
  - Prezzi indicativi (alcuni confermati via ricerca, es. Dercos ~18€ su
    comparatori italiani; altri stimati) — da verificare prima del lancio.
- **Il catalogo non ha più alcun prodotto finto (`isPlaceholder`)**: 22 prodotti
  reali su tutte le categorie, tutti in attesa del link di affiliazione
  (`linkPending: true`).

---

## 2026-09-14 — Dermocosmesi + altri K-beauty e lusso virali

- Aggiunti **13 nuovi prodotti reali** dopo ricerca su bestseller/virali 2026:
  - **Dermocosmesi (farmacia)**: CeraVe (Moisturizing Cream, Foaming Cleanser),
    Bioderma Sensibio H2O, La Roche-Posay (Cicaplast Baume B5, Anthelios
    UVMune 400), Avène Cicalfate+
  - **K-beauty aggiuntivi**: Anua Heartleaf 77% Toner, SKIN1004 Madagascar
    Centella Ampoule, COSRX Advanced Snail 96 Mucin Essence, Round Lab 1025
    Dokdo Toner, Torriden Dive-In Hyaluronic Serum
  - **Lusso aggiuntivo**: Augustinus Bader The Cream, SkinCeuticals C E Ferulic
- Catalogo ora a **35 prodotti reali**, tutti `linkPending: true` (in attesa
  di link di affiliazione). Prezzi indicativi da fonti web, alcuni convertiti
  da USD — da verificare sul rivenditore reale prima del lancio.
