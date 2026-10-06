import { useEffect, useRef } from "react";
import { live } from "./pose.js";

// Pixel glyphs in the Unframe manner: square cells filled with the brand gradient.
const GLYPHS = {
  // diamond bur: flame head, neck, shank
  bur: [
    "...#...",
    "..###..",
    ".#####.",
    ".#####.",
    ".#####.",
    "..###..",
    "...#...",
    "...#...",
    "...#...",
  ],
  // KG Brush: bristles over a handle
  brush: [
    "#.#.#.#",
    "#.#.#.#",
    "#######",
    ".#####.",
    "...#...",
    "...#...",
    "...#...",
    "...#...",
    "...#...",
  ],
};

let gid = 0;

export function PixelGlyph({ name, size = 56, title }) {
  const rows = GLYPHS[name];
  const id = `pg-${name}-${++gid}`;
  const w = rows[0].length;
  const h = rows.length;
  return (
    <svg width={size} height={(size * h) / w} viewBox={`0 0 ${w} ${h}`} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title} shapeRendering="crispEdges">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9CC4F8" />
          <stop offset="0.5" stopColor="#E6F6EA" />
          <stop offset="1" stopColor="#8BFF9E" />
        </linearGradient>
      </defs>
      <g fill={`url(#${id})`}>
        {rows.flatMap((row, y) => row.split("").map((ch, x) => (ch === "#" ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" /> : null)))}
      </g>
    </svg>
  );
}

// Fixed checkerboard of dark tiles that drifts slower than the page and flickers softly.
export function BgTiles() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext("2d");
    let w = 0, h = 0, size = 0, raf = 0;
    const hash = (x, y) => {
      let n = (x * 374761393 + y * 668265263) | 0;
      n = (n ^ (n >>> 13)) * 1274126177;
      return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
    };
    const shades = ["#101010", "#141414", "#121513", "#16181a"];
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      size = Math.max(84, Math.round(w / 9));
    };
    const draw = (time) => {
      ctx.clearRect(0, 0, w, h);
      const off = window.scrollY * 0.35;
      const r0 = Math.floor(off / size);
      const shift = off - r0 * size;
      const cols = Math.ceil(w / size) + 1;
      const rows = Math.ceil(h / size) + 2;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const v = hash(c, r + r0);
          if (v > 0.3) continue;
          let a = 1;
          if (v < 0.06 && !live.reduced) a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(time * 0.0012 + v * 400));
          ctx.globalAlpha = a;
          ctx.fillStyle = shades[Math.floor(v * 1000) % shades.length];
          ctx.fillRect(c * size, r * size - shift, size, size);
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return <canvas ref={ref} className="tiles" aria-hidden="true" />;
}
