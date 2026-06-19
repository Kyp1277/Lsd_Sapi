# LSD Sapi Frontend

Frontend statis untuk skrining visual Lumpy Skin Disease pada sapi. Aplikasi
mengirim gambar ke backend FastAPI/YOLOv8 di Hugging Face Spaces dan menampilkan
bounding box, kelas, serta confidence hasil deteksi.

## Backend

`https://kypli-lsd-sapi-api.hf.space`

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
