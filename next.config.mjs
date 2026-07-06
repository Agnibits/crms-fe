/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Standalone output for the Docker image (node server.js).
  output: process.env.DOCKER_BUILD ? "standalone" : undefined,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
  eslint: {
    // Lint runs in CI via `npm run lint`; don't block production builds.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
