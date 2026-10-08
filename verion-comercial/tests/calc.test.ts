import { describe, expect, test } from 'claude-code/testing'

import {
  atendeTeto,
  avisoArredondamento,
  bonificacaoMinima,
  formatarCentavos,
  formatarMicros,
  lerDinheiro,
  lerQuantidade,
  percebidoMicros,
  simular,
} from '../hooks/calc'
import { FORM_VAZIO, lerComando } from '../hooks/draft'
import type { Form } from '../types'

const form = (f: Partial<Form>): Form => ({ ...FORM_VAZIO, ...f })

describe('casos obrigatórios', () => {
  test('1. 350 un. a R$ 10,88 com teto R$ 7,50: bonificação mínima 158', async () => {
    const r = simular(form({ modo: 'atingir', quantidade: '350', preco: '10,88', teto: '7,50' }))
    if (!r.ok) throw new Error('deveria calcular')
    expect(r.sim.bonificacao).toBe(158)
    expect(r.sim.total).toBe(508)
    expect(formatarCentavos(r.sim.pedidoCentavos)).toBe('R$ 3.808,00')
    expect(formatarMicros(r.sim.percebidoMicros)).toBe('R$ 7,496063')
    expect(r.sim.teto?.atende).toBe(true)
    // 157 não basta: a mínima é exatamente 158
    expect(atendeTeto(350, 157, 1088, 750)).toBe(false)
  })

  test('2. 440 + 198 a R$ 10,88: ≈ R$ 7,503448, não atende o teto de R$ 7,50', async () => {
    const r = simular(form({ modo: 'simular', quantidade: '440', preco: '10,88', bonificacao: '198', teto: '7,50' }))
    if (!r.ok) throw new Error('deveria calcular')
    expect(formatarMicros(r.sim.percebidoMicros)).toBe('R$ 7,503448')
    expect(formatarCentavos(r.sim.percebidoCentavos)).toBe('R$ 7,50')
    expect(r.sim.teto?.atende).toBe(false)
    expect(r.sim.teto?.escondidoNoArredondamento).toBe(true)
    expect(avisoArredondamento(r.sim)).toContain('Com duas casas aparece R$ 7,50, mas o valor exato é R$ 7,503448')
    expect(avisoArredondamento(r.sim)).toContain('199 unidades bonificadas (1 a mais)')
  })

  test('3. 440 un. a R$ 10,88 com teto R$ 7,50: bonificação mínima 199', async () => {
    expect(bonificacaoMinima(440, 1088, 750)).toBe(199)
    expect(atendeTeto(440, 199, 1088, 750)).toBe(true)
    expect(atendeTeto(440, 198, 1088, 750)).toBe(false)
  })

  test('4. teto igual ou acima do preço: bonificação mínima zero', async () => {
    expect(bonificacaoMinima(350, 1088, 1088)).toBe(0)
    expect(bonificacaoMinima(350, 1088, 2000)).toBe(0)
    const r = simular(form({ modo: 'atingir', quantidade: '350', preco: '10,88', teto: '10,88' }))
    if (!r.ok) throw new Error('deveria calcular')
    expect(r.sim.bonificacao).toBe(0)
    expect(r.sim.teto?.atende).toBe(true)
  })

  test('5. entradas inválidas: mensagem clara e nenhum cálculo', async () => {
    const casos: [Partial<Form>, string, RegExp][] = [
      [{ quantidade: '0' }, 'quantidade', /maior que zero/],
      [{ quantidade: '-5' }, 'quantidade', /negativa/],
      [{ quantidade: '10,5' }, 'quantidade', /inteiro/],
      [{ quantidade: '3.5' }, 'quantidade', /inteiro/],
      [{ preco: 'abc' }, 'preco', /inválido/],
      [{ preco: '-10,88' }, 'preco', /negativo/],
      [{ preco: '0,00' }, 'preco', /maior que zero/],
      [{ preco: '10,888' }, 'preco', /2 casas/],
      [{ teto: '0' }, 'teto', /maior que zero/],
      [{ teto: '' }, 'teto', /Informe/],
    ]
    for (const [mudanca, campo, msg] of casos) {
      const r = simular(form({ modo: 'atingir', quantidade: '350', preco: '10,88', teto: '7,50', ...mudanca }))
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.erros[campo as 'quantidade']).toMatch(msg)
    }
    const b = simular(form({ modo: 'simular', quantidade: '350', preco: '10,88', bonificacao: '2,5' }))
    expect(b.ok).toBe(false)
  })
})

describe('entrada e limites', () => {
  test('aceita 10,88, 10.88, R$ 10,88 e milhar', async () => {
    for (const s of ['10,88', '10.88', 'R$ 10,88', 'r$10,88', ' 10,88 ']) expect(lerDinheiro(s, 'o preço')).toEqual({ ok: true, value: 1088 })
    expect(lerDinheiro('1.234,56', 'o preço')).toEqual({ ok: true, value: 123456 })
    expect(lerDinheiro('1,234.56', 'o preço')).toEqual({ ok: true, value: 123456 })
    expect(lerDinheiro('7,5', 'o teto')).toEqual({ ok: true, value: 750 })
    expect(lerDinheiro('7', 'o teto')).toEqual({ ok: true, value: 700 })
    expect(lerQuantidade('1.000', 'a quantidade', { permiteZero: false, max: 1_000_000 })).toEqual({ ok: true, value: 1000 })
  })

  test('rejeita valores acima dos limites', async () => {
    expect(lerQuantidade('2000000', 'a quantidade', { permiteZero: false, max: 1_000_000 }).ok).toBe(false)
    expect(lerDinheiro('100000,01', 'o preço').ok).toBe(false)
  })

  test('no limite, a comparação inteira continua exata', async () => {
    const q = 1_000_000
    const p = 10_000_000
    const t = 9_999_999
    const b = bonificacaoMinima(q, p, t)
    expect(atendeTeto(q, b, p, t)).toBe(true)
    expect(atendeTeto(q, b - 1, p, t)).toBe(false)
    expect(percebidoMicros(q, 0, p)).toBe(100_000_000_000n)
  })

  test('comando textual lê opções com vírgula, aspas e alias', async () => {
    const p = lerComando('simular --quantidade 350 --preco 10,88 --alvo 7,50 --cliente "Dental Sul" --frete CIF')
    if (p.sub !== 'simular') throw new Error('deveria ser simular')
    expect(p.form).toMatchObject({ modo: 'atingir', quantidade: '350', preco: '10,88', teto: '7,50', cliente: 'Dental Sul', frete: 'CIF' })
    const s = lerComando('simular --qtd=440 --preco 10.88 --bonificacao 198')
    if (s.sub !== 'simular') throw new Error('deveria ser simular')
    expect(s.form.modo).toBe('simular')
    expect(lerComando('simular --desconto 5').sub).toBe('erro')
  })
})
