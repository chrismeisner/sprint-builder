import { redirect } from "next/navigation";

// New client work is scoped as a Hill now. Redirect into the Hills surface,
// preserving the project when provided.
export const dynamic = "force-dynamic";

export default function Page({ searchParams }: { searchParams?: { projectId?: string } }) {
  const q = searchParams?.projectId ? `?projectId=${encodeURIComponent(searchParams.projectId)}` : "";
  redirect(`/dashboard/hills${q}`);
}
