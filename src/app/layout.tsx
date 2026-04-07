import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import Ticker from "@/components/Ticker";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Digital Products — The AI Marketplace",
  description:
    "Ready-made AI products that work out of the box. Chatbots, voice agents, automations, content systems, and more — built by experts, deployed in minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body style={{ fontFamily: "var(--font-jakarta), -apple-system, sans-serif" }}>
        <Ticker />
        {children}
      </body>
    </html>
  );
}
