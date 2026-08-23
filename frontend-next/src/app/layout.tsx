import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/shared/components/navbar/Navbar";
import Footer from "@/shared/components/footer/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "RESILIENCIA VZLA — Respuesta Nacional ante Desastres",
  description: "Plataforma ciudadana unificada y optimizada de coordinación ante sismos y desastres en Venezuela. Reportes en vivo, desaparecidos, refugios, centros de salud y aliados.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable}`}>
      <body style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--color-gray-50)', color: 'var(--color-gray-900)' }}>
        <Navbar />
        <main style={{ flex: 1, paddingTop: 'calc(var(--navbar-height) + 1rem)', paddingBottom: '2rem' }}>
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
