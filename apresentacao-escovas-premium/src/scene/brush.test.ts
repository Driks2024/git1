import { describe, expect, it } from 'vitest';
import { BRUSH, bristlePositions, tuftPositions } from './brushGeometry';

describe('cerdas instanciadas', () => {
  it('gera exatamente 5.460 posições, todas dentro da cabeça', () => {
    const pos = bristlePositions(5460);
    expect(pos.length).toBe(5460 * 2);
    for (let i = 0; i < 5460; i++) {
      const x = pos[i * 2]!;
      const y = pos[i * 2 + 1]!;
      expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
      expect(Math.abs(x)).toBeLessThanOrEqual(BRUSH.headHalfW);
      expect(Math.abs(y - BRUSH.headCenterY)).toBeLessThanOrEqual(BRUSH.headHalfL);
    }
  });

  it('é determinístico', () => {
    expect(bristlePositions(5460)).toEqual(bristlePositions(5460));
  });

  it('versão leve usa 40 tufos', () => {
    expect(tuftPositions()).toHaveLength(40);
  });
});
