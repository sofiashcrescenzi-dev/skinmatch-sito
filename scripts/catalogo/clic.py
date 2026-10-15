#!/usr/bin/env python3
"""I CLIC VERSO I NEGOZI, per prodotto, negli ultimi 90 giorni (D1, eventi_giorno): l'ordine «Più scelti»
del catalogo. Scrive src/data/clic.json; se D1 non risponde lascia il file com'è.
Solo conteggi per prodotto, nessun dato personale (worker/index.js, /api/evento).

Uso: python3 scripts/catalogo/clic.py
"""
import json, sys
from pathlib import Path

R = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(R / 'scripts' / 'admin'))

try:
    from d1 import sql
    righe = sql("SELECT chiave, SUM(n) AS n FROM eventi_giorno WHERE tipo = 'clic' AND giorno >= date('now', '-90 day') GROUP BY chiave")
except Exception as e:
    sys.exit(f'clic non letti da D1, resta il file di prima: {type(e).__name__}')
clic = {r['chiave']: int(r['n']) for r in righe if r['n']}
(R / 'src' / 'data' / 'clic.json').write_text(json.dumps({'_nota': 'Clic verso i negozi per prodotto, ultimi 90 giorni (scripts/catalogo/clic.py). Non si modifica a mano.', 'clic': dict(sorted(clic.items()))}, ensure_ascii=False, indent=0) + '\n')
print(len(clic), 'prodotti con clic')
