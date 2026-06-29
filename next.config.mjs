/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next-app',
  allowedDevOrigins: ['192.168.1.5'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
