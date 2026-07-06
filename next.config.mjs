/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === "production";

/** Safely extract the origin (scheme://host:port) from a URL string. */
function toOrigin(url) {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

// connect-src must allow the REST API, the socket.io server (HTTP long-poll
// transport) and its WebSocket upgrade. These come from the public build-time
// env, so the CSP tracks whatever backend the image was built against.
const apiOrigin = toOrigin(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1");
const socketOrigin = toOrigin(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000");
const wsOrigin = socketOrigin ? socketOrigin.replace(/^http/, "ws") : null;

const connectSrc = [...new Set(["'self'", apiOrigin, socketOrigin, wsOrigin].filter(Boolean))].join(" ");

// A pragmatic CSP for a Next.js App Router app without script nonces:
// 'unsafe-inline' is required for Next's inline hydration/bootstrap scripts and
// Tailwind's injected styles. 'unsafe-eval' is intentionally omitted. Upgrade
// path: emit a per-request nonce from middleware and drop 'unsafe-inline' for
// script-src. CSP is only sent in production so it never blocks dev HMR/eval.
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  `connect-src ${connectSrc}`,
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  ...(isProd ? [{ key: "Content-Security-Policy", value: contentSecurityPolicy }] : []),
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
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
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
