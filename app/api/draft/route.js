import { sql } from "@vercel/postgres";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const dateKey = searchParams.get("dateKey");
  if (!dateKey) return Response.json({ draft: null });
  try {
    const { rows } = await sql`
      SELECT
        opening_qtys, closing_qtys,
        expected_sales::float AS "expectedSales",
        sales_value::float    AS "salesValue",
        petty_cash::float     AS "pettyCash",
        bank_run::float       AS "bankRun",
        closer_name           AS "closerName",
        petty_cash_note       AS "pettyCashNote",
        bank_run_note         AS "bankRunNote",
        saved_today           AS "savedToday"
      FROM till_drafts WHERE date_key = ${dateKey} LIMIT 1
    `;
    return Response.json({ draft: rows[0] ?? null });
  } catch (err) {
    console.error(err);
    return Response.json({ draft: null });
  }
}

export async function POST(request) {
  try {
    const b = await request.json();
    await sql`
      INSERT INTO till_drafts (
        date_key, opening_qtys, closing_qtys,
        expected_sales, sales_value, petty_cash, bank_run,
        closer_name, petty_cash_note, bank_run_note,
        saved_today, updated_at
      ) VALUES (
        ${b.dateKey}, ${JSON.stringify(b.openingQtys || {})}, ${JSON.stringify(b.closingQtys || {})},
        ${b.expectedSales || 0}, ${b.salesValue || 0}, ${b.pettyCash || 0}, ${b.bankRun || 0},
        ${b.closerName || ""}, ${b.pettyCashNote || ""}, ${b.bankRunNote || ""},
        ${b.savedToday || false}, NOW()
      )
      ON CONFLICT (date_key) DO UPDATE SET
        opening_qtys   = EXCLUDED.opening_qtys,
        closing_qtys   = EXCLUDED.closing_qtys,
        expected_sales = EXCLUDED.expected_sales,
        sales_value    = EXCLUDED.sales_value,
        petty_cash     = EXCLUDED.petty_cash,
        bank_run       = EXCLUDED.bank_run,
        closer_name    = EXCLUDED.closer_name,
        petty_cash_note = EXCLUDED.petty_cash_note,
        bank_run_note  = EXCLUDED.bank_run_note,
        saved_today    = EXCLUDED.saved_today,
        updated_at     = NOW()
    `;
    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
