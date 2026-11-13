import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Ajusta o campo de visão à proporção da tela: em telas em pé (celular,
 * tablet vertical) abre a câmera para a cena caber na largura. Retorna se a
 * tela está em pé, para as cenas escolherem a composição.
 */
export function useResponsiveCamera(landscapeFov: number, portraitFov: number): boolean {
  const { size, camera } = useThree();
  const aspect = size.width / Math.max(1, size.height);
  const portrait = aspect < 0.95;
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = portrait ? portraitFov : aspect < 1.35 ? (landscapeFov + portraitFov) / 2 : landscapeFov;
      camera.updateProjectionMatrix();
    }
  }, [aspect, camera, landscapeFov, portrait, portraitFov]);
  return portrait;
}
