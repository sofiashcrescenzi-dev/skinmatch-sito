#!/usr/bin/env python3
"""LE MARCHE DI UN NEGOZIO NUOVO, per decidere quali entrano (come fatto per Liki24 il 15/10).
⚠️ Clubfarma (Awin) è stato analizzato il 16/10 e tolto del tutto dal PO: niente confronti tra negozi.

Per ogni marca: i prodotti utili al test (stessi passaggi ed esclusioni delle schede), le categorie,
i prezzi, gli attivi riconosciuti, qualche esempio, e il confronto con Liki24 sugli stessi EAN.
Le marche già decise in decisioni_marche.json valgono anche qui e stanno in un elenco a parte.
Scrive feeds-out/marche-<negozio>.json, la base della pagina di revisione per il PO.

Uso: python3 scripts/catalogo/marche_negozio.py farmaself
"""
import argparse, json, re, statistics, sys
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import fonti, traduci, inci as I
from schede import ESCLUSI, k, decisioni

R = Path(__file__).resolve().parents[2]
CAT = {'detergente': 'detergenti', 'tonico': 'detergenti', 'siero': 'sieri', 'crema': 'creme', 'spf': 'solari', 'esfoliante': 'trattamenti',
       'maschera': 'trattamenti', 'contorno occhi': 'creme', 'shampoo': 'shampoo', 'trattamento cute': 'capelli', 'balsamo e maschera capelli': 'capelli',
       'barba': 'barba', 'integratore': 'integratori', 'cerotti': 'cerotti'}
CHIAVE = {'retinale', 'retinolo', 'retinoide estere', 'bakuchiol', 'niacinamide', 'vitamina C', 'acido salicilico', 'acido glicolico', 'acido lattico', 'acido mandelico',
          'PHA', 'LHA', 'acido azelaico', 'acido tranexamico', 'thiamidol', 'arbutina', 'ceramidi', 'peptidi', 'acido ialuronico', 'centella', 'pantenolo', 'urea',
          'zinco', 'acido ferulico', 'biotina', 'collagene', 'caffeina'}


def utile(r):
    t = r['titolo'].lower()
    for motivo, rx in ESCLUSI:
        if re.search(rx, t):
            return None
    pas = traduci.passaggio(r['titolo'])
    if not pas or pas not in CAT:
        return None
    if pas == 'integratore':
        testo = (r['titolo'] + ' ' + (r['descrizione'] or '')[:400]).lower()
        if not re.search(r'capelli|unghie|pelle|cute|collagen|ialuronic|biotin|cheratin|cistin|astaxant|carotene|polypodium|fernblock|abbronzatura|sole|solare|hair|skin|nails|beauty|bellezza', testo):
            return None
        if re.search(r'multivitamin|energia|immunitar|neuro|memoria|sonno|stanchezza|articolaz|digest|intestin|cardio|colesterol', t):
            return None
    return pas


def nome_marca(varianti):
    # la grafia più usata che non sia tutta maiuscola, se c'è
    for v, _ in varianti.most_common():
        if not v.isupper():
            return v
    v = varianti.most_common(1)[0][0]
    return v if len(v) <= 4 else v.title()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('negozio', choices=['farmaself'])
    ap.add_argument('--file')
    a = ap.parse_args()
    dec = decisioni()
    liki = {(s.get('gtin') or '').lstrip('0'): s for s in json.loads((R / 'feeds-out' / 'schede-liki24.json').read_text()) if s.get('gtin')}
    tutti, per = 0, defaultdict(list)
    varianti = defaultdict(Counter)
    for r in getattr(fonti, a.negozio)(a.file):
        tutti += 1
        if not r['marca']:
            continue
        pas = utile(r)
        if pas:
            per[k(r['marca'])].append((r, pas))
            varianti[k(r['marca'])][r['marca']] += 1
    marche = []
    for kk, xs in per.items():
        prezzi = sorted(x['prezzo'] for x, _ in xs if x.get('prezzo'))
        att = Counter(at['nome'] for x, _ in xs for at in I.attivi(x['titolo'] + ' . ' + (x['descrizione'] or '')[:600]) if at['nome'] in CHIAVE)
        pari = [(x['prezzo'], liki[(x.get('gtin') or '').lstrip('0')]['prezzo']) for x, _ in xs if (x.get('gtin') or '').lstrip('0') in liki and x.get('prezzo')]
        es = sorted(xs, key=lambda y: -len([1 for at in I.attivi(y[0]['titolo']) if at['nome'] in CHIAVE]))[:4]
        d = dec.get(kk)
        marche.append({
            'm': nome_marca(varianti[kk]), 'k': kk, 'n': len(xs),
            'cat': Counter(CAT[p] for _, p in xs).most_common(),
            'prezzo': [prezzi[0], round(statistics.median(prezzi), 2), prezzi[-1]] if prezzi else None,
            'attivi': [n for n, _ in att.most_common(5)],
            'es': [f"{traduci.nome_pulito(x['titolo'], x['marca'])[:80]} · {x['prezzo']:.2f} €" for x, _ in es if x.get('prezzo')],
            'ean': sum(1 for x, _ in xs if x.get('gtin')),
            'liki': {'stessi': len(pari), 'meno': sum(1 for c, l in pari if c < l * 0.97), 'simile': sum(1 for c, l in pari if abs(c - l) <= l * 0.03)},
            'decisa': ({'decisione': d['decisione'], 'segmento': d['segmento'], 'nota': d.get('nota', '')} if d else None),
        })
    marche.sort(key=lambda b: -b['n'])
    out = {'negozio': a.negozio, 'prodotti': tutti, 'utili': sum(b['n'] for b in marche), 'marche': marche}
    (R / 'feeds-out' / f'marche-{a.negozio}.json').write_text(json.dumps(out, ensure_ascii=False, indent=0))
    nuove = [b for b in marche if not b['decisa']]
    print(f"{tutti} prodotti, {out['utili']} utili, {len(marche)} marche con prodotti utili; già decise {len(marche) - len(nuove)}, nuove {len(nuove)}")
    print('nuove con almeno 5 utili:', sum(1 for b in nuove if b['n'] >= 5))
    for b in nuove[:90]:
        print(f"{b['n']:4} {b['m'][:28]:28} {dict(b['cat'][:4])} {b['prezzo']} {b['attivi'][:4]} | {b['es'][0][:70] if b['es'] else ''}")


if __name__ == '__main__':
    main()
