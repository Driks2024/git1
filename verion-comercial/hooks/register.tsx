import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import {
  AVISO_SIMULACAO,
  avisoArredondamento,
  formatarCentavos,
  formatarInteiro,
  linhasResultado,
  simular,
} from './calc'
import type { Campo, Simulacao } from './calc'
import {
  FORM_EXEMPLO,
  FORM_VAZIO,
  SISTEMA,
  chaveSimulacao,
  conferirRascunho,
  lerComando,
  montarPrompt,
} from './draft'
import type { Form, Rascunho } from '../types'

const PANE = 'verion-comercial'
const TITULO = 'VERION Comercial · Simulador FG'
const MODELO = 'sonnet'

const RASCUNHO_VAZIO: Rascunho = { status: 'vazio', texto: '', chave: '', erro: '', avisos: [] }

const form = atom({ plugin: 'verion-comercial', key: 'form' } as const, FORM_EXEMPLO)
const rascunho = atom({ plugin: 'verion-comercial', key: 'rascunho' } as const, RASCUNHO_VAZIO)

// Nome do comando registrado nesta carga (/kg, ou /verion-kg se /kg estiver ocupado)
let comando = 'kg'
// Verde-lima ajustado ao tema quando conhecido; senão, a cor de sucesso do tema
let acento = 'success'

const acentoDoTema = (tema: unknown) => {
  const t = String(tema ?? '').toLowerCase()
  if (t.includes('light')) return '#4d7c0f'
  if (t.includes('dark')) return '#a3e635'

  return 'success'
}

// ---------------------------------------------------------------- ações

const editar = ($: EngineInterface, campo: keyof Form, valor: string) =>
  update($, form, f => ({ ...f, [campo]: valor, exemplo: false }))

const gerarRascunho = async ($: EngineInterface, sim: Simulacao): Promise<Rascunho> => {
  const chave = chaveSimulacao(sim)
  await update($, rascunho, (r): Rascunho => ({ ...r, status: 'gerando', chave, erro: '', avisos: [] }))
  let final: Rascunho
  try {
    const r = await $.model.complete({
      model: MODELO,
      system: SISTEMA,
      prompt: montarPrompt(sim),
      maxTokens: 700,
      timeoutMs: 90_000,
    })
    if (r.isAnswered && r.text.trim() !== '') {
      const texto = r.text.trim()
      final = { status: 'pronto', texto, chave, erro: '', avisos: conferirRascunho(texto, sim) }
    } else {
      const motivo = r.isAnswered ? 'o modelo respondeu vazio' : r.reason === 'aborted' ? 'tempo esgotado ou geração interrompida' : `falha na chamada (${r.reason})`
      final = { status: 'erro', texto: '', chave, erro: `Não foi possível gerar o rascunho: ${motivo}. Tente de novo.`, avisos: [] }
    }
  } catch (err) {
    final = { status: 'erro', texto: '', chave, erro: `Não foi possível gerar o rascunho: ${err instanceof Error ? err.message : String(err)}.`, avisos: [] }
  }
  await update($, rascunho, () => final)

  return final
}

// ---------------------------------------------------------------- texto do comando

const pontilhar = (rotulo: string, valor: string) => `${(rotulo + ' ').padEnd(32, '.')} ${valor}`

const textoSimulacao = (sim: Simulacao) => {
  const modo = sim.modo === 'simular' ? 'Simular bonificação' : 'Atingir valor percebido'
  const linhas = [
    `${TITULO} · ${modo}${sim.cliente ? ` · ${sim.cliente}` : ''}`,
    AVISO_SIMULACAO,
    '',
    ...linhasResultado(sim).map(l => pontilhar(l.rotulo, l.valor)),
  ]
  const aviso = avisoArredondamento(sim)
  if (aviso) linhas.push('', `Atenção: ${aviso}`)
  const c = sim.condicoes
  const condicoes = [c.pagamento && `pagamento ${c.pagamento}`, c.validade && `validade ${c.validade}`, c.frete && `frete ${c.frete}`].filter(Boolean)
  if (condicoes.length) linhas.push('', `Condições informadas: ${condicoes.join(' · ')}`)
  linhas.push('', `Para o rascunho de WhatsApp com estes números: /${comando} mensagem`)

  return linhas.join('\n')
}

const textoErros = (erros: Partial<Record<Campo, string>>) =>
  ['Não foi possível simular. Corrija:', ...Object.values(erros).map(e => `• ${e}`)].join('\n')

const ajuda = () =>
  [
    `${TITULO}`,
    `/${comando}                abre o painel`,
    `/${comando} simular --quantidade 350 --preco 10,88 --alvo 7,50`,
    '                       menor bonificação inteira para o valor percebido máximo',
    `/${comando} simular --quantidade 440 --preco 10,88 --bonificacao 198 [--alvo 7,50]`,
    '                       simula uma bonificação (o alvo é opcional)',
    '   opcionais: --cliente "Nome" --pagamento "28 dias" --validade "31/10" --frete "CIF"',
    `/${comando} mensagem       gera o rascunho de WhatsApp da simulação atual (usa o Claude)`,
    'Preços aceitam 10,88 ou 10.88. Os cálculos são locais; só "mensagem" chama o modelo.',
  ].join('\n')

const executar = async ($: EngineInterface, args: string) => {
  const pedido = lerComando(args)
  if (pedido.sub === 'ajuda') return { text: ajuda() }
  if (pedido.sub === 'erro') return { text: `${pedido.erro}\n\n${ajuda()}` }

  if (pedido.sub === 'simular') {
    const r = simular(pedido.form)
    if (!r.ok) return { text: textoErros(r.erros) }
    await update($, form, () => pedido.form)

    return { text: textoSimulacao(r.sim) }
  }

  if (pedido.sub === 'mensagem') {
    const atual = await read($, form)
    const r = simular(atual)
    if (!r.ok) return { text: textoErros(r.erros) }
    const final = await gerarRascunho($, r.sim)
    if (final.status !== 'pronto') return { text: final.erro }
    const exemplo = atual.exemplo ? '\n(Valores de exemplo: substitua pelos dados reais antes de usar.)' : ''
    const avisos = final.avisos.length ? `\n\nConfira: o rascunho não trouxe ${final.avisos.join(', ')}.` : ''

    return {
      text: `Rascunho de WhatsApp (revise antes de enviar):${exemplo}\n\n${final.texto}${avisos}\n\nBase: ${formatarInteiro(r.sim.quantidade)} + ${formatarInteiro(r.sim.bonificacao)} = ${formatarInteiro(r.sim.total)} un. · pedido ${formatarCentavos(r.sim.pedidoCentavos)}`,
    }
  }

  const aberto = await $.ui.open({ id: PANE, title: TITULO, focus: true })
  if (!aberto.isPlaced) {
    return { text: `O painel não pode ser exibido nesta tela (${aberto.reason}). Use a simulação por comando:\n\n${ajuda()}` }
  }

  return { text: `Painel ${TITULO} aberto. Se ele não aparecer na sua tela, use /${comando} simular --quantidade 350 --preco 10,88 --alvo 7,50.` }
}

// Um erro inesperado vira uma resposta legível em vez de derrubar o comando
const falha = () => ({ text: `VERION Comercial: erro inesperado ao executar o comando. Tente /${comando} ajuda.` })

// ---------------------------------------------------------------- registro

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    try {
      const tema = (await $.config.list()).find(row => row.key === 'theme')
      acento = acentoDoTema(tema?.value)
    } catch {
      acento = 'success'
    }

    const spec = (name: string) => ({
      name,
      description: `Abre o ${TITULO} (bonificação e valor percebido de pontas FG)`,
      argumentHint: '[simular --quantidade N --preco R$ --alvo R$ | mensagem | ajuda]',
      immediate: true as const,
    })
    comando = 'kg'
    try {
      const existentes = await $.command.list()
      if (existentes.some(c => c.name === 'kg' && c.plugin !== 'verion-comercial')) comando = 'verion-kg'
      await $.command.register(spec(comando))
    } catch {
      comando = 'verion-kg'
      try {
        await $.command.register(spec(comando))
      } catch {
        $.ui.toast('VERION Comercial: não foi possível registrar /kg nem /verion-kg.')
      }
    }
    if (comando === 'verion-kg') $.ui.toast('VERION Comercial: /kg já está em uso; use /verion-kg.')

    return next(e)
  })

  on('command.run', { command: 'kg' }, async ($, e) => executar($, e.args)).catch(falha)
  on('command.run', { command: 'verion-kg' }, async ($, e) => executar($, e.args)).catch(falha)

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const ui = $.ui.resolve(e)
    const f = await read($, form)
    const d = await read($, rascunho)
    const r = simular(f)
    const { Box, Text, Button } = ui

    // ---- resultado (mesmo núcleo do comando)
    const resultado = r.ok ? (
      <Box flexDirection="column">
        {linhasResultado(r.sim).map(l => (
          <Box flexDirection="row">
            <Text color="subtle" wrap="truncate">{(l.rotulo + ' ').padEnd(32, '.')} </Text>
            <Text bold color={l.destaque === 'alerta' ? 'error' : l.destaque === 'ok' ? acento : 'text'}>{l.valor}</Text>
          </Box>
        ))}
        {avisoArredondamento(r.sim) && <Text color="warning">{avisoArredondamento(r.sim)}</Text>}
      </Box>
    ) : (
      <Text color="subtle">Preencha os campos obrigatórios para ver o resultado.</Text>
    )

    // ---- rascunho
    const chaveAtual = r.ok ? chaveSimulacao(r.sim) : ''
    const desatualizado = d.status === 'pronto' && d.chave !== chaveAtual
    const blocoRascunho =
      d.status === 'gerando' ? (
        <Text color="subtle">Gerando o rascunho com o Claude…</Text>
      ) : d.status === 'erro' ? (
        <Text color="error">{d.erro}</Text>
      ) : d.status === 'pronto' ? (
        <Box flexDirection="column">
          {desatualizado && (
            <Text color="warning" bold>
              Rascunho desatualizado: a simulação mudou depois da geração. Gere de novo para usar os números atuais.
            </Text>
          )}
          <Box borderStyle="round" paddingX={1} flexDirection="column">
            <Text dimColor={desatualizado}>{d.texto}</Text>
          </Box>
          {d.avisos.length > 0 && <Text color="warning">Confira: o rascunho não trouxe {d.avisos.join(', ')}.</Text>}
        </Box>
      ) : (
        <Text color="subtle">Nenhum rascunho ainda. Só o botão “Gerar mensagem comercial” chama o Claude.</Text>
      )

    const acoes = (
      <Box flexDirection="row" columnGap={2} flexWrap="wrap">
        <Button
          key="gerar"
          variant="primary"
          hotkey="g"
          label="Gerar mensagem comercial (g)"
          onPress={async () => {
            const atual = simular(await read($, form))
            if (!atual.ok) {
              $.ui.toast('Corrija os campos destacados antes de gerar a mensagem.')

              return
            }
            await gerarRascunho($, atual.sim)
          }}
        />
        {d.status === 'pronto' && (
          <Button
            key="copiar"
            hotkey="c"
            label="Copiar rascunho (c)"
            onPress={async press => {
              const copiado = await $.ui.copy({ text: d.texto, surface: press.surface })
              $.ui.toast(copiado.isCopied ? 'Rascunho copiado.' : 'Não foi possível copiar aqui; selecione o texto do rascunho.')
            }}
          />
        )}
        <Button key="exemplo" hotkey="e" label="Exemplo (e)" onPress={() => update($, form, () => FORM_EXEMPLO)} />
        <Button key="limpar" hotkey="l" label="Limpar (l)" onPress={() => update($, form, f0 => ({ ...FORM_VAZIO, modo: f0.modo }))} />
      </Box>
    )

    const cabecalho = (
      <Box flexDirection="column">
        <Text bold color={acento}>{TITULO}</Text>
        <Text color="subtle">KG SORENSEN · pontas diamantadas FG · bonificação no mesmo produto</Text>
        {f.exemplo && <Text color="warning">Valores de exemplo para demonstração, não são preços nem campanhas vigentes. Substitua pelos dados da negociação.</Text>}
      </Box>
    )

    const secao = (titulo: string) => <Text bold>{titulo}</Text>

    // Superfícies sem campos de texto: resultado em leitura e o comando para editar
    if (!('Input' in ui)) {
      return (
        <Box flexDirection="column" rowGap={1}>
          {cabecalho}
          {secao('Resultado')}
          <Text color="subtle">{AVISO_SIMULACAO}</Text>
          {resultado}
          <Text color="subtle">Esta tela não tem campos editáveis. Use /{comando} simular --quantidade 350 --preco 10,88 --alvo 7,50.</Text>
          {acoes}
          {secao('Rascunho de WhatsApp')}
          {blocoRascunho}
        </Box>
      )
    }

    const { Input } = ui
    const erros = r.ok ? {} : r.erros
    const campo = (k: keyof Form & string, label: string, placeholder: string, erro?: string, autoFocus?: boolean) => (
      <Box flexDirection="column">
        {autoFocus ? (
          <Input key={k} label={label} placeholder={placeholder} submitLabel="ok" value={String(f[k])} autoFocus onInput={v => editar($, k, v)} onSubmit={v => editar($, k, v)} />
        ) : (
          <Input key={k} label={label} placeholder={placeholder} submitLabel="ok" value={String(f[k])} onInput={v => editar($, k, v)} onSubmit={v => editar($, k, v)} />
        )}
        {erro && <Text color="error">  ↳ {erro}</Text>}
      </Box>
    )
    const modoBotao = (modo: Form['modo'], label: string, hotkey: string) => (
      <Button
        key={`modo-${modo}`}
        plain
        hotkey={hotkey}
        label={f.modo === modo ? `● ${label}` : `○ ${label}`}
        dimColor={f.modo !== modo}
        onPress={() => update($, form, f0 => ({ ...f0, modo }))}
      />
    )

    return (
      <Box flexDirection="column" rowGap={1}>
        {cabecalho}
        <Box flexDirection="row" columnGap={3} flexWrap="wrap">
          {modoBotao('simular', 'Simular bonificação', '1')}
          {modoBotao('atingir', 'Atingir valor percebido', '2')}
        </Box>
        <Box flexDirection="column">
          {campo('cliente', 'Cliente (opcional)', 'ex.: Dental Exemplo', undefined, true)}
          {campo('quantidade', 'Quantidade comprada', 'ex.: 350', erros.quantidade)}
          {campo('preco', 'Preço unitário (R$)', 'ex.: 10,88', erros.preco)}
          {f.modo === 'simular'
            ? campo('bonificacao', 'Quantidade bonificada', 'ex.: 198', erros.bonificacao)
            : campo('teto', 'Valor percebido máximo (R$)', 'ex.: 7,50', erros.teto)}
          {f.modo === 'simular' && campo('teto', 'Teto de valor percebido (opcional, R$)', 'ex.: 7,50', erros.teto)}
          {campo('pagamento', 'Pagamento (opcional)', 'ex.: 28/56 dias')}
          {campo('validade', 'Validade (opcional)', 'ex.: até 31/10')}
          {campo('frete', 'Frete (opcional)', 'ex.: CIF')}
        </Box>
        <Box flexDirection="column">
          {secao('Resultado')}
          <Text color="subtle">{AVISO_SIMULACAO}</Text>
          {resultado}
        </Box>
        {acoes}
        <Box flexDirection="column">
          {secao('Rascunho de WhatsApp')}
          {blocoRascunho}
        </Box>
        <Text color="subtle">Tab navega · Enter confirma · 1/2 trocam o modo · Esc volta ao prompt</Text>
      </Box>
    )
  })
}
