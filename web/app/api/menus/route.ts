import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!start || !end) {
    return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 });
  }

  try {
    const stmt = db.prepare('SELECT * FROM menus WHERE date >= ? AND date <= ? ORDER BY date, type, category');
    const menus = stmt.all(start, end);
    return NextResponse.json({ menus });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Add new item
  try {
    const body = await request.json();
    const { date, type, category, name, is_featured, price } = body;
    
    const stmt = db.prepare(`
      INSERT INTO menus (date, type, category, name, is_featured, price)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(date, type, category, name, is_featured ? 1 : 0, price);
    return NextResponse.json({ id: info.lastInsertRowid });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  // Update item
  try {
    const body = await request.json();
    const { id, name, is_featured, category, price, type } = body;
    
    const stmt = db.prepare(`
      UPDATE menus SET name = ?, is_featured = ?, category = ?, price = ?, type = ? WHERE id = ?
    `);
    
    stmt.run(name, is_featured ? 1 : 0, category, price, type, id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const dates = searchParams.get('dates');
    
    if (id) {
        const stmt = db.prepare('DELETE FROM menus WHERE id = ?');
        stmt.run(id);
    } else if (dates) {
        const dateList = dates.split(',').filter(d => d.trim());
        if (dateList.length > 0) {
            const placeholders = dateList.map(() => '?').join(',');
            const stmt = db.prepare(`DELETE FROM menus WHERE date IN (${placeholders})`);
            stmt.run(...dateList);
        }
    } else {
        return NextResponse.json({ error: 'ID or dates required' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
