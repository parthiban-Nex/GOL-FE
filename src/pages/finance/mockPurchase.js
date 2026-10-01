/**
 * Mock data for Finance > Purchase. Shape mirrors what the eventual
 * purchaseApi will return. Very similar to mockExpense but each
 * purchase has a `lineItems` array (parts + qty + rate + amount)
 * instead of a flat expense amount.
 */

export const PURCHASE_STATUS_OPTIONS = [
  { value: "Paid",    label: "Paid" },
  { value: "Partial", label: "Partial" },
  { value: "Pending", label: "Pending" },
];

export const PURCHASE_PAYMENT_MODE_OPTIONS = [
  { value: "UPI",           label: "UPI" },
  { value: "Cash",          label: "Cash" },
  { value: "NEFT",          label: "NEFT" },
  { value: "RTGS",          label: "RTGS" },
  { value: "Cheque",        label: "Cheque" },
  { value: "Bank Transfer", label: "Bank Transfer" },
];

/**
 * `pending` is derived (`inclGst - paid`) but stored on each row so
 * the table cell can read it directly. `status` is a display-time
 * concept but stored so filtering / pill rendering stays trivial.
 */
export const INITIAL_PURCHASES = [
  {
    id: "PUR001",
    vendor: "MRF Tyres",         invoiceNo: "VEND-8826",
    date: "2025-07-19",          paymentMode: "NEFT",
    exclGst: 18000, gst: 3240,   inclGst: 21240, paid: 21240, pending: 0,
    status: "Paid",
    lineItems: [
      { name: "Tyre 185/65R15", qty: 4, rate: 4500, amount: 18000 },
    ],
    notes: "",
    documents: [],
  },
  {
    id: "PUR002",
    vendor: "TVS Sundaram",      invoiceNo: "VEND-8825",
    date: "2025-07-14",          paymentMode: "Partial",
    exclGst: 7500,  gst: 1350,   inclGst: 8850,  paid: 5000, pending: 3850,
    status: "Partial",
    lineItems: [
      { name: "Brake Pad Set",  qty: 2, rate: 3750, amount: 7500 },
    ],
    notes: "Partial payment - rest due next week.",
    documents: [],
  },
  {
    id: "PUR003",
    vendor: "Exide Industries",  invoiceNo: "VEND-8824",
    date: "2025-07-09",          paymentMode: "Cheque",
    exclGst: 9800,  gst: 1764,   inclGst: 11564, paid: 11564, pending: 0,
    status: "Paid",
    lineItems: [
      { name: "Battery 12V 80Ah", qty: 2, rate: 4900, amount: 9800 },
    ],
    notes: "",
    documents: [],
  },
  {
    id: "PUR004",
    vendor: "SRK Motors",        invoiceNo: "VEND-8823",
    date: "2025-07-06",          paymentMode: "",
    exclGst: 12600, gst: 2268,   inclGst: 14868, paid: 0, pending: 14868,
    status: "Pending",
    lineItems: [
      { name: "Alternator",      qty: 3, rate: 4200, amount: 12600 },
    ],
    notes: "Awaiting invoice verification.",
    documents: [],
  },
  {
    id: "PUR005",
    vendor: "Bosch Auto Parts",  invoiceNo: "VEND-8822",
    date: "2025-07-04",          paymentMode: "UPI",
    exclGst: 4200,  gst: 756,    inclGst: 4956, paid: 4956, pending: 0,
    status: "Paid",
    lineItems: [
      { name: "Spark Plug Set",  qty: 4, rate: 1050, amount: 4200 },
    ],
    notes: "",
    documents: [],
  },
  {
    id: "PUR006",
    vendor: "Minda Industries",  invoiceNo: "VEND-8821",
    date: "2025-07-02",          paymentMode: "NEFT",
    exclGst: 8400,  gst: 1512,   inclGst: 9912, paid: 9912, pending: 0,
    status: "Paid",
    lineItems: [
      { name: "Horn Assembly",   qty: 6, rate: 1400, amount: 8400 },
    ],
    notes: "",
    documents: [],
  },
];

export function computePurchaseTotals(purchases) {
  return purchases.reduce(
    (acc, p) => ({
      inclGst: acc.inclGst + p.inclGst,
      paid:    acc.paid    + p.paid,
      pending: acc.pending + p.pending,
    }),
    { inclGst: 0, paid: 0, pending: 0 }
  );
}