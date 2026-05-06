/** @type {import('next').NextConfig} */
const isStaticExport = process.env.BUILD_MODE === "export";

const nextConfig = {
  reactStrictMode: true,
  // For Capacitor APK we statically export. For Vercel we run a normal SSR build.
  output: isStaticExport ? "export" : undefined,
  images: {
    unoptimized: isStaticExport,
  },
  trailingSlash: isStaticExport,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
