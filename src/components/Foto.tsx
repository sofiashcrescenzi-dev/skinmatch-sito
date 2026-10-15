import { immagine } from '@/lib/dati';

// Una foto del marchio per nome (public/immagini/<nome>-1600.webp e -800.webp, preparate da
// Zeno con i crediti in public/immagini/crediti.json). Se il nome non c'è ancora, `riserva`.
// Il «fuoco» di ogni foto (crediti.json) tiene il soggetto dentro il ritaglio, dal telefono al grande.
export default function Foto({ nome, riserva, alt, sizes = '(max-width: 760px) 100vw, 50vw', className = '', priorita = false, credito = false, style }: {
  nome: string; riserva?: string; alt?: string; sizes?: string; className?: string; priorita?: boolean; credito?: boolean; style?: React.CSSProperties;
}) {
  const im = immagine(nome);
  if (!im && !riserva) return <div className={`foto ${className}`} style={style} aria-hidden="true" />;
  return (
    <figure className={`foto ${className}`} style={{ margin: 0, ...style }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={im ? im.src : riserva}
        srcSet={im ? `${im.piccola} 800w, ${im.src} 1600w` : undefined}
        sizes={im ? sizes : undefined}
        alt={alt ?? im?.alt ?? ''}
        loading={priorita ? 'eager' : 'lazy'}
        fetchPriority={priorita ? 'high' : undefined}
        decoding="async"
        style={im?.fuoco ? { objectPosition: im.fuoco } : undefined}
      />
      {credito && im?.autore && (
        <figcaption className="credito" style={{ position: 'absolute', right: 8, bottom: 6, margin: 0, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>
          Foto di {im.autore} su Pexels
        </figcaption>
      )}
    </figure>
  );
}
