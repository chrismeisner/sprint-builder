import { redirect } from "next/navigation";

// Retired → the unified hills dashboard (ideas now live under hills). Old client
// kept as reversible dead code.
export default function IdeaDetailPage() {
  redirect("/dashboard/hills");
}
