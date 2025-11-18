import { NextResponse } from "next/server";
import { ensureSchema, getPool } from "@/lib/db";

export async function POST() {
  try {
    await ensureSchema();
    const pool = getPool();

    const results = [];

    // Check if Wink project already exists
    const existingWink = await pool.query(
      `SELECT id FROM past_projects WHERE slug = $1`,
      ["wink-smart-home"]
    );

    if (existingWink.rowCount && existingWink.rowCount > 0) {
      results.push({ project: "Wink", status: "already exists", id: existingWink.rows[0].id });
    } else {
      const winkId = crypto.randomUUID();
      const winkProject = {
        id: winkId,
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
      results.push({ project: "Wink", status: "seeded", id: winkId });
    }

    // Check if Glass Door Calculator project already exists
    const existingGlass = await pool.query(
      `SELECT id FROM past_projects WHERE slug = $1`,
      ["glass-door-calculator"]
    );

    if (existingGlass.rowCount && existingGlass.rowCount > 0) {
      results.push({ project: "Glass Door Calculator", status: "already exists", id: existingGlass.rows[0].id });
    } else {
      const glassId = crypto.randomUUID();
      const glassProject = {
        id: glassId,
        title: "Custom Glass Door Quote Calculator",
        slug: "glass-door-calculator",
        description: "Built a browser-based prototype quote calculator for a custom glass door startup to validate their business idea and gather early customer feedback.",
        story: `A glass door startup needed to validate their business model before investing in a full production system. They had a vision for making custom glass door quotes instantly accessible to customers, but needed to test market interest first.

I built an initial browser-based prototype within a few weeks that calculated real-time quotes based on door specifications. The calculator took inputs like dimensions, glass type, hardware options, and frame materials to generate accurate pricing.

The founders used this prototype to meet with potential customers and gather critical feedback. The response was positive, validating their business hypothesis and giving them confidence to move forward.

Based on early customer feedback, I continued iterating on the prototype, refining the user experience and adding requested features. The calculator became sophisticated enough to handle complex configurations while remaining intuitive for non-technical users.

When customers requested quotes, the system integrated with Zapier to automatically send all specifications and contact information to Keap (formerly Infusionsoft), where the client's sales team could follow up and manage the pipeline.

After several months of iteration and customer validation, I successfully handed off the fully-functional prototype to their development team, who scaled it into their production platform. The project proved the value of rapid prototyping for early-stage startups testing their market fit.`,
        year: null,
        involvement_type: "contract",
        project_scale: "startup",
        industry: "construction",
        outcomes: {
          metrics: [
            "Prototype delivered in a few weeks",
            "Successfully validated business hypothesis",
            "Integrated quote capture system with Zapier + Keap",
            "Handed off to development team for production scaling",
          ],
          testimonial: null,
        },
        thumbnail_url: null,
        images: null,
        project_url: null,
        related_deliverable_ids: null,
        published: true,
        featured: false,
        sort_order: 2,
      };

      await pool.query(
        `INSERT INTO past_projects (
          id, title, slug, description, story, year, involvement_type, project_scale, industry,
          outcomes, thumbnail_url, images, project_url, related_deliverable_ids,
          published, featured, sort_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12::jsonb, $13, $14::jsonb, $15, $16, $17)`,
        [
          glassProject.id,
          glassProject.title,
          glassProject.slug,
          glassProject.description,
          glassProject.story,
          glassProject.year,
          glassProject.involvement_type,
          glassProject.project_scale,
          glassProject.industry,
          JSON.stringify(glassProject.outcomes),
          glassProject.thumbnail_url,
          glassProject.images,
          glassProject.project_url,
          glassProject.related_deliverable_ids,
          glassProject.published,
          glassProject.featured,
          glassProject.sort_order,
        ]
      );
      results.push({ project: "Glass Door Calculator", status: "seeded", id: glassId });
    }

    // Check if Frequency Scanner project already exists
    const existingFreq = await pool.query(
      `SELECT id FROM past_projects WHERE slug = $1`,
      ["frequency-scanner-interface"]
    );

    if (existingFreq.rowCount && existingFreq.rowCount > 0) {
      results.push({ project: "Frequency Scanner Interface", status: "already exists", id: existingFreq.rows[0].id });
    } else {
      const freqId = crypto.randomUUID();
      const freqProject = {
        id: freqId,
        title: "Military Frequency Scanner Interface",
        slug: "frequency-scanner-interface",
        description: "Designed and delivered a v1 UI interface for a defense tech startup's frequency scanning product, enabling map-based visualization and dashboard analytics for military applications.",
        story: `A military contractor startup had built sophisticated frequency scanning technology, but their highly technical team lacked the product design expertise to create a usable interface. They had previously worked with a branding agency but needed fast, efficient product work to make their technology accessible.

The product scanned radio frequencies and needed to display precise data both on an interactive map and through a comprehensive dashboard. The challenge was translating complex technical specifications into an intuitive interface that military personnel could use effectively in the field.

I started by thoroughly intaking their technical specs and understanding how their scanning technology worked. Working closely with their engineering team, I designed a v1 interface that balanced technical depth with usability.

The solution featured a map-based visualization showing frequency data geographically, paired with a dashboard that provided detailed analytics and insights. The interface needed to handle real-time data streams while remaining responsive and clear even with high data volumes.

After delivering the initial v1, their internal team was able to implement the design and begin testing with end users. We then spent several weeks iterating based on feedback, refining the interactions and information hierarchy to better serve their users' needs.

The project demonstrated how fast, focused product work can bridge the gap between powerful technology and practical usability—especially critical in defense applications where clarity and speed can be mission-critical.`,
        year: null,
        involvement_type: "contract",
        project_scale: "startup",
        industry: "defense",
        outcomes: {
          metrics: [
            "Delivered working v1 interface from technical specs",
            "Enabled map-based frequency visualization",
            "Implemented real-time dashboard analytics",
            "Successfully integrated by internal technical team",
            "Iterated based on field user feedback",
          ],
          testimonial: null,
        },
        thumbnail_url: null,
        images: null,
        project_url: null,
        related_deliverable_ids: null,
        published: true,
        featured: false,
        sort_order: 3,
      };

      await pool.query(
        `INSERT INTO past_projects (
          id, title, slug, description, story, year, involvement_type, project_scale, industry,
          outcomes, thumbnail_url, images, project_url, related_deliverable_ids,
          published, featured, sort_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12::jsonb, $13, $14::jsonb, $15, $16, $17)`,
        [
          freqProject.id,
          freqProject.title,
          freqProject.slug,
          freqProject.description,
          freqProject.story,
          freqProject.year,
          freqProject.involvement_type,
          freqProject.project_scale,
          freqProject.industry,
          JSON.stringify(freqProject.outcomes),
          freqProject.thumbnail_url,
          freqProject.images,
          freqProject.project_url,
          freqProject.related_deliverable_ids,
          freqProject.published,
          freqProject.featured,
          freqProject.sort_order,
        ]
      );
      results.push({ project: "Frequency Scanner Interface", status: "seeded", id: freqId });
    }

    // Check if Citizen project already exists
    const existingCitizen = await pool.query(
      `SELECT id FROM past_projects WHERE slug = $1`,
      ["citizen-confidential-initiative"]
    );

    if (existingCitizen.rowCount && existingCitizen.rowCount > 0) {
      results.push({ project: "Citizen", status: "already exists", id: existingCitizen.rows[0].id });
    } else {
      const citizenId = crypto.randomUUID();
      const citizenProject = {
        id: citizenId,
        title: "Citizen - Confidential Initiative",
        slug: "citizen-confidential-initiative",
        description: "Brought on as an independent contractor to design the interface and onboarding experience for a top-secret new initiative, working directly with C-level executives in a rapid iteration cycle.",
        story: `Citizen, a well-known safety and awareness platform, was exploring a confidential new initiative that required a fresh interface and onboarding experience. They needed someone who could move fast, think strategically, and work directly with their executive leadership.

I was brought on as an independent contractor to conceptualize and design the complete user experience for this new product direction. The stakes were high—this was a top-priority initiative with significant strategic implications for the company.

Working directly with C-level executives, I led rapid design sprints to explore different approaches to the interface and onboarding flow. The process required balancing multiple executive perspectives while maintaining a coherent user experience vision.

The fast-paced, high-level nature of the work meant presentations and iterations happened quickly. I needed to synthesize feedback from various stakeholders, translate strategic goals into tangible interface decisions, and present polished concepts on tight timelines.

Throughout the engagement, I created comprehensive interface designs, detailed onboarding flows, and interactive prototypes that helped leadership visualize and refine their vision for the initiative.

While the project ultimately remained confidential and was never released to the public, the work demonstrated the value of bringing in specialized product expertise for high-stakes strategic initiatives. The rapid iteration process allowed the executive team to make informed decisions about the product direction before committing significant development resources.`,
        year: null,
        involvement_type: "contract",
        project_scale: "growth-stage",
        industry: "consumer-tech",
        outcomes: {
          metrics: [
            "Designed complete interface and onboarding experience",
            "Worked directly with C-level executives",
            "Delivered rapid iteration cycles with executive feedback",
            "Created comprehensive design system for new initiative",
            "Provided strategic product expertise for high-stakes project",
          ],
          testimonial: null,
        },
        thumbnail_url: null,
        images: null,
        project_url: null,
        related_deliverable_ids: null,
        published: true,
        featured: false,
        sort_order: 4,
      };

      await pool.query(
        `INSERT INTO past_projects (
          id, title, slug, description, story, year, involvement_type, project_scale, industry,
          outcomes, thumbnail_url, images, project_url, related_deliverable_ids,
          published, featured, sort_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12::jsonb, $13, $14::jsonb, $15, $16, $17)`,
        [
          citizenProject.id,
          citizenProject.title,
          citizenProject.slug,
          citizenProject.description,
          citizenProject.story,
          citizenProject.year,
          citizenProject.involvement_type,
          citizenProject.project_scale,
          citizenProject.industry,
          JSON.stringify(citizenProject.outcomes),
          citizenProject.thumbnail_url,
          citizenProject.images,
          citizenProject.project_url,
          citizenProject.related_deliverable_ids,
          citizenProject.published,
          citizenProject.featured,
          citizenProject.sort_order,
        ]
      );
      results.push({ project: "Citizen", status: "seeded", id: citizenId });
    }

    // Check if Text Tarot project already exists
    const existingTextTarot = await pool.query(
      `SELECT id FROM past_projects WHERE slug = $1`,
      ["text-tarot"]
    );

    if (existingTextTarot.rowCount && existingTextTarot.rowCount > 0) {
      results.push({ project: "Text Tarot", status: "already exists", id: existingTextTarot.rows[0].id });
    } else {
      const textTarotId = crypto.randomUUID();
      const textTarotProject = {
        id: textTarotId,
        title: "Text Tarot - AI SMS Tarot Reader",
        slug: "text-tarot",
        description: "Prototyped an SMS-based tarot reading service where users text a number to receive AI-generated personalized tarot readings with card images delivered via SMS.",
        story: `Text Tarot began as an exploration of making mystical experiences accessible through everyday technology. The concept was simple but engaging: anyone could text a phone number and receive a personalized tarot reading, complete with card imagery and AI-generated interpretation, all through SMS.

The technical challenge was building a system that felt magical while being technically sound. Users would send an SMS to request a reading, and our custom tarot AI would randomly select cards and generate unique, contextual readings tailored to the user's query.

The randomization was intentionally pure—we embraced the traditional tarot philosophy that the cards you receive are the ones you're meant to get. The AI then crafted personalized interpretations of each card, considering the position, the question context, and the traditional meanings to deliver readings that felt authentic and meaningful.

The SMS delivery mechanism made the experience delightfully accessible—no app downloads, no sign-ups, just text and receive. Each reading included the card image delivered via MMS along with the AI-generated interpretation, making the experience rich and visual even on a basic text messaging platform.

The prototype successfully demonstrated how AI and traditional SMS infrastructure could combine to create engaging, accessible experiences. It was an exercise in making something traditionally esoteric feel immediate and personal through thoughtful product design and modern technology.`,
        year: null,
        involvement_type: "prototype",
        project_scale: "side-project",
        industry: "consumer-tech",
        outcomes: {
          metrics: [
            "Built functional SMS-to-tarot-reading pipeline",
            "Custom AI for generating unique tarot interpretations",
            "Delivered card images and readings via MMS/SMS",
            "Zero-friction user experience (text-only interface)",
            "Demonstrated AI + traditional communications tech integration",
          ],
          testimonial: null,
        },
        thumbnail_url: null,
        images: null,
        project_url: null,
        related_deliverable_ids: null,
        published: true,
        featured: false,
        sort_order: 6,
      };

      await pool.query(
        `INSERT INTO past_projects (
          id, title, slug, description, story, year, involvement_type, project_scale, industry,
          outcomes, thumbnail_url, images, project_url, related_deliverable_ids,
          published, featured, sort_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12::jsonb, $13, $14::jsonb, $15, $16, $17)`,
        [
          textTarotProject.id,
          textTarotProject.title,
          textTarotProject.slug,
          textTarotProject.description,
          textTarotProject.story,
          textTarotProject.year,
          textTarotProject.involvement_type,
          textTarotProject.project_scale,
          textTarotProject.industry,
          JSON.stringify(textTarotProject.outcomes),
          textTarotProject.thumbnail_url,
          textTarotProject.images,
          textTarotProject.project_url,
          textTarotProject.related_deliverable_ids,
          textTarotProject.published,
          textTarotProject.featured,
          textTarotProject.sort_order,
        ]
      );
      results.push({ project: "Text Tarot", status: "seeded", id: textTarotId });
    }

    // Check if PickUp project already exists
    const existingPickUp = await pool.query(
      `SELECT id FROM past_projects WHERE slug = $1`,
      ["pickup-sports-engagement"]
    );

    if (existingPickUp.rowCount && existingPickUp.rowCount > 0) {
      results.push({ project: "PickUp", status: "already exists", id: existingPickUp.rows[0].id });
    } else {
      const pickUpId = crypto.randomUUID();
      const pickUpProject = {
        id: pickUpId,
        title: "PickUp - Sports Engagement Platform",
        slug: "pickup-sports-engagement",
        description: "Co-founded a sports fan engagement platform that converted conversations into quantifiable \"props\" distributed across 100+ publishers, raising pre-seed and Series A funding while reaching 7.1M users.",
        story: `In 2018, as sports betting began legalizing across the US, I co-founded PickUp to solve a fundamental problem: fans were hungry for deeper engagement, but media and businesses weren't meeting them there. Fan experiences were fragmented—conversations happened in one place, content consumption in another, and fan sentiment was lost in text message chains and walled gardens.

We started with an iOS app for sports predictions, but quickly learned that distribution and user acquisition were major challenges. The real insight came when we recognized that sports publishers already had the audience we needed—they just lacked engagement tools to capture first-party data and monetize that engagement.

We pivoted to build a WordPress plugin that converted fan conversations into quantifiable "props" (predictions) that could be embedded directly into articles. A writer covering "Will the Lakers make the 2021 Finals?" could add a PickUp prop right in the article. Fans would make their pick, verify with their mobile number, and immediately start earning points—no downloads or sign-up forms required.

The platform was designed for distribution and scale. We built technology that extracted the most timely, relevant sports topics and transformed them into playable propositions distributed across the sports ecosystem. The fan-first approach meant simple, low-barrier entry that met fans wherever they already were, making adoption frictionless.

The business model created a three-way value exchange: publishers got 1:55 average engagement time per article and deeper metrics, fans earned points they could redeem in our marketplace for rewards from brand partners, and sponsors got access to qualified, engaged users with quantifiable sentiment data.

We successfully raised pre-seed and Series A funding and scaled to over 100 publisher partners, including Sports Illustrated, USA Today, The Lead, MMA Junkie, 49ers Hive, and Raptors Cage. We secured affiliate deals with DraftKings and formed strategic partnerships with major brands including PointsBet, Fanatics, NASCAR, Rogers, Comcast, and Xfinity.

At our peak, the platform created 6,795 props that generated 582,275 picks across 8,563 articles, reaching 7.1M users. The metrics validated our thesis that embedded engagement tools could drive meaningful time-on-site and capture valuable first-party sentiment data.

Scaling remotely during COVID presented unique challenges, but we adapted and continued growing our publisher network and brand partnerships. However, by 2022, the sports betting market had become increasingly saturated. Despite coming close to an acquisition, we ultimately couldn't close a deal and made the difficult decision to wind down operations.

While PickUp didn't end with an exit, the four-year journey taught invaluable lessons about product-market fit, the importance of pivoting based on market feedback, and the challenges of timing in rapidly evolving markets. The experience of building and scaling a venture-backed startup from the ground up was transformative.`,
        year: 2018,
        involvement_type: "co-founder",
        project_scale: "startup",
        industry: "sports-tech",
        outcomes: {
          metrics: [
            "Co-founded and led product development (2018-2022)",
            "Raised pre-seed and Series A funding",
            "Scaled to 100+ publisher partners including Sports Illustrated & USA Today",
            "6,795 props created generating 582K picks across 8,563 articles",
            "7.1M users reached with 1:55 average engagement time per article",
            "Secured partnerships with DraftKings, PointsBet, Fanatics, NASCAR, Rogers, Comcast",
            "Built first-party sentiment data platform for sports publishers",
            "Scaled full-time remote team during COVID",
          ],
          testimonial: null,
        },
        thumbnail_url: null,
        images: null,
        project_url: null,
        related_deliverable_ids: null,
        published: true,
        featured: true,
        sort_order: 5,
      };

      await pool.query(
        `INSERT INTO past_projects (
          id, title, slug, description, story, year, involvement_type, project_scale, industry,
          outcomes, thumbnail_url, images, project_url, related_deliverable_ids,
          published, featured, sort_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12::jsonb, $13, $14::jsonb, $15, $16, $17)`,
        [
          pickUpProject.id,
          pickUpProject.title,
          pickUpProject.slug,
          pickUpProject.description,
          pickUpProject.story,
          pickUpProject.year,
          pickUpProject.involvement_type,
          pickUpProject.project_scale,
          pickUpProject.industry,
          JSON.stringify(pickUpProject.outcomes),
          pickUpProject.thumbnail_url,
          pickUpProject.images,
          pickUpProject.project_url,
          pickUpProject.related_deliverable_ids,
          pickUpProject.published,
          pickUpProject.featured,
          pickUpProject.sort_order,
        ]
      );
      results.push({ project: "PickUp", status: "seeded", id: pickUpId });
    }

    return NextResponse.json(
      { message: "Projects seeded successfully", results },
      { status: 201 }
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: (error as Error).message ?? "Unknown error" },
      { status: 500 }
    );
  }
}

