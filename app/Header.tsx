import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import Button from "@/components/ui/Button";
import ThemeToggle from "./components/ThemeToggle";
import AdminMenuButton from "./components/AdminMenuButton";
import BrowserWidthIndicator from "./components/BrowserWidthIndicator";

export default async function Header() {
  const user = await getCurrentUser();
  
  const getInitials = (
    firstName: string | null | undefined,
    lastName: string | null | undefined,
    email: string
  ) => {
    if (firstName && lastName) {
      return (firstName[0] + lastName[0]).toUpperCase();
    }
    if (firstName) {
      return firstName.slice(0, 2).toUpperCase();
    }
    if (lastName) {
      return lastName.slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  };
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-stroke-muted bg-surface-card backdrop-blur supports-[backdrop-filter]:bg-surface-card">
      <div className="container max-w-6xl flex h-12 items-center justify-between">
        {/* Logo/Brand */}
        <div className="flex items-center gap-3">
          {user?.isAdmin ? <AdminMenuButton /> : null}
          <Link href="/" className="flex items-center">
            <span className="text-base font-semibold leading-none text-text-primary tracking-tight">
              Appliance Studio
            </span>
          </Link>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {user?.isAdmin ? <BrowserWidthIndicator /> : null}
          <ThemeToggle />
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {user.isAdmin && (
                  <Button as={Link} href="/dashboard/tasks" variant="secondary" size="sm" className="normal-case tracking-normal">
                    Tasks
                  </Button>
                )}
                <Button as={Link} href="/projects" variant="secondary" size="sm" className="normal-case tracking-normal">
                  Projects
                </Button>
                <Link 
                  href="/profile" 
                  className="flex size-8 items-center justify-center rounded-full bg-brand-primary text-brand-inverse text-xs font-semibold transition-opacity duration-150 ease-out hover:opacity-80"
                  title="Profile"
                >
                  {getInitials(user.firstName, user.lastName, user.email)}
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

