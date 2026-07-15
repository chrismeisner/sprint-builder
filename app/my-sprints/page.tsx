import { redirect } from "next/navigation";

// A user's client work now lives under their projects (each project lists its
// engagements as hills). Redirect the legacy "my sprints" list to /projects.
export const dynamic = "force-dynamic";

export default function Page() {
  redirect("/projects");
}
