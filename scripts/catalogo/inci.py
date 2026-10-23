"""L'INCI DI UN PRODOTTO: trovarlo in un testo, leggerlo, riconoscere attivi e ingredienti da segnalare.

L'INCI è l'elenco degli ingredienti con i nomi internazionali, dal più al meno presente: è la fonte
più affidabile per sapere cosa c'è in una formula (tappa 2 delle «Tappe di Skinmatch»). Dai soli
titoli e dalle descrizioni si capisce molto meno: per questo ogni scheda dice da dove viene ogni dato.
"""
import re

# un elenco INCI dentro una descrizione: dopo «Ingredienti:», «INCI:», «Composizione:», oppure una
# sequenza che comincia con AQUA / WATER e ha molte virgole
_DOPO_ETICHETTA = re.compile(r'(?:ingredienti|ingredients|inci|composizione|composition)\s*(?:\(inci\))?\s*[:\-]\s*(.{40,4000}?)(?:\.\s|\n|$|\[)', re.I | re.S)
_DA_AQUA = re.compile(r'\b((?:aqua|water)\b[^.]{60,4000}?)(?:\.\s|\n|$|\[)', re.I | re.S)


def trova(testo):
    """L'elenco INCI dentro un testo, o None."""
    if not testo:
        return None
    for rx in (_DOPO_ETICHETTA, _DA_AQUA):
        for m in rx.finditer(testo):
            s = m.group(1)
            if s.count(',') >= 4:
                return s
    return None


# dove finisce l'elenco nelle descrizioni dei negozi: dopo vengono modo d'uso, avvertenze, formato, codici
_FINE = re.compile(r"\b(?:modo d['’]uso|modalit[àa] d['’]uso|precauzioni|presentazione|avvertenz[ae]|conservazione|come si usa|istruzioni|indicazioni|non contiene|paese di origine|uk eu rp|acl\s*:|code f\.?\s?i\.?\s?l)\b", re.I)
# «AGENTE DI CARICA: CELLULOSA» negli integratori: la funzione si toglie, resta l'ingrediente
_FUNZIONE = re.compile(r'^(?:INGREDIENT[SI]|INCI|(?:AGENT[EI]|CAPSULA|INVOLUCRO|REGOLATOR[EI]|ADDENSANT[EI]|EMULSIONANT[EI]|CONSERVANT[EI]|ANTIAGGLOMERANT[EI]|EDULCORANT[EI]|COLORANT[EI]|STABILIZZANT[EI]|UMIDIFICANT[EI]|GELIFICANT[EI]|ANTIOSSIDANT[EI])\b[^:]{0,40}):\s*')
# frasi del negozio finite tra gli ingredienti
_FRASE = re.compile(r"\b(?:TESTAT[OA]|SENZA|IDEALE|FORMULAT[OA]|UTILIZZANDO|MASSAGG|APPLICA|PELLE|CON L[\"'’]AIUTO|ML|ESTERE EMOLLIENTE)\b")


def leggi(s):
    """Da una stringa INCI alla lista degli ingredienti, in maiuscolo e puliti."""
    if not s:
        return []
    s = re.sub(r'\[[^\]]*\]', ' ', s)
    m = _FINE.search(s)
    if m:
        s = s[:m.start()]
    parti = re.split(r',|;|•|\s·\s', s)
    out = []
    for p in parti:
        p = _FUNZIONE.sub('', re.sub(r'\s+', ' ', p).strip(' .*-–:').upper()).strip(' .*-–:')
        # «757-AO - INGREDIENTI: AQUA», «2 COMPRESSE CONTENGONO: MSM»: conta quello che viene dopo i due punti (non «5:1»)
        p = re.split(r'(?<!\d):(?!\d)', p)[-1].strip(' .*-–(')
        if 2 <= len(p) <= 90 and not re.search(r'\b(PUÒ CONTENERE|MAY CONTAIN|\+/-)\b', p) and not _FRASE.search(p):
            out.append(p)
    return out


# Gli attivi che contano per il test, riconosciuti dai nomi INCI (e dai nomi italiani dei testi).
ATTIVI = [
    ('retinale', r'\bRETINAL\b|RETINALDEHYDE|RETINALDEIDE|\bretinal[ea]?\b'),
    ('retinolo', r'\bRETINOL\b|\bretinolo\b'),
    ('retinoide estere', r'RETINYL (PALMITATE|PROPIONATE|RETINOATE|ACETATE)|HYDROXYPINACOLONE RETINOATE|GRANACTIVE RETINOID'),
    ('bakuchiol', r'BAKUCHIOL'),
    ('niacinamide', r'NIACINAMIDE|niacinamide|vitamina b3'),
    ('vitamina C', r'ASCORBIC ACID|ASCORBYL|ASCORBATE|vitamina c\b|vitamin c\b'),
    ('acido ialuronico', r'HYALURON|ialuronic'),
    ('acido salicilico', r'SALICYLIC ACID|salicilic|\bBHA\b'),
    ('LHA', r'CAPRYLOYL SALICYLIC ACID|\bLHA\b'),
    ('acido glicolico', r'(?<!POLY)GLYCOLIC ACID|(?<!poli)glicolic'),  # non l'acido poliglicolico (Mineral 89)
    ('acido lattico', r'LACTIC ACID|acido lattico'),
    ('acido mandelico', r'MANDELIC ACID|mandelic'),
    ('PHA', r'GLUCONOLACTONE|LACTOBIONIC ACID|\bPHA\b'),
    ('acido azelaico', r'AZELAIC ACID|AZELOYL|azelaic'),
    ('acido tranexamico', r'TRANEXAMIC|tranexamic|\bTXA\b'),
    ('thiamidol', r'ISOBUTYLAMIDO THIAZOLYL RESORCINOL|thiamidol|tiamidolo'),
    ('arbutina', r'ARBUTIN|arbutin'),
    ('acido ferulico', r'FERULIC ACID|ferulic'),
    ('vitamina E', r'TOCOPHEROL|vitamina e\b'),
    ('ceramidi', r'CERAMIDE|ceramid'),
    ('peptidi', r'PEPTIDE|PALMITOYL (TRI|TETRA|PENTA|HEXA|OLIGO)|peptid'),
    ('pantenolo', r'PANTHENOL|pantenolo|vitamina b5|\bB5\b'),
    ('centella', r'CENTELLA|MADECASSOSIDE|ASIATICOSIDE|\bcica\b'),
    ('urea', r'\bUREA\b'),
    ('zinco', r'ZINC (PCA|GLUCONATE|SULFATE)|zinco pca'),
    ('acido azelaico', r'acido azelaico'),
    ('caffeina', r'CAFFEINE|caffeina'),
    ('squalano', r'SQUALANE|squalano'),
    ('mucina di lumaca', r'SNAIL SECRETION|mucin'),
    ('allantoina', r'ALLANTOIN'),
    ('bisabololo', r'BISABOLOL'),
    ('propoli', r'PROPOLIS|propoli'),
    ('acqua termale', r'THERMAL SPRING WATER|AVENE THERMAL|acqua termale'),
    ('biotina', r'\bBIOTIN|biotina'),
    ('collagene', r'COLLAGEN|collagene'),
    ('filtri solari', r'ETHYLHEXYL TRIAZONE|BIS-ETHYLHEXYLOXYPHENOL|DROMETRIZOLE|BUTYL METHOXYDIBENZOYLMETHANE|TINOSORB|MEXORYL|DIETHYLAMINO HYDROXYBENZOYL|OCTOCRYLENE|TITANIUM DIOXIDE|ZINC OXIDE'),
]
_RX = [(n, re.compile(r, re.I)) for n, r in ATTIVI]
# questi si contano solo se sono nell'INCI: nei testi sono quasi sempre promesse («stimola il collagene»)
SOLO_DA_INCI = {'collagene', 'filtri solari', 'vitamina E', 'allantoina', 'bisabololo', 'squalano'}

# concentrazioni scritte nei testi: «niacinamide 10%», «10% di niacinamide», «retinolo 0,3%». Ogni
# percentuale va all'attivo più vicino, prima dopo e poi prima, entro poche parole.
# «0,005%» è 0,005, non 5 (A-Game 5, Zeno 15/10): i decimali si leggono tutti, e il numero non è la coda di un altro
_PERC = re.compile(r'(?<![\d.,])(\d{1,2}(?:[.,]\d{1,4})?)\s*%')


def _concentrazioni(testo):
    """La percentuale va all'attivo che le sta attaccato: «retinolo 1%», «1% di retinolo», «niacinamide al 10%»,
    «retinale (0,05%)». Mai a un attivo lontano: «Crema 20% complesso rassodante, con retinolo» non è retinolo
    al 20% (Zeno, 15/10)."""
    out = {}
    for m in _PERC.finditer(testo or ''):
        v = float(m.group(1).replace(',', '.'))
        if v > 40:
            continue
        # ⚠️ «con acido salicilico e il 10% in meno di tensioattivi» (Acnemy Zitclean, 23/10/2026): una percentuale
        # seguita da «in meno», «in più», «di sconto» è un confronto, non una concentrazione.
        if re.match(r'\s*(?:in\s+)?(?:meno|più|piu|less|more|di sconto|sconto|off)\b', testo[m.end():m.end() + 20], re.I):
            continue
        dopo = re.sub(r"^\s*(?:\)\s*)?(?:di |d['’]|of |de )?", '', testo[m.end():m.end() + 40])
        prima = re.sub(r"(?:\s+|\(|:|-|\b(?:al|all['’]|at|a|con|il|lo)\b)*$", '', testo[max(0, m.start() - 40):m.start()])
        migliore = None
        for nome, rx in _RX:
            if nome in SOLO_DA_INCI:
                continue
            # subito dopo, al massimo una parola in mezzo («2% di acido salicilico», «6 % Acido Mandelico»)
            d = rx.search(dopo[:40])
            if d and d.start() <= 8 and not re.search(r'[,.;:+\d%()]', dopo[:d.start()]) and not re.search(r'\b(?:e|ed|and)\b', dopo[:d.start()], re.I):
                migliore = nome
                break
        if migliore is None:
            for nome, rx in _RX:
                if nome in SOLO_DA_INCI:
                    continue
                # tra l'attivo e la percentuale al massimo qualche parola senza numeri né punteggiatura:
                # «mucina di lumaca 3%», «vitamina C pura al 15%»
                # ⚠️ «… acido salicilico e il 10%»: una «e» in mezzo apre un'altra frase, la percentuale non è dell'attivo
                ultimi = [u for u in rx.finditer(prima) if len(prima) - u.end() <= 22 and not re.search(r'[,.;:+\d%()]', prima[u.end():])
                          and not re.search(r'\b(?:e|ed|and|ma|oltre)\b', prima[u.end():], re.I)]
                if ultimi:
                    migliore = nome
                    break
        if migliore:
            out.setdefault(migliore, v)
    return out


# I massimi del Regolamento (CE) 1223/2009 (allegato III) per gli attivi che hanno un limite: oltre, la percentuale è
# un errore di lettura e si toglie (23/10/2026). Acido salicilico: 2% sul viso, 3% nei prodotti da risciacquo per i
# capelli. Il retinolo no: i prodotti all'1% messi in vendita prima del limite del 2025 restano vendibili fino al 2027.
MASSIMI = {'acido salicilico': 3.0}


def attivi(testo, inci=None):
    """Gli attivi riconosciuti, con la concentrazione quando il testo la dice."""
    trovati = {}
    sorgente_inci = ' , '.join(inci or [])
    for nome, rx in _RX:
        if (sorgente_inci and rx.search(sorgente_inci)) or (testo and nome not in SOLO_DA_INCI and rx.search(testo)):
            trovati.setdefault(nome, None)
    for nome, v in _concentrazioni(testo).items():
        trovati[nome] = None if (nome in MASSIMI and v > MASSIMI[nome]) else v
    return [{'nome': n, 'perc': p} for n, p in trovati.items()]


# Profumo, alcol e oli essenziali, voce per voce: gli INCI dei negozi sono in inglese o tradotti in italiano
# («ALCOL DENATURATO», «LINALOLO», «OLIO DI MENTA PIPERITA»). L'alcol è quello che secca (etanolo, denaturato,
# isopropilico), non gli alcoli grassi (cetilico, cetearilico…) né il benzilico dei conservanti (16/10/2026).
_PROFUMO = re.compile(r'PARFUM|FRAGRAN|PROFUM|PERFUME|^AROMA\b')
_ALCOL = re.compile(r'ALCOHOL DENAT|DENAT\w*\.? ALCOHOL|ALCOO?L(?:E)? DENAT|^(?:SD )?ALCOHOL(?: [\w-]*\d[\w-]*)?(?: \(.*)?$|^ALCOO?L(?: \(.*)?$'
                    r'|^ETHANOL|^ETANOLO|ISOPROPYL ALCOHOL|ALCOO?L ISOPROPILICO|^ISOPROPANOL|ALCOO?L T-BUTILICO|T-BUTYL ALCOHOL')
_ALLERGENI_OLI = re.compile(r'LIMONENE|LINALOO?L|LINALOLO|CITRALE?\b|GERANIOL|EUGENOL|CITRONELL?OL|FARNESOL')
_OLIO = re.compile(r'\bOIL\b|\bOLI[OI]\b|\bHUILE\b')
# le parti della pianta da cui si distillano gli oli essenziali (i semi, i noccioli e la frutta danno oli grassi)
_PARTE = re.compile(r'\b(?:LEAF|LEAVES|FOGLI[AE]|PEEL|SCORZA|BUCCIA|FLOWER|FIOR[EI]|BARK|CORTECCIA|RESIN|RESINA|ROOT|RADICE|RHIZOME|TWIG|RAMOSCELL\w*|HERB|ERBA|WOOD|LEGNO|NEEDLE|AGHI|BUD|GEMM\w*)\b')
_PIANTE = re.compile(r'\b(?:MENTHA|MENTA|PEPPERMINT|SPEARMINT|MELALEUCA|TEA TREE|LAVANDULA|LAVANDA|LAVENDER|CITRUS|LIMONE|LEMON|ARANCI[AO]|ORANGE|BERGAM\w*|MANDARIN\w*'
                    r'|EUCALYPTUS|ROSMARIN\w*|ROSEMARY|SALVIA|PELARGONIUM|GERANIUM|CYMBOPOGON|CANANGA|YLANG|JASMINUM|GELSOMINO|CEDRUS|JUNIPERUS|ORIGANUM'
                    r'|THYMUS|TIMO|CINNAMOMUM|CANNELLA|EUGENIA|SYZYGIUM|BOSWELLIA|POGOSTEMON|PATCHOULI|VETIVER\w*|SANTALUM|SANDAL\w*|CUPRESSUS|PINUS|ABIES'
                    r'|OCIMUM|BASILIC\w*|MYRTUS|LAURUS|ANIBA|CISTUS|ANTHEMIS|CHAMOMILLA|CAMOMILLA|MATRICARIA|ZINGIBER|ZENZERO|FOENICULUM|FINOCCHIO|CORIANDRUM'
                    r'|ILLICIUM|CARUM|PIMPINELLA|LITSEA|LEPTOSPERMUM|AMYRIS|ANGELICA|FERULA|GALBAN\w*|ROSA DAMASCENA|ROSA CENTIFOLIA|TAGETES|COMMIPHORA'
                    r'|STYRAX|ELETTARIA|LIPPIA|VERBENA|MELISSA|NEROLI|PETITGRAIN|HELICHRYSUM|ELICRISO|RAVENSARA|COPAIFERA)\b')

# gli agrumi danno l'olio essenziale anche dal frutto intero; coriandolo, cumino, finocchio, anice, cardamomo dai semi
_OLI_DI_FRUTTO = re.compile(r'\b(?:CITRUS|BERGAM\w*|LIMON\w*|LEMON|ARANCI\w*|ORANGE|MANDARIN\w*|LIME|CORIANDRUM|CARUM|FOENICULUM|PIMPINELLA|ELETTARIA|ILLICIUM)\b')


def segnali(inci):
    """Quello che va segnalato leggendo l'INCI: profumo, alcol, oli essenziali (True o False)."""
    voci = [re.sub(r'\s+', ' ', v.upper()).strip(' .') for v in (inci or [])]
    if not voci:
        return {}
    oli = lambda v: bool(_ALLERGENI_OLI.search(v) or re.search(r'ESSENTIAL OIL|ESSENZIAL', v)
                         or (_OLIO.search(v) and (_PIANTE.search(v) or _PARTE.search(v)) and not (re.search(r'\bSEED\b|\bSEMI\b|KERNEL|NOCCIOLO|FRUIT|FRUTT', v) and not _OLI_DI_FRUTTO.search(v))))
    return {
        'profumo': any(_PROFUMO.search(v) for v in voci),
        'alcol': any(_ALCOL.search(v) for v in voci),
        'oli_essenziali': any(oli(v) for v in voci),
    }


def completo(inci, passaggio=None):
    """Se l'elenco sembra intero: solo allora la mancanza di un ingrediente si può dire («senza profumo»).
    Un elenco troncato o sporco (indirizzi, frasi) non basta: si dice solo quello che c'è."""
    voci = inci or []
    minimo = 5 if passaggio == 'cerotti' else 12
    if len(voci) < minimo:
        return False
    sporche = sum(1 for v in voci if re.search(r'\.COM\b|WWW\.|\b\d{5}\b|\bRUE\b|\bSTREET\b|ELENCO|POTREBBE|INGREDIENTI\b|\bL[\'’]', v.upper()))
    return sporche == 0 and len(voci[-1].strip()) >= 4
