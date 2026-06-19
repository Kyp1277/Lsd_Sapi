# CattleCare AI - Skrining Penyakit Sapi

Aplikasi web frontend statis responsif berestetika premium untuk klasifikasi penyakit sapi berdasarkan citra visual. Sistem ini dapat membedakan tiga kelas kondisi kesehatan ternak: **Sehat (Healthy)**, **Lumpy Skin Disease (LSD)**, dan **Penyakit Mulut dan Kuku (PMK/FMD)** menggunakan model transfer learning **MobileNetV3Large**.

Web ini terhubung secara dinamis ke backend API FastAPI yang dideploy di Hugging Face Spaces.

## Fitur Utama

- **Penyaringan Gambar Cerdas:** Drag-and-drop foto sapi, memverifikasi format (JPG, PNG, WebP) dan membatasi ukuran (maks. 10 MB).
- **Animasi Pemindaian Visual:** Menampilkan garis pemindai dinamis (*scanning effect*) selama proses inferensi berlangsung.
- **Konfigurasi API Dinamis:** Input URL backend API di bagian header yang disimpan secara otomatis di penyimpanan browser (*local storage*).
- **Visualisasi Hasil Interaktif:** Menampilkan diagnosis utama disertai bar probabilitas untuk masing-masing dari ketiga kelas secara persentase real-time.
- **Protokol Tindakan:** Menyediakan rekomendasi mitigasi penanganan ternak yang disesuaikan secara otomatis berdasarkan hasil diagnosis tertinggi.

---

## Dataset & Arsitektur Model

### Dataset Pelatihan
Sumber dataset berasal dari [Cattle Diseases Datasets di Kaggle](https://www.kaggle.com/datasets/devang03mgr/cattle-diseases-datasets) dengan komposisi:
- **Healthy (Sehat):** 1.291 gambar
- **Lumpy Skin Disease (LSD):** 1.207 gambar
- **Foot and Mouth Disease (PMK/FMD):** 746 gambar
- **Total:** 3.244 gambar

Pembagian dataset (*data split*) diatur dengan rasio Train 70%, Valid 15%, dan Test 15% berdasarkan kelompok gambar sumber (menggunakan penanda `.rf.`) guna mencegah kebocoran data (*data leakage*).

### Arsitektur MobileNetV3Large
Model dibangun berbasis `MobileNetV3Large` yang dilatih dalam dua tahap:
1. **Tahap Pertama (Training Head):** Melatih kepala klasifikasi dengan learning rate `1e-3` menggunakan teknik class weight seimbang untuk menangani ketimpangan dataset.
2. **Tahap Kedua (Fine-tuning):** Melatih 40 layer terakhir base model secara selektif dengan learning rate rendah `1e-5` guna mempertahankan fitur dasar *ImageNet* sekaligus mengoptimalkan akurasi khusus pada gejala penyakit kulit ternak.

### Metrik Hasil Pelatihan
Berdasarkan data resmi `training_history.csv`:
- **Akurasi Validasi Tertinggi:** **91.77%** (pada Epoch 20)
- **Validation Loss Terbaik:** **0.2602** (pada Epoch 14)
- **Akurasi Pelatihan Tertinggi:** **92.86%** (pada Epoch 14)
- Metrik penunjang model stabil dikendalikan oleh fungsi Early Stopping dengan kesabaran (*patience*) 6 epoch dan ReduceLROnPlateau.

---

## Panduan Menjalankan Lokal

Anda dapat menjalankan antarmuka web langsung di komputer lokal:
1. Buka berkas `index.html` langsung pada peramban web (browser), atau
2. Jalankan server lokal berbasis Node.js jika ingin melakukan pengetesan port:
   ```bash
   npx serve .
   ```

---

## Cara Deploy ke Vercel

1. Buat repositori baru di akun GitHub Anda dan dorong (*push*) isi folder `Lsd_Sapi` ini ke repositori tersebut.
2. Masuk ke dasbor [Vercel](https://vercel.com).
3. Klik **Add New** > **Project**, lalu impor repositori GitHub Anda.
4. Vercel akan mendeteksi pengaturan proyek statis secara otomatis. Klik **Deploy**.
5. Salin URL deploy dari Vercel untuk diakses secara publik.

---

## Integrasi dengan Backend API

Guna mengoperasikan pemindaian secara online:
1. Unggah berkas model backend Anda ke Hugging Face Spaces (detail panduan di repositori backend).
2. Salin URL Space Anda (misalnya `https://kypli-lsd-sapi-api.hf.space`).
3. Tempelkan URL tersebut ke kolom input di bilah atas aplikasi web CattleCare AI.
4. Apabila status berubah menjadi **Model Siap**, Anda bisa langsung mengunggah foto sapi dan melakukan uji klinis awal.

---
**Catatan Penting:** Proyek ini dikembangkan untuk kebutuhan akademis, praktikum, dan skrining awal visual. Hasil diagnosis kecerdasan buatan (AI) ini bukanlah pengganti pemeriksaan resmi dari dokter hewan maupun laboratorium dinas kesehatan hewan berwenang.
