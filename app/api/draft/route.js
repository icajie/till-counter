import { sql } from "@vercel/postgres";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const dateKey = searchParams.get("dateKey");
  if (!dateKey) return Response.json({ draft: null });

  try {
    const { rows } = await sql`
      SELECT
        opening_qtys,
        closing_qtys,
        expected_sales::float   AS "expectedSales",
        closer_name             AS "closerName",
        cash_taken_out::float   AS "cashTakenOut",
        taken_out_note          AS "takenOutNote",
        saved_today             AS "savedToday"
      FROM till_drafts
      WHERE date_key = ${dateKey}
      LIMIT 1
    `;
    return Response.json({ draft: rows[0] ?? null });
  } catch (err) {
    console.error(err);
    return Response.json({ draft: null });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { dateKey, openingQtys, closingQtys, expectedSales, closerName, cashTakenOut, takenOutNote, savedToday } = body;

    await sql`
      INSERT INTO till_drafts
        (date_key, opening_qtys, closing_qtys, expected_sales, closer_name,
         cash_taken_out, taken_out_note, saved_today, updated_at)
      VALUES
        (${dateKey}, ${JSON.stringify(openingQtys)}, ${JSON.stringify(closingQtys)},
         ${expectedSales || 0}, ${closerName || ""},
         ${cashTakenOut || 0}, ${takenOutNote || ""}, ${savedToday || false}, NOW())
      ON CONFLICT (date_key) DO UPDATE SET
        opening_qtys   = EXCLUDED.opening_qtys,
        closing_qtys   = EXCLUDED.closing_qtys,
        expected_sales = EXCLUDED.expected_sales,
        closer_name    = EXCLUDED.closer_name,
        cash_taken_out = EXCLUDED.cash_taken_out,
        taken_out_note = EXCLUDED.taken_out_note,
        saved_today    = EXCLUDED.saved_today,
        updated_at     = NOW()
    `;
    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Failed to save draft" }, { status: 500 });
  }
}
