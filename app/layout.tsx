import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Instrument_Serif,
  Instrument_Sans,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";

// Display / headings — geometric, distinctive, variable weight.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Editorial accent — used only for italic highlight words in the hero.
const serif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

// Body copy — clean humanist grotesque, less common than Inter.
const sans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// Data / addresses / numbers — terminal feel.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hood Radar — On-chain intelligence for Robinhood Chain launches",
  description:
    "Hood Radar reads live pool flow, wallet relationships, holder concentration and creator behaviour straight from public Robinhood Chain records. No wallet connection, no keys, no paid feeds.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Hood Radar — Find the signal. Read the flow.",
    description:
      "An on-chain research terminal for Robinhood Chain token launches. Built on transparent, public chain data.",
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
      className={`${display.variable} ${serif.variable} ${sans.variable} ${mono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
