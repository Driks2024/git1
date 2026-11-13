import { Environment, Lightformer } from '@react-three/drei';

/**
 * Luz lateral fria, preenchimento moderado e contorno menta. O ambiente de
 * reflexos é gerado localmente com Lightformers (nenhum HDRI é baixado).
 */
export function StudioLights({ warm = false }: { warm?: boolean }) {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 6, 4]} intensity={2.6} color="#f2f6ff" />
      <directionalLight position={[-6, 2, -3]} intensity={0.9} color={warm ? '#ffd9c2' : '#8EFAF0'} />
      <directionalLight position={[0, -4, 6]} intensity={0.15} color="#0366FF" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={3} color="#ffffff" position={[4, 4, 6]} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={1.6} color="#8EFAF0" position={[-6, 1, 2]} scale={[2, 8, 1]} />
        <Lightformer form="rect" intensity={1.2} color="#0366FF" position={[0, -4, -4]} scale={[10, 2, 1]} />
        <Lightformer form="ring" intensity={1.5} color="#ffffff" position={[0, 6, -6]} scale={3} />
      </Environment>
    </>
  );
}
