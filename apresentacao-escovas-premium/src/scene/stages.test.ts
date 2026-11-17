import { describe, expect, it } from 'vitest';
import { kitExplodeAt, kitStageOf, productStageOf } from './stages';

describe('estágios das cenas', () => {
  it('kit: monta, abre e termina montado', () => {
    expect(kitExplodeAt(0)).toBe(0);
    expect(kitExplodeAt(0.6)).toBe(1);
    expect(kitExplodeAt(1)).toBe(0);
    expect(kitStageOf(0.05)).toBe(0);
    expect(kitStageOf(0.6)).toBe(1);
    expect(kitStageOf(0.99)).toBe(2);
  });
  it('produto: montagem, capa e cerdas', () => {
    expect(productStageOf(0.1)).toBe(0);
    expect(productStageOf(0.4)).toBe(1);
    expect(productStageOf(0.8)).toBe(2);
  });
});
