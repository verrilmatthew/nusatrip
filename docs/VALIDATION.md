# Hasil verifikasi NusaTrip

Tanggal pemeriksaan: 10 September 2026. Pengujian memakai data contoh lokal, bukan transaksi atau pemesanan nyata.

## Pengujian otomatis

`pnpm typecheck` berhasil. `pnpm test` berhasil: **25 pengujian, 25 lulus, 0 gagal**.

Pengujian mencakup:

- Enam tanggal dan lima malam, termasuk pembagian malam multi-city serta transfer kereta.
- Dua orang/satu kamar/lima malam; empat orang/satu mobil; kapasitas motor dua orang.
- Kedatangan malam, kepulangan pagi, tanggal/jam tidak valid, transport lokal yang tidak didukung.
- Hard cap yang terlalu kecil menghasilkan konflik eksplisit.
- Regenerasi mempertahankan aktivitas terkunci, hari terkunci, dan aktivitas selesai.
- Perubahan harga, biaya tambahan per grup/per orang, kuantitas, serta cadangan dihitung satu kali.
- Pengeluaran aktual terpisah dari rencana; refund, perubahan pembayar, dan settlement manual.
- Split sebagian peserta, pembulatan rupiah deterministik, validasi persentase dan nominal.
- Konversi WIB, WITA, WIT ke UTC.
- Ekspor memakai data yang diedit, menghilangkan referensi privat, dan menetralisasi formula CSV.
- Penyimpanan lokal, retensi data korup, dan kegagalan kuota.
- Prakiraan di luar horizon, kegagalan cuaca tanpa mutasi trip, fallback routing tanpa waktu rekaan.
- Perintah assistant yang tidak didukung gagal tanpa mengubah trip.
- Makan dan jeda berada pada area aktivitas sebelumnya.

## Pemeriksaan browser yang dijalankan

| Alur | Hasil yang diamati |
|---|---|
| Explore desktop | Foto destinasi dimuat; hirarki dan navigasi diperiksa secara visual. |
| Wizard baru | Membuat “Uji perjalanan 6D5N”; kembali ke langkah sebelumnya mempertahankan input dan budget Rp12.000.000. |
| Generate | Enam tab hari dan lima malam muncul. |
| Edit aktivitas | Biaya satuan dinaikkan Rp100.000 dan durasi diubah; preview menghitung kenaikan grup Rp220.000, termasuk dua peserta dan cadangan 10%. |
| Simpan dan refresh | Nama trip aktif dan total Rp10.164.000 tetap tersedia setelah reload. |
| Expense dan split | Transaksi Rp100.001 dibagi menjadi Rp50.001 dan Rp50.000; aktual Rp100.001, usulan settlement Rp50.000. |
| Layout mobile | Iframe dengan lebar 390px untuk Explore dan itinerary; lebar konten 373px sama dengan scrollWidth 373px; bottom navigation dan tab hari dapat dipakai. |
| Peta | Tile OpenStreetMap, marker area menginap dan aktivitas tampil; atribusi dan keterangan koordinat perkiraan tersedia. |
| Cuaca Desember | Tombol periksa menampilkan prakiraan harian belum tersedia; tidak menampilkan angka cuaca rekaan. |

Pemeriksaan mobile menggunakan viewport iframe, bukan pengujian perangkat fisik. Data pengujian browser hanya tersimpan pada origin preview dan tidak dimasukkan ke seed aplikasi.

## Batas verifikasi

- Multiuser dan authorization dua akun **belum diterapkan atau diuji**. Tidak ada endpoint trip publik; demo menyimpan data per browser/origin. Label role lokal bukan izin server.
- Sanitasi ekspor diuji; tautan berbagi online yang dapat dicabut belum tersedia.
- Jalur kegagalan/horizon cuaca diuji. Keberhasilan prakiraan live, inventory booking, routing jalan, pembayaran, lampiran privat, serta AI eksternal tidak diklaim terverifikasi.
- WebMCP didaftarkan secara feature-detection, tetapi lingkungan browser pemeriksaan tidak menyediakan `modelContext`; panggilan alat tidak dapat diuji di sana.
- Snapshot offline dan penjagaan mutasi tersedia dalam kode; pengujian browser dengan pemutusan koneksi penuh belum dijalankan.
- Print-to-PDF tersedia melalui dialog cetak browser; tidak ada klaim audit hasil cetak pada semua browser/printer.

## Build

- `pnpm build:next`: berhasil, termasuk kompilasi, pemeriksaan TypeScript, dan prerender halaman utama. Target untuk deployment Next.js biasa seperti Vercel.
- Build target Sites melalui `build-site.mjs`: berhasil, termasuk analisis client/server serta build RSC, client, dan SSR. Adapter memberi catatan bahwa klasifikasi statis rute belum tersedia; proses build selesai dengan exit code 0.

Ulangi pengujian setelah menghubungkan backend atau provider baru. Uji otorisasi server dua akun sebelum mengaktifkan kolaborasi dan penyimpanan cloud.
