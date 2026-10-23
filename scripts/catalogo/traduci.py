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
    ('integratore', r'^(?!.*\b(shampo\w*|lozione|crema|siero|serum|sérum|balsamo|maschera|gel|spray|fiale|cerott\w*|patch\w*)\b).*(\b(compresse|capsule|bustine|softgel|perle|tavolette|gomme|cps|cpr|caps|film or\w+)\b|\bintegratore\b|\bcollagene\b.*\b(polvere|complex|\d+(?:[.,]\d+)?\s*g)\b|\b(omega[- ]?3|vitamin[ae]? d3?)\b.*\b\d+\s*ml\b)'),  # 23/10/2026: il collagene in polvere (Zreen) senza «capsule» nel titolo; i film orali (IBSA), l'olio di omega-3 e la vitamina D in gocce
    ('spf', r'\bspf ?\d+|protezione solare|solare viso|sunscreen|sun stick|fotoprotett|anthelios|photoderm|fusion water|heliocare 360|uv defense|uv mune'),
    # ciglia e sopracciglia non sono la cute né i capelli (il test proponeva un siero per sopracciglia al posto di un tonico per la cute, 15/10)
    ('ciglia e sopracciglia', r'sopraccigli\w*|\bciglia\b|\bciglie\b|\blash\w*|\bbrow\w*|mascara'),
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
    'macchie': (r'macchie|iperpigment|discromi|uniformant|luminosit|illuminant|schiarent|incarnato|depigment|sbiancant|brighten|dark spot', {'vitamina C', 'acido tranexamico', 'arbutina', 'thiamidol', 'acido azelaico'}),
    'tempo': (r'rughe|antirughe|anti-?età|antietà|anti-?age|rassodant|lifting|\blift\b|liftant|ridensific|rivitaliz|revitaliz|renewal|elasticit|tonicit|ringiovanent|anti-?ossidant', {'retinolo', 'retinale', 'retinoide estere', 'peptidi', 'bakuchiol'}),
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
BISOGNI_CAPELLI = {'caduta': r'caduta|anticaduta|diradament|rinforz|fortific|densit|crescita|stimolant|energizz', 'forfora': r'forfora|antiforfora|desquam|squam',
                   'secchi-crespi': r'secch|crespi|danneggiat|sfibrat|ristruttur|nutrient|riparat', 'mantenimento': r'uso frequente|delicat|quotidian|tutti i tipi'}
INTEGRAZIONE = {'capelli': r'capelli|caduta|hair', 'unghie': r'unghie|nails', 'pelle-secca': r'idrataz|secchezza', 'tono': r'collagen|rughe|elasticit|anti-?age|tonicit',
                'sole': r'\bsole\b|solar|abbronzatur|carotene|polypodium|fernblock', 'imperfezioni': r'acne|imperfezion|brufol'}
# IL GIRO INTEGRATIVO (23/10/2026, Federico: «mancanza di sonno, vitamina C, cose per cui serve un giro integrativo»).
# Si leggono nel TITOLO, non nella descrizione: un collagene «con vitamina C» non è un integratore per le difese.
# Ogni bisogno è un'indicazione autorizzata del Reg. (UE) 432/2012 (src/lib/integratori.ts): melatonina per
# addormentarsi; vitamine B, C e magnesio per la stanchezza; C, D, zinco e selenio per le difese; EPA e DHA per il
# cuore; magnesio e vitamine B per la funzione psicologica; B12 per chi mangia vegano.
BENESSERE = {
    'sonno': r'melaton',
    'energia': r'stanchezz|affaticament|b[- ]?dyn(?! ?b12)|vitamin[ae] b\b|complesso b|magnesio|magnesium|metaviva',
    'stress': r'\bstress|magnesio|magnesium|b[- ]?dyn(?! ?b12)|vitamin[ae] b\b|complesso b|metaviva',
    'difese': r'immun|difes|ester[- ]?c|vitamin[ae]? c\b|\bzinco\b|zincodyn|picozinco',
    'vitamina-d': r'vitamin[ae]? d\b|vit\.? ?d3|\bd3\b|colecalciferol',
    'omega-3': r'omega[- ]?3|\bepa\b|\bdha\b|olio di (?:pesce|fegato)|krill',
    'b12': r'\bb ?12\b|cobalamin',
}


def scheda(r, extra_inci=None, segmento=None, dichiarati=None):
    """Il record di un negozio → la scheda, con le fonti di ogni campo e quello che manca."""
    tit, desc = r['titolo'], r['descrizione'] or ''
    fonti, mancano = {}, []
    # l'INCI: dalla descrizione o da una fonte esterna
    inci_testo, inci_fonte = I.trova(desc), 'descrizione'
    # una fonte esterna si passa solo quando serve (INCI assente, o troncato e c'è quello approvato): allora vince lei
    if extra_inci:
        inci_testo, inci_fonte = extra_inci['inci'], extra_inci['fonte']
    lista = I.leggi(inci_testo)
    if lista:
        fonti['inci'] = inci_fonte
    else:
        mancano.append('inci')
    # le frasi che parlano d'altro non dicono cosa c'è nel prodotto: «da usare con altri prodotti: con vitamina C…»,
    # «simile a un prodotto con lo 0,5% di retinolo» (Zeno, 15/10)
    desc_attivi = ' '.join(f for f in re.split(r'(?<=[.;!?])\s+|<li>|</li>|\n', desc)
                           if not re.search(r'altri prodotti|abbina|in combinazione|combinar|insieme (?:a|con)|simile a un|rispetto a|al posto d|invece d', f, re.I))
    testo = tit + ' . ' + desc_attivi
    pas = passaggio(tit) or passaggio(desc[:200])
    # «Dercos Technique Anti-Forfora Capelli Secchi»: il titolo dice solo «capelli», la descrizione dice che è
    # uno shampoo (Zeno, 15/10). Se il titolo non nomina il tipo, decide l'inizio della descrizione.
    if pas == 'balsamo e maschera capelli' and not re.search(r'balsamo|maschera|conditioner|olio|siero|crema|spray|lozione', _c(tit)):
        pas = passaggio(desc[:300]) or pas
    fonti['passaggio'] = 'titolo' if passaggio(tit) else 'descrizione'
    # le marche dell'integrazione: «Booster di collagene, 10 fiale», «Colpo di collagene» sono da bere, non sieri viso
    # (anche «Oligo Selenio, capelli e unghie, 30 fiale» di Granions: una marca solo di integratori, 15/10)
    if segmento == 'Integrazione' and pas in ('siero', 'trattamento cute') and re.search(r'\b(fiale|flaconcin\w*|colpo|shot|drink|da bere|bevibil\w*)\b', _c(tit)) \
            and not re.search(r'\b(viso|cuoio|applicare|lozione|massagg\w*|siero)\b', _c(tit)):
        pas = 'integratore'
        fonti['passaggio'] = 'regola: marca di integrazione, da bere'
    # le marche dei capelli: un siero o una crema loro è per la cute o per le lunghezze, non per il viso
    # ma non per un prodotto chiaramente per il viso, il corpo o i bimbi (Klorane fa anche creme viso e linea Bébé, Friday 15/10)
    if segmento == 'Capelli' and pas not in CAPELLI + ('integratore', 'ciglia e sopracciglia') \
            and not re.search(r'\bviso\b|\bface\b|visage|\bcorpo\b|\bbody\b|pannolin|\bb[ée]b[ée]\b|\bbaby\b|neonat|bambin', _c(tit)) \
            and not (re.search(NON_CAPELLI, _c(tit)) and not re.search(r'capell|cuoio|\bcute\b|scalp|caduta', _c(tit))):
        # anche in inglese (Beautycos, 16/10): «Intense Hydrating Mask», «Leave-in», «Hair Oil», «Frizz»
        pas = 'balsamo e maschera capelli' if re.search(r'lunghezz|punte|balsamo|maschera|conditioner|olio|crespo|\bmask|masque|\boil\b|leave[- ]in|frizz|discipline|split ends', _c(tit)) else 'trattamento cute'
        fonti['passaggio'] = 'regola: marca per capelli'
    att = I.attivi(testo, lista)
    # gli attivi con la percentuale dichiarata dal produttore, trovati da Zeno e approvati in admin («niacinamide 10%;
    # acido salicilico 2%»): la percentuale vale più di quella letta nel testo del negozio (16/10)
    if dichiarati:
        # ⚠️ Con gli attivi dichiarati le percentuali vengono solo da lì: il testo del negozio può sbagliare
        # (Liki24 scrive «acido ialuronico al 3%» per Avène Cleanance Comedomed, che ha il 3% di acido succinico, 23/10)
        for x in att:
            x['perc'] = None
        for voce in re.split(r'\s*;\s*', dichiarati):
            m = re.match(r'(.+?)\s*(?:(\d+(?:[.,]\d+)?)\s*%)?\s*$', voce.strip())
            if not m or not m.group(1):
                continue
            nome = next((x['nome'] for x in I.attivi(m.group(1))), None)
            if not nome:
                continue
            perc = float(m.group(2).replace(',', '.')) if m.group(2) else None
            gia = next((x for x in att if x['nome'] == nome), None)
            if gia:
                gia['perc'] = perc if perc is not None else gia['perc']
            else:
                att.append({'nome': nome, 'perc': perc})
    if not att:
        mancano.append('attivi')
    fonti['attivi'] = 'inci' if lista else 'titolo e descrizione'
    seg = I.segnali(lista)
    s = {'id': f"{r.get('prefisso', 'lk')}-{r['id']}", 'negozio': r['negozio'], 'id_negozio': r['id'], 'marca': r['marca'], 'titolo': tit,
         'nome': _corregge(nome_pulito(tit, r['marca']), pas, r['marca']), 'gtin': r.get('gtin'), 'immagine': r.get('immagine'), 'link': r.get('link'), 'url_negozio': r.get('url_negozio'),
         'prezzo': r.get('prezzo'), 'prezzo_pieno': r.get('prezzo_pieno'), 'passaggio': pas, 'categoria_test': PASSAGGIO_TEST.get(pas),
         'attivi': att, 'inci': lista or None}
    # misura e prezzo ogni 10 ml (o 10 g)
    m = re.search(r'(\d+(?:[.,]\d+)?)\s*(ml|g)\b', _c(tit)) or re.search(r'(\d+(?:[.,]\d+)?)\s*(ml|g)\b', _c(r.get('misura_feed')))
    if m and float(m.group(1).replace(',', '.')) > 0:  # «0 ml» nei feed vuol dire misura sconosciuta
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
    # profumo, alcol, oli essenziali: dall'INCI, o da una dichiarazione esplicita del produttore. Che un
    # ingrediente c'è lo dice anche un elenco troncato; che manca («senza profumo») solo un elenco intero (16/10)
    s['inci_completo'] = I.completo(lista, pas)
    dichiarato = {'profumo': re.search(r'senza profum|privo di profum|fragrance[- ]free|non profumat|senza fragranz|parfum[- ]free|perfume[- ]free', _c(testo)),
                  'alcol': re.search(r'senza alcol|alcohol[- ]free|privo di alcol', _c(testo)),
                  'oli_essenziali': re.search(r'senza oli essenziali|essential[- ]oil[- ]free|privo di oli essenziali', _c(testo))}
    for k in ('profumo', 'alcol', 'oli_essenziali'):
        s[k] = True if seg.get(k) else False if (s['inci_completo'] or dichiarato[k]) else None
    fonti['profumo'] = 'inci' if (s['profumo'] or s['inci_completo']) else 'descrizione' if dichiarato['profumo'] else None
    # la completezza (e quindi la selezione) resta quella di prima; l'elenco troncato va nella lista di lavoro a parte
    if s['profumo'] is None and not lista and pas not in ('integratore',):
        mancano.append('profumo')
    if lista and not s['inci_completo'] and pas not in ('integratore',):
        mancano.append('inci intero')
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
            'bisogni': [c for c, rx in BISOGNI_CAPELLI.items() if re.search(rx, t)] or ['mantenimento'],
        }
    # integratori
    if pas == 'integratore':
        t = _c(testo)
        ben = [c for c, rx in BENESSERE.items() if re.search(rx, _c(tit))]
        # gli omega-3 per la pelle non hanno indicazioni autorizzate (src/lib/integratori.ts): niente bisogni della pelle,
        # anche se la descrizione parla di pelle o di sole (Norsan, 23/10)
        s['integrazione'] = ([] if 'omega-3' in ben else [c for c, rx in INTEGRAZIONE.items() if re.search(rx, t)]) + ben
        # vegano o vegetariano solo se lo dichiara; l'olio di pesce e le perle di gelatina mai (il test lo chiede, 23/10)
        s['vegano'] = bool(re.search(r'vegan|vegetal|vegetarian', t)) and not re.search(
            r'non (?:è |e )?adatt\w* a\w* ?(?:vegan|vegetarian)|olio di (?:pesce|fegato)|fish oil|merluzzo|gelatina|krill', t)
    # che cosa è davvero, per i confronti (al_sito.py simili() e src/lib/simili.ts): dove si mette, in che forma, quanti pezzi
    s['zona'], s['forma'], s['pezzi'] = zona(tit, pas), forma(tit, pas), pezzi(tit)
    s['fonti'] = fonti
    s['mancano'] = mancano
    return s


# ── per i confronti: la zona, la forma e i pezzi ───────────────────────────────
# ⚠️ PERCHÉ (Federico, 15/10: «da un tonico per cuoio capelluto mi hai consigliato come top un siero per
# sopracciglia… questo prodotto che consiglio in alternativa è davvero simile?»). Il passaggio da solo non basta:
# nella stessa «crema» ci sono creme viso, contorni occhi e creme per il pannolino; nello stesso «detergente»
# acque micellari e gel schiumogeni; nello stesso «trattamento cute» fiale anticaduta e creme per le lunghezze.
# Due prodotti si confrontano solo con la stessa zona e la stessa forma (Friday, 15/10).
NON_CAPELLI = r'\bviso\b|visage|\bpelle\b|\bocchi\b|b[ée]b[ée]|pannolin|\bcorpo\b|solare|\bspf\b|micellar|struccant|labbra|crema-gel|gel crema|purezza|crema leggera|latte detergente|rimpolpante'


def zona(titolo, pas):
    """Dove si mette: viso, occhi, labbra, ciglia, unghie, corpo, bimbi, cute, capelli, barba (integratori: bocca)."""
    t = _c(titolo)
    if pas == 'integratore':
        return 'bocca'
    if pas == 'ciglia e sopracciglia' or re.search(r'sopraccigl|\bciglia\b|\bciglie\b|\blash\w*|\bbrow\w*|mascara', t):
        return 'ciglia'
    if re.search(r'labbr|\blips?\b|l[èe]vres|lip ?balm|burrocacao', t):
        return 'labbra'
    if pas == 'struccante occhi' or re.search(r'contorno (?:degli )?occhi|\bocchi\b|\beyes?\b|\byeux\b|palpebr|occhiaie|\bborse\b', t):
        return 'occhi'
    if re.search(r'\bunghie\b|ongles|\bnails?\b', t):
        return 'unghie'
    if re.search(r'pannolin|\bb[ée]b[ée]\b|\bbaby\b|neonat|bambin', t):
        return 'bimbi'
    if re.search(r'\bcorpo\b|\bbody\b|\bmani\b|\bmano\b|\bpiedi\b|\bgambe\b|smagliatur|\bintim\w*|deodor|ascell|\bseno\b|cellulit', t) \
            and not re.search(r'\bviso\b|\bface\b|visage', t):
        return 'corpo'
    if pas in CAPELLI:
        if pas != 'shampoo' and re.search(NON_CAPELLI, t) and not re.search(r'capell|cuoio|\bcute\b|scalp|caduta', t):
            return 'viso'  # una crema o un'acqua micellare di una marca per capelli (Klorane): non è per la testa
        if pas == 'shampoo' or re.search(r'cuoio capellut|\bcute\b|scalp|caduta|diradament|dermocapill|forfora|crescita|density|\bfial\w*|ampoll', t):
            return 'cute'
        if pas == 'trattamento cute' and not re.search(r'lunghezz|\bpunte\b|ricci|biond|districant|fibra|senza risciacquo|leave|bond', t):
            return 'cute'
        return 'capelli'
    if pas == 'barba':
        return 'barba'
    # una crema o un solare da 250 ml in su è un formato viso e corpo, non si confronta con una crema viso da 50 ml
    m = re.search(r'(\d+(?:[.,]\d+)?)\s*(?:ml|g)\b', t)
    if pas in ('crema', 'spf') and m and float(m.group(1).replace(',', '.')) >= 250:
        return 'viso e corpo'
    return 'viso'


def forma(titolo, pas):
    """In che forma: dentro lo stesso passaggio, le cose che non si scambiano (acqua micellare e gel, scrub e
    siero esfoliante, fiale anticaduta e balsamo, solare colorato e no)."""
    t = _c(titolo)
    if pas == 'shampoo':
        if re.search(r'\bsecco\b.*shampo|shampo\w* secco|dry shampoo', t):
            return 'shampoo secco'
        if re.search(r'dopo[- ]?shampo|\bbalsamo\b|conditioner', t):
            return 'balsamo'  # un balsamo finito tra gli shampoo non è uno shampoo
        if re.search(r'\bviola\b|silver|argent|biond|antigiallo|no yellow|purple', t):
            return 'shampoo per il colore'
        return 'shampoo'
    if pas in ('trattamento cute', 'balsamo e maschera capelli'):
        if re.search(r'scrub|esfolian|peeling|gommage', t):
            return 'esfoliante'
        if re.search(r'\bbalsamo\b|maschera|conditioner|\bmask\b|impacco|\bbaume\b', t) and not re.search(r'senza risciacquo|leave', t):
            return 'balsamo o maschera'
        if re.search(r'styling|defini\w* (?:dei )?ricci|lacca|\bcera\b|\bpasta\b', t):
            return 'styling'
        return 'lozione o siero' if pas == 'trattamento cute' else 'da lasciare sulle lunghezze'
    if pas == 'detergente':
        if re.search(r'scrub|gommage|esfoliant\w* .*granul', t):
            return 'scrub'
        if re.search(r'\bpolvere\b|powder', t):
            return 'polvere'
        if re.search(r'\bolio\b|\boil\b|\bbalsamo\b|\bbalm\b|\bbaume\b|\bburro\b', t):
            return 'olio o balsamo'
        if re.search(r'micellar|struccante|tonico|lozione|lotion', t) and not re.search(r'\bgel\b|schiuma|mousse|foam', t):
            return 'acqua micellare o lozione'
        if re.search(r'\bpane\b|saponetta|\bsapone\b|barretta|\bbar\b|solido', t):
            return 'pane'
        if re.search(r'\blatte\b|\bmilk\b|\bcrema\b|\bcream\b', t):
            return 'latte o crema'
        return 'gel o mousse'
    if pas == 'esfoliante':
        if re.search(r'scrub|gommage|granul|microgran|polvere', t):
            return 'scrub'
        if re.search(r'dischett|\bpads?\b|salviett', t):
            return 'dischetti'
        if re.search(r'maschera|\bmask\b', t):
            return 'maschera'
        if re.search(r'deterg|cleans|lavante|\bmousse\b|schiuma|\bwash\b', t):
            return 'detergente'
        return 'da lasciare'
    if pas == 'siero':
        return 'fiale' if re.search(r'\bfial|ampoul', t) else 'olio' if re.search(r'\bolio\b|\boil\b', t) else 'siero'
    if pas == 'crema':
        if re.search(r'schiumogen|moussant|lavant|detergent|cleanser', t):
            return 'detergente'  # un gel detergente finito tra le creme
        if re.search(r'maschera|\bmask\b', t):
            return 'maschera'
        if re.search(r'\bstick\b', t):
            return 'stick'
        return 'olio' if re.search(r'\bolio\b|\boil\b', t) and not re.search(r'\bcrema\b', t) else 'crema'
    if pas == 'spf':
        if re.search(r'\bstick\b', t):
            return 'stick'
        if re.search(r'\bspray\b|nebbia|\bmist\b|brume', t):
            return 'spray'
        if re.search(r'colorat|tinted|teint|\btinta\b|\bcolor\b|fondotinta|bb cream|cc cream|compatt|cipria|polvere', t):
            return 'colorata'
        return 'crema o fluido'
    if pas == 'integratore':
        if re.search(r'\bfial|flaconcin|\bshot\b|drink|bevib|\bml\b', t):
            return 'da bere'
        if re.search(r'bustin|polvere|\bstick\b', t):
            return 'bustine'
        if re.search(r'gommos|gummies|caramell|masticab', t):
            return 'gommose'
        return 'capsule o compresse'
    if pas == 'barba':
        return 'detergente' if re.search(r'shampo|deterg|sapone|wash', t) else 'olio' if re.search(r'\bolio\b|\boil\b', t) else 'balsamo o crema'
    return pas


def pezzi(titolo):
    """Quanti pezzi nella confezione (capsule, fiale, cerotti...): l'ultimo numero scritto, «10 + 10» e «2x60» moltiplicati.
    Serve a confrontare il formato di integratori, fiale e cerotti, che non hanno i ml."""
    t = _c(titolo)
    m = list(re.finditer(r'(\d+)(?:\s*\+\s*(\d+))?(?:\s*x\s*(\d+))?\s*(?:capsule|compresse|cpr|cps|caps|perle|softgel|bustine|stick|fial\w*|flaconcini|cerotti|patch|pezzi|pz|unit[àa]|coppie|gommose|tavolette|pastiglie)\b', t))
    if not m:
        return None
    a, piu, per = m[-1].groups()
    n = int(a) + (int(piu) if piu else 0)
    return n * int(per) if per else n


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
    for m_ in {marca, marca.replace(' and ', ' e '), marca.replace(' & ', ' e '), marca.replace('-', ' '), re.sub(r'(?i)^thank you', 'Grazie', marca)} if marca else ():
        # parola intera: «A Derma» non deve prendersi la «a» di «A-Derma Dermalibour», né «Isdin» mezza «Isdinceutics»
        t = re.sub(r'(?<!\w)' + re.escape(m_) + r'(?!\w)', ' ', t, flags=re.I)
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
    SIGLE = {'SPF', 'AHA', 'BHA', 'PHA', 'LHA', 'UV', 'UVA', 'UVB', 'PDRN', 'NCEF', 'HFSC', 'RGN', 'CE', 'HA', 'DS', 'AC', 'AP', 'AR', 'XL', 'PM', 'AM', 'SA', 'BB', 'CC', 'II', 'III', 'IV', 'H2O', 'MD', 'DNA', 'ATP', 'KR', 'TXA', 'HA', 'PDRN', 'EGF', 'NAD', 'CBD', 'UVB', 'PH'}
    t = re.sub(r"\b[A-ZÀ-Ý][A-ZÀ-Ý'’]{2,}\b", lambda m: m.group(0) if m.group(0) in SIGLE else m.group(0).capitalize(), t)
    if not t.strip(' ,.-'):  # tutto il titolo era marca e misura: resta il titolo senza la marca
        t = re.sub(re.escape(marca or ''), ' ', titolo, flags=re.I).strip(' ,.-') or titolo
    return t[:1].upper() + t[1:]


def completezza(s):
    """Quanto è completa una scheda, da 0 a 100: l'INCI vale di più."""
    campi = ['inci', 'attivi', 'misura', 'texture', 'profumo', 'bisogni']
    peso = {'inci': 35, 'attivi': 20, 'misura': 10, 'texture': 10, 'profumo': 10, 'bisogni': 15}
    return sum(peso[c] for c in campi if c not in s['mancano'])
