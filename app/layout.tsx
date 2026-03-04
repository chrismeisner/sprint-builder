import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { Inter, Inter_Tight } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Footer from "./components/Footer";
import NavShell from "./NavShell";
import Header from "./Header";
import GoogleAnalytics from "./GoogleAnalytics";
import WireframeModeHydrator from "./WireframeModeHydrator";
import { ToastProvider } from "@/lib/toast-context";
import ToastContainer from "@/components/ui/ToastContainer";
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

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
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
  title: "Chris Meisner Studio",
  description: "Two-week design sprints by Chris Meisner",
  icons: {
    icon: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const themeOverride = cookieStore.get(THEME_OVERRIDE_COOKIE)?.value ?? null;
  const themeMode = normalizeThemeCookie(themeOverride);
  const fontClasses = `${inter.variable} ${interTight.variable} ${akkurat.variable} ${akkuratMono.variable} ${generalGrotesque.variable} ${notoEmoji.variable}`;
  const htmlClassName = `${themeMode === "dark" ? "dark" : ""} ${fontClasses}`.trim();

  // Check if current route manages its own UI chrome
  const headersList = headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isSandbox = pathname.startsWith("/sandboxes/");

  return (
    <html
      lang="en"
      className={htmlClassName}
    >
      <body className="antialiased">
        <ToastProvider>
          <WireframeModeHydrator />
          <GoogleAnalytics />
          {isSandbox ? (
            children
          ) : (
            <>
              <Header />
              <NavShell>{children}</NavShell>
              <Footer />
            </>
          )}
          <ToastContainer />
        </ToastProvider>
      </body>
    </html>
  );
}
