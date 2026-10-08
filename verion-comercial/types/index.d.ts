export type Modo = 'simular' | 'atingir'

// Os campos como digitados; o cálculo lê e valida a cada desenho.
export type Form = {
  modo: Modo
  cliente: string
  quantidade: string
  preco: string
  bonificacao: string
  teto: string
  pagamento: string
  validade: string
  frete: string
  // true enquanto o formulário mostra os valores de demonstração
  exemplo: boolean
}

export type Rascunho = {
  status: 'vazio' | 'gerando' | 'pronto' | 'erro'
  texto: string
  // Chave da simulação usada na geração; difere da atual => desatualizado
  chave: string
  erro: string
  avisos: string[]
}

declare module 'claude-code' {
  interface PluginState {
    'verion-comercial': {
      form: Form
      rascunho: Rascunho
    }
  }
}
