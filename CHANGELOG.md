# Changelog — SkinMatch

Registro di ogni modifica fatta al repository. Ordine: dal più recente al più vecchio.

---

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
