import * as THREE from 'three';
import type { FilmRenderer } from '../../shared/stage/FilmRenderer';
import type { FilmState } from '../../shared/stage/state';
import { BEATS, MACRO_STOPS, beatAt } from '../../shared/timeline/film';
import { GRITS, GRIT_ORDER, SHAPES, SHAPE_ORDER, type Variant } from '../../shared/bur/profiles';
import { clamp, easeOutCubic, range, smooth, windowed } from '../../shared/util/ease';
import { rng } from '../../shared/util/rng';
import { CAPTIONS, CORE_SPECS, EXPLODED_LABELS, FINAL, MACRO_COPY, type Caption, type Label } from './cues';

const h = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '', html = '') => {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (html) el.innerHTML = html;
  return el;
};
const SVGNS = 'http://www.w3.org/2000/svg';
const sv = <K extends keyof SVGElementTagNameMap>(tag: K, cls = '') => {
  const el = document.createElementNS(SVGNS, tag);
  if (cls) el.setAttribute('class', cls);
  return el;
};

type CapEl = { c: Caption; el: HTMLElement; words: HTMLElement[] };
type LabEl = {
  l: Label;
  el: HTMLElement;
  line: SVGPolylineElement;
  dot: SVGCircleElement;
  dotc: SVGCircleElement;
  cross: SVGPathElement;
  len: number;
};

export type FinalHandlers = {
  onVariant: (v: Variant) => void;
};

export class Overlay {
  private root: HTMLElement;
  private caps: CapEl[] = [];
  private labels: LabEl[] = [];
  private svg: SVGSVGElement;
  private beatEl: HTMLElement;
  private coords: HTMLElement;
  private hint: HTMLElement;
  private railFill: HTMLElement;
  private ticks: HTMLElement[] = [];
  private macroIdx: HTMLElement;
  private counter: HTMLElement;
  private counterNum: HTMLElement;
  private specs: HTMLElement;
  private profile: HTMLElement;
  private profilePath: SVGPathElement;
  private profileScan: SVGLineElement;
  private profileRough: number[];
  private variant: HTMLElement;
  private final: HTMLElement;
  private finalBtns: HTMLButtonElement[] = [];
  private hud: HTMLElement;
  private tmpV = new THREE.Vector3();
  private proj = { x: 0, y: 0, z: 0, behind: false };
  private lastVariantKey = '';
  private lastBeat = -1;
  private lastMacro = -1;
  private lastCount = -1;
  selected: Variant = { shape: 'esferica', grit: 'grossa' };

  constructor(root: HTMLElement, logoUrl: string, handlers: FinalHandlers) {
    this.root = root;

    // ---------------------------------------------------------- chrome
    const chrome = h('div', 'chrome');
    const tl = h('div', 'tl');
    const logo = h('img', 'brandmark') as HTMLImageElement;
    logo.src = logoUrl;
    logo.alt = 'KG Sorensen';
    tl.append(logo, h('span', 'sep'), h('span', 'mono tl-name', 'Ponta diamantada FG'));
    const tr = h('div', 'tr');
    this.beatEl = h('span', 'mono beat');
    tr.append(this.beatEl);
    const bl = h('div', 'bl');
    this.coords = h('span', 'mono coords');
    bl.append(this.coords);
    const br = h('div', 'br');
    br.append(h('span', 'mono coords', 'Ciência &amp; Precisão'));
    this.hint = h('div', 'hint');
    this.hint.append(h('span', 'mono', 'Role para revelar'), h('span', 'line'));
    // rail
    const rail = h('div', 'rail');
    rail.append(h('span', 'track'));
    this.railFill = h('span', 'fill');
    rail.append(this.railFill);
    BEATS.forEach((b, i) => {
      const t = h('span', 'tick');
      t.style.top = `${b.start * 100}%`;
      const label = h('span', 'mono', `${String(i + 1).padStart(2, '0')} ${b.label}`);
      t.append(label);
      rail.append(t);
      this.ticks.push(t);
    });
    chrome.append(tl, tr, bl, br, this.hint, rail);

    // ---------------------------------------------------------- leaders
    this.svg = sv('svg', 'leaders');
    this.root.append(this.svg);

    // ---------------------------------------------------------- captions
    for (const c of CAPTIONS) {
      const el = h('div', `cap place-${c.place}`);
      const words: HTMLElement[] = [];
      if (c.kicker) el.append(h('div', 'mono k', c.kicker));
      const split = (text: string, cls: string, tag: 'h2' | 'p') => {
        const node = h(tag, cls);
        text.split('\n').forEach((line, li) => {
          if (li) node.append(document.createElement('br'));
          line.split(' ').forEach((w, wi) => {
            if (wi) node.append(document.createTextNode(' '));
            const s = h('span', 'w', w);
            words.push(s);
            node.append(s);
          });
        });
        return node;
      };
      if (c.title) el.append(split(c.title, 't', 'h2'));
      if (c.body) el.append(split(c.body, 'b', 'p'));
      if (c.note) el.append(h('div', 'mono n', c.note));
      this.root.append(el);
      this.caps.push({ c, el, words });
    }

    // ---------------------------------------------------------- labels
    const macroLabels: Label[] = MACRO_STOPS.map((s, i) => ({
      id: `m-${s.id}`,
      anchor: { world: s.target },
      in: s.at - 0.0085,
      out: s.at + 0.0105,
      index: String(i + 1).padStart(2, '0'),
      ...MACRO_COPY[s.id],
    }));
    for (const l of [...macroLabels, ...EXPLODED_LABELS]) {
      const el = h('div', `lab ${l.dx < 0 ? 'left' : ''}`);
      el.innerHTML = `<div class="mono lt">${l.index ? `<span class="li">${l.index}</span>` : ''}${l.title}</div><div class="mono ls">${l.sub}</div>`;
      const line = sv('polyline', 'ln');
      const dot = sv('circle', 'dot');
      dot.setAttribute('r', '5');
      const dotc = sv('circle', 'dotc');
      dotc.setAttribute('r', '1.5');
      const cross = sv('path', 'cross');
      this.svg.append(line, dot, dotc, cross);
      this.root.append(el);
      this.labels.push({ l, el, line, dot, dotc, cross, len: 0 });
    }

    // ---------------------------------------------------------- macro index
    this.macroIdx = h('div', 'macro-index');
    this.root.append(this.macroIdx);

    // ---------------------------------------------------------- exploded counter
    this.counter = h('div', 'counter');
    this.counterNum = h('div', 'num');
    this.counter.append(
      this.counterNum,
      h('div', 'mono', 'cristais de diamante neste modelo · granulação grossa'),
    );
    this.root.append(this.counter);

    // ---------------------------------------------------------- core
    this.specs = h('div', 'specs');
    for (const s of CORE_SPECS) {
      const d = h('div', 's');
      d.append(h('div', 'big', s.big), h('div', 'mono', s.small));
      this.specs.append(d);
    }
    this.root.append(this.specs);
    this.profile = h('div', 'profile');
    const psvg = sv('svg');
    psvg.setAttribute('viewBox', '0 0 1000 48');
    psvg.setAttribute('preserveAspectRatio', 'none');
    const base = sv('line');
    base.setAttribute('x1', '0');
    base.setAttribute('x2', '1000');
    base.setAttribute('y1', '24');
    base.setAttribute('y2', '24');
    base.setAttribute('stroke', 'rgba(236,238,240,.12)');
    this.profilePath = sv('path');
    this.profilePath.setAttribute('fill', 'none');
    this.profilePath.setAttribute('stroke', '#f1f1ee');
    this.profilePath.setAttribute('stroke-width', '1');
    this.profilePath.setAttribute('vector-effect', 'non-scaling-stroke');
    this.profileScan = sv('line');
    this.profileScan.setAttribute('y1', '0');
    this.profileScan.setAttribute('y2', '48');
    this.profileScan.setAttribute('stroke', '#D4F82E');
    this.profileScan.setAttribute('vector-effect', 'non-scaling-stroke');
    psvg.append(base, this.profilePath, this.profileScan);
    const pl = h('div', 'mono');
    pl.append(h('span', '', 'Perfil da superfície · visualização'), h('span', '', 'Abrasão por cristais de diamante'));
    this.profile.append(psvg, pl);
    this.root.append(this.profile);
    const r = rng(9);
    this.profileRough = Array.from({ length: 200 }, (_, i) => Math.sin(i * 0.9) * 0.4 + r.gauss() * 0.75);

    // ---------------------------------------------------------- variations
    this.variant = h('div', 'variant');
    this.root.append(this.variant);

    // ---------------------------------------------------------- final
    this.final = h('div', 'final');
    const bottom = h('div', 'bottom');
    bottom.append(
      h('div', 'mono promo-tag', FINAL.promo),
      h('p', 'slogan', FINAL.slogan),
      h('p', 'claim', FINAL.claim),
      h('div', 'mono specline', FINAL.specs),
    );
    const ctas = h('div', 'ctas');
    const cta = h('button', 'btn primary interactive', `<span class="dot"></span>${FINAL.cta}`) as HTMLButtonElement;
    cta.type = 'button';
    cta.dataset.cursor = 'big';
    const note = h('div', 'mono contact-note', 'Peça ao seu representante KG Sorensen · condições especiais e bonificação');
    cta.addEventListener('click', () => note.classList.toggle('open'));
    ctas.append(cta);
    bottom.append(
      ctas,
      note,
      h('div', 'mono offer-mini', `${FINAL.offer.kicker} · ${FINAL.offer.title} · ${FINAL.offer.price} · ${FINAL.offer.ref}`),
    );
    this.final.append(bottom);

    // selector
    const sel = h('div', 'selector interactive');
    const mkGroup = (title: string) => {
      const g = h('div', 'group');
      g.append(h('div', 'mono', title));
      const opts = h('div', 'opts');
      g.append(opts);
      sel.append(g);
      return opts;
    };
    const shapes = mkGroup('Forma');
    for (const id of SHAPE_ORDER) {
      const b = h('button', '', SHAPES[id].label) as HTMLButtonElement;
      b.type = 'button';
      b.dataset.cursor = 'big';
      b.dataset.shape = id;
      b.addEventListener('click', () => {
        this.selected = { ...this.selected, shape: id };
        handlers.onVariant(this.selected);
        this.syncSelector();
      });
      shapes.append(b);
      this.finalBtns.push(b);
    }
    const grits = mkGroup('Granulação');
    for (const id of GRIT_ORDER) {
      const g = GRITS[id];
      const b = h('button', '', `<span class="sw" style="--sw:${g.color}"></span>${g.label}`) as HTMLButtonElement;
      b.type = 'button';
      b.dataset.cursor = 'big';
      b.dataset.grit = id;
      b.addEventListener('click', () => {
        this.selected = { ...this.selected, grit: id };
        handlers.onVariant(this.selected);
        this.syncSelector();
      });
      grits.append(b);
      this.finalBtns.push(b);
    }
    this.final.append(sel);

    // offer
    const offer = h('aside', 'offer');
    offer.setAttribute('aria-label', 'Oferta Limpa Pontas KG');
    offer.append(
      h('div', 'mono', FINAL.offer.kicker),
      h('div', 'ot', FINAL.offer.title.replace('Pague 1.', '<em>Pague 1.</em>')),
      h('div', 'op', `<span>R$</span> ${FINAL.offer.price.replace('R$ ', '')}`),
      h('div', 'on', FINAL.offer.priceNote),
      h('div', 'mono ref', `${FINAL.offer.ref} · Peça ao seu representante`),
    );
    this.final.append(offer, h('div', 'mono drag-hint', 'Arraste para inspecionar'));
    this.root.append(chrome, this.final);
    this.syncSelector();

    this.hud = h('div', 'mono hud');
    document.body.append(this.hud);
  }

  syncSelector() {
    for (const b of this.finalBtns) {
      const on = b.dataset.shape ? b.dataset.shape === this.selected.shape : b.dataset.grit === this.selected.grit;
      b.setAttribute('aria-pressed', String(on));
    }
  }

  toggleHud() {
    this.hud.classList.toggle('on');
  }

  private captionAnim(c: CapEl, p: number) {
    const fade = c.c.fade ?? 0.01;
    // a caption that opens the film is already there at rest (no fade-in from p = 0)
    const opening = c.c.in <= 0;
    const k = opening ? 1 - smooth(range(p, c.c.out - fade, c.c.out)) : windowed(p, c.c.in, c.c.out, fade, fade);
    const local = opening ? 1 : range(p, c.c.in, c.c.in + fade * 2.2);
    const leaving = p > c.c.out - fade;
    c.el.style.opacity = String(k > 0.001 ? 1 : 0);
    c.el.style.visibility = k > 0.001 ? 'visible' : 'hidden';
    const n = c.words.length;
    const style = c.c.style ?? 'fade';
    // kicker / note follow the block
    for (const child of Array.from(c.el.children) as HTMLElement[]) {
      if (child.classList.contains('mono')) child.style.opacity = String(k);
    }
    c.words.forEach((w, i) => {
      let o = k;
      let y = 0;
      if (!leaving && (style === 'words' || style === 'rise')) {
        const d = n > 1 ? i / (n - 1) : 0;
        const t = smooth(clamp((local - d * 0.55) / 0.45));
        o = Math.min(k, t);
        y = (1 - t) * (style === 'rise' ? 26 : 14);
      } else if (!leaving && style === 'mask') {
        const t = easeOutCubic(local);
        o = Math.min(k, t);
        y = (1 - t) * 18;
      }
      w.style.opacity = String(o);
      w.style.transform = y ? `translate3d(0,${y.toFixed(2)}px,0)` : '';
    });
  }

  update(p: number, s: FilmState, film: FilmRenderer, crystals: number) {
    const W = film.width;
    const H = film.height;
    const small = W < 760;

    // chrome
    const b = beatAt(p);
    const bi = BEATS.indexOf(b);
    if (bi !== this.lastBeat) {
      this.lastBeat = bi;
      this.beatEl.innerHTML = `<b>${String(bi + 1).padStart(2, '0')}</b> — ${b.label}`;
    }
    const c = film.camera.position;
    this.coords.textContent = `CAM X ${fmt(c.x)} Y ${fmt(c.y)} Z ${fmt(c.z)} · FOV ${film.camera.fov.toFixed(1)}° · T ${(p * 100).toFixed(1).padStart(5, '0')}`;
    const hk = 1 - smooth(range(p, 0.004, 0.03));
    this.hint.style.opacity = String(hk);
    this.hint.style.setProperty('--k', String((s.time * 0.6) % 1));
    this.railFill.style.setProperty('--p', p.toFixed(4));
    this.ticks.forEach((t, i) => {
      t.classList.toggle('on', p >= BEATS[i].start);
      t.classList.toggle('cur', i === bi);
    });

    for (const cap of this.caps) this.captionAnim(cap, p);

    // labels
    for (const L of this.labels) {
      const fade = 0.004;
      const k = small && L.l.wideOnly ? 0 : windowed(p, L.l.in, L.l.out, fade, fade);
      const vis = k > 0.002;
      L.el.style.opacity = String(k);
      L.line.style.opacity = String(k);
      L.dot.style.opacity = String(k);
      L.dotc.style.opacity = String(k);
      L.cross.style.opacity = String(k * 0.8);
      if (!vis) {
        L.el.style.visibility = 'hidden';
        continue;
      }
      L.el.style.visibility = 'visible';
      const a = L.l.anchor;
      if (typeof a === 'string') film.anchor(a, this.tmpV);
      else this.tmpV.set(...a.world);
      const pr = film.project(this.tmpV, this.proj);
      if (pr.behind) {
        L.el.style.visibility = 'hidden';
        continue;
      }
      const sc = small ? 0.55 : Math.min(1.15, W / 1500);
      const dx = L.l.dx * sc;
      const dy = L.l.dy * sc;
      const ex = clamp(pr.x + dx, 24, W - 24);
      const ey = clamp(pr.y + dy, 60, H - 60);
      const ix = pr.x + (ex - pr.x) * 0.55;
      const iy = ey;
      const draw = smooth(range(p, L.l.in, L.l.in + 0.006));
      // leader: anchor → diagonal → horizontal
      const pts = [
        [pr.x, pr.y],
        [pr.x + (ix - pr.x) * draw, pr.y + (iy - pr.y) * draw],
        [ix + (ex - ix) * draw, iy],
      ];
      L.line.setAttribute('points', pts.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join(' '));
      L.dot.setAttribute('cx', pr.x.toFixed(1));
      L.dot.setAttribute('cy', pr.y.toFixed(1));
      L.dotc.setAttribute('cx', pr.x.toFixed(1));
      L.dotc.setAttribute('cy', pr.y.toFixed(1));
      L.dot.setAttribute('r', (3 + 3 * draw).toFixed(2));
      // a small sight around the anchor ("mira")
      const a0 = 9 + 4 * (1 - draw);
      const a1 = a0 + 5;
      const X = pr.x;
      const Y = pr.y;
      L.cross.setAttribute(
        'd',
        `M${X - a1} ${Y}H${X - a0}M${X + a0} ${Y}H${X + a1}M${X} ${Y - a1}V${Y - a0}M${X} ${Y + a0}V${Y + a1}`,
      );
      const left = dx < 0;
      const w = L.el.offsetWidth || 160;
      // keep the text inside the viewport: clamp, never clip
      const tx = left ? clamp(ex - 10 - w, 24, W - 24 - w) : clamp(ex + 10, 24, W - 64 - w);
      L.el.style.transform = `translate3d(${tx.toFixed(1)}px, ${(ey - 9).toFixed(1)}px, 0)`;
      L.el.style.opacity = String(k * draw);
    }

    // macro index
    const inMacro = windowed(p, 0.19, 0.362, 0.008);
    this.macroIdx.style.opacity = String(inMacro);
    if (inMacro > 0) {
      let idx = 0;
      MACRO_STOPS.forEach((m, i) => {
        if (p >= m.at - 0.011) idx = i;
      });
      if (idx !== this.lastMacro) {
        this.lastMacro = idx;
        this.macroIdx.innerHTML = `<div class="num">${String(idx + 1).padStart(2, '0')}<small> / 08</small></div><div class="mono">${MACRO_COPY[MACRO_STOPS[idx].id].title}</div>`;
      }
    }

    // exploded counter
    const ck = windowed(p, 0.44, 0.535, 0.008);
    this.counter.style.opacity = String(ck);
    if (ck > 0) {
      const n = Math.round(crystals * easeOutCubic(range(p, 0.445, 0.5)));
      if (n !== this.lastCount) {
        this.lastCount = n;
        this.counterNum.innerHTML = `<em>${String(n).padStart(4, '0')}</em>`;
      }
    }

    // core
    const kk = windowed(p, 0.638, 0.7, 0.008);
    this.specs.style.opacity = String(kk);
    this.profile.style.opacity = String(kk);
    if (kk > 0) {
      const scan = range(p, 0.642, 0.69);
      const N = this.profileRough.length;
      let d = '';
      for (let i = 0; i < N; i++) {
        const x = (i / (N - 1)) * 1000;
        const planed = x / 1000 < scan;
        const amp = planed ? 2.2 : 11;
        const y = 24 + this.profileRough[i] * amp;
        d += `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(2)}`;
      }
      this.profilePath.setAttribute('d', d);
      this.profileScan.setAttribute('x1', String(scan * 1000));
      this.profileScan.setAttribute('x2', String(scan * 1000));
    }

    // variations readout
    const vk = windowed(p, 0.787, 0.869, 0.006);
    this.variant.style.opacity = String(vk);
    if (vk > 0) {
      const v = s.sweepTo && s.sweep > 0.5 ? s.sweepTo : s.variant;
      const key = `${v.shape}/${v.grit}`;
      if (key !== this.lastVariantKey) {
        this.lastVariantKey = key;
        const g = GRITS[v.grit];
        this.variant.innerHTML = `<div class="name">${SHAPES[v.shape].label.charAt(0)}${SHAPES[v.shape].label.slice(1).toLowerCase()}</div>
          <div class="row mono"><span class="swatch" style="--sw:${g.color}"></span><span>Granulação ${g.label.toLowerCase()} · anel ${g.ring.toLowerCase()} · ≈ ${g.microns} µm</span></div>`;
      }
    } else this.lastVariantKey = '';

    // final
    const fk = smooth(range(p, 0.968, 0.992));
    this.final.style.opacity = String(fk);
    this.final.style.visibility = fk > 0.01 ? 'visible' : 'hidden';
    this.final.classList.toggle('live', fk > 0.6);
    for (const el of Array.from(this.final.querySelectorAll<HTMLElement>('.interactive'))) {
      el.style.pointerEvents = fk > 0.6 ? 'auto' : 'none';
    }

    // debug
    if (this.hud.classList.contains('on')) {
      this.hud.textContent = `P ${p.toFixed(4)} · ${b.label} · EXPLODE ${s.explode.toFixed(2)} · DOF ${s.dof.toFixed(2)} · ${W}×${H} @${film.dpr.toFixed(2)}`;
    }
  }
}

const fmt = (v: number) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2).padStart(5, '0');
