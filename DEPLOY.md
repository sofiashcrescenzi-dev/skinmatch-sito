# Deploy e infrastruttura — skinmatch.it

Documento operativo: com'è ospitato il sito, come si aggiorna, com'è messo il DNS,
e i passaggi per portare `skinmatch.it` online (stesso schema già usato per
sofiacrescenzi.it).

Ultimo aggiornamento: 2026-09-21

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
