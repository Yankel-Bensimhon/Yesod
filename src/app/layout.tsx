import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/navbar";

export const metadata: Metadata = {
  title: "Cabinet Yesod - Recouvrement de Créances",
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
        <Navbar />
        {children}
      </body>
    </html>
  );
}
