import type { MetadataRoute } from 'next';

export const dynamic = 'force-static';

// ⚠️ GLI ASSISTENTI SONO BENVENUTI (19/11/2026, Federico: «tutto quello che serve per la geo/seo llm e mcp»): oltre alla
// regola per tutti, i robot delle IA nominati uno per uno, come sugli altri siti. Chi legge per indicizzare
// (GPTBot, ClaudeBot, PerplexityBot…) e chi apre le pagine mentre risponde a una persona (ChatGPT-User, Claude-User,
// Perplexity-User). La versione per loro: /llms.txt, /llms-full.txt e /md/… (src/lib/ia.ts).
const IA = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'anthropic-ai', 'PerplexityBot', 'Perplexity-User',
  'Google-Extended', 'Applebot-Extended', 'Amazonbot', 'Meta-ExternalAgent', 'CCBot', 'cohere-ai', 'MistralAI-User', 'DuckAssistBot'];

export default function robots(): MetadataRoute.Robots {
  const regola = { allow: '/', disallow: ['/admin', '/api/'] };
  return {
    rules: [{ userAgent: '*', ...regola }, { userAgent: IA, ...regola }],
    sitemap: 'https://skinmatch.it/sitemap.xml',
    host: 'https://skinmatch.it',
  };
}
