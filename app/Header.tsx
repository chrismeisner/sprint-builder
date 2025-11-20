import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export default async function Header() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/10 dark:border-white/15 bg-white/95 dark:bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-black/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo/Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-tight">
              sprint builder
            </span>
          </Link>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link
              href="/how-it-works"
              className="transition-colors hover:text-black/80 dark:hover:text-white/80"
            >
              How It Works
            </Link>
          </nav>
          
          <div className="flex items-center gap-2">
            {user ? (
              <Link
                href="/profile"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 border border-black/10 dark:border-white/15 bg-transparent hover:bg-black/5 dark:hover:bg-white/10 h-9 px-4"
              >
                {user.email}
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 border border-black/10 dark:border-white/15 bg-transparent hover:bg-black/5 dark:hover:bg-white/10 h-9 px-4"
              >
                Log in
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

