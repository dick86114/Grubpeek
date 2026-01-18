import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { extractDateFromFilename } from '@/lib/parser';
import db from '@/lib/db';
import { startOfWeek, endOfWeek, format } from 'date-fns';

const menuDir = process.env.MENU_DIR || path.join(process.cwd(), '../menu');

export async function GET() {
  try {
    if (!fs.existsSync(menuDir)) {
      return NextResponse.json({ files: [] });
    }
    const files = fs.readdirSync(menuDir)
      .filter(file => !file.startsWith('~$') && (file.endsWith('.xlsx') || file.endsWith('.et') || file.endsWith('.csv')))
      .map(file => ({
        name: file,
        path: path.join(menuDir, file),
        mtime: fs.statSync(path.join(menuDir, file)).mtime
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    return NextResponse.json({ files });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to list files' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    const filePath = path.join(menuDir, filename);
    if (fs.existsSync(filePath)) {
      // Just delete the file, do NOT delete DB data
      try {
        fs.unlinkSync(filePath);
      } catch (err: any) {
        if (err.code === 'EBUSY' || err.code === 'EPERM') {
            return NextResponse.json({ error: '文件正被占用，请关闭文件后重试' }, { status: 423 }); // 423 Locked
        }
        throw err;
      }
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
