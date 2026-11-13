import { assertCents } from './money';

/** Premissas fornecidas no briefing (centavos). */
export const PURCHASE_COST_CENTS = 890; // R$ 8,90 pago pelo dentista por escova
export const RESALE_OPTIONS_CENTS = [1780, 1980] as const; // faixa de revenda R$ 17,80 a R$ 19,80
export const REFERENCE_PRICE_CENTS = 4400; // R$ 44,00 atribuído à Curaprox no briefing, sem pesquisa atual
export const COMMISSION_RATE_PERCENT = 14; // 14% sobre R$ 8,90

export type ResaleCents = (typeof RESALE_OPTIONS_CENTS)[number];

/** diferença bruta unitária = preço de venda - custo de compra */
export function grossDifferenceCents(saleCents: number, costCents: number): number {
  assertCents(saleCents, 'preço de venda');
  assertCents(costCents, 'custo de compra');
  return saleCents - costCents;
}

/** markup percentual = (venda - compra) / compra × 100 */
export function markupPercent(saleCents: number, costCents: number): number {
  assertCents(saleCents, 'preço de venda');
  assertCents(costCents, 'custo de compra');
  if (costCents === 0) throw new RangeError('custo de compra não pode ser zero para calcular markup');
  return ((saleCents - costCents) / costCents) * 100;
}

/** margem sobre venda = (venda - compra) / venda × 100 */
export function marginOnSalePercent(saleCents: number, costCents: number): number {
  assertCents(saleCents, 'preço de venda');
  assertCents(costCents, 'custo de compra');
  if (saleCents === 0) throw new RangeError('preço de venda não pode ser zero para calcular margem');
  return ((saleCents - costCents) / saleCents) * 100;
}

/** Comissão exata, em centavos fracionários (890 × 14% = 124,6 centavos = R$ 1,246). */
export function commissionExactCents(baseCents: number, ratePercent: number): number {
  assertCents(baseCents, 'base da comissão');
  if (!Number.isFinite(ratePercent) || ratePercent < 0) throw new RangeError('taxa inválida');
  return (baseCents * ratePercent) / 100;
}

/** Quanto o preço fica abaixo da referência, em %. */
export function belowReferencePercent(saleCents: number, referenceCents: number): number {
  assertCents(saleCents, 'preço de venda');
  assertCents(referenceCents, 'preço de referência');
  if (referenceCents === 0) throw new RangeError('referência não pode ser zero');
  return ((referenceCents - saleCents) / referenceCents) * 100;
}

export type UnitEconomics = {
  saleCents: number;
  costCents: number;
  grossCents: number;
  markup: number;
  margin: number;
  belowReference: number;
};

export function unitEconomics(saleCents: number, costCents = PURCHASE_COST_CENTS): UnitEconomics {
  return {
    saleCents,
    costCents,
    grossCents: grossDifferenceCents(saleCents, costCents),
    markup: markupPercent(saleCents, costCents),
    margin: marginOnSalePercent(saleCents, costCents),
    belowReference: belowReferencePercent(saleCents, REFERENCE_PRICE_CENTS),
  };
}
