import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

/*
 * AnimeKayaV3 — "3 Pengeluaran yang Justru Bikin Kaya"
 * v3 vs v2: potongan LEBIH CEPAT — tiap segmen narasi dipecah jadi 2-3 visual
 * (total 9 slot visual dari 8 gambar berbeda, hard cut antar visual), teks
 * headline muncul kata per kata mengikuti TIMESTAMP KATA yang sebenarnya
 * dari audio-charon-words.json (Whisper, sinkron presisi — bukan bagi rata
 * seperti v2), koin emas jatuh di adegan hook + penutup, dan pop-in lebih
 * kuat pada badge nomor + kata highlight. Canvas 1080x1920, 30fps,
 * 1500 frames (50,0 dtk). Desain v2 dipertahankan (bayangan krem atas 740px,
 * headline Noto Sans ExtraBold hitam + satu kata highlight oranye, badge
 * nomor oranye adegan 2-4, sub-line serif italic teal). Teks overlay di
 * Remotion, BUKAN di gambar. Teks harus tetap di atas bayangan krem dan
 * TIDAK menimpa wajah (pelajaran v1/v2).
 *
 * Slot visual (frame relatif segmen, 30fps):
 *  S1 hook 194f: hook lama 0-194
 *  S2 koneksi 407f: koneksi lama 0-79 | traktir baru 79-181 | pintu baru 181-407
 *  S3 nutrisi 316f: nutrisi lama 0-178 | nutrisi-sehat baru 178-316
 *  S4 branding 320f: branding lama 0-145 | branding-rapi baru 145-320
 *  S5 penutup 263f: hook lama 0-263
 * Batas potong diambil dari jeda antar kalimat di timestamp kata.
 */

const CREAM = '#f2efe6';
const INK = '#141414';
const ORANGE = '#ff4d1c';
const TEAL = '#0f766e';
const WHITE = '#ffffff';
const GOLD_DARK = '#b45309';
const GOLD = '#f5b301';
const GOLD_LIGHT = '#ffe082';

const SANS = "'Noto Sans', sans-serif";
const SERIF = "'Noto Serif', serif";

const pop = (frame: number, fps: number) =>
  spring({frame, fps, config: {damping: 18, stiffness: 200, mass: 0.9}});

type HeadWord = {text: string; appear: number; highlight?: boolean};
type Visual = {img: string; dur: number};
type Segment = {
  audio: string;
  dur: number;
  badge?: string;
  headline: HeadWord[][];
  headlineSize: number;
  sub: string;
  subStart: number;
  visuals: Visual[];
  coins?: boolean;
};

const IMG_HOOK =
  'anime/img/media-generation-adegan-1-hook-0-49f1db1a-3f2f-49a3-90e9-223b82533fe8.jpg';
const IMG_KONEKSI =
  'anime/img/media-generation-adegan-2-koneksi-0-d6a8a5de-2a29-4e61-8166-93644824d656.jpg';
const IMG_NUTRISI =
  'anime/img/media-generation-adegan-3-nutrisi-0-592e7186-6e72-4578-9210-0b469b3b36de.jpg';
const IMG_BRANDING =
  'anime/img/media-generation-adegan-4-branding-0-5a018058-97d6-47a9-a37c-c8278d9e945e.jpg';
const IMG_TRAKTIR =
  'anime/img/media-generation-v3-koneksi-traktir-0-2a503576-83a9-41f1-8640-03e467945f56.jpg';
const IMG_PINTU =
  'anime/img/media-generation-v3-koneksi-pintu-0-d5267b18-868e-46f1-9139-89cdbabf85a1.jpg';
const IMG_SEHAT =
  'anime/img/media-generation-v3-nutrisi-sehat-0-695cbea7-08b2-45d6-9d4d-f5b4debd2b26.jpg';
const IMG_RAPI =
  'anime/img/media-generation-v3-branding-rapi-0-18a2c72f-c673-4a27-8c8d-f4e374998ca8.jpg';

const SEGMENTS: Segment[] = [
  {
    audio: 'anime/audio-charon/01-hook.mp3',
    dur: 194,
    headline: [
      [{text: 'JANGAN', appear: 0}],
      [{text: 'PELIT!', appear: 16, highlight: true}],
    ],
    headlineSize: 118,
    sub: '3 pengeluaran ini justru bikin kaya',
    subStart: 28,
    visuals: [{img: IMG_HOOK, dur: 194}],
    coins: true,
  },
  {
    audio: 'anime/audio-charon/02-koneksi.mp3',
    dur: 407,
    badge: '1',
    headline: [[{text: 'KONEKSI', appear: 42}]],
    headlineSize: 108,
    sub: 'Rezeki datang lewat orang lain',
    subStart: 54,
    visuals: [
      {img: IMG_KONEKSI, dur: 79},
      {img: IMG_TRAKTIR, dur: 102},
      {img: IMG_PINTU, dur: 226},
    ],
  },
  {
    audio: 'anime/audio-charon/03-nutrisi.mp3',
    dur: 316,
    badge: '2',
    headline: [
      [
        {text: 'MAKAN', appear: 42},
        {text: 'YANG', appear: 48},
      ],
      [{text: 'LAYAK', appear: 56}],
    ],
    headlineSize: 92,
    sub: 'Badan sehat, otak encer',
    subStart: 68,
    visuals: [
      {img: IMG_NUTRISI, dur: 178},
      {img: IMG_SEHAT, dur: 138},
    ],
  },
  {
    audio: 'anime/audio-charon/04-branding.mp3',
    dur: 320,
    badge: '3',
    headline: [[{text: 'PENAMPILAN', appear: 42}]],
    headlineSize: 104,
    sub: 'Rapi dan bersih, bukan mahal',
    subStart: 54,
    visuals: [
      {img: IMG_BRANDING, dur: 145},
      {img: IMG_RAPI, dur: 175},
    ],
  },
  {
    audio: 'anime/audio-charon/05-penutup.mp3',
    dur: 263,
    headline: [
      [
        {text: 'MANA', appear: 176},
        {text: 'YANG', appear: 180},
        {text: 'PALING', appear: 186},
      ],
      [
        {text: 'SERING', appear: 191},
        {text: 'KAMU', appear: 200},
      ],
      [{text: 'KORBANKAN?', appear: 206, highlight: true}],
    ],
    headlineSize: 78,
    sub: 'Tulis di komen!',
    subStart: 218,
    visuals: [{img: IMG_HOOK, dur: 263}],
    coins: true,
  },
];

/* Koin emas jatuh perlahan (SVG/CSS murni) — dipakai di hook + penutup.
 * Koin jatuh di area gambar (y 700-1920, di bawah bayangan krem/teks),
 * berputar ringan + bergoyang, lalu mengulang (loop) sepanjang segmen. */
const COINS = [
  {x: 90, size: 64, fallDur: 150, offset: 0, sway: 22},
  {x: 300, size: 48, fallDur: 120, offset: 45, sway: 16},
  {x: 480, size: 78, fallDur: 170, offset: 90, sway: 26},
  {x: 660, size: 54, fallDur: 130, offset: 20, sway: 18},
  {x: 830, size: 84, fallDur: 160, offset: 70, sway: 24},
  {x: 960, size: 58, fallDur: 140, offset: 110, sway: 20},
  {x: 180, size: 44, fallDur: 110, offset: 130, sway: 14},
];

function CoinFall({segmentDur}: {segmentDur: number}) {
  const frame = useCurrentFrame();
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
      {COINS.map((c, i) => {
        const progress = ((frame + c.offset) % c.fallDur) / c.fallDur;
        const y = 700 + progress * 1350;
        const x = c.x + Math.sin(progress * Math.PI * 4 + i) * c.sway;
        const rot = progress * 360 * (i % 2 === 0 ? 1 : -1);
        const opacity = interpolate(progress, [0, 0.08, 0.85, 1], [0, 1, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: c.size,
              height: c.size,
              opacity,
              transform: `rotate(${rot}deg)`,
            }}
          >
            <svg width={c.size} height={c.size} viewBox="0 0 100 100">
              <defs>
                <radialGradient id={`gold-${i}`} cx="35%" cy="30%" r="75%">
                  <stop offset="0%" stopColor={GOLD_LIGHT} />
                  <stop offset="45%" stopColor={GOLD} />
                  <stop offset="100%" stopColor={GOLD_DARK} />
                </radialGradient>
              </defs>
              <circle
                cx="50"
                cy="50"
                r="46"
                fill={`url(#gold-${i})`}
                stroke={GOLD_DARK}
                strokeWidth="5"
              />
              <circle
                cx="50"
                cy="50"
                r="34"
                fill="none"
                stroke={GOLD_DARK}
                strokeWidth="3"
                opacity="0.55"
              />
              <text
                x="50"
                y="64"
                textAnchor="middle"
                fontSize="30"
                fontWeight="800"
                fill={GOLD_DARK}
                fontFamily={SANS}
              >
                Rp
              </text>
            </svg>
          </div>
        );
      })}
      {segmentDur > 0 ? null : null}
    </div>
  );
}

function VisualSlot({visual, slotStart}: {visual: Visual; slotStart: number}) {
  const frame = useCurrentFrame();
  const local = frame - slotStart;
  const zoom = interpolate(local, [0, visual.dur], [1.0, 1.08], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const driftY = interpolate(local, [0, visual.dur], [0, -14], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <Img
      src={staticFile(visual.img)}
      style={{
        width: 1080,
        height: 1920,
        objectFit: 'cover',
        transform: `scale(${zoom}) translateY(${driftY}px)`,
      }}
    />
  );
}

function SegmentView({segment}: {segment: Segment}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const subP = interpolate(frame, [segment.subStart, segment.subStart + 20], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const subY = interpolate(frame, [segment.subStart, segment.subStart + 20], [16, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const badgeP = pop(frame - 2, fps);

  let from = 0;
  return (
    <AbsoluteFill style={{backgroundColor: CREAM, overflow: 'hidden'}}>
      {segment.visuals.map((visual, i) => {
        const start = from;
        from += visual.dur;
        return (
          <Sequence key={i} from={start} durationInFrames={visual.dur}>
            <VisualSlot visual={visual} slotStart={start} />
          </Sequence>
        );
      })}
      {/* soft top shade so the headline always reads */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 740,
          background:
            'linear-gradient(to bottom, rgba(242,239,230,0.96) 0%, rgba(242,239,230,0.85) 55%, rgba(242,239,230,0) 100%)',
        }}
      />
      {segment.coins && <CoinFall segmentDur={segment.dur} />}
      <div
        style={{
          position: 'absolute',
          top: 150,
          left: 47,
          right: 47,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {segment.badge && (
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: 46,
              backgroundColor: ORANGE,
              color: WHITE,
              fontFamily: SANS,
              fontWeight: 800,
              fontSize: 52,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 22,
              opacity: badgeP,
              transform: `scale(${interpolate(badgeP, [0, 1], [0.5, 1.12])})`,
              boxShadow: '0 6px 0 rgba(0,0,0,0.18)',
            }}
          >
            {segment.badge}
          </div>
        )}
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: segment.headlineSize,
            lineHeight: 1.04,
            color: INK,
            textShadow: '0 3px 0 rgba(255,255,255,0.65)',
          }}
        >
          {segment.headline.map((line, li) => (
            <div key={li}>
              {line.map((word, wi) => {
                const p = pop(frame - word.appear, fps);
                const fromScale = word.highlight ? 1.3 : 0.85;
                return (
                  <span
                    key={wi}
                    style={{
                      display: 'inline-block',
                      color: word.highlight ? ORANGE : INK,
                      opacity: p,
                      transform: `scale(${interpolate(p, [0, 1], [fromScale, 1])})`,
                      marginRight: '0.28em',
                      textShadow: word.highlight
                        ? '0 0 26px rgba(255,77,28,0.45), 0 3px 0 rgba(255,255,255,0.65)'
                        : '0 3px 0 rgba(255,255,255,0.65)',
                    }}
                  >
                    {word.text}
                  </span>
                );
              })}
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 26,
            fontFamily: SERIF,
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 46,
            lineHeight: 1.25,
            color: TEAL,
            opacity: subP,
            transform: `translateY(${subY}px)`,
            textShadow: '0 2px 0 rgba(255,255,255,0.6)',
          }}
        >
          {segment.sub}
        </div>
      </div>
      <Audio src={staticFile(segment.audio)} />
    </AbsoluteFill>
  );
}

export const AnimeKayaV3: React.FC = () => {
  let from = 0;
  return (
    <AbsoluteFill style={{backgroundColor: CREAM}}>
      {SEGMENTS.map((segment, i) => {
        const start = from;
        from += segment.dur;
        return (
          <Sequence key={i} from={start} durationInFrames={segment.dur}>
            <SegmentView segment={segment} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
