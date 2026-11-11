import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vitalscope",
  description: "Real-user Core Web Vitals monitoring",
};

// Self-hosted at build time. Setting these variables on <html> also makes them Tailwind's font-sans, font-serif and
// font-mono, so the whole app (including screens not redesigned yet) uses Geist and Geist Mono.
const serif = Newsreader({ subsets: ["latin"], weight: ["400"], variable: "--font-serif" });
const sans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-white text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
