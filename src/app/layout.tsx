import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import NextAuthProvider from "@/components/providers/nextauth-provider";

export const metadata: Metadata = {
  title: "Yesod - Recouvrement de Créances",
  description: "Plateforme SaaS spécialisée dans le recouvrement amiable et judiciaire, pilotée par notre cabinet d'avocats d'affaires.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <NextAuthProvider>
          <Navbar />
          {children}
          <Footer />
        </NextAuthProvider>
      </body>
    </html>
  );
}
