import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import NavShell from "./NavShell";
import Header from "./Header";
import GoogleAnalytics from "./GoogleAnalytics";
import WireframeModeHydrator from "./WireframeModeHydrator";
import {
  normalizeThemeCookie,
  THEME_OVERRIDE_COOKIE,
} from "@/lib/theme-mode";

// The root layout reads cookies (via NavShell -> getCurrentUser), so force dynamic rendering
export const dynamic = "force-dynamic";

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

const generalGrotesque = localFont({
  src: [
    {
      path: "./fonts/GeneralGrotesque-Thin.otf",
      weight: "100",
      style: "normal",
    },
    {
      path: "./fonts/GeneralGrotesque-ThinItalic.otf",
      weight: "100",
      style: "italic",
    },
    {
      path: "./fonts/GeneralGrotesque-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/GeneralGrotesque-LightItalic.otf",
      weight: "300",
      style: "italic",
    },
    {
      path: "./fonts/GeneralGrotesque-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/GeneralGrotesque-RegularItalic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "./fonts/GeneralGrotesque-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/GeneralGrotesque-BoldItalic.otf",
      weight: "700",
      style: "italic",
    },
    {
      path: "./fonts/GeneralGrotesque-Heavy.otf",
      weight: "900",
      style: "normal",
    },
    {
      path: "./fonts/GeneralGrotesque-HeavyItalic.otf",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-general-grotesque",
  display: "swap",
});

const generalGrotesqueMono = localFont({
  src: [
    {
      path: "./fonts/GeneralGrotesqueMono-Thin.otf",
      weight: "100",
      style: "normal",
    },
    {
      path: "./fonts/GeneralGrotesqueMono-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/GeneralGrotesqueMono-Book.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/GeneralGrotesqueMono-Regular.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/GeneralGrotesqueMono-Demi.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/GeneralGrotesqueMono-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./fonts/GeneralGrotesqueMono-ExtraBold.otf",
      weight: "800",
      style: "normal",
    },
    {
      path: "./fonts/GeneralGrotesqueMono-Heavy.otf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-general-grotesque-mono",
  display: "swap",
});

const notoEmoji = localFont({
  src: [
    {
      path: "./fonts/NotoEmoji-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./fonts/NotoEmoji-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./fonts/NotoEmoji-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./fonts/NotoEmoji-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "./fonts/NotoEmoji-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-noto-emoji",
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
  const cookieStore = cookies();
  const themeOverride = cookieStore.get(THEME_OVERRIDE_COOKIE)?.value ?? null;
  const themeMode = normalizeThemeCookie(themeOverride);
  const fontClasses = `${inter.variable} ${gtAmerica.variable} ${gtAmericaCompressed.variable} ${akkuratLight.variable} ${akkurat.variable} ${akkuratMono.variable} ${generalGrotesque.variable} ${generalGrotesqueMono.variable} ${notoEmoji.variable}`;
  const htmlClassName = `${themeMode === "dark" ? "dark" : ""} ${fontClasses}`.trim();

  return (
    <html
      lang="en"
      className={htmlClassName}
    >
      <body className="antialiased">
        <WireframeModeHydrator />
        <GoogleAnalytics />
        <Header />
        <NavShell>{children}</NavShell>
      </body>
    </html>
  );
}
