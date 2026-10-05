// Faceted crystal cat generator -> SVG (3x3 grid, 9 colours)
const fs = require('fs');

const COLORS = [
  { h: 44, s: 88, l: 62 },  // yellow
  { h: 336, s: 80, l: 72 }, // pink
  { h: 356, s: 78, l: 55 }, // red
  { h: 272, s: 60, l: 60 }, // purple
  { h: 212, s: 80, l: 64 }, // blue
  { h: 30, s: 92, l: 60 },  // orange
  { h: 246, s: 58, l: 52 }, // indigo
  { h: 190, s: 72, l: 66 }, // aqua
  { h: 40, s: 70, l: 76 },  // champagne
];

// cat head outline, right half (top center -> bottom center), mirrored
const half = [
  [0, -50], [20, -54], [38, -66], [54, -94], [62, -72], [68, -50],
  [80, -24], [86, 6], [80, 36], [62, 60], [34, 76], [0, 82],
];
const outline = [...half, ...half.slice(1, -1).reverse().map(([x, y]) => [-x, y])];
const C = [0, 8];

function scale(pts, k, c = C) {
  return pts.map(([x, y]) => [c[0] + (x - c[0]) * k, c[1] + (y - c[1]) * k]);
}
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}
const hsl = (h, s, l, a = 1) =>
  a === 1 ? `hsl(${h} ${s}% ${Math.max(4, Math.min(97, l)).toFixed(1)}%)`
          : `hsl(${h} ${s}% ${Math.max(4, Math.min(97, l)).toFixed(1)}% / ${a})`;
const P = (pts) => pts.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');

function gem(col, idx) {
  const r = rng(1234 + idx * 97);
  const mid = scale(outline, 0.7);
  const table = scale(outline, 0.38);
  const light = Math.atan2(-1, -0.8); // light from upper-left
  const n = outline.length;
  const tris = [];
  const shade = (tri, band) => {
    const cx = (tri[0][0] + tri[1][0] + tri[2][0]) / 3 - C[0];
    const cy = (tri[0][1] + tri[1][1] + tri[2][1]) / 3 - C[1];
    const a = Math.atan2(cy, cx);
    let l = col.l + 16 * Math.cos(a - light) * band + (r() - 0.5) * 14;
    let s = col.s + (r() - 0.5) * 16;
    let h = col.h + (r() - 0.5) * 14;
    if (r() < 0.07) { l = 94; s = 60; }          // bright flash facet
    else if (r() < 0.06) { l = col.l - 22; }      // deep facet
    return { tri, fill: hsl(h, s, l) };
  };
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    // crown: outer -> mid, kite style
    const om = [(outline[i][0] + outline[j][0]) / 2, (outline[i][1] + outline[j][1]) / 2];
    tris.push(shade([outline[i], om, mid[i]], 1));
    tris.push(shade([om, outline[j], mid[j]], 1));
    tris.push(shade([om, mid[j], mid[i]], 0.8));
    // star facets: mid -> table
    tris.push(shade([mid[i], mid[j], table[i]], 0.6));
    tris.push(shade([mid[j], table[j], table[i]], 0.6));
  }
  // table: gentle fan
  const tableFacets = [{ tri: table, fill: hsl(col.h, col.s - 8, col.l + 14) },
    { tri: [table[0], table[6], C, table[n - 6]], fill: hsl(col.h, col.s, col.l + 4) }];
  const edge = hsl(col.h, col.s - 10, col.l - 28);
  const gid = `g${idx}`;
  let s = '';
  s += `<defs>
    <radialGradient id="${gid}sheen" cx="0.3" cy="0.25" r="0.75">
      <stop offset="0" stop-color="#fff" stop-opacity="0.75"/>
      <stop offset="0.35" stop-color="#fff" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="${gid}deep" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0.45" stop-color="${hsl(col.h, col.s, col.l - 25)}" stop-opacity="0"/>
      <stop offset="1" stop-color="${hsl(col.h, col.s, col.l - 25)}" stop-opacity="0.55"/>
    </linearGradient>
    <clipPath id="${gid}clip"><polygon points="${P(outline)}"/></clipPath>
  </defs>`;
  // coloured light cast onto box back
  s += `<ellipse cx="22" cy="30" rx="95" ry="85" fill="${hsl(col.h, col.s + 10, col.l + 8, 0.55)}" filter="url(#blurBig)"/>`;
  s += `<g clip-path="url(#${gid}clip)">`;
  for (const t of [...tris, ...tableFacets])
    s += `<polygon points="${P(t.tri)}" fill="${t.fill}" stroke="#fff" stroke-opacity="0.55" stroke-width="0.6" stroke-linejoin="round"/>`;
  s += `<polygon points="${P(outline)}" fill="url(#${gid}deep)"/>`;
  s += `<polygon points="${P(outline)}" fill="url(#${gid}sheen)"/>`;
  // light streaks
  s += `<polygon points="-70,-10 -40,-60 -30,-58 -62,-2" fill="#fff" opacity="0.55" filter="url(#blurSm)"/>`;
  s += `<polygon points="10,-40 60,10 52,16 4,-32" fill="#fff" opacity="0.25" filter="url(#blurSm)"/>`;
  s += `</g>`;
  // rim
  s += `<polygon points="${P(outline)}" fill="none" stroke="${edge}" stroke-width="1.6" stroke-linejoin="round"/>`;
  s += `<polygon points="${P(scale(outline, 0.965))}" fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="1" stroke-linejoin="round"/>`;
  // face, engraved softly
  const face = hsl(col.h, col.s, col.l - 38, 0.8);
  s += `<g fill="none" stroke="${face}" stroke-width="2.4" stroke-linecap="round">
    <path d="M-38,4 q10,-10 20,0"/><path d="M18,4 q10,-10 20,0"/>
    <path d="M-7,28 q7,7 7,0 q0,7 7,0"/>
  </g>`;
  s += `<path d="M-4,19 h8 l-4,5 z" fill="${hsl(345, 70, 72)}" stroke="${face}" stroke-width="0.8"/>`;
  s += `<g stroke="#fff" stroke-opacity="0.75" stroke-width="1" stroke-linecap="round">
    <path d="M-30,24 l-34,-4"/><path d="M-30,30 l-34,4"/>
    <path d="M30,24 l34,-4"/><path d="M30,30 l34,4"/>
  </g>`;
  s += `<ellipse cx="-44" cy="20" rx="8" ry="5" fill="${hsl(345, 80, 80, 0.55)}" filter="url(#blurSm)"/>`;
  s += `<ellipse cx="44" cy="20" rx="8" ry="5" fill="${hsl(345, 80, 80, 0.55)}" filter="url(#blurSm)"/>`;
  // sparkles
  const star = (x, y, k) =>
    `<path d="M${x},${y - 8 * k} Q${x},${y} ${x + 8 * k},${y} Q${x},${y} ${x},${y + 8 * k} Q${x},${y} ${x - 8 * k},${y} Q${x},${y} ${x},${y - 8 * k}Z" fill="#fff"/>`;
  s += star(-48, -36, 1.2) + star(58, -20, 0.8) + star(-10, 60, 0.6) + star(74, 56, 0.7) + star(-80, 48, 0.5);
  for (let k = 0; k < 10; k++)
    s += `<circle cx="${(r() * 200 - 100).toFixed(1)}" cy="${(r() * 190 - 90).toFixed(1)}" r="${(r() * 1.4 + 0.4).toFixed(1)}" fill="#fff" opacity="${(0.5 + r() * 0.5).toFixed(2)}"/>`;
  return s;
}

function box(ribbonDusty) {
  const W = 260, t = 16, d = 18; // frame size, rim thickness, inner wall depth
  const a = -W / 2, b = W / 2, ia = a + t, ib = b - t, da = ia + d, db = ib - d;
  let s = '';
  s += `<rect x="${a + 10}" y="${a + 12}" width="${W}" height="${W}" fill="#b9ae98" opacity="0.35" filter="url(#blurBox)"/>`;
  s += `<rect x="${a}" y="${a}" width="${W}" height="${W}" fill="#f7efdb" stroke="#e3d6b8" stroke-width="1.5"/>`;
  s += `<rect x="${ia}" y="${ia}" width="${ib - ia}" height="${ib - ia}" fill="#fbf7ec"/>`;
  s += `<polygon points="${ia},${ia} ${ib},${ia} ${db},${da} ${da},${da}" fill="#e7dcc3"/>`; // top wall
  s += `<polygon points="${ia},${ia} ${da},${da} ${da},${db} ${ia},${ib}" fill="#efe5cf"/>`; // left wall
  s += `<polygon points="${ib},${ia} ${ib},${ib} ${db},${db} ${db},${da}" fill="#fffdf6"/>`; // right wall
  s += `<polygon points="${ia},${ib} ${ib},${ib} ${db},${db} ${da},${db}" fill="#fbf6e8"/>`; // bottom wall
  s += `<rect x="${ia}" y="${ia}" width="${ib - ia}" height="${ib - ia}" fill="none" stroke="#dccfae" stroke-width="1"/>`;
  s += `<rect x="${da}" y="${da}" width="${db - da}" height="${db - da}" fill="none" stroke="#e6dbc0" stroke-width="0.8"/>`;
  // ribbon bow on top-left corner
  const c = ribbonDusty ? '#bfb0c4' : '#dcc28a', f = ribbonDusty ? '#e7dde9' : '#f3e4bd';
  s += `<g transform="translate(${a + 58},${a + 6})" stroke="${c}" stroke-width="2" fill="${f}" fill-opacity="0.8" stroke-linejoin="round">
    <path d="M0,0 C-30,-30 -52,-4 -34,10 C-22,18 -8,8 0,0Z"/>
    <path d="M0,0 C22,-34 52,-14 38,6 C28,18 10,8 0,0Z"/>
    <path d="M0,0 C-6,20 -22,38 -34,50 L-24,52 C-14,40 -4,24 0,0Z"/>
    <path d="M0,0 C10,18 22,34 40,42 L44,34 C28,28 12,16 0,0Z"/>
    <ellipse cx="0" cy="0" rx="6" ry="5"/>
  </g>`;
  s += `<path d="M${a + 58},${a + 11} C${a + 70},${a + 50} ${a + 75},${a + 80} ${a + 110},${a + 76}" fill="none" stroke="${c}" stroke-width="1.4" opacity="0.8"/>`;
  return s;
}

const cell = 300;
let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cell * 3} ${cell * 3}" width="${cell * 3}" height="${cell * 3}">
<defs>
  <filter id="blurBig" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="16"/></filter>
  <filter id="blurSm" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
  <filter id="blurBox" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="8"/></filter>
</defs>
<rect width="100%" height="100%" fill="#f6f4e6"/>`;
COLORS.forEach((col, i) => {
  const x = (i % 3) * cell + cell / 2, y = Math.floor(i / 3) * cell + cell / 2;
  out += `<g transform="translate(${x},${y}) scale(0.95)">${box(i === 2 || i === 6)}<g transform="translate(4,14) scale(1.02)">${gem(col, i)}</g></g>`;
});
out += `</svg>`;
fs.writeFileSync(process.argv[2], out);
console.log('ok', out.length);
