#!/usr/bin/env python3
"""LE SCHEDE DEL CATALOGO DI SKINMATCH, da un negozio (oggi Liki24; poi gli altri con la stessa strada).

  python3 scripts/catalogo/schede.py liki24 [--file feed.csv] [--arricchisci]

1. legge il negozio (fonti.py) e tiene solo i prodotti delle marche decise da Federico e Sofia
   (decisioni_marche.json): «sì» tutti, «selezione» solo le linee indicate, «solo alternativa
   economica e con attivi» solo i prodotti con attivi riconosciuti, segnati come alternativa;
2. toglie quello che non serve al test (corpo, prima infanzia, trucco, tinte e decolorazioni) e lo
   scrive nel registro di quello che togliamo (esclusi-<negozio>.json), con il motivo;
3. traduce ogni prodotto nella scheda (traduci.py), con le fonti di ogni campo;
4. con --arricchisci cerca l'INCI che manca (Open Beauty Facts per codice a barre, e le informazioni
   approvate in admin) e ritraduce;
5. scrive schede-<negozio>.json e un rapporto con la completezza e la lista di lavoro per Zeno.
"""
import argparse, json, re, sys, unicodedata
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import fonti, traduci, inci as I

R = Path(__file__).resolve().parents[2]
OUT = R / 'feeds-out'

ESCLUSI = [
    ('trucco', r'fondotinta|mascara|rossetto|matita|ombretto|correttore|cipria|blush|bronzer|primer|cushion|\bbb cream\b|\bcc cream\b|skintint|tinted'),
    ('tinta e decolorazione', r'\btint[ae]\b|colorazione|colorante|decolorant|nutricolor|nutri color|color touch|\bhenné|henna|ritocco radici'),
    ('corpo', r'\bcorpo\b|\bbody\b|mani\b|piedi|gambe|seno|smagliature|cellulite|intim|bagnoschiuma|doccia|deodorant|crema mani|labbra|lip\b|stick labbra|doposole|after ?sun'),
    ('prima infanzia', r'bambin|neonat|baby|b[eéè]b[eéè]|pediatric|lattant|\bkids?\b|pannolin'),
    ('accessori e cofanetti', r'cofanett|cofre|coffret|confezione|set regalo|\bset\b|\bkit\b|\bduo\b|pochette|trousse|spugn|pennell|dischetti|pad\b|applicator|campione|sample|omaggio|in regalo|bi-?pack|\b2\s?x\s?\d|\b2x\b(?!\s*effect)|\b\d+\s?\+\s?\d+\s?(?:compresse|capsule|cpr|cps|bustine)'),
    ('profumo', r'eau de|profumo\b|fragranza\b|acqua profumata'),
    ('altro', r'autoabbronzant|depilat|rasoio|smalto|dentifric|collutor|tisana|lenti a contatto|collirio|styling|fissante|\blacca\b|cera per capelli'),
]


def k(t):
    return re.sub(r'[^a-z0-9]+', ' ', unicodedata.normalize('NFD', t or '').encode('ascii', 'ignore').decode().lower()).strip()


def _base(nome):
    """Il nome senza formato e confezione, per riconoscere lo stesso prodotto."""
    n = k(nome)
    n = re.sub(r'\b(ricarica|refill|maxi|mini|travel|formato|confezione|promo|offerta|duo|trio|set|x ?\d+)\b', ' ', n)
    return re.sub(r'\s+', ' ', re.sub(r'\b\d+\b', ' ', n)).strip()


def decisioni():
    d = json.loads((Path(__file__).parent / 'decisioni_marche.json').read_text())
    return {k(x['marca']): x for x in d['marche']}


def scegli(r, dec):
    """(tenere?, motivo, ruolo)"""
    x = dec.get(k(r['marca']))
    if not x:
        return False, 'marca non scelta', None
    if x['decisione'] == 'no':
        return False, 'marca esclusa', None
    t = r['titolo'].lower()
    for motivo, rx in ESCLUSI:
        if re.search(rx, t):
            return False, motivo, None
    pas = traduci.passaggio(r['titolo'])
    if not pas:
        return False, 'non è un passaggio della routine', None
    if pas == 'integratore' and not re.search(r'capelli|unghie|pelle|cute|collagen|ialuronic|biotin|cheratin|cistin|astaxant|carotene|polypodium|fernblock|abbronzatura|sole|solare|hair|skin|nails|beauty|bellezza', (r['titolo'] + ' ' + (r['descrizione'] or '')[:400]).lower()):
        return False, 'integratore non per pelle, capelli o unghie', None
    # i multivitaminici e quelli per altro (energia, difese, memoria) non sono per Skinmatch anche se la descrizione cita la pelle
    if pas == 'integratore' and re.search(r'multivitamin|energia|immunitar|neuro|memoria|sonno|stanchezza|articolaz|digest|intestin|cardio|colesterol', r['titolo'].lower()):
        return False, 'integratore non per pelle, capelli o unghie', None
    nota = (x.get('nota') or '').lower()
    ruolo = 'alternativa' if 'alternativa' in nota else ('premium' if x['segmento'] in ('Medicale premium', 'Premium e lusso') else None)
    if x['decisione'] == 'selezione' and x['linee'] and 'solo alternativa' not in nota:
        if not any(k(l) in k(r['titolo']) for l in x['linee']):
            return False, 'fuori dalle linee scelte', None
    if 'con attivi' in nota and not [a for a in I.attivi(r['titolo'] + ' ' + (r['descrizione'] or '')[:800]) if a['nome'] != 'acqua termale']:
        return False, 'senza attivi (la marca entra solo come alternativa con attivi)', None
    return True, None, ruolo


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('negozio', choices=['liki24', 'farmaself'])
    ap.add_argument('--file')
    ap.add_argument('--arricchisci', action='store_true')
    a = ap.parse_args()
    dec = decisioni()
    approvati = fonti.arricchimenti_approvati() if a.arricchisci else {}
    schede, esclusi, grezzi = [], [], {}
    for r in getattr(fonti, a.negozio)(a.file):
        tieni, motivo, ruolo = scegli(r, dec)
        if not tieni:
            if motivo != 'marca non scelta':
                esclusi.append({'marca': r['marca'], 'titolo': r['titolo'], 'motivo': motivo})
            continue
        seg = dec[k(r['marca'])]['segmento']
        grezzi[f"{r.get('prefisso', 'lk')}-{r['id']}"] = r
        s = traduci.scheda(r, segmento=seg)
        if a.arricchisci and 'inci' in s['mancano']:
            extra = None
            ap_ = approvati.get(s['id'], {}).get('inci')
            if ap_:
                extra = {'inci': ap_['valore'], 'fonte': ap_['fonte'] or 'admin'}
            else:
                extra = fonti.open_beauty_facts(r.get('gtin'))
            if extra:
                s = traduci.scheda(r, extra, segmento=seg)
        s['ruolo'] = ruolo
        s['segmento'] = dec[k(r['marca'])]['segmento']
        s['completezza'] = traduci.completezza(s)
        schede.append(s)
    # lo stesso prodotto in un altro formato: se una confezione ha l'INCI, vale anche per le altre
    con = {}
    for s in schede:
        if s['inci']:
            con.setdefault((k(s['marca']), _base(s['nome'])), s)
    for i, s in enumerate(schede):
        if not s['inci']:
            gemello = con.get((k(s['marca']), _base(s['nome'])))
            if gemello:
                r = grezzi[s['id']]
                n = traduci.scheda(r, {'inci': ', '.join(gemello['inci']), 'fonte': f"stesso prodotto, altro formato ({gemello['id']})"}, segmento=s['segmento'])
                n['ruolo'], n['segmento'] = s['ruolo'], s['segmento']
                n['completezza'] = traduci.completezza(n)
                schede[i] = n
    # la fascia: dal prezzo ogni 10 ml, per passaggio (un terzo più economico «base», il 20% più caro «premium»)
    per = defaultdict(list)
    for s in schede:
        if s['al_10']:
            per[s['passaggio']].append(s['al_10'])
    for s in schede:
        v = sorted(per[s['passaggio']])
        if s['ruolo'] == 'premium':
            s['fascia'] = 'premium'
        elif s['al_10'] and v:
            pos = v.index(s['al_10']) / max(1, len(v) - 1)
            s['fascia'] = 'base' if pos < 0.34 else 'premium' if pos > 0.8 else 'top'
        else:
            s['fascia'] = 'top'
    OUT.mkdir(exist_ok=True)
    (OUT / f'schede-{a.negozio}.json').write_text(json.dumps(schede, ensure_ascii=False))
    (OUT / f'esclusi-{a.negozio}.json').write_text(json.dumps(esclusi, ensure_ascii=False, indent=0))
    # il rapporto
    n = len(schede)
    manca = Counter(m for s in schede for m in s['mancano'])
    rapporto = {
        'negozio': a.negozio, 'schede': n, 'esclusi': len(esclusi),
        'esclusi_per_motivo': dict(Counter(e['motivo'] for e in esclusi).most_common()),
        'per_passaggio': dict(Counter(s['passaggio'] for s in schede).most_common()),
        'con_inci': sum(1 for s in schede if s['inci']), 'inci_da': dict(Counter(s['fonti'].get('inci', '-') if s['inci'] else 'manca' for s in schede).most_common(6)),
        'mancano': dict(manca.most_common()), 'completezza_media': round(sum(s['completezza'] for s in schede) / max(1, n)),
        'gravidanza': dict(Counter(str(s['gravidanza']) for s in schede)), 'forza': dict(Counter(s['forza'] for s in schede)),
        'per_marca': {m: {'schede': c, 'con_inci': sum(1 for s in schede if s['marca'] == m and s['inci'])} for m, c in Counter(s['marca'] for s in schede).most_common()},
    }
    (OUT / f'schede-{a.negozio}-rapporto.json').write_text(json.dumps(rapporto, ensure_ascii=False, indent=1))
    print(json.dumps({x: rapporto[x] for x in ('schede', 'esclusi', 'esclusi_per_motivo', 'per_passaggio', 'con_inci', 'inci_da', 'mancano', 'completezza_media', 'gravidanza', 'forza')}, ensure_ascii=False, indent=1))


if __name__ == '__main__':
    main()
