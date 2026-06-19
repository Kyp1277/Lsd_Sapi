# LSD Sapi Frontend

Frontend statis untuk skrining visual Lumpy Skin Disease pada sapi. Aplikasi
mengirim gambar ke backend FastAPI/YOLOv8 di Hugging Face Spaces dan menampilkan
bounding box, kelas, serta confidence hasil deteksi.

## Backend

`https://kypli-lsd-sapi-api.hf.space`

## Teknologi Deteksi (YOLOv8)

Proyek ini menggunakan model deteksi objek **YOLOv8 (You Only Look Once version 8)** dari Ultralytics untuk mendeteksi gejala klinis Lumpy Skin Disease (LSD) pada sapi secara visual.

### Mengapa YOLOv8?
Model ini dipilih karena kinerjanya yang **sangat cepat dan ringan**. Proses inferensi (deteksi objek) berlangsung dalam hitungan milidetik, menjadikannya sangat efisien untuk digunakan sebagai alat skrining awal langsung di lapangan tanpa membutuhkan spesifikasi server yang tinggi atau GPU mahal.

### Kelebihan & Kekurangan
* **Kelebihan**: 
  - **Sangat Cepat**: Inferensi instan cocok untuk aplikasi skrining real-time.
  - **Hemat Sumber Daya**: Konsumsi memori RAM dan CPU sangat rendah.
  - **Presisi Lokalisasi**: Pendekatan *anchor-free* meningkatkan akurasi pendeteksian letak benjolan kulit.
* **Kekurangan**:
  - **Sensitif Gambar**: Akurasi menurun jika foto sapi buram atau kurang pencahayaan.
  - **Objek Sangat Kecil**: Sulit mendeteksi benjolan gejala awal yang ukurannya terlampau kecil dari jarak jauh.
  - **Risiko False Positive**: Noda lumpur kering atau luka goresan biasa kadang diidentifikasi salah sebagai gejala LSD.

## Menjalankan lokal

Buka `index.html` langsung atau jalankan server statis:

```bash
npx serve .
```

## Deploy ke Vercel

Import repository ini di Vercel. Proyek tidak membutuhkan build command karena
seluruh file merupakan HTML, CSS, dan JavaScript statis.

## Catatan

Informasi penyakit diringkas dari [World Organisation for Animal Health](https://www.woah.org/en/disease/lumpy-skin-disease/).
Hasil model ditujukan untuk praktikum dan skrining awal, bukan pengganti
diagnosis dokter hewan.
