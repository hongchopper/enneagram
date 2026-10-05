// 로고 4차: D(원석 결정) 변형 6개 × 동굴·밤하늘·유리 색 — node design/logo/build4.js
// 반짝이 장식 없음, 두꺼운 외곽선·흙더미 없음 (게임 아이콘 느낌 줄이기)
const fs = require('fs');
const path = require('path');
const out = __dirname;

const T = ['#BBD9FF', '#F7B8C8', '#EEF3FA', '#E4C7E4', '#D7C8FF', '#CDEDC6', '#FFE7A8', '#F59FA0', '#B5E4EC'];
const r2 = (n) => Math.round(n * 100) / 100;
const poly = (pts) => pts.map((p) => p.map(r2).join(',')).join(' ');
const svg = (body, defs = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs>${defs}</defs>${body}</svg>`;

// 결정 하나의 점: 왼쪽 면·오른쪽 면·윤곽 (아래 가운데가 원점)
const shape = (w, h, tip) => ({
  L: [[-w / 2, 0], [-w / 2, -h], [0, -h - tip], [0, 0]],
  R: [[0, 0], [0, -h - tip], [w / 2, -h], [w / 2, 0]],
  O: [[-w / 2, 0], [-w / 2, -h], [0, -h - tip], [w / 2, -h], [w / 2, 0]],
});
const at = (x, y, rot, inner) => `<g transform="translate(${x} ${y}) rotate(${rot})">${inner}</g>`;
// 기본 배치: 가운데 큰 결정 + 양옆 기운 결정
const CL = [
  { x: 42, y: 100, w: 20, h: 28, tip: 13, rot: -18 },
  { x: 78, y: 100, w: 20, h: 24, tip: 12, rot: 18 },
  { x: 60, y: 102, w: 26, h: 50, tip: 18, rot: 0 },
];

/* D1. 한 줄 결정 — 같은 굵기 선 하나로만 */
function d1(p, dark) {
  const c = dark ? p.glow : p.primary;
  const body = CL.map((k) => {
    const s = shape(k.w, k.h, k.tip);
    return at(k.x, k.y, k.rot, `<polygon points="${poly(s.O)}" fill="${dark ? p.deep : '#fff'}" stroke="${c}" stroke-width="3" stroke-linejoin="round"/>
<polyline points="${poly([[-k.w / 2, -k.h], [0, -k.h + 5], [k.w / 2, -k.h]])}" fill="none" stroke="${c}" stroke-width="3" stroke-linejoin="round"/>
<line x1="0" y1="${-k.h + 5}" x2="0" y2="0" stroke="${c}" stroke-width="3"/>`);
  }).join('');
  return svg(`${body}<line x1="22" y1="102" x2="98" y2="102" stroke="${c}" stroke-width="3" stroke-linecap="round"/>`);
}

/* D2. 유리 결정 — 테두리 없이 비치는 면이 겹쳐요 */
function d2(p, dark) {
  const fills = [[T[8], T[0]], [T[1], T[3]], [T[4], '#FFFFFF']];
  const body = CL.map((k, i) => {
    const s = shape(k.w + 2, k.h, k.tip);
    return at(k.x + (i === 0 ? 4 : i === 1 ? -4 : 0), k.y, k.rot,
      `<polygon points="${poly(s.L)}" fill="${fills[i][0]}" fill-opacity=".75"/><polygon points="${poly(s.R)}" fill="${fills[i][1]}" fill-opacity=".9"/>
<polyline points="${poly([[-k.w / 2 - 1, -k.h], [0, -k.h - k.tip]])}" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`);
  });
  return svg(`<g style="mix-blend-mode:${dark ? "normal" : "multiply"}">${body[0]}${body[1]}</g>${body[2]}
<g fill="none" stroke="${p.primary}" stroke-opacity=".35" stroke-width="1.2">${CL.map((k) => at(k.x, k.y, k.rot, `<polygon points="${poly(shape(k.w + 2, k.h, k.tip).O)}"/>`)).join('')}</g>`);
}

/* D3. 결정 하나 — 앞에서 본 육각기둥, 메인 색 한 가지의 명암만 */
function d3(p, dark) {
  const x = 60, b = 104, w = 44, h = 56, tip = 26, side = 11;
  const lx = x - w / 2, rx = x + w / 2, mlx = lx + side, mrx = rx - side, top = b - h, apex = top - tip;
  const L = [[lx, b - 6], [lx, top + 4], [x, apex], [mlx, top], [mlx, b]];
  const M = [[mlx, b], [mlx, top], [x, apex], [mrx, top], [mrx, b]];
  const R = [[mrx, b], [mrx, top], [x, apex], [rx, top + 4], [rx, b - 6]];
  const base = dark ? ['#FFFFFF', p.glow, p.primary] : [p.glow, '#FFFFFF', p.primary];
  return svg(`<g stroke="${dark ? p.deep : '#fff'}" stroke-width="1.6" stroke-linejoin="round">
<polygon points="${poly(L)}" fill="${base[0]}" fill-opacity="${dark ? '.55' : '1'}"/>
<polygon points="${poly(M)}" fill="url(#m)"/>
<polygon points="${poly(R)}" fill="${base[2]}"/>
<polyline points="${poly([[mlx, top], [x, top + 12], [mrx, top]])}" fill="none"/>
<line x1="${x}" y1="${top + 12}" x2="${x}" y2="${apex}"/></g>`,
  `<linearGradient id="m" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="${p.glow}"/></linearGradient>`);
}

/* D4. 밤하늘 원 — 둥근 밤하늘 안에 유리 결정 */
function d4(p) {
  const body = CL.map((k) => {
    const s = shape(k.w, k.h, k.tip);
    return at(k.x, k.y + 4, k.rot, `<polygon points="${poly(s.L)}" fill="#FFFFFF" fill-opacity=".92"/><polygon points="${poly(s.R)}" fill="${p.glow}" fill-opacity=".85"/>`);
  }).join('');
  return svg(`<circle cx="60" cy="60" r="52" fill="url(#sky)"/><g clip-path="url(#cut)">${body}</g>`,
    `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.deep}"/><stop offset="1" stop-color="${p.primary}"/></linearGradient>
<clipPath id="cut"><circle cx="60" cy="60" r="52"/></clipPath>`);
}

/* D5. 동굴 속 결정 — 어두운 동굴 바닥에서 빛나는 결정 */
function d5(p) {
  const body = CL.map((k, i) => {
    const s = shape(k.w * 0.85, k.h * 0.85, k.tip * 0.85);
    const f = [[T[8], T[0]], [T[1], T[3]], ['#FFFFFF', T[4]]][i];
    return at(60 + (k.x - 60) * 0.85, 98, k.rot, `<polygon points="${poly(s.L)}" fill="${f[0]}"/><polygon points="${poly(s.R)}" fill="${f[1]}"/>`);
  }).join('');
  return svg(`<path d="M12 108 V58 A48 48 0 0 1 108 58 V108 Z" fill="url(#cave)"/>
<ellipse cx="60" cy="80" rx="38" ry="30" fill="url(#glow)"/>${body}`,
    `<linearGradient id="cave" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.deep}"/><stop offset="1" stop-color="${p.primary}"/></linearGradient>
<radialGradient id="glow"><stop offset="0" stop-color="${p.glow}" stop-opacity=".7"/><stop offset="1" stop-color="${p.glow}" stop-opacity="0"/></radialGradient>`);
}

/* D6. 대칭 결정 — 똑바로 선 결정 셋, 두 가지 톤 */
function d6(p, dark) {
  const ks = [{ x: 36, w: 20, h: 30, tip: 12 }, { x: 84, w: 20, h: 30, tip: 12 }, { x: 60, w: 26, h: 52, tip: 18 }];
  const body = ks.map((k) => {
    const s = shape(k.w, k.h, k.tip);
    return at(k.x, 100, 0, `<polygon points="${poly(s.L)}" fill="${dark ? '#FFFFFF' : p.glow}"/><polygon points="${poly(s.R)}" fill="${dark ? p.glow : p.primary}"/>`);
  }).join('');
  return svg(`<g stroke="${dark ? p.deep : '#fff'}" stroke-width="3" stroke-linejoin="round">${body}</g>`);
}

const MARKS = [
  ['d1', 'D1. 한 줄 결정', '같은 굵기 선 하나로만 그렸어요. 가장 담백하고 문구·아이콘 체계와 잘 섞여요.', d1],
  ['d2', 'D2. 유리 결정', '테두리 없이 비치는 면이 겹쳐요. 투명한 유리 느낌이 가장 강해요.', d2],
  ['d3', 'D3. 결정 하나', '앞에서 본 결정 기둥 하나를 메인 색 명암만으로. 16px에서도 또렷하고 가장 "브랜드" 같아요.', d3],
  ['d4', 'D4. 밤하늘 원', '둥근 밤하늘 안에 유리 결정 셋. 앱 아이콘으로 쓰기 좋아요.', d4],
  ['d5', 'D5. 동굴 속 결정', '어두운 동굴 바닥에서 결정이 은은하게 빛나요. 동굴 느낌이 가장 강해요.', d5],
  ['d6', 'D6. 대칭 결정', '똑바로 선 결정 셋을 두 톤으로. 기울기를 없애서 차분하고 단단해 보여요.', d6],
];

const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return ((x + 0.05) / (y + 0.05)).toFixed(1); };

// primary: 버튼·링크 / deep: 가장 어두운 바탕 / glow: 어둠 속 빛·유리 가장자리 / soft: 밝은 면
const PALETTES = [
  { name: '한밤', primary: '#262B4D', deep: '#11142A', glow: '#AEBBFF', soft: '#EEF0FA',
    note: '불 꺼진 한밤의 남색. 거의 검정이지만 푸른 기가 있어서 차갑고 고요해요. 유리 결정이 가장 밝게 빛나 보여요.' },
  { name: '동굴', primary: '#2B3640', deep: '#141A20', glow: '#A6D9DC', soft: '#ECF3F4',
    note: '젖은 바위의 청회색에 동굴 물빛 같은 옅은 청록 빛. 보라 계열에서 가장 멀리 떨어진, 새로운 인상이에요.' },
  { name: '밤하늘', primary: '#3A3A7E', deep: '#1A1940', glow: '#CBC4FF', soft: '#EEEDFB',
    note: '별이 뜨기 직전의 보랏빛 남색. 지금 보라와 가장 자연스럽게 이어지면서 더 깊고 차분해요.' },
  { name: '서리 유리', primary: '#44597E', deep: '#24314A', glow: '#CFE0F5', soft: '#F0F5FA',
    note: '김이 서린 유리창 같은 회청색. 어두운 바탕 없이도 투명한 느낌이 나고, 밝은 화면이 그대로 유지돼요.' },
];

let uid = 0;
const scope = (s) => { const u = `_${uid++}`; return s.replace(/id="(\w+)"/g, `id="$1${u}"`).replace(/url\(#(\w+)\)/g, `url(#$1${u})`); };

PALETTES.forEach((p, i) => MARKS.forEach(([k, , , fn]) => fs.writeFileSync(path.join(out, `r4-${k}-${i + 1}.svg`), fn(p, false))));

const p0 = PALETTES[0];
const markSections = MARKS.map(([k, name, note, fn]) => `<section class="opt"><h3>${name}</h3><p class="note">${note}</p>
<div class="row"><div class="big">${scope(fn(p0, false))}</div><div class="big dark" style="background:linear-gradient(180deg,${p0.deep},${p0.primary})">${scope(fn(p0, true))}</div>
<div class="sizes"><span class="icon i60">${scope(fn(p0, false))}</span><span class="fav">${scope(fn(p0, false))}</span><span class="fav s">${scope(fn(p0, false))}</span></div></div></section>`).join('');

const grid = `<div class="grid"><div></div>${MARKS.map(([k]) => `<div class="hd">${k.toUpperCase()}</div>`).join('')}
${PALETTES.map((p) => `<div class="rl">${p.name}</div>${MARKS.map(([, , , fn]) => `<div class="cell"><span class="icon">${scope(fn(p, false))}</span><span class="icon dk" style="background:${p.deep}">${scope(fn(p, true))}</span></div>`).join('')}`).join('')}</div>`;

const colorSections = PALETTES.map((p, i) => `<section class="opt"><h3>${i + 1}. ${p.name}</h3><p class="note">${p.note}</p>
<div class="sw"><span style="background:${p.deep}"></span><span style="background:${p.primary}"></span><span style="background:${p.glow}"></span><span style="background:${p.soft}"></span><small>${p.primary} · 흰 글자 대비 ${contrast(p.primary, '#FFFFFF')}:1</small></div>
<div class="hero" style="background:linear-gradient(165deg,${p.deep} 0%,${p.primary} 100%)">
<div class="hero-top"><span class="lm">${scope(d3(p, true))}</span><b>Enneagram</b></div>
<p class="hero-t">내 안의 보석을<br>깨우는 시간</p>
<div class="glass"><span class="g-num" style="background:${T[4]}">5</span><span><b>탐구자</b><small>지식을 모으며 세상을 이해해요</small></span></div>
<button style="background:#fff;color:${p.deep}">간편 검사하기</button></div>
<div class="light"><button style="background:${p.primary}">기록 남기기</button><span class="chip" style="background:${p.soft};color:${p.primary}">오늘의 패턴</span><a style="color:${p.primary}">전체 보기</a></div>
</section>`).join('');

fs.writeFileSync(path.join(out, 'round4.html'), `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>로고·색 4차 시안</title>
<link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" rel="stylesheet">
<style>
body{margin:0;background:#F2F4F6;font-family:"Pretendard Variable",Pretendard,sans-serif;color:#191F28}
main{max-width:616px;margin:0 auto;background:#fff;padding:24px 16px 48px}
h1{font-size:28px;font-weight:700;margin:8px 0 4px}h2{font-size:22px;font-weight:700;margin:32px 0 8px}h3{font-size:18px;font-weight:700;margin:0 0 6px}
.lead,.note{font-size:15px;color:#4E5968;line-height:1.6;margin:0 0 12px}
svg{display:block;width:100%;height:100%}
.opt{border-top:1px solid #E5E8EB;padding:20px 0}
.row{display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.big{width:128px;height:128px;border-radius:20px;box-shadow:0 0 0 1px #E5E8EB;padding:8px;box-sizing:border-box}
.sizes{display:flex;align-items:flex-end;gap:10px}
.icon{display:grid;place-items:center;flex:none;width:52px;height:52px;background:#fff;border-radius:22%;box-shadow:0 1px 3px rgba(0,0,0,.12),0 0 0 1px #E5E8EB}
.icon svg{width:80%;height:80%}.i60{width:60px;height:60px}
.fav{width:32px;height:32px}.fav.s{width:16px;height:16px}
.grid{display:grid;grid-template-columns:56px repeat(6,1fr);gap:10px 4px;align-items:center}
.hd,.rl{font-size:13px;font-weight:600;text-align:center}.rl{text-align:left}
.cell{display:flex;flex-direction:column;align-items:center;gap:4px}.cell .icon{width:44px;height:44px}
.sw{display:flex;align-items:center;gap:6px;margin-bottom:12px}.sw span{width:32px;height:32px;border-radius:12px;box-shadow:0 0 0 1px rgba(0,0,0,.06)}.sw small{font-size:13px;color:#6B7684;margin-left:6px}
.hero{border-radius:20px;padding:20px;color:#fff;display:flex;flex-direction:column;gap:14px}
.hero-top{display:flex;align-items:center;gap:8px;font-size:16px}.hero-top .lm{width:28px;height:28px}
.hero-t{font-size:22px;font-weight:700;line-height:1.35;margin:0}
.glass{display:flex;align-items:center;gap:12px;padding:14px;border-radius:20px;background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.28);backdrop-filter:blur(12px)}
.glass b{display:block;font-size:16px}.glass small{font-size:13px;opacity:.8}
.g-num{width:36px;height:36px;border-radius:999px;display:grid;place-items:center;color:#191F28;font-weight:700}
.hero button{align-self:flex-start}
.light{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:12px}
button{border:0;border-radius:999px;color:#fff;font:600 15px "Pretendard Variable",sans-serif;padding:10px 18px}
.chip{border-radius:999px;padding:6px 12px;font-size:13px;font-weight:600}.light a{font-size:15px;font-weight:600}
</style></head><body><main>
<h1>로고·색 4차 시안</h1>
<p class="lead">D(원석 결정)를 바탕으로 반짝이 장식·두꺼운 외곽선·흙더미를 빼고 6가지로 바꿔 봤어요. 색은 동굴·밤하늘·유리 느낌으로 4가지를 새로 골랐어요.</p>
<h2>D 변형 6가지</h2><p class="lead">왼쪽은 흰 바탕, 오른쪽은 어두운 바탕(한밤 색)이에요.</p>${markSections}
<h2>변형 × 색</h2>${grid}
<h2>메인 색 후보</h2><p class="lead">어두운 영역(첫 화면·배너)과 그 위의 유리 카드, 밝은 화면의 버튼까지 같이 보여줘요.</p>${colorSections}
</main></body></html>`);
console.log(PALETTES.map((p) => `${p.name} ${contrast(p.primary, '#FFFFFF')}`).join('\n'));
