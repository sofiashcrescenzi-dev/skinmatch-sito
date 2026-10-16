-- IL DATABASE DI SKINMATCH (D1 «skinmatch-dati», account di Sofia).
-- Applicare con: npx wrangler d1 execute skinmatch-dati --remote --file scripts/admin/schema.sql

-- I conteggi del sito, senza dati personali: test iniziati e finiti per percorso, biotipi
-- usciti, clic verso i negozi per prodotto, negozio e pagina. Una riga per giorno e chiave.
CREATE TABLE IF NOT EXISTS eventi_giorno (
  giorno TEXT NOT NULL, tipo TEXT NOT NULL, chiave TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (giorno, tipo, chiave)
);

-- Le versioni dei dati modificati dall'admin (test, biotipi, glossario, catalogo): ogni
-- salvataggio è una riga nuova, l'ultima per tipo è quella in lavorazione. pubblicato_il si
-- segna quando la pubblicazione l'ha portata online.
CREATE TABLE IF NOT EXISTS documenti (
  id INTEGER PRIMARY KEY AUTOINCREMENT, tipo TEXT NOT NULL, dati TEXT NOT NULL, chi TEXT, nota TEXT,
  creato_il TEXT NOT NULL DEFAULT (datetime('now')), pubblicato_il TEXT
);
CREATE INDEX IF NOT EXISTS documenti_tipo ON documenti (tipo, id);

-- Gli articoli della Rivista: Zeno li propone, Federico o Sofia li approvano, la pubblicazione li porta online.
CREATE TABLE IF NOT EXISTS articoli (
  id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, titolo TEXT NOT NULL, sommario TEXT, tipo TEXT,
  testo TEXT NOT NULL, immagine TEXT, prodotti TEXT, biotipi TEXT, termini TEXT, parole INTEGER,
  -- i termini del glossario che l'articolo spiega (16/10, ALTER TABLE): lo mostrano sotto il termine e nei prodotti
  approfondisce TEXT,
  stato TEXT NOT NULL DEFAULT 'in_approvazione', feedback TEXT, autore TEXT NOT NULL DEFAULT 'zeno',
  creato_il TEXT NOT NULL DEFAULT (datetime('now')), aggiornato_il TEXT, pubblicato_il TEXT
);

-- Le richieste di pubblicazione dall'admin: le esegue il Mac (scripts/admin/pubblica.py).
CREATE TABLE IF NOT EXISTS pubblicazioni (
  id INTEGER PRIMARY KEY AUTOINCREMENT, chi TEXT, cosa TEXT, stato TEXT NOT NULL DEFAULT 'in_coda', esito TEXT,
  chiesta_il TEXT NOT NULL DEFAULT (datetime('now')), fatta_il TEXT
);

-- I rapporti della squadra su Skinmatch (Jarvis, Friday, Zeno).
CREATE TABLE IF NOT EXISTS squadra (
  id INTEGER PRIMARY KEY AUTOINCREMENT, agente TEXT NOT NULL, tipo TEXT NOT NULL, titolo TEXT NOT NULL, sintesi TEXT,
  corpo TEXT, esito TEXT, creato_il TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Le segnalazioni della squadra: idee e problemi su cui Federico e Sofia decidono (16/10/2026, come su
-- Agoranomos). «Sì» = in_lavoro (a Jarvis), «Dopo» = dopo, «No» = scartata; Jarvis le chiude (fatta).
CREATE TABLE IF NOT EXISTS segnalazioni (
  id INTEGER PRIMARY KEY AUTOINCREMENT, rapporto_id INTEGER, agente TEXT NOT NULL, gravita TEXT, titolo TEXT NOT NULL,
  dettaglio TEXT, proposta TEXT, stato TEXT NOT NULL DEFAULT 'aperta', nota_po TEXT, chi TEXT,
  creato_il TEXT NOT NULL DEFAULT (datetime('now')), aggiornato_il TEXT
);
CREATE INDEX IF NOT EXISTS idx_segnalazioni_stato ON segnalazioni (stato, creato_il);

-- Le marche da conoscere meglio (16/10/2026, Federico): da studiare, da confrontare, da trovare in un negozio;
-- con il contatto per scrivergli (email e pagina dove l'abbiamo trovata). Si gestiscono in admin › Marche.
CREATE TABLE IF NOT EXISTS marche_studio (
  id INTEGER PRIMARY KEY AUTOINCREMENT, marca TEXT NOT NULL UNIQUE, gruppo TEXT NOT NULL, perche TEXT, origine TEXT,
  sito TEXT, email TEXT, email_fonte TEXT, contatto_nota TEXT, stato TEXT NOT NULL DEFAULT 'da_studiare', note TEXT,
  chi TEXT, creato_il TEXT NOT NULL DEFAULT (datetime('now')), aggiornato_il TEXT
);

-- Le riscritture dei testi del test proposte da Zeno (16/10/2026, Federico: «più autorevole e meno da IA»): una per
-- campo, «prima» e «dopo»; in admin › Domande «Usa questa» la mette nella bozza del test, che poi si salva e si pubblica.
CREATE TABLE IF NOT EXISTS riscritture (
  id INTEGER PRIMARY KEY AUTOINCREMENT, agente TEXT NOT NULL, documento TEXT NOT NULL DEFAULT 'test', percorso TEXT NOT NULL,
  prima TEXT, dopo TEXT NOT NULL, motivo TEXT, stato TEXT NOT NULL DEFAULT 'proposta', nota TEXT, chi TEXT,
  creato_il TEXT NOT NULL DEFAULT (datetime('now')), aggiornato_il TEXT
);

-- Le vendite dalle reti di affiliazione (le scarica il Mac ogni mattina: scripts/admin/vendite.py).
CREATE TABLE IF NOT EXISTS vendite (
  id TEXT PRIMARY KEY, rete TEXT NOT NULL, negozio TEXT, data TEXT, importo REAL, commissione REAL, stato TEXT, subid TEXT,
  aggiornato_il TEXT NOT NULL DEFAULT (datetime('now'))
);

-- L'arricchimento del catalogo: informazioni trovate sui prodotti (schede dei produttori, INCI,
-- feed), con la fonte. Approvate, diventano correzioni del catalogo.
CREATE TABLE IF NOT EXISTS arricchimenti (
  id INTEGER PRIMARY KEY AUTOINCREMENT, prodotto TEXT NOT NULL, campo TEXT NOT NULL, valore TEXT NOT NULL, fonte TEXT,
  stato TEXT NOT NULL DEFAULT 'proposto', chi TEXT, creato_il TEXT NOT NULL DEFAULT (datetime('now'))
);
