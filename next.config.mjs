/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: '.next-app',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
