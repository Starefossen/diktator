/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export enabled - all dynamic routes have been migrated to query parameters
  output: "export",
  trailingSlash: true, // Disable trailing slashes to avoid index.html redirects
  distDir: "out", // Standard directory for static exports
  // No asset prefix needed - serving from root domain via load balancer
  assetPrefix: "",
  images: {
    unoptimized: true, // Required for static export
  },
  // Skip build-time static generation for error pages that might cause issues
  skipTrailingSlashRedirect: true,
  // PWA configuration
  generateEtags: false,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL || "https://www.diktator.fn.flaatten.org",
    NEXT_PUBLIC_AUTH_MODE: process.env.NEXT_PUBLIC_AUTH_MODE || "mock",
    NEXT_PUBLIC_OIDC_ISSUER_URL: process.env.NEXT_PUBLIC_OIDC_ISSUER_URL || "",
    NEXT_PUBLIC_OIDC_CLIENT_ID: process.env.NEXT_PUBLIC_OIDC_CLIENT_ID || "",
    NEXT_PUBLIC_OIDC_REDIRECT_URI:
      process.env.NEXT_PUBLIC_OIDC_REDIRECT_URI || "",
    NEXT_PUBLIC_OIDC_POST_LOGOUT_REDIRECT_URI:
      process.env.NEXT_PUBLIC_OIDC_POST_LOGOUT_REDIRECT_URI || "",
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },

  // Note: headers() function is not supported with output: "export"
  // Cache control headers are configured in deployment tasks (mise.toml):
  //
  // PWA files:
  // - /sw.js: Cache-Control: public, max-age=0, must-revalidate
  // - /manifest.json: Cache-Control: public, max-age=86400
  //
  // Icons: Cache-Control: public, max-age=31536000, immutable
  // Static assets: Cache-Control: public, max-age=31536000, immutable
  // HTML files: Cache-Control: no-cache, no-store, must-revalidate
  // CSS/JS files: Cache-Control: public, max-age=3600
};

export default nextConfig;
