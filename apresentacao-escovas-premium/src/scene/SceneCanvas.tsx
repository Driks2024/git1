import { Suspense, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';

type Props = {
  visible: boolean;
  camera: { position: [number, number, number]; fov: number };
  onContextLost: () => void;
  children: ReactNode;
};

/** Canvas WebGL carregado sob demanda (three.js fica fora do pacote inicial). */
export default function SceneCanvas({ visible, camera, onContextLost, children }: Props) {
  return (
    <Canvas
      className="scene-canvas"
      frameloop={visible ? 'always' : 'never'}
      dpr={[1, 1.75]}
      camera={{ position: camera.position, fov: camera.fov, near: 0.1, far: 80 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.domElement.addEventListener('webglcontextlost', (ev) => {
          ev.preventDefault();
          onContextLost();
        });
      }}
    >
      <Suspense fallback={null}>{children}</Suspense>
    </Canvas>
  );
}
