import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StockSprout — Open. Own. Invest.",
  description:
    "StockSprout: open curated packs of real tokenized stocks on Robinhood Chain. Provably-fair reveals, Uniswap v4 settlement, self-custody.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "StockSprout — Open. Own. Invest.",
    description: "Curated packs of real tokenized stocks, settled on-chain.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
