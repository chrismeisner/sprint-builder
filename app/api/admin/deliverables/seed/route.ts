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
        name: "Executive Summary One-Pager",
        description: "Investor-ready summary that distills the heart of your pitch into a single branded sheet.",
        scope: `• Compresses problem, solution, traction, and ask into one page
• Highlights top metrics, market sizing, and business model
• Includes CTA section plus contact + investor relations info
• Delivered in Figma with export-ready PDF + Google Doc`,
        category: "Branding",
        default_estimate_points: 3,
        fixed_hours: 6,
        fixed_price: 900,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Investor Metrics + FAQ Addendum",
        description: "Fast-follow appendix that answers the most common diligence questions and highlights performance.",
        scope: `• 3-4 data slides covering KPIs, financial model, and roadmap
• 8-10 concise FAQ responses aligned with your deck story
• Highlight cards for GTM, hiring, and fundraising plan
• Delivered as Figma slides + Google Slides export`,
        category: "Branding",
        default_estimate_points: 3,
        fixed_hours: 5,
        fixed_price: 750,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Coming Soon Landing Page",
        description: "Single-scroll launch page that teases your product, collects emails, and sets expectations.",
        scope: `• Hero, teaser copy, feature highlights, and social proof
• Responsive Next.js + Tailwind build deployed to Vercel
• Email capture form with validation + success state
• Basic SEO + analytics (GA4) wired in
• Includes branded imagery or abstract art direction`,
        category: "Product",
        default_estimate_points: 4,
        fixed_hours: 10,
        fixed_price: 1600,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Email Waitlist Automation",
        description: "Capture and nurture early interest with an automated waitlist flow.",
        scope: `• Connects landing page form to ConvertKit/Mailchimp/Loops
• Sets up double opt-in, confirmation, and welcome emails
• Includes segment tags + simple broadcast template
• Provides loom walkthrough + documentation`,
        category: "Product",
        default_estimate_points: 2,
        fixed_hours: 4,
        fixed_price: 600,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Launch Announcement Toolkit",
        description: "Ready-to-post copy and assets for email, LinkedIn, and social to announce what’s coming.",
        scope: `• 3 announcement posts (LinkedIn, X/Twitter, newsletter blurb)
• 3 lightweight graphics sized for major platforms
• Messaging matrix covering CTA variants + positioning angles
• Editable Figma + doc templates`,
        category: "Branding",
        default_estimate_points: 3,
        fixed_hours: 5,
        fixed_price: 800,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Interaction Spec & Build Plan",
        description: "Annotated interaction spec so engineers know exactly how the prototype behaves.",
        scope: `• Click-by-click notes layered on top of the prototype
• Captures empty/error/loading states and motion cues
• Defines technical considerations + component re-use plan
• Includes prioritized build backlog (Now/Next/Later)`,
        category: "Product",
        default_estimate_points: 5,
        fixed_hours: 8,
        fixed_price: 1400,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Usability Test Script & Plan",
        description: "Self-serve research kit to validate the new prototype with 3-5 target users.",
        scope: `• Moderator guide with intro, tasks, and probing questions
• Participant screener criteria + outreach template
• Observation grid + insights capture doc
• Loom walkthrough on how to run the sessions`,
        category: "Product",
        default_estimate_points: 3,
        fixed_hours: 4,
        fixed_price: 600,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Prototype Feedback Integration",
        description: "Implements the highest-value feedback from user tests or stakeholders inside your live prototype.",
        scope: `• Synthesizes feedback themes and prioritizes updates
• Updates flows, content, and components inside the prototype
• Re-validates UX with spot checks across devices
• Ships change log so everyone knows what moved`,
        category: "Product",
        default_estimate_points: 5,
        fixed_hours: 12,
        fixed_price: 2200,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Feature Flow Refinement",
        description: "Adds a net-new flow or ups the fidelity of an existing feature so it’s ready for engineering.",
        scope: `• Maps edge cases for the new or refined feature
• Designs high-fidelity screens + micro-interactions
• Updates design system tokens/components as needed
• Packages assets for handoff (Figma components + exports)`,
        category: "Product",
        default_estimate_points: 5,
        fixed_hours: 10,
        fixed_price: 2000,
        active: true,
      },
      {
        id: crypto.randomUUID(),
        name: "Release Notes & Loom Demo",
        description: "Story-driven walkthrough + written release notes so stakeholders instantly grasp what changed.",
        scope: `• 3-4 minute Loom demo highlighting key updates
• Written release notes with before/after visuals
• Embed-ready summary for Notion, Linear, or email
• Includes next steps + success metrics to watch`,
        category: "Product",
        default_estimate_points: 2,
        fixed_hours: 3,
        fixed_price: 500,
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

