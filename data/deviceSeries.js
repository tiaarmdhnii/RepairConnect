// Katalog seri perangkat (Laptop, Smartphone, Tablet). tier: dipakai untuk tabel harga
const DEVICE_SERIES = (() => {
  const T =
    (tier) =>
    (...names) =>
      names.map((name) => ({ name, tier }));
  const E = T("entry"),
    M = T("mid"),
    G = T("gaming_flagship"),
    X = T("macbook");
  return {
    Laptop: {
      ASUS: [
        ...E(
          "Vivobook Go 14 / 15",
          "Vivobook 14 / 15 (A/X Series)",
          "Chromebook Series",
        ),
        ...M(
          "Vivobook S 14 / 15 / 16 OLED",
          "Vivobook Pro / 14X / 16X OLED",
          "Zenbook 14 / S 14 / S 16 OLED",
          "Zenbook Duo (Dual Screen)",
          "ExpertBook B1 / B5 / P Series",
        ),
        ...G(
          "TUF Gaming F15 / A15 / F16 / A16",
          "ROG Strix G15 / G16 / G18 / Scar",
          "ROG Zephyrus G14 / G16 / M16",
          "ROG Flow X13 / Z13",
        ),
      ],
      Lenovo: [
        ...E("IdeaPad Slim 1 / Slim 3", "IdeaPad 1 / 3 (Non-Slim)"),
        ...M(
          "IdeaPad Slim 5 / Flex 5",
          "Yoga Slim 6 / 7 / 9i",
          "ThinkBook 14 / 16",
          "ThinkPad E14 / E16 / L14",
        ),
        ...G(
          "ThinkPad X1 Carbon / T14 / P Series",
          "LOQ 15 / 16",
          "IdeaPad Gaming 3",
          "Legion 5 / Slim 5 / Pro 5",
          "Legion 7 / 9",
        ),
      ],
      Acer: [
        ...E(
          "Aspire Go 14 / 15",
          "Aspire 3 / 5 / Lite",
          "Extensa Series",
          "Chromebook Spin / Plus",
        ),
        ...M("Swift Go 14 / 16", "Swift X / Edge", "TravelMate Series"),
        ...G(
          "Nitro V 15 / 16",
          "Nitro 5 / 17",
          "Predator Helios Neo / 300 / 16",
          "Predator Triton 14 / 16 / 17",
        ),
      ],
      HP: [
        ...E("HP 14 / 15 / 245 / 250 Series"),
        ...M(
          "Pavilion 14 / 15 / Plus",
          "Pavilion Aero 13",
          "Envy x360 / Envy 14 / 16",
          "OmniBook 3 / 5 / 7 / X",
          "ProBook / EliteBook",
        ),
        ...G(
          "Spectre x360 14 / 16",
          "Victus 15 / 16",
          "OMEN 15 / 16 / 17 / Transcend",
        ),
      ],
      Dell: [
        ...E("Inspiron 14 / 15 / 16", "Vostro 14 / 15 / 16"),
        ...M("Latitude 3000 / 5000 / 7000", "Dell 14 / 15 / 16 / Plus"),
        ...G(
          "XPS 13 / 14 / 15 / 16",
          "G Series (G15 / G16)",
          "Alienware m15 / m16 / x14 / x16",
        ),
      ],
      MSI: [
        ...E("Modern 14 / 15", "Thin 15 / GF63 Thin"),
        ...M("Prestige 13 / 14 / 16", "Summit Series"),
        ...G(
          "Cyborg 14 / 15",
          "Katana 15 / 17 / GF66",
          "Pulse 15 / 17",
          "Sword / Crosshair",
          "Stealth / Raider / Vector",
          "Titan / Creator Series",
        ),
      ],
      Apple: [
        ...X(
          'MacBook Air 13" M1 (2020)',
          'MacBook Air 13" M2 (2022)',
          'MacBook Air 13" / 15" M3 (2024)',
          'MacBook Air 13" / 15" M4 (2025)',
          'MacBook Pro 13" M1 / M2',
          'MacBook Pro 14" M1 / M2 / M3 / M4',
          'MacBook Pro 16" M1 / M2 / M3 / M4',
          "MacBook Intel (2015-2020)",
        ),
      ],
      "Samsung (Galaxy Book)": [
        ...M(
          "Galaxy Book 2 / 3 / 4",
          "Galaxy Book Pro / Pro 360",
          "Galaxy Book5 / Book5 Pro",
        ),
      ],
      "Microsoft Surface": [
        ...G(
          "Surface Laptop 3 / 4 / 5 / 6 / 7",
          "Surface Pro 7 / 8 / 9 / 10 / 11",
          "Surface Go",
          "Surface Book",
        ),
      ],
      Huawei: [
        ...M(
          "MateBook D 14 / D 16",
          "MateBook 14 / 14s / 16",
          "MateBook X Pro",
        ),
      ],
      Axioo: [
        ...E(
          "MyBook 14 / 15 / 14E",
          "Hype 1 / 5 / 7 / R",
          "Pongo Gaming Series",
        ),
      ],
      Advan: [...E("Workplus", "Soulmate", "Advan 360 / X Series")],
      Zyrex: [...E("Zyrex Sky", "Zyrex Maveric", "Zyrex Cloudbook")],
      "Merk Lainnya": [...E("Seri Umum / Lainnya")],
    },

    Smartphone: {
      Samsung: [
        ...E(
          "Galaxy A0x (A04 / A05 / A06 / A07)",
          "Galaxy A1x (A14 / A15 / A16 / A17)",
          "Galaxy M Series",
          "Galaxy F Series",
        ),
        ...M(
          "Galaxy A2x (A24 / A25 / A26)",
          "Galaxy A3x (A34 / A35 / A36 / A37)",
          "Galaxy A5x (A54 / A55 / A56 / A57)",
          "Galaxy S20 / S21 / S22 (Series)",
          "Galaxy S23 / S24 / S25 / FE",
        ),
        ...G(
          "Galaxy S Ultra (S22 / S23 / S24 / S25 Ultra)",
          "Galaxy S25 Edge / S26 Series",
          "Galaxy Z Flip 3 / 4 / 5 / 6 / 7",
          "Galaxy Z Fold 3 / 4 / 5 / 6 / 7",
          "Galaxy Note Series (Legacy)",
        ),
      ],
      "Apple (iPhone)": [
        ...M(
          "iPhone 8 / 8 Plus / SE",
          "iPhone X / XS / XS Max / XR",
          "iPhone 11 / 11 Pro / 11 Pro Max",
          "iPhone 12 / 12 mini / 12 Pro / 12 Pro Max",
          "iPhone 13 / 13 mini / 13 Pro / 13 Pro Max",
        ),
        ...G(
          "iPhone 14 / 14 Plus / 14 Pro / 14 Pro Max",
          "iPhone 15 / 15 Plus / 15 Pro / 15 Pro Max",
          "iPhone 16e",
          "iPhone 16 / 16 Plus / 16 Pro / 16 Pro Max",
          "iPhone 17 / 17 Air / 17 Pro / 17 Pro Max",
        ),
      ],
      "Xiaomi / Redmi / POCO": [
        ...E(
          "Redmi A Series (A3 / A5)",
          "Redmi 12 / 13 / 13C / 14C / 15",
          "POCO C Series",
          "POCO M Series",
        ),
        ...M(
          "Redmi Note 11 / 12 / 13 / 14 / 15",
          "Redmi Note Pro / Pro+",
          "POCO X Series (X5 / X6 / X7)",
          "Xiaomi 11T / 12T / 13T / 14T / 15T",
        ),
        ...G(
          "POCO F Series (F5 / F6 / F7)",
          "Xiaomi 12 / 13 / 14 / 15",
          "Xiaomi Ultra Series",
          "Xiaomi Mix Flip / Fold",
        ),
      ],
      OPPO: [
        ...E("OPPO A Series (A18 / A38 / A58 / A78 / A5 / A6)"),
        ...M("OPPO Reno 8 / 10 / 11 / 12 / 13 / 14", "OPPO Reno Pro / Pro+"),
        ...G("OPPO Find X Series", "OPPO Find N / Flip Series"),
      ],
      Vivo: [
        ...E("Vivo Y Series (Y17s / Y28 / Y29 / Y400)", "Vivo T Series"),
        ...M("Vivo V Series (V27 - V60)"),
        ...G("Vivo X Series (X80 - X200 / Pro)", "Vivo X Fold / Flip"),
      ],
      realme: [
        ...E(
          "realme C Series (C53 / C55 / C67 / C75)",
          "realme Narzo Series",
          "realme Note Series",
        ),
        ...M("realme Number Series (11 / 12 / 13 / 14 Pro)", "realme P Series"),
        ...G("realme GT Series"),
      ],
      Infinix: [
        ...E("Infinix Smart Series", "Infinix Hot Series"),
        ...M("Infinix Note Series", "Infinix Zero Series"),
        ...G("Infinix GT Series"),
      ],
      Tecno: [
        ...E("Tecno Spark Series", "Tecno Pop Series"),
        ...M("Tecno Camon Series", "Tecno Pova Series", "Tecno Phantom Series"),
      ],
      iQOO: [
        ...M("iQOO Z Series", "iQOO Neo Series"),
        ...G("iQOO 11 / 12 / 13 / 15 Series"),
      ],
      Huawei: [
        ...M("Huawei nova Series", "Huawei Y Series"),
        ...G("Huawei Pura Series", "Huawei Mate Series"),
      ],
      Honor: [
        ...E("Honor X5 / X6 / X7"),
        ...M("Honor X8 / X9 / X9 Pro", "Honor 200 / 400 Series"),
        ...G("Honor Magic Series"),
      ],
      "Google Pixel": [
        ...M(
          "Pixel 6 / 6a / 6 Pro",
          "Pixel 7 / 7a / 7 Pro",
          "Pixel 8 / 8a / 8 Pro",
        ),
        ...G("Pixel 9 / 9 Pro / 9 Pro Fold", "Pixel 10 Series"),
      ],
      Motorola: [
        ...E("Moto E Series", "Moto G Series"),
        ...M("Edge Series", "Razr Series"),
      ],
      Nothing: [
        ...M("Nothing Phone (1) / (2) / (2a) / (3a)", "CMF Phone 1 / 2"),
      ],
      "ASUS (ROG / Zenfone)": [
        ...G("ROG Phone Series"),
        ...M("Zenfone Series"),
      ],
      Sony: [
        ...G("Xperia 1 Series", "Xperia 5 Series"),
        ...M("Xperia 10 Series"),
      ],
      itel: [...E("itel A Series", "itel P Series", "itel S Series")],
      Advan: [...E("Advan G / GX Series", "Advan Nasa / Vane")],
      "Merk Lainnya": [...E("Seri Umum / Lainnya")],
    },

    Tablet: {
      "Apple (iPad)": [
        ...M("iPad 9 / 10 / A16 (Standard)", "iPad mini 5 / 6 / 7"),
        ...G("iPad Air (M1 / M2 / M3)", 'iPad Pro 11" / 12.9" / 13" (M1 - M5)'),
      ],
      Samsung: [
        ...E("Galaxy Tab A Series"),
        ...M("Galaxy Tab S6 Lite / S9 FE / S10 FE"),
        ...G("Galaxy Tab S8 / S9 / S10 / S11 (+ / Ultra)", "Galaxy Tab Active"),
      ],
      Xiaomi: [
        ...E("Redmi Pad / Pad SE / Pad Pro"),
        ...M("Xiaomi Pad 5 / 6 / 7 / Pro"),
      ],
      Huawei: [...M("MatePad SE / 11.5 / T10", "MatePad Pro / Air")],
      Lenovo: [
        ...E("Lenovo Tab M Series"),
        ...M("Lenovo Tab P Series / Tab Plus"),
      ],
      OPPO: [...M("OPPO Pad Series / Neo / Air")],
      realme: [...E("realme Pad / Pad Mini / Pad 2")],
      "Advan / Lainnya": [...E("Advan Tab / Sketsa", "Tablet Merk Lainnya")],
    },
  };
})();
