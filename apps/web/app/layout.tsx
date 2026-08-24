import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Caveat, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kreatr — Your Post-Production, Handled.",
  description:
    "Kreatr is an autonomous post-production agent for creators. One finished video in, a multi-platform publishing workflow out. Built on the Strands Agents SDK and AWS Bedrock.",
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${caveat.variable} ${jetbrains.variable}`}>
      <body className="bg-surface-canvas font-sans text-[#0A0A0A] antialiased">{children}</body>
    </html>
  );
}
