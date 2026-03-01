import { sql } from "@vercel/postgres";

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT
        date_key,
        date_label,
        closer_name,
        opening_qtys,
        closing_qtys,
        opening_total::float    AS "openingTotal",
        closing_total::float    AS "closingTotal",
        cash_taken_out::float   AS "cashTakenOut",
        cash_sales::float       AS "cashSales",
        expected_sales::float   AS "expectedSales",
        taken_out_note,
        saved_at
      FROM till_records
      ORDER BY date_key ASC
    `;
    return Response.json({ records: rows });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to load records" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      dateKey, dateLabel, closerName,
      openingQtys, closingQtys,
      openingTotal, closingTotal, cashTakenOut, cashSales, expectedSales,
      takenOutNote,
    } = body;

    await sql`
      INSERT INTO till_records
        (date_key, date_label, closer_name, opening_qtys, closing_qtys,
         opening_total, closing_total, cash_taken_out, cash_sales, expected_sales,
         taken_out_note, updated_at)
      VALUES
        (${dateKey}, ${dateLabel}, ${closerName},
         ${JSON.stringify(openingQtys)}, ${JSON.stringify(closingQtys)},
         ${openingTotal}, ${closingTotal}, ${cashTakenOut || 0}, ${cashSales}, ${expectedSales},
         ${takenOutNote || ""}, NOW())
      ON CONFLICT (date_key) DO UPDATE SET
        date_label     = EXCLUDED.date_label,
        closer_name    = EXCLUDED.closer_name,
        opening_qtys   = EXCLUDED.opening_qtys,
        closing_qtys   = EXCLUDED.closing_qtys,
        opening_total  = EXCLUDED.opening_total,
        closing_total  = EXCLUDED.closing_total,
        cash_taken_out = EXCLUDED.cash_taken_out,
        cash_sales     = EXCLUDED.cash_sales,
        expected_sales = EXCLUDED.expected_sales,
        taken_out_note = EXCLUDED.taken_out_note,
        updated_at     = NOW()
    `;
    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to save record" }, { status: 500 });
  }
}
