#!/usr/bin/env bash
# MP4 final: loudness em 2 passes (−16 LUFS / −1 dBTP) + H.264 BT.709 + storyboard/hero.
set -euo pipefail
cd "$(dirname "$0")/../output"
OUT=KG_LimpaPontas_Leve2Pague1_1920x1080_18s8.mp4
J=$(ffmpeg -hide_banner -nostats -i kg_sound_design.wav -af loudnorm=I=-16:TP=-1.0:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
val() { echo "$J" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
LN="loudnorm=I=-16:TP=-1.0:LRA=11:measured_I=$(val input_i):measured_TP=$(val input_tp):measured_LRA=$(val input_lra):measured_thresh=$(val input_thresh):offset=$(val target_offset):linear=true"
ffmpeg -hide_banner -loglevel error -y -framerate 30 -i frames/%05d.png -i kg_sound_design.wav \
  -filter_complex "[0:v]scale=out_color_matrix=bt709:out_range=tv:flags=lanczos+accurate_rnd+full_chroma_int,format=yuv420p[v];[1:a]$LN,aresample=48000[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -preset slow -crf 15 -profile:v high -level 4.2 -tune film \
  -x264-params "colorprim=bt709:transfer=bt709:colormatrix=bt709" -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 256k -movflags +faststart -shortest "$OUT"
python3 ../tools/storyboard.py
ffprobe -v error -show_entries format=duration,bit_rate:stream=codec_name,width,height,r_frame_rate -of compact "$OUT"
