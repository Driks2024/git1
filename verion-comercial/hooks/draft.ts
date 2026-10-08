// Rascunho comercial e comando textual: funções puras sobre a simulação.

import { formatarCentavos, formatarInteiro, formatarMicros } from './calc'
import type { Simulacao } from './calc'
import type { Form } from '../types'

// ---------------------------------------------------------------- retrato

export type Retrato = {
  cliente: string | null
  produto: string
  modo: 'Simular bonificação' | 'Atingir valor percebido'
  quantidade_comprada: string
  preco_unitario: string
  quantidade_bonificada: string
  quantidade_total_recebida: string
  valor_do_pedido: string
  valor_percebido_por_ponta_aproximado: string
  valor_percebido_por_ponta_exato: string
  teto_de_valor_percebido: string | null
  atende_teto: boolean | null
  bonificacao_minima_para_o_teto: string | null
  condicoes_comerciais: { pagamento?: string; validade?: string; frete?: string }
}

export const retrato = (s: Simulacao): Retrato => ({
  cliente: s.cliente || null,
  produto: 'Pontas diamantadas FG (bonificação no mesmo produto)',
  modo: s.modo === 'simular' ? 'Simular bonificação' : 'Atingir valor percebido',
  quantidade_comprada: `${formatarInteiro(s.quantidade)} unidades`,
  preco_unitario: formatarCentavos(s.precoCentavos),
  quantidade_bonificada: `${formatarInteiro(s.bonificacao)} unidades`,
  quantidade_total_recebida: `${formatarInteiro(s.total)} unidades`,
  valor_do_pedido: formatarCentavos(s.pedidoCentavos),
  valor_percebido_por_ponta_aproximado: `aprox. ${formatarCentavos(s.percebidoCentavos)}`,
  valor_percebido_por_ponta_exato: formatarMicros(s.percebidoMicros),
  teto_de_valor_percebido: s.teto ? formatarCentavos(s.teto.centavos) : null,
  atende_teto: s.teto ? s.teto.atende : null,
  bonificacao_minima_para_o_teto: s.teto ? `${formatarInteiro(s.teto.bonificacaoMinima)} unidades` : null,
  condicoes_comerciais: { ...s.condicoes },
})

// Identifica a simulação: muda sempre que um número ou condição muda.
export const chaveSimulacao = (s: Simulacao) => JSON.stringify(retrato(s))

// ---------------------------------------------------------------- prompt

export const SISTEMA = [
  'Você redige rascunhos de mensagens comerciais de WhatsApp em português do Brasil para Adriano (Driks),',
  'gerente comercial e de marketing da KG SORENSEN, indústria de produtos odontológicos, que negocia com distribuidores e dentais.',
  'Regras obrigatórias:',
  '- Linguagem profissional, direta e natural; de 80 a 120 palavras, ou menos se bastar.',
  '- Reproduza exatamente, sem recalcular nem arredondar: quantidade comprada, quantidade bonificada, quantidade total recebida e valor do pedido.',
  '- Apresente o valor percebido por ponta como aproximado, usando o valor "aproximado" do retrato (ex.: "cerca de R$ 7,50 por ponta").',
  '- Use somente as condições comerciais presentes no retrato. Se uma condição não estiver lá, não mencione nem invente (pagamento, validade, frete, prazos, descontos, estoque, campanhas).',
  '- Não invente preços, margens, impostos ou outros números. Não diga que a condição está aprovada.',
  '- Se houver cliente, cumprimente pelo nome; senão, use uma saudação neutra.',
  '- Responda apenas com o texto da mensagem, sem título, aspas ou comentários.',
].join('\n')

export const montarPrompt = (s: Simulacao) =>
  `Retrato da simulação atual (valores já calculados pelo simulador; não recalcule):\n${JSON.stringify(retrato(s), null, 2)}\n\nEscreva o rascunho da mensagem de WhatsApp.`

// Confere se o rascunho trouxe os números exatos; devolve avisos para revisão.
export const conferirRascunho = (texto: string, s: Simulacao): string[] => {
  const avisos: string[] = []
  const contem = (n: number) => texto.includes(formatarInteiro(n)) || texto.includes(String(n))
  if (!contem(s.quantidade)) avisos.push(`a quantidade comprada (${formatarInteiro(s.quantidade)})`)
  if (!contem(s.bonificacao)) avisos.push(`a quantidade bonificada (${formatarInteiro(s.bonificacao)})`)
  if (!contem(s.total)) avisos.push(`o total recebido (${formatarInteiro(s.total)})`)
  const pedido = formatarCentavos(s.pedidoCentavos)
  if (!texto.includes(pedido.slice(3))) avisos.push(`o valor do pedido (${pedido})`)

  return avisos
}

// ---------------------------------------------------------------- comando

export const FORM_VAZIO: Form = {
  modo: 'atingir',
  cliente: '',
  quantidade: '',
  preco: '',
  bonificacao: '',
  teto: '',
  pagamento: '',
  validade: '',
  frete: '',
  exemplo: false,
}

// Valores de demonstração; não são preços nem campanhas vigentes da KG.
export const FORM_EXEMPLO: Form = {
  ...FORM_VAZIO,
  quantidade: '350',
  preco: '10,88',
  teto: '7,50',
  exemplo: true,
}

// Divide os argumentos respeitando aspas: --cliente "Dental Sul".
export const dividirArgumentos = (args: string): string[] => {
  const partes: string[] = []
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(args)) !== null) partes.push(m[1] ?? m[2] ?? m[3] ?? '')

  return partes
}

const OPCOES: Record<string, keyof Form> = {
  quantidade: 'quantidade', qtd: 'quantidade', q: 'quantidade',
  preco: 'preco', 'preço': 'preco', p: 'preco',
  alvo: 'teto', teto: 'teto', t: 'teto',
  bonificacao: 'bonificacao', 'bonificação': 'bonificacao', bonus: 'bonificacao', b: 'bonificacao',
  cliente: 'cliente', pagamento: 'pagamento', validade: 'validade', frete: 'frete',
}

export type Pedido =
  | { sub: 'painel' | 'mensagem' | 'ajuda' }
  | { sub: 'simular'; form: Form }
  | { sub: 'erro'; erro: string }

export const lerComando = (args: string): Pedido => {
  const partes = dividirArgumentos(args.trim())
  const sub = (partes[0] ?? '').toLowerCase()
  if (sub === '') return { sub: 'painel' }
  if (sub === 'ajuda' || sub === 'help' || sub === '--help') return { sub: 'ajuda' }
  if (sub === 'mensagem' || sub === 'rascunho') return { sub: 'mensagem' }
  if (sub !== 'simular') return { sub: 'erro', erro: `Subcomando "${partes[0]}" não reconhecido.` }

  const form: Form = { ...FORM_VAZIO }
  for (let i = 1; i < partes.length; i++) {
    const parte = partes[i] ?? ''
    const m = /^--?([^=]+)(?:=(.*))?$/.exec(parte)
    if (!m) return { sub: 'erro', erro: `Valor "${parte}" sem opção. Use, por exemplo, --quantidade 350.` }
    const nome = (m[1] ?? '').toLowerCase()
    const campo = OPCOES[nome]
    if (!campo) return { sub: 'erro', erro: `Opção --${nome} não reconhecida.` }
    let valor = m[2]
    if (valor === undefined) {
      valor = partes[i + 1]
      i++
    }
    if (valor === undefined) return { sub: 'erro', erro: `Falta o valor de --${nome}.` }
    if (campo !== 'modo' && campo !== 'exemplo') form[campo] = valor
  }
  // Com bonificação informada, simula; sem ela, calcula a mínima para o alvo.
  form.modo = form.bonificacao.trim() !== '' ? 'simular' : 'atingir'

  return { sub: 'simular', form }
}
