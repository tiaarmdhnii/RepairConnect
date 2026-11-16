const MODEL_MANUAL = "__manual__";

const DEVICE_MODELS = {
  "Laptop|ASUS|ROG Zephyrus G14 / G16 / M16": [
    { name: "ROG Zephyrus G14 GA401", code: "GA401" },
    { name: "ROG Zephyrus G14 GA402", code: "GA402" },
    { name: "ROG Zephyrus G14 GA403", code: "GA403" },
    { name: "ROG Zephyrus G16 GU603", code: "GU603" },
    { name: "ROG Zephyrus G16 GU605", code: "GU605" },
  ],
  "Laptop|ASUS|Vivobook 14 / 15 (A/X Series)": [
    { name: "Vivobook 14 A416", code: "A416" },
    { name: "Vivobook 14 X415", code: "X415" },
    { name: "Vivobook 15 A516", code: "A516" },
    { name: "Vivobook 15 X515", code: "X515" },
  ],
  'Laptop|Apple|MacBook Air 13" M1 (2020)': [
    { name: 'MacBook Air 13" M1 (2020)', code: "A2337" },
  ],
  'Laptop|Apple|MacBook Air 13" M2 (2022)': [
    { name: 'MacBook Air 13" M2 (2022)', code: "A2681" },
  ],
  'Laptop|Apple|MacBook Air 13" / 15" M3 (2024)': [
    { name: 'MacBook Air 13" M3 (2024)', code: "A3113" },
    { name: 'MacBook Air 15" M3 (2024)', code: "A3114" },
  ],
  "Smartphone|Samsung|Galaxy S Ultra (S22 / S23 / S24 / S25 Ultra)": [
    { name: "Galaxy S22 Ultra", code: "SM-S908" },
    { name: "Galaxy S23 Ultra", code: "SM-S918" },
    { name: "Galaxy S24 Ultra", code: "SM-S928" },
    { name: "Galaxy S25 Ultra", code: "SM-S938" },
  ],
  "Smartphone|Apple (iPhone)|iPhone 15 / 15 Plus / 15 Pro / 15 Pro Max": [
    { name: "iPhone 15" },
    { name: "iPhone 15 Plus" },
    { name: "iPhone 15 Pro" },
    { name: "iPhone 15 Pro Max" },
  ],
  "Smartphone|Apple (iPhone)|iPhone 14 / 14 Plus / 14 Pro / 14 Pro Max": [
    { name: "iPhone 14" },
    { name: "iPhone 14 Plus" },
    { name: "iPhone 14 Pro" },
    { name: "iPhone 14 Pro Max" },
  ],
  "Smartphone|Xiaomi / Redmi / POCO|Redmi Note 11 / 12 / 13 / 14 / 15": [
    { name: "Redmi Note 13 (4G)", variants: ["4G"] },
    { name: "Redmi Note 13 (5G)", variants: ["5G"] },
    { name: "Redmi Note 14 (4G)", variants: ["4G"] },
    { name: "Redmi Note 14 (5G)", variants: ["5G"] },
  ],
  "Tablet|Apple (iPad)|iPad mini 5 / 6 / 7": [
    { name: "iPad mini 5" },
    { name: "iPad mini 6" },
    { name: "iPad mini 7" },
  ],
};

// ===== Tambahan model HP (nama model tanpa kode; tambahkan code bila sudah diverifikasi) =====
const L = (...names) => names.map((name) => ({ name }));
Object.assign(DEVICE_MODELS, {
  "Smartphone|Samsung|Galaxy A0x (A04 / A05 / A06 / A07)": L(
    "Galaxy A04",
    "Galaxy A04s",
    "Galaxy A05",
    "Galaxy A05s",
    "Galaxy A06",
    "Galaxy A07",
  ),
  "Smartphone|Samsung|Galaxy A1x (A14 / A15 / A16 / A17)": L(
    "Galaxy A14 (4G)",
    "Galaxy A14 (5G)",
    "Galaxy A15 (4G)",
    "Galaxy A15 (5G)",
    "Galaxy A16 (4G)",
    "Galaxy A16 (5G)",
    "Galaxy A17",
  ),
  "Smartphone|Samsung|Galaxy A2x (A24 / A25 / A26)": L(
    "Galaxy A24",
    "Galaxy A25 (5G)",
    "Galaxy A26 (5G)",
  ),
  "Smartphone|Samsung|Galaxy A3x (A34 / A35 / A36 / A37)": L(
    "Galaxy A34 (5G)",
    "Galaxy A35 (5G)",
    "Galaxy A36 (5G)",
  ),
  "Smartphone|Samsung|Galaxy A5x (A54 / A55 / A56 / A57)": L(
    "Galaxy A54 (5G)",
    "Galaxy A55 (5G)",
    "Galaxy A56 (5G)",
  ),
  "Smartphone|Samsung|Galaxy S20 / S21 / S22 (Series)": L(
    "Galaxy S20",
    "Galaxy S20+",
    "Galaxy S20 FE",
    "Galaxy S21",
    "Galaxy S21+",
    "Galaxy S21 FE",
    "Galaxy S22",
    "Galaxy S22+",
  ),
  "Smartphone|Samsung|Galaxy S23 / S24 / S25 / FE": L(
    "Galaxy S23",
    "Galaxy S23+",
    "Galaxy S23 FE",
    "Galaxy S24",
    "Galaxy S24+",
    "Galaxy S24 FE",
    "Galaxy S25",
    "Galaxy S25+",
    "Galaxy S25 FE",
  ),
  "Smartphone|Samsung|Galaxy Z Flip 3 / 4 / 5 / 6 / 7": L(
    "Galaxy Z Flip3",
    "Galaxy Z Flip4",
    "Galaxy Z Flip5",
    "Galaxy Z Flip6",
    "Galaxy Z Flip7",
  ),
  "Smartphone|Samsung|Galaxy Z Fold 3 / 4 / 5 / 6 / 7": L(
    "Galaxy Z Fold3",
    "Galaxy Z Fold4",
    "Galaxy Z Fold5",
    "Galaxy Z Fold6",
    "Galaxy Z Fold7",
  ),
  "Smartphone|Apple (iPhone)|iPhone 8 / 8 Plus / SE": L(
    "iPhone 8",
    "iPhone 8 Plus",
    "iPhone SE (2020)",
    "iPhone SE (2022)",
  ),
  "Smartphone|Apple (iPhone)|iPhone X / XS / XS Max / XR": L(
    "iPhone X",
    "iPhone XS",
    "iPhone XS Max",
    "iPhone XR",
  ),
  "Smartphone|Apple (iPhone)|iPhone 11 / 11 Pro / 11 Pro Max": L(
    "iPhone 11",
    "iPhone 11 Pro",
    "iPhone 11 Pro Max",
  ),
  "Smartphone|Apple (iPhone)|iPhone 12 / 12 mini / 12 Pro / 12 Pro Max": L(
    "iPhone 12",
    "iPhone 12 mini",
    "iPhone 12 Pro",
    "iPhone 12 Pro Max",
  ),
  "Smartphone|Apple (iPhone)|iPhone 13 / 13 mini / 13 Pro / 13 Pro Max": L(
    "iPhone 13",
    "iPhone 13 mini",
    "iPhone 13 Pro",
    "iPhone 13 Pro Max",
  ),
  "Smartphone|Apple (iPhone)|iPhone 16e": L("iPhone 16e"),
  "Smartphone|Apple (iPhone)|iPhone 16 / 16 Plus / 16 Pro / 16 Pro Max": L(
    "iPhone 16",
    "iPhone 16 Plus",
    "iPhone 16 Pro",
    "iPhone 16 Pro Max",
  ),
  "Smartphone|Apple (iPhone)|iPhone 17 / 17 Air / 17 Pro / 17 Pro Max": L(
    "iPhone 17",
    "iPhone Air",
    "iPhone 17 Pro",
    "iPhone 17 Pro Max",
  ),
  "Smartphone|Xiaomi / Redmi / POCO|Redmi A Series (A3 / A5)": L(
    "Redmi A3",
    "Redmi A5",
  ),
  "Smartphone|Xiaomi / Redmi / POCO|Redmi 12 / 13 / 13C / 14C / 15": L(
    "Redmi 12",
    "Redmi 13",
    "Redmi 13C",
    "Redmi 14C",
    "Redmi 15",
  ),
  "Smartphone|Xiaomi / Redmi / POCO|POCO X Series (X5 / X6 / X7)": L(
    "POCO X5 5G",
    "POCO X5 Pro 5G",
    "POCO X6",
    "POCO X6 Pro",
    "POCO X7",
    "POCO X7 Pro",
  ),
  "Smartphone|Xiaomi / Redmi / POCO|POCO F Series (F5 / F6 / F7)": L(
    "POCO F5",
    "POCO F5 Pro",
    "POCO F6",
    "POCO F6 Pro",
    "POCO F7",
  ),
  "Smartphone|OPPO|OPPO Reno 8 / 10 / 11 / 12 / 13 / 14": L(
    "Reno8",
    "Reno8 T",
    "Reno10",
    "Reno10 Pro",
    "Reno11",
    "Reno11 F",
    "Reno12",
    "Reno12 F",
    "Reno13",
    "Reno13 F",
    "Reno14",
  ),
  "Smartphone|Vivo|Vivo V Series (V27 - V60)": L(
    "Vivo V27",
    "Vivo V29",
    "Vivo V30",
    "Vivo V40",
    "Vivo V50",
    "Vivo V60",
  ),
  "Smartphone|realme|realme Number Series (11 / 12 / 13 / 14 Pro)": L(
    "realme 11",
    "realme 11 Pro",
    "realme 12",
    "realme 12 Pro",
    "realme 13",
    "realme 13 Pro",
    "realme 14 Pro",
  ),
});

// ===== Pelengkap semua seri (dipasang sesudah deviceSeries.js) =====
// A(jenis, merek, "potongan nama seri", [model...]) — hanya mengisi seri yang belum punya daftar.
function A(type, brand, needle, names) {
  const s = (DEVICE_SERIES[type]?.[brand] || []).find((x) =>
    x.name.includes(needle),
  );
  if (!s) return console.warn("Seri tidak ditemukan:", type, brand, needle);
  const key = `${type}|${brand}|${s.name}`;
  if (!DEVICE_MODELS[key]) DEVICE_MODELS[key] = L(...names);
}
const LP = "Laptop",
  HP_ = "Smartphone",
  TB = "Tablet";

// ---- LAPTOP ----
A(LP, "ASUS", "Go 14", ["Vivobook Go 14 E1404", "Vivobook Go 15 E1504"]);
A(LP, "ASUS", "Chromebook", [
  "Chromebook CX1400",
  "Chromebook CX1500",
  "Chromebook Flip CX3401",
]);
A(LP, "ASUS", "Vivobook S 14", [
  "Vivobook S 14 OLED S5406",
  "Vivobook S 14 S3407",
  "Vivobook S 15 OLED S5507",
  "Vivobook S 16 OLED S5606",
]);
A(LP, "ASUS", "Vivobook Pro", [
  "Vivobook Pro 15 OLED K6502",
  "Vivobook Pro 16X OLED N7600",
  "Vivobook 14X OLED K3405",
  "Vivobook 16X K3605",
]);
A(LP, "ASUS", "Zenbook 14", [
  "Zenbook 14 OLED UX3405",
  "Zenbook 14 OLED UX3402",
  "Zenbook S 14 UX5406",
  "Zenbook S 16 UM5606",
  "Zenbook S 13 OLED UX5304",
]);
A(LP, "ASUS", "Zenbook Duo", [
  "Zenbook Duo UX8406",
  "Zenbook Duo UX482",
  "Zenbook Duo UP5401",
]);
A(LP, "ASUS", "ExpertBook", [
  "ExpertBook B1 B1402",
  "ExpertBook B1 B1502",
  "ExpertBook B5 B5404",
  "ExpertBook P1403",
  "ExpertBook P1503",
]);
A(LP, "ASUS", "TUF", [
  "TUF Gaming F15 FX506",
  "TUF Gaming F15 FX507",
  "TUF Gaming A15 FA506",
  "TUF Gaming A15 FA507",
  "TUF Gaming F16 FX607",
  "TUF Gaming A16 FA617",
]);
A(LP, "ASUS", "Strix", [
  "ROG Strix G15 G513",
  "ROG Strix G16 G614",
  "ROG Strix G18 G814",
  "ROG Strix Scar 15 G533",
  "ROG Strix Scar 17 G733",
  "ROG Strix Scar 16 G634",
  "ROG Strix Scar 18 G834",
]);
A(LP, "ASUS", "Flow", [
  "ROG Flow X13 GV301",
  "ROG Flow X13 GV302",
  "ROG Flow Z13 GZ301",
]);
A(LP, "Lenovo", "Slim 1", [
  "IdeaPad Slim 1 14AMN7",
  "IdeaPad Slim 1 15AMN7",
  "IdeaPad Slim 3 14IAH8",
  "IdeaPad Slim 3 15IAH8",
  "IdeaPad Slim 3 14ABR8",
  "IdeaPad Slim 3 15AMN8",
]);
A(LP, "Lenovo", "1 / 3 (Non", [
  "IdeaPad 1 15ALC7",
  "IdeaPad 1 15IJL7",
  "IdeaPad 3 14ITL6",
  "IdeaPad 3 15ITL6",
  "IdeaPad 3 15ALC6",
]);
A(LP, "Lenovo", "Slim 5", [
  "IdeaPad Slim 5 14IAH8",
  "IdeaPad Slim 5 16IRL8",
  "IdeaPad Slim 5 14ABR8",
  "IdeaPad Flex 5 14ALC7",
  "IdeaPad Flex 5 14IAU7",
]);
A(LP, "Lenovo", "Yoga", [
  "Yoga Slim 6 14",
  "Yoga Slim 7 14",
  "Yoga Slim 7i Pro",
  "Yoga 9i 14",
]);
A(LP, "Lenovo", "ThinkBook", [
  "ThinkBook 14 G4",
  "ThinkBook 14 G6",
  "ThinkBook 14 G7",
  "ThinkBook 16 G6",
  "ThinkBook 16 G7",
]);
A(LP, "Lenovo", "E14", [
  "ThinkPad E14 Gen 5",
  "ThinkPad E14 Gen 6",
  "ThinkPad E16 Gen 1",
  "ThinkPad L14 Gen 4",
]);
A(LP, "Lenovo", "X1 Carbon", [
  "ThinkPad X1 Carbon Gen 11",
  "ThinkPad X1 Carbon Gen 12",
  "ThinkPad T14 Gen 4",
  "ThinkPad T14 Gen 5",
  "ThinkPad P14s Gen 4",
  "ThinkPad P16 Gen 2",
]);
A(LP, "Lenovo", "LOQ", [
  "LOQ 15 (Intel)",
  "LOQ 15 (AMD)",
  "LOQ 16 (Intel)",
  "LOQ 16 (AMD)",
]);
A(LP, "Lenovo", "Gaming 3", [
  "IdeaPad Gaming 3 15ARH7",
  "IdeaPad Gaming 3 15IHU6",
  "IdeaPad Gaming 3 16ARH7",
]);
A(LP, "Lenovo", "Legion 5", [
  "Legion 5 15IAH7",
  "Legion 5 15ARH7",
  "Legion 5 Pro 16",
  "Legion Slim 5 16",
  "Legion Slim 5 14",
]);
A(LP, "Lenovo", "Legion 7", ["Legion 7 16", "Legion 7i 16", "Legion 9i 16"]);
A(LP, "Acer", "Aspire Go", [
  "Aspire Go 14 AG14-31P",
  "Aspire Go 15 AG15-31P",
  "Aspire Go 15 AG15-71P",
]);
A(LP, "Acer", "Aspire 3", [
  "Aspire 3 A314-36",
  "Aspire 3 A315-58",
  "Aspire 3 A315-59",
  "Aspire 5 A515-57",
  "Aspire 5 A514-56",
  "Aspire Lite AL15-52",
]);
A(LP, "Acer", "Extensa", ["Extensa 15 EX215-54", "Extensa 15 EX215-53"]);
A(LP, "Acer", "Chromebook", [
  "Chromebook Spin 311",
  "Chromebook Spin 514",
  "Chromebook Plus 515",
]);
A(LP, "Acer", "Swift Go", [
  "Swift Go 14 SFG14-71",
  "Swift Go 14 SFG14-72",
  "Swift Go 16 SFG16-71",
]);
A(LP, "Acer", "Swift X", [
  "Swift X 14 SFX14-71G",
  "Swift X 16 SFX16-61G",
  "Swift Edge 16",
]);
A(LP, "Acer", "TravelMate", [
  "TravelMate P2",
  "TravelMate P4",
  "TravelMate Spin P4",
]);
A(LP, "Acer", "Nitro V", [
  "Nitro V 15 ANV15-41",
  "Nitro V 15 ANV15-51",
  "Nitro V 16 ANV16-41",
  "Nitro V 16 ANV16-71",
]);
A(LP, "Acer", "Nitro 5", [
  "Nitro 5 AN515-57",
  "Nitro 5 AN515-58",
  "Nitro 5 AN517-54",
]);
A(LP, "Acer", "Helios", [
  "Predator Helios Neo 16",
  "Predator Helios 300 PH315-54",
  "Predator Helios 16 PH16-71",
]);
A(LP, "Acer", "Triton", [
  "Predator Triton 14",
  "Predator Triton 16",
  "Predator Triton 17 X",
]);
A(LP, "HP", "HP 14", [
  "HP 14s-dq",
  "HP 14-ep",
  "HP 15s-fq",
  "HP 15-fd",
  "HP 245 G9",
  "HP 250 G9",
  "HP 250 G10",
]);
A(LP, "HP", "Pavilion 14", [
  "Pavilion 14-dv",
  "Pavilion 14-ek",
  "Pavilion 15-eg",
  "Pavilion Plus 14",
  "Pavilion Plus 16",
]);
A(LP, "HP", "Aero", ["Pavilion Aero 13-be", "Pavilion Aero 13-bg"]);
A(LP, "HP", "Envy", [
  "Envy x360 13",
  "Envy x360 14",
  "Envy x360 15",
  "Envy 14",
  "Envy 16",
]);
A(LP, "HP", "OmniBook", [
  "OmniBook 3",
  "OmniBook 5",
  "OmniBook 7",
  "OmniBook X",
]);
A(LP, "HP", "ProBook", [
  "ProBook 440 G10",
  "ProBook 450 G10",
  "EliteBook 840 G10",
  "EliteBook 860 G10",
]);
A(LP, "HP", "Spectre", ["Spectre x360 14", "Spectre x360 16"]);
A(LP, "HP", "Victus", [
  "Victus 15-fa",
  "Victus 15-fb",
  "Victus 16-d",
  "Victus 16-r",
  "Victus 16-s",
]);
A(LP, "HP", "OMEN", [
  "OMEN 15",
  "OMEN 16",
  "OMEN 17",
  "OMEN Transcend 14",
  "OMEN Transcend 16",
]);
A(LP, "Dell", "Inspiron", [
  "Inspiron 14 5430",
  "Inspiron 14 5440",
  "Inspiron 15 3520",
  "Inspiron 15 3530",
  "Inspiron 16 5630",
]);
A(LP, "Dell", "Vostro", [
  "Vostro 14 3440",
  "Vostro 15 3520",
  "Vostro 15 3530",
  "Vostro 16 5630",
]);
A(LP, "Dell", "Latitude", [
  "Latitude 3440",
  "Latitude 3540",
  "Latitude 5440",
  "Latitude 7440",
]);
A(LP, "Dell", "Dell 14", [
  "Dell 14",
  "Dell 14 Plus",
  "Dell 15",
  "Dell 16",
  "Dell 16 Plus",
]);
A(LP, "Dell", "XPS", [
  "XPS 13 9315",
  "XPS 13 9340",
  "XPS 14 9440",
  "XPS 15 9530",
  "XPS 16 9640",
]);
A(LP, "Dell", "G Series", ["G15 5520", "G15 5530", "G16 7630"]);
A(LP, "Dell", "Alienware", [
  "Alienware m15 R7",
  "Alienware m16 R2",
  "Alienware x14 R2",
  "Alienware x16 R2",
]);
A(LP, "MSI", "Modern", [
  "Modern 14 C7M",
  "Modern 14 C13M",
  "Modern 15 B7M",
  "Modern 15 H",
]);
A(LP, "MSI", "Thin 15", ["Thin 15 B12U", "Thin GF63 12UC", "Thin GF63 12VE"]);
A(LP, "MSI", "Summit", ["Summit E13", "Summit E14", "Summit E16"]);
A(LP, "MSI", "Prestige", [
  "Prestige 13 Evo",
  "Prestige 14 Evo",
  "Prestige 16 Evo",
  "Prestige 16 AI Evo",
]);
A(LP, "MSI", "Cyborg", ["Cyborg 14 A13V", "Cyborg 15 A12V", "Cyborg 15 A13V"]);
A(LP, "MSI", "Katana", [
  "Katana 15 B13V",
  "Katana 17 B13V",
  "Katana GF66 11UC",
]);
A(LP, "MSI", "Pulse", ["Pulse 15 B13V", "Pulse 17 B13V"]);
A(LP, "MSI", "Sword", [
  "Sword 15 A12UC",
  "Sword 16 HX",
  "Crosshair 15",
  "Crosshair 17 HX",
]);
A(LP, "MSI", "Stealth", [
  "Stealth 14 Studio",
  "Stealth 16 Studio",
  "Raider GE68 HX",
  "Raider GE78 HX",
  "Vector GP68 HX",
]);
A(LP, "MSI", "Titan", [
  "Titan 18 HX",
  "Titan GT77 HX",
  "Creator Z17",
  "Creator M16",
]);
A(LP, "Apple", 'Pro 13"', [
  'MacBook Pro 13" M1 (2020)',
  'MacBook Pro 13" M2 (2022)',
]);
A(LP, "Apple", "M4 (2025)", [
  'MacBook Air 13" M4 (2025)',
  'MacBook Air 15" M4 (2025)',
]);
A(LP, "Apple", 'Pro 14"', [
  'MacBook Pro 14" M1 Pro/Max (2021)',
  'MacBook Pro 14" M2 Pro/Max (2023)',
  'MacBook Pro 14" M3 / Pro / Max (2023)',
  'MacBook Pro 14" M4 / Pro / Max (2024)',
]);
A(LP, "Apple", 'Pro 16"', [
  'MacBook Pro 16" M1 Pro/Max (2021)',
  'MacBook Pro 16" M2 Pro/Max (2023)',
  'MacBook Pro 16" M3 Pro/Max (2023)',
  'MacBook Pro 16" M4 Pro/Max (2024)',
]);
A(LP, "Apple", "Intel", [
  "MacBook Air Intel (2018-2020)",
  'MacBook Pro 13" Intel (2016-2020)',
  'MacBook Pro 15" Intel (2016-2019)',
  'MacBook Pro 16" Intel (2019)',
  'MacBook 12" (2015-2017)',
]);
A(LP, "Samsung (Galaxy Book)", "2 / 3 / 4", [
  "Galaxy Book2",
  "Galaxy Book3",
  "Galaxy Book4",
]);
A(LP, "Samsung (Galaxy Book)", "Pro / Pro 360", [
  "Galaxy Book Pro",
  "Galaxy Book Pro 360",
  "Galaxy Book2 Pro",
  "Galaxy Book2 Pro 360",
  "Galaxy Book3 Pro",
  "Galaxy Book3 Pro 360",
  "Galaxy Book4 Pro",
  "Galaxy Book4 Pro 360",
]);
A(LP, "Samsung (Galaxy Book)", "Book5", [
  "Galaxy Book5 360",
  "Galaxy Book5 Pro",
  "Galaxy Book5 Pro 360",
]);
A(LP, "Microsoft Surface", "Surface Laptop", [
  "Surface Laptop 3",
  "Surface Laptop 4",
  "Surface Laptop 5",
  "Surface Laptop 6",
  "Surface Laptop 7",
]);
A(LP, "Microsoft Surface", "Surface Pro", [
  "Surface Pro 7",
  "Surface Pro 8",
  "Surface Pro 9",
  "Surface Pro 10",
  "Surface Pro 11",
]);
A(LP, "Microsoft Surface", "Surface Go", [
  "Surface Go 2",
  "Surface Go 3",
  "Surface Go 4",
]);
A(LP, "Microsoft Surface", "Surface Book", [
  "Surface Book 2",
  "Surface Book 3",
]);
A(LP, "Huawei", "MateBook D", ["MateBook D 14", "MateBook D 16"]);
A(LP, "Huawei", "14s", [
  "MateBook 14",
  "MateBook 14s",
  "MateBook 16",
  "MateBook 16s",
]);
A(LP, "Huawei", "X Pro", ["MateBook X Pro"]);
A(LP, "Axioo", "MyBook", [
  "Axioo MyBook 14",
  "Axioo MyBook 14E",
  "Axioo MyBook 15",
]);
A(LP, "Axioo", "Hype", [
  "Axioo Hype 1",
  "Axioo Hype 5",
  "Axioo Hype 7",
  "Axioo Hype R",
]);
A(LP, "Advan", "Workplus", ["Advan Workplus"]);
A(LP, "Advan", "Soulmate", ["Advan Soulmate"]);

// ---- SMARTPHONE ----
A(HP_, "Samsung", "Galaxy M", [
  "Galaxy M14",
  "Galaxy M15",
  "Galaxy M34",
  "Galaxy M35",
  "Galaxy M55",
]);
A(HP_, "Samsung", "Galaxy F", [
  "Galaxy F14",
  "Galaxy F15",
  "Galaxy F34",
  "Galaxy F54",
  "Galaxy F55",
]);
A(HP_, "Samsung", "S25 Edge", [
  "Galaxy S25 Edge",
  "Galaxy S26",
  "Galaxy S26+",
  "Galaxy S26 Ultra",
]);
A(HP_, "Samsung", "Note", [
  "Galaxy Note 9",
  "Galaxy Note 10",
  "Galaxy Note 10+",
  "Galaxy Note 20",
  "Galaxy Note 20 Ultra",
]);
A(HP_, "Xiaomi / Redmi / POCO", "Note Pro", [
  "Redmi Note 12 Pro",
  "Redmi Note 12 Pro+",
  "Redmi Note 13 Pro",
  "Redmi Note 13 Pro+",
  "Redmi Note 14 Pro",
  "Redmi Note 14 Pro+",
]);
A(HP_, "Xiaomi / Redmi / POCO", "POCO C", ["POCO C55", "POCO C65", "POCO C75"]);
A(HP_, "Xiaomi / Redmi / POCO", "POCO M", [
  "POCO M5",
  "POCO M6",
  "POCO M6 Pro",
  "POCO M7 Pro",
]);
A(HP_, "Xiaomi / Redmi / POCO", "11T", [
  "Xiaomi 11T",
  "Xiaomi 11T Pro",
  "Xiaomi 12T",
  "Xiaomi 12T Pro",
  "Xiaomi 13T",
  "Xiaomi 13T Pro",
  "Xiaomi 14T",
  "Xiaomi 14T Pro",
  "Xiaomi 15T",
  "Xiaomi 15T Pro",
]);
A(HP_, "Xiaomi / Redmi / POCO", "12 / 13 / 14 / 15", [
  "Xiaomi 12",
  "Xiaomi 13",
  "Xiaomi 14",
  "Xiaomi 15",
]);
A(HP_, "Xiaomi / Redmi / POCO", "Ultra", [
  "Xiaomi 12S Ultra",
  "Xiaomi 13 Ultra",
  "Xiaomi 14 Ultra",
  "Xiaomi 15 Ultra",
]);
A(HP_, "Xiaomi / Redmi / POCO", "Mix", [
  "Xiaomi Mix Flip",
  "Xiaomi Mix Fold 3",
  "Xiaomi Mix Fold 4",
]);
A(HP_, "OPPO", "A Series", [
  "OPPO A18",
  "OPPO A38",
  "OPPO A58",
  "OPPO A78",
  "OPPO A3",
  "OPPO A5",
  "OPPO A60",
  "OPPO A79",
]);
A(HP_, "OPPO", "Reno Pro", [
  "Reno8 Pro",
  "Reno10 Pro+",
  "Reno11 Pro",
  "Reno12 Pro",
  "Reno13 Pro",
  "Reno14 Pro",
]);
A(HP_, "OPPO", "Find X", [
  "Find X3 Pro",
  "Find X5 Pro",
  "Find X6 Pro",
  "Find X7 Ultra",
  "Find X8",
  "Find X8 Pro",
]);
A(HP_, "OPPO", "Find N", [
  "Find N2 Flip",
  "Find N3 Flip",
  "Find N3",
  "Find N5",
]);
A(HP_, "Vivo", "Y Series", [
  "Vivo Y17s",
  "Vivo Y18",
  "Vivo Y28",
  "Vivo Y29",
  "Vivo Y36",
  "Vivo Y100",
  "Vivo Y400",
]);
A(HP_, "Vivo", "T Series", ["Vivo T1 5G", "Vivo T2", "Vivo T3"]);
A(HP_, "Vivo", "X Series (", [
  "Vivo X80 Pro",
  "Vivo X90 Pro",
  "Vivo X100",
  "Vivo X100 Pro",
  "Vivo X200",
  "Vivo X200 Pro",
]);
A(HP_, "Vivo", "Fold", [
  "Vivo X Fold",
  "Vivo X Fold2",
  "Vivo X Fold3",
  "Vivo X Flip",
]);
A(HP_, "realme", "C Series", [
  "realme C53",
  "realme C55",
  "realme C63",
  "realme C65",
  "realme C67",
  "realme C75",
]);
A(HP_, "realme", "Narzo", [
  "realme Narzo 60",
  "realme Narzo 70",
  "realme Narzo 70 Pro",
  "realme Narzo 80",
]);
A(HP_, "realme", "Note", ["realme Note 50", "realme Note 60"]);
A(HP_, "realme", "P Series", ["realme P1", "realme P2 Pro", "realme P3"]);
A(HP_, "realme", "GT", ["realme GT 5", "realme GT 6", "realme GT 7 Pro"]);
A(HP_, "Infinix", "Smart", [
  "Infinix Smart 7",
  "Infinix Smart 8",
  "Infinix Smart 9",
]);
A(HP_, "Infinix", "Hot", [
  "Infinix Hot 30",
  "Infinix Hot 40",
  "Infinix Hot 50",
  "Infinix Hot 60",
]);
A(HP_, "Infinix", "Note", [
  "Infinix Note 30",
  "Infinix Note 40",
  "Infinix Note 50",
]);
A(HP_, "Infinix", "Zero", ["Infinix Zero 30", "Infinix Zero 40"]);
A(HP_, "Infinix", "GT", [
  "Infinix GT 10 Pro",
  "Infinix GT 20 Pro",
  "Infinix GT 30",
]);
A(HP_, "Tecno", "Spark", [
  "Tecno Spark 20",
  "Tecno Spark 30",
  "Tecno Spark 40",
]);
A(HP_, "Tecno", "Pop", ["Tecno Pop 8", "Tecno Pop 9"]);
A(HP_, "Tecno", "Camon", ["Tecno Camon 20", "Tecno Camon 30"]);
A(HP_, "Tecno", "Pova", ["Tecno Pova 5", "Tecno Pova 6", "Tecno Pova 7"]);
A(HP_, "Tecno", "Phantom", [
  "Tecno Phantom X2",
  "Tecno Phantom V Fold",
  "Tecno Phantom V Flip",
]);
A(HP_, "iQOO", "Z Series", ["iQOO Z7", "iQOO Z9", "iQOO Z10"]);
A(HP_, "iQOO", "Neo", ["iQOO Neo 7", "iQOO Neo 9", "iQOO Neo 10"]);
A(HP_, "iQOO", "11 / 12", ["iQOO 11", "iQOO 12", "iQOO 13"]);
A(HP_, "Huawei", "nova", [
  "Huawei nova 11",
  "Huawei nova 12",
  "Huawei nova 13",
]);
A(HP_, "Huawei", "Y Series", ["Huawei Y6p", "Huawei Y7a", "Huawei Y9s"]);
A(HP_, "Huawei", "Pura", [
  "Huawei P60",
  "Huawei P60 Pro",
  "Huawei Pura 70",
  "Huawei Pura 70 Pro",
]);
A(HP_, "Huawei", "Mate Series", [
  "Huawei Mate 50",
  "Huawei Mate 60",
  "Huawei Mate 60 Pro",
  "Huawei Mate X5",
]);
A(HP_, "Honor", "X5", ["Honor X5", "Honor X6", "Honor X7"]);
A(HP_, "Honor", "X8", [
  "Honor X8",
  "Honor X8b",
  "Honor X9",
  "Honor X9b",
  "Honor X9c",
]);
A(HP_, "Honor", "200", [
  "Honor 200",
  "Honor 200 Pro",
  "Honor 400",
  "Honor 400 Pro",
]);
A(HP_, "Honor", "Magic", [
  "Honor Magic5 Pro",
  "Honor Magic6 Pro",
  "Honor Magic7 Pro",
  "Honor Magic V2",
  "Honor Magic V3",
]);
A(HP_, "Google Pixel", "Pixel 6", ["Pixel 6", "Pixel 6a", "Pixel 6 Pro"]);
A(HP_, "Google Pixel", "Pixel 7", ["Pixel 7", "Pixel 7a", "Pixel 7 Pro"]);
A(HP_, "Google Pixel", "Pixel 8", ["Pixel 8", "Pixel 8a", "Pixel 8 Pro"]);
A(HP_, "Google Pixel", "Pixel 9", [
  "Pixel 9",
  "Pixel 9 Pro",
  "Pixel 9 Pro XL",
  "Pixel 9 Pro Fold",
]);
A(HP_, "Google Pixel", "Pixel 10", [
  "Pixel 10",
  "Pixel 10 Pro",
  "Pixel 10 Pro XL",
  "Pixel 10 Pro Fold",
]);
A(HP_, "Motorola", "Moto E", ["Moto E13", "Moto E14", "Moto E22", "Moto E32"]);
A(HP_, "Motorola", "Moto G", [
  "Moto G14",
  "Moto G24",
  "Moto G34",
  "Moto G54",
  "Moto G84",
]);
A(HP_, "Motorola", "Edge", [
  "Edge 30",
  "Edge 40",
  "Edge 50 Fusion",
  "Edge 50 Pro",
]);
A(HP_, "Motorola", "Razr", ["Razr 40", "Razr 50", "Razr 60"]);
A(HP_, "Nothing", "Phone (1)", [
  "Nothing Phone (1)",
  "Nothing Phone (2)",
  "Nothing Phone (2a)",
  "Nothing Phone (3a)",
]);
A(HP_, "Nothing", "CMF", ["CMF Phone 1", "CMF Phone 2 Pro"]);
A(HP_, "ASUS (ROG / Zenfone)", "ROG Phone", [
  "ROG Phone 5",
  "ROG Phone 6",
  "ROG Phone 7",
  "ROG Phone 8",
  "ROG Phone 9",
]);
A(HP_, "ASUS (ROG / Zenfone)", "Zenfone", [
  "Zenfone 9",
  "Zenfone 10",
  "Zenfone 11 Ultra",
]);
A(HP_, "Sony", "Xperia 1", ["Xperia 1 IV", "Xperia 1 V", "Xperia 1 VI"]);
A(HP_, "Sony", "Xperia 5", ["Xperia 5 IV", "Xperia 5 V"]);
A(HP_, "Sony", "Xperia 10", ["Xperia 10 IV", "Xperia 10 V", "Xperia 10 VI"]);
A(HP_, "itel", "A Series", ["itel A60", "itel A70", "itel A80"]);
A(HP_, "itel", "P Series", ["itel P40", "itel P55", "itel P55+"]);
A(HP_, "itel", "S Series", ["itel S23", "itel S24"]);

// ---- TABLET ----
A(TB, "Apple (iPad)", "9 / 10 / A16", [
  "iPad (9th gen)",
  "iPad (10th gen)",
  "iPad (A16, 11th gen)",
]);
A(TB, "Apple (iPad)", "iPad Air", [
  "iPad Air 5 (M1)",
  'iPad Air 11" M2',
  'iPad Air 13" M2',
  'iPad Air 11" M3',
  'iPad Air 13" M3',
]);
A(TB, "Apple (iPad)", "iPad Pro", [
  'iPad Pro 11" M1',
  'iPad Pro 12.9" M1',
  'iPad Pro 11" M2',
  'iPad Pro 12.9" M2',
  'iPad Pro 11" M4',
  'iPad Pro 13" M4',
  'iPad Pro 11" M5',
  'iPad Pro 13" M5',
]);
A(TB, "Samsung", "Tab A", [
  "Galaxy Tab A7 Lite",
  "Galaxy Tab A8",
  "Galaxy Tab A9",
  "Galaxy Tab A9+",
]);
A(TB, "Samsung", "S6 Lite", [
  "Galaxy Tab S6 Lite",
  "Galaxy Tab S9 FE",
  "Galaxy Tab S9 FE+",
  "Galaxy Tab S10 FE",
  "Galaxy Tab S10 FE+",
]);
A(TB, "Samsung", "S8 /", [
  "Galaxy Tab S8",
  "Galaxy Tab S8+",
  "Galaxy Tab S8 Ultra",
  "Galaxy Tab S9",
  "Galaxy Tab S9+",
  "Galaxy Tab S9 Ultra",
  "Galaxy Tab S10+",
  "Galaxy Tab S10 Ultra",
]);
A(TB, "Samsung", "Active", [
  "Galaxy Tab Active3",
  "Galaxy Tab Active4 Pro",
  "Galaxy Tab Active5",
]);
A(TB, "Xiaomi", "Redmi Pad", [
  "Redmi Pad",
  "Redmi Pad SE",
  "Redmi Pad Pro",
  "Redmi Pad 2",
]);
A(TB, "Xiaomi", "Xiaomi Pad", [
  "Xiaomi Pad 5",
  "Xiaomi Pad 6",
  "Xiaomi Pad 6 Pro",
  "Xiaomi Pad 7",
  "Xiaomi Pad 7 Pro",
]);
A(TB, "Huawei", "MatePad SE", ["MatePad SE 11", "MatePad 11.5", "MatePad T10"]);
A(TB, "Huawei", "Pro / Air", [
  "MatePad Pro 11",
  "MatePad Pro 13.2",
  "MatePad Air",
]);
A(TB, "Lenovo", "Tab M", ["Lenovo Tab M8", "Lenovo Tab M9", "Lenovo Tab M10"]);
A(TB, "Lenovo", "Tab P", [
  "Lenovo Tab P11",
  "Lenovo Tab P12",
  "Lenovo Tab Plus",
]);
A(TB, "OPPO", "Pad", ["OPPO Pad", "OPPO Pad Air", "OPPO Pad Neo"]);
A(TB, "realme", "Pad", ["realme Pad", "realme Pad Mini", "realme Pad 2"]);

// Perbaikan: key Xiaomi 12/13/14/15 (needle sebelumnya cocok ke seri Redmi Note)
DEVICE_MODELS["Smartphone|Xiaomi / Redmi / POCO|Xiaomi 12 / 13 / 14 / 15"] = L(
  "Xiaomi 12",
  "Xiaomi 13",
  "Xiaomi 14",
  "Xiaomi 15",
);
