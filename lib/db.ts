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

  const isProduction = process.env.NODE_ENV === "production";

  return new Pool({
    connectionString,
    ssl: isProduction
      ? {
          rejectUnauthorized: false,
        }
      : undefined,
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
  await pool.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id text PRIMARY KEY,
      email text NOT NULL UNIQUE,
      created_at timestamptz NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS account_id text REFERENCES accounts(id)
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_documents_account_id ON documents(account_id)
  `);
  global._schemaInitialized = true;
}


