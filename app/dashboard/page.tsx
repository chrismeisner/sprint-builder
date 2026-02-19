import Link from "next/link";
import DatabaseToolsClient from "./DatabaseToolsClient";
import UserUploadsClient from "./UserUploadsClient";
import { getCurrentUser } from "@/lib/auth";
import Typography from "@/components/ui/Typography";
import Button from "@/components/ui/Button";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const isAdmin = user?.isAdmin || false;

  const links = [
    { href: "/", label: "Home" },
    { href: "/dashboard/sprint-builder", label: "Sprint Builder" },
    { href: "/dashboard/projects", label: "Past Projects" },
    { href: "/dashboard/deliverables", label: "Deliverables" },
    { href: "/dashboard/sprint-packages", label: "Sprint Packages" },
    { href: "/dashboard/storage-test", label: "Cloud Storage Test" },
  ];

  // Add admin-only links
  if (isAdmin) {
    links.push({ href: "/dashboard/sandboxes", label: "Sandbox Index" });
    links.push({ href: "/dashboard/intake-forms", label: "Intake Forms (Admin)" });
    links.push({ href: "/dashboard/deliverable-templates", label: "Deliverable Templates (Admin)" });
    links.push({ href: "/dashboard/sprint-drafts", label: "Sprint Drafts (Admin)" });
    links.push({ href: "/dashboard/users", label: "User Management" });
    links.push({ href: "/dashboard/workshop-cleanup", label: "Workshop Cleanup (Admin)" });
  }

  return (
    <div className="container max-w-4xl py-10 space-y-10">
      <div className="space-y-2">
        <Typography as="h1" scale="h2">
          Dashboard
        </Typography>
        <Typography as="p" scale="body-sm" className="text-black/70 dark:text-white/70">
          Quick links to available pages:
        </Typography>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {links.map((link) => (
          <Button
            key={link.href}
            as={Link}
            href={link.href}
            variant="secondary"
            className="justify-between text-left"
          >
            <span>{link.label}</span>
            <span className="text-[11px] font-normal normal-case tracking-normal opacity-60">→</span>
          </Button>
        ))}
      </div>

      <UserUploadsClient />
      <DatabaseToolsClient />
    </div>
  );
}


