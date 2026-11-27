#!/usr/bin/env python3
"""Stitch parallel-rendered frame chunks into the final MP4.

Usage:
    python3 scripts/stitch.py --frames-dir frames --fps 30 \\
        --audio audio/mix.wav --output final.mp4 \\
        --total-frames 2025 --crf 16

What it does:
  1. Finds every element-<frame>.jpg/.jpeg/.png under --frames-dir.
     Frame files are named by their GLOBAL frame number by Remotion
     (element-000.jpg ... element-2024.jpg), but the zero-padding width
     differs per chunk (it depends on the largest frame in that chunk),
     so plain alphabetical sorting would mis-order frames (e.g.
     element-100.jpg sorts before element-99.jpg). We sort NUMERICALLY
     by the frame number in the filename instead.
  2. Verifies the frames are contiguous 0..N-1 (or match --total-frames).
     A missing frame fails loudly instead of producing a video with a
     jump in it.
  3. Runs ffmpeg: the frames are linked into a temp dir with uniform
     sequential names (frame-000000.jpg ...) and fed to ffmpeg's image2
     demuxer at --fps -> libx264 (CRF --crf, yuv420p for max player
     compatibility) + the audio mix muxed in. (The concat demuxer was
     NOT used: it rejects `-framerate` and needs per-file durations.)
     If --audio is missing, the video is rendered silent with a warning.

Exit code is non-zero on any failure (missing frames, ffmpeg error,
frame-count mismatch on the output).
"""

import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

FRAME_RE = re.compile(r"^element-(\d+)\.(jpe?g|png)$", re.IGNORECASE)


def find_frames(frames_dir: Path) -> list[tuple[int, Path]]:
    found: list[tuple[int, Path]] = []
    for path in sorted(frames_dir.rglob("*")):
        if not path.is_file():
            continue
        m = FRAME_RE.match(path.name)
        if m:
            found.append((int(m.group(1)), path))
    found.sort(key=lambda item: item[0])
    return found


def check_contiguous(frames: list[tuple[int, Path]], total_frames: int | None) -> None:
    if not frames:
        raise SystemExit("error: no element-<frame>.jpg/.png frames found")
    numbers = [n for n, _ in frames]
    if len(set(numbers)) != len(numbers):
        raise SystemExit("error: duplicate frame numbers found")
    if numbers[0] != 0:
        raise SystemExit(f"error: first frame is {numbers[0]}, expected 0")
    expected_end = (total_frames - 1) if total_frames else numbers[-1]
    if numbers[-1] != expected_end:
        raise SystemExit(
            f"error: last frame is {numbers[-1]}, expected {expected_end}"
        )
    if len(numbers) != expected_end + 1:
        missing = sorted(set(range(expected_end + 1)) - set(numbers))
        raise SystemExit(f"error: {len(missing)} missing frames, e.g. {missing[:10]}")
    print(f"frames: {len(numbers)} contiguous frames (0..{expected_end})")


def run(cmd: list[str]) -> None:
    print("+ " + " ".join(cmd))
    result = subprocess.run(cmd, check=False)
    if result.returncode != 0:
        raise SystemExit(f"error: command failed (exit {result.returncode})")


def probe_frame_count(video: Path) -> int:
    result = subprocess.run(
        [
            "ffprobe", "-v", "error", "-select_streams", "v:0",
            "-count_frames", "-show_entries", "stream=nb_read_frames",
            "-of", "json", str(video),
        ],
        capture_output=True, text=True, check=False,
    )
    if result.returncode != 0:
        raise SystemExit(f"error: ffprobe failed: {result.stderr.strip()}")
    try:
        return int(json.loads(result.stdout)["streams"][0]["nb_read_frames"])
    except (KeyError, IndexError, ValueError) as exc:
        raise SystemExit(f"error: could not read frame count from ffprobe: {exc}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--frames-dir", type=Path, required=True)
    parser.add_argument("--fps", type=int, default=30)
    parser.add_argument("--audio", type=Path, default=None,
                        help="final audio mix (e.g. audio/mix.wav); omit for silent video")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--total-frames", type=int, default=None)
    parser.add_argument("--crf", type=int, default=16)
    args = parser.parse_args()

    frames = find_frames(args.frames_dir)
    check_contiguous(frames, args.total_frames)

    audio = args.audio
    if audio is not None and not audio.is_file():
        print(f"warning: audio file {audio} not found, rendering silent video")
        audio = None

    # Link frames into a temp dir with uniform sequential names so
    # ffmpeg's image2 demuxer can read them as one sequence
    # (frame-%06d.jpg). Symlinks, not copies: ~2000 JPEGs, no extra disk.
    tmpdir = tempfile.mkdtemp(prefix="stitch-frames-")
    try:
        for i, (_, path) in enumerate(frames):
            os.symlink(path.resolve(), Path(tmpdir) / f"frame-{i:06d}{path.suffix}")
        pattern = str(Path(tmpdir) / ("frame-%06d" + frames[0][1].suffix))

        cmd = [
            "ffmpeg", "-y",
            "-framerate", str(args.fps),
            "-i", pattern,
        ]
        if audio is not None:
            cmd += ["-i", str(audio)]
        cmd += [
            "-map", "0:v:0",
            "-c:v", "libx264", "-crf", str(args.crf),
            "-pix_fmt", "yuv420p",
        ]
        if audio is not None:
            cmd += ["-map", "1:a:0", "-c:a", "aac", "-b:a", "192k", "-shortest"]
        cmd += ["-movflags", "+faststart", str(args.output)]
        run(cmd)
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)

    actual = probe_frame_count(args.output)
    expected = args.total_frames if args.total_frames else len(frames)
    print(f"output: {args.output} ({actual} frames)")
    if actual != expected:
        raise SystemExit(
            f"error: output has {actual} frames, expected {expected}"
        )
    print("stitch OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
