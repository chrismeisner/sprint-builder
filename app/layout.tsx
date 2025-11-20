import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import NavShell from "./NavShell";
import Header from "./Header";
import GoogleAnalytics from "./GoogleAnalytics";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const gtAmerica = localFont({
  src: "./fonts/GT-America-Condensed-Black.otf",
  variable: "--font-gt-america",
  display: "swap",
});

const gtAmericaCompressed = localFont({
  src: [
    {
      path: "./fonts/GT-America-Compressed-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/GT-America-Compressed-Black.otf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-gt-america-compressed",
  display: "swap",
});

const akkuratLight = localFont({
  src: [
    {
      path: "./fonts/AkkuratLightPro-Regular.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/AkkuratLightPro-Italic.otf",
      weight: "300",
      style: "italic",
    },
  ],
  variable: "--font-akkurat-light",
  display: "swap",
});

const akkurat = localFont({
  src: [
    {
      path: "./fonts/AkkuratPro-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/AkkuratPro-Italic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/AkkuratPro-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/AkkuratPro-BoldItalic.otf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-akkurat",
  display: "swap",
});

const akkuratMono = localFont({
  src: "./fonts/Akkurat-Mono.otf",
  variable: "--font-akkurat-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "sprint builder",
  description: "Minimal landing for sprint builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${gtAmerica.variable} ${gtAmericaCompressed.variable} ${akkuratLight.variable} ${akkurat.variable} ${akkuratMono.variable}`}>
      <body className="antialiased">
        <GoogleAnalytics />
        <Header />
        <NavShell>{children}</NavShell>
      </body>
    </html>
  );
}
