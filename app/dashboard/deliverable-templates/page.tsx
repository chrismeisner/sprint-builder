import { ensureSchema, getPool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import DeliverableTemplatesClient from "./DeliverableTemplatesClient";

export const dynamic = "force-dynamic";

export default async function DeliverableTemplatesPage() {
  await ensureSchema();
  const pool = getPool();

  const currentUser = await getCurrentUser();
  if (!currentUser?.isAdmin) {
    redirect("/login");
  }

  // Fetch all deliverables with their template data
  const result = await pool.query(`
    SELECT 
      id,
      name,
      description,
      category,
      points,
      scope,
      format,
      slug,
      active,
      template_data,
      presentation_content,
      example_images,
      created_at,
      updated_at
    FROM deliverables
    ORDER BY category, name
  `);

  const deliverables = result.rows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | null,
    category: row.category as string | null,
    points: row.points ? Number(row.points) : null,
    scope: row.scope as string | null,
    format: row.format as string | null,
    slug: row.slug as string | null,
    active: row.active as boolean,
    templateData: row.template_data as Record<string, unknown> | null,
    presentationContent: row.presentation_content as string | null,
    exampleImages: row.example_images as string[] | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }));

  // Group by category without relying on Set iteration (avoids downlevel iteration issues)
  const categories: string[] = [];
  for (const d of deliverables) {
    const category = d.category || "Uncategorized";
    if (!categories.includes(category)) {
      categories.push(category);
    }
  }

  return (
    <DeliverableTemplatesClient 
      deliverables={deliverables} 
      categories={categories}
    />
  );
}

