import { redirect } from "next/navigation";

// Retired → the hills Today view. Old client kept as reversible dead code.
export default function TodayPage() {
  redirect("/dashboard/hills/today");
}
