/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  devIndicators: {
    buildActivity: false,
  },
  experimental: {
    optimizeCss: true,
  },
};

module.exports = nextConfig;
