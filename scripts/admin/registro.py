#!/usr/bin/env python3
"""IL REGISTRO DI SKINMATCH: come la squadra scrive nell'admin di skinmatch.it.

  articolo --file proposta.json            un articolo per la Rivista (Zeno), «da approvare»
  rapporto --agente --tipo --titolo --sintesi [--corpo file.md] [--esito ok|attenzione|problema]
  arricchimento --prodotto ID --campo C --valore V --fonte URL [--chi zeno]
  elenco articoli [--stato da_correggere]  per leggere il feedback di Federico e Sofia
  elenco arricchimenti                     i prodotti per cui un'informazione è già proposta o decisa

Il file dell'articolo: titolo, slug, sommario, tipo (guida|novita|confronto|approfondimento),
testo (markdown), immagine {file, autore, pagina, alt}, prodotti [id], biotipi [id], termini [id].
"""
import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from d1 import L, sql  # noqa: E402

# campi delle correzioni del catalogo, e campi delle schede (INCI, profumo, texture, misura): questi
# ultimi li usa la pipeline delle schede (scripts/catalogo/schede.py --arricchisci) dopo l'approvazione
CAMPI = {'skinTypes', 'concerns', 'hairConcerns', 'scalpTypes', 'pregnancySafe', 'sensitiveSafe', 'description', 'name', 'tier',
         'inci', 'profumo', 'texture', 'misura', 'attivi'}


def articolo(a):
    p = json.loads(Path(a.file).read_text(encoding='utf-8'))
    for k in ('titolo', 'slug', 'sommario', 'testo'):
        if not p.get(k):
            sys.exit(f'manca «{k}»')
    slug = re.sub(r'[^a-z0-9-]+', '-', p['slug'].lower()).strip('-')
    parole = len(re.findall(r'\w+', p['testo']))
    gia = sql(f"SELECT id, stato FROM articoli WHERE slug = {L(slug)}")
    if gia and gia[0]['stato'] not in ('da_correggere', 'in_approvazione'):
        sys.exit(f"l'indirizzo {slug} è già usato da un articolo {gia[0]['stato']}: scegline un altro")
    valori = dict(slug=slug, titolo=p['titolo'], sommario=p['sommario'], tipo=p.get('tipo', 'guida'), testo=p['testo'],
                  immagine=json.dumps(p.get('immagine') or {}, ensure_ascii=False), prodotti=json.dumps(p.get('prodotti') or []),
                  biotipi=json.dumps(p.get('biotipi') or []), termini=json.dumps(p.get('termini') or []), parole=parole,
                  autore=p.get('autore', 'zeno'))
    if gia:
        sets = ', '.join(f'{k} = {L(v)}' for k, v in valori.items())
        sql(f"UPDATE articoli SET {sets}, stato = 'in_approvazione', aggiornato_il = datetime('now') WHERE id = {gia[0]['id']}")
        print(f"articolo {gia[0]['id']} aggiornato: di nuovo da approvare")
    else:
        r = sql(f"INSERT INTO articoli ({', '.join(valori)}) VALUES ({', '.join(L(v) for v in valori.values())}) RETURNING id")
        print(f"articolo {r[0]['id']} registrato: da approvare in skinmatch.it/admin/rivista")


def rapporto(a):
    corpo = Path(a.corpo).read_text(encoding='utf-8') if a.corpo else None
    r = sql(f"INSERT INTO squadra (agente, tipo, titolo, sintesi, corpo, esito) VALUES ({L(a.agente)}, {L(a.tipo)}, {L(a.titolo)}, {L(a.sintesi)}, {L(corpo)}, {L(a.esito)}) RETURNING id")
    print(f"rapporto {r[0]['id']}")


def arricchimento(a):
    if a.campo not in CAMPI:
        sys.exit(f'campo sconosciuto: {a.campo} (vanno bene: {", ".join(sorted(CAMPI))})')
    sql(f"INSERT INTO arricchimenti (prodotto, campo, valore, fonte, chi) VALUES ({L(a.prodotto)}, {L(a.campo)}, {L(a.valore)}, {L(a.fonte)}, {L(a.chi)})")
    print('proposta registrata: da approvare in skinmatch.it/admin/catalogo')


def elenco(a):
    if a.cosa == 'arricchimenti':
        righe = sql(f"SELECT prodotto, campo, stato FROM arricchimenti {('WHERE stato = ' + L(a.stato)) if a.stato else ''} ORDER BY id DESC LIMIT 5000")
    else:
        righe = sql(f"SELECT id, slug, titolo, stato, feedback, creato_il FROM articoli {('WHERE stato = ' + L(a.stato)) if a.stato else ''} ORDER BY id DESC LIMIT 50")
    print(json.dumps(righe, ensure_ascii=False, indent=1))


ap = argparse.ArgumentParser()
sub = ap.add_subparsers(dest='cmd', required=True)
x = sub.add_parser('articolo'); x.add_argument('--file', required=True)
x = sub.add_parser('rapporto')
for k in ('agente', 'tipo', 'titolo', 'sintesi'):
    x.add_argument(f'--{k}', required=True)
x.add_argument('--corpo'); x.add_argument('--esito', default='ok', choices=['ok', 'attenzione', 'problema'])
x = sub.add_parser('arricchimento')
for k in ('prodotto', 'campo', 'valore', 'fonte'):
    x.add_argument(f'--{k}', required=True)
x.add_argument('--chi', default='zeno')
x = sub.add_parser('elenco'); x.add_argument('cosa', choices=['articoli', 'arricchimenti']); x.add_argument('--stato')
a = ap.parse_args()
{'articolo': articolo, 'rapporto': rapporto, 'arricchimento': arricchimento, 'elenco': elenco}[a.cmd](a)
