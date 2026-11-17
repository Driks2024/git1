/** Estágio da cena do produto a partir do progresso: 0 montagem, 1 capa, 2 cerdas. */
export const productStageOf = (p: number) => (p < 0.32 ? 0 : p < 0.56 ? 1 : 2);

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Quanto o kit está aberto (0 montado, 1 peças separadas) para um progresso 0–1. */
export const kitExplodeAt = (p: number) => smooth(0.22, 0.46, p) - smooth(0.74, 0.95, p);

/** Estágio da cena do kit: 0 montando, 1 peças separadas, 2 conjunto montado. */
export const kitStageOf = (p: number): 0 | 1 | 2 => (p < 0.17 ? 0 : kitExplodeAt(p) > 0.5 ? 1 : 2);
