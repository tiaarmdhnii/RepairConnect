// Kategori kerusakan yang boleh dipilih AI (kunci tetap). AI TIDAK menentukan harga.
const DAMAGE_TYPES = {
  lcd: "Layar / LCD",
  touchscreen: "Touchscreen / Digitizer",
  baterai: "Baterai",
  keyboard: "Keyboard",
  charging_port: "Port Charger / Konektor Cas",
  motherboard: "Mainboard / IC",
  storage: "SSD / HDD / Memori Internal",
  ram: "RAM",
  fan_thermal: "Kipas / Thermal / Overheat",
  hinge: "Engsel / Casing",
  camera: "Kamera",
  speaker_mic: "Speaker / Mikrofon",
  software: "Software / Sistem Operasi",
  water_damage: "Kerusakan Cairan",
};

// Kerusakan yang tidak berlaku untuk jenis perangkat tertentu (validasi diagnosis AI)
const DAMAGE_NOT_APPLICABLE = {
  Smartphone: ["keyboard", "fan_thermal", "ram"],
  Tablet: ["keyboard", "fan_thermal", "ram"],
  Laptop: [],
};

// =====================================================================
// DATABASE HARGA — WAJIB DIISI PENGELOLA dari data toko/pemasok/inventaris.
// Jangan isi dengan perkiraan. Selama kosong, website menampilkan
// "harga belum tersedia, perlu pemeriksaan teknisi".
//
// Satu baris = satu kombinasi model + jenis kerusakan + kualitas sparepart.
// Model dicocokkan dengan nama persis di deviceModels.js.
// Bila ada beberapa baris untuk model & kerusakan yang sama (mis. original/OEM/aftermarket),
// website menampilkan rentang rendah-standar-tinggi dari baris-baris tersebut.
//
// Contoh format (hapus tanda komentar & ganti dengan data NYATA):
// {
//   type: "Laptop", brand: "ASUS",
//   series: "ROG Zephyrus G14 / G16 / M16",
//   model: "ROG Zephyrus G14 GA403", code: "GA403",
//   variant: "",                 // kosongkan bila berlaku semua varian; isi "5G" dsb. bila spesifik
//   damage: "baterai",           // salah satu kunci di DAMAGE_TYPES
//   component: "Baterai C41N2308 (cek kompatibilitas)",
//   compat: "GA403 semua varian",
//   quality: "original",         // original | oem | aftermarket
//   partPrice: 0,                // Rupiah, angka saja
//   serviceFee: 0,               // Rupiah, angka saja
//   stock: 3,                    // 0 = kosong, null = tidak diketahui
//   source: "Nama pemasok / toko",
//   updated: "2026-11-11"
// },
// =====================================================================
// =====================================================================
// REFERENSI BIAYA JASA (per jenis perangkat & kerusakan) — dipakai bila baris katalog
// tidak punya serviceFee sendiri. Ini rentang rata-rata pasar, BUKAN tarif tempatmu.
// Ganti dengan tarifmu sendiri dengan mengisi serviceFee di baris PRICE_CATALOG,
// atau ubah angka di sini. Dicek: 2026-11-11.
// =====================================================================
const SERVICE_FEE_REF = [
  {
    type: "Smartphone",
    damage: "lcd",
    low: 100000,
    high: 200000,
    source:
      "Forum komunitas Samsung Indonesia: jasa SSC sekitar Rp153-200 ribu; pengguna menyebut jasa tukang non-resmi sekitar Rp100 ribu (laporan pengguna, bukan daftar harga resmi)",
  },
  {
    type: "Smartphone",
    damage: "baterai",
    low: 117000,
    high: 217000,
    source:
      "Laporan 1 pengguna di SSC Jogja: jasa pasang Rp117 ribu + kit Rp100 ribu (data sangat terbatas)",
  },
];

// =====================================================================
// KISARAN UMUM PASAR (cadangan) — dipakai HANYA bila model tidak punya harga di katalog.
// Ini total sparepart + jasa secara umum untuk perangkat kelas biasa, BUKAN harga model tertentu.
// Merek premium (Apple, Surface) dikecualikan karena biayanya jauh berbeda. Dicek: 2026-11-11.
// Sumber: IDN Times (daftar harga servis HP & laptop), Julo (biaya servis laptop),
// forum komunitas Samsung Indonesia (biaya port charger di SSC).
// =====================================================================
const GENERIC_EXCLUDE_BRANDS = [
  "Apple",
  "Apple (iPhone)",
  "Apple (iPad)",
  "Microsoft Surface",
];
const GENERIC_RANGE = [
  {
    type: "Smartphone",
    damage: "lcd",
    low: 100000,
    high: 1000000,
    source:
      "IDN Times: ganti LCD HP Rp100 ribu-Rp1 juta (HP flagship/layar OLED bisa jauh di atasnya)",
  },
  {
    type: "Smartphone",
    damage: "baterai",
    low: 50000,
    high: 800000,
    source: "IDN Times: ganti baterai HP orisinal Rp50-800 ribu",
  },
  {
    type: "Smartphone",
    damage: "charging_port",
    low: 65000,
    high: 200000,
    source:
      "Forum Samsung: konektor/port USB sekitar Rp65-200 ribu di SSC; ganti board cas bisa sekitar Rp450 ribu",
  },
  {
    type: "Laptop",
    damage: "lcd",
    low: 700000,
    high: 2500000,
    source:
      "IDN Times Rp700 ribu-1,5 juta; Julo Rp700 ribu-2,5 juta (laptop gaming/layar premium lebih mahal)",
  },
  {
    type: "Laptop",
    damage: "keyboard",
    low: 100000,
    high: 800000,
    source:
      "IDN Times Rp100-400 ribu; Julo Rp300-800 ribu (keyboard backlit lebih mahal)",
  },
  {
    type: "Laptop",
    damage: "baterai",
    low: 400000,
    high: 1500000,
    source: "IDN Times Rp500 ribu-1 juta; Julo Rp400 ribu-1,5 juta",
  },
  {
    type: "Laptop",
    damage: "storage",
    low: 200000,
    high: 1000000,
    source: "IDN Times: servis hardisk/SSD Rp200 ribu-1 juta",
  },
  {
    type: "Laptop",
    damage: "ram",
    low: 250000,
    high: 800000,
    source: "IDN Times: servis RAM laptop Rp250-800 ribu",
  },
  {
    type: "Laptop",
    damage: "hinge",
    low: 100000,
    high: 500000,
    source: "IDN Times: ganti engsel laptop Rp100-500 ribu",
  },
  {
    type: "Laptop",
    damage: "motherboard",
    low: 800000,
    high: 4000000,
    source: "IDN Times Rp800 ribu-3 juta; Julo Rp1,5-4 juta",
  },
  {
    type: "Laptop",
    damage: "speaker_mic",
    low: 100000,
    high: 300000,
    source: "IDN Times: ganti speaker laptop Rp100-300 ribu",
  },
  {
    type: "Laptop",
    damage: "software",
    low: 75000,
    high: 300000,
    source:
      "IDN Times: install ulang OS Rp75-150 ribu; flash BIOS Rp100-300 ribu",
  },
];
// Belum ada sumber yang layak untuk: tablet, MacBook/iPad/iPhone, kipas/thermal, kamera. Tampil "perlu pemeriksaan teknisi".

// CATATAN: baris di bawah adalah REFERENSI HARGA PASAR ONLINE (listing Tokopedia, dicek 2026-11-11),
// verified:false, serviceFee:null (biaya jasa ditetapkan pengelola/teknisi). Ubah verified:true
// dan isi serviceFee setelah dikonfirmasi pemasok/teknisi. Harga listing berubah-ubah.
const PRICE_CATALOG = [
  {
    type: "Smartphone",
    brand: "Samsung",
    series: "Galaxy A1x (A14 / A15 / A16 / A17)",
    model: "Galaxy A15 (4G)",
    variant: "",
    damage: "lcd",
    component: "LCD fullset touchscreen — Roker (compatible, fullset)",
    quality: "aftermarket",
    partPrice: 197400,
    serviceFee: null,
    stock: null,
    verified: false,
    source:
      "Tokopedia listing https://www.tokopedia.com/find/lcd-samsung-a15 — penjual Roker Indonesia; listing mencakup A15 4G/5G",
    updated: "2026-11-11",
  },
  {
    type: "Smartphone",
    brand: "Samsung",
    series: "Galaxy A1x (A14 / A15 / A16 / A17)",
    model: "Galaxy A15 (4G)",
    variant: "",
    damage: "lcd",
    component: "LCD fullset touchscreen — Benua Spare Part (OG Super)",
    quality: "aftermarket",
    partPrice: 185000,
    serviceFee: null,
    stock: null,
    verified: false,
    source:
      "Tokopedia listing https://www.tokopedia.com/find/lcd-samsung-a15 — penjual benua spare part; listing mencakup A15 4G/5G",
    updated: "2026-11-11",
  },
  {
    type: "Smartphone",
    brand: "Samsung",
    series: "Galaxy A1x (A14 / A15 / A16 / A17)",
    model: "Galaxy A15 (4G)",
    variant: "",
    damage: "lcd",
    component: "LCD fullset touchscreen — Galactic (fullset)",
    quality: "aftermarket",
    partPrice: 245000,
    serviceFee: null,
    stock: null,
    verified: false,
    source:
      "Tokopedia listing https://www.tokopedia.com/find/lcd-samsung-a15 — penjual Bintang Official Store; listing mencakup A15 4G/5G",
    updated: "2026-11-11",
  },
  {
    type: "Smartphone",
    brand: "Samsung",
    series: "Galaxy A1x (A14 / A15 / A16 / A17)",
    model: "Galaxy A15 (4G)",
    variant: "",
    damage: "lcd",
    component:
      "LCD fullset touchscreen — Log-On (fullset, garansi test 7 hari)",
    quality: "aftermarket",
    partPrice: 402000,
    serviceFee: null,
    stock: null,
    verified: false,
    source:
      "Tokopedia listing https://www.tokopedia.com/find/lcd-samsung-a15 — penjual Log On Indonesia; listing mencakup A15 4G/5G",
    updated: "2026-11-11",
  },
  {
    type: "Smartphone",
    brand: "Samsung",
    series: "Galaxy A1x (A14 / A15 / A16 / A17)",
    model: "Galaxy A15 (5G)",
    variant: "",
    damage: "lcd",
    component: "LCD fullset touchscreen — Roker (compatible, fullset)",
    quality: "aftermarket",
    partPrice: 197400,
    serviceFee: null,
    stock: null,
    verified: false,
    source:
      "Tokopedia listing https://www.tokopedia.com/find/lcd-samsung-a15 — penjual Roker Indonesia; listing mencakup A15 4G/5G",
    updated: "2026-11-11",
  },
  {
    type: "Smartphone",
    brand: "Samsung",
    series: "Galaxy A1x (A14 / A15 / A16 / A17)",
    model: "Galaxy A15 (5G)",
    variant: "",
    damage: "lcd",
    component: "LCD fullset touchscreen — Benua Spare Part (OG Super)",
    quality: "aftermarket",
    partPrice: 185000,
    serviceFee: null,
    stock: null,
    verified: false,
    source:
      "Tokopedia listing https://www.tokopedia.com/find/lcd-samsung-a15 — penjual benua spare part; listing mencakup A15 4G/5G",
    updated: "2026-11-11",
  },
  {
    type: "Smartphone",
    brand: "Samsung",
    series: "Galaxy A1x (A14 / A15 / A16 / A17)",
    model: "Galaxy A15 (5G)",
    variant: "",
    damage: "lcd",
    component: "LCD fullset touchscreen — Galactic (fullset)",
    quality: "aftermarket",
    partPrice: 245000,
    serviceFee: null,
    stock: null,
    verified: false,
    source:
      "Tokopedia listing https://www.tokopedia.com/find/lcd-samsung-a15 — penjual Bintang Official Store; listing mencakup A15 4G/5G",
    updated: "2026-11-11",
  },
  {
    type: "Smartphone",
    brand: "Samsung",
    series: "Galaxy A1x (A14 / A15 / A16 / A17)",
    model: "Galaxy A15 (5G)",
    variant: "",
    damage: "lcd",
    component:
      "LCD fullset touchscreen — Log-On (fullset, garansi test 7 hari)",
    quality: "aftermarket",
    partPrice: 402000,
    serviceFee: null,
    stock: null,
    verified: false,
    source:
      "Tokopedia listing https://www.tokopedia.com/find/lcd-samsung-a15 — penjual Log On Indonesia; listing mencakup A15 4G/5G",
    updated: "2026-11-11",
  },
  {
    type: "Smartphone",
    brand: "Samsung",
    series: "Galaxy A1x (A14 / A15 / A16 / A17)",
    model: "Galaxy A15 (4G)",
    variant: "",
    damage: "lcd",
    component: "LCD OLED with frame (SM-A155F) — ZY",
    quality: "aftermarket",
    partPrice: 758000,
    serviceFee: null,
    stock: null,
    verified: false,
    source:
      "Tokopedia listing https://www.tokopedia.com/find/lcd-samsung-a15 — penjual ZY Indonesia",
    updated: "2026-11-11",
  },
  {
    type: "Smartphone",
    brand: "Apple (iPhone)",
    series: "iPhone 13 / 13 mini / 13 Pro / 13 Pro Max",
    model: "iPhone 13",
    variant: "",
    damage: "lcd",
    component: "LCD H-FIX fullset",
    quality: "aftermarket",
    partPrice: 444999,
    serviceFee: null,
    stock: null,
    verified: false,
    source:
      "Tokopedia listing https://www.tokopedia.com/h-fixofficialstore/layar-lcd-h-fix-for-ip-13-fullset-touchscreen-1732151160552916284 — penjual toko H-FIX Official",
    updated: "2026-11-11",
  },
  {
    type: "Smartphone",
    brand: "Apple (iPhone)",
    series: "iPhone 13 / 13 mini / 13 Pro / 13 Pro Max",
    model: "iPhone 13",
    variant: "",
    damage: "lcd",
    component: "LCD H-FIX fullset",
    quality: "aftermarket",
    partPrice: 516999,
    serviceFee: null,
    stock: null,
    verified: false,
    source:
      "Tokopedia listing https://www.tokopedia.com/find/touchscreen-iphone-13 — penjual HFIX Indonesia",
    updated: "2026-11-11",
  },
  {
    type: "Smartphone",
    brand: "Apple (iPhone)",
    series: "iPhone 13 / 13 mini / 13 Pro / 13 Pro Max",
    model: "iPhone 13",
    variant: "",
    damage: "lcd",
    component: "LCD OLED fullset (removable IC, listing 'OLED ORI')",
    quality: "aftermarket",
    partPrice: 950000,
    serviceFee: null,
    stock: null,
    verified: false,
    source:
      "Tokopedia listing https://www.tokopedia.com/find/touchscreen-iphone-13 — penjual WIN ON Indonesia",
    updated: "2026-11-11",
  },
  {
    type: "Smartphone",
    brand: "Apple (iPhone)",
    series: "iPhone 13 / 13 mini / 13 Pro / 13 Pro Max",
    model: "iPhone 13",
    variant: "",
    damage: "lcd",
    component: "LCD OLED fullset (removable IC, listing 'Original ZY')",
    quality: "aftermarket",
    partPrice: 1300000,
    serviceFee: null,
    stock: null,
    verified: false,
    source:
      "Tokopedia listing https://www.tokopedia.com/find/touchscreen-iphone-13 — penjual WIN ON Indonesia",
    updated: "2026-11-11",
  },
  {
    type: "Smartphone",
    brand: "Xiaomi / Redmi / POCO",
    series: "Redmi Note 11 / 12 / 13 / 14 / 15",
    model: "Redmi Note 13 (4G)",
    variant: "",
    damage: "lcd",
    component: "LCD fullset touchscreen compatible",
    quality: "aftermarket",
    partPrice: 214600,
    serviceFee: null,
    stock: null,
    verified: false,
    source:
      "Tokopedia listing https://www.tokopedia.com/find/lcd-redmi-13 — penjual Roker Indonesia",
    updated: "2026-11-11",
  },
  {
    type: "Smartphone",
    brand: "Xiaomi / Redmi / POCO",
    series: "Redmi Note 11 / 12 / 13 / 14 / 15",
    model: "Redmi Note 13 (4G)",
    variant: "",
    damage: "lcd",
    component: "LCD fullset touchscreen compatible (OG)",
    quality: "aftermarket",
    partPrice: 207000,
    serviceFee: null,
    stock: null,
    verified: false,
    source:
      "Tokopedia listing https://www.tokopedia.com/find/lcd-redmi-note-13-pro-5g-original — penjual Lcdphone",
    updated: "2026-11-11",
  },
  {
    type: "Smartphone",
    brand: "Xiaomi / Redmi / POCO",
    series: "Redmi Note 11 / 12 / 13 / 14 / 15",
    model: "Redmi Note 13 (4G)",
    variant: "",
    damage: "lcd",
    component: "LCD fullset (Original Y8, listing)",
    quality: "aftermarket",
    partPrice: 144500,
    serviceFee: null,
    stock: null,
    verified: false,
    source:
      "Tokopedia listing https://www.tokopedia.com/find/lcd-redmi-note-13-pro-5g-original — penjual Benua Cell",
    updated: "2026-11-11",
  },
  {
    type: "Smartphone",
    brand: "Xiaomi / Redmi / POCO",
    series: "Redmi Note 11 / 12 / 13 / 14 / 15",
    model: "Redmi Note 13 (4G)",
    variant: "",
    damage: "lcd",
    component: "LCD service pack fullset HD",
    quality: "aftermarket",
    partPrice: 181300,
    serviceFee: null,
    stock: null,
    verified: false,
    source:
      "Tokopedia listing https://www.tokopedia.com/find/xiaomi-redmi-note-13-pro-5g — penjual FLYCDI Sparepart",
    updated: "2026-11-11",
  },
  {
    type: "Smartphone",
    brand: "Xiaomi / Redmi / POCO",
    series: "Redmi Note 11 / 12 / 13 / 14 / 15",
    model: "Redmi Note 13 (4G)",
    variant: "",
    damage: "lcd",
    component: "LCD touchscreen compatible (listing 'Original')",
    quality: "aftermarket",
    partPrice: 700000,
    serviceFee: null,
    stock: null,
    verified: false,
    source:
      "Tokopedia listing https://www.tokopedia.com/find/lcd-redmi-note-13-pro-5g-original — penjual WINON Mobile",
    updated: "2026-11-11",
  },
  {
    type: "Smartphone",
    brand: "Xiaomi / Redmi / POCO",
    series: "Redmi Note Pro / Pro+",
    model: "Redmi Note 13 Pro",
    variant: "5G",
    damage: "lcd",
    component: "LCD fullset touchscreen compatible",
    quality: "aftermarket",
    partPrice: 214600,
    serviceFee: null,
    stock: null,
    verified: false,
    source:
      "Tokopedia listing https://www.tokopedia.com/find/lcd-redmi-13 — penjual Roker Indonesia",
    updated: "2026-11-11",
  },
  {
    type: "Smartphone",
    brand: "Xiaomi / Redmi / POCO",
    series: "Redmi Note Pro / Pro+",
    model: "Redmi Note 13 Pro",
    variant: "5G",
    damage: "lcd",
    component: "LCD fullset touchscreen (listing 'Original OEM')",
    quality: "aftermarket",
    partPrice: 378000,
    serviceFee: null,
    stock: null,
    verified: false,
    source:
      "Tokopedia listing https://www.tokopedia.com/find/lcd-redmi-note-13-pro-5g-original — penjual HSM Sparepart",
    updated: "2026-11-11",
  },
  {
    type: "Smartphone",
    brand: "Xiaomi / Redmi / POCO",
    series: "Redmi Note Pro / Pro+",
    model: "Redmi Note 13 Pro",
    variant: "5G",
    damage: "lcd",
    component: "LCD touchscreen compatible (listing 'Original')",
    quality: "aftermarket",
    partPrice: 700000,
    serviceFee: null,
    stock: null,
    verified: false,
    source:
      "Tokopedia listing https://www.tokopedia.com/find/lcd-redmi-note-13-pro-5g-original — penjual WINON Mobile",
    updated: "2026-11-11",
  },
].concat(typeof PRICE_DATA !== "undefined" ? PRICE_DATA : []);
