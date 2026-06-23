import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Hosts usados pelas imagens de exemplo do preview Horizon UI (/admin/*)
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'i.ibb.co', pathname: '/**' },
      { protocol: 'https', hostname: 'scontent.fotp8-1.fna.fbcdn.net', pathname: '/**' },
    ],
  },
};

export default nextConfig;
