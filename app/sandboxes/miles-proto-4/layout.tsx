import Script from "next/script";
import type { Metadata } from "next";
import { Inter, Overpass_Mono } from "next/font/google";
import { DeviceSwitcher } from "@/app/sandboxes/miles-proto-4/_components/device-switcher";
import { KeyboardShortcuts } from "@/app/sandboxes/miles-proto-4/_components/keyboard-shortcuts";
import { AppHeader } from "@/app/sandboxes/miles-proto-4/_components/app-header";
import { BottomNav } from "@/app/sandboxes/miles-proto-4/_components/bottom-nav";
import { PageTransition } from "@/app/sandboxes/miles-proto-4/_components/page-transition";
import { MilesSheetProvider } from "@/app/sandboxes/miles-proto-4/_components/miles-sheet";
import { ForceLightMode } from "@/app/sandboxes/miles-proto-4/_components/force-light-mode";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-miles-sans",
  display: "swap",
});

const overpassMono = Overpass_Mono({
  subsets: ["latin"],
  variable: "--font-overpass-mono",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"
  ),
  title: "Miles",
  description: "Drive smarter. Score every trip.",
  icons: {
    icon: "/miles-proto-4/miles-icon.svg",
    apple: "/miles-proto-4/miles-icon.svg",
  },
  openGraph: {
    title: "Miles",
    description: "Drive smarter. Score every trip.",
    images: [
      {
        url: "/miles-proto-4/images/scene-01.jpg",
        width: 1200,
        height: 630,
        alt: "Miles — Drive smarter",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Miles",
    description: "Drive smarter. Score every trip.",
    images: ["/miles-proto-4/images/scene-01.jpg"],
  },
};

export default function MilesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20,300,0..1,0" />
    <Script src="https://mcp.figma.com/mcp/html-to-design/capture.js" strategy="afterInteractive" />
    <div
      className={`${inter.variable} ${overpassMono.variable} font-sans antialiased bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100`}
      style={{ fontFamily: "var(--font-miles-sans), ui-sans-serif, system-ui, sans-serif" }}
    >
      <ForceLightMode />
      <KeyboardShortcuts />
      <DeviceSwitcher>
        <MilesSheetProvider>
          <div className="flex min-h-dvh flex-col">
            <AppHeader />
            <PageTransition>{children}</PageTransition>
            <BottomNav />
          </div>
        </MilesSheetProvider>
      </DeviceSwitcher>
    </div>
    </>
  );
}
