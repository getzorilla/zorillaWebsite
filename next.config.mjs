/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [{ source: '/guide', destination: '/docs#first-automation', permanent: true }]
  },
  /* config options here */
};

export default nextConfig;
