# KG Sorensen — Ponta Diamantada FG · filme de produto

Filme de produto da **ponta diamantada FG KG Sorensen** em dois formatos que
compartilham o mesmo modelo 3D procedural:

| Modo | O que é | Onde |
|---|---|---|
| **B — Experiência scroll + 3D** | Página única, viewport fixo. O scroll controla uma timeline cinematográfica com 11 beats: escuridão, revelação, macro, vista explodida, travessia, núcleo, remontagem, variações, cuidado, partículas e final interativo. | `experience/` |
| **A — Vídeo Remotion** | 1080×1920 (9:16), 30 fps, 45 s, cenas `Scene01Dark` … `Scene09Final`, SFX sintetizados. | `video/` |

A bíblia criativa e técnica (paleta, tipografia, roteiro, anatomia da ponta,
o que pode e o que não pode ser afirmado) está em [`DIRECTION.md`](DIRECTION.md).
O prompt mestre original está em [`assets/PROMPT-MESTRE.md`](assets/PROMPT-MESTRE.md).

## O herói, construído em código

Não há nenhum modelo 3D externo. Tudo em `shared/` é procedural e determinístico:

- **Geometria** (`shared/bur/profiles.ts`, `geometry.ts`): haste FG Ø 1,60 mm com
  chanfro, pescoço torneado e cabeça em 4 formatos (esférica, chama, cilíndrica,
  tronco-cônica), núcleo de aço, matriz metálica e cristais de diamante
  distribuídos por Poisson. A quantidade de cristais vem da granulação e da área real.
- **Materiais** (`materials.ts`, `textures.ts`, `fx.ts`): aço inox torneado com
  anisotropia; marcação a laser em alta resolução com o **logo oficial KG** e o lote
  `HL031234` do pôster; matriz de níquel; cristais facetados; anel de identificação.
  Dois shaders da casa cobrem todo o rig: o rim-light lima do pôster e um dissolve
  com borda luminosa.
- **Palco** (`shared/stage/`): estúdio fotográfico procedural (softbox, strips e
  cards) em PMREM, fundo pintado por shader, grid técnico, título monumental
  dentro da cena 3D (a ponta o encobre), DOF fotográfico só nas macros, bloom, grão,
  diamante do núcleo com shader facetado de dispersão, partículas da superfície,
  bloco Limpa Pontas com a impressão oficial e detritos.
- **Contrato**: `FilmRenderer.render(state)` desenha um `FilmState`
  (`shared/stage/state.ts`). O modo B gera o estado a partir do scroll
  (`shared/timeline/film.ts`) e o modo A a partir do frame.

## Rodar

```bash
cd kg-sorensen-film
npm install

# Modo B — experiência
npm run dev            # http://127.0.0.1:5173/
npm run build          # build estático em dist/experience
SINGLE=1 npm run build # um único HTML autocontido em dist/single/index.html

# Modo A — vídeo
npm run studio         # Remotion Studio (abre sem navegador: --no-open)
npm run stills -- 0 150 300  # stills de validação (ver video/scripts/stills.mjs)
```

O render final do vídeo **não** é feito automaticamente. Quando aprovado no Studio:
`npx remotion render video/src/index.ts KGSorensenFG out/kg-sorensen-fg.mp4`.

### Debug do modo B

- `?t=0.42` abre o filme naquele ponto (0 a 1); `?debug` liga o HUD; tecla **D** alterna o HUD.
- `window.__film.seek(0.42)` pula para qualquer ponto pelo console.
- `?snap=1&shot=1&dpr=1` desliga a inércia e congela o tempo (para screenshots).
- `node tools/shoot-film.mjs <saida> 1600 900 0.1 0.5 0.99` fotografa pontos do filme
  em Chromium headless (WebGL por software; com GPU real roda a 60 fps).

## Interação na cena final

Ao fim do scroll a página entrega o controle: o mouse dá paralaxe e gira a ponta
sutilmente, arrastar inspeciona e a ponta volta ao centro com mola. O seletor
**Forma** (4) × **Granulação** (4) troca o modelo ao vivo com a varredura laser, e o
fundo acompanha a cor do anel. O CTA abre a orientação "Peça ao seu representante".

## Copy e claims

Todas as frases vêm das peças da marca (pôster da promoção FG, foto "Ciência &
Precisão", anúncio Limpa Pontas) ou são fatos técnicos gerais: haste FG Ø 1,60 mm,
aço inoxidável, diamante dureza 10 Mohs, código de cores de granulação, turbina de
alta rotação ≈ 300.000 rpm. O contador da vista explodida mostra os cristais **do
modelo** (estimativa pela granulação). Nenhum preço, telefone ou link foi inventado.
A oferta Limpa Pontas (Leve 2, Pague 1, 2 unidades por R$ 11,60, Ref. 1810.7021)
reproduz o anúncio enviado e deve ser revista antes de cada veiculação.
