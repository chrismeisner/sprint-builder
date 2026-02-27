import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { DeviceSwitcher } from "@/app/sandboxes/miles-proto-1/_components/device-switcher";
import { KeyboardShortcuts } from "@/app/sandboxes/miles-proto-1/_components/keyboard-shortcuts";
import { BottomNav } from "@/app/sandboxes/miles-proto-1/_components/bottom-nav";
import { PageTransition } from "@/app/sandboxes/miles-proto-1/_components/page-transition";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-miles-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Miles",
  description: "Drive smarter. Score every trip.",
};

export default function MilesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${inter.variable} font-sans antialiased bg-neutral-100 text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100`}
      style={{ fontFamily: "var(--font-miles-sans), ui-sans-serif, system-ui, sans-serif" }}
    >
      <KeyboardShortcuts />
      <DeviceSwitcher>
        <div className="flex min-h-dvh flex-col">
          <PageTransition>{children}</PageTransition>
          <BottomNav />
        </div>
      </DeviceSwitcher>
    </div>
  );
}
