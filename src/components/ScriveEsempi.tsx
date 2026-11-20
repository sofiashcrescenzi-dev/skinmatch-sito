'use client';

// GLI ESEMPI CHE SI SCRIVONO NEL CAMPO DI RICERCA (20/11/2026, Federico: «skin match lo vedo un po' "statico" […]
// sempre occhio alle performance»). Il campo «Cerco ______» della home scrive da solo, lettera per lettera, le
// ricerche di esempio: dice cosa si può cercare meglio di un segnaposto fermo.
//
// ⚠️ COSTA QUASI NIENTE E NON DISTURBA: cambia solo il segnaposto (nessun testo vero nel campo, nessun layout che
// si muove); gira solo quando il campo è sullo schermo (IntersectionObserver); si ferma per sempre appena qualcuno
// tocca il campo o ci scrive; non parte con «riduci movimento». Senza JavaScript resta «un prodotto», come prima.
import { useEffect } from 'react';

export default function ScriveEsempi({ id, esempi }: { id: string; esempi: string[] }) {
  useEffect(() => {
    const campo = document.getElementById(id) as HTMLInputElement | null;
    if (!campo || !esempi.length) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const iniziale = campo.placeholder;
    let fermo = false, visibile = false, timer: ReturnType<typeof setTimeout> | undefined;
    let n = 0, lettere = 0, cancella = false;
    const passo = () => {
      if (fermo) return;
      if (!visibile) { timer = undefined; return; }
      const parola = esempi[n % esempi.length];
      if (!cancella) {
        lettere += 1;
        campo.placeholder = parola.slice(0, lettere);
        if (lettere >= parola.length) { cancella = true; timer = setTimeout(passo, 1700); return; }
        timer = setTimeout(passo, 55 + Math.random() * 45);
      } else {
        lettere -= 2;
        campo.placeholder = lettere > 0 ? parola.slice(0, lettere) : '';
        if (lettere <= 0) { cancella = false; lettere = 0; n += 1; timer = setTimeout(passo, 380); return; }
        timer = setTimeout(passo, 28);
      }
    };
    const ferma = () => { fermo = true; if (timer) clearTimeout(timer); campo.placeholder = iniziale; };
    const io = new IntersectionObserver(([e]) => {
      visibile = e.isIntersecting;
      if (visibile && !timer && !fermo) timer = setTimeout(passo, 600);
    });
    io.observe(campo);
    campo.addEventListener('focus', ferma, { once: true });
    campo.addEventListener('input', ferma, { once: true });
    return () => { fermo = true; if (timer) clearTimeout(timer); io.disconnect(); campo.removeEventListener('focus', ferma); campo.removeEventListener('input', ferma); };
  }, [id, esempi]);
  return null;
}
