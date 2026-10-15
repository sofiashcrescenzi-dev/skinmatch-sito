# L'identità di Skinmatch

Direzione **Fototipi**, scelta da Sofia e Federico il 15/10/2026. Disegnata da Zeno; nel codice la porta Jarvis.

## L'idea
La scala di Fitzpatrick: i sei fototipi con cui il dermatologo descrive come la pelle reagisce al sole. I colori del
marchio sono carnagioni vere, dalla più chiara alla più scura, e il segno unisce due fototipi diversi: due metà
che si incontrano, la tua pelle e la routine giusta. Il nome si scrive **skinmatch**, tutto minuscolo nel logo,
«Skinmatch» nei testi. Medico ma caldo: niente estetica da farmacia, niente lusso finto.

## Il segno
Un cerchio diviso in due mezzelune sfalsate (la destra scende di poco). La metà destra è sempre **fototipo IV**;
la sinistra cambia col fondo:
- su chiaro (latte, bianco): **fototipo V** a sinistra, IV a destra (`segno.svg`, `logo.svg`);
- su scuro (cacao, foto scure): **fototipo II** a sinistra, IV a destra (`segno-chiaro.svg`, `logo-chiaro.svg`).
Così a 16 px una metà ha sempre un contrasto forte col fondo (V su latte 6,8; II su cacao 10,0) e l'altra resta
visibile (IV: 3,8 su latte, 4,0 su cacao). `favicon.svg` fa il cambio da solo col tema scuro del sistema.
Mai il segno in un colore solo, mai le due metà dello stesso fototipo, mai ruotato.

## Il tono
Chiaro e preciso, da medico che spiega a un paziente: frasi corte, parole di tutti i giorni, i termini tecnici con
la «i» del glossario. Niente promesse e niente diagnosi; i cosmetici non curano. Si parla al «tu».
L'immagine di Sofia non accompagna i prodotti (codice deontologico): il marchio è Skinmatch.

## Le foto
Pelle vera e poco ritoccata, luce naturale, età, generi e carnagioni diverse (anche uomini e barba): la scala dei
fototipi vale anche per le persone in foto. Niente malattie, niente camici, niente marchi visibili. Originali in
`media/foto/` (≥2400 px), per il sito `public/immagini/<nome>-1600.webp` e `-800.webp`, crediti in
`public/immagini/crediti.json`.

## Per il codice
- Colori (`src/app/globals.css`, `:root`):
  - cacao `#2E1C15` (fototipo VI): testo, bottoni, fondo dell'apertura;
  - latte `#FAF6F4`: fondo della pagina; bianco `#FFFFFF`: carte; velo `#F1E9E4`: fasce e riquadri;
  - fototipo II `#EBC3A6`: metà del segno su scuro, bottone sul fondo scuro, opzione scelta; tenue `#F5E3D7`
    per i riquadri d'avviso;
  - fototipo IV `#A8714E`: metà del segno, barre e forme; come testo solo grande (≥24 px o 19 px grassetto);
  - fototipo V `#7B4B33`: metà del segno su chiaro, etichette, link, motti;
  - grigio caldo `#66574F`: testo secondario; su scuro `#D9C8BE`;
  - la scala completa, solo per la striscia dei sei fototipi: I `#F6DDCC`, II `#EBC3A6`, III `#D29E78`,
    IV `#A8714E`, V `#7B4B33`, VI `#4A2C1F`.
- Contrasti verificati (AA chiede 4,5 per il testo, 3 per testo grande e forme): cacao su latte 15,1; grigio
  caldo su latte 6,4; fototipo V su latte 6,8; latte su cacao 15,1; cacao su fototipo II 10,0; `#D9C8BE` su
  cacao 10,0; fototipo IV su bianco 4,1 (solo testo grande e forme).
- Caratteri, da Google Fonts via `next/font` (serviti dal sito):
  - **Familjen Grotesk** 500 e 700: titoli, logo, cifre grandi. Il nome nel logo è Familjen Grotesk 700,
    convertito in tracciati;
  - **Inclusive Sans** 400 e 700: testo, bottoni, etichette. Nata per essere letta anche con dislessia o vista
    debole.
  Niente corsivi finti: i motti vanno in Inclusive Sans corsivo (esiste) o in Familjen 500 dritto.
- Raggi: 18 px le carte, 14 px i riquadri piccoli, pillola per bottoni e filtri.
- Logo: `logo.svg` su fondo chiaro, `logo-chiaro.svg` su fondo scuro (proporzione circa 7:1, viewBox 560,8 × 80,3);
  il segno da solo (`segno.svg`, `favicon.svg`) sotto i 32 px e come avatar. Spazio libero attorno pari a metà
  del segno.
- Il gesto: l'apertura è scura, color cacao, con la foto tagliata nelle due mezzelune del segno; sotto il titolo,
  la striscia dei sei fototipi (altezza 10-14 px, angoli arrotondati, nessuna etichetta).
- Icone app (`icona-*.png`) e avatar: segno su scuro (II + IV) su fondo cacao.
- Social: post 1080×1350 (salvati a 2160×2700). Presentazione su cacao con la foto nelle due mezzelune e la
  striscia dei fototipi; Rivista su latte con la foto in alto e la mezzaluna IV davanti a «Dalla Rivista»;
  confronti su velo, due carte bianche con la mezzaluna V (sinistra) e IV (destra), avviso medico su tenue.
  Logo in basso a sinistra, indirizzo a destra (esempi in `social/`).
- I file si rigenerano dagli script di Zeno (wordmark da Familjen Grotesk 700, render con Chromium): chiedili
  a Zeno se cambia un colore.
