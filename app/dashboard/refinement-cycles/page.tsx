import { redirect } from "next/navigation";

// Refinement cycles are unified into Hills (type refinement_cycle). This legacy
// dashboard now redirects into the Hills surface.
export const dynamic = "force-dynamic";

export default function Page() {
  redirect("/dashboard/hills?type=refinement_cycle");
}
