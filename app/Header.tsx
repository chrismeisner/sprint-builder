import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import Typography from "@/components/ui/Typography";
import Button from "@/components/ui/Button";
import ThemeToggle from "./components/ThemeToggle";
import AdminMenuButton from "./components/AdminMenuButton";

export default async function Header() {
  const user = await getCurrentUser();
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
          <div className="flex items-center gap-2">
            {user ? (
              <Button as={Link} href="/profile" variant="secondary" size="sm" className="normal-case tracking-normal">
                {user.email}
              </Button>
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

