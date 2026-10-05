// 로고 시안 생성기 — node design/logo/build.js
// 색은 css/tokens.css 값을 그대로 옮겨 씀 (SVG 파일은 CSS 변수를 못 읽음)
const fs = require('fs');
const path = require('path');
const out = __dirname;

const C = {
  primary: '#6553C2', soft: '#EEEAFD', lav1: '#8E7FE0', lav2: '#C46BB0',
  ink: '#191F28',
  // 유형 1~9 보석색 (--type-N)
  type: ['#BBD9FF', '#F7B8C8', '#EEF3FA', '#E4C7E4', '#D7C8FF', '#CDEDC6', '#FFE7A8', '#F59FA0', '#B5E4EC'],
};

const r2 = (n) => Math.round(n * 100) / 100;
// 유형 k(1~9)의 꼭짓점: 9번이 맨 위, 시계 방향
const pt = (k, R, cx = 60, cy = 60, off = 0) => {
  const a = ((-90 + 40 * k + off) * Math.PI) / 180;
  return [r2(cx + R * Math.cos(a)), r2(cy + R * Math.sin(a))];
};
const poly = (pts) => pts.map((p) => p.join(',')).join(' ');

/* A. 에니어그램 도형 = 보석 컷 선 */
function markA() {
  const R = 44;
  const P = (k) => pt(k, R);
  const tri = [9, 3, 6].map(P);
  const hex = [1, 4, 2, 8, 5, 7].map(P);
  const dots = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    .map((k) => `<circle cx="${P(k)[0]}" cy="${P(k)[1]}" r="5.2" fill="${C.type[k - 1]}" stroke="url(#aLine)" stroke-width="1.8"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
<defs>
<linearGradient id="aLine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.lav1}"/><stop offset="1" stop-color="${C.lav2}"/></linearGradient>
<linearGradient id="aFill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#EEE8FF"/><stop offset=".55" stop-color="#F8EAF5"/><stop offset="1" stop-color="#E8F1FF"/></linearGradient>
</defs>
<circle cx="60" cy="60" r="${R}" fill="url(#aFill)" stroke="url(#aLine)" stroke-width="2.4"/>
<polygon points="${poly(tri)}" fill="#FFFFFF" fill-opacity=".7" stroke="url(#aLine)" stroke-width="2.4" stroke-linejoin="round"/>
<polygon points="${poly(hex)}" fill="none" stroke="url(#aLine)" stroke-width="2.4" stroke-linejoin="round"/>
${dots}
</svg>`;
}

/* B. 아홉 빛 보석 — 위에서 본 브릴리언트 컷, 면마다 유형 색 */
function markB() {
  const Ro = 48, Ri = 25;
  const P = (k) => pt(k, Ro);
  const Q = (k) => pt(k, Ri, 60, 60, 20); // 테이블 꼭짓점: 두 바깥 꼭짓점 사이
  let facets = '';
  for (let k = 1; k <= 9; k++) {
    const n = (k % 9) + 1;
    // 바깥으로 향한 별 면(유형 k와 다음 유형 사이) + 꼭짓점 쪽 면(유형 k)
    facets += `<polygon points="${poly([P(k), P(n), Q(k)])}" fill="${C.type[k - 1]}"/>`;
    facets += `<polygon points="${poly([Q(k - 1 || 9), Q(k), P(k)])}" fill="${C.type[k - 1]}" fill-opacity=".72"/>`;
  }
  const table = poly([1, 2, 3, 4, 5, 6, 7, 8, 9].map(Q));
  const outer = poly([1, 2, 3, 4, 5, 6, 7, 8, 9].map(P));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
<defs>
<linearGradient id="bTable" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="${C.soft}"/></linearGradient>
<linearGradient id="bEdge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.lav1}"/><stop offset="1" stop-color="${C.lav2}"/></linearGradient>
</defs>
<g stroke="#FFFFFF" stroke-width="1.4" stroke-linejoin="round">${facets}</g>
<polygon points="${table}" fill="url(#bTable)" stroke="#FFFFFF" stroke-width="1.4" stroke-linejoin="round"/>
<polygon points="${outer}" fill="none" stroke="url(#bEdge)" stroke-width="2.4" stroke-linejoin="round"/>
<path d="M50 43 l2.2 5.8 5.8 2.2 -5.8 2.2 -2.2 5.8 -2.2 -5.8 -5.8 -2.2 5.8 -2.2z" fill="#FFFFFF"/>
</svg>`;
}

/* C. 닦은 보석 — 옆에서 본 보석 한 알 + 반짝임 */
function markC() {
  // 테이블(위) · 거들(가운데 띠) · 큘릿(아래 끝)
  const T1 = [42, 30], T2 = [78, 30], G1 = [20, 50], G2 = [100, 50], M1 = [48, 50], M2 = [72, 50], Cu = [60, 98];
  const f = (pts, fill, op = 1) => `<polygon points="${poly(pts)}" fill="${fill}" fill-opacity="${op}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
<defs>
<linearGradient id="cEdge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.lav1}"/><stop offset="1" stop-color="${C.lav2}"/></linearGradient>
</defs>
<g stroke="#FFFFFF" stroke-width="1.4" stroke-linejoin="round">
${f([T1, G1, M1], C.type[0])}
${f([T1, T2, M2, M1], '#FFFFFF')}
${f([T2, M2, G2], C.type[1])}
${f([G1, M1, Cu], C.type[4])}
${f([M1, M2, Cu], C.type[8])}
${f([M2, G2, Cu], C.type[3])}
</g>
<polygon points="${poly([T1, T2, G2, Cu, G1])}" fill="none" stroke="url(#cEdge)" stroke-width="2.6" stroke-linejoin="round"/>
<path d="M98 14 l2.8 7.2 7.2 2.8 -7.2 2.8 -2.8 7.2 -2.8 -7.2 -7.2 -2.8 7.2 -2.8z" fill="url(#cEdge)"/>
<path d="M18 22 l1.5 3.9 3.9 1.5 -3.9 1.5 -1.5 3.9 -1.5 -3.9 -3.9 -1.5 3.9 -1.5z" fill="${C.lav1}" fill-opacity=".7"/>
</svg>`;
}

const marks = {
  a: { name: 'A. 에니어그램 컷', note: '에니어그램 도형을 그대로 보석의 컷 선으로. 아홉 점은 유형별 보석색. 에니어그램이라는 게 가장 잘 드러나요.', svg: markA() },
  b: { name: 'B. 아홉 빛 보석', note: '위에서 본 보석 한 알. 바깥 아홉 면이 1~9번 유형 색이에요. "9가지 보석" 콘셉트와 앱 아이콘에 가장 잘 맞아요.', svg: markB() },
  c: { name: 'C. 닦은 보석', note: '옆에서 본 보석 한 알과 반짝임. "내 안의 보석을 닦아가는 다이어리"라는 이야기가 가장 쉽게 읽혀요.', svg: markC() },
};

for (const [k, m] of Object.entries(marks)) fs.writeFileSync(path.join(out, `logo-${k}.svg`), m.svg);

const inline = (svg) => svg.replace(/id="(\w+)"/g, (_, id) => `id="${id}__ID"`).replace(/url\(#(\w+)\)/g, 'url(#$1__ID)');
let uid = 0;
const use = (svg) => inline(svg).replace(/__ID/g, `_${uid++}`);

const sections = Object.entries(marks).map(([k, m]) => `
<section class="opt">
  <h2>${m.name}</h2>
  <p class="note">${m.note}</p>
  <div class="row">
    <div class="big">${use(m.svg)}</div>
    <div class="col">
      <div class="lockup"><span class="lm">${use(m.svg)}</span><span class="word">Enneagram</span></div>
      <div class="lockup ko"><span class="lm">${use(m.svg)}</span><span><b>에니어그램</b><small>나를 읽는 시간</small></span></div>
      <div class="icons">
        <span class="icon i180">${use(m.svg)}</span>
        <span class="icon i64">${use(m.svg)}</span>
        <span class="icon i40">${use(m.svg)}</span>
        <span class="fav">${use(m.svg)}</span>
        <span class="fav s">${use(m.svg)}</span>
      </div>
      <div class="ctx"><span class="tb"><span class="lm sm">${use(m.svg)}</span>Enneagram</span><span class="nav">홈 · 유형 검사 · 유형 탐구</span></div>
    </div>
  </div>
  <p class="file">파일: design/logo/logo-${k}.svg</p>
</section>`).join('');

fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>로고 시안</title>
<link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" rel="stylesheet">
<style>
body{margin:0;background:#F2F4F6;font-family:"Pretendard Variable",Pretendard,sans-serif;color:${C.ink}}
main{max-width:616px;margin:0 auto;background:#fff;padding:24px 16px 48px}
h1{font-size:28px;font-weight:700;margin:8px 0 4px}
.lead{font-size:15px;color:#6B7684;margin:0 0 24px}
.opt{border-top:1px solid #E5E8EB;padding:24px 0}
h2{font-size:22px;font-weight:700;margin:0 0 6px}
.note{font-size:15px;color:#4E5968;margin:0 0 16px;line-height:1.55}
.row{display:flex;gap:20px;flex-wrap:wrap;align-items:flex-start}
.big{width:180px;height:180px;flex:none}
.big svg,.lm svg,.icon svg,.fav svg{width:100%;height:100%;display:block}
.col{flex:1;min-width:240px;display:flex;flex-direction:column;gap:16px}
.lockup{display:flex;align-items:center;gap:10px}
.lm{width:44px;height:44px;flex:none}.lm.sm{width:28px;height:28px}
.word{font-size:22px;font-weight:700;letter-spacing:-.02em}
.ko b{display:block;font-size:18px;font-weight:700}.ko small{font-size:13px;color:#8B95A1}
.icons{display:flex;align-items:flex-end;gap:12px}
.icon{display:grid;place-items:center;flex:none;background:#fff;border-radius:22%;box-shadow:0 1px 3px rgba(0,0,0,.12),0 0 0 1px #E5E8EB}
.icon svg{width:80%!important;height:80%!important}
.i180{width:96px;height:96px}.i64{width:60px;height:60px}.i40{width:40px;height:40px}
.fav{width:32px;height:32px;flex:none}.fav.s{width:16px;height:16px}
.ctx{display:flex;align-items:center;justify-content:space-between;border:1px solid #E5E8EB;border-radius:12px;padding:10px 14px}
.tb{display:flex;align-items:center;gap:8px;font-size:16px;font-weight:700}
.nav{font-size:13px;color:#8B95A1}
.file{font-size:13px;color:#8B95A1;margin:12px 0 0}
</style></head><body><main>
<h1>로고 시안 3가지</h1>
<p class="lead">"9가지 유형 = 9개의 보석" 콘셉트, 메인 라벤더(#6553C2 계열)와 유형별 보석색으로 그렸어요. 큰 마크 · 가로 로고 · 앱 아이콘 · 파비콘(32/16px) · 상단 바 순서로 보여줘요.</p>
${sections}
</main></body></html>`);
console.log('done');
