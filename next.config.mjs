import { createRequire } from "module";
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    const securityHeaders = [
      {
        key: "Content-Security-Policy",
        value:
          "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://api.devnet.solana.com wss://api.devnet.solana.com https://api.elevenlabs.io wss://api.elevenlabs.io https://api.us.elevenlabs.io wss://api.us.elevenlabs.io https://api.eu.residency.elevenlabs.io wss://api.eu.residency.elevenlabs.io https://api.in.residency.elevenlabs.io wss://api.in.residency.elevenlabs.io; media-src 'self' blob: https://api.elevenlabs.io https://api.us.elevenlabs.io https://api.eu.residency.elevenlabs.io https://api.in.residency.elevenlabs.io; frame-src 'self' https://elevenlabs.io https://*.elevenlabs.io; worker-src 'self' blob: https://cdn.jsdelivr.net; manifest-src 'self';",
      },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(self), geolocation=(), payment=(), usb=()",
      },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
    ];

    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        // Hard false — modules never needed in browser
        fs: false,
        net: false,
        tls: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        os: false,
        util: false,
        url: false,
        assert: false,
        worker_threads: false,
        child_process: false,
        dns: false,
        vm: false,
        // `buffer` is used by @solana/web3.js — polyfill with the npm `buffer` package
        crypto: false,
        buffer: require.resolve("buffer/"),
      };

      // Make Buffer available globally so Solana / Metaplex code that does
      // `Buffer.from(...)` without importing it explicitly still works.
      config.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ["buffer", "Buffer"],
        })
      );
    }
    return config;
  },
};

export default nextConfig;
