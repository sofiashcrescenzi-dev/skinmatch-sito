#!/usr/bin/env python3
"""DALLE SCHEDE AL SITO: la selezione curata che va nel catalogo e nel test (src/data/prodotti.json).

Le schede (feeds-out/schede-<negozio>.json) sono tutte quelle delle marche scelte; nel sito ne va una
selezione: per ogni marca e passaggio i prodotti di più valore (attivi riconosciuti, percentuali
dichiarate, INCI, completezza), un solo formato per prodotto (il più conveniente ogni 10 ml).
Quanti per marca e passaggio dipende dalla decisione: «sì» 5, «selezione» 4, solo alternativa 3.

Per ogni prodotto scrive anche quello che serve alla sua pagina (src/data/schede.json, letto solo
al momento della build, così il test e il catalogo restano leggeri): l'indirizzo corto e stabile,
le misure disponibili, la scheda per esteso con l'INCI e le fonti, il confronto con un prodotto
più ricco e uno meno ricco ma più economico, quando ci sono.

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
# i nomi delle marche come le scrive la marca, non come arrivano dal feed
NOME_MARCA = {'Avene': 'Avène', 'Beauty Of Joseon': 'Beauty of Joseon', 'Dr. Jart': 'Dr.Jart+', 'Geek&Gorgeous': 'Geek & Gorgeous', 'Isdin': 'ISDIN',
              'Kerastase': 'Kérastase', 'La Roche Posay': 'La Roche-Posay', 'Neostrata': 'NeoStrata', 'Rene Furterer': 'René Furterer', 'Roc': 'RoC',
              'Skinceuticals': 'SkinCeuticals', 'Iunik': 'iUNIK', 'Estee Lauder': 'Estée Lauder'}
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
        'id': s['id'], 'name': s['nome'], 'brand': NOME_MARCA.get(s['marca'], s['marca']), 'gender': 'uomo' if uomo else 'unisex', 'category': CATEGORIA[s['passaggio']],
        'tier': s['fascia'], 'korean': s['segmento'] == 'K-beauty', 'price': s['prezzo'],
        'description': descrizione(s), 'affiliateUrl': s['link'], 'image': s['immagine'], 'merchant': s['negozio'], 'feedId': f"adtraction:liki24:{s['id_negozio']}",
        'scheda': {k_: s.get(k_) for k_ in ('passaggio', 'momento', 'forza', 'fotosensibilizzante', 'texture', 'profumo', 'spf', 'al_10', 'misura', 'ruolo')}
                  | {'attivi': s['attivi'], 'inci': bool(s['inci']), 'completezza': s['completezza'], 'valore': valore(s)},
        'segment': s['segmento'],
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


# ── l'indirizzo: /catalogo/<categoria>/<oggetto>, l'oggetto è tipo + modello, mai la marca ──
# (regola di tutti i siti: corto, niente misure né colori; se due coincidono si aggiunge la parola più rara)
TIPI = [('contorno-occhi', r'contorno (?:occhi|degli occhi)|eye (?:cream|serum|gel)'), ('acqua-micellare', r'acqua micellare|micellar water'),
        ('detergente', r'detergent|cleanser|cleansing|struccante'), ('shampoo', r'shampoo'), ('balsamo', r'balsamo|conditioner'),
        ('maschera', r'maschera|\bmask'), ('tonico', r'tonico|toner'), ('esfoliante', r'esfoliant|exfoliat|peeling|\bpeel\b'),
        ('siero', r'siero|serum|sérum|ampoule|\bfiale?\b'), ('essenza', r'essenza|essence'), ('crema', r'crema|cream|\bcreme|crème'),
        ('olio', r'\bolio\b|\boil\b'), ('lozione', r'lozione|lotion'), ('latte', r'\blatte\b|\bmilk\b'), ('fluido', r'fluid[oa]?\b'),
        ('soluzione', r'soluzione|solution'), ('booster', r'booster'), ('cerotti', r'cerott|patch'), ('spray', r'\bspray\b'), ('stick', r'\bstick\b'),
        ('gel', r'\bgel\b'), ('schiuma', r'schiuma|\bfoam\b|mousse')]
DEBOLI = {'gel', 'schiuma', 'spray', 'stick'}  # perdono contro un tipo vero («gel detergente» → detergente)
RIPIEGO = {'detergente': 'detergente', 'siero': 'siero', 'crema': 'crema', 'spf': 'protezione-solare', 'esfoliante': 'esfoliante',
           'shampoo': 'shampoo', 'trattamento cute': 'trattamento', 'balsamo e maschera capelli': 'balsamo', 'barba': 'barba',
           'integratore': 'integratore', 'cerotti': 'cerotti'}
VUOTE = set('con il lo la le i gli di da del dello della delle dei degli per e ed o a ad al allo alla ai agli alle in nel nella su sul sulla '
            'the of and for with to un una uno che non x n no all dell nell sull dall l d c'.split())
GENERICHE = set('viso pelle pelli corpo tutti tutte tipi tipo formula trattamento uso quotidiano quotidiana giorno notte occhi capelli spf pa '
                'idratante idratanti nuovo nuova protezione solare sun integratore integratori alimentare alimentari'.split())


def _ascii(x):
    return unicodedata.normalize('NFD', x).encode('ascii', 'ignore').decode()


def _slug(x):
    if re.fullmatch(r'(?:[A-Za-z]\.)+[A-Za-z]?\.?', x):  # «R.E.G.E.N.», «A.H»: una sigla, una parola
        x = x.replace('.', '')
    return re.sub(r'[^a-z0-9]+', '-', _ascii(x).lower().replace("'", '').replace('’', '')).strip('-')


def _parole(nome):
    # «AHA-BHA-PHA», «T-Pur», «No.4», «S.O.S.» restano una parola
    return [w for w in re.split(r"[\s,;:+/&()|'’]+|\s-\s", nome) if w.strip('.-')]


def tipo_di(s):
    nome = s['nome']
    if s['passaggio'] in ('integratore', 'cerotti'):
        return RIPIEGO[s['passaggio']]
    trovati = sorted(((m.start(), t) for t, rx in TIPI for m in [re.search(rx, nome, re.I)] if m), key=lambda x: x[0])
    forti = [t for _, t in trovati if t not in DEBOLI]
    tipo = (forti or [t for _, t in trovati] or [RIPIEGO[s['passaggio']]])[0]
    if s['passaggio'] == 'spf' and tipo != 'protezione-solare':
        tipo += '-solare'
    return tipo


def oggetto(s):
    """Le parole dell'indirizzo: [tipo, modello…] e, a parte, le parole di riserva per distinguere i doppioni."""
    tipo = tipo_di(s)
    rx_tipi = re.compile('|'.join(rx for _, rx in TIPI), re.I)
    modello, descrittive, riserva, generiche = [], [], [], []
    prima_spf = False
    parole_nome = _parole(re.sub(r',\s*\d+\s*$', '', s['nome']))  # «…, 12»: il numero di pezzi in coda
    for n_, w in enumerate(parole_nome):
        sl = _slug(w)
        # le misure non vanno nell'indirizzo: «180 compresse», «60 gommose», «22 cerotti», «1300mg», «3x30»
        if re.fullmatch(r'(compress[ae]|capsul[ae]|cps|cpr|caps|tbl|tavolett[ae]|bustin[ae]|fial[ae]|flaconcin[io]|pz|pezzi|perle|softgel|gomm[ae]|gommos[ae]|gommin[ae]|gelatin[ae]|cerott[io]|stick|mg|g|ml|gr|grammi)', sl):
            for lista in (modello, descrittive):
                if lista and lista[-1].isdigit() and n_ > 1:  # «360 Capsule» di Heliocare: il 360 è il modello
                    lista.pop()
            if not sl.startswith('cerott'):
                continue
        if re.fullmatch(r'\d+(?:mg|g|ml|gr|capsule|compresse|cps)', sl) or re.fullmatch(r'\d+[x×]\d+\w*', w):
            continue
        if not sl or sl in VUOTE:
            prima_spf = False
            continue
        if sl.startswith('spf') or re.fullmatch(r'\++|pa', sl):
            prima_spf = True
            continue
        if prima_spf and re.fullmatch(r'\d+\+?', w.strip('+')):
            riserva.insert(0, 'spf' + w.strip('+'))
            continue
        if sl.startswith('spf') and sl[3:].isdigit():
            riserva.insert(0, sl)
        prima_spf = False
        if rx_tipi.search(w) or sl in GENERICHE or re.fullmatch(r'\d+(?:[.,]\d+)?%', w):
            (generiche if sl in GENERICHE else riserva).append(sl)
            continue
        maiuscola = w[:1].isupper() or w[:1].isdigit() or any(c.isupper() for c in w[1:])
        if len(sl) == 1 and sl.isalpha() and not modello:  # «C» di «vitamina C» conta solo attaccata al modello
            continue
        (modello if maiuscola else descrittive).append(sl)
    parole = list(dict.fromkeys(modello))[:4] or list(dict.fromkeys(descrittive))[:2] or [w for w in riserva + generiche if w not in tipo][:1]
    while len(parole) > 1 and len('-'.join([tipo] + parole)) > 44:
        parole.pop()
    riserva += [x for x in dict.fromkeys(modello + descrittive) if x not in parole]
    riserva += [_slug(a['nome']) for a in s['attivi']] + generiche
    return [tipo] + parole, list(dict.fromkeys(riserva)), frozenset(modello)


def indirizzi(scelti, vecchi):
    """id → oggetto: stabile (chi aveva già un indirizzo lo tiene), unico, mai la marca."""
    out = {s['id']: vecchi[s['id']] for s in scelti if s['id'] in vecchi}
    usati = set(out.values())
    nuovi = {s['id']: oggetto(s)[:2] for s in scelti if s['id'] not in out}
    freq = defaultdict(int)
    for base, ris in nuovi.values():
        for w in set(base + ris):
            freq[w] += 1
    gruppi = defaultdict(list)
    for i, (base, _) in nuovi.items():
        gruppi['-'.join(base)].append(i)
    for sl, ids in sorted(gruppi.items()):
        for i in ids:
            base, ris = nuovi[i]
            cand = sl
            if len(ids) > 1 or cand in usati:
                # prima la parola che distingue dagli altri doppioni, poi qualsiasi parola sua, poi due
                altri = set(w for j in ids if j != i for w in nuovi[j][0] + nuovi[j][1])
                ris = [w for w in ris if w not in base and w not in sl.split('-')]
                prove = [w for w in sorted(ris, key=lambda w: freq[w]) if w not in altri] + ris + [f'{x}-{y}' for n_, x in enumerate(ris) for y in ris[n_ + 1:]]
                for w in prove:
                    if f'{sl}-{w}' not in usati:
                        cand = f'{sl}-{w}'
                        break
            n = 2
            while cand in usati:
                cand, n = f'{sl}-{n}', n + 1
            usati.add(cand)
            out[i] = cand
    return out


def misura_testo(m):
    return f"{m['valore']:g} {m['unita']}".replace('.', ',') if m else None


def lavoro(s):
    """Il lavoro che fa un prodotto: due prodotti si confrontano solo se ne hanno uno in comune."""
    if s['passaggio'] in ('shampoo', 'trattamento cute', 'balsamo e maschera capelli'):
        return set((s.get('capelli') or {}).get('bisogni') or [])
    if s['passaggio'] == 'integratore':
        return set(s.get('integrazione') or [])
    if s['passaggio'] in ('cerotti', 'barba'):
        return {s['passaggio']}
    return set(s['bisogni']) or {'base'}


def confronti(scelti):
    """Per ogni prodotto, se ci sono, nello stesso passaggio e con un lavoro in comune: il più ricco
    (attivi, percentuali, INCI: almeno 12 punti di valore in più) e il meno ricco ma più economico
    (almeno un quarto in meno ogni 10 ml). Solo dove il prezzo ogni 10 ml si può calcolare."""
    unita = lambda s: {'g': 'ml'}.get(s['misura']['unita'], s['misura']['unita']) if s.get('misura') else None
    out = {}
    for s in scelti:
        if not s.get('al_10'):
            continue
        v, l = valore(s), lavoro(s)
        pari = [q for q in scelti if q['id'] != s['id'] and q['passaggio'] == s['passaggio'] and q.get('al_10') and unita(q) == unita(s) and lavoro(q) & l and q['nome'] != s['nome']]
        ricchi = [q for q in pari if valore(q) >= v + 12]
        economici = [q for q in pari if valore(q) <= v and q['al_10'] <= s['al_10'] * 0.75]
        c = {}
        if ricchi:
            c['ricco'] = max(ricchi, key=lambda q: (valore(q), len(lavoro(q) & l), -q['al_10']))['id']
        if economici:
            c['economico'] = max(economici, key=lambda q: (valore(q), len(lavoro(q) & l), -q['al_10']))['id']
        if c:
            out[s['id']] = c
    return out


def main():
    neg = sys.argv[1] if len(sys.argv) > 1 else 'liki24'
    schede = json.loads((R / 'feeds-out' / f'schede-{neg}.json').read_text())
    dec = decisioni()
    gruppi, formati = defaultdict(list), {}
    for s in schede:
        if s['passaggio'] not in CATEGORIA or not s.get('immagine') or not s.get('prezzo') or not s.get('link'):
            continue
        gruppi[(s['marca'], s['passaggio'])].append(s)
    scelti = []
    for (marca, pas), ss in gruppi.items():
        # un solo formato per prodotto: il più conveniente ogni 10 ml
        per_nome, tutti = {}, defaultdict(list)
        for s in ss:
            n = re.sub(r'\s+', ' ', unicodedata.normalize('NFD', s['nome'].lower()).encode('ascii', 'ignore').decode())
            n = re.sub(r'\b(ricarica|refill|maxi|formato|confezione|promo|offerta)\b.*', '', n).strip(' ,')
            tutti[n].append(s)
            if n not in per_nome or (s['al_10'] or 999) < (per_nome[n]['al_10'] or 999):
                per_nome[n] = s
        # lo stesso prodotto con due titoli («Siero Zitcalm», «Zitcalm, siero lenitivo»): stesso modello, una scheda
        per_modello = {}
        for n in sorted(per_nome, key=len):
            mod = oggetto(per_nome[n])[2]
            if not mod:
                continue
            if mod in per_modello:
                n0 = per_modello[mod]
                tutti[n0] += tutti.pop(n)
                s = per_nome.pop(n)
                if (s['al_10'] or 999) < (per_nome[n0]['al_10'] or 999):
                    per_nome[n0] = s
            else:
                per_modello[mod] = n
        for n, s in per_nome.items():
            formati[s['id']] = tutti[n]
        x = dec[k(marca)]
        quota = QUANTI['alternativa'] if 'alternativa' in (x.get('nota') or '').lower() else QUANTI[x['decisione']]
        scelti += sorted(per_nome.values(), key=valore, reverse=True)[:quota]
    vecchio = R / 'src' / 'data' / 'prodotti.json'
    vecchi = {p['id']: p['slug'] for p in json.loads(vecchio.read_text())['prodotti'] if p.get('slug')} if vecchio.exists() else {}
    slug = indirizzi(scelti, vecchi)
    prodotti = [prodotto(s) | {'slug': slug[s['id']]} for s in scelti]
    conf = confronti(scelti)
    pagine = {}
    for s in scelti:
        misure = {}
        for q in sorted(formati[s['id']], key=lambda q: ((q.get('misura') or {}).get('valore') or 0, q['prezzo'])):
            m = misura_testo(q.get('misura'))
            if m and m not in misure:
                misure[m] = {'misura': m, 'prezzo': q['prezzo'], 'al_10': q.get('al_10'), 'link': q['link']}
        pagine[s['id']] = {
            'titolo': s['titolo'], 'pelle': s.get('pelle'), 'bisogni': s['bisogni'], 'capelli': s.get('capelli'), 'integrazione': s.get('integrazione'),
            'gravidanza': s['gravidanza'], 'alcol': s.get('alcol'), 'oli_essenziali': s.get('oli_essenziali'), 'inci': s['inci'] or None,
            'fonti': {c: v for c, v in s['fonti'].items() if v}, 'mancano': s['mancano'], 'prezzo_pieno': s.get('prezzo_pieno'),
            'formati': list(misure.values()) if len(misure) > 1 else [], 'confronto': conf.get(s['id'], {}),
        }
    prodotti.sort(key=lambda p: (p['category'], p['brand'], p['name']))
    (R / 'src' / 'data' / 'prodotti.json').write_text(json.dumps({'_nota': f'La selezione dalle schede di {neg} (scripts/catalogo/al_sito.py). Non si modifica a mano: si rigenera.', 'prodotti': prodotti}, ensure_ascii=False, separators=(',', ':')))
    (R / 'src' / 'data' / 'schede.json').write_text(json.dumps({'_nota': 'Le schede per esteso delle pagine prodotto (scripts/catalogo/al_sito.py), lette solo nella build. Non si modifica a mano.', 'schede': pagine}, ensure_ascii=False, separators=(',', ':')))
    from collections import Counter
    print('confronti: più ricco', sum(1 for c in conf.values() if 'ricco' in c), '· più economico', sum(1 for c in conf.values() if 'economico' in c), '· misure unite', sum(1 for p in pagine.values() if p['formati']))
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
