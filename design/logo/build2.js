// 로고 시안 2차(D~I) + 메인 색 후보 — node design/logo/build2.js
const fs = require('fs');
const path = require('path');
const out = __dirname;

const T = ['#BBD9FF', '#F7B8C8', '#EEF3FA', '#E4C7E4', '#D7C8FF', '#CDEDC6', '#FFE7A8', '#F59FA0', '#B5E4EC'];
const r2 = (n) => Math.round(n * 100) / 100;
const poly = (pts) => pts.map((p) => p.map(r2).join(',')).join(' ');
const sparkle = (x, y, s, fill) =>
  `<path d="M${x} ${y - s} L${x + s * 0.28} ${y - s * 0.28} L${x + s} ${y} L${x + s * 0.28} ${y + s * 0.28} L${x} ${y + s} L${x - s * 0.28} ${y + s * 0.28} L${x - s} ${y} L${x - s * 0.28} ${y - s * 0.28}Z" fill="${fill}"/>`;
const edgeGrad = (id, a, b) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
const svg = (body, defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs>${defs}</defs>${body}</svg>`;

/* D. 원석 결정 — 자수정 군집처럼 솟은 결정 세 개 */
function markD(p) {
  const crystal = (cx, by, w, h, tip, rot, cl, cr) => {
    const L = [[-w / 2, 0], [-w / 2, -h], [0, -h - tip], [0, 0]];
    const R = [[0, 0], [0, -h - tip], [w / 2, -h], [w / 2, 0]];
    return `<g transform="translate(${cx} ${by}) rotate(${rot})">
<polygon points="${poly(L)}" fill="${cl}"/><polygon points="${poly(R)}" fill="${cr}"/>
<polygon points="${poly([...L.slice(0, 3), ...R.slice(2)])}" fill="none" stroke="url(#dE)" stroke-width="2.4" stroke-linejoin="round"/>
<line x1="0" y1="0" x2="0" y2="${-h - tip}" stroke="#fff" stroke-width="1.4"/>
<line x1="${-w / 2}" y1="${-h}" x2="${w / 2}" y2="${-h}" stroke="#fff" stroke-width="1.4"/></g>`;
  };
  return svg(
    `${crystal(40, 96, 20, 30, 14, -22, T[0], T[8])}
${crystal(82, 96, 20, 26, 12, 20, T[1], T[3])}
${crystal(60, 98, 26, 50, 18, 0, '#fff', T[4])}
<path d="M18 98 Q30 88 46 92 Q60 86 76 92 Q92 88 102 98 Z" fill="${p.rock}" />
${sparkle(96, 26, 8, 'url(#dE)')}`,
    edgeGrad('dE', p.e1, p.e2)
  );
}

/* E. 지오드 — 돌을 쪼개면 안쪽에 보석 결정. "내 안의 보석" */
function markE(p) {
  const n = 16, rock = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, rr = 50 + (i % 3 === 0 ? -3 : i % 2 ? 1.5 : 0);
    rock.push([60 + rr * Math.cos(a), 60 + rr * Math.sin(a)]);
  }
  let teeth = '';
  const m = 18;
  for (let i = 0; i < m; i++) {
    const a0 = (i / m) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / m) * Math.PI * 2 - Math.PI / 2, am = (a0 + a1) / 2;
    const tip = i % 2 ? 22 : 18;
    teeth += `<polygon points="${poly([
      [60 + 37 * Math.cos(a0), 60 + 37 * Math.sin(a0)],
      [60 + 37 * Math.cos(a1), 60 + 37 * Math.sin(a1)],
      [60 + tip * Math.cos(am), 60 + tip * Math.sin(am)],
    ])}" fill="${T[Math.floor(i / 2) % 9]}"/>`;
  }
  return svg(
    `<polygon points="${poly(rock)}" fill="${p.rock}" stroke="url(#eE)" stroke-width="2.4" stroke-linejoin="round"/>
<circle cx="60" cy="60" r="37" fill="url(#eG)"/>
<g stroke="#fff" stroke-width="1.2" stroke-linejoin="round">${teeth}</g>
${sparkle(60, 60, 9, '#fff')}`,
    edgeGrad('eE', p.e1, p.e2) +
      `<radialGradient id="eG"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="${p.soft}"/></radialGradient>`
  );
}

/* F. 동굴 속 빛 — 어두운 동굴 입구 안에서 빛나는 보석 */
function markF(p) {
  const g = (x, y, s) => {
    const P = (a, b) => [x + a * s, y + b * s];
    const t1 = P(-9, -8), t2 = P(9, -8), g1 = P(-18, 0), g2 = P(18, 0), m1 = P(-6, 0), m2 = P(6, 0), cu = P(0, 22);
    return `<g stroke="#fff" stroke-width="1" stroke-linejoin="round">
<polygon points="${poly([t1, g1, m1])}" fill="${T[0]}"/><polygon points="${poly([t1, t2, m2, m1])}" fill="#fff"/>
<polygon points="${poly([t2, m2, g2])}" fill="${T[1]}"/><polygon points="${poly([g1, m1, cu])}" fill="${T[4]}"/>
<polygon points="${poly([m1, m2, cu])}" fill="${T[8]}"/><polygon points="${poly([m2, g2, cu])}" fill="${T[3]}"/></g>`;
  };
  return svg(
    `<path d="M14 106 V60 A46 46 0 0 1 106 60 V106 Z" fill="url(#fC)"/>
<circle cx="60" cy="70" r="30" fill="url(#fGlow)"/>
${g(60, 66, 1.25)}
${sparkle(84, 40, 5, '#fff')}${sparkle(36, 50, 3.5, '#fff')}
<path d="M10 106 H110" stroke="url(#fE)" stroke-width="3" stroke-linecap="round"/>`,
    `<linearGradient id="fC" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.cave1}"/><stop offset="1" stop-color="${p.cave2}"/></linearGradient>
<radialGradient id="fGlow"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".55" stop-color="${p.soft}" stop-opacity=".45"/><stop offset="1" stop-color="${p.soft}" stop-opacity="0"/></radialGradient>` +
      edgeGrad('fE', p.e1, p.e2)
  );
}

/* G. 반쯤 닦은 원석 — 왼쪽은 거친 돌, 오른쪽은 닦인 보석 */
function markG(p) {
  const c = [62, 58];
  const ring = [[60, 22], [80, 20], [98, 42], [102, 72], [82, 98], [60, 99], [42, 100], [20, 72], [26, 40], [46, 22]];
  const fills = [T[0], T[4], T[1], T[8], T[3], p.r1, p.r2, p.r1, p.r3, p.r2];
  let f = '';
  for (let i = 0; i < ring.length; i++) f += `<polygon points="${poly([c, ring[i], ring[(i + 1) % ring.length]])}" fill="${fills[i]}"/>`;
  return svg(
    `<g stroke="#fff" stroke-width="1.3" stroke-linejoin="round">${f}</g>
<polyline points="${poly(ring.slice(0, 6))}" fill="none" stroke="url(#gE)" stroke-width="2.6" stroke-linejoin="round"/>
<polyline points="${poly([...ring.slice(5), ring[0]])}" fill="none" stroke="${p.rockLine}" stroke-width="2.6" stroke-linejoin="round" stroke-dasharray="7 3"/>
${sparkle(104, 18, 8, 'url(#gE)')}`,
    edgeGrad('gE', p.e1, p.e2)
  );
}

/* H. 보석 다이어리 — 표지에 보석이 박힌 마법 다이어리 */
function markH(p) {
  const s = 1, x = 64, y = 56;
  const P = (a, b) => [x + a * s, y + b * s];
  const t1 = P(-8, -7), t2 = P(8, -7), g1 = P(-16, 0), g2 = P(16, 0), m1 = P(-5, 0), m2 = P(5, 0), cu = P(0, 19);
  return svg(
    `<rect x="26" y="14" width="72" height="92" rx="12" fill="url(#hB)"/>
<rect x="26" y="14" width="14" height="92" rx="7" fill="${p.e1}" fill-opacity=".35"/>
<path d="M80 98 V114 L86 109 L92 114 V98" fill="${T[1]}" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/>
<g stroke="#fff" stroke-width="1.1" stroke-linejoin="round">
<polygon points="${poly([t1, g1, m1])}" fill="${T[0]}"/><polygon points="${poly([t1, t2, m2, m1])}" fill="#fff"/>
<polygon points="${poly([t2, m2, g2])}" fill="${T[1]}"/><polygon points="${poly([g1, m1, cu])}" fill="${T[4]}"/>
<polygon points="${poly([m1, m2, cu])}" fill="${T[8]}"/><polygon points="${poly([m2, g2, cu])}" fill="${T[3]}"/></g>
${sparkle(84, 30, 5, '#fff')}`,
    `<linearGradient id="hB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.e1}"/><stop offset="1" stop-color="${p.e2}"/></linearGradient>`
  );
}

/* I. 아홉 면 보석 — C의 옆모습 + B의 아홉 색 (윗면 6 + 아랫면 3 = 9면) */
function markI(p) {
  const c = [16, 38, 60, 82, 104].map((x) => [x, 50]);
  const t = [40, 60, 80].map((x) => [x, 28]);
  const pv = [16, 45, 75, 104].map((x) => [x, 50]);
  const cu = [60, 100];
  const crown = [[c[0], t[0], c[1]], [t[0], t[1], c[1]], [c[1], t[1], c[2]], [t[1], t[2], c[2]], [c[2], t[2], c[3]], [t[2], c[4], c[3]]];
  const pav = [[pv[0], pv[1], cu], [pv[1], pv[2], cu], [pv[2], pv[3], cu]];
  const order = [0, 4, 2, 1, 6, 8, 3, 5, 7]; // 옆 면끼리 색이 겹치지 않게
  const faces = [...crown, ...pav].map((f, i) => `<polygon points="${poly(f)}" fill="${T[order[i]]}"/>`).join('');
  return svg(
    `<g stroke="#fff" stroke-width="1.3" stroke-linejoin="round">${faces}</g>
<polygon points="${poly([t[0], t[2], c[4], cu, c[0]])}" fill="none" stroke="url(#iE)" stroke-width="2.6" stroke-linejoin="round"/>
${sparkle(100, 18, 8, 'url(#iE)')}${sparkle(20, 24, 4, 'url(#iE)')}`,
    edgeGrad('iE', p.e1, p.e2)
  );
}

const MARKS = [
  ['d', 'D. 원석 결정', '자수정 군집처럼 땅에서 솟은 결정 세 개. 아직 다듬지 않은 "원석"이라 성장·가능성 이야기와 잘 맞아요.', markD],
  ['e', 'E. 지오드', '겉은 평범한 돌인데 쪼개 보면 안쪽에 보석 결정이 가득한 지오드. "내 안의 보석을 깨운다"는 말을 그대로 그림으로 옮겼어요. 결정 18개가 1~9번 색을 두 번씩 돌아요.', markE],
  ['f', 'F. 동굴 속 빛', '어두운 동굴 입구 안에서 보석 하나가 빛나요. 앱 아이콘으로 눈에 가장 잘 띄고, 깊은 색 메인과 잘 어울려요.', markF],
  ['g', 'G. 반쯤 닦은 원석', '왼쪽은 아직 거친 돌(점선), 오른쪽은 닦여서 빛나는 면. "보석 닦기" 기능과 다이어리로 조금씩 나아지는 과정을 담았어요.', markG],
  ['h', 'H. 보석 다이어리', '표지에 보석이 박힌 다이어리와 책갈피. "마법 다이어리"라는 앱 정체성이 가장 직접적으로 드러나요.', markH],
  ['i', 'I. 아홉 면 보석 (B+C)', 'C의 옆모습 보석에 B의 아홉 색을 입혔어요. 윗면 6개와 아랫면 3개, 모두 9면이에요.', markI],
];

/* 메인 색 후보 — 흰 글자 대비를 직접 계산 */
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return ((x + 0.05) / (y + 0.05)).toFixed(1); };

const PALETTES = [
  { key: 'amethyst', name: '자수정 (지금)', gem: '자수정', primary: '#6553C2', soft: '#EEEAFD', e1: '#8E7FE0', e2: '#C46BB0', rock: '#D9D3E6', cave1: '#3B3170', cave2: '#6553C2',
    note: '지금 색. 차분하고 신비로운 느낌. 다만 심리·명상 앱에서 아주 흔한 색이라 앱이 잘 구분되지 않아요.' },
  { key: 'cave', name: '동굴 밤 + 오팔', gem: '오팔·문스톤', primary: '#2F2B5C', soft: '#ECEBF6', e1: '#5E58A8', e2: '#B07CC6', rock: '#CFCDE0', cave1: '#1E1B3D', cave2: '#3F3A7A',
    note: '메인은 동굴처럼 아주 깊은 남보라, 화면에 빛을 내는 건 9가지 파스텔 보석색. 메인이 한발 물러나서 유형 색이 더 잘 보여요. 동굴 콘셉트(F·E)와 가장 잘 맞아요.' },
  { key: 'sapphire', name: '사파이어', gem: '사파이어', primary: '#2D5BC4', soft: '#EAF0FC', e1: '#4E7FE0', e2: '#3FA7B8', rock: '#D3DCEB', cave1: '#1C2F66', cave2: '#2D5BC4',
    note: '맑고 믿음직한 파랑. 검사·분석 결과를 신뢰하게 만드는 색이에요. 다만 토스·은행 앱과 비슷하게 느껴질 수 있어요.' },
  { key: 'emerald', name: '에메랄드', gem: '에메랄드', primary: '#13795B', soft: '#E6F4EE', e1: '#2FA27C', e2: '#3A97A8', rock: '#D2E2DA', cave1: '#0D3B30', cave2: '#13795B',
    note: '성장·회복·안정의 초록. 다이어리와 "닦아가는" 이야기에 잘 맞고, 보라·파랑 위주인 성격 검사 앱 사이에서 눈에 띄어요.' },
  { key: 'garnet', name: '가넷 · 로즈', gem: '가넷·로즈쿼츠', primary: '#B03A5B', soft: '#FBEAEF', e1: '#D0607E', e2: '#C9733D', rock: '#E8D6DA', cave1: '#4A1A2A', cave2: '#B03A5B',
    note: '따뜻하고 다정한 붉은 보석. 관계·감정 이야기와 잘 맞아요. 대신 경고(에러) 빨강과 헷갈리지 않게 에러 색을 따로 정해야 해요.' },
];

let uid = 0;
const scope = (s) => { const u = `_${uid++}`; return s.replace(/id="(\w+)"/g, `id="$1${u}"`).replace(/url\(#(\w+)\)/g, `url(#$1${u})`); };

// 로고 파일은 기본(자수정) 색으로 저장
const base = PALETTES[0];
const baseP = { ...base, r1: '#D9D3E6', r2: '#C9C1D9', r3: '#E6E1EE', rockLine: '#A79CBF' };
for (const [k, , , fn] of MARKS) fs.writeFileSync(path.join(out, `logo-${k}.svg`), fn(baseP));

const logoSections = MARKS.map(([k, name, note, fn]) => `
<section class="opt"><h3>${name}</h3><p class="note">${note}</p>
<div class="row"><div class="big">${scope(fn(baseP))}</div>
<div class="col">
<div class="lockup"><span class="lm">${scope(fn(baseP))}</span><span class="word">Enneagram</span></div>
<div class="icons"><span class="icon i96">${scope(fn(baseP))}</span><span class="icon i60">${scope(fn(baseP))}</span><span class="icon i40">${scope(fn(baseP))}</span><span class="fav">${scope(fn(baseP))}</span><span class="fav s">${scope(fn(baseP))}</span></div>
</div></div><p class="file">design/logo/logo-${k}.svg</p></section>`).join('');

const colorSections = PALETTES.map((p) => {
  const pp = { ...p, r1: p.rock, r2: p.rock, r3: '#fff', rockLine: p.e1 };
  return `<section class="opt"><h3>${p.name}</h3><p class="note">${p.note}</p>
<div class="sw"><span style="background:${p.primary}"></span><span style="background:${p.e1}"></span><span style="background:${p.e2}"></span><span style="background:${p.soft}"></span>
<small>${p.primary} · 흰 글자 대비 ${contrast(p.primary, '#FFFFFF')}:1</small></div>
<div class="demo">
<div class="bar"><span class="lm sm">${scope(markE(pp))}</span><b>Enneagram</b></div>
<div class="demo-row"><span class="icon i60">${scope(markF(pp))}</span><span class="icon i60">${scope(markI(pp))}</span><span class="icon i60">${scope(markD(pp))}</span></div>
<div class="demo-row"><button style="background:${p.primary}">간편 검사하기</button><span class="chip" style="background:${p.soft};color:${p.primary}">5번 탐구자</span><a style="color:${p.primary}">전체 보기</a></div>
</div></section>`;
}).join('');

fs.writeFileSync(path.join(out, 'round2.html'), `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>로고·색 2차 시안</title>
<link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" rel="stylesheet">
<style>
body{margin:0;background:#F2F4F6;font-family:"Pretendard Variable",Pretendard,sans-serif;color:#191F28}
main{max-width:616px;margin:0 auto;background:#fff;padding:24px 16px 48px}
h1{font-size:28px;font-weight:700;margin:8px 0 4px}h2{font-size:22px;font-weight:700;margin:32px 0 8px}
.lead,.ref{font-size:15px;color:#4E5968;line-height:1.6;margin:0 0 12px}
.ref li{margin-bottom:4px}
.opt{border-top:1px solid #E5E8EB;padding:20px 0}
h3{font-size:18px;font-weight:700;margin:0 0 6px}
.note{font-size:15px;color:#4E5968;margin:0 0 14px;line-height:1.55}
.row{display:flex;gap:20px;flex-wrap:wrap;align-items:center}
.big{width:160px;height:160px;flex:none}
svg{display:block;width:100%;height:100%}
.col{flex:1;min-width:220px;display:flex;flex-direction:column;gap:16px}
.lockup{display:flex;align-items:center;gap:10px}.lm{width:44px;height:44px;flex:none}.lm.sm{width:28px;height:28px}
.word{font-size:22px;font-weight:700;letter-spacing:-.02em}
.icons,.demo-row{display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap}
.icon{display:grid;place-items:center;flex:none;background:#fff;border-radius:22%;box-shadow:0 1px 3px rgba(0,0,0,.12),0 0 0 1px #E5E8EB}
.icon svg{width:80%;height:80%}
.i96{width:96px;height:96px}.i60{width:60px;height:60px}.i40{width:40px;height:40px}
.fav{width:32px;height:32px;flex:none}.fav.s{width:16px;height:16px}
.file{font-size:13px;color:#8B95A1;margin:10px 0 0}
.sw{display:flex;align-items:center;gap:6px;margin-bottom:12px}.sw span{width:32px;height:32px;border-radius:12px;box-shadow:0 0 0 1px rgba(0,0,0,.06)}.sw small{font-size:13px;color:#6B7684;margin-left:6px}
.demo{display:flex;flex-direction:column;gap:12px;border:1px solid #E5E8EB;border-radius:20px;padding:14px}
.bar{display:flex;align-items:center;gap:8px;font-size:16px}
button{border:0;border-radius:999px;color:#fff;font:600 15px "Pretendard Variable",sans-serif;padding:10px 18px}
.chip{border-radius:999px;padding:6px 12px;font-size:13px;font-weight:600}
.demo-row{align-items:center}.demo a{font-size:15px;font-weight:600}
</style></head><body><main>
<h1>로고·색 2차 시안</h1>
<p class="lead">원석·지오드·동굴 느낌으로 로고 후보 6개(D~I)를 더 그렸고, 보석에서 따온 메인 색 후보 5개를 같은 화면 조각에 입혀 봤어요.</p>
<h2>참고한 다른 브랜드</h2>
<ul class="ref">
<li><b>Obsidian</b> (메모 앱): 보라색 각진 결정 하나. 각진 면과 밝기 차이만으로 입체감을 내요 → D·I</li>
<li><b>Sketch</b> (디자인 도구): 노랑·주황 면으로 나눈 다이아몬드 → C·I의 면 나누기</li>
<li><b>Ruby</b> (프로그래밍 언어): 빨간 보석 한 알, 단색으로도 알아볼 수 있는 윤곽 → 파비콘 크기 기준</li>
<li><b>Tiffany & Co.</b>: 보석 그림 대신 색 하나(티파니 블루)로 기억되는 브랜드 → 아래 색 후보</li>
</ul>
<h2>로고 후보 D~I</h2>
${logoSections}
<h2>메인 색 후보</h2>
<p class="lead">유형 9색(파스텔 보석색)은 그대로 두고, 메인 색(버튼·링크·로고 선)만 바꿔 본 거예요. 대비 4.5:1 이상이면 흰 글자를 올려도 읽기 편해요.</p>
${colorSections}
</main></body></html>`);
console.log(PALETTES.map((p) => `${p.name} ${contrast(p.primary, '#FFFFFF')}`).join('\n'));
