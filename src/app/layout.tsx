import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BidBase - South African Government Tender Listings",
  description: "Discover and search government tender opportunities across South Africa. Find tenders by province, industry, and keywords with real-time updates and comprehensive filtering.",
  keywords: ["tenders", "government", "South Africa", "procurement", "bidding", "opportunities"],
  authors: [{ name: "BidBase" }],
  creator: "BidBase",
  publisher: "BidBase",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_ZA',
    url: 'https://bidbase.vercel.app',
    title: 'BidBase - South African Government Tender Listings',
    description: 'Discover and search government tender opportunities across South Africa',
    siteName: 'BidBase',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BidBase - South African Government Tender Listings',
    description: 'Discover and search government tender opportunities across South Africa',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
