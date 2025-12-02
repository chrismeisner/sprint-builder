import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import Typography from "@/components/ui/Typography";
import Button from "@/components/ui/Button";

export default async function Header() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-50 w-full border-b border-stroke-muted bg-surface-card backdrop-blur supports-[backdrop-filter]:bg-surface-card">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo/Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center space-x-2">
            <Typography as="span" scale="h3" className="tracking-tight">
              Great Work Studio
            </Typography>
          </Link>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link
              href="/how-it-works"
              className="transition-colors hover:text-brand-primary"
            >
              How We Work
            </Link>
            <Link
              href="/deliverables"
              className="transition-colors hover:text-brand-primary"
            >
              Deliverables
            </Link>
            <Link
              href="/packages"
              className="transition-colors hover:text-brand-primary"
            >
              Packages
            </Link>
          </nav>
          
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

