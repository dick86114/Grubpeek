import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Get summary in one query
    const { rows } = await pool.query(`
      SELECT date::text, type, COUNT(*) as count
      FROM menus
      GROUP BY date, type
      ORDER BY date DESC
    `);
    
    // Group by date
    const summaryMap = new Map();
    rows.forEach(row => {
        if (!summaryMap.has(row.date)) {
            summaryMap.set(row.date, { date: row.date, counts: [] });
        }
        summaryMap.get(row.date).counts.push({ type: row.type, count: parseInt(row.count) });
    });
    
    return NextResponse.json({ dates: Array.from(summaryMap.values()) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
