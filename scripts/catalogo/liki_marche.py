"""Le marche del catalogo Liki24 utile a Skinmatch, con i numeri per decidere (15/10/2026).
Uso: python3 scripts/catalogo/liki_marche.py feeds-out/liki-utili.json feeds-out/liki-marche.json"""
import json, sys, re, unicodedata, statistics as st
from collections import Counter, defaultdict

def chiave(b):
    b = unicodedata.normalize('NFD', b).encode('ascii', 'ignore').decode().lower()
    return re.sub(r'[^a-z0-9]+', ' ', b).strip()

prodotti = json.load(open(sys.argv[1]))
nomi = Counter()
for p in prodotti:
    if not p['marca']:
        # i titoli Liki24 finiscono con la marca: «Effaclar Duo+, 40 ml, La Roche-Posay»
        p['marca'] = p['titolo'].rsplit(',', 1)[-1].strip() if ',' in p['titolo'] else ''
    nomi[(chiave(p['marca']), p['marca'])] += 1
bella = {}
for (k, b), n in sorted(nomi.items(), key=lambda kv: -kv[1]):
    bella.setdefault(k, b)
per = defaultdict(list)
for p in prodotti:
    if p['marca']: per[bella[chiave(p['marca'])]].append(p)
righe = []
for b, ps in per.items():
    prezzi = sorted(p['prezzo'] for p in ps if p['prezzo'])
    alml = sorted(p['al_ml'] for p in ps if p['al_ml'])
    righe.append({'marca': b, 'n': len(ps), 'categorie': dict(Counter(p['categoria'] for p in ps).most_common()),
                  'prezzo': [prezzi[0], round(st.median(prezzi), 2), prezzi[-1]] if prezzi else None,
                  'al_10ml': round(st.median(alml), 2) if alml else None,
                  'attivi': [a for a, _ in Counter(a for p in ps for a in p['attivi']).most_common(6)],
                  'esempi': [p['titolo'] for p in sorted(ps, key=lambda p: -(len(p['attivi'])))[:4]]})
righe.sort(key=lambda r: -r['n'])
json.dump(righe, open(sys.argv[2], 'w'), ensure_ascii=False, indent=0)
json.dump(prodotti, open(sys.argv[1], 'w'), ensure_ascii=False)
print(len(righe), 'marche;', sum(1 for r in righe if r['n'] >= 10), 'con almeno 10 prodotti utili')
