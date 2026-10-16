#!/usr/bin/env python3
"""L'AGGIORNAMENTO DEL CATALOGO, ogni mattina nel turno di Jarvis (zero token).

1. il feed di Liki24: se c'è FEED_LIKI24 in ~/.skinmatch-segreti.env lo riscarica (prezzi e disponibilità
   nuovi), se no usa l'ultima copia in feeds-out/liki24.csv;
2. le schede con l'arricchimento (Open Beauty Facts, stesso prodotto in altro formato, INCI approvati in admin),
   e quelle degli altri negozi attivi in admin (Farmaself, Beautycos), che completano Liki24: entrano solo i prodotti
   scelti dal PO, e lo stesso prodotto passa al negozio nuovo solo se costa almeno il 10% in meno;
3. la selezione per il sito (src/data/prodotti.json) e la lista di lavoro per Zeno;
4. i clic degli ultimi 90 giorni per prodotto (l'ordine «Più scelti» del catalogo);
5. se qualcosa è cambiato, mette in coda la pubblicazione (la esegue scripts/admin/pubblica.py).
"""
import hashlib, subprocess, sys, urllib.request
from pathlib import Path

R = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).parent))
import fonti

feed = R / 'feeds-out' / 'liki24.csv'
url = fonti.segreto('FEED_LIKI24')
if url:
    try:
        feed.write_text(fonti._testo(url))
        print('feed Liki24 aggiornato')
    except Exception as e:
        print('feed Liki24 non scaricato, uso la copia:', type(e).__name__)
FILE = [R / 'src/data' / n for n in ('prodotti.json', 'schede.json', 'clic.json')]
impronta = lambda: hashlib.md5(b''.join(f.read_bytes() for f in FILE if f.exists())).hexdigest()
prima = impronta()
subprocess.run([sys.executable, str(Path(__file__).parent / 'clic.py')], cwd=R)
# gli altri negozi attivi in admin (oggi Farmaself) completano Liki24: stesso giro, il loro feed e le loro schede
import json
altri = []
for n in json.loads((R / 'src/data/negozi.json').read_text())['negozi']:
    if n['id'] == 'liki24' or not n['attivo']:
        continue
    url_n, file_n = fonti.segreto(f"FEED_{n['id'].upper()}"), R / 'feeds-out' / f"{n['id']}.raw"
    if url_n:
        try:
            file_n.write_bytes(fonti._testo(url_n).encode('utf-8'))
            print(f"feed {n['nome']} aggiornato")
        except Exception as e:
            print(f"feed {n['nome']} non scaricato, uso la copia:", type(e).__name__)
    if file_n.exists():
        altri.append(['schede.py', n['id'], '--file', str(file_n), '--arricchisci'])  # anche qui gli INCI approvati in admin
for cmd in (['schede.py', 'liki24', '--file', str(feed), '--arricchisci'], *altri, ['al_sito.py', 'liki24'], ['al_sito.py', 'liki24', '--lista']):
    r = subprocess.run([sys.executable, str(Path(__file__).parent / cmd[0]), *cmd[1:]], capture_output=True, text=True, cwd=R)
    if r.returncode:
        sys.exit(f'{cmd[0]}: {r.stderr[-800:]}')
dopo = impronta()
if prima != dopo:
    sys.path.insert(0, str(R / 'scripts' / 'admin'))
    from d1 import sql
    sql("INSERT INTO pubblicazioni (chi, cosa) VALUES ('jarvis', 'catalogo aggiornato dal feed')")
    print('catalogo cambiato: pubblicazione in coda')
else:
    print('catalogo invariato')
