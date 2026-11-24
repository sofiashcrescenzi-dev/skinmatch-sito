#!/usr/bin/env python3
"""TRADETRACKER PER SKINMATCH (24/11/2026, Federico: «sono dentro tradetracker di skinmatch mi colleghi l'api sia per il
tracciamento che per far tutto il resto?»).

L'account è quello di Skinmatch (ID cliente 308198, sito affiliato 340738), separato da quello di Agoranomos: niente
script né credenziali in comune (vedi la memoria «Skinmatch separato»). Il servizio è SOAP per affiliati
(https://ws.tradetracker.com/soap/affiliate, rpc/encoded): la busta si scrive a mano perché le librerie SOAP gestiscono
male questo stile; «authenticate» apre una sessione a cookie che vale per le chiamate dopo.

Le credenziali stanno in ~/.skinmatch-segreti.env (600): TRADETRACKER_CUSTOMER_ID e TRADETRACKER_PASSPHRASE. La frase
d'accesso non si stampa mai e non passa dalla conversazione: Federico la copia da TradeTracker › Creatività & Strumenti
› Servizio web, e «salva» la legge dagli appunti, la prova, la scrive e svuota gli appunti.

Uso:
  python3 scripts/admin/tradetracker.py salva 308198   # legge la frase dagli appunti, prova, salva
  python3 scripts/admin/tradetracker.py prova          # i siti affiliati dell'account
  python3 scripts/admin/tradetracker.py campagne       # le campagne del sito, con lo stato dell'iscrizione
  python3 scripts/admin/tradetracker.py feed           # i feed prodotto delle campagne accettate, con l'indirizzo
  python3 scripts/admin/tradetracker.py vendite [giorni]  # le transazioni (le scrive vendite.py in D1)
"""
import datetime as dt
import http.cookiejar
import os
import re
import subprocess
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

TT = 'https://ws.tradetracker.com/soap/affiliate'
SEGRETI = Path.home() / '.skinmatch-segreti.env'
STATO = {'accepted': 'approvato', 'pending': 'in attesa', 'rejected': 'rifiutato'}


def _leggi_segreti():
    s = {}
    for riga in SEGRETI.read_text().splitlines() if SEGRETI.exists() else []:
        if '=' in riga and not riga.lstrip().startswith('#'):
            k, v = riga.split('=', 1)
            s[k.strip().removeprefix('export ').strip()] = v.strip().strip('"').strip("'")
    return s


def _busta(op, parametri):
    def xml(k, v):
        if isinstance(v, dict):
            return f'<{k}>' + ''.join(xml(a, b) for a, b in v.items() if b is not None) + f'</{k}>'
        return f'<{k}>' + str(v).replace('&', '&amp;').replace('<', '&lt;') + f'</{k}>'
    corpo = ''.join(xml(k, v) for k, v in parametri)
    return (f'<?xml version="1.0" encoding="UTF-8"?><SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/" '
            f'xmlns:ns1="{TT}"><SOAP-ENV:Body><ns1:{op}>{corpo}</ns1:{op}></SOAP-ENV:Body></SOAP-ENV:Envelope>').encode()


def _dati(el):
    figli = list(el)
    if not figli:
        return el.text
    nomi = [f.tag.split('}')[-1] for f in figli]
    if all(n == 'item' for n in nomi):
        return [_dati(f) for f in figli]
    return {n: _dati(f) for n, f in zip(nomi, figli)}


class Sessione:
    def __init__(self, cliente, chiave):
        self.apri = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar())).open
        self.chiama('authenticate', [('customerID', cliente), ('passphrase', chiave), ('sandbox', 'false'), ('locale', 'it_IT'), ('demo', 'false')])

    def chiama(self, op, parametri):
        req = urllib.request.Request(TT, data=_busta(op, parametri), headers={'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': f'"{TT}/{op}"'})
        try:
            testo = self.apri(req, timeout=60).read()
        except urllib.error.HTTPError as e:
            testo = e.read()
        corpo = ET.fromstring(testo).find('{http://schemas.xmlsoap.org/soap/envelope/}Body')
        guasto = corpo.find('{http://schemas.xmlsoap.org/soap/envelope/}Fault')
        if guasto is not None:
            raise RuntimeError((guasto.findtext('faultstring') or 'errore SOAP').strip()[:200])
        figli = list(list(corpo)[0])
        return _dati(figli[0]) if figli else None

    def lista(self, op, parametri):
        r = self.chiama(op, parametri) or []
        return [r] if isinstance(r, dict) else r


def sessione():
    s = _leggi_segreti()
    if not s.get('TRADETRACKER_CUSTOMER_ID') or not s.get('TRADETRACKER_PASSPHRASE'):
        sys.exit('TradeTracker: credenziali assenti in ~/.skinmatch-segreti.env (python3 scripts/admin/tradetracker.py salva <ID cliente>)')
    return Sessione(s['TRADETRACKER_CUSTOMER_ID'], s['TRADETRACKER_PASSPHRASE'])


def siti(t):
    return t.lista('getAffiliateSites', [('options', {})])


def salva(cliente):
    if not re.fullmatch(r'\d{3,12}', cliente or ''):
        sys.exit('ID cliente non valido')
    chiave = subprocess.run(['pbpaste'], capture_output=True, text=True).stdout.strip()
    if not re.fullmatch(r'[0-9a-fA-F]{20,80}', chiave):
        sys.exit('Negli appunti non c’è una frase d’accesso di TradeTracker (copiala da Creatività & Strumenti › Servizio web)')
    try:
        t = Sessione(cliente, chiave)
        ss = siti(t)
    except Exception as e:
        sys.exit(f'TradeTracker non accetta queste credenziali: {e}')
    righe = [r for r in (SEGRETI.read_text().splitlines() if SEGRETI.exists() else [])
             if not re.match(r'\s*(export\s+)?TRADETRACKER_(CUSTOMER_ID|PASSPHRASE)\s*=', r)]
    righe += [f'TRADETRACKER_CUSTOMER_ID={cliente}', f'TRADETRACKER_PASSPHRASE={chiave}']
    SEGRETI.write_text('\n'.join(righe) + '\n')
    os.chmod(SEGRETI, 0o600)
    subprocess.run(['pbcopy'], input='', text=True)
    nomi = ', '.join(f"{x.get('ID')} {x.get('name')} ({x.get('URL')})" for x in ss)
    print(f'salvato, appunti svuotati · siti affiliati: {nomi}')


def campagne(t):
    out = []
    for s in siti(t):
        for c in t.lista('getCampaigns', [('affiliateSiteID', s.get('ID')), ('options', {})]):
            info = c.get('info') or {}
            out.append({'sito': s.get('ID'), 'id': c.get('ID'), 'nome': c.get('name'), 'url': c.get('URL'),
                        'stato': (info.get('assignmentStatus') or '').lower(), 'categoria': (c.get('category') or {}).get('name'),
                        'commissione': (info.get('commission') or {}) if isinstance(info.get('commission'), dict) else info.get('commission')})
    return out


def feed(t):
    out = []
    for s in siti(t):
        for f in t.lista('getFeeds', [('affiliateSiteID', s.get('ID')), ('options', {})]):
            camp = f.get('campaign') or {}
            out.append({'sito': s.get('ID'), 'id': f.get('ID'), 'nome': f.get('name'), 'negozio': camp.get('name'),
                        'prodotti': f.get('productCount'), 'aggiornato': f.get('updateDate'), 'url': f.get('URL')})
    return out


def vendite(t, giorni=90):
    """Le transazioni del periodo, nello stesso formato delle altre reti di vendite.py."""
    da = (dt.datetime.now() - dt.timedelta(days=giorni)).strftime('%Y-%m-%dT00:00:00')
    a = dt.datetime.now().strftime('%Y-%m-%dT23:59:59')
    out = []
    for s in siti(t):
        offset = 0
        while True:
            righe = t.lista('getConversionTransactions', [('affiliateSiteID', s.get('ID')), ('options', {
                'registrationDateFrom': da, 'registrationDateTo': a, 'limit': 100, 'offset': offset})])
            for x in righe:
                out.append(dict(id=f"tradetracker-{x.get('ID')}", rete='TradeTracker', negozio=(x.get('campaign') or {}).get('name') or '',
                                data=(x.get('registrationDate') or '')[:10], importo=_num(x.get('orderAmount')), commissione=_num(x.get('commission')),
                                stato=STATO.get((x.get('transactionStatus') or '').lower(), 'in attesa'), subid=x.get('reference') or None))
            if len(righe) < 100:
                break
            offset += 100
    return out


def _num(v):
    try:
        return float(v) if v not in (None, '') else None
    except ValueError:
        return None


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'prova'
    if cmd == 'salva':
        salva(sys.argv[2] if len(sys.argv) > 2 else '')
    elif cmd == 'prova':
        for x in siti(sessione()):
            print(x.get('ID'), x.get('name'), x.get('URL'))
    elif cmd == 'campagne':
        cc = campagne(sessione())
        for c in sorted(cc, key=lambda c: (c['stato'] != 'accepted', c['nome'] or '')):
            print(f"{c['stato'] or '-':10} {c['id']:>6} {c['nome']} · {c['categoria'] or ''}")
        print(len(cc), 'campagne ·', sum(1 for c in cc if c['stato'] == 'accepted'), 'accettate')
    elif cmd == 'feed':
        for f in feed(sessione()):
            print(f"{f['id']:>6} {f['negozio']} · {f['nome']} · {f['prodotti']} prodotti · {f['aggiornato']}")
    elif cmd == 'vendite':
        vv = vendite(sessione(), int(sys.argv[2]) if len(sys.argv) > 2 else 90)
        print(len(vv), 'transazioni')
    else:
        sys.exit(__doc__)
