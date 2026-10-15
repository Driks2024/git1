/** Asset loading helpers for the browser experience. */

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Falha ao carregar ${url}`));
    img.src = url;
  });
}

/** Fonts are needed before any canvas text (laser marking, titles) is painted. */
export async function loadFonts(timeoutMs = 6000) {
  const wanted = [
    '100 120px "Inter"',
    '200 120px "Inter"',
    '300 40px "Inter"',
    '600 40px "Inter"',
    '700 40px "Inter"',
    '800 40px "Inter"',
    '400 20px "JetBrains Mono"',
    '600 20px "JetBrains Mono"',
  ];
  const all = Promise.all(wanted.map((f) => document.fonts.load(f).catch(() => null)));
  await Promise.race([all, new Promise((r) => setTimeout(r, timeoutMs))]);
  await document.fonts.ready;
}
