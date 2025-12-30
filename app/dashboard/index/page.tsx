import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listAppPages } from "@/lib/page-inventory";
import Typography from "@/components/ui/Typography";
import IndexTableClient from "./IndexTableClient";

export default async function AdminIndexPage() {
  const user = await getCurrentUser();

  if (!user?.isAdmin) {
    redirect("/dashboard");
  }

  const pages = await listAppPages();

  return (
    <div className="container max-w-5xl py-10 space-y-8">
      <div className="space-y-2">
        <Typography as="h1" scale="h2">
          🔎 Index
        </Typography>
        <Typography as="p" scale="body-sm" className="text-black/70 dark:text-white/70">
          Admin-only inventory of every page route discovered under <code>/app</code>, including ones not linked anywhere.
        </Typography>
        <Typography as="p" scale="body-sm" className="text-black/70 dark:text-white/70">
          Currently showing {pages.length} page{pages.length === 1 ? "" : "s"}.
        </Typography>
      </div>

      <IndexTableClient pages={pages} />
    </div>
  );
}

