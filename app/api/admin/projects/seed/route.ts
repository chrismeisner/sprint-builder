import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

export async function POST() {
  try {
    await ensureSchema();
    const pool = getPool();

    // Check if Wink project already exists
    const existing = await pool.query(
      `SELECT id FROM past_projects WHERE slug = $1`,
      ["wink-smart-home"]
    );

    if (existing.rowCount && existing.rowCount > 0) {
      return NextResponse.json(
        { message: "Wink project already exists", id: existing.rows[0].id },
        { status: 200 }
      );
    }

    const id = crypto.randomUUID();
    const winkProject = {
      id,
      title: "Wink - Smart Home Hub",
      slug: "wink-smart-home",
      description: "Led product vision for a unified smart home platform connecting 400+ devices. Partnered with Home Depot and GE, featured in NYTimes, successfully acquired.",
      story: `Wink started as a vision to make smart homes accessible to everyone, not just tech enthusiasts.

Initially hired as a freelance product designer, I was brought on full-time to lead the entire product vision and execution. We faced a fragmented market where every smart device required its own app and ecosystem.

Our solution was a unified hub that could control lights, locks, thermostats, and more from a single, beautifully designed interface. We partnered with major retailers like Home Depot and manufacturers like GE to get Wink hubs into millions of homes.

The challenge was balancing technical complexity with consumer simplicity. We ran extensive user testing with non-technical users to ensure anyone could set up their smart home in under 10 minutes.

The work paid off: We were featured in the New York Times, CES, and major tech publications. Within two years, we supported 400+ connected devices and were successfully acquired.`,
      year: 2015,
      involvement_type: "full-time",
      project_scale: "startup",
      industry: "iot",
      outcomes: {
        metrics: [
          "400+ connected device integrations",
          "Retail partnerships with Home Depot & GE",
          "Featured in New York Times",
          "Successfully acquired",
        ],
        testimonial: null,
      },
      thumbnail_url: null,
      images: null,
      project_url: null,
      related_deliverable_ids: null,
      published: true,
      featured: true,
      sort_order: 1,
    };

    await pool.query(
      `INSERT INTO past_projects (
        id, title, slug, description, story, year, involvement_type, project_scale, industry,
        outcomes, thumbnail_url, images, project_url, related_deliverable_ids,
        published, featured, sort_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12::jsonb, $13, $14::jsonb, $15, $16, $17)`,
      [
        winkProject.id,
        winkProject.title,
        winkProject.slug,
        winkProject.description,
        winkProject.story,
        winkProject.year,
        winkProject.involvement_type,
        winkProject.project_scale,
        winkProject.industry,
        JSON.stringify(winkProject.outcomes),
        winkProject.thumbnail_url,
        winkProject.images,
        winkProject.project_url,
        winkProject.related_deliverable_ids,
        winkProject.published,
        winkProject.featured,
        winkProject.sort_order,
      ]
    );

    return NextResponse.json(
      { message: "Wink project seeded successfully", id },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

