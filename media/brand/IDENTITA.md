# Skinmatch, l'identità

## L'idea
Due metà che combaciano: la tua pelle e la routine che le serve. Il segno è un cerchio diviso in due, con la metà pesca che scende di poco per mettersi al suo posto: è il momento in cui il test trova il tuo biotipo e i prodotti giusti, ognuno con un'alternativa che costa meno.

## Il nome
- Nel testo si scrive **Skinmatch**: una parola, solo la S maiuscola. Mai «SkinMatch», «Skin Match», «SKINMATCH», «skin-match».
- Nel logo è «skinmatch», minuscolo, ed è un disegno: si usa il file, non si riscrive con un carattere.
- Il sito si scrive skinmatch.it, senza www e senza https nei post e negli stampati.
- Gli articoli li firma «Redazione Skinmatch». Sofia e Federico si chiamano per nome; Sofia non compare mai accanto ai prodotti (codice deontologico dei medici).
- Il bottone principale dice «Fai il test». «Trova il tuo SkinMatch» usa il nome come un nome comune e scrive male il marchio.

## Il tono
Medico ma caldo: come un medico che spiega con calma a chi ha davanti, senza fretta, senza paura e senza promesse.
- Si dà del tu. Frasi corte, verbi concreti, una cosa per frase.
- Le parole tecniche si usano e si spiegano con quelle del glossario (sebo, barriera, disidratata). Niente gergo da pubblicità.
- I cosmetici non curano: si dice solo quello che il produttore può dichiarare. Dove serve un medico lo si scrive, con le ragioni e senza allarmare.
- Gli integratori non sostituiscono una dieta varia né il parere del medico: lo si scrive ogni volta che se ne parla.
- Niente superlativi né parole gonfie («miracoloso», «rivoluzionario», «il segreto di», «eleva la tua routine»), niente punti esclamativi, niente emoji.
- I prezzi si dicono come sono: «costa meno», mai «low cost».

Sì: «Se dopo il lavaggio la pelle tira, il detergente sgrassa troppo.»
No: «Scopri il segreto per una pelle perfetta!»

## Le foto
- Pelle vera e poco ritoccata: pori, lentiggini, rughe e lucido si vedono.
- Persone di età, generi e carnagioni diverse; ci sono uomini e barbe. Niente bambini.
- Luce naturale e morbida, fondi neutri o caldi (grigio, sabbia, pesca), pochi colori accesi.
- Mai malattie in primo piano (acne grave, psoriasi, eczemi), mai camici, mai marchi o etichette leggibili. I prodotti compaiono senza etichetta: flaconi neutri, texture di creme e sieri.
- I toni della pelle non si ritoccano (niente filtri, niente schiariture): si scelgono foto che stanno già bene con la palette.
- Crediti sempre: sul sito «Foto di <autore> su Pexels» con il link alla pagina, sui social nel testo del post («Foto: <autore>, Pexels»). Ogni foto ha la sua riga in `public/immagini/crediti.json`, con il punto da tenere al centro nei ritagli (`fuoco`, da usare come `object-position`).
- **Il gesto della metà**: una foto intera dentro la cornice delle due metà, come in `condivisione-1200x630.png` e `social/post-1-presentazione.png`. La foto resta continua, si sposta solo la cornice. Una volta per pagina (l'apertura) o per post, non su ogni scheda. Funziona con due volti accostati o con un primo piano centrato sulla linea di divisione.

## I file
In `media/brand/`:
- `logo.svg` per fondi chiari, `logo-chiaro.svg` per fondi scuri (inchiostro o foto scure).
- `segno.svg`, `segno-chiaro.svg`: il segno da solo. `segno-512.png`, `segno-1024.png`: lo stesso, su fondo trasparente.
- `favicon.svg` (disegnato sulla griglia dei pixel, cambia colore da solo con il tema scuro), `favicon.ico` e `favicon-16/32/48.png`.
- `icona-180.png` (icona per iPhone), `icona-192.png` e `icona-512.png` (manifest): segno chiaro su fondo inchiostro.
- `avatar-1080.png`: immagine del profilo social (regge il ritaglio tondo).
- `condivisione-1200x630.png`: l'immagine di condivisione predefinita.
- `social/`: tre esempi di post 1080×1350 (presentazione, articolo della Rivista, consiglio a due colonne).

In `media/foto/` gli originali delle foto (3000 px sul lato lungo, per i social); in `public/immagini/` le versioni per il sito (`<nome>-1600.webp` e `<nome>-800.webp`, larghe 1600 e 800 px) e `crediti.json`.

## Per il codice

### Colori
```css
:root {
  --sm-carta: #FBFAF8;             /* fondo pagina */
  --sm-superficie: #FFFFFF;        /* schede, campi */
  --sm-superficie-2: #F2F0EC;      /* blocchi secondari, piede */
  --sm-inchiostro: #1F2E47;        /* testo, titoli, logo */
  --sm-testo-2: #4E5A6A;           /* testo secondario */
  --sm-testo-3: #667080;           /* didascalie, crediti, date */
  --sm-bordo: #DAD6CF;             /* linee sottili, solo decorative */
  --sm-bordo-forte: #7D8796;       /* bordi di campi e controlli */
  --sm-pesca: #EE9E7C;             /* accento: segno, superfici, evidenze. Mai testo su fondo chiaro */
  --sm-pesca-chiara: #FBE4D9;      /* fondo di «costa meno» e delle evidenze */
  --sm-inchiostro-chiaro: #E6EBF2; /* fondo delle note «parlane con il medico» */
  --sm-azione: #1F2E47;            /* bottone principale */
  --sm-sul-azione: #FBFAF8;        /* testo sul bottone principale */
  --sm-sul-pesca: #1F2E47;         /* testo sopra il pesca */
  --sm-fuoco: #1F2E47;             /* anello del focus, 2px con 2px di distacco */
}
@media (prefers-color-scheme: dark) {
  :root {
    --sm-carta: #111A29;
    --sm-superficie: #172236;
    --sm-superficie-2: #1E2B42;
    --sm-inchiostro: #EEF0F3;
    --sm-testo-2: #B3BCC9;
    --sm-testo-3: #8E99A8;
    --sm-bordo: #2E3C55;
    --sm-bordo-forte: #66748A;
    --sm-pesca: #F0A385;           /* sul fondo scuro il pesca può fare testo e link */
    --sm-pesca-chiara: #3A2B29;
    --sm-inchiostro-chiaro: #1E2B42;
    --sm-azione: #F0A385;          /* al buio il bottone principale diventa pesca */
    --sm-sul-azione: #111A29;
    --sm-sul-pesca: #111A29;
    --sm-fuoco: #F0A385;
  }
}
```

Contrasti calcolati (WCAG 2.1; AA chiede 4,5 per il testo, 3 per i bordi dei controlli):

| Coppia | Chiaro | Scuro |
|---|---|---|
| inchiostro su carta | 13,07 | 15,28 |
| inchiostro su superficie | 13,64 | 13,95 |
| inchiostro su superficie-2 | 11,98 | 12,43 |
| testo-2 su carta | 6,72 | 9,10 |
| testo-2 su superficie-2 | 6,16 | 7,40 |
| testo-3 su carta | 4,80 | 6,04 |
| testo-3 su superficie | 5,01 | 5,52 |
| sul-azione su azione | 13,07 | 8,54 |
| sul-pesca su pesca | 6,37 | 8,54 |
| inchiostro su pesca-chiara | 11,17 | 11,81 |
| inchiostro su inchiostro-chiaro | 11,38 | 12,43 |
| bordo-forte su carta | 3,48 | 3,68 |
| bordo-forte su superficie | 3,63 | 3,36 |
| fuoco su carta | 13,07 | 8,54 |
| pesca su carta | 2,05: solo decorazione | 8,54: anche testo |

### Caratteri
- **Titoli: Literata** (TypeTogether per Google), 500 e 600, con l'asse ottico (opsz 7–72) lasciato automatico. È nata per leggere a lungo sullo schermo: seria come una rivista scientifica, morbida nelle curve. Per h1, h2 e i titoli della Rivista; 600 con interlinea 1,08 e spaziatura −0,012em.
- **Testo e interfaccia: Atkinson Hyperlegible Next** (Braille Institute), 400, 500, 700 e corsivo 400. È disegnata perché le lettere non si confondano (I, l e 1; O e 0) anche per chi vede poco: è il lato medico del marchio. Per testo, bottoni, etichette e h3 (700). Le etichette restano in minuscolo, senza maiuscoletto spaziato.
- URL: `https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:ital,wght@0,400;0,500;0,700;1,400&family=Literata:ital,opsz,wght@0,7..72,500..600;1,7..72,500&display=swap`
- Con next/font: `Atkinson_Hyperlegible_Next({ subsets: ['latin', 'latin-ext'], weight: ['400', '500', '700'], style: ['normal', 'italic'], variable: '--sm-font-testo', display: 'swap' })` e `Literata({ subsets: ['latin', 'latin-ext'], style: ['normal', 'italic'], axes: ['opsz'], variable: '--sm-font-titoli', display: 'swap' })` (Literata senza `weight`: con `axes` si carica la variabile).
- Riserve: `Literata, Georgia, 'Times New Roman', serif` e `'Atkinson Hyperlegible Next', system-ui, -apple-system, 'Segoe UI', sans-serif`.
- Misure fluide, dal telefono allo schermo grande:
```css
:root {
  --sm-t-titolo-1: clamp(2rem, 1.45rem + 2.6vw, 3.25rem);
  --sm-t-titolo-2: clamp(1.5rem, 1.2rem + 1.4vw, 2.25rem);
  --sm-t-titolo-3: clamp(1.2rem, 1.08rem + 0.6vw, 1.5rem);
  --sm-t-testo: clamp(1rem, 0.96rem + 0.2vw, 1.125rem);   /* interlinea 1,6 */
  --sm-t-piccolo: clamp(0.875rem, 0.85rem + 0.1vw, 0.9375rem);
}
```

### Raggi e ombre
```css
:root {
  --sm-r-1: 6px;      /* campi, etichette, chip */
  --sm-r-2: 14px;     /* schede, foto, note */
  --sm-r-tondo: 999px; /* solo la barra di navigazione e il bottone principale */
  --sm-ombra-barra: 0 4px 24px rgb(31 46 71 / 0.08); /* l'unica ombra: la barra a pillola */
}
```
Le schede si separano con il colore del fondo (superficie su carta), non con bordo e ombra insieme. Il mezzo disco (`border-radius: 0 999px 999px 0`, o specchiato) si usa come segnaposto degli elenchi quando si confrontano due cose: metà sinistra inchiostro, metà destra pesca.

La cornice delle due metà, con la geometria del segno (la foto non si sposta, `y` decide l'altezza del punto a fuoco):
```html
<svg viewBox="0 0 80.4 82" role="img" aria-label="Due volti accostati: una pelle chiara e una pelle scura">
  <clipPath id="sm-meta"><path d="M38,0A38,38 0 0 0 38,76Z"/><path d="M42.4,6A38,38 0 0 1 42.4,82Z"/></clipPath>
  <image href="/immagini/home-1600.webp" x="0" y="-3" width="80.4" height="120.6" clip-path="url(#sm-meta)"/>
</svg>
```

### Il logo
- Nella barra di navigazione: `logo.svg` alto 22–24 px (circa 146–159 px di larghezza, rapporto 6,63:1); `logo-chiaro.svg` sul tema scuro. Testo alternativo: «Skinmatch».
- Dove vanno i file nel sito: `media/brand/favicon.ico` → `src/app/favicon.ico`; `favicon.svg` → `src/app/icon.svg`; `icona-180.png` → `src/app/apple-icon.png`; `condivisione-1200x630.png` → immagine Open Graph predefinita; `icona-192.png` e `icona-512.png` → manifest; i due loghi in `public/`.
- Spazio libero intorno: almeno metà del diametro del segno.
- Misure minime: logo intero 18 px di altezza; segno da solo 16 px, e sotto i 24 px si usa `favicon.svg`.
- Colori: su fondo chiaro inchiostro e pesca; su fondo scuro carta e pesca; su fondo pesca inchiostro e carta (la metà destra diventa carta). Sulle foto solo dentro una fascia piena, mai sopra la pelle. A un colore solo: tutto inchiostro o tutto carta, il taglio e lo scarto restano.
- La metà pesca sta sempre a destra e un po' più in basso. Non si ruota, non si specchia, non si chiude il taglio, non si allineano le due metà.
- Niente ombre, contorni, sfumature o effetti; non si deforma; non si cambia il carattere della scritta.
