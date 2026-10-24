#!/usr/bin/env python3
"""IL REGISTRO DI SKINMATCH: come la squadra scrive nell'admin di skinmatch.it.

  articolo --file proposta.json            un articolo per la Rivista (Zeno), «da approvare»
  rapporto --agente --tipo --titolo --sintesi [--corpo file.md] [--esito ok|attenzione|problema]
  segnalazione --agente --titolo [--dettaglio testo|file.md] [--proposta] [--gravita] [--rapporto ID]
                                           un'idea o un problema da scegliere (Sì / Dopo / No in admin › Squadra)
  stato --id N --stato in_lavoro|dopo|fatta|scartata [--nota]   Jarvis chiude le segnalazioni fatte
  riscrittura --percorso P --dopo TESTO --motivo M [--agente zeno]
                                           un testo del test riscritto (domande/<id>/testo, domande/<id>/aiuto,
                                           domande/<id>/opzioni/<id>/testo, percorsi/<id>/descrizione, limiti/<id>/testo…)
  elenco riscritture [--stato proposta]    le riscritture e le scelte di Federico e Sofia
  marca --nome M --gruppo G [--perche] [--origine] [--sito] [--email] [--email-fonte URL] [--contatto-nota] [--note]
                                           una marca da conoscere (admin › Marche); se c'è già, aggiorna i campi dati
  arricchimento --prodotto ID --campo C --valore V --fonte URL [--chi zeno]
      --campo inci: l'elenco intero, come sulla confezione; --campo attivi: quelli con la percentuale dichiarata dal
      produttore, separati da «;» («niacinamide 10%; acido salicilico 2%»). Li usa la pipeline dopo l'approvazione.
  elenco articoli [--stato da_correggere]  per leggere il feedback di Federico e Sofia
  elenco arricchimenti                     i prodotti per cui un'informazione è già proposta o decisa
  elenco segnalazioni [--stato in_lavoro]  le scelte di Federico e Sofia, con le note

Ogni proposta per Skinmatch (idee di mercato, problemi trovati, migliorie) si scrive come segnalazione:
una per scelta, con la proposta concreta. Il rapporto racconta; la segnalazione chiede una decisione.

Il file dell'articolo: titolo, slug, sommario, tipo (guida|novita|confronto|approfondimento),
testo (markdown), immagine {file, autore, pagina, alt}, prodotti [id], biotipi [id], termini [id],
approfondisce [id]: i termini del glossario che l'articolo spiega davvero (di solito uno). L'articolo compare sotto quel
termine nel glossario e nelle pagine dei prodotti con quell'attivo o quel lavoro (src/lib/dati.ts articoliPerProdotto).
"""
import argparse
import datetime as dt
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
                  biotipi=json.dumps(p.get('biotipi') or []), termini=json.dumps(p.get('termini') or []), approfondisce=json.dumps(p.get('approfondisce') or []), parole=parole,
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


def segnalazione(a):
    d = a.dettaglio
    if d and Path(d).is_file():
        d = Path(d).read_text(encoding='utf-8')
    r = sql(f"INSERT INTO segnalazioni (rapporto_id, agente, gravita, titolo, dettaglio, proposta) VALUES ({L(a.rapporto)}, {L(a.agente)}, {L(a.gravita)}, {L(a.titolo)}, {L(d)}, {L(a.proposta)}) RETURNING id")
    print(f"segnalazione {r[0]['id']}: da decidere in skinmatch.it/admin/squadra")


def stato(a):
    # la nota di chi chiude si aggiunge a quella di Federico o Sofia, non la sostituisce
    nota = f", nota_po = trim(coalesce(nota_po, '') || char(10) || char(10) || {L('Jarvis: ' + a.nota)})" if a.nota else ''
    sql(f"UPDATE segnalazioni SET stato = {L(a.stato)}{nota}, aggiornato_il = datetime('now') WHERE id = {int(a.id)}")
    print(f'segnalazione {a.id}: {a.stato}')


def _testo_test(percorso):
    """Il testo attuale del test a quel percorso («domande/tzona/opzioni/opachi/testo»), dal file pubblicato."""
    t = json.loads((Path(__file__).resolve().parents[2] / 'src' / 'data' / 'test.json').read_text())
    pezzi, x = percorso.strip('/').split('/'), t
    while pezzi:
        p = pezzi.pop(0)
        if isinstance(x, list):
            x = next((y for y in x if y.get('id') == p), None)
        elif isinstance(x, dict):
            x = x.get(p)
        if x is None:
            sys.exit(f'nel test non c\'è «{percorso}»')
    if not isinstance(x, str):
        sys.exit(f'«{percorso}» non è un testo')
    return x


def riscrittura(a):
    prima = _testo_test(a.percorso)
    if prima.strip() == a.dopo.strip():
        sys.exit('il testo nuovo è uguale a quello di adesso')
    gia = sql(f"SELECT id FROM riscritture WHERE percorso = {L(a.percorso)} AND stato = 'proposta'")
    if gia:
        sql(f"UPDATE riscritture SET dopo = {L(a.dopo)}, motivo = {L(a.motivo)}, prima = {L(prima)}, aggiornato_il = datetime('now') WHERE id = {gia[0]['id']}")
        print(f"riscrittura {gia[0]['id']} aggiornata")
    else:
        r = sql(f"INSERT INTO riscritture (agente, percorso, prima, dopo, motivo) VALUES ({L(a.agente)}, {L(a.percorso)}, {L(prima)}, {L(a.dopo)}, {L(a.motivo)}) RETURNING id")
        print(f"riscrittura {r[0]['id']}: da scegliere in skinmatch.it/admin/domande")


def marca(a):
    campi = {'gruppo': a.gruppo, 'perche': a.perche, 'origine': a.origine, 'sito': a.sito, 'email': a.email, 'email_fonte': a.email_fonte, 'contatto_nota': a.contatto_nota,
             'note': a.note,
             # ⚠️ IL PARERE DI ZENO NEI SUOI CAMPI, NON IN NOTE (25/10/2026, Federico): il consiglio (tenere, alcuni, resta,
             # togli, dopo, fuori), cosa farebbe in una frase, il perché e le fonti; l'admin li mostra in un riquadro a sé.
             'zeno_consiglio': a.consiglio, 'zeno_azione': a.azione, 'zeno_perche': a.perche_zeno,
             'zeno_fonti': json.dumps(a.fonti.split()) if a.fonti else None,
             'zeno_il': dt.date.today().isoformat() if a.consiglio else None}
    campi = {k_: v for k_, v in campi.items() if v is not None}
    gia = sql(f"SELECT id FROM marche_studio WHERE lower(marca) = lower({L(a.nome)})")
    if gia:
        sql(f"UPDATE marche_studio SET {', '.join(f'{k_} = {L(v)}' for k_, v in campi.items())}, aggiornato_il = datetime('now') WHERE id = {gia[0]['id']}")
        print(f"marca {a.nome} aggiornata")
    else:
        sql(f"INSERT INTO marche_studio (marca, {', '.join(campi)}, chi) VALUES ({L(a.nome)}, {', '.join(L(v) for v in campi.values())}, 'claude')")
        print(f"marca {a.nome} aggiunta: skinmatch.it/admin/marche")


def arricchimento(a):
    if a.campo not in CAMPI:
        sys.exit(f'campo sconosciuto: {a.campo} (vanno bene: {", ".join(sorted(CAMPI))})')
    sql(f"INSERT INTO arricchimenti (prodotto, campo, valore, fonte, chi) VALUES ({L(a.prodotto)}, {L(a.campo)}, {L(a.valore)}, {L(a.fonte)}, {L(a.chi)})")
    print('proposta registrata: da approvare in skinmatch.it/admin/catalogo')


def elenco(a):
    if a.cosa == 'riscritture':
        righe = sql(f"SELECT id, percorso, prima, dopo, stato, nota FROM riscritture {('WHERE stato = ' + L(a.stato)) if a.stato else ''} ORDER BY id DESC LIMIT 300")
    elif a.cosa == 'segnalazioni':
        righe = sql(f"SELECT id, agente, titolo, proposta, stato, nota_po, aggiornato_il FROM segnalazioni {('WHERE stato = ' + L(a.stato)) if a.stato else ''} ORDER BY id DESC LIMIT 200")
    elif a.cosa == 'arricchimenti':
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
x = sub.add_parser('segnalazione')
x.add_argument('--agente', required=True); x.add_argument('--titolo', required=True)
x.add_argument('--dettaglio'); x.add_argument('--proposta'); x.add_argument('--gravita'); x.add_argument('--rapporto', type=int)
x = sub.add_parser('stato')
x.add_argument('--id', required=True, type=int); x.add_argument('--stato', required=True, choices=['aperta', 'in_lavoro', 'dopo', 'fatta', 'scartata'])
x.add_argument('--nota')
x = sub.add_parser('riscrittura')
x.add_argument('--percorso', required=True); x.add_argument('--dopo', required=True); x.add_argument('--motivo', required=True); x.add_argument('--agente', default='zeno')
x = sub.add_parser('marca')
x.add_argument('--nome', required=True); x.add_argument('--gruppo', required=True)
for c in ('perche', 'origine', 'sito', 'email', 'email-fonte', 'contatto-nota', 'note'):
    x.add_argument(f'--{c}')
x.add_argument('--consiglio', choices=['tenere', 'alcuni', 'resta', 'togli', 'dopo', 'fuori'], help='il parere di Zeno')
x.add_argument('--azione', help='cosa farebbe, in una frase («Aprirei solo il siero X e la crema Y»)')
x.add_argument('--perche-zeno', help='perché, con i fatti')
x.add_argument('--fonti', help='gli indirizzi delle fonti, separati da spazi')
x = sub.add_parser('arricchimento')
for k in ('prodotto', 'campo', 'valore', 'fonte'):
    x.add_argument(f'--{k}', required=True)
x.add_argument('--chi', default='zeno')
x = sub.add_parser('elenco'); x.add_argument('cosa', choices=['articoli', 'arricchimenti', 'segnalazioni', 'riscritture']); x.add_argument('--stato')
a = ap.parse_args()
{'articolo': articolo, 'rapporto': rapporto, 'segnalazione': segnalazione, 'stato': stato, 'marca': marca, 'riscrittura': riscrittura, 'arricchimento': arricchimento, 'elenco': elenco}[a.cmd](a)
