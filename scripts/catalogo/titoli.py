"""TITOLO E SOTTOTITOLO di ogni prodotto, per tutti i feed (Federico, 16/10: «serve una normalizzazione dei
titoli e un sottotitolo, in modo che ogni feed che aggiungiamo vada a completare e non a sporcare»).

    Medicube                                   ← marca (a parte)
    Zero Pore One Day                          ← titolo: la linea o il modello
    Siero per la riduzione dei pori e …        ← sottotitolo: che cos'è e cosa fa

Come si riconosce la linea: una parola che nei titoli dei negozi compare spesso in minuscolo («antirughe»,
«idratante», «capelli») è una parola comune; una che compare quasi sempre con la maiuscola («Hydrotenseur»,
«Galactomyces», «Psomed») è un nome. Il vocabolario si impara dai titoli del feed di Liki24 (130 mila) e si tiene
in feeds-out/vocabolario.json. Senza una linea, il titolo resta il nome e il sottotitolo nasce dalla scheda
(tipo, attivo principale, a cosa serve), sempre in italiano.
"""
import csv, io, json, re
from collections import Counter
from pathlib import Path

R = Path(__file__).resolve().parents[2]
VOC = R / 'feeds-out' / 'vocabolario.json'

# le parole del tipo di prodotto: non sono mai il nome della linea
TIPO = set('''siero sieri serum sérum crema creme cream creams crème gel detergente detergenti cleanser cleansing schiuma foam mousse
lozione lotion tonico toner essenza essence fluido fluid emulsione latte milk olio oil balsamo balm baume maschera mask masque fiale fiala
ampoule ampolla shampoo shampooing capsule compresse cps cpr bustine stick spray booster peeling scrub esfoliante patch patches cerotti
cerotto contorno occhi eye eyes acqua water micellare micellar trattamento treatment integratore concentrato concentrate pads dischetti'''.split())
# parole inglesi generiche dei titoli K-beauty: possono stare dentro una linea («Sun Project»), non alla fine
INGLESI = set('''face daily sun cream gentle soothing hydrating moisturizing moisturizer moisturising cleansing deep light care skin
relief clear calming repair barrier brightening glow pure fresh mild intense intensive spf pa uv age pro men homme scalp hair the'''.split())
VUOTE = set('di da del dello della delle dei degli con per e ed o a al allo alla ai agli alle in nel nella su sul sulla il lo la le i gli un una uno the bio'.split())
ATTIVO = re.compile(r'^(acido|acid|retinol\w*|retinal\w*|niacinamid\w*|vitamina|vitamin|urea|ceramid\w*|peptid\w*|collagen\w*|centella|pantenolo|'
                    r'panthenol|zinco|zinc|bakuchiol|ialuronic\w*|hyaluronic|salicilic\w*|salicylic|glicolic\w*|glycolic|azelaic\w*|tranexamic\w*|'
                    r'arbutin\w*|squalan\w*|caffein\w*|biotin\w*|pha|aha|bha|lha|nad\+?|pdrn|txa)$', re.I)
TRADUCI = {'serum': 'siero', 'cream': 'crema', 'cleanser': 'detergente', 'foam': 'schiuma', 'toner': 'tonico', 'essence': 'essenza', 'mask': 'maschera',
           'lotion': 'lozione', 'oil': 'olio', 'balm': 'balsamo', 'fluid': 'fluido', 'milk': 'latte', 'water': 'acqua', 'eye': 'occhi', 'treatment': 'trattamento'}

_voc = None


def vocabolario():
    """Parola → quota di volte in cui compare in minuscolo nei titoli dei negozi."""
    global _voc
    if _voc is not None:
        return _voc
    if VOC.exists():
        _voc = json.loads(VOC.read_text())
        return _voc
    tot, minu = Counter(), Counter()
    f = R / 'feeds-out' / 'liki24.csv'
    csv.field_size_limit(10 ** 8)
    for x in csv.DictReader(io.StringIO(f.read_text('utf-8', 'replace')), delimiter='\t'):
        for i, w in enumerate(re.findall(r"[A-Za-zÀ-ÿ][\wÀ-ÿ'’-]*", x.get('title') or '')):
            if i == 0 or w.isupper():  # la prima parola ha sempre la maiuscola; le sigle non dicono niente
                continue
            lw = w.lower()
            tot[lw] += 1
            if w[0].islower():
                minu[lw] += 1
    _voc = {w: round(minu[w] / n, 2) for w, n in tot.items() if n >= 3}
    VOC.write_text(json.dumps(_voc, ensure_ascii=False))
    return _voc


# parole comuni che nei titoli hanno spesso la maiuscola ma non sono mai il nome di una linea (Friday, 16/10: tre carte
# «Complesso» nello stesso risultato)
COMUNI = set('complesso formula linea gamma collezione edizione nuovo nuova new classic original originale extra maxi mini'.split())


def _comune(w):
    lw = w.lower().strip('.,;:()[]')
    if lw in VUOTE or lw in TIPO or lw in COMUNI:
        return True
    q = vocabolario().get(lw)
    return q is not None and q >= 0.5


def _nome(w):
    """Una parola che fa parte del nome della linea."""
    pulita = w.strip('.,;:()')
    if not pulita:
        return False
    lw = pulita.lower()
    if lw in TIPO:
        return False
    if ATTIVO.match(pulita):
        return None  # un attivo sta nella linea solo in mezzo a lei («Galactomyces Pure Vitamin C»)
    if re.fullmatch(r'[\d.,]+[%+]?', pulita) or (len(pulita) == 1 and pulita.isalpha()) or pulita[0].isdigit():
        return None  # i numeri stanno con la linea solo se sono in mezzo a lei («Mineral 89», «Ultra30»)
    if lw.startswith('spf'):
        return False
    if pulita[0].isupper() or pulita[0].isdigit() or re.search(r'[A-Z]', pulita[1:]) or re.search(r'[\[\]+]', pulita):
        return not _comune(pulita) or lw in INGLESI or pulita.isupper()
    return False


def _frasi(nome):
    return [w for w in re.split(r'\s+', nome) if w]


def _ripulisci(t):
    t = re.sub(r'\s*[,;]\s*(?=[,;]|$)', '', t)
    t = re.sub(r'^[\s,;:\-–·]+|[\s,;:\-–·]+$', '', t)
    t = re.sub(r'\s+', ' ', t)
    t = re.sub(r'\s+([,;])', r'\1', t)
    return t


def _senza_doppioni(parole):
    # «Sun Project Sun Project» → «Sun Project»
    n = len(parole)
    for k in range(n // 2, 0, -1):
        if parole[:k] == parole[k:2 * k]:
            return parole[k:]
    return parole


TIPO_IT = {'detergente': 'Detergente', 'tonico': 'Tonico', 'siero': 'Siero', 'crema': 'Crema', 'spf': 'Protezione solare', 'esfoliante': 'Trattamento esfoliante',
           'maschera': 'Maschera', 'contorno occhi': 'Contorno occhi', 'shampoo': 'Shampoo', 'trattamento cute': 'Trattamento per la cute',
           'balsamo e maschera capelli': 'Balsamo per capelli', 'barba': 'Trattamento per la barba', 'integratore': 'Integratore', 'cerotti': 'Cerotti per brufoli'}
LAVORO_IT = {'idratazione': "l'idratazione", 'imperfezioni': 'le imperfezioni', 'macchie': 'le macchie', 'tempo': 'i segni del tempo', 'calmare': 'i rossori',
             'barriera': 'la barriera della pelle', 'pori': 'i pori dilatati', 'caduta': 'la caduta dei capelli', 'forfora': 'la forfora',
             'secchi-crespi': 'i capelli secchi', 'capelli': 'capelli e unghie', 'tono': 'il tono della pelle', 'sole': 'la preparazione al sole'}


def _bisogni(s):
    return [*(s.get('lavoro') or []), *(s.get('bisogni') or []), *((s.get('capelli') or {}).get('bisogni') or []), *(s.get('integrazione') or [])]


def _lavoro(s):
    lav = list(dict.fromkeys(LAVORO_IT[b] for b in _bisogni(s) if b in LAVORO_IT))[:2]
    return ('per ' + ' e '.join(lav)) if lav else ''


def sottotitolo_dalla_scheda(s):
    tipo = TIPO_IT.get(s.get('passaggio'), 'Prodotto')
    if s.get('passaggio') == 'spf' and s.get('spf'):
        tipo += f" SPF {s['spf']}"
    att = [a for a in s.get('attivi') or [] if a['nome'] not in ('acqua termale', 'filtri solari', 'filtri minerali')][:2]
    pezzi = [tipo]
    if att:
        pezzi.append('con ' + ' e '.join(a['nome'] + (f" {str(a['perc']).replace('.', ',')}%" if a.get('perc') else '') for a in att))
    testo = ' '.join(pezzi)
    lav = _lavoro(s)
    if lav:
        testo += (', ' if ' per ' in testo else ' ') + lav
    return testo


def titolo_e_sottotitolo(nome, s):
    """(titolo, sottotitolo) dal nome pulito (senza marca) e dalla scheda."""
    nome = re.sub(r'\b(?:No|N|Nº|N°)\.?\s*(\d+)\b', r'N.\1', nome, flags=re.I)  # «No. 4», «n. 3»: un pezzo solo della linea
    parole = _frasi(nome)
    flag = [_nome(w) for w in parole]
    # i tratti di parole-nome; numeri e attivi stanno dentro una linea, non in coda (tranne i numeri del modello)
    UNITA = re.compile(r'^(compresse|capsule|cps|cpr|caps|perle|opercoli|bustine|fiale|ml|g|gr|mg|pz|pezzi|softgel|tavolette|gommose|stick)\b', re.I)
    tratti, i, n = [], 0, len(parole)
    while i < n:
        if not flag[i]:
            i += 1
            continue
        j = i
        # dentro una linea passano anche «e», «&», «+» tra due nomi («Forza e Vitalità», «Hydrate + Plump»)
        while j + 1 < n and (flag[j + 1] is not False or (parole[j + 1].lower() in ('e', '&', '+', 'x') and j + 2 < n and flag[j + 2])):
            j += 1
        while j > i + 1 or (j > i and parole[j].lower().strip('.,()') not in INGLESI):  # «Age Repair» resta intero
            w = parole[j].lower().strip('.,()')
            dopo = parole[j + 1] if j + 1 < n else ''
            if w in INGLESI or (flag[j] is None and (ATTIVO.match(parole[j].strip('.,()')) or (len(w) == 1 and w.isalpha()) or UNITA.match(dopo) or w.endswith('%'))):
                j -= 1
            else:
                break
        tratti.append(list(range(i, j + 1)))
        i = j + 1
    # due tratti divisi solo da un tipo di prodotto sono la stessa linea («Mito [Shampoo] Isole Follicolari 1700»)
    uniti = []
    for tr in tratti:
        if uniti and tr[0] - uniti[-1][-1] == 2 and parole[tr[0] - 1].lower().strip('.,') in TIPO:
            uniti[-1] = uniti[-1] + tr
        else:
            uniti.append(tr)
    # la prima linea, salvo che una dopo sia molto più lunga («Exfoliac … Strucante» → Exfoliac)
    lung = lambda tr: sum(len(parole[k]) for k in tr)
    scelto = uniti[0] if uniti else []
    for tr in uniti[1:]:
        if lung(tr) >= 1.5 * lung(scelto):
            scelto = tr
    a, b = (scelto[0], scelto[-1] + 1) if scelto else (0, 0)
    # dopo «SPF» il numero è la protezione, non la linea
    if scelto and a > 0 and parole[a - 1].lower().startswith('spf'):
        scelto = scelto[1:]
        a = scelto[0] if scelto else 0
    titolo = ' '.join(_senza_doppioni([parole[k] for k in scelto])).strip(' ,;:-–')
    solo_inglesi = all(parole[k].lower().strip('.,') in INGLESI for k in scelto)
    # «Collagen Shot», «360 Capsule»: un nome di due o tre parole tutte con la maiuscola resta intero
    corto = [w for w in parole if w.lower() not in TIPO and not re.fullmatch(r'\d+', w)]
    if len(parole) <= 3 and all(w[:1].isupper() or w[:1].isdigit() for w in parole) and len(corto) >= 1 and len(scelto) <= 1:
        return _ripulisci(nome), sottotitolo_dalla_scheda(s) if s else ''
    if not scelto or solo_inglesi or not re.search(r'[A-Za-zÀ-ÿ]{3,}', titolo):
        lav = _lavoro(s) if s else ''
        return _ripulisci(nome), (lav[:1].upper() + lav[1:]) if lav else ''
    resto = _ripulisci(' '.join(w for k_, w in enumerate(parole) if k_ not in set(scelto)))
    resto = re.sub(r'^(?:[-–,]\s*)+', '', resto)
    # niente confezioni nel sottotitolo («90 capsule», «2 Fiale», «, 7»)
    resto = _ripulisci(re.sub(r'(?:,\s*)?\b\d+\s*(?:[x×+]\s*\d+\s*)?(?:capsule|compresse|cps|cpr|fiale|bustine|pezzi|pz|softgel|tavolette|mg)\b|,\s*\d+\s*$', '', resto, flags=re.I))
    # quanto è inglese, prima di tradurlo
    parole_resto = [w for w in re.findall(r'[A-Za-zÀ-ÿ]+', resto) if w.lower() not in VUOTE]
    inglesi = sum(1 for w in parole_resto if w.lower() in INGLESI or w.lower() in TRADUCI)
    # tutto in minuscolo tranne sigle e nomi con maiuscole in mezzo o numeri; l'inglese del tipo in italiano
    def _parola(w):
        nuda, coda = w.rstrip('.,;:'), w[len(w.rstrip('.,;:')):]
        if nuda.lower() in TRADUCI:  # «Treatment,» → «trattamento,»
            return TRADUCI[nuda.lower()] + coda
        return w if (w.isupper() and w not in ('E', 'A', 'O', 'I')) or re.search(r'\d|[a-z][A-Z]', w) else w.lower()
    resto = ' '.join(_parola(w) for w in resto.split())
    # un resto troppo corto o tutto inglese non spiega niente: il sottotitolo nasce dalla scheda
    ha_tipo = any(w.lower() in TIPO for w in re.findall(r'[A-Za-zÀ-ÿ]+', resto))
    if len(parole_resto) < 2 or inglesi >= len(parole_resto) / 2 or (not ha_tipo and len(parole_resto) < 3):
        resto = sottotitolo_dalla_scheda(s) if s else resto
    resto = resto[:1].upper() + resto[1:] if resto else resto
    return titolo, resto
