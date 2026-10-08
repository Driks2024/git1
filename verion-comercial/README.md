# VERION Comercial · Simulador FG

Mod nativo do Claude Code (plugin `verion-comercial`) para simular bonificação e valor percebido em negociações de pontas diamantadas FG da KG SORENSEN e preparar um rascunho de WhatsApp com os números calculados.

Testado com **Claude Code 2.1.294** (requer 2.1.287 ou mais recente, por usar mods).

## Carregar em outra sessão

Na pasta onde está esta cópia (por exemplo, na raiz do repositório):

```bash
claude --plugin-dir ./verion-comercial
```

Confira em `/plugin`, na aba **Installed**, se `verion-comercial` aparece carregado.

## Abrir o painel

```
/kg
```

O painel “VERION Comercial · Simulador FG” abre com o foco do teclado:

- **Tab** e **Shift+Tab** navegam pelos campos e botões. **Enter** confirma.
- **1** escolhe “Simular bonificação” e **2** escolhe “Atingir valor percebido”, quando o foco não está num campo.
- **Esc** devolve o foco ao prompt.
- O resultado é recalculado a cada tecla, só com código local.
- O painel abre com valores de exemplo, identificados como tal. **Limpar (l)** apaga os campos e **Exemplo (e)** restaura o exemplo.

Se `/kg` já existir na sua instalação, o mod usa `/verion-kg` e avisa com uma notificação.

## Simular por comando (qualquer tela)

```
/kg simular --quantidade 350 --preco 10,88 --alvo 7,50
/kg simular --quantidade 440 --preco 10,88 --bonificacao 198 --alvo 7,50
/kg simular --quantidade 350 --preco 10.88 --alvo 7,50 --cliente "Dental Exemplo" --pagamento "28 dias" --validade "31/10" --frete CIF
/kg ajuda
```

- Sem `--bonificacao`, o comando calcula a menor bonificação inteira que atende o `--alvo`.
- Com `--bonificacao`, ele simula essa condição, e o `--alvo` passa a ser opcional.
- Preços aceitam `10,88`, `10.88` ou `R$ 10,88`.
- O comando usa o mesmo núcleo de cálculo do painel e atualiza a simulação que o painel mostra.

## Gerar o rascunho

- **No painel:** botão **Gerar mensagem comercial (g)**, e depois **Copiar rascunho (c)**.
- **Por comando:** `/kg mensagem`, que usa a simulação atual, seja a do painel ou a do último `/kg simular`.

Só essas duas ações chamam o Claude. Editar campos, abrir o painel e recalcular nunca chamam o modelo.

O Claude recebe um retrato com os valores já calculados e as condições que você preencheu. Depois da geração, o mod confere se o texto trouxe as quantidades e o valor do pedido exatos e avisa se faltar algum. Se a simulação mudar depois da geração, o rascunho é marcado como **desatualizado** até você gerar de novo. O envio ao cliente é feito por você, fora do mod.

## Desativar

- **Nesta sessão:** em `/plugin`, aba **Installed**, desligue `verion-comercial`.
- **Nas próximas sessões:** inicie o Claude Code sem `--plugin-dir ./verion-comercial`.
- **Para remover:** apague a pasta `verion-comercial`.

## Regras de cálculo

Q = quantidade comprada, B = bonificada, P = preço unitário (centavos), T = teto de valor percebido (centavos).

- Valor do pedido = Q × P
- Recebido = Q + B
- Valor percebido = (Q × P) ÷ (Q + B)
- Bonificação mínima = max(0, ceil((Q × P) ÷ T) − Q)
- Atende o teto quando Q × P ≤ (Q + B) × T, comparado em inteiros antes de qualquer arredondamento.

Os valores são guardados em centavos inteiros, e as divisões usam BigInt. O arredondamento acontece só na exibição: duas casas, mais o valor exato com 6 casas. Quando duas casas escondem que o valor está acima do teto (por exemplo, R$ 7,503448 aparece como R$ 7,50), o mod mostra a diferença e quantas unidades faltam.

Limites: até 1.000.000 unidades compradas ou bonificadas e até R$ 100.000,00 por unidade.

## Testes

```bash
claude plugin validate ./verion-comercial
cd verion-comercial && claude plugin test
```

## Limitações da primeira versão

- Escopo restrito ao simulador FG. A bonificação é no mesmo produto da compra.
- Não calcula margem, impostos, frete nem outros componentes. O resultado é uma simulação matemática, não uma aprovação de política comercial.
- Os dados da negociação ficam só na memória da sessão: somem ao fechar a sessão ou rodar `/clear`. Nada é salvo em disco.
- Os valores de exemplo são fictícios. Não são preços, estoques nem campanhas vigentes da KG.
- O painel aparece no terminal e no app desktop. Telas que não mostram painéis, como o app do Claude acompanhando uma sessão na nuvem, ou que não têm campos de texto, como VS Code e celular, devem usar `/kg simular` e `/kg mensagem`.
- O rascunho usa o modelo `sonnet` com as credenciais da sua sessão e precisa de revisão antes do envio.
