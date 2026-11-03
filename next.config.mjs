import { createRequire } from "module";
const require = createRequire(import.meta.url);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The SDK lazily imports optional @x402 payment packages. Webpack still
  // tries to resolve those, and this app does not sign x402 payments.
  serverExternalPackages: ["@coinbase/cdp-sdk"],
  async headers() {
    const connectSrc =
      "connect-src 'self' https://api.devnet.solana.com wss://api.devnet.solana.com https://api.elevenlabs.io wss://api.elevenlabs.io https://api.us.elevenlabs.io wss://api.us.elevenlabs.io https://api.eu.residency.elevenlabs.io wss://api.eu.residency.elevenlabs.io https://api.in.residency.elevenlabs.io wss://api.in.residency.elevenlabs.io https://api.cdp.coinbase.com https://cca-lite.coinbase.com";
    const mediaSrc =
      "media-src 'self' blob: https://api.elevenlabs.io https://api.us.elevenlabs.io https://api.eu.residency.elevenlabs.io https://api.in.residency.elevenlabs.io";
    const frameSrc =
      "frame-src 'self' https://elevenlabs.io https://*.elevenlabs.io https://secure-wallet.cdp.coinbase.com https://challenges.cloudflare.com";
    const common = [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      connectSrc,
      mediaSrc,
      frameSrc,
      "manifest-src 'self'",
    ];

    // Enforced policy: unchanged from what production runs today (the ElevenLabs widget,
    // Coinbase CDP and Solana wallet code are known to work with it).
    const enforcedCsp = [
      ...common,
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net https://challenges.cloudflare.com",
      "worker-src 'self' blob: https://cdn.jsdelivr.net",
    ].join("; ");

    // Stricter candidate, report-only: no 'unsafe-eval' (only wasm), no unpkg, jsdelivr pinned
    // to the one library the ElevenLabs widget loads. Violations show up in the browser console;
    // once a production session with voice + wallet shows none, promote it to the enforced policy.
    const jsdelivrSampler = "https://cdn.jsdelivr.net/npm/@alexanderolsen/libsamplerate-js@2.1.2/";
    const reportOnlyCsp = [
      ...common,
      `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' ${jsdelivrSampler} https://challenges.cloudflare.com`,
      `worker-src 'self' blob: ${jsdelivrSampler}`,
      "upgrade-insecure-requests",
    ].join("; ");

    const securityHeaders = [
      { key: "Content-Security-Policy", value: enforcedCsp },
      ...(process.env.NODE_ENV === "production"
        ? [
            { key: "Content-Security-Policy-Report-Only", value: reportOnlyCsp },
            { key: "Strict-Transport-Security", value: "max-age=63072000" },
          ]
        : []),
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value:
          "camera=(), microphone=(self), geolocation=(), payment=(), usb=(), serial=(), hid=(), bluetooth=(), display-capture=(), browsing-topics=()",
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
