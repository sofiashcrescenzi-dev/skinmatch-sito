'use client';

import { useEffect } from 'react';

// I link della pagina escono con utm_source della piattaforma (la bio porta ?utm_source=instagram), utm_medium=linkinbio
// e utm_campaign=bio: così i test iniziati dai social si contano (strategia/social/profili.md). La pagina è statica,
// quindi lo fa il browser.
export default function Utm() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const fonte = (q.get('utm_source') || q.get('s') || 'bio').replace(/[^a-z0-9_-]/gi, '').slice(0, 20) || 'bio';
    document.querySelectorAll<HTMLAnchorElement>('a[data-bio]').forEach((a) => {
      const u = new URL(a.getAttribute('href') || '/', window.location.origin);
      if (u.origin !== window.location.origin) return;
      u.searchParams.set('utm_source', fonte);
      u.searchParams.set('utm_medium', 'linkinbio');
      u.searchParams.set('utm_campaign', a.dataset.bio || 'bio');
      a.setAttribute('href', u.pathname + u.search + u.hash);
    });
  }, []);
  return null;
}
