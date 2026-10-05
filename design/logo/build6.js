// 워드마크 2차 — 글꼴 외곽선(Pretendard·Outfit·Sora, 모두 OFL)을 SVG 경로로 바꾸고
// A(또는 a) 글자만 보석색 그라데이션으로 칠함. node design/logo/build6.js <scratchpad>
// <scratchpad>: opentype.js, @fontsource/*, Pretendard-*.otf 가 있는 폴더
const fs = require('fs');
const path = require('path');
const SP = process.argv[2];
const opentype = require(path.join(SP, 'node_modules/opentype.js'));
const out = __dirname;

const INK = '#262B4D';
const GEM = ['#8E7FE0', '#3FA7B8']; // --icon-lav-1 → --icon-sky-2
const load = (f) => opentype.loadSync(path.join(SP, f));
const FONTS = {
  pre6: load('Pretendard-SemiBold.otf'),
  pre7: load('Pretendard-Bold.otf'),
  out5: load('node_modules/@fontsource/outfit/files/outfit-latin-500-normal.woff'),
  sora6: load('node_modules/@fontsource/sora/files/sora-latin-600-normal.woff'),
};


function wordmark(fontKey, text, { track = 0, gemOn = 'Aa' } = {}) {
  const font = FONTS[fontKey], size = 100;
  const glyphs = font.stringToGlyphs(text);
  let x = 0, body = '', plainBody = '', gems = '', gi = 0, defs = '';
  glyphs.forEach((g, i) => {
    const p = g.getPath(x, 0, size);
    if (gemOn.includes(text[i])) {
      const b = p.getBoundingBox(), id = `k${gi++}`;
      defs += `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${b.x1.toFixed(1)}" y1="${b.y1.toFixed(1)}" x2="${b.x2.toFixed(1)}" y2="${b.y2.toFixed(1)}"><stop offset="0" stop-color="${GEM[0]}"/><stop offset="1" stop-color="${GEM[1]}"/></linearGradient>`;
      gems += `<path d="${p.toPathData(2)}" fill="url(#${id})"/>`;
      plainBody += `<path d="${p.toPathData(2)}"/>`;
    } else { body += `<path d="${p.toPathData(2)}"/>`; plainBody += `<path d="${p.toPathData(2)}"/>`; }
    x += g.advanceWidth * (size / font.unitsPerEm) + track * size;
    if (glyphs[i + 1]) x += font.getKerningValue(g, glyphs[i + 1]) * (size / font.unitsPerEm);
  });
  // 전체 경계
  const all = new opentype.Path();
  glyphs.reduce((xx, g, i) => { all.extend(g.getPath(xx, 0, size)); let n = xx + g.advanceWidth * (size / font.unitsPerEm) + track * size; if (glyphs[i + 1]) n += font.getKerningValue(g, glyphs[i + 1]) * (size / font.unitsPerEm); return n; }, 0);
  const B = all.getBoundingBox(), pad = 2;
  const vb = `${(B.x1 - pad).toFixed(1)} ${(B.y1 - pad).toFixed(1)} ${(B.x2 - B.x1 + pad * 2).toFixed(1)} ${(B.y2 - B.y1 + pad * 2).toFixed(1)}`;
  const mk = (withGem) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}"><defs>${withGem ? defs : ''}</defs>${withGem ? gems : ''}<g fill="${INK}">${withGem ? body : plainBody}</g></svg>`;
  return { gem: mk(true), plain: mk(false) };
}

const W = [
  { k: 'p1', name: 'P1. 프리텐다드 대문자', note: '앱 본문 글꼴(프리텐다드)의 대문자를 넓게 띄웠어요. 앱 안 글자와 가장 잘 어울리고 단정해요. A 두 개만 보석색(라벤더→하늘)으로 칠했어요.', wm: wordmark('pre6', 'ENNEAGRAM', { track: 0.06 }) },
  { k: 'p2', name: 'P2. 프리텐다드 소문자', note: '"Enneagram" 그대로, 조금 굵게. 대문자보다 부드럽고 친근해요. 소문자 a 두 개만 보석색으로 칠했어요.', wm: wordmark('pre7', 'Enneagram', { track: -0.01 }) },
  { k: 'o1', name: 'O1. 아웃핏 대문자', note: '원과 직선으로 된 기하학 글꼴 Outfit. 동그란 G와 뾰족한 A가 결정 로고와 잘 맞아요.', wm: wordmark('out5', 'ENNEAGRAM', { track: 0.05 }) },
  { k: 's1', name: 'S1. 소라 소문자', note: '넓고 둥근 글꼴 Sora. 소문자가 또렷해서 작은 크기에서 가장 잘 읽혀요.', wm: wordmark('sora6', 'Enneagram', { track: -0.01 }) },
];

let uid = 0;
const scope = (s) => { const u = `_${uid++}`; return s.replace(/id="(\w+)"/g, `id="$1${u}"`).replace(/url\(#(\w+)\)/g, `url(#$1${u})`); };
const mark = fs.readFileSync(path.join(__dirname, '../../assets/logo/logo-mark.svg'), 'utf8');
W.forEach((o) => { fs.writeFileSync(path.join(out, `wordmark-${o.k}.svg`), o.wm.gem); fs.writeFileSync(path.join(out, `wordmark-${o.k}-plain.svg`), o.wm.plain); });

const sections = W.map((o) => `<section class="opt"><h3>${o.name}</h3><p class="note">${o.note}</p>
<div class="pair"><div class="big">${scope(o.wm.gem)}</div><div class="sm"><span class="wm h22">${scope(o.wm.plain)}</span><small>보석색 없이</small></div></div>
<div class="hdr"><span class="m">${scope(mark)}</span><span class="wm h16">${scope(o.wm.gem)}</span><span class="search"></span></div>
<div class="stack"><span class="m l">${scope(mark)}</span><span class="wm h22">${scope(o.wm.gem)}</span></div>
<div class="tiny"><span class="m s">${scope(mark)}</span><span class="wm h10">${scope(o.wm.gem)}</span></div>
<p class="file">design/logo/wordmark-${o.k}.svg · wordmark-${o.k}-plain.svg</p></section>`).join('');

fs.writeFileSync(path.join(out, 'wordmark2.html'), `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>워드마크 2차 시안</title>
<link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" rel="stylesheet">
<style>
body{margin:0;background:#F2F4F6;font-family:"Pretendard Variable",Pretendard,sans-serif;color:#191F28}
main{max-width:616px;margin:0 auto;background:#fff;padding:24px 16px 48px}
h1{font-size:28px;font-weight:700;margin:8px 0 4px}h3{font-size:18px;font-weight:700;margin:0 0 6px}
.lead,.note{font-size:15px;color:#4E5968;line-height:1.6;margin:0 0 14px}
svg{display:block;height:100%;width:auto}
.opt{border-top:1px solid #E5E8EB;padding:24px 0;display:flex;flex-direction:column;gap:14px}
.opt h3,.opt .note{margin-bottom:0}
.pair{display:flex;align-items:flex-end;gap:24px;flex-wrap:wrap}
.big{height:44px}.sm{display:flex;flex-direction:column;gap:4px}.sm small{font-size:13px;color:#8B95A1}
.hdr{display:flex;align-items:center;gap:10px;height:60px;padding:0 16px;border:1px solid #E5E8EB;border-radius:20px}
.hdr .search{margin-left:auto;width:36px;height:36px;border-radius:999px;box-shadow:inset 0 0 0 1px #E5E8EB}
.m{height:30px;flex:none}.m.l{height:64px}.m.s{height:18px}
.wm{display:block}.h16{height:16px}.h22{height:22px}.h10{height:10px}
.stack{display:flex;flex-direction:column;align-items:center;gap:12px;padding:24px;border:1px solid #E5E8EB;border-radius:20px}
.tiny{display:flex;align-items:center;gap:6px}
.file{font-size:13px;color:#8B95A1;margin:0}
</style></head><body><main>
<h1>워드마크 2차 시안</h1>
<p class="lead">손으로 그린 선 대신, 잘 다듬어진 글꼴의 실제 글자 모양을 그대로 가져왔어요. 그래서 줄기 굵기·곡선·글자 사이가 고르고, 작게 줄여도 깨지지 않아요. 바꾼 곳은 A(또는 a) 두 글자만 보석색(라벤더→하늘)으로 칠한 것 하나뿐이에요.</p>
${sections}
</main></body></html>`);
console.log('done');
