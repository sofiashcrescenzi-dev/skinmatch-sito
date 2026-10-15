#!/usr/bin/env python3
"""DALLE SCHEDE AL SITO: la selezione curata che va nel catalogo e nel test (src/data/prodotti.json).

Le schede (feeds-out/schede-<negozio>.json) sono tutte quelle delle marche scelte; nel sito ne va una
selezione: per ogni marca e passaggio i prodotti di più valore (attivi riconosciuti, percentuali
dichiarate, INCI, completezza), un solo formato per prodotto (il più conveniente ogni 10 ml).
Quanti per marca e passaggio dipende dalla decisione: «sì» 5, «selezione» 4, solo alternativa 3.

Uso: python3 scripts/catalogo/al_sito.py liki24
"""
import json, re, sys, unicodedata
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from schede import decisioni, k

R = Path(__file__).resolve().parents[2]
QUANTI = {'si': 5, 'selezione': 4, 'alternativa': 3}
# i passaggi delle schede che il sito usa, con la categoria del catalogo (src/data/catalogo.json)
CATEGORIA = {'detergente': 'detergenti', 'siero': 'sieri', 'esfoliante': 'attivi', 'crema': 'creme', 'spf': 'creme',
             'shampoo': 'shampoo', 'trattamento cute': 'capelli', 'balsamo e maschera capelli': 'capelli', 'barba': 'barba', 'integratore': 'integratori', 'cerotti': 'cerotti'}
BISOGNO = {'idratazione': 'idratazione', 'imperfezioni': 'acne-sebo', 'macchie': 'macchie-luminosita', 'tempo': 'anti-age',
           'calmare': 'rossori-sensibilita', 'barriera': 'barriera-cutanea', 'pori': 'pori-dilatati'}
CHIAVE = {'retinale', 'retinolo', 'retinoide estere', 'bakuchiol', 'niacinamide', 'vitamina C', 'acido salicilico', 'acido glicolico', 'acido lattico', 'acido mandelico',
          'PHA', 'LHA', 'acido azelaico', 'acido tranexamico', 'thiamidol', 'arbutina', 'ceramidi', 'peptidi', 'acido ialuronico', 'centella', 'pantenolo', 'urea', 'zinco', 'acido ferulico'}


def valore(s):
    att = [a for a in s['attivi'] if a['nome'] in CHIAVE]
    return s['completezza'] + 12 * len(att) + 6 * sum(1 for a in att if a['perc']) + (15 if s['inci'] else 0) + (5 if s['bisogni'] else 0)


def prodotto(s):
    p = s.get('pelle') or {}
    tipi = set()
    for v in p.get('sebo', []):
        tipi |= {'alto': {'grassa', 'mista'}, 'medio': {'normale', 'mista'}, 'basso': {'secca'}}[v]
    if p.get('reattiva') == 2:
        tipi.add('sensibile')
    concerns = [BISOGNO[b] for b in s['bisogni'] if b in BISOGNO]
    if s['passaggio'] == 'spf':
        concerns = ['protezione-solare'] + concerns
    cap = s.get('capelli') or {}
    integ = s.get('integrazione') or []
    if s['passaggio'] == 'integratore':
        concerns = [c for c, ok in {'anti-age': 'tono' in integ, 'idratazione': 'pelle-secca' in integ, 'protezione-solare': 'sole' in integ, 'acne-sebo': 'imperfezioni' in integ}.items() if ok]
    uomo = bool(re.search(r'\b(uomo|men|homme|man)\b', s['titolo'], re.I))
    out = {
        'id': s['id'], 'name': s['nome'], 'brand': s['marca'], 'gender': 'uomo' if uomo else 'unisex', 'category': CATEGORIA[s['passaggio']],
        'tier': s['fascia'], 'korean': s['segmento'] == 'K-beauty', 'price': s['prezzo'],
        'description': descrizione(s), 'affiliateUrl': s['link'], 'image': s['immagine'], 'merchant': s['negozio'], 'feedId': f"adtraction:liki24:{s['id_negozio']}",
        'scheda': {k_: s.get(k_) for k_ in ('passaggio', 'momento', 'forza', 'fotosensibilizzante', 'texture', 'profumo', 'spf', 'al_10', 'misura', 'ruolo')}
                  | {'attivi': s['attivi'], 'inci': bool(s['inci']), 'completezza': s['completezza']},
    }
    if s['passaggio'] in ('shampoo', 'trattamento cute', 'balsamo e maschera capelli'):
        out['hairConcerns'] = cap.get('bisogni') or ['mantenimento']
        out['scalpTypes'] = cap.get('cute') or ['normale']
    elif s['passaggio'] == 'integratore':
        out['concerns'] = concerns
        hc = [c for c in ('caduta',) if 'capelli' in integ or 'unghie' in integ]
        if hc:
            out['hairConcerns'] = hc
    else:
        out['skinTypes'] = sorted(tipi) or ['normale', 'mista', 'secca', 'grassa']
        out['concerns'] = concerns
        if s['passaggio'] == 'barba':
            out['beardConcerns'] = ['irritazione' if re.search(r'irritaz|lenitiv|sensibil', s['titolo'], re.I) else 'mantenimento']
    if s['gravidanza'] is not None:
        out['pregnancySafe'] = s['gravidanza']
    if p.get('reattiva') == 2:
        out['sensitiveSafe'] = True
    elif p.get('reattiva') == 0:
        out['sensitiveSafe'] = False
    return out


def descrizione(s):
    pezzi = []
    if s.get('texture'):
        pezzi.append(s['texture'].capitalize())
    att = [a['nome'] + (f" {str(a['perc']).replace('.', ',')}%" if a['perc'] else '') for a in s['attivi'] if a['nome'] in CHIAVE][:3]
    if att:
        pezzi.append('con ' + ', '.join(att))
    if s.get('spf'):
        pezzi.append(f"SPF {s['spf']}")
    if s.get('misura'):
        m = s['misura']; pezzi.append(f"{m['valore']:g} {m['unita']}")
    return ' · '.join(pezzi) or s['nome']


def main():
    neg = sys.argv[1] if len(sys.argv) > 1 else 'liki24'
    schede = json.loads((R / 'feeds-out' / f'schede-{neg}.json').read_text())
    dec = decisioni()
    gruppi = defaultdict(list)
    for s in schede:
        if s['passaggio'] not in CATEGORIA or not s.get('immagine') or not s.get('prezzo') or not s.get('link'):
            continue
        gruppi[(s['marca'], s['passaggio'])].append(s)
    scelti = []
    for (marca, pas), ss in gruppi.items():
        # un solo formato per prodotto: il più conveniente ogni 10 ml
        per_nome = {}
        for s in ss:
            n = re.sub(r'\s+', ' ', unicodedata.normalize('NFD', s['nome'].lower()).encode('ascii', 'ignore').decode())
            n = re.sub(r'\b(ricarica|refill|maxi|formato|confezione|promo|offerta)\b.*', '', n).strip(' ,')
            if n not in per_nome or (s['al_10'] or 999) < (per_nome[n]['al_10'] or 999):
                per_nome[n] = s
        x = dec[k(marca)]
        quota = QUANTI['alternativa'] if 'alternativa' in (x.get('nota') or '').lower() else QUANTI[x['decisione']]
        scelti += sorted(per_nome.values(), key=valore, reverse=True)[:quota]
    prodotti = [prodotto(s) for s in scelti]
    prodotti.sort(key=lambda p: (p['category'], p['brand'], p['name']))
    (R / 'src' / 'data' / 'prodotti.json').write_text(json.dumps({'_nota': f'La selezione dalle schede di {neg} (scripts/catalogo/al_sito.py). Non si modifica a mano: si rigenera.', 'prodotti': prodotti}, ensure_ascii=False, separators=(',', ':')))
    from collections import Counter
    print(len(prodotti), 'prodotti nel sito;', dict(Counter(p['category'] for p in prodotti)))
    print('con INCI:', sum(1 for p in prodotti if p['scheda']['inci']), '· gravidanza sì/no:', sum(1 for p in prodotti if p.get('pregnancySafe') is True), sum(1 for p in prodotti if p.get('pregnancySafe') is False))


if __name__ == '__main__' and '--lista' not in sys.argv:
    main()


def da_arricchire(neg='liki24', quanti=400):
    """La lista di lavoro per Zeno: i prodotti del sito senza INCI, prima i più importanti (premium e
    K-beauty, poi sieri e trattamenti, poi il resto). Zeno trova l'INCI ufficiale e lo registra con
    `python3 scripts/admin/registro.py arricchimento --prodotto <id> --campo inci --valore "<INCI>" --fonte <url>`."""
    prodotti = json.loads((R / 'src' / 'data' / 'prodotti.json').read_text())['prodotti']
    schede = {s['id']: s for s in json.loads((R / 'feeds-out' / f'schede-{neg}.json').read_text())}
    ordine_cat = {'sieri': 0, 'attivi': 0, 'creme': 1, 'detergenti': 2, 'shampoo': 3, 'capelli': 3, 'barba': 4, 'integratori': 5}
    lista = []
    for p in prodotti:
        s = schede.get(p['id'])
        if not s or s['inci']:
            continue
        pr = (0 if s['segmento'] in ('Medicale premium', 'K-beauty') else 1, ordine_cat.get(p['category'], 6))
        lista.append((pr, {'id': p['id'], 'marca': p['brand'], 'nome': p['name'], 'titolo': s['titolo'], 'gtin': s.get('gtin'), 'mancano': s['mancano']}))
    lista.sort(key=lambda x: x[0])
    out = [x for _, x in lista[:quanti]]
    (R / 'feeds-out' / f'da-arricchire-{neg}.json').write_text(json.dumps(out, ensure_ascii=False, indent=0))
    return len(lista), len(out)


if __name__ == '__main__' and len(sys.argv) > 2 and sys.argv[2] == '--lista':
    print(da_arricchire(sys.argv[1]))
