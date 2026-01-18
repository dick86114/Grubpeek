import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    const { rows } = await pool.query('SELECT value FROM settings WHERE key = $1', ['admin_password']);
    const result = rows[0];
    
    if (result) {
      const isValid = await bcrypt.compare(password, result.value);
      if (isValid) {
        // In a real app, sign a JWT here. For now, we return a simple success flag.
        // We can return a 'token' which is just a simple flag or timestamp for localStorage
        return NextResponse.json({ success: true, token: 'admin-session-token' });
      }
    }
    
    return NextResponse.json({ success: false, error: '密码错误' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
