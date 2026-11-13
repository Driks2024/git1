# Projeto Escovas Premium · apresentação web

Apresentação executiva navegável da proposta de escovas premium para **Dental Partner e Odontoprev**: produto, kit expositor, modelo comercial, implantação em 5 meses e alcance potencial. Linguagem visual e efeitos inspirados no padrão de designbybrandin.com (tipografia monumental, painéis de cor fixos com parallax em camadas, listas com imagem que segue o cursor, fundos pontilhados em WebGL), com conteúdo, marcas e cores da proposta.

**Status:** proposta para discussão. Imagens e cenas 3D são representações conceituais.

## Requisitos

- Node.js 20 ou superior (testado com Node 22.23)
- npm 10

## Comandos

```bash
npm install
npm run dev          # servidor de desenvolvimento (http://localhost:5173)
npm run typecheck    # TypeScript estrito
npm run lint         # ESLint
npm run test         # testes de domínio (Vitest): cálculos e 5.460 cerdas
npm run build        # versão de produção em dist/
npm run preview      # serve dist/ em http://localhost:4173
npm run build:single # um único HTML autocontido em dist-single/index.html
npm run test:e2e     # teste de fumaça no navegador (com o preview rodando; requer Playwright)
```

`dist-single/index.html` funciona aberto direto do disco, sem internet: imagens, fontes e 3D vão embutidos (cerca de 2,8 MB).

## Navegação

| Ação | Como |
|---|---|
| Próximo / anterior capítulo | → / ← ou PageDown / PageUp |
| Início / fim | Home / End |
| Índice de capítulos | botão de menu (duas linhas) no canto superior direito |
| Modo apresentação | "Iniciar apresentação": tela cheia e controles na base da tela; Esc sai |
| Premissas e fontes | "Abrir premissas" (capítulo 09, encerramento ou índice) |
| Modo leve | no índice: troca o 3D e os fundos animados por imagens estáticas |
| Link direto | `#economia`, `#implantacao`, `#alcance` etc. |

Com "reduzir movimento" ativado no sistema, a página não fixa cenas, não usa parallax nem rolagem suave e mostra todo o conteúdo imediatamente.

## Estrutura

```
src/
  app/        App (navegação, teclado, modos) e Shell (cabeçalho, índice, premissas)
  chapters/   10 capítulos: Opening, Network, Product, Kit, Activation,
              Economics, Rollout, Reach, Conditions, Closing
  components/ efeitos reutilizáveis: Reveal, Scramble, DrenchPanel, HoverList,
              DitherCanvas (WebGL puro), Accordion, InlineStatement, FitText...
  content/    claims.ts (todos os números com status e fonte), chapters.ts, images.ts
  domain/     economics.ts, rollout.ts, reach.ts, money.ts (centavos inteiros) + testes
  scene/      3D (React Three Fiber): escova procedural com 5.460 cerdas
              instanciadas, kit explodido, luzes locais, fallback para imagem
  styles/     tokens.css (cores, fontes, camadas) e global.css
docs/         CONTENT_AUDIT.md, ASSET_MANIFEST.md, QA_REPORT.md
scripts/      smoke.cjs (teste de fumaça no navegador)
```

## Como trocar por arquivos definitivos

- **Escova 3D:** `src/scene/brushGeometry.ts` define o contorno e a área das cerdas; `src/scene/Brush.tsx` monta a escova. Para usar um GLB oficial, carregue-o com `useGLTF` em `ProductScene.tsx` no lugar de `<HeroBrush>`. Pivô na ponta do cabo, eixo +Y para a cabeça, cerdas para +Z, comprimento 6 unidades.
- **Expositor 3D:** `Display()` em `src/scene/KitScene.tsx` (medidas nas constantes `W`, `FRONT_H`, `BACK_H`, `D`).
- **Imagens:** troque os arquivos em `src/assets/img/` mantendo os nomes, ou edite `src/content/images.ts`.
- **Logos:** `src/assets/brand/`. Os arquivos atuais são JPEG de baixa resolução; prefira os SVG oficiais.
- **Números e textos:** `src/content/claims.ts` e as premissas em `src/domain/*.ts`. Os testes em `src/domain/domain.test.ts` acusam qualquer conta que mude.
- **Fonte:** a pilha usa SF Pro do sistema (Apple) e Zalando Sans autohospedada como reserva. Para embutir os OTF da SF Pro, adicione `@font-face` em `src/styles/tokens.css` com os arquivos licenciados.
