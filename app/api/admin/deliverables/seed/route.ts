import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

export async function POST() {
  try {
    await ensureSchema();
    const pool = getPool();

    const deliverables = [
      {
        id: crypto.randomUUID(),
        name: "Typography Scale + Wordmark Logo",
        description: "Essential branding foundation for startups and new products. Perfect for companies just getting started.",
        scope: `• Custom wordmark logo design (3 concepts, 2 revisions)
• Typography scale with 6 weights
• Font pairing recommendations
• Brand usage guidelines PDF
• Logo files in all formats (SVG, PNG, JPG)`,
        category: "Branding",
        default_estimate_points: 5,
        fixed_hours: 8,
        fixed_price: 1200,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Brand Style Guide",
        description: "Comprehensive brand identity system for consistent brand application. Requires existing logo.",
        scope: `• Color palette (primary, secondary, neutrals)
• Typography system and hierarchy
• Logo usage guidelines
• Spacing and layout principles
• Voice and tone guidelines
• Do's and don'ts examples
• 15-20 page style guide PDF`,
        category: "Branding",
        default_estimate_points: 8,
        fixed_hours: 10,
        fixed_price: 1500,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Pitch Deck Template (Branded)",
        description: "For startups ready to pitch investors. Requires existing brand identity (logo + style guide).",
        scope: `• 12 branded slide templates:
  - Cover, Problem, Solution, Market
  - Product, Business Model, Traction
  - Team, Competition, Financials
  - Ask, Contact
• Master slide layouts in Figma
• Brand colors and typography applied
• Icon set and image placeholders
• Export-ready for Google Slides/PowerPoint`,
        category: "Branding",
        default_estimate_points: 3,
        fixed_hours: 6,
        fixed_price: 900,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Business Card Design",
        description: "Professional business cards with your brand identity. Requires existing logo and colors.",
        scope: `• Front and back design
• 2 design concepts
• Print-ready files (CMYK)
• Digital version for email signatures
• Vendor recommendations`,
        category: "Branding",
        default_estimate_points: 2,
        fixed_hours: 4,
        fixed_price: 600,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Social Media Template Kit",
        description: "Ready-to-use social media templates for consistent brand presence. Requires existing brand identity.",
        scope: `• 10 Instagram post templates
• 5 Instagram story templates
• 5 LinkedIn post templates
• 3 Twitter/X header options
• Editable Figma file
• Quick-start guide`,
        category: "Branding",
        default_estimate_points: 5,
        fixed_hours: 8,
        fixed_price: 1200,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Prototype - Level 1 (Basic)",
        description: "Best for concept validation and early stakeholder feedback. Static prototype with basic interactivity.",
        scope: `• Static prototype using HTML/CSS/vanilla JS
• 5-10 screens
• Basic click-through interactivity
• Mobile responsive design
• No backend integration
• Deployed to Vercel/Netlify`,
        category: "Product",
        default_estimate_points: 8,
        fixed_hours: 20,
        fixed_price: 3000,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Prototype - Level 2 (Interactive)",
        description: "Interactive prototype for usability testing and investor demos. Includes state management and routing.",
        scope: `• React + Tailwind CSS
• 10-20 screens with routing
• State management (Context/Zustand)
• Mock data and APIs
• Form validations
• Responsive design (mobile + desktop)
• Deployed to Vercel`,
        category: "Product",
        default_estimate_points: 13,
        fixed_hours: 40,
        fixed_price: 6000,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Prototype - Level 3 (Production-Ready)",
        description: "High-fidelity prototype that can evolve into production code. Full-stack with real backend.",
        scope: `• Next.js + React + TypeScript
• Supabase backend + authentication
• Real database integration
• 20+ screens with full user flows
• API integrations
• Error handling and loading states
• SEO optimization
• Deployment-ready on Vercel`,
        category: "Product",
        default_estimate_points: 21,
        fixed_hours: 80,
        fixed_price: 12000,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Landing Page (Marketing)",
        description: "High-converting landing page for product launches or campaigns. Includes copywriting assistance.",
        scope: `• Single-page responsive design
• Hero, features, testimonials, CTA sections
• Contact form integration
• SEO optimization
• Analytics setup (Google Analytics)
• Deployed to Vercel/Netlify
• Mobile + desktop optimized`,
        category: "Product",
        default_estimate_points: 5,
        fixed_hours: 12,
        fixed_price: 2000,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "UX Audit + Recommendations",
        description: "Expert analysis of existing product with actionable improvements. Perfect before a redesign.",
        scope: `• Heuristic evaluation (Nielsen's 10 principles)
• User flow analysis
• Accessibility review (WCAG guidelines)
• Competitive analysis
• 15-20 page report with screenshots
• Prioritized recommendations
• 1-hour presentation/walkthrough`,
        category: "Product",
        default_estimate_points: 8,
        fixed_hours: 16,
        fixed_price: 2400,
        active: true,
      },
    ];

    let insertedCount = 0;
    const errors: string[] = [];

    for (const d of deliverables) {
      try {
        await pool.query(
          `
          INSERT INTO deliverables (
            id, name, description, scope, category, 
            default_estimate_points, fixed_hours, fixed_price, active
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO NOTHING
        `,
          [
            d.id,
            d.name,
            d.description,
            d.scope,
            d.category,
            d.default_estimate_points,
            d.fixed_hours,
            d.fixed_price,
            d.active,
          ]
        );
        insertedCount++;
      } catch (error) {
        errors.push(`Failed to insert ${d.name}: ${(error as Error).message}`);
      }
    }

    return NextResponse.json({
      ok: true,
      message: `Successfully seeded ${insertedCount} deliverables`,
      total: deliverables.length,
      insertedCount,
      errors: errors.length > 0 ? errors : undefined,
      deliverables: deliverables.map((d) => ({
        name: d.name,
        category: d.category,
        price: d.fixed_price,
        hours: d.fixed_hours,
      })),
    });
  } catch (error: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: (error as Error).message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}

