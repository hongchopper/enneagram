#!/usr/bin/env node
/* 모바일 웹(앱 폭) 전환용 일회성 변환 스크립트 (2026-10-01)
 *
 * 화면을 항상 폭 --app-frame(480px) 안에서 그리기로 했으므로, "실제로 그려지는 폭" = min(뷰포트, 480).
 * 그 가정에서 미디어 쿼리를 정확히 정리한다.
 *   - max-width: X (X >= 480) → 항상 참 → 조건 제거
 *   - min-width: Y (Y > 480)  → 항상 거짓 → 그 쿼리 제거
 *   - 그 밖의 조건(작은 폰 360/390/420, print, hover, prefers-*, orientation)은 그대로
 *   조건이 모두 사라진 @media는 안쪽 규칙만 남기고(순서 유지), 거짓만 남은 @media는 통째로 지운다.
 *   - Nvw 단위 → calc(var(--app-vw) * N / 100)  (--app-vw = min(100vw, 앱 폭))
 * 480px 이하 화면에서는 변환 전과 똑같이 그려진다.
 *
 * 사용: node tools/app-frame-media.js css/layers/*.css
 */
const fs = require('fs');
const APP = 480;

function evalQuery(q) {
  // 반환: 'true' | 'false' | 남은 쿼리 문자열
  const raw = q.trim();
  if (!raw) return 'true';
  const parts = raw.split(/\s+and\s+/i);
  const keep = [];
  for (const p of parts) {
    const m = p.match(/^\(\s*(max|min)-width\s*:\s*(\d+(?:\.\d+)?)px\s*\)$/i);
    if (!m) { keep.push(p.trim()); continue; }
    const v = parseFloat(m[2]);
    if (m[1].toLowerCase() === 'max') { if (v >= APP) continue; keep.push(p.trim()); }
    else { if (v > APP) return 'false'; keep.push(p.trim()); }
  }
  if (!keep.length) return 'true';
  if (keep.length === 1 && /^(screen|all)$/i.test(keep[0])) return 'true';
  return keep.join(' and ');
}

function evalList(prelude) {
  const qs = prelude.split(',').map(evalQuery);
  if (qs.includes('true')) return 'true';
  const rest = qs.filter(q => q !== 'false');
  return rest.length ? rest.join(', ') : 'false';
}

function matchBrace(s, open) {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    const c = s[i];
    if (c === '/' && s[i + 1] === '*') { i = s.indexOf('*/', i + 2) + 1; continue; }
    if (c === '"' || c === "'") { const j = s.indexOf(c, i + 1); i = j; continue; }
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return i; }
  }
  throw new Error('unbalanced braces');
}

function transform(css) {
  let out = '', i = 0, stats = { unwrapped: 0, removed: 0, kept: 0 };
  while (i < css.length) {
    const at = css.indexOf('@media', i);
    if (at < 0) { out += css.slice(i); break; }
    // 주석 안의 @media는 건너뛴다
    const lastOpen = css.lastIndexOf('/*', at), lastClose = css.lastIndexOf('*/', at);
    if (lastOpen > lastClose) { const end = css.indexOf('*/', at) + 2; out += css.slice(i, end); i = end; continue; }
    out += css.slice(i, at);
    const open = css.indexOf('{', at);
    const close = matchBrace(css, open);
    const prelude = css.slice(at + 6, open);
    const inner = css.slice(open + 1, close);
    const res = evalList(prelude.trim());
    if (res === 'true') { out += transform(inner).css; stats.unwrapped++; }
    else if (res === 'false') { stats.removed++; }
    else { out += '@media ' + res + ' {' + transform(inner).css + '}'; stats.kept++; }
    i = close + 1;
  }
  return { css: out, stats };
}

function vw(css) {
  return css.replace(/(-?\d*\.?\d+)vw\b/g, (m, n) => (n === '100' ? 'var(--app-vw)' : `calc(var(--app-vw) * ${n} / 100)`));
}

for (const f of process.argv.slice(2)) {
  const src = fs.readFileSync(f, 'utf8');
  const { css, stats } = transform(src);
  const next = vw(css);
  if (next !== src) fs.writeFileSync(f, next);
  console.log(f, stats);
}
