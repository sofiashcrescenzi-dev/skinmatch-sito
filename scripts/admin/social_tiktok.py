#!/usr/bin/env python3
"""I NUMERI DEL PROFILO TIKTOK DI SKINMATCH, DALL'API (19/11/2026).

⚠️ PERCHE (il PO, 19/11/2026): «mettiamo anche skinmatch, ma lo mandiamo sull'admin suo». Stessa idea dei siti di
Agoranomos, ma tutto separato (Skinmatch non usa niente di Agoranomos): app «Skinmatch dati» su developers.tiktok.com,
in modalita SANDBOX («Dati del profilo»), senza revisione di TikTok; il profilo @skinmatch.it e il suo «Target user».

Dove stanno le cose:
- chiave e segreto dell'app: ~/.skinmatch-segreti.env (TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET), letti senza `source`;
- i token: ~/.skinmatch-tiktok.json (600). Quello d'accesso dura 24 ore e si rinnova qui; quello di rinnovo dura un anno
  e TikTok puo cambiarlo, per questo il file si riscrive a ogni rinnovo;
- i numeri: D1 skinmatch-dati, social_profili (una riga al giorno) e social_video (l'ultimo stato di ogni video).
  Li mostra admin › Social › I numeri (Worker, via «social-numeri»).

Gira da pubblica.py (launchd ogni 15 minuti), al massimo una volta ogni 6 ore: niente plist nuovi.

Collegare di nuovo il profilo (una volta all'anno, o se TikTok lo scollega):
  1. developers.tiktok.com › app Skinmatch dati › Sandbox › Target users: @skinmatch.it c'e gia (se no, Add account);
  2. python3 scripts/admin/social_tiktok.py collega   → l'indirizzo da aprire nel browser dove si e entrati col profilo;
  3. si tocca «Continua»; TikTok torna su https://skinmatch.it/?code=…: il valore di code va negli appunti;
  4. python3 scripts/admin/social_tiktok.py codice    → scambia il codice e salva i token (non stampa niente di segreto).
"""
import json
import os
import re
import secrets
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from d1 import L, sql  # noqa: E402

FILE_TOKEN = os.path.expanduser('~/.skinmatch-tiktok.json')
FILE_SEGRETI = os.path.expanduser('~/.skinmatch-segreti.env')
RITORNO = 'https://skinmatch.it/'          # lo stesso registrato nel Login Kit dell'app (sandbox)
PERMESSI = 'user.info.basic,user.info.profile,user.info.stats,video.list,video.upload'
API = 'https://open.tiktokapis.com/v2'
CAMPI_PROFILO = 'open_id,username,display_name,follower_count,following_count,likes_count,video_count'
CAMPI_VIDEO = 'id,title,create_time,duration,view_count,like_count,comment_count,share_count,share_url'


def _segreti():
    d = {}
    with open(FILE_SEGRETI) as f:
        for r in f:
            m = re.match(r'\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)\s*$', r)
            if m:
                d[m.group(1)] = m.group(2).strip().strip('"').strip("'")
    if not d.get('TIKTOK_CLIENT_KEY') or not d.get('TIKTOK_CLIENT_SECRET'):
        raise SystemExit(f'mancano TIKTOK_CLIENT_KEY o TIKTOK_CLIENT_SECRET in {FILE_SEGRETI}')
    return d['TIKTOK_CLIENT_KEY'], d['TIKTOK_CLIENT_SECRET']


def _leggi_token():
    if not os.path.exists(FILE_TOKEN):
        return {'app': 'Skinmatch dati, sandbox «Dati del profilo»', 'account': {}}
    with open(FILE_TOKEN) as f:
        return json.load(f)


def _scrivi_token(tutto):
    tmp = FILE_TOKEN + '.nuovo'
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'w') as f:
        json.dump(tutto, f, indent=1)
    os.chmod(tmp, 0o600)
    os.replace(tmp, FILE_TOKEN)


def _chiama(url, corpo=None, token=None, forma=False):
    intestazioni = {'Cache-Control': 'no-cache'}
    dati = None
    if token:
        intestazioni['Authorization'] = 'Bearer ' + token
    if corpo is not None:
        if forma:
            dati = urllib.parse.urlencode(corpo).encode()
            intestazioni['Content-Type'] = 'application/x-www-form-urlencoded'
        else:
            dati = json.dumps(corpo).encode()
            intestazioni['Content-Type'] = 'application/json'
    req = urllib.request.Request(url, data=dati, headers=intestazioni, method='POST' if dati is not None else 'GET')
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        try:
            return json.loads(e.read() or b'{}')
        except ValueError:
            return {'error': {'code': f'http_{e.code}'}}


def _errore(r):
    e = r.get('error')
    if isinstance(e, dict) and e.get('code') not in (None, 'ok'):
        return f"{e.get('code')}: {str(e.get('message', ''))[:160]}"
    if isinstance(e, str) and e:
        return f"{e}: {str(r.get('error_description', ''))[:160]}"
    return None


def _salva_token(acc, t):
    ora = int(time.time())
    acc.update({
        'open_id': t.get('open_id', acc.get('open_id')),
        'access_token': t['access_token'],
        'scadenza': ora + int(t.get('expires_in', 86400)),
        'refresh_token': t.get('refresh_token') or acc.get('refresh_token'),
        'scadenza_refresh': ora + int(t.get('refresh_expires_in', 31536000)),
        'scope': t.get('scope', acc.get('scope', '')),
    })


def token(nome, tutto, chiave, segreto):
    acc = tutto['account'][nome]
    if acc.get('scadenza', 0) - time.time() > 3600:
        return acc['access_token']
    if acc.get('scadenza_refresh', 0) < time.time():
        print(f'  {nome}: il collegamento e scaduto (un anno): va ricollegato, vedi in testa a questo file')
        return None
    t = _chiama(f'{API}/oauth/token/', {'client_key': chiave, 'client_secret': segreto, 'grant_type': 'refresh_token',
                                        'refresh_token': acc['refresh_token']}, forma=True)
    if 'access_token' not in t:
        print(f'  {nome}: rinnovo rifiutato ({_errore(t) or "senza motivo"}): va ricollegato')
        return None
    _salva_token(acc, t)
    acc['rinnovato_il'] = time.strftime('%Y-%m-%d %H:%M')
    _scrivi_token(tutto)
    return acc['access_token']


def profilo(tok):
    r = _chiama(f'{API}/user/info/?fields={CAMPI_PROFILO}', token=tok)
    err = _errore(r)
    if err:
        raise RuntimeError('profilo: ' + err)
    return (r.get('data') or {}).get('user') or {}


def video(tok):
    tutti, cursore = [], None
    for _ in range(100):
        corpo = {'max_count': 20}
        if cursore:
            corpo['cursor'] = cursore
        r = _chiama(f'{API}/video/list/?fields={CAMPI_VIDEO}', corpo, token=tok)
        err = _errore(r)
        if err:
            raise RuntimeError('video: ' + err)
        d = r.get('data') or {}
        tutti += d.get('videos') or []
        if not d.get('has_more') or not d.get('cursor'):
            break
        cursore = d['cursor']
    return tutti


def _iso(sec):
    return time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime(int(sec or 0)))


TABELLE = [
    'CREATE TABLE IF NOT EXISTS social_profili (giorno TEXT, piattaforma TEXT, account TEXT, follower INTEGER, seguiti INTEGER, '
    'like_totali INTEGER, video INTEGER, visualizzazioni INTEGER, aggiornato TEXT, PRIMARY KEY (giorno, piattaforma, account))',
    'CREATE TABLE IF NOT EXISTS social_video (piattaforma TEXT, id TEXT, account TEXT, titolo TEXT, creato TEXT, durata INTEGER, '
    'visualizzazioni INTEGER, mi_piace INTEGER, commenti INTEGER, condivisioni INTEGER, link TEXT, aggiornato TEXT, '
    'PRIMARY KEY (piattaforma, id))',
]


def giro(prova=False):
    chiave, segreto = _segreti()
    tutto = _leggi_token()
    if not tutto['account']:
        print('nessun profilo TikTok collegato: vedi in testa a questo file')
        return 0
    adesso = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
    giorno = time.strftime('%Y-%m-%d')
    istruzioni, falliti = list(TABELLE), 0
    for nome in sorted(tutto['account']):
        tok = token(nome, tutto, chiave, segreto)
        if not tok:
            falliti += 1
            continue
        try:
            u = profilo(tok)
            vv = video(tok)
        except RuntimeError as e:
            print(f'  {nome}: {e}')
            falliti += 1
            continue
        acc = u.get('username') or nome
        viste = sum(int(v.get('view_count') or 0) for v in vv)
        istruzioni.append(
            'INSERT INTO social_profili (giorno, piattaforma, account, follower, seguiti, like_totali, video, visualizzazioni, aggiornato) '
            f"VALUES ({L(giorno)}, 'tiktok', {L(acc)}, {L(u.get('follower_count'))}, {L(u.get('following_count'))}, "
            f"{L(u.get('likes_count'))}, {L(u.get('video_count'))}, {L(viste)}, {L(adesso)}) "
            'ON CONFLICT (giorno, piattaforma, account) DO UPDATE SET follower = excluded.follower, seguiti = excluded.seguiti, '
            'like_totali = excluded.like_totali, video = excluded.video, visualizzazioni = excluded.visualizzazioni, aggiornato = excluded.aggiornato')
        for v in vv:
            istruzioni.append(
                'INSERT INTO social_video (piattaforma, id, account, titolo, creato, durata, visualizzazioni, mi_piace, commenti, condivisioni, link, aggiornato) '
                f"VALUES ('tiktok', {L(str(v.get('id')))}, {L(acc)}, {L((v.get('title') or '')[:300])}, {L(_iso(v.get('create_time')))}, "
                f"{L(v.get('duration'))}, {L(v.get('view_count'))}, {L(v.get('like_count'))}, {L(v.get('comment_count'))}, "
                f"{L(v.get('share_count'))}, {L(v.get('share_url'))}, {L(adesso)}) "
                'ON CONFLICT (piattaforma, id) DO UPDATE SET titolo = excluded.titolo, visualizzazioni = excluded.visualizzazioni, '
                'mi_piace = excluded.mi_piace, commenti = excluded.commenti, condivisioni = excluded.condivisioni, link = excluded.link, '
                'aggiornato = excluded.aggiornato')
        print(f"  @{acc}: {u.get('follower_count')} follower, {u.get('likes_count')} mi piace, {len(vv)} video pubblici, {viste} visualizzazioni")
    if not prova and len(istruzioni) > len(TABELLE):
        sql(';\n'.join(istruzioni))
        print(f'D1 skinmatch-dati: {len(istruzioni) - len(TABELLE)} righe')
    return falliti


def collega():
    chiave, _ = _segreti()
    q = urllib.parse.urlencode({'client_key': chiave, 'response_type': 'code', 'scope': PERMESSI,
                                'redirect_uri': RITORNO, 'state': secrets.token_urlsafe(12)})
    print('https://www.tiktok.com/v2/auth/authorize/?' + q)


def codice():
    chiave, segreto = _segreti()
    c = subprocess.run(['pbpaste'], capture_output=True, text=True).stdout.strip()
    subprocess.run(['pbcopy'], input='', text=True)
    c = urllib.parse.unquote(c).replace(' ', '+')
    if len(c) < 20:
        raise SystemExit('negli appunti non c\'e un codice di TikTok')
    t = _chiama(f'{API}/oauth/token/', {'client_key': chiave, 'client_secret': segreto, 'code': c,
                                        'grant_type': 'authorization_code', 'redirect_uri': RITORNO}, forma=True)
    if 'access_token' not in t:
        raise SystemExit('TikTok ha rifiutato il codice: ' + (_errore(t) or 'senza motivo'))
    u = profilo(t['access_token'])
    nome = u.get('username') or t.get('open_id')
    tutto = _leggi_token()
    acc = tutto['account'].setdefault(nome, {})
    _salva_token(acc, t)
    acc['collegato_il'] = time.strftime('%Y-%m-%d %H:%M')
    _scrivi_token(tutto)
    print(f'collegato @{nome}, permessi: {t.get("scope")}')


if __name__ == '__main__':
    a = sys.argv[1:]
    if a[:1] == ['collega']:
        collega()
    elif a[:1] == ['codice']:
        codice()
    else:
        sys.exit(1 if giro(prova='--prova' in a) else 0)
