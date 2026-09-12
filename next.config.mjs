/** @type {import('next').NextConfig} */
const nextConfig = {
  // Sito statico: genera out/, nessun server Node necessario (Cloudflare Workers).
  output: 'export',
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
