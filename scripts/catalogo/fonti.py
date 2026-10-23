"""LE FONTI DEL CATALOGO: da ogni negozio a un formato unico, e i dati in più per arricchire.

Ogni fonte di prodotti restituisce record con gli stessi campi (negozio, id, titolo, marca,
descrizione, prezzo, prezzo_pieno, gtin, immagine, link, disponibile). Per aggiungere un negozio
si scrive una funzione qui, e il resto della pipeline non cambia.

⚠️ I feed: l'indirizzo di ogni feed sta in ~/.skinmatch-segreti.env come FEED_<NEGOZIO> (mai nel
repository, mai stampato). Finché manca, si può passare un file scaricato con --file.
⚠️ I link: devono portare il canale di Skinmatch su Adtraction (2119692688). Se un feed arriva con un
altro canale, il parametro `as` si riscrive qui.
"""
import csv, gzip, html, io, json, os, re, time, urllib.parse, urllib.request
from pathlib import Path

csv.field_size_limit(10 ** 8)
CANALE_ADTRACTION = '2119692688'
# il prefisso degli id dei prodotti per negozio (lk-188565, cf-…): gli id non si toccano più, sono le pagine
PREFISSO = {'Liki24': 'lk', 'Farmaself': 'fs', 'Beautycos': 'bc'}
CACHE = Path(__file__).resolve().parents[2] / 'feeds-out' / 'cache'
UA = 'Mozilla/5.0 (SkinmatchBot; +https://skinmatch.it)'


def segreto(nome):
    f = Path.home() / '.skinmatch-segreti.env'
    for r in (f.read_text().splitlines() if f.exists() else []):
        if r.startswith(nome + '='):
            return r.split('=', 1)[1].strip().strip('"\'')
    return None


def _testo(f_o_url):
    if f_o_url.startswith('http'):
        b = urllib.request.urlopen(urllib.request.Request(f_o_url, headers={'User-Agent': UA}), timeout=600).read()
    else:
        b = Path(f_o_url).read_bytes()
    if b[:2] == b'\x1f\x8b':
        b = gzip.decompress(b)
    return b.decode('utf-8', 'replace')


def pulito(t):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', t or ''))).strip()


def _prezzo(p):
    m = re.match(r'([\d.]+)', p or '')
    return float(m.group(1)) if m else None


# I REFUSI DEI FEED (16/10/2026): «Olpalex», «Bond Mainenance» arrivavano così da Liki24 e finivano nel titolo
# del sito. Si correggono qui, per tutti i negozi; un refuso nuovo si aggiunge alla lista.
REFUSI = [(r'\bOlpalex\b', 'Olaplex'), (r'\bMainenance\b', 'Maintenance')]


def corretto(t):
    for rx, giusto in REFUSI:
        t = re.sub(rx, giusto, t or '', flags=re.I)
    return t


def canale_skinmatch(link):
    """Il link tracciato Adtraction con il canale di Skinmatch."""
    if not link:
        return link
    return re.sub(r'([?&]as=)\d+', r'\g<1>' + CANALE_ADTRACTION, link)


def liki24(file=None):
    """Il catalogo di Liki24 (Adtraction, formato Google Shopping a tabulazioni)."""
    sorgente = file or segreto('FEED_LIKI24')
    if not sorgente:
        raise SystemExit('Manca il feed di Liki24: FEED_LIKI24 in ~/.skinmatch-segreti.env, oppure --file')
    for x in csv.DictReader(io.StringIO(_testo(sorgente)), delimiter='\t'):
        if (x.get('availability') or '') not in ('in_stock', 'in stock'):
            continue
        titolo = pulito(x.get('title'))
        marca = (x.get('brand') or '').strip() or (titolo.rsplit(',', 1)[-1].strip() if ',' in titolo else '')
        yield {
            'negozio': 'Liki24', 'id': x['id'], 'titolo': corretto(titolo), 'marca': marca, 'descrizione': pulito(x.get('description')),
            'prezzo': _prezzo(x.get('sale_price')) or _prezzo(x.get('price')),
            'prezzo_pieno': _prezzo(x.get('price')) if x.get('sale_price') else None,
            'gtin': (x.get('gtin') or '').strip() or None, 'immagine': x.get('image_link'), 'link': canale_skinmatch(x.get('link')),
            'misura_feed': x.get('unit_pricing_measure') or None, 'prefisso': 'lk',
        }


# ── Farmaself (Adtraction, XML): completa Liki24 con i prodotti che lì non ci sono (Federico, 16/10) ──
# Nel feed la «marca» è l'azienda («LA ROCHE POSAY-PHAS (L'Oreal)», «IST.GANASSINI SpA»): la marca vera
# si ricava dal nome, poi dalle linee, poi dall'azienda. Niente EAN. I nomi in sigla da gestionale
# («SEBIACLEAR EAU MIC 400ML») restano fuori: non possono fare da titolo sul sito.
LINEE_MARCA = [
    (r'effaclar|toleriane|lipikar|cicaplast|anthelios|hyalu b5|rosaliac|kerium|mela b3|retinol b3', 'La Roche-Posay'),
    (r'mineral 89|liftactiv|normaderm|dercos|capital soleil|neovadiol', 'Vichy'),
    (r'sensibio|sebium|atoderm|hydrabio|cicabio|pigmentbio|photoderm|\bnode\b', 'Bioderma'),
    (r'sebiaclear|topialyse|sensifine|xerial|densitium|hydraliane', 'SVR'),
    (r'xemose|bariederm|hyseac|roseliane|depiderm|age lift', 'Uriage'),
    (r'kelual|anaphase|squanorm|keracnyl|melascreen|sensinol|elution|neoptide', 'Ducray'),
    (r'dermalibour|exomega|epitheliale|cytelium|\bbiology\b', 'A-Derma'),
    (r'cleanance|tolerance|cicalfate|xeracalm|hydrance|antirougeurs|hyaluron activ', 'Avene'),
    (r'xerolact|acnestil|progression|d-clar|rilastil', 'Rilastil'),
    (r'\bdefence\b|triderm|proxera|bionike', 'BioNike'),
    (r'vinoperfect|vinopure|resveratrol|vinergetic', 'Caudalie'),
    (r'heliocare', 'Heliocare'), (r'endocare|biretix|neoretin', 'Cantabria Labs'),
    (r'crescina', 'Crescina'), (r'bioscalin', 'Bioscalin'), (r'eucerin', 'Eucerin'), (r'cetaphil', 'Cetaphil'),
]
AZIENDA_MARCA = [
    (r'la roche posay', 'La Roche-Posay'), (r'^vichy', 'Vichy'), (r'skinceuticals', 'SkinCeuticals'), (r'^cerave', 'CeraVe'),
    (r'^avene', 'Avene'), (r'^ducray', 'Ducray'), (r'^aderma', 'A-Derma'), (r'^klorane', 'Klorane'), (r'^bioderma', 'Bioderma'),
    (r'^korff', 'Korff'),  # Farmaself, scelta del PO del 15/10
    (r'laboratoires svr', 'SVR'), (r'^uriage', 'Uriage'), (r'bionike', 'BioNike'), (r'^caudalie', 'Caudalie'), (r'^isdin', 'Isdin'),
    (r'^neostrata', 'Neostrata'), (r'^lierac', 'Lierac'), (r'^filorga', 'Filorga'), (r'^sesderma', 'Sesderma'), (r'^martiderm', 'MartiDerm'),
]


def _marca_farmaself(nome, azienda, marche):
    n = ' ' + re.sub(r'[^a-z0-9]+', ' ', nome.lower()) + ' '
    for m in marche:  # il nome comincia o contiene la marca («Skinceuticals C E Ferulic…», «La Roche Posay Lipikar…»)
        mk = ' ' + re.sub(r'[^a-z0-9]+', ' ', m.lower()).strip() + ' '
        if len(mk) > 4 and mk in n:
            return m
    for rx, m in LINEE_MARCA:
        if re.search(rx, nome, re.I):
            return m
    for rx, m in AZIENDA_MARCA:
        if re.search(rx, azienda, re.I):
            return m
    return azienda


def farmaself(file=None):
    """Il catalogo di Farmaself (Adtraction, XML)."""
    import xml.etree.ElementTree as ET
    sorgente = file or segreto('FEED_FARMASELF')
    if not sorgente:
        raise SystemExit('Manca il feed di Farmaself: FEED_FARMASELF in ~/.skinmatch-segreti.env, oppure --file')
    root = ET.fromstring(_testo(sorgente))
    dec = json.loads((Path(__file__).parent / 'decisioni_marche.json').read_text())['marche']
    marche = sorted({x['marca'] for x in dec} | {'La Roche Posay', 'Avène'}, key=len, reverse=True)
    alias = {'La Roche Posay': 'La Roche-Posay', 'Avène': 'Avene'}
    for p in root.findall('product'):
        nome = pulito(p.findtext('Name'))
        if (p.findtext('Instock') or '').lower() not in ('yes', 'true', '1', 'in stock'):
            continue
        if '*' in nome or not re.search(r'[a-zà-ù]', nome):  # sigle da gestionale e farmaci
            continue
        prezzo, pieno = _prezzo(p.findtext('Price')), _prezzo(p.findtext('OriginalPrice'))
        marca = _marca_farmaself(nome, p.findtext('Brand') or '', marche)
        yield {
            'negozio': 'Farmaself', 'id': p.findtext('SKU'), 'titolo': corretto(nome), 'marca': alias.get(marca, marca),
            'descrizione': pulito(p.findtext('Description')), 'prezzo': prezzo, 'prezzo_pieno': pieno if pieno and prezzo and pieno > prezzo else None,
            'gtin': (p.findtext('Ean') or '').strip() or None, 'immagine': p.findtext('ImageUrl'), 'link': canale_skinmatch(p.findtext('TrackingUrl')),
            'misura_feed': None, 'prefisso': 'fs', 'categoria_negozio': (p.findtext('Category') or '').strip(),
            'url_negozio': p.findtext('ProductUrl'),  # la pagina del negozio, per la revisione del PO (mai il link tracciato)
        }


# Beautycos (16/10/2026): catalogo danese, titoli in inglese con il genere tra parentesi («(U) 50 ml»), descrizioni
# in italiano. Profumi, trucco, tinture, styling, elettrici e lifestyle non servono al test: si saltano dalla categoria.
_BC_FUORI = re.compile(r'^(?:Perfume|Makeup|Lifestyle|Hair Care - (?:Hair Dye|Hair Styling|Electrical|Accessories)|Personal Care - Hair Removal|Health & Beauty - Personal Care - Cosmetics - Perfume)')


def beautycos(file=None):
    """Il catalogo di Beautycos (Adtraction, XML). La marca è quella del feed, scritta come nelle nostre decisioni."""
    import xml.etree.ElementTree as ET
    sorgente = file or segreto('FEED_BEAUTYCOS')
    if not sorgente:
        raise SystemExit('Manca il feed di Beautycos: FEED_BEAUTYCOS in ~/.skinmatch-segreti.env, oppure --file')
    root = ET.fromstring(_testo(sorgente))
    chiave = lambda t: re.sub(r'[^a-z0-9]+', ' ', t.lower().replace('é', 'e').replace('è', 'e')).strip()
    nostre = {chiave(x['marca']): x['marca'] for x in json.loads((Path(__file__).parent / 'decisioni_marche.json').read_text())['marche']}
    for p in root.findall('product'):
        if (p.findtext('Instock') or '').lower() not in ('yes', 'true', '1', 'in stock') or _BC_FUORI.match(p.findtext('Category') or ''):
            continue
        # il genere tra parentesi e i pezzi in danese («4 stk.»: la confezione si legge già da «4x6ml»)
        nome = re.sub(r'\s*\((?:U|W|M|Unisex|Women|Men)\)|\s*\b\d+\s*stk\.?', '', pulito(p.findtext('Name'))).strip()
        prezzo, pieno = _prezzo(p.findtext('Price')), _prezzo(p.findtext('OriginalPrice'))
        marca = pulito(p.findtext('Brand'))
        yield {
            'negozio': 'Beautycos', 'id': p.findtext('SKU'), 'titolo': corretto(nome), 'marca': nostre.get(chiave(marca), marca),
            'descrizione': pulito(p.findtext('Description')), 'prezzo': prezzo, 'prezzo_pieno': pieno if pieno and prezzo and pieno > prezzo else None,
            'gtin': (p.findtext('Ean') or '').strip() or None, 'immagine': p.findtext('ImageUrl'), 'link': canale_skinmatch(p.findtext('TrackingUrl')),
            'misura_feed': None, 'prefisso': 'bc', 'categoria_negozio': (p.findtext('Category') or '').strip(),
            'url_negozio': p.findtext('ProductUrl'),  # la pagina del negozio, per la revisione del PO (mai il link tracciato)
        }


# Astonfarma (23/10/2026, Federico: «aggiungili pure ma manteniamo un alto livello di dettaglio»): farmacia
# generalista su Awin, unita a Skinmatch (programma 29949). Il feed lo scarica la chiave di Agoranomos; il link si
# rifà con l'ID publisher di Skinmatch (AWIN_PUBLISHER_ID), così la vendita è di Skinmatch. Entrano solo le marche
# scelte e, per quelle nuove, solo i prodotti scelti uno per uno (decisioni_negozi.json).
# ⚠️ La «Biogena» di Astonfarma è l'italiana (Valetudo, dermocosmesi), non l'austriaca degli integratori.
_MARCA_AF = [(r'metagenics', 'Metagenics'), (r'^norsan|san omega', 'Norsan')]


_MINUSCOLE_AF = set('e di da del della con per al alla in a il la lo gli le senza ml g mg mcg cps cpr x compresse capsule bustine perle softgel tavolette'.split())


def _maiuscole_af(t):
    """I titoli di Astonfarma sono in minuscolo («Zreen collagene complex»): la linea si riconosce dalle maiuscole
    (titoli.py), quindi si scrivono come quelli di Liki24 («Zreen Collagene Complex»)."""
    return ' '.join(w if (not w.isalpha() or not w.islower() or w in _MINUSCOLE_AF) else w[:1].upper() + w[1:] for w in t.split())


def astonfarma(file=None):
    """Il catalogo di Astonfarma (Awin, CSV a virgole, gzip)."""
    import csv, gzip, io
    from urllib.parse import quote, urlsplit, urlunsplit
    sorgente = file or segreto('FEED_ASTONFARMA')
    if not sorgente:
        raise SystemExit('Manca il feed di Astonfarma: FEED_ASTONFARMA in ~/.skinmatch-segreti.env, oppure --file')
    grezzo = Path(sorgente).read_bytes() if Path(str(sorgente)).exists() else urllib.request.urlopen(sorgente, timeout=300).read()
    try:
        grezzo = gzip.decompress(grezzo)
    except OSError:
        pass
    pub = segreto('AWIN_PUBLISHER_ID')
    for r in csv.DictReader(io.StringIO(grezzo.decode('utf-8', 'replace'))):
        if r.get('in_stock', '1') == '0':
            continue
        marca = next((m for rx, m in _MARCA_AF if re.search(rx, r.get('brand_name') or '', re.I)), r.get('brand_name') or '')
        u = urlsplit(r.get('merchant_deep_link') or '')
        pagina = urlunsplit((u.scheme, u.netloc, u.path, '', '')) if u.netloc else None
        link = f"https://www.awin1.com/cread.php?awinmid={r.get('merchant_id') or 29949}&awinaffid={pub}&clickref=skinmatch&ued={quote(pagina, safe='')}" if pagina and pub else None
        prezzo = _prezzo(r.get('search_price'))
        yield {
            'negozio': 'Astonfarma', 'id': r.get('merchant_product_id'), 'titolo': corretto(_maiuscole_af(pulito(r.get('product_name')))), 'marca': marca,
            'descrizione': pulito(r.get('description')), 'prezzo': prezzo, 'prezzo_pieno': None,
            'gtin': (r.get('ean') or r.get('product_GTIN') or '').strip() or None,
            'immagine': r.get('merchant_image_url') or r.get('alternate_image') or r.get('aw_image_url'), 'link': link,
            'misura_feed': None, 'prefisso': 'af', 'categoria_negozio': (r.get('merchant_category') or '').strip(),
            'url_negozio': pagina,  # la pagina del negozio, per la revisione del PO (mai il link tracciato)
        }


# ── arricchimento ──────────────────────────────────────────────────────────────
_OBF = None


def open_beauty_facts(gtin):
    """Gli ingredienti da Open Beauty Facts per codice a barre. Si usa l'archivio pubblico scaricato una volta
    (feeds-out/obf/indice.json, da https://static.openbeautyfacts.org/data/): chiederli uno per uno è troppo lento."""
    global _OBF
    if not gtin:
        return None
    if _OBF is None:
        f = CACHE.parent / 'obf' / 'indice.json'
        _OBF = json.loads(f.read_text()) if f.exists() else {}
    x = _OBF.get(gtin.lstrip('0'))
    return {'inci': x['inci'], 'fonte': f'https://world.openbeautyfacts.org/product/{gtin}'} if x else None


def arricchimenti_approvati():
    """Le informazioni trovate da Zeno e approvate in admin (tabella arricchimenti di D1), per id prodotto."""
    try:
        import sys
        sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'admin'))
        from d1 import sql
        righe = sql("SELECT prodotto, campo, valore, fonte FROM arricchimenti WHERE stato = 'approvato' ORDER BY id")
    except Exception:
        return {}
    out = {}
    for r in righe:
        out.setdefault(r['prodotto'], {})[r['campo']] = {'valore': r['valore'], 'fonte': r['fonte']}
    return out
