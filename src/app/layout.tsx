import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import BackToTop from "@/components/BackToTop";
import CookieBanner from "@/components/CookieBanner";
import PageTransition from "@/components/PageTransition";
import "./globals.css";
import EmailPopup from "@/components/EmailPopup";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://aidigitalproducts.com"),
  icons: {
    // favicon.ico in app/ is served automatically by Next.js — no entry needed here.
    // Add these once the PNG files are placed in /public:
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [
      { rel: "icon", url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { rel: "icon", url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  title: {
    template: "%s — AI Digital Products",
    default: "AI Digital Products — The Marketplace for AI",
  },
  description:
    "A curated marketplace for AI digital products. Chatbots, voice agents, automations, and more. Built for the new way.",
  openGraph: {
    title: "AI Digital Products — The Marketplace for AI",
    description:
      "A curated marketplace for AI digital products. Chatbots, voice agents, automations, and more. Built for the new way.",
    url: "https://aidigitalproducts.com",
    siteName: "AI Digital Products",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Digital Products — The Marketplace for AI",
    description:
      "A curated marketplace for AI digital products. Chatbots, voice agents, automations, and more. Built for the new way.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body style={{ fontFamily: "var(--font-jakarta), -apple-system, sans-serif" }}>
        <PageTransition>{children}</PageTransition>
        <BackToTop />
        <CookieBanner />
        <EmailPopup />
      </body>
    </html>
  );
}
