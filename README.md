# mysa_project_ISCOMFEST

Perencana tata letak kamar kos interaktif 3D. Pastikan furnitur muat sebelum dibeli.

- **Website:** https://mysa-project-iscomfest.vercel.app
- **Video demo:** 

https://github.com/user-attachments/assets/0027d368-26be-4739-bed5-47dd12b7d463

- **Kode sumber:** https://github.com/FarrasGhazi/mysa_project_ISCOMFEST

**Tampilan MYSA:**

<img width="1920" height="1080" alt="Tampilan_MYSA" src="https://github.com/user-attachments/assets/619eb065-6396-437f-8996-6e97617d8c62" />

## Masalah dan solusi

Penulis tinggal di kamar kos yang kecil. Meja belajar lesehan bawaan kos terasa tidak nyaman untuk belajar lama, sehingga penulis berencana membeli meja belajar dengan kursi. Karena ukuran kamar kecil, penulis khawatir ukurannya meleset, dan cara saat itu adalah mengukur lantai dengan penggaris lalu membayangkan hasilnya

MYSA menjawab satu pertanyaan: *"apakah furnitur ini muat di kamarku?"* Pengguna memasukkan ukuran kamar dalam sentimeter, menaruh furnitur berukuran nyata, lalu melihat langsung hasilnya.

## Fitur

- Ukuran kamar kustom (150 sampai 600 cm), dengan konfirmasi bila ada furnitur yang akan berada di luar ruangan
- Katalog furnitur (kasur, meja belajar, lemari, kursi), ukuran dapat diubah, diputar 90 derajat, dan dihapus
- Seret dan letakkan dengan penempelan ke grid (10, 25, atau 50 cm) dan deteksi tabrakan
- Mode lantai: hijau (kosong), merah (terpakai), biru (area ayun pintu), serta opsi menyembunyikan furnitur
- Pintu dapat dipasang di dinding mana pun, dengan lebar, posisi, dan sisi engsel yang bisa diatur; area ayun digambar seperempat lingkaran, dan ada peringatan bila furnitur menyentuhnya
- Empat sudut pandang isometrik dan tampilan atas
- Warna furnitur, kunci furnitur, dan ekspor hasil ke PNG
- Tampilan responsif untuk layar laptop dan telepon

## Cara menjalankan di komputer sendiri

Prasyarat: [Node.js](https://nodejs.org) dan Git. Proyek ini diuji dengan Node.js v26.13.0 dan npm 11.20.0.

```bash
git clone https://github.com/FarrasGhazi/mysa_project_ISCOMFEST.git
cd mysa_project_ISCOMFEST
npm install
npm run dev
```

Buka alamat yang tertera di terminal, biasanya `http://localhost:5173`.

Perintah lain:

```bash
npm run build     # membuat versi produksi di folder dist
npm run preview   # mencoba versi produksi secara lokal
```

## Cara memakai singkat

1. Buka panel **Ruangan** (ikon rumah), isi lebar dan panjang kamar, lalu tekan *Terapkan ukuran*. Atur pintu di panel yang sama.
2. Buka panel **Furnitur** (ikon sofa) dan klik furnitur untuk menambahkannya.
3. Seret furnitur ke posisi yang diinginkan. Klik furnitur untuk mengubah ukuran, warna, memutar, mengunci, atau menghapusnya.
4. Buka panel **Tampilan** (ikon mata) untuk grid, mode lantai, dan sudut kamera.
5. Tekan **Simpan** untuk mengunduh hasil sebagai gambar PNG.

## Struktur proyek

Kode dibagi menjadi modul, masing-masing dengan satu tujuan.

```
index.html          kerangka halaman: bilah ikon, panel, kartu properti
src/
  main.js           titik awal: memasang semua modul dan menjalankan loop gambar
  config.js         data bersama: ukuran kamar, pintu, katalog, palet, sudut kamera
  state.js          status bersama (penanda "perlu digambar ulang")
  scene.js          renderer, kamera ortografik, cahaya, penyesuaian ukuran layar
  room.js           lantai, empat dinding, dan pintu
  furniture.js      bentuk furnitur, batas dinding, tabrakan, area ayun pintu
  grid.js           garis grid dan label panjang
  floormode.js      mode lantai (hijau, merah, biru) dan garis tepi juring pintu
  view.js           empat sudut isometrik dan tampilan atas
  marker.js         bingkai penanda furnitur terpilih
  drag.js           memilih dan menyeret furnitur dengan mouse atau sentuhan
  ui.js             panel, tombol, kolom input, dan pesan singkat
  exportpng.js      ekspor tampilan ke PNG
  style.css         seluruh tampilan
```

## Teknologi dan sumber

| Teknologi | Fungsi | Lisensi dan sumber |
|---|---|---|
| [Three.js](https://threejs.org) | Menggambar 3D di peramban | MIT |
| [Vite](https://vite.dev) | Server pengembangan dan bundler | MIT |
| Vercel | Hosting | Layanan gratis |

Seluruh furnitur dan ruangan dibangun dari bentuk balok (`BoxGeometry`) di dalam kode. Tidak ada model 3D, gambar, atau aset pihak ketiga. Ikon menu adalah SVG garis sederhana yang ditulis langsung di `index.html`.

## Keputusan desain dan keterbatasan

- **Sudut kamera** diatur lewat `CAMERA` di `src/config.js` (azimut 22 derajat, elevasi 45 derajat). Nilai ini dipilih dari pengamatan tampilan agar dinding belakang cukup lebar dan ilusi "sudut ruangan terbalik" pada proyeksi isometrik berkurang, namun belum hilang sepenuhnya.
- **Ukuran furnitur bawaan** adalah perkiraan umum, bukan ukuran produk tertentu. Pengguna dapat mengubahnya.
- **Area ayun pintu** berbentuk seperempat lingkaran (90 derajat) dengan jari-jari sebesar lebar pintu. Furnitur boleh menimpanya, dan pengguna diberi peringatan, bukan penolakan, karena pada kenyataannya pintu kadang memang hanya dibuka sebagian.
- **Sengaja tidak dibuat:** jendela, analisis keterjangkauan jalur, penyimpanan otomatis, dan lebih dari satu pintu. Alasannya adalah menjaga fokus pada pertanyaan "muat atau tidak".
- **Keterbatasan:** data tidak disimpan setelah halaman ditutup (hasil disimpan lewat PNG). Dinding yang menghadap kamera disembunyikan, sehingga pintu di dinding itu tidak terlihat sampai sudut kamera diputar.

## Proses pengembangan dan penggunaan AI

**Pernyataan terbuka:** sekitar 90% penulisan kode proyek ini dilakukan oleh asisten AI (Claude, Anthropic). Angka ini adalah perkiraan penulis. Pengembangan berlangsung lewat percakapan: AI menulis dan menjelaskan kode, sedangkan penulis memasukkannya ke proyek, menjalankan, menguji, memperbaiki, dan memutuskan arah produk. Penulis menyebut hal ini secara terbuka karena Buku Panduan mewajibkan pencantuman sumber dan bantuan pihak lain.

**Pembagian peran**

| Dikerjakan AI | Dikerjakan penulis |
|---|---|
| Menulis sebagian besar kode, menjelaskan konsep dan struktur | Masalah dan ide awal, sketsa tata letak antarmuka, daftar fitur dan prioritasnya |
| Menawarkan pilihan desain beserta kelebihan dan risikonya | Memilih, menolak, atau mengubah pilihan tersebut |
| | Menjalankan dan menguji setiap tahap di laptop dan telepon, menemukan serta memperbaiki bug |
| | Seluruh keputusan akhir tentang isi dan tampilan produk |

**Keputusan penulis yang berbeda dari, atau menentang, saran AI** (antara lain):

1. **Pintu antar dinding.** AI menyarankan pemindahan pintu ke dinding lain ditunda karena paling mahal dan menyentuh banyak file. Penulis memutuskan tetap mengerjakannya, dan fitur itu berhasil.
2. **Analisis jalur gerak (BFS).** AI menyarankan mempertahankannya karena satu-satunya yang memeriksa apakah furnitur masih terjangkau dari pintu. Penulis menilai skor persen dan peta jalur tidak praktis dibaca dan sudah terwakili mode lantai serta grid, lalu memutuskan membuangnya seluruhnya. Fitur ini kini dicatat sebagai rencana pengembangan.
3. **Bentuk dan aturan area ayun pintu.** AI semula membuat area berbentuk persegi dengan furnitur yang ditolak bila masuk ke dalamnya. Penulis menunjukkan bahwa bentuk yang benar adalah juring dan mengusulkan agar furnitur boleh menimpanya dengan peringatan. AI mengevaluasi dan mengikuti rancangan penulis.
4. **Penghapusan fitur lain.** Penulis memutuskan jendela tidak diperlukan, dan mempertanyakan perlu tidaknya fitur ganti warna, sehingga prioritasnya diturunkan.
5. **Antarmuka.** Tata letak tiga ikon di kiri dan kartu properti di kanan berasal dari sketsa penulis. Popup konfirmasi bawaan peramban dinilai penulis tidak menarik dan dicatat untuk diperbaiki.
6. **Sudut kamera.** Setelah mengamati ilusi kedalaman pada tampilan isometrik, penulis mempertahankan nilai azimut 22 dan elevasi 45 yang dipilihnya sendiri.
7. **Usulan yang tidak diperlukan.** Penulis menolak pendekatan tambahan yang diusulkan AI untuk menyinkronkan grid, dan benar, karena akar masalahnya hanya fungsi yang belum dipanggil.
8. **Struktur kode.** Penulis meminta kode dipecah menjadi modul dengan satu tujuan per file.

**Pemahaman kode:** karena sebagian besar kode ditulis AI, penulis mempelajarinya secara bertahap, antara lain lewat percobaan kecil (mengubah nama elemen, menyengaja membuat kesalahan, dan melihat dampaknya) agar memahami hubungan antara HTML, CSS, dan modul JavaScript.

## Penulis

Farras Syafiqul Ghazi, Politeknik Negeri Bandung, 2026.
