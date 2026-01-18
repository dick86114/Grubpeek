import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  if (!start || !end) {
    return NextResponse.json({ error: 'Start and end dates are required' }, { status: 400 });
  }

  try {
    const { rows } = await pool.query(
      `SELECT 
        id, 
        to_char(date, 'YYYY-MM-DD') as date, 
        type, 
        category, 
        name, 
        is_featured, 
        price 
       FROM menus 
       WHERE date >= $1 AND date <= $2 
       ORDER BY date, sort_order ASC`,
      [start, end]
    );
    return NextResponse.json({ menus: rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Add new item
  try {
    const body = await request.json();
    const { date, type, category, name, is_featured, price } = body;
    
    const { rows } = await pool.query(`
      INSERT INTO menus (date, type, category, name, is_featured, price)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `, [date, type, category, name, is_featured ? 1 : 0, price]);
    
    return NextResponse.json({ id: rows[0].id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  // Update item
  try {
    const body = await request.json();
    const { id, name, is_featured, category, price, type } = body;
    
    await pool.query(`
      UPDATE menus SET name = $1, is_featured = $2, category = $3, price = $4, type = $5 WHERE id = $6
    `, [name, is_featured ? 1 : 0, category, price, type, id]);
    
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
        await pool.query('DELETE FROM menus WHERE id = $1', [id]);
    } else if (dates) {
        const dateList = dates.split(',').filter(d => d.trim());
        if (dateList.length > 0) {
            // Use ANY for array check. date::text allows string matching
            await pool.query('DELETE FROM menus WHERE date::text = ANY($1)', [dateList]);
        }
    } else {
        return NextResponse.json({ error: 'ID or dates required' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
