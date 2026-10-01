/**
 * Mock data for Finance > Billing + Receipt. Shape mirrors what the
 * eventual billingApi / receiptApi will return so switching to a real
 * backend is a one-line change per state selector.
 */

// ─── Invoices (Billing page) ─────────────────────────────────────────────
// status is one of: "Paid" | "Unpaid" | "Partially Paid"
// loyaltyDeadline / loyaltyPoints render as the small blue reminder
// banner under each row when present. Fully-paid rows omit them.
export const INITIAL_INVOICES = [
  {
    id: "INV2026-101", date: "2026-04-25", description: "Brake Pad Replacement Set",
    amount: 8500, paid: 0, balance: 8500, status: "Unpaid",
    loyaltyDeadline: "2026-04-24", loyaltyPoints: 4,
  },
  {
    id: "INV2026-102", date: "2026-04-23", description: "Engine Oil Service Package",
    amount: 12000, paid: 5000, balance: 7000, status: "Partially Paid",
    loyaltyDeadline: "2026-04-24", loyaltyPoints: 4,
  },
  {
    id: "INV2026-103", date: "2026-04-20", description: "Headlight Assembly Replacement",
    amount: 6500, paid: 6500, balance: 0, status: "Paid",
  },
  {
    id: "INV2026-104", date: "2026-04-18", description: "Wheel Alignment & Balancing",
    amount: 3200, paid: 3200, balance: 0, status: "Paid",
  },
  {
    id: "INV2026-105", date: "2026-04-14", description: "AC Service and Refill",
    amount: 4500, paid: 0, balance: 4500, status: "Unpaid",
    loyaltyDeadline: "2026-04-30", loyaltyPoints: 2,
  },
  {
    id: "INV2026-106", date: "2026-04-10", description: "Full Vehicle Detailing",
    amount: 9800, paid: 9800, balance: 0, status: "Paid",
  },
  {
    id: "INV2026-107", date: "2026-04-08", description: "Battery Replacement",
    amount: 6200, paid: 3100, balance: 3100, status: "Partially Paid",
    loyaltyDeadline: "2026-05-02", loyaltyPoints: 3,
  },
];

/** Header pill values on the Billing page. */
export const BILLING_HEADER_STATS = {
  outstandingBalance: 31000,
  loyaltyPoints: 12,
};

// ─── Receipts (Receipt page) ─────────────────────────────────────────────
export const INITIAL_RECEIPTS = [
  { id: "RCP2026-201", date: "2026-04-24", invoice: "INV2026-102", amount: 5000, mode: "UPI",    reference: "UPI987654321",  status: "Paid" },
  { id: "RCP2026-202", date: "2026-04-21", invoice: "INV2026-103", amount: 6500, mode: "Online", reference: "TXN123456789",  status: "Paid" },
  { id: "RCP2026-203", date: "2026-04-16", invoice: "INV2026-105", amount: 2000, mode: "NEFT",   reference: "NEFT456789012", status: "Paid" },
  { id: "RCP2026-204", date: "2026-04-13", invoice: "INV2026-106", amount: 9800, mode: "UPI",    reference: "UPI456123789",  status: "Paid" },
  { id: "RCP2026-205", date: "2026-04-10", invoice: "INV2026-104", amount: 3200, mode: "Cash",   reference: "—",             status: "Paid" },
  { id: "RCP2026-206", date: "2026-04-06", invoice: "INV2026-107", amount: 3100, mode: "UPI",    reference: "UPI991223344",  status: "Paid" },
];