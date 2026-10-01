
// ─── vehicle chain ───────────────────────────────────────────────────────
export const MAKE_OPTIONS = [
  { value: "MARUTI SUZUKI", label: "Maruti Suzuki" },
  { value: "HYUNDAI", label: "Hyundai" },
  { value: "TOYOTA", label: "Toyota" },
  { value: "HONDA", label: "Honda" },
  { value: "TATA", label: "Tata" },
  { value: "MAHINDRA", label: "Mahindra" },
  { value: "FORD", label: "Ford" },
  { value: "VOLKSWAGEN", label: "Volkswagen" },
];

export const MODEL_OPTIONS_BY_MAKE = {
  "MARUTI SUZUKI": ["Swift", "Baleno", "Dzire", "Brezza", "Ertiga"],
  HYUNDAI: ["i20", "Verna", "Creta", "Venue", "Aura"],
  TOYOTA: ["Innova", "Fortuner", "Glanza", "Camry", "Urban Cruiser"],
  HONDA: ["City", "Amaze", "Elevate", "WR-V"],
  TATA: ["Nexon", "Punch", "Harrier", "Altroz", "Tiago"],
  MAHINDRA: ["XUV700", "Scorpio", "Thar", "Bolero", "XUV300"],
  FORD: ["EcoSport", "Endeavour", "Figo"],
  VOLKSWAGEN: ["Virtus", "Taigun", "Tiguan", "Polo"],
};

export const GENERATIONS = [
  { value: "GEN_1", label: "Gen 1 (2015-2018)", url: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=200" },
  { value: "GEN_2", label: "Gen 2 (2019-2022)", url: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=200" },
  { value: "GEN_3", label: "Gen 3 (2023+)",     url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=200" },
];

export const VARIANT_OPTIONS = ["LX", "VX", "ZX", "SX", "SX (O)"].map((v) => ({ value: v, label: v }));
export const FUEL_OPTIONS   = ["Petrol", "Diesel", "CNG", "EV"].map((v) => ({ value: v, label: v }));
export const YEAR_OPTIONS   = ["2019", "2020", "2021", "2022", "2023", "2024"].map((v) => ({ value: v, label: v }));

// ─── categories ──────────────────────────────────────────────────────────
export const CATEGORY_OPTIONS = [
  { value: "FILTERS",         label: "Filters",         icon: "filter_alt" },
  { value: "BRAKE_SYSTEM",    label: "Brake System",    icon: "radio_button_checked" },
  { value: "ENGINE",          label: "Engine",          icon: "settings" },
  { value: "SUSPENSION",      label: "Suspension",      icon: "swap_vert" },
  { value: "LIGHTING",        label: "Lighting",        icon: "lightbulb" },
  { value: "WHEELS_AND_TYRES", label: "Wheels & Tyres", icon: "album" },
  { value: "BATTERY",         label: "Battery",         icon: "battery_charging_full" },
  { value: "BELTS_AND_TENSIONER", label: "Belts & Tensioners", icon: "linear_scale" },
];

export const SUBCATEGORY_MAP = {
  FILTERS:         [{ value: "AIR_FILTER", label: "Air Filter" }, { value: "OIL_FILTER", label: "Oil Filter" }, { value: "FUEL_FILTER", label: "Fuel Filter" }, { value: "CABIN_FILTER", label: "Cabin Filter" }],
  BRAKE_SYSTEM:    [{ value: "BRAKE_PAD_FRONT", label: "Brake Pad Front" }, { value: "BRAKE_PAD_REAR", label: "Brake Pad Rear" }, { value: "BRAKE_DISC", label: "Brake Disc" }, { value: "BRAKE_FLUID", label: "Brake Fluid" }],
  ENGINE:          [{ value: "SPARK_PLUG", label: "Spark Plug" }, { value: "TIMING_BELT", label: "Timing Belt" }],
  SUSPENSION:      [{ value: "SHOCK_ABSORBER", label: "Shock Absorber" }, { value: "STRUT_MOUNT", label: "Strut Mount" }],
  LIGHTING:        [{ value: "HEADLIGHT", label: "Headlight" }, { value: "TAILLIGHT", label: "Taillight" }, { value: "INDICATOR", label: "Indicator" }],
  WHEELS_AND_TYRES: [{ value: "WHEEL_BEARING", label: "Wheel Bearing" }, { value: "TYRE", label: "Tyre" }],
  BATTERY:         [{ value: "BATTERY_UNIT", label: "Battery Unit" }],
  BELTS_AND_TENSIONER: [{ value: "TIMING_BELT", label: "Timing Belt" }, { value: "V_BELT", label: "V Belt" }],
};

// ─── brand groups (Top 20 Cars) ──────────────────────────────────────────
export const BRAND_GROUP_OPTIONS = [
  { value: "oem",       label: "OEM" },
  { value: "primary",   label: "Primary" },
  { value: "secondary", label: "Secondary" },
];


export const TIERED_PARTS = [
  {
    rowId: "AIR_FILTER_ELEMENT", components: "Air Filter Element",
    aggregate: "FILTERS", subAggregate: "AIR_FILTER",
    oem:       { code: "OE-AF-001", brand: "MARUTI OE", mrp: 850,  disc: 5,  saleRate: 807.5,  points: 0,  warrantyDays: 180, eda: 1 },
    primary:   { code: "BOSCH-AF-01", brand: "BOSCH",   mrp: 720,  disc: 8,  saleRate: 662.4,  points: 12, warrantyDays: 365, eda: 0 },
    secondary: { code: "VIR-AF-01",   brand: "VIR",     mrp: 550,  disc: 10, saleRate: 495,    points: 5,  warrantyDays: 180, eda: 2 },
  },
  {
    rowId: "OIL_FILTER", components: "Oil Filter",
    aggregate: "FILTERS", subAggregate: "OIL_FILTER",
    oem:       { code: "OE-OF-001", brand: "MARUTI OE", mrp: 320,  disc: 0,  saleRate: 320,    points: 0,  warrantyDays: 90,  eda: 1 },
    primary:   { code: "FIL-OF-01", brand: "FILTRON",   mrp: 290,  disc: 5,  saleRate: 275.5,  points: 8,  warrantyDays: 180, eda: 0 },
    secondary: { code: "KBX-OF-01", brand: "KBX",       mrp: 210,  disc: 10, saleRate: 189,    points: 3,  warrantyDays: 90,  eda: 2 },
  },
  {
    rowId: "BRAKE_PAD_SET_FRONT", components: "Brake Pad Set (Front)",
    aggregate: "BRAKE_SYSTEM", subAggregate: "BRAKE_PAD_FRONT",
    oem:       { code: "OE-BP-001", brand: "MARUTI OE", mrp: 2800, disc: 0,  saleRate: 2800,   points: 0,  warrantyDays: 365, eda: 2 },
    primary:   { code: "ZF-BP-01",  brand: "ZF",        mrp: 2200, disc: 10, saleRate: 1980,   points: 30, warrantyDays: 540, eda: 1 },
    secondary: { code: "MTV-BP-01", brand: "MYTVS",     mrp: 1650, disc: 12, saleRate: 1452,   points: 15, warrantyDays: 365, eda: 3 },
  },
  {
    rowId: "SPARK_PLUG", components: "Spark Plug",
    aggregate: "ENGINE", subAggregate: "SPARK_PLUG",
    oem:       { code: "OE-SP-001", brand: "MARUTI OE", mrp: 380, disc: 0, saleRate: 380, points: 0,  warrantyDays: 180, eda: 0 },
    primary:   { code: "NGK-SP-01", brand: "BOSCH",     mrp: 320, disc: 5, saleRate: 304, points: 10, warrantyDays: 365, eda: 0 },
    secondary: null,
  },
  {
    rowId: "HEADLIGHT_ASSY", components: "Headlight Assembly",
    aggregate: "LIGHTING", subAggregate: "HEADLIGHT",
    oem:       { code: "OE-HL-001", brand: "MARUTI OE", mrp: 8500, disc: 0,  saleRate: 8500,  points: 0,  warrantyDays: 365, eda: 3 },
    primary:   { code: "VAL-HL-01", brand: "VALEO",     mrp: 6800, disc: 8,  saleRate: 6256,  points: 60, warrantyDays: 365, eda: 2 },
    secondary: { code: "KBX-HL-01", brand: "KBX",       mrp: 5400, disc: 12, saleRate: 4752,  points: 40, warrantyDays: 180, eda: 4 },
  },
  {
    rowId: "SHOCK_ABSORBER_FRONT", components: "Shock Absorber (Front)",
    aggregate: "SUSPENSION", subAggregate: "SHOCK_ABSORBER",
    oem:       null,
    primary:   { code: "MON-SA-01", brand: "MONROE",    mrp: 3400, disc: 5,  saleRate: 3230,  points: 25, warrantyDays: 540, eda: 1 },
    secondary: { code: "FAG-SA-01", brand: "FAG",       mrp: 2800, disc: 10, saleRate: 2520,  points: 15, warrantyDays: 365, eda: 3 },
  },
  {
    rowId: "WHEEL_BEARING", components: "Wheel Bearing",
    aggregate: "WHEELS_AND_TYRES", subAggregate: "WHEEL_BEARING",
    oem:       { code: "OE-WB-001", brand: "MARUTI OE", mrp: 1400, disc: 0, saleRate: 1400, points: 0,  warrantyDays: 180, eda: 2 },
    primary:   { code: "FAG-WB-01", brand: "FAG",       mrp: 1180, disc: 6, saleRate: 1109.2, points: 18, warrantyDays: 365, eda: 1 },
    secondary: { code: "VIR-WB-01", brand: "VIR",       mrp: 890,  disc: 10, saleRate: 801,  points: 8,  warrantyDays: 180, eda: 3 },
  },
];


export const FLAT_PARTS = [
  { partNumber: "AF-54636",  itemDescription: "Air Cleaner Element",  hsnCode: "54636", brandName: "BOSCH",     aggregate: "FILTERS", subAggregate: "AIR_FILTER",   mrp: 2288,  saleRate: 1900,  taxpercent: 18, disc: 10, warrantyDays: 365, eda: 1, points: 15, salesPriceGroup: "PRIMARY" },
  { partNumber: "OF-8421",   itemDescription: "Oil Filter",            hsnCode: "8421",  brandName: "FILTRON",   aggregate: "FILTERS", subAggregate: "OIL_FILTER",   mrp: 320,   saleRate: 275,   taxpercent: 18, disc: 5,  warrantyDays: 180, eda: 0, points: 8,  salesPriceGroup: "PRIMARY" },
  { partNumber: "SP-8511",   itemDescription: "Spark Plug",            hsnCode: "8511",  brandName: "MARUTI OE", aggregate: "ENGINE",  subAggregate: "SPARK_PLUG",   mrp: 380,   saleRate: 380,   taxpercent: 18, disc: 0,  warrantyDays: 180, eda: 0, points: 0,  salesPriceGroup: "OEM" },
  { partNumber: "BP-4009",   itemDescription: "Brake Pad Set (Front)", hsnCode: "4009",  brandName: "ZF",        aggregate: "BRAKE_SYSTEM", subAggregate: "BRAKE_PAD_FRONT", mrp: 2200, saleRate: 1980, taxpercent: 18, disc: 10, warrantyDays: 540, eda: 1, points: 30, salesPriceGroup: "PRIMARY" },
  { partNumber: "BP-4010",   itemDescription: "Brake Pad Set (Rear)",  hsnCode: "4010",  brandName: "MYTVS",     aggregate: "BRAKE_SYSTEM", subAggregate: "BRAKE_PAD_FRONT", mrp: 1650, saleRate: 1452, taxpercent: 18, disc: 12, warrantyDays: 365, eda: 3, points: 15, salesPriceGroup: "SECONDARY" },
  { partNumber: "HL-6100",   itemDescription: "Headlight Assembly",    hsnCode: "6100",  brandName: "VALEO",     aggregate: "LIGHTING", subAggregate: "HEADLIGHT",    mrp: 6800,  saleRate: 6256,  taxpercent: 18, disc: 8,  warrantyDays: 365, eda: 2, points: 60, salesPriceGroup: "PRIMARY" },
  { partNumber: "WB-7205",   itemDescription: "Wheel Bearing",         hsnCode: "7205",  brandName: "FAG",       aggregate: "WHEELS_AND_TYRES", subAggregate: "WHEEL_BEARING", mrp: 1180, saleRate: 1109, taxpercent: 18, disc: 6, warrantyDays: 365, eda: 1, points: 18, salesPriceGroup: "PRIMARY" },
  { partNumber: "SA-9001",   itemDescription: "Shock Absorber (Front)", hsnCode: "8708", brandName: "MONROE",    aggregate: "SUSPENSION", subAggregate: "SHOCK_ABSORBER", mrp: 3400, saleRate: 3230, taxpercent: 18, disc: 5, warrantyDays: 540, eda: 1, points: 25, salesPriceGroup: "PRIMARY" },
];

// ─── MyTVS Parts / Lubes catalogue ───────────────────────────────────────
export const LUBES_TYPE_TABS = [
  { value: "LUBRICANTS",   label: "Engine Oil / Lubricants" },
  { value: "BRAKE_FLUID",  label: "Brake Fluid" },
  { value: "COOLANT",      label: "Coolant" },
];


export const LUBES_PRODUCTS = [
  // Engine Oil / Lubricants (grouped by grade → multiple pack variants)
  { id: 1,  type: "LUBRICANTS", category: "Engine Oil", grade: "5W-30", colour: null, pack: "1 L", ratio: null, partNumber: "MYT-5W30-1L", itemDescription: "Fully Synthetic Engine Oil 5W-30 (1 L)", mrp: 850, sellingPriceWithGst: 720, sellingPriceWithoutGst: 610, bronzePoints: 12 },
  { id: 2,  type: "LUBRICANTS", category: "Engine Oil", grade: "5W-30", colour: null, pack: "3 L", ratio: null, partNumber: "MYT-5W30-3L", itemDescription: "Fully Synthetic Engine Oil 5W-30 (3 L)", mrp: 2400, sellingPriceWithGst: 2050, sellingPriceWithoutGst: 1737, bronzePoints: 35 },
  { id: 3,  type: "LUBRICANTS", category: "Engine Oil", grade: "5W-30", colour: null, pack: "5 L", ratio: null, partNumber: "MYT-5W30-5L", itemDescription: "Fully Synthetic Engine Oil 5W-30 (5 L)", mrp: 3900, sellingPriceWithGst: 3350, sellingPriceWithoutGst: 2839, bronzePoints: 55 },
  { id: 4,  type: "LUBRICANTS", category: "Engine Oil", grade: "10W-40", colour: null, pack: "1 L", ratio: null, partNumber: "MYT-10W40-1L", itemDescription: "Semi-Synthetic Engine Oil 10W-40 (1 L)", mrp: 720, sellingPriceWithGst: 620, sellingPriceWithoutGst: 525, bronzePoints: 10 },
  { id: 5,  type: "LUBRICANTS", category: "Engine Oil", grade: "10W-40", colour: null, pack: "4 L", ratio: null, partNumber: "MYT-10W40-4L", itemDescription: "Semi-Synthetic Engine Oil 10W-40 (4 L)", mrp: 2600, sellingPriceWithGst: 2200, sellingPriceWithoutGst: 1864, bronzePoints: 38 },
  { id: 6,  type: "LUBRICANTS", category: "Gear Oil",   grade: "75W-90", colour: null, pack: "1 L", ratio: null, partNumber: "MYT-75W90-1L", itemDescription: "Manual Transmission Gear Oil 75W-90 (1 L)", mrp: 620, sellingPriceWithGst: 540, sellingPriceWithoutGst: 458, bronzePoints: 9 },
  { id: 7,  type: "LUBRICANTS", category: "Gear Oil",   grade: "75W-90", colour: null, pack: "5 L", ratio: null, partNumber: "MYT-75W90-5L", itemDescription: "Manual Transmission Gear Oil 75W-90 (5 L)", mrp: 2800, sellingPriceWithGst: 2400, sellingPriceWithoutGst: 2034, bronzePoints: 42 },
  // Brake Fluid
  { id: 10, type: "BRAKE_FLUID", category: "Brake Fluid", grade: "DOT 3", colour: null, pack: "500 ml", ratio: null, partNumber: "MYT-BF-DOT3-500", itemDescription: "DOT 3 Brake Fluid (500 ml)", mrp: 320, sellingPriceWithGst: 270, sellingPriceWithoutGst: 229, bronzePoints: 5 },
  { id: 11, type: "BRAKE_FLUID", category: "Brake Fluid", grade: "DOT 3", colour: null, pack: "1 L",   ratio: null, partNumber: "MYT-BF-DOT3-1L",  itemDescription: "DOT 3 Brake Fluid (1 L)",     mrp: 580, sellingPriceWithGst: 495, sellingPriceWithoutGst: 419, bronzePoints: 8 },
  { id: 12, type: "BRAKE_FLUID", category: "Brake Fluid", grade: "DOT 4", colour: null, pack: "500 ml", ratio: null, partNumber: "MYT-BF-DOT4-500", itemDescription: "DOT 4 Brake Fluid (500 ml)", mrp: 380, sellingPriceWithGst: 320, sellingPriceWithoutGst: 271, bronzePoints: 6 },
  { id: 13, type: "BRAKE_FLUID", category: "Brake Fluid", grade: "DOT 4", colour: null, pack: "1 L",   ratio: null, partNumber: "MYT-BF-DOT4-1L",  itemDescription: "DOT 4 Brake Fluid (1 L)",     mrp: 680, sellingPriceWithGst: 580, sellingPriceWithoutGst: 491, bronzePoints: 10 },
  // Coolant - has ratio + colour
  { id: 20, type: "COOLANT", category: "Coolant", grade: null, colour: "Red",    pack: "1 L", ratio: "1:1",  partNumber: "MYT-COOL-RED-1L", itemDescription: "Long-Life Coolant Red (1 L)",   mrp: 420, sellingPriceWithGst: 360, sellingPriceWithoutGst: 305, bronzePoints: 6 },
  { id: 21, type: "COOLANT", category: "Coolant", grade: null, colour: "Red",    pack: "5 L", ratio: "1:1",  partNumber: "MYT-COOL-RED-5L", itemDescription: "Long-Life Coolant Red (5 L)",   mrp: 1800, sellingPriceWithGst: 1550, sellingPriceWithoutGst: 1314, bronzePoints: 25 },
  { id: 22, type: "COOLANT", category: "Coolant", grade: null, colour: "Blue",   pack: "1 L", ratio: "1:1",  partNumber: "MYT-COOL-BLU-1L", itemDescription: "Long-Life Coolant Blue (1 L)",  mrp: 440, sellingPriceWithGst: 380, sellingPriceWithoutGst: 322, bronzePoints: 6 },
  { id: 23, type: "COOLANT", category: "Coolant", grade: null, colour: "Green",  pack: "1 L", ratio: "1:1",  partNumber: "MYT-COOL-GRN-1L", itemDescription: "Long-Life Coolant Green (1 L)", mrp: 400, sellingPriceWithGst: 340, sellingPriceWithoutGst: 288, bronzePoints: 5 },
  { id: 24, type: "COOLANT", category: "Coolant", grade: null, colour: "Orange", pack: "5 L", ratio: "1:1",  partNumber: "MYT-COOL-ORG-5L", itemDescription: "Long-Life Coolant Orange (5 L)", mrp: 1750, sellingPriceWithGst: 1500, sellingPriceWithoutGst: 1271, bronzePoints: 24 },
];


export const INITIAL_CART_ITEMS = [
  {
    cartId: "AIR_FILTER_ELEMENT__primary",
    name: "Air Filter Element", code: "BOSCH-AF-01", brand: "BOSCH",
    qty: 2, mrp: 720, saleRate: 662.4, discountPerUnit: 57.6, golSavings: 40,
    billingPrice: 622.4, tax: 112.03, totalAmount: 1468.86, pointsEarned: 24,
    salesPriceGroup: "PRIMARY",
  },
  {
    cartId: "BRAKE_PAD_SET_FRONT__oem",
    name: "Brake Pad Set (Front)", code: "OE-BP-001", brand: "MARUTI OE",
    qty: 1, mrp: 2800, saleRate: 2800, discountPerUnit: 0, golSavings: 0,
    billingPrice: 2800, tax: 504, totalAmount: 3304, pointsEarned: 0,
    salesPriceGroup: "OEM",
  },
];

/** Summary block returned by the real cart API, kept in the same shape. */
export function computeCartSummary(items) {
  if (!items.length) return null;
  const totalItems         = items.length;
  const totalQuantity      = items.reduce((s, i) => s + i.qty, 0);
  const totalAmount        = items.reduce((s, i) => s + i.mrp * i.qty, 0);
  const totalDiscountAmount = items.reduce((s, i) => s + (i.discountPerUnit || 0) * i.qty, 0);
  const totalTax           = items.reduce((s, i) => s + (i.tax || 0), 0);
  const grandTotal         = items.reduce((s, i) => s + (i.totalAmount || 0), 0);
  const totalSavings       = items.reduce((s, i) => s + (i.golSavings || 0) * i.qty, 0);
  const totalPointsEarned  = items.reduce((s, i) => s + (i.pointsEarned || 0), 0);
  return {
    totalItems, totalQuantity, totalAmount, totalDiscountAmount,
    totalTax, grandTotal, totalSavings, totalPointsEarned,
  };
}

// ─── shared orders ───────────────────────────────────────────────────────
export const INITIAL_ORDERS = [
  { enquiryNo: "ENQ-2024-0193", customerCode: "PFR_000100", source: "GOL", status: "Delivered",  orderCreationDate: "2024-05-16T10:30:00" },
  { enquiryNo: "ENQ-2024-0187", customerCode: "PFR_000100", source: "GOL", status: "In Process", orderCreationDate: "2024-05-14T15:22:00" },
  { enquiryNo: "ENQ-2024-0179", customerCode: "PFR_000100", source: "GOL", status: "Cancelled",  orderCreationDate: "2024-05-10T09:05:00" },
  { enquiryNo: "ENQ-2024-0168", customerCode: "PFR_000100", source: "GOL", status: "Delivered",  orderCreationDate: "2024-05-08T18:41:00" },
  { enquiryNo: "ENQ-2024-0150", customerCode: "PFR_000100", source: "GOL", status: "Completed",  orderCreationDate: "2024-05-05T11:10:00" },
];

export const ORDER_DETAILS_BY_ENQUIRY = {
  "ENQ-2024-0193": {
    enquiry_no: "ENQ-2024-0193", source: "GOL", status: "Delivered", message: "Order delivered successfully.",
    reference_no: "REF-A-8821", order_nos: ["ORD-9910", "ORD-9911"],
    parts: [
      { part_no: "BOSCH-AF-01", part_name: "Air Filter Element", qty: 2, status: "Delivered", order_no: "ORD-9910" },
      { part_no: "OE-BP-001",   part_name: "Brake Pad Set (Front)", qty: 1, status: "Delivered", order_no: "ORD-9911" },
    ],
  },
  "ENQ-2024-0187": {
    enquiry_no: "ENQ-2024-0187", source: "GOL", status: "In Process", message: "Order is being processed at the warehouse.",
    reference_no: "REF-A-8817", order_nos: ["ORD-9905"],
    parts: [
      { part_no: "MYT-5W30-5L", part_name: "Fully Synthetic Engine Oil 5W-30 (5 L)", qty: 1, status: "Packing", order_no: "ORD-9905" },
    ],
  },
  "ENQ-2024-0179": {
    enquiry_no: "ENQ-2024-0179", source: "GOL", status: "Cancelled", message: "Customer requested cancellation.",
    reference_no: "REF-A-8809", order_nos: [],
    parts: [
      { part_no: "HL-6100", part_name: "Headlight Assembly", qty: 1, status: "Cancelled", order_no: "" },
    ],
  },
  "ENQ-2024-0168": {
    enquiry_no: "ENQ-2024-0168", source: "GOL", status: "Delivered", message: "All items delivered on time.",
    reference_no: "REF-A-8790", order_nos: ["ORD-9880"],
    parts: [
      { part_no: "MYT-COOL-RED-5L", part_name: "Long-Life Coolant Red (5 L)", qty: 2, status: "Delivered", order_no: "ORD-9880" },
    ],
  },
  "ENQ-2024-0150": {
    enquiry_no: "ENQ-2024-0150", source: "GOL", status: "Completed", message: "Enquiry closed.",
    reference_no: "REF-A-8770", order_nos: ["ORD-9852", "ORD-9853"],
    parts: [
      { part_no: "OF-8421", part_name: "Oil Filter",   qty: 4, status: "Delivered", order_no: "ORD-9852" },
      { part_no: "SP-8511", part_name: "Spark Plug",   qty: 8, status: "Delivered", order_no: "ORD-9853" },
    ],
  },
};

// ─── shared brand tier classifier (used by cart pill colour) ─────────────
const OEM_BRAND_SET = new Set(["MARUTI OE", "MARUTI OE SPARES", "MARUTI SUZUKI", "HONDA", "MAHINDRA", "HYUNDAI", "FORD", "TOYOTA", "TATA", "VOLKSWAGEN"]);
const PRIMARY_BRAND_SET = new Set(["FILTRON", "ZF", "BOSCH", "MYTVS", "VALEO", "FAG", "VIR", "KBX", "MONROE"]);

export function getBrandTier(itemOrBrand) {
  if (!itemOrBrand) return "secondary";
  // Prefer explicit salesPriceGroup if the item carries it (Top 20 Cars)
  if (typeof itemOrBrand === "object" && itemOrBrand.salesPriceGroup) {
    const g = String(itemOrBrand.salesPriceGroup).toUpperCase();
    if (g === "OEM") return "oem";
    if (g === "PRIMARY") return "primary";
    if (g === "SECONDARY") return "secondary";
  }
  const brand = typeof itemOrBrand === "string" ? itemOrBrand : itemOrBrand.brand;
  const upper = String(brand || "").trim().toUpperCase();
  if (OEM_BRAND_SET.has(upper)) return "oem";
  if (PRIMARY_BRAND_SET.has(upper)) return "primary";
  return "secondary";
}