#!/usr/bin/env python3
"""LE VENDITE DI SKINMATCH: dalle reti di affiliazione al database dell'admin (scheda Traffico).

Gira ogni mattina con il controllo di Jarvis. Adtraction (canale «SKINMATCH - Content IT») e, dal 6/11/2026, Awin
(il conto publisher «SKINMATCH»: Stylevana, Clubfarma); CJ quando Skinmatch ha i suoi accessi. Le chiavi stanno in
~/.skinmatch-segreti.env e non si stampano mai; il token di Awin e uno solo per i due conti, Agoranomos e
Skinmatch, e sta in ~/.agoranomos-segreti.env (AWIN_API_TOKEN).
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
    # il token di Awin vede tutti e due i conti: vale quello del file di Agoranomos, che si rigenera una volta sola
    # (quello vecchio in ~/.skinmatch-segreti.env e scaduto il 3/11/2026)
    g = Path.home() / '.agoranomos-segreti.env'
    for riga in g.read_text().splitlines() if g.exists() else []:
        k, _, v = riga.partition('=')
        if k.strip().removeprefix('export ').strip() == 'AWIN_API_TOKEN':
            s['AWIN_API_TOKEN'] = v.strip().strip('"').strip("'")
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


AWIN_STATO = {'approved': 'approvata', 'pending': 'in attesa', 'declined': 'rifiutata', 'deleted': 'rifiutata'}


def _awin(percorso, token):
    import time
    time.sleep(3.2)  # Awin: 20 chiamate al minuto
    req = urllib.request.Request(f'https://api.awin.com{percorso}', headers={'Authorization': f'Bearer {token}'})
    return json.loads(urllib.request.urlopen(req, timeout=60).read().decode())


def awin(token, giorni=90):
    """Le vendite del conto publisher «SKINMATCH» (Agoranomos legge solo il suo: vedi vendite_reti.py)."""
    conti = [str(a['accountId']) for a in _awin('/accounts?type=publisher', token).get('accounts', [])
             if 'skinmatch' in (a.get('accountName') or '').lower()]
    out = []
    for pub in conti:
        nomi = {str(p.get('id')): p.get('name') or '' for p in _awin(f'/publishers/{pub}/programmes?relationship=joined', token) or []}
        fine, restano, fmt = dt.datetime.utcnow(), giorni, '%Y-%m-%dT%H:%M:%S'
        while restano > 0:
            pezzo = min(restano, 31)
            inizio = fine - dt.timedelta(days=pezzo)
            for t in _awin(f'/publishers/{pub}/transactions/?startDate={inizio.strftime(fmt)}&endDate={fine.strftime(fmt)}'
                           f'&timezone=Europe/Berlin&dateType=transaction', token) or []:
                sa, ca = t.get('saleAmount') or {}, t.get('commissionAmount') or {}
                out.append(dict(id=f"awin-{t.get('id')}", rete='Awin', negozio=nomi.get(str(t.get('advertiserId'))) or str(t.get('advertiserId') or ''),
                                data=(t.get('transactionDate') or '')[:10], importo=sa.get('amount'), commissione=ca.get('amount'),
                                stato=AWIN_STATO.get((t.get('commissionStatus') or '').lower(), 'in attesa'),
                                subid=(t.get('clickRefs') or {}).get('clickRef')))
            fine, restano = inizio, restano - pezzo
    return out


def main():
    s = segreti()
    vendite = []
    if s.get('ADTRACTION_TOKEN'):
        try:
            vendite += adtraction(s['ADTRACTION_TOKEN'])
        except Exception as e:
            print(f'Adtraction: {type(e).__name__}')
    if s.get('AWIN_API_TOKEN'):
        try:
            vendite += awin(s['AWIN_API_TOKEN'])
        except Exception as e:
            # ⚠️ un token scaduto si dice forte (3/11/2026: da tre giorni le vendite Awin non arrivavano e nessuno lo sapeva)
            print(f'Awin: {type(e).__name__} {getattr(e, "code", "")}')
            sys.exit(f'::error::Awin non risponde ({getattr(e, "code", type(e).__name__)}): rigenerare AWIN_API_TOKEN')
    for v in vendite:
        sql(f"INSERT INTO vendite (id, rete, negozio, data, importo, commissione, stato, subid) VALUES ({', '.join(L(v[k]) for k in ('id', 'rete', 'negozio', 'data', 'importo', 'commissione', 'stato', 'subid'))}) "
            f"ON CONFLICT (id) DO UPDATE SET stato = excluded.stato, commissione = excluded.commissione, importo = excluded.importo, aggiornato_il = datetime('now')")
    print(f'{len(vendite)} vendite')


if __name__ == '__main__':
    main()
