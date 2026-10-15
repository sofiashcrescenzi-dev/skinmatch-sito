#!/usr/bin/env python3
"""L'AGGIORNAMENTO DEL CATALOGO, ogni mattina nel turno di Jarvis (zero token).

1. il feed di Liki24: se c'è FEED_LIKI24 in ~/.skinmatch-segreti.env lo riscarica (prezzi e disponibilità
   nuovi), se no usa l'ultima copia in feeds-out/liki24.csv;
2. le schede con l'arricchimento (Open Beauty Facts, stesso prodotto in altro formato, INCI approvati in admin);
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
for cmd in (['schede.py', 'liki24', '--file', str(feed), '--arricchisci'], ['al_sito.py', 'liki24'], ['al_sito.py', 'liki24', '--lista']):
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
