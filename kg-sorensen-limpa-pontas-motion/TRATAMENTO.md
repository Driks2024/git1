# KG SORENSEN · Limpa Pontas KG · "Leve 2. Pague 1."
## Tratamento criativo + execução do motion (18,8 s · 1920×1080 · 30 fps)

> **Conceito:** *Precisão até na hora de economizar.*
> Entramos dentro de um projeto técnico da KG SORENSEN. O blueprint se calibra, desenha a embalagem, analisa as duas unidades, e a própria engenharia revela a oferta. O filme termina exatamente na arte-mestre, sem nenhuma diferença.

Entregáveis desta pasta:

| Arquivo | O que é |
|---|---|
| `output/KG_LimpaPontas_Leve2Pague1_1920x1080_18s8.mp4` | Filme final com sound design (H.264 + AAC) |
| `output/kg_sound_design.wav` | Trilha/sound design isolado (48 kHz, estéreo, float) |
| `output/storyboard.png` | Storyboard de 16 quadros, renderizados do próprio filme |
| `output/hero_frame.png` | Último quadro (hero), idêntico à master |
| `src/index.html` | Player com scrub (abre no navegador e toca em tempo real) |
| `tools/` | Pipeline completo: extração de camadas, render e áudio |

---

## 1. Análise da master visual

**Hierarquia (leitura em Z):**
1. `Leve 2. / Pague 1.`: grotesca black e condensada, entreletra negativo. O peso visual está à esquerda, no terço superior. "Pague 1." fica dentro de um colchete técnico ciano (com uma interrupção onde a descendente do *g* cruza a linha).
2. **Produto à direita**: embalagem branca em 3/4 e as duas unidades pretas (uma à frente, outra atrás) sobre um cubo-plataforma de vidro azul. A perspectiva tem duas fugas, e a câmera fica levemente acima.
3. **Preço**: `2 unidades por` (regular, espaçado) → `R$ 11,60` (black condensado, segundo maior peso) com barra vertical ciano → `R$ 5,80 por unidade nesta oferta.` (apoio).
4. **Assinatura**: logo KG SORENSEN no canto superior esquerdo, `LIMPA PONTAS KG` em caixa técnica no canto superior direito, linha de base com `Peça ao seu representante.` e `Ref. 1810.7021`.

**Sistema gráfico:** grid milimetrado (passo ≈ 14,4 px na master) sobre um azul profundo com vinheta, linhas de construção brancas finas, tracejados de perspectiva, um círculo de referência atrás da embalagem e retículas (crosshairs) nos quatro cantos. A luz é fria, branca-azulada, de cima e da esquerda. O espaço negativo fica entre a tipografia e o produto, e é por ali que a câmera transita.

**Decisão-chave:** a animação se adapta à identidade, e não o contrário. Nenhum pixel de produto, embalagem, logo ou tipografia foi redesenhado. Tudo foi **extraído da própria master** e separado em camadas animáveis (ver §7).

---

## 2. Arco narrativo

| Ato | Tempo | Função | Leitura sem áudio |
|---|---|---|---|
| Calibração | 0:00–2:50 | Antecipação | "É um projeto técnico." |
| Construção | 2:50–5:00 | **Produto** | "A embalagem é construída com precisão." |
| Descoberta | 5:00–7:45 | **Benefício** | "São **duas** unidades." (o "2" aparece como dado de engenharia) |
| Revelação | 7:45–11:00 | **Oferta** (clímax) | "**Leve 2. Pague 1.**" |
| Valor | 11:00–14:00 | Prova | "R$ 11,60 por 2 → R$ 5,80 cada." |
| Composição | 14:00–16:75 | **Conversão** | "Peça ao seu representante." |
| Hero | 16:75–18:80 | Memória | A arte original, exata, por 2 s |

O fio condutor é o **"2"**: ele nasce como etiqueta técnica de quantidade sobre as duas unidades e, num *match cut*, viaja até virar o "2" de "Leve 2.". Produto e oferta passam a ser o mesmo dado.

---

## 3. Decupagem (timecodes reais do filme)

### S1 · 0:00–2:50 · Calibração
- **0:00–0:60** O quadro sai do escuro e a "mesa de luz" acende o grid da própria master.
- **0:35–1:25** Uma linha *datum* (Y 476) atravessa o quadro da esquerda para a direita, com cabeça luminosa.
- **0:60–1:85** Linhas verticais (X 1045, X 0702) e a diagonal tracejada de perspectiva se desenham. Coordenadas digitadas em microtipografia.
- **0:75–1:25** A retícula superior direita é traçada (o arco gira e os braços se estendem).
- **1:00–1:70** A moldura técnica do rótulo se desenha. **1:55–2:20** `LIMPA PONTAS KG` é digitado letra a letra, com cursor.
- **0:40–2:30** Marcas de interseção piscam pelo grid (calibração).
- HUD discreto: `PRJ 1810.7021 · REV A`, réguas que acompanham a câmera (coordenadas reais da prancha), carimbo técnico.
- **Câmera:** dolly-in contínuo e lento (z 1,30 → 1,55 até o fim de S2).

### S2 · 2:50–5:00 · Construção da embalagem: WIREFRAME → VOLUME → TEXTURA → REAL
- **2:45–3:40** As 12 arestas da embalagem se desenham (9 visíveis + 3 ocultas tracejadas) sobre os vértices medidos na master, com marcadores de vértice, coordenadas e cotas X/Y.
- **2:55–3:95** Um **scanner** horizontal varre o quadro. Atrás dele a plataforma, o círculo e as linhas de construção originais "acendem".
- **2:90–3:60** Silhuetas-fantasma das duas unidades (sólido técnico com hachura): o desenho já prevê três peças.
- **3:18–3:55** VOLUME: faces chapadas, como argila técnica, com hachura de corte.
- **3:48–4:15** TEXTURA: um primeiro passe varre a peça em monocromático azul-ciano (a luminância da foto real).
- **3:80–4:50** REAL: um segundo passe revela a embalagem original, com sombra de contato. **4:45–5:05** Um brilho percorre a aresta superior.

### S3 · 5:00–7:45 · Os dois Limpa Pontas KG
- **4:85–6:45** Tracking lateral até as unidades.
- **5:25 / 5:40** Colchetes de rastreamento encaixam em cada peça, com rótulos `UN. 01` e `UN. 02`.
- **5:55–6:42** A UN. 01 (atrás) passa por textura → real com **assentamento em profundidade** (desce 7 px e escala de 1,03 para 1). **5:95–6:82** A UN. 02 (à frente) faz o mesmo.
- **6:62–7:15** **O "2" aparece:** anel técnico, o próprio glifo "2" da master, guias tracejadas até as duas peças e a nota `QTD.`.

### S4 · 7:45–11:00 · LEVE 2. PAGUE 1. (clímax)
- **7:45–8:42** Chicote óptico lateral (*whip*), com motion blur real de 180°. O "2" conduz a câmera e cresce até o tamanho do título (*match cut* geométrico).
- **8:42** O "2" pousa no lugar exato de "Leve 2." (ping de pouso).
- **8:30–8:72** Guias tipográficas: linha de base (BL), altura de maiúscula (CH) e altura-x (XH).
- **8:42–8:90** Um marcador técnico percorre a linha de base e o L-e-v-e **nasce da linha de base**. **8:88–9:06** O ponto final encaixa.
- **9:00–9:78** Tilt para enquadrar as duas linhas. **9:08–9:54** O colchete ciano da master se desenha.
- **9:45–9:86** Um scanner vertical "imprime" `Pague 1.` dentro do colchete.
- **9:86 · IMPACTO:** as linhas do colchete acendem, uma onda de choque retangular sai do colchete, a tipografia faz bloom, o grid pulsa e a câmera dá um micro push-in amortecido.
- **9:95–11:00** Respiro, com as coordenadas reais dos cantos do colchete.

### S5 · 11:00–14:00 · Preço
- **11:00–11:88** Tilt para baixo (o título continua no quadro, a hierarquia se preserva).
- **11:22–11:63** `2 unidades por` é digitado. **11:60–11:88** A barra ciano se desenha.
- **11:84–12:24** `R$ 11,60` é impresso a partir da barra. **12:25 · micro-impacto.**
- **12:40–13:40** Nota técnica minimalista: `2 × R$ 5,80` / `= R$ 11,60`. Cada caractere entra direto no valor final, **sem números intermediários**.
- **12:95–13:45** `R$ 5,80 por unidade nesta oferta.`, com uma guia tracejada que liga a conta à linha.

### S6 · 14:00–16:75 · Composição completa
- **14:00–16:75** Pull-back longo até o enquadramento exato da master.
- **14:35–15:30** Seis linhas de construção convergem para os vértices do produto (pings).
- **14:95–16:10** Brilhos percorrem os contornos da embalagem e das unidades.
- **15:00–15:70** Logo KG SORENSEN: contorno técnico e depois a revelação do logo real (selo).
- **15:25–15:85** A linha de base do CTA se estende. **15:35–16:00** As retículas dos cantos se desenham.
- **15:60–16:20** `Peça ao seu representante.` · **15:95–16:35** `Ref. 1810.7021`. O HUD se recolhe (14:10–15:00).

### S7 · 16:75–18:80 · Hero frame
- **16:75** A câmera trava em casa. **16:75–17:10** Dissolve para a **master pixel a pixel**.
- **17:20–17:95** Um único brilho atravessa "Leve 2. Pague 1.". **17:55–18:25** Um brilho na aresta da embalagem.
- **2,05 s** de quadro final limpo e legível. Nada some.

---

## 4. Sistema tipográfico

- A tipografia **é a da master**: os glifos foram extraídos da arte original (matte por projeção na cor real do texto e contorno reconstruído em 3× para os zooms), com o drop-shadow original preservado como camada própria.
- **Caixa e pontuação** seguem a arte: "Leve 2. / Pague 1.", "2 unidades por", "R$ 11,60", "R$ 5,80 por unidade nesta oferta.", "Peça ao seu representante.", "Ref. 1810.7021".
- **Tipografia como arquitetura:** baseline, cap-height e x-height são linhas técnicas reais. As letras nascem da baseline, o colchete delimita a segunda linha e o scanner imprime o texto. Não há fade genérico.
- **Microtipografia do HUD:** IBM Plex Mono (400/500/600), caixa alta, entreletra 12%, opacidade de 35% a 80%. Conteúdo **neutro**: coordenadas reais da prancha (px da master), estágio do projeto, câmera, quadro. **Nenhuma medida ou especificação de produto foi inventada.**
- O conceito "Precisão até na hora de economizar." aparece só no carimbo técnico (S1–S2, 10 px). Para remover, apague a linha correspondente em `drawHUD()` em `src/engine.js`.

## 5. Câmera e transições

- **Um único plano-sequência 2.5D** sobre a prancha: dolly-in, tracking lateral, chicote, tilt, push-in de impacto e pull-back. As poses são somadas com easings de velocidade contínua (sem trancos entre movimentos).
- Zoom máximo de 2,07× sobre o título. A foto do produto nunca passa de ~1,9× de ampliação.
- Transições narrativas: linha → objeto, wireframe → material → real, scanner → tipografia, *match cut* do "2", máscaras de grid, pull-back revelando a composição. Sem glitch, sem corte seco e sem flash constante.
- **Motion blur real** por supersampling temporal (até 40 subquadros por quadro): obturador de 180° no chicote e ~120° nos demais movimentos, para preservar a leitura.

## 6. Sound design (cue sheet)

Sintetizado do zero (`tools/sound_design.py`), sem samples. Mix final: **−16 LUFS integrado / −1 dBTP**, 48 kHz.

| Tempo | Evento visual | Som |
|---|---|---|
| 0:12 | Mesa de luz acende | Thump grave + chirp de calibração + beep 2,4 kHz |
| 0:36 → 9:36 | Prancha ativa | Pulso de calibração a cada 0,5 s (tick + blip, acento a cada 4) |
| 0:33–1:85 | Linhas se desenham | Zips de laser panoramizados conforme a posição na tela, whoosh do datum |
| 0:75 | Retícula | Servo |
| 1:55–2:20 | Rótulo digitado | 14 cliques mecânicos (relé) |
| 2:45–3:40 | Arestas da embalagem | 12 zips afinados por aresta |
| 2:55–3:95 | Scanner | Tom de varredura com trêmolo + ruído de banda |
| 3:48 / 3:80 | Textura / real | Servo ascendente / shimmer agudo |
| 4:50 | Brilho na aresta | "Ting" FM |
| 5:25 / 5:40 | Rastreamento | Clique metálico + knock curto |
| 6:42 / 6:82 | Unidades assentam | Knocks graves (assentamento) |
| 6:74–6:98 | O "2" | Bloop digital + trava em dois tons |
| 7:42 | Chicote | Whoosh estéreo D→E + queda de sub |
| 8:42 | "2" pousa | Clique + knock + anel metálico curto |
| 8:43–8:73 | L-e-v-e sobem | 4 knocks com servo, afinação ascendente |
| 9:44 | "Pague 1." imprime | Riser do scanner, depois **sucção** de 9:80 a 9:86 |
| **9:86** | **IMPACTO** | **Hit cinematográfico seco: sub 72→36 Hz, transiente e anel metálico inarmônico** |
| 11:22 | 2 unidades por | 12 cliques |
| **12:25** | **R$ 11,60** | **Micro-impacto: sub curto, knock e clique** |
| 12:62–13:40 | Calculadora | Ticks digitais por caractere + "confere" em dois tons |
| 14:00 | Pull-back | Whoosh de ar longo + pad abrindo |
| 15:66 | Logo | Selo grave ("stamp of warranty") |
| 15:60–16:35 | CTA / Ref. | Cliques |
| 16:75 | Hero | Acorde de resolução (Lá add9) + sub suave |

Cama: drone em Mi (41 Hz), pad em quinta aberta (A–E–B) cujo filtro abre até o clímax, que resolve em Lá maior add9 no hero. Room tone de laboratório.

---

## 7. Fidelidade à master (o que **não** mudou)

- **Preços, promoção, referência e CTA**: idênticos à arte.
- **Produto e embalagem**: recortes da master (embalagem, unidade traseira, unidade frontal). Nada foi pintado, inventado ou redesenhado. A face da embalagem oculta pelas unidades **não** foi recriada: no início ela fica sob a silhueta técnica das unidades.
- **Logo e tipografia**: extraídos da master.
- **Fundo**: três plates derivados da master (vazio → estruturas → sombras de contato). As linhas técnicas originais são "desenhadas" por máscaras que crescem ao longo delas.
- **Hero frame**: a partir de 16:75 a imagem é a master original. `output/hero_frame.png` comprova.

Pipeline (`tools/prep_layers.py`): matte linear por croma (arte neutra sobre azul) para produto e logo, matte por projeção de cor para a tipografia, fronteiras internas entre as peças medidas por gradiente de luminância, casco convexo para eliminar os furos de reflexo azul, inpainting em frequência separada (baixa frequência por convolução normalizada e grid recomposto pelos perfis de linha e coluna da própria master) e halo de sombra atribuído ao bloco de texto mais próximo.

## 8. Especificações técnicas

- Vídeo: 1920×1080, 30 fps, 18,8 s (565 quadros), H.264 High@4.2, CRF 15, BT.709, yuv420p, faststart.
- Áudio: AAC 256 kbps, 48 kHz estéreo, −16 LUFS / −1 dBTP.
- Render determinístico: o mesmo commit gera o mesmo filme, quadro a quadro.

### Reproduzir / editar
```bash
pip install numpy pillow scipy opencv-python-headless
python3 tools/prep_layers.py          # camadas a partir da master
python3 tools/sound_design.py         # áudio
node tools/render.mjs --workers 3     # quadros (Chromium headless / Playwright)
# encode (ver README.md)
```
Para ajustar timing, edite os marcos em `src/engine.js` (`POSES` para a câmera e cada `drawX(t)` por cena). Para revisar ao vivo, sirva a pasta e abra `src/index.html` (player com scrub).

## 9. Próximos passos sugeridos
- **4:5 e 9:16**: pedem uma master vertical (a composição 16:9 não cabe sem recompor). O motor já aceita outra master e outras poses de câmera.
- **Bumper de 6 s**: S4 (impacto) → S7 (hero).
- Versão com locução opcional ("Leve 2. Pague 1. Peça ao seu representante."), com ducking automático do pad.
