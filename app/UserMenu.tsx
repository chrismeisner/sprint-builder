"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type UserMenuProps = {
  email: string;
};

export default function UserMenu({ email }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 border border-black/10 dark:border-white/15 bg-transparent hover:bg-black/5 dark:hover:bg-white/10 h-9 px-4"
      >
        {email}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-56 z-50 rounded-md border border-black/10 dark:border-white/15 bg-white dark:bg-black shadow-lg">
            <div className="p-2 space-y-1">
              <div className="px-3 py-2 text-sm border-b border-black/10 dark:border-white/15">
                <div className="font-medium">Signed in as</div>
                <div className="text-xs opacity-70 truncate">{email}</div>
              </div>
              
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="block w-full text-left px-3 py-2 text-sm rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                My Profile
              </Link>
              
              <Link
                href="/my-sprints"
                onClick={() => setIsOpen(false)}
                className="block w-full text-left px-3 py-2 text-sm rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                My Sprints
              </Link>
              
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition disabled:opacity-50 border-t border-black/10 dark:border-white/15 mt-1 pt-2"
              >
                {isLoggingOut ? "Logging out..." : "Log out"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

