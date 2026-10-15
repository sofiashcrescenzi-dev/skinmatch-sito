"""Rigenera src/components/Logo.tsx da media/brand/logo-chiaro.svg: il logo incorporato nel menu,
con le due metà del segno marcate (meta-a, meta-b) per l'animazione. Uso: python3 scripts/logo.py"""
import re
from pathlib import Path

R = Path(__file__).resolve().parent.parent
s = (R / 'media/brand/logo-chiaro.svg').read_text()
vb = re.search(r'viewBox="([^"]+)"', s).group(1)
inner = re.sub(r'<title>.*?</title>', '', s[s.index('>') + 1:s.rindex('</svg>')])
p = list(re.finditer(r'<path ', inner))
inner = inner[:p[1].start()] + '<path class="meta-b" ' + inner[p[1].end():]
inner = inner[:p[0].start()] + '<path class="meta-a" ' + inner[p[0].end():]
w, h = [float(x) for x in vb.split()[2:]]
(R / 'src/components/Logo.tsx').write_text(f"""// IL LOGO NEL MENU, incorporato: serve per far allineare le due metà del segno al passaggio
// (animazione 7 di Zeno, 15/10/2026). Generato da media/brand/logo-chiaro.svg con
// scripts/logo.py: se Zeno cambia il logo, si rilancia lo script.
const SVG = {inner!r};

export default function Logo({{ altezza = 22 }}: {{ altezza?: number }}) {{
  return <svg className="logo-segno" viewBox="{vb}" width={{Math.round(altezza * {w / h:.4f})}} height={{altezza}} role="img" aria-label="Skinmatch" dangerouslySetInnerHTML={{{{ __html: SVG }}}} />;
}}
""")
