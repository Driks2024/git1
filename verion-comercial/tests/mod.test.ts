import { describe, expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'verion-comercial',
  component: 'Pane',
  requestId: 'verion-comercial',
  viewport: { columns: 120, rows: 50 },
  props: {
    title: 'VERION Comercial · Simulador FG',
    isFocused: true,
    bodyColumns: 100,
    placement: 'inline',
    scroll: { offset: 0, bodyRows: 40 },
    view: {},
  },
} as const

const USO = { input_tokens: 10, output_tokens: 60, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }
const RASCUNHO = 'Olá! Para 440 pontas FG a R$ 10,88, enviamos 199 bonificadas, total de 639 unidades. Pedido de R$ 4.787,20, cerca de R$ 7,49 por ponta.'

describe('comando /kg', () => {
  test('registra /kg na abertura da sessão', async ($, on) => {
    const registrados: string[] = []
    on('config.list', () => ({ value: [] }))
    on('command.list', () => ({ value: [] }))
    on('command.register', ($, e) => {
      registrados.push(e.name)
      return { value: undefined } as never
    })
    on('session.start', () => ({ cwd: '/work' }))
    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' } as never)
    expect(registrados).toEqual(['kg'])
  })

  test('usa /verion-kg e avisa quando /kg já existe', async ($, on) => {
    const registrados: string[] = []
    const toasts: string[] = []
    on('config.list', () => ({ value: [] }))
    on('command.list', () => ({ value: [{ name: 'kg', description: 'outro', source: 'user' }] }))
    on('command.register', ($, e) => {
      registrados.push(e.name)
      return { value: undefined } as never
    })
    on('ui.toast', ($, e) => {
      toasts.push(e.text)
      return { value: undefined } as never
    })
    on('session.start', () => ({ cwd: '/work' }))
    await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' } as never)
    expect(registrados).toEqual(['verion-kg'])
    expect(toasts.join(' ')).toContain('/verion-kg')
  })

  test('caso 1 por comando: 350 a R$ 10,88 com alvo R$ 7,50', async ($, on) => {
    let chamadas = 0
    on('model.complete', () => {
      chamadas++
      return { value: { isAnswered: true, text: 'x', usage: USO } }
    })
    const r = await $.command.run({ command: 'kg', args: 'simular --quantidade 350 --preco 10,88 --alvo 7,50' } as never)
    const t = r.text ?? ''
    expect(t).toContain('Simulação baseada nos dados informados')
    expect(t).toMatch(/Valor do pedido em produtos \.+ R\$ 3\.808,00/)
    expect(t).toMatch(/Quantidade bonificada \.+ 158 un\./)
    expect(t).toMatch(/Quantidade total recebida \.+ 508 un\./)
    expect(t).toContain('R$ 7,496063')
    expect(t).toMatch(/Teto exato de R\$ 7,50 \.+ atende/)
    expect(chamadas).toBe(0)
  })

  test('caso 2 por comando: 198 bonificadas mostram que não atende R$ 7,50', async ($, on) => {
    const r = await $.command.run({ command: 'kg', args: 'simular --quantidade 440 --preco 10.88 --bonificacao 198 --alvo 7,50' } as never)
    const t = r.text ?? ''
    expect(t).toContain('R$ 7,503448')
    expect(t).toContain('NÃO atende')
    expect(t).toContain('Com duas casas aparece R$ 7,50')
    expect(t).toMatch(/Bonificação mínima para o teto \.+ 199 un\./)
  })

  test('entradas inválidas por comando: erro claro, sem resultado', async ($, on) => {
    for (const args of [
      'simular --quantidade 0 --preco 10,88 --alvo 7,50',
      'simular --quantidade 350 --preco abc --alvo 7,50',
      'simular --quantidade 350 --preco 10,88 --alvo 0',
      'simular --quantidade 12,5 --preco 10,88 --alvo 7,50',
    ]) {
      const t = (await $.command.run({ command: 'kg', args } as never)).text ?? ''
      expect(t).toContain('Não foi possível simular')
      expect(t).not.toContain('Valor do pedido')
    }
  })

  test('/kg mensagem só então chama o Claude, com os números atuais', async ($, on) => {
    const prompts: string[] = []
    on('model.complete', ($, e) => {
      prompts.push(e.prompt)
      return { value: { isAnswered: true, text: RASCUNHO, usage: USO } }
    })
    await $.command.run({ command: 'kg', args: 'simular --quantidade 440 --preco 10,88 --alvo 7,50' } as never)
    expect(prompts.length).toBe(0)
    const r = await $.command.run({ command: 'kg', args: 'mensagem' } as never)
    expect(prompts.length).toBe(1)
    expect(prompts[0]).toContain('"quantidade_comprada": "440 unidades"')
    expect(prompts[0]).toContain('"quantidade_bonificada": "199 unidades"')
    expect(prompts[0]).toContain('"valor_do_pedido": "R$ 4.787,20"')
    expect(r.text).toContain(RASCUNHO)
  })
})

describe('painel', () => {
  test('editar campos recalcula sem chamar o modelo; gerar chama; editar depois marca desatualizado', async ($, on) => {
    const prompts: string[] = []
    on('model.complete', ($, e) => {
      prompts.push(e.prompt)
      return { value: { isAnswered: true, text: RASCUNHO, usage: USO } }
    })
    on('ui.toast', () => ({ value: undefined }))

    const ui = await $.ui.mount({ ...PANE, surface: 'terminal' as const, props: PANE.props as never })
    // Abre com o exemplo identificado e o caso 1 calculado
    expect(await ui.find({ type: 'Text', text: /Valores de exemplo/ })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: '158 un.' })).toBeDefined()

    // 6. edição de campos: novo resultado, nenhuma chamada ao modelo
    await ui.input({ key: 'quantidade', text: '440', kind: 'change' })
    expect(await ui.find({ type: 'Text', text: '199 un.' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /Valores de exemplo/ })).toBeUndefined()
    await ui.press({ key: 'modo-simular' })
    await ui.input({ key: 'bonificacao', text: '198', kind: 'change' })
    expect(await ui.find({ type: 'Text', text: 'NÃO atende' })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /R\$ 7,503448/ })).toBeDefined()
    await ui.input({ key: 'preco', text: 'dez', kind: 'change' })
    expect(await ui.find({ type: 'Text', text: /Valor inválido para o preço unitário/ })).toBeDefined()
    await ui.input({ key: 'preco', text: '10,88', kind: 'change' })
    await ui.input({ key: 'bonificacao', text: '199', kind: 'change' })
    expect(prompts.length).toBe(0)

    // 7. só o botão envia os números atuais ao Claude
    await ui.press({ key: 'gerar' })
    expect(prompts.length).toBe(1)
    expect(prompts[0]).toContain('"quantidade_bonificada": "199 unidades"')
    expect(prompts[0]).toContain('"quantidade_total_recebida": "639 unidades"')
    expect(await ui.find({ type: 'Text', text: RASCUNHO })).toBeDefined()
    expect(await ui.find({ type: 'Text', text: /desatualizado/ })).toBeUndefined()

    // 8. alterar depois da geração marca o rascunho como desatualizado
    await ui.input({ key: 'pagamento', text: '28 dias', kind: 'change' })
    expect(await ui.find({ type: 'Text', text: /Rascunho desatualizado/ })).toBeDefined()
    expect(prompts.length).toBe(1)

    // nova geração usa os dados atuais e limpa o aviso
    await ui.press({ key: 'gerar' })
    expect(prompts.length).toBe(2)
    expect(prompts[1]).toContain('"pagamento": "28 dias"')
    expect(await ui.find({ type: 'Text', text: /Rascunho desatualizado/ })).toBeUndefined()
    await ui.unmount()
  })

  test('campo inválido não chama o modelo ao gerar', async ($, on) => {
    let chamadas = 0
    const toasts: string[] = []
    on('model.complete', () => {
      chamadas++
      return { value: { isAnswered: true, text: 'x', usage: USO } }
    })
    on('ui.toast', ($, e) => {
      toasts.push(e.text)
      return { value: undefined }
    })
    const ui = await $.ui.mount({ ...PANE, surface: 'terminal' as const, props: PANE.props as never })
    await ui.input({ key: 'teto', text: '0', kind: 'change' })
    await ui.press({ key: 'gerar' })
    expect(chamadas).toBe(0)
    expect(toasts.join(' ')).toContain('Corrija')
    await ui.unmount()
  })

  test('desenha no desktop e, sem campos, na superfície móvel', async ($, on) => {
    for (const surface of ['desktop', 'mobile'] as const) {
      const ui = await $.ui.mount({ ...PANE, surface, props: PANE.props as never })
      expect(await ui.find({ type: 'Text', text: 'VERION Comercial · Simulador FG' })).toBeDefined()
      expect(await ui.find({ type: 'Text', text: '158 un.' })).toBeDefined()
      await ui.unmount()
    }
  })
})
