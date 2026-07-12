import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentHood — Generate images with AI",
  description:
    "AgentHood: free AI image generator. Describe what you imagine and create images instantly. Fast, free and hassle-free.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "AgentHood — Generate images with AI",
    description: "AI image generation, free.",
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
