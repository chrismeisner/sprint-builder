import { redirect } from "next/navigation";

// Retired: the personal tasks dashboard is unified into the Hill model. Its data
// (admin_ideas / admin_tasks / admin_milestones) is untouched and fully mirrored
// in the hill_* tables; this surface now redirects to /dashboard/hills. The old
// client (./TasksClient) is kept as reversible dead code. See docs/hill-model.md.
export default function TasksPage() {
  redirect("/dashboard/hills");
}
