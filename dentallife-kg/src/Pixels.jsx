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
