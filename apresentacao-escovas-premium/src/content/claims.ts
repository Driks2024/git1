import {
  COMMISSION_RATE_PERCENT,
  PURCHASE_COST_CENTS,
  REFERENCE_PRICE_CENTS,
  belowReferencePercent,
  commissionExactCents,
  markupPercent,
  marginOnSalePercent,
} from '../domain/economics';
import { formatBRL, formatInt, formatPercent } from '../domain/money';
import { reach } from '../domain/reach';
import {
  KIT_PRICE_CENTS,
  KITS_PER_MONTH,
  ROLLOUT_MONTHS,
  batchValueCents,
  totalKits,
  totalProjectedValueCents,
} from '../domain/rollout';

export type EvidenceStatus = 'fornecido' | 'calculado' | 'estimativa' | 'pendente-validacao';

export type Claim = {
  id: string;
  label: string;
  value?: number | string;
  unit?: string;
  status: EvidenceStatus;
  sourceAsset: string;
  sourceLocator?: string;
  note?: string;
  formula?: string;
};

const INFO = 'Proposta_Estrategica_de_Escovas_Premium.png';
const BRIEF = 'PROMPT_UNICO_CLAUDE_COWORK.md';
const PHOTOS = 'Fotos enviadas pelo cliente (expositor original e lata)';
const r = reach();

export const STATUS_LABEL: Record<EvidenceStatus, string> = {
  fornecido: 'Fornecido',
  calculado: 'Calculado',
  estimativa: 'Estimativa',
  'pendente-validacao': 'A validar',
};

export const claims: Claim[] = [
  { id: 'vidas', label: 'Vidas cobertas pela rede', value: '9.000.000', status: 'fornecido', sourceAsset: INFO, sourceLocator: 'Alcance e capilaridade', note: 'Base informada na proposta, não auditada.' },
  { id: 'dentistas', label: 'Dentistas credenciados', value: formatInt(r.dentists), status: 'fornecido', sourceAsset: INFO, sourceLocator: 'Alcance e capilaridade', note: 'Não equivale a 25.000 consultórios cadastrados.' },
  { id: 'secretarias', label: 'Secretárias atuantes', value: '50.000', status: 'fornecido', sourceAsset: INFO, sourceLocator: 'Alcance e capilaridade' },
  { id: 'cerdas', label: 'Cerdas por escova', value: '5.460', status: 'pendente-validacao', sourceAsset: BRIEF, note: 'Característica descrita no briefing; ficha técnica a confirmar.' },
  { id: 'tecnologia', label: 'Tecnologia alemã', status: 'pendente-validacao', sourceAsset: BRIEF, note: '“Tecnologia alemã” não equivale a “fabricado na Alemanha”.' },
  { id: 'kit-escovas', label: 'Escovas por kit', value: '16 (4 expostas + kit de 12 bonificadas)', status: 'fornecido', sourceAsset: INFO, sourceLocator: 'Estrutura do kit', note: 'Correção do cliente: o expositor vai com 4 escovas mais um kit de 12.' },
  { id: 'expositor', label: 'Expositor', value: 'Acrílico em L, painel inclinado com dois trilhos de presilhas', status: 'fornecido', sourceAsset: PHOTOS, sourceLocator: 'Fotos do expositor original', note: 'Escovas expostas no blister. Medidas e espessura a confirmar.' },
  { id: 'kit-valor', label: 'Valor por kit', value: formatBRL(KIT_PRICE_CENTS), status: 'fornecido', sourceAsset: INFO, sourceLocator: 'Estrutura do kit', note: 'Frete incluído conforme a proposta.' },
  { id: 'brinde', label: 'Brinde', value: 'Goiabada cascão em lata, de Minas Gerais', status: 'fornecido', sourceAsset: PHOTOS, sourceLocator: 'Foto da lata', note: 'Rótulo da foto: Zélia, Ponte Nova (MG). Quantidade por kit, peso e fornecedor a confirmar.' },
  { id: 'compra', label: 'Compra pelo dentista', value: formatBRL(PURCHASE_COST_CENTS), unit: 'por escova', status: 'fornecido', sourceAsset: INFO, sourceLocator: 'Modelo econômico' },
  { id: 'revenda', label: 'Faixa de revenda', value: 'R$ 17,80 a R$ 19,80', unit: 'por escova', status: 'fornecido', sourceAsset: INFO, sourceLocator: 'Modelo econômico' },
  { id: 'markup', label: 'Markup', value: `${formatPercent(markupPercent(1780, PURCHASE_COST_CENTS))} a ${formatPercent(markupPercent(1980, PURCHASE_COST_CENTS))}`, status: 'calculado', sourceAsset: BRIEF, formula: '(venda − compra) ÷ compra × 100' },
  { id: 'margem', label: 'Margem sobre a venda', value: `${formatPercent(marginOnSalePercent(1780, PURCHASE_COST_CENTS))} a ${formatPercent(marginOnSalePercent(1980, PURCHASE_COST_CENTS))}`, status: 'calculado', sourceAsset: BRIEF, formula: '(venda − compra) ÷ venda × 100', note: 'Antes de impostos, taxas e outras despesas. Não é lucro líquido.' },
  { id: 'comissao', label: 'Comissão indicada', value: `${COMMISSION_RATE_PERCENT}% sobre ${formatBRL(PURCHASE_COST_CENTS)} ≈ ${formatBRL(commissionExactCents(PURCHASE_COST_CENTS, COMMISSION_RATE_PERCENT))}`, status: 'pendente-validacao', sourceAsset: INFO, sourceLocator: 'Modelo econômico', note: 'Valor exato R$ 1,246. Regra de pagamento e incidência a confirmar.' },
  { id: 'referencia', label: 'Referência de preço', value: `${formatBRL(REFERENCE_PRICE_CENTS)} (Curaprox)`, status: 'fornecido', sourceAsset: INFO, sourceLocator: 'Modelo econômico', note: `Referência informada no briefing, sem pesquisa de preço atual. Revenda proposta fica ${formatPercent(belowReferencePercent(1980, REFERENCE_PRICE_CENTS))} a ${formatPercent(belowReferencePercent(1780, REFERENCE_PRICE_CENTS))} abaixo.` },
  { id: 'kits-mes', label: 'Kits por mês', value: formatInt(KITS_PER_MONTH), status: 'fornecido', sourceAsset: INFO, sourceLocator: 'Cronograma' },
  { id: 'meses', label: 'Duração da implantação', value: `${ROLLOUT_MONTHS} meses`, status: 'fornecido', sourceAsset: INFO, sourceLocator: 'Cronograma' },
  { id: 'kits-total', label: 'Meta projetada de distribuição', value: `${formatInt(totalKits())} kits`, status: 'calculado', sourceAsset: BRIEF, formula: '5.000 × 5' },
  { id: 'lote', label: 'Valor por lote mensal', value: formatBRL(batchValueCents(KITS_PER_MONTH)), status: 'calculado', sourceAsset: BRIEF, formula: '5.000 × R$ 258,00' },
  { id: 'valor-total', label: 'Valor total projetado', value: formatBRL(totalProjectedValueCents()), status: 'calculado', sourceAsset: BRIEF, formula: '25.000 × R$ 258,00', note: 'Não indica quem financia nem a forma de pagamento.' },
  { id: 'diretos', label: 'Contatos diretos potenciais/mês', value: formatInt(r.direct), status: 'estimativa', sourceAsset: INFO, formula: '25.000 dentistas × 10 pacientes' },
  { id: 'indiretos', label: 'Contatos indiretos potenciais/mês', value: formatInt(r.indirect), status: 'estimativa', sourceAsset: INFO, formula: '250.000 × 3 dependentes', note: 'Três dependentes por paciente é premissa do briefing.' },
  { id: 'exposicoes', label: 'Exposições potenciais/mês', value: formatInt(r.total), status: 'estimativa', sourceAsset: INFO, formula: '250.000 + 750.000', note: 'Rede integralmente ativada, sem deduplicação. Não são pessoas únicas medidas.' },
];
