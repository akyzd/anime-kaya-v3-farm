import React from 'react';
import {Composition} from 'remotion';
import {AnimeKayaV3} from './AnimeKayaV3';

// AnimeKayaV3: "3 Pengeluaran yang Justru Bikin Kaya"
// 1080x1920 vertical, 30 fps, 1500 frames = 50,0 dtk.
// Narasi Charon (Affiliate GO), teks kata per kata sinkron presisi
// (timestamp Whisper), 9 slot visual hard cut.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="AnimeKayaV3"
        component={AnimeKayaV3}
        durationInFrames={1500}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
