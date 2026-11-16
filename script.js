
const ENABLE_LIVE_PRICE_SEARCH = true;

// Jumlah maksimal kemungkinan kerusakan yang ditampilkan (1 = hanya yang paling mungkin)
const MAX_POSSIBILITIES = 2;
const GEMINI_MODEL = "gemini-3.5-flash-lite";

let userData = null;
let currentDiagnosis = null;
let shopCache = null;
let lastCoords = null;

const photos = { front: null, back: null, side: null };
const ANGLE_LABEL = { front: "depan", back: "belakang", side: "samping" };

// DROPDOWN MERK & SERI (data dari data/deviceSeries.js)
function updateBrandOptions() {
  const typeEl = document.getElementById("deviceType");
  const type = typeEl?.value || "";
  const sel = document.getElementById("deviceBrand");
  if (!sel) return;

  sel.innerHTML = '<option value="">-- Pilih Merek --</option>';
  if (type) {
    Object.keys(DEVICE_SERIES[type] || {}).forEach((b) =>
      sel.add(new Option(b, b)),
    );
  }
  updateSeriesOptions();
  refreshShops();
}

function updateSeriesOptions() {
  const type = document.getElementById("deviceType")?.value || "";
  const brand = document.getElementById("deviceBrand")?.value || "";
  const sel = document.getElementById("deviceSeries");
  if (!sel) return;

  sel.innerHTML = '<option value="">-- Pilih Seri / Keluarga --</option>';
  if (type && brand) {
    (DEVICE_SERIES[type]?.[brand] || []).forEach((s) =>
      sel.add(new Option(s.name, s.name)),
    );
  }
  updateModelOptions();
}

function updateModelOptions() {
  const type = document.getElementById("deviceType")?.value || "";
  const brand = document.getElementById("deviceBrand")?.value || "";
  const series = document.getElementById("deviceSeries")?.value || "";
  const sel = document.getElementById("deviceModel");
  if (!sel) return;

  sel.innerHTML = '<option value="">-- Pilih Model Spesifik --</option>';
  if (type && brand && series) {
    const models = DEVICE_MODELS[`${type}|${brand}|${series}`] || [];
    models.forEach((m) =>
      sel.add(new Option(m.code ? `${m.name} (${m.code})` : m.name, m.name)),
    );
    sel.add(
      new Option(
        "Model lain / belum ada di daftar (input manual)",
        MODEL_MANUAL,
      ),
    );
    if (!models.length) sel.value = MODEL_MANUAL;
  }
  onModelChange();
}

function onModelChange() {
  const sel = document.getElementById("deviceModel");
  const type = document.getElementById("deviceType")?.value || "";
  const brand = document.getElementById("deviceBrand")?.value || "";
  const series = document.getElementById("deviceSeries")?.value || "";
  const manual = sel.value === MODEL_MANUAL;
  document
    .getElementById("deviceModelManual")
    .classList.toggle("hidden", !manual);
  const m = (DEVICE_MODELS[`${type}|${brand}|${series}`] || []).find(
    (x) => x.name === sel.value,
  );
  document.getElementById("deviceVariantList").innerHTML = (m?.variants || [])
    .map((v) => `<option value="${v}">`)
    .join("");
}

function getDeviceSelection() {
  const val = (id) => document.getElementById(id)?.value.trim() || "";
  const picked = val("deviceModel");
  const manual = picked === MODEL_MANUAL;
  return {
    type: val("deviceType"),
    brand: val("deviceBrand"),
    series: val("deviceSeries"),
    model: manual ? val("deviceModelManual") : picked,
    manual,
    variant: val("deviceVariant"),
  };
}

// SLOT FOTO: DEPAN / BELAKANG / SAMPING
function renderPhotoSlots() {
  const box = document.getElementById("photoSlots");
  if (!box) return;
  box.innerHTML = Object.keys(ANGLE_LABEL)
    .map(
      (a) => `
    <label class="cursor-pointer text-center">
      <div id="preview-${a}" class="aspect-square max-w-[140px] mx-auto border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 text-2xl hover:bg-slate-100 overflow-hidden">
        <i class="fa-solid fa-camera"></i>
      </div>
      <span class="text-[11px] font-semibold text-slate-700 mt-1 block">Tampak ${ANGLE_LABEL[a][0].toUpperCase() + ANGLE_LABEL[a].slice(1)}</span>
      <input type="file" accept="image/*" class="hidden" onchange="handleAnglePhoto('${a}', event)" />
    </label>`,
    )
    .join("");
}

function handleAnglePhoto(angle, e) {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    alert("Ukuran foto maksimal 10MB.");
    e.target.value = "";
    return;
  }
  photos[angle] = file;
  document.getElementById("preview-" + angle).innerHTML =
    `<img src="${URL.createObjectURL(file)}" class="w-full h-full object-cover" alt="Tampak ${ANGLE_LABEL[angle]}">`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
  });
}

// SESI & AUTH
window.addEventListener("DOMContentLoaded", () => {
  renderPhotoSlots();
  updateBrandOptions();
  const saved = localStorage.getItem("rc_user_session");
  if (saved) {
    userData = JSON.parse(saved);
    renderDashboardView();
  }
});

function openAuthModal() {
  document.getElementById("authModal").classList.remove("hidden");
}
function closeAuthModal() {
  document.getElementById("authModal").classList.add("hidden");
}

function getLocation() {
  const geoBtn = document.getElementById("geoBtn");
  const geoText = document.getElementById("geoText");
  const geoIcon = document.getElementById("geoIcon");
  if (!navigator.geolocation) {
    alert("Browser kamu tidak mendukung fitur Geolocation.");
    return;
  }
  geoText.innerText = "Mendeteksi Koordinat GPS...";
  geoIcon.className = "fa-solid fa-spinner animate-spin text-blue-600";
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      document.getElementById("userLat").value = pos.coords.latitude;
      document.getElementById("userLng").value = pos.coords.longitude;
      geoBtn.className =
        "w-full bg-emerald-50 text-emerald-700 border border-emerald-300 text-xs font-semibold py-3 px-3 rounded-xl flex items-center justify-center gap-2";
      geoText.innerText = "GPS Lokasi Berhasil Terkunci!";
      geoIcon.className = "fa-solid fa-circle-check text-emerald-600";
    },
    (err) => {
      console.error("Error GPS:", err);
      alert(
        "Gagal mengakses lokasi GPS. Pastikan izin lokasi browser kamu aktif.",
      );
      geoText.innerText = "Coba Aktifkan GPS Lagi";
      geoIcon.className = "fa-solid fa-location-crosshairs text-blue-600";
    },
  );
}

function handleUserSubmit(e) {
  e.preventDefault();
  userData = {
    name: document.getElementById("userName").value,
    phone: document.getElementById("userPhone").value,
    lat: document.getElementById("userLat").value,
    lng: document.getElementById("userLng").value,
  };
  localStorage.setItem("rc_user_session", JSON.stringify(userData));
  closeAuthModal();
  renderDashboardView();
}

function renderDashboardView() {
  document.getElementById("guestLandingView").classList.add("hidden");
  document.getElementById("customerDashboardView").classList.remove("hidden");
  document.getElementById("dashNavName").innerText = userData.name;
  document.getElementById("dashGreetingName").innerText = userData.name;
  document.getElementById("avatarInitial").innerText = userData.name
    .charAt(0)
    .toUpperCase();
  const hasGps = userData.lat && userData.lng;
  document.getElementById("dashNavLoc").innerHTML = hasGps
    ? `<i class="fa-solid fa-circle text-[6px]"></i> GPS Terkunci`
    : `<i class="fa-solid fa-circle text-[6px] text-slate-400"></i> GPS Tidak Aktif`;
  refreshShops();
  window.scrollTo(0, 0);
}

function handleLogout() {
  localStorage.clear();
  location.reload();
}

// DIAGNOSA AI (GEMINI) + MULTI FOTO
const rp = (n) => "Rp" + Number(n).toLocaleString("id-ID");
const normStr = (s) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();
const PRICE_STATUS_TEXT = {
  model_manual: "Model belum ada di katalog — perlu pemeriksaan teknisi",
  no_price:
    "Harga/kompatibilitas belum tersedia di katalog — perlu pemeriksaan teknisi",
  out_of_stock: "Stok sparepart sedang kosong — hubungi toko",
};

function findPriceExact(sel, damage) {
  if (!sel.model || sel.manual) return { status: "model_manual" };
  const rows = PRICE_CATALOG.filter(
    (r) =>
      r.type === sel.type &&
      normStr(r.brand) === normStr(sel.brand) &&
      normStr(r.model) === normStr(sel.model) &&
      r.damage === damage &&
      (!r.variant || normStr(sel.variant).includes(normStr(r.variant))),
  );
  if (!rows.length) return { status: "no_price" };
  const avail = rows.filter(
    (r) => r.stock !== 0 && Number.isFinite(r.partPrice),
  );
  if (!avail.length)
    return {
      status: rows.some((r) => r.stock === 0) ? "out_of_stock" : "no_price",
    };
  // Jasa
  const ref = SERVICE_FEE_REF.find(
    (f) => f.type === sel.type && f.damage === damage,
  );
  const items = avail.map((r) => {
    const own = Number.isFinite(r.serviceFee);
    const lo = own ? r.serviceFee : ref?.low,
      hi = own ? r.serviceFee : ref?.high;
    const ok = Number.isFinite(lo) && Number.isFinite(hi);
    return {
      r,
      feeLo: lo,
      feeHi: hi,
      feeRef: !own && ok,
      hasFee: ok,
      total: ok ? r.partPrice + (lo + hi) / 2 : null,
      totalLo: ok ? r.partPrice + lo : null,
      totalHi: ok ? r.partPrice + hi : null,
    };
  });
  const hasFee = items.every((x) => x.hasFee);
  items.sort(
    (x, y) => (x.totalLo ?? x.r.partPrice) - (y.totalLo ?? y.r.partPrice),
  );
  return {
    status: hasFee ? "ok" : "part_only",
    rows: items,
    low: items[0],
    mid: items[Math.floor(items.length / 2)],
    high: items[items.length - 1],
    feeRef: items.some((x) => x.feeRef),
  };
}

function getDeviceTier(sel) {
  if (!sel) return "mid";
  const brand = normStr(sel.brand);
  const type = sel.type || "Smartphone";
  if (type === "Laptop" && brand.includes("apple")) return "macbook";
  if (type === "Smartphone" && brand.includes("apple")) return "iphone";

  // Cek katalog series resmi
  if (
    typeof DEVICE_SERIES !== "undefined" &&
    DEVICE_SERIES[type]?.[sel.brand]
  ) {
    const found = DEVICE_SERIES[type][sel.brand].find(
      (s) => normStr(s.name) === normStr(sel.series),
    );
    if (found && found.tier) return found.tier;
  }

  // Deteksi cerdas dari teks model & seri
  const str = normStr((sel.series || "") + " " + (sel.model || ""));
  if (
    /rog|legion|predator|tuf|nitro|alienware|omen|loq|ultra|fold|flip|pro max|magic|redmagic/.test(
      str,
    )
  ) {
    return "gaming_flagship";
  }
  if (
    /slim 1|slim 3|go 14|aspire 3|a0|a1|a2|redmi 9|redmi 10|redmi 12|redmi 13c|c series|y0|y1|y2|hot|smart|spark/.test(
      str,
    )
  ) {
    return "entry";
  }
  return "mid";
}

const TIERED_PRICING = {
  Smartphone: {
    entry: {
      tierLabel: "HP Entry Level (Seri Hemat/Harian)",
      lcd: { partLow: 135000, partHigh: 230000, feeLow: 60000, feeHigh: 90000 },
      baterai: {
        partLow: 75000,
        partHigh: 130000,
        feeLow: 45000,
        feeHigh: 75000,
      },
      charging_port: {
        partLow: 20000,
        partHigh: 35000,
        feeLow: 50000,
        feeHigh: 75000,
      },
      speaker_mic: {
        partLow: 25000,
        partHigh: 45000,
        feeLow: 40000,
        feeHigh: 65000,
      },
      camera: {
        partLow: 60000,
        partHigh: 120000,
        feeLow: 50000,
        feeHigh: 75000,
      },
      motherboard: {
        low: 180000,
        high: 320000,
        partLow: 100000,
        partHigh: 200000,
        feeLow: 80000,
        feeHigh: 120000,
      },
      software: {
        part: 0,
        feeLow: 40000,
        feeHigh: 75000,
        low: 40000,
        high: 75000,
      },
      touchscreen: {
        partLow: 60000,
        partHigh: 110000,
        feeLow: 50000,
        feeHigh: 80000,
      },
      water_damage: {
        low: 120000,
        high: 280000,
        feeLow: 80000,
        feeHigh: 150000,
      },
    },
    mid: {
      tierLabel: "HP Mid-Range (AMOLED / Performa)",
      lcd: {
        partLow: 320000,
        partHigh: 650000,
        feeLow: 80000,
        feeHigh: 130000,
      },
      baterai: {
        partLow: 110000,
        partHigh: 220000,
        feeLow: 50000,
        feeHigh: 90000,
      },
      charging_port: {
        partLow: 35000,
        partHigh: 65000,
        feeLow: 60000,
        feeHigh: 90000,
      },
      speaker_mic: {
        partLow: 35000,
        partHigh: 65000,
        feeLow: 50000,
        feeHigh: 80000,
      },
      camera: {
        partLow: 120000,
        partHigh: 250000,
        feeLow: 65000,
        feeHigh: 100000,
      },
      motherboard: {
        low: 250000,
        high: 550000,
        partLow: 150000,
        partHigh: 350000,
        feeLow: 100000,
        feeHigh: 200000,
      },
      software: {
        part: 0,
        feeLow: 50000,
        feeHigh: 90000,
        low: 50000,
        high: 90000,
      },
      touchscreen: {
        partLow: 100000,
        partHigh: 200000,
        feeLow: 70000,
        feeHigh: 100000,
      },
      water_damage: {
        low: 200000,
        high: 450000,
        feeLow: 100000,
        feeHigh: 200000,
      },
    },
    gaming_flagship: {
      tierLabel: "HP Flagship / Foldable (Premium)",
      lcd: {
        partLow: 1400000,
        partHigh: 2800000,
        feeLow: 150000,
        feeHigh: 250000,
      },
      baterai: {
        partLow: 250000,
        partHigh: 450000,
        feeLow: 100000,
        feeHigh: 150000,
      },
      charging_port: {
        partLow: 75000,
        partHigh: 150000,
        feeLow: 100000,
        feeHigh: 150000,
      },
      speaker_mic: {
        partLow: 60000,
        partHigh: 120000,
        feeLow: 70000,
        feeHigh: 110000,
      },
      camera: {
        partLow: 250000,
        partHigh: 650000,
        feeLow: 100000,
        feeHigh: 150000,
      },
      motherboard: {
        low: 500000,
        high: 1500000,
        feeLow: 150000,
        feeHigh: 350000,
      },
      software: {
        part: 0,
        feeLow: 60000,
        feeHigh: 120000,
        low: 60000,
        high: 120000,
      },
      touchscreen: {
        partLow: 400000,
        partHigh: 900000,
        feeLow: 120000,
        feeHigh: 200000,
      },
      water_damage: {
        low: 350000,
        high: 900000,
        feeLow: 150000,
        feeHigh: 300000,
      },
    },
    iphone: {
      tierLabel: "Apple iPhone",
      lcd: {
        partLow: 350000,
        partHigh: 850000,
        feeLow: 100000,
        feeHigh: 150000,
      },
      baterai: {
        partLow: 160000,
        partHigh: 350000,
        feeLow: 75000,
        feeHigh: 120000,
      },
      charging_port: {
        partLow: 70000,
        partHigh: 140000,
        feeLow: 90000,
        feeHigh: 150000,
      },
      speaker_mic: {
        partLow: 50000,
        partHigh: 100000,
        feeLow: 70000,
        feeHigh: 110000,
      },
      camera: {
        partLow: 200000,
        partHigh: 550000,
        feeLow: 100000,
        feeHigh: 150000,
      },
      motherboard: {
        low: 350000,
        high: 1200000,
        feeLow: 150000,
        feeHigh: 300000,
      },
      software: {
        part: 0,
        feeLow: 60000,
        feeHigh: 120000,
        low: 60000,
        high: 120000,
      },
      touchscreen: {
        partLow: 150000,
        partHigh: 350000,
        feeLow: 90000,
        feeHigh: 140000,
      },
      water_damage: {
        low: 300000,
        high: 800000,
        feeLow: 150000,
        feeHigh: 250000,
      },
    },
  },
  Tablet: {
    entry: {
      tierLabel: "Tablet Entry Level",
      lcd: {
        partLow: 220000,
        partHigh: 380000,
        feeLow: 70000,
        feeHigh: 110000,
      },
      baterai: {
        partLow: 120000,
        partHigh: 220000,
        feeLow: 50000,
        feeHigh: 85000,
      },
      charging_port: {
        partLow: 30000,
        partHigh: 55000,
        feeLow: 60000,
        feeHigh: 90000,
      },
      speaker_mic: {
        partLow: 35000,
        partHigh: 60000,
        feeLow: 45000,
        feeHigh: 75000,
      },
      camera: {
        partLow: 70000,
        partHigh: 140000,
        feeLow: 50000,
        feeHigh: 80000,
      },
      motherboard: {
        low: 220000,
        high: 450000,
        feeLow: 90000,
        feeHigh: 150000,
      },
      software: {
        part: 0,
        feeLow: 50000,
        feeHigh: 90000,
        low: 50000,
        high: 90000,
      },
    },
    mid: {
      tierLabel: "Tablet Standar / iPad",
      lcd: {
        partLow: 450000,
        partHigh: 950000,
        feeLow: 90000,
        feeHigh: 150000,
      },
      baterai: {
        partLow: 180000,
        partHigh: 350000,
        feeLow: 70000,
        feeHigh: 110000,
      },
      charging_port: {
        partLow: 50000,
        partHigh: 90000,
        feeLow: 75000,
        feeHigh: 120000,
      },
      speaker_mic: {
        partLow: 50000,
        partHigh: 90000,
        feeLow: 60000,
        feeHigh: 90000,
      },
      camera: {
        partLow: 140000,
        partHigh: 280000,
        feeLow: 70000,
        feeHigh: 110000,
      },
      motherboard: {
        low: 350000,
        high: 750000,
        feeLow: 120000,
        feeHigh: 250000,
      },
      software: {
        part: 0,
        feeLow: 60000,
        feeHigh: 100000,
        low: 60000,
        high: 100000,
      },
    },
  },
  Laptop: {
    entry: {
      tierLabel: 'Laptop Entry Level (14" Celeron / i3 / Ryzen 3)',
      lcd: {
        partLow: 450000,
        partHigh: 680000,
        feeLow: 75000,
        feeHigh: 125000,
      },
      keyboard: {
        partLow: 110000,
        partHigh: 190000,
        feeLow: 60000,
        feeHigh: 100000,
      },
      baterai: {
        partLow: 180000,
        partHigh: 320000,
        feeLow: 40000,
        feeHigh: 75000,
      },
      hinge: { low: 100000, high: 220000, feeLow: 80000, feeHigh: 150000 },
      ram: { partLow: 150000, partHigh: 300000, feeLow: 35000, feeHigh: 60000 },
      storage: {
        partLow: 200000,
        partHigh: 450000,
        feeLow: 35000,
        feeHigh: 60000,
      },
      fan_thermal: {
        part: 0,
        feeLow: 50000,
        feeHigh: 90000,
        low: 50000,
        high: 90000,
      },
      software: {
        part: 0,
        feeLow: 50000,
        feeHigh: 90000,
        low: 50000,
        high: 90000,
      },
      motherboard: {
        low: 250000,
        high: 600000,
        feeLow: 100000,
        feeHigh: 200000,
      },
      speaker_mic: {
        partLow: 50000,
        partHigh: 100000,
        feeLow: 40000,
        feeHigh: 70000,
      },
      charging_port: {
        partLow: 35000,
        partHigh: 75000,
        feeLow: 60000,
        feeHigh: 95000,
      },
      water_damage: {
        low: 200000,
        high: 500000,
        feeLow: 100000,
        feeHigh: 200000,
      },
    },
    mid: {
      tierLabel: "Laptop Mid-Range / Ultrabook (Slim / OLED / i5-i7)",
      lcd: {
        partLow: 700000,
        partHigh: 1350000,
        feeLow: 90000,
        feeHigh: 150000,
      },
      keyboard: {
        partLow: 160000,
        partHigh: 280000,
        feeLow: 75000,
        feeHigh: 125000,
      },
      baterai: {
        partLow: 260000,
        partHigh: 480000,
        feeLow: 50000,
        feeHigh: 85000,
      },
      hinge: { low: 150000, high: 300000, feeLow: 100000, feeHigh: 180000 },
      ram: { partLow: 250000, partHigh: 500000, feeLow: 40000, feeHigh: 70000 },
      storage: {
        partLow: 280000,
        partHigh: 650000,
        feeLow: 40000,
        feeHigh: 70000,
      },
      fan_thermal: {
        part: 0,
        feeLow: 60000,
        feeHigh: 110000,
        low: 60000,
        high: 110000,
      },
      software: {
        part: 0,
        feeLow: 50000,
        feeHigh: 100000,
        low: 50000,
        high: 100000,
      },
      motherboard: {
        low: 350000,
        high: 850000,
        feeLow: 120000,
        feeHigh: 250000,
      },
      speaker_mic: {
        partLow: 80000,
        partHigh: 150000,
        feeLow: 50000,
        feeHigh: 85000,
      },
      charging_port: {
        partLow: 50000,
        partHigh: 110000,
        feeLow: 75000,
        feeHigh: 120000,
      },
      water_damage: {
        low: 300000,
        high: 750000,
        feeLow: 150000,
        feeHigh: 250000,
      },
    },
    gaming_flagship: {
      tierLabel: "Laptop Gaming & Flagship (144Hz+ / RTX)",
      lcd: {
        partLow: 950000,
        partHigh: 1900000,
        feeLow: 120000,
        feeHigh: 180000,
      },
      keyboard: {
        partLow: 260000,
        partHigh: 480000,
        feeLow: 100000,
        feeHigh: 160000,
      },
      baterai: {
        partLow: 350000,
        partHigh: 700000,
        feeLow: 60000,
        feeHigh: 100000,
      },
      hinge: { low: 180000, high: 350000, feeLow: 120000, feeHigh: 200000 },
      ram: { partLow: 350000, partHigh: 750000, feeLow: 45000, feeHigh: 80000 },
      storage: {
        partLow: 350000,
        partHigh: 900000,
        feeLow: 45000,
        feeHigh: 80000,
      },
      fan_thermal: {
        part: 0,
        feeLow: 100000,
        feeHigh: 180000,
        low: 100000,
        high: 180000,
      },
      software: {
        part: 0,
        feeLow: 60000,
        feeHigh: 120000,
        low: 60000,
        high: 120000,
      },
      motherboard: {
        low: 500000,
        high: 1800000,
        feeLow: 200000,
        feeHigh: 450000,
      },
      speaker_mic: {
        partLow: 100000,
        partHigh: 200000,
        feeLow: 60000,
        feeHigh: 100000,
      },
      charging_port: {
        partLow: 75000,
        partHigh: 150000,
        feeLow: 90000,
        feeHigh: 140000,
      },
      water_damage: {
        low: 450000,
        high: 1200000,
        feeLow: 200000,
        feeHigh: 350000,
      },
    },
    macbook: {
      tierLabel: "Apple MacBook (Air / Pro / Retina)",
      lcd: {
        partLow: 1800000,
        partHigh: 3800000,
        feeLow: 200000,
        feeHigh: 350000,
      },
      keyboard: {
        partLow: 300000,
        partHigh: 650000,
        feeLow: 180000,
        feeHigh: 300000,
      },
      baterai: {
        partLow: 550000,
        partHigh: 1100000,
        feeLow: 150000,
        feeHigh: 250000,
      },
      hinge: { low: 250000, high: 500000, feeLow: 150000, feeHigh: 250000 },
      ram: { low: 500000, high: 1200000, feeLow: 200000, feeHigh: 350000 },
      storage: { low: 500000, high: 1500000, feeLow: 200000, feeHigh: 350000 },
      fan_thermal: {
        part: 0,
        feeLow: 100000,
        feeHigh: 200000,
        low: 100000,
        high: 200000,
      },
      software: {
        part: 0,
        feeLow: 75000,
        feeHigh: 150000,
        low: 75000,
        high: 150000,
      },
      motherboard: {
        low: 600000,
        high: 1800000,
        feeLow: 250000,
        feeHigh: 500000,
      },
      speaker_mic: {
        partLow: 150000,
        partHigh: 300000,
        feeLow: 80000,
        feeHigh: 140000,
      },
      charging_port: {
        partLow: 120000,
        partHigh: 250000,
        feeLow: 100000,
        feeHigh: 180000,
      },
      water_damage: {
        low: 500000,
        high: 1500000,
        feeLow: 200000,
        feeHigh: 350000,
      },
    },
  },
};

function getGenericRange(sel, damage) {
  const type = sel.type || "Smartphone";
  const tier = getDeviceTier(sel);
  const tieredTable = TIERED_PRICING[type]?.[tier] || TIERED_PRICING[type]?.mid;
  if (tieredTable && tieredTable[damage]) {
    const item = tieredTable[damage];
    const low = item.low !== undefined ? item.low : item.partLow + item.feeLow;
    const high =
      item.high !== undefined ? item.high : item.partHigh + item.feeHigh;
    return {
      type,
      damage,
      tier,
      tierLabel: tieredTable.tierLabel,
      partLow: item.partLow,
      partHigh: item.partHigh,
      feeLow: item.feeLow,
      feeHigh: item.feeHigh,
      part: item.part,
      low,
      high,
      source: `Acuan estimasi pasaran untuk ${tieredTable.tierLabel}`,
    };
  }
  // Fallback cadangan
  return (
    GENERIC_RANGE.find((g) => g.type === sel.type && g.damage === damage) ||
    null
  );
}

function findPrice(sel, damage) {
  const r = findPriceExact(sel, damage);
  if (
    r.status !== "ok" &&
    r.status !== "part_only" &&
    r.status !== "out_of_stock"
  )
    r.generic = getGenericRange(sel, damage);
  return r;
}

function normalizePossibilities(list, type) {
  const banned = DAMAGE_NOT_APPLICABLE[type] || [];
  return (Array.isArray(list) ? list : [])
    .map((p) => ({
      damage: DAMAGE_TYPES[p.damage] ? p.damage : "other",
      component: p.component || DAMAGE_TYPES[p.damage] || "Tidak diketahui",
      confidence: Math.max(0, Math.min(100, Number(p.confidence) || 0)),
      reason: p.reason || "",
    }))
    .filter((p) => !banned.includes(p.damage))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, MAX_POSSIBILITIES);
}

function renderDiagnosisResult(r, poss, sel) {
  const el = (id) => document.getElementById(id);
  const set = (id, v) => {
    const e = el(id);
    if (e) e.innerText = v;
  };
  const rg = (lo, hi) => (lo === hi ? rp(lo) : `${rp(lo)} – ${rp(hi)}`);
  const priced = poss.map((p) => ({
    p,
    res:
      p.damage === "other" ? { status: "no_price" } : findPrice(sel, p.damage),
  }));
  const top = priced[0];
  const confirmed =
    !!top &&
    top.p.confidence >= 70 &&
    (priced.length === 1 || top.p.confidence - priced[1].p.confidence >= 25);

  [
    el("resPartPrice")?.closest(".bg-white"),
    el("priceMid")?.closest(".bg-blue-600"),
  ].forEach((e) => e && e.classList.add("hidden"));

  // harga sparepart & jasa per kemungkinan kerusakan
  const priceOf = ({ p, res }) => {
    const ref = SERVICE_FEE_REF.find(
      (f) => f.type === sel.type && f.damage === p.damage,
    );
    if (res.status === "ok" || res.status === "part_only") {
      const rows = res.rows;
      const part = rg(
        Math.min(...rows.map((x) => x.r.partPrice)),
        Math.max(...rows.map((x) => x.r.partPrice)),
      );
      if (res.status === "ok") {
        const tl = Math.min(...rows.map((x) => x.totalLo)),
          th = Math.max(...rows.map((x) => x.totalHi));
        return {
          part,
          fee:
            rg(
              Math.min(...rows.map((x) => x.feeLo)),
              Math.max(...rows.map((x) => x.feeHi)),
            ) + (res.feeRef ? " (referensi)" : ""),
          total: rp(res.mid.total),
          totalNote: tl !== th ? `Rentang ${rg(tl, th)}` : "",
          extra: "",
        };
      }
      return {
        part,
        fee: "Ditentukan teknisi",
        total: "Belum dapat dihitung",
        totalNote: "Biaya jasa belum ditetapkan",
        extra: "",
      };
    }
    if (p.live) {
      const L = p.live;
      return {
        part: rg(L.partLow, L.partHigh),
        fee:
          L.serviceLow !== null
            ? rg(L.serviceLow, L.serviceHigh) + (L.feeRef ? " (referensi)" : "")
            : "Ditentukan teknisi",
        total:
          L.totalLow !== null
            ? rp(Math.round((L.totalLow + L.totalHigh) / 2))
            : "Belum dapat dihitung",
        totalNote:
          L.totalLow !== null
            ? `Rentang ${rg(L.totalLow, L.totalHigh)} · dari pencarian web`
            : "Biaya jasa belum ditemukan",
        extra: "Dari pencarian web, belum diverifikasi",
      };
    }

    // FALLBACK dari data acuan bersumber (data/priceUpdate.js)
    const g = res.generic;
    if (g) {
      const hasP = Number.isFinite(g.partLow),
        hasF = Number.isFinite(g.feeLow);
      return {
        part:
          g.part === 0
            ? "Rp0 (masalah software)"
            : hasP
              ? rg(g.partLow, g.partHigh) + " (acuan pasar)"
              : "Belum ada data sumber",
        fee: hasF
          ? rg(g.feeLow, g.feeHigh) + " (acuan tarif)"
          : "Belum ada data sumber",
        total: rg(g.low, g.high),
        totalNote:
          g.part === 0
            ? "Biaya jasa pengerjaan tanpa sparepart"
            : g.tierLabel
              ? `Acuan estimasi pasaran: ${g.tierLabel}`
              : "Total acuan sparepart + jasa pasaran umum",
        extra: g.tierLabel
          ? `Estimasi disesuaikan untuk kategori: ${g.tierLabel}`
          : "",
      };
    }
    return {
      part: "Belum tersedia",
      fee: "Belum tersedia",
      total: "Belum dapat dihitung",
      totalNote:
        "Data harga untuk model/kerusakan ini belum ada — perlu pemeriksaan teknisi",
      extra: "",
    };
  };
  const box = (
    label,
    val,
  ) => `<div class="bg-slate-50 p-3 rounded-lg border border-slate-100">
      <span class="text-[11px] font-semibold text-slate-500 block">${label}</span>
      <p class="font-black text-sm text-blue-600 mt-1">${val}</p></div>`;

  el("resPossibilities").innerHTML = priced.length
    ? priced
        .map((x) => {
          const v = priceOf(x);
          return `<div class="bg-white border border-slate-200 rounded-xl p-4 text-xs space-y-3">
          <div class="flex justify-between gap-2">
            <span class="font-bold text-sm text-slate-900">${escapeHtml(x.p.component)}</span>
            <span class="font-semibold text-blue-600 whitespace-nowrap">Keyakinan ${x.p.confidence}%</span>
          </div>
          ${x.p.reason ? `<p class="text-slate-600">${escapeHtml(x.p.reason)}</p>` : ""}
          <div class="grid grid-cols-2 gap-2">${box("Harga Sparepart", v.part)}${box("Biaya Jasa", v.fee)}</div>
          <div class="bg-blue-600 text-white p-3 rounded-lg text-center">
            <span class="text-[10px] uppercase tracking-wider opacity-80 block">Total Estimasi (Sparepart + Jasa)</span>
            <p class="text-lg font-black mt-0.5">${v.total}</p>
            ${v.totalNote ? `<p class="text-[10px] opacity-80 mt-0.5">${escapeHtml(v.totalNote)}</p>` : ""}
          </div>
          ${v.extra ? `<p class="text-[11px] text-slate-500">${escapeHtml(v.extra)}</p>` : ""}
        </div>`;
        })
        .join("")
    : `<p class="text-xs text-slate-500">AI tidak dapat menentukan kemungkinan kerusakan. Silakan periksakan ke teknisi.</p>`;

  // banner: kemungkinan perangkat bisa diperbaiki (%)
  const chance = Number(String(r.repairChance ?? "").replace(/[^\d.]/g, ""));
  const feasible =
    /layak/i.test(r.feasibility || "") && !/tidak/i.test(r.feasibility || "");
  el("resFeasibilityBadge").className =
    "p-4 rounded-2xl border flex items-center justify-between " +
    (feasible
      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
      : "bg-rose-50 border-rose-200 text-rose-900");
  set("resFeasibilityTitle", r.feasibility || "PERLU PEMERIKSAAN TEKNISI");
  set("resFeasibilityReason", r.feasibilityReason || "");
  const lbl = el("resDamagePercent")?.previousElementSibling;
  if (lbl) lbl.innerText = "Kemungkinan Diperbaiki";
  set(
    "resDamagePercent",
    Number.isFinite(chance) && String(r.repairChance ?? "") !== ""
      ? `${Math.round(chance)}%`
      : "-",
  );
  set("resDescription", r.description || "-");

  const hasCatalog = priced.some(
    (x) => x.res.status === "ok" || x.res.status === "part_only",
  );
  set(
    "resPriceNote",
    "Ini diagnosis awal dari AI, bukan kepastian teknis. " +
      (hasCatalog
        ? "Harga berasal dari katalog RepairConnect untuk model yang dipilih dan dapat berubah setelah pemeriksaan teknisi."
        : "Harga akhir ditentukan teknisi setelah pemeriksaan.") +
      (priced.some((x) => x.res.rows?.some((y) => y.r.verified === false))
        ? " Harga sparepart adalah REFERENSI PASAR ONLINE (bukan harga toko) dan belum diverifikasi."
        : "") +
      (liveNotice && !priced.some((x) => x.p.live) ? " " + liveNotice : "") +
      (priced.some((x) => x.p.live)
        ? ` Harga dari pencarian web otomatis (sumber: ${[...new Set(priced.filter((x) => x.p.live).flatMap((x) => x.p.live.sources))].join("; ")}), belum diverifikasi.`
        : "") +
      (priced.some((x) => x.res.generic && !x.p.live)
        ? " Perkiraan umum berasal dari artikel/forum untuk perangkat kelas biasa dan BUKAN harga model ini; perangkat flagship, gaming, atau berlayar premium bisa jauh lebih mahal."
        : "") +
      (priced.some((x) => x.res.feeRef)
        ? " Biaya jasa berupa rentang referensi rata-rata, bukan tarif toko tertentu."
        : ""),
  );

  return { confirmed, top };
}

// PENCARIAN HARGA LIVE (Gemini + Google Search)
// Dipakai HANYA bila katalog tidak punya harga untuk model & kerusakan tersebut.
// Syarat tampil: ada sumber pencarian (grounding) + angka sparepart masuk akal. Selain itu diabaikan.
const livePriceCache = {};
let liveBlockedUntil = 0,
  liveNotice = ""; // jeda otomatis saat kuota API habis (429)
async function fetchLivePrice(sel, p, fullName) {
  const key = [sel.type, fullName, p.damage].join("|").toLowerCase();
  if (!ENABLE_LIVE_PRICE_SEARCH || Date.now() < liveBlockedUntil) return null;
  if (key in livePriceCache) return livePriceCache[key];
  livePriceCache[key] = null;
  const prompt = `Cari di web (Tokopedia, Shopee, toko sparepart Indonesia, forum teknisi) kisaran harga TERKINI dalam Rupiah untuk:
- Sparepart: ${p.component} untuk ${fullName || sel.type} (${sel.type})
- Biaya jasa pasang/ganti untuk pekerjaan itu di Indonesia.
Aturan: gunakan hanya angka yang benar-benar ada di hasil pencarian, jangan menebak. Jika tidak ditemukan isi null.
Balas HANYA JSON: {"partLow":angka|null,"partHigh":angka|null,"serviceLow":angka|null,"serviceHigh":angka|null,"note":"kualitas/catatan singkat"}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        signal: ctrl.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
        }),
      },
    );
    const data = await res.json();
    if (res.status === 429) {
      liveBlockedUntil = Date.now() + 300000; // jeda 5 menit agar kuota tidak terbebani
      liveNotice =
        "Estimasi harga saat ini menggunakan acuan rata-rata pasaran umum.";
      delete livePriceCache[key];
      return null;
    }
    if (!res.ok) {
      console.warn(
        "Pencarian harga live tidak tersedia:",
        data.error?.message || res.statusText,
      );
      return null;
    }
    const cand = data.candidates?.[0];
    const text = (cand?.content?.parts || []).map((x) => x.text || "").join("");
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const j = JSON.parse(m[0]);
    const sources = [
      ...new Set(
        (cand?.groundingMetadata?.groundingChunks || [])
          .map((c) => c.web?.title || c.web?.uri)
          .filter(Boolean),
      ),
    ].slice(0, 4);
    const n = (v) =>
      v !== null &&
      v !== "" &&
      Number.isFinite(Number(v)) &&
      Number(v) >= 10000 &&
      Number(v) <= 100000000
        ? Number(v)
        : null;
    const partLow = n(j.partLow),
      partHigh = n(j.partHigh);
    let serviceLow = n(j.serviceLow),
      serviceHigh = n(j.serviceHigh),
      feeRef = false;
    if (
      !sources.length ||
      partLow === null ||
      partHigh === null ||
      partLow > partHigh
    )
      return null;
    if (
      serviceLow === null ||
      serviceHigh === null ||
      serviceLow > serviceHigh
    ) {
      const ref = SERVICE_FEE_REF.find(
        (f) => f.type === sel.type && f.damage === p.damage,
      );
      serviceLow = ref ? ref.low : null;
      serviceHigh = ref ? ref.high : null;
      feeRef = !!ref;
    }
    const hasFee = serviceLow !== null;
    return (livePriceCache[key] = {
      partLow,
      partHigh,
      serviceLow,
      serviceHigh,
      feeRef,
      sources,
      note: String(j.note || "").slice(0, 120),
      totalLow: hasFee ? partLow + serviceLow : null,
      totalHigh: hasFee ? partHigh + serviceHigh : null,
    });
  } catch (e) {
    console.warn("Pencarian harga live gagal:", e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// DIAGNOSA AI (teks dan/atau foto)
async function runAiDiagnosis(e) {
  e.preventDefault();
  const sel = getDeviceSelection();
  const issue = document.getElementById("issueInput").value;
  const fullName = [sel.brand, sel.series, sel.model, sel.variant]
    .filter(Boolean)
    .join(" ");
  document.getElementById("aiResultCard").classList.add("hidden");
  document.getElementById("aiLoading").classList.remove("hidden");

  try {
    const keys = Object.entries(DAMAGE_TYPES)
      .map(([k, v]) => `${k} (${v})`)
      .join(", ");
    const promptText = `
Kamu teknisi ahli servis elektronik di Indonesia. Buat DIAGNOSIS AWAL (bukan kepastian).
- Jenis: ${sel.type}
- Perangkat: ${fullName || "Tidak diketahui"}
- Keluhan: ${issue}
Jika ada foto (depan/belakang/samping), gunakan sebagai bukti visual.
JANGAN menyebut harga. Pilih "damage" HANYA dari kunci ini: ${keys}.
Beri paling banyak ${MAX_POSSIBILITIES} kemungkinan (cukup 1 bila keluhan sudah jelas), urut dari yang paling mungkin; confidence 0-100 jujur (rendah bila bukti kurang).
Balas HANYA JSON valid tanpa markdown:
{
  "possibilities": [{"damage": "kunci", "component": "nama komponen", "confidence": 0, "reason": "alasan singkat"}],
  "repairChance": angka 0-100 = peluang perangkat bisa diperbaiki dengan baik dan layak secara biaya,
  "feasibility": "LAYAK DIPERBAIKI" atau "TIDAK LAYAK DIPERBAIKI" atau "PERLU PEMERIKSAAN TEKNISI",
  "feasibilityReason": "alasan singkat",
  "description": "penjelasan teknis yang ramah pelanggan"
}`;
    const parts = [{ text: promptText }];
    for (const [angle, file] of Object.entries(photos)) {
      if (!file) continue;
      parts.push({ text: `Foto tampak ${ANGLE_LABEL[angle]}:` });
      parts.push({
        inline_data: { mime_type: file.type, data: await fileToBase64(file) },
      });
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 60000);
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        signal: ctrl.signal,
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      },
    );
    clearTimeout(timer);
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error?.message || "Gagal terhubung ke Gemini API");
    const r = JSON.parse(
      data.candidates[0].content.parts[0].text
        .replace(/```json|```/g, "")
        .trim(),
    );

    const poss = normalizePossibilities(r.possibilities, sel.type);
    // Cari harga web untuk maks. 2 kemungkinan teratas
    liveNotice = "";
    for (const p of poss.slice(0, 2)) {
      if (
        !ENABLE_LIVE_PRICE_SEARCH ||
        p.damage === "other" ||
        p.confidence < 30 ||
        Date.now() < liveBlockedUntil
      )
        continue;
      const ex = findPriceExact(sel, p.damage);
      if (ex.status !== "ok" && ex.status !== "part_only")
        p.live = await fetchLivePrice(sel, p, fullName);
    }
    const { confirmed, top } = renderDiagnosisResult(r, poss, sel);
    currentDiagnosis = {
      device: sel.type,
      brand: fullName,
      issue,
      component:
        poss.map((p) => `${p.component} (${p.confidence}%)`).join("; ") ||
        "Perlu pemeriksaan teknisi",
      price:
        confirmed && top.res.status === "ok"
          ? rp(top.res.mid.total)
          : top?.p.live?.totalLow != null
            ? `${rp(top.p.live.totalLow)} – ${rp(top.p.live.totalHigh)} (estimasi pencarian web)`
            : "Belum tersedia (perlu pemeriksaan teknisi)",
    };
    document.getElementById("aiResultCard").classList.remove("hidden");
  } catch (err) {
    console.error("Gemini API Error:", err);
    alert(
      "Terjadi kesalahan pada AI: " +
        (err.name === "AbortError"
          ? "AI terlalu lama merespons. Coba lagi."
          : err.message),
    );
  } finally {
    document.getElementById("aiLoading").classList.add("hidden");
  }
}

// WHATSAPP CONCIERGE
function sendWhatsApp(shopName, phone) {
  if (!currentDiagnosis) {
    alert("Silakan jalankan AI Repair Estimator di atas terlebih dahulu!");
    document
      .getElementById("aiEstimatorSection")
      ?.scrollIntoView({ behavior: "smooth" });
    return;
  }
  const text =
    `Halo ${shopName}, saya *${userData?.name || "Pelanggan"}* (${userData?.phone || "-"}) dari platform *RepairConnect*.\n\n` +
    `Saya ingin konsultasi servis perangkat:\n` +
    `• *Perangkat:* ${currentDiagnosis.device} (${currentDiagnosis.brand})\n` +
    `• *Kendala:* ${currentDiagnosis.issue}\n` +
    `• *Hasil AI:* ${currentDiagnosis.component}\n` +
    `• *Acuan Biaya Rata-rata:* ${currentDiagnosis.price}\n\n` +
    `Apakah perangkat bisa saya bawa ke toko untuk penanganan lebih lanjut? Terima kasih.`;
  window.open(
    `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
    "_blank",
  );
}

// QR & PASSPORT
function generateAndShowQR(code) {
  const c = document.getElementById("qrcodeCanvas");
  if (!c) return;
  c.innerHTML = "";
  new QRCode(c, {
    text: `${window.location.origin}/?verify=${code}`,
    width: 140,
    height: 140,
  });
  document.getElementById("qrPassCode").innerText = `ID: ${code}`;
  document.getElementById("qrModal").classList.remove("hidden");
}
function closeQrModal() {
  document.getElementById("qrModal").classList.add("hidden");
}
function openAddPassportModal() {
  document.getElementById("addPassportModal").classList.remove("hidden");
}
function closeAddPassportModal() {
  document.getElementById("addPassportModal").classList.add("hidden");
}

let savedReceiptDataUrl = null;

// 1. Kompres ringan & preview foto nota agar aman disimpan di localStorage
function previewReceiptImage(event) {
  const file = event.target.files[0];
  const previewImg = document.getElementById("receiptPreviewImg");
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = new Image();
    img.onload = function () {
      // Kompres gambar ke lebar maks 600px agar hemat memori localStorage
      const canvas = document.createElement("canvas");
      const maxWidth = 600;
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      savedReceiptDataUrl = canvas.toDataURL("image/jpeg", 0.7);
      previewImg.src = savedReceiptDataUrl;
      previewImg.classList.remove("hidden");
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// 2. Simpan data nota + foto secara permanen ke localStorage browser
function handleSavePassport(e) {
  e.preventDefault();
  const passportData = {
    deviceName: document.getElementById("newPassName").value,
    shopName: document.getElementById("newPassShop").value,
    detail: document.getElementById("newPassDetail").value,
    warrantyDays: document.getElementById("newPassWarranty")?.value || "30",
    receiptImg: savedReceiptDataUrl,
  };

  localStorage.setItem("repairConnectPassport", JSON.stringify(passportData));
  renderSavedPassport();

  closeAddPassportModal();
  alert(
    "Nota & foto kwitansi berhasil tersimpan permanen! Klik 'QR Pass' untuk melihat kode QR & bukti notamu.",
  );
}

// 3. Muat ulang data dari localStorage setiap kali halaman dibuka / di-refresh
function renderSavedPassport() {
  const raw = localStorage.getItem("repairConnectPassport");
  if (!raw) return;

  const data = JSON.parse(raw);
  const titleEl = document.getElementById("passDeviceTitle");
  const descEl = document.getElementById("passDeviceDesc");
  const qrShopText = document.getElementById("qrModalShopName");
  const qrReceiptBox = document.getElementById("qrModalReceiptPreview");

  if (titleEl) titleEl.innerText = data.deviceName;
  if (descEl) {
    descEl.innerText = `Terakhir servis: Hari ini (${data.shopName}) • ${data.detail} • Garansi ${data.warrantyDays} Hari`;
  }
  if (qrShopText) {
    qrShopText.innerText = `Lokasi Servis: ${data.shopName}`;
  }
  if (qrReceiptBox && data.receiptImg) {
    qrReceiptBox.src = data.receiptImg;
    qrReceiptBox.classList.remove("hidden");
  }
}

// Otomatis jalankan saat halaman selesai dimuat / di-refresh
window.addEventListener("DOMContentLoaded", renderSavedPassport);

// MAPS: TOKO SESUAI JENIS PERANGKAT
function deviceCategory() {
  return document.getElementById("deviceType")?.value === "Laptop"
    ? "laptop"
    : "phone";
}

function classifyShop(tags) {
  const name = (tags.name || "").toLowerCase();
  const can = { laptop: false, phone: false };
  if (
    tags.shop === "computer" ||
    /laptop|komputer|computer|notebook|\bpc\b|macbook/.test(name)
  )
    can.laptop = true;
  if (
    tags.shop === "mobile_phone" ||
    /\bhp\b|phone|ponsel|seluler|selular|cell|gsm|handphone|gadget|iphone/.test(
      name,
    )
  )
    can.phone = true;
  if (!can.laptop && !can.phone) can.laptop = can.phone = true; // servis elektronik umum
  return can;
}

function distKm(lat1, lng1, lat2, lng2) {
  const r = Math.PI / 180,
    dLat = (lat2 - lat1) * r,
    dLng = (lng2 - lng1) * r;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

function normalizePhone(p) {
  if (!p) return null;
  let d = p.split(/[;,/]/)[0].replace(/\D/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  return d.length >= 9 ? d : null;
}

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}

function refreshShops() {
  const lat = parseFloat(userData?.lat || lastCoords?.lat);
  const lng = parseFloat(userData?.lng || lastCoords?.lng);
  if (shopCache && lat && lng) window.renderShops(shopCache, lat, lng);
  else if (lat && lng) window.fetchNearbyRepairShops(lat, lng);
  else window.renderFallbackShops();
}

async function fetchNearbyRepairShops(lat, lng) {
  lat = parseFloat(lat);
  lng = parseFloat(lng);
  lastCoords = { lat, lng };
  const box = document.getElementById("shopsContainer");
  if (!box) return;
  box.innerHTML = `<div class="col-span-2 text-center py-8 bg-white rounded-2xl border border-slate-200">
    <i class="fa-solid fa-spinner animate-spin text-2xl text-blue-600 mb-2"></i>
    <p class="text-xs font-semibold text-slate-600">Mencari tempat servis terdekat...</p></div>`;

  const q = `[out:json][timeout:25];(
    nwr(around:8000,${lat},${lng})["shop"~"^(computer|mobile_phone|electronics)$"];
    nwr(around:8000,${lat},${lng})["craft"="electronics_repair"];
  );out center 80;`;
  const mirrors = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
  ];
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  try {
    let res = null;
    for (const url of mirrors) {
      try {
        res = await fetch(url + "?data=" + encodeURIComponent(q), {
          signal: ctrl.signal,
        });
        if (res.ok) break;
      } catch (e) {
        /* coba mirror berikutnya */
      }
    }
    clearTimeout(timer);
    if (!res || !res.ok) throw new Error("Semua server Overpass gagal");
    const data = await res.json();
    shopCache = (data.elements || []).filter((el) => el.tags?.name);
    window.renderShops(shopCache, lat, lng);
  } catch (err) {
    clearTimeout(timer);
    console.warn("Overpass gagal, pakai fallback:", err);
    window.renderFallbackShops();
  }
}

// Data Toko Mitra Berlangganan (Prioritas Utama - Selalu Tampil Paling Atas)
// LOGIKA REKOMENDASI TOKO (MITRA VERIFIKASI PERTAMA)
const VERIFIED_PARTNER_SHOPS = [
  // 1. Mitra Khusus HP / Smartphone
  {
    name: "Triple D Gadget Care (Mitra Terverifikasi)",
    type: "phone",
    spec: "Spesialis Smartphone / HP",
    phone: "6289876543210",
    badge: "Mitra Terverifikasi — Rekomendasi Utama",
    lat: -6.984,
    lng: 110.412,
    isVerified: true,
    promo: { title: "Gratis cek & diagnosa awal", code: "RC-TRIPLED" },
    can: { phone: true, laptop: false },
  },
  {
    name: "Master Screen & Mobile Clinic (Mitra Terverifikasi)",
    type: "phone",
    spec: "Spesialis Layar & Baterai HP",
    phone: "6281298765432",
    badge: "Mitra Terverifikasi — Spesialis Layar",
    lat: -6.9835,
    lng: 110.408,
    isVerified: true,
    promo: {
      title: "Potongan Rp30.000 Khusus Ganti Layar",
      code: "RC-MASTERSCREEN",
    },
    can: { phone: true, laptop: false },
  },
  {
    name: "Doctor Gadget Care (Mitra Terverifikasi)",
    type: "phone",
    spec: "Spesialis Smartphone & Tablet",
    phone: "6281345678901",
    badge: "Mitra Terverifikasi",
    lat: -6.9865,
    lng: 110.418,
    isVerified: true,
    promo: { title: "Diskon Rp25.000 Ganti Sparepart", code: "RC-DOCGADGET" },
    can: { phone: true, laptop: false },
  },
  {
    name: "Pusat Servis HP Prima (Mitra Terverifikasi)",
    type: "phone",
    spec: "Spesialis Android & iPhone",
    phone: "6281567890123",
    badge: "Mitra Terverifikasi",
    lat: -6.9845,
    lng: 110.414,
    isVerified: true,
    promo: { title: "Gratis Antigores Pemasangan LCD", code: "RC-PRIMA" },
    can: { phone: true, laptop: false },
  },

  // 2. Mitra Khusus Laptop
  {
    name: "Laksana Komputer (Mitra Terverifikasi)",
    type: "laptop",
    spec: "Spesialis Laptop & Notebook",
    phone: "6281234567890",
    badge: "Mitra Terverifikasi — Rekomendasi Utama",
    lat: -6.9825,
    lng: 110.4091,
    isVerified: true,
    promo: { title: "Diskon 10% biaya jasa servis", code: "RC-LAKSANA10" },
    can: { phone: false, laptop: true },
  },
  {
    name: "Bintang Notebook & PC Solution (Mitra Terverifikasi)",
    type: "laptop",
    spec: "Spesialis Laptop Gaming & Office",
    phone: "6281789012345",
    badge: "Mitra Terverifikasi",
    lat: -6.98,
    lng: 110.403,
    isVerified: true,
    promo: { title: "Diskon 10% Jasa Servis Laptop", code: "RC-BINTANG10" },
    can: { phone: false, laptop: true },
  },
  {
    name: "Cyber Tech Laptop & Mac Hub (Mitra Terverifikasi)",
    type: "laptop",
    spec: "Spesialis Laptop & MacBook",
    phone: "6281890123456",
    badge: "Mitra Terverifikasi",
    lat: -6.9818,
    lng: 110.411,
    isVerified: true,
    promo: { title: "Gratis Cek Thermal & Fan Cleaning", code: "RC-CYBERMAC" },
    can: { phone: false, laptop: true },
  },
  {
    name: "Mega Notebook & Motherboard Center (Mitra Terverifikasi)",
    type: "laptop",
    spec: "Spesialis Motherboard & Engsel Laptop",
    phone: "6281901234567",
    badge: "Mitra Terverifikasi",
    lat: -6.9795,
    lng: 110.4075,
    isVerified: true,
    promo: { title: "Garansi Servis Hingga 60 Hari", code: "RC-MEGANOTE" },
    can: { phone: false, laptop: true },
  },

  // 3. Mitra KEDUANYA (Bisa Servis Laptop & Smartphone)
  {
    name: "iRepair & FixPoint (Mitra Terverifikasi)",
    type: "both",
    spec: "Laptop & Smartphone (Keduanya)",
    phone: "6281223344556",
    badge: "Mitra Terverifikasi — Multi-Device",
    lat: -6.9855,
    lng: 110.415,
    isVerified: true,
    promo: { title: "Diskon 15% Servis LCD & Baterai", code: "RC-IREPAIR15" },
    can: { phone: true, laptop: true },
  },
  {
    name: "Sentral Servis Digital (Mitra Terverifikasi)",
    type: "both",
    spec: "Laptop & Smartphone (Keduanya)",
    phone: "6281334455667",
    badge: "Mitra Terverifikasi — Multi-Device",
    lat: -6.981,
    lng: 110.406,
    isVerified: true,
    promo: { title: "Gratis Pembersihan & Cek Hardware", code: "RC-SENTRAL" },
    can: { phone: true, laptop: true },
  },
  {
    name: "Mitra Jaya Elektronik & Gadget (Mitra Terverifikasi)",
    type: "both",
    spec: "Laptop & Smartphone (Keduanya)",
    phone: "6281445566778",
    badge: "Mitra Terverifikasi",
    lat: -6.9875,
    lng: 110.42,
    isVerified: true,
    promo: { title: "Gratis Konsultasi & Cek Hardware", code: "RC-MITRAJAYA" },
    can: { phone: true, laptop: true },
  },
  {
    name: "Apex Gadget & Laptop Care (Mitra Terverifikasi)",
    type: "both",
    spec: "Laptop & Smartphone (Keduanya)",
    phone: "6281556677889",
    badge: "Mitra Terverifikasi",
    lat: -6.989,
    lng: 110.423,
    isVerified: true,
    promo: {
      title: "Diskon Jasa Servis Kilat Express",
      code: "RC-APEXEXPRESS",
    },
    can: { phone: true, laptop: true },
  },
];

function renderShops(elements, lat, lng) {
  const cat = deviceCategory();

  // 1. Ambil mitra terverifikasi sesuai kategori (HP -> HP & Both; Laptop -> Laptop & Both)
  const verifiedList = VERIFIED_PARTNER_SHOPS.filter(
    (s) => s.type === cat || s.type === "both" || (s.can && s.can[cat]),
  );

  // 2. Olah data toko dari peta (diambil hingga 8 toko agar slider panjang)
  const publicList = elements
    .map((el) => {
      const sLat = el.lat ?? el.center?.lat,
        sLng = el.lon ?? el.center?.lon;
      return {
        name: el.tags.name,
        can: classifyShop(el.tags),
        sLat,
        sLng,
        phone: normalizePhone(
          el.tags.phone ||
            el.tags["contact:phone"] ||
            el.tags["contact:whatsapp"],
        ),
        km: sLat ? distKm(lat, lng, sLat, sLng) : 999,
        isVerified: false,
      };
    })
    .filter((s) => s.sLat && s.can[cat])
    .sort((a, b) => a.km - b.km)
    .slice(0, 8); // Ambil 8 toko publik terdekat

  const combinedList = [...verifiedList, ...publicList];
  if (!combinedList.length) return renderFallbackShops();

  window.__shopList = combinedList;
  displayShopsHTML(combinedList);
}

function renderFallbackShops() {
  const cat = deviceCategory();
  const verifiedList = VERIFIED_PARTNER_SHOPS.filter(
    (s) => s.type === cat || s.type === "both" || (s.can && s.can[cat]),
  );

  // Cadangan toko yang lebih banyak untuk pengujian slider saat offline/fallback
  const fallbackPublic =
    cat === "laptop"
      ? [
          {
            name: "Toko Komputer & Servis Notebook",
            km: 2.1,
            phone: null,
            sLat: -6.98,
            sLng: 110.41,
            isVerified: false,
          },
          {
            name: "Servis Laptop Jaya",
            km: 3.5,
            phone: "6281999888777",
            sLat: -6.985,
            sLng: 110.415,
            isVerified: false,
          },
          {
            name: "Semarang Computer Repair",
            km: 4.2,
            phone: "6281222333444",
            sLat: -6.99,
            sLng: 110.42,
            isVerified: false,
          },
          {
            name: "UDINUS Service Corner",
            km: 0.5,
            phone: null,
            sLat: -6.981,
            sLng: 110.408,
            isVerified: false,
          },
          {
            name: "Pandanaran Tech Care",
            km: 2.8,
            phone: "6285666777888",
            sLat: -6.987,
            sLng: 110.412,
            isVerified: false,
          },
        ]
      : [
          {
            name: "Konter HP & Service Gadget",
            km: 1.5,
            phone: null,
            sLat: -6.98,
            sLng: 110.41,
            isVerified: false,
          },
          {
            name: "Bintang Cell Service",
            km: 2.8,
            phone: "6281777666555",
            sLat: -6.983,
            sLng: 110.413,
            isVerified: false,
          },
          {
            name: "Simpang Lima Repair Phone",
            km: 3.1,
            phone: "6289555444333",
            sLat: -6.988,
            sLng: 110.418,
            isVerified: false,
          },
          {
            name: "Tlogosari Gadget Fix",
            km: 4.5,
            phone: null,
            sLat: -6.992,
            sLng: 110.425,
            isVerified: false,
          },
        ];

  const combinedList = [...verifiedList, ...fallbackPublic];
  window.__shopList = combinedList;
  displayShopsHTML(combinedList);
}

function displayShopsHTML(list) {
  const box = document.getElementById("shopsContainer");
  if (!box) return;

  box.innerHTML = list
    .map((s, i) => {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name)}/@${s.sLat || s.lat},${s.sLng || s.lng},16z`;
      const distanceText = s.dist || `${s.km?.toFixed(1)} km`;

      const badgeHTML = s.isVerified
        ? `<span class="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-1 rounded-lg border border-amber-300 flex items-center gap-1 shrink-0">
            <i class="fa-solid fa-circle-check text-amber-600"></i> ${s.badge}
           </span>`
        : `<span class="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 shrink-0">Toko Lokal</span>`;

      const cardStyle = s.isVerified
        ? "min-w-[290px] sm:min-w-[320px] max-w-[320px] bg-gradient-to-br from-amber-50/40 via-white to-blue-50/30 border-2 border-amber-400/80 shadow-md snap-start"
        : "min-w-[290px] sm:min-w-[320px] max-w-[320px] bg-white border border-slate-200 shadow-sm snap-start";

      let waButtonHTML = "";
      if (s.phone) {
        waButtonHTML = `
          <button onclick="sendWhatsApp(window.__shopList[${i}].name, window.__shopList[${i}].phone)" 
                  class="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition shadow-sm">
            <i class="fa-brands fa-whatsapp"></i> Form WA Concierge
          </button>`;
      } else {
        waButtonHTML = `
          <div class="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center">
            <p class="text-[10px] text-slate-500 font-medium">
              <i class="fa-solid fa-circle-info text-blue-500 mr-1"></i> Nomor WA tidak tercantum. Disarankan langsung datang ke lokasi.
            </p>
          </div>`;
      }

      return `
      <div class="${cardStyle} p-5 rounded-2xl flex flex-col justify-between space-y-3 relative overflow-hidden">
        <div class="space-y-2">
          <div class="flex justify-between items-start gap-2">
            <h3 class="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2">
              ${escapeHtml(s.name)}
            </h3>
          </div>
          ${badgeHTML}
          <p class="text-xs text-slate-500">
            <i class="fa-solid fa-location-dot text-red-500 mr-1"></i>${distanceText} dari lokasimu
          </p>
        </div>
        
        <div class="space-y-2 pt-2 border-t border-slate-100">
          <a href="${mapsUrl}" target="_blank" 
             class="block text-center bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold py-2 px-3 rounded-xl border border-blue-200 transition">
            <i class="fa-solid fa-map-location-dot mr-1"></i> Lihat Rute di Google Maps
          </a>
          ${waButtonHTML}
        </div>
      </div>`;
    })
    .join("");
}

// MODAL AUTH & PENDAFTARAN MITRA B2B
function openMerchantAuthModal() {
  const modal = document.getElementById("merchantAuthModal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.style.display = "flex";
  }
}

function closeMerchantAuthModal() {
  const modal = document.getElementById("merchantAuthModal");
  if (modal) {
    modal.classList.add("hidden");
    modal.style.display = "none";
  }
}

function handleMerchantRegister(e) {
  if (e) e.preventDefault();

  // 1. LANGSUNG TUTUP MODAL SECARA FISIK
  closeMerchantAuthModal();

  // 2. Ambil data dari form
  const shopName = document.getElementById("regShopName")?.value || "";
  const mapsUrl = document.getElementById("regShopMaps")?.value || "";
  const spec = document.getElementById("regShopSpec")?.value || "";
  const phone = document.getElementById("regShopPhone")?.value || "";

  // 3. Reset form
  const form = document.getElementById("merchantForm");
  if (form) form.reset();

  // 4. Format nomor & pesan WhatsApp Admin
  const adminPhone = "6289509814543"; // Nomor WA Admin Tia
  const message =
    `Halo Admin *RepairConnect*, saya ingin mengkonfirmasi pendaftaran Mitra Berlangganan:\n\n` +
    `• *Nama Toko:* ${shopName}\n` +
    `• *Spesialisasi:* ${spec}\n` +
    `• *Alamat Google Maps:* ${mapsUrl}\n` +
    `• *No. WhatsApp Toko:* ${phone}\n\n` +
    `Mohon info langkah selanjutnya untuk aktivasi badge Mitra Terverifikasi. Terima kasih!`;

  // 5. Buka WhatsApp Direct (wa.me)
  const waUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
  window.open(waUrl, "_blank");

  // 6. Notifikasi Berhasil
  setTimeout(() => {
    alert(
      "Pendaftaran Berhasil Dikirim!\n\n" +
        "Formulir data toko Anda telah diteruskan. Silakan lanjutkan obrolan di WhatsApp untuk konfirmasi aktivasi Mitra Terverifikasi.",
    );
  }, 300);
}

// Tampilkan Kartu Nota Garansi Digital + Bukti Foto otomatis saat dibuka dari hasil scan QR
window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const verifyCode = params.get("verify");
  if (!verifyCode) return;

  const device = params.get("device") || "Vivo Y29";
  const service = params.get("service") || "Ganti LCD";
  const shop = params.get("shop") || "Triple D Gadget Care";
  const warranty = params.get("warranty") || "Garansi 15 Hari";

  // Ambil foto bukti nota dari semua kemungkinan penyimpanan lokal atau DOM
  const session = JSON.parse(localStorage.getItem("rc_user_session") || "{}");
  const passports = session.passports || session.notes || session.riwayat || [];
  const latest =
    Array.isArray(passports) && passports.length > 0
      ? passports[passports.length - 1]
      : {};

  // kunci penyimpanan paspor terpisah (jika ada) & elemen gambar di modal QR
  let savedPassport = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes("passport") || key.includes("rc_"))) {
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || "{}");
        if (parsed && parsed.receiptImg) {
          savedPassport = parsed;
          break;
        }
      } catch (e) {}
    }
  }
  const domImg =
    document.querySelector("#qrModal img:not([alt='QR'])")?.src || "";

  const receiptImg =
    savedPassport.receiptImg ||
    latest.receiptImg ||
    latest.receiptImage ||
    latest.receiptUrl ||
    latest.notaImg ||
    latest.image ||
    latest.photo ||
    latest.img ||
    session.receiptImg ||
    session.receiptImage ||
    localStorage.getItem("rc_receipt_img") ||
    (domImg.startsWith("data:image") ? domImg : "") ||
    "";

  const overlay = document.createElement("div");
  overlay.className =
    "fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto";
  overlay.innerHTML = `
    <div class="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 my-auto">
      <div class="bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full">Nota & Sertifikat Garansi</span>
          <span class="text-xs font-bold bg-emerald-400 text-slate-900 px-2.5 py-1 rounded-full">✓ TERVERIFIKASI</span>
        </div>
        <h2 class="text-xl font-bold mt-3">${verifyCode}</h2>
        <p class="text-blue-100 text-xs mt-0.5">RepairConnect Digital Warranty Passport</p>
      </div>

      <div class="p-5 space-y-3 text-sm">
        <div class="flex justify-between py-2 border-b border-slate-100">
          <span class="text-slate-500">Mitra Bengkel</span>
          <span class="font-semibold text-slate-800">${shop}</span>
        </div>
        <div class="flex justify-between py-2 border-b border-slate-100">
          <span class="text-slate-500">Perangkat</span>
          <span class="font-semibold text-slate-800">${device}</span>
        </div>
        <div class="flex justify-between py-2 border-b border-slate-100">
          <span class="text-slate-500">Tindakan Servis</span>
          <span class="font-semibold text-slate-800">${service}</span>
        </div>
        <div class="flex justify-between py-2 border-b border-slate-100">
          <span class="text-slate-500">Masa Berlaku</span>
          <span class="font-semibold text-emerald-600">${warranty} (Aktif)</span>
        </div>

        <div class="pt-2">
          <p class="text-xs font-semibold text-slate-500 mb-2">Lampiran Bukti Nota / Kondisi Perangkat:</p>
          ${
            receiptImg
              ? `<img src="${receiptImg}" alt="Bukti Nota" 
    onclick="const m=document.createElement('div');m.className='fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center p-4';m.innerHTML='<img src=\''+this.src+'\' class=\'max-w-full max-h-[85vh] rounded-xl object-contain shadow-2xl\'><button class=\'mt-4 px-6 py-2 bg-white text-slate-900 font-bold rounded-full text-sm\'>Tutup Foto</button>';m.onclick=()=>m.remove();document.body.appendChild(m);"
    class="max-h-56 mx-auto rounded-lg object-contain cursor-pointer active:scale-95 transition" />
  <p class="text-[11px] text-slate-400 text-center mt-1">Ketuk gambar untuk membuka ukuran penuh</p>`
              : `<div class="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500">
                   Lampiran foto tersimpan di perangkat pemilik nota. Pastikan kode <b>${verifyCode}</b> sesuai dengan fisik nota/perangkat.
                 </div>`
          }
        </div>

        <button onclick="this.closest('.fixed').remove(); window.history.replaceState({}, '', '/');"
          class="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2.5 rounded-xl transition">
          Tutup & Masuk ke Aplikasi
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
});

// === OTOMATISASI SARAN PERAWATAN & PERANGKAT UTAMA ===
function updatePreventiveCareUI() {
  const passTitle =
    document.getElementById("passDeviceTitle")?.innerText?.trim() || "";
  const passDesc =
    document.getElementById("passDeviceDesc")?.innerText?.trim() || "";

  // Jika belum ada nota baru yang masuk, biarkan default
  if (!passTitle || passTitle === "Belum Ada Nota Terdaftar") return;

  // 1. Ubah teks "ASUS VivoBook 14" di kartu "Perangkat Terdaftar Utama"
  document.querySelectorAll("h1, h2, h3, h4, p, div, span").forEach((el) => {
    if (
      el.children.length === 0 &&
      el.textContent.trim() === "Belum Ada Perangkat"
    ) {
      el.textContent = passTitle;
    }
  });

  // 2. Sesuaikan teks "Saran Perawatan Berkala Otomatis"
  const adviceEl = document.getElementById("preventiveAdviceText");
  if (adviceEl) {
    const lowerDev = passTitle.toLowerCase();
    const lowerDesc = passDesc.toLowerCase();

    if (lowerDesc.includes("lcd") || lowerDesc.includes("layar")) {
      adviceEl.innerText = `Perangkat ${passTitle} baru saja menjalani servis LCD/layar. Gunakan tempered glass & hindari tekanan berlebih di dalam tas/saku selama masa garansi aktif!`;
    } else if (lowerDesc.includes("baterai") || lowerDesc.includes("battery")) {
      adviceEl.innerText = `Baterai ${passTitle} baru diperbarui. Gunakan charger original dan hindari pemakaian hingga daya 0% agar kesehatan baterai tetap optimal.`;
    } else if (
      lowerDev.includes("laptop") ||
      lowerDev.includes("asus") ||
      lowerDev.includes("lenovo") ||
      lowerDev.includes("acer") ||
      lowerDev.includes("macbook")
    ) {
      adviceEl.innerText = `Perangkat ${passTitle} tercatat baru diservis. Jadwalkan pembersihan debu fan & pengecekan thermal paste setiap 6 bulan agar suhu tetap dingin.`;
    } else {
      adviceEl.innerText = `Perangkat ${passTitle} baru saja menjalani servis (${passDesc}). Simpan QR Passport ini untuk klaim garansi resmi dan pengecekan berkala 3 bulan ke depan.`;
    }
  }
}

window.addEventListener("DOMContentLoaded", () =>
  setTimeout(updatePreventiveCareUI, 300),
);
document.addEventListener("submit", () =>
  setTimeout(updatePreventiveCareUI, 400),
);

// === LIGHTBOX ZOOM FOTO BUKTI NOTA (ANTI-BLOKIR BROWSER) ===
document.addEventListener("click", function (e) {
  const img = e.target.closest("img[alt='Bukti Nota']");
  if (!img || !img.src) return;

  const modal = document.createElement("div");
  modal.className =
    "fixed inset-0 z-[9999] bg-black/90 flex flex-col items-center justify-center p-4";
  modal.innerHTML = `
    <img src="${img.src}" class="max-w-full max-h-[82vh] rounded-xl object-contain shadow-2xl" />
    <button type="button" class="mt-4 px-6 py-2 bg-white text-slate-900 font-bold rounded-full text-sm shadow">
      Tutup Foto
    </button>
  `;
  modal.addEventListener("click", () => modal.remove());
  document.body.appendChild(modal);
});

// Munculkan tombol QR Pass & sesuaikan teks modal QR jika sudah ada nota terdaftar
function syncQrModalState() {
  const passTitle =
    document.getElementById("passDeviceTitle")?.innerText?.trim() || "";
  const isEmpty =
    !passTitle ||
    passTitle === "Belum Ada Nota Terdaftar" ||
    passTitle === "ASUS VivoBook 14";

  document.querySelectorAll("button").forEach((btn) => {
    if (btn.textContent.trim() === "QR Pass") {
      btn.style.display = isEmpty ? "none" : "inline-flex";
    }
  });
}

window.addEventListener("DOMContentLoaded", () =>
  setTimeout(syncQrModalState, 350),
);
document.addEventListener("submit", () => setTimeout(syncQrModalState, 450));
