// Load .env.local so POSTGRES_URL is available when running with plain node
const fs = require("fs");
const path = require("path");
const envFile = path.join(__dirname, "../.env.local");
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, "utf8").split("\n").forEach((line) => {
    const [key, ...rest] = line.trim().split("=");
    if (key && rest.length) process.env[key] = rest.join("=").replace(/^"|"$/g, "");
  });
  console.log("Loaded .env.local");
}

const { sql } = require("@vercel/postgres");

async function migrate() {
  console.log("Running migrations...");

  await sql`
    CREATE TABLE IF NOT EXISTS till_records (
      id              SERIAL PRIMARY KEY,
      date_key        DATE          NOT NULL UNIQUE,
      date_label      TEXT          NOT NULL,
      closer_name     TEXT          NOT NULL,
      opening_qtys    JSONB         NOT NULL DEFAULT '{}',
      closing_qtys    JSONB         NOT NULL DEFAULT '{}',
      opening_total   NUMERIC(10,2) NOT NULL DEFAULT 0,
      closing_total   NUMERIC(10,2) NOT NULL DEFAULT 0,
      sales_value     NUMERIC(10,2) NOT NULL DEFAULT 0,
      petty_cash      NUMERIC(10,2) NOT NULL DEFAULT 0,
      bank_run        NUMERIC(10,2) NOT NULL DEFAULT 0,
      cash_sales      NUMERIC(10,2) NOT NULL DEFAULT 0,
      expected_sales  NUMERIC(10,2) NOT NULL DEFAULT 0,
      petty_cash_note TEXT          NOT NULL DEFAULT '',
      bank_run_note   TEXT          NOT NULL DEFAULT '',
      saved_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS till_drafts (
      id              SERIAL PRIMARY KEY,
      date_key        DATE          NOT NULL UNIQUE,
      opening_qtys    JSONB         NOT NULL DEFAULT '{}',
      closing_qtys    JSONB         NOT NULL DEFAULT '{}',
      expected_sales  NUMERIC(10,2) NOT NULL DEFAULT 0,
      sales_value     NUMERIC(10,2) NOT NULL DEFAULT 0,
      petty_cash      NUMERIC(10,2) NOT NULL DEFAULT 0,
      bank_run        NUMERIC(10,2) NOT NULL DEFAULT 0,
      closer_name     TEXT          NOT NULL DEFAULT '',
      petty_cash_note TEXT          NOT NULL DEFAULT '',
      bank_run_note   TEXT          NOT NULL DEFAULT '',
      saved_today     BOOLEAN       NOT NULL DEFAULT FALSE,
      updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
    );
  `;

  // Safe upgrades for existing deployments
  const cols = [
    ["till_records", "sales_value",     "NUMERIC(10,2) NOT NULL DEFAULT 0"],
    ["till_records", "petty_cash",      "NUMERIC(10,2) NOT NULL DEFAULT 0"],
    ["till_records", "bank_run",        "NUMERIC(10,2) NOT NULL DEFAULT 0"],
    ["till_records", "petty_cash_note", "TEXT NOT NULL DEFAULT ''"],
    ["till_records", "bank_run_note",   "TEXT NOT NULL DEFAULT ''"],
    ["till_drafts",  "sales_value",     "NUMERIC(10,2) NOT NULL DEFAULT 0"],
    ["till_drafts",  "petty_cash",      "NUMERIC(10,2) NOT NULL DEFAULT 0"],
    ["till_drafts",  "bank_run",        "NUMERIC(10,2) NOT NULL DEFAULT 0"],
    ["till_drafts",  "petty_cash_note", "TEXT NOT NULL DEFAULT ''"],
    ["till_drafts",  "bank_run_note",   "TEXT NOT NULL DEFAULT ''"],
  ];

  for (const [table, col, def] of cols) {
    try {
      await sql.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${col} ${def}`);
      console.log(`  ✓ ${table}.${col}`);
    } catch (e) {
      console.log(`  - ${table}.${col}: ${e.message}`);
    }
  }

  console.log("✅ Migration complete.");
  process.exit(0);
}

migrate().catch((err) => { console.error(err); process.exit(1); });