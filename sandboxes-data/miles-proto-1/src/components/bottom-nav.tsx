"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/dashboard",
    label: "Home",
    icon: (active: boolean) => (
      <svg
        className={`size-6 transition-colors ${active ? "text-blue-600 dark:text-blue-400" : "text-neutral-400 dark:text-neutral-500"}`}
        aria-hidden="true"
        fill={active ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        strokeWidth={active ? 0 : 1.5}
        stroke="currentColor"
      >
        {active ? (
          <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
          />
        )}
        {active && (
          <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a.112.112 0 0 0 .091-.086L12 5.432Z" />
        )}
      </svg>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    icon: (active: boolean) => (
      <svg
        className={`size-6 transition-colors ${active ? "text-blue-600 dark:text-blue-400" : "text-neutral-400 dark:text-neutral-500"}`}
        aria-hidden="true"
        fill={active ? "currentColor" : "none"}
        viewBox="0 0 24 24"
        strokeWidth={active ? 0 : 1.5}
        stroke="currentColor"
      >
        {active ? (
          <>
            <path
              fillRule="evenodd"
              d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
              clipRule="evenodd"
            />
          </>
        ) : (
          <>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            />
          </>
        )}
      </svg>
    ),
  },
];

const HIDDEN_ON = new Set(["/", "/signup", "/signup/", "/signup-name", "/signup-name/", "/scan-device", "/scan-device/", "/permissions", "/permissions/", "/billing", "/billing/", "/install", "/install/"]);

export function BottomNav() {
  const pathname = usePathname();

  if (HIDDEN_ON.has(pathname)) return null;

  return (
    <nav
      className="sticky bottom-0 z-50 border-t border-neutral-200/80 bg-white/90 backdrop-blur-xl dark:border-neutral-800/80 dark:bg-neutral-950/90"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex items-center justify-around px-6 py-2">
        {navItems.map(({ href, label, icon }) => {
          const active = pathname === href || (href === "/dashboard" && pathname === "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex min-w-[64px] flex-col items-center gap-1 px-4 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-lg"
            >
              {icon(active)}
              <span
                className={`text-[10px] font-medium leading-none transition-colors ${
                  active
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-neutral-400 dark:text-neutral-500"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
