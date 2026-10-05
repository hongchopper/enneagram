// 로고 3차: B·C·D·F × 보석이 아닌 메인 색 — node design/logo/build3.js
const fs = require('fs');
const path = require('path');
const out = __dirname;

const T = ['#BBD9FF', '#F7B8C8', '#EEF3FA', '#E4C7E4', '#D7C8FF', '#CDEDC6', '#FFE7A8', '#F59FA0', '#B5E4EC'];
const r2 = (n) => Math.round(n * 100) / 100;
const poly = (pts) => pts.map((p) => p.map(r2).join(',')).join(' ');
const sparkle = (x, y, s, fill) =>
  `<path d="M${x} ${y - s} L${x + s * 0.28} ${y - s * 0.28} L${x + s} ${y} L${x + s * 0.28} ${y + s * 0.28} L${x} ${y + s} L${x - s * 0.28} ${y + s * 0.28} L${x - s} ${y} L${x - s * 0.28} ${y - s * 0.28}Z" fill="${fill}"/>`;
const svg = (body, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs>${defs}</defs>${body}</svg>`;
const edge = (id, p) => `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.e1}"/><stop offset="1" stop-color="${p.e2}"/></linearGradient>`;
// 옆에서 본 보석 (C·F 공용)
const sideGem = (x, y, s, sw) => {
  const P = (a, b) => [x + a * s, y + b * s];
  const t1 = P(-18, -20), t2 = P(18, -20), g1 = P(-40, 0), g2 = P(40, 0), m1 = P(-12, 0), m2 = P(12, 0), cu = P(0, 48);
  return {
    faces: `<g stroke="#fff" stroke-width="${sw}" stroke-linejoin="round">
<polygon points="${poly([t1, g1, m1])}" fill="${T[0]}"/><polygon points="${poly([t1, t2, m2, m1])}" fill="#fff"/>
<polygon points="${poly([t2, m2, g2])}" fill="${T[1]}"/><polygon points="${poly([g1, m1, cu])}" fill="${T[4]}"/>
<polygon points="${poly([m1, m2, cu])}" fill="${T[8]}"/><polygon points="${poly([m2, g2, cu])}" fill="${T[3]}"/></g>`,
    outline: poly([t1, t2, g2, cu, g1]),
  };
};

const pt = (k, R, off = 0) => { const a = ((-90 + 40 * k + off) * Math.PI) / 180; return [60 + R * Math.cos(a), 60 + R * Math.sin(a)]; };

/* B. 아홉 빛 보석 (위에서 본 모습) */
function markB(p) {
  const P = (k) => pt(k, 48), Q = (k) => pt(k, 25, 20);
  let f = '';
  for (let k = 1; k <= 9; k++) {
    f += `<polygon points="${poly([P(k), P((k % 9) + 1), Q(k)])}" fill="${T[k - 1]}"/>`;
    f += `<polygon points="${poly([Q(k - 1 || 9), Q(k), P(k)])}" fill="${T[k - 1]}" fill-opacity=".72"/>`;
  }
  const ks = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  return svg(`<g stroke="#fff" stroke-width="1.4" stroke-linejoin="round">${f}</g>
<polygon points="${poly(ks.map(Q))}" fill="#fff" stroke="#fff" stroke-width="1.4"/>
<polygon points="${poly(ks.map(P))}" fill="none" stroke="url(#E)" stroke-width="2.6" stroke-linejoin="round"/>
${sparkle(50, 51, 8, p.soft)}`, edge('E', p));
}

/* C. 닦은 보석 (옆모습 + 반짝임) */
function markC(p) {
  const g = sideGem(60, 50, 1, 1.4);
  return svg(`${g.faces}<polygon points="${g.outline}" fill="none" stroke="url(#E)" stroke-width="2.6" stroke-linejoin="round"/>
${sparkle(98, 22, 9, 'url(#E)')}${sparkle(20, 22, 4.5, 'url(#E)')}`, edge('E', p));
}

/* D. 원석 결정 */
function markD(p) {
  const crystal = (cx, by, w, h, tip, rot, cl, cr) => {
    const L = [[-w / 2, 0], [-w / 2, -h], [0, -h - tip], [0, 0]], R = [[0, 0], [0, -h - tip], [w / 2, -h], [w / 2, 0]];
    return `<g transform="translate(${cx} ${by}) rotate(${rot})"><polygon points="${poly(L)}" fill="${cl}"/><polygon points="${poly(R)}" fill="${cr}"/>
<polygon points="${poly([...L.slice(0, 3), ...R.slice(2)])}" fill="none" stroke="url(#E)" stroke-width="2.4" stroke-linejoin="round"/>
<line x1="0" y1="0" x2="0" y2="${-h - tip}" stroke="#fff" stroke-width="1.4"/><line x1="${-w / 2}" y1="${-h}" x2="${w / 2}" y2="${-h}" stroke="#fff" stroke-width="1.4"/></g>`;
  };
  return svg(`${crystal(40, 96, 20, 30, 14, -22, T[0], T[8])}${crystal(82, 96, 20, 26, 12, 20, T[1], T[3])}${crystal(60, 98, 26, 50, 18, 0, '#fff', T[4])}
<path d="M18 98 Q30 88 46 92 Q60 86 76 92 Q92 88 102 98 Z" fill="${p.rock}"/>${sparkle(96, 26, 8, 'url(#E)')}`, edge('E', p));
}

/* F. 동굴 속 빛 */
function markF(p) {
  const g = sideGem(60, 66, 0.55, 1);
  return svg(`<path d="M14 106 V60 A46 46 0 0 1 106 60 V106 Z" fill="url(#C)"/>
<circle cx="60" cy="70" r="30" fill="url(#G)"/>${g.faces}
${sparkle(84, 40, 5, '#fff')}${sparkle(36, 50, 3.5, '#fff')}
<path d="M10 106 H110" stroke="url(#E)" stroke-width="3" stroke-linecap="round"/>`,
  `<linearGradient id="C" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.cave1}"/><stop offset="1" stop-color="${p.cave2}"/></linearGradient>
<radialGradient id="G"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".55" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` + edge('E', p));
}

const MARKS = [['B', '아홉 빛 보석', markB], ['C', '닦은 보석', markC], ['D', '원석 결정', markD], ['F', '동굴 속 빛', markF]];

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return ((x + 0.05) / (y + 0.05)).toFixed(1); };

// 보석 이름이 떠오르지 않는 색: 밤·잉크·돌·저녁처럼 "배경·빛" 쪽에서 가져옴
const PALETTES = [
  { name: '잉크', primary: '#2A2D3A', soft: '#EFF0F4', e1: '#2A2D3A', e2: '#555A6E', rock: '#E1E2E8', cave1: '#1B1D27', cave2: '#3A3E50',
    note: '거의 검정에 가까운 먹색. 앱의 색은 오로지 9가지 보석색이 맡아요. 애플·토스처럼 가장 담백하고, 어떤 유형 색과도 부딪치지 않아요.' },
  { name: '밤하늘', primary: '#353A6B', soft: '#ECEDF6', e1: '#353A6B', e2: '#6A62A8', rock: '#DADCEB', cave1: '#1F2247', cave2: '#43498A',
    note: '해가 진 뒤의 남색. 보석을 비추는 어둠이라는 느낌이라 동굴(F)·반짝임과 잘 어울리고, 지금 보라와도 자연스럽게 이어져요.' },
  { name: '저녁 보라', primary: '#5B5280', soft: '#EFEDF5', e1: '#5B5280', e2: '#8F7FB8', rock: '#E1DEEA', cave1: '#332D4F', cave2: '#5B5280',
    note: '지금 보라에서 채도를 빼서 회색빛을 섞은 색. 자수정처럼 쨍하지 않아서 보석이 떠오르지 않으면서, 지금 화면과 가장 덜 달라요.' },
  { name: '동굴 돌', primary: '#5A5048', soft: '#F3EFEB', e1: '#5A5048', e2: '#8C7F73', rock: '#E6E0D9', cave1: '#3A332D', cave2: '#6B5F55',
    note: '보석을 품고 있는 바위·흙의 따뜻한 회갈색. 다이어리·기록 느낌이 나고 다른 성격 검사 앱과 확실히 달라요. 대신 조금 어둡고 무거워 보일 수 있어요.' },
];

let uid = 0;
const scope = (s) => { const u = `_${uid++}`; return s.replace(/id="(\w+)"/g, `id="$1${u}"`).replace(/url\(#(\w+)\)/g, `url(#$1${u})`); };

// 대표 SVG는 첫 후보 색(잉크)이 아니라 색별로 저장
PALETTES.forEach((p, i) => MARKS.forEach(([k, , fn]) => fs.writeFileSync(path.join(out, `r3-${k.toLowerCase()}-${i + 1}.svg`), fn(p))));

const grid = `<div class="grid"><div></div>${MARKS.map(([k, n]) => `<div class="hd">${k}. ${n}</div>`).join('')}
${PALETTES.map((p) => `<div class="rl">${p.name}</div>${MARKS.map(([, , fn]) => `<div class="cell"><span class="icon i72">${scope(fn(p))}</span><span class="fav">${scope(fn(p))}</span><span class="fav s">${scope(fn(p))}</span></div>`).join('')}`).join('')}</div>`;

const colorSections = PALETTES.map((p, i) => `<section class="opt"><h3>${i + 1}. ${p.name}</h3><p class="note">${p.note}</p>
<div class="sw"><span style="background:${p.primary}"></span><span style="background:${p.e2}"></span><span style="background:${p.soft}"></span><small>${p.primary} · 흰 글자 대비 ${contrast(p.primary, '#FFFFFF')}:1</small></div>
<div class="demo"><div class="bar"><span class="lm">${scope(markB(p))}</span><b>Enneagram</b><span class="nav" style="color:${p.primary}">홈 · 유형 검사 · 유형 탐구</span></div>
<div class="demo-row"><button style="background:${p.primary}">간편 검사하기</button><span class="chip" style="background:${p.soft};color:${p.primary}">5번 탐구자</span><a style="color:${p.primary}">전체 보기</a></div>
<div class="types">${T.map((c, j) => `<span style="background:${c}">${j + 1}</span>`).join('')}</div></div></section>`).join('');

fs.writeFileSync(path.join(out, 'round3.html'), `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>로고·색 3차 시안</title>
<link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" rel="stylesheet">
<style>
body{margin:0;background:#F2F4F6;font-family:"Pretendard Variable",Pretendard,sans-serif;color:#191F28}
main{max-width:616px;margin:0 auto;background:#fff;padding:24px 16px 48px}
h1{font-size:28px;font-weight:700;margin:8px 0 4px}h2{font-size:22px;font-weight:700;margin:32px 0 8px}h3{font-size:18px;font-weight:700;margin:0 0 6px}
.lead,.note{font-size:15px;color:#4E5968;line-height:1.6;margin:0 0 12px}
svg{display:block;width:100%;height:100%}
.grid{display:grid;grid-template-columns:64px repeat(4,1fr);gap:12px 8px;align-items:center}
.hd{font-size:13px;font-weight:600;text-align:center}.rl{font-size:13px;font-weight:600}
.cell{display:flex;flex-direction:column;align-items:center;gap:6px}
.icon{display:grid;place-items:center;flex:none;background:#fff;border-radius:22%;box-shadow:0 1px 3px rgba(0,0,0,.12),0 0 0 1px #E5E8EB}
.icon svg{width:80%;height:80%}.i72{width:72px;height:72px}
.fav{width:32px;height:32px}.fav.s{width:16px;height:16px}
.opt{border-top:1px solid #E5E8EB;padding:20px 0}
.sw{display:flex;align-items:center;gap:6px;margin-bottom:12px}.sw span{width:32px;height:32px;border-radius:12px;box-shadow:0 0 0 1px rgba(0,0,0,.06)}.sw small{font-size:13px;color:#6B7684;margin-left:6px}
.demo{display:flex;flex-direction:column;gap:12px;border:1px solid #E5E8EB;border-radius:20px;padding:14px}
.bar{display:flex;align-items:center;gap:8px;font-size:16px}.bar .lm{width:28px;height:28px}.nav{margin-left:auto;font-size:13px;font-weight:600}
.demo-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
button{border:0;border-radius:999px;color:#fff;font:600 15px "Pretendard Variable",sans-serif;padding:10px 18px}
.chip{border-radius:999px;padding:6px 12px;font-size:13px;font-weight:600}.demo a{font-size:15px;font-weight:600}
.types{display:flex;gap:6px}.types span{width:28px;height:28px;border-radius:999px;display:grid;place-items:center;font-size:13px;font-weight:600;color:#191F28}
</style></head><body><main>
<h1>로고·색 3차 시안</h1>
<p class="lead">로고 B·C·D·F를, 특정 보석이 떠오르지 않는 메인 색 4가지에 맞춰 그렸어요. 보석 면은 언제나 9가지 유형 색이고, 테두리·반짝임·동굴만 메인 색을 따라가요.</p>
<h2>로고 × 메인 색</h2>${grid}
<h2>메인 색 후보</h2>
<p class="lead">"보석"은 9가지 유형 색이 맡고, 메인 색은 보석을 받쳐 주는 쪽(밤·잉크·돌)에서 골랐어요.</p>${colorSections}
</main></body></html>`);
console.log(PALETTES.map((p) => `${p.name} ${contrast(p.primary, '#FFFFFF')}`).join('\n'));
