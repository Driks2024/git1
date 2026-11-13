import { useCallback, useEffect, useState } from 'react';
import { chapters } from '../content/chapters';
import { ScrollTrigger } from '../lib/motion';
import { scrollToId, startSmoothScroll, stopSmoothScroll } from '../lib/smoothScroll';
import { ChapterIndex, Header, PremisesDialog, PresentControls } from './Shell';
import { Opening } from '../chapters/Opening';
import { Network } from '../chapters/Network';
import { Product } from '../chapters/Product';
import { Kit } from '../chapters/Kit';
import { Activation } from '../chapters/Activation';
import { Economics } from '../chapters/Economics';
import { Rollout } from '../chapters/Rollout';
import { Reach } from '../chapters/Reach';
import { Conditions } from '../chapters/Conditions';
import { Closing } from '../chapters/Closing';

const LITE_KEY = 'escovas-premium:lite';

function readLite(): boolean {
  try {
    return localStorage.getItem(LITE_KEY) === '1';
  } catch {
    return false;
  }
}

function isEditable(t: EventTarget | null): boolean {
  const el = t as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

export default function App() {
  const [current, setCurrent] = useState(0);
  const [menu, setMenu] = useState(false);
  const [premises, setPremises] = useState(false);
  const [presenting, setPresenting] = useState(false);
  const [lite, setLite] = useState(readLite);

  // Modo leve: aplicado antes dos efeitos; recarrega para desmontar 3D e WebGL de forma limpa.
  useEffect(() => {
    document.documentElement.dataset.lite = lite ? 'true' : 'false';
  }, [lite]);

  useEffect(() => {
    startSmoothScroll();
    const refresh = () => ScrollTrigger.refresh();
    document.fonts?.ready.then(refresh).catch(() => undefined);
    window.addEventListener('load', refresh);
    // Trilhos fixados, imagens e cenas mudam a altura da página depois da
    // montagem: recalcula as posições dos gatilhos quando a altura muda.
    let t = 0;
    let lastH = 0;
    const ro = new ResizeObserver(() => {
      const h = document.documentElement.scrollHeight;
      if (Math.abs(h - lastH) < 2) return;
      lastH = h;
      window.clearTimeout(t);
      t = window.setTimeout(refresh, 180);
    });
    const main = document.querySelector('main');
    if (main) ro.observe(main);
    return () => {
      stopSmoothScroll();
      window.removeEventListener('load', refresh);
      ro.disconnect();
      window.clearTimeout(t);
    };
  }, []);

  // Capítulo atual: o que cruza a linha a 35% da altura da tela.
  useEffect(() => {
    const els = chapters.map((c) => document.getElementById(c.id));
    const onScroll = () => {
      const line = window.innerHeight * 0.35;
      let idx = 0;
      els.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= line) idx = i;
      });
      setCurrent((prev) => (prev === idx ? prev : idx));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const go = useCallback((i: number) => {
    const c = chapters[Math.max(0, Math.min(chapters.length - 1, i))];
    if (c) scrollToId(c.id);
  }, []);

  // Navegação por teclado entre capítulos (ignorada em campos editáveis e com diálogos abertos).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isEditable(e.target) || e.altKey || e.ctrlKey || e.metaKey || menu || premises) return;
      const map: Record<string, number | 'home' | 'end'> = {
        ArrowRight: 1,
        PageDown: 1,
        ArrowLeft: -1,
        PageUp: -1,
        Home: 'home',
        End: 'end',
      };
      const a = map[e.key];
      if (a === undefined) return;
      e.preventDefault();
      if (a === 'home') go(0);
      else if (a === 'end') go(chapters.length - 1);
      else go(current + a);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, go, menu, premises]);

  // Acesso direto por âncora (#economia etc.).
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.replace('#', ''));
    if (id && chapters.some((c) => c.id === id)) {
      window.setTimeout(() => scrollToId(id, { immediate: true }), 300);
    }
  }, []);

  const togglePresent = useCallback(async () => {
    if (presenting) {
      setPresenting(false);
      if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
      return;
    }
    setPresenting(true);
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {
      // Sem tela cheia disponível: a apresentação segue na janela.
    }
    if (current === 0) go(1);
  }, [current, go, presenting]);

  useEffect(() => {
    const onFs = () => {
      if (!document.fullscreenElement) setPresenting(false);
    };
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const changeLite = (v: boolean) => {
    try {
      localStorage.setItem(LITE_KEY, v ? '1' : '0');
    } catch {
      // armazenamento indisponível: vale só para esta sessão
    }
    setLite(v);
    window.location.reload();
  };

  return (
    <>
      <a className="skip-link" href="#rede">
        Pular para o conteúdo
      </a>
      <Header current={current} presenting={presenting} onPresent={togglePresent} onMenu={() => setMenu(true)} />
      <main>
        <Opening onStart={togglePresent} onSummary={() => scrollToId('encerramento')} />
        <Network />
        <Product />
        <Kit />
        <Activation />
        <Economics />
        <Rollout />
        <Reach />
        <Conditions onOpenPremises={() => setPremises(true)} />
        <Closing
          onEconomics={() => scrollToId('economia')}
          onRollout={() => scrollToId('implantacao')}
          onPremises={() => setPremises(true)}
        />
      </main>
      {presenting ? (
        <PresentControls current={current} onPrev={() => go(current - 1)} onNext={() => go(current + 1)} onExit={togglePresent} />
      ) : null}
      <ChapterIndex
        open={menu}
        current={current}
        lite={lite}
        onClose={() => setMenu(false)}
        onGo={(i) => {
          setMenu(false);
          go(i);
        }}
        onLite={changeLite}
        onPremises={() => {
          setMenu(false);
          setPremises(true);
        }}
      />
      <PremisesDialog open={premises} onClose={() => setPremises(false)} />
      <div className="noise" aria-hidden="true" />
    </>
  );
}
