const { sql } = require("@vercel/postgres");

async function migrate() {
  console.log("Running migrations...");
  await sql`
    CREATE TABLE IF NOT EXISTS till_records (
      id             SERIAL PRIMARY KEY,
      date_key       DATE        NOT NULL UNIQUE,
      date_label     TEXT        NOT NULL,
      closer_name    TEXT        NOT NULL,
      opening_qtys   JSONB       NOT NULL DEFAULT '{}',
      closing_qtys   JSONB       NOT NULL DEFAULT '{}',
      opening_total  NUMERIC(10,2) NOT NULL DEFAULT 0,
      closing_total  NUMERIC(10,2) NOT NULL DEFAULT 0,
      cash_sales     NUMERIC(10,2) NOT NULL DEFAULT 0,
      expected_sales NUMERIC(10,2) NOT NULL DEFAULT 0,
      saved_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS till_drafts (
      id             SERIAL PRIMARY KEY,
      date_key       DATE        NOT NULL UNIQUE,
      opening_qtys   JSONB       NOT NULL DEFAULT '{}',
      closing_qtys   JSONB       NOT NULL DEFAULT '{}',
      expected_sales NUMERIC(10,2) NOT NULL DEFAULT 0,
      closer_name    TEXT        NOT NULL DEFAULT '',
      saved_today    BOOLEAN     NOT NULL DEFAULT FALSE,
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;
  console.log("✅ Migration complete.");
  process.exit(0);
}

migrate().catch((err) => { console.error(err); process.exit(1); });
