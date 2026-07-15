import { redirect } from "next/navigation";

// Sprint drafts are unified into Hills (type sprint). This legacy dashboard now
// redirects into the Hills surface.
export const dynamic = "force-dynamic";

export default function Page() {
  redirect("/dashboard/hills?type=sprint");
}
