import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeFi Field Guide — from meme coins outward",
  description:
    "An interactive map of the DeFi ecosystem starting from Solana meme coin trading: liquidity pools, yield farming, looping, cross-DEX arbitrage, perps and futures, RWA, and sinks & faucets.",
  other: {
    "color-scheme": "light dark",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e120f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Azeret+Mono:wght@500;650;700&family=Manrope:wght@500;600;700;800&display=swap"
        rel="stylesheet"
      />
      <body>{children}</body>
    </html>
  );
}
