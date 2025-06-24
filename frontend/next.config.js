/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export enabled - all dynamic routes have been migrated to query parameters
  output: "export",
  trailingSlash: false, // Disable trailing slashes to avoid index.html redirects
  distDir: "out", // Standard directory for static exports
  // No asset prefix needed - serving from root domain via load balancer
  assetPrefix: "",
  images: {
    unoptimized: true, // Required for static export
  },
  // Skip build-time static generation for error pages that might cause issues
  skipTrailingSlashRedirect: true,
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
    NEXT_PUBLIC_FIREBASE_API_KEY:
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  },
};

module.exports = nextConfig;
