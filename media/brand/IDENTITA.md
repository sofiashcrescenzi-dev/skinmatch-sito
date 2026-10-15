# L'identità di Skinmatch

Disegnata da Zeno il 15/10/2026 (logo, segno, icone, foto, post); messa per iscritto da Jarvis la stessa notte,
quando il turno di Zeno si è fermato prima di scriverla. Zeno la completa al prossimo giro.

## L'idea
Due metà che si incontrano: la tua pelle e la routine giusta. Il segno è un cerchio diviso in due mezzelune
sfalsate, blu notte e pesca; il nome si scrive **skinmatch**, tutto minuscolo nel logo, «Skinmatch» nei testi.
Medico ma caldo: niente estetica da farmacia, niente lusso finto.

## Il tono
Chiaro e preciso, da medico che spiega a un paziente: frasi corte, parole di tutti i giorni, i termini tecnici con
la «i» del glossario. Niente promesse e niente diagnosi; i cosmetici non curano. Si parla al «tu».
L'immagine di Sofia non accompagna i prodotti (codice deontologico): il marchio è Skinmatch.

## Le foto
Pelle vera e poco ritoccata, luce naturale, età, generi e carnagioni diverse (anche uomini e barba). Niente
malattie, niente camici, niente marchi visibili. Originali in `media/foto/` (≥2400 px), per il sito
`public/immagini/<nome>-1600.webp` e `-800.webp`, crediti in `public/immagini/crediti.json`.

## Per il codice
- Colori (`src/app/globals.css`, `:root`): blu notte `#1F2E47` (testo e bottoni), pesca `#EE9E7C` (segno,
  barre, decorazioni; mai per testo piccolo), pesca tenue `#FCE9E0`, terra `#A84E2C` (etichette, link, motti),
  fondo `#FAF7F3`, foglio `#FFFFFF`, velo `#F3ECE6`, grigio `#5C6475`. Contrasti AA verificati: notte su fondo
  12,8; grigio su fondo 5,6; terra su fondo 5,2; bianco su notte 13,6.
- Caratteri: **DM Serif Display** 400 (titoli, motti in corsivo) e **IBM Plex Sans** 400-700 (testo), da
  Google Fonts via `next/font` (serviti dal sito).
- Raggi: 16 px le carte, 10 px i riquadri piccoli, pillola per bottoni e filtri.
- Logo: `logo.svg` su fondo chiaro, `logo-chiaro.svg` su fondo scuro; il segno da solo (`segno.svg`,
  `favicon.svg`) sotto i 32 px e come avatar. Spazio libero attorno pari a metà del segno.
- Social: post 1080×1350 su blu notte, foto ritagliata nelle due mezzelune, titolo in DM Serif Display bianco,
  logo in basso a sinistra, skinmatch.it a destra (esempi in `social/`).
