#!/usr/bin/env python3
"""I PRODOTTI PER I PROFILI DELICATI (Federico, 7/11/2026: «non possiamo selezionarli noi manualmente uno ad uno, vanno
studiati dagli agenti per categorizzarli al meglio»).

Per ogni profilo delicato di src/data/biotipi.json (le condizioni dichiarate nel test, la pelle reattiva, il cuoio
capelluto sensibile) una regola sola, uguale per tutti i prodotti, che legge l'INCI, le dichiarazioni del produttore
(titolo e descrizione) e il passaggio. La regola dice: dentro (con un punteggio, che ordina l'elenco del profilo), fuori
(col motivo) o dubbio (fuori anche lui, finché Sofia non decide: va nella pagina di revisione).

⚠️ PRIMA REGOLA: senza l'INCI intero un prodotto non entra in nessun elenco delicato. Che un ingrediente manca si può
dire solo leggendo l'elenco intero (inci.completo()).
⚠️ Le soglie sono una proposta di Edith, da far rivedere a Sofia Crescenzi (strategia/2026-11-07-delicati-*.md, la
pagina di revisione): non sono un parere medico. Si cambiano qui, in un posto solo.

Uso: lo chiama al_sito.py per ogni prodotto (campo «delicati» di src/data/prodotti.json: {profilo: punteggio}, solo i
profili per cui il prodotto è dentro); `python3 scripts/catalogo/delicati.py --rapporto <file.md>` scrive il rapporto
per profilo coi prodotti del sito dentro, fuori e dubbi.
"""
import json, re, sys
from pathlib import Path

R = Path(__file__).resolve().parents[2]

PELLE = ('detergente', 'siero', 'crema', 'spf')                      # niente esfolianti, barba, cerotti
CUTE = ('shampoo', 'trattamento cute', 'balsamo e maschera capelli')

# I PROFILI: chi sono (biotipi.json), dove si applicano, cosa cercano (punti) e le eccezioni alle esclusioni comuni.
PROFILI = {
    'atopica': {
        'area': 'pelle', 'nome': 'Dermatite atopica dichiarata',
        'dichiara': ['atopica'],
        'cerca': {'ceramidi': 3, 'colesterolo': 2, 'burri e oli vegetali': 2, 'squalano': 1, 'glicerina': 1, 'pantenolo': 1},
        'texture_ricca': 1, 'urea_max': 10, 'detergente_delicato': 2,
        'solfati_detergenti': True,   # «detergenti extra-delicati, senza tensioattivi aggressivi»
    },
    'psoriasica': {
        'area': 'pelle', 'nome': 'Psoriasi dichiarata',
        'dichiara': ['psoriasi', 'squame'],
        'cerca': {'urea': 3, 'burri e oli vegetali': 2, 'ceramidi': 2, 'glicerina': 1, 'squalano': 1},
        'texture_ricca': 2, 'urea_dubbio': 10, 'solfati_detergenti': True,   # oltre il 10% l'urea è cheratolitica: lo dice Sofia
    },
    'rosacea': {
        'area': 'pelle', 'nome': 'Rosacea o rossori frequenti',
        'dichiara': ['rosacea'],
        'cerca': {'acido azelaico': 3, 'niacinamide': 2, 'centella': 2, 'pantenolo': 1},
        'spf': 2, 'azelaico_ok': True, 'urea_max': 5,
        'vitc_fuori': True, 'niacinamide_dubbio': 5,   # la vitamina C pura punge; la niacinamide alta può arrossare
    },
    'reattiva': {
        'area': 'pelle', 'nome': 'Pelle reattiva',
        'dichiara': ['sensibile'],
        'cerca': {'pantenolo': 2, 'centella': 2, 'niacinamide': 1, 'glicerina': 1},
        'pochi_ingredienti': 2, 'urea_max': 5,
        'max_ingredienti': 30,   # «formule senza profumo e con pochi ingredienti»
    },
    'disidratata-sensibile': {
        'area': 'pelle', 'nome': 'Disidratata e sensibile, barriera danneggiata',
        'dichiara': ['sensibile', 'atopica'],
        'cerca': {'ceramidi': 3, 'niacinamide': 2, 'pantenolo': 2, 'acido ialuronico': 2, 'glicerina': 1},
        'texture_ricca': 1, 'urea_max': 10,
        'gel_dubbio': True,   # «texture in crema o balsamo, non gel astringenti»
    },
    'psoriasi-cuoio-capelluto': {
        'area': 'cute', 'nome': 'Psoriasi o placche del cuoio capelluto dichiarate',
        'dichiara': ['psoriasi', 'squame'],
        'cerca': {'acido salicilico': 3, 'urea': 2, 'piroctone olamina': 2, 'glicerina': 1},
        'salicilico_ok': True, 'urea_ok': True,
    },
    'cute-sensibile': {
        'area': 'cute', 'nome': 'Cuoio capelluto sensibile',
        'dichiara': ['cute sensibile'],
        'cerca': {'pantenolo': 1, 'glicerina': 1},
        'senza_solfati': 2,
    },
}

# gli ingredienti letti nell'INCI (inglese o italiano, come arrivano dai negozi)
RX = {
    'retinoide': r'RETINOL|RETINAL\b|RETINALDEHYDE|RETINYL|RETINOATE|ADAPALEN|RETINIL|RETINOLO|RETINALE|TRETINOIN',
    'acido glicolico': r'GLYCOLIC ACID|ACIDO GLICOLICO',
    'acido salicilico': r'(?<!CAPRYLOYL )SALICYLIC ACID|ACIDO SALICILICO|BETAINE SALICYLATE|WILLOW BARK|SALIX ALBA BARK',
    'LHA': r'CAPRYLOYL SALICYLIC',
    'acido mandelico': r'MANDELIC|MANDELICO',
    'acido lattico': r'LACTIC ACID|ACIDO LATTICO',
    'PHA': r'GLUCONOLACTONE|GLUCONOLATTONE|LACTOBIONIC|LATTOBIONICO',
    'acido azelaico': r'AZELAIC|AZELAICO|AZELOGLICINA|POTASSIUM AZELOYL',
    'vitamina C pura': r'^(?:L-)?ASCORBIC ACID|^ACIDO (?:L-)?ASCORBICO',
    'mentolo o canfora': r'MENTHOL|MENTOLO|CAMPHOR|CANFORA|MENTHYL|MENTILE',
    'solfati aggressivi': r'SODIUM LAURYL SULFATE|SODIO LAURILSOLFATO|SODIUM LAURYL SULPHATE|AMMONIUM LAURYL SULFATE|SODIO LAURIL SOLFATO',
    # i tensioattivi solfati, non i sali (magnesio, zinco solfato)
    'solfati': r'(?:LAUR|MYRET|COCO|PARET|OLEFIN|TRIDECET|DECYL)\w*\s+SUL(?:F|PH)ATE|(?:LAURIL|LAURET|MIRET)\w*\s*SOLFATO|SOLFATO\s+(?:DI\s+)?\w*(?:LAURIL|LAURET)',
    'urea': r'^UREA\b|^UREA$',
    # quello che i profili cercano
    'ceramidi': r'CERAMIDE|CERAMIDI|CERAMIDE NP|SPHINGOLIPID',
    'colesterolo': r'CHOLESTEROL|COLESTEROLO',
    'burri e oli vegetali': r'BUTYROSPERMUM|SHEA BUTTER|BURRO DI KARIT|THEOBROMA|CANOLA|HELIANTHUS ANNUUS SEED OIL|OLIO DI SEMI DI GIRASOLE|PRUNUS AMYGDALUS DULCIS OIL|OLIO DI MANDORLE|BORAGO|OENOTHERA|SIMMONDSIA|ARGANIA',
    'squalano': r'SQUALANE|SQUALANO',
    'glicerina': r'^GLYCERIN|^GLICERINA|^GLICEROLO',
    'pantenolo': r'PANTHENOL|PANTENOLO',
    'centella': r'CENTELLA|MADECASSOSIDE|ASIATICOSIDE',
    'niacinamide': r'NIACINAMIDE',
    'acido ialuronico': r'HYALURON|IALURON',
    'piroctone olamina': r'PIROCTONE',
}
ACIDI = ('acido glicolico', 'acido salicilico', 'LHA', 'acido mandelico', 'acido lattico')


def _voci(s):
    return [re.sub(r'\s+', ' ', v.upper()).strip(' .') for v in (s.get('inci') or [])]


def _trova(voci, chiave):
    """Le posizioni (0 = la più abbondante) dell'ingrediente nell'elenco."""
    rx = re.compile(RX[chiave])
    return [i for i, v in enumerate(voci) if rx.search(v)]


def _perc(s, nome):
    return next((a['perc'] for a in s.get('attivi') or [] if a['nome'] == nome and a.get('perc')), None)




def valuta(s, pid):
    """(esito, punteggio, motivi) per il profilo pid: esito 'dentro', 'fuori' o 'dubbio'."""
    P = PROFILI[pid]
    pas = s.get('passaggio')
    if pas not in (PELLE if P['area'] == 'pelle' else CUTE):
        return 'fuori', 0, ['non è un prodotto di questa area']
    voci = _voci(s)
    if not voci:
        return 'fuori', 0, ['INCI assente']
    if not s.get('inci_completo'):
        return 'fuori', 0, ['INCI non intero']
    fuori, dubbi = [], []
    if s.get('profumo') is True:
        fuori.append('profumo')
    if s.get('oli_essenziali') is True:
        fuori.append('oli essenziali o allergeni del profumo')
    if s.get('alcol') is True:
        fuori.append('alcol denaturato')
    if _trova(voci, 'mentolo o canfora'):
        fuori.append('mentolo o canfora')
    if _trova(voci, 'solfati aggressivi'):
        fuori.append('solfati aggressivi (SLS)')
    if _trova(voci, 'retinoide'):
        fuori.append('retinoide')
    if P['area'] == 'pelle':
        if (s.get('pelle') or {}).get('reattiva') == 0:
            fuori.append('i nostri dati: non per pelli sensibili')
        if (s.get('forza') or 1) >= 3:
            fuori.append('forza alta')
    # gli acidi esfolianti: contano se sono fra i primi ingredienti, o la percentuale è dichiarata. In coda all'elenco
    # (l'acido lattico, il citrico) correggono il pH e non esfoliano.
    for a in ACIDI:
        pos = _trova(voci, a)
        if not pos:
            continue
        nome = {'LHA': 'LHA'}.get(a, a)
        conta = _perc(s, nome) is not None or min(pos) < max(8, len(voci) // 2)
        if not conta:
            continue
        if a in ('acido salicilico', 'LHA') and P.get('salicilico_ok'):
            continue
        fuori.append(f'{a} fra i primi ingredienti' if _perc(s, nome) is None else f'{a} {_perc(s, nome):g}%')
    if _trova(voci, 'PHA') and P['area'] == 'pelle':
        dubbi.append('PHA (acidi delicati)')
    if _trova(voci, 'acido azelaico') and not P.get('azelaico_ok') and P['area'] == 'pelle':
        dubbi.append('acido azelaico')
    pc = _perc(s, 'vitamina C')
    if _trova(voci, 'vitamina C pura') and P.get('vitc_fuori'):
        fuori.append('vitamina C pura')
    elif _trova(voci, 'vitamina C pura') and (pc is None or pc >= 10) and P['area'] == 'pelle':
        dubbi.append('vitamina C pura' + (f' {pc:g}%' if pc else ', percentuale non dichiarata'))
    if P.get('solfati_detergenti') and pas == 'detergente' and _trova(voci, 'solfati'):
        fuori.append('detergente con solfati')
    if P.get('max_ingredienti') and len(voci) > P['max_ingredienti']:
        fuori.append(f'più di {P["max_ingredienti"]} ingredienti')
    pn = _perc(s, 'niacinamide')
    if P.get('niacinamide_dubbio') and pn and pn > P['niacinamide_dubbio']:
        dubbi.append(f'niacinamide {pn:g}%')
    if P.get('gel_dubbio') and s.get('texture') in ('gel', 'fluido') and pas in ('crema', 'siero'):
        dubbi.append('texture in gel')
    pu = _perc(s, 'urea')
    if pu and not P.get('urea_ok'):
        if P.get('urea_dubbio') and pu > P['urea_dubbio']:
            dubbi.append(f'urea {pu:g}%')
        elif P.get('urea_max') and pu > P['urea_max']:
            fuori.append(f'urea {pu:g}%')
    if fuori:
        return 'fuori', 0, fuori
    # il punteggio: quanto il prodotto è fatto per questo profilo
    punti, perche = 1, []
    if set(s.get('dichiara') or []) & set(P['dichiara']):
        punti += 3
        perche.append('il produttore lo indica')
    for k, v in P['cerca'].items():
        if _trova(voci, k):
            punti += v
            perche.append(k)
    if P.get('texture_ricca') and (s.get('texture') in ('crema', 'balsamo', 'unguento', 'olio', 'latte') or pas == 'crema'):
        punti += P['texture_ricca']
    if P.get('detergente_delicato') and pas == 'detergente' and s.get('texture') in ('latte', 'olio', 'crema', 'balsamo'):
        punti += P['detergente_delicato']
        perche.append('detergente senza schiuma')
    if P.get('spf') and pas == 'spf':
        punti += P['spf']
        perche.append('protezione solare')
    if P.get('pochi_ingredienti') and len(voci) <= 20:
        punti += P['pochi_ingredienti']
        perche.append('pochi ingredienti')
    if P.get('senza_solfati') and not _trova(voci, 'solfati'):
        punti += P['senza_solfati']
        perche.append('senza solfati')
    if dubbi:
        return 'dubbio', punti, dubbi
    return 'dentro', punti, perche


def punteggi(s):
    """{profilo: punteggio} dei profili delicati per cui il prodotto è dentro (il campo «delicati» di prodotti.json)."""
    out = {}
    for pid in PROFILI:
        esito, punti, _ = valuta(s, pid)
        if esito == 'dentro':
            out[pid] = punti
    return out


def rapporto(file_md):
    """Per ogni profilo: la regola, i prodotti del sito dentro (con l'ordine), i dubbi e i fuori col motivo."""
    sys.path.insert(0, str(Path(__file__).parent))
    prodotti = json.loads((R / 'src/data/prodotti.json').read_text())['prodotti']
    negozi = json.loads((R / 'src/data/negozi.json').read_text())['negozi']
    schede = {}
    for n in negozi:
        f = R / 'feeds-out' / f"schede-{n['id']}.json"
        if f.exists():
            schede.update({x['id']: x for x in json.loads(f.read_text())})
    nome = {p['id']: f"{p['brand']} {p['name']}" for p in prodotti}
    righe = ['# I prodotti per i profili delicati: la regola e gli elenchi', '',
             'Proposta di Edith, da rivedere con Sofia Crescenzi. Generato da `scripts/catalogo/delicati.py --rapporto` sui prodotti di oggi del sito.',
             '', '## Le regole comuni (tutti i profili)', '',
             '- **Senza INCI intero il prodotto resta fuori.** Che un ingrediente manca si può dire solo leggendo l\'elenco intero.',
             '- Fuori: profumo; oli essenziali o allergeni del profumo (limonene, linalolo…); alcol denaturato; mentolo o canfora; solfati aggressivi (SLS); retinoidi (anche gli esteri: retinyl palmitate, acetate); forza alta; prodotti che i nostri dati marcano «non per pelli sensibili».',
             '- Gli acidi esfolianti (glicolico, lattico, mandelico, salicilico, LHA) escludono quando sono fra i primi ingredienti o hanno la percentuale dichiarata. In coda all\'elenco correggono il pH e non contano.',
             '- Dubbi, fuori finché Sofia non decide: PHA, acido azelaico (dentro solo per la rosacea), vitamina C pura dal 10% o senza percentuale, urea sopra le soglie del profilo.',
             '- Passaggi: per la pelle detergenti, sieri, creme e solari (esclusi esfolianti, barba e cerotti); per la cute shampoo, lozioni e balsami.',
             '- L\'ordine nell\'elenco: indicazione del produttore (+3), ingredienti che il profilo cerca, texture, poi le regole di sempre (tipo di pelle, prezzo, al massimo 2 per categoria).', '']
    for pid, P in PROFILI.items():
        dentro, dubbi, fuori = [], [], {}
        for p in prodotti:
            s = schede.get(p['id'])
            if not s:
                continue
            esito, punti, motivi = valuta(s, pid)
            if esito == 'dentro':
                dentro.append((punti, p['id'], motivi))
            elif esito == 'dubbio':
                dubbi.append((p['id'], motivi))
            elif motivi[0] != 'non è un prodotto di questa area':
                fuori.setdefault(motivi[0], []).append(p['id'])
        dentro.sort(key=lambda x: -x[0])
        righe += [f'## {pid}: {P["nome"]}', '',
                  f'- Indicazione del produttore cercata (titolo e descrizione, traduci.DICHIARA): {", ".join(P["dichiara"])}',
                  f'- Ingredienti che danno punti: {", ".join(f"{k} (+{v})" for k, v in P["cerca"].items())}',
                  *([f'- Urea: fuori sopra il {P["urea_max"]}%'] if P.get('urea_max') else []),
                  *([f'- Urea: dubbio sopra il {P["urea_dubbio"]}%'] if P.get('urea_dubbio') else []),
                  *(['- Acido salicilico e urea ammessi (li cerca chi ha placche e squame)'] if P.get('salicilico_ok') else []),
                  *(['- Acido azelaico ammesso'] if P.get('azelaico_ok') else []),
                  '', f'**Dentro: {len(dentro)}** · dubbi: {len(dubbi)} · fuori: {sum(len(v) for v in fuori.values())}', '']
        for punti, i, perche in dentro:
            righe.append(f'- {punti} · {nome[i]} ({i}){": " + ", ".join(perche) if perche else ""}')
        if dubbi:
            righe += ['', '**Dubbi (fuori finché Sofia non decide)**', '']
            righe += [f'- {nome[i]} ({i}): {", ".join(m)}' for i, m in dubbi]
        righe += ['', '**Fuori, per primo motivo**', '']
        for m, ids in sorted(fuori.items(), key=lambda x: -len(x[1])):
            es = ', '.join(f'{nome[i]} ({i})' for i in ids[:6])
            righe.append(f'- {m}: {len(ids)}, es. {es}')
        righe.append('')
    Path(file_md).write_text('\n'.join(righe) + '\n', encoding='utf-8')
    print('rapporto scritto:', file_md)


if __name__ == '__main__' and '--rapporto' in sys.argv:
    rapporto(sys.argv[sys.argv.index('--rapporto') + 1])
