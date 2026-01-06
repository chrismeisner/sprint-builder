import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var _schemaInitialized: boolean | undefined;
  // eslint-disable-next-line no-var
  var _basePointsPatched: boolean | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  // Enable SSL for all environments since most cloud databases require it
  // Set rejectUnauthorized to false to allow self-signed certificates
  return new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

export function getPool(): Pool {
  if (!global._pgPool) {
    global._pgPool = createPool();
  }
  return global._pgPool;
}

export async function ensureSchema(): Promise<void> {
  // Hotfix: ensure sprint_deliverables.base_points supports decimals
  if (!global._basePointsPatched) {
    try {
      const pool = getPool();
      await pool.query(`
        ALTER TABLE sprint_deliverables
        ALTER COLUMN base_points TYPE numeric(10,2) USING base_points::numeric(10,2)
      `);
      global._basePointsPatched = true;
    } catch {
      // Ignore if table/column doesn't exist yet; later schema creation will set type
      global._basePointsPatched = true;
    }
  }

  if (global._schemaInitialized) return;
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id text PRIMARY KEY,
      content jsonb NOT NULL,
      filename text,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query(`
    ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS email text
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ai_responses (
      id text PRIMARY KEY,
      document_id text NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      provider text NOT NULL DEFAULT 'openai',
      model text,
      prompt text,
      response_text text,
      response_json jsonb,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_ai_responses_document_id ON ai_responses(document_id);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sprint_drafts (
      id text PRIMARY KEY,
      document_id text NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      ai_response_id text REFERENCES ai_responses(id) ON DELETE SET NULL,
      draft jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_sprint_drafts_document_id ON sprint_drafts(document_id);
  `);
  
  // Add summary fields to sprint_drafts for easy querying
  await pool.query(`
    ALTER TABLE sprint_drafts
    ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS title text,
    ADD COLUMN IF NOT EXISTS deliverable_count integer DEFAULT 0,
    ADD COLUMN IF NOT EXISTS weeks integer NOT NULL DEFAULT 2,
    ADD COLUMN IF NOT EXISTS total_estimate_points numeric(10,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_fixed_hours numeric(10,2),
    ADD COLUMN IF NOT EXISTS total_fixed_price numeric(10,2),
    ADD COLUMN IF NOT EXISTS updated_at timestamptz,
    ADD COLUMN IF NOT EXISTS start_date date,
    ADD COLUMN IF NOT EXISTS due_date date,
    ADD COLUMN IF NOT EXISTS project_id text,
    ADD COLUMN IF NOT EXISTS package_name_snapshot text,
    ADD COLUMN IF NOT EXISTS package_description_snapshot text;
  `);
  // Defensive: older databases may still have total_estimate_points as integer
  await pool.query(`
    ALTER TABLE sprint_drafts
    ALTER COLUMN total_estimate_points TYPE numeric(10,2)
    USING total_estimate_points::numeric(10,2)
  `);
  await pool.query(`UPDATE sprint_drafts SET weeks = 2 WHERE weeks IS NULL`);
  await pool.query(`
    ALTER TABLE sprint_drafts
    ALTER COLUMN weeks SET DEFAULT 2,
    ALTER COLUMN weeks SET NOT NULL
  `);
  
  // Add indexes for common queries
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_sprint_drafts_status ON sprint_drafts(status);
    CREATE INDEX IF NOT EXISTS idx_sprint_drafts_created ON sprint_drafts(created_at DESC);
  `);
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS deferred_comp_plans (
      id text PRIMARY KEY,
      sprint_id text NOT NULL REFERENCES sprint_drafts(id) ON DELETE CASCADE,
      inputs jsonb NOT NULL,
      outputs jsonb NOT NULL,
      label text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_deferred_comp_plans_sprint_id ON deferred_comp_plans(sprint_id);
  `);

  // Add constraint to validate status values
  // Workflow: draft -> negotiating -> scheduled -> in_progress -> complete
  await pool.query(`
    DO $$ 
    BEGIN
      -- Drop old constraint if it exists
      IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sprint_drafts_status_check'
      ) THEN
        ALTER TABLE sprint_drafts DROP CONSTRAINT sprint_drafts_status_check;
      END IF;
      
      -- Add updated constraint with new statuses
      ALTER TABLE sprint_drafts 
      ADD CONSTRAINT sprint_drafts_status_check 
      CHECK (status IN ('draft', 'negotiating', 'scheduled', 'in_progress', 'complete'));
    END $$;
  `);
  
  // Migrate old statuses to new statuses
  await pool.query(`
    UPDATE sprint_drafts SET status = 'complete' WHERE status = 'completed';
    UPDATE sprint_drafts SET status = 'draft' WHERE status IN ('studio_review', 'pending_client', 'cancelled');
  `);
  
  // Create minimal junction table for sprint → deliverables relationship
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sprint_deliverables (
      id text PRIMARY KEY,
      sprint_draft_id text NOT NULL REFERENCES sprint_drafts(id) ON DELETE CASCADE,
      deliverable_id text NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
      quantity integer NOT NULL DEFAULT 1,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(sprint_draft_id, deliverable_id)
    );
    CREATE INDEX IF NOT EXISTS idx_sprint_deliverables_sprint ON sprint_deliverables(sprint_draft_id);
    CREATE INDEX IF NOT EXISTS idx_sprint_deliverables_deliverable ON sprint_deliverables(deliverable_id);
  `);
  await pool.query(`
    ALTER TABLE sprint_deliverables
    ADD COLUMN IF NOT EXISTS deliverable_name text,
    ADD COLUMN IF NOT EXISTS deliverable_description text,
    ADD COLUMN IF NOT EXISTS deliverable_category text,
    ADD COLUMN IF NOT EXISTS deliverable_scope text,
    ADD COLUMN IF NOT EXISTS base_points numeric(3,1),
    ADD COLUMN IF NOT EXISTS custom_hours numeric(10,2),
    ADD COLUMN IF NOT EXISTS custom_estimate_points numeric(10,2),
    ADD COLUMN IF NOT EXISTS complexity_score numeric(3,1),
    ADD COLUMN IF NOT EXISTS custom_scope text,
    ADD COLUMN IF NOT EXISTS notes text,
    ADD COLUMN IF NOT EXISTS content text,
    ADD COLUMN IF NOT EXISTS attachments jsonb,
    ADD COLUMN IF NOT EXISTS type_data jsonb,
    ADD COLUMN IF NOT EXISTS current_version text DEFAULT '0.0'
  `);

  // Create sprint_deliverable_versions table for version history
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sprint_deliverable_versions (
      id text PRIMARY KEY,
      sprint_deliverable_id text NOT NULL REFERENCES sprint_deliverables(id) ON DELETE CASCADE,
      version_number text NOT NULL,
      type_data jsonb,
      content text,
      notes text,
      saved_by text,
      saved_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(sprint_deliverable_id, version_number)
    );
    CREATE INDEX IF NOT EXISTS idx_sdv_sprint_deliverable ON sprint_deliverable_versions(sprint_deliverable_id);
  `);
  
  // Migrate existing integer versions to text format
  await pool.query(`
    ALTER TABLE sprint_deliverables 
    ALTER COLUMN current_version TYPE text USING 
      CASE 
        WHEN current_version IS NULL OR current_version = 0 THEN '0.0'
        ELSE current_version::text || '.0'
      END
  `).catch(() => {});
  
  await pool.query(`
    ALTER TABLE sprint_deliverable_versions 
    ALTER COLUMN version_number TYPE text USING version_number::text || '.0'
  `).catch(() => {});

  // Ensure base_points supports decimals (some DBs may still have integer type)
  await pool.query(`
    ALTER TABLE sprint_deliverables
    ALTER COLUMN base_points TYPE numeric(10,2) USING base_points::numeric(10,2)
  `);
  // Drop deprecated custom budget column
  await pool.query(`ALTER TABLE sprint_deliverables DROP COLUMN IF EXISTS custom_price`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key text PRIMARY KEY,
      value text,
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS deliverables (
      id text PRIMARY KEY,
      name text NOT NULL,
      description text,
      category text,
      points numeric(3,1) DEFAULT 1.0,
      scope text,
      format text,
      active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_deliverables_active ON deliverables(active);
    CREATE INDEX IF NOT EXISTS idx_deliverables_category ON deliverables(category);
  `);
  // Ensure points column exists for pre-existing tables
  await pool.query(`
    ALTER TABLE deliverables
    ADD COLUMN IF NOT EXISTS points numeric(3,1) DEFAULT 1.0
  `);
  await pool.query(`
    ALTER TABLE deliverables
    ADD COLUMN IF NOT EXISTS format text
  `);
  // Add presentation content for "how we present this deliverable" template
  await pool.query(`
    ALTER TABLE deliverables
    ADD COLUMN IF NOT EXISTS presentation_content text,
    ADD COLUMN IF NOT EXISTS example_images jsonb,
    ADD COLUMN IF NOT EXISTS slug text,
    ADD COLUMN IF NOT EXISTS template_data jsonb UNIQUE
  `);
  // Generate slugs for existing deliverables that don't have one
  await pool.query(`
    UPDATE deliverables 
    SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(name, '[^a-zA-Z0-9\\s-]', '', 'g'), '\\s+', '-', 'g'))
    WHERE slug IS NULL
  `);
  await pool.query(`
    ALTER TABLE deliverables
    ADD COLUMN IF NOT EXISTS default_estimate_points numeric(10,2)
  `);
  await pool.query(`
    UPDATE deliverables
    SET default_estimate_points = points
    WHERE default_estimate_points IS NULL
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS deliverable_tags (
      id text PRIMARY KEY,
      name text NOT NULL UNIQUE,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS deliverable_tag_links (
      deliverable_id text NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
      tag_id text NOT NULL REFERENCES deliverable_tags(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      PRIMARY KEY (deliverable_id, tag_id)
    );
    CREATE INDEX IF NOT EXISTS idx_deliverable_tag_links_tag ON deliverable_tag_links(tag_id);
    CREATE INDEX IF NOT EXISTS idx_deliverable_tag_links_deliverable ON deliverable_tag_links(deliverable_id);
  `);
  // Pricing + resourcing columns used across the app
  await pool.query(`
    ALTER TABLE deliverables
    ADD COLUMN IF NOT EXISTS fixed_hours numeric(10,2),
    ADD COLUMN IF NOT EXISTS fixed_price numeric(12,2)
  `);
  // Ensure points column has desired type/default and backfill nulls
  await pool.query(`
    ALTER TABLE deliverables
    ALTER COLUMN points TYPE numeric(3,1) USING points::numeric(3,1),
    ALTER COLUMN points SET DEFAULT 1.0
  `);
  await pool.query(`UPDATE deliverables SET points = 1.0 WHERE points IS NULL`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id text PRIMARY KEY,
      email text NOT NULL UNIQUE,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  
  // Add is_admin flag to accounts table
  await pool.query(`
    ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;
  `);
  
  // Add name field to accounts table
  await pool.query(`
    ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS name text;
  `);
  
  // Add workshop tracking to accounts table
  await pool.query(`
    ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS workshop_completed_at timestamptz;
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS onboarding_tasks (
      account_id text NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      task_key text NOT NULL,
      status text NOT NULL DEFAULT 'pending',
      metadata jsonb,
      completed_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT onboarding_tasks_status_check CHECK (status IN ('pending','in_progress','submitted','completed')),
      CONSTRAINT onboarding_tasks_pk PRIMARY KEY (account_id, task_key)
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_onboarding_tasks_status ON onboarding_tasks(status);
  `);
  
  // Create index for admin queries
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_accounts_is_admin ON accounts(is_admin);
  `);
  // Projects owned by accounts
  await pool.query(`
    CREATE TABLE IF NOT EXISTS projects (
      id text PRIMARY KEY,
      account_id text REFERENCES accounts(id) ON DELETE SET NULL,
      name text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_projects_account ON projects(account_id);
  `);
  await pool.query(`
    ALTER TABLE projects
    DROP COLUMN IF EXISTS description;
  `);
  // Project membership (share projects by email)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS project_members (
      id text PRIMARY KEY,
      project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      email text NOT NULL,
      added_by_account text REFERENCES accounts(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(project_id, email)
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_project_members_email_lower ON project_members((lower(email)));
  `);
  // Attach FK after table exists
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_sprint_drafts_project'
      ) THEN
        ALTER TABLE sprint_drafts
        ADD CONSTRAINT fk_sprint_drafts_project
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
      END IF;
    END $$;
  `);
  await pool.query(`
    ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS account_id text REFERENCES accounts(id),
    ADD COLUMN IF NOT EXISTS project_id text REFERENCES projects(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS sprint_draft_id text REFERENCES sprint_drafts(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS sprint_deliverable_id text REFERENCES sprint_deliverables(id) ON DELETE SET NULL
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_documents_account_id ON documents(account_id);
    CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
    CREATE INDEX IF NOT EXISTS idx_documents_sprint_draft_id ON documents(sprint_draft_id);
    CREATE INDEX IF NOT EXISTS idx_documents_sprint_deliverable_id ON documents(sprint_deliverable_id);
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS past_projects (
      id text PRIMARY KEY,
      title text NOT NULL,
      slug text UNIQUE NOT NULL,
      description text,
      story text,
      year integer,
      involvement_type text,
      project_scale text,
      industry text,
      outcomes jsonb,
      thumbnail_url text,
      images jsonb,
      project_url text,
      related_deliverable_ids jsonb,
      published boolean NOT NULL DEFAULT false,
      featured boolean NOT NULL DEFAULT false,
      sort_order integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_past_projects_published ON past_projects(published);
    CREATE INDEX IF NOT EXISTS idx_past_projects_featured ON past_projects(featured);
    CREATE INDEX IF NOT EXISTS idx_past_projects_involvement ON past_projects(involvement_type);
    CREATE INDEX IF NOT EXISTS idx_past_projects_sort ON past_projects(sort_order);
  `);
  
  // Process: 10-day cadence content (one row per day)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS process (
      id text PRIMARY KEY,
      day_number integer NOT NULL,
      title text,
      subtitle text,
      client_copy text,
      internal_notes text,
      deliverable_examples jsonb,
      links jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT process_day_number_check CHECK (day_number >= 1 AND day_number <= 10),
      UNIQUE(day_number)
    );
    CREATE INDEX IF NOT EXISTS idx_process_day_number ON process(day_number);
  `);
  // Seed default 10-day process content if table is empty
  const processCount = await pool.query(`SELECT COUNT(*)::int AS c FROM process`);
  if ((processCount.rows[0]?.c ?? 0) === 0) {
    const processSeed = [
      {
        id: "process-day-1",
        day_number: 1,
        title: "Kickoff workshop",
        subtitle: "Day 1 · Monday",
        client_copy:
          "3-hour brand/product workshop to align on goals, constraints, audience, and success metrics. Frame: Aligned.",
        internal_notes: "Engagement: client input required",
        deliverable_examples: { engagement: "client_required", feel: "Aligned" },
        links: null,
      },
      {
        id: "process-day-2",
        day_number: 2,
        title: "Research + divergence",
        subtitle: "Day 2 · Tuesday",
        client_copy:
          "Studio audits existing materials, gathers references, and explores broadly. Async only so we stay heads down. Frame: Curious.",
        internal_notes: "Engagement: studio heads down",
        deliverable_examples: { engagement: "studio", feel: "Curious" },
        links: null,
      },
      {
        id: "process-day-3",
        day_number: 3,
        title: "Work-in-progress share",
        subtitle: "Day 3 · Wednesday",
        client_copy:
          "Explorations shared via Loom/Figma with 'ingredient'/'solution' buckets—categories with grouped variations. React inline to steer which buckets we'll carry into Ingredient Review. Optional live sync if helpful. Frame: Excited.",
        internal_notes: "Engagement: optional sync share",
        deliverable_examples: { engagement: "optional", feel: "Excited" },
        links: null,
      },
      {
        id: "process-day-4",
        day_number: 4,
        title: "Ingredient review",
        subtitle: "Day 4 · Thursday",
        client_copy:
          "Review grouped solutions and categorized ingredients together. Decide which to keep, refine, discard, or combine—shaping the raw materials into a clear direction. Frame: Decisive.",
        internal_notes: "Engagement: client input required",
        deliverable_examples: { engagement: "client_required", feel: "Decisive" },
        links: null,
      },
      {
        id: "process-day-5",
        day_number: 5,
        title: "Direction locked",
        subtitle: "Day 5 · Friday",
        client_copy:
          "Studio compiles Day 4 feedback into one clear direction and shares an async outline. You see the solution shape and think: 'Yes, this solves it.' Frame: Clear.",
        internal_notes: "Engagement: async outline shared",
        deliverable_examples: { engagement: "optional", feel: "Clear" },
        links: null,
      },
      {
        id: "process-day-6",
        day_number: 6,
        title: "Direction check + build kickoff",
        subtitle: "Day 6 · Monday",
        client_copy:
          "Quick sync to review the locked direction, answer last questions, and confirm we're all aligned before going downhill. No directional changes after today—just confident execution. Frame: Focused.",
        internal_notes: "Engagement: optional sync",
        deliverable_examples: { engagement: "optional", feel: "Focused" },
        links: null,
      },
      {
        id: "process-day-7",
        day_number: 7,
        title: "Deep build day",
        subtitle: "Day 7 · Tuesday",
        client_copy:
          "Heads-down execution across design/copy/systems/product. Mostly async updates; optional sync share. Frame: Inspired.",
        internal_notes: "Engagement: optional sync share",
        deliverable_examples: { engagement: "optional", feel: "Inspired" },
        links: null,
      },
      {
        id: "process-day-8",
        day_number: 8,
        title: "Work-in-progress review",
        subtitle: "Day 8 · Wednesday",
        client_copy:
          "Live or Loom review to see it all coming together—early testing, validate progress, and request tweaks before polish. Not complete yet, but the shape is clear. Frame: Confident.",
        internal_notes: "Engagement: client input required",
        deliverable_examples: { engagement: "client_required", feel: "Confident" },
        links: null,
      },
      {
        id: "process-day-9",
        day_number: 9,
        title: "Polish + stress test",
        subtitle: "Day 9 · Thursday",
        client_copy:
          "QA, refinement, exports, and internal demo rehearsals. No meetings so we can polish. Frame: Meticulous.",
        internal_notes: "Engagement: studio heads down",
        deliverable_examples: { engagement: "studio", feel: "Meticulous" },
        links: null,
      },
      {
        id: "process-day-10",
        day_number: 10,
        title: "Delivery + handoff",
        subtitle: "Day 10 · Friday",
        client_copy:
          "Final deliverables, Loom walkthrough, optional live demo, and next-sprint recommendations. Frame: Satisfied.",
        internal_notes: "Engagement: optional sync share",
        deliverable_examples: { engagement: "optional", feel: "Satisfied" },
        links: null,
      },
    ];
    const processValues = processSeed.flatMap((p) => [
      p.id,
      p.day_number,
      p.title,
      p.subtitle,
      p.client_copy,
      p.internal_notes,
      JSON.stringify(p.deliverable_examples ?? null),
      JSON.stringify(p.links ?? null),
    ]);
    const processPlaceholders = processSeed
      .map(
        (_p, i) =>
          `($${i * 8 + 1}, $${i * 8 + 2}, $${i * 8 + 3}, $${i * 8 + 4}, $${i * 8 + 5}, $${i * 8 + 6}, $${i * 8 + 7}::jsonb, $${i * 8 + 8}::jsonb)`
      )
      .join(",\n");
    await pool.query(
      `
        INSERT INTO process (id, day_number, title, subtitle, client_copy, internal_notes, deliverable_examples, links)
        VALUES
        ${processPlaceholders}
        ON CONFLICT (day_number) DO NOTHING
      `,
      processValues
    );
  }
  
  // Sprint Packages: Pre-defined bundles of deliverables that clients can select
  // Pricing Strategy: DYNAMIC by default (flat_fee = NULL)
  // - flat_fee NULL = calculate from deliverables at base complexity (1.0)
  // - flat_fee set = manual override (special pricing, legacy packages, etc.)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sprint_packages (
      id text PRIMARY KEY,
      name text NOT NULL,
      slug text UNIQUE NOT NULL,
      description text,
      tagline text,
      emoji text,
      active boolean NOT NULL DEFAULT true,
      sort_order integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_sprint_packages_active ON sprint_packages(active);
    CREATE INDEX IF NOT EXISTS idx_sprint_packages_sort ON sprint_packages(sort_order);
  `);
  // Ensure optional sprint package metadata columns exist
  await pool.query(`
    ALTER TABLE sprint_packages
    ADD COLUMN IF NOT EXISTS category text,
    ADD COLUMN IF NOT EXISTS flat_fee numeric(12,2),
    ADD COLUMN IF NOT EXISTS flat_hours numeric(10,2),
    ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS package_type text,
    ADD COLUMN IF NOT EXISTS discount_percentage numeric(5,2)
  `);
  
  // Sprint Package Deliverables: Junction table linking packages to deliverables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sprint_package_deliverables (
      id text PRIMARY KEY,
      sprint_package_id text NOT NULL REFERENCES sprint_packages(id) ON DELETE CASCADE,
      deliverable_id text NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
      quantity integer NOT NULL DEFAULT 1,
      sort_order integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(sprint_package_id, deliverable_id)
    );
    CREATE INDEX IF NOT EXISTS idx_sprint_package_deliverables_package ON sprint_package_deliverables(sprint_package_id);
    CREATE INDEX IF NOT EXISTS idx_sprint_package_deliverables_deliverable ON sprint_package_deliverables(deliverable_id);
  `);
  await pool.query(`
    ALTER TABLE sprint_package_deliverables
    ADD COLUMN IF NOT EXISTS complexity_score numeric(3,1) DEFAULT 1.0,
    ADD COLUMN IF NOT EXISTS notes text
  `);
  
  // Add sprint_package_id to sprint_drafts to track which package was used (if any)
  await pool.query(`
    ALTER TABLE sprint_drafts
    ADD COLUMN IF NOT EXISTS sprint_package_id text REFERENCES sprint_packages(id) ON DELETE SET NULL;
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_sprint_drafts_package ON sprint_drafts(sprint_package_id);
  `);
  
  // Clean up deprecated columns on sprint_drafts
  await pool.query(`
    ALTER TABLE sprint_drafts
    DROP COLUMN IF EXISTS total_estimated_hours,
    DROP COLUMN IF EXISTS total_estimated_budget,
    DROP COLUMN IF EXISTS sprint_request_submitted_at,
    DROP COLUMN IF EXISTS discovery_call_completed_at,
    DROP COLUMN IF EXISTS sprint_type,
    DROP COLUMN IF EXISTS workshop_agenda,
    DROP COLUMN IF EXISTS workshop_generated_at,
    DROP COLUMN IF EXISTS workshop_ai_response_id
  `);
  
  global._schemaInitialized = true;
}


