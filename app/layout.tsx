import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Humanoid Network — Any Robot. Any Task. One Network.",
  description:
    "Humanoid Network (HAN) is the open robotics data and skill hub — a physics-validated motion marketplace powering the next generation of embodied AI. Farm points now ahead of the Q1 2026 TGE.",
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Humanoid Network — Any Robot. Any Task. One Network.",
    description:
      "The Hugging Face for embodied AI. Physics-validated motion data for the global robotics industry.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={display.variable}>
      <body>{children}</body>
    </html>
  );
}
