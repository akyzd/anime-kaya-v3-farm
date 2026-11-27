#!/usr/bin/env python3
"""Split a frame range into N contiguous chunks for the GitHub Actions matrix.

Usage:
    python3 scripts/compute-chunks.py --total-frames 2025 --chunks 10

Prints one line of JSON to stdout:
    {"include": [{"chunk": 0, "start": 0, "end": 202}, ...]}

Ranges are inclusive and cover [0, total_frames) with no gaps or overlaps.
Chunk sizes differ by at most 1 frame. The JSON shape is exactly what
`strategy.matrix: ${{ fromJSON(...) }}` expects in the workflow.
"""

import argparse
import json
import sys


def compute_chunks(total_frames: int, chunks: int) -> list[dict]:
    if total_frames <= 0:
        raise ValueError("total-frames must be > 0")
    if chunks <= 0:
        raise ValueError("chunks must be > 0")
    chunks = min(chunks, total_frames)
    base, extra = divmod(total_frames, chunks)
    out = []
    start = 0
    for i in range(chunks):
        size = base + (1 if i < extra else 0)
        out.append({"chunk": i, "start": start, "end": start + size - 1})
        start += size
    return out


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--total-frames", type=int, required=True)
    parser.add_argument("--chunks", type=int, required=True)
    args = parser.parse_args()
    try:
        chunks = compute_chunks(args.total_frames, args.chunks)
    except ValueError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2
    print(json.dumps({"include": chunks}, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
