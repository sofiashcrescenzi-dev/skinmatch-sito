"""IL DATABASE DI SKINMATCH DAL MAC: D1 «skinmatch-dati» sull'account Cloudflare di Sofia.

Passa da wrangler (`d1 execute --remote --json`), con l'accesso OAuth già fatto sul Mac: niente
token in chiaro. I valori si mettono nella query con `L()` (letterale SQL, apici raddoppiati).
"""
import json
import os
import subprocess
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
ACCOUNT = '7fca2fe0c2f889d868a70e712cdcef85'
DB = 'skinmatch-dati'


def L(v):
    if v is None:
        return 'NULL'
    if isinstance(v, bool):
        return '1' if v else '0'
    if isinstance(v, (int, float)):
        return repr(v)
    if not isinstance(v, str):
        v = json.dumps(v, ensure_ascii=False)
    return "'" + v.replace("'", "''") + "'"


def sql(comando):
    """Esegue una o più istruzioni; restituisce le righe dell'ultima."""
    r = subprocess.run(['npx', 'wrangler', 'd1', 'execute', DB, '--remote', '--json', '--command', comando],
                       cwd=REPO, capture_output=True, text=True, env={**os.environ, 'CLOUDFLARE_ACCOUNT_ID': ACCOUNT})
    try:
        out = json.loads(r.stdout)
    except json.JSONDecodeError:
        raise RuntimeError(f'wrangler: {(r.stderr or r.stdout)[-600:]}')
    if isinstance(out, dict) and out.get('error'):
        raise RuntimeError(f"D1: {out['error']}")
    return (out[-1].get('results') if out else []) or []
