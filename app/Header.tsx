import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import Typography from "@/components/ui/Typography";
import Button from "@/components/ui/Button";
import ThemeToggle from "./components/ThemeToggle";
import AdminMenuButton from "./components/AdminMenuButton";

export default async function Header() {
  const user = await getCurrentUser();
  
  // Get user initials for avatar
  const getInitials = (name: string | null | undefined, email: string) => {
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-stroke-muted bg-surface-card backdrop-blur supports-[backdrop-filter]:bg-surface-card">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo/Brand */}
        <div className="flex items-center gap-6">
          {user?.isAdmin ? <AdminMenuButton /> : null}
          <Link href="/" className="flex items-center space-x-2">
            <Typography as="span" scale="subtitle-md" className="tracking-tight">
              Meisner Design
            </Typography>
          </Link>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          {user?.isAdmin ? <ThemeToggle /> : null}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Button as={Link} href="/my-dashboard" variant="secondary" size="sm" className="normal-case tracking-normal">
                  Dashboard
                </Button>
                <Link 
                  href="/profile" 
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-80 transition"
                  title="Profile"
                >
                  {getInitials(user.name, user.email)}
                </Link>
              </>
            ) : (
              <Button as={Link} href="/login" variant="secondary" size="sm" className="normal-case tracking-normal">
                Log in
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

