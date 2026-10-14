#!/usr/bin/env python3
"""LE VENDITE DI SKINMATCH: dalle reti di affiliazione al database dell'admin (scheda Traffico).

Gira ogni mattina con il controllo di Jarvis. Oggi Adtraction (canale «SKINMATCH - Content IT»);
CJ e Awin si aggiungono quando Skinmatch ha i suoi accessi. Le chiavi stanno in
~/.skinmatch-segreti.env e non si stampano mai.
"""
import datetime as dt
import json
import os
import sys
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from d1 import L, sql  # noqa: E402

ADT_STATO = {1: 'approvata', 3: 'approvata', 2: 'in attesa', 0: 'in attesa', 4: 'rifiutata', 5: 'rifiutata'}


def segreti():
    s = {}
    f = Path.home() / '.skinmatch-segreti.env'
    for riga in f.read_text().splitlines() if f.exists() else []:
        if '=' in riga and not riga.lstrip().startswith('#'):
            k, v = riga.split('=', 1)
            s[k.strip().removeprefix('export ').strip()] = v.strip().strip('"').strip("'")
    return s


def adtraction(token, giorni=90):
    corpo = json.dumps({'fromDate': (dt.date.today() - dt.timedelta(days=giorni)).isoformat() + 'T00:00:00',
                        'toDate': dt.date.today().isoformat() + 'T23:59:59', 'transactionStatus': 0}).encode()
    req = urllib.request.Request(f'https://api.adtraction.com/v2/partner/transactions/?token={token}', data=corpo,
                                 headers={'Content-Type': 'application/json', 'Accept': 'application/json'})
    dati = json.loads(urllib.request.urlopen(req, timeout=60).read().decode())
    if not isinstance(dati, list):
        return []
    out = []
    for t in dati:
        c = t.get('click') or {}
        out.append(dict(id=f"adtraction-{t.get('uniqueId')}", rete='Adtraction', negozio=c.get('programName') or t.get('transactionName'),
                        data=(t.get('transactionDate') or '')[:10], importo=t.get('orderValue'), commissione=t.get('commission'),
                        stato=ADT_STATO.get(t.get('transactionStatus'), 'in attesa'), subid=c.get('epi')))
    return out


def main():
    s = segreti()
    vendite = []
    if s.get('ADTRACTION_TOKEN'):
        try:
            vendite += adtraction(s['ADTRACTION_TOKEN'])
        except Exception as e:
            print(f'Adtraction: {type(e).__name__}')
    for v in vendite:
        sql(f"INSERT INTO vendite (id, rete, negozio, data, importo, commissione, stato, subid) VALUES ({', '.join(L(v[k]) for k in ('id', 'rete', 'negozio', 'data', 'importo', 'commissione', 'stato', 'subid'))}) "
            f"ON CONFLICT (id) DO UPDATE SET stato = excluded.stato, commissione = excluded.commissione, importo = excluded.importo, aggiornato_il = datetime('now')")
    print(f'{len(vendite)} vendite')


if __name__ == '__main__':
    main()
