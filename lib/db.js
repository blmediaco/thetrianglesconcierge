import { neon } from '@neondatabase/serverless';

let sqlClient;
let schemaReady;

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not configured.');
  }

  if (!sqlClient) {
    sqlClient = neon(process.env.DATABASE_URL);
  }

  return sqlClient;
}

export async function ensureDatabaseSchema() {
  if (!schemaReady) {
    const sql = getSql();
    schemaReady = sql`
      CREATE TABLE IF NOT EXISTS partnership_inquiries (
        id BIGSERIAL PRIMARY KEY,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        contact_name TEXT NOT NULL,
        role_title TEXT NOT NULL,
        company_name TEXT NOT NULL,
        email TEXT NOT NULL,
        interest TEXT NOT NULL,
        community_details TEXT NOT NULL,
        source_page TEXT NOT NULL DEFAULT 'partnerships.html',
        ip_address TEXT,
        user_agent TEXT
      );

      CREATE TABLE IF NOT EXISTS client_interest_inquiries (
        id BIGSERIAL PRIMARY KEY,
        submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        service_interest TEXT NOT NULL,
        city TEXT NOT NULL,
        timeline TEXT NOT NULL,
        household_details TEXT NOT NULL,
        source_page TEXT NOT NULL DEFAULT 'index.html',
        ip_address TEXT,
        user_agent TEXT
      );
    `;
  }

  await schemaReady;
}

export function getDatabase() {
  return getSql();
}
