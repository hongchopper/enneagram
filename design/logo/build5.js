// 워드마크(로고 글자) 시안 — node design/logo/build5.js
// 글꼴 없이 직접 그린 대문자 ENNEAGRAM. 대문자 높이 40 (y 10~50)
const fs = require('fs');
const path = require('path');
const out = __dirname;

const INK = '#262B4D';   // 로고 D5의 한밤 색
const SOFT = '#8B90B5';  // 닦인 면(아랫부분)
const LAV = '#D7C8FF', SKY = '#B5E4EC', BLUE = '#BBD9FF', PINK = '#F7B8C8';
const mark = fs.readFileSync(path.join(__dirname, '../../assets/logo/logo-mark.svg'), 'utf8');

// 글자: 너비 + 선 경로 (x는 글자 왼쪽 기준)
const G = {
  E: { w: 22, d: 'M22 10 H0 V50 H22 M0 30 H19' },
  N: { w: 28, d: 'M0 50 V10 L28 50 V10' },
  G: { w: 38, d: 'M35.32 17.14 A19 19 0 1 0 38 30 H22' },
  R: { w: 24, d: 'M0 50 V10 H13 A10 10 0 0 1 13 30 H0 M11 30 L24 50' },
  M: { w: 34, d: 'M0 50 V10 L17 36 L34 10 V50' },
  A: { w: 32 },
};
// A의 세 가지 모양
const A = {
  plain: () => ({ d: 'M0 50 L16 10 L32 50 M7.5 34 H24.5' }),
  ridge: () => ({ d: 'M0 50 L16 10 L32 50 M16 10 V50' }),          // 가운데 능선 = 결정 기둥
  gem: () => ({ d: 'M0 50 L16 10 L32 50', fill: [[[0, 50], [16, 10], [16, 50]], [[16, 10], [32, 50], [16, 50]]] }),
};

function word({ a = 'plain', sw = 5, track = 9, color = INK, gemFill = [LAV, SKY] }) {
  let x = 0, paths = '', fills = '', ai = 0;
  for (const ch of 'ENNEAGRAM') {
    const g = ch === 'A' ? { ...G.A, ...A[a]() } : G[ch];
    if (g.fill) {
      const cols = ai++ === 0 ? gemFill : [gemFill[1], gemFill[0]];
      g.fill.forEach((tri, i) => { fills += `<polygon transform="translate(${x} 0)" points="${tri.map((p) => p.join(',')).join(' ')}" fill="${cols[i]}"/>`; });
    }
    paths += `<path transform="translate(${x} 0)" d="${g.d}"/>`;
    x += g.w + track;
  }
  const w = x - track, pad = sw / 2 + 1;
  return { w, h: 40, pad, body: `${fills}<g fill="none" stroke="${color}" stroke-width="${sw}" stroke-linejoin="miter" stroke-linecap="butt">${paths}</g>` };
}
const wsvg = (wd, extra = '', defs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-wd.pad} ${10 - wd.pad} ${wd.w + wd.pad * 2} ${40 + wd.pad * 2}"><defs>${defs}</defs>${wd.body}${extra}</svg>`;

// 컷: 비스듬한 선 아래쪽만 밝은 색으로 (보석을 닦은 면)
function cut(opts) {
  const top = word(opts), low = word({ ...opts, color: SOFT });
  const cutPts = `0,0 ${top.w + 20},0 ${top.w + 20},26 -10,40`;
  return { ...top, body: `<clipPath id="up"><polygon points="${cutPts}"/></clipPath><clipPath id="dn"><polygon points="-10,40 ${top.w + 20},26 ${top.w + 20},60 -10,60"/></clipPath>
<g clip-path="url(#dn)">${low.body}</g><g clip-path="url(#up)">${top.body}</g>
<line x1="-10" y1="40" x2="${top.w + 20}" y2="26" stroke="#fff" stroke-width="1.6"/>` };
}

const W = [
  { k: 'w1', name: 'W1. 결정 A', note: '굵기가 같은 선으로 그린 대문자. A 두 개의 가로선을 빼고 가운데 능선을 세워서, 로고의 결정 기둥처럼 보이게 했어요.', wd: word({ a: 'ridge' }) },
  { k: 'w2', name: 'W2. 보석 A', note: 'A 안을 보석색 두 면으로 채웠어요. 글자 속에 보석이 박힌 느낌, "내 안의 보석"을 글자로 옮겼어요.', wd: word({ a: 'gem' }) },
  { k: 'w3', name: 'W3. 가는 결정 A', note: '선을 가늘게, 자간을 넓게. 조용하고 고급스러운 인상이에요. 큰 화면(첫 화면·공유 이미지)에 어울려요.', wd: word({ a: 'ridge', sw: 2.6, track: 15 }) },
  { k: 'w4', name: 'W4. 닦은 면', note: '비스듬한 선을 기준으로 아랫부분이 한 톤 밝아요. 보석을 한 번 닦아낸 면처럼 보여요.', wd: cut({ a: 'ridge' }) },
];

let uid = 0;
const scope = (s) => { const u = `_${uid++}`; return s.replace(/id="(\w+)"/g, `id="$1${u}"`).replace(/url\(#(\w+)\)/g, `url(#$1${u})`); };

W.forEach((o) => fs.writeFileSync(path.join(out, `wordmark-${o.k}.svg`), wsvg(o.wd)));

const sections = W.map((o) => {
  const s = () => scope(wsvg(o.wd));
  return `<section class="opt"><h3>${o.name}</h3><p class="note">${o.note}</p>
<div class="big">${s()}</div>
<div class="lockups">
<div class="hdr"><span class="m">${scope(mark)}</span><span class="wm h16">${s()}</span><span class="search"></span></div>
<div class="stack"><span class="m l">${scope(mark)}</span><span class="wm h20">${s()}</span><small>나를 읽는 시간</small></div>
<div class="tiny"><span class="m s">${scope(mark)}</span><span class="wm h10">${s()}</span></div>
</div><p class="file">design/logo/wordmark-${o.k}.svg</p></section>`;
}).join('');

fs.writeFileSync(path.join(out, 'wordmark.html'), `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>워드마크 시안</title>
<link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" rel="stylesheet">
<style>
body{margin:0;background:#F2F4F6;font-family:"Pretendard Variable",Pretendard,sans-serif;color:#191F28}
main{max-width:616px;margin:0 auto;background:#fff;padding:24px 16px 48px}
h1{font-size:28px;font-weight:700;margin:8px 0 4px}h3{font-size:18px;font-weight:700;margin:0 0 6px}
.lead,.note{font-size:15px;color:#4E5968;line-height:1.6;margin:0 0 14px}
svg{display:block;height:100%;width:auto}
.opt{border-top:1px solid #E5E8EB;padding:24px 0}
.big{height:44px;margin:8px 0 20px}
.lockups{display:flex;flex-direction:column;gap:14px}
.hdr{display:flex;align-items:center;gap:10px;height:60px;padding:0 16px;border:1px solid #E5E8EB;border-radius:20px}
.hdr .search{margin-left:auto;width:36px;height:36px;border-radius:999px;box-shadow:inset 0 0 0 1px #E5E8EB}
.m{height:30px;flex:none}.m.l{height:64px}.m.s{height:18px}
.wm{display:block}.h16{height:15px}.h20{height:22px}.h10{height:9px}
.stack{display:flex;flex-direction:column;align-items:center;gap:12px;padding:24px;border:1px solid #E5E8EB;border-radius:20px}
.stack small{font-size:13px;color:#8B95A1;letter-spacing:.2em}
.tiny{display:flex;align-items:center;gap:6px}
.file{font-size:13px;color:#8B95A1;margin:12px 0 0}
</style></head><body><main>
<h1>워드마크 시안</h1>
<p class="lead">글꼴 없이 직접 그린 대문자 ENNEAGRAM이에요. 색은 로고 D5의 동굴 색(한밤)과 맞췄고, A에 로고의 결정 모양을 담았어요. 상단 바 · 세로 배치 · 아주 작은 크기 순으로 보여줘요.</p>
${sections}
</main></body></html>`);
console.log('done');
