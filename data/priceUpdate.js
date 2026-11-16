// =====================================================================
// DATA HARGA BERSUMBER — dimuat SETELAH deviceCatalogWithPricing.js
// Dicek: 2026-11-14. Setiap angka punya sumber (lihat field `source`).
//
// Struktur GENERIC_RANGE (cadangan bila model tidak ada di katalog):
//   low/high           = TOTAL sparepart + jasa
//   partLow/partHigh   = kisaran harga SPAREPART (bila ada datanya)
//   feeLow/feeHigh     = kisaran biaya JASA (bila ada datanya)
//   part: 0            = tidak ada sparepart (software)
// Bila partLow & feeLow keduanya ada, total = penjumlahan keduanya.
// Bila hanya total yang ada di sumber, website menampilkan total saja
// dan jujur menulis bahwa rincian belum ada datanya.
// Tidak ada angka yang dikarang / dibagi dengan persentase asumsi.
//
// Belum ada sumber layak (tetap "perlu pemeriksaan teknisi"): iPhone, iPad,
// MacBook, Surface, tablet, kamera, touchscreen, dan kerusakan cairan.
// =====================================================================

// ---------- SUMBER ----------
const RC_SRC = {
  samsungSSC:
    "Samsung Members/Community: jasa SSC Rp160–200 ribu (https://r1.community.samsung.com/t5/galaxy-a/lcd/td-p/29908118); nota SSC Bogor jasa Rp130 ribu, baterai Rp299 ribu (https://r1.community.samsung.com/t5/apps-services/share-pengalaman-di-ssc-di-ccm-bogor-latepost/m-p/33305193); baterai S20 Ultra ±Rp413 ribu + jasa ±Rp150–200 ribu (https://r1.community.samsung.com/t5/galaxy-s/harga-baterai-s20-ultra/m-p/25868575/highlight/true)",
  tokpedLcdA15: "Tokopedia listing LCD Samsung A15, Okt 2026 (https://www.tokopedia.com/find/lcd-samsung-a15; https://www.tokopedia.com/find/lcd-samsung-galaxy-a15): Rp147 ribu–850 ribu; harga resmi Samsung ±Rp710 ribu (https://r1.community.samsung.com/t5/galaxy-a/harga-lcd-samsung-a15-4g/td-p/31374147)",
  tokpedBatHP: "Tokopedia baterai OPPO Reno 5 Rp127–289 ribu (https://www.tokopedia.com/find/baterai-hp-oppo-reno-5); Blibli baterai Samsung ±Rp97 ribu (https://www.blibli.com/jual/sparepart-hp-samsung)",
  blibliCharger: "Blibli board charger+IC Samsung Rp14.500–20.000 (https://www.blibli.com/jual/sparepart-hp-samsung)",
  idnHP: "IDN Times, Daftar Harga Servis HP (https://www.idntimes.com/tech/gadget/uswatun-khasanah-52/daftar-harga-servis-hp-mati-total)",
  idnLP: "IDN Times, Daftar Harga Servis Laptop (https://www.idntimes.com/tech/gadget/daftar-harga-servis-laptop-00-vs37w-3z1rkr)",
  julo: "Julo, Biaya Servis Laptop (https://www.julo.co.id/blog/biaya-servis-laptop)",
  jic: "JIC Computer: jasa LCD Rp150–250 ribu, keyboard Rp100–150 ribu, baterai Rp50–100 ribu (https://jiccom.com/laptop-service/)",
  snj: "Service Notebook Jakarta, tarif jasa pasang: LCD Rp100–250 ribu, keyboard Rp50–250 ribu, engsel Rp150 ribu, mainboard Rp200 ribu (https://servicenotebookjakarta.com/info-order-dan-jasa-pasang/)",
  berakal: "Berakalmod: jasa layar ±Rp100 ribu, keyboard Rp100–200 ribu (https://berakalmod.com/biaya-servis-laptop/)",
  royal: "Royal Laptop: jasa pasang RAM/SSD Rp50–75 ribu (https://royallaptop.id/ekspres-servis/)",
  tokpedLpLcd: "Tokopedia LCD laptop: Ideapad Slim 3 Rp598 ribu, Vivobook 14 Rp700 ribu, ROG Zephyrus Rp1,4 juta (OLED/layar premium Rp2–2,85 juta) (https://www.tokopedia.com/partlaptopp/etalase/sold; https://www.tokopedia.com/find/ASUS-Vivobook-14-A1400EA; https://www.tokopedia.com/sparepartlaptop1/product)",
  tokpedLpKb: "Tokopedia keyboard laptop Rp224–290 ribu (Acer, Axioo, HP) (https://www.tokopedia.com/partlaptopp/etalase/sold; https://www.tokopedia.com/sparepartlaptop1/product)",
  tokpedLpBat: "Tokopedia baterai laptop ASUS original Rp230–600 ribu (https://www.tokopedia.com/find/baterai-asus-a416jao; https://www.tokopedia.com/queen-comp/etalase/baterai)",
  tokpedRam: "Tokopedia RAM SODIMM DDR4 8GB Rp375–646 ribu (https://www.tokopedia.com/gasol-laptop/team-elite-sodimm-8gb-ddr4-pc25600-3200mhz-memory-ram; https://www.tokopedia.com/trinityonline/crucial-ddr4-8gb-16gb-32gb-sodimm-ddr4-3200-ram-notebook-laptop-8-gb)",
};

(function () {
  const upsert = (arr, row) => {
    const i = arr.findIndex((x) => x.type === row.type && x.damage === row.damage);
    if (i >= 0) arr[i] = row;
    else arr.push(row);
  };

  // ---------- 1. BIAYA JASA SAJA (dipakai bila baris katalog tak punya serviceFee) ----------
  const fee = (type, damage, low, high, source) =>
    upsert(SERVICE_FEE_REF, { type, damage, low, high, source });

  fee("Smartphone", "lcd", 100000, 200000, RC_SRC.samsungSSC + "; jasa konter non-resmi ±Rp100 ribu (https://r1.community.samsung.com/t5/galaxy-a/service-lcd-galaxy-a73/td-p/33492071)");
  fee("Smartphone", "baterai", 130000, 200000, RC_SRC.samsungSSC);
  fee("Laptop", "lcd", 100000, 250000, RC_SRC.jic + "; " + RC_SRC.snj);
  fee("Laptop", "keyboard", 100000, 200000, RC_SRC.jic + "; " + RC_SRC.berakal);
  fee("Laptop", "baterai", 50000, 100000, RC_SRC.jic);
  fee("Laptop", "hinge", 150000, 150000, RC_SRC.snj);
  fee("Laptop", "ram", 50000, 75000, RC_SRC.royal);
  fee("Laptop", "storage", 50000, 75000, RC_SRC.royal);

  // ---------- 2. KISARAN UMUM (cadangan) ----------
  const gen = (row) => {
    // total otomatis = sparepart + jasa bila keduanya ada
    if (Number.isFinite(row.partLow) && Number.isFinite(row.feeLow)) {
      row.low = row.partLow + row.feeLow;
      row.high = row.partHigh + row.feeHigh;
    }
    upsert(GENERIC_RANGE, row);
  };

  // --- Smartphone ---
  gen({ type: "Smartphone", damage: "lcd", partLow: 147000, partHigh: 850000, feeLow: 100000, feeHigh: 200000,
        source: RC_SRC.tokpedLcdA15 + "; jasa: " + RC_SRC.samsungSSC + ". HP flagship (mis. S22 Ultra ±Rp2,5–3,4 juta di SSC) bisa jauh lebih mahal." });
  gen({ type: "Smartphone", damage: "baterai", partLow: 97000, partHigh: 413000, feeLow: 130000, feeHigh: 200000,
        source: RC_SRC.tokpedBatHP + "; baterai resmi: " + RC_SRC.samsungSSC });
  gen({ type: "Smartphone", damage: "charging_port", partLow: 14500, partHigh: 20000, feeLow: 100000, feeHigh: 200000,
        source: RC_SRC.blibliCharger + "; jasa/ganti IC charger Rp100–200 ribu — " + RC_SRC.idnHP });
  gen({ type: "Smartphone", damage: "speaker_mic", low: 100000, high: 300000, source: RC_SRC.idnHP + " (ganti speaker Rp100–300 ribu; rincian sparepart belum ada datanya)" });
  gen({ type: "Smartphone", damage: "storage", low: 50000, high: 500000, source: RC_SRC.idnHP + " (ganti EMMC Rp50–500 ribu; rincian belum ada datanya)" });
  gen({ type: "Smartphone", damage: "motherboard", low: 100000, high: 1000000, source: RC_SRC.idnHP + " (ganti IC power Rp100–300 ribu; servis korslet Rp300 ribu–1 juta). Perbaikan level komponen: rincian sparepart/jasa belum ada datanya." });
  gen({ type: "Smartphone", damage: "software", part: 0, feeLow: 50000, feeHigh: 200000, low: 50000, high: 200000, source: RC_SRC.idnHP + " (reset Rp50–100 ribu; flash Rp100–200 ribu)" });

  // --- Laptop ---
  gen({ type: "Laptop", damage: "lcd", partLow: 598000, partHigh: 1400000, feeLow: 100000, feeHigh: 250000,
        source: RC_SRC.tokpedLpLcd + "; jasa: " + RC_SRC.jic + "; " + RC_SRC.snj + ". Layar OLED/premium lebih mahal." });
  gen({ type: "Laptop", damage: "keyboard", partLow: 224000, partHigh: 290000, feeLow: 100000, feeHigh: 200000,
        source: RC_SRC.tokpedLpKb + "; jasa: " + RC_SRC.jic + "; " + RC_SRC.berakal });
  gen({ type: "Laptop", damage: "baterai", partLow: 230000, partHigh: 600000, feeLow: 50000, feeHigh: 100000,
        source: RC_SRC.tokpedLpBat + "; jasa: " + RC_SRC.jic });
  gen({ type: "Laptop", damage: "ram", partLow: 375000, partHigh: 646000, feeLow: 50000, feeHigh: 75000,
        source: RC_SRC.tokpedRam + "; jasa: " + RC_SRC.royal });
  gen({ type: "Laptop", damage: "storage", feeLow: 50000, feeHigh: 75000, low: 200000, high: 1000000,
        source: RC_SRC.idnLP + " (servis hardisk/SSD Rp200 ribu–1 juta, total); jasa: " + RC_SRC.royal + ". Harga sparepart SSD belum ada datanya." });
  gen({ type: "Laptop", damage: "hinge", feeLow: 150000, feeHigh: 150000, low: 100000, high: 500000,
        source: RC_SRC.idnLP + " (ganti engsel Rp100–500 ribu, total); jasa: " + RC_SRC.snj + ". Harga sparepart engsel belum ada datanya." });
  gen({ type: "Laptop", damage: "motherboard", low: 300000, high: 4000000,
        source: RC_SRC.idnLP + " (servis board Rp200–500 ribu; ganti Rp0,8–3 juta); " + RC_SRC.julo + " (Rp1,5–4 juta); JIC Computer servis motherboard Rp300–800 ribu (https://jiccom.com/service-laptop-jakarta.php). Rincian sparepart/jasa belum ada datanya." });
  gen({ type: "Laptop", damage: "speaker_mic", low: 100000, high: 300000, source: RC_SRC.idnLP + " (ganti speaker Rp100–300 ribu; rincian belum ada datanya)" });
  gen({ type: "Laptop", damage: "fan_thermal", low: 100000, high: 500000,
        source: "JIC Computer perbaikan overheat Rp100–300 ribu (https://jiccom.com/service-laptop-jakarta.php); " + RC_SRC.julo + " (kipas Rp200–500 ribu). Rincian belum ada datanya." });
  gen({ type: "Laptop", damage: "software", part: 0, feeLow: 50000, feeHigh: 150000, low: 50000, high: 150000,
        source: RC_SRC.julo + " (install ulang OS Rp50–150 ribu); " + RC_SRC.idnLP + " (Rp75–150 ribu)" });
})();

// ---------- 3. BARIS KATALOG: Samsung Galaxy A15 (harga resmi Samsung) ----------
// Harga komponen layar resmi Samsung ±Rp710 ribu (satu paket dengan baterai & frame),
// BELUM termasuk jasa; jasa SSC Rp160–200 ribu (tengah Rp180 ribu).
// verified:false karena angka berasal dari laporan Samsung Members, bukan daftar harga toko Anda.
["Galaxy A15 (4G)", "Galaxy A15 (5G)"].forEach((model) => {
  PRICE_CATALOG.push({
    type: "Smartphone",
    brand: "Samsung",
    series: "Galaxy A1x (A14 / A15 / A16 / A17)",
    model,
    variant: "",
    damage: "lcd",
    component: "Layar service pack resmi Samsung (satu paket dengan baterai & frame)",
    quality: "original",
    partPrice: 710000,
    serviceFee: 180000,
    stock: null,
    verified: false,
    source: "Samsung Members: harga resmi ±Rp710 ribu (https://r1.community.samsung.com/t5/galaxy-a/harga-lcd-samsung-a15-4g/td-p/31374147); jasa SSC Rp160–200 ribu",
    updated: "2026-11-14",
  });
});
