import * as THREE from 'three';
import { TitlePlane } from '../../../shared/stage/backdrop';
import type { FilmRenderer } from '../../../shared/stage/FilmRenderer';
import type { Vec3 } from '../../../shared/stage/state';

/**
 * Extra monumental titles living inside the 3D scene, on top of the rig's
 * single title plane (an extension kept inside video/ — the shared rig is not
 * modified). Each extra title may be rolled in screen space, which a 9:16
 * frame needs for vertical type running along the bur.
 */
export type ExtraTitle = {
  text: string;
  weight: number;
  tracking: number;
  opacity: number;
  reveal: number;
  pos: Vec3;
  height: number;
  /** screen-space roll in radians (π/2 = reads bottom → top) */
  roll: number;
};

export class TitleRig {
  private pool: TitlePlane[] = [];
  private cam = new THREE.PerspectiveCamera();
  private q = new THREE.Quaternion();
  private z = new THREE.Vector3(0, 0, 1);
  private film: FilmRenderer;
  private current: ExtraTitle[] = [];

  constructor(film: FilmRenderer) {
    this.film = film;
  }

  set(titles: ExtraTitle[]) {
    this.current = titles;
  }

  private plane(i: number) {
    while (this.pool.length <= i) {
      const t = new TitlePlane();
      t.mesh.visible = false;
      this.film.scene.add(t.mesh);
      this.film.post.dof.hide.push(t.mesh);
      this.pool.push(t);
    }
    return this.pool[i];
  }

  /**
   * Pose the extra titles for a state. The camera orientation is rebuilt from
   * the state itself (not read back from the renderer) so any frame can be
   * rendered in any order with the same result.
   */
  apply(state: { cam: Vec3; target: Vec3; roll: number }) {
    const c = this.cam;
    c.position.set(...state.cam);
    c.up.set(Math.sin(state.roll), Math.cos(state.roll), 0);
    c.lookAt(new THREE.Vector3(...state.target));
    const list = this.current;
    for (let i = 0; i < Math.max(list.length, this.pool.length); i++) {
      const t = list[i];
      if (!t) {
        if (this.pool[i]) this.pool[i].mesh.visible = false;
        continue;
      }
      const p = this.plane(i);
      p.mesh.visible = t.opacity > 0.001 && t.text.length > 0;
      if (!p.mesh.visible) continue;
      p.setText(t.text, { weight: t.weight, tracking: t.tracking });
      p.setHeight(t.height);
      p.mesh.position.set(...t.pos);
      this.q.setFromAxisAngle(this.z, t.roll);
      p.mesh.quaternion.copy(c.quaternion).multiply(this.q);
      p.uniforms.uOpacity.value = t.opacity;
      p.uniforms.uReveal.value = t.reveal;
      p.uniforms.uBlur.value = 0;
    }
  }
}
