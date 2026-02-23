import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import fs from "fs";
import path from "path";

function toLabel(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dashboardDir = path.join(process.cwd(), "app", "dashboard");
  const entries = fs.readdirSync(dashboardDir, { withFileTypes: true });

  const routes: { href: string; label: string }[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const pagePath = path.join(dashboardDir, entry.name, "page.tsx");
    if (fs.existsSync(pagePath)) {
      routes.push({
        href: `/dashboard/${entry.name}`,
        label: toLabel(entry.name),
      });
    }
  }

  routes.sort((a, b) => a.label.localeCompare(b.label));

  return NextResponse.json({ routes });
}
