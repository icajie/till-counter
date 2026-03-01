import { sql } from "@vercel/postgres";

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT
        date_key, date_label, closer_name,
        opening_qtys, closing_qtys,
        opening_total::float    AS "openingTotal",
        closing_total::float    AS "closingTotal",
        sales_value::float      AS "salesValue",
        petty_cash::float       AS "pettyCash",
        bank_run::float         AS "bankRun",
        cash_sales::float       AS "cashSales",
        expected_sales::float   AS "expectedSales",
        petty_cash_note, bank_run_note,
        saved_at
      FROM till_records
      ORDER BY date_key ASC
    `;
    return Response.json({ records: rows });
  } catch (err) {
    console.error(err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const b = await request.json();
    await sql`
      INSERT INTO till_records (
        date_key, date_label, closer_name,
        opening_qtys, closing_qtys,
        opening_total, closing_total,
        sales_value, petty_cash, bank_run,
        cash_sales, expected_sales,
        petty_cash_note, bank_run_note, updated_at
      ) VALUES (
        ${b.dateKey}, ${b.dateLabel}, ${b.closerName},
        ${JSON.stringify(b.openingQtys)}, ${JSON.stringify(b.closingQtys)},
        ${b.openingTotal}, ${b.closingTotal},
        ${b.salesValue || 0}, ${b.pettyCash || 0}, ${b.bankRun || 0},
        ${b.cashSales}, ${b.expectedSales || 0},
        ${b.pettyCashNote || ""}, ${b.bankRunNote || ""}, NOW()
      )
      ON CONFLICT (date_key) DO UPDATE SET
        date_label     = EXCLUDED.date_label,
        closer_name    = EXCLUDED.closer_name,
        opening_qtys   = EXCLUDED.opening_qtys,
        closing_qtys   = EXCLUDED.closing_qtys,
        opening_total  = EXCLUDED.opening_total,
        closing_total  = EXCLUDED.closing_total,
        sales_value    = EXCLUDED.sales_value,
        petty_cash     = EXCLUDED.petty_cash,
        bank_run       = EXCLUDED.bank_run,
        cash_sales     = EXCLUDED.cash_sales,
        expected_sales = EXCLUDED.expected_sales,
        petty_cash_note = EXCLUDED.petty_cash_note,
        bank_run_note  = EXCLUDED.bank_run_note,
        updated_at     = NOW()
    `;
    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
