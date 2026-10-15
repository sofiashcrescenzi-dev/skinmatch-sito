"""DA UN PRODOTTO DI NEGOZIO ALLA SCHEDA DI SKINMATCH (il formato del prototipo, tappa 2).

Una scheda dice: in che passaggio della routine va (e quando), per quale pelle (sebo, idratazione,
fino a che reattività), per cosa lavora (bisogni), quanto è forte (1 delicato · 2 medio · 3 forte),
se va bene in gravidanza (sì / no / da verificare), se rende la pelle sensibile al sole, gli attivi
(con la percentuale quando c'è), texture, profumo, fascia e prezzo ogni 10 ml. Per cute e capelli:
che cute e che problema; per gli integratori: l'obiettivo.

⚠️ OGNI CAMPO DICE DA DOVE VIENE (`fonti`): «inci», «titolo», «descrizione», «regola» (dedotto da altri
campi) o una fonte esterna. Più un dato viene dall'INCI, più è affidabile. I campi che non si possono
dedurre restano vuoti e finiscono in `mancano`: sono la lista di lavoro dell'arricchimento.
⚠️ PRUDENZA: «gravidanza: sì» solo se c'è l'INCI e non contiene niente da evitare; senza INCI resta
«da verificare» (None). La conferma finale la dà Sofia in admin.
"""
import re
import inci as I

def _c(t):
    return (t or '').lower()


# ── il passaggio della routine ────────────────────────────────────────────────
PASSAGGI = [
    ('integratore', r'^(?!.*\b(shampo\w*|lozione|crema|siero|serum|sérum|balsamo|maschera|gel|spray|fiale|cerott\w*|patch\w*)\b).*(\b(compresse|capsule|bustine|softgel|perle|tavolette|gomme|cps|cpr|caps)\b|\bintegratore\b)'),
    ('spf', r'\bspf ?\d+|protezione solare|solare viso|sunscreen|sun stick|fotoprotett|anthelios|photoderm|fusion water|heliocare 360|uv defense|uv mune'),
    ('shampoo', r'\bshampo+\w*'),
    ('trattamento cute', r'\b(lozione|fiale|siero|spray|tonico)\b.*\b(anticaduta|caduta|diradamento|cuoio capelluto|cute|capelli)\b|\b(caduta|diradamento)\b.*\b(lozione|fiale|siero|spray|trattamento)\b|\banticaduta\b|\bcuoio capelluto\b'),
    ('balsamo e maschera capelli', r'\b(balsamo|maschera|conditioner|olio|siero|crema)\b.*\bcapell\w*|\bcapelli\b'),
    ('barba', r'\bbarba\b|dopobarba|after ?shave|rasatura'),
    # gli struccanti per gli occhi non sono la detersione del viso (il test consigliava Palpebral di SVR, 15/10)
    ('struccante occhi', r'(struccant\w*|d[ée]maquillant|make-?up remover|bifasico).{0,40}\b(occhi|yeux|eyes?|labbra)\b|\b(occhi|yeux|eyes?)\b.{0,25}(struccant|d[ée]maquillant)|palpebral'),
    ('detergente', r'detergente|struccante|micellare|latte detergente|olio detergente|mousse detergente|gel detergente|schiuma|cleanser|cleansing|syndet|pane dermatologico|balsamo detergente|saponetta'),
    ('tonico', r'\btonico\b|\btoner\b|\bessence toner\b|lozione tonica'),
    ('esfoliante', r'peeling|esfoliant|scrub|gommage|\baha\b|\bbha\b|acido glicolico|acido salicilico|acido mandelico'),
    ('contorno occhi', r'contorno occhi|occhi|eye\b|palpebr'),
    # i cerotti idrocolloidali per i brufoli (Federico, 15/10: «Hero e cose del genere avrebbe senso inserirle»);
    # gli altri cerotti (vesciche, calli, herpes, medicazioni) non sono per il test
    ('cerotti', r'(cerott|patch).{0,45}(brufol|acne|imperfezion|spot|pimple|zit)|(brufol|acne|imperfezion|antibrufol).{0,45}(cerott|patch)|mighty patch|master patch|clear ?spot|zitproof'),
    ('maschera', r'maschera|mask\b|patch'),
    ('siero', r'siero|serum|sérum|essenza|essence|ampoule|fiala|fiale|concentrato|booster|olio viso'),
    ('crema', r'crema|cream|gel-crema|emulsione|fluido|balsamo|baume|lozione|latte|gel\b'),
]
# i passaggi che il test usa oggi (src/data/test.json): il resto va nel catalogo ma non nella routine
PASSAGGIO_TEST = {'detergente': 'detergenti', 'tonico': 'sieri', 'siero': 'sieri', 'esfoliante': 'attivi', 'crema': 'creme', 'contorno occhi': 'creme',
                  'maschera': 'creme', 'spf': 'creme', 'shampoo': 'shampoo', 'trattamento cute': 'capelli', 'balsamo e maschera capelli': 'capelli',
                  'barba': 'barba', 'integratore': 'integratori', 'cerotti': 'cerotti'}


def passaggio(titolo):
    t = _c(titolo)
    for nome, rx in PASSAGGI:
        if re.search(rx, t):
            return nome
    return None


TEXTURE = [('acqua micellare', r'micellare'), ('olio', r'\bolio\b|\boil\b'), ('balsamo', r'balsamo|baume|balm'), ('gel', r'\bgel\b(?!-crema)'),
           ('gel-crema', r'gel-crema|crema-gel|gel crema'), ('mousse', r'mousse|schiuma|foam'), ('latte', r'\blatte\b|milk'), ('fluido', r'fluido|fluid'),
           ('siero', r'siero|serum'), ('lozione', r'lozione|lotion'), ('stick', r'\bstick\b'), ('crema ricca', r'ricca|rich|nutriente|riche'), ('crema', r'crema|cream')]


def texture(titolo):
    t = _c(titolo)
    for nome, rx in TEXTURE:
        if re.search(rx, t):
            return nome
    return None


# ── pelle, bisogni, forza ──────────────────────────────────────────────────────
PELLE = {
    'grassa': r'pelle grassa|pelli grasse|pelle mista|pelli miste|seborr|oily|sebo|opacizzant|purificant|imperfezion|acne|pori',
    'secca': r'pelle secca|pelli secche|molto secca|xerosi|atopic|nutrient|ricca|riche|ristrutturante|dry skin',
    'disidratata': r'disidratat|dehydrat|idratazione intensa|tira',
    'sensibile': r'sensibil|intolleran|reattiv|iper-?reattiv|arrossament|rossori|lenitiv|calmant|sensitive|ipoallergenic',
    'tutte': r'tutti i tipi di pelle|ogni tipo di pelle|tutte le pelli|all skin types',
}
BISOGNI = {
    'imperfezioni': (r'imperfezion|acne|brufol|punti neri|comedon|sebo|opacizzant|purificant|anti-?imperfezioni', {'acido salicilico', 'LHA', 'acido azelaico', 'zinco'}),
    'macchie': (r'macchie|iperpigment|discromi|uniformant|luminosit|illuminant|schiarent|incarnato', {'vitamina C', 'acido tranexamico', 'arbutina', 'thiamidol', 'acido azelaico'}),
    'tempo': (r'rughe|antirughe|anti-?età|antietà|anti-?age|rassodant|lifting|elasticit|tonicit|ringiovanent|anti-?ossidant', {'retinolo', 'retinale', 'retinoide estere', 'peptidi', 'bakuchiol'}),
    'idratazione': (r'idratan|idratazion|disidratat|hydra|hydrat', {'acido ialuronico', 'urea'}),
    'calmare': (r'lenitiv|calmant|rossori|arrossament|irritazion|sensibil|cica\b|riparatric', {'centella', 'pantenolo', 'bisabololo', 'allantoina'}),
    'barriera': (r'barriera|riparatric|ristrutturant|secchezza|atopic|xerosi|ceramid', {'ceramidi'}),
    'pori': (r'\bpori\b|pori dilatati|grana', {'acido salicilico', 'niacinamide'}),
}
RETINOIDI = {'retinolo', 'retinale', 'retinoide estere'}
ACIDI = {'acido glicolico', 'acido lattico', 'acido mandelico', 'acido salicilico', 'PHA', 'LHA'}


def forza(attivi, pas):
    """1 delicato · 2 medio · 3 forte (dagli attivi e dalle percentuali)."""
    a = {x['nome']: x['perc'] for x in attivi}
    if pas in ('detergente', 'shampoo', 'integratore', 'cerotti'):
        return 2 if (a.keys() & ACIDI) and pas == 'detergente' else 1
    f = 1
    for r in RETINOIDI & a.keys():
        p = a[r]
        if r == 'retinoide estere':
            f = max(f, 2)
        elif p is None or (r == 'retinolo' and p >= 0.3) or (r == 'retinale' and p >= 0.05):
            f = 3
        else:
            f = max(f, 2)
    for x in ACIDI & a.keys():
        p = a[x]
        f = max(f, 3 if (p and p >= 10 and x != 'PHA') else 2)
    if 'vitamina C' in a and (a['vitamina C'] or 0) >= 15:
        f = max(f, 2)
    if 'niacinamide' in a and (a['niacinamide'] or 0) >= 10:
        f = max(f, 2)
    if 'acido azelaico' in a or 'acido tranexamico' in a:
        f = max(f, 2)
    return f


CAPELLI = ('shampoo', 'trattamento cute', 'balsamo e maschera capelli')


def scheda(r, extra_inci=None, segmento=None):
    """Il record di un negozio → la scheda, con le fonti di ogni campo e quello che manca."""
    tit, desc = r['titolo'], r['descrizione'] or ''
    fonti, mancano = {}, []
    # l'INCI: dalla descrizione o da una fonte esterna
    inci_testo, inci_fonte = I.trova(desc), 'descrizione'
    if not inci_testo and extra_inci:
        inci_testo, inci_fonte = extra_inci['inci'], extra_inci['fonte']
    lista = I.leggi(inci_testo)
    if lista:
        fonti['inci'] = inci_fonte
    else:
        mancano.append('inci')
    testo = tit + ' . ' + desc
    pas = passaggio(tit) or passaggio(desc[:200])
    fonti['passaggio'] = 'titolo' if passaggio(tit) else 'descrizione'
    # le marche dell'integrazione: «Booster di collagene, 10 fiale», «Colpo di collagene» sono da bere, non sieri viso
    if segmento == 'Integrazione' and pas in ('siero', 'trattamento cute') and re.search(r'\b(fiale|flaconcin\w*|colpo|shot|drink|da bere|bevibil\w*)\b', _c(tit)) \
            and not re.search(r'\b(viso|pelle|cute|capelli|cuoio|applicare|siero)\b', _c(tit)):
        pas = 'integratore'
        fonti['passaggio'] = 'regola: marca di integrazione, da bere'
    # le marche dei capelli: un siero o una crema loro è per la cute o per le lunghezze, non per il viso
    if segmento == 'Capelli' and pas not in CAPELLI + ('integratore',):
        pas = 'balsamo e maschera capelli' if re.search(r'lunghezz|punte|balsamo|maschera|conditioner|olio|crespo', _c(tit)) else 'trattamento cute'
        fonti['passaggio'] = 'regola: marca per capelli'
    att = I.attivi(testo, lista)
    if not att:
        mancano.append('attivi')
    fonti['attivi'] = 'inci' if lista else 'titolo e descrizione'
    seg = I.segnali(lista)
    s = {'id': f"lk-{r['id']}", 'negozio': r['negozio'], 'id_negozio': r['id'], 'marca': r['marca'], 'titolo': tit,
         'nome': _corregge(nome_pulito(tit, r['marca']), pas, r['marca']), 'gtin': r.get('gtin'), 'immagine': r.get('immagine'), 'link': r.get('link'),
         'prezzo': r.get('prezzo'), 'prezzo_pieno': r.get('prezzo_pieno'), 'passaggio': pas, 'categoria_test': PASSAGGIO_TEST.get(pas),
         'attivi': att, 'inci': lista or None}
    # misura e prezzo ogni 10 ml (o 10 g)
    m = re.search(r'(\d+(?:[.,]\d+)?)\s*(ml|g)\b', _c(tit)) or re.search(r'(\d+(?:[.,]\d+)?)\s*(ml|g)\b', _c(r.get('misura_feed')))
    if m:
        v = float(m.group(1).replace(',', '.'))
        s['misura'] = {'valore': v, 'unita': m.group(2)}
        s['al_10'] = round(r['prezzo'] / v * 10, 2) if r.get('prezzo') and v else None
    else:
        s['misura'], s['al_10'] = None, None
        if pas not in ('integratore',):
            mancano.append('misura')
    s['spf'] = int(m2.group(1)) if (m2 := re.search(r'spf\s*(\d{2})', _c(tit + ' ' + desc[:300]))) else None
    s['texture'] = texture(tit) or texture(desc[:300])
    if not s['texture'] and pas not in ('integratore',):
        mancano.append('texture')
    # profumo e alcol: solo dall'INCI, o da una dichiarazione esplicita
    if lista:
        s['profumo'] = seg['profumo']; s['alcol'] = seg['alcol']; s['oli_essenziali'] = seg['oli_essenziali']
    else:
        senza = re.search(r'senza profum|privo di profum|fragrance[- ]free|non profumat|senza fragranz', _c(testo))
        s['profumo'] = False if senza else None
        s['alcol'] = False if re.search(r'senza alcol|alcohol[- ]free', _c(testo)) else None
        s['oli_essenziali'] = None
        fonti['profumo'] = 'descrizione' if senza else None
        if s['profumo'] is None and pas not in ('integratore',):
            mancano.append('profumo')
    # momento della giornata
    nomi = {a['nome'] for a in att}
    s['momento'] = 'mattina' if pas == 'spf' or ('vitamina C' in nomi and not nomi & RETINOIDI) else 'sera' if nomi & RETINOIDI or (nomi & ACIDI and pas in ('esfoliante', 'siero')) or re.search(r'\bnotte\b|night', _c(tit)) else 'mattina e sera'
    # forza, sole, gravidanza
    s['forza'] = forza(att, pas)
    lascia = pas not in ('detergente', 'shampoo', 'maschera')
    s['fotosensibilizzante'] = bool(lascia and (nomi & RETINOIDI or nomi & {'acido glicolico', 'acido lattico', 'acido mandelico'}))
    if nomi & RETINOIDI or re.search(r'HYDROQUINONE', ' '.join(lista)):
        s['gravidanza'] = False; fonti['gravidanza'] = 'regola: retinoidi'
    elif lascia and 'acido salicilico' in nomi:
        s['gravidanza'] = None; fonti['gravidanza'] = 'da verificare: acido salicilico da lasciare sulla pelle'
    elif pas == 'integratore':
        s['gravidanza'] = None; fonti['gravidanza'] = 'integratore: decide il medico'
    elif lista:
        s['gravidanza'] = True; fonti['gravidanza'] = 'regola: INCI senza ingredienti da evitare (da confermare)'
    else:
        s['gravidanza'] = None; fonti['gravidanza'] = 'da verificare: manca l\'INCI'
    # per quale pelle
    tp = {k for k, rx in PELLE.items() if re.search(rx, _c(testo))}
    if pas in ('integratore', 'shampoo', 'trattamento cute', 'balsamo e maschera capelli'):
        s['pelle'] = None
    else:
        sebo = ['basso', 'medio', 'alto'] if ('tutte' in tp or not tp & {'grassa', 'secca'}) else (['medio', 'alto'] if 'grassa' in tp else []) + (['basso', 'medio'] if 'secca' in tp else [])
        sebo = sorted(set(sebo), key=['basso', 'medio', 'alto'].index)
        if not tp & {'grassa', 'secca', 'tutte'} and s['texture'] in ('gel', 'fluido', 'gel-crema', 'mousse', 'acqua micellare'):
            sebo = ['medio', 'alto']; fonti['sebo'] = 'regola: texture leggera'
        elif not tp & {'grassa', 'secca', 'tutte'} and s['texture'] in ('balsamo', 'crema ricca', 'olio'):
            sebo = ['basso', 'medio']; fonti['sebo'] = 'regola: texture ricca'
        else:
            fonti['sebo'] = 'descrizione' if tp & {'grassa', 'secca', 'tutte'} else 'regola: nessuna indicazione, va bene per tutti'
        idr = ['ok', 'disidratata'] if ('disidratata' in tp or 'secca' in tp or 'idratazione' in nomi or 'acido ialuronico' in nomi) else ['ok']
        # fino a che reattività si può usare: 0 solo pelli non reattive · 1 un po' · 2 anche molto
        rea = 2 if 'sensibile' in tp else 1
        if s['forza'] == 3: rea = 0
        elif s['forza'] == 2: rea = min(rea, 1)
        if s['profumo'] or s['oli_essenziali'] or s['alcol']: rea = min(rea, 1)
        s['pelle'] = {'sebo': sebo, 'idr': idr, 'reattiva': rea}
        fonti['reattiva'] = 'regola: forza, profumo e dichiarazioni'
    # per cosa lavora
    s['bisogni'] = [] if pas in CAPELLI + ('integratore',) else [b for b, (rx, att_b) in BISOGNI.items() if re.search(rx, _c(tit + ' ' + desc[:250])) or nomi & att_b]
    if not s['bisogni'] and pas not in ('integratore', 'shampoo', 'trattamento cute', 'balsamo e maschera capelli', 'detergente'):
        mancano.append('bisogni')
    # cute e capelli
    if pas in ('shampoo', 'trattamento cute', 'balsamo e maschera capelli'):
        t = _c(testo)
        s['capelli'] = {
            'cute': [c for c, rx in {'grasso': r'grass|seborr|sebo', 'secco': r'secc|disidrat', 'sensibile': r'sensibil|lenitiv|prurit|irritat', 'normale': r'normal|uso frequente|tutti i tipi'}.items() if re.search(rx, t)] or ['normale'],
            'bisogni': [c for c, rx in {'caduta': r'caduta|anticaduta|diradament|rinforz|fortific|densit', 'forfora': r'forfora|antiforfora|desquam|squam', 'secchi-crespi': r'secch|crespi|danneggiat|sfibrat|ristruttur|nutrient|riparat', 'mantenimento': r'uso frequente|delicat|quotidian|tutti i tipi'}.items() if re.search(rx, t)] or ['mantenimento'],
        }
    # integratori
    if pas == 'integratore':
        t = _c(testo)
        s['integrazione'] = [c for c, rx in {'capelli': r'capelli|caduta|hair', 'unghie': r'unghie|nails', 'pelle-secca': r'idrataz|secchezza|omega', 'tono': r'collagen|rughe|elasticit|anti-?age|tonicit', 'sole': r'sole|solare|abbronzatura|carotene|polypodium|fernblock', 'imperfezioni': r'acne|imperfezion|brufol'}.items() if re.search(rx, t)]
    s['fonti'] = fonti
    s['mancano'] = mancano
    return s


# i nomi con cui il negozio scrive marche e produttori dentro i titoli (anche tradotti per sbaglio)
ALIAS = [r"bellezza di joseon", r"beauty of joseon", r"pierre fabre( it\.?( s\.?p\.?a\.?)?)?", r"l'or[ée]al( italia)?( s\.?p\.?a\.?)?", r"cantabria( labs)?",
         r"\blabo\b", r"galderma", r"beiersdorf", r"\bpierre\b", r"laboratoires?", r"esthederm institute", r"institut esthederm", r"istituto esthederm", r"\besthederm\b", r"\bhada(?: labo)?(?: tokyo)?\b", r"\balcuni da mi\b"]


def _senza_accenti(t):
    import unicodedata
    return unicodedata.normalize('NFD', t).encode('ascii', 'ignore').decode()


def _corregge(nome, pas, marca=''):
    """Le traduzioni sbagliate del negozio che direbbero una cosa falsa: i cerotti per brufoli e i prodotti
    di Acnemy («zit», brufolo) tradotti «eczema» (dal polacco «wyprysk», che vuol dire anche brufolo)."""
    if pas == 'cerotti' or marca == 'Acnemy':
        nome = re.sub(r'\bper (l\')?eczema\b', 'per brufoli', nome, flags=re.I)
        nome = re.sub(r"\b(dopo |contro )?l['’]eczema\b", lambda m: (m.group(1) or '') + 'i brufoli', nome, flags=re.I)
        nome = re.sub(r'\beczema\b', 'brufoli', nome, flags=re.I)
    return nome


def nome_pulito(titolo, marca):
    """Il nome senza la marca, la misura e il maiuscolo urlato (regola dei titoli di tutti i siti)."""
    t = titolo
    # la marca anche tradotta dal negozio («Grazie Farmer», «Mary e May»)
    for m_ in {marca, marca.replace(' and ', ' e '), marca.replace(' & ', ' e '), re.sub(r'(?i)^thank you', 'Grazie', marca)} if marca else ():
        t = re.sub(re.escape(m_), ' ', t, flags=re.I)
    if marca:
        t2 = _senza_accenti(t)
        if len(t2) == len(t):  # la marca scritta con gli accenti («Avène»): si toglie sulla versione senza
            for m in re.finditer(re.escape(_senza_accenti(marca)), t2, flags=re.I):
                t = t[:m.start()] + ' ' * (m.end() - m.start()) + t[m.end():]
    for a in ALIAS:
        t = re.sub(a, ' ', t, flags=re.I)
    t = re.sub(r',?\s*\d+(?:[.,]\d+)?\s*(ml|g|gr|grammi)\b', ' ', t, flags=re.I)
    # i pezzi solo dopo la virgola o la «x»: «Heliocare 360 Capsule, 30 capsule» resta «360 Capsule»
    t = re.sub(r'(?:,|\bx)\s*\d+\s*(pz|pezzi|capsule|compresse|fiale|bustine|cps|cpr)\b', ' ', t, flags=re.I)
    t = re.sub(r'\s*[|,]\s*', ', ', t)
    t = re.sub(r'(,\s*)+', ', ', t).strip(' ,.-|')
    t = re.sub(r'\s+', ' ', t)
    # lo stesso pezzo ripetuto dopo la virgola, e le parole rimaste appese in fondo («… da», «… x»)
    pezzi = []
    for x in t.split(', '):
        if x.strip() and x.strip().lower() not in [y.lower() for y in pezzi]:
            pezzi.append(x.strip())
    t = ', '.join(pezzi)
    t = re.sub(r'(?:[\s,]+(?:da|x|di|con|per|e|a|in|al|alla|del|della))+\s*$', '', t, flags=re.I).strip(' ,.-')
    # le parole urlate in maiuscolo diventano normali; le sigle restano («SPF», «AHA», «B5», «NCEF»)
    SIGLE = {'SPF', 'AHA', 'BHA', 'PHA', 'LHA', 'UV', 'UVA', 'UVB', 'PDRN', 'NCEF', 'HFSC', 'RGN', 'CE', 'HA', 'DS', 'AC', 'AP', 'AR', 'XL', 'PM', 'AM', 'SA', 'BB', 'CC', 'II', 'III', 'IV', 'H2O', 'MD', 'DNA', 'ATP', 'KR'}
    t = re.sub(r"\b[A-ZÀ-Ý][A-ZÀ-Ý'’]{2,}\b", lambda m: m.group(0) if m.group(0) in SIGLE else m.group(0).capitalize(), t)
    if not t.strip(' ,.-'):  # tutto il titolo era marca e misura: resta il titolo senza la marca
        t = re.sub(re.escape(marca or ''), ' ', titolo, flags=re.I).strip(' ,.-') or titolo
    return t[:1].upper() + t[1:]


def completezza(s):
    """Quanto è completa una scheda, da 0 a 100: l'INCI vale di più."""
    campi = ['inci', 'attivi', 'misura', 'texture', 'profumo', 'bisogni']
    peso = {'inci': 35, 'attivi': 20, 'misura': 10, 'texture': 10, 'profumo': 10, 'bisogni': 15}
    return sum(peso[c] for c in campi if c not in s['mancano'])
