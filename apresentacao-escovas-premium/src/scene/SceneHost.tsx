import { Component, Suspense, lazy, useEffect, useRef, useState, type ReactNode } from 'react';
import { isLiteMode } from '../lib/motion';

const SceneCanvas = lazy(() => import('./SceneCanvas'));

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

class SceneBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

type Props = {
  poster: string;
  posterAlt: string;
  camera: { position: [number, number, number]; fov: number };
  children: ReactNode;
  label: string;
};

/**
 * Monta o canvas 3D somente perto da tela, pausa o loop quando sai de vista,
 * limita a densidade de pixels e troca por uma imagem estática se WebGL não
 * existir, se o contexto se perder ou no modo leve. O conteúdo textual fica
 * sempre no HTML, fora do canvas.
 */
export function SceneHost({ poster, posterAlt, camera, children, label }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [usePoster, setUsePoster] = useState(false);

  useEffect(() => {
    if (!hasWebGL() || isLiteMode()) setUsePoster(true);
    const el = ref.current;
    if (!el) return;
    const ioNear = new IntersectionObserver(([e]) => e?.isIntersecting && setNear(true), { rootMargin: '120% 0px' });
    const ioVis = new IntersectionObserver(([e]) => setVisible(!!e?.isIntersecting), { rootMargin: '10% 0px' });
    ioNear.observe(el);
    ioVis.observe(el);
    return () => {
      ioNear.disconnect();
      ioVis.disconnect();
    };
  }, []);

  const posterEl = (
    <div className="scene-poster">
      <img src={poster} alt={posterAlt} loading="lazy" />
    </div>
  );

  return (
    <div ref={ref} className="scene-host" role="img" aria-label={label}>
      {usePoster || !near ? (
        posterEl
      ) : (
        <SceneBoundary fallback={posterEl}>
          <Suspense fallback={posterEl}>
            <SceneCanvas visible={visible} camera={camera} onContextLost={() => setUsePoster(true)}>
              {children}
            </SceneCanvas>
          </Suspense>
        </SceneBoundary>
      )}
      <span className="scene-tag">Representação conceitual</span>
    </div>
  );
}
