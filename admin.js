(() => {
  const ADMIN_PIN = "123456";
  const SESSION_KEY = "rc_admin_unlocked";
  const registrationParams = new URLSearchParams(location.search);
  const hasPendingRegistration = registrationParams.get("status") === "Pending";
  const submittedShopId = registrationParams.get("shopId");
  const $ = (id) => document.getElementById(id);
  const escapeHtml = (value) =>
    String(value ?? "").replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[char],
    );
  const dateText = (value) => {
    const date = new Date(Number(value) || value || Date.now());
    return Number.isNaN(date.getTime())
      ? "-"
      : date.toLocaleString("id-ID", {
          dateStyle: "medium",
          timeStyle: "short",
        });
  };
  let toastTimer;

  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add("hidden"), 2800);
  }

  function unlockDashboard() {
    $("loginView").classList.add("hidden");
    $("dashboardView").classList.remove("hidden");
    RCMerchantStore.read();
    renderAll();
    const hasWebsitePending = getShops().some(
      (shop) =>
        shop.status === "Pending" && shop.source === "website-registration",
    );
    if (hasPendingRegistration || hasWebsitePending) {
      $("statusFilter").value = "Pending";
      renderMerchantRows(getShops());
      $("merchants").scrollIntoView({ behavior: "smooth", block: "start" });
      if (submittedShopId) {
        const newShopRow = [...$("merchantRows").querySelectorAll("tr")].find(
          (row) =>
            [...row.querySelectorAll("button[data-id]")].some(
              (button) => button.dataset.id === submittedShopId,
            ),
        );
        setTimeout(
          () =>
            newShopRow?.scrollIntoView({ behavior: "smooth", block: "center" }),
          350,
        );
      }
    }
  }

  function getShops() {
    return RCMerchantStore.read();
  }

  function renderStats(shops) {
    $("kpiTotal").textContent = shops.length;
    $("kpiVerified").textContent = shops.filter(
      (shop) => shop.status === "Verified",
    ).length;
    $("kpiPending").textContent = shops.filter(
      (shop) => shop.status === "Pending",
    ).length;
    $("kpiAreas").textContent = new Set(
      shops
        .map((shop) => `${shop.city}|${shop.province}`.toLowerCase())
        .filter(Boolean),
    ).size;
  }

  function renderCityFilter(shops) {
    const select = $("cityFilter");
    const selected = select.value;
    const cities = [
      ...new Set(shops.map((shop) => shop.city).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b, "id"));
    select.innerHTML =
      '<option value="">Semua kota / daerah</option>' +
      cities
        .map(
          (city) =>
            `<option value="${escapeHtml(city)}">${escapeHtml(city)}</option>`,
        )
        .join("");
    if (cities.includes(selected)) select.value = selected;
  }

  function filteredShops(shops) {
    const query = $("searchInput").value.trim().toLocaleLowerCase("id");
    const city = $("cityFilter").value;
    const status = $("statusFilter").value;
    return shops.filter((shop) => {
      const matchesName =
        !query || shop.name.toLocaleLowerCase("id").includes(query);
      return (
        matchesName &&
        (!city || shop.city === city) &&
        (!status || shop.status === status)
      );
    });
  }

  function renderMerchantRows(shops) {
    const results = filteredShops(shops);
    $("tableCount").textContent = `${results.length} dari ${shops.length}`;
    $("emptyMerchants").classList.toggle("hidden", results.length !== 0);
    $("merchantRows").innerHTML = results
      .map((shop) => {
        const verified = shop.status === "Verified";
        const area = [shop.city, shop.province].filter(Boolean).join(", ");
        const statusClass = verified
          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
          : "bg-amber-50 text-amber-800 border-amber-200";
        return `<tr>
        <td class="px-3 py-3 align-top"><p class="font-bold text-slate-800">${escapeHtml(shop.name)}</p><p class="text-[10px] text-slate-500 mt-1">${escapeHtml(shop.phone || "Nomor WA belum diisi")}</p></td>
        <td class="px-3 py-3 align-top text-slate-600">${escapeHtml(area || "-")}</td>
        <td class="px-3 py-3 align-top text-slate-600">${escapeHtml(shop.specialization || shop.spec || "-")}</td>
        <td class="px-3 py-3 align-top"><span class="inline-flex whitespace-nowrap border rounded-full px-2 py-1 text-[10px] font-bold ${statusClass}">${verified ? "Verified" : "Pending"}</span></td>
        <td class="px-3 py-3 align-top"><div class="flex flex-wrap gap-1.5">
          <button type="button" data-action="verify" data-id="${escapeHtml(shop.id)}" class="rounded-md px-2 py-1.5 text-[10px] font-bold ${verified ? "bg-slate-100 text-slate-400" : "bg-emerald-600 text-white hover:bg-emerald-700"}" ${verified ? "disabled" : ""}>${verified ? "Verified" : "Setujui"}</button>
          <button type="button" data-action="edit" data-id="${escapeHtml(shop.id)}" class="rounded-md px-2 py-1.5 text-[10px] font-bold border border-blue-200 text-blue-700 hover:bg-blue-50">Edit</button>
          <button type="button" data-action="delete" data-id="${escapeHtml(shop.id)}" class="rounded-md px-2 py-1.5 text-[10px] font-bold border border-rose-200 text-rose-700 hover:bg-rose-50">Hapus</button>
        </div></td>
      </tr>`;
      })
      .join("");
  }

  function collectPassportHistory() {
    const records = [];
    try {
      const requests = JSON.parse(
        localStorage.getItem("rc_passport_requests") || "[]",
      );
      if (Array.isArray(requests))
        records.push(
          ...requests.map((record) => ({
            ...record,
            kind: "Pengajuan toko",
            shopName: record.shopKey,
            createdAt: record.createdAt,
          })),
        );
    } catch (error) {}
    try {
      const history = JSON.parse(
        localStorage.getItem("rc_passport_history") || "[]",
      );
      if (Array.isArray(history))
        records.push(
          ...history.map((record) => ({
            ...record,
            kind: "QR Passport",
            shopName: record.shopName,
          })),
        );
    } catch (error) {}
    try {
      const legacy = JSON.parse(
        localStorage.getItem("repairConnectPassport") || "null",
      );
      if (
        legacy &&
        typeof legacy === "object" &&
        (legacy.deviceName || legacy.shopName)
      )
        records.push({
          ...legacy,
          id: legacy.id || legacy.code || "legacy-passport",
          kind: "Nota digital lama",
          shopName: legacy.shopName || legacy.shopKey,
          createdAt: legacy.createdAt || Date.now(),
        });
    } catch (error) {}

    const unique = new Map();
    records.forEach((record) => {
      const key =
        record.id ||
        record.code ||
        `${record.deviceName}|${record.shopName}|${record.createdAt}`;
      if (!unique.has(key)) unique.set(key, record);
    });
    return [...unique.values()].sort(
      (a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0),
    );
  }

  function renderPassportRows() {
    const records = collectPassportHistory();
    $("passportCount").textContent = `${records.length} catatan`;
    $("passportRows").innerHTML = records.length
      ? records
          .map((record) => {
            const state =
              record.status === "verified" || record.status === "active"
                ? "Aktif / Terverifikasi"
                : record.status === "rejected"
                  ? "Ditolak"
                  : "Menunggu validasi";
            const stateClass =
              state === "Aktif / Terverifikasi"
                ? "text-emerald-700"
                : state === "Ditolak"
                  ? "text-rose-700"
                  : "text-amber-700";
            return `<article class="border border-slate-200 rounded-lg p-3 flex items-start justify-between gap-3"><div class="min-w-0"><p class="font-bold text-slate-800 truncate">${escapeHtml(record.deviceName || "Perangkat tidak dicatat")}</p><p class="text-[11px] text-slate-600 mt-1 truncate">${escapeHtml(record.shopName || "Nama toko tidak dicatat")} · ${escapeHtml(record.detail || "Detail servis tidak dicatat")}</p><p class="text-[10px] text-slate-400 mt-1">${escapeHtml(record.kind)} · ${escapeHtml(dateText(record.createdAt))}</p></div><div class="shrink-0 text-right"><p class="text-[10px] font-bold ${stateClass}">${state}</p><p class="text-[10px] text-slate-500 mt-1">${record.warrantyDays ? `${escapeHtml(record.warrantyDays)} hari garansi` : escapeHtml(record.code || "")}</p></div></article>`;
          })
          .join("")
      : '<p class="py-8 text-center text-xs text-slate-500">Belum ada riwayat nota digital di browser ini.</p>';
  }

  function renderAll() {
    const shops = getShops();
    renderStats(shops);
    renderCityFilter(shops);
    renderMerchantRows(shops);
    renderPassportRows();
  }

  function resetMerchantForm() {
    $("merchantForm").reset();
    $("merchantId").value = "";
    $("formTitle").textContent = "Tambah Mitra";
    $("merchantStatus").value = "Pending";
    $("cancelEditButton").classList.add("hidden");
  }

  function editMerchant(shop) {
    $("merchantId").value = shop.id;
    $("merchantName").value = shop.name || "";
    $("merchantCity").value = shop.city || "";
    $("merchantProvince").value = shop.province || "";
    $("merchantAddress").value = shop.address || "";
    $("merchantMaps").value = shop.mapsUrl || "";
    $("merchantLat").value = shop.lat ?? "";
    $("merchantLng").value = shop.lng ?? "";
    $("merchantPhone").value = shop.phone || "";
    const specialization =
      shop.specialization || shop.spec || "Elektronik Umum";
    $("merchantSpecialization").value = [
      ...$("merchantSpecialization").options,
    ].some((option) => option.value === specialization)
      ? specialization
      : "Elektronik Umum";
    $("merchantStatus").value = shop.status;
    $("formTitle").textContent = "Edit Data Mitra";
    $("cancelEditButton").classList.remove("hidden");
    $("merchantFormPanel").scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function categoryFor(specialization) {
    if (/smartphone/i.test(specialization))
      return { type: "phone", can: { phone: true, laptop: false } };
    if (/laptop|pc|komputer/i.test(specialization))
      return { type: "laptop", can: { phone: false, laptop: true } };
    return { type: "both", can: { phone: true, laptop: true } };
  }

  function saveMerchant(event) {
    event.preventDefault();
    const phone = $("merchantPhone").value.replace(/\D/g, "");
    if (!/^628\d{8,12}$/.test(phone)) {
      showToast("Format WhatsApp harus 628 diikuti 8–12 angka.");
      $("merchantPhone").focus();
      return;
    }
    const specialization = $("merchantSpecialization").value;
    const category = categoryFor(specialization);
    const existing = getShops().find(
      (shop) => shop.id === $("merchantId").value,
    );
    const shop = {
      ...existing,
      id: $("merchantId").value || undefined,
      name: $("merchantName").value.trim(),
      city: $("merchantCity").value.trim(),
      province: $("merchantProvince").value.trim(),
      address: $("merchantAddress").value.trim(),
      mapsUrl: $("merchantMaps").value.trim(),
      lat: Number($("merchantLat").value),
      lng: Number($("merchantLng").value),
      phone,
      specialization,
      spec: specialization,
      type: category.type,
      can: category.can,
      status: $("merchantStatus").value,
      isVerified: $("merchantStatus").value === "Verified",
      source: existing?.source || "admin",
      createdAt: existing?.createdAt || Date.now(),
      updatedAt: Date.now(),
    };
    try {
      RCMerchantStore.upsert(shop);
      resetMerchantForm();
      renderAll();
      showToast("Data mitra tersimpan dan tersinkron di browser ini.");
    } catch (error) {
      showToast(
        "Gagal menyimpan. Penyimpanan browser mungkin penuh atau dinonaktifkan.",
      );
    }
  }

  function distanceKm(lat1, lng1, lat2, lng2) {
    const toRad = (degrees) => (degrees * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const value =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
  }

  function runRadiusTest(event) {
    event.preventDefault();
    const lat = Number($("testLat").value);
    const lng = Number($("testLng").value);
    const results = getShops()
      .filter(
        (shop) =>
          shop.status === "Verified" &&
          Number.isFinite(Number(shop.lat)) &&
          Number.isFinite(Number(shop.lng)),
      )
      .map((shop) => ({
        shop,
        km: distanceKm(lat, lng, Number(shop.lat), Number(shop.lng)),
      }))
      .filter((entry) => entry.km <= 8)
      .sort((a, b) => a.km - b.km);
    $("radiusResults").innerHTML = results.length
      ? `<p class="font-bold text-slate-700 mb-2">${results.length} mitra terverifikasi dalam radius 8 km</p>` +
        results
          .map(
            ({ shop, km }) =>
              `<div class="flex justify-between gap-3 border-t border-slate-100 py-2"><span class="font-semibold text-slate-700">${escapeHtml(shop.name)} <span class="font-normal text-slate-500">· ${escapeHtml(shop.city)}</span></span><span class="shrink-0 font-bold text-blue-700">${km.toFixed(2)} km</span></div>`,
          )
          .join("")
      : '<p class="rounded-lg bg-amber-50 border border-amber-200 p-3 text-amber-900">Tidak ada mitra Verified dalam radius 8 km dari titik uji.</p>';
  }

  function parseMapsCoordinates() {
    const mapsUrl = $("merchantMaps").value;
    const match =
      mapsUrl.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/) ||
      mapsUrl.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/) ||
      mapsUrl.match(
        /[?&](?:q|query|destination)=(-?\d+(?:\.\d+)?)[,%2C]+(-?\d+(?:\.\d+)?)/i,
      );
    if (!match)
      return showToast(
        "Koordinat tidak terbaca dari link. Salin pasangan angka dari pin Google Maps.",
      );
    $("merchantLat").value = match[1];
    $("merchantLng").value = match[2];
    showToast("Koordinat diambil dari link Google Maps.");
  }

  function useCurrentLocation() {
    if (!navigator.geolocation)
      return showToast("Browser ini tidak mendukung Geolocation.");
    $("currentLocationButton").disabled = true;
    $("currentLocationButton").innerHTML =
      '<i class="fa-solid fa-spinner fa-spin mr-1"></i>Mendeteksi';
    navigator.geolocation.getCurrentPosition(
      (position) => {
        $("merchantLat").value = position.coords.latitude;
        $("merchantLng").value = position.coords.longitude;
        $("currentLocationButton").disabled = false;
        $("currentLocationButton").innerHTML =
          '<i class="fa-solid fa-location-crosshairs mr-1"></i>Ambil koordinat saya';
        showToast("Koordinat perangkat berhasil diambil.");
      },
      (error) => {
        $("currentLocationButton").disabled = false;
        $("currentLocationButton").innerHTML =
          '<i class="fa-solid fa-location-crosshairs mr-1"></i>Ambil koordinat saya';
        showToast(error.message || "Izin lokasi tidak tersedia.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  }

  $("loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    if ($("adminPin").value !== ADMIN_PIN) {
      $("loginError").textContent = "PIN tidak sesuai.";
      $("loginError").classList.remove("hidden");
      return;
    }
    sessionStorage.setItem(SESSION_KEY, "1");
    $("loginError").classList.add("hidden");
    unlockDashboard();
  });
  $("logoutButton").addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    location.reload();
  });
  const mobileSidebar = $("mobileSidebar");
  const sidebarToggle = $("sidebarToggle");
  const adminNavLinks = [...document.querySelectorAll("[data-admin-nav]")];

  function setActiveNav(sectionId) {
    adminNavLinks.forEach((link) => {
      const active = link.hash === `#${sectionId}`;
      link.classList.toggle("bg-blue-50", active);
      link.classList.toggle("text-blue-800", active);
      link.classList.toggle("text-slate-600", !active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  sidebarToggle.addEventListener("click", () => {
    const isOpen = mobileSidebar.classList.toggle("hidden") === false;
    sidebarToggle.setAttribute("aria-expanded", String(isOpen));
    sidebarToggle.setAttribute(
      "aria-label",
      isOpen ? "Tutup menu dashboard" : "Buka menu dashboard",
    );
    sidebarToggle.title = isOpen
      ? "Tutup menu dashboard"
      : "Buka menu dashboard";
    sidebarToggle.innerHTML = isOpen
      ? '<i class="fa-solid fa-xmark"></i>'
      : '<i class="fa-solid fa-bars"></i>';
  });

  adminNavLinks.forEach((link) =>
    link.addEventListener("click", () => {
      setActiveNav(link.hash.slice(1));
      mobileSidebar.classList.add("hidden");
      sidebarToggle.setAttribute("aria-expanded", "false");
      sidebarToggle.setAttribute("aria-label", "Buka menu dashboard");
      sidebarToggle.title = "Buka menu dashboard";
      sidebarToggle.innerHTML = '<i class="fa-solid fa-bars"></i>';
    }),
  );

  const navObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) setActiveNav(visible[0].target.id);
    },
    { rootMargin: "-18% 0px -68% 0px" },
  );
  ["overview", "merchants", "radius", "passports"].forEach((id) => {
    const section = $(id);
    if (section) navObserver.observe(section);
  });
  if (location.hash) setActiveNav(location.hash.slice(1));

  $("merchantForm").addEventListener("submit", saveMerchant);
  $("cancelEditButton").addEventListener("click", resetMerchantForm);
  $("radiusForm").addEventListener("submit", runRadiusTest);
  $("searchInput").addEventListener("input", () =>
    renderMerchantRows(getShops()),
  );
  ["cityFilter", "statusFilter"].forEach((id) =>
    $(id).addEventListener("change", () => renderMerchantRows(getShops())),
  );
  $("refreshButton").addEventListener("click", renderAll);
  $("parseMapsButton").addEventListener("click", parseMapsCoordinates);
  $("currentLocationButton").addEventListener("click", useCurrentLocation);
  $("merchantRows").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const shop = getShops().find((entry) => entry.id === button.dataset.id);
    if (!shop) return;
    if (button.dataset.action === "edit") editMerchant(shop);
    if (button.dataset.action === "verify") {
      RCMerchantStore.upsert({
        ...shop,
        status: "Verified",
        isVerified: true,
        badge: "Mitra Terverifikasi",
        verifiedAt: Date.now(),
      });
      renderAll();
      showToast(`${shop.name} berhasil diverifikasi.`);
    }
    if (
      button.dataset.action === "delete" &&
      confirm(`Hapus mitra ${shop.name}?`)
    ) {
      RCMerchantStore.remove(shop.id);
      renderAll();
      showToast("Mitra dihapus dari daftar.");
    }
  });
  window.addEventListener("storage", (event) => {
    if (event.key === RCMerchantStore.key) {
      let previousShops = [];
      let currentShops = [];
      try {
        previousShops = JSON.parse(event.oldValue || "[]");
        currentShops = JSON.parse(event.newValue || "[]");
      } catch (error) {}

      const previousIds = new Set(previousShops.map((shop) => shop.id));
      const newPendingShops = currentShops.filter(
        (shop) => shop.status === "Pending" && !previousIds.has(shop.id),
      );

      renderAll();
      if (newPendingShops.length) {
        $("statusFilter").value = "Pending";
        renderMerchantRows(getShops());
        $("merchants").scrollIntoView({ behavior: "smooth", block: "start" });
        const newShop = newPendingShops[0];
        const newRow = [...$("merchantRows").querySelectorAll("tr")].find(
          (row) =>
            [...row.querySelectorAll("button[data-id]")].some(
              (button) => button.dataset.id === newShop.id,
            ),
        );
        newRow?.classList.add("bg-amber-50");
        setTimeout(() => newRow?.classList.remove("bg-amber-50"), 3000);
        showToast("Pendaftaran mitra baru masuk dengan status Pending.");
      }
      return;
    }
    if (
      [
        "rc_passport_requests",
        "rc_passport_history",
        "repairConnectPassport",
      ].includes(event.key)
    )
      renderAll();
  });
  window.addEventListener("rc-passport-history-updated", renderPassportRows);

  if (sessionStorage.getItem(SESSION_KEY) === "1") unlockDashboard();
})();
