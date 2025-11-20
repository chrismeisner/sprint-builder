import Link from "next/link";
import PromptSettingsClient from "./PromptSettingsClient";
import DatabaseToolsClient from "./DatabaseToolsClient";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const isAdmin = user?.isAdmin || false;

  const links = [
    { href: "/", label: "Home" },
    { href: "/documents", label: "Documents" },
    { href: "/dashboard/sprint-builder", label: "Sprint Builder" },
    { href: "/dashboard/projects", label: "Past Projects" },
    { href: "/dashboard/deliverables", label: "Deliverables" },
    { href: "/dashboard/sprint-packages", label: "Sprint Packages" },
    { href: "/dashboard/storage-test", label: "Cloud Storage Test" },
    { href: "/ai-test", label: "OpenAI Test" },
  ];

  // Add admin-only links
  if (isAdmin) {
    links.push({ href: "/dashboard/users", label: "User Management" });
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>
      <p className="text-sm opacity-70 mb-6">
        Quick links to available pages:
      </p>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex items-center rounded-md border border-black/10 dark:border-white/15 px-4 py-2 text-sm hover:bg-black/5 dark:hover:bg-white/10 transition"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <PromptSettingsClient />
      <DatabaseToolsClient />
    </div>
  );
}


