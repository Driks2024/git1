import * as THREE from 'three';

/**
 * Shader extensions shared by every material of the rig:
 *  - lime rim light (fresnel) — the glow outline of the KG poster, in 3D
 *  - dissolve: noise threshold with a glowing edge (particles beat)
 * All materials share the same uniform objects, so one write drives them all.
 */
export type FxUniforms = {
  uRimColor: { value: THREE.Color };
  uRimStrength: { value: number };
  uRimPow: { value: number };
  uDissolve: { value: number };
  uEdgeColor: { value: THREE.Color };
  uDissolveScale: { value: number };
};

export function createFxUniforms(): FxUniforms {
  return {
    uRimColor: { value: new THREE.Color('#D4F82E') },
    uRimStrength: { value: 0 },
    uRimPow: { value: 3.2 },
    uDissolve: { value: 0 },
    uEdgeColor: { value: new THREE.Color('#D4F82E') },
    uDissolveScale: { value: 2.2 },
  };
}

const NOISE = /* glsl */ `
varying vec3 vObjPos;
uniform vec3 uRimColor;
uniform float uRimStrength;
uniform float uRimPow;
uniform float uDissolve;
uniform vec3 uEdgeColor;
uniform float uDissolveScale;
float fxHash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float fxNoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(fxHash(i + vec3(0, 0, 0)), fxHash(i + vec3(1, 0, 0)), f.x),
                 mix(fxHash(i + vec3(0, 1, 0)), fxHash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(fxHash(i + vec3(0, 0, 1)), fxHash(i + vec3(1, 0, 1)), f.x),
                 mix(fxHash(i + vec3(0, 1, 1)), fxHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
float fxFbm(vec3 p) {
  return 0.55 * fxNoise(p) + 0.3 * fxNoise(p * 2.03 + 7.1) + 0.15 * fxNoise(p * 4.11 + 3.3);
}
`;

export function withFx<M extends THREE.Material>(material: M, fx: FxUniforms, key = 'fx'): M {
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    prev?.call(material, shader, renderer);
    Object.assign(shader.uniforms, fx);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vObjPos;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vObjPos = transformed;
        #ifdef USE_INSTANCING
          vObjPos = (instanceMatrix * vec4(transformed, 1.0)).xyz;
        #endif`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${NOISE}`)
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
        float fxEdge = 0.0;
        if (uDissolve > 0.0) {
          float fxN = fxFbm(vObjPos * uDissolveScale) * 0.8 + 0.2 * clamp(vObjPos.y / 20.0, 0.0, 1.0);
          float fxT = uDissolve * 1.12 - 0.06;
          if (fxN < fxT) discard;
          fxEdge = 1.0 - smoothstep(0.0, 0.028, fxN - fxT);
        }`,
      )
      .replace(
        '#include <opaque_fragment>',
        `{
          float fxF = pow(1.0 - clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0), uRimPow);
          outgoingLight += uRimColor * (uRimStrength * fxF);
          outgoingLight += uEdgeColor * (fxEdge * 2.2);
        }
        #include <opaque_fragment>`,
      );
  };
  const prevKey = material.customProgramCacheKey?.bind(material);
  material.customProgramCacheKey = () => (prevKey ? prevKey() : '') + key;
  return material;
}
