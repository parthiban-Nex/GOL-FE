/**
 * Mock data for the Quick Links slide-in panel. The three flows
 * (Create Customer, Create Booking, New Estimate) all read from this
 * one file so switching to a real backend later is a targeted swap
 * per handler, not a rewrite of the panel.
 */

// ─── Customer search (Customer / Booking / Estimate flows) ──────────────
// Any mobile number ending in "456" hits this record; anything else
// simulates a "not found" flow.
export const MOCK_CUSTOMER = {
  name: "Ajay Kumar",
  phone: "+91 9176177456",
  vehicleMake: "Toyota",
  vehicleModel: "Innova",
  regNo: "MH12KL2345",
};

/** True when a search term should return the mock customer. */
export function customerMatches(term) {
  const t = String(term ?? "")
    .trim()
    .toUpperCase();
  return t.endsWith("456") || t === "MH12KL2345";
}

// ─── Manual add customer dropdown options ───────────────────────────────
export const MAKE_OPTIONS = [
  { value: "Toyota", label: "Toyota" },
  { value: "Maruti", label: "Maruti Suzuki" },
  { value: "Hyundai", label: "Hyundai" },
  { value: "Honda", label: "Honda" },
  { value: "Tata", label: "Tata" },
  { value: "Mahindra", label: "Mahindra" },
];

export const MODELS_BY_MAKE = {
  Toyota: [
    { value: "Innova", label: "Innova" },
    { value: "Fortuner", label: "Fortuner" },
    { value: "Camry", label: "Camry" },
  ],
  Maruti: [
    { value: "Swift", label: "Swift" },
    { value: "Baleno", label: "Baleno" },
    { value: "Dzire", label: "Dzire" },
  ],
  Hyundai: [
    { value: "Creta", label: "Creta" },
    { value: "Verna", label: "Verna" },
    { value: "i20", label: "i20" },
  ],
  Honda: [
    { value: "City", label: "City" },
    { value: "Amaze", label: "Amaze" },
  ],
  Tata: [
    { value: "Nexon", label: "Nexon" },
    { value: "Harrier", label: "Harrier" },
  ],
  Mahindra: [
    { value: "XUV700", label: "XUV700" },
    { value: "Scorpio", label: "Scorpio" },
  ],
};

export const FUEL_OPTIONS = [
  { value: "Petrol", label: "Petrol" },
  { value: "Diesel", label: "Diesel" },
  { value: "CNG", label: "CNG" },
  { value: "Electric", label: "Electric" },
];

// ─── Booking flow ───────────────────────────────────────────────────────
export const APPOINTMENT_TIMES = [
  "9:00 AM - 12:00 PM",
  "12:00 PM - 03:00 PM",
  "03:00 PM - 06:00 PM",
];

export const SERVICE_TYPES = [
  { value: "Service", label: "Service" },
  { value: "Repair", label: "Repair" },
  { value: "Inspection", label: "Inspection" },
  { value: "Denting", label: "Denting & Painting" },
];

/**
 * Five appointment date cards from a rolling reference "today = day 14".
 * Real integration would compute this from Date.now() instead.
 */
export const APPOINTMENT_DATES = [
  { day: 14, weekday: "Wed" },
  { day: 15, weekday: "Thu" },
  { day: 16, weekday: "Fri" },
  { day: 17, weekday: "Sat" },
  { day: 18, weekday: "Sun", disabled: true },
];

// ─── Estimate flow - parts + labour catalogue ───────────────────────────
export const PART_CATEGORY_TABS = [
  { key: "bearings", label: "Bearings" },
  { key: "body", label: "Body Parts" },
  { key: "brake", label: "Brake Pads" },
  { key: "clutch", label: "Clutch" },
  { key: "engineoil", label: "Engine Oil" },
  { key: "filters", label: "Filters" },
  { key: "gaskets", label: "Gaskets" },
  { key: "headlight", label: "Headlights" },
];

/**
 * Each part has a `rateOptions` array (2 tiers in most cases: preferred
 * green-checked price + a fallback). The picker in the parts-add card
 * shows both and lets the user pick which one to add.
 */
export const MOCK_PARTS = [
  {
    code: "54636",
    hsn: "54636",
    name: "AIR CLEANER ELEMENT",
    rateOptions: [
      { rate: 231, cost: 183, preferred: true },
      { rate: 209, cost: 0 },
    ],
  },
  {
    code: "8511",
    hsn: "8511",
    name: "SPARK PLUG",
    rateOptions: [{ rate: 2800, cost: 2288, preferred: true }],
  },
  {
    code: "4009",
    hsn: "4009",
    name: "BRAKE PAD SET",
    rateOptions: [{ rate: 2800, cost: 2288, preferred: true }],
  },
];

export const MOCK_LABOUR = [
  {
    code: "LAB-100",
    name: "General Service",
    rate: 600,
    gstPercent: 18,
    paid: true,
  },
  {
    code: "LAB-200",
    name: "Wheel Alignment",
    rate: 800,
    gstPercent: 18,
    paid: true,
  },
];

// ─── Estimate summary (Approval / Job Card / Share views) ───────────────
/**
 * Pre-computed line rows for the "Added Parts and Labour" view. Kept as
 * literal numbers so the reference visual matches the screenshot
 * exactly - the same values are re-summarised into ESTIMATE_TOTALS.
 */
export const ESTIMATE_PARTS = [
  {
    idx: 1,
    code: "54636",
    hsn: "54636",
    name: "AIR CLEANER ELEMENT",
    qty: 1,
    rate: 2288,
    sgst: 0,
    cgst: 0,
    igst: 18,
    disc: 10,
    total: 2429.86,
  },
  {
    idx: 2,
    code: "8421",
    hsn: "8421",
    name: "OIL FILTER",
    qty: 1,
    rate: 2288,
    sgst: 9,
    cgst: 9,
    igst: 0,
    disc: 5,
    total: 2564.85,
  },
  {
    idx: 3,
    code: "8511",
    hsn: "8511",
    name: "SPARK PLUG",
    qty: 4,
    rate: 2288,
    sgst: 9,
    cgst: 9,
    igst: 0,
    disc: 0,
    total: 10799.35,
  },
];

export const ESTIMATE_LABOUR = [
  {
    idx: 1,
    code: "LAB-100",
    name: "General Service",
    hrs: 1.5,
    ratePerHr: 600,
    sgst: 0,
    cgst: 0,
    igst: 18,
    disc: 0,
    total: 1062.0,
  },
  {
    idx: 2,
    code: "LAB-200",
    name: "Wheel Alignment",
    hrs: 1,
    ratePerHr: 800,
    sgst: 9,
    cgst: 9,
    igst: 0,
    disc: 10,
    total: 849.6,
  },
];

export const ESTIMATE_TOTALS = {
  id: "EST-2025-092",
  partsTotal: 15794.06,
  labourTotal: 1911.6,
  subTotal: 25805,
  tax: 1242.0,
  discount: 423.0,
  grandTotal: 25805.18,
};

// ─── Job card (final estimate step) ─────────────────────────────────────
export const MOCK_JOBCARD = {
  no: "JC-2025-0142",
  date: "13 Aug 2025",
  customer: "Ajay Kumar",
  vehicle: "Toyota Innova (MH12KL2345)",
  assignedTechnician: "Ravi Mechanic",
  estimatedCompletion: "14 Aug 2025",
  labourItems: [
    "General Service",
    "Brake Inspection",
    "AC Checkup",
    "Wheel Alignment",
  ],
  partsItems: ["Engine Oil 5W30", "Oil Filter", "Air Filter", "Brake Pads"],
};
