#!/usr/bin/env python3
"""I NUMERI DEL PROFILO INSTAGRAM DI SKINMATCH, DALL'API (20/11/2026).

⚠️ PERCHE: il PO, 20/11/2026, «dobbiamo fare lo stesso per skinmatch anche per ig […] con autonomo». Come TikTok
(social_tiktok.py), per l'admin di Skinmatch: follower, post, visualizzazioni e copertura di @skinmatch.it.

SEPARATO DA AGORANOMOS (vedi la memoria «skinmatch-separato»):
- app Meta «Skinmatch dati» (id 3174082916285071), email di contatto skinmatch123@gmail.com, in modalità sviluppo;
- portfolio business «Federico Greco»: il PO non poteva crearne uno nuovo, perché Meta ha un limite per persona;
- configurazione «Skinmatch Instagram dati»: token di sistema che non scadono, con instagram_basic,
  instagram_manage_insights, instagram_content_publish e instagram_manage_comments;
- token in ~/.skinmatch-instagram.json (600), mai stampati; numeri su D1 skinmatch-dati (social_profili, social_video).

Collegare il profilo (una volta sola; serve il PO per entrare con @skinmatch.it):
  1. developers.facebook.com › Skinmatch dati › Casi d'uso › API Instagram › 2. Genera i token d'accesso;
  2. «Genera token»: nella finestra di Instagram il PO entra come skinmatch.it e tocca «Consenti»;
  3. nella pagina compare «Token generato»: si spunta «Comprendo e accetto» e si preme «Copia»;
  4. python3 scripts/admin/social_instagram.py salva   → prova il token, lo salva e svuota gli appunti.

Uso normale: lo lancia pubblica.py ogni 6 ore insieme a TikTok (nessun launchd nuovo).
  python3 scripts/admin/social_instagram.py --prova     # legge e stampa, senza scrivere
"""
import datetime
import json
import os
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from d1 import sql, L  # noqa: E402

FILE_TOKEN = os.path.expanduser('~/.skinmatch-instagram.json')
FB = 'https://graph.facebook.com/v22.0'
MAX_POST = 100
IDS = {}          # username → id del profilo Instagram, si riempie la prima volta da «salva» (pagina dei token)


def _get(percorso, tok, **q):
    q['access_token'] = tok
    u = f'{FB}/{percorso}?' + urllib.parse.urlencode(q)
    try:
        with urllib.request.urlopen(urllib.request.Request(u), timeout=30) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        err = (json.loads(e.read() or b'{}').get('error') or {})
        raise RuntimeError(f"HTTP {e.code} {err.get('type', '')} {err.get('code', '')}: {err.get('message', '')[:160]}") from None


def _leggi():
    return json.load(open(FILE_TOKEN)) if os.path.exists(FILE_TOKEN) else {}


def _scrivi(tutto):
    nuovo = FILE_TOKEN + '.tmp'
    with os.fdopen(os.open(nuovo, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600), 'w') as f:
        json.dump(tutto, f, indent=1)
    os.replace(nuovo, FILE_TOKEN)


def salva(ig_id=None):
    """I token della configurazione «accesso unificato» cominciano con EAA: /me risponde con l'utente di sistema, e i
    profili Instagram che il token apre si leggono da me/accounts → instagram_business_account, o dall'id passato."""
    tok = subprocess.run(['pbpaste'], capture_output=True, text=True).stdout.strip()
    if not tok or len(tok) < 40 or ' ' in tok:
        sys.exit('Negli appunti non c\'e un token: tocca «Copia» nella finestra del token e riprova.')
    if not ig_id:
        # i profili Instagram che il token vede, attraverso le risorse dell'utente di sistema
        try:
            d = _get('me/accounts', tok, fields='instagram_business_account{id,username}')
            ids = [x['instagram_business_account']['id'] for x in d.get('data', []) if x.get('instagram_business_account')]
            ig_id = ids[0] if ids else None
        except RuntimeError:
            ig_id = None
    if not ig_id:
        sys.exit('Non trovo il profilo del token: passa l\'id che la pagina dei token mostra sotto skinmatch.it.')
    p = _get(ig_id, tok, fields='id,username')
    tutto = _leggi()
    tutto[p['username']] = {'token': tok, 'id': p['id'], 'salvato': datetime.datetime.now().isoformat(timespec='seconds')}
    _scrivi(tutto)
    subprocess.run(['pbcopy'], input='', text=True)
    print(f"Salvato il token di {p['username']}; profili collegati: {', '.join(sorted(tutto))}")


def _insight(tok, pid, tipo):
    metriche = 'views,reach,likes,comments,shares,saved' if tipo != 'STORY' else 'views,reach'
    try:
        d = _get(f'{pid}/insights', tok, metric=metriche)
    except RuntimeError:
        return {}
    return {x['name']: (x.get('values') or [{}])[0].get('value') for x in d.get('data', [])}


TABELLE = [
    'CREATE TABLE IF NOT EXISTS social_profili (giorno TEXT, piattaforma TEXT, account TEXT, follower INTEGER, seguiti INTEGER, '
    'like_totali INTEGER, video INTEGER, visualizzazioni INTEGER, aggiornato TEXT, PRIMARY KEY (giorno, piattaforma, account))',
    'CREATE TABLE IF NOT EXISTS social_video (piattaforma TEXT, id TEXT, account TEXT, titolo TEXT, creato TEXT, durata INTEGER, '
    'visualizzazioni INTEGER, mi_piace INTEGER, commenti INTEGER, condivisioni INTEGER, link TEXT, aggiornato TEXT, '
    'PRIMARY KEY (piattaforma, id))',
]


def giro(prova=False):
    tutto = _leggi()
    if not tutto:
        print('nessun profilo Instagram collegato: vedi in testa a questo file')
        return 0
    adesso = datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    giorno = datetime.date.today().isoformat()
    istruzioni, falliti = list(TABELLE), 0
    for nome, v in sorted(tutto.items()):
        tok, uid = v['token'], v['id']
        try:
            p = _get(uid, tok, fields='username,followers_count,follows_count,media_count')
            post, dopo = [], None
            while len(post) < MAX_POST:
                q = {'fields': 'id,caption,media_type,timestamp,permalink,like_count,comments_count', 'limit': 50}
                if dopo:
                    q['after'] = dopo
                d = _get(f'{uid}/media', tok, **q)
                post += d.get('data', [])
                dopo = ((d.get('paging') or {}).get('cursors') or {}).get('after')
                if not dopo or not (d.get('paging') or {}).get('next'):
                    break
        except RuntimeError as e:
            print(f'  {nome}: {e}')
            falliti += 1
            continue
        for x in post:
            x['_ins'] = _insight(tok, x['id'], x.get('media_type'))
        acc = p.get('username') or nome
        viste = sum(int(x['_ins'].get('views') or 0) for x in post)
        like = sum(int(x.get('like_count') or 0) for x in post)
        istruzioni.append(
            'INSERT INTO social_profili (giorno, piattaforma, account, follower, seguiti, like_totali, video, visualizzazioni, aggiornato) '
            f"VALUES ({L(giorno)}, 'instagram', {L(acc)}, {L(p.get('followers_count'))}, {L(p.get('follows_count'))}, "
            f"{L(like)}, {L(p.get('media_count'))}, {L(viste)}, {L(adesso)}) "
            'ON CONFLICT (giorno, piattaforma, account) DO UPDATE SET follower = excluded.follower, seguiti = excluded.seguiti, '
            'like_totali = excluded.like_totali, video = excluded.video, visualizzazioni = excluded.visualizzazioni, aggiornato = excluded.aggiornato')
        for x in post:
            ins = x['_ins']
            istruzioni.append(
                'INSERT INTO social_video (piattaforma, id, account, titolo, creato, durata, visualizzazioni, mi_piace, commenti, condivisioni, link, aggiornato) '
                f"VALUES ('instagram', {L(x['id'])}, {L(acc)}, {L((x.get('caption') or '')[:300])}, {L(x.get('timestamp'))}, NULL, "
                f"{L(ins.get('views'))}, {L(x.get('like_count'))}, {L(x.get('comments_count'))}, {L(ins.get('shares'))}, "
                f"{L(x.get('permalink'))}, {L(adesso)}) "
                'ON CONFLICT (piattaforma, id) DO UPDATE SET titolo = excluded.titolo, visualizzazioni = excluded.visualizzazioni, '
                'mi_piace = excluded.mi_piace, commenti = excluded.commenti, condivisioni = excluded.condivisioni, link = excluded.link, '
                'aggiornato = excluded.aggiornato')
        print(f"  @{acc}: {p.get('followers_count')} follower, {p.get('media_count')} post, {viste} visualizzazioni sugli ultimi {len(post)}")
    if not prova and len(istruzioni) > len(TABELLE):
        sql(';\n'.join(istruzioni))
        print(f'D1 skinmatch-dati: {len(istruzioni) - len(TABELLE)} righe')
    return falliti


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'salva':
        salva(*sys.argv[2:3])
    else:
        sys.exit(1 if giro(prova='--prova' in sys.argv) else 0)
