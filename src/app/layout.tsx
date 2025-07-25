import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { AuthProvider } from "@/contexts/AuthContext";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StoreCalendar - Turn Shopify Products Into Social Media Gold",
  description: "Generate 7 different social media caption styles for your Shopify products. No more writer's block. No more boring posts.",
  keywords: ["shopify", "social media", "captions", "ai", "content generation", "ecommerce"],
  authors: [{ name: "StoreCalendar" }],
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' }
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: "StoreCalendar - Turn Shopify Products Into Social Media Gold",
    description: "Generate 7 different social media caption styles for your Shopify products instantly.",
    type: "website",
    url: "https://storecalendar.ai",
    siteName: "StoreCalendar",
  },
  twitter: {
    card: "summary_large_image",
    title: "StoreCalendar - Turn Shopify Products Into Social Media Gold",
    description: "Generate 7 different social media caption styles for your Shopify products instantly.",
  },
  robots: {
    index: true,
    follow: true,
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <GoogleAnalytics />
        <AuthProvider>
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
