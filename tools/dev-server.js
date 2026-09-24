#!/usr/bin/env node
/*
 * 로컬 개발 서버 (외부 패키지 없음)
 * - http://localhost:5500 에서 사이트를 띄운다
 * - 폴더 안 파일(html/css/js/json)이 저장되면 브라우저가 자동으로 새로고침된다
 *   CSS만 바뀌면 페이지 새로고침 없이 스타일만 교체한다
 * 실행: node tools/dev-server.js   (또는 start-server.bat 더블클릭)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 5500;
const IGNORE = /(^|[\\/])(\.git|node_modules|shots_[^\\/]*)([\\/]|$)/;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif',
  '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2',
};

const CLIENT = `
<script>
(function(){
  var es = new EventSource('/__livereload');
  es.onmessage = function(e){
    var file = e.data || '';
    if (/\\.css$/i.test(file)) {
      document.querySelectorAll('link[rel="stylesheet"]').forEach(function(l){
        var href = l.getAttribute('href') || '';
        if (/^https?:/.test(href)) return;
        l.href = href.split('?')[0] + '?v=' + Date.now();
      });
      console.info('[live] CSS 갱신:', file);
    } else {
      // 현재 보던 화면(해시)과 스크롤 위치를 유지하며 새로고침
      try {
        var p = document.querySelector('.page-panel.active');
        sessionStorage.setItem('__live_scroll', JSON.stringify({ y: window.scrollY, p: p ? p.scrollTop : 0 }));
      } catch (_) {}
      location.reload();
    }
  };
  window.addEventListener('load', function(){
    try {
      var s = JSON.parse(sessionStorage.getItem('__live_scroll') || 'null');
      if (!s) return;
      sessionStorage.removeItem('__live_scroll');
      setTimeout(function(){
        window.scrollTo(0, s.y);
        var p = document.querySelector('.page-panel.active'); if (p) p.scrollTop = s.p;
      }, 150);
    } catch (_) {}
  });
})();
</script>`;

const clients = new Set();
function broadcast(file) {
  for (const res of clients) res.write(`data: ${file}\n\n`);
}

let timer = null, pending = null;
function onChange(file) {
  if (!file || IGNORE.test(file)) return;
  pending = pending && !/\.css$/i.test(pending) ? pending : file; // CSS 외 변경이 섞이면 전체 새로고침
  clearTimeout(timer);
  timer = setTimeout(() => {
    console.log(`  ↻ ${pending}`);
    broadcast(pending.replace(/\\/g, '/'));
    pending = null;
  }, 120);
}

try {
  fs.watch(ROOT, { recursive: true }, (_, file) => onChange(file));
} catch (e) {
  console.warn('recursive watch 미지원 환경입니다. 최상위 폴더만 감시합니다.');
  fs.watch(ROOT, (_, file) => onChange(file));
}

const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);

  if (url === '/__livereload') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write('retry: 1000\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  let file = path.join(ROOT, url);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');

  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('404 Not Found: ' + url); }
    const ext = path.extname(file).toLowerCase();
    const headers = { 'Content-Type': TYPES[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' };
    if (ext === '.html') {
      let html = buf.toString('utf8');
      html = html.includes('</body>') ? html.replace(/<\/body>(?![\s\S]*<\/body>)/, CLIENT + '</body>') : html + CLIENT;
      res.writeHead(200, headers); return res.end(html);
    }
    res.writeHead(200, headers); res.end(buf);
  });
});

server.listen(PORT, () => {
  console.log('');
  console.log('  에니어그램 로컬 서버 실행 중');
  console.log(`  → http://localhost:${PORT}`);
  console.log('  파일을 저장하면 브라우저가 자동으로 새로고침됩니다. (종료: Ctrl + C)');
  console.log('');
  if (process.argv.includes('--open')) {
    const cmd = process.platform === 'win32' ? `start "" http://localhost:${PORT}` : process.platform === 'darwin' ? `open http://localhost:${PORT}` : `xdg-open http://localhost:${PORT}`;
    require('child_process').exec(cmd);
  }
});
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') console.error(`  포트 ${PORT}가 이미 사용 중입니다. 이미 서버가 켜져 있는지 확인하세요. (다른 포트: set PORT=5501)`);
  else console.error(e);
  process.exit(1);
});
