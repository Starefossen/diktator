import type { Metadata } from "next";
import { Navigation } from "@/components/Navigation";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { FirebaseConnectionStatus } from "@/components/FirebaseConnectionStatus";
import { ClientSideRouter } from "@/components/ClientSideRouter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Diktator - Spelling Practice for Kids",
  description: "A fun spelling practice app for children",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
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
