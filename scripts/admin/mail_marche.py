"""LA MAIL AI MARCHI DALLA CASELLA ZOHO (14/11/2026, Federico: «vorrei scrivere dalla mail agoranomos.cloud, ho quella
skinmatch@agoranomos.cloud su zoho mail»).

Il testo è uno solo, src/data/mail-marche.json (lo stesso dell'admin › Marche). Gli indirizzi stanno in D1
`marche_studio`. La casella e la password per le app si leggono da ~/.skinmatch-segreti.env, mai stampate:

    ZOHO_MAIL=skinmatch@agoranomos.cloud
    ZOHO_PASSWORD_APP=...        # Zoho › Account › Sicurezza › Password specifiche per app

    python3 scripts/admin/mail_marche.py prova                  # entra in IMAP e SMTP, non manda niente
    python3 scripts/admin/mail_marche.py elenco [--gruppo G]    # chi riceverebbe la mail, con la lingua
    python3 scripts/admin/mail_marche.py bozze  [--gruppo G] [--marche 3,7] [--max 25]
        # mette le mail nella cartella Bozze di Zoho: Federico le rilegge e le manda da lì
    python3 scripts/admin/mail_marche.py invia  --marche 3,7 [--max 25] --si
        # le manda davvero (solo col sì di Federico) e segna «Contattata» con la data, come il pulsante dell'admin

Il dominio agoranomos.cloud ha la posta su Zoho Europa (MX mx.zoho.eu, SPF include:zohomail.eu, DKIM «zmail»).
Le caselle di un dominio usano imappro/smtppro; se la prova fallisce si tenta anche imap/smtp.
"""
import argparse
import imaplib
import json
import re
import smtplib
import ssl
import sys
import time
from datetime import date
from email.message import EmailMessage
from email.utils import formataddr, make_msgid, formatdate
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from d1 import sql, L  # noqa: E402

REPO = Path(__file__).resolve().parents[2]
MAIL = json.loads((REPO / 'src/data/mail-marche.json').read_text())
SEGRETI = Path.home() / '.skinmatch-segreti.env'
SERVER = [('imappro.zoho.eu', 'smtppro.zoho.eu'), ('imap.zoho.eu', 'smtp.zoho.eu')]
NOME = 'Federico Greco · Skinmatch'
PAUSA = 45  # secondi fra un invio e l'altro: una casella nuova che manda a raffica finisce nello spam
GIA_SCRITTE = ('contattata', 'risposto', 'decisa')


def segreti():
    env = {}
    if SEGRETI.exists():
        for riga in SEGRETI.read_text().splitlines():
            m = re.match(r'\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)', riga)
            if m:
                env[m.group(1)] = m.group(2).strip().strip('"\'')
    if not env.get('ZOHO_MAIL') or not env.get('ZOHO_PASSWORD_APP'):
        sys.exit('Mancano ZOHO_MAIL e ZOHO_PASSWORD_APP in ~/.skinmatch-segreti.env (vedi il commento in testa).')
    return env['ZOHO_MAIL'], env['ZOHO_PASSWORD_APP']


# stessa regola dell'admin (Marche.tsx, italiana): sito o email italiani, oppure origine italiana
def italiana(m):
    return bool(re.search(r'\.it(/|$)|/it([-/]|$)', m.get('sito') or '', re.I) or re.search(r'\.it$', m.get('email') or '', re.I)
                or re.search(r'itali', m.get('origine') or '', re.I))


def testo(m):
    t = MAIL['it'] if italiana(m) else MAIL['en']
    metti = lambda x: x.replace('{marca}', m['marca'])
    catalogo = metti(t['gia'] if m['gruppo'] == 'Nel catalogo' else t['nuova'])
    corpo = '\n'.join(catalogo if r == '{catalogo}' else metti(r) for r in t['righe'])
    return metti(t['oggetto']), corpo, 'it' if t is MAIL['it'] else 'en'


def primo_indirizzo(email):
    trovati = re.findall(r'[\w.+-]+@[\w-]+(?:\.[\w-]+)+', email or '')
    return trovati[0] if trovati else None


def messaggio(m, da):
    oggetto, corpo, _ = testo(m)
    msg = EmailMessage()
    msg['From'] = formataddr((NOME, da))
    msg['To'] = primo_indirizzo(m['email'])
    msg['Subject'] = oggetto
    msg['Date'] = formatdate(localtime=True)
    msg['Message-ID'] = make_msgid(domain=da.split('@')[1])
    msg.set_content(corpo)
    return msg


def scelte(args):
    righe = sql("SELECT * FROM marche_studio WHERE email IS NOT NULL AND email <> '' ORDER BY gruppo, marca")
    if args.marche:
        ids = {int(x) for x in args.marche.split(',')}
        righe = [m for m in righe if m['id'] in ids]
    else:
        righe = [m for m in righe if (m.get('stato') or '') not in GIA_SCRITTE]
    if args.gruppo:
        righe = [m for m in righe if m['gruppo'] == args.gruppo]
    righe = [m for m in righe if primo_indirizzo(m['email'])]
    return righe[: args.max] if args.max else righe


def entra_imap(da, pw):
    ultimo = None
    for imap, smtp in SERVER:
        try:
            c = imaplib.IMAP4_SSL(imap, 993)
            c.login(da, pw)
            return c, smtp
        except Exception as e:  # noqa: BLE001
            ultimo = e
    sys.exit(f'IMAP non entra ({type(ultimo).__name__}): controlla la password per le app e che l\'accesso IMAP sia attivo in Zoho.')


def cartella_bozze(c):
    _, caselle = c.list()
    for x in caselle or []:
        r = x.decode(errors='replace')
        if '\\Drafts' in r or re.search(r'"(Drafts|Bozze)"\s*$', r):
            return r.rsplit(' ', 1)[-1].strip('"')
    return 'Drafts'


def main():
    a = argparse.ArgumentParser()
    a.add_argument('azione', choices=['prova', 'elenco', 'bozze', 'invia'])
    a.add_argument('--gruppo')
    a.add_argument('--marche')
    a.add_argument('--max', type=int, default=25)
    a.add_argument('--si', action='store_true', help='per «invia»: il sì di Federico')
    args = a.parse_args()

    if args.azione == 'elenco':
        righe = scelte(args)
        for m in righe:
            print(f"{m['id']:>4}  {testo(m)[2]}  {m['gruppo'][:24]:<24}  {m['marca'][:28]:<28}  {primo_indirizzo(m['email'])}")
        print(f'{len(righe)} marche.')
        return

    da, pw = segreti()
    c, smtp_host = entra_imap(da, pw)
    if args.azione == 'prova':
        bozze = cartella_bozze(c)
        c.logout()
        with smtplib.SMTP_SSL(smtp_host, 465, context=ssl.create_default_context()) as s:
            s.login(da, pw)
        print(f'Zoho ok: IMAP e SMTP entrano ({smtp_host}), cartella delle bozze «{bozze}». Nessuna mail mandata.')
        return

    righe = scelte(args)
    if not righe:
        c.logout()
        print('Nessuna marca da scrivere con questi filtri.')
        return

    if args.azione == 'bozze':
        bozze = cartella_bozze(c)
        for m in righe:
            c.append(bozze, '(\\Draft)', imaplib.Time2Internaldate(time.time()), messaggio(m, da).as_bytes())
            print(f"bozza: {m['marca']} → {primo_indirizzo(m['email'])}")
        c.logout()
        print(f'{len(righe)} bozze in «{bozze}». Si rileggono e si mandano da Zoho; poi «Contattata» in admin › Marche.')
        return

    c.logout()
    if not args.si or not args.marche:
        sys.exit('«invia» manda davvero: servono --marche con gli id scelti e --si (il sì di Federico).')
    oggi = date.today().strftime('%d/%m/%Y')
    with smtplib.SMTP_SSL(smtp_host, 465, context=ssl.create_default_context()) as s:
        s.login(da, pw)
        for i, m in enumerate(righe):
            if i:
                time.sleep(PAUSA)
            s.send_message(messaggio(m, da))
            nota = ((m.get('note') or '') + '\n' if m.get('note') else '') + f'Scritta il {oggi} da {da}.'
            sql(f"UPDATE marche_studio SET stato='contattata', note={L(nota)}, aggiornato_il=datetime('now') WHERE id={int(m['id'])}")
            print(f"mandata: {m['marca']} → {primo_indirizzo(m['email'])}")
    print(f'{len(righe)} mail mandate e segnate «Contattata».')


if __name__ == '__main__':
    main()
