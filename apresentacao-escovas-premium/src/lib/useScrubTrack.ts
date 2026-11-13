import { useEffect, useRef, useState, type RefObject } from 'react';
import { ScrollTrigger, motionAllowed } from './motion';
import { scrollToTarget } from './smoothScroll';

/**
 * Trilho de rolagem para cenas fixadas, em qualquer tamanho de tela: o
 * contêiner alto mantém o palco preso (position: sticky) e a rolagem vira um
 * progresso 0–1, a única autoridade sobre a cena. Com movimento reduzido ou no
 * modo leve não há trilho; os botões definem o progresso diretamente.
 */
export function useScrubTrack(track: RefObject<HTMLElement | null>, onProgress?: (p: number) => void) {
  const progress = useRef(0);
  const [pinned, setPinned] = useState(false);
  const cb = useRef(onProgress);
  cb.current = onProgress;

  useEffect(() => {
    setPinned(motionAllowed());
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el || !pinned) return;
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        progress.current = self.progress;
        cb.current?.(self.progress);
      },
    });
    progress.current = st.progress;
    return () => st.kill();
  }, [pinned, track]);

  const goTo = (p: number) => {
    const el = track.current;
    if (pinned && el) {
      const top = el.getBoundingClientRect().top + window.scrollY;
      const range = el.offsetHeight - window.innerHeight;
      scrollToTarget(top + range * p);
    } else {
      progress.current = p;
      cb.current?.(p);
    }
  };

  return { progress, pinned, goTo };
}
