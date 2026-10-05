// 모노그램 시안 (EG · E9) — node design/logo/build7.js <scratchpad>
// 기하 모노그램(M1·M2)은 같은 굵기 선을 격자 위에 정확히, 글꼴 모노그램(M3~M5)은 Outfit 외곽선(OFL)
const fs = require('fs');
const path = require('path');
const SP = process.argv[2];
const opentype = require(path.join(SP, 'node_modules/opentype.js'));
const outfit = opentype.loadSync(path.join(SP, 'node_modules/@fontsource/outfit/files/outfit-latin-600-normal.woff'));
const out = __dirname;

const INK = '#262B4D', DEEP = '#11142A', LAV = '#8E7FE0', SKY = '#3FA7B8';
const r = (n) => Math.round(n * 100) / 100;
const svg = (vb, body, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"><defs>${defs}</defs>${body}</svg>`;
const gemGrad = (id, x1 = 0, y1 = 0, x2 = 1, y2 = 1) => `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${LAV}"/><stop offset="1" stop-color="${SKY}"/></linearGradient>`;
const caveGrad = `<linearGradient id="cv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${DEEP}"/><stop offset="1" stop-color="${INK}"/></linearGradient>`;

// 글꼴 글자를 상자(cx, cy, 높이 h)에 맞춰 배치
function glyphs(text, cx, cy, h, track = 0) {
  const size = 100, gs = outfit.stringToGlyphs(text), parts = [];
  let x = 0;
  gs.forEach((g, i) => { parts.push(g.getPath(x, 0, size)); x += g.advanceWidth * size / outfit.unitsPerEm + track * size; if (gs[i + 1]) x += outfit.getKerningValue(g, gs[i + 1]) * size / outfit.unitsPerEm; });
  const all = new opentype.Path(); parts.forEach((p) => all.extend(p));
  const b = all.getBoundingBox(), s = h / (b.y2 - b.y1);
  const tx = cx - ((b.x1 + b.x2) / 2) * s, ty = cy - ((b.y1 + b.y2) / 2) * s;
  return { t: `translate(${r(tx)} ${r(ty)}) scale(${r(s * 1000) / 1000})`, d: parts.map((p) => p.toPathData(2)), w: (b.x2 - b.x1) * s };
}

/* M1. EG 한 획 — 열린 원(G)과 가운데 가로선(E의 가운데 팔)을 한 획으로 */
function m1() {
  const R = 34, a = (-35 * Math.PI) / 180, sx = r(50 + R * Math.cos(a)), sy = r(50 + R * Math.sin(a));
  return svg('0 0 100 100', `<path d="M${sx} ${sy} A${R} ${R} 0 1 0 84 50 H24" fill="none" stroke="${INK}" stroke-width="13" stroke-linejoin="miter"/>
<circle cx="${sx}" cy="${sy}" r="6.5" fill="url(#g)"/>`, gemGrad('g'));
}

/* M2. E9 격자 — 같은 굵기로 맞춘 E와 9, 9의 속에 보석 */
function m2() {
  const w = 12;
  return svg('6 9 110 82', `<circle cx="84" cy="40" r="13" fill="url(#g)"/>
<g fill="none" stroke="${INK}" stroke-width="${w}" stroke-linejoin="miter">
<path d="M52 21 H16 V79 H52 M16 50 H46"/>
<circle cx="84" cy="40" r="19"/><path d="M103 40 V85"/></g>`, gemGrad('g'));
}

/* M3. EG 유리 — 비치는 E와 G가 겹쳐요, 겹친 곳이 진해져요 */
function m3() {
  const e = glyphs('E', 40, 50, 64), g = glyphs('G', 64, 50, 66);
  return svg('0 0 104 100', `<g style="isolation:isolate"><path transform="${e.t}" d="${e.d[0]}" fill="${LAV}" fill-opacity=".9"/>
<path transform="${g.t}" d="${g.d[0]}" fill="${SKY}" fill-opacity=".85" style="mix-blend-mode:multiply"/></g>`);
}

/* M4. E9 결정 — 육각 결정 안에 E9 */
function m4() {
  const t = glyphs('E9', 50, 56, 30, 0.02);
  const hex = '50,4 86,25 86,79 50,100 14,79 14,25';
  return svg('10 2 80 100', `<polygon points="${hex}" fill="url(#cv)"/>
<polygon points="50,4 14,25 14,79 50,100" fill="#FFFFFF" fill-opacity=".07"/>
<g fill="#FFFFFF" transform="${t.t}">${t.d.map((d) => `<path d="${d}"/>`).join('')}</g>
<path d="M50 4 L86 25" stroke="url(#g)" stroke-width="3" stroke-linecap="round"/>`, caveGrad + gemGrad('g'));
}

/* M5. E9 동굴 — 로고 D5의 동굴 입구 안에 E9 */
function m5() {
  const t = glyphs('E9', 60, 78, 32, 0.02);
  return svg('10 9 100 100', `<path d="M12 108 V58 A48 48 0 0 1 108 58 V108 Z" fill="url(#cv)"/>
<ellipse cx="60" cy="84" rx="40" ry="26" fill="url(#gl)"/>
<g fill="#FFFFFF" transform="${t.t}">${t.d.map((d) => `<path d="${d}"/>`).join('')}</g>`,
  caveGrad + `<radialGradient id="gl"><stop offset="0" stop-color="#AEBBFF" stop-opacity=".45"/><stop offset="1" stop-color="#AEBBFF" stop-opacity="0"/></radialGradient>`);
}

const M = [
  ['m1', 'M1. EG 한 획', '열린 원이 G, 가운데를 가로지르는 선이 E의 가운데 팔이에요. 한 획으로 두 글자가 읽혀요. 끝점 하나에만 보석색을 넣었어요.', m1],
  ['m2', 'M2. E9 격자', 'E와 9를 같은 굵기·같은 높이로 맞췄어요. "9가지 유형"의 9가 들어가고, 9의 속에 보석이 박혀 있어요.', m2],
  ['m3', 'M3. EG 유리', '비치는 E와 G가 겹치고, 겹친 곳이 진해져요. 투명한 유리 느낌이에요.', m3],
  ['m4', 'M4. E9 결정', '육각 결정 안에 E9. 앱 아이콘·프로필 이미지로 바로 쓸 수 있는 배지형이에요.', m4],
  ['m5', 'M5. E9 동굴', '지금 상단 로고(동굴 속 결정)의 동굴 안에 E9를 넣었어요. 지금 로고와 가장 자연스럽게 이어져요.', m5],
];

let uid = 0;
const scope = (s) => { const u = `_${uid++}`; return s.replace(/id="(\w+)"/g, `id="$1${u}"`).replace(/url\(#(\w+)\)/g, `url(#$1${u})`); };
M.forEach(([k, , , fn]) => fs.writeFileSync(path.join(out, `monogram-${k}.svg`), fn()));

const sections = M.map(([k, name, note, fn]) => `<section class="opt"><h3>${name}</h3><p class="note">${note}</p>
<div class="row"><div class="big">${scope(fn())}</div>
<div class="col"><div class="sizes"><span class="icon">${scope(fn())}</span><span class="h32">${scope(fn())}</span><span class="h16">${scope(fn())}</span></div>
<div class="hdr"><span class="h30">${scope(fn())}</span><b>에니어그램</b><span class="search"></span></div></div></div>
<p class="file">design/logo/monogram-${k}.svg</p></section>`).join('');

fs.writeFileSync(path.join(out, 'monogram.html'), `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>모노그램 시안</title>
<link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" rel="stylesheet">
<style>
body{margin:0;background:#F2F4F6;font-family:"Pretendard Variable",Pretendard,sans-serif;color:#191F28}
main{max-width:616px;margin:0 auto;background:#fff;padding:24px 16px 48px}
h1{font-size:28px;font-weight:700;margin:8px 0 4px}h3{font-size:18px;font-weight:700;margin:0 0 6px}
.lead,.note{font-size:15px;color:#4E5968;line-height:1.6;margin:0 0 14px}
svg{display:block;height:100%;width:auto}
.opt{border-top:1px solid #E5E8EB;padding:24px 0}
.row{display:flex;gap:20px;align-items:center;flex-wrap:wrap}
.big{height:120px;display:grid;place-items:center}
.col{flex:1;min-width:240px;display:flex;flex-direction:column;gap:14px}
.sizes{display:flex;align-items:flex-end;gap:14px}
.icon{display:grid;place-items:center;width:60px;height:60px;border-radius:22%;box-shadow:0 1px 3px rgba(0,0,0,.12),0 0 0 1px #E5E8EB}.icon svg{height:70%}
.h32{height:32px}.h16{height:16px}.h30{height:30px;flex:none}
.hdr{display:flex;align-items:center;gap:10px;height:60px;padding:0 16px;border:1px solid #E5E8EB;border-radius:20px;font-size:16px}
.hdr .search{margin-left:auto;width:36px;height:36px;border-radius:999px;box-shadow:inset 0 0 0 1px #E5E8EB}
.file{font-size:13px;color:#8B95A1;margin:12px 0 0}
</style></head><body><main>
<h1>모노그램 시안</h1>
<p class="lead">글자를 늘어놓는 대신, EG·E9 두 글자를 하나의 기호로 묶었어요. 큰 크기 · 앱 아이콘 · 32px · 16px · 상단 바 순서로 보여줘요.</p>
${sections}
</main></body></html>`);
console.log('done');
