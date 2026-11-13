# Design

## Visual theme

Cinematográfico escuro (fundo preto-azulado igual ao das ilustrações fornecidas), alternado com painéis de cor chapada das marcas e uma seção clara de estúdio. Estrutura e efeitos seguem o padrão de designbybrandin.com; o laranja da referência foi substituído pelo azul Odontoprev e pelo roxo Dental Partner.

## Color

| Token | Valor | Uso |
|---|---|---|
| `--ink-950` | `#07090F` | Fundo base, igual ao fundo das imagens conceituais |
| `--odp` / `--odp-bright` | `#003CAA` / `#0366FF` | Painéis de cor (kit, ativação, alcance), faixas pontilhadas, rodapé |
| `--dp-deep` / `--dp` | `#4F0782` / `#720AB7` | Painel do produto, destaques Dental Partner |
| `--mint` | `#8EFAF0` | Brilho de destaque: valores-chave, foco, hotspots |
| `--surface-financial` | `#101B2B` | Capítulo de economia |
| `--surface-muted` | `#F4F7FB` | Seção clara de composição do kit |
| `--goiaba` | `#B0233A` | Pontilhado da seção do brinde (direção de arte pontual) |

Valores das marcas extraídos dos arquivos fornecidos; não são cores oficiais declaradas. Azul e roxo nunca são misturados em degradê.

## Typography

- Pilha: `SF Pro Display/Text` (sistema Apple) → `Zalando Sans` autohospedada (mesma família usada na referência) → sans-serif.
- Títulos de capítulo: caixa alta, peso 700, entrelinha 0,86, espaçamento −0,035em.
- Números gigantes: contorno de 1,5px (sem preenchimento) ou peso 500–600 com algarismos tabulares.
- Texto: 17–19px, entrelinha 1,6, máximo 62 caracteres por linha.

## Components

- **DrenchPanel:** painel fixo com palavra gigante e imagem em camadas opostas, com inércia de rolagem e de mouse.
- **DetailBlock:** número-chave gigante fixo à esquerda e lista de linhas que se desenham.
- **HoverList:** linhas que se preenchem de azul e imagem que segue o cursor.
- **DitherCanvas:** pontilhado Bayer 8×8 em WebGL puro, com ondas ao clicar.
- **InlineStatement:** frase com imagens embutidas, palavras acendendo com a rolagem.
- **ArrowButton:** pílula com seta circular que troca na diagonal.
- **Accordion:** contorno do ícone desenhado ao abrir.

## Motion

Curvas de saída exponenciais (`expo.out`, `cubic-bezier(0.16, 1, 0.3, 1)`). Lenis dirigido pelo ticker do GSAP. Cenas 3D presas por `position: sticky` com o progresso da rolagem como única autoridade. Movimento reduzido: sem fixação, parallax ou rolagem suave; conteúdo visível por padrão.

## Layout

Margens laterais `clamp(16px, 4.2vw, 60px)`. Grades 4/8 e 5/7 colunas no desktop, coluna única abaixo de 1000px. Camadas: over 2, header 50, follower 60, present 70, modal 100, ruído 120.
