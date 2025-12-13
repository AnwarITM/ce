# Panduan Belajar Supabase untuk Monitoring Sensor Realtime

Dokumen ini adalah roadmap belajar singkat untuk membangun aplikasi monitoring sensor data center menggunakan **Supabase**. Fokus utamanya adalah performa, realtime, dan data time-series.

---

## 1. Persiapan Awal (Fundamental)
Langkah pertama untuk mengenal lingkungan kerja Supabase.

*   [ ] **Create Project & Table**:
    *   Buat project baru (gratis) di [Supabase.com](https://supabase.com).
    *   Buat tabel `sensor_logs` dengan kolom:
        *   `id` (int8, primary key)
        *   `sensor_id` (text / varchar) -> Kode sensor, misal "RACK-A1"
        *   `temperature` (float) -> Nilai suhu
        *   `humidity` (float) -> Nilai kelembaban
        *   `created_at` (timestamptz) -> Waktu data masuk (set *Default* ke `now()`)
*   [ ] **Client Library JS**:
    *   Pelajari cara konek dari file HTML biasa.
    *   Gunakan CDN `https://cdn.jsdelivr.net/npm/@supabase/supabase-js`.
    *   Pelajari syntax dasar: `.from('sensor_logs').select('*')`.

## 2. Fitur Kunci: Realtime Subscription
Ini adalah "jantung" dari dashboard monitoring agar angka bergerak sendiri tanpa refresh.

*   [ ] **Enable Replication**:
    *   Di Dashboard Supabase: Database -> Replication -> Pilih tabel `sensor_logs` -> Nyalakan "Source".
*   [ ] **Coding Subscription**:
    *   Pelajari `.on('postgres_changes')`.
    *   Filter spesifik: Hanya dengarkan *INSERT* data baru.
    *   Contoh logika: "Saat ada data INSERT baru, update angka di elemen HTML ID `current-temp`".

## 3. Optimasi Data: Time Series (TimescaleDB)
Agar query grafik history (misal: suhu rata-rata per jam) tetap cepat meski data sudah jutaan baris.

*   [ ] **Enable Extension**:
    *   Ke menu Database -> Extensions -> Cari "TimescaleDB" -> Enable.
*   [ ] **Convert Table to Hypertable**:
    *   Pelajari query SQL: `SELECT create_hypertable('sensor_logs', 'created_at');`
    *   Ini mengubah tabel biasa menjadi tabel super cepat khusus waktu.
*   [ ] **Time Bucket Query**:
    *   Pelajari query `time_bucket()`.
    *   Contoh: Menampilkan grafik rata-rata suhu per 15 menit, bukan menampilkan ribuan titik data mentah.

## 4. Keamanan & Performa (Enterprise Ready)
Persiapan jika aplikasi akan dideploy di jaringan Data Center sungguhan.

*   [ ] **Row Level Security (RLS)**:
    *   Aturan siapa yang boleh BACA data (misal: hanya Admin Dashboard).
    *   Aturan siapa yang boleh TULIS data (misal: hanya API Key milik alat sensor).
*   [ ] **Database Functions (RPC)**:
    *   Membuat *logic* berat di sisi server, bukan di browser.
    *   Contoh: Fungsi untuk menghapus data lama otomatis (Retention Policy).

---

## Studi Kasus Latihan (Target Mini Project)
Cobalah buat **1 Halaman HTML** sederhana dengan target berikut:

1.  Ada satu angka besar **"Suhu Saat Ini"** yang berubah otomatis saat Anda insert data manual di dashboard Supabase.
2.  Ada satu **Grafik Garis** (pakai Chart.js) yang menampilkan 10 data terakhir.

*Tutorial resmi yang relevan:*
*   [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
*   [TimescaleDB in Supabase](https://supabase.com/docs/guides/database/extensions/timescaledb)
