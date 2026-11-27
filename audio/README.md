# Audio for the final video

The video frames rendered by the parallel jobs are **silent**. The sound
comes from here.

Put the finished audio mix for the video in this folder as **`mix.wav`**
(48 kHz, exact length of the video — see the cartoon-3d-short skill,
pipeline step 8: `mix.wav` built from `voice.wav` + synthesized SFX +
music, ducked under the voice).

The `stitch` job muxes `audio/mix.wav` into the final MP4 with ffmpeg
(`-map 0:v:0 -map 1:a:0`). If the file is missing, the stitch still
succeeds but the video comes out **silent** and the log prints a warning.

Do not commit large uncompressed audio by accident: one 60 s 48 kHz
stereo WAV is ~11 MB, fine for git. If you prefer, use `mix.mp3` instead
and change the `--audio` path in `.github/workflows/render.yml`.
