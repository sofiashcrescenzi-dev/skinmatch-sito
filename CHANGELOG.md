# Changelog — SkinMatch

Registro di ogni modifica fatta al repository. Ordine: dal più recente al più vecchio.

---

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
