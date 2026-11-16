/* =====================================================================
   revisi.js — dimuat SETELAH script.js
   Berisi perubahan berdasarkan saran 10 responden. script.js & data/*.js
   tidak diubah; fungsi tertentu ditimpa / dibungkus di sini.
   ===================================================================== */

const RC_AUTH = { email: false, password: false };
const RC_KNOWN_KEY = "rc_known_users";
const RC_REQ_KEY = "rc_passport_requests";
const RC_ACCT_KEY = "rc_account";
const RC_MERCHANT_KEY = "rc_merchant_session";
const RC_PASSPORT_HISTORY_KEY = "rc_passport_history";
const RC_DEMO_PIN = "1234";

const rcEl = (id) => document.getElementById(id);
const rcVal = (id) => rcEl(id)?.value || "";
const rcLoad = (k, d) => {
  try {
    const v = JSON.parse(localStorage.getItem(k));
    return v ?? d;
  } catch (e) {
    return d;
  }
};
const rcSave = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
    return true;
  } catch (e) {
    alert(
      "Penyimpanan perangkat penuh. Coba gunakan foto nota yang lebih kecil.",
    );
    return false;
  }
};
const rcPhoneKey = (p) => (p || "").replace(/\D/g, "").replace(/^0/, "62");
RCMerchantStore.initialize();

function rcAccts() {
  let a = rcLoad(RC_ACCT_KEY, {});
  if (a && a.phone && a.passwordHash) {
    a = { [a.phone]: { email: a.email || "", passwordHash: a.passwordHash } };
    rcSave(RC_ACCT_KEY, a);
  }
  return a || {};
}
const rcAcct = (key) => rcAccts()[key] || null;
function rcSetAcct(key, obj) {
  const a = rcAccts();
  a[key] = obj;
  rcSave(RC_ACCT_KEY, a);
}
const rcShopKey = (s) => s.name.replace(/\s*\(.*?\)\s*/g, "").trim();
const rcFmtDate = (ms) =>
  new Date(ms).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

/* ---------------------------------------------------------------------
   1. FORM PERANGKAT: berurutan (disabled), merek manual, tablet
   --------------------------------------------------------------------- */
function syncFormState() {
  const type = rcVal("deviceType"),
    brand = rcVal("deviceBrand"),
    series = rcVal("deviceSeries"),
    model = rcVal("deviceModel");
  const dis = (id, v) => {
    const e = rcEl(id);
    if (e) e.disabled = v;
  };

  const isOther = brand === "Merk Lainnya";
  rcEl("deviceBrandManual")?.classList.toggle("hidden", !isOther);
  if (isOther && !series) {
    const s = rcEl("deviceSeries");
    if (s && s.options.length > 1) {
      s.selectedIndex = 1;
      updateModelOptions();
      return;
    }
  }

  dis("deviceBrand", !type);
  dis("deviceBrandManual", !type);
  dis("deviceSeries", !brand);
  dis("deviceModel", !series);
  dis("deviceModelManual", !series);
  dis("deviceVariant", !model);
  dis("issueInput", !type);
  dis("aiSubmitBtn", !type);
  rcEl("photoSlots")?.classList.toggle("opacity-50", !type);
  rcEl("photoSlots")?.classList.toggle("pointer-events-none", !type);
  document
    .querySelectorAll("#photoSlots input")
    .forEach((i) => (i.disabled = !type));
  rcEl("formLockHint")?.classList.toggle("hidden", !!type);
}

[
  "updateBrandOptions",
  "updateSeriesOptions",
  "updateModelOptions",
  "onModelChange",
].forEach((n) => {
  const orig = window[n];
  window[n] = function (...a) {
    const r = orig.apply(this, a);
    syncFormState();
    return r;
  };
});

const _rcGetSel = getDeviceSelection;
window.getDeviceSelection = function () {
  const s = _rcGetSel();
  if (rcVal("deviceBrand") === "Merk Lainnya") {
    const b = rcVal("deviceBrandManual").trim();
    if (b) s.brand = b;
  }
  return s;
};

const _rcRunAi = runAiDiagnosis;
window.runAiDiagnosis = function (e) {
  e.preventDefault();
  if (!rcVal("deviceType")) {
    alert("Pilih jenis perangkat terlebih dahulu.");
    return;
  }
  if (
    rcVal("deviceBrand") === "Merk Lainnya" &&
    !rcVal("deviceBrandManual").trim()
  ) {
    alert("Ketik nama merek perangkatmu pada kolom Merek.");
    rcEl("deviceBrandManual")?.focus();
    return;
  }
  const ta = rcEl("issueInput");
  const hasPhoto = Object.values(photos).some(Boolean);
  if (!ta.value.trim() && !hasPhoto) {
    alert(
      "Isi deskripsi gejala ATAU unggah minimal satu foto (cukup salah satu).",
    );
    return;
  }
  const empty = !ta.value.trim();
  if (empty)
    ta.value = "(Tidak ada deskripsi teks — analisis berdasarkan foto)";
  const p = _rcRunAi(e);
  if (empty) ta.value = "";
  Promise.resolve(p).then(() => {
    if (currentDiagnosis) rcSave("rc_last_diagnosis", currentDiagnosis);
  });
  return p;
};
/* ---------------------------------------------------------------------
   2. REKOMENDASI TOKO NYATA SESUAI TITIK GPS PENGGUNA (MAKS 8 KM)
   --------------------------------------------------------------------- */
let rcShopLimit = 8;
window.__rcFallback = false;

function copyVoucher(code) {
  navigator.clipboard?.writeText(code);
  alert("Kode voucher " + code + " disalin. Tunjukkan saat servis di toko.");
}

window.displayShopsHTML = function (list) {
  const box = rcEl("shopsContainer");
  if (!box) return;
  const shown = list.slice(0, rcShopLimit);

  box.innerHTML =
    shown
      .map((s, i) => {
        const targetLat = s.sLat ?? s.lat;
        const targetLng = s.sLng ?? s.lng;
        const mapsUrl =
          targetLat && targetLng
            ? `https://www.google.com/maps/dir/?api=1&destination=${targetLat},${targetLng}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name)}`;

        const distanceText = Number.isFinite(s.km)
          ? `${s.km.toFixed(1)} km dari titik GPS kamu`
          : "Jarak belum diketahui";

        const area = [s.city, s.province].filter(Boolean).join(", ");
        const address = [s.address, area].filter(Boolean).join(" • ");
        const addrHtml = address
          ? `<p class="text-[11px] text-slate-500 leading-relaxed line-clamp-2"><i class="fa-solid fa-map-pin text-slate-400 mr-1"></i>${escapeHtml(address)}</p>`
          : "";

        const badge = s.isVerified
          ? `<span class="bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-emerald-200 inline-block"><i class="fa-solid fa-circle-check mr-1"></i>Mitra Terverifikasi</span>`
          : `<span class="bg-slate-100 text-slate-700 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 inline-block"><i class="fa-solid fa-circle-info mr-1"></i>Belum Terverifikasi</span>`;
        const specialization = `<span class="block text-[10px] text-slate-500 mt-1">${escapeHtml(s.specialization || s.spec || "Servis Elektronik")}</span>`;

        const wa = s.phone
          ? `<button onclick="sendWhatsApp(window.__shopList[${i}].name, window.__shopList[${i}].phone)" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition shadow-sm"><i class="fa-brands fa-whatsapp"></i> Hubungi via WhatsApp</button>`
          : `<div class="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center"><p class="text-[10px] text-slate-500"><i class="fa-solid fa-circle-info text-blue-500 mr-1"></i> Nomor WA belum tercantum di peta publik.</p></div>`;

        return `<div class="bg-white border border-slate-200 shadow-sm hover:shadow-md transition p-5 rounded-2xl flex flex-col justify-between gap-3">
          <div class="space-y-2">
            <h3 class="font-bold text-slate-900 text-sm leading-snug line-clamp-2">${escapeHtml(s.name)}</h3>
            ${badge}
            ${specialization}
            <p class="text-xs font-medium text-slate-600"><i class="fa-solid fa-location-dot text-red-500 mr-1"></i>${distanceText}</p>
            ${addrHtml}
          </div>
          <div class="space-y-2 pt-3 border-t border-slate-100">
            <a href="${mapsUrl}" target="_blank" rel="noopener" class="block text-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition"><i class="fa-solid fa-map-location-dot mr-1"></i> Lihat Rute di Google Maps</a>
            ${wa}
          </div>
        </div>`;
      })
      .join("") || "";

  const more = rcEl("shopMoreBox");
  if (more) {
    const cat =
      typeof deviceCategory === "function" ? deviceCategory() : "phone";
    const lat = parseFloat(lastCoords?.lat || userData?.lat);
    const lng = parseFloat(lastCoords?.lng || userData?.lng);
    const gmAll =
      Number.isFinite(lat) && Number.isFinite(lng)
        ? `https://www.google.com/maps/search/${cat === "laptop" ? "service+laptop+komputer" : "service+hp+tablet"}/@${lat},${lng},14z`
        : `https://www.google.com/maps/search/service+hp+laptop+terdekat`;

    more.innerHTML = `<div class="flex flex-wrap items-center justify-center gap-2.5">
      <a href="tempat-servis.html?cat=${cat}" class="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-5 py-3 rounded-xl transition shadow-sm"><i class="fa-solid fa-map-location-dot"></i> Lihat Semua di Peta</a>
      <a href="${gmAll}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-semibold px-5 py-3 rounded-xl transition shadow-sm"><i class="fa-brands fa-google text-blue-600"></i> Buka Semua Hasil di Google Maps</a>
    </div>`;
  }

  const info = rcEl("shopRadiusInfo");
  if (info) {
    if (lastCoords && Number.isFinite(lastCoords.lat)) {
      info.textContent = `Menampilkan ${shown.length} dari ${list.length} tempat servis di sekitar GPS (${lastCoords.lat.toFixed(4)}, ${lastCoords.lng.toFixed(4)}) • Maksimal 8 km.`;
    } else {
      info.textContent =
        "GPS belum aktif. Klik 'Gunakan lokasi saya' untuk mencari tempat servis di sekitar Anda.";
    }
  }
};

const RC_OVERPASS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
  "https://overpass-api.de/api/interpreter",
];

function rcRace(urls, q, ms) {
  return new Promise((resolve) => {
    let pending = urls.length,
      emptySeen = false,
      done = false;
    const ctrls = [];
    const finish = (v) => {
      if (done) return;
      done = true;
      ctrls.forEach((c) => c.abort());
      resolve(v);
    };
    urls.forEach((u) => {
      const c = new AbortController();
      ctrls.push(c);
      const t = setTimeout(() => c.abort(), ms);
      fetch(u + "?data=" + encodeURIComponent(q), { signal: c.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d) => {
          clearTimeout(t);
          if (!d || !Array.isArray(d.elements)) throw 0;
          if (d.elements.length) finish(d.elements);
          else {
            emptySeen = true;
            throw 0;
          }
        })
        .catch(() => {
          clearTimeout(t);
          if (--pending === 0) finish(emptySeen ? [] : null);
        });
    });
  });
}

function rcOverpass(lat, lng, radiusM) {
  const q = `[out:json][timeout:10];(
    nwr(around:${radiusM},${lat},${lng})["shop"~"^(mobile_phone|computer)$"];
    nwr(around:${radiusM},${lat},${lng})["craft"~"^(electronics_repair|computer_repair)$"];
  );out center 100;`;
  return rcRace(RC_OVERPASS, q, 6000);
}

// Pencarian gabungan Nominatim (viewbox kotak GPS 8 km) + Photon agar hasil jauh lebih lengkap
async function rcSearchMapsAroundGps(lat, lng, radiusKm, cat) {
  const cacheKey = `rc_osm_raw_v2_${cat}_${lat.toFixed(2)}_${lng.toFixed(2)}`;
  const cached = rcLoad(cacheKey, null);
  if (cached && Date.now() - cached.t < 6 * 3600 * 1000 && cached.els?.length) {
    return cached.els;
  }

  const results = [];

  // 1. ArcGIS Local Places Search (akurat radius 8 km & stabil tanpa 503/CORS)
  const arcWords =
    cat === "laptop"
      ? [
          "service laptop",
          "laptop repair",
          "service komputer",
          "computer repair",
          "notebook service",
          "service tablet",
          "komputer",
        ]
      : [
          "service hp",
          "service smartphone",
          "cellular",
          "ponsel",
          "service iphone",
          "service tablet",
          "gadget repair",
          "service laptop",
          "komputer",
        ];

  const arcTasks = arcWords.map((w) =>
    fetch(
      `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encodeURIComponent(w)}&location=${lng},${lat}&distance=${radiusKm * 1000}&maxLocations=25&outFields=PlaceName,Place_addr,Phone,Type`,
    )
      .then((r) => (r.ok ? r.json() : { candidates: [] }))
      .then((d) =>
        (d.candidates || []).map((c) => {
          const a = c.attributes || {};
          return {
            type: "node",
            lat: c.location?.y,
            lon: c.location?.x,
            tags: {
              name: a.PlaceName || c.address || "",
              address: a.Place_addr || c.address || "",
              phone: a.Phone || "",
              osm_key: a.Type || "",
              osm_value: "",
            },
          };
        }),
      )
      .catch(() => []),
  );

  const arcRes = (await Promise.all(arcTasks)).flat();
  results.push(...arcRes);

  // 2. Photon Komoot (dengan nama kota otomatis dari reverse geocode)
  let areaName = "";
  try {
    const rev = await fetch(
      `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`,
    );
    if (rev.ok) {
      const rj = await rev.json();
      const p = rj.features?.[0]?.properties || {};
      areaName = p.city || p.county || p.state || "";
    }
  } catch (e) {}

  const photonWords =
    cat === "laptop"
      ? [
          "service laptop",
          "laptop repair",
          "komputer",
          "computer service",
          "notebook repair",
          "service tablet",
        ]
      : [
          "service hp",
          "service handphone",
          "cellular",
          "ponsel",
          "iphone repair",
          "smartphone service",
          "service tablet",
          "gadget repair",
          "komputer",
        ];

  const photonTasks = photonWords.map((w) => {
    const q = areaName ? `${w} ${areaName}` : w;
    return fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=${lat}&lon=${lng}&limit=25`,
    )
      .then((r) => (r.ok ? r.json() : { features: [] }))
      .then((d) =>
        (d.features || [])
          .filter((f) => f.properties && f.properties.name)
          .map((f) => {
            const p = f.properties;
            const addr = [p.street, p.district || p.suburb, p.city]
              .filter(Boolean)
              .join(", ");
            return {
              type: "node",
              lat: f.geometry.coordinates[1],
              lon: f.geometry.coordinates[0],
              tags: {
                name: p.name,
                address: addr,
                osm_key: p.osm_key || "",
                osm_value: p.osm_value || "",
              },
            };
          }),
      )
      .catch(() => []);
  });

  const photonRes = (await Promise.all(photonTasks)).flat();
  results.push(...photonRes);

  // 3. Nominatim bounded viewbox (cadangan tambahan)
  const dLat = radiusKm / 111;
  const dLng = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  const viewbox = `${(lng - dLng).toFixed(4)},${(lat + dLat).toFixed(4)},${(lng + dLng).toFixed(4)},${(lat - dLat).toFixed(4)}`;
  const nomQueries =
    cat === "laptop" ? ["komputer", "laptop"] : ["cellular", "komputer"];

  for (let i = 0; i < nomQueries.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, 1100));
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(nomQueries[i])}&viewbox=${viewbox}&bounded=1&limit=25&accept-language=id`,
      );
      if (res.ok) {
        const data = await res.json();
        data.forEach((item) => {
          const parts = (item.display_name || "")
            .split(",")
            .map((p) => p.trim());
          const title = (item.name || parts[0] || "").trim();
          const addr = parts.slice(1, 4).join(", ");
          if (title) {
            results.push({
              type: "node",
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
              tags: {
                name: title,
                address: addr,
                osm_key: item.category || "",
                osm_value: item.type || "",
              },
            });
          }
        });
      }
    } catch (e) {}
  }

  if (results.length > 0) {
    rcSave(cacheKey, { t: Date.now(), els: results });
  }
  return results;
}

function rcCachedMapCandidates(category) {
  const candidates = [];
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (
        !key?.startsWith(`rc_map_page_${category}_`) &&
        !key?.startsWith(`rc_map_page_v2_${category}_`)
      )
        continue;
      const cached = JSON.parse(localStorage.getItem(key) || "null");
      if (!Array.isArray(cached?.list)) continue;
      cached.list.forEach((shop) => {
        const lat = Number(shop.sLat ?? shop.lat);
        const lng = Number(shop.sLng ?? shop.lng);
        if (!shop.name || !Number.isFinite(lat) || !Number.isFinite(lng))
          return;
        candidates.push({
          type: "node",
          lat,
          lon: lng,
          tags: {
            name: shop.name,
            address: shop.address || "",
            phone: shop.phone || "",
            shop: "",
          },
        });
      });
    }
  } catch (error) {}
  return candidates;
}

function rcMergeEls(a, b) {
  const seen = new Set(),
    res = [];
  [...a, ...b].forEach((el) => {
    const la = el.lat ?? el.center?.lat,
      lo = el.lon ?? el.center?.lon;
    if (!el.tags?.name || !la) return;
    const k = normStr(el.tags.name) + "|" + la.toFixed(3) + "|" + lo.toFixed(3);
    if (!seen.has(k)) {
      seen.add(k);
      res.push(el);
    }
  });
  return res;
}

window.fetchNearbyRepairShops = async function (lat, lng) {
  lat = parseFloat(lat);
  lng = parseFloat(lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  lastCoords = { lat, lng };
  rcSave("rc_last_coords", lastCoords);

  const box = rcEl("shopsContainer");
  const info = rcEl("shopRadiusInfo");
  if (!box) return;
  const cat = typeof deviceCategory === "function" ? deviceCategory() : "phone";

  box.innerHTML = `<div class="sm:col-span-2 text-center py-8 bg-white rounded-2xl border border-slate-200">
    <i class="fa-solid fa-spinner animate-spin text-2xl text-blue-600 mb-2"></i>
    <p class="text-xs font-semibold text-slate-700">Mencari tempat servis HP, laptop & tablet di sekitar GPS (${lat.toFixed(4)}, ${lng.toFixed(4)})...</p></div>`;
  if (info)
    info.textContent = `Mencari tempat servis di sekitar koordinat (${lat.toFixed(4)}, ${lng.toFixed(4)})...`;

  const used = 8;

  // Jalankan Overpass dan pencarian Nominatim + Photon secara bersamaan agar cepat
  const [rOverpass, rSearch] = await Promise.all([
    rcOverpass(lat, lng, 8000),
    rcSearchMapsAroundGps(lat, lng, used, cat),
  ]);

  const els = rcMergeEls(
    [...(rOverpass || []), ...rcCachedMapCandidates(cat)],
    rSearch || [],
  );

  window.__rcRadiusUsed = used;
  shopCache = els;
  renderShops(els, lat, lng);
};

function rcIsGadgetShop(name, tagStr) {
  const n =
    " " +
    String(name || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ") +
    " ";
  const tag = String(tagStr || "")
    .toLowerCase()
    .replace(/_/g, " ");

  // 1) pasti bukan: sekolah, bank, kendaraan, kesehatan, operator, dll.
  const hard =
    /\b(sekolah|smk|sma|smp|sd|universitas|kampus|institut|akademi|bimbel|kursus|bank|atm|masjid|gereja|klinik|apotek|apotik|puskesmas|rumah sakit|hotel|kost|kos|notaris|travel|tour|ekspedisi|laundry|catering|barber|salon|bengkel|motor|mobil|auto|honda|yamaha|suzuki|toyota|daihatsu|velg|aki|radiator|knalpot|dinamo|kulkas|mesin cuci|pompa|telkomsel|grapari|indosat|smartfren|optik|kacamata|sepatu|furniture|sofa|bangunan|wedding|furniture|sofa|bangunan|wedding|notary|dhl|makita|maktec|lakoni|niko|bosch|kurir|courier|cargo|logistik|generator)\b/;
  if (hard.test(n)) return false;

  // 2) kata kuat: perangkat/merek gadget (kata utuh)
  const strong =
    /\b(hp|handphone|hand phone|ponsel|seluler|selular|cellular|cell|gsm|konter|counter|smartphone|phone|iphone|ipad|ibox|android|xiaomi|redmi|poco|samsung|oppo|vivo|realme|infinix|tecno|itel|honor|huawei|asus|rog|lenovo|acer|dell|msi|axioo|advan|zyrex|macbook|laptop|notebook|komputer|computer|pc|tablet|tab|gadget)\b/;
  const isStrong = strong.test(n);

  // 3) kata lemah: elektronik umum, percetakan, dll. -> tolak kecuali ada kata kuat
  const soft =
    /\b(tv|televisi|ac|kipas|kompor|elektronik|electronic|electronics|printer|print|fotocopy|foto copy|percetakan|cetak|atk|cctv|warnet|rental|studio|photo|buku|jam|tas|fashion)\b/;
  if (!isStrong && soft.test(n)) return false;

  // 4) tag peta yang memang toko HP/komputer/servis elektronik
  const tagOk =
    /(mobile phone|cell phone|phone repair|computer|electronics repair)/.test(
      tag,
    );

  return isStrong || tagOk;
}

window.renderShops = function (elements, lat, lng) {
  const cat = typeof deviceCategory === "function" ? deviceCategory() : "phone";
  const seen = new Set();

  // Tolak otomatis sekolah/kampus, bengkel kendaraan, servis elektronik rumah tangga, dll.
  const nonGadgetRegex =
    /\b(sekolah|universitas|institut|akademi|stekom|sd|smp|sma|smk|jok|dinamo|mesin|motor|mobil|auto|honda|yamaha|suzuki|toyota|daihatsu|mitsubishi|nissan|ban|velg|ac|kulkas|pompa|las|knalpot|radiator|aki|cuci|salon|jahit|sepatu|jam|kunci|sofa|springbed|bank|atm|masjid|gereja|apotek|puskesmas|hotel|kost|kos|notary|notaris|hukum|law|pajak|tax|travel|tour|expedisi|ekspedisi|j&t|jne|sicepat|laundry|catering|barber|bengkel|makita|maktec|lakoni|bosch|niko|rinnai|miyako|cosmos|sharp|panasonic|lg|electrolux|modena|sanken|polytron)\b/i;
  const gadgetRegex =
    /(hp|handphone|ponsel|seluler|cellular|cell|iphone|apple|ibox|android|xiaomi|redmi|poco|samsung|oppo|vivo|realme|infinix|asus|rog|lenovo|acer|dell|msi|ipad|tablet|tab|laptop|notebook|macbook|komputer|computer|pc|gadget|counter|konter)/i;
  const validMapTagRegex = /(mobile_phone|computer|telecommunication)/i;
  const realShops = elements
    .map((el) => {
      const sLat = el.lat ?? el.center?.lat;
      const sLng = el.lon ?? el.center?.lon;
      const addrFromTags = [
        el.tags["addr:street"],
        el.tags["addr:suburb"] || el.tags["addr:village"],
        el.tags["addr:city"],
      ]
        .filter(Boolean)
        .join(", ");

      return {
        name: el.tags.name,
        address: el.tags.address || addrFromTags || "",
        can:
          typeof classifyShop === "function"
            ? classifyShop(el.tags)
            : { phone: true, laptop: true },
        sLat,
        sLng,
        phone:
          typeof normalizePhone === "function"
            ? normalizePhone(
                el.tags.phone ||
                  el.tags["contact:phone"] ||
                  el.tags["contact:whatsapp"],
              )
            : "",
        km: sLat && sLng ? distKm(lat, lng, sLat, sLng) : 999,
        isVerified: false,
        osmTag:
          `${el.tags?.osm_key || ""} ${el.tags?.osm_value || ""} ${el.tags?.shop || ""} ${el.tags?.craft || ""}`.trim(),
      };
    })
    .filter(
      (s) =>
        s.sLat && s.sLng && s.name && s.km <= 8 && rcIsGadgetShop(s.name, ""),
    )
    .sort((a, b) => a.km - b.km)
    .filter((s) => {
      const k = normStr(s.name);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

  console.table(realShops.map((s) => ({ nama: s.name, tag: s.osmTag })));

  window.__rcFallback = false;
  if (!realShops.length) return renderFallbackShops();
  window.__shopList = realShops;
  rcSave("rc_verified_real_shops", {
    lat,
    lng,
    cat,
    list: realShops,
  });
  displayShopsHTML(realShops);
};

window.renderFallbackShops = function () {
  window.__rcFallback = true;
  const cat = typeof deviceCategory === "function" ? deviceCategory() : "phone";
  const lat = parseFloat(lastCoords?.lat || userData?.lat);
  const lng = parseFloat(lastCoords?.lng || userData?.lng);
  const hasGps = Number.isFinite(lat) && Number.isFinite(lng);
  const box = rcEl("shopsContainer");
  if (!box) return;

  const gm = hasGps
    ? `https://www.google.com/maps/search/${cat === "laptop" ? "servis+laptop+komputer" : "servis+hp+tablet"}/@${lat},${lng},15z`
    : `https://www.google.com/maps/search/${cat === "laptop" ? "servis+laptop+terdekat" : "servis+hp+terdekat"}`;

  box.innerHTML = hasGps
    ? `<div class="sm:col-span-2 bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs text-amber-900 space-y-2.5">
         <p class="font-bold"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Belum ditemukan tempat servis HP/Laptop dalam radius 8 km pada titik GPS (${lat.toFixed(4)}, ${lng.toFixed(4)}).</p>
         <div class="flex flex-wrap gap-2">
           <button type="button" onclick="fetchNearbyRepairShops(${lat}, ${lng})" class="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-xl">Muat Ulang Pencarian</button>
           <a href="${gm}" target="_blank" rel="noopener" class="bg-white border border-amber-300 text-amber-800 font-semibold px-4 py-2 rounded-xl">Cari Langsung di Google Maps</a>
         </div>
       </div>`
    : `<div class="sm:col-span-2 bg-blue-50 border border-blue-200 rounded-2xl p-5 text-xs text-blue-900 space-y-2">
         <p class="font-bold"><i class="fa-solid fa-location-crosshairs mr-1"></i>Lokasi GPS belum aktif.</p>
         <button type="button" onclick="useMyLocation()" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl">Aktifkan GPS Sekarang</button>
       </div>`;
};

window.useMyLocation = function () {
  if (!navigator.geolocation) {
    alert("Browser ini tidak mendukung GPS / Geolocation.");
    return;
  }
  const info = rcEl("shopRadiusInfo");
  if (info) info.textContent = "Mendeteksi titik GPS perangkat Anda...";

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      if (userData) {
        userData.lat = lat;
        userData.lng = lng;
        if (!userData.guest) rcSave("rc_user_session", userData);
        const navLoc = rcEl("dashNavLoc");
        if (navLoc) {
          navLoc.innerHTML = `<i class="fa-solid fa-circle text-[6px] text-emerald-500"></i> GPS: ${lat.toFixed(3)}, ${lng.toFixed(3)}`;
        }
      }
      shopCache = null;
      window.fetchNearbyRepairShops(lat, lng);
    },
    (err) => {
      alert(
        "Gagal membaca GPS (" +
          err.message +
          "). Pastikan izin lokasi browser aktif dan Windows Location menyala.",
      );
      renderFallbackShops();
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
  );
};

/* ---------------------------------------------------------------------
   4. AKSES TANPA LOGIN + LOGIN BERPASSWORD + PROFIL AKUN
   --------------------------------------------------------------------- */
function enterGuestMode() {
  userData = { name: "Tamu", phone: "", lat: "", lng: "", guest: true };
  closeAuthModal();
  renderDashboardView();
  useMyLocation();
}

async function rcHash(s, salt) {
  const str = "rc:" + salt + ":" + s;
  try {
    const b = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(str),
    );
    return [...new Uint8Array(b)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("");
  } catch (e) {
    let h = 5381;
    for (const c of str) h = ((h << 5) + h + c.charCodeAt(0)) | 0;
    return "w" + h;
  }
}

window.handleUserSubmit = async function (e) {
  e.preventDefault();
  const err = rcEl("loginError");
  err.classList.add("hidden");
  const fail = (m) => {
    err.textContent = m;
    err.classList.remove("hidden");
  };
  const name = rcVal("userName").trim(),
    phone = rcVal("userPhone").trim(),
    email = rcVal("userEmail").trim().toLowerCase(),
    pw = rcVal("userPassword");
  const key = rcPhoneKey(phone);
  if (key.length < 9) return fail("Nomor WhatsApp tidak valid.");
  if (RC_AUTH.email && !rcEmailOk(email))
    return fail("Format email tidak valid.");

  const known = rcLoad(RC_KNOWN_KEY, {});
  if (known[key] && known[key] !== normStr(name))
    return fail(
      "Nama tidak cocok dengan nomor ini. Pakai nama yang sama seperti saat pertama masuk.",
    );

  if (RC_AUTH.password) {
    const acct = rcAcct(key);
    if (acct && acct.passwordHash) {
      if (acct.email && acct.email !== email)
        return fail("Email tidak cocok dengan akun ini.");
      if (!pw)
        return fail("Nomor ini sudah punya password. Masukkan password.");
      if ((await rcHash(pw, key)) !== acct.passwordHash)
        return fail("Password salah.");
    } else if (pw) {
      if (pw.length < 6) return fail("Password minimal 6 karakter.");
      rcSetAcct(key, { email, passwordHash: await rcHash(pw, key) });
    }
  }

  known[key] = normStr(name);
  rcSave(RC_KNOWN_KEY, known);

  userData = {
    name,
    phone,
    email,
    lat: rcVal("userLat"),
    lng: rcVal("userLng"),
  };
  localStorage.setItem("rc_user_session", JSON.stringify(userData));
  rcEl("userPassword").value = "";
  closeAuthModal();
  renderDashboardView();
};

window.handleLogout = function () {
  localStorage.removeItem("rc_user_session");
  location.reload();
};

function rcProfMsg(text, ok) {
  const el = rcEl("profileMsg");
  el.textContent = text;
  el.className =
    "font-semibold rounded-xl p-2.5 border " +
    (ok
      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
      : "bg-rose-50 border-rose-200 text-rose-700");
}
function openProfileModal() {
  if (!userData || userData.guest) {
    alert("Pengaturan akun tersedia setelah login.");
    openAuthModal();
    return;
  }
  rcEl("profName").value = userData.name;
  rcEl("profPhone").value = userData.phone;
  rcEl("profEmail").value = userData.email || "";
  ["profOldPw", "profNewPw", "profNewPw2"].forEach(
    (id) => (rcEl(id).value = ""),
  );
  rcEl("profileMsg").className = "hidden";
  const acct = rcAcct(rcPhoneKey(userData.phone));
  const has = !!(acct && acct.passwordHash);
  rcEl("profOldPwBox").classList.toggle("hidden", !has);
  rcEl("profPwTitle").textContent = has ? "Ganti Password" : "Buat Password";
  rcEl("profileModal").classList.remove("hidden");
}
function closeProfileModal() {
  rcEl("profileModal").classList.add("hidden");
}
async function saveProfile(e) {
  e.preventDefault();
  const name = rcVal("profName").trim(),
    phone = rcVal("profPhone").trim(),
    email = rcVal("profEmail").trim().toLowerCase();
  if (RC_AUTH.email && !rcEmailOk(email))
    return rcProfMsg("Format email tidak valid.", false);
  const oldKey = rcPhoneKey(userData.phone),
    newKey = rcPhoneKey(phone);
  const acct = rcAcct(oldKey);
  const has = RC_AUTH.password && !!(acct && acct.passwordHash);
  const newPw = rcVal("profNewPw");

  if (newPw) {
    if (has && (await rcHash(rcVal("profOldPw"), oldKey)) !== acct.passwordHash)
      return rcProfMsg("Password lama salah.", false);
    if (newPw.length < 6)
      return rcProfMsg("Password baru minimal 6 karakter.", false);
    if (newPw !== rcVal("profNewPw2"))
      return rcProfMsg("Konfirmasi password tidak sama.", false);
    const accts = rcAccts();
    delete accts[oldKey];
    accts[newKey] = { email, passwordHash: await rcHash(newPw, newKey) };
    rcSave(RC_ACCT_KEY, accts);
  } else if (has && newKey !== oldKey) {
    return rcProfMsg(
      "Untuk mengganti nomor pada akun berpassword, isi juga password baru.",
      false,
    );
  }

  if (newKey !== oldKey) {
    rcSave(
      RC_REQ_KEY,
      rcLoad(RC_REQ_KEY, []).map((r) =>
        r.ownerPhone === oldKey ? { ...r, ownerPhone: newKey } : r,
      ),
    );
  }
  const acctNow = rcAcct(newKey);
  if (acctNow) rcSetAcct(newKey, { ...acctNow, email });
  const kn = rcLoad(RC_KNOWN_KEY, {});
  if (newKey !== oldKey) delete kn[oldKey];
  kn[newKey] = normStr(name);
  rcSave(RC_KNOWN_KEY, kn);
  userData.name = name;
  userData.phone = phone;
  userData.email = email;
  rcSave("rc_user_session", userData);
  rcEl("dashNavName").innerText = name;
  rcEl("dashGreetingName").innerText = name;
  rcEl("avatarInitial").innerText = name.charAt(0).toUpperCase();
  renderSavedPassport();
  rcProfMsg("Perubahan berhasil disimpan.", true);
  ["profOldPw", "profNewPw", "profNewPw2"].forEach(
    (id) => (rcEl(id).value = ""),
  );
}
function deleteAccount() {
  if (
    !confirm(
      "Hapus akun, password, dan semua nota di perangkat ini? Tindakan ini tidak bisa dibatalkan.",
    )
  )
    return;
  const key = rcPhoneKey(userData.phone);
  rcSave(
    RC_REQ_KEY,
    rcLoad(RC_REQ_KEY, []).filter((r) => r.ownerPhone !== key),
  );
  const kn = rcLoad(RC_KNOWN_KEY, {});
  delete kn[key];
  rcSave(RC_KNOWN_KEY, kn);
  const accts = rcAccts();
  delete accts[key];
  rcSave(RC_ACCT_KEY, accts);
  ["rc_user_session", "repairConnectPassport"].forEach((k) =>
    localStorage.removeItem(k),
  );
  location.reload();
}

const _rcRenderDash = renderDashboardView;
window.renderDashboardView = function () {
  _rcRenderDash();
  if (userData?.guest)
    rcEl("dashNavLoc").innerHTML =
      `<i class="fa-solid fa-circle text-[6px] text-slate-400"></i> Mode Tamu`;
  syncFormState();
  renderSavedPassport();
};

/* ---------------------------------------------------------------------
   5. NOTA & GARANSI DIVALIDASI TOKO
   --------------------------------------------------------------------- */
function rcMyRequests() {
  const key = rcPhoneKey(userData?.phone);
  if (!key) return [];
  return rcLoad(RC_REQ_KEY, [])
    .filter((r) => r.ownerPhone === key)
    .sort((a, b) => b.createdAt - a.createdAt);
}

function rcFillShopSelect(id) {
  const sel = rcEl(id);
  if (!sel) return;
  const shops = RCMerchantStore.read().filter(
    (shop) => shop.status === "Verified",
  );
  if (sel.tagName === "INPUT") {
    const list = rcEl(sel.getAttribute("list"));
    if (list)
      list.innerHTML = shops
        .map(
          (shop) => `<option value="${escapeHtml(rcShopKey(shop))}"></option>`,
        )
        .join("");
    return;
  }
  sel.innerHTML =
    (id === "newPassShop"
      ? '<option value="">-- Pilih toko mitra --</option>'
      : "") +
    shops
      .map((s) => `<option value="${rcShopKey(s)}">${rcShopKey(s)}</option>`)
      .join("");
}

window.openAddPassportModal = function () {
  if (!userData || userData.guest) {
    alert("Silakan login terlebih dahulu untuk mengajukan nota servis.");
    openAuthModal();
    return;
  }
  rcFillShopSelect("newPassShop");
  rcEl("addPassportModal").classList.remove("hidden");
};

window.handleSavePassport = function (e) {
  e.preventDefault();
  if (!savedReceiptDataUrl) {
    alert("Foto nota belum selesai dimuat. Coba pilih ulang fotonya.");
    return;
  }
  const req = {
    id: "REQ-" + Date.now(),
    ownerPhone: rcPhoneKey(userData.phone),
    ownerName: userData.name,
    ownerWa: userData.phone,
    deviceName: rcVal("newPassName").trim(),
    shopKey: rcVal("newPassShop"),
    detail: rcVal("newPassDetail").trim(),
    receiptImg: savedReceiptDataUrl,
    status: "pending",
    createdAt: Date.now(),
  };
  if (!rcSave(RC_REQ_KEY, [...rcLoad(RC_REQ_KEY, []), req])) return;
  e.target.reset();
  savedReceiptDataUrl = null;
  rcEl("receiptPreviewImg").classList.add("hidden");
  closeAddPassportModal();
  renderSavedPassport();
  alert(
    "Pengajuan nota terkirim ke " +
      req.shopKey +
      ". QR Passport akan terbit setelah toko memvalidasi nota & menetapkan masa garansi.",
  );
};

function rcStatus(r) {
  if (r.status === "verified") {
    const end = r.verifiedAt + r.warrantyDays * 86400000;
    const active = Date.now() <= end;
    return {
      label: active ? "Garansi Aktif" : "Garansi Berakhir",
      cls: active
        ? "bg-emerald-100 text-emerald-800"
        : "bg-slate-200 text-slate-600",
      desc: `Divalidasi ${r.shopKey} pada ${rcFmtDate(r.verifiedAt)} • ${r.detail} • Garansi ${r.warrantyDays} hari (s.d. ${rcFmtDate(end)})`,
    };
  }
  if (r.status === "rejected")
    return {
      label: "Ditolak Toko",
      cls: "bg-rose-100 text-rose-800",
      desc: `${r.shopKey} menolak pengajuan${r.rejectReason ? ": " + r.rejectReason : "."} Ajukan ulang dengan data yang benar.`,
    };
  return {
    label: "Menunggu Validasi Toko",
    cls: "bg-amber-100 text-amber-800",
    desc: `Diajukan ke ${r.shopKey} • ${r.detail} • Menunggu validasi pemilik toko`,
  };
}

function rcSetQrBtn(r) {
  const btn = rcEl("passQrBtn");
  if (!btn) return;
  const show = !!(r && r.status === "verified");
  btn.classList.toggle("hidden", !show);
  btn.style.display = show ? "inline-flex" : "none";
  if (show) btn.setAttribute("onclick", `generateAndShowQR('${r.code}')`);
  else btn.removeAttribute("onclick");
}

window.renderSavedPassport = function () {
  if (!rcEl("passDeviceTitle")) return;
  const reqs = userData && !userData.guest ? rcMyRequests() : [];
  const r = reqs[0];
  const badge = rcEl("passStatusBadge"),
    hist = rcEl("passportHistory");

  if (!r) {
    rcEl("passDeviceTitle").innerText = "Belum Ada Nota Terdaftar";
    rcEl("passDeviceDesc").innerText =
      "Daftarkan nota servis pertama Anda untuk membuat QR Passport";
    badge.classList.add("hidden");
    rcSetQrBtn(null);
    if (hist) hist.innerHTML = "";
    return;
  }
  const st = rcStatus(r);
  rcEl("passDeviceTitle").innerText = r.deviceName;
  rcEl("passDeviceDesc").innerText = st.desc;
  badge.className = "text-[10px] font-bold px-2.5 py-1 rounded-full " + st.cls;
  badge.textContent = st.label;
  rcSetQrBtn(r);

  if (r.status === "verified") {
    try {
      localStorage.setItem("repairConnectPassport", JSON.stringify({ ...r }));
    } catch (e) {}
  }

  if (hist)
    hist.innerHTML = reqs
      .slice(1)
      .map((x) => {
        const s = rcStatus(x);
        return `<div class="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-[11px]">
          <div class="min-w-0"><p class="font-bold text-slate-800 truncate">${escapeHtml(x.deviceName)}</p><p class="text-slate-500 truncate">${escapeHtml(x.shopKey)} • ${escapeHtml(x.detail)}</p></div>
          <div class="flex items-center gap-2 shrink-0"><span class="font-bold px-2 py-0.5 rounded-full ${s.cls}">${s.label}</span>
          ${x.status === "verified" ? `<button onclick="generateAndShowQR('${x.code}')" class="text-blue-600 font-semibold"><i class="fa-solid fa-qrcode"></i></button>` : ""}</div></div>`;
      })
      .join("");
};

const _rcPreventive = updatePreventiveCareUI;
window.updatePreventiveCareUI = function () {
  const r = userData && !userData.guest ? rcMyRequests()[0] : null;
  if (!r || r.status !== "verified") return;
  _rcPreventive();
};
window.syncQrModalState = function () {
  const r = userData && !userData.guest ? rcMyRequests()[0] : null;
  rcSetQrBtn(r);
};

window.generateAndShowQR = function (code) {
  const r = rcLoad(RC_REQ_KEY, []).find((x) => x.code === code);
  const c = rcEl("qrcodeCanvas");
  if (!c) return;
  c.innerHTML = "";
  const p = new URLSearchParams({ verify: code });
  if (r) {
    p.set("device", r.deviceName);
    p.set("service", r.detail);
    p.set("shop", r.shopKey);
    p.set("warranty", "Garansi " + r.warrantyDays + " Hari");
  }
  new QRCode(c, {
    text: `${window.location.origin}/?${p.toString()}`,
    width: 140,
    height: 140,
  });
  rcEl("qrPassCode").innerText = `ID: ${code}`;
  rcEl("qrModalShopName").innerText = `Lokasi Servis: ${r ? r.shopKey : "-"}`;
  const img = rcEl("qrModalReceiptPreview");
  if (r?.receiptImg) {
    img.src = r.receiptImg;
    img.classList.remove("hidden");
  } else img.classList.add("hidden");
  rcEl("qrModal").classList.remove("hidden");
};

/* ---------- Portal pemilik toko ---------- */
let rcMerchantTab = "pending";

function openMerchantLoginModal() {
  rcFillShopSelect("merchantLoginShop");
  rcEl("merchantLoginError").classList.add("hidden");
  rcEl("merchantLoginPin").value = "";
  const m = rcEl("merchantLoginModal");
  m.classList.remove("hidden");
  m.style.display = "flex";
}
function closeMerchantLoginModal() {
  const m = rcEl("merchantLoginModal");
  m.classList.add("hidden");
  m.style.display = "none";
}
function handleMerchantLogin(e) {
  e.preventDefault();
  if (rcVal("merchantLoginPin") !== RC_DEMO_PIN) {
    const er = rcEl("merchantLoginError");
    er.textContent = "PIN salah.";
    er.classList.remove("hidden");
    return;
  }
  localStorage.setItem(RC_MERCHANT_KEY, rcVal("merchantLoginShop"));
  closeMerchantLoginModal();
  showMerchantDashboard();
}
function showMerchantDashboard() {
  const key = localStorage.getItem(RC_MERCHANT_KEY);
  if (!key) return;
  ["guestLandingView", "customerDashboardView"].forEach((id) =>
    rcEl(id)?.classList.add("hidden"),
  );
  rcEl("merchantDashboardView").classList.remove("hidden");
  rcEl("merchantShopLabel").textContent = key;
  setMerchantTab("pending");
  window.scrollTo(0, 0);
}
function merchantLogout() {
  localStorage.removeItem(RC_MERCHANT_KEY);
  location.reload();
}
function setMerchantTab(t) {
  rcMerchantTab = t;
  const on = "px-4 py-2 rounded-xl bg-amber-500 text-white";
  const off =
    "px-4 py-2 rounded-xl bg-white text-slate-600 border border-slate-200";
  rcEl("tabPending").className = t === "pending" ? on : off;
  rcEl("tabDone").className = t === "done" ? on : off;
  renderMerchantRequests();
}
function renderMerchantRequests() {
  const key = localStorage.getItem(RC_MERCHANT_KEY);
  const list = rcLoad(RC_REQ_KEY, [])
    .filter(
      (r) =>
        r.shopKey === key &&
        (rcMerchantTab === "pending"
          ? r.status === "pending"
          : r.status !== "pending"),
    )
    .sort((a, b) => b.createdAt - a.createdAt);
  rcEl("merchantRequests").innerHTML =
    list
      .map((r) => {
        const actions =
          r.status === "pending"
            ? `<div class="flex flex-col sm:flex-row sm:items-end gap-3 pt-3 border-t border-slate-100">
                 <div class="sm:w-40"><label class="block text-[11px] font-bold text-slate-700 mb-1">Masa garansi (hari)</label>
                 <input type="number" min="1" max="3650" value="30" id="wd-${r.id}" class="rc-field" /></div>
                 <button onclick="approveRequest('${r.id}')" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 rounded-xl transition">Validasi & Terbitkan QR</button>
                 <button onclick="rejectRequest('${r.id}')" class="bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-semibold py-2.5 px-4 rounded-xl transition">Tolak</button>
               </div>`
            : `<p class="text-[11px] font-semibold pt-3 border-t border-slate-100 ${r.status === "verified" ? "text-emerald-700" : "text-rose-600"}">${escapeHtml(rcStatus(r).desc)}</p>`;
        return `<div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3 text-xs">
          <div class="flex justify-between gap-2"><div><p class="font-bold text-sm text-slate-900">${escapeHtml(r.deviceName)}</p><p class="text-slate-500">${escapeHtml(r.detail)}</p></div>
          <span class="text-[10px] text-slate-400 whitespace-nowrap">${rcFmtDate(r.createdAt)}</span></div>
          <p class="text-slate-600"><i class="fa-solid fa-user mr-1 text-slate-400"></i>${escapeHtml(r.ownerName)} • ${escapeHtml(r.ownerWa)}</p>
          <img src="${r.receiptImg}" alt="Bukti Nota" class="max-h-40 rounded-xl border border-slate-200 object-contain cursor-pointer bg-slate-50" />
          ${actions}</div>`;
      })
      .join("") ||
    `<p class="text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-2xl py-10">${rcMerchantTab === "pending" ? "Belum ada pengajuan yang menunggu validasi." : "Belum ada riwayat validasi."}</p>`;
}
function approveRequest(id) {
  const days = Number(rcVal("wd-" + id));
  if (!Number.isInteger(days) || days < 1 || days > 3650) {
    alert("Masa garansi harus 1–3650 hari.");
    return;
  }
  const all = rcLoad(RC_REQ_KEY, []);
  const r = all.find((x) => x.id === id);
  if (!r) return;
  Object.assign(r, {
    status: "verified",
    warrantyDays: days,
    verifiedAt: Date.now(),
    code: "RC-PASS-" + String(Date.now()).slice(-6),
  });
  rcSave(RC_REQ_KEY, all);
  renderMerchantRequests();
}
function rejectRequest(id) {
  const reason = prompt("Alasan penolakan (opsional):");
  if (reason === null) return;
  const all = rcLoad(RC_REQ_KEY, []);
  const r = all.find((x) => x.id === id);
  if (!r) return;
  Object.assign(r, {
    status: "rejected",
    rejectReason: reason.trim(),
    verifiedAt: Date.now(),
  });
  rcSave(RC_REQ_KEY, all);
  renderMerchantRequests();
}

/* ---------------------------------------------------------------------
   6. NAVIGASI SIDEBAR AKTIF
   --------------------------------------------------------------------- */
function rcInitNav() {
  const links = document.querySelectorAll("[data-nav]");
  const obs = new IntersectionObserver(
    (entries) =>
      entries.forEach((en) => {
        if (en.isIntersecting)
          links.forEach((l) =>
            l.classList.toggle("rc-nav-active", l.dataset.nav === en.target.id),
          );
      }),
    { rootMargin: "-25% 0px -60% 0px" },
  );
  ["aiEstimatorSection", "shopsSection", "passportSection"].forEach((id) => {
    const el = rcEl(id);
    if (el) obs.observe(el);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  syncFormState();
  rcInitNav();
  if (localStorage.getItem(RC_MERCHANT_KEY)) showMerchantDashboard();
});

window.openAddPassportModal = function () {
  const modal = document.getElementById("addPassportModal");
  if (!modal) return;
  const shopEl = document.getElementById("newPassShop");
  if (shopEl && shopEl.tagName === "INPUT") shopEl.value = "";
  const prev = document.getElementById("receiptPreviewImg");
  if (prev) prev.classList.add("hidden");
  modal.classList.remove("hidden");
};

window.handleSavePassport = function (e) {
  e.preventDefault();
  const deviceName = (
    document.getElementById("newPassName")?.value || ""
  ).trim();
  const shopName = (document.getElementById("newPassShop")?.value || "").trim();
  const detail = (document.getElementById("newPassDetail")?.value || "").trim();
  const selectDays = document.getElementById("newPassDays")?.value;
  const manualDays = parseInt(
    document.getElementById("newPassDaysManual")?.value,
    10,
  );
  const days =
    selectDays === "manual" ? manualDays || 30 : parseInt(selectDays, 10) || 30;
  const previewSrc = document.getElementById("receiptPreviewImg")?.src || "";

  if (!deviceName || !shopName || !detail) return;

  const passId =
    "RC-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  const expDate = new Date(Date.now() + days * 86400000).toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );

  const mainDeviceTitle = document.querySelector("#passportSection h3");
  if (mainDeviceTitle) mainDeviceTitle.textContent = deviceName;

  const healthVal = document.getElementById("healthScoreValue");
  if (healthVal) {
    healthVal.textContent = "92%";
    if (healthVal.nextElementSibling) {
      healthVal.nextElementSibling.textContent = "Kondisi Optimal";
    }
  }

  const adviceEl = document.getElementById("preventiveAdviceText");
  if (adviceEl) {
    adviceEl.textContent = `Perangkat ${deviceName} telah menjalani ${detail} di ${shopName}. Jadwalkan pengecekan rutin berikutnya dalam ${Math.min(days, 90)} hari.`;
  }

  const titleEl = document.getElementById("passDeviceTitle");
  const descEl = document.getElementById("passDeviceDesc");
  const badgeEl = document.getElementById("passStatusBadge");
  const qrBtn = document.getElementById("passQrBtn");

  if (titleEl) titleEl.textContent = `${deviceName} — ${detail}`;
  if (descEl)
    descEl.textContent = `Tempat Servis: ${shopName} • Berlaku s/d ${expDate} (${days} Hari)`;
  if (badgeEl) {
    badgeEl.textContent = `Garansi Aktif (${days} Hari)`;
    badgeEl.classList.remove("hidden");
  }
  if (qrBtn) {
    qrBtn.classList.remove("hidden");
    qrBtn.onclick = function () {
      const qrModal = document.getElementById("qrModal");
      const canvas = document.getElementById("qrcodeCanvas");
      const codeEl = document.getElementById("qrPassCode");
      const shopModalEl = document.getElementById("qrModalShopName");
      const receiptEl = document.getElementById("qrModalReceiptPreview");

      if (canvas) {
        canvas.innerHTML = "";
        if (typeof QRCode !== "undefined") {
          new QRCode(canvas, {
            text: `${passId} | ${deviceName} | ${shopName} | Exp: ${expDate}`,
            width: 150,
            height: 150,
          });
        }
      }
      if (codeEl) codeEl.textContent = `ID: ${passId} • Berlaku s/d ${expDate}`;
      if (shopModalEl) shopModalEl.textContent = `Lokasi Servis: ${shopName}`;
      if (receiptEl && previewSrc && previewSrc.startsWith("data:")) {
        receiptEl.src = previewSrc;
        receiptEl.classList.remove("hidden");
      }
      if (qrModal) qrModal.classList.remove("hidden");
    };
  }

  try {
    const passport = {
      id: passId,
      code: passId,
      deviceName,
      shopName,
      detail,
      warrantyDays: days,
      expiresAt: Date.now() + days * 86400000,
      status: "active",
      createdAt: Date.now(),
    };
    const history = JSON.parse(
      localStorage.getItem(RC_PASSPORT_HISTORY_KEY) || "[]",
    );
    history.unshift(passport);
    localStorage.setItem(RC_PASSPORT_HISTORY_KEY, JSON.stringify(history));
    localStorage.setItem("repairConnectPassport", JSON.stringify(passport));
  } catch (error) {
    alert(
      "Nota dibuat, tetapi riwayat tidak dapat disimpan di penyimpanan browser.",
    );
  }

  if (typeof closeAddPassportModal === "function") closeAddPassportModal();
  e.target.reset();
};

// =========================================================
// DAFTAR MITRA TERVERIFIKASI REPAIRCONNECT
// =========================================================
window.renderShops = function (elements, lat, lng) {
  const latitude = Number(lat);
  const longitude = Number(lng);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return window.renderFallbackShops();
  }
  lastCoords = { lat: latitude, lng: longitude };
  const cat = typeof deviceCategory === "function" ? deviceCategory() : "phone";
  const verifiedPartners = RCMerchantStore.read()
    .filter((shop) => {
      const capable =
        shop.can?.[cat] || shop.type === "both" || shop.type === cat;
      return (
        shop.status === "Verified" &&
        capable &&
        Number.isFinite(Number(shop.lat)) &&
        Number.isFinite(Number(shop.lng))
      );
    })
    .map((shop) => ({
      ...shop,
      sLat: Number(shop.lat),
      sLng: Number(shop.lng),
      km: distKm(latitude, longitude, Number(shop.lat), Number(shop.lng)),
      isVerified: true,
      badge: "Mitra Terverifikasi",
    }))
    .filter((shop) => shop.km <= 8)
    .sort((a, b) => a.km - b.km);

  const nearestVerified = verifiedPartners.slice(0, 1);
  const verifiedNames = new Set(
    verifiedPartners.map((shop) =>
      normStr(shop.name.replace(/\s*\(mitra terverifikasi\)/i, "")),
    ),
  );
  const publicShops = (Array.isArray(elements) ? elements : [])
    .map((element) => {
      const tags = element.tags || {};
      const rawLat = element.lat ?? element.center?.lat ?? element.sLat;
      const rawLng = element.lon ?? element.center?.lon ?? element.sLng;
      const shopLat = Number(rawLat);
      const shopLng = Number(rawLng);
      const name = String(tags.name || element.name || "").trim();
      const can =
        typeof classifyShop === "function"
          ? classifyShop(tags)
          : { phone: true, laptop: true };
      const mapTags = [tags.shop, tags.craft, tags.amenity, tags.name]
        .filter(Boolean)
        .join(" ");
      const address =
        tags.address ||
        [
          tags["addr:street"],
          tags["addr:suburb"] || tags["addr:village"],
          tags["addr:city"],
        ]
          .filter(Boolean)
          .join(", ");
      return {
        name,
        address,
        phone:
          typeof normalizePhone === "function"
            ? normalizePhone(
                tags.phone || tags["contact:phone"] || tags["contact:whatsapp"],
              )
            : null,
        can,
        sLat: shopLat,
        sLng: shopLng,
        km:
          Number.isFinite(shopLat) && Number.isFinite(shopLng)
            ? distKm(latitude, longitude, shopLat, shopLng)
            : Infinity,
        isVerified: false,
        status: "Unverified",
        spec:
          can.laptop && can.phone
            ? "Laptop & Smartphone"
            : can.laptop
              ? "Laptop / Komputer"
              : "Smartphone / HP",
        osmTag: mapTags,
      };
    })
    .filter((shop) => {
      const canServeCategory = shop.can?.[cat];
      const normalizedName = normStr(
        shop.name.replace(/\s*\(mitra terverifikasi\)/i, ""),
      );
      return (
        shop.name &&
        canServeCategory &&
        Number.isFinite(shop.sLat) &&
        Number.isFinite(shop.sLng) &&
        shop.km <= 8 &&
        rcIsGadgetShop(shop.name, shop.osmTag) &&
        !verifiedNames.has(normalizedName)
      );
    })
    .sort((a, b) => a.km - b.km)
    .filter(
      (shop, index, list) =>
        list.findIndex(
          (entry) => normStr(entry.name) === normStr(shop.name),
        ) === index,
    );
  const shops = [...nearestVerified, ...publicShops];

  window.__rcFallback = publicShops.length === 0;
  window.__shopList = shops;
  if (shops.length) displayShopsHTML(shops);
  else window.renderFallbackShops();
};

window.renderFallbackShops = function () {
  const lat = Number(lastCoords?.lat || userData?.lat);
  const lng = Number(lastCoords?.lng || userData?.lng);
  const hasGps = Number.isFinite(lat) && Number.isFinite(lng);
  const cat = typeof deviceCategory === "function" ? deviceCategory() : "phone";
  window.__rcFallback = true;
  const verifiedPartners = hasGps
    ? RCMerchantStore.read()
        .filter(
          (shop) =>
            (shop.can?.[cat] || shop.type === "both" || shop.type === cat) &&
            shop.status === "Verified" &&
            Number.isFinite(Number(shop.lat)) &&
            Number.isFinite(Number(shop.lng)),
        )
        .map((shop) => ({
          ...shop,
          sLat: Number(shop.lat),
          sLng: Number(shop.lng),
          km: distKm(lat, lng, Number(shop.lat), Number(shop.lng)),
          isVerified: true,
          badge: "Mitra Terverifikasi",
        }))
        .filter((shop) => shop.km <= 8)
        .sort((a, b) => a.km - b.km)
    : [];
  const partners = verifiedPartners.slice(0, 1);

  if (partners.length) {
    window.__shopList = partners;
    displayShopsHTML(partners);
    return;
  }
  const box = rcEl("shopsContainer");
  if (!box) return;
  box.innerHTML = hasGps
    ? `<div class="sm:col-span-2 bg-amber-50 border border-amber-200 rounded-2xl p-5 text-xs text-amber-900 space-y-2.5"><p class="font-bold"><i class="fa-solid fa-triangle-exclamation mr-1"></i>Belum ada tempat servis dalam radius 8 km dari titik GPS ini.</p><button type="button" onclick="fetchNearbyRepairShops(${lat}, ${lng})" class="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-xl">Muat Ulang</button></div>`
    : `<div class="sm:col-span-2 bg-blue-50 border border-blue-200 rounded-2xl p-5 text-xs text-blue-900 space-y-2"><p class="font-bold"><i class="fa-solid fa-location-crosshairs mr-1"></i>Lokasi GPS belum aktif.</p><button type="button" onclick="useMyLocation()" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl">Aktifkan GPS Sekarang</button></div>`;
};

let rcMerchantRegistrationToastTimer;

function rcShowMerchantRegistrationToast(message, success) {
  const toast = document.getElementById("merchantRegistrationToast");
  if (!toast) return;
  toast.textContent = message;
  toast.className =
    "fixed bottom-5 left-1/2 -translate-x-1/2 z-[70] max-w-[calc(100vw-2rem)] rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg " +
    (success
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-rose-200 bg-rose-50 text-rose-800");
  clearTimeout(rcMerchantRegistrationToastTimer);
  rcMerchantRegistrationToastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 1100);
}

window.handleMerchantRegister = function (event) {
  event?.preventDefault();
  const field = (id) => rcVal(id).trim();
  const mapsUrl = field("regShopMaps");
  const coords =
    mapsUrl.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/) ||
    mapsUrl.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  const lat = field("regShopLat") || coords?.[1] || "";
  const lng = field("regShopLng") || coords?.[2] || "";
  const specialization = field("regShopSpec");
  const spec =
    /laptop/i.test(specialization) && /smartphone|hp/i.test(specialization)
      ? "both"
      : /laptop/i.test(specialization)
        ? "laptop"
        : "phone";
  const shop = {
    name: field("regShopName"),
    city: field("regShopCity") || "Belum diisi",
    province: field("regShopProvince") || "Belum diisi",
    address: field("regShopAddress"),
    mapsUrl,
    lat,
    lng,
    phone: field("regShopPhone").replace(/\D/g, "").replace(/^0/, "62"),
    specialization,
    type: spec,
    spec: specialization,
    can: { phone: spec !== "laptop", laptop: spec !== "phone" },
    status: "Pending",
    source: "website-registration",
    createdAt: Date.now(),
  };

  let saved = true;
  try {
    RCMerchantStore.upsert(shop);
  } catch (error) {
    saved = false;
    alert(
      "Penyimpanan formulir di website gagal. Anda tetap dapat menghubungi Admin untuk konfirmasi.",
    );
  }

  closeMerchantAuthModal();
  document.getElementById("merchantForm")?.reset();
  const adminPhone = "6289509814543";
  const message =
    `Halo Admin *RepairConnect*, saya ingin mengkonfirmasi pendaftaran Mitra Berlangganan:\n\n` +
    `• *Nama Toko:* ${shop.name}\n• *Spesialisasi:* ${shop.specialization}\n• *Daerah:* ${shop.city}, ${shop.province}\n• *Alamat / Google Maps:* ${shop.address || shop.mapsUrl}\n• *No. WhatsApp Toko:* ${shop.phone}\n\nMohon info langkah selanjutnya untuk aktivasi badge Mitra Terverifikasi. Terima kasih!`;
  const whatsapp = document.getElementById("merchantConfirmWhatsapp");
  if (whatsapp)
    whatsapp.href = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
  const confirmation = document.getElementById("merchantConfirmModal");
  if (confirmation) {
    confirmation.dataset.saved = String(saved);
    const confirmationMessage = document.getElementById(
      "merchantConfirmMessage",
    );
    if (confirmationMessage)
      confirmationMessage.textContent = saved
        ? "Pendaftaran tersimpan di website dengan status Pending. Hubungi admin untuk konfirmasi sebelum badge Mitra Terverifikasi diaktifkan."
        : "Pendaftaran belum berhasil tersimpan di website. Hubungi admin untuk konfirmasi dan kirim ulang detail toko melalui WhatsApp.";
    rcShowMerchantRegistrationToast(
      saved
        ? "Pendaftaran berhasil dikirim dan berstatus Pending."
        : "Pendaftaran gagal disimpan. Silakan hubungi Admin untuk konfirmasi.",
      saved,
    );
    setTimeout(() => {
      confirmation.classList.remove("hidden");
      confirmation.classList.add("flex");
    }, 1200);
  }
};

window.closeMerchantConfirmModal = function () {
  const confirmation = document.getElementById("merchantConfirmModal");
  if (!confirmation) return;
  confirmation.classList.add("hidden");
  confirmation.classList.remove("flex");
};

window.addEventListener("storage", (event) => {
  if (event.key !== RCMerchantStore.key) return;
  const lat = Number(lastCoords?.lat || userData?.lat);
  const lng = Number(lastCoords?.lng || userData?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng))
    window.renderShops([], lat, lng);
});

window.addEventListener("storage", (event) => {
  if (
    event.key === "rc_passport_requests" ||
    event.key === RC_PASSPORT_HISTORY_KEY
  ) {
    window.dispatchEvent(new CustomEvent("rc-passport-history-updated"));
  }
});

function rcPassportRecords() {
  const manual = rcLoad(RC_PASSPORT_HISTORY_KEY, []);
  const requests = rcLoad(RC_REQ_KEY, []);
  const owner = rcPhoneKey(userData?.phone);
  const rows = [
    ...(Array.isArray(manual) ? manual : []),
    ...(Array.isArray(requests)
      ? requests
          .filter(
            (record) =>
              record.status === "verified" || record.status === "pending",
          )
          .map((record) => ({
            ...record,
            shopName: record.shopName || record.shopKey || "",
            createdAt: record.createdAt || record.verifiedAt || Date.now(),
          }))
      : []),
  ].filter(
    (record) => !owner || !record.ownerPhone || record.ownerPhone === owner,
  );
  const seen = new Set();
  return rows
    .filter((record) => {
      const key = record.code || record.id;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
}

function rcPassportExpiry(record) {
  return (
    Number(record.expiresAt) ||
    Number(record.createdAt || Date.now()) +
      Number(record.warrantyDays || 30) * 86400000
  );
}

function rcPassportQrUrl(record) {
  const url = new URL(window.location.pathname, window.location.origin);
  const params = new URLSearchParams({
    pass: record.code,
    device: record.deviceName || "",
    shop: record.shopName || record.shopKey || "",
    service: record.detail || "",
    days: String(record.warrantyDays || 30),
    expires: String(rcPassportExpiry(record)),
  });
  url.search = params.toString();
  return url.toString();
}

window.openAddPassportModal = function () {
  const modal = rcEl("addPassportModal");
  if (!modal) return;
  rcFillShopSelect("newPassShop");
  modal.querySelector("form")?.reset();
  rcEl("newPassName").value = "";
  rcEl("newPassShop").value = "";
  rcEl("newPassDetail").value = "";
  if (rcEl("newPassDays")) rcEl("newPassDays").value = "30";
  if (rcEl("newPassDaysManual")) {
    rcEl("newPassDaysManual").value = "";
    rcEl("newPassDaysManual").classList.add("hidden");
    rcEl("newPassDaysManual").required = false;
  }
  savedReceiptDataUrl = null;
  if (rcEl("receiptPreviewImg")) {
    rcEl("receiptPreviewImg").removeAttribute("src");
    rcEl("receiptPreviewImg").classList.add("hidden");
  }
  modal.classList.remove("hidden");
};

window.handleSavePassport = function (event) {
  event.preventDefault();
  const deviceName = rcVal("newPassName").trim();
  const shopName = rcVal("newPassShop").trim();
  const detail = rcVal("newPassDetail").trim();
  const selectedDays = rcVal("newPassDays");
  const manualDays = Number.parseInt(rcVal("newPassDaysManual"), 10);
  const warrantyDays =
    selectedDays === "manual" ? manualDays : Number.parseInt(selectedDays, 10);
  const receiptImg =
    typeof savedReceiptDataUrl === "string" &&
    savedReceiptDataUrl.startsWith("data:image/")
      ? savedReceiptDataUrl
      : "";

  if (!deviceName || !shopName || !detail) {
    alert("Lengkapi perangkat, nama toko, dan tindakan servis.");
    return;
  }
  if (
    !Number.isInteger(warrantyDays) ||
    warrantyDays < 1 ||
    warrantyDays > 3650
  ) {
    alert("Masa garansi harus antara 1 sampai 3650 hari.");
    return;
  }
  if (!receiptImg) {
    alert("Unggah foto nota atau kondisi perangkat terlebih dahulu.");
    return;
  }

  const createdAt = Date.now();
  const code = `RC-PASS-${createdAt.toString().slice(-5)}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;
  const record = {
    id: code,
    code,
    ownerName: userData?.name || "Pengguna RepairConnect",
    ownerPhone: rcPhoneKey(userData?.phone),
    deviceName,
    shopName,
    shopKey: shopName,
    detail,
    warrantyDays,
    createdAt,
    verifiedAt: createdAt,
    expiresAt: createdAt + warrantyDays * 86400000,
    status: "verified",
    receiptImg,
    source: "manual-passport",
  };

  const history = rcLoad(RC_PASSPORT_HISTORY_KEY, []);
  if (
    !rcSave(RC_PASSPORT_HISTORY_KEY, [
      record,
      ...(Array.isArray(history) ? history : []),
    ])
  )
    return;
  rcSave("repairConnectPassport", {
    id: record.id,
    code: record.code,
    deviceName: record.deviceName,
    shopName: record.shopName,
    detail: record.detail,
    warrantyDays: record.warrantyDays,
    expiresAt: record.expiresAt,
    status: record.status,
    createdAt: record.createdAt,
  });

  savedReceiptDataUrl = null;
  event.target.reset();
  if (rcEl("receiptPreviewImg")) {
    rcEl("receiptPreviewImg").removeAttribute("src");
    rcEl("receiptPreviewImg").classList.add("hidden");
  }
  closeAddPassportModal();
  window.renderSavedPassport();
  window.generateAndShowQR(code);
  alert("Nota dan QR Passport berhasil disimpan.");
};

window.renderSavedPassport = function () {
  const records = rcPassportRecords();
  const latest = records[0];
  const title = rcEl("passDeviceTitle");
  if (!title) return;
  const desc = rcEl("passDeviceDesc");
  const badge = rcEl("passStatusBadge");
  const qrButton = rcEl("passQrBtn");
  const historyBox = rcEl("passportHistory");
  const healthTitle = rcEl("healthDeviceName");
  const healthValue = rcEl("healthScoreValue");
  const healthStatus = rcEl("healthScoreStatus");
  const healthBar = rcEl("healthScoreBar");
  const advice = rcEl("preventiveAdviceText");

  if (!latest) {
    title.textContent = "Belum Ada Nota Terdaftar";
    if (desc)
      desc.textContent =
        "Daftarkan nota servis pertama Anda untuk membuat QR Passport";
    badge?.classList.add("hidden");
    qrButton?.classList.add("hidden");
    if (historyBox) historyBox.innerHTML = "";
    if (healthTitle) healthTitle.textContent = "Belum Ada Perangkat";
    if (healthValue) healthValue.textContent = "--%";
    if (healthStatus) healthStatus.textContent = "Menunggu Data";
    if (healthBar) healthBar.style.width = "0%";
    if (advice)
      advice.textContent =
        'Belum ada riwayat servis tercatat. Klik "+ Daftarkan Nota" untuk menambahkan perangkat.';
    return;
  }

  const expiresAt = rcPassportExpiry(latest);
  const active = Date.now() <= expiresAt;
  const expiryText = new Date(expiresAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  title.textContent = `${latest.deviceName} — ${latest.detail}`;
  if (desc)
    desc.textContent = `Tempat Servis: ${latest.shopName || latest.shopKey} • Berlaku s/d ${expiryText} (${latest.warrantyDays} Hari)`;
  if (badge) {
    badge.textContent = active
      ? `Garansi Aktif (${latest.warrantyDays} Hari)`
      : "Garansi Berakhir";
    badge.className = `text-[10px] font-bold px-2.5 py-1 rounded-full ${active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}`;
  }
  if (qrButton) {
    qrButton.classList.remove("hidden");
    qrButton.style.display = "inline-flex";
    qrButton.onclick = () => window.generateAndShowQR(latest.code);
  }

  if (healthTitle) healthTitle.textContent = latest.deviceName;
  const ageDays = Math.max(
    0,
    Math.floor((Date.now() - Number(latest.createdAt)) / 86400000),
  );
  const healthScore = Math.max(
    60,
    Math.min(
      100,
      100 - Math.floor(ageDays / 7) + Math.min(8, (records.length - 1) * 2),
    ),
  );
  if (healthValue) healthValue.textContent = `${healthScore}%`;
  if (healthStatus)
    healthStatus.textContent = active
      ? "Kondisi Terpantau"
      : "Perlu Pemeriksaan";
  if (healthBar) {
    healthBar.style.width = `${healthScore}%`;
    healthBar.className = `h-full rounded-full ${healthScore >= 80 ? "bg-emerald-500" : "bg-amber-500"}`;
  }
  if (advice)
    advice.textContent = `Perangkat ${latest.deviceName} tercatat menjalani ${latest.detail} di ${latest.shopName || latest.shopKey}. Simpan QR Passport dan bukti nota untuk pengecekan garansi.`;

  if (historyBox)
    historyBox.innerHTML = records
      .slice(1)
      .map((record) => {
        const validUntil = new Date(
          rcPassportExpiry(record),
        ).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        const state =
          Date.now() <= rcPassportExpiry(record)
            ? "Garansi Aktif"
            : "Garansi Berakhir";
        return `<div class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-[11px]">
        <div class="min-w-0 flex-1"><p class="truncate font-bold text-slate-800">${escapeHtml(record.deviceName)} — ${escapeHtml(record.detail)}</p><p class="mt-1 truncate text-slate-500">${escapeHtml(record.shopName || record.shopKey)} · ${state} s/d ${validUntil}</p></div>
        <button type="button" onclick="generateAndShowQR('${escapeHtml(record.code)}')" class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 font-bold text-blue-700 hover:bg-blue-100"><i class="fa-solid fa-qrcode"></i> QR Passport</button>
      </div>`;
      })
      .join("");
};

window.generateAndShowQR = function (code) {
  const record = rcPassportRecords().find((item) => item.code === code);
  if (!record) {
    alert("Data QR Passport tidak ditemukan pada perangkat ini.");
    return;
  }
  const canvas = rcEl("qrcodeCanvas");
  if (!canvas || typeof QRCode === "undefined") {
    alert("Library QR Code belum berhasil dimuat.");
    return;
  }
  canvas.innerHTML = "";
  new QRCode(canvas, {
    text: rcPassportQrUrl(record),
    width: 160,
    height: 160,
  });
  rcEl("qrPassCode").textContent = `ID: ${record.code}`;
  rcEl("qrModalShopName").textContent =
    `Lokasi Servis: ${record.shopName || record.shopKey}`;
  const receipt = rcEl("qrModalReceiptPreview");
  if (record.receiptImg) {
    receipt.src = record.receiptImg;
    receipt.classList.remove("hidden");
  } else {
    receipt.removeAttribute("src");
    receipt.classList.add("hidden");
  }
  rcEl("qrModal").classList.remove("hidden");
};

window.openPassportCertificate = function (params) {
  const query = params || new URLSearchParams(window.location.search);
  const code = query.get("pass") || query.get("qr");
  if (!code) return;
  const stored = [
    ...rcLoad(RC_PASSPORT_HISTORY_KEY, []),
    ...rcLoad(RC_REQ_KEY, []),
  ].find((record) => record.code === code || record.id === code);
  const record = stored || {
    code,
    deviceName: query.get("device") || "-",
    shopName: query.get("shop") || "-",
    detail: query.get("service") || "-",
    warrantyDays: Number(query.get("days")) || 30,
    expiresAt: Number(query.get("expires")) || Date.now() + 30 * 86400000,
    status: "verified",
  };
  const expiry = rcPassportExpiry(record);
  const active = Date.now() <= expiry;
  rcEl("certificateCode").textContent = `ID: ${record.code || code}`;
  rcEl("certificateShop").textContent =
    record.shopName || record.shopKey || "-";
  rcEl("certificateDevice").textContent = record.deviceName || "-";
  rcEl("certificateService").textContent = record.detail || "-";
  rcEl("certificateWarranty").textContent =
    `Garansi ${record.warrantyDays || 30} Hari (${active ? "Aktif" : "Berakhir"})`;
  const receipt = rcEl("certificateReceipt");
  const noReceipt = rcEl("certificateNoReceipt");
  if (record.receiptImg) {
    receipt.src = record.receiptImg;
    receipt.classList.remove("hidden");
    noReceipt.classList.add("hidden");
  } else {
    receipt.removeAttribute("src");
    receipt.classList.add("hidden");
    noReceipt.classList.remove("hidden");
  }
  const modal = rcEl("passportCertificateModal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
};

window.closePassportCertificate = function () {
  const modal = rcEl("passportCertificateModal");
  modal?.classList.add("hidden");
  modal?.classList.remove("flex");
  const url = new URL(window.location.href);
  url.searchParams.delete("pass");
  url.searchParams.delete("qr");
  window.history.replaceState({}, "", `${url.pathname}${url.hash}`);
};

window.syncQrModalState = function () {
  window.renderSavedPassport();
};
window.updatePreventiveCareUI = function () {
  window.renderSavedPassport();
};

window.addEventListener("DOMContentLoaded", () => {
  window.renderSavedPassport();
  window.openPassportCertificate();
});
window.addEventListener("storage", (event) => {
  if (event.key === RC_PASSPORT_HISTORY_KEY || event.key === RC_REQ_KEY)
    window.renderSavedPassport();
});
