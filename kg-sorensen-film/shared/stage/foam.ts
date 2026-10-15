import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { foamTextures, printTexture, type ImageSource } from '../bur/textures';

/**
 * Limpa Pontas KG: black open-cell foam block with the silver KG print,
 * as in the "Leve 2. Pague 1." campaign. Dimensions in mm (same units as the bur).
 */
export class FoamBlock {
  readonly group = new THREE.Group();
  readonly size = new THREE.Vector3(58, 25, 27);

  constructor(logo: ImageSource) {
    this.group.name = 'limpa-pontas';
    const { normal, map } = foamTextures();
    normal.repeat.set(2.4, 1.1);
    map.repeat.set(2.4, 1.1);
    const body = new THREE.Mesh(
      new RoundedBoxGeometry(this.size.x, this.size.y, this.size.z, 6, 2.6),
      new THREE.MeshStandardMaterial({
        color: 0x2a2a2c,
        map,
        roughness: 0.94,
        metalness: 0.0,
        normalMap: normal,
        normalScale: new THREE.Vector2(1.6, 1.6),
        envMapIntensity: 0.55,
      }),
    );
    this.group.add(body);
    const print = printTexture(logo);
    const pw = this.size.x * 0.78;
    const ph = (pw * 820) / 2048;
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(pw, ph),
      new THREE.MeshStandardMaterial({
        color: 0xd7d9dc,
        map: print,
        transparent: true,
        metalness: 0.85,
        roughness: 0.42,
        normalMap: normal,
        normalScale: new THREE.Vector2(0.5, 0.5),
        polygonOffset: true,
        polygonOffsetFactor: -2,
      }),
    );
    label.position.set(0, -0.6, this.size.z / 2 + 0.05);
    this.group.add(label);
    this.group.visible = false;
  }
}
