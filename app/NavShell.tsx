import { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth";
import AdminNavShellClient, { NavItem } from "./AdminNavShellClient";

export default async function NavShell({ children }: { children: ReactNode }) {
  // Check if user is logged in and is an admin
  const user = await getCurrentUser();
  const isAdmin = user?.isAdmin || false;

  // If not an admin, just render children without any nav
  if (!isAdmin) {
    return <>{children}</>;
  }

  const nav: NavItem[] = [
    { href: "/dashboard", label: "🏠 Admin Home" },
    { href: "/dashboard/style-guide", label: "🎨 Style Guide" },
    { href: "/dashboard/components", label: "🧩 Components" },
    { href: "/dashboard/projects", label: "🗂️ Past Projects" },
    { href: "/dashboard/deliverables", label: "📬 Deliverables" },
    { href: "/dashboard/sprint-packages", label: "📦 Sprint Packages" },
    { href: "/dashboard/sprint-drafts", label: "📝 Sprint Drafts" },
    { href: "/dashboard/sprint-builder", label: "🛠️ Sprint Builder" },
    { href: "/dashboard/users", label: "👥 User Management" },
    { href: "/documents", label: "📄 Documents" },
    { href: "/dashboard/theme", label: "🌗 Theme Controls" },
    { href: "/dashboard/how-it-works-writer", label: "✍️ How It Works Writer" },
    { href: "/dashboard/stack", label: "🧱 Stack" },
    { href: "/dashboard/storage-test", label: "💾 Storage Test" },
    { href: "/dashboard/email-test", label: "✉️ Email Test" },
    { href: "/ai-test", label: "🧠 OpenAI Test" },
  ];

  return <AdminNavShellClient nav={nav}>{children}</AdminNavShellClient>;
}


