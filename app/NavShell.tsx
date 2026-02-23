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
    { href: "/dashboard/tasks", label: "✅ Tasks" },
    { href: "/dashboard/index", label: "🔎 Index" },
    { href: "/dashboard/style-guide", label: "🎨 Style Guide" },
    { href: "/dashboard/components", label: "🧩 Components" },
    { href: "/dashboard/sandboxes", label: "🧪 Sandboxes" },
    { href: "/dashboard/projects", label: "🗂️ Past Projects" },
    { href: "/dashboard/deliverables", label: "📬 Deliverables" },
    { href: "/dashboard/deliverable-templates", label: "🎯 Deliverable Templates" },
    { href: "/dashboard/sprint-packages", label: "📦 Sprint Packages" },
    { href: "/dashboard/sprint-drafts", label: "📝 Sprint Drafts" },
    { href: "/dashboard/sprint-builder", label: "🛠️ Sprint Builder" },
    { href: "/dashboard/users", label: "👥 User Management" },
    { href: "/dashboard/intake-forms", label: "📄 Intake Forms" },
    { href: "/dashboard/theme", label: "🌗 Theme Controls" },
    { href: "/dashboard/how-it-works-writer", label: "✍️ How It Works Writer" },
    { href: "/dashboard/stack", label: "🧱 Stack" },
    { href: "/dashboard/fade-tester", label: "🌫️ Fade Tester" },
    { href: "/dashboard/storage-test", label: "💾 Storage Test" },
    { href: "/dashboard/email-test", label: "✉️ Email Test" },
    { href: "/dashboard/stripe", label: "💳 Stripe" },
    { href: "/deferred-compensation", label: "🔮 Compensation Calculator" },
    { href: "/api/sandbox-files/styleguide-template/index.html", label: "📐 Styleguide Template", external: true },
  ];

  return <AdminNavShellClient nav={nav}>{children}</AdminNavShellClient>;
}


