# KG SORENSEN · Limpa Pontas KG · Motion "Leve 2. Pague 1."

Motion advertising de 18,8 s construído a partir da master visual (`master/master_visual.webp`).
O tratamento criativo completo (análise, decupagem, tipografia, câmera e cue sheet de áudio) está em **[TRATAMENTO.md](TRATAMENTO.md)**.

- Filme: `output/KG_LimpaPontas_Leve2Pague1_1920x1080_18s8.mp4`
- Storyboard: `output/storyboard.png` · Hero: `output/hero_frame.png`
- Player com scrub: sirva esta pasta (`npx http-server .`) e abra `/src/index.html`

## Pipeline

```bash
pip install numpy pillow scipy opencv-python-headless
python3 tools/prep_layers.py              # 1. camadas pixel-fiéis a partir da master → assets/layers/
python3 tools/sound_design.py             # 2. sound design sintetizado → output/kg_sound_design.wav
node tools/render.mjs --workers 3         # 3. quadros PNG (Chromium headless) → output/frames/
node tools/render.mjs --stills 9.86,17.5  #    (ou só alguns quadros de revisão)
bash tools/encode.sh                      # 4. MP4 final (loudness −16 LUFS, BT.709) + storyboard
```

| Pasta | Conteúdo |
|---|---|
| `master/` | Arte-mestre (referência absoluta) |
| `assets/layers/` | Plates, sprites de produto e tipografia + `manifest.json` (coordenadas na master) |
| `assets/fonts/` | IBM Plex Mono, usada só na microtipografia do HUD (OFL) |
| `src/` | Motor de animação determinístico (`engine.js`) e player (`index.html`) |
| `tools/` | Extração de camadas, render, áudio e encode |
| `output/` | Entregáveis |
