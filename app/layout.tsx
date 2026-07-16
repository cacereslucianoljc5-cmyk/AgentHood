import type { Metadata } from "next";
import { Archivo, Instrument_Serif, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Robinhood — Rob the rich. Feed the degens.",
  description:
    "An on-chain lottery living on Robinhood Chain, an EVM L2. Every trade taxes the rich and feeds the pot. Every 10 minutes a random buyer robs it all. Pay only with Robinhood ETH, USDC or USDT.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Robinhood — Rob the rich. Feed the degens.",
    description:
      "The 10-minute lottery on Robinhood Chain (EVM L2). Trade $HOOD, fill the pot, rob it all.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${spaceGrotesk.variable} ${instrumentSerif.variable} ${jetbrains.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
