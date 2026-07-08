# Checklist Demo Final — Feature 3 (Attendance, Driver & Worker Management)

## 1. Sebelum demo

- [ ] **Koordinasi dengan tim** soal jadwal reset database (`npm run db:soft` di folder `api`) — ini akan **truncate semua tabel** termasuk data fitur teman-teman. Sepakati waktu resetnya (idealnya malam sebelum atau pagi sebelum demo, setelah semua orang selesai testing).
- [ ] Setelah reset, catat kredensial login dari output terminal seeder (password sama untuk semua: `Demo1234!`):
  - `admin1@demo.com` — outlet_admin
  - `worker1@demo.com`, `worker2@demo.com`, `worker3@demo.com` — worker
  - `driver1@demo.com` — driver
  - `customer1@demo.com`, `customer2@demo.com`, `customer3@demo.com` — customer
- [ ] Jalankan `api` (`npm run dev`) dan `web` (`npm run dev`) dari awal, pastikan tidak ada error di console.
- [ ] Siapkan 2 browser/incognito window terpisah (atau 2 device) — satu untuk **worker**, satu untuk **admin** — supaya alur bypass bisa didemokan bolak-balik tanpa logout-login berulang.

## 2. Data demo yang sudah disiapkan seeder

| Order | Status awal | Untuk demo |
|---|---|---|
| **INV-DEMO-A001** | WASHING, belum bayar | Alur lengkap worker: start → input quantity → **mismatch → bypass → admin approve** |
| **INV-DEMO-B002** | PACKING, sudah lunas | "Laundry Siap Diantar" — packing worker selesaikan → langsung lanjut ke delivery (karena sudah lunas) |
| **INV-DEMO-C003** | READY_TO_DELIVER | Driver ambil delivery yang tersedia |
| 2 pickup baru | WAITING_DRIVER | Driver accept pickup + demo aturan "1 order aktif dalam satu waktu" |

## 3. Alur demo yang disarankan (urut)

**A. Attendance**
1. Login sebagai `worker1@demo.com` → clock-in, pilih station **WASHING** → tunjukkan status berubah jadi "Hadir".
2. Buka Attendance Log → tunjukkan riwayat.
3. Login sebagai `admin1@demo.com` → buka **Attendance Report** → tunjukkan bisa filter by role/tanggal, lihat semua karyawan.

**B. Worker — alur normal + mismatch + bypass (pakai Order A)**
1. Worker1 (sudah clock-in station WASHING) buka Dashboard Worker → lihat order **INV-DEMO-A001**.
2. Klik "Mulai Kerjakan" → masuk halaman detail.
3. **Demo mismatch**: ubah salah satu quantity jadi beda dari yang seharusnya → klik "Selesaikan Station" → tunjukkan error muncul + form bypass muncul otomatis.
4. Isi alasan bypass (>=10 karakter) → kirim.
5. **Switch ke browser admin** → buka `/admin/bypass` → tunjukkan request muncul lengkap dengan **jumlah yang dilaporkan worker** (ini hasil fix bug kemarin — item quantity tidak hilang lagi).
6. Isi keterangan admin → klik **Setujui**.
7. Kembali ke worker → order otomatis lanjut ke station **IRONING**.
8. Worker yang clock-in station IRONING lanjutkan proses (quantity prefill sekarang otomatis ambil dari hasil WASHING, bukan quantity order asli — fix bug kedua).

**C. Worker — packing & payment gate (pakai Order B)**
1. Worker clock-in station **PACKING** → lihat order **INV-DEMO-B002** (sudah lunas).
2. Selesaikan packing → tunjukkan status langsung "Laundry Siap Diantar" (karena `payment.status = PAID`).
3. *(Opsional, untuk demo kasus belum lunas)*: buat order lain manual dengan payment PENDING → selesaikan packing → tunjukkan masuk ke `/admin/orders/waiting-payment` → klik "Cek & Lanjutkan" setelah payment di-set PAID manual di DB.

**D. Driver**
1. Login sebagai `driver1@demo.com` → clock-in dulu (wajib, karena ada `requireActiveShift` guard).
2. Dashboard Driver → tunjukkan 2 pickup tersedia + delivery **INV-DEMO-C003** tersedia.
3. Accept salah satu pickup → tunjukkan pickup lain & semua delivery jadi **disabled** (bukti "1 order aktif dalam satu waktu").
4. Klik "Tiba di Outlet" untuk selesaikan pickup itu → tombol kembali aktif.
5. Accept delivery **INV-DEMO-C003** → klik "Selesai Antar".
6. Buka Riwayat Driver → tunjukkan pickup & delivery yang baru selesai muncul di history.

## 4. Hal-hal yang sudah diperbaiki (siap disebut kalau ditanya mentor)

- Bug: quantity yang dilaporkan worker saat bypass sempat hilang total (tidak pernah tersimpan) — sudah diperbaiki, sekarang tersimpan dan bisa dilihat admin sebelum approve.
- Fitur: admin sebelumnya tidak punya cara approve/reject bypass sama sekali (endpoint ada, UI tidak ada) — sudah dibuatkan halaman `/admin/bypass`.
- Bug minor: input quantity di station IRONING/PACKING sebelumnya selalu prefill dari jumlah order asli, bukan dari hasil station sebelumnya — sudah diperbaiki.

## 5. Cadangan kalau ada error saat demo live

- [ ] Screenshot/screen-record alur lengkap sehari sebelumnya sebagai cadangan kalau koneksi/DB bermasalah saat demo.
- [ ] Siapkan jawaban singkat soal kenapa validasi `requireActiveShift` ada (mencegah worker/driver proses order tanpa absen dulu).
- [ ] Kalau ditanya soal race condition: siap jelaskan `runSerializable` transaction untuk accept pickup/delivery (mencegah 2 driver ambil order yang sama bersamaan).
