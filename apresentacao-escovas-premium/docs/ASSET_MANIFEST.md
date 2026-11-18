# Manifesto de assets

Todas as imagens foram fornecidas pelo usuário nesta conversa. São imagens geradas/conceituais; direitos de publicação e uso público devem ser confirmados pelo usuário antes de qualquer divulgação. Foram convertidas para WebP (qualidade 82) e, quando tinham texto embutido, recortadas para manter só a ilustração (os textos estão em HTML).

| Arquivo em `src/assets/img/` | Origem (nome enviado) | Tratamento | Uso |
|---|---|---|---|
| `abertura-mao-escova.webp` | 6B3FCE45 (mão com escova azul) | WebP | Abertura |
| `rede-consultorio-familias.webp` | EB5B857C (rede com dentista e família) | WebP | Rede, cartão de destaque |
| `rede-multidao.webp` | 5EE5A721 (9 milhões, versão multidão) | Recorte sem texto | Rede, imagem do hover |
| `produto-macro-cerdas.webp` | 3ED5A0F4 (macro das cerdas) | WebP | Painel do produto, pôster 3D |
| `kit-expositor-escuro.webp` | Expositor original em fundo escuro (2ª rodada) | WebP | Painel do kit, pôster 3D |
| `kit-expositor-frente.webp` | Expositor original de frente, fundo escuro (3ª rodada) | WebP | Frase final do alcance |
| `kit-expositor-blister.webp` | Expositor original de frente, com as escovas no blister, fundo escuro (4ª rodada) | WebP | Visualizador de ângulos (Frente) |
| `kit-expositor-blister-34-esq.webp` | Expositor com blister em 3/4 pela esquerda, fundo escuro (5ª rodada, foto 13) | WebP | Visualizador de ângulos (3/4 esq.), díptico do presente |
| `kit-expositor-blister-34-dir.webp` | Expositor com blister em 3/4 pela direita, fundo escuro (5ª rodada, foto 14) | WebP | Visualizador de ângulos (3/4 dir.) |
| `kit-expositor-perfil.webp` | Expositor original de perfil, fundo escuro (3ª rodada) | WebP | Visualizador de ângulos (Perfil) |
| `kit-expositor-verso.webp` | Verso do expositor com os cartões dos blisters, fundo escuro (3ª rodada) | WebP | Visualizador de ângulos (Verso) |
| `kit-expositor-verso-34.webp` | Verso do expositor em ângulo, fundo escuro (3ª rodada) | WebP | Visualizador de ângulos (Verso 3/4) |
| `brinde-goiabada.webp` | Lata de goiabada cascão com meia goiaba (2ª rodada) | WebP | Seção Minas Gerais, díptico, frase final |
| `ativacao-recepcao.webp` | Expositor original no balcão da recepção (2ª rodada) | WebP | Painel de ativação, hover da rede, encerramento |
| `alcance-panorama-rede.webp` | B3509518 (panorama da rede) | WebP | Painel do alcance |
| `alcance-250-pacientes.webp` | 12B48E88 (250.000) | Recorte sem texto | Fórmula do alcance, hover da rede |
| `alcance-750-dependentes.webp` | 567CE368 (750.000) | Recorte sem texto | Fórmula do alcance |
| `alcance-1mi-exposicoes.webp` | A006E4BC (1 milhão) | Recorte sem texto | Fórmula do alcance |
| `lar-pai-filha.webp` | 64694B8A (pai e filha no banheiro) | WebP | Frase final |

Removidos: `kit-caixa-goiabada.webp` (caixa com doce embrulhado), porque o brinde real é goiabada em lata; `kit-expositor-estudio.webp` (fundo cinza), trocado pelas versões escuras no mesmo padrão. A foto duplicada da frente (11) não está no projeto. As três fotos escuras do expositor com blister estão no projeto (12, 13 e 14). As fotos 15, 16 e 17 da 5ª rodada são iguais às já usadas (`kit-expositor-escuro`, `ativacao-recepcao`, `brinde-goiabada`) e não foram trocadas.

## Texturas (`src/assets/tex/`)

| Arquivo | Origem | Tratamento | Uso |
|---|---|---|---|
| `goiabada-rotulo.webp` | Foto da lata (2ª rodada) | Rótulo desenrolado em textura cilíndrica de 360°: a parte da frente vem da foto, com a curvatura e o sombreamento compensados; a volta é completada com o vermelho e a faixa creme do próprio rótulo | Lata da goiabada no kit 3D |

## Marcas (`src/assets/brand/`)

| Arquivo | Origem | Observação |
|---|---|---|
| `odontoprev-horizontal.jpg` | IMG_2242.jpeg | Usado só sobre superfície clara |
| `odontoprev-vertical.jpg` | IMG_2241.jpeg | Bloco azul próprio; cabeçalho, abertura, rodapé, adesivo 3D |
| `dental-partner.jpg` | IMG_2238.jpeg | Bloco roxo próprio; idem |

Logos usados sem alteração de cor, proporção ou desenho, sem filtros. São JPEG de baixa resolução (369 a 867 px): substituir pelos SVG oficiais quando disponíveis.

## Não usados

Infográfico (só fonte de dados), imagem KG Sorensen (descartada pelo usuário), mão com escova preta (cor fora do kit), dentista escovando arcada (simulação de limpeza vetada), versão alternativa de "9 milhões" e duplicatas.

## Criados no projeto

- Escova 3D procedural com 5.460 filamentos (`src/scene/brushGeometry.ts`): autoria própria, representação conceitual.
- Kit 3D (`src/scene/KitScene.tsx`) modelado a partir das fotos do expositor original: acrílico em L com painel inclinado, faixa frontal com as marcas, apoio inferior, dois trilhos de presilhas e quatro escovas no blister; bandeja com o kit de 12 escovas (três camadas de quatro); lata de goiabada com o rótulo da foto e tampa plástica.
- Cartão do blister desenhado em canvas (`src/scene/kitTextures.ts`): "ULTRASOFT", "5460 ultra gentle and fine filaments", degradê rosa e roxo, o selo Dental Partner fornecido e o furo de gancheira aberto pela direita (visto de frente), como nas fotos de frente e de verso. Ficaram de fora a bandeira e a palavra "Germany" das fotos, pelo mesmo motivo do item "Tecnologia alemã" (não equivale a fabricação na Alemanha). A embalagem do kit de 12 ainda não foi definida: a bandeja é ilustrativa.
- Fundo pontilhado em WebGL (`src/components/DitherCanvas.tsx`) e matriz de pontos da implantação (250 pontos = 25.000 kits).
- Ruído de textura em SVG inline (`.noise`).

## Fontes tipográficas

- SF Pro: usada a do sistema em aparelhos Apple. Os OTF citados no briefing não foram recebidos e não estão no projeto.
- Zalando Sans (SIL Open Font License), baixada do Google Fonts e autohospedada em `src/assets/fonts/`.

## Bibliotecas

React 19.3, three.js 0.187, @react-three/fiber 9.8, @react-three/drei 10.7, GSAP 3.15 (ScrollTrigger), Lenis 1.3, Vite 8, TypeScript 5.9, Vitest 5. Nenhum HDRI remoto: o ambiente de reflexos usa Lightformers locais.
