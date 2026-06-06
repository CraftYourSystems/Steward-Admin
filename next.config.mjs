/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';
    const targetUrl = backendUrl.endsWith('/v1') ? backendUrl.slice(0, -3) : backendUrl;
    return [
      {
        source: '/v1/:path*',
        destination: `${targetUrl}/v1/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.com' },
      // QR code generation used in Settings → General (TabGeneral)
      { protocol: 'https', hostname: 'api.qrserver.com' },
    ],
  },
};

export default nextConfig;
