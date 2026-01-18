import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function PUT(request: Request) {
  try {
    const { oldPassword, newPassword } = await request.json();
    
    if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ success: false, error: '新密码长度至少为6位' }, { status: 400 });
    }

    const { rows } = await pool.query('SELECT value FROM settings WHERE key = $1', ['admin_password']);
    const result = rows[0];
    
    if (result) {
      const isValid = await bcrypt.compare(oldPassword, result.value);
      if (isValid) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE settings SET value = $1 WHERE key = $2', [hashedPassword, 'admin_password']);
        return NextResponse.json({ success: true });
      }
    }
    
    return NextResponse.json({ success: false, error: '原密码错误' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
