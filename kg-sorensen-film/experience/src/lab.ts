// Development lab: renders arbitrary FilmState overrides for look-dev screenshots.
import { FilmRenderer } from '../../shared/stage/FilmRenderer';
import { defaultState, type FilmState } from '../../shared/stage/state';
import { loadImage, loadFonts } from './assets';
import logoUrl from '../../shared/assets/logo-mark-white.png?url';

declare global {
  interface Window {
    __lab?: { render: (o: Partial<FilmState>) => void; ready: boolean; info: () => unknown };
  }
}

async function main() {
  await loadFonts();
  const logo = await loadImage(logoUrl);
  const canvas = document.getElementById('c') as HTMLCanvasElement;
  const film = new FilmRenderer({
    canvas,
    logo,
    width: innerWidth,
    height: innerHeight,
    dpr: Math.min(devicePixelRatio, 2),
    preserveDrawingBuffer: true,
  });
  await film.warmup([{ shape: 'esferica', grit: 'grossa' }]);
  const render = (o: Partial<FilmState>) => {
    const s = { ...defaultState(), ...o } as FilmState;
    if (o.title) s.title = { ...defaultState().title, ...o.title };
    film.render(s);
  };
  window.__lab = { render, ready: true, info: () => film.bur.counts() };
  render({});
}

main();
