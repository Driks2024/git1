// Dinheiro sempre em centavos inteiros. Valores fracionários de centavo
// (como a comissão exata de R$ 1,246) ficam em número decimal de centavos
// e só são arredondados na formatação.

const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function assertCents(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} precisa ser um valor finito e não negativo (recebido: ${value}).`);
  }
}

/** Formata centavos como "R$ 19,80". */
export function formatBRL(cents: number, fractionDigits = 2): string {
  assertCents(cents, 'valor');
  if (fractionDigits === 2) return brl.format(cents / 100).replace(/\u00a0/g, ' ');
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
    .format(cents / 100)
    .replace(/\u00a0/g, ' ');
}

/** Formata percentual com vírgula decimal: 122.47 -> "122,5%". */
export function formatPercent(value: number, fractionDigits = 1): string {
  if (!Number.isFinite(value)) throw new RangeError('percentual inválido');
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}%`;
}

/** Formata inteiros com ponto de milhar: 1000000 -> "1.000.000". */
export function formatInt(value: number): string {
  if (!Number.isFinite(value)) throw new RangeError('número inválido');
  return Math.round(value).toLocaleString('pt-BR');
}
