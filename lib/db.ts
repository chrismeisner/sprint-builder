import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var _schemaInitialized: boolean | undefined;
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
    ADD COLUMN IF NOT EXISTS total_estimate_points integer,
    ADD COLUMN IF NOT EXISTS total_estimated_hours numeric(10,2),
    ADD COLUMN IF NOT EXISTS total_estimated_budget numeric(10,2),
    ADD COLUMN IF NOT EXISTS total_fixed_hours numeric(10,2),
    ADD COLUMN IF NOT EXISTS total_fixed_price numeric(10,2),
    ADD COLUMN IF NOT EXISTS updated_at timestamptz;
  `);
  
  // Add indexes for common queries
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_sprint_drafts_status ON sprint_drafts(status);
    CREATE INDEX IF NOT EXISTS idx_sprint_drafts_created ON sprint_drafts(created_at DESC);
  `);
  
  // Add constraint to validate status values
  await pool.query(`
    DO $$ 
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'sprint_drafts_status_check'
      ) THEN
        ALTER TABLE sprint_drafts 
        ADD CONSTRAINT sprint_drafts_status_check 
        CHECK (status IN ('draft', 'in_progress', 'completed', 'cancelled'));
      END IF;
    END $$;
  `);
  
  // Create junction table for sprint → deliverables relationship
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sprint_deliverables (
      id text PRIMARY KEY,
      sprint_draft_id text NOT NULL REFERENCES sprint_drafts(id) ON DELETE CASCADE,
      deliverable_id text NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
      quantity integer NOT NULL DEFAULT 1,
      custom_estimate_points integer,
      custom_hours numeric(10,2),
      custom_price numeric(10,2),
      notes text,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(sprint_draft_id, deliverable_id)
    );
    CREATE INDEX IF NOT EXISTS idx_sprint_deliverables_sprint ON sprint_deliverables(sprint_draft_id);
    CREATE INDEX IF NOT EXISTS idx_sprint_deliverables_deliverable ON sprint_deliverables(deliverable_id);
  `);
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
      default_estimate_points integer,
      active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_deliverables_active ON deliverables(active);
    CREATE INDEX IF NOT EXISTS idx_deliverables_category ON deliverables(category);
  `);
  
  // Add fixed pricing and scope fields to deliverables
  await pool.query(`
    ALTER TABLE deliverables
    ADD COLUMN IF NOT EXISTS estimated_hours numeric(10,2),
    ADD COLUMN IF NOT EXISTS estimated_budget numeric(10,2),
    ADD COLUMN IF NOT EXISTS fixed_hours numeric(10,2),
    ADD COLUMN IF NOT EXISTS fixed_price numeric(10,2),
    ADD COLUMN IF NOT EXISTS scope text;
  `);
  
  // Migrate existing data from estimated_* to fixed_* fields
  await pool.query(`
    UPDATE deliverables
    SET fixed_hours = estimated_hours,
        fixed_price = estimated_budget
    WHERE fixed_hours IS NULL AND estimated_hours IS NOT NULL;
  `);
  
  // Drop old columns (we'll keep them for now to avoid data loss, can remove later)
  // await pool.query(`ALTER TABLE deliverables DROP COLUMN IF EXISTS estimated_hours, DROP COLUMN IF EXISTS estimated_budget;`);
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
  
  // Create index for admin queries
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_accounts_is_admin ON accounts(is_admin);
  `);
  await pool.query(`
    ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS account_id text REFERENCES accounts(id)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_documents_account_id ON documents(account_id)
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
  
  // Sprint Packages: Pre-defined bundles of deliverables that clients can select
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sprint_packages (
      id text PRIMARY KEY,
      name text NOT NULL,
      slug text UNIQUE NOT NULL,
      description text,
      category text,
      tagline text,
      flat_fee numeric(10,2),
      flat_hours numeric(10,2),
      discount_percentage numeric(5,2),
      active boolean NOT NULL DEFAULT true,
      featured boolean NOT NULL DEFAULT false,
      sort_order integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_sprint_packages_active ON sprint_packages(active);
    CREATE INDEX IF NOT EXISTS idx_sprint_packages_featured ON sprint_packages(featured);
    CREATE INDEX IF NOT EXISTS idx_sprint_packages_category ON sprint_packages(category);
    CREATE INDEX IF NOT EXISTS idx_sprint_packages_sort ON sprint_packages(sort_order);
  `);
  
  // Sprint Package Deliverables: Junction table linking packages to deliverables
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sprint_package_deliverables (
      id text PRIMARY KEY,
      sprint_package_id text NOT NULL REFERENCES sprint_packages(id) ON DELETE CASCADE,
      deliverable_id text NOT NULL REFERENCES deliverables(id) ON DELETE CASCADE,
      quantity integer NOT NULL DEFAULT 1,
      notes text,
      sort_order integer NOT NULL DEFAULT 0,
      created_at timestamptz NOT NULL DEFAULT now(),
      UNIQUE(sprint_package_id, deliverable_id)
    );
    CREATE INDEX IF NOT EXISTS idx_sprint_package_deliverables_package ON sprint_package_deliverables(sprint_package_id);
    CREATE INDEX IF NOT EXISTS idx_sprint_package_deliverables_deliverable ON sprint_package_deliverables(deliverable_id);
  `);
  
  // Add sprint_package_id to sprint_drafts to track which package was used (if any)
  await pool.query(`
    ALTER TABLE sprint_drafts
    ADD COLUMN IF NOT EXISTS sprint_package_id text REFERENCES sprint_packages(id) ON DELETE SET NULL;
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_sprint_drafts_package ON sprint_drafts(sprint_package_id);
  `);
  
  global._schemaInitialized = true;
}


