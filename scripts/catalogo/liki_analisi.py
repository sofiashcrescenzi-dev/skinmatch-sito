"""ANALISI DEL CATALOGO LIKI24 PER SKINMATCH (15/10/2026): dal feed completo (130.000 prodotti) ai soli
prodotti utili al test (viso, cute e capelli, barba, integratori per pelle, capelli e unghie), con
categoria, attivi e prezzo; poi le statistiche marca per marca per decidere quali marche entrano.
Uso: python3 scripts/catalogo/liki_analisi.py <feed.csv> <uscita.json>"""
import csv, json, re, sys, html, statistics as st
from collections import Counter, defaultdict
csv.field_size_limit(10**8)

def norm(t): return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', t or ''))).strip()

# categoria di Skinmatch dal titolo (le parole italiane dei titoli Liki24: «<nome>, <misura>, <marca>»)
NO = r'\b(trucco|fondotinta|mascara|rossetto|matita|smalto|ombretto|correttore|cipria|blush|profumo|eau de|deodorante|dentifricio|collutorio|spazzolino|assorbent|pannolin|biberon|ciuccio|tettarella|bambin|neonat|baby|bebe|cane|gatto|cuccioli|preservativ|lubrificant|test di gravidanza|cerotto|garza|siringa|termometro|tisana|caramell|gomme da masticare|lacca|gel fissante|colorazione|tinta|decolorante|depilator|rasoio|lametta|pinzette|smalto|acetone|lenti|collirio|spray nasale|sciroppo|compresse effervescenti|pastiglie per la gola)\b'
REGOLE = [
    ('solari', r'\b(spf ?\d+|spf|protezione solare|solare|fotoprotett|sunscreen|anthelios|photoderm|fusion water|heliocare)\b'),
    ('shampoo', r'\bshampo+\w*\b'),
    ('capelli', r'\b(lozione anticaduta|anticaduta|fiale|capelli|cuoio capelluto|balsamo per capelli|maschera per capelli|siero per capelli|cute)\b'),
    ('barba', r'\b(barba|dopobarba|after ?shave|rasatura)\b'),
    ('detergenti', r'\b(detergente|gel detergente|mousse detergente|acqua micellare|micellare|latte detergente|struccante|olio detergente|schiuma detergente|cleanser|cleansing|syndet|pane dermatologico|tonico)\b'),
    ('attivi', r'\b(retinol\w*|retinal\w*|retinoid\w*|peeling|esfoliant\w*|acido glicolico|acido salicilico|acido mandelico|acido azelaico|aha|bha|pha|tranexamic\w*|trattamento notte|azelaic)\b'),
    ('sieri', r'\b(siero|serum|sérum|essence|essenza|ampoule|fiala viso|concentrato|booster)\b'),
    ('creme', r'\b(crema|cream|gel-crema|emulsione|fluido|balsamo|baume|contorno occhi|eye cream|maschera viso|maschera|mask|patch)\b'),
]
INTEGRATORE = r'\b(integratore|compresse|capsule|bustine|softgel|perle|tavolette|polvere|sciroppo|gocce)\b'
INT_BELLEZZA = r'\b(capelli|unghie|pelle|collagene|biotina|acido ialuronico|cheratina|cistina|metionina|omega|astaxantina|beta.?carotene|abbronzatura|polypodium|anticaduta|hair|skin|nails)\b'
CORPO = r'\b(corpo|body|mani|piedi|gambe|seno|smagliature|cellulite|intimo|labbra|lip|doccia|bagno|bagnoschiuma|deodorant|crema mani)\b'
ATTIVI = {
    'niacinamide': r'niacinamid', 'retinolo': r'retinol|retinal|retinoid|bakuchiol', 'vitamina C': r'vitamina c|vitamin c|ascorbic|ascorbil',
    'acido ialuronico': r'ialuronic|hyaluron', 'acido salicilico': r'salicil|salicyl|\bbha\b', 'acido glicolico': r'glicolic|glycolic|\baha\b',
    'acido azelaico': r'azelaic', 'ceramidi': r'ceramid', 'peptidi': r'peptid', 'centella': r'centella|cica\b|madecass',
    'pantenolo': r'pantenol|panthenol|b5\b', 'urea': r'\burea\b', 'zinco': r'\bzinc', 'acido tranexamico': r'tranexam',
    'acido ferulico': r'ferulic', 'propoli': r'propol', 'mucina di lumaca': r'mucin|snail|lumaca', 'riso': r'\briso\b|\brice\b',
    'caffeina': r'caffein', 'collagene': r'collagen', 'biotina': r'biotin', 'squalano': r'squalan', 'acido mandelico': r'mandelic',
    'tea tree': r'tea tree', 'acqua termale': r'acqua termale|thermal water|eau thermale', 'filtri minerali': r'filtri minerali|mineral',
}
PELLE = {'grassa': r'pelle grassa|pelli grasse|oily|sebo|seborr|impurit|imperfezion|acne', 'mista': r'pelle mista|pelli miste|combination',
         'secca': r'pelle secca|pelli secche|molto secca|dry skin|nutrient|xero|atopic', 'sensibile': r'sensibil|sensitive|intolleran|reattiv|rossori|lenitiv',
         'normale': r'pelle normale|pelli normali|tutti i tipi'}

def categoria(t):
    tl = t.lower()
    if re.search(NO, tl): return None
    if re.search(INTEGRATORE, tl):
        return 'integratori' if re.search(INT_BELLEZZA, tl) else None
    if re.search(CORPO, tl) and not re.search(r'\bviso\b|\bfacial\b|\bface\b', tl):
        return None
    for c, rx in REGOLE:
        if re.search(rx, tl): return c
    return None

def prezzo(p):
    m = re.match(r'([\d.]+)', p or ''); return float(m.group(1)) if m else None

def misura(t):
    m = re.search(r'(\d+(?:[.,]\d+)?)\s*(ml|g)\b', t.lower()); return float(m.group(1).replace(',', '.')) if m else None

feed, out = sys.argv[1], sys.argv[2]
prodotti = []
for x in csv.DictReader(open(feed, encoding='utf-8', errors='replace'), delimiter='\t'):
    if (x.get('availability') or '') not in ('in_stock', 'in stock'): continue
    t = norm(x.get('title')); d = norm(x.get('description'))[:1500]
    c = categoria(t)
    if not c: continue
    testo = (t + ' ' + d).lower()
    p = prezzo(x.get('sale_price')) or prezzo(x.get('price'))
    ml = misura(t)
    prodotti.append({'id': x['id'], 'titolo': t, 'marca': (x.get('brand') or '').strip(), 'categoria': c, 'prezzo': p, 'misura': ml,
                     'al_ml': round(p / ml * 10, 2) if p and ml else None, 'gtin': x.get('gtin'), 'immagine': x.get('image_link'), 'link': x.get('link'),
                     'attivi': [a for a, rx in ATTIVI.items() if re.search(rx, testo)], 'pelle': [k for k, rx in PELLE.items() if re.search(rx, testo)],
                     'descrizione': d[:600]})
json.dump(prodotti, open(out, 'w'), ensure_ascii=False)
per = defaultdict(list)
for p in prodotti: per[p['marca']].append(p)
print(len(prodotti), 'prodotti utili in', len(per), 'marche')
for b, ps in sorted(per.items(), key=lambda kv: -len(kv[1]))[:12]:
    print(f"{len(ps):4} {b:24} {dict(Counter(p['categoria'] for p in ps))}")
