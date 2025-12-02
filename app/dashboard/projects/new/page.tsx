import Link from "next/link";
import ProjectFormClient from "../ProjectFormClient";

export default function NewProjectPage() {
  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-6">
        <Link
          href="/dashboard/projects"
          className="inline-flex items-center text-sm opacity-70 hover:opacity-100 transition"
        >
          ← Back to projects
        </Link>
      </div>
      
      <h1 className="text-2xl font-semibold mb-6">Create New Project</h1>
      
      <ProjectFormClient mode="create" />
    </div>
  );
}

