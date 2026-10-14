# Deploy e infrastruttura — skinmatch.it

Documento operativo: com'è ospitato il sito, come si aggiorna, com'è messo il DNS,
e i passaggi per portare `skinmatch.it` online (stesso schema già usato per
sofiacrescenzi.it).

Ultimo aggiornamento: 2026-10-15

---

## 1. In breve

- Il sito è un'app **Next.js** esportata come **sito statico** (`next build` con
  `output: 'export'` → cartella `out/`).
- È ospitato su **Cloudflare** come **Worker "solo asset"** (nome Worker:
  `skinmatch-sito`), configurato da `wrangler.jsonc`.
- URL tecnico sempre attivo: `skinmatch-sito.sofiashcrescenzi.workers.dev`
- Deploy: manuale via `npx wrangler deploy` dopo `npm run build` (nessun
  auto-deploy da GitHub configurato per questo repo, a differenza di
  sofiacrescenzi-sito).
- Dominio `skinmatch.it`: registrato su **Aruba** (2026-09), **solo dominio,
  nessuna casella email attiva**. Al 2026-09-21 è ancora sui nameserver Aruba
  e mostra la pagina di parcheggio — non ancora collegato al sito.

---

## 2. Come aggiornare il sito

1. Modifica i file nel repo.
2. `npm run build` (genera `out/`)
3. `npx wrangler deploy`
4. `git add -A && git commit -m "..." && git push`

---

## 2b. Catalogo dai feed di affiliazione (CJ)

Strumenti solo locali; credenziali in `~/.secrets/cj-affiliate.env` (token, CID,
PID), mai nel repo né su Cloudflare.

1. `node scripts/feeds/cj-candidates.mjs` → scarica i prodotti delle marche scelte
   da Notino.it / Marionnaud IT / QVC IT in `feeds-out/` (ignorata da git).
2. Selezione e tag a mano → `src/lib/products-feed.ts`.
3. `npx tsx scripts/quiz/coverage.ts` → verifica che ogni prodotto sia
   raggiungibile dal test (`--alt` per vedere anche quelli solo come alternativa).
4. Quando un merchant approva l'account: `node scripts/feeds/cj-sync-links.mjs`
   sostituisce i link `linkPending` con quelli tracciati; poi build e deploy.

## 3. Migrazione dominio — stato dei passaggi

### Fatto
- [x] Dominio `skinmatch.it` registrato su Aruba
- [x] Repo GitHub (`sofiashcrescenzi-dev/skinmatch-sito`), Worker Cloudflare
      `skinmatch-sito` creato e pubblicato su `workers.dev`

### Da fare (in corso)
- [ ] Aggiungere `skinmatch.it` come sito su Cloudflare (piano Free)
- [ ] Cambiare i nameserver su Aruba con quelli assegnati da Cloudflare
- [ ] Attendere l'attivazione della zona (di solito minuti, a volte alcune ore)
- [ ] Collegare `skinmatch.it` (apex) al Worker `skinmatch-sito` come Custom Domain
- [ ] `www.skinmatch.it`: CNAME verso l'apex + redirect 301 (stesso schema di
      sofiacrescenzi.it)
- [ ] SSL/TLS: modalità Full (strict)
- [ ] Verificare/risolvere la privacy WHOIS (dati del titolare visibili
      pubblicamente — richiesta ad Aruba inoltrata ma non confermata risolta)
- [ ] Google Search Console: verifica proprietà + invio sitemap (dopo che il
      sito è raggiungibile sul dominio definitivo)

---

## 4. Sicurezza / accessi

- **GitHub**: repo `sofiashcrescenzi-dev/skinmatch-sito`.
- **Cloudflare**: account condiviso con sofiacrescenzi-sito (Workers & Pages).
- **Aruba**: pannello `admin.aruba.it` — gestisce dominio e nameserver.

---

## 6. Il Worker, il database e l'admin (dal 2026-10-15)

- `wrangler.jsonc` ha ora un Worker piccolo (`worker/index.js`) che gira **solo** su `/api/*` e `/admin*`
  (`run_worker_first`); tutto il resto è servito dagli asset come prima.
- Database: **D1 `skinmatch-dati`** sull'account di Sofia (schema in `scripts/admin/schema.sql`).
- `/api/evento`: i conteggi del sito (test iniziati e finiti, biotipi usciti, clic verso i negozi), per giorno,
  senza dati personali.
- `/admin` e `/api/admin/*`: aperti solo a chi passa da **Cloudflare Access** ed è in `ADMIN_EMAILS`
  (`hello@agoranomos.cloud`, `sofiashcrescenzi@gmail.com`). Il Worker ricontrolla il gettone di Access: finché
  Access non è configurato, l'admin risponde «Area riservata» a tutti.

### Attivare Cloudflare Access (una volta, dalla dashboard dell'account di Sofia)

1. **Zero Trust** (menu a sinistra) → se chiede di creare l'organizzazione, scegliere il nome del team
   (per esempio `skinmatch`) e il piano **Free**.
2. **Access → Applications → Add an application → Self-hosted**.
   - Nome: `Admin Skinmatch`. Durata della sessione: 24 ore.
   - Destinazioni: dominio `skinmatch.it`, percorso `admin`; aggiungere una seconda destinazione `skinmatch.it`,
     percorso `api/admin`.
3. **Policy**: nome `Federico e Sofia`, azione **Allow**, regola *Include → Emails* →
   `hello@agoranomos.cloud`, `sofiashcrescenzi@gmail.com`. Metodo di accesso: *One-time PIN* (codice via email).
4. Salvare, poi dalla pagina dell'applicazione copiare l'**Application Audience (AUD) Tag**.
5. In `wrangler.jsonc` → `vars`: `ACCESS_TEAM` = il nome del team (quello di `<team>.cloudflareaccess.com`),
   `ACCESS_AUD` = il tag copiato. Poi `npx wrangler deploy`.

### Pubblicare dall'admin

«Salva» scrive una versione nuova su D1 (si torna indietro dalla storia); «Pubblica» mette in coda la richiesta.
Sul Mac, ogni quarto d'ora (`launchd com.agoranomos.squadra.skinmatch-pubblica`), `scripts/admin/pubblica.py`
scrive `src/data/*.json`, aggiunge i rinvii 301 per le pagine tolte (`public/_redirects`), fa girare i guardiani,
la build, il commit «Redazione Skinmatch», il push, il deploy e IndexNow. L'esito si legge in admin → Squadra.
⚠️ Chi cambia a mano `src/data/*.json` li vede riscritti alla pubblicazione successiva: si passa dall'admin.

### La squadra

`scripts/admin/registro.py`: Zeno registra gli articoli della Rivista e le informazioni sui prodotti, la
squadra i suoi rapporti. `scripts/admin/vendite.py` scarica ogni mattina le vendite (oggi Adtraction; chiavi in
`~/.skinmatch-segreti.env`, mai nel repo).

Consiglio: collegare il repository a **Workers Builds** (Cloudflare → Workers → skinmatch-sito → Settings →
Builds → Connect) rende il deploy automatico a ogni push, senza dipendere dal Mac.
