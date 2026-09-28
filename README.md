# 🧾 SPLIT-BILL

> Bagi rata, bayar pas, pertemanan aman. Web application kalkulator patungan adil dengan kalkulasi proporsional (pajak, service charge, diskon), kustomisasi nomor rekening/e-wallet pembayaran, dan generator format WhatsApp.

**Live Application:** [split.lifianzhi.my.id](https://split.lifianzhi.my.id)

---

## 🛠️ System Requirements

* **Node.js**: `v18.0.0` or newer
* **Package Manager**: `npm` (v9+), `pnpm`, or `yarn`
* **Target Environments**: Modern Web Browsers (Mobile & Desktop)
* **OS Compatibility**: Linux / macOS / Windows

---

## 💻 Tech Stack & Architecture

* **Core Framework**: React 18
* **Build Tool**: Vite
* **Styling Engine**: Tailwind CSS
* **Iconography**: Lucide React
* **Deployment & CI/CD**: Vercel

---

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/lifianzhi/split-bill.git
cd split-bill
```

### 2. Install Dependencies
Using npm:
```bash
npm install
```
Or using pnpm:
```bash
pnpm install
```

### 3. Run Development Server
```bash
npm run dev
```
Buka browser di `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```
File bundle statis yang telah dioptimasi akan dibuat di direktori `dist/`.

---

## ✨ Key Features & Capabilities

* **Fair Proportional Distribution**: Pajak restoran, service charge, dan diskon kupon dihitung adil berdasarkan proporsi pesanan masing-masing individu, bukan dibagi rata (equal split) yang merugikan pemesan porsi kecil.
* **Custom Payment Target (Optional)**: Pengguna dapat memasukkan rekening bank tujuan atau nomor e-wallet beserta nama penerima secara dinamis langsung dari antarmuka. Tersimpan otomatis di peramban pengguna tanpa perlu login backend.
* **Smart Rounding (Pembulatan Otomatis)**: Opsi pembulatan tagihan ke ratusan rupiah terdekat (`Rp 100`) untuk memudahkan transfer tanpa pecahan nominal kecil.
* **WhatsApp Share Engine**: Menghasilkan salinan teks rincian per orang yang rapi, transparan, dan terstruktur untuk langsung dikirim ke WhatsApp chat / WhatsApp Web.
* **Copy-to-Clipboard Direct Action**: Opsi salin cepat teks rincian perhitungan ke clipboard untuk fleksibilitas share ke platform komunikasi lain (Telegram, Line, Discord).
* **Zero Dummy State**: Antarmuka bersih (*pristine state*) sejak awal dimuat sehingga pengguna dapat langsung menginput data transaksi riil.
* **Client-side & Privacy-First**: Semua kalkulasi dan data input berjalan sepenuhnya di sisi browser (*client-side*).

---

## 📄 License

This project is open-source and distributed under the [MIT License](LICENSE).
