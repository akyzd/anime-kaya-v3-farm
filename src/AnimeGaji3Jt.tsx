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
 * AnimeGaji3Jt — "Gaji 3 Juta" (versi penuh, naskah orisinal, struktur
 * seperti referensi Acaaa). 164,65 dtk, 4940 frames @30fps, 1080x1920.
 * 8 segmen narasi Charon (Affiliate GO), 17 slot visual dari 16 gambar
 * anime flat (tokoh sama: pria 20-an, rambut hitam pendek, kemeja teal,
 * latar krem, palet oranye-teal). Batas potong visual diambil dari jeda
 * antar kata di timestamp Whisper (audio-charon-words.json); teks headline
 * muncul kata per kata mengikuti timestamp kata yang sebenarnya.
 * Koin emas jatuh di hook + penutup + CTA. Teks overlay di Remotion,
 * BUKAN di gambar. Bayangan krem atas 740px supaya teks selalu terbaca
 * dan tidak menimpa wajah.
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
type Visual = {
  img: string;
  dur: number;
  headline: HeadWord[][];
  headlineSize: number;
  sub: string;
  subStart: number;
};
type Segment = {
  audio: string;
  dur: number;
  visuals: Visual[];
};

const SEGMENTS: Segment[] = [
  {
    audio: 'anime-gaji3jt/audio-charon/01-hook.mp3',
    dur: 700,
    visuals: [
      {
        img: 'anime-gaji3jt/img/01.jpg',
        dur: 179,
        headline: [[{text: 'GAJIMU', appear: 46}, {text: '3', appear: 59, highlight: true}, {text: 'JUTA', appear: 68}]],
        headlineSize: 96,
        sub: 'Gajian masuk tiap awal bulan',
        subStart: 12,
      },
      {
        img: 'anime-gaji3jt/img/02.jpg',
        dur: 228,
        headline: [[{text: 'SALDO', appear: 271}], [{text: 'TINGGAL', appear: 281}, {text: 'SISA', appear: 295, highlight: true}]],
        headlineSize: 96,
        sub: 'Baru dua minggu, uang sudah menipis',
        subStart: 12,
      },
      {
        img: 'anime-gaji3jt/img/03.jpg',
        dur: 293,
        headline: [[{text: 'KAPAN', appear: 610}, {text: 'AKU', appear: 620}], [{text: 'BISA', appear: 627}, {text: 'KAYA?', appear: 634, highlight: true}]],
        headlineSize: 100,
        sub: 'Pertanyaan yang sama setiap bulan',
        subStart: 12,
      }
    ],
  },
  {
    audio: 'anime-gaji3jt/audio-charon/02-turn.mp3',
    dur: 596,
    visuals: [
      {
        img: 'anime-gaji3jt/img/04.jpg',
        dur: 596,
        headline: [[{text: 'BUKAN', appear: 63}, {text: 'SOAL', appear: 86}], [{text: 'BESAR', appear: 96}, {text: 'GAJI', appear: 118, highlight: true}]],
        headlineSize: 96,
        sub: 'Tapi cara mengaturnya',
        subStart: 12,
      }
    ],
  },
  {
    audio: 'anime-gaji3jt/audio-charon/03-budget.mp3',
    dur: 883,
    visuals: [
      {
        img: 'anime-gaji3jt/img/05.jpg',
        dur: 49,
        headline: [[{text: 'DARI', appear: 12}, {text: 'TIGA', appear: 24, highlight: true}, {text: 'JUTA', appear: 33}]],
        headlineSize: 104,
        sub: 'Dibagi ke dalam lima bagian',
        subStart: 12,
      },
      {
        img: 'anime-gaji3jt/img/06.jpg',
        dur: 135,
        headline: [[{text: '1,5', appear: 60, highlight: true}, {text: 'JUTA', appear: 77}], [{text: 'KEBUTUHAN', appear: 98}, {text: 'POKOK', appear: 112}]],
        headlineSize: 92,
        sub: 'Makan, transportasi, tempat tinggal',
        subStart: 12,
      },
      {
        img: 'anime-gaji3jt/img/07.jpg',
        dur: 336,
        headline: [[{text: '600', appear: 255, highlight: true}, {text: 'RIBU', appear: 267}], [{text: 'TABUNGAN', appear: 291}]],
        headlineSize: 100,
        sub: 'Tabungan, darurat, dan investasi',
        subStart: 12,
      },
      {
        img: 'anime-gaji3jt/img/05.jpg',
        dur: 363,
        headline: [[{text: 'SETIAP', appear: 808}, {text: 'RUPIAH', appear: 820}], [{text: 'PUNYA', appear: 831}, {text: 'TUJUAN', appear: 842, highlight: true}]],
        headlineSize: 96,
        sub: 'Setiap rupiah punya tujuan yang jelas',
        subStart: 12,
      }
    ],
  },
  {
    audio: 'anime-gaji3jt/audio-charon/04-habits.mp3',
    dur: 761,
    visuals: [
      {
        img: 'anime-gaji3jt/img/08.jpg',
        dur: 115,
        headline: [[{text: 'MEMANGKAS', appear: 39}], [{text: 'KEBIASAAN', appear: 52, highlight: true}]],
        headlineSize: 96,
        sub: 'Potong tiga kebiasaan boros',
        subStart: 12,
      },
      {
        img: 'anime-gaji3jt/img/09.jpg',
        dur: 225,
        headline: [[{text: 'TIDAK', appear: 160}, {text: 'LAGI', appear: 172}], [{text: 'NONGKRONG', appear: 301, highlight: true}]],
        headlineSize: 96,
        sub: 'Tidak demi terlihat mampu',
        subStart: 12,
      },
      {
        img: 'anime-gaji3jt/img/10.jpg',
        dur: 120,
        headline: [[{text: 'BARANG', appear: 411}, {text: 'MAHAL?', appear: 418}], [{text: 'TIDAK', appear: 428, highlight: true}]],
        headlineSize: 100,
        sub: 'Tidak demi pengakuan orang lain',
        subStart: 12,
      },
      {
        img: 'anime-gaji3jt/img/11.jpg',
        dur: 301,
        headline: [[{text: 'GAJI', appear: 585}, {text: 'BESAR', appear: 595}], [{text: 'BELUM', appear: 606}, {text: 'TENTU', appear: 613}, {text: 'KAYA', appear: 624, highlight: true}]],
        headlineSize: 84,
        sub: 'UMR belum tentu selamanya miskin',
        subStart: 12,
      }
    ],
  },
  {
    audio: 'anime-gaji3jt/audio-charon/05-enam-bulan.mp3',
    dur: 432,
    visuals: [
      {
        img: 'anime-gaji3jt/img/13.jpg',
        dur: 129,
        headline: [[{text: '6', appear: 9, highlight: true}, {text: 'BULAN', appear: 17}], [{text: 'BERLALU', appear: 27}]],
        headlineSize: 100,
        sub: 'Tabungan mulai terkumpul',
        subStart: 12,
      },
      {
        img: 'anime-gaji3jt/img/12.jpg',
        dur: 303,
        headline: [[{text: 'BELAJAR', appear: 218}], [{text: 'KETERAMPILAN', appear: 228, highlight: true}, {text: 'BARU', appear: 244}]],
        headlineSize: 88,
        sub: 'Satu penghasilan saja itu berisiko',
        subStart: 12,
      }
    ],
  },
  {
    audio: 'anime-gaji3jt/audio-charon/06-satu-tahun.mp3',
    dur: 449,
    visuals: [
      {
        img: 'anime-gaji3jt/img/14.jpg',
        dur: 449,
        headline: [[{text: '1', appear: 8, highlight: true}, {text: 'TAHUN', appear: 17}], [{text: 'KEMUDIAN', appear: 25}]],
        headlineSize: 100,
        sub: 'Punya tabungan dan kebiasaan',
        subStart: 12,
      }
    ],
  },
  {
    audio: 'anime-gaji3jt/audio-charon/07-penutup.mp3',
    dur: 734,
    visuals: [
      {
        img: 'anime-gaji3jt/img/15.jpg',
        dur: 469,
        headline: [[{text: 'BERHENTI', appear: 260}, {text: 'HIDUP', appear: 275}], [{text: 'GAJI', appear: 295, highlight: true}, {text: 'KE', appear: 304}, {text: 'GAJI', appear: 308, highlight: true}]],
        headlineSize: 84,
        sub: 'Tujuan pertama saat gaji masih UMR',
        subStart: 12,
      },
      {
        img: 'anime-gaji3jt/img/16.jpg',
        dur: 265,
        headline: [[{text: 'JANGAN', appear: 620}, {text: 'SIBUK', appear: 628}], [{text: 'TERLIHAT', appear: 638}, {text: 'KAYA', appear: 650, highlight: true}]],
        headlineSize: 92,
        sub: 'Sibuklah membangun kekayaan',
        subStart: 12,
      }
    ],
  },
  {
    audio: 'anime-gaji3jt/audio-charon/08-cta.mp3',
    dur: 385,
    visuals: [
      {
        img: 'anime-gaji3jt/img/16.jpg',
        dur: 385,
        headline: [[{text: 'JANGAN', appear: 208}, {text: 'LUPA', appear: 214}], [{text: 'FOLLOW', appear: 223, highlight: true}]],
        headlineSize: 104,
        sub: 'Belajar uang dari nol, bareng-bareng',
        subStart: 12,
      }
    ],
  }
];

function VisualSlot({visual}: {visual: Visual}) {
  const frame = useCurrentFrame();
  // frame di sini sudah relatif terhadap Sequence visual ini (0..dur-1),
  // jadi langsung dipakai sebagai local — bukan dikurangi slotStart lagi
  // (di v3 pengurangan itu membuat zoom/drift diam karena nilai negatif).
  const local = frame;
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

  // visual aktif saat ini di dalam segmen
  let from = 0;
  let active: Visual = segment.visuals[0];
  let activeStart = 0;
  for (const v of segment.visuals) {
    if (frame >= from && frame < from + v.dur) {
      active = v;
      activeStart = from;
      break;
    }
    from += v.dur;
  }
  const localFrame = frame - activeStart;

  const subP = interpolate(
    localFrame,
    [active.subStart, active.subStart + 20],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const subY = interpolate(
    localFrame,
    [active.subStart, active.subStart + 20],
    [16, 0],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  let vfrom = 0;
  return (
    <AbsoluteFill style={{backgroundColor: CREAM, overflow: 'hidden'}}>
      {segment.visuals.map((visual, i) => {
        const start = vfrom;
        vfrom += visual.dur;
        return (
          <Sequence key={i} from={start} durationInFrames={visual.dur}>
            <VisualSlot visual={visual} />
          </Sequence>
        );
      })}
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
        <div
          style={{
            fontFamily: SANS,
            fontWeight: 800,
            fontSize: active.headlineSize,
            lineHeight: 1.04,
            color: INK,
            textShadow: '0 3px 0 rgba(255,255,255,0.65)',
          }}
        >
          {active.headline.map((line, li) => (
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
          {active.sub}
        </div>
      </div>
      <Audio src={staticFile(segment.audio)} />
    </AbsoluteFill>
  );
}

export const AnimeGaji3Jt: React.FC = () => {
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
