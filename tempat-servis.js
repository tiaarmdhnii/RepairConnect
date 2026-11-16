(function () {
  const qs = new URLSearchParams(window.location.search);
  let activeCat = qs.get("cat") === "laptop" ? "laptop" : "phone";
  let radiusKm = Math.min(8, parseInt(qs.get("radius"), 10) || 8);
  let searchQ = "";
  let userLat = null;
  let userLng = null;
  let allShops = [];
  let map = null;
  let markerLayer = null;

  const $ = (id) => document.getElementById(id);

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function norm(s) {
    return String(s || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

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

    const hard =
      /\b(sekolah|smk|sma|smp|sd|universitas|kampus|institut|akademi|bimbel|kursus|bank|atm|masjid|gereja|klinik|apotek|apotik|puskesmas|rumah sakit|hotel|kost|kos|notaris|travel|tour|ekspedisi|laundry|catering|barber|salon|bengkel|motor|mobil|auto|honda|yamaha|suzuki|toyota|daihatsu|velg|aki|radiator|knalpot|dinamo|kulkas|mesin cuci|pompa|telkomsel|grapari|indosat|smartfren|optik|kacamata|sepatu|furniture|sofa|bangunan|wedding|furniture|sofa|bangunan|wedding|notary|dhl|makita|maktec|lakoni|niko|bosch|kurir|courier|cargo|logistik|generator)\b/;
    if (hard.test(n)) return false;

    const strong =
      /\b(hp|handphone|hand phone|ponsel|seluler|selular|cellular|cell|gsm|konter|counter|smartphone|phone|iphone|ipad|ibox|android|xiaomi|redmi|poco|samsung|oppo|vivo|realme|infinix|tecno|itel|honor|huawei|asus|rog|lenovo|acer|dell|msi|axioo|advan|zyrex|macbook|laptop|notebook|komputer|computer|pc|tablet|tab|gadget)\b/;
    const isStrong = strong.test(n);

    const soft =
      /\b(tv|televisi|ac|kipas|kompor|elektronik|electronic|electronics|printer|print|fotocopy|foto copy|percetakan|cetak|atk|cctv|warnet|rental|studio|photo|buku|jam|tas|fashion)\b/;
    if (!isStrong && soft.test(n)) return false;

    const tagOk =
      /(mobile phone|cell phone|phone repair|computer|electronics repair)/.test(
        tag,
      );
    return isStrong || tagOk;
  }

  function distKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function initMap(lat, lng) {
    const mapEl =
      $("map") || $("shopMap") || document.querySelector(".leaflet-container");
    if (!mapEl || typeof L === "undefined") return;
    if (!map) {
      map = L.map(mapEl.id || "map").setView([lat, lng], 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);
      markerLayer = L.layerGroup().addTo(map);
    } else {
      map.setView([lat, lng], 14);
    }
  }

  function cachedNearbyShops(lat, lng, category) {
    const candidates = [];
    try {
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (
          !key ||
          (!key.startsWith(`rc_map_page_${category}_`) &&
            !key.startsWith(`rc_map_page_v2_${category}_`) &&
            !key.startsWith(`rc_osm_raw_${category}_`) &&
            !key.startsWith(`rc_osm_raw_v2_${category}_`))
        )
          continue;

        const cached = load(key, null);
        const items = Array.isArray(cached?.list)
          ? cached.list
          : Array.isArray(cached?.els)
            ? cached.els
            : [];
        items.forEach((item) => {
          const tags = item.tags || {};
          const sLat = Number(item.sLat ?? item.lat ?? item.center?.lat);
          const sLng = Number(
            item.sLng ?? item.lon ?? item.lng ?? item.center?.lon,
          );
          const name = String(item.name || tags.name || "").trim();
          if (
            !name ||
            !Number.isFinite(sLat) ||
            !Number.isFinite(sLng) ||
            !rcIsGadgetShop(
              name,
              [tags.shop, tags.craft, tags.amenity].filter(Boolean).join(" "),
            )
          )
            return;
          const km = distKm(lat, lng, sLat, sLng);
          if (km > 8) return;
          candidates.push({
            name,
            address: item.address || tags.address || "",
            phone: item.phone || tags.phone || tags["contact:phone"] || "",
            sLat,
            sLng,
            km,
          });
        });
      }
    } catch (error) {}

    const seen = new Set();
    return candidates
      .sort((a, b) => a.km - b.km)
      .filter((shop) => {
        const key = `${norm(shop.name)}|${shop.sLat.toFixed(4)}|${shop.sLng.toFixed(4)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }

  async function fetchPhotonShops(lat, lng, category) {
    const cacheKey = `rc_map_page_v2_${category}_${lat.toFixed(2)}_${lng.toFixed(2)}`;
    const cached = load(cacheKey, null);
    const cachedShops = cachedNearbyShops(lat, lng, category);
    if (
      cached &&
      Date.now() - cached.t < 6 * 3600 * 1000 &&
      cached.list?.length
    ) {
      const combined = [...cached.list, ...cachedShops]
        .map((shop) => {
          const sLat = Number(shop.sLat ?? shop.lat);
          const sLng = Number(shop.sLng ?? shop.lng);
          return {
            ...shop,
            sLat,
            sLng,
            km: distKm(lat, lng, sLat, sLng),
          };
        })
        .filter(
          (shop) =>
            Number.isFinite(shop.sLat) &&
            Number.isFinite(shop.sLng) &&
            shop.km <= 8,
        )
        .sort((a, b) => a.km - b.km);
      const seen = new Set();
      return combined.filter((shop) => {
        const key = `${norm(shop.name)}|${shop.sLat.toFixed(4)}|${shop.sLng.toFixed(4)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

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

    const words =
      category === "laptop"
        ? [
            "service laptop",
            "laptop repair",
            "komputer",
            "computer",
            "computer repair",
            "laptop",
            "notebook service",
            "service tablet",
            "asus",
            "lenovo",
            "acer",
          ]
        : [
            "service hp",
            "service handphone",
            "cellular",
            "cell",
            "ponsel",
            "smartphone service",
            "phone repair",
            "tablet service",
            "gadget repair",
            "komputer",
          ];

    const tasks = words.map((w) => {
      const q = areaName ? `${w} ${areaName}` : w;
      return fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&lat=${lat}&lon=${lng}&limit=50`,
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
                name: p.name,
                address: addr,
                sLat: f.geometry.coordinates[1],
                sLng: f.geometry.coordinates[0],
              };
            }),
        )
        .catch(() => []);
    });

    const raw = (await Promise.all(tasks)).flat();

    const dLat = 8 / 111;
    const dLng = 8 / (111 * Math.cos((lat * Math.PI) / 180));
    const viewbox = `${(lng - dLng).toFixed(4)},${(lat + dLat).toFixed(4)},${(lng + dLng).toFixed(4)},${(lat - dLat).toFixed(4)}`;
    try {
      const nomQueries =
        category === "laptop"
          ? ["komputer", "laptop", "computer repair"]
          : ["cellular", "mobile phone", "service hp", "tablet"];
      for (let index = 0; index < nomQueries.length; index += 1) {
        if (index) await new Promise((resolve) => setTimeout(resolve, 1100));
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(nomQueries[index])}&viewbox=${viewbox}&bounded=1&limit=50&accept-language=id`,
        );
        if (!res.ok) continue;
        const data = await res.json();
        data.forEach((item) => {
          const parts = (item.display_name || "")
            .split(",")
            .map((part) => part.trim());
          const title = (item.name || parts[0] || "").trim();
          if (title) {
            raw.push({
              name: title,
              address: parts.slice(1, 4).join(", "),
              sLat: parseFloat(item.lat),
              sLng: parseFloat(item.lon),
            });
          }
        });
      }
    } catch (e) {}

    const nonGadgetRegex =
      /\b(sekolah|universitas|kampus|institut|akademi|stekom|sd|smp|sma|smk|jok|dinamo|mesin|motor|mobil|auto|honda|yamaha|suzuki|toyota|daihatsu|mitsubishi|nissan|ban|velg|ac|kulkas|pompa|las|knalpot|radiator|aki|cuci|salon|jahit|sepatu|jam|kunci|sofa|springbed|bank|atm|masjid|gereja|klinik|apotek|puskesmas|hotel|kost|kos|notary|notaris|hukum|law|pajak|tax|travel|tour|expedisi|ekspedisi|j&t|jne|sicepat|laundry|catering|barber|bengkel)\b/i;

    const gadgetRegex =
      /(hp|handphone|ponsel|seluler|cellular|cell|iphone|apple|ibox|android|xiaomi|redmi|poco|samsung|oppo|vivo|realme|infinix|asus|rog|lenovo|acer|dell|msi|ipad|tablet|tab|laptop|notebook|macbook|komputer|computer|pc|gadget|counter|konter)/i;

    const seen = new Set();
    const searched = raw
      .map((s) => ({
        ...s,
        km: distKm(lat, lng, s.sLat, s.sLng),
      }))
      .filter(
        (s) =>
          Number.isFinite(s.sLat) &&
          Number.isFinite(s.sLng) &&
          rcIsGadgetShop(s.name, ""),
      )
      .filter((s) => s.km <= 8)
      .sort((a, b) => a.km - b.km);
    const cleaned = [...searched, ...cachedShops]
      .sort((a, b) => a.km - b.km)
      .filter((shop) => {
        const key = `${norm(shop.name)}|${Number(shop.sLat).toFixed(4)}|${Number(shop.sLng).toFixed(4)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    if (cleaned.length > 0) {
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ t: Date.now(), list: cleaned }),
        );
      } catch (e) {}
    }

    return cleaned;
  }

  function updateCategoryButtons() {
    const btnLaptop = $("tabLaptop") || $("btnCatLaptop");
    const btnPhone = $("tabPhone") || $("btnCatPhone");
    if (btnLaptop) {
      btnLaptop.className =
        activeCat === "laptop"
          ? "px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-sm"
          : "px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200";
    }
    if (btnPhone) {
      btnPhone.className =
        activeCat === "phone"
          ? "px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-sm"
          : "px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200";
    }
  }

  function getContainers() {
    let locEl =
      $("locLabel") || $("pageSubtitle") || $("gpsStatusText") || $("subtitle");
    if (!locEl) {
      const h1 = document.querySelector("h1");
      if (h1 && h1.nextElementSibling) locEl = h1.nextElementSibling;
    }

    let listEl =
      $("shopList") ||
      $("shopResults") ||
      $("placesList") ||
      $("resultsContainer") ||
      $("cardsContainer");

    if (!listEl) {
      const mapEl = $("map") || document.querySelector(".leaflet-container");
      // Naik ke atas sampai menemukan container yang punya 2 anak (kolom daftar & kolom peta)
      let p = mapEl?.parentElement;
      while (p && p !== document.body) {
        if (p.children.length === 2 && p.contains(mapEl)) {
          listEl = p.children[0].contains(mapEl)
            ? p.children[1]
            : p.children[0];
          break;
        }
        p = p.parentElement;
      }
    }

    const countEl = $("resultCount") || $("shopCount");
    return { locEl, listEl, countEl };
  }

  function renderUI() {
    const { locEl, listEl, countEl } = getContainers();

    if (locEl) {
      locEl.textContent =
        userLat !== null && userLng !== null
          ? `Koordinat GPS aktif: (${userLat.toFixed(4)}, ${userLng.toFixed(4)}) • Radius maksimal 8 km.`
          : "Aktifkan GPS untuk melihat tempat servis dalam radius maksimal 8 km.";
    }

    const q = norm(searchQ);
    const filtered = allShops
      .map((s) => ({
        ...s,
        km:
          userLat !== null &&
          userLng !== null &&
          Number.isFinite(Number(s.sLat)) &&
          Number.isFinite(Number(s.sLng))
            ? distKm(userLat, userLng, s.sLat, s.sLng)
            : s.km || 0,
      }))
      .filter((s) => s.km <= radiusKm)
      .filter((s) => {
        if (!q) return true;
        return norm(s.name).includes(q) || norm(s.address).includes(q);
      })
      .filter(
        (shop, index, list) =>
          list.findIndex(
            (entry) =>
              norm(entry.name) === norm(shop.name) &&
              Number(entry.sLat).toFixed(4) === Number(shop.sLat).toFixed(4) &&
              Number(entry.sLng).toFixed(4) === Number(shop.sLng).toFixed(4),
          ) === index,
      )
      .sort((a, b) => a.km - b.km);

    if (countEl) {
      countEl.textContent = `${filtered.length} tempat servis ditemukan`;
    }

    if (map && markerLayer) {
      markerLayer.clearLayers();
      if (userLat !== null && userLng !== null) {
        L.circleMarker([userLat, userLng], {
          radius: 8,
          fillColor: "#2563eb",
          color: "#ffffff",
          weight: 2,
          fillOpacity: 1,
        })
          .bindPopup("Lokasi GPS Anda")
          .addTo(markerLayer);
      }
      filtered.forEach((s) => {
        if (
          !Number.isFinite(Number(s.sLat)) ||
          !Number.isFinite(Number(s.sLng))
        )
          return;
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.name} ${s.address || ""}`.trim())}`;
        L.marker([s.sLat, s.sLng])
          .bindPopup(
            `<b>${s.name}</b><br><span style="font-size:11px;color:#475569">${s.address || ""}</span><br><span style="font-size:11px;color:#ea580c;font-weight:700">${s.km.toFixed(1)} km</span> • <a href="${mapsUrl}" target="_blank" rel="noopener">Buka Maps</a>`,
          )
          .addTo(markerLayer);
      });
    }

    if (!listEl) return;

    if (!filtered.length) {
      listEl.innerHTML = `
        <div class="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
          ${userLat === null || userLng === null ? "Lokasi GPS belum tersedia. Aktifkan GPS untuk melihat tempat servis terdekat." : "Tidak ada tempat servis ditemukan dalam radius maksimal 8 km dari titik GPS ini."}
        </div>`;
      return;
    }

    listEl.innerHTML = filtered
      .map((s) => {
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${s.name} ${s.address || ""}`.trim())}`;
        const rawPhone = String(s.phone || "").replace(/[^0-9]/g, "");
        const waPhone = rawPhone.startsWith("0")
          ? "62" + rawPhone.slice(1)
          : rawPhone;

        const waSection = waPhone
          ? `<a href="https://wa.me/${waPhone}?text=${encodeURIComponent(`Halo ${s.name}, saya ingin bertanya mengenai servis perangkat di toko Anda.`)}" target="_blank" rel="noopener"
                class="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition">
                Hubungi via WhatsApp
             </a>`
          : `<div class="w-full text-center py-1.5 px-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                ⓘ Nomor WA belum tercantum di peta publik
             </div>`;

        return `
          <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-blue-300 transition">
            <h3 class="text-sm font-extrabold text-slate-800">${s.name}</h3>
            <div class="mt-1.5">
              <span class="inline-block text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                Tempat Servis HP & Laptop
              </span>
            </div>
            <p class="text-[11px] font-bold text-orange-600 mt-2">
              📍 ${s.km.toFixed(1)} km dari titik GPS kamu
            </p>
            <p class="text-xs text-slate-500 mt-1 line-clamp-2">
              ${s.address || "Alamat tersedia di Google Maps"}
            </p>
            <div class="mt-3 flex flex-col gap-2">
              <a href="${mapsUrl}" target="_blank" rel="noopener"
                 class="w-full text-center py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition">
                Lihat Rute di Google Maps
              </a>
              ${waSection}
            </div>
          </div>`;
      })
      .join("");
  }

  async function loadData(forceFresh) {
    const listEl = $("shopList") || $("shopResults") || $("placesList");
    if (listEl) {
      listEl.innerHTML = `
        <div class="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
          Memuat tempat servis terdekat...
        </div>`;
    }

    if (userLat === null || userLng === null) {
      const savedGps =
        load("rc_user_gps", null) || load("rc_last_coords", null);
      if (
        savedGps &&
        Number.isFinite(Number(savedGps.lat)) &&
        Number.isFinite(Number(savedGps.lng))
      ) {
        userLat = Number(savedGps.lat);
        userLng = Number(savedGps.lng);
      } else {
        userLat = null;
        userLng = null;
        allShops = [];
        renderUI();
        return;
      }
    }

    initMap(userLat, userLng);

    if (!forceFresh) {
      const verifiedCache = load("rc_verified_real_shops", null);
      if (
        verifiedCache &&
        Array.isArray(verifiedCache.list) &&
        verifiedCache.list.length > 0 &&
        verifiedCache.cat === activeCat &&
        distKm(userLat, userLng, verifiedCache.lat, verifiedCache.lng) < 1
      ) {
        allShops = verifiedCache.list;
        renderUI();
        return;
      }
    }

    allShops = await fetchPhotonShops(userLat, userLng, activeCat);
    renderUI();
  }

  function detectGps() {
    if (!navigator.geolocation) {
      loadData(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;
        try {
          localStorage.setItem(
            "rc_user_gps",
            JSON.stringify({ lat: userLat, lng: userLng }),
          );
        } catch (e) {}
        loadData(true);
      },
      () => {
        loadData(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  // Ekspos ke window untuk handler inline di tempat-servis.html
  window.setCategory = function (cat) {
    activeCat = cat === "laptop" ? "laptop" : "phone";
    updateCategoryButtons();
    loadData(false);
  };

  window.setRadius = function (val) {
    radiusKm = Math.min(8, parseInt(val, 10) || 8);
    renderUI();
  };

  window.filterShops = function (val) {
    searchQ =
      typeof val === "string"
        ? val
        : $("searchInput")?.value || $("searchShop")?.value || "";
    renderUI();
  };

  window.refreshGps = function () {
    detectGps();
  };

  window.setCat = window.setCategory;
  window.locateMe = window.refreshGps;

  document.addEventListener("DOMContentLoaded", () => {
    const sel = $("radiusSel") || $("radiusSelect") || $("radiusFilter");
    if (sel) sel.value = String(radiusKm);

    updateCategoryButtons();

    ($("tabLaptop") || $("btnCatLaptop"))?.addEventListener("click", () =>
      window.setCategory("laptop"),
    );
    ($("tabPhone") || $("btnCatPhone"))?.addEventListener("click", () =>
      window.setCategory("phone"),
    );
    sel?.addEventListener("change", (e) => window.setRadius(e.target.value));
    ($("searchInput") || $("searchShop"))?.addEventListener("input", (e) =>
      window.filterShops(e.target.value),
    );
    ($("btnGps") || $("btnUseGps"))?.addEventListener("click", () =>
      window.refreshGps(),
    );

    loadData(false);
  });
})();
