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
from collections import Counter, defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from schede import decisioni, k
import traduci
import titoli

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
MARCHE_DECISE = {}


def marca_bella(m):
    """Il nome della marca come la scrive la marca: dalla tabella, o com'è nelle decisioni (BIONIKE → BioNike)."""
    if m in NOME_MARCA:
        return NOME_MARCA[m]
    if not MARCHE_DECISE:
        MARCHE_DECISE.update({k(x['marca']): x['marca'] for x in json.loads((Path(__file__).parent / 'decisioni_marche.json').read_text())['marche']})
    d = MARCHE_DECISE.get(k(m), m)
    return NOME_MARCA.get(d, d)


CHIAVE = {'retinale', 'retinolo', 'retinoide estere', 'bakuchiol', 'niacinamide', 'vitamina C', 'acido salicilico', 'acido glicolico', 'acido lattico', 'acido mandelico',
          'PHA', 'LHA', 'acido azelaico', 'acido tranexamico', 'thiamidol', 'arbutina', 'ceramidi', 'peptidi', 'acido ialuronico', 'centella', 'pantenolo', 'urea', 'zinco', 'acido ferulico'}


def valore(s):
    att = [a for a in s['attivi'] if a['nome'] in CHIAVE]
    return s['completezza'] + 12 * len(att) + 6 * sum(1 for a in att if a['perc']) + (15 if s['inci'] else 0) + (5 if s['bisogni'] else 0)


def prodotto(s):
    # titolo (la linea o il modello) e sottotitolo (che cos'è e cosa fa), uguali per ogni feed: titoli.py
    tit = titoli.titolo_e_sottotitolo(s['nome'], s | {'lavoro': sorted(lavoro(s))})
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
        'id': s['id'], 'name': tit[0], 'subtitle': tit[1], 'brand': marca_bella(s['marca']), 'gender': 'uomo' if uomo else 'unisex', 'category': CATEGORIA[s['passaggio']],
        'tier': s['fascia'], 'korean': s['segmento'] == 'K-beauty', 'price': s['prezzo'],
        'description': descrizione(s), 'affiliateUrl': s['link'], 'image': s['immagine'], 'merchant': s['negozio'], 'feedId': f"{(per_nome(s['negozio']) or {}).get('rete', '').lower()}:{s['negozio'].lower()}:{s['id_negozio']}",
        'scheda': {k_: s.get(k_) for k_ in ('passaggio', 'momento', 'forza', 'fotosensibilizzante', 'texture', 'profumo', 'spf', 'al_10', 'misura', 'ruolo', 'zona', 'forma', 'pezzi')}
                  | {'per': per_chi(s), 'lavoro': sorted(lavoro(s)), 'principale': dict(zip(('id', 'perc'), principale(s))) if principale(s)[0] else None}
                  | {'attivi': s['attivi'], 'inci': bool(s['inci']), 'completezza': s['completezza'], 'valore': valore(s)}
                  # «Senza…» solo dove si sa: INCI intero o dichiarazione del produttore (Federico, 16/10); gli integratori no
                  | ({'senza': [k_ for k_ in ('profumo', 'alcol', 'oli_essenziali') if s.get(k_) is False],
                      'con': [k_ for k_ in ('profumo', 'alcol', 'oli_essenziali') if s.get(k_) is True]} if s['passaggio'] != 'integratore' else {}),
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


ALIAS_F = R / 'src' / 'data' / 'indirizzi-vecchi.json'
ALIAS = json.loads(ALIAS_F.read_text())['vecchi'] if ALIAS_F.exists() else {}


def indirizzi(scelti, vecchi):
    """id → oggetto: stabile (chi aveva già un indirizzo lo tiene), unico, mai la marca."""
    # stabile, salvo quando il tipo nell'indirizzo è sbagliato (un integratore a «balsamo-…», Friday 16/10): allora si
    # rifà, e il vecchio indirizzo resta come rinvio alla pagina nuova (src/data/indirizzi-vecchi.json, /indirizzi.json)
    giusto = lambda s, sl: sl == tipo_di(s) or sl.startswith(tipo_di(s) + '-')
    out = {s['id']: vecchi[s['id']] for s in scelti if s['id'] in vecchi and giusto(s, vecchi[s['id']])}
    for s in scelti:
        if s['id'] in vecchi and s['id'] not in out:
            ALIAS[vecchi[s['id']]] = s['id']
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
    """Il lavoro che fa un prodotto: due prodotti si confrontano solo se ne hanno uno in comune.
    Prima quello che dice il titolo («crema antirughe», «shampoo antiforfora»): i bisogni letti anche nella descrizione
    sono larghi (quasi ogni crema «idrata»), e una crema antirughe e una per i pori si trovavano un lavoro in comune
    (Friday, 15/10). Se il titolo non ne dice nessuno, valgono tutti quelli della scheda."""
    t = s['titolo'].lower()
    if s['passaggio'] in ('shampoo', 'trattamento cute', 'balsamo e maschera capelli'):
        b = set((s.get('capelli') or {}).get('bisogni') or [])
        nel_titolo = {c for c, rx in traduci.BISOGNI_CAPELLI.items() if c in b and re.search(rx, t)}
        # «mantenimento» (delicato, per tutti) non è un lavoro in comune con un antiforfora o un anticaduta
        b = nel_titolo or b
        return (b - {'mantenimento'}) or b or {'mantenimento'}
    if s['passaggio'] == 'integratore':
        # un integratore fa un lavoro solo se fa le stesse cose: «capelli e unghie» non è «sole» né «capelli» e basta
        b = set(s.get('integrazione') or [])
        b = {c for c, rx in traduci.INTEGRAZIONE.items() if c in b and re.search(rx, t)} or b
        return {'+'.join(sorted(b))} if b else set()
    if s['passaggio'] in ('cerotti', 'barba'):
        return {s['passaggio']}
    b = set(s['bisogni'])
    t = re.sub(r'\banti[\s-]+', 'anti', t)  # «anti età», «anti-età», «antietà»
    nel_titolo = {c for c, (rx, _) in traduci.BISOGNI.items() if c in b and re.search(rx, t)}
    # se il titolo non lo dice, il lavoro del suo attivo principale (vitamina C → macchie, retinolo → tempo)
    pr = next((g for g in ATTIVI if g['id'] == principale(s)[0]), None)
    dell_attivo = {c for c, (_, att) in traduci.BISOGNI.items() if c in b and pr and att & set(pr['nomi'])}
    return nel_titolo or dell_attivo or b or {'base'}


ATTIVI = json.loads((R / 'src' / 'data' / 'attivi.json').read_text())['attivi']
# i negozi (admin › Negozi): un negozio entra nel sito solo se «attivo» e con la commissione inserita
NEGOZI = json.loads((R / 'src' / 'data' / 'negozi.json').read_text())['negozi']
# Liki24 è il negozio del catalogo; gli altri (oggi Farmaself) lo completano e basta: niente confronti tra
# negozi, niente link cambiati (Federico, 16/10: «non ci interessa la comparazione tra prodotti»).
VUOTE_NOME = set('con il lo la le i gli di da del della per e a al alla in su x ml g pz'.split())


def per_nome(negozio):
    return next((n for n in NEGOZI if n['nome'].lower() == (negozio or '').lower()), None)


def _parole_nome(s):
    return {w for w in re.split(r'[^a-z0-9]+', _ascii(s['nome']).lower()) if w and w not in VUOTE_NOME and not re.fullmatch(r'\d+(?:ml|g)?', w)} | \
           {w for w in re.findall(r'\b\d+[a-z]*\b', _ascii(s['nome']).lower()) if not re.fullmatch(r'\d+(?:ml|g)', w)}


DEC_NEGOZI = json.loads((Path(__file__).parent / 'decisioni_negozi.json').read_text())


def commissione(negozio):
    return (per_nome(negozio) or {}).get('commissione') or 0


def trova(s, gia):
    """Lo stesso prodotto nel catalogo: stesso EAN, oppure stessa marca e nome quasi uguale, in qualsiasi formato
    (un'altra misura dello stesso prodotto non serve). Nel dubbio è lo stesso: meglio un prodotto in meno che un doppione."""
    g = (s.get('gtin') or '').lstrip('0')
    if g and g in gia['gtin']:
        return gia['gtin'][g]
    a = _parole_nome(s)
    for b, rec in gia['marca'].get(k(s['marca']), []):
        comuni = a & b
        if len(comuni) >= 2 and len(comuni) / max(1, min(len(a), len(b))) >= 0.75:
            return rec
    return None


def unisci(schede, altri, tutti_si=None):
    """Gli altri negozi completano il catalogo, non lo sporcano (Federico, 16/10):
    - un loro prodotto entra solo se il PO l'ha scelto (decisioni_negozi.json; tutti_si: un negozio da simulare tutto «sì»);
    - se il prodotto c'è già, resta quello del negozio che vale di più (la commissione più alta): l'offerta si sposta,
      la pagina e l'indirizzo restano; se vale di meno, non entra;
    - se non c'è, entra nella selezione dopo i prodotti del catalogo principale."""
    for s in schede:
        s['base'] = True
    gia = {'gtin': {s['gtin'].lstrip('0'): s for s in schede if s.get('gtin')}, 'marca': defaultdict(list)}
    for s in schede:
        gia['marca'][k(s['marca'])].append((_parole_nome(s), s))
    nuovi, conti = [], Counter()
    for ss in altri:
        for s in ss:
            nid = (per_nome(s['negozio']) or {}).get('id', '')
            scelto = tutti_si == nid or DEC_NEGOZI.get(nid, {}).get('prodotti', {}).get(s['id']) == 'si'
            rec = trova(s, gia)
            if rec is not None:
                if scelto and commissione(s['negozio']) > commissione(rec['negozio']):
                    rec.update({x: s[x] for x in ('negozio', 'prezzo', 'prezzo_pieno', 'link', 'id_negozio') if x in s})
                    conti['passati al negozio che vale di più'] += 1
                else:
                    conti['già nel catalogo'] += 1
            elif not scelto:
                conti['da scegliere' if s['id'] not in DEC_NEGOZI.get(nid, {}).get('prodotti', {}) else 'scartati'] += 1
            else:
                s['base'] = False
                nuovi.append(s)
                conti['candidati'] += 1
    return schede + nuovi, conti




# come il titolo nomina gli attivi (src/data/attivi.json, per id): l'attivo che il prodotto mette nel nome è il suo
NEL_TITOLO = {'retinoidi': r'retin|\bvit(?:amina|amin|a)? a\b', 'vitamina-c': r'vitamin[ae]? ?c\b|\bvit\.? ?c\b|ascorb|flavo-c|\bc e ferulic|vita c',
              'niacinamide': r'niacinamid|niacina|\bb3\b', 'aha-pha': r'\baha\b|\bpha\b|glicolic|glycolic|lattic|lactic|mandelic|glico',
              'salicilico': r'salicil|salicyl|\bbha\b|\blha\b', 'azelaico': r'azela', 'ialuronico': r'ialuron|hyalur|\bhyalu?\d*\b|\bha\b',
              'ceramidi': r'ceramid', 'centella': r'centella|\bcica|cicaplast|cicapair', 'peptidi': r'peptid|matrixyl',
              'antimacchia': r'tranexam|\btxa\b|thiamidol|arbutin', 'pantenolo': r'pantenol|panthenol|\bb5\b', 'urea': r'\burea\b',
              'bakuchiol': r'bakuchiol', 'zinco': r'\bzinc'}


def principale(s):
    """L'attivo principale, con la percentuale più alta dichiarata (None se non c'è): tra gli attivi della scheda, quello
    che il titolo nomina; se il titolo ne nomina più d'uno o nessuno, il più pesante (src/data/attivi.json, «peso»).
    ⚠️ Prima vinceva sempre il più pesante: un siero all'acido ialuronico con una traccia di retinale nell'INCI
    (Hidraderm Hyal) finiva confrontato con i sieri al retinolo (Friday, 15/10)."""
    gruppi = {g['id']: g for a in s['attivi'] for g in ATTIVI if a['nome'] in g['nomi']}
    t = s['titolo'].lower()
    nominati = [g for i, g in gruppi.items() if re.search(NEL_TITOLO.get(i, r'$^'), t)]
    meglio = max(nominati or gruppi.values(), key=lambda g: g['peso'], default=None)
    if not meglio:
        return None, None
    pc = [a['perc'] for a in s['attivi'] if a['nome'] in meglio['nomi'] and a.get('perc')]
    return meglio['id'], max(pc) if pc else None


def vicini(x, y):
    return max(x, y) / min(x, y) <= 1.33


def formato_vicino(a, b):
    """Il formato al massimo un terzo più grande (Federico, 15/10), in ml o g; e se ci sono, anche i pezzi (capsule,
    fiale, cerotti). Senza una misura da confrontare non si confronta: meglio nessun confronto che uno a caso."""
    ma, mb, na, nb = a.get('misura'), b.get('misura'), a.get('pezzi'), b.get('pezzi')
    if bool(ma) != bool(mb) or bool(na) != bool(nb) or not (ma or na):
        return False
    u = lambda m: 'ml' if m['unita'] == 'g' else m['unita']
    if ma and (u(ma) != u(mb) or not vicini(ma['valore'], mb['valore'])):
        return False
    return not na or vicini(na, nb)


def per_chi(s):
    """Per chi è, se il titolo lo dice: un anticaduta per donna non è l'alternativa di uno per uomo."""
    t = s['titolo']
    return 'uomo' if re.search(r'\b(uomo|uomini|men|homme|man)\b', t, re.I) else 'donna' if re.search(r'\b(donna|donne|woman|women|femme)\b', t, re.I) else None


def fascia_spf(s):
    """La protezione solare in tre fasce: bassa (sotto 30), media (30-49), alta (50 e 50+). None se non c'è."""
    v = s.get('spf')
    return None if not v else 'alta' if v >= 50 else 'media' if v >= 30 else 'bassa'


def stesso_prodotto(a, b):
    """Lo stesso prodotto con due titoli nel catalogo («Balsamo nutriente al mango» e «balsamo al mango», Klorane):
    stessa marca, metà delle parole del nome in comune, gli stessi numeri. Non è un'alternativa a sé stesso."""
    if k(a['marca']) != k(b['marca']):
        return False
    def parole(n):
        n = unicodedata.normalize('NFD', n.lower()).encode('ascii', 'ignore').decode()
        return set(re.findall(r'[a-z]{3,}', n)), set(re.findall(r'\d+', n))
    (wa, da), (wb, db) = parole(a['nome']), parole(b['nome'])
    return da == db and len(wa & wb) >= 0.5 * max(1, len(wa | wb))


def simili(a, b):
    """QUANDO DUE PRODOTTI SI CONFRONTANO: la stessa regola di src/lib/simili.ts (alternativa del test).
    Stesso passaggio, stessa zona (viso, occhi, cute, capelli...), stessa forma (acqua micellare con acqua micellare,
    fiale con fiale), stessa forza, stessa fascia di protezione solare, stesso genere se il titolo lo dice, non lo
    stesso prodotto con un altro titolo,
    stesso attivo principale con la percentuale al massimo doppia se le due la dichiarano, un lavoro in comune,
    formato vicino."""
    za, zb = a.get('zona') or traduci.zona(a['titolo'], a['passaggio']), b.get('zona') or traduci.zona(b['titolo'], b['passaggio'])
    fa, fb = a.get('forma') or traduci.forma(a['titolo'], a['passaggio']), b.get('forma') or traduci.forma(b['titolo'], b['passaggio'])
    if a['passaggio'] != b['passaggio'] or za != zb or fa != fb or a.get('forza') != b.get('forza') or fascia_spf(a) != fascia_spf(b) \
            or per_chi(a) != per_chi(b):
        return False
    if stesso_prodotto(a, b):
        return False
    (pa, xa), (pb, xb) = principale(a), principale(b)
    if pa != pb or (xa and xb and max(xa, xb) / min(xa, xb) > 2):
        return False
    return bool(lavoro(a) & lavoro(b)) and formato_vicino(a, b)


def meno_caro(q, s):
    """Costa meno davvero: almeno un quinto in meno e, se si sa, non di più ogni 10 ml (Friday, 15/10)."""
    return q['prezzo'] <= s['prezzo'] * 0.8 and not (q.get('al_10') and s.get('al_10') and q['al_10'] >= s['al_10'])


def confronti(scelti):
    """Per ogni prodotto, se ci sono: il più ricco (attivi, percentuali, INCI: almeno 12 punti di valore in più)
    e il meno ricco ma più economico (almeno un quinto in meno sul prezzo). Solo tra prodotti simili, la stessa
    regola dell'alternativa del test (src/lib/simili.ts): simili() qui sopra."""
    out = {}
    for s in scelti:
        v, l = valore(s), lavoro(s)
        pari = [q for q in scelti if q['id'] != s['id'] and q['nome'] != s['nome'] and q.get('prezzo') and simili(s, q)]
        ricchi = [q for q in pari if valore(q) >= v + 12]
        economici = [q for q in pari if valore(q) <= v and meno_caro(q, s)]
        c = {}
        if ricchi:
            c['ricco'] = max(ricchi, key=lambda q: (valore(q), len(lavoro(q) & l), -q['prezzo']))['id']
        if economici:
            c['economico'] = max(economici, key=lambda q: (valore(q), len(lavoro(q) & l), -q['prezzo']))['id']
        if c:
            out[s['id']] = c
    return out


def main(candidati=None):
    neg = sys.argv[1] if len(sys.argv) > 1 else 'liki24'
    schede = json.loads((R / 'feeds-out' / f'schede-{neg}.json').read_text())
    # gli altri negozi attivi in admin (Farmaself): solo i prodotti che su Liki24 non ci sono
    attivi = {n['id']: n for n in NEGOZI if n['id'] != neg and n['attivo']}
    altri = [json.loads(f.read_text()) for f in (R / 'feeds-out' / f'schede-{i}.json' for i in attivi) if f.exists()]
    schede, conti = unisci(schede, altri, candidati)
    if altri:
        print('altri negozi:', dict(conti))
    for s in schede:  # le schede degli altri negozi, se sono state fatte prima di zona, forma e pezzi (traduci.py)
        if 'zona' not in s:
            s['zona'], s['forma'], s['pezzi'] = traduci.zona(s['titolo'], s['passaggio']), traduci.forma(s['titolo'], s['passaggio']), traduci.pezzi(s['titolo'])
    dec = decisioni()
    gruppi, formati = defaultdict(list), {}
    for s in schede:
        if s['passaggio'] not in CATEGORIA or not s.get('immagine') or not s.get('prezzo') or not s.get('link'):
            continue
        gruppi[(k(s['marca']), s['passaggio'])].append(s)
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
        x = dec[marca]
        quota = QUANTI['alternativa'] if 'alternativa' in (x.get('nota') or '').lower() else QUANTI[x['decisione']]
        # Liki24 prima, sempre: un altro negozio prende solo i posti che Liki24 lascia liberi (Federico, 16/10)
        ordinati = sorted(per_nome.values(), key=lambda s: (s.get('base', True), valore(s)), reverse=True)
        # i posti per marca e passaggio valgono per il catalogo principale; un prodotto di un altro negozio scelto
        # dal PO entra comunque (in prova, --candidati, conta solo dove c'è posto: è la proposta)
        scelti += ordinati[:quota] + ([] if candidati else [s for s in ordinati[quota:] if not s.get('base', True)])
    if candidati:
        dentro = {s['id'] for s in scelti}
        lista = [{'id': s['id'], 'marca': marca_bella(s['marca']), 'titolo': (tt := titoli.titolo_e_sottotitolo(s['nome'], s | {'lavoro': sorted(lavoro(s))}))[0],
                  'sottotitolo': tt[1], 'nome_negozio': s['titolo'], 'passaggio': s['passaggio'], 'categoria': CATEGORIA.get(s['passaggio']), 'prezzo': s['prezzo'],
                  'attivi': [a['nome'] + (f" {a['perc']:g}%" if a['perc'] else '') for a in s['attivi']][:4], 'immagine': s.get('immagine'), 'url': s.get('url_negozio'),
                  'proposta': 'si' if s['id'] in dentro else 'no'}
                 for s in schede if not s.get('base', True) and s['passaggio'] in CATEGORIA]
        (R / 'feeds-out' / f'candidati-{candidati}.json').write_text(json.dumps(lista, ensure_ascii=False, indent=0))
        print(len(lista), 'candidati;', sum(1 for x in lista if x['proposta'] == 'si'), 'entrerebbero nei posti liberi')
        return
    vecchio = R / 'src' / 'data' / 'prodotti.json'
    vecchi = {p['id']: p['slug'] for p in json.loads(vecchio.read_text())['prodotti'] if p.get('slug')} if vecchio.exists() else {}
    slug = indirizzi(scelti, vecchi)
    prodotti = [prodotto(s) | {'slug': slug[s['id']]} for s in scelti]
    # lo stesso titolo per più prodotti della stessa marca (5 «Vinoperfect»): si aggiunge il tipo, così la carta li
    # distingue anche prima del sottotitolo (Friday, 16/10)
    TIPO_BREVE = {'detergente': 'Detergente', 'tonico': 'Tonico', 'siero': 'Siero', 'crema': 'Crema', 'spf': 'Solare', 'esfoliante': 'Esfoliante',
                  'shampoo': 'Shampoo', 'trattamento cute': 'Lozione', 'balsamo e maschera capelli': 'Balsamo', 'barba': 'Barba', 'integratore': 'Integratore', 'cerotti': 'Cerotti'}
    doppi = Counter((p['brand'], p['name']) for p in prodotti)
    for p in prodotti:
        tb = TIPO_BREVE.get(p['scheda']['passaggio'])
        if doppi[(p['brand'], p['name'])] > 1 and tb and tb.lower() not in p['name'].lower():
            p['name'] = f"{p['name']} {tb}"
    if ALIAS:
        ALIAS_F.write_text(json.dumps({'_nota': "Vecchi oggetti degli indirizzi → id del prodotto: il Worker li rinvia alla pagina di oggi (src/app/indirizzi.json). Si aggiunge e basta.", 'vecchi': dict(sorted(ALIAS.items()))}, ensure_ascii=False, indent=1) + '\n')
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
    print('confronti: più ricco', sum(1 for c in conf.values() if 'ricco' in c), '· più economico', sum(1 for c in conf.values() if 'economico' in c), '· misure unite', sum(1 for p in pagine.values() if p['formati']))
    print(len(prodotti), 'prodotti nel sito;', dict(Counter(p['category'] for p in prodotti)))
    print('con INCI:', sum(1 for p in prodotti if p['scheda']['inci']), '· gravidanza sì/no:', sum(1 for p in prodotti if p.get('pregnancySafe') is True), sum(1 for p in prodotti if p.get('pregnancySafe') is False))


if __name__ == '__main__' and '--lista' not in sys.argv:
    main(next((x.split('=', 1)[1] for x in sys.argv if x.startswith('--candidati=')), None))


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
