/*
 * KG SORENSEN · Limpa Pontas KG · Ref. 1810.7021
 * "Precisão até na hora de economizar." — motion advertising 18.8s, 1920×1080, 30 fps
 *
 * Motor determinístico: render(t) desenha o quadro exato do instante t.
 * Toda arte de produto, embalagem, logo e tipografia vem da MASTER VISUAL
 * (camadas extraídas por tools/prep_layers.py). O motor só anima: câmera 2.5D,
 * máscaras de revelação, wireframes, HUD técnico e o lock final na arte original.
 */
'use strict';

const W = 1920, H = 1080, MW = 1672, MH = 941, K = W / MW;
const DUR = 18.8, FPS = 30;
const ASSETS = '../assets/layers/';
const RENDER = /[?&]render=1/.test(location.search);

// ───────────────────────────── utilidades ─────────────────────────────
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const E = {
  lin: t => t,
  inC: t => t * t * t,
  outC: t => 1 - Math.pow(1 - t, 3),
  outQ: t => 1 - Math.pow(1 - t, 4),
  outE: t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  ioC: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  ioQ: t => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2),
  ioS: t => -(Math.cos(Math.PI * t) - 1) / 2,
  outB: t => { const c1 = 1.2, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
};
/** progresso normalizado de t entre a e b, com easing */
const P = (t, a, b, e = E.ioC) => e(clamp((t - a) / (b - a)));
/** janela: sobe em [a,b], desce em [c,d] */
const win = (t, a, b, c, d, e = E.ioS) => P(t, a, b, e) * (1 - P(t, c, d, e));

function rng(seed) { // mulberry32 — determinístico por quadro
  return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ───────────────────────────── paleta ─────────────────────────────
const C = {
  ink: '#020c22',
  line: 'rgba(214,238,255,A)',
  cyan: 'rgba(99,222,249,A)',
  cyanHi: 'rgba(190,244,255,A)',
  navy: 'rgba(7,33,78,A)',
  hud: 'rgba(170,205,240,A)',
};
const col = (k, a) => C[k].replace('A', a.toFixed(3));
const MONO = '"Plex Mono", ui-monospace, monospace';

// ───────────────────────────── câmera ─────────────────────────────
// Poses em coordenadas da master (px). z=1 → enquadramento exato da arte original.
const HOME = { x: MW / 2, y: MH / 2, z: 1 };
const POSES = [
  // t0,  t1,   x,     y,     z,     easing          // intenção
  [0.0, 0.0, 1012, 368, 1.30, E.lin],                 // S1 blueprint quase vazio, canto do rótulo
  [0.0, 5.25, 988, 410, 1.55, E.ioS],                 // S1→S2 dolly-in contínuo até a embalagem
  [4.85, 6.45, 1142, 503, 1.63, E.ioC],               // S3 tracking lateral para os dois blocos
  [6.2, 7.6, 1150, 498, 1.67, E.ioS],                 // S3 respiro / análise
  [7.45, 8.42, 392, 318, 2.05, E.ioQ],                // S4 chicote óptico seguindo o "2"
  [8.3, 9.1, 395, 321, 2.07, E.ioS],                  // S4 "Leve 2." gigante
  [9.0, 9.78, 388, 398, 1.80, E.ioC],                 // S4 tilt p/ "Pague 1."
  [9.7, 11.1, 385, 402, 1.84, E.ioS],                 // S4 hold do clímax
  [11.0, 11.88, 360, 612, 1.62, E.ioC],               // S5 tilt p/ o preço
  [11.8, 14.1, 366, 604, 1.665, E.ioS],               // S5 hold do preço
  [14.0, 16.75, HOME.x, HOME.y, HOME.z, E.ioC],       // S6 pull-back até o hero frame
];
function camAt(t) {
  let x = POSES[0][2], y = POSES[0][3], lz = Math.log(POSES[0][4]);
  for (let i = 1; i < POSES.length; i++) {
    const [a, b, px, py, pz, e] = POSES[i], [, , qx, qy, qz] = POSES[i - 1];
    const p = P(t, a, b, e);
    x += (px - qx) * p; y += (py - qy) * p; lz += (Math.log(pz) - Math.log(qz)) * p;
  }
  let z = Math.exp(lz);
  // impactos: micro push-in amortecido (LEVE 2. PAGUE 1. / R$ 11,60)
  const kick = (u, amp) => (u < 0 ? 0 : amp * Math.sin(Math.min(u * 13, Math.PI / 2)) * Math.exp(-u * 4.2));
  z *= 1 + kick(t - T.impact, 0.022) + kick(t - T.priceHit, 0.009);
  if (t >= 16.75) { x = HOME.x; y = HOME.y; z = 1; }
  return { x, y, z };
}

// ───────────────────────────── marcos de tempo ─────────────────────────────
const T = {
  impact: 9.86,      // PAGUE 1. trava → impacto principal
  priceHit: 12.25,   // R$ 11,60 trava → micro-impacto
  lock: 16.75,       // câmera em casa → hero frame
};

// ───────────────────────────── carregamento ─────────────────────────────
let M = null;
const IMG = {};
function loadImage(src) {
  return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
}
async function load() {
  M = await (await fetch(ASSETS + 'manifest.json')).json();
  const jobs = Object.entries(M.sprites).map(async ([k, s]) => { IMG[k] = await loadImage(ASSETS + s.file); });
  jobs.push(loadImage('../master/master_visual.webp').then(im => { IMG.master = im; }));
  await Promise.all(jobs);
  await Promise.all([`400 20px ${MONO}`, `500 20px ${MONO}`, `600 20px ${MONO}`].map(f => document.fonts.load(f)));
  await Promise.all(Object.values(IMG).map(im => (im.decode ? im.decode().catch(() => {}) : 0)));
  buildGeometry();
}

// ───────────────────────────── geometria (master px) ─────────────────────────────
const G = {};
function buildGeometry() {
  const v = M.box;
  G.box = v;
  G.boxSil = ['BLT', 'BRT', 'FRT', 'FRB', 'FLB', 'BLB'].map(k => v[k]);
  G.boxEdges = [ // [a, b, início, duração, oculta?]
    ['BLT', 'BRT', 2.45, 0.42], ['FLT', 'FRT', 2.5, 0.42], ['BLT', 'FLT', 2.58, 0.2], ['BRT', 'FRT', 2.86, 0.18],
    ['FLT', 'FLB', 2.66, 0.36], ['BLT', 'BLB', 2.62, 0.36], ['FRT', 'FRB', 2.9, 0.34],
    ['BLB', 'FLB', 2.98, 0.18], ['FLB', 'FRB', 3.0, 0.36],
    ['BRT', 'BRB', 3.06, 0.32, true], ['BRB', 'BLB', 3.12, 0.36, true], ['BRB', 'FRB', 3.16, 0.24, true],
  ];
  G.boxFaces = [
    [['BLT', 'BRT', 'FRT', 'FLT'], 0.24], // topo
    [['FLT', 'FRT', 'FRB', 'FLB'], 0.15], // frente
    [['BLT', 'FLT', 'FLB', 'BLB'], 0.10], // cabeceira
  ];
  G.bb = M.contours.bb; G.fb = M.contours.fb;
  G.bbBox = bbox(G.bb); G.fbBox = bbox(G.fb);
  // vincos (estimados por gradiente de luminância na master)
  G.fbCrease = [[[1077, 509], [1462, 582]], [[1462, 582], [1457, 790]], [[1462, 582], [1506, 556]]];
  G.bbCrease = [[[1194, 448], [1560, 395]]];
  G.bbHidden = [[[1192, 489], [1192, 660]], [[1192, 660], [1512, 585]]];
  // tipografia
  G.gl = M.glyphs;
  G.two = { x0: G.gl.t_head1[4][0], x1: G.gl.t_head1[4][1], cx: (G.gl.t_head1[4][0] + G.gl.t_head1[4][1]) / 2, cy: 302.5 };
  G.tag = { x: 1336, y: 318, r: 30 };
}
function bbox(pts) {
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
}

// ───────────────────────────── canvas / helpers de desenho ─────────────────────────────
const cv = document.getElementById('c');
const ctx = cv.getContext('2d', { alpha: false });
const off = document.createElement('canvas'); off.width = W; off.height = H;
const octx = off.getContext('2d');
const off2 = document.createElement('canvas'); off2.width = W; off2.height = H;
const o2 = off2.getContext('2d');
for (const c of [ctx, octx, o2]) { c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high'; }

let CAM = HOME, PX = 1; // PX = 1 px de tela em unidades de mundo
function worldT(c, cam = CAM) { const a = K * cam.z; c.setTransform(a, 0, 0, a, 960 - cam.x * a, 540 - cam.y * a); }
function screenT(c) { c.setTransform(1, 0, 0, 1, 0, 0); }
const toScreen = (x, y, cam = CAM) => [(x - cam.x) * K * cam.z + 960, (y - cam.y) * K * cam.z + 540];

function spr(c, name, alpha = 1, comp = null) {
  if (alpha <= 0.001) return;
  const s = M.sprites[name], prevA = c.globalAlpha, prevC = c.globalCompositeOperation;
  c.globalAlpha = prevA * alpha; if (comp) c.globalCompositeOperation = comp;
  c.drawImage(IMG[name], s.x, s.y, s.w, s.h);
  c.globalAlpha = prevA; c.globalCompositeOperation = prevC;
}
/** fatia horizontal [x0,x1] (mundo) de um sprite, com transformações locais opcionais */
function slice(c, name, x0, x1, o = {}) {
  const s = M.sprites[name], sc = s.scale;
  x0 = Math.max(x0, s.x); x1 = Math.min(x1, s.x + s.w);
  if (x1 <= x0 || (o.alpha ?? 1) <= 0.001) return;
  c.save();
  c.globalAlpha = o.alpha ?? 1;
  if (o.comp) c.globalCompositeOperation = o.comp;
  if (o.clip) { c.beginPath(); c.rect(...o.clip); c.clip(); }
  if (o.dx || o.dy) c.translate(o.dx || 0, o.dy || 0);
  if (o.scale && o.scale !== 1) { c.translate(o.ox, o.oy); c.scale(o.scale, o.scale); c.translate(-o.ox, -o.oy); }
  c.drawImage(IMG[name], (x0 - s.x) * sc, 0, (x1 - x0) * sc, s.h * sc, x0, s.y, x1 - x0, s.h);
  c.restore();
}
/** glifo i de um bloco de texto (sombra original + letra), já na posição da master */
function glyph(c, key, i, o = {}) {
  const gl = G.gl['t_' + key], n = gl.length;
  const x0 = i === 0 ? -1e4 : gl[i][0], x1 = i === n - 1 ? 1e4 : gl[i][1];
  if (M.sprites['h_' + key] && !o.noShadow) slice(c, 'h_' + key, x0, x1, { ...o, alpha: (o.alpha ?? 1) * (o.shadowAlpha ?? 1) });
  slice(c, 't_' + key, x0, x1, o);
}
function glyphCount(key) { return G.gl['t_' + key].length; }
function glyphCenter(key, i) { const g = G.gl['t_' + key][i], s = M.sprites['t_' + key]; return [(g[0] + g[1]) / 2, s.y + s.h / 2]; }

/** compõe `content` através de `mask` (ambos em coordenadas de mundo) */
function masked(mask, content, comp = 'source-over', alpha = 1) {
  if (alpha <= 0.001) return;
  octx.setTransform(1, 0, 0, 1, 0, 0); octx.globalCompositeOperation = 'source-over'; octx.globalAlpha = 1;
  octx.clearRect(0, 0, W, H);
  worldT(octx); mask(octx);
  octx.globalCompositeOperation = 'source-in';
  worldT(octx); content(octx);
  octx.globalCompositeOperation = 'source-over';
  ctx.save(); screenT(ctx); ctx.globalAlpha = alpha; ctx.globalCompositeOperation = comp; ctx.drawImage(off, 0, 0); ctx.restore();
}
const WHITE = a => `rgba(255,255,255,${clamp(a)})`;
/** retângulo de revelação com borda suave na frente (dir: +1 → cresce para +x/+y) */
function revealRect(c, x0, y0, x1, y1, axis, front, feather, dir = 1, a = 1) {
  if (axis === 'x') {
    const f = feather;
    if (dir > 0) {
      const solidEnd = Math.min(front - f, x1);
      if (solidEnd > x0) { c.fillStyle = WHITE(a); c.fillRect(x0, y0, solidEnd - x0, y1 - y0); }
      const g = c.createLinearGradient(front - f, 0, front, 0); g.addColorStop(0, WHITE(a)); g.addColorStop(1, WHITE(0));
      c.fillStyle = g; c.fillRect(Math.max(front - f, x0), y0, Math.min(front, x1) - Math.max(front - f, x0), y1 - y0);
    } else {
      const solidStart = Math.max(front + f, x0);
      if (x1 > solidStart) { c.fillStyle = WHITE(a); c.fillRect(solidStart, y0, x1 - solidStart, y1 - y0); }
      const g = c.createLinearGradient(front + f, 0, front, 0); g.addColorStop(0, WHITE(a)); g.addColorStop(1, WHITE(0));
      c.fillStyle = g; c.fillRect(Math.max(front, x0), y0, Math.min(front + f, x1) - Math.max(front, x0), y1 - y0);
    }
  } else {
    const f = feather;
    if (dir > 0) {
      const solidEnd = Math.min(front - f, y1);
      if (solidEnd > y0) { c.fillStyle = WHITE(a); c.fillRect(x0, y0, x1 - x0, solidEnd - y0); }
      const g = c.createLinearGradient(0, front - f, 0, front); g.addColorStop(0, WHITE(a)); g.addColorStop(1, WHITE(0));
      c.fillStyle = g; c.fillRect(x0, Math.max(front - f, y0), x1 - x0, Math.min(front, y1) - Math.max(front - f, y0));
    } else {
      const solidStart = Math.max(front + f, y0);
      if (y1 > solidStart) { c.fillStyle = WHITE(a); c.fillRect(x0, solidStart, x1 - x0, y1 - solidStart); }
      const g = c.createLinearGradient(0, front + f, 0, front); g.addColorStop(0, WHITE(a)); g.addColorStop(1, WHITE(0));
      c.fillStyle = g; c.fillRect(x0, Math.max(front, y0), x1 - x0, Math.min(front + f, y1) - Math.max(front, y0));
    }
  }
}
function polyPath(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }
function polyLen(pts) { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
/** sub-polilinha entre os comprimentos de arco s0..s1 */
function subPath(pts, s0, s1) {
  const out = []; let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L = Math.hypot(bx - ax, by - ay);
    const a = acc, b = acc + L;
    if (b >= s0 && a <= s1 && L > 0) {
      const f0 = clamp((s0 - a) / L), f1 = clamp((s1 - a) / L);
      if (!out.length) out.push([ax + (bx - ax) * f0, ay + (by - ay) * f0]);
      out.push([ax + (bx - ax) * f1, ay + (by - ay) * f1]);
    }
    acc = b;
  }
  return out;
}
function strokePts(c, pts) { if (pts.length < 2) return; c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.stroke(); }
/** traço técnico com brilho; p ∈ [0,1] desenha parcial; devolve a cabeça */
function techLine(c, pts, p, o = {}) {
  if (p <= 0) return null;
  const L = polyLen(pts), sub = subPath(pts, 0, L * clamp(p));
  const a = o.alpha ?? 1, w = (o.w ?? 1.5) * PX;
  c.save();
  c.lineCap = 'round'; c.lineJoin = 'round';
  if (o.dash) c.setLineDash(o.dash.map(d => d * PX));
  if (o.glow !== false) { c.globalCompositeOperation = 'lighter'; c.strokeStyle = col(o.glowCol || 'cyan', 0.16 * a); c.lineWidth = w * 4.5; strokePts(c, sub); }
  c.globalCompositeOperation = o.comp || 'source-over';
  c.strokeStyle = col(o.col || 'line', a); c.lineWidth = w; strokePts(c, sub);
  c.restore();
  const head = sub[sub.length - 1];
  if (o.head && p < 1 && head) spark(c, head[0], head[1], (o.headSize ?? 10) * PX, a);
  return head;
}
function spark(c, x, y, r, a = 1) {
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, col('cyanHi', 0.95 * a)); g.addColorStop(0.25, col('cyan', 0.5 * a)); g.addColorStop(1, col('cyan', 0));
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); c.restore();
}
function monoText(c, s, x, y, size, o = {}) {
  c.save();
  c.font = `${o.weight || 500} ${size}px ${MONO}`;
  c.letterSpacing = `${(o.track ?? 0.12) * size}px`;
  c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'alphabetic';
  c.fillStyle = o.fill || col('hud', o.alpha ?? 0.8);
  c.fillText(s, x, y); c.restore();
}
/** texto "datilografado" com cursor; devolve largura */
function typeText(c, s, x, y, size, p, o = {}) {
  const n = Math.floor(s.length * clamp(p) + 1e-6);
  if (n <= 0 && p <= 0) return;
  monoText(c, s.slice(0, n), x, y, size, o);
  if (p < 1 && p > 0) {
    c.save(); c.font = `${o.weight || 500} ${size}px ${MONO}`; c.letterSpacing = `${(o.track ?? 0.12) * size}px`;
    const w = c.measureText(s.slice(0, n)).width; c.restore();
    c.fillStyle = col('cyan', 0.9 * (o.alpha ?? 1)); c.fillRect(x + w + size * 0.08, y - size * 0.78, size * 0.55, size * 0.9);
  }
}
function crosshair(c, x, y, r, p, a = 1) { // retícula técnica desenhada
  if (p <= 0) return;
  c.save(); c.strokeStyle = col('line', a); c.lineWidth = 1.2 * PX;
  c.beginPath(); c.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(p * 1.4)); c.stroke();
  const L = r * 2.3 * E.outC(clamp(p * 1.2 - 0.15));
  c.beginPath(); c.moveTo(x - L, y); c.lineTo(x + L, y); c.moveTo(x, y - L); c.lineTo(x, y + L); c.stroke(); c.restore();
}
function cornerBrackets(c, b, pad, len, a, scale = 1) {
  const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
  const hw = ((b.x1 - b.x0) / 2 + pad) * scale, hh = ((b.y1 - b.y0) / 2 + pad) * scale;
  c.save(); c.strokeStyle = col('cyan', a); c.lineWidth = 1.6 * PX; c.lineCap = 'square';
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const x = cx + sx * hw, y = cy + sy * hh;
    c.beginPath(); c.moveTo(x - sx * len, y); c.lineTo(x, y); c.lineTo(x, y - sy * len); c.stroke();
  }
  c.restore();
}

// ───────────────────────────── camadas de fundo ─────────────────────────────
function drawBackground(t) {
  screenT(ctx); ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  worldT(ctx);
  // S1: a mesa de luz acende — grid da própria master
  const expo = lerp(0.0, 1, P(t, 0.0, 1.5, E.ioS));
  spr(ctx, 'bg_empty', expo);

  // estruturas (plataforma, círculo, linhas de construção) + line art, via máscaras
  const scanY = lerp(30, 1000, P(t, 2.55, 3.95, E.ioS));
  masked(c => {
    // varredura do scanner (S2) — tudo à direita do bloco tipográfico
    if (t > 2.5) revealRect(c, 560, -400, 2000, 1400, 'y', scanY, 80, 1);
    c.globalCompositeOperation = 'destination-out';
    c.fillStyle = WHITE(1); c.fillRect(40, 352, 650, 214); c.fillRect(40, 612, 60, 140);
    c.globalCompositeOperation = 'source-over';
    lineArtMask(c, t);
  }, c => spr(c, 'bg_struct'));

  // sombras/reflexos de contato acompanham a materialização de cada objeto
  spr(ctx, 's_box', P(t, 4.15, 4.85));
  spr(ctx, 's_bb', P(t, 6.0, 6.6));
  spr(ctx, 's_fb', P(t, 6.4, 7.05));

  // linhas acendem quando o scanner passa
  if (t > 2.5 && t < 4.6) {
    masked(c => {
      const g = c.createLinearGradient(0, scanY - 110, 0, scanY);
      g.addColorStop(0, WHITE(0)); g.addColorStop(0.8, WHITE(0.85)); g.addColorStop(1, WHITE(0));
      c.fillStyle = g; c.fillRect(560, scanY - 110, 1500, 110);
    }, c => spr(c, 'l_lines'), 'lighter', 0.8);
    // a linha do scanner propriamente dita
    worldT(ctx);
    const sa = P(t, 2.55, 2.7) * (1 - P(t, 3.8, 3.95));
    if (sa > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const vx0 = CAM.x - 960 / (K * CAM.z), vx1 = CAM.x + 960 / (K * CAM.z);
      const g2 = ctx.createLinearGradient(0, scanY - 26, 0, scanY);
      g2.addColorStop(0, col('cyan', 0)); g2.addColorStop(1, col('cyan', 0.16 * sa));
      ctx.fillStyle = g2; ctx.fillRect(Math.max(560, vx0), scanY - 26, vx1 - Math.max(560, vx0), 26);
      ctx.fillStyle = col('cyanHi', 0.75 * sa); ctx.fillRect(Math.max(560, vx0), scanY - 0.7 * PX, vx1 - Math.max(560, vx0), 1.4 * PX);
      ctx.restore();
      const la = sa * (1 - P(toScreen(0, scanY)[1], 860, 960, E.lin));
      monoText(ctx, `SCAN ${String(Math.round(P(t, 2.55, 3.95, E.ioS) * 100)).padStart(3, '0')}%`, vx1 - 70 * PX, scanY - 9 * PX, 11 * PX, { align: 'right', alpha: 0.8 * la, fill: col('cyanHi', 0.8 * la) });
    }
  }
  // pulso do grid no impacto
  const pulse = Math.exp(-Math.max(0, t - T.impact) * 5) * (t > T.impact ? 1 : 0);
  if (pulse > 0.01) { worldT(ctx); spr(ctx, 'bg_struct', 0.22 * pulse, 'lighter'); }
}

/** line art da master revelada como desenho (cresce na direção do traço) */
function lineArtMask(c, t) {
  const grow = (x0, y0, x1, y1, axis, p, dir = 1, f = 10) => {
    if (p <= 0) return;
    const a = axis === 'x' ? lerp(dir > 0 ? x0 : x1, dir > 0 ? x1 : x0, p) : lerp(dir > 0 ? y0 : y1, dir > 0 ? y1 : y0, p);
    revealRect(c, x0, y0, x1, y1, axis, a + (dir > 0 ? f : -f) * (p >= 1 ? 3 : 1), f, dir);
  };
  const fromMid = (x0, y0, x1, y1, p) => { if (p <= 0) return; const m = (y0 + y1) / 2, h = (y1 - y0) / 2 * p; c.fillStyle = WHITE(1); c.fillRect(x0, m - h, x1 - x0, 2 * h); };
  // S1 — moldura do rótulo LIMPA PONTAS KG + retícula superior direita
  grow(1270, 56, 1616, 80, 'x', P(t, 1.05, 1.55));
  grow(1100, 104, 1616, 126, 'x', P(t, 1.15, 1.65));
  fromMid(1296, 50, 1312, 130, P(t, 1.0, 1.3));
  grow(1125, 93, 1306, 102, 'x', P(t, 1.25, 1.7, E.ioC), -1);
  crossMask(c, 1625, 51, P(t, 0.75, 1.25, E.outC));
  // S4 — colchete técnico de "Pague 1."
  fromMid(62, 362, 88, 548, P(t, 9.08, 9.3, E.outC));
  grow(56, 370, 682, 388, 'x', P(t, 9.14, 9.42, E.ioC));
  grow(56, 522, 682, 541, 'x', P(t, 9.2, 9.48, E.ioC));
  grow(648, 360, 676, 562, 'y', P(t, 9.36, 9.54, E.outC));
  // S5 — barra ciano do preço
  grow(60, 618, 94, 748, 'y', P(t, 11.6, 11.88, E.outC));
  // S6 — linha de base do CTA (estende da plataforma para a esquerda) + retículas
  grow(80, 836, 600, 856, 'x', P(t, 15.25, 15.85, E.ioC), -1);
  crossMask(c, 47, 51, P(t, 15.35, 15.85, E.outC));
  crossMask(c, 47, 883, P(t, 15.5, 16.0, E.outC));
}
function crossMask(c, x, y, p) {
  if (p <= 0) return;
  c.fillStyle = WHITE(1);
  c.beginPath(); c.moveTo(x, y); c.arc(x, y, 19, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(p * 1.25)); c.closePath(); c.fill();
  const L = 40 * E.outC(clamp(p * 1.15));
  c.fillRect(x - 5, y - L, 10, 2 * L); c.fillRect(x - L, y - 5, 2 * L, 10);
}

// ───────────────────────────── S1: o projeto acende ─────────────────────────────
function drawOpening(t) {
  if (t > 3.4) return;
  worldT(ctx);
  const fade = 1 - P(t, 2.4, 3.3);
  // datum horizontal atravessa o quadro
  const vx0 = CAM.x - 960 / (K * CAM.z) - 20, vx1 = CAM.x + 960 / (K * CAM.z) + 20;
  techLine(ctx, [[vx0, 476], [vx1, 476]], P(t, 0.35, 1.25, E.ioC), { alpha: 0.55 * fade, w: 1.1, head: true, headSize: 16 });
  techLine(ctx, [[1045, 60], [1045, 565]], P(t, 0.6, 1.4, E.ioC), { alpha: 0.6 * fade, w: 1.1, head: true });
  techLine(ctx, [[702, 160], [702, 520]], P(t, 0.85, 1.55, E.ioC), { alpha: 0.5 * fade, w: 1.1, head: true });
  techLine(ctx, [[1226, 217], [1595, 372]], P(t, 1.15, 1.85, E.ioC), { alpha: 0.5 * fade, w: 1.1, dash: [7, 6], head: true });
  const la = 0.75 * fade;
  if (t > 1.0) typeText(ctx, 'DATUM  Y 476.0', vx0 + 140, 468, 8.5, P(t, 1.0, 1.4, E.lin), { alpha: la });
  if (t > 1.2) typeText(ctx, 'X 1045.0', 1052, 76, 8.5, P(t, 1.2, 1.5, E.lin), { alpha: la });
  if (t > 1.35) typeText(ctx, 'X 0702.0', 709, 176, 8.5, P(t, 1.35, 1.65, E.lin), { alpha: la });
  // marcas de interseção que piscam (calibração)
  const r = rng(77);
  for (let i = 0; i < 16; i++) {
    const x = 640 + r() * 980, y = 120 + r() * 560, t0 = 0.4 + r() * 1.9;
    const a = win(t, t0, t0 + 0.08, t0 + 0.25, t0 + 0.6) * fade;
    if (a > 0.01) {
      const gx = Math.round(x / 14.4) * 14.4, gy = Math.round(y / 14.4) * 14.4, s = 4;
      ctx.strokeStyle = col('cyanHi', 0.9 * a); ctx.lineWidth = 1.1 * PX;
      ctx.beginPath(); ctx.moveTo(gx - s, gy); ctx.lineTo(gx + s, gy); ctx.moveTo(gx, gy - s); ctx.lineTo(gx, gy + s); ctx.stroke();
    }
  }
  // brilho da cabeça da retícula superior direita
  const pc = P(t, 0.75, 1.25, E.outC);
  if (pc > 0 && pc < 1) spark(ctx, 1625 + Math.cos(-Math.PI / 2 + Math.PI * 2 * pc) * 11.5, 51 + Math.sin(-Math.PI / 2 + Math.PI * 2 * pc) * 11.5, 9 * PX);
  // cabeças das linhas da moldura do rótulo
  const heads = [[lerp(1270, 1616, P(t, 1.05, 1.55)), 68.5, P(t, 1.05, 1.55)], [lerp(1100, 1616, P(t, 1.15, 1.65)), 114.5, P(t, 1.15, 1.65)],
    [lerp(1306, 1125, P(t, 1.25, 1.7, E.ioC)), 97.5, P(t, 1.25, 1.7, E.ioC)]];
  for (const [x, y, p] of heads) if (p > 0 && p < 1) spark(ctx, x, y, 12 * PX);
}

// ───────────────────────────── rótulo LIMPA PONTAS KG ─────────────────────────────
function drawLabel(t) {
  if (t >= T.lock + 0.4) return;
  worldT(ctx);
  const n = glyphCount('label');
  for (let i = 0; i < n; i++) {
    const t0 = 1.55 + i * 0.045, p = P(t, t0, t0 + 0.12, E.outC);
    if (p > 0) glyph(ctx, 'label', i, { alpha: p });
  }
  const p = P(t, 1.55, 1.55 + n * 0.045, E.lin);
  if (p > 0 && p < 1) {
    const g = G.gl.t_label[Math.min(n - 1, Math.floor(p * n))];
    ctx.fillStyle = col('cyan', 0.9); ctx.fillRect(g[1] + 3, 80, 2.2, 22);
  }
}

// ───────────────────────────── S2: embalagem — wireframe → volume → textura → real ─────────────────────────────
function boxTopY(x) { // silhueta superior / inferior da embalagem (para a linha do scanner)
  const v = G.box;
  const top = x < v.BRT[0] ? lerp(v.BLT[1], v.BRT[1], (x - v.BLT[0]) / (v.BRT[0] - v.BLT[0])) : lerp(v.BRT[1], v.FRT[1], (x - v.BRT[0]) / (v.FRT[0] - v.BRT[0]));
  const bot = x < v.FLB[0] ? lerp(v.BLB[1], v.FLB[1], (x - v.BLB[0]) / (v.FLB[0] - v.BLB[0])) : lerp(v.FLB[1], v.FRB[1], (x - v.FLB[0]) / (v.FRB[0] - v.FLB[0]));
  return [top, bot];
}
function drawBox(t) {
  if (t < 2.4) return;
  worldT(ctx);
  const v = G.box;
  // VOLUME: faces chapadas (argila técnica)
  const vol = win(t, 3.18, 3.55, 4.1, 4.7);
  if (vol > 0) {
    for (const [keys, a] of G.boxFaces) {
      polyPath(ctx, keys.map(k => v[k])); ctx.fillStyle = `rgba(150,205,255,${a * vol})`; ctx.fill();
    }
    // hachura de corte na frente
    ctx.save(); polyPath(ctx, ['FLT', 'FRT', 'FRB', 'FLB'].map(k => v[k])); ctx.clip();
    ctx.strokeStyle = `rgba(190,230,255,${0.12 * vol})`; ctx.lineWidth = 1 * PX;
    for (let x = 640; x < 1300; x += 9) { ctx.beginPath(); ctx.moveTo(x, 200); ctx.lineTo(x + 420, 620); ctx.stroke(); }
    ctx.restore();
  }
  // TEXTURA → REAL: duas varreduras ao longo do comprimento
  const s1 = lerp(712, 1250, P(t, 3.48, 4.15, E.ioC));
  const s2 = lerp(712, 1250, P(t, 3.8, 4.5, E.ioC));
  if (t > 3.48) masked(c => revealRect(c, 700, 190, 1260, 630, 'x', s1, 36, 1), c => spr(c, 'p_box_tex'));
  if (t > 3.8) masked(c => revealRect(c, 700, 190, 1260, 630, 'x', s2, 28, 1), c => spr(c, 'p_box'));
  worldT(ctx);
  for (const [s, a, warm] of [[s1, P(t, 3.48, 3.55) * (1 - P(t, 4.05, 4.2)), false], [s2, P(t, 3.8, 3.87) * (1 - P(t, 4.4, 4.55)), true]]) {
    if (a <= 0) continue;
    const [y0, y1] = boxTopY(clamp(s - 4, 732, 1222));
    ctx.save(); polyPath(ctx, G.boxSil); ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(s - 40, 0, s, 0);
    g.addColorStop(0, warm ? 'rgba(255,250,240,0)' : col('cyan', 0)); g.addColorStop(1, warm ? `rgba(255,250,240,${0.55 * a})` : col('cyan', 0.5 * a));
    ctx.fillStyle = g; ctx.fillRect(s - 40, y0 - 5, 40, y1 - y0 + 10);
    ctx.restore();
    techLine(ctx, [[s - 4, y0], [s - 4, y1]], 1, { alpha: a, w: 1.6, col: warm ? 'line' : 'cyanHi' });
  }
  // WIREFRAME
  const wfA = lerp(1, 0.22, P(t, 4.35, 5.1)) * (1 - P(t, 7.4, 7.9));
  for (const [a, b, t0, d, hidden] of G.boxEdges) {
    const p = P(t, t0, t0 + d, E.ioC);
    techLine(ctx, [v[a], v[b]], p, { alpha: wfA * (hidden ? 0.6 : 0.95), w: hidden ? 1.1 : 1.5, dash: hidden ? [6, 5] : null, head: true });
  }
  // vértices + coordenadas reais do desenho
  const vk = ['BLT', 'BRT', 'FRT', 'FLT', 'FLB', 'BLB'];
  vk.forEach((k, i) => {
    const p = P(t, 2.7 + i * 0.07, 2.85 + i * 0.07, E.outB);
    if (p <= 0) return;
    const [x, y] = v[k], s = 3.2 * PX * 1.6 * p;
    ctx.strokeStyle = col('cyanHi', wfA); ctx.lineWidth = 1.2 * PX; ctx.strokeRect(x - s, y - s, 2 * s, 2 * s);
  });
  const la = win(t, 2.95, 3.2, 4.6, 5.0) * (1 - P(t, 7.4, 7.9));
  if (la > 0) {
    typeText(ctx, `${v.BLT[0].toFixed(1)} / ${v.BLT[1].toFixed(1)}`, v.BLT[0] - 6, v.BLT[1] - 12, 8, P(t, 2.95, 3.3, E.lin), { alpha: 0.8 * la, align: 'left' });
    typeText(ctx, `${v.FRT[0].toFixed(1)} / ${v.FRT[1].toFixed(1)}`, v.FRT[0] + 10, v.FRT[1] - 4, 8, P(t, 3.05, 3.4, E.lin), { alpha: 0.8 * la });
    typeText(ctx, `${v.FLB[0].toFixed(1)} / ${v.FLB[1].toFixed(1)}`, v.FLB[0] + 8, v.FLB[1] + 18, 8, P(t, 3.15, 3.5, E.lin), { alpha: 0.8 * la });
    // cotas: eixos X / Y / Z do objeto
    const dimA = la * 0.85;
    dimLine(ctx, [v.BLT[0], v.BLT[1] - 34], [v.BRT[0], v.BRT[1] - 34], 'X', P(t, 3.0, 3.5), dimA);
    dimLine(ctx, [v.BLT[0] - 30, v.BLT[1]], [v.BLB[0] - 30, v.BLB[1]], 'Y', P(t, 3.08, 3.55), dimA);
  }
  // brilho percorrendo a aresta superior
  const gp = P(t, 4.45, 5.05, E.ioS);
  if (gp > 0 && gp < 1) glintAlong(ctx, [v.BLT, v.BRT, v.FRT, v.FRB], gp, 90, 0.9);
}
function dimLine(c, a, b, label, p, alpha) {
  if (p <= 0 || alpha <= 0.01) return;
  const [ax, ay] = a, [bx, by] = b, mx = lerp(ax, bx, 0.5), my = lerp(ay, by, 0.5);
  const e = E.ioC(clamp(p));
  const pa = [lerp(mx, ax, e), lerp(my, ay, e)], pb = [lerp(mx, bx, e), lerp(my, by, e)];
  techLine(c, [pa, pb], 1, { alpha, w: 1.0, glow: false, col: 'cyan' });
  const ang = Math.atan2(by - ay, bx - ax), s = 6 * PX * 1.4;
  c.save(); c.strokeStyle = col('cyan', alpha); c.lineWidth = 1 * PX;
  for (const [px, py, d] of [[pa[0], pa[1], 1], [pb[0], pb[1], -1]]) {
    c.beginPath(); c.moveTo(px + Math.cos(ang) * s * d + Math.cos(ang + Math.PI / 2) * s * 0.5, py + Math.sin(ang) * s * d + Math.sin(ang + Math.PI / 2) * s * 0.5);
    c.lineTo(px, py); c.lineTo(px + Math.cos(ang) * s * d - Math.cos(ang + Math.PI / 2) * s * 0.5, py + Math.sin(ang) * s * d - Math.sin(ang + Math.PI / 2) * s * 0.5); c.stroke();
  }
  c.restore();
  if (p > 0.7) {
    c.save(); c.translate(mx, my);
    c.fillStyle = 'rgba(2,12,34,0.85)'; c.fillRect(-10, -8, 20, 14);
    monoText(c, label, 0, 4, 10, { align: 'center', alpha: alpha * P(p, 0.7, 1), fill: col('cyanHi', alpha * clamp((p - 0.7) / 0.3)) });
    c.restore();
  }
}
function glintAlong(c, pts, p, len, a) {
  const L = polyLen(pts), s = lerp(-len, L + len, p);
  c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  for (let k = 0; k < 6; k++) {
    const f0 = s - len * (k + 1) / 6, f1 = s - len * k / 6;
    const seg = subPath(pts, clamp(f0, 0, L), clamp(f1, 0, L));
    c.strokeStyle = `rgba(235,250,255,${a * (1 - k / 6) * 0.9})`; c.lineWidth = (2.2 - k * 0.2) * PX; strokePts(c, seg);
    c.strokeStyle = col('cyan', a * (1 - k / 6) * 0.25); c.lineWidth = 9 * PX; strokePts(c, seg);
  }
  c.restore();
}

// ───────────────────────────── S3: os dois Limpa Pontas KG ─────────────────────────────
const BLOCKS = {
  bb: { tex: [5.55, 6.12], real: [5.8, 6.42], x: [1180, 1592], label: 'UN. 01' },
  fb: { tex: [5.95, 6.52], real: [6.2, 6.82], x: [1060, 1524], label: 'UN. 02' },
};
function ghost(c, key, fillA, lineA, t) {
  const pts = G[key];
  if (fillA > 0) {
    polyPath(c, pts); c.fillStyle = `rgba(9,40,94,${0.96 * fillA})`; c.fill();
    c.save(); polyPath(c, pts); c.clip();
    // brilho interno de borda (sólido técnico) + hachura de corte
    c.strokeStyle = col('cyan', 0.10 * fillA); c.lineWidth = 14 * PX; polyPath(c, pts); c.stroke();
    c.strokeStyle = `rgba(150,215,255,${0.2 * fillA})`; c.lineWidth = 1 * PX;
    const b = G[key + 'Box'];
    for (let x = b.x0 - 300; x < b.x1; x += 8) { c.beginPath(); c.moveTo(x, b.y1); c.lineTo(x + (b.y1 - b.y0), b.y0); c.stroke(); }
    c.restore();
  }
  if (lineA > 0) {
    const closed = [...pts, pts[0]];
    techLine(c, closed, P(t, key === 'bb' ? 2.9 : 3.0, key === 'bb' ? 3.5 : 3.6, E.ioC), { alpha: lineA, w: 1.3, glow: lineA > 0.5, head: true });
    const creases = key === 'fb' ? G.fbCrease : G.bbCrease;
    creases.forEach((seg, i) => techLine(c, seg, P(t, 3.2 + i * 0.08, 3.55 + i * 0.08), { alpha: lineA * 0.8, w: 1.1, glow: false }));
    if (key === 'bb') G.bbHidden.forEach(seg => techLine(c, seg, P(t, 3.3, 3.7), { alpha: lineA * 0.55, w: 1, dash: [5, 5], glow: false }));
  }
}
function drawBlocks(t) {
  if (t < 2.85) return;
  worldT(ctx);
  const ghostIn = P(t, 2.9, 3.35);
  const lineBase = lerp(0.6, 0.95, P(t, 5.05, 5.4));
  for (const key of ['bb', 'fb']) {
    const B = BLOCKS[key];
    const done = P(t, B.real[1] - 0.05, B.real[1] + 0.3);
    // fantasma (desenho técnico) cobre a área até a peça real assentar
    ghost(ctx, key, ghostIn * (1 - done), 0, t);
    // passes TEXTURA → REAL, com assentamento em profundidade
    const st = P(t, B.tex[0], B.real[1] + 0.15, E.outC);
    const dy = -7 * (1 - st), sc = lerp(1.03, 1, st);
    const b = G[key + 'Box'], ox = (b.x0 + b.x1) / 2, oy = b.y1;
    const s1 = lerp(B.x[0], B.x[1], P(t, B.tex[0], B.tex[1], E.ioC));
    const s2 = lerp(B.x[0], B.x[1], P(t, B.real[0], B.real[1], E.ioC));
    const xf = c => { c.translate(0, dy); c.translate(ox, oy); c.scale(sc, sc); c.translate(-ox, -oy); };
    if (t > B.tex[0]) masked(c => revealRect(c, B.x[0] - 20, 300, B.x[1] + 20, 820, 'x', s1, 34, 1), c => { xf(c); spr(c, `p_${key}_tex`); });
    if (t > B.real[0]) masked(c => revealRect(c, B.x[0] - 20, 300, B.x[1] + 20, 820, 'x', s2, 26, 1), c => { xf(c); spr(c, `p_${key}`); });
    worldT(ctx);
    // linha do scanner
    for (const [s, a0, a1, warm] of [[s1, B.tex[0], B.tex[1], false], [s2, B.real[0], B.real[1], true]]) {
      const a = P(t, a0, a0 + 0.06) * (1 - P(t, a1 - 0.1, a1 + 0.02));
      if (a <= 0) continue;
      ctx.save(); polyPath(ctx, G[key]); ctx.clip();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(s - 36, 0, s, 0);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, warm ? `rgba(255,250,240,${0.5 * a})` : col('cyan', 0.55 * a));
      ctx.fillStyle = g; ctx.fillRect(s - 36, b.y0 - 10, 36, b.y1 - b.y0 + 20);
      ctx.fillStyle = warm ? `rgba(255,252,245,${0.9 * a})` : col('cyanHi', 0.9 * a); ctx.fillRect(s - 3, b.y0 - 10, 1.6 * PX, b.y1 - b.y0 + 20);
      ctx.restore();
    }
  }
  // contornos técnicos por cima (x-ray), esmaecem quando as peças viram reais
  for (const key of ['bb', 'fb']) {
    const B = BLOCKS[key];
    const la = ghostIn * lineBase * lerp(1, 0.2, P(t, B.real[1] - 0.1, B.real[1] + 0.5)) * (1 - P(t, 7.4, 7.9));
    ghost(ctx, key, 0, la, t);
  }
  // rastreamento: colchetes de canto + rótulos UN. 01 / UN. 02
  for (const [key, t0] of [['bb', 5.25], ['fb', 5.4]]) {
    const p = P(t, t0, t0 + 0.38, E.outC), a = p * (1 - P(t, 7.35, 7.7));
    if (a <= 0) continue;
    cornerBrackets(ctx, G[key + 'Box'], 10, 16, 0.95 * a, lerp(1.22, 1, p));
    const lbl = BLOCKS[key].label;
    if (key === 'bb') {
      const b = G.bbBox; techLine(ctx, [[b.x1 + 10, b.y0 - 10], [b.x1 + 30, b.y0 - 30], [b.x1 + 64, b.y0 - 30]], P(t, t0 + 0.2, t0 + 0.45), { alpha: a, w: 1, glow: false, col: 'cyan' });
      typeText(ctx, lbl, b.x1 + 32, b.y0 - 35, 10, P(t, t0 + 0.35, t0 + 0.6, E.lin), { alpha: a, fill: col('cyanHi', a) });
    } else {
      const b = G.fbBox; techLine(ctx, [[b.x0 - 10, 640], [b.x0 - 34, 664], [b.x0 - 90, 664]], P(t, t0 + 0.2, t0 + 0.45), { alpha: a, w: 1, glow: false, col: 'cyan' });
      typeText(ctx, lbl, b.x0 - 88, 659, 10, P(t, t0 + 0.35, t0 + 0.6, E.lin), { alpha: a, fill: col('cyanHi', a) });
    }
  }
  // brilho nas arestas superiores quando cada peça assenta
  const gb = P(t, 6.35, 6.95, E.ioS); if (gb > 0 && gb < 1) glintAlong(ctx, G.bb.slice(0, 12).reverse(), gb, 80, 0.8);
  const gf = P(t, 6.75, 7.35, E.ioS); if (gf > 0 && gf < 1) glintAlong(ctx, [[1077, 507], [1111, 482], [1140, 482], [1267, 504], [1501, 552], [1508, 559]], gf, 80, 0.85);
}

// ───────────────────────────── o "2": sugestão → match cut tipográfico ─────────────────────────────
function drawTwoTag(t) {
  if (t < 6.6 || t >= 8.42) return;
  worldT(ctx);
  const tg = G.tag;
  const travel = P(t, 7.45, 8.42, E.ioQ);
  const x = lerp(tg.x, G.two.cx, travel), y = lerp(tg.y, G.two.cy, travel) - Math.sin(Math.PI * travel) * 36;
  const s0 = 0.3, s = lerp(s0, 1, travel) * lerp(0.6, 1, P(t, 6.72, 7.0, E.outB));
  // anel + guias até as duas peças
  const ringIn = P(t, 6.62, 6.95, E.outC);
  const ringR = tg.r * lerp(1, 4.2, P(t, 7.45, 7.95, E.outC));
  const ringA = ringIn * (1 - P(t, 7.45, 7.95));
  if (ringA > 0) {
    ctx.save(); ctx.strokeStyle = col('cyan', 0.95 * ringA); ctx.lineWidth = 1.5 * PX;
    ctx.beginPath(); ctx.arc(lerp(tg.x, x, 0.5), lerp(tg.y, y, 0.5), ringR, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ringIn); ctx.stroke();
    ctx.strokeStyle = col('cyan', 0.35 * ringA); ctx.beginPath(); ctx.arc(lerp(tg.x, x, 0.5), lerp(tg.y, y, 0.5), ringR + 6, 0, Math.PI * 2 * ringIn); ctx.stroke();
    ctx.restore();
  }
  const lead = P(t, 6.85, 7.15, E.ioC) * (1 - P(t, 7.45, 7.62));
  if (lead > 0) {
    techLine(ctx, [[tg.x - 8, tg.y + tg.r], [1290, 500]], lead, { alpha: 0.8, w: 1.1, col: 'cyan', glow: false, dash: [4, 4] });
    techLine(ctx, [[tg.x + 8, tg.y + tg.r], [1400, 392]], lead, { alpha: 0.8, w: 1.1, col: 'cyan', glow: false, dash: [4, 4] });
    typeText(ctx, 'QTD.', tg.x + tg.r + 10, tg.y - 6, 9, P(t, 6.95, 7.15, E.lin), { alpha: 0.85 * lead });
  }
  // o próprio glifo "2" da master
  const a = P(t, 6.68, 6.8);
  slice(ctx, 't_head1', G.two.x0, G.two.x1, { alpha: a, dx: x - G.two.cx, dy: y - G.two.cy, scale: s, ox: G.two.cx, oy: G.two.cy });
}

// ───────────────────────────── S4: LEVE 2. PAGUE 1. ─────────────────────────────
function drawHeadline(t) {
  if (t < 8.2) return;
  worldT(ctx);
  const locked = t >= T.lock;
  const guideA = win(t, 8.28, 8.5, 10.2, 11.2) * (1 - P(t, 14, 14.6));
  // guias tipográficas: linha de base e altura de maiúscula
  techLine(ctx, [[640, 370.5], [56, 370.5]], P(t, 8.3, 8.62, E.ioC), { alpha: 0.85 * guideA, w: 1.1, col: 'cyan', head: true });
  techLine(ctx, [[640, 237], [56, 237]], P(t, 8.36, 8.68, E.ioC), { alpha: 0.5 * guideA, w: 1, dash: [6, 5], glow: false, col: 'cyan' });
  techLine(ctx, [[640, 270], [56, 270]], P(t, 8.42, 8.72, E.ioC), { alpha: 0.32 * guideA, w: 1, dash: [3, 6], glow: false, col: 'cyan' });
  if (guideA > 0.02) {
    monoText(ctx, 'BL', 36, 374, 8, { alpha: 0.8 * guideA, fill: col('cyanHi', 0.8 * guideA) });
    monoText(ctx, 'CH', 36, 240, 8, { alpha: 0.6 * guideA, fill: col('cyanHi', 0.6 * guideA) });
    monoText(ctx, 'XH', 36, 273, 8, { alpha: 0.45 * guideA, fill: col('cyanHi', 0.45 * guideA) });
  }
  // marcador técnico percorre a linha de base revelando L-e-v-e
  const mk = P(t, 8.42, 8.86, E.ioS), mkA = P(t, 8.4, 8.46) * (1 - P(t, 8.86, 9.0));
  if (mkA > 0) {
    const mx = lerp(88, 488, mk);
    ctx.save(); ctx.fillStyle = col('cyanHi', mkA);
    ctx.beginPath(); ctx.moveTo(mx, 373); ctx.lineTo(mx - 6, 384); ctx.lineTo(mx + 6, 384); ctx.closePath(); ctx.fill();
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = col('cyan', 0.5 * mkA); ctx.fillRect(mx - 0.8 * PX, 228, 1.6 * PX, 145); ctx.restore();
  }
  // "Leve" nasce da linha de base
  for (let i = 0; i < 4; i++) {
    const g = G.gl.t_head1[i], t0 = 8.42 + ((g[0] - 88) / 400) * 0.44;
    const p = locked ? 1 : P(t, t0, t0 + 0.3, E.outC);
    if (p <= 0) continue;
    const h = 140;
    glyph(ctx, 'head1', i, p >= 1 ? {} : { dy: (1 - p) * h, clip: [-1e4, 0, 2e4, 371.5] });
  }
  // o "2" já pousou (veio da etiqueta das duas unidades)
  if (t >= 8.42) {
    const land = P(t, 8.42, 8.75, E.outC);
    glyph(ctx, 'head1', 4, {});
    if (land < 1) { // ping de pouso
      ctx.save(); ctx.strokeStyle = col('cyanHi', 0.7 * (1 - land)); ctx.lineWidth = 1.4 * PX;
      ctx.beginPath(); ctx.arc(G.two.cx, G.two.cy, lerp(40, 140, land), 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
  }
  // ponto final: encaixe seco
  const dp = locked ? 1 : P(t, 8.88, 9.06, E.outB);
  if (dp > 0) { const [cx, cy] = glyphCenter('head1', 5); glyph(ctx, 'head1', 5, { scale: dp, ox: cx, oy: 352 }); }

  // "Pague 1." — o scanner vertical imprime dentro do colchete
  if (t < 9.4) return;
  const sx = lerp(86, 660, P(t, 9.45, 9.86, E.ioC));
  for (let i = 0; i < glyphCount('head2'); i++) {
    const g = G.gl.t_head2[i];
    const pc = locked ? 1 : P(t, 9.45 + 0.41 * E.ioC(clamp((g[0] - 86) / 574)) * 0.98, 9.45 + 0.41 * E.ioC(clamp((g[1] - 86) / 574)) + 0.12, E.outC);
    const clipX = locked || t > 9.9 ? 1e4 : sx;
    if (clipX <= g[0] - 2 && !locked) continue;
    glyph(ctx, 'head2', i, { clip: [-1e4, -1e4, clipX + 1e4, 3e4], dy: -9 * (1 - pc) });
  }
  const sa = P(t, 9.45, 9.5) * (1 - P(t, 9.84, 9.94));
  if (sa > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(sx - 50, 0, sx, 0); g.addColorStop(0, col('cyan', 0)); g.addColorStop(1, col('cyan', 0.35 * sa));
    ctx.fillStyle = g; ctx.fillRect(sx - 50, 384, 50, 142);
    ctx.fillStyle = col('cyanHi', 0.95 * sa); ctx.fillRect(sx - 0.9 * PX, 381, 1.8 * PX, 148); ctx.restore();
    spark(ctx, sx, 379, 12 * PX, sa); spark(ctx, sx, 531, 12 * PX, sa);
  }
  // cabeças do colchete desenhando
  const br = [[lerp(56, 682, P(t, 9.14, 9.42, E.ioC)), 378.5, P(t, 9.14, 9.42, E.ioC)], [lerp(56, 682, P(t, 9.2, 9.48, E.ioC)), 531, P(t, 9.2, 9.48, E.ioC)],
    [661, lerp(360, 562, P(t, 9.36, 9.54, E.outC)), P(t, 9.36, 9.54, E.outC)]];
  for (const [x, y, p] of br) if (p > 0 && p < 1) spark(ctx, x, y, 14 * PX);
  // IMPACTO
  const u = t - T.impact;
  if (u > 0 && u < 0.7) {
    const k = 1 - E.outC(clamp(u / 0.55));
    // onda de choque retangular a partir do colchete
    const ex = lerp(0, 34, E.outC(clamp(u / 0.55)));
    ctx.save(); ctx.strokeStyle = col('cyanHi', 0.85 * k); ctx.lineWidth = lerp(2.5, 1, 1 - k) * PX;
    ctx.strokeRect(74 - ex, 378.5 - ex * 0.5, 587 + 2 * ex, 152.5 + ex); ctx.restore();
    // bloom da tipografia
    for (let i = 0; i < glyphCount('head2'); i++) glyph(ctx, 'head2', i, { alpha: 0.45 * k, comp: 'lighter', noShadow: true });
    for (let i = 0; i < glyphCount('head1'); i++) glyph(ctx, 'head1', i, { alpha: 0.25 * k, comp: 'lighter', noShadow: true });
    // reacende o colchete
    masked(c => { c.fillStyle = WHITE(1); c.fillRect(56, 372, 626, 13); c.fillRect(56, 525, 626, 13); c.fillRect(66, 362, 18, 186); c.fillRect(653, 362, 18, 200); },
      c => spr(c, 'bg_struct'), 'lighter', 1.0 * k);
  }
  // anotações de engenharia ao redor do clímax
  const an = win(t, 9.95, 10.25, 10.9, 11.3);
  if (an > 0) {
    worldT(ctx);
    for (const [x, y, s] of [[74, 378.5, '074.0 / 378.5'], [661, 531, '661.0 / 531.0']]) {
      spark(ctx, x, y, 7 * PX, an * 0.8);
      monoText(ctx, s, x + (x < 300 ? 8 : -8), y + (y < 400 ? -8 : 16), 7.5, { align: x < 300 ? 'left' : 'right', alpha: 0.75 * an, fill: col('cyanHi', 0.75 * an) });
    }
  }
}

// ───────────────────────────── S5: preço ─────────────────────────────
const CALC = { x: 590, y: 626, w: 214, h: 112 };
function drawPrice(t) {
  if (t < 11.1) return;
  worldT(ctx);
  const locked = t >= T.lock;
  // "2 unidades por" — datilografado com cursor
  const n1 = glyphCount('sub');
  for (let i = 0; i < n1; i++) {
    const t0 = 11.22 + i * 0.034, p = locked ? 1 : P(t, t0, t0 + 0.09, E.outC);
    if (p > 0) glyph(ctx, 'sub', i, { alpha: p, dx: (1 - p) * -4 });
  }
  const cp = P(t, 11.22, 11.22 + n1 * 0.034, E.lin);
  if (cp > 0 && cp < 1) { const g = G.gl.t_sub[Math.min(n1 - 1, Math.floor(cp * n1))]; ctx.fillStyle = col('cyan', 0.95); ctx.fillRect(g[1] + 3, 582, 2.4, 36); }
  // barra ciano: cabeça brilhante
  const bp = P(t, 11.6, 11.88, E.outC); if (bp > 0 && bp < 1) spark(ctx, 76, lerp(626, 740, bp), 14 * PX);
  // R$ 11,60 — varredura a partir da barra
  const wx = lerp(84, 552, P(t, 11.84, 12.24, E.outC));
  const n2 = glyphCount('price');
  for (let i = 0; i < n2; i++) {
    const g = G.gl.t_price[i];
    if (!locked && wx <= g[0] - 2) continue;
    const tl = 11.84 + 0.4 * invOutC(clamp((g[0] - 84) / 468));
    const pd = locked ? 1 : P(t, tl, tl + 0.2, E.outC);
    glyph(ctx, 'price', i, { clip: [-1e4, -1e4, (locked || t > 12.3 ? 1e4 : wx) + 1e4, 3e4], dy: -12 * (1 - pd) });
  }
  const sa = P(t, 11.84, 11.88) * (1 - P(t, 12.18, 12.28));
  if (sa > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = col('cyanHi', 0.9 * sa); ctx.fillRect(wx - 0.9 * PX, 622, 1.8 * PX, 124); ctx.restore(); }
  // micro-impacto do preço
  const u = t - T.priceHit;
  if (u > 0 && u < 0.6) {
    const k = 1 - E.outC(clamp(u / 0.5));
    for (let i = 0; i < n2; i++) glyph(ctx, 'price', i, { alpha: 0.4 * k, comp: 'lighter', noShadow: true });
    masked(c => { c.fillStyle = WHITE(1); c.fillRect(64, 624, 24, 116); }, c => spr(c, 'bg_struct'), 'lighter', 0.9 * k);
  }
  // R$ 5,80 por unidade nesta oferta.
  const n3 = glyphCount('perunit');
  for (let i = 0; i < n3; i++) {
    const t0 = 12.95 + i * 0.016, p = locked ? 1 : P(t, t0, t0 + 0.08, E.outC);
    if (p > 0) glyph(ctx, 'perunit', i, { alpha: p });
  }
  // calculadora técnica minimalista: 2 × R$ 5,80 = R$ 11,60
  const ca = P(t, 12.4, 12.6) * (1 - P(t, 13.95, 14.35));
  if (ca > 0) drawCalc(t, ca);
}
function invOutC(y) { return 1 - Math.cbrt(1 - y); }
function drawCalc(t, a) {
  const { x, y, w, h } = CALC;
  const bp = P(t, 12.4, 12.62, E.ioC);
  ctx.save();
  // caixa de nota técnica
  techLine(ctx, [[x, y + h / 2], [x, y], [x + w * bp, y]], bp, { alpha: 0.85 * a, w: 1.1, glow: false, col: 'cyan' });
  techLine(ctx, [[x, y + h / 2], [x, y + h], [x + w * bp, y + h]], bp, { alpha: 0.85 * a, w: 1.1, glow: false, col: 'cyan' });
  ctx.fillStyle = `rgba(3,16,44,${0.55 * a * bp})`; ctx.fillRect(x, y, w * bp, h);
  // ligação com o preço e com a linha por unidade
  techLine(ctx, [[548, 690], [x, 690]], P(t, 12.42, 12.56), { alpha: 0.7 * a, w: 1, glow: false, col: 'cyan', dash: [3, 4] });
  techLine(ctx, [[x + 8, y + h], [x + 8, 760], [548, 760]], P(t, 13.45, 13.7), { alpha: 0.7 * a, w: 1, glow: false, col: 'cyan', dash: [3, 4] });
  monoText(ctx, 'CÁLC. / UN.', x + 10, y + 16, 7.5, { alpha: 0.6 * a, fill: col('hud', 0.6 * a) });
  slotText('2 × R$ 5,80', x + 12, y + 44, 17, t, 12.62, 0.03, a);
  techLine(ctx, [[x + 12, y + 60], [x + w - 12, y + 60]], P(t, 12.98, 13.12, E.ioC), { alpha: 0.9 * a, w: 1.2, col: 'cyanHi', glow: false });
  slotText('= R$ 11,60', x + 12, y + 90, 17, t, 13.08, 0.03, a, true);
  ctx.restore();
}
/** cada caractere entra direto no valor final (sem números intermediários) */
function slotText(s, x, y, size, t, t0, dt, a, strong) {
  ctx.save(); ctx.font = `${strong ? 600 : 500} ${size}px ${MONO}`; ctx.letterSpacing = `${0.04 * size}px`;
  let cx = x;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i], w = ctx.measureText(ch).width + 0.04 * size;
    const ti = t0 + i * dt, p = P(t, ti, ti + 0.07, E.outC);
    if (t > ti - 0.1 && ch !== ' ') {
      if (p <= 0) { ctx.fillStyle = col('cyan', 0.35 * a); ctx.fillRect(cx + 1, y - size * 0.08, w - 3, 1.4 * PX); }
      else { ctx.fillStyle = strong ? `rgba(255,255,255,${a * p})` : col('hud', 0.95 * a * p); ctx.fillText(ch, cx, y + (1 - p) * 4); }
    }
    cx += w;
  }
  ctx.restore();
}

// ───────────────────────────── S6: composição completa ─────────────────────────────
function drawComposition(t) {
  if (t < 14.2) return;
  worldT(ctx);
  // linhas de construção convergem para o produto
  const conv = [
    [[1625, 51], G.box.FRT, 14.35], [[1060, -40], G.box.BRT, 14.45], [[1720, 552], [1501, 552], 14.55],
    [[1290, 990], [1455, 791], 14.62], [[820, 990], G.box.FLB, 14.5], [[1720, 388], [1572, 388], 14.7],
  ];
  for (const [a, b, t0] of conv) {
    const p = P(t, t0, t0 + 0.6, E.ioC), al = 0.7 * (1 - P(t, 15.4, 16.2));
    const head = techLine(ctx, [a, b], p, { alpha: al, w: 1.1, dash: [6, 5], head: true, headSize: 12 });
    const ping = P(t, t0 + 0.6, t0 + 1.0, E.outC);
    if (ping > 0 && ping < 1) { ctx.save(); ctx.strokeStyle = col('cyanHi', 0.8 * (1 - ping)); ctx.lineWidth = 1.2 * PX; ctx.beginPath(); ctx.arc(b[0], b[1], lerp(4, 26, ping), 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
  }
  // brilho percorrendo os contornos dos produtos
  const gp = P(t, 14.95, 15.95, E.ioS);
  if (gp > 0 && gp < 1) {
    glintAlong(ctx, [...G.boxSil, G.boxSil[0]], gp, 160, 0.75);
    glintAlong(ctx, [...G.fb, G.fb[0]], P(t, 15.1, 16.1, E.ioS), 150, 0.7);
    glintAlong(ctx, G.bb.slice(0, 15), P(t, 15.2, 16.0, E.ioS), 120, 0.6);
  }
  // logo KG SORENSEN: contorno técnico → logo real
  const lo = M.sprites.t_logo;
  const op = P(t, 15.0, 15.4, E.ioC), oa = 1 - P(t, 15.6, 16.0);
  if (op > 0 && oa > 0) {
    const r = [96, 64, 234, 184];
    techLine(ctx, [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]], [r[0], r[1]]], op, { alpha: 0.9 * oa, w: 1.2, head: true });
  }
  if (t > 15.2) masked(c => revealRect(c, lo.x - 10, lo.y - 10, lo.x + lo.w + 10, lo.y + lo.h + 10, 'y', lerp(lo.y - 10, lo.y + lo.h + 40, P(t, 15.2, 15.7, E.ioC)), 30, 1), c => spr(c, 't_logo'));
  // cabeça da linha do CTA
  const fp = P(t, 15.25, 15.85, E.ioC); if (fp > 0 && fp < 1) spark(ctx, lerp(600, 80, fp), 845.5, 14 * PX);
  for (const [x, y, a0] of [[47, 51, 15.35], [47, 883, 15.5]]) {
    const p = P(t, a0, a0 + 0.5, E.outC); if (p > 0 && p < 1) spark(ctx, x + Math.cos(-Math.PI / 2 + Math.PI * 2.5 * p) * 11.5, y + Math.sin(-Math.PI / 2 + Math.PI * 2.5 * p) * 11.5, 8 * PX);
  }
  // CTA e referência
  const locked = t >= T.lock;
  const nc = glyphCount('cta');
  for (let i = 0; i < nc; i++) { const t0 = 15.6 + i * 0.026, p = locked ? 1 : P(t, t0, t0 + 0.09, E.outC); if (p > 0) glyph(ctx, 'cta', i, { alpha: p }); }
  const cp = P(t, 15.6, 15.6 + nc * 0.026, E.lin); if (cp > 0 && cp < 1) { const g = G.gl.t_cta[Math.min(nc - 1, Math.floor(cp * nc))]; ctx.fillStyle = col('cyan', 0.95); ctx.fillRect(g[1] + 3, 858, 2.2, 26); }
  const nr = glyphCount('ref');
  for (let i = 0; i < nr; i++) { const t0 = 15.95 + i * 0.03, p = locked ? 1 : P(t, t0, t0 + 0.09, E.outC); if (p > 0) glyph(ctx, 'ref', i, { alpha: p }); }
}

// ───────────────────────────── S7: hero frame ─────────────────────────────
function drawHero(t) {
  if (t < T.lock) return;
  // trava na arte original (pixel a pixel)
  const a = P(t, T.lock, T.lock + 0.35, E.ioS);
  worldT(ctx, HOME);
  ctx.globalAlpha = a; ctx.drawImage(IMG.master, 0, 0, MW, MH); ctx.globalAlpha = 1;
  // um único brilho percorre LEVE 2. PAGUE 1.
  const g = P(t, 17.2, 17.95, E.ioS);
  if (g > 0 && g < 1) {
    o2.setTransform(1, 0, 0, 1, 0, 0); o2.clearRect(0, 0, W, H); worldT(o2, HOME);
    spr(o2, 't_head1'); spr(o2, 't_head2');
    o2.globalCompositeOperation = 'source-in';
    const x = lerp(-120, 820, g);
    const gr = o2.createLinearGradient(x - 90, 0, x + 90, 0);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(210,245,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    o2.save(); o2.translate(x, 390); o2.transform(1, 0, -0.35, 1, 0, 0); o2.translate(-x, -390);
    o2.fillStyle = gr; o2.fillRect(x - 90, 200, 180, 380); o2.restore();
    o2.globalCompositeOperation = 'source-over';
    screenT(ctx); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(off2, 0, 0); ctx.globalCompositeOperation = 'source-over';
  }
  worldT(ctx, HOME);
  const gb = P(t, 17.55, 18.25, E.ioS);
  if (gb > 0 && gb < 1) { PX = 1 / K; glintAlong(ctx, [G.box.BLT, G.box.BRT, G.box.FRT], gb, 110, 0.55); }
}

// ───────────────────────────── HUD (tela) ─────────────────────────────
function drawHUD(t) {
  const a = P(t, 0.3, 1.1) * (1 - P(t, 14.1, 15.0));
  if (a <= 0.01) return;
  screenT(ctx);
  const A = x => col('hud', x * a);
  // cantos
  ctx.strokeStyle = A(0.5); ctx.lineWidth = 1;
  for (const [x, y, sx, sy] of [[28, 28, 1, 1], [W - 28, 28, -1, 1], [W - 28, H - 28, -1, -1], [28, H - 28, 1, -1]]) {
    ctx.beginPath(); ctx.moveTo(x + sx * 22, y); ctx.lineTo(x, y); ctx.lineTo(x, y + sy * 22); ctx.stroke();
  }
  // réguas que acompanham a câmera (coordenadas reais da prancha)
  const z = K * CAM.z;
  ctx.save(); ctx.beginPath(); ctx.rect(70, 0, W - 140, H); ctx.clip();
  for (let wx = Math.floor((CAM.x - 960 / z) / 10) * 10; wx < CAM.x + 960 / z; wx += 10) {
    const sx = (wx - CAM.x) * z + 960, major = wx % 50 === 0;
    ctx.fillStyle = A(major ? 0.5 : 0.25); ctx.fillRect(Math.round(sx), 0, 1, major ? 10 : 5);
    if (wx % 100 === 0) monoText(ctx, String(wx).padStart(4, '0'), sx + 3, 22, 9.5, { alpha: 0.45 * a });
  }
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(0, 70, W, H - 200); ctx.clip();
  for (let wy = Math.floor((CAM.y - 540 / z) / 10) * 10; wy < CAM.y + 540 / z; wy += 10) {
    const sy = (wy - CAM.y) * z + 540, major = wy % 50 === 0;
    ctx.fillStyle = A(major ? 0.5 : 0.25); ctx.fillRect(0, Math.round(sy), major ? 10 : 5, 1);
    if (wy % 100 === 0) monoText(ctx, String(wy).padStart(4, '0'), 14, sy + 3, 9.5, { alpha: 0.45 * a });
  }
  ctx.restore();
  // cabeçalho
  typeText(ctx, 'PRJ 1810.7021 · REV A', 56, 62, 12, P(t, 0.4, 0.9, E.lin), { alpha: 0.7 * a });
  typeText(ctx, 'VISTA 3/4 · ESC 1:1', 56, 82, 12, P(t, 0.6, 1.1, E.lin), { alpha: 0.45 * a });
  monoText(ctx, `CAM  X ${CAM.x.toFixed(1).padStart(6, '0')}  Y ${CAM.y.toFixed(1).padStart(6, '0')}  Z ${CAM.z.toFixed(3)}`, 56, H - 112, 11, { alpha: 0.5 * a });
  const fr = Math.round(t * FPS);
  monoText(ctx, `FR ${String(fr).padStart(4, '0')} · T ${t.toFixed(2).padStart(5, '0')}s`, 56, H - 92, 11, { alpha: 0.35 * a });
  // carimbo técnico (title block)
  const bx = W - 56 - 420, by = H - 56 - 86, bp = P(t, 0.9, 1.5, E.ioC);
  const ba = 1 - P(t, 4.5, 5.0);
  ctx.save(); ctx.globalAlpha = ba;
  ctx.strokeStyle = A(0.45); ctx.lineWidth = 1;
  ctx.strokeRect(bx + 0.5, by + 0.5, 420 * bp, 86);
  if (bp > 0.6) {
    const ta = P(t, 1.2, 1.6) * a;
    ctx.fillStyle = A(0.3); ctx.fillRect(bx, by + 30, 420 * bp, 1); ctx.fillRect(bx, by + 58, 420 * bp, 1); ctx.fillRect(bx + 250, by, 1, 58);
    monoText(ctx, 'KG SORENSEN', bx + 12, by + 20, 11, { weight: 600, alpha: 0.75 * ta });
    monoText(ctx, 'FOLHA 01/01', bx + 262, by + 20, 11, { alpha: 0.5 * ta });
    monoText(ctx, 'LIMPA PONTAS KG', bx + 12, by + 48, 11, { alpha: 0.6 * ta });
    monoText(ctx, 'REF. 1810.7021', bx + 262, by + 48, 11, { alpha: 0.6 * ta });
    monoText(ctx, 'PRECISÃO ATÉ NA HORA DE ECONOMIZAR.', bx + 12, by + 76, 10, { alpha: 0.5 * ta });
  }
  ctx.restore();
  // status da etapa (narrativa sem áudio)
  const stage = t < 2.5 ? 'CALIBRAÇÃO' : t < 5 ? 'CONSTRUÇÃO · EMBALAGEM' : t < 7.5 ? 'ANÁLISE · 2 UNIDADES' : t < 11 ? 'CONDIÇÃO ESPECIAL' : 'VALOR';
  monoText(ctx, `● ${stage}`, 56, H - 66, 11, { alpha: 0.55 * a, fill: col('cyan', 0.75 * a) });
}

// ───────────────────────────── pós ─────────────────────────────
let grainTiles = null;
function makeGrain() {
  grainTiles = [];
  for (let k = 0; k < 4; k++) {
    const g = document.createElement('canvas'); g.width = g.height = 256;
    const c = g.getContext('2d'), d = c.createImageData(256, 256), r = rng(1000 + k);
    for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (r() + r() + r() - 1.5) * 90; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    c.putImageData(d, 0, 0); grainTiles.push(g);
  }
}
function drawPost(t) {
  screenT(ctx);
  // vinheta só fora do enquadramento final (no hero a arte é a master pura)
  const v = 0.42 * clamp((CAM.z - 1) / 0.6) * (t < T.lock ? 1 : 0);
  if (v > 0.01) {
    const g = ctx.createRadialGradient(960, 540, 380, 960, 540, 1150);
    g.addColorStop(0, 'rgba(1,6,18,0)'); g.addColorStop(1, `rgba(1,6,18,${v})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  // abertura: escuro → mesa de luz
  const fadeIn = 1 - P(t, 0.0, 0.6, E.ioS);
  if (fadeIn > 0) { ctx.fillStyle = `rgba(1,5,15,${fadeIn})`; ctx.fillRect(0, 0, W, H); }
  // grão fino (dither contra banding nos azuis)
  if (!grainTiles) makeGrain();
  const r = rng(Math.round(t * FPS) + 9), tile = grainTiles[Math.floor(r() * 4)];
  ctx.save(); ctx.globalAlpha = t >= T.lock + 0.35 ? 0.035 : 0.05; ctx.globalCompositeOperation = 'overlay';
  const ox = -Math.floor(r() * 256), oy = -Math.floor(r() * 256);
  for (let y = oy; y < H; y += 256) for (let x = ox; x < W; x += 256) ctx.drawImage(tile, x, y);
  ctx.restore();
}

// ───────────────────────────── quadro ─────────────────────────────
function render(t) {
  t = clamp(t, 0, DUR);
  CAM = camAt(t); PX = 1 / (K * CAM.z);
  ctx.save();
  drawBackground(t);
  drawLabel(t);
  drawBox(t);
  drawBlocks(t);
  drawOpening(t);
  drawHeadline(t);
  drawPrice(t);
  drawComposition(t);
  drawTwoTag(t);
  drawHero(t);
  CAM = camAt(t); PX = 1 / (K * CAM.z);
  drawHUD(t);
  drawPost(t);
  ctx.restore();
}

// ───────────────────────────── motion blur (render offline) ─────────────────────────────
function camSpeed(t) { // deslocamento máximo em px de tela por quadro
  const a = camAt(t), b = camAt(t + 1 / FPS);
  let m = 0;
  for (const [sx, sy] of [[0, 0], [W, 0], [0, H], [W, H], [960, 540]]) {
    const wx = (sx - 960) / (K * a.z) + a.x, wy = (sy - 540) / (K * a.z) + a.y;
    const [bx, by] = toScreen(wx, wy, b);
    m = Math.max(m, Math.hypot(bx - sx, by - sy));
  }
  return m;
}
let acc = null;
function renderFrame(n) {
  const t = n / FPS;
  const sp = camSpeed(t) + (t > 7.45 && t < 8.42 ? 20 : 0);
  const shutter = t > 7.45 && t < 8.42 ? 0.5 : 0.34;
  const S = clamp(Math.ceil((sp * shutter) / 2.5), 1, 40); // passo ≤ 2.5 px dentro do obturador
  if (S === 1) { render(t); return 1; }
  if (!acc) acc = new Float32Array(W * H * 4);
  acc.fill(0);
  for (let i = 0; i < S; i++) {
    render(t + ((i + 0.5) / S - 0.5) * (shutter / FPS)); // obturador 180° no chicote, ~120° no resto
    const d = ctx.getImageData(0, 0, W, H).data;
    for (let j = 0; j < d.length; j++) acc[j] += d[j];
  }
  const img = ctx.createImageData(W, H), o = img.data;
  for (let j = 0; j < o.length; j++) o[j] = acc[j] / S + 0.5;
  ctx.putImageData(img, 0, 0);
  return S;
}

// ───────────────────────────── player ─────────────────────────────
(async () => {
  if (RENDER) document.body.classList.add('render');
  await load();
  document.getElementById('loading')?.remove();
  window.renderFrame = renderFrame; window.renderAt = render; window.DUR = DUR; window.FPS = FPS;
  window.__ready = true;
  if (RENDER) return;
  const scrub = document.getElementById('scrub'), tc = document.getElementById('tc'), btn = document.getElementById('play');
  let playing = true, t0 = performance.now(), base = 0, cur = 0;
  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${(s % 60).toFixed(2).padStart(5, '0')}`;
  btn.onclick = () => { playing = !playing; btn.textContent = playing ? 'PAUSE' : 'PLAY'; base = cur; t0 = performance.now(); };
  scrub.oninput = () => { cur = base = +scrub.value; t0 = performance.now(); render(cur); };
  btn.textContent = 'PAUSE';
  const loop = now => {
    if (playing) { cur = base + (now - t0) / 1000; if (cur > DUR + 1) { base = 0; t0 = now; cur = 0; } render(Math.min(cur, DUR)); scrub.value = Math.min(cur, DUR); }
    tc.textContent = `${fmt(Math.min(cur, DUR))} / ${DUR.toFixed(2)}`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
