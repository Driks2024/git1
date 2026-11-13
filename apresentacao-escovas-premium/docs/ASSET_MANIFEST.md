# Manifesto de assets

Todas as imagens foram fornecidas pelo usuário nesta conversa. São imagens geradas/conceituais; direitos de publicação e uso público devem ser confirmados pelo usuário antes de qualquer divulgação. Foram convertidas para WebP (qualidade 82) e, quando tinham texto embutido, recortadas para manter só a ilustração (os textos estão em HTML).

| Arquivo em `src/assets/img/` | Origem (nome enviado) | Tratamento | Uso |
|---|---|---|---|
| `abertura-mao-escova.webp` | 6B3FCE45 (mão com escova azul) | WebP | Abertura |
| `rede-consultorio-familias.webp` | EB5B857C (rede com dentista e família) | WebP | Rede, cartão de destaque |
| `rede-multidao.webp` | 5EE5A721 (9 milhões, versão multidão) | Recorte sem texto | Rede, imagem do hover |
| `produto-macro-cerdas.webp` | 3ED5A0F4 (macro das cerdas) | WebP | Painel do produto, pôster 3D |
| `kit-expositor-escuro.webp` | AA58298A (expositor em pedra escura) | WebP | Painel do kit, pôster 3D |
| `kit-caixa-goiabada.webp` | A9A89AAC (caixa com doce e expositor) | WebP | Brinde, encerramento |
| `kit-expositor-estudio.webp` | 5F194C7A (expositor em estúdio claro) | WebP | Composição do kit, frase final |
| `brinde-goiabada.webp` | 58467618 (doce e goiaba) | WebP | Seção Minas Gerais, frase final |
| `ativacao-recepcao.webp` | DEB8462E (balcão da recepção) | WebP | Painel de ativação, hover da rede |
| `alcance-panorama-rede.webp` | B3509518 (panorama da rede) | WebP | Painel do alcance |
| `alcance-250-pacientes.webp` | 12B48E88 (250.000) | Recorte sem texto | Fórmula do alcance, hover da rede |
| `alcance-750-dependentes.webp` | 567CE368 (750.000) | Recorte sem texto | Fórmula do alcance |
| `alcance-1mi-exposicoes.webp` | A006E4BC (1 milhão) | Recorte sem texto | Fórmula do alcance |
| `lar-pai-filha.webp` | 64694B8A (pai e filha no banheiro) | WebP | Frase final |

## Marcas (`src/assets/brand/`)

| Arquivo | Origem | Observação |
|---|---|---|
| `odontoprev-horizontal.jpg` | IMG_2242.jpeg | Usado só sobre superfície clara |
| `odontoprev-vertical.jpg` | IMG_2241.jpeg | Bloco azul próprio; cabeçalho, abertura, rodapé, adesivo 3D |
| `dental-partner.jpg` | IMG_2238.jpeg | Bloco roxo próprio; idem |

Logos usados sem alteração de cor, proporção ou desenho, sem filtros. São JPEG de baixa resolução (369 a 867 px): substituir pelos SVG oficiais quando disponíveis.

## Não usados

Infográfico (só fonte de dados), imagem KG Sorensen (descartada pelo usuário), mão com escova preta (cor fora do kit), expositor com blisters (textos com erro e bandeira que sugere fabricação na Alemanha), dentista escovando arcada (simulação de limpeza vetada), versão alternativa de "9 milhões" e duplicatas.

## Criados no projeto

- Escova 3D procedural com 5.460 filamentos (`src/scene/brushGeometry.ts`), kit 3D com expositor, 16 escovas e doce de goiaba (`src/scene/KitScene.tsx`): autoria própria, representação conceitual.
- Fundo pontilhado em WebGL (`src/components/DitherCanvas.tsx`) e matriz de pontos da implantação (250 pontos = 25.000 kits).
- Ruído de textura em SVG inline (`.noise`).

## Fontes tipográficas

- SF Pro: usada a do sistema em aparelhos Apple. Os OTF citados no briefing não foram recebidos e não estão no projeto.
- Zalando Sans (SIL Open Font License), baixada do Google Fonts e autohospedada em `src/assets/fonts/`.

## Bibliotecas

React 19.3, three.js 0.187, @react-three/fiber 9.8, @react-three/drei 10.7, GSAP 3.15 (ScrollTrigger), Lenis 1.3, Vite 8, TypeScript 5.9, Vitest 5. Nenhum HDRI remoto: o ambiente de reflexos usa Lightformers locais.
