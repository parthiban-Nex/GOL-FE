

export const ESTIMATE_STATUSES = ["Open", "In Progress", "Progress", "Closed"];

export const STATUS_BADGE = {
  Open: "bg-emerald-50 text-emerald-600",
  "In Progress": "bg-amber-50 text-amber-600",
  Progress: "bg-amber-50 text-amber-600",
  Closed: "bg-blue-50 text-blue-600",
};

export const CATEGORIES = [
  "Bearings",
  "Body Parts",
  "Brake Pads",
  "Clutch",
  "Engine Oil",
  "Filters",
  "Gaskets",
  "Headlights",
  "Radiator",
  "Suspension",
];

export const INSURERS = [
  "ICICI Lombard",
  "Bajaj Allianz",
  "HDFC Ergo",
  "Tata AIG",
  "New India Assurance",
  "SBI General",
];

// Same lookup lists the Customers module uses; kept here as constants
// so the Estimate module has no cross-page runtime dependency.
export const MAKES = ["Toyota", "Mahindra", "Volkswagen", "Skoda", "Hyundai", "Maruti", "Tata", "Honda", "Kia", "MG", "Renault", "Ford"];
export const FUELS = ["Petrol", "Diesel", "CNG", "EV"];

/** Parts/labour/OSL catalog used by the Step 2 search dropdown. */
export const CATALOG = [
  { id: "p1", kind: "Part", code: "54636", hsn: "54636", name: "AIR CLEANER ELEMENT", category: "Filters", rate: 2288, gstRate: 18, tiers: [{ qty: 1, rate: 231 }, { qty: 5, rate: 209 }] },
  { id: "p2", kind: "Part", code: "8421", hsn: "8421", name: "OIL FILTER", category: "Filters", rate: 2288, gstRate: 18, tiers: [{ qty: 1, rate: 231 }] },
  { id: "p3", kind: "Part", code: "8511", hsn: "8511", name: "SPARK PLUG", category: "Engine Oil", rate: 2288, gstRate: 18, tiers: [{ qty: 1, rate: 231 }] },
  { id: "p4", kind: "Part", code: "4009", hsn: "4009", name: "BRAKE PAD SET", category: "Brake Pads", rate: 2800, gstRate: 18, tiers: [{ qty: 1, rate: 231 }] },
  { id: "p5", kind: "Part", code: "6100", hsn: "6100", name: "HEADLIGHT ASSY", category: "Headlights", rate: 5400, gstRate: 18, tiers: [{ qty: 1, rate: 231 }] },
  { id: "p6", kind: "Part", code: "7205", hsn: "7205", name: "WHEEL BEARING", category: "Bearings", rate: 1200, gstRate: 18 },
  { id: "p7", kind: "Part", code: "8302", hsn: "8302", name: "RADIATOR HOSE", category: "Radiator", rate: 900, gstRate: 18 },
  { id: "l1", kind: "Labour", code: "LAB-100", name: "General Service", type: "Paid Service", rate: 600, gstRate: 18 },
  { id: "l2", kind: "Labour", code: "LAB-200", name: "Wheel Alignment", type: "Paid Service", rate: 800, gstRate: 18 },
  { id: "l3", kind: "Labour", code: "LAB-300", name: "AC Repair", type: "Paid Service", rate: 1200, gstRate: 18 },
  { id: "o1", kind: "OSL", code: "OSL-100", name: "Body Painting", type: "Outsourced", rate: 4000, gstRate: 18 },
  { id: "o2", kind: "OSL", code: "OSL-200", name: "Denting", type: "Outsourced", rate: 3500, gstRate: 18 },
];

export const initialEstimates = [
  { id: "SQRT-VLR27-000006", regNo: "MH12KL2345", make: "Toyota", customer: "Ajay",     mobile: "9988776655", pincode: "600034", status: "Open" },
  { id: "SQRT-VLR27-000007", regNo: "UP32MN6789", make: "Mahindra", customer: "Ajay",   mobile: "226001",     pincode: "600034", status: "Open" },
  { id: "SQRT-VLR27-000008", regNo: "KL07OP1234", make: "Volkswagen", customer: "Murali", mobile: "682001",   pincode: "600034", status: "Closed" },
  { id: "SQRT-VLR27-000009", regNo: "GJ01QR5678", make: "Skoda", customer: "Rohit",     mobile: "380001",     pincode: "600034", status: "Open" },
  { id: "SQRT-VLR27-000010", regNo: "TN09ST9012", make: "Hyundai", customer: "Amit Kumar", mobile: "600001",  pincode: "600034", status: "In Progress" },
  { id: "SQRT-VLR27-000011", regNo: "DL04CA2847", make: "Maruti", customer: "Prakash",  mobile: "110001",     pincode: "600034", status: "Open" },
  { id: "SQRT-VLR27-000012", regNo: "MH02EF5621", make: "Tata", customer: "Vijay",      mobile: "400053",     pincode: "600034", status: "Closed" },
  { id: "SQRT-VLR27-000013", regNo: "KA05MH7734", make: "Honda", customer: "Yogesh",    mobile: "560034",     pincode: "600034", status: "Open" },
  { id: "SQRT-VLR27-000014", regNo: "GJ01KL4456", make: "Kia", customer: "6543210987",  mobile: "380015",     pincode: "600034", status: "Progress" },
  { id: "SQRT-VLR27-000015", regNo: "TS09AB1298", make: "Toyota", customer: "9988776655", mobile: "500032",   pincode: "600034", status: "Closed" },
  { id: "SQRT-VLR27-000016", regNo: "RJ14PQ3456", make: "MG", customer: "9123456780",  mobile: "302001",     pincode: "600034", status: "Open" },
  { id: "SQRT-VLR27-000017", regNo: "PB10RS7890", make: "Renault", customer: "8234567891", mobile: "160017", pincode: "600034", status: "Open" },
  { id: "SQRT-VLR27-000018", regNo: "WB06TU2345", make: "Ford", customer: "7345678902", mobile: "700001",    pincode: "600034", status: "Closed" },
];

/** Realistic pre-populated wizard record matching screenshots 2-6. */
export const initialEstimateDetail = {
  id: "SQRT-VLR27-000006",
  status: "Open",
  customer: {
    name: "Ajay",
    mobile: "9988776655",
    pincode: "600034",
    address: "Guindy, Chennai..",
    regNo: "MH12KL2345",
    make: "Toyota",
    model: "Fortuner",
    fuel: "Petrol",
  },
  includeGST: true,
  parts: [
    { id: "row-p1", partNo: "54636", name: "AIR CLEANER ELEMENT", hsn: "54636", qty: 1, rate: 2288, sgst: 0, cgst: 0, igst: 18, disc: 10 },
    { id: "row-p2", partNo: "8421", name: "OIL FILTER", hsn: "8421", qty: 1, rate: 2288, sgst: 9, cgst: 9, igst: 0, disc: 5 },
    { id: "row-p3", partNo: "8511", name: "SPARK PLUG", hsn: "8511", qty: 4, rate: 2288, sgst: 9, cgst: 9, igst: 0, disc: 0 },
  ],
  labour: [
    { id: "row-l1", code: "LAB-100", description: "General Service", type: "Paid Service", hrs: 1.5, rate: 600, sgst: 0, cgst: 0, igst: 18, disc: 0 },
    { id: "row-l2", code: "LAB-200", description: "Wheel Alignment", type: "Paid Service", hrs: 1, rate: 800, sgst: 9, cgst: 9, igst: 0, disc: 10 },
  ],
  osl: [
    { id: "row-o1", code: "OSL-100", description: "Body Painting", type: "Outsourced", hrs: 1, rate: 4000, sgst: 9, cgst: 9, igst: 0, disc: 0 },
    { id: "row-o2", code: "OSL-200", description: "Denting", type: "Outsourced", hrs: 1, rate: 2864, sgst: 9, cgst: 9, igst: 0, disc: 0 },
  ],
  insurance: {
    claim: "Yes",
    location: "",
    insurer: "ICICI Lombard",
    areaName: "",
    pincode: "",
    city: "",
    claimNo: "",
    gstin: "",
    policyNo: "123456789012",
    expiryDate: "",
    surveyorName: "",
    surveyorMobile: "",
    surveyorEmail: "",
    estimatedCost: "15000",
    surveyorIntimatedDate: "",
    surveyorProposedDate: "",
    surveyorVisitedDate: "",
    surveyorApprovedDate: "",
    coverage: "Comprehensive",
    settlementType: "Cashless",
    policyPeriod: "12 Jan 24 - 11 Jan 25",
  },
  discount: {
    total: 1342.5,
  },
  remarks: "",
};