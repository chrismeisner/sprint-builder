import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { DeviceSwitcher } from "@/components/device-switcher";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";

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
        <DeviceSwitcher>{children}</DeviceSwitcher>
      </body>
    </html>
  );
}
