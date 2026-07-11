import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentHood — Genera imágenes con IA",
  description:
    "AgentHood: generador de imágenes con IA gratuito. Describe lo que imaginas y crea imágenes al instante. Rápido, gratis y sin complicaciones.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "AgentHood — Genera imágenes con IA",
    description: "Generación de imágenes con IA, gratis.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
