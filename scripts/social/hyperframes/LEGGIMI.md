# I video di Skinmatch con HyperFrames

Dal 23/11/2026 (il PO: «sì» a «hyperframes», «sui video resta per i prossimi, non per quelli già fatti»): i prossimi
video di solo testo e grafica si fanno con HyperFrames, i video coi prodotti e la voce restano su Remotion
(`Agoranomos/social/remotion`, `rendi-skinmatch.mjs`). I video già fatti non si rifanno.

Perché: si scrive in HTML e CSS con i colori e i caratteri del sito, e il controllo automatico (`npm run check`) misura
le aree sicure di TikTok, Reels e Shorts, i tempi di lettura, il contrasto e il movimento prima del render. Nella prova
del 23/11 ha trovato due difetti che a occhio sarebbero passati (una parola sotto i pulsanti di TikTok, l'ultima riga
ferma 1,57 secondi invece di 2). Licenza Apache-2.0.

## Come si fa

1. Copia `modello-testo/` in una cartella nuova e cambia le frasi in `index.html` (le battute, i tempi in `data-start`).
   Le frasi vengono dai testi già riletti da Sofia (risultati del test, Rivista): niente contenuti medici nuovi.
2. `npm run check`: ogni errore si corregge, ogni avviso si guarda. L'area sicura in verticale è 120-888 px in larghezza
   e 288-1248 px in altezza (sotto 840 px si stringe a 780 per la colonna dei pulsanti di TikTok).
3. `npm run render -- --output ../nome.mp4`: 8 secondi si fanno in circa 20 secondi sul Mac.
4. Guarda i fotogrammi (0 s è la miniatura: niente nero, niente logo da solo) prima di metterlo nel piano dei social.

## Niente dati fuori dal Mac

HyperFrames di serie manda statistiche d'uso e un voto a HeyGen dopo ogni render. I comandi del modello hanno già le
variabili che lo spengono (`DO_NOT_TRACK`, `HYPERFRAMES_NO_TELEMETRY`, `HYPERFRAMES_NO_FEEDBACK`,
`HYPERFRAMES_NO_UPDATE_CHECK`, `HYPERFRAMES_NO_CAPTURE_DOTENV`). Non si usa `hyperframes publish`: carica il video sui loro
server. La skill `hyperframes` in `~/.claude/skills` è già senza quelle istruzioni.
