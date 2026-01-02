import type { Metadata, Viewport } from "next";
import { Navigation } from "@/components/Navigation";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ClientSideRouter } from "@/components/ClientSideRouter";
import { PWAInstaller } from "@/components/PWAInstaller";
import { HydrationMarker } from "@/components/HydrationMarker";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://www.diktator.fn.flaatten.org",
  ),
  title: "Diktator - Spelling Practice for Kids",
  description: "A fun spelling practice app for children",
  applicationName: "Diktator",
  manifest: "/manifest.json",
  authors: [{ name: "Diktator Team" }],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  referrer: "strict-origin-when-cross-origin",
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
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-config": "/browserconfig.xml",
    "msapplication-TileColor": "#3b82f6",
    "msapplication-tap-highlight": "no",
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
    <html suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50">
        <HydrationMarker />
        <AuthProvider>
          <LanguageProvider>
            <PWAInstaller />
            <ClientSideRouter />
            <Navigation />
            <main className="pb-8">{children}</main>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
