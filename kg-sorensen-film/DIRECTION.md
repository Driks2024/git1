# KG SORENSEN — PONTA DIAMANTADA FG
## Bíblia criativa e técnica do filme de produto

> Documento-contrato. Tudo que é construído (experiência scroll + 3D e vídeo
> Remotion) obedece a este arquivo. Se algo mudar no código, mude aqui.

---

## 0. O que recebemos (inventário real)

| Arquivo | O que é | Uso no filme |
|---|---|---|
| `assets/reference/promo-ponta-fg.webp` (1122×1402) | Pôster "PROMOÇÃO — Não deixe para depois" com a ponta FG esférica, glow lima, código `HL031234` na haste | Fonte da anatomia do herói, do rim-light lima, dos claims e da copy de promoção |
| `assets/reference/foto-ponta-chama.png` (515×644) | Foto macro de uma ponta tipo chama com faixa lima tocando um dente cerâmico. Legenda "KG / CIÊNCIA & PRECISÃO" | Referência de material (cristais escuros cintilantes), do formato CHAMA e do tagline "Ciência & Precisão" |
| `assets/reference/logo-kg-sorensen.webp` (2000×2000, alpha) | Logo oficial KG Sorensen + "More than a brand / A stamp of warranty" | Marcação a laser na haste, impressão no bloco Limpa Pontas, assinatura final |
| `assets/reference/promo-limpa-pontas.webp` (1672×941) | Oferta "Leve 2. Pague 1." Limpa Pontas KG, 2 un. por R$ 11,60 (R$ 5,80/un.), Ref. 1810.7021 | Beat CUIDADO + card de oferta no final |

Não há vídeo, áudio, música nem fontes da marca. Tudo isso é resolvido em código:
- **3D 100% procedural** (Three.js): nenhuma malha externa.
- **Fontes**: Inter (com eixo óptico — corte *Display* para títulos) + JetBrains Mono. 2 famílias.
- **Som** (só modo vídeo): SFX sintetizados por script determinístico (`video/scripts/make-sfx.py`).

### Fatos que podemos afirmar (e os que NÃO)
Afirmamos apenas o que está nas peças da marca ou é norma/fato físico geral:
- Haste FG (*friction grip*) Ø 1,60 mm — padrão de haste para turbina de alta rotação.
- Comprimento total ≈ 19 mm (FG padrão).
- Corpo em aço inoxidável; cristais de diamante fixados por matriz metálica.
- Diamante: carbono, dureza 10 na escala Mohs.
- Código de cores de granulação (anel): amarelo = extrafina, vermelho = fina,
  azul = média, verde = grossa. Tamanhos de grão sempre com "≈".
- Turbina de alta rotação: ≈ 300.000 rpm (contexto, não spec da ponta).
- Claims de marca (das peças): "Precisão que entrega resultados", "Confiança em
  cada procedimento", "Excelência para o seu dia a dia", "Alta precisão em cada
  detalhe", "Durabilidade que você confia", "Qualidade que valoriza seu
  trabalho", "More than a brand. A stamp of warranty.", "Ciência & Precisão",
  "Condições especiais e bonificação", "Fale com nosso time comercial".
- Oferta Limpa Pontas exatamente como no anúncio.

**Nunca** inventar: número exato de cristais de um produto real, RPM máximo da
ponta, certificações, datas, preços da ponta FG, links/telefones.
Contadores do modelo 3D são rotulados como visualização ("cristais neste modelo"). Na esférica de granulação grossa são centenas de cristais, não milhares: use "Centenas de cristais."

---

## 1. Conceito

**"Ciência & Precisão em escala de mícron."**
O filme mostra que uma peça de 19 mm é engenharia de verdade: aço torneado,
uma matriz metálica e milhares de cristais de diamante — cada um uma aresta
de corte. A espinha é REVELAR → INSPECIONAR → TRANSFORMAR → CELEBRAR.

O herói é a **ponta diamantada FG esférica** do pôster (haste longa, pescoço
cônico, cabeça esférica diamantada, anel lima, marcação a laser KG + `HL031234`).
O formato **CHAMA** da foto aparece nas variações.

Assinatura visual da marca levada para o 3D: **rim-light lima** (o glow do
pôster) que acende nos momentos-chave — nunca o tempo todo.

---

## 2. Sistema visual

### Paleta (tokens)
| Token | Hex | Uso |
|---|---|---|
| `ink-0` | `#050506` | fundo mais profundo |
| `ink-1` | `#0B0B0C` | fundo base |
| `ink-2` | `#151517` | painéis, grid |
| `hair` | `rgba(236,238,240,.14)` | hairlines |
| `steel` | `#C9CCD1` | texto secundário, aço |
| `kg-gray` | `#87888B` | cinza do logo KG |
| `paper` | `#F1F1EE` | texto principal |
| `lime` | `#D4F82E` | acento da marca (amostrado do pôster) |
| `lime-soft` | `#E2FB5A` | acento claro (amostrado do anúncio Limpa Pontas) |

Fundos sempre neutros. Lima é luz, não superfície: rim-light, anel, um dígito,
uma linha. Nunca mais de ~3% da tela.

Cores do código de granulação (somente no anel e nos seletores):
`extrafina #E9C434` · `fina #D9443A` · `média #3D74D8` · `grossa #9ED62B` (verde puxado
para o lima da marca).

### Tipografia (2 famílias)
- **Inter Display** (Inter, `opsz` 32) — títulos monumentais em peso 100–200,
  tracking levemente negativo; peso 800–900 apenas na promoção final.
- **Inter** (texto, `opsz` 14) — corpo, 300–500.
- **JetBrains Mono** — dados técnicos, coordenadas, etiquetas, 300–500, caixa alta, tracking +0.14em.

Hierarquia: N1 título (clamp 64–320 px) · N2 suporte (18–28 px) · N3 contexto mono (10–12 px).
Números ganham destaque máximo (peso alto ou lima).

### Linguagem gráfica
Hairlines de 1 px, miras (crosshair) ocasionais, micro-coordenadas mono,
etiquetas técnicas ligadas a pontos 3D por linhas finas, grão de filme sutil,
vinheta, luz com sensação volumétrica. Sem cards, sem seções empilhadas.

### Proibido
Motion blur, zoom blur, streaks, raios. Transições "PowerPoint". Fundos
saturados (marrom/azul). Mais de 2 famílias. Texto fora da safe area.

---

## 3. Anatomia do herói (unidade: 1 = 1 mm, eixo +Y)

```
y = 0.00  ┬ topo chanfrado da haste (chanfro 0.18)
          │ HASTE  Ø 1.60 (r 0.80) — aço inox, torneado circunferencial
y ≈ 2.6–9.4 │ marcação a laser: logo KG + "SORENSEN" + "HL031234" (decal escuro recozido)
y = 11.25 ┼ ANEL de identificação (pintura, r 0.806, 0.70 de altura) — lima
y = 12.40 ┼ fim da haste → início do PESCOÇO (perfil spline r 0.80 → 0.34)
y = 16.30 ┼ colo do pescoço (r 0.34)
          │ CABEÇA esférica: núcleo usinado r 1.02 · matriz metálica r 1.08
          │ cristais de diamante projetando até r ≈ 1.14
y ≈ 19.0  ┴ topo
```
Formatos (perfil de torno da cabeça): `ESFÉRICA`, `CHAMA`, `CILÍNDRICA`, `TRONCO-CÔNICA`.

Peças para a vista explodida:
1. Haste em 12 seções (discos com face de corte torneada; a marcação a laser viaja com elas)
2. Anel de identificação
3. Pescoço
4. Núcleo usinado (cabeça de aço)
5. Matriz metálica em ~80 placas (tiles do torno, com espessura)
6. Cristais de diamante instanciados. A contagem vem da granulação e da área
   (≈ 590 na esférica grossa) e aparece como "cristais neste modelo".

---

## 4. Roteiro — Modo B (experiência scroll + 3D)

Progresso `p ∈ [0,1]` vem do scroll suavizado (mola criticamente amortecida).
`?t=0.42` na URL ou `window.__film.seek(0.42)` pula para qualquer ponto.
Tecla `D` mostra o HUD de debug.

| # | Beat | p | Câmera / objeto | Texto |
|---|---|---|---|---|
| 1 | ESCURIDÃO | 0.00–0.07 | Silhueta diagonal quase invisível; um reflexo fino percorre a borda da haste; anel dá um único brilho | `KG SORENSEN PRESENTS` (mono) · `CIÊNCIA & PRECISÃO` · dica de scroll |
| 2 | REVEAL | 0.07–0.17 | Luz sobe, órbita sutil 3/4, reflexos viajam pelo aço; rim-light lima acende | Título monumental **PRECISÃO** atrás, parcialmente oculto pela ponta · "Ponta diamantada FG." · "Precisão que entrega resultados." |
| 3 | MACRO | 0.17–0.37 | 8 passagens coladas com DOF fotográfico: cristais → matriz → pescoço → anel → logo laser → lote → aço escovado → chanfro FG | Etiquetas mono rastreadas por linhas finas |
| 4 | VISTA EXPLODIDA | 0.37–0.53 | Peças se separam lenta e elegantemente sobre grid técnico: 12 seções da haste, anel, pescoço, núcleo usinado, placas da matriz, cristais | `Centenas de cristais.` / `Uma ponta.` · contador de cristais do modelo · etiquetas 01–06 com linhas |
| 5 | TRAVESSIA | 0.53–0.615 | Câmera atravessa as placas e cristais, paralaxe forte; peças se dissolvem até restar um cristal | — (só coordenadas) |
| 6 | O NÚCLEO | 0.615–0.70 | Um cristal de diamante cubo-octaédrico gigante (shader facetado com dispersão); anéis de rotação + perfil de superfície sendo aplainado | `A essência do corte.` · `C · CARBONO` · `10 · MOHS` · `≈300.000 RPM · TURBINA` |
| 7 | REMONTAGEM | 0.70–0.78 | Tudo acelera de volta; placas fecham, fatias empilham, anel desliza; *snap* com flash de rim-light | `Uma ponta.` / `Confiança em cada procedimento.` |
| 8 | VARIAÇÕES | 0.78–0.87 | Varredura laser de cima a baixo troca formato + granulação: CHAMA·FINA → CILÍNDRICA·MÉDIA → TRONCO-CÔNICA·EXTRAFINA → ESFÉRICA·GROSSA, passagem macro após cada troca | Nome do formato + granulação + ≈µm |
| 9 | CUIDADO | 0.87–0.92 | Bloco Limpa Pontas (espuma preta texturizada, logo prateado) entra; a ponta gira e atravessa; detritos se soltam | "Durabilidade que você confia." · `LIMPA PONTAS KG · AÇÃO DESINCRUSTANTE` |
| 10 | PARTÍCULAS | 0.92–0.962 | A ponta vira milhares de partículas que seguram a silhueta, expandem passando pela câmera e reconstroem | — |
| 11 | FINAL | 0.962–1.00 | Ponta simétrica no centro, espaço negativo, luz varrendo em loop | **KG SORENSEN** · "More than a brand. A stamp of warranty." · specs mono · CTA `FALE COM NOSSO TIME COMERCIAL` · card da oferta Limpa Pontas |

**Cena final interativa**: scroll deixa de controlar; mouse = paralaxe + giro
sutil; arrastar inspeciona e volta ao centro com mola; seletor mínimo
`FORMA` (4) e `GRANULAÇÃO` (4) troca ao vivo, fundo acompanha (tinta neutra
derivada da cor do anel).

Extras: cursor customizado que expande em interativos; trilho de progresso
fino na borda direita com ticks por beat; micro-coordenadas da câmera; miras.

---

## 5. Roteiro — Modo A (vídeo Remotion, 1080×1920, 30 fps, 45 s = 1350 frames)

Mesma rig 3D (`shared/`), mesmo vocabulário. Ritmo de redes sociais: os 3
primeiros segundos seguram o polegar.

| Cena | Frames | Conteúdo |
|---|---|---|
| `Scene01Dark` | 0–89 | Preto, reflexo percorre a borda, `KG SORENSEN PRESENTS`, brilho no anel |
| `Scene02Reveal` | 90–209 | Ponta emerge na diagonal, **PRECISÃO** atrás, rim-light lima |
| `Scene03Macro` | 210–419 | 5 macros com DOF + etiquetas (cristais, matriz, anel, laser, haste FG) |
| `Scene04Exploded` | 420–599 | Vista explodida + `Centenas de cristais. / Uma ponta.` |
| `Scene05Core` | 600–719 | Cristal gigante, specs |
| `Scene06Snap` | 720–809 | Remontagem com snap |
| `Scene07Variations` | 810–959 | Varredura de formatos/granulação |
| `Scene08Care` | 960–1109 | Limpa Pontas: "Leve 2. Pague 1." R$ 11,60 |
| `Scene09Final` | 1110–1349 | PROMOÇÃO · "Não deixe para depois" · "Condições especiais e bonificação" · CTA · logo |

SFX (sintetizados, volume configurável): whoosh no reveal, ticks nas etiquetas,
riser antes da explosão, snap na remontagem, sweep nas variações, hit no final.
Sem voz e sem música licenciada: um *bed* ambiente grave opcional.

---

## 6. Arquitetura técnica

```
kg-sorensen-film/
  shared/                 ← rig 3D compartilhada (TypeScript, Three.js)
    util/                 rng determinístico, easing, math
    bur/                  perfis, geometria, texturas procedurais, materiais, classe Bur
    stage/                ambiente de estúdio (PMREM), backdrop shader, pós-processamento,
                          diamante do núcleo, partículas, bloco Limpa Pontas, FilmRenderer
    timeline/             estado do filme: evaluate(p) → FilmState (modo B)
  experience/             modo B: Vite, scroll com inércia, UI (etiquetas, trilho, cursor, seletor)
  video/                  modo A: Remotion (Root, Video, scenes/, components/, config)
```

Regras:
- **Determinismo**: toda aleatoriedade vem de `rng(seed)`. Nada de `Math.random`
  na rig. O modo A usa só `useCurrentFrame()`.
- `FilmRenderer.render(state)` é síncrono e puro em relação ao estado —
  o modo B chama no `requestAnimationFrame`, o modo A chama por frame.
- Performance: instâncias para cristais, DOF só quando há macro, bloom em meia
  resolução, DPR ≤ 1.75, geometria e texturas pré-calculadas uma vez.
