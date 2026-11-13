import { describe, expect, it } from 'vitest';
import {
  belowReferencePercent,
  commissionExactCents,
  grossDifferenceCents,
  marginOnSalePercent,
  markupPercent,
  unitEconomics,
} from './economics';
import { formatBRL, formatInt, formatPercent } from './money';
import { reach } from './reach';
import {
  batchValueCents,
  brushesInInitialKits,
  brushesPerKit,
  cumulativeKits,
  totalKits,
  totalProjectedValueCents,
} from './rollout';

describe('economia unitária', () => {
  it('8,90 -> 17,80: diferença 8,90; markup 100%; margem 50%', () => {
    expect(grossDifferenceCents(1780, 890)).toBe(890);
    expect(markupPercent(1780, 890)).toBeCloseTo(100, 10);
    expect(marginOnSalePercent(1780, 890)).toBeCloseTo(50, 10);
  });

  it('8,90 -> 19,80: diferença 10,90; markup ~122,4719%; margem ~55,0505%', () => {
    expect(grossDifferenceCents(1980, 890)).toBe(1090);
    expect(markupPercent(1980, 890)).toBeCloseTo(122.4719, 4);
    expect(marginOnSalePercent(1980, 890)).toBeCloseTo(55.0505, 4);
  });

  it('8,90 × 14% = 1,246', () => {
    expect(commissionExactCents(890, 14)).toBeCloseTo(124.6, 10);
    expect(formatBRL(commissionExactCents(890, 14))).toBe('R$ 1,25');
  });

  it('referência de R$ 44,00: 55,0% a 59,5% abaixo', () => {
    expect(belowReferencePercent(1980, 4400)).toBeCloseTo(55.0, 6);
    expect(belowReferencePercent(1780, 4400)).toBeCloseTo(59.545, 3);
    expect(formatPercent(belowReferencePercent(1780, 4400))).toBe('59,5%');
  });

  it('formata markup e margem com uma casa', () => {
    const e = unitEconomics(1980);
    expect(formatPercent(e.markup)).toBe('122,5%');
    expect(formatPercent(e.margin)).toBe('55,1%');
    expect(formatBRL(e.grossCents)).toBe('R$ 10,90');
  });

  it('rejeita divisão por zero e entradas inválidas', () => {
    expect(() => markupPercent(1980, 0)).toThrow(RangeError);
    expect(() => marginOnSalePercent(0, 890)).toThrow(RangeError);
    expect(() => grossDifferenceCents(Number.NaN, 890)).toThrow(RangeError);
    expect(() => grossDifferenceCents(-1, 890)).toThrow(RangeError);
    expect(() => commissionExactCents(890, -5)).toThrow(RangeError);
    expect(() => belowReferencePercent(1980, 0)).toThrow(RangeError);
  });
});

describe('implantação', () => {
  it('5.000 × 5 = 25.000', () => {
    expect(totalKits()).toBe(25000);
    expect(cumulativeKits()).toEqual([5000, 10000, 15000, 20000, 25000]);
  });

  it('25.000 × 258 = 6.450.000', () => {
    expect(totalProjectedValueCents()).toBe(645_000_000);
    expect(formatBRL(totalProjectedValueCents())).toBe('R$ 6.450.000,00');
  });

  it('5.000 × R$ 258 = R$ 1.290.000 por lote mensal', () => {
    expect(batchValueCents(5000)).toBe(129_000_000);
  });

  it('4 + 12 = 16 e 400.000 escovas nos kits iniciais', () => {
    expect(brushesPerKit()).toBe(16);
    expect(brushesInInitialKits()).toBe(400_000);
  });

  it('rejeita entradas inválidas', () => {
    expect(() => totalKits(-1, 5)).toThrow(RangeError);
    expect(() => totalKits(5000, 2.5)).toThrow(RangeError);
  });
});

describe('alcance potencial', () => {
  it('25.000 × 10 = 250.000; × 3 = 750.000; soma = 1.000.000', () => {
    const r = reach();
    expect(r.direct).toBe(250_000);
    expect(r.indirect).toBe(750_000);
    expect(r.total).toBe(1_000_000);
    expect(formatInt(r.total)).toBe('1.000.000');
  });

  it('rejeita entradas inválidas', () => {
    expect(() => reach(-1)).toThrow(RangeError);
    expect(() => reach(25000, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});
