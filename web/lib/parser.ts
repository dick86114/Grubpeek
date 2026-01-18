import * as XLSX from 'xlsx';
import { addDays, format, getDay, parse, setYear, isValid } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface ParsedMenu {
  date: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'takeaway';
  category: string;
  name: string;
  is_featured: boolean;
  price: number;
  sort_order: number;
}

const WEEKDAYS = {
  '星期天': 0,
  '星期日': 0,
  '星期一': 1,
  '星期二': 2,
  '星期三': 3,
  '星期四': 4,
  '星期五': 5,
  '星期六': 6,
};

export function extractDateFromFilename(filename: string): Date | null {
  // Try to match YYYY年M月D日 or M月D日
  // Example: 省投食堂菜单：2026年1月4日-9日.xlsx
  // Example: 省投食堂菜单；1月12-16.et
  
  const yearMatch = filename.match(/(\d{4})年/);
  const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear();
  
  const dateMatch = filename.match(/(\d{1,2})月(\d{1,2})[日\-\s]/);
  if (dateMatch) {
    const month = parseInt(dateMatch[1]) - 1; // 0-indexed
    const day = parseInt(dateMatch[2]);
    return new Date(year, month, day);
  }
  return null;
}

export function parseMenuFile(buffer: Buffer, filename: string): ParsedMenu[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

  const anchorDate = extractDateFromFilename(filename);
  if (!anchorDate || !isValid(anchorDate)) {
    throw new Error('Could not parse date from filename: ' + filename);
  }
  const anchorDayOfWeek = getDay(anchorDate); // 0 (Sun) - 6 (Sat)

  const menus: ParsedMenu[] = [];
  
  // Find sections
  let currentSection: 'breakfast' | 'lunch' | 'dinner' | null = null;
  let headerRowIndex = -1;
  let dateMap: { [colIndex: number]: string } = {}; // colIndex -> YYYY-MM-DD
  let currentCategory = '';

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const firstCell = (row[0] || '').toString().trim();

    // Detect Section
    if (firstCell.includes('早餐')) {
      currentSection = 'breakfast';
      headerRowIndex = i + 1; // Assume header is next row
      currentCategory = ''; // Reset category
      continue;
    } else if (firstCell.includes('午餐')) {
      currentSection = 'lunch';
      headerRowIndex = i + 1;
      currentCategory = ''; // Reset category
      continue;
    } else if (firstCell.includes('晚餐')) {
      currentSection = 'dinner';
      headerRowIndex = i + 1;
      currentCategory = ''; // Reset category
      continue;
    }

    // Process Header
    if (i === headerRowIndex) {
      dateMap = {};
      row.forEach((cell, colIndex) => {
        const cellStr = (cell || '').toString().trim();
        if (WEEKDAYS.hasOwnProperty(cellStr)) {
          const colDayOfWeek = WEEKDAYS[cellStr as keyof typeof WEEKDAYS];
          const diff = colDayOfWeek - anchorDayOfWeek;
          const targetDate = addDays(anchorDate, diff);
          dateMap[colIndex] = format(targetDate, 'yyyy-MM-dd');
        }
      });
      continue;
    }

    // Process Data Rows
    if (currentSection && i > headerRowIndex) {
      // Stop if new section starts (handled by Detect Section above, but check just in case empty row separates)
      // Actually loop continues, so if we hit next '午餐', it switches.
      
      // Update Category
      if (firstCell && firstCell !== 'undefined') {
        currentCategory = firstCell;
      }
      
      // If row is empty or category is empty and first cell empty, maybe skip?
      // But row might have data even if category is same.
      
      // Iterate columns with dates
      Object.keys(dateMap).forEach(colIndexStr => {
        const colIndex = parseInt(colIndexStr);
        const cellValue = row[colIndex];
        if (cellValue) {
          const dishNameRaw = cellValue.toString().trim();
          // Split by / or 、 or newline or commas
          const dishNames = dishNameRaw.split(/[\/、\n，,]/).map((s: string) => s.trim()).filter((s: string) => s);
          
          dishNames.forEach((name: string) => {
             // Determine type: if category is '外卖包点', set type to 'takeaway'
             let type: 'breakfast' | 'lunch' | 'dinner' | 'takeaway' = currentSection!;
             if (currentCategory.includes('外卖')) {
                 type = 'takeaway';
             }

             menus.push({
               date: dateMap[colIndex],
               type: type,
               category: currentCategory,
               name: name,
               is_featured: name.includes('[特]'), // Check requirement
               price: type === 'breakfast' ? 5 : type === 'lunch' ? 25 : type === 'dinner' ? 15 : 0,
               sort_order: i * 1000 + colIndex // Use row index * 1000 + colIndex to maintain order
             });
          });
        }
      });
    }
  }

  return menus;
}
