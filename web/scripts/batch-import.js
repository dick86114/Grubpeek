const http = require('http');

const files = [
  '省投食堂菜单：2026年1月4日-9日.xlsx',
  '省投食堂菜单；1月12-16.et',
  '省投食堂菜单；1月19-23.et',
  '省投食堂菜单；2025年12月15-19.et',
  '省投食堂菜单；2025年12月22-26.et',
  '省投食堂菜单；2025年12月29-31.et',
  '省投食堂菜单；2025年12月8-12.et'
];

function importFile(filename) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ filename });
    
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/import',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        console.log(`[${res.statusCode}] ${filename}: ${body}`);
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error(`Problem with request: ${e.message}`);
      resolve(); // resolve anyway to continue
    });

    req.write(data);
    req.end();
  });
}

async function run() {
  for (const file of files) {
    await importFile(file);
  }
}

run();
