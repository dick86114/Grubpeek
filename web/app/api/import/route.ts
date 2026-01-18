import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parseMenuFile } from '@/lib/parser';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { filename } = await request.json();
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), '../menu', filename);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const buffer = fs.readFileSync(filePath);
    const menus = parseMenuFile(buffer, filename);

    // Transaction to insert data
    const insert = db.prepare(`
      INSERT INTO menus (date, type, category, name, is_featured, price)
      VALUES (@date, @type, @category, @name, @is_featured, @price)
    `);

    const deleteOld = db.prepare('DELETE FROM menus WHERE date = ?');

    const transaction = db.transaction((menus) => {
      // Find unique dates to clean up first
      const dates = new Set(menus.map((m: any) => m.date));
      for (const date of dates) {
        deleteOld.run(date);
      }
      
      for (const menu of menus) {
        insert.run({
          date: menu.date,
          type: menu.type,
          category: menu.category,
          name: menu.name,
          is_featured: menu.is_featured ? 1 : 0,
          price: menu.price
        });
      }
    });

    transaction(menus);

    return NextResponse.json({ success: true, count: menus.length });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
