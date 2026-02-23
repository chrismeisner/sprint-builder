import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DeviceSwitcher } from "@/components/device-switcher";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";
import { BottomNav } from "@/components/bottom-nav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Miles",
  description: "Drive smarter. Score every trip.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100`}>
        <KeyboardShortcuts />
        <DeviceSwitcher>
          <div className="flex min-h-dvh flex-col">
            <div className="flex-1 pb-20">{children}</div>
            <BottomNav />
          </div>
        </DeviceSwitcher>
      </body>
    </html>
  );
}
