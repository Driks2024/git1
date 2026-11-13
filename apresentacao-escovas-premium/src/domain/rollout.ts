/** Premissas de implantação fornecidas no briefing. */
export const KITS_PER_MONTH = 5000;
export const ROLLOUT_MONTHS = 5;
export const KIT_PRICE_CENTS = 25800; // R$ 258,00 por kit, frete incluído conforme a proposta
export const EXPOSED_BRUSHES = 4;
export const BONUS_BRUSHES = 12;

export function brushesPerKit(): number {
  return EXPOSED_BRUSHES + BONUS_BRUSHES;
}

export function totalKits(perMonth = KITS_PER_MONTH, months = ROLLOUT_MONTHS): number {
  if (!Number.isInteger(perMonth) || perMonth < 0) throw new RangeError('kits por mês inválido');
  if (!Number.isInteger(months) || months < 0) throw new RangeError('meses inválido');
  return perMonth * months;
}

/** Distribuição acumulada por mês: [5.000, 10.000, 15.000, 20.000, 25.000]. */
export function cumulativeKits(perMonth = KITS_PER_MONTH, months = ROLLOUT_MONTHS): number[] {
  totalKits(perMonth, months);
  return Array.from({ length: months }, (_, i) => perMonth * (i + 1));
}

export function batchValueCents(kits: number, kitPriceCents = KIT_PRICE_CENTS): number {
  if (!Number.isFinite(kits) || kits < 0) throw new RangeError('quantidade inválida');
  return kits * kitPriceCents;
}

export function totalProjectedValueCents(): number {
  return batchValueCents(totalKits());
}

export function brushesInInitialKits(): number {
  return totalKits() * brushesPerKit();
}
