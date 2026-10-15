#!/usr/bin/env python3
"""LA PUBBLICAZIONE DALL'ADMIN DI SKINMATCH: dal database al sito, sul Mac.

Gira ogni quarto d'ora (launchd com.agoranomos.squadra.skinmatch-pubblica) e non costa niente
se non c'è niente da fare. Quando qualcuno ha premuto «Pubblica» nell'admin (tabella
pubblicazioni, stato in_coda), oppure con --approvati se ci sono articoli approvati:

1. git pull; il repository deve essere pulito (si accettano solo foto nuove in public/immagini e media/);
2. scrive src/data/*.json dall'ultima versione salvata nell'admin (test, biotipi, glossario,
   catalogo) e gli articoli approvati in src/data/rivista.json;
3. i biotipi, le categorie o i filtri tolti non lasciano 404: rinvio 301 in public/_redirects;
4. i guardiani (scripts/guardiani.ts): se fermano, niente va online e l'admin lo dice;
5. build, commit «Redazione Skinmatch», push, deploy, IndexNow; poi segna tutto come pubblicato.

⚠️ Chi modifica a mano src/data/*.json nel repository li vede riscritti qui: si passa dall'admin.
"""
import argparse
import datetime as dt
import json
import os
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from d1 import L, REPO, ACCOUNT, sql  # noqa: E402

DATI = REPO / 'src' / 'data'
REDIRECTS = REPO / 'public' / '_redirects'
LOCK = REPO / '.pubblica.lock'
FIRMA = '\n\nCo-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>'
TIPI = ['test', 'biotipi', 'glossario', 'catalogo']


def run(*cmd, ok=True, **kw):
    r = subprocess.run(cmd, cwd=REPO, capture_output=True, text=True, env={**os.environ, 'CLOUDFLARE_ACCOUNT_ID': ACCOUNT}, **kw)
    if ok and r.returncode:
        raise RuntimeError(f"{' '.join(cmd[:3])}: {(r.stderr or r.stdout)[-1500:]}")
    return r


def pulito():
    sporchi = [r[3:] for r in run('git', 'status', '--porcelain').stdout.splitlines()]
    # si pubblicano anche le foto nuove di Zeno e la selezione del catalogo (scripts/catalogo/aggiorna.py)
    return [f for f in sporchi if not (f.startswith('public/immagini/') or f.startswith('media/') or f.startswith('"media/') or f == 'src/data/prodotti.json')]


def scrivi(nome, dati, nota):
    f = DATI / f'{nome}.json'
    vecchio = json.loads(f.read_text(encoding='utf-8')) if f.exists() else {}
    doc = {'_nota': vecchio.get('_nota', nota), **{k: v for k, v in dati.items() if k != '_nota'}}
    f.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    return vecchio


def rinvii(vecchi, nuovi, base, verso):
    tolti = sorted(set(vecchi) - set(nuovi))
    if not tolti:
        return []
    righe = REDIRECTS.read_text(encoding='utf-8').splitlines() if REDIRECTS.exists() else ['# Pagine tolte dall\'admin: mai un 404 (scripts/admin/pubblica.py)']
    for t in tolti:
        r = f'{base}/{t} {verso} 301'
        if r not in righe:
            righe.append(r)
    REDIRECTS.write_text('\n'.join(righe) + '\n', encoding='utf-8')
    return tolti


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--approvati', action='store_true', help='pubblica anche senza richiesta se ci sono articoli approvati')
    a = ap.parse_args()

    coda = sql("SELECT id, chi, cosa FROM pubblicazioni WHERE stato = 'in_coda' ORDER BY id")
    approvati = sql("SELECT * FROM articoli WHERE stato = 'approvato' ORDER BY id")
    if not coda and not (a.approvati and approvati):
        return 0
    if not coda:
        coda = sql("INSERT INTO pubblicazioni (chi, cosa) VALUES ('jarvis', 'articoli approvati') RETURNING id, chi, cosa")
    ids = ', '.join(str(c['id']) for c in coda)
    try:
        LOCK.mkdir()
    except FileExistsError:
        print('un\'altra pubblicazione è in corso')
        return 0
    try:
        return pubblica(coda, ids)
    finally:
        LOCK.rmdir()


def pubblica(coda, ids):
    sporchi = pulito()
    if sporchi:
        sql(f"UPDATE pubblicazioni SET esito = {L('In attesa: nel repository ci sono modifiche non ancora salvate (' + ', '.join(sporchi[:3]) + '). Riprovo tra un quarto d’ora.')} WHERE id IN ({ids})")
        print('repository con modifiche locali:', sporchi[:5])
        return 0
    sql(f"UPDATE pubblicazioni SET stato = 'in_corso', esito = NULL WHERE id IN ({ids})")
    prima = run('git', 'rev-parse', 'HEAD').stdout.strip()
    try:
        run('git', 'pull', '--rebase', '--quiet')
        if run('git', 'diff', '--name-only', prima, 'HEAD').stdout.count('package'):
            run('npm', 'install', '--no-audit', '--no-fund')
        fatto, docs = [], {}
        for tipo in TIPI:
            r = sql(f"SELECT id, dati, pubblicato_il FROM documenti WHERE tipo = {L(tipo)} ORDER BY id DESC LIMIT 1")
            if r and not r[0]['pubblicato_il']:
                docs[tipo] = r[0]['id']
                nuovo = json.loads(r[0]['dati'])
                vecchio = scrivi(tipo, nuovo, '')
                fatto.append(tipo)
                if tipo == 'biotipi':
                    tolti = rinvii([b['id'] for b in vecchio.get('biotipi', [])], [b['id'] for b in nuovo.get('biotipi', [])], '/biotipi', '/biotipi')
                    if tolti: fatto.append(f'rinvii per {", ".join(tolti)}')
                if tipo == 'catalogo':
                    gv = [x['id'] for x in vecchio.get('categorie', []) + vecchio.get('tag', [])]
                    gn = [x['id'] for x in nuovo.get('categorie', []) + nuovo.get('tag', [])]
                    rinvii(gv, gn, '/catalogo', '/catalogo')
        articoli = sql("SELECT * FROM articoli WHERE stato = 'approvato' ORDER BY id")
        if articoli:
            riv = json.loads((DATI / 'rivista.json').read_text(encoding='utf-8'))
            oggi = dt.date.today().isoformat()
            per_slug = {x['slug']: x for x in riv.get('articoli', [])}
            for x in articoli:
                per_slug[x['slug']] = {
                    'slug': x['slug'], 'titolo': x['titolo'], 'sommario': x['sommario'] or '', 'tipo': x['tipo'] or 'guida', 'testo': x['testo'],
                    'immagine': json.loads(x['immagine'] or '{}') or None, 'prodotti': json.loads(x['prodotti'] or '[]'),
                    'biotipi': json.loads(x['biotipi'] or '[]'), 'termini': json.loads(x['termini'] or '[]'),
                    'pubblicato_il': per_slug.get(x['slug'], {}).get('pubblicato_il', oggi), **({'aggiornato_il': oggi} if x['slug'] in per_slug else {}),
                }
            riv['articoli'] = sorted(per_slug.values(), key=lambda y: y['pubblicato_il'], reverse=True)
            (DATI / 'rivista.json').write_text(json.dumps(riv, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
            fatto.append(f'{len(articoli)} articoli')
        g = run('npx', 'tsx', 'scripts/guardiani.ts', ok=False)
        if g.returncode:
            raise RuntimeError('I guardiani hanno fermato la pubblicazione:\n' + '\n'.join(l for l in g.stdout.splitlines() if '✗' in l)[:1200])
        run('npx', 'next', 'build')
        run('git', 'add', 'src/data', 'public', 'media')
        if run('git', 'diff', '--cached', '--quiet', ok=False).returncode:
            chi = ', '.join(sorted({c['chi'] or '' for c in coda}))
            run('git', 'commit', '-q', '-m', f"Pubblicazione dall'admin: {', '.join(fatto) or 'foto'}\n\nChiesta da {chi} su skinmatch.it/admin.\n\nRedazione Skinmatch{FIRMA}")
            run('git', 'pull', '--rebase', '--quiet')
            run('git', 'push', '--quiet')
        run('npx', 'wrangler', 'deploy')
        run('node', 'scripts/indexnow-ping.js', ok=False)
        prova = subprocess.run(['curl', '-s', '-o', '/dev/null', '-w', '%{http_code}', 'https://skinmatch.it/'], capture_output=True, text=True).stdout
        for tipo, i in docs.items():
            sql(f"UPDATE documenti SET pubblicato_il = datetime('now') WHERE id = {i}")
        for x in articoli:
            sql(f"UPDATE articoli SET stato = 'online', pubblicato_il = coalesce(pubblicato_il, datetime('now')) WHERE id = {x['id']}")
        esito = f"Online: {', '.join(fatto) or 'niente di nuovo da scrivere'} (home {prova})."
        sql(f"UPDATE pubblicazioni SET stato = 'fatta', esito = {L(esito)}, fatta_il = datetime('now') WHERE id IN ({ids})")
        print(esito)
        return 0
    except Exception as e:
        run('git', 'checkout', '--', 'src/data', ok=False)
        if REDIRECTS.exists():
            run('git', 'checkout', '--', 'public/_redirects', ok=False)
        sql(f"UPDATE pubblicazioni SET stato = 'fallita', esito = {L(str(e)[:1500])}, fatta_il = datetime('now') WHERE id IN ({ids})")
        print('fallita:', e)
        return 1


if __name__ == '__main__':
    sys.exit(main())
