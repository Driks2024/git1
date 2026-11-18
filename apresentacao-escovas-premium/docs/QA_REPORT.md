# Relatório de QA

Ambiente: contêiner Linux, Node 22.23.4, npm 10.9.9, Chromium headless do Playwright com WebGL por software (SwiftShader, sem GPU).

## Comandos executados

| Comando | Resultado |
|---|---|
| `npm run typecheck` | sem erros |
| `npm run lint` | sem erros nem avisos |
| `npm run test` | 18/18 testes passaram (3 arquivos) |
| `npm run build` | ok |
| `npm run build:single` | ok, `dist-single/index.html` com 3,78 MB |
| `npm run test:e2e` (com `npm run preview`) | 17/17 verificações passaram |

### Testes de domínio (Vitest)

8,90 → 17,80 (diferença 8,90, markup 100%, margem 50%); 8,90 → 19,80 (10,90, ~122,4719%, ~55,0505%); 8,90 × 14% = 1,246; referência R$ 44,00 (55,0% a 59,5% abaixo); 5.000 × 5 = 25.000; 25.000 × 258 = 6.450.000; 5.000 × 258 = 1.290.000; 4 + 12 = 16 e 400.000 escovas; 25.000 × 10 = 250.000; × 3 = 750.000; soma = 1.000.000; divisão por zero e entradas inválidas rejeitadas; exatamente 5.460 posições de cerdas dentro da cabeça, de forma determinística; estágios das cenas 3D (kit monta, abre e termina montado; produto com montagem, capa e cerdas).

### Teste de fumaça no navegador

10 capítulos com âncora; nenhuma ocorrência de "100% de margem"; 122,5% e 55,1% visíveis; logos das duas marcas presentes; → leva ao capítulo 02, End ao 10 e Home volta; índice abre e fecha com Esc; premissas listam 26 itens com status; simulação a R$ 17,80 recalcula a diferença bruta; sem rolagem horizontal em 1440×900, 1024×768 e 390×844; sem erros de console; com movimento reduzido os títulos ficam visíveis e não há trilhos fixados; no modo leve as cenas 3D viram pôsteres.

## Inspeção visual

Capturas em 1440×900 e 390×844 de todos os capítulos, incluindo os estados da escova 3D (visão geral, capa, macro das 5.460 cerdas) e do kit (montado e explodido com etiquetas).

Segunda rodada (expositor original, kit de 12 e goiabada em lata): kit 3D conferido montando, montado e aberto em 1440×900, 1280×800, 1024×768, 768×1024 e 390×844, e montado com movimento reduzido; composição, brinde, díptico, ativação e encerramento conferidos em 1440×900, 768×1024 e 390×844. Visualizador de ângulos do expositor (frente, perfil, verso e verso 3/4) testado com clique em 1440×900 e toque em 390×844: troca a foto, atualiza `aria-pressed` e o texto alternativo, sem erros nem rolagem horizontal. Quarta rodada: a foto de frente com blister virou a vista "Frente" do visualizador, conferida em 1440×900 e 390×844; o furo de gancheira do cartão no 3D passou a abrir pela direita (visto de frente), conferido no conjunto montado em 1440×900. Quinta rodada: visualizador com seis vistas (frente, 3/4 esq., 3/4 dir., perfil, verso, verso 3/4), miniaturas em 6 colunas no desktop e 3 no celular; textos do presente, entrega, Ponte Nova, importação e condições conferidos em 1440×900, 768×1024 e 390×844, incluindo o painel do kit 3D montado; sem erros nem rolagem horizontal.

Problemas encontrados e corrigidos durante a inspeção:

- espaços entre palavras perdidos nos títulos animados;
- mistura de cor (lighten) dos painéis anulada pela camada de composição da imagem;
- gatilhos de rolagem com posições desatualizadas após as cenas fixadas mudarem a altura da página (texto gigante do brinde sumia);
- logo da Dental Partner esticado pela regra de estilo da foto vizinha;
- rótulos das barras de preço ilegíveis no celular;
- objetos e etiquetas do kit 3D cortados na borda do painel lateral;
- three.js no pacote inicial (1,35 MB): movido para carregamento sob demanda (pacote inicial 423 KB, 139 KB gzip);
- kit 3D empurrado para baixo do painel no tablet deitado (1024×768): criada uma composição própria para telas quase quadradas;
- bandeja do kit de 12 cortada na borda esquerda do celular;
- logo Odontoprev quase invisível no acrílico: faixa frontal levemente fosca, como nas fotos;
- câmera do kit amortecida por quadro (mais lenta em telas de 60 Hz): passou a ser amortecida pelo tempo.

## Pacotes de produção

| Arquivo | Tamanho | gzip |
|---|---|---|
| JS inicial (`index-*.js`) | 426 KB | 140 KB |
| three.js + R3F (sob demanda) | 917 KB | 242 KB |
| Luzes/ambiente drei (sob demanda) | 67 KB | 24 KB |
| Cena do kit (sob demanda) | 16 KB | 5 KB |
| CSS | 40 KB | 9 KB |
| Imagens (17 WebP) e textura do rótulo | 1,1 MB no total | |

## Não verificado

- Desempenho (FPS, tempo de carga) em hardware real: o ambiente não tem GPU, então nenhum número de FPS é declarado.
- Safari, iOS e Android reais; projetor físico.
- Leitores de tela reais (a estrutura semântica foi revisada no código, não com NVDA/VoiceOver).
- O vídeo `Projeto_Dental_Partner.mp4` e os OTF da SF Pro não foram recebidos.
- Aviso no console vindo de dentro do React Three Fiber: "THREE.Clock: This module has been deprecated" (não afeta o funcionamento).

## Pronto para produção?

Não. A apresentação está funcional e pronta para discussão interna, mas usa modelos 3D e imagens conceituais, logos em baixa resolução e premissas comerciais ainda não validadas (ver capítulo 09 e `CONTENT_AUDIT.md`).
