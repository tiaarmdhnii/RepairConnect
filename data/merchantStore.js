(function (root) {
  const KEY = "rc_partner_shops";
  const DEFAULTS = [
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
      promo: {
        title: "Gratis Cek Thermal & Fan Cleaning",
        code: "RC-CYBERMAC",
      },
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
      promo: {
        title: "Gratis Konsultasi & Cek Hardware",
        code: "RC-MITRAJAYA",
      },
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
    {
      id: "legacy-official-triple-d",
      name: "Triple D Gadget Care",
      address:
        "Jl. Nakula Raya No.45, Pendrikan Kidul, Kec. Semarang Tengah, Kota Semarang, Jawa Tengah 50131",
      city: "Semarang",
      province: "Jawa Tengah",
      lat: -6.9822,
      lng: 110.4092,
      phone: "6285117555706",
      specialization: "Servis Laptop & HP",
      type: "both",
      spec: "Servis Laptop & HP",
      status: "Verified",
      isVerified: true,
      badge: "Mitra Terverifikasi",
      can: { phone: true, laptop: true },
    },
  ];

  const makeId = () =>
    `shop-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const normalize = (shop, index) => {
    const spec = shop.specialization || shop.spec || "Elektronik Umum";
    const rawLat = shop.lat ?? shop.sLat;
    const rawLng = shop.lng ?? shop.sLng;
    const lat = rawLat === "" || rawLat == null ? NaN : Number(rawLat);
    const lng = rawLng === "" || rawLng == null ? NaN : Number(rawLng);
    const status = shop.status || (shop.isVerified ? "Verified" : "Pending");
    const can = shop.can || {
      phone: /smartphone|hp|phone|elektronik umum/i.test(spec),
      laptop: /laptop|notebook|pc|komputer|elektronik umum/i.test(spec),
    };
    return {
      ...shop,
      id: shop.id || `default-${index + 1}`,
      name: String(shop.name || "").trim(),
      city: shop.city || shop.kota || "Semarang",
      province: shop.province || shop.provinsi || "Jawa Tengah",
      address: shop.address || "",
      mapsUrl: shop.mapsUrl || shop.maps || "",
      lat: Number.isFinite(lat) ? lat : "",
      lng: Number.isFinite(lng) ? lng : "",
      phone: String(shop.phone || ""),
      specialization: spec,
      status:
        status === "Verified" || status === "verified" ? "Verified" : "Pending",
      createdAt: shop.createdAt || Date.now(),
      type:
        shop.type ||
        (can.phone && can.laptop ? "both" : can.laptop ? "laptop" : "phone"),
      spec,
      isVerified: status === "Verified" || status === "verified",
      badge:
        shop.badge ||
        (status === "Verified" || status === "verified"
          ? "Mitra Terverifikasi"
          : "Menunggu Verifikasi"),
      can,
    };
  };

  function read() {
    try {
      const raw = root.localStorage.getItem(KEY);
      if (!raw) return initialize(DEFAULTS);
      const items = JSON.parse(raw);
      return Array.isArray(items) ? items.map(normalize) : initialize(DEFAULTS);
    } catch (error) {
      return [];
    }
  }

  function save(items) {
    const normalized = items.map((item, index) => normalize(item, index));
    root.localStorage.setItem(KEY, JSON.stringify(normalized));
    return normalized;
  }

  function initialize(defaults) {
    try {
      const raw = root.localStorage.getItem(KEY);
      if (raw) {
        const existing = JSON.parse(raw);
        if (Array.isArray(existing)) return existing.map(normalize);
      }
      return save(
        (defaults || DEFAULTS).map((shop, index) => ({
          ...shop,
          id: shop.id || `default-${index + 1}`,
          city: shop.city || "Semarang",
          province: shop.province || "Jawa Tengah",
          address: shop.address || "",
          mapsUrl: shop.mapsUrl || "",
          createdAt: shop.createdAt || Date.now(),
        })),
      );
    } catch (error) {
      return [];
    }
  }

  function upsert(shop) {
    const shops = read();
    const item = normalize({ ...shop, id: shop.id || makeId() }, shops.length);
    const index = shops.findIndex((entry) => entry.id === item.id);
    if (index < 0) shops.unshift(item);
    else shops[index] = item;
    return save(shops);
  }

  function remove(id) {
    return save(read().filter((shop) => shop.id !== id));
  }

  root.RC_MERCHANT_DEFAULTS = DEFAULTS;
  root.RCMerchantStore = {
    key: KEY,
    defaults: DEFAULTS,
    initialize,
    read,
    save,
    upsert,
    remove,
    normalize,
    makeId,
  };
})(window);
