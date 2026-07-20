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
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
    other: [{ rel: "manifest", url: "/site.webmanifest" }],
  },
  title: {
    default: 'AiDigitalProducts.com',
    template: '%s | AiDigitalProducts.com',
  },
  description:
    'Ready-made AI products that work out of the box. Skip the build — buy the solution. Built by experts, deployed in minutes.',
  openGraph: {
    title: 'AiDigitalProducts.com — The AI Marketplace',
    description:
      'Ready-made AI products that work out of the box. Skip the build — buy the solution. Built by experts, deployed in minutes.',
    url: 'https://aidigitalproducts.com',
    siteName: 'AiDigitalProducts.com',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AiDigitalProducts.com — Skip the Build. Buy the Solution.',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AiDigitalProducts.com — The AI Marketplace',
    description:
      'Ready-made AI products that work out of the box. Skip the build — buy the solution. Built by experts, deployed in minutes.',
    images: ['/og-image.png'],
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