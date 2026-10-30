#!/usr/bin/env python3
"""I PREZZI LETTI SULLE PAGINE DEL NEGOZIO, una volta al mese (Federico, 30/10/2026: «se clubfarma non aggiorna,
allora va fatto check sul sito almeno una volta al mese»).

Il feed Awin di Clubfarma è fermo al 5 giugno 2026 e a campione 7 prezzi su 8 erano cambiati. Qui si apre, con calma
(uno ogni due secondi), la pagina di ogni prodotto delle marche scelte (feeds-out/schede-<negozio>.json, mai il link
tracciato) e si salvano prezzo e disponibilità in feeds-out/prezzi-<negozio>.json. fonti.clubfarma() usa solo i prezzi
controllati da meno di fonti.PREZZI_VALIDI giorni: gli altri prodotti restano senza prezzo e non vanno sul sito.

Gira il primo del mese (launchd com.agoranomos.squadra.skinmatch-prezzi); a mano: python3 prezzi_pagine.py clubfarma
"""
import json, re, sys, time, urllib.error, urllib.request
from datetime import date
from pathlib import Path

R = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).parent))
from fonti import UA

# come si leggono prezzo e disponibilità, per negozio (PrestaShop: il prezzo con l'IVA è nel meta di Open Graph)
LETTURA = {
    'clubfarma': {
        'prezzo': re.compile(r'<meta\s+property="product:price:amount"\s+content="([\d.]+)"'),
        'esaurito': re.compile(r'"availability"\s*:\s*"https?://schema\.org/(?:OutOfStock|SoldOut|Discontinued)"'),
    },
}
PAUSA = 2.0


def leggi(negozio, url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept-Language': 'it-IT,it;q=0.9'})
        h = urllib.request.urlopen(req, timeout=40).read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        # la pagina non c'è più: il prodotto non si vende
        return {'prezzo': None, 'disponibile': False, 'il': date.today().isoformat(), 'nota': f'HTTP {e.code}'} if e.code in (404, 410) else None
    except Exception:
        return None
    m = LETTURA[negozio]['prezzo'].search(h)
    if not m:
        return None
    return {'prezzo': round(float(m.group(1)), 2), 'disponibile': not LETTURA[negozio]['esaurito'].search(h), 'il': date.today().isoformat()}


def main(negozio):
    schede = json.loads((R / 'feeds-out' / f'schede-{negozio}.json').read_text())
    file = R / 'feeds-out' / f'prezzi-{negozio}.json'
    prezzi = json.loads(file.read_text()) if file.exists() else {}
    url = sorted({s['url_negozio'] for s in schede if s.get('url_negozio')})
    letti = falliti = 0
    for i, u in enumerate(url):
        r = leggi(negozio, u)
        if r:
            prezzi[u] = r
            letti += 1
        else:
            falliti += 1
        if i % 50 == 49:
            file.write_text(json.dumps(prezzi, ensure_ascii=False, indent=0))
        time.sleep(PAUSA)
    file.write_text(json.dumps(prezzi, ensure_ascii=False, indent=0))
    esauriti = sum(1 for u in url if u in prezzi and not prezzi[u]['disponibile'])
    print(f'{negozio}: {letti} pagine lette su {len(url)}, {falliti} non lette, {esauriti} esauriti')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'clubfarma')
