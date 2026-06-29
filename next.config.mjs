/** @type {import('next').NextConfig} */
const isVercel = process.env.VERCEL === '1'

const nextConfig = {
  distDir: isVercel ? '.next' : process.env.NODE_ENV === 'production' ? '.next-build' : '.next-app',
  allowedDevOrigins: ['192.168.1.5'],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
