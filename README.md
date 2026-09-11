# NusaTrip — Indonesia Travel Superapp

Aplikasi planner Indonesia dengan satu sumber data perjalanan: buat trip → generate itinerary → edit → hitung budget → simpan → buka kembali. Bahasa Indonesia, IDR, default 6 hari 5 malam.

## Menjalankan lokal

Diperlukan Node.js 22.13+ dan pnpm sesuai `packageManager` pada `package.json`. Gunakan folder proyek ini sebagai root, jangan memindahkan semua file ke satu level yang berbeda.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev:next
```

Buka alamat yang dicetak Next.js (biasanya `http://localhost:3000`). Tidak perlu login, database, atau API key. Tiga trip contoh langsung tersedia. Data trip hanya disimpan pada browser/perangkat yang dipakai. Menjalankan di origin/port lain menggunakan penyimpanan yang berbeda.

Perintah verifikasi:

```bash
pnpm typecheck
pnpm test
pnpm build:next
pnpm start:next
```

Target Sites menggunakan adapter Vinext untuk App Router yang sama:

```bash
pnpm dev
pnpm build
```

Untuk lingkungan ChatGPT Work terkelola, gunakan alur preview/build Sites yang disediakan lingkungan. `build` menghasilkan Worker-compatible ESM; `build:next` menghasilkan build Next.js biasa.

## Cakupan yang dapat digunakan

- **P0:** wizard empat langkah, 8 opsi destinasi (7 kota/pulau dan kombinasi Semarang–Surabaya), perbandingan maksimal 3 opsi, generator deterministik, editor, lock item/hari, pengaturan durasi/harga, pindah urutan/hari, tambahan tempat sendiri, regenerasi, preview perubahan, undo, budget grup/per orang, hard cap, local persistence, 3 seed trip.
- **P1:** alternatif indoor, prakiraan Open-Meteo atas permintaan dalam horizon data, transport & akomodasi manual, pembagian malam, balik rute, peta OSM dengan marker perkiraan, expense/refund, split rata/persentase/nominal, usulan settlement dan pencatatan manual, checklist & packing, Today, CSV, ICS, print-to-PDF, salinan itinerary tersanitasi, snapshot offline read-only.
- **P2 lokal:** nama peserta, catatan role demo, voting satu suara per peserta, komentar aktivitas, penugasan checklist, riwayat perubahan, draft ajakan yang dapat diunduh. Ini bukan sinkronisasi multiuser.
- **Assistant:** perintah berbasis aturan seperti “hari 3 lebih santai”, “hemat budget”, “ganti pantai dengan indoor”. Selalu melalui preview. Tidak menghubungi model AI.

## Arsitektur

- `app/`: Next.js App Router shell, metadata, loading/error boundary, CSS dan halaman utama.
- `components/nusatrip/`: UI per alur; primitives accessible di `components/ui/`.
- `lib/nusatrip/model.ts`: entitas dan validasi wizard Zod.
- `lib/nusatrip/catalog.ts`: 64+ ide aktivitas untuk 7 destinasi; harga dan atribut contoh, bukan inventory bisnis.
- `lib/nusatrip/engine.ts`: generation, scheduling, constraints, budget, rekomendasi dan perubahan deterministik.
- `lib/nusatrip/expenses.ts`: pembagian rupiah, refund, saldo peserta dan settlement.
- `lib/nusatrip/repository.ts`: validasi data tersimpan, adapter repository lokal, error quota/corruption.
- `lib/nusatrip/providers.ts`: kontrak WeatherProvider, PlacesProvider, RoutingProvider, AIPlannerProvider dan FileStorageProvider.
- `lib/nusatrip/exports.ts`: serializer CSV/ICS, sanitasi, download.
- `public/sw.js`, `public/offline.html`: halaman offline lokal yang membaca snapshot tanpa dokumen, booking, kontak, atau rincian utang.
- `tests/`: pengujian domain yang dapat diulang. `.test-build/` adalah output sementara dan tidak dikirim ke Git.

State trip terpusat pada `TripContext`. Semua tampilan memakai fungsi `totals` yang sama. Mutasi penting melalui `commit` dengan validasi, pemeriksaan konflik, revisi, dan penyimpanan. Preview tidak menerapkan perubahan. Saat penyimpanan gagal, perubahan masih ada dalam memori dan tersedia cadangan privat; pengguna mendapat pesan yang jelas. Perubahan dari tab lain memblokir penimpaan sampai reload.

## Kejujuran data

- **Contoh:** tarif hotel, transport, tiket, durasi, area/koordinat, ide kegiatan dan jadwal transport.
- **Input pengguna:** harga/catatan yang diisi manual. Tidak berarti pembayaran atau reservasi diproses.
- **Live:** prakiraan hanya setelah Open-Meteo berhasil mengembalikan data. Sumber, lokasi, waktu pembaruan dan keterbatasan ditampilkan.
- **Estimasi:** perhitungan dan asumsi; tidak ada rating, testimoni, inventory, atau harga real-time palsu.

Katalog menggunakan aktivitas editorial, bukan database tempat terverifikasi. Koordinat dihitung di sekitar area dan selalu dilabeli perkiraan. Jangan menggunakan marker untuk mencari pintu masuk sebuah tempat. Jam buka, akses kursi roda, menu/diet, kualitas operator dan reservasi harus diverifikasi. Sumber foto dan lisensinya dicatat di `docs/IMAGE-CREDITS.json` dan halaman Profile. Foto digunakan sebagai inspirasi visual destinasi; beberapa sumbernya merupakan koleksi pencarian.

Cuaca tidak dikarang untuk Desember atau tanggal jauh. Data klimatologi historis belum dihubungkan. Mode “skenario hujan” tidak membuat probabilitas atau suhu contoh. Kondisi laut harus diperiksa melalui BMKG Maritim dan operator.

## Aturan perhitungan

- Enam tanggal perjalanan = lima malam; total malam tetap `days - 1`.
- Kamar: `rate × rooms × nights`, kapasitas contoh 2 orang per kamar. Tarif anak disamakan dengan dewasa dalam simulasi.
- Kendaraan lokal: satu mobil untuk 4 orang, atau satu motor untuk 2 orang jika mobil tidak dipilih. Tidak dikalikan lagi per orang.
- Aktivitas: biaya satuan × peserta hanya jika basis per orang. Makan utama memakai alokasi harian; kelas masak/kuliner tambahan menjadi aktivitas tersendiri.
- Cadangan: persen dari subtotal rencana. Tidak masuk actual expenses.
- Aktual: pengeluaran dikurangi refund. Tidak ditambahkan ke planned total. Settlement hanya mengubah saldo antar peserta, bukan total belanja.
- Pembulatan split: largest remainder, lalu ID peserta sebagai tie-break. Persentase wajib tepat 100%; nominal custom wajib berjumlah sama dengan transaksi.
- Estimasi minimum/maksimum: skenario −15%/+20% subtotal, ditambah cadangan tetap, bukan confidence interval.
- Skor destinasi: 35% budget, 30% kesesuaian vibe, 20% durasi, 15% fleksibilitas indoor. Bukan ukuran keselamatan atau probabilitas kepuasan.

## Ekspor & privasi

Cetak/PDF, ICS, dan salinan itinerary menghilangkan catatan pribadi, booking, dokumen, nama peserta dan utang. CSV transaksi sengaja memuat nama pembayar serta pembagian, karena pengguna memilih ekspor pengeluaran. Cadangan privat JSON sengaja memuat seluruh data lokal dan diberi nama/label privat. CSV menetralisasi formula injection. ICS menggunakan UTC yang dihitung dari WIB/WITA/WIT dan mematuhi line folding; bukan sinkronisasi kalender.

Tidak ada endpoint trip publik dan tidak ada server yang mengumpulkan trip lokal. Hosting Sites owner-private mengendalikan akses situs; role di demo bukan lapisan otorisasi. Jangan menganggap mode lokal cocok untuk perangkat bersama atau akun multiuser. Offline hanya read-only. Data pribadi tidak dicache sebagai respons server atau dikirim ke AI.

## Integrasi provider

Lihat `docs/PROVIDERS.md`. `.env.example` berisi nama pengaturan yang dicadangkan, tanpa kredensial. Menambahkan environment variable saja **tidak** mengaktifkan integrasi yang belum diimplementasikan.

## Deployment Vercel

1. Upload folder sumber ke repository Git dengan struktur utuh; `package.json` harus berada pada root proyek.
2. Import repository ke Vercel; pilih framework Next.js dan root direktori proyek ini.
3. Install command: `pnpm install --frozen-lockfile`.
4. Build command: `pnpm build:next` (bukan build Worker Sites).
5. Biarkan output directory pada default Next.js; Node.js 22.x.
6. Demo tidak memerlukan environment variable. Deploy dan periksa URL hasil deployment.

Panduan ini tidak berarti Vercel telah dideploy. Publikasi pada Sites dilaporkan terpisah melalui hasil deployment yang terverifikasi.

## Batasan yang masih memerlukan akses/pekerjaan eksternal

- Supabase/cloud persistence, akun pengguna dan migrasi database belum diaktifkan; tidak ada migrasi produksi yang diam-diam dianggap berjalan.
- Undangan online, authorization Owner/Editor/Viewer di server, realtime conflicts, revoked share links dan lampiran privat memerlukan backend nyata.
- API AI, inventory hotel/tiket, routing jalan, cuaca maritim, klimatologi terverifikasi, push/email dan sinkronisasi kalender belum terhubung.
- Jam tiket transport belum dapat diedit bebas per leg: wizard menetapkan jam tiba/pulang; leg antarkota memakai jadwal asumsi. Referensi dan biaya bisa dicatat. Rute perlu dibangun ulang untuk perubahan urutan/malam, dan ditolak jika ada aktivitas atau booking terkunci.
- Katalog bukan engine optimasi rute global. Alternatif/regenerasi bisa tidak layak; preview menolak konflik yang terdeteksi. Pada hari tanpa kandidat, pengguna mendapat waktu bebas.
- Peta/foto eksternal memerlukan internet dan ketentuan provider. Tile OSM tidak diunduh massal atau disimpan untuk peta offline.
- Perintah assistant mengenali pola terbatas, termasuk “hari 3”, bukan semua variasi bahasa; permintaan penghematan nominal tidak menjamin target angka tercapai.

Hasil pengujian yang benar-benar dijalankan tercatat dalam `docs/VALIDATION.md`.
