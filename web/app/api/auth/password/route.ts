import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function PUT(request: Request) {
  try {
    const { oldPassword, newPassword } = await request.json();
    
    if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ success: false, error: '新密码长度至少为6位' }, { status: 400 });
    }

    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
    const result = stmt.get('admin_password') as { value: string };
    
    if (result && result.value === oldPassword) {
      db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(newPassword, 'admin_password');
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ success: false, error: '原密码错误' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
