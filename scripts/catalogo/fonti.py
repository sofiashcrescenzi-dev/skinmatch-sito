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
            'negozio': 'Liki24', 'id': x['id'], 'titolo': titolo, 'marca': marca, 'descrizione': pulito(x.get('description')),
            'prezzo': _prezzo(x.get('sale_price')) or _prezzo(x.get('price')),
            'prezzo_pieno': _prezzo(x.get('price')) if x.get('sale_price') else None,
            'gtin': (x.get('gtin') or '').strip() or None, 'immagine': x.get('image_link'), 'link': canale_skinmatch(x.get('link')),
            'misura_feed': x.get('unit_pricing_measure') or None,
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
