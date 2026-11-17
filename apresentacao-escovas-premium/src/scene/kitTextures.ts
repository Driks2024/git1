import * as THREE from 'three';

/**
 * Texturas desenhadas em canvas para o kit em 3D. As marcas entram como as
 * imagens fornecidas, sem redesenho; o resto é tipografia e cor simples.
 */

const FONT = '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Zalando Sans", "Helvetica Neue", Arial, sans-serif';

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('canvas 2d indisponível');
  return { c, ctx };
}

function finish(c: HTMLCanvasElement, anisotropy = 4) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = anisotropy;
  t.needsUpdate = true;
  return t;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Proporção do cartão do blister (largura : altura), igual à geometria. */
export const CARD = { w: 0.68, h: 3.58 };

/**
 * Frente do cartão do blister: topo branco com o furo de gancheira,
 * "ULTRASOFT", faixa degradê rosa → roxo e o selo Dental Partner fornecido.
 */
export function makeCardTexture(dpLogo: CanvasImageSource) {
  const W = 360;
  const H = Math.round((W * CARD.h) / CARD.w);
  const { c, ctx } = canvas(W, H);

  roundRect(ctx, 0, 0, W, H, 22);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = '#f6f4f8';
  ctx.fillRect(0, 0, W, H);

  // Degradê da metade inferior.
  const g = ctx.createLinearGradient(0, H * 0.4, 0, H);
  g.addColorStop(0, 'rgba(246,244,248,0)');
  g.addColorStop(0.22, '#f3cfe7');
  g.addColorStop(0.55, '#dc86c9');
  g.addColorStop(1, '#6f22b0');
  ctx.fillStyle = g;
  ctx.fillRect(0, H * 0.4, W, H * 0.6);

  // Faixa cinza em curva, como no cartão.
  ctx.strokeStyle = 'rgba(110,108,122,0.85)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-10, H * 0.37);
  ctx.bezierCurveTo(W * 0.35, H * 0.4, W * 0.7, H * 0.43, W + 10, H * 0.47);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-10, H * 0.375 + 9);
  ctx.bezierCurveTo(W * 0.35, H * 0.405 + 9, W * 0.7, H * 0.435 + 9, W + 10, H * 0.475 + 9);
  ctx.stroke();

  // Texto do topo.
  ctx.fillStyle = '#5b1c9c';
  ctx.textAlign = 'center';
  ctx.font = `700 40px ${FONT}`;
  ctx.fillText('ULTRASOFT', W / 2, H * 0.045 + 30);
  ctx.font = `500 15px ${FONT}`;
  ctx.fillText('5460 ultra gentle and fine filaments', W / 2, H * 0.045 + 56);

  // Selo da marca (imagem fornecida), à esquerda do cabo.
  const s = 104;
  ctx.drawImage(dpLogo, 16, H * 0.82, s, s);
  ctx.restore();

  // Furo de gancheira (recorte transparente).
  ctx.globalCompositeOperation = 'destination-out';
  const y = H * 0.115;
  ctx.lineCap = 'round';
  ctx.lineWidth = 26;
  // Aberto pela esquerda, com a onda no meio, como nos cartões das fotos.
  ctx.beginPath();
  ctx.moveTo(-20, y);
  ctx.lineTo(W * 0.4, y);
  ctx.quadraticCurveTo(W * 0.45, y - 22, W * 0.52, y - 20);
  ctx.quadraticCurveTo(W * 0.59, y - 22, W * 0.64, y);
  ctx.lineTo(W * 0.78, y);
  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';

  return finish(c, 8);
}

/** Verso branco do cartão, com o mesmo recorte. */
export function makeCardBackTexture() {
  const W = 120;
  const H = Math.round((W * CARD.h) / CARD.w);
  const { c, ctx } = canvas(W, H);
  roundRect(ctx, 0, 0, W, H, 8);
  ctx.fillStyle = '#efeef1';
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  const y = H * 0.115;
  ctx.lineCap = 'round';
  ctx.lineWidth = 9;
  // Visto por trás, o recorte abre pela direita.
  ctx.beginPath();
  ctx.moveTo(W + 8, y);
  ctx.lineTo(W * 0.6, y);
  ctx.quadraticCurveTo(W * 0.55, y - 7, W * 0.48, y - 7);
  ctx.quadraticCurveTo(W * 0.41, y - 7, W * 0.36, y);
  ctx.lineTo(W * 0.22, y);
  ctx.stroke();
  return finish(c, 2);
}

/**
 * Logo impresso direto no acrílico: o fundo branco da imagem fornecida vira
 * transparência (a cor e o desenho da marca não mudam).
 */
export function makePrintTexture(img: HTMLImageElement | ImageBitmap) {
  const W = img.width;
  const H = img.height;
  const { c, ctx } = canvas(W, H);
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, W, H);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i]!;
    const gg = d[i + 1]!;
    const b = d[i + 2]!;
    const min = Math.min(r, gg, b);
    // Quanto mais perto do branco, mais transparente.
    const a = Math.max(0, Math.min(255, (255 - min) * 2.4));
    d[i + 3] = a;
  }
  ctx.putImageData(data, 0, 0);
  return finish(c, 4);
}

/** Inscrição "Dental Partner" no cabo da escova, como nas fotos. */
export function makeHandlePrintTexture() {
  const { c, ctx } = canvas(512, 64);
  ctx.fillStyle = '#121218';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 40px ${FONT}`;
  ctx.fillText(':Dental Partner', 256, 34);
  return finish(c, 4);
}

/** Superfície da goiabada cascão vista com a tampa aberta. */
export function makeGoiabadaTopTexture() {
  const S = 256;
  const { c, ctx } = canvas(S, S);
  const g = ctx.createRadialGradient(S / 2, S / 2, 10, S / 2, S / 2, S / 2);
  g.addColorStop(0, '#9b2a1c');
  g.addColorStop(0.75, '#7a1a14');
  g.addColorStop(1, '#4d0f0c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  // Pedacinhos de casca e brilho do açúcar.
  let seed = 42;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 420; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const r = 1 + rnd() * 5;
    ctx.fillStyle = rnd() > 0.7 ? 'rgba(190,70,40,0.55)' : 'rgba(60,8,6,0.45)';
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * (0.5 + rnd() * 0.6), rnd() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  return finish(c, 2);
}
