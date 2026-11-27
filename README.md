# Farm Render — AnimeKayaV3 ("3 Pengeluaran yang Justru Bikin Kaya")

Repo siap-push untuk merender video motion graphics **AnimeKayaV3** (50 detik,
1080x1920, 30 fps, 1500 frame) di **GitHub Actions paralel** — 10 mesin
merender bersamaan, lalu frame dijahit jadi satu MP4 dengan narasi.

Workflow ini diadaptasi dari template publik
[Cukurzembood/geosfacts-render](https://github.com/Cukurzembood/geosfacts-render)
(farm render Remotion paralel). Proyek Remotion di dalamnya sudah diganti
dengan AnimeKayaV3 (React 18, Remotion 4.0.545): 9 slot visual hard cut,
teks kata per kata sinkron presisi (timestamp Whisper), narasi Charon.

## Cara pakai

1. **Buat repo baru di GitHub** (gratis), nama bebas, misal
   `anime-kaya-v3-farm`. Pilih **Public** — repo publik dapat menit
   GitHub Actions gratis tanpa batas. (Repo privat cuma dapat 2.000
   menit/bulan; satu render ini makan ~50–100 menit.)
2. **Upload isi folder ini** ke repo itu. Paling gampang lewat web GitHub:
   buka repo baru → *Add file → Upload files* → seret semua isi folder
   ini (termasuk folder tersembunyi `.github`). Atau lewat git:
   `git init && git add . && git commit -m "farm v3" && git push`.
3. Buka tab **Actions** → workflow **Render AnimeKayaV3 (parallel)** →
   **Run workflow**. Isiannya sudah benar sebagai default:
   composition `AnimeKayaV3`, total frame `1500`, chunk `10`.
4. Tunggu sampai selesai (perkiraan ±10–25 menit). Hasilnya ada di
   artifact **`final-video`** → `final.mp4` (tersimpan 7 hari, unduh
   sebelum kedaluwarsa).
5. Kalau ada satu-dua chunk yang gagal, pakai **Re-run failed jobs** —
   tidak perlu mengulang dari awal.

## Isi repo

- `.github/workflows/render.yml` — workflow paralel (prepare → 10x render
  → stitch). Sudah termasuk install font Noto Sans/Serif di runner
  supaya headline tampil sama seperti render lokal.
- `src/` — komposisi `AnimeKayaV3` saja (1500 frame, 30 fps, 1080x1920).
- `public/anime/` — 8 gambar adegan + 5 segmen audio Charon.
- `audio/mix.wav` — narasi lengkap 50,0 detik (48 kHz, gabungan 5 segmen),
  di-mux ke video final oleh job stitch.
- `scripts/compute-chunks.py`, `scripts/stitch.py` — pembagi chunk dan
  penjahit frame + audio (ffmpeg).
- `package.json` / `package-lock.json` — dependensi Remotion (diinstall
  otomatis di runner dengan `npm ci`).

## Catatan

- Frame dirender **tanpa audio** (bisunya gambar saja); suara baru masuk
  di tahap stitch dari `audio/mix.wav`. Itu memang desain template ini.
- Kalau mau render ulang dengan perubahan gambar/narasi: ganti file di
  `public/anime/` atau `src/AnimeKayaV3.tsx`, commit + push, lalu jalankan
  workflow lagi. Tidak perlu mengubah `total_frames` selama durasi tetap
  50 detik (1500 frame).

## Catatan: file .b64

Gambar (JPG) dan audio narasi (MP3) disimpan di repo ini dalam bentuk
base64 (`.b64`) karena upload lewat konektor GitHub Muse hanya mendukung
file teks. Workflow mendekode semuanya kembali ke bentuk asli sebelum
render (langkah "Decode base64 assets"). `audio/mix.wav` tidak disimpan
di repo — dirakit workflow dari 5 MP3 narasi saat render (langkah
"Build mix.wav"), jadi hasil render sama persis dengan file aslinya.
