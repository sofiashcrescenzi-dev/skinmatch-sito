import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://skinmatch.it"),
  title: "SkinMatch",
  description: "Trova la skincare giusta per te: test pelle e consigli prodotti per fascia di prezzo.",
  alternates: { canonical: "/" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={inter.className}>
        <Header />
        {children}
      </body>
    </html>
  );
}
