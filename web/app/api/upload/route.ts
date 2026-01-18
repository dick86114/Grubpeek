import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parseMenuFile } from '@/lib/parser';
import pool from '@/lib/db';

const menuDir = process.env.MENU_DIR || path.join(process.cwd(), '../menu');

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const action = formData.get('action') as string; // 'overwrite' | 'keep' | null
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Parse file in memory first to check dates
    const buffer = Buffer.from(await file.arrayBuffer());
    let menus: any[] = [];
    try {
        menus = parseMenuFile(buffer, file.name);
    } catch (e: any) {
        return NextResponse.json({ error: '解析文件失败: ' + e.message }, { status: 400 });
    }

    // Check for existing data if no explicit action
    if (!action) {
        const dates = Array.from(new Set(menus.map((m: any) => m.date)));
        if (dates.length > 0) {
            // Check if any of these dates already exist in DB
            const { rows } = await pool.query(
                'SELECT DISTINCT date::text FROM menus WHERE date = ANY($1::date[])',
                [dates]
            );
            
            if (rows.length > 0) {
                 return NextResponse.json({ 
                    status: 'conflict', 
                    dates: rows.map((r: any) => r.date),
                    message: '检测到部分日期已有数据'
                }, { status: 409 });
            }
        }
    }

    // Ensure menu directory exists
    if (!fs.existsSync(menuDir)) {
      fs.mkdirSync(menuDir, { recursive: true });
    }

    const filePath = path.join(menuDir, file.name);
    
    // Save file to disk (always save)
    try {
        fs.writeFileSync(filePath, buffer);
    } catch (e: any) {
        if (e.code === 'EBUSY') {
             return NextResponse.json({ error: '文件正被占用，无法写入，请关闭后重试' }, { status: 423 });
        }
        throw e;
    }

    // Import Logic
    if (action === 'keep') {
        // Just return success, don't import
        return NextResponse.json({ success: true, count: 0, filename: file.name, imported: false });
    }

    // Default or 'overwrite': Import to DB
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
              INSERT INTO menus (date, type, category, name, is_featured, price, sort_order)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                menu.date,
                menu.type,
                menu.category,
                menu.name,
                menu.is_featured ? 1 : 0,
                menu.price,
                menu.sort_order || 0
            ]);
        }

        await client.query('COMMIT');
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }

    return NextResponse.json({ success: true, count: menus.length, filename: file.name, imported: true });
  } catch (error: any) {
    console.error('Upload/Import error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
