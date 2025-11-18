import Link from "next/link";

export default function NavShell({ children }: { children: React.ReactNode }) {
  const nav = [
    { href: "/dashboard", label: "Admin Home" },
    { href: "/dashboard/projects", label: "Past Projects" },
    { href: "/dashboard/deliverables", label: "Deliverables" },
    { href: "/documents", label: "Documents" },
    { href: "/ai-test", label: "OpenAI Test" },
    { href: "/how-it-works", label: "How it works" },
    { href: "/work", label: "View Portfolio" },
    { href: "/my-sprints", label: "My sprints" },
    { href: "/", label: "Public Home" },
  ];

  return (
    <div className="min-h-screen w-full md:flex md:flex-row">
      <aside className="hidden md:block sticky top-0 h-screen w-64 shrink-0 border-r border-black/10 dark:border-white/15 bg-white dark:bg-black">
        <div className="h-full flex flex-col">
          <div className="px-4 py-4 border-b border-black/10 dark:border-white/15">
            <div className="text-sm font-semibold tracking-wide uppercase opacity-70">
              Admin
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto p-2">
            <ul className="space-y-1">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded-md px-3 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="px-4 py-3 border-t border-black/10 dark:border-white/15 text-xs opacity-60">
            sprint builder
          </div>
        </div>
      </aside>

      <div className="flex-1">
        {/* Mobile top nav */}
        <div className="md:hidden sticky top-0 z-10 border-b border-black/10 dark:border-white/15 bg-white/80 dark:bg-black/80 backdrop-blur">
          <div className="px-4 py-2 flex gap-2 overflow-x-auto">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex shrink-0 items-center rounded-md border border-black/10 dark:border-white/15 px-3 py-1.5 text-xs hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <main>{children}</main>
      </div>
    </div>
  );
}


