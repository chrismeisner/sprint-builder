import { redirect } from "next/navigation";

// Retired → the hills Activity feed. Old client kept as reversible dead code.
export default function ActivityPage() {
  redirect("/dashboard/hills/activity");
}
