import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parseMenuFile } from '@/lib/parser';
import pool from '@/lib/db';

const menuDir = process.env.MENU_DIR || path.join(process.cwd(), '../menu');

export async function POST(request: Request) {
  try {
    const { filename } = await request.json();
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    const filePath = path.join(menuDir, filename);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const buffer = fs.readFileSync(filePath);
    const menus = parseMenuFile(buffer, filename);

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Find unique dates to clean up first
        const dates = Array.from(new Set(menus.map((m: any) => m.date)));
        
        // Delete old data for these dates
        if (dates.length > 0) {
            await client.query('DELETE FROM menus WHERE date = ANY($1::date[])', [dates]);
        }

        // Insert new data
        for (const menu of menus) {
            await client.query(`
              INSERT INTO menus (date, type, category, name, is_featured, price)
              VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                menu.date,
                menu.type,
                menu.category,
                menu.name,
                menu.is_featured ? 1 : 0,
                menu.price
            ]);
        }

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }

    return NextResponse.json({ success: true, count: menus.length });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
