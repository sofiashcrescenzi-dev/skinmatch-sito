# Deploy e infrastruttura — skinmatch.it

Documento operativo: com'è ospitato il sito, come si aggiorna e dove sta ogni cosa. Serve a chiunque debba riprendere
il sito senza di noi. Chi entra dove e di chi è ogni account sta nel documento delle utenze condiviso fra Sofia e Federico, fuori dal
repository; le password mai nel repository.

Ultimo aggiornamento: 2026-11-20 (riscritto: la versione di settembre diceva il dominio ancora da collegare).

---

## 1. In breve

- Il sito è un'app **Next.js** esportata come **sito statico** (`next build` con `output: 'export'` → `out/`).
- È ospitato su **Cloudflare** come Worker `skinmatch-sito` (asset statici + un Worker piccolo su `/api/*` e
  `/admin*`), configurato da `wrangler.jsonc`, sull'account Cloudflare di Sofia.
- Dominio **skinmatch.it**: registrato su **Aruba**, nameserver di **Cloudflare** (hunts/eloise.ns.cloudflare.com),
  collegato al Worker. Indirizzo tecnico sempre attivo: `skinmatch-sito.sofiashcrescenzi.workers.dev`.
- Database **D1 `skinmatch-dati`** (admin, conteggi, social, pubblicazioni), sempre sull'account di Sofia.
- Codice su GitHub: `sofiashcrescenzi-dev/skinmatch-sito` (privato).

## 2. Come si aggiorna il sito

- **Ogni push su `main` va online da solo** in 2-5 minuti (build e deploy di Cloudflare collegati al repository).
- **Le modifiche fatte nell'admin** vanno online col bottone «Pubblica»: mette una riga `in_coda` nella tabella D1
  `pubblicazioni`; il Mac di Federico la prende entro 15 minuti (`scripts/admin/pubblica.py`, launchd
  `com.agoranomos.squadra.skinmatch-pubblica`), scrive `src/data/*.json`, fa build, guardiani, commit, push e deploy.
- Dopo un push di codice che tocca i dati dell'admin, si mette in coda anche una pubblicazione.
- Mai cambiare a mano `src/data/*.json`: la pubblicazione li riscrive dall'admin.

## 2b. Il catalogo

Dal 15/10/2026 il catalogo nasce dai feed dei negozi (Liki24 per primo, poi Farmaself, Beautycos e gli altri di
`src/data/negozi.json`) con la pipeline `scripts/catalogo/` (fonti → inci → traduci → schede → al_sito), ogni mattina
sul Mac. I feed sono in `~/.skinmatch-segreti.env` (`FEED_<NEGOZIO>`). Gli script CJ di `scripts/feeds/` (Notino,
Marionnaud, QVC) sono del prototipo e non si usano più.

## 3. Dominio e DNS — stato

- [x] Dominio registrato su Aruba
- [x] Zona su Cloudflare, nameserver cambiati su Aruba
- [x] `skinmatch.it` collegato al Worker, certificato attivo
- [x] Search Console verificata (account Google di Skinmatch), sitemap inviata
- [ ] Privacy WHOIS su Aruba: la richiesta di nascondere i dati del titolare non risulta confermata, da controllare
- [ ] Posta sul dominio: Google Workspace su skinmatch.it, quando si attiva

## 4. Accessi

Il documento delle utenze dice, per ogni servizio, a cosa serve, con quale account si entra, di chi è e dove sta
l'accesso. In sintesi: GitHub, Cloudflare e Aruba sono di Sofia; le chiavi dei programmi stanno sul Mac di Federico in
`~/.skinmatch-segreti.env` (e nei file `~/.skinmatch-*.json`), mai nel repository.

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

### Cloudflare Access — attivo dal 2026-10-16

- Team: `fragrant-dawn-e18a` (`fragrant-dawn-e18a.cloudflareaccess.com`), nome assegnato da Cloudflare.
- Applicazione **Admin Skinmatch** (self-hosted): `skinmatch.it/admin` e `skinmatch.it/api/admin`, con tutte le
  sottopagine; sessione di 24 ore; accesso solo con **codice via email** (One-time PIN).
- Policy **Federico e Sofia** (Allow): `sofiashcrescenzi@gmail.com`, `hello@agoranomos.cloud`. Per aggiungere una
  persona: Zero Trust → Access → Applications → Admin Skinmatch → Policies, e la stessa email in `ADMIN_EMAILS`.
- In `wrangler.jsonc` → `vars`: `ACCESS_TEAM` e `ACCESS_AUD` (l'Application Audience tag) già impostati: il Worker
  ricontrolla il gettone di Access anche su workers.dev, dove Access non c'è.
- Configurato via API con un token Access (in `~/.secrets/cloudflare-access.env` sul Mac di Sofia, mai nel repo).

### Attivare Cloudflare Access (procedura originale, già fatta)

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
