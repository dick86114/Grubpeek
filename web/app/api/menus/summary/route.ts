
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // Get all dates that have menu data, ordered by date desc
    const dates = db.prepare('SELECT DISTINCT date FROM menus ORDER BY date DESC').all();
    
    // For each date, maybe get a summary count?
    // Actually, just the dates is enough for now, or maybe count by meal type
    const summary = dates.map((d: any) => {
        const counts = db.prepare(`
            SELECT type, COUNT(*) as count 
            FROM menus 
            WHERE date = ? 
            GROUP BY type
        `).all(d.date);
        
        return {
            date: d.date,
            counts: counts
        };
    });

    return NextResponse.json({ dates: summary });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
