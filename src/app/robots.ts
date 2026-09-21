import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

// Generato staticamente come /robots.txt durante `next build`.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://skinmatch.it/sitemap.xml',
    host: 'https://skinmatch.it',
  };
}
