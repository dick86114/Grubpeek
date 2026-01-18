import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
    const result = stmt.get('admin_password') as { value: string };
    
    if (result && result.value === password) {
      // In a real app, sign a JWT here. For now, we return a simple success flag.
      // We can return a 'token' which is just a simple flag or timestamp for localStorage
      return NextResponse.json({ success: true, token: 'admin-session-token' });
    }
    
    return NextResponse.json({ success: false, error: '密码错误' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
