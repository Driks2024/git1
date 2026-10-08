// Núcleo de cálculo do Simulador FG: funções puras, sem $ e sem modelo.
// Todo valor monetário é inteiro em centavos; divisões usam BigInt e o
// arredondamento acontece só na formatação para exibição.

import type { Form, Modo } from '../types'

export type { Form, Modo } from '../types'

export const LIMITES = {
  quantidadeMax: 1_000_000,
  bonificacaoMax: 1_000_000,
  centavosMax: 10_000_000, // R$ 100.000,00 por unidade
} as const

export type Campo = 'quantidade' | 'preco' | 'bonificacao' | 'teto'
export type Erros = Partial<Record<Campo, string>>
type Lido<T> = { ok: true; value: T } | { ok: false; error: string }

const MILHAR = /^\d{1,3}(\.\d{3})+$/

// ---------------------------------------------------------------- entrada

export const lerQuantidade = (
  bruto: string,
  rotulo: string,
  opcoes: { permiteZero: boolean; max: number },
): Lido<number> => {
  const s = bruto.trim().replace(/\s+/g, '')
  if (s === '') return { ok: false, error: `Informe ${rotulo}.` }
  if (s.startsWith('-')) return { ok: false, error: `${cap(rotulo)} não pode ser negativa.` }
  let digitos = s
  if (/[.,]/.test(s)) {
    if (!MILHAR.test(s)) return { ok: false, error: `${cap(rotulo)} deve ser um número inteiro de unidades (sem frações).` }
    digitos = s.replace(/\./g, '')
  }
  if (!/^\d+$/.test(digitos)) return { ok: false, error: `${cap(rotulo)} deve conter apenas números, como 350.` }
  const n = Number(digitos)
  if (!opcoes.permiteZero && n === 0) return { ok: false, error: `${cap(rotulo)} deve ser maior que zero.` }
  if (n > opcoes.max) return { ok: false, error: `${cap(rotulo)} está acima do limite de ${formatarInteiro(opcoes.max)} unidades.` }

  return { ok: true, value: n }
}

// Aceita 10,88 · 10.88 · R$ 10,88 · 1.234,56 · 1,234.56. Devolve centavos.
export const lerDinheiro = (bruto: string, rotulo: string): Lido<number> => {
  const s = bruto.trim().replace(/^r\$\s*/i, '').replace(/\s+/g, '')
  if (s === '') return { ok: false, error: `Informe ${rotulo}.` }
  if (s.startsWith('-')) return { ok: false, error: `${cap(rotulo)} não pode ser negativo.` }
  if (!/^[\d.,]+$/.test(s)) return { ok: false, error: `Valor inválido para ${rotulo}: use números, como 10,88.` }

  const virgula = s.lastIndexOf(',')
  const ponto = s.lastIndexOf('.')
  let inteiro: string
  let decimais = ''
  if (virgula >= 0 && ponto >= 0) {
    const dec = Math.max(virgula, ponto)
    const sepMilhar = dec === virgula ? '.' : ','
    inteiro = s.slice(0, dec)
    decimais = s.slice(dec + 1)
    const grupos = new RegExp(`^\\d{1,3}(\\${sepMilhar}\\d{3})+$`)
    if (!grupos.test(inteiro) && !/^\d+$/.test(inteiro)) return { ok: false, error: `Valor inválido para ${rotulo}: confira os separadores, como 1.234,56.` }
    inteiro = inteiro.split(sepMilhar).join('')
  } else if (virgula >= 0) {
    if (s.indexOf(',') !== virgula) return { ok: false, error: `Valor inválido para ${rotulo}: use uma única vírgula decimal, como 10,88.` }
    inteiro = s.slice(0, virgula)
    decimais = s.slice(virgula + 1)
  } else if (ponto >= 0) {
    if (s.indexOf('.') !== ponto) {
      if (!MILHAR.test(s)) return { ok: false, error: `Valor inválido para ${rotulo}: confira os separadores, como 1.234,56.` }
      inteiro = s.replace(/\./g, '')
    } else {
      inteiro = s.slice(0, ponto)
      decimais = s.slice(ponto + 1)
    }
  } else {
    inteiro = s
  }

  if (inteiro === '') inteiro = '0'
  if (!/^\d+$/.test(inteiro) || !/^\d*$/.test(decimais)) return { ok: false, error: `Valor inválido para ${rotulo}: use números, como 10,88.` }
  if (decimais.length > 2) {
    return { ok: false, error: `${cap(rotulo)} tem mais de 2 casas decimais. Informe centavos, como 10,88 (para milhar, escreva 1.234,00).` }
  }
  if (inteiro.length > 9) return { ok: false, error: `${cap(rotulo)} está acima do limite de ${formatarCentavos(LIMITES.centavosMax)}.` }
  const centavos = Number(inteiro) * 100 + Number(decimais.padEnd(2, '0'))
  if (centavos === 0) return { ok: false, error: `${cap(rotulo)} deve ser maior que zero.` }
  if (centavos > LIMITES.centavosMax) return { ok: false, error: `${cap(rotulo)} está acima do limite de ${formatarCentavos(LIMITES.centavosMax)}.` }

  return { ok: true, value: centavos }
}

// ---------------------------------------------------------------- fórmulas

// Arredondamento meio-para-cima de num/den (inteiros não negativos).
const dividirArredondado = (num: bigint, den: bigint) => (2n * num + den) / (2n * den)

export const valorPedido = (q: number, p: number) => q * p

// Q × P <= (Q + B) × T, comparado em inteiros antes de qualquer arredondamento.
export const atendeTeto = (q: number, b: number, p: number, t: number) =>
  BigInt(q) * BigInt(p) <= (BigInt(q) + BigInt(b)) * BigInt(t)

// max(0, ceil((Q × P) ÷ T) − Q)
export const bonificacaoMinima = (q: number, p: number, t: number) => {
  const pedido = BigInt(q) * BigInt(p)
  const den = BigInt(t)
  const unidades = (pedido + den - 1n) / den
  const b = unidades - BigInt(q)

  return b > 0n ? Number(b) : 0
}

// Valor percebido por ponta em milionésimos de real (R$ 0,000001).
export const percebidoMicros = (q: number, b: number, p: number) =>
  dividirArredondado(BigInt(q) * BigInt(p) * 10_000n, BigInt(q + b))

// Valor percebido por ponta em centavos, arredondado para exibição.
export const percebidoCentavos = (q: number, b: number, p: number) =>
  Number(dividirArredondado(BigInt(q) * BigInt(p), BigInt(q + b)))

// ---------------------------------------------------------------- formatação

export const formatarInteiro = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

export const formatarCentavos = (c: number) =>
  `R$ ${formatarInteiro(Math.floor(c / 100))},${String(c % 100).padStart(2, '0')}`

export const formatarMicros = (m: bigint) => {
  const reais = m / 1_000_000n
  const resto = m % 1_000_000n

  return `R$ ${formatarInteiro(Number(reais))},${String(resto).padStart(6, '0')}`
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

// ---------------------------------------------------------------- simulação

export type Simulacao = {
  modo: Modo
  cliente: string
  quantidade: number
  precoCentavos: number
  bonificacao: number
  total: number
  pedidoCentavos: number
  percebidoCentavos: number
  percebidoMicros: bigint
  teto?: {
    centavos: number
    atende: boolean
    bonificacaoMinima: number
    // Duas casas mostram um valor <= teto, mas o exato está acima.
    escondidoNoArredondamento: boolean
  }
  condicoes: { pagamento?: string; validade?: string; frete?: string }
}

export type Resultado = { ok: true; sim: Simulacao } | { ok: false; erros: Erros }

export const simular = (form: Form): Resultado => {
  const erros: Erros = {}
  const q = lerQuantidade(form.quantidade, 'a quantidade comprada', { permiteZero: false, max: LIMITES.quantidadeMax })
  const p = lerDinheiro(form.preco, 'o preço unitário')
  if (!q.ok) erros.quantidade = q.error
  if (!p.ok) erros.preco = p.error

  let b: Lido<number> | undefined
  let t: Lido<number> | undefined
  if (form.modo === 'simular') {
    b = lerQuantidade(form.bonificacao, 'a quantidade bonificada', { permiteZero: true, max: LIMITES.bonificacaoMax })
    if (!b.ok) erros.bonificacao = b.error
    if (form.teto.trim() !== '') {
      t = lerDinheiro(form.teto, 'o teto de valor percebido')
      if (!t.ok) erros.teto = t.error
    }
  } else {
    t = lerDinheiro(form.teto, 'o valor percebido máximo')
    if (!t.ok) erros.teto = t.error
  }
  if (!q.ok || !p.ok || (b && !b.ok) || (t && !t.ok)) return { ok: false, erros }

  const quantidade = q.value
  const preco = p.value
  const tetoCentavos = t?.ok ? t.value : undefined
  let bonificacao: number
  if (form.modo === 'atingir') {
    bonificacao = bonificacaoMinima(quantidade, preco, tetoCentavos as number)
    if (bonificacao > LIMITES.bonificacaoMax) {
      return { ok: false, erros: { teto: `Esse teto exigiria ${formatarInteiro(bonificacao)} unidades bonificadas, acima do limite de ${formatarInteiro(LIMITES.bonificacaoMax)}.` } }
    }
  } else {
    bonificacao = (b as { ok: true; value: number }).value
  }

  const percebido2 = percebidoCentavos(quantidade, bonificacao, preco)
  const condicoes: Simulacao['condicoes'] = {}
  if (form.pagamento.trim()) condicoes.pagamento = form.pagamento.trim()
  if (form.validade.trim()) condicoes.validade = form.validade.trim()
  if (form.frete.trim()) condicoes.frete = form.frete.trim()

  const sim: Simulacao = {
    modo: form.modo,
    cliente: form.cliente.trim(),
    quantidade,
    precoCentavos: preco,
    bonificacao,
    total: quantidade + bonificacao,
    pedidoCentavos: valorPedido(quantidade, preco),
    percebidoCentavos: percebido2,
    percebidoMicros: percebidoMicros(quantidade, bonificacao, preco),
    condicoes,
  }
  if (tetoCentavos !== undefined) {
    const atende = atendeTeto(quantidade, bonificacao, preco, tetoCentavos)
    sim.teto = {
      centavos: tetoCentavos,
      atende,
      bonificacaoMinima: bonificacaoMinima(quantidade, preco, tetoCentavos),
      escondidoNoArredondamento: !atende && percebido2 <= tetoCentavos,
    }
  }

  return { ok: true, sim }
}

// Linhas de resultado prontas para exibir, compartilhadas por painel e comando.
export type Linha = { rotulo: string; valor: string; destaque?: 'ok' | 'alerta' }

export const linhasResultado = (s: Simulacao): Linha[] => {
  const linhas: Linha[] = [
    { rotulo: 'Valor do pedido em produtos', valor: formatarCentavos(s.pedidoCentavos) },
    { rotulo: 'Quantidade comprada', valor: `${formatarInteiro(s.quantidade)} un.` },
    { rotulo: 'Quantidade bonificada', valor: `${formatarInteiro(s.bonificacao)} un.` },
    { rotulo: 'Quantidade total recebida', valor: `${formatarInteiro(s.total)} un.` },
    { rotulo: 'Valor percebido por ponta', valor: `≈ ${formatarCentavos(s.percebidoCentavos)}` },
    { rotulo: 'Valor percebido exato', valor: `≈ ${formatarMicros(s.percebidoMicros)}` },
  ]
  if (s.teto) {
    linhas.push({ rotulo: 'Bonificação mínima para o teto', valor: `${formatarInteiro(s.teto.bonificacaoMinima)} un.` })
    linhas.push({
      rotulo: `Teto exato de ${formatarCentavos(s.teto.centavos)}`,
      valor: s.teto.atende ? 'atende' : 'NÃO atende',
      destaque: s.teto.atende ? 'ok' : 'alerta',
    })
  }

  return linhas
}

// Explicação quando o arredondamento em duas casas esconde que está acima do teto.
export const avisoArredondamento = (s: Simulacao): string | undefined => {
  if (!s.teto || s.teto.atende) return undefined
  const exatoMicros = s.percebidoMicros
  const tetoMicros = BigInt(s.teto.centavos) * 10_000n
  const falta = s.teto.bonificacaoMinima - s.bonificacao
  const diferenca = exatoMicros > tetoMicros
    ? `${formatarMicros(exatoMicros - tetoMicros)} acima do teto`
    : 'acima do teto por menos de R$ 0,000001'
  const comeco = s.teto.escondidoNoArredondamento
    ? `Com duas casas aparece ${formatarCentavos(s.percebidoCentavos)}, mas o valor exato é ${formatarMicros(exatoMicros)}, ${diferenca}.`
    : `O valor exato é ${formatarMicros(exatoMicros)}, ${diferenca}.`

  return `${comeco} Para atender, são necessárias ${formatarInteiro(s.teto.bonificacaoMinima)} unidades bonificadas (${formatarInteiro(falta)} a mais).`
}

export const AVISO_SIMULACAO = 'Simulação baseada nos dados informados. Não representa aprovação de política comercial.'
