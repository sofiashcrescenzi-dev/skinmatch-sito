# Changelog — SkinMatch

Registro di ogni modifica fatta al repository. Ordine: dal più recente al più vecchio.

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
