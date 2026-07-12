import { redirect } from "next/navigation";

// Retired → the hills Deadlines view (a hill is a milestone). Old client kept as
// reversible dead code.
export default function MilestonesPage() {
  redirect("/dashboard/hills/deadlines");
}
