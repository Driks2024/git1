/** Estágio da cena do produto a partir do progresso: 0 montagem, 1 capa, 2 cerdas. */
export const productStageOf = (p: number) => (p < 0.32 ? 0 : p < 0.56 ? 1 : 2);

/** Kit aberto (componentes separados) entre estes limites de progresso. */
export const kitOpenAt = (p: number) => p > 0.2 && p < 0.8;
