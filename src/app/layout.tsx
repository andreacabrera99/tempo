import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Barlow_Condensed, Barlow, Oswald } from "next/font/google";
import { OverscrollColors } from "./overscroll-colors";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  weight: ["700", "900"],
  subsets: ["latin"],
});

const barlow = Barlow({
  variable: "--font-barlow",
  weight: ["900"],
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  weight: ["700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tempo | Run to Your Rhythm",
  description: "Music that adapts to your pace, mood, and training style.",
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      style={{ backgroundColor: "#54759c" }}
      className={`${geistSans.variable} ${geistMono.variable} ${barlowCondensed.variable} ${barlow.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <OverscrollColors />
        {children}
      </body>
    </html>
  );
}
