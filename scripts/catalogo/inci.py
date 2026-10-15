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
    ('acido glicolico', r'GLYCOLIC ACID|glicolic'),
    ('acido lattico', r'LACTIC ACID|acido lattico'),
    ('acido mandelico', r'MANDELIC ACID|mandelic'),
    ('PHA', r'GLUCONOLACTONE|LACTOBIONIC ACID|\bPHA\b'),
    ('acido azelaico', r'AZELAIC ACID|AZELOYL|azelaic'),
    ('acido tranexamico', r'TRANEXAMIC|tranexamic'),
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
_PERC = re.compile(r'(\d{1,2}(?:[.,]\d{1,2})?)\s*%')


def _concentrazioni(testo):
    out = {}
    for m in _PERC.finditer(testo or ''):
        v = float(m.group(1).replace(',', '.'))
        if v > 40:
            continue
        dopo = testo[m.end():m.end() + 28]
        prima = testo[max(0, m.start() - 28):m.start()]
        migliore = None
        for nome, rx in _RX:
            if nome in SOLO_DA_INCI:
                continue
            d = rx.search(dopo)
            if d and (migliore is None or d.start() < migliore[0]):
                migliore = (d.start(), nome)
        if migliore is None:
            for nome, rx in _RX:
                if nome in SOLO_DA_INCI:
                    continue
                ultimi = list(rx.finditer(prima))
                if ultimi and (migliore is None or len(prima) - ultimi[-1].end() < migliore[0]):
                    migliore = (len(prima) - ultimi[-1].end(), nome)
        if migliore:
            out.setdefault(migliore[1], v)
    return out


def attivi(testo, inci=None):
    """Gli attivi riconosciuti, con la concentrazione quando il testo la dice."""
    trovati = {}
    sorgente_inci = ' , '.join(inci or [])
    for nome, rx in _RX:
        if (sorgente_inci and rx.search(sorgente_inci)) or (testo and nome not in SOLO_DA_INCI and rx.search(testo)):
            trovati.setdefault(nome, None)
    for nome, v in _concentrazioni(testo).items():
        trovati[nome] = v
    return [{'nome': n, 'perc': p} for n, p in trovati.items()]


def segnali(inci):
    """Quello che va segnalato leggendo l'INCI: profumo, alcol, oli essenziali."""
    s = ' , '.join(inci or [])
    if not s:
        return {}
    return {
        'profumo': bool(re.search(r'\bPARFUM\b|\bFRAGRANCE\b|\bAROMA\b|PROFUMO', s)),
        'alcol': bool(re.search(r'ALCOHOL DENAT|\bALCOOL\b|SD ALCOHOL', s)),
        'oli_essenziali': bool(re.search(r'LIMONENE|LINALOOL|CITRAL|GERANIOL|EUGENOL|CITRONELLOL|LAVANDULA .*OIL|\bOIL\b.*(PEEL|LEAF|FLOWER)', s)),
    }
