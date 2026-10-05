// index.html이 불러오는 CSS·JS 주소 뒤에 ?v=<파일 내용 해시 8자리>를 붙인다.
// GitHub Pages는 CSS·JS를 10분간 캐시하므로, 주소가 그대로면 새 index.html + 옛 CSS가 섞여 화면이 깨진다.
// 내용이 바뀐 파일만 주소가 바뀌어서 나머지는 캐시를 그대로 쓴다.
// 실행: node tools/cache-bust.js   (커밋할 때 .githooks/pre-commit이 자동 실행)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const missing = [];

const next = html.replace(/(href|src)="((?:css|js|content)\/[^"?#]+\.(?:css|js))(?:\?v=[^"]*)?"/g, (all, attr, file) => {
  const abs = path.join(root, file);
  if (!fs.existsSync(abs)) { missing.push(file); return all; }
  const hash = crypto.createHash('sha1').update(fs.readFileSync(abs)).digest('hex').slice(0, 8);
  return `${attr}="${file}?v=${hash}"`;
});

if (missing.length) console.warn(`cache-bust: 파일이 없어요 → ${missing.join(', ')}`);
if (next !== html) {
  fs.writeFileSync(htmlPath, next);
  console.log('cache-bust: index.html 버전을 갱신했어요');
}
