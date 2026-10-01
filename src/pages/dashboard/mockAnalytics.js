/**
 * Mock data for Analytics & Reports. Every panel on the reference
 * screenshot has a matching entry here so the page reads from one
 * place. Swap each export for its analytics API call when the backend
 * is wired.
 */

// ─── Top row (Todays Delivery / Reminders / Parts / CARPM) ─────────────
export const TOP_STATS = {
  todaysDelivery: { value: 20 },
  reminders: { booking: 5, insurance: 3 },
  parts: { order: 10, arrival: 2 },
  carpm: { diagnosis: 10, alerts: 3 },
};

// ─── Revenue & Loyalty Points row ──────────────────────────────────────
export const REVENUE_CARDS = {
  salesTurnover: { mtd: "30", ytd: "2.5" },
  mechShopPerformance: { mtd: "30", ytd: "2.5" },
  bodyShopPerformance: { mtd: "30", ytd: "2.5" },
  loyaltyPoints: { value: 250 },
  myOffers: { value: 20 }, // "Coming Soon"
};

// ─── Performance Details - 6 chart panels ──────────────────────────────
// Each series is a raw number array; the chart component decides the
// bar/line layout. Months are the same for all six panels (Jan-Jun).
export const CHART_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
export const CHART_MONTHS_7 = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];

/** EPRO Trend - area chart with a highlighted peak. */
export const EPRO_TREND = [4, 6, 3, 10, 6, 8]; // peaks at 10 in Apr
export const EPRO_HIGHLIGHT = { month: "Apr", value: "10L" };

/** Vehicles - grouped bars (MTD / YTD). */
export const VEHICLES_MTD_YTD = {
  mtd: [8, 14, 16, 5, 4, 6],
  ytd: [4, 8, 12, 3, 3, 4],
  labels: ["1.Sat", "2.Sun", "Mon", "Tue", "Wed", "Thu"],
};

/** Vehicle-by-source filter list (rendered in a dropdown). */
export const VEHICLE_SOURCES = {
  primary: [
    { value: "mytvs", label: "myTVS" },
    { value: "pb", label: "PB" },
    { value: "walkins", label: "Walk Ins" },
  ],
  otherInsurance: [
    { value: "icici", label: "ICICI Lambord" },
    { value: "newindia", label: "New India" },
  ],
};

/** Mech / Body - grouped bars. */
export const MECH_BODY = {
  mech: [8, 12, 14, 10, 7, 5],
  body: [4, 7, 9, 6, 4, 3],
};

/** Labour / Parts - stacked bars, 7 months. */
export const LABOUR_PARTS = {
  labour: [6, 10, 3, 14, 10, 12, 4],
  parts: [4, 6, 2, 10, 7, 9, 3],
};

/** New vs Repeat - donut chart. */
export const NEW_VS_REPEAT = { newCount: 45, repeatCount: 30 };

/** Purchase from myTVS - area chart with peak. */
export const PURCHASE_TREND = [3, 5, 3, 8, 6, 9];
export const PURCHASE_HIGHLIGHT = { month: "Apr", value: "10K" };

// ─── Inventory row ─────────────────────────────────────────────────────
export const INVENTORY_SUMMARY = {
  totalInventory: "30",
  totalPartsCount: 12893,
};

/**
 * 5 aging buckets - each has a price (blue mini-bar) + count (orange
 * mini-bar). Reference screenshot repeats the same numbers across the
 * five buckets which reads oddly but matches the visual.
 */
export const INVENTORY_BUCKETS = [
  { label: "31 to 60 Days", price: "0.44L", count: 40 },
  { label: "61 to 90 Days", price: "0.44L", count: 40 },
  { label: "91 to 120 Days", price: "0.44L", count: 40 },
  { label: "91 to 120 Days", price: "0.44L", count: 40 },
  { label: "121 to 150 Days", price: "0.44L", count: 40 },
];

// ─── Other Stats tables ────────────────────────────────────────────────
export const TECHNICIAN_ROWS = [
  { name: "Rajesh", ftd: "₹75K", mtd: "₹730K" },
  { name: "Vikram", ftd: "₹88K", mtd: "₹790K" },
  { name: "Arjun", ftd: "₹82K", mtd: "₹810K" },
  { name: "Karan", ftd: "₹90K", mtd: "₹860K" },
];

export const SERVICE_ADVISOR_ROWS = [
  { name: "Rohan", ftd: "₹105K", mtd: "₹920K" },
  { name: "Arjun", ftd: "₹112K", mtd: "₹1.1M" },
  { name: "Kabir", ftd: "₹97K", mtd: "₹870K" },
  { name: "Vikram", ftd: "₹102K", mtd: "₹910K" },
];

export const BRAND_WISE_ROWS = [
  {
    brand: "Maruti",
    ftdInflow: 50,
    ftdRevenue: "₹145K",
    mtdInflow: 50,
    mtdRevenue: "₹145K",
  },
  {
    brand: "Hyundai",
    ftdInflow: 70,
    ftdRevenue: "₹160K",
    mtdInflow: 65,
    mtdRevenue: "₹155K",
  },
  {
    brand: "Tata",
    ftdInflow: 60,
    ftdRevenue: "₹130K",
    mtdInflow: 55,
    mtdRevenue: "₹125K",
  },
  {
    brand: "Honda",
    ftdInflow: 60,
    ftdRevenue: "₹130K",
    mtdInflow: 55,
    mtdRevenue: "₹125K",
  },
];

export const PARTS_CATEGORY_ROWS = [
  {
    name: "Brake",
    ftdCount: 50,
    ftdValue: "₹145K",
    mtdCount: 50,
    mtdValue: "₹145K",
  },
  {
    name: "Accelerator",
    ftdCount: 75,
    ftdValue: "₹120K",
    mtdCount: 75,
    mtdValue: "₹120K",
  },
  {
    name: "Clutch",
    ftdCount: 40,
    ftdValue: "₹130K",
    mtdCount: 40,
    mtdValue: "₹130K",
  },
  {
    name: "Steering Wheel",
    ftdCount: 60,
    ftdValue: "₹200K",
    mtdCount: 60,
    mtdValue: "₹200K",
  },
];

export const VALUES_METRIC_ROWS = [
  {
    key: "delivered",
    label: "Delivered Jobcards",
    ftd: "₹12K",
    mtd: "₹145K",
    total: "₹1.2M",
  },
  {
    key: "labour",
    label: "Labour Values",
    ftd: "₹12K",
    mtd: "₹145K",
    total: "₹1.2M",
  },
  {
    key: "parts",
    label: "Parts Values",
    ftd: "₹8K",
    mtd: "₹98K",
    total: "₹850K",
  },
];
export const VALUES_METRIC_TOTAL = {
  ftd: "₹20K",
  mtd: "₹243K",
  total: "₹2.05M",
};

export const INVENTORY_METRIC_ROWS = [
  { key: "orders", label: "Parts Orders", ftd: 5, mtd: 42, mtdValue: 300 },
  { key: "intransit", label: "Intransist", ftd: 12, mtd: 89, mtdValue: 102 },
  { key: "delivered", label: "Delivered", ftd: 12, mtd: 98, mtdValue: 110 },
];
export const INVENTORY_METRIC_FOOTER = {
  label: "InStock Total",
  value: "1345 items",
};

// ─── WIP / RFB + status cards ──────────────────────────────────────────
export const WIP_RFB = {
  wip: { count: 100, amount: "₹1.05M" },
  rfb: { count: 100, amount: "₹1.05M" },
};

export const STATUS_CARDS = [
  { key: "rsa", label: "RSA POS", status: "Active 3", tone: "blue" },
  {
    key: "insurance",
    label: "Insurance POS",
    status: "Expired 2",
    tone: "red",
  },
  { key: "parts", label: "Parts Availability", status: "80%", tone: "orange" },
];
