import type { Metadata, Viewport } from "next";
import { Navigation } from "@/components/Navigation";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { FirebaseConnectionStatus } from "@/components/FirebaseConnectionStatus";
import { ClientSideRouter } from "@/components/ClientSideRouter";
import { PWAInstaller } from "@/components/PWAInstaller";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://diktator.gc.flaatten.org",
  ),
  title: "Diktator - Spelling Practice for Kids",
  description: "A fun spelling practice app for children",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon-192x192.svg", sizes: "192x192", type: "image/svg+xml" },
      { url: "/icon-512x512.svg", sizes: "512x512", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.svg", sizes: "180x180", type: "image/svg+xml" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Diktator",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Diktator",
    title: "Diktator - Spelling Practice for Kids",
    description: "A fun spelling practice app for children",
    images: [
      {
        url: "/icon-512x512.svg",
        width: 512,
        height: 512,
        alt: "Diktator Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Diktator - Spelling Practice for Kids",
    description: "A fun spelling practice app for children",
    images: ["/icon-512x512.svg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#3b82f6",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Diktator" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Diktator" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Additional Meta Tags */}
        <meta name="robots" content="index,follow" />
        <meta name="googlebot" content="index,follow" />
        <meta name="author" content="Diktator Team" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />

        {/* Preload critical resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebase.googleapis.com" />
      </head>
      <body className="min-h-screen bg-gray-50 preload">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              setTimeout(() => {
                document.body.classList.remove('preload');
              }, 100);
            `,
          }}
        />
        <AuthProvider>
          <LanguageProvider>
            <PWAInstaller />
            <ClientSideRouter />
            <Navigation />
            <main className="pb-8">{children}</main>
            <FirebaseConnectionStatus />
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
