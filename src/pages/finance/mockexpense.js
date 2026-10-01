/**
 * Mock data for Finance > Expense. Shape mirrors what the eventual
 * expenseApi will return so switching to a real backend is a one-line
 * change per state selector in pages/finance/Expense.jsx.
 */

// ─── Dropdown option lists (used by the two modals) ──────────────────────
export const EXPENSE_HEAD_OPTIONS = [
  { value: "Cleaning",         label: "Cleaning" },
  { value: "Miscellaneous",    label: "Miscellaneous" },
  { value: "Tool Purchase",    label: "Tool Purchase" },
  { value: "Electricity",      label: "Electricity" },
  { value: "Internet & Phone", label: "Internet & Phone" },
  { value: "Salary",           label: "Salary" },
  { value: "Rent",             label: "Rent" },
  { value: "Insurance",        label: "Insurance" },
  { value: "Fuel",             label: "Fuel" },
];

export const EXPENSE_TYPE_OPTIONS = [
  { value: "Direct",      label: "Direct" },
  { value: "Indirect",    label: "Indirect" },
  { value: "Maintenance", label: "Maintenance" },
];

export const PAYMENT_MODE_OPTIONS = [
  { value: "UPI",           label: "UPI" },
  { value: "Cash",          label: "Cash" },
  { value: "Online",        label: "Online" },
  { value: "Auto-debit",    label: "Auto-debit" },
  { value: "Bank Transfer", label: "Bank Transfer" },
  { value: "Cheque",        label: "Cheque" },
  { value: "NEFT",          label: "NEFT" },
];

export const EXPENSE_STATUS_OPTIONS = [
  { value: "Paid",    label: "Paid" },
  { value: "Pending", label: "Pending" },
];

export const VENDOR_TYPE_OPTIONS = [
  { value: "Supplier",          label: "Supplier" },
  { value: "Service Provider",  label: "Service Provider" },
  { value: "Landlord",          label: "Landlord" },
  { value: "Utility Provider",  label: "Utility Provider" },
  { value: "Contractor",        label: "Contractor" },
];

export const PAYMENT_TERMS_OPTIONS = [
  { value: "On Receipt", label: "On Receipt" },
  { value: "Net 15",     label: "Net 15" },
  { value: "Net 30",     label: "Net 30" },
  { value: "Net 45",     label: "Net 45" },
  { value: "Net 60",     label: "Net 60" },
];

// ─── Vendors (referenced by the expense rows + Add Vendor modal) ─────────
export const INITIAL_VENDORS = [
  { id: "V001", name: "CleanPro Services", type: "Service Provider", paymentTerms: "Net 30", contactPerson: "Ramesh", phone: "9876543210", email: "info@cleanpro.in",   gst: "29AABCU9603R1ZJ", address: "Mysore Road, Bengaluru, KA 560026" },
  { id: "V002", name: "Snap-on Tools India", type: "Supplier",         paymentTerms: "Net 45", contactPerson: "Priya",  phone: "9812345678", email: "sales@snapon.co.in",  gst: "29AAECS1234R1ZK", address: "Whitefield, Bengaluru, KA 560066" },
  { id: "V003", name: "BESCOM",              type: "Utility Provider", paymentTerms: "On Receipt", contactPerson: "-",  phone: "1800425555",  email: "customer@bescom.org", gst: "29AABCK6301R1ZS", address: "Corporate Office, Bengaluru, KA 560001" },
  { id: "V004", name: "Airtel Business",     type: "Utility Provider", paymentTerms: "On Receipt", contactPerson: "Ajay", phone: "9900123456", email: "biz@airtel.in",       gst: "29AAACB2894G1ZH", address: "MG Road, Bengaluru, KA 560001" },
  { id: "V005", name: "Shree Properties",    type: "Landlord",         paymentTerms: "On Receipt", contactPerson: "Suresh", phone: "9845123456", email: "office@shreeprop.in", gst: "29AABPS9876R1ZQ", address: "Jayanagar, Bengaluru, KA 560041" },
];

// ─── Expenses (main list) ───────────────────────────────────────────────
// Amount fields are stored as plain numbers; the components format
// them for display. Pending is derived (`inclGst - paid`) but stored
// so the table cells can read it directly.
export const INITIAL_EXPENSES = [
  {
    id: "EXP001",
    head: "Cleaning", type: "Indirect",
    vendor: "CleanPro Services", invoiceNo: "CLN-JUL25",
    date: "2025-07-25", paymentMode: "UPI",
    exclGst: 4500, gst: 810, inclGst: 5310, paid: 5310, pending: 0,
    status: "Paid",
    notes: "Weekly deep cleaning x4.",
    documents: [],
  },
  {
    id: "EXP002",
    head: "Miscellaneous", type: "Indirect",
    vendor: "Various", invoiceNo: "MISC-JUL25",
    date: "2025-07-20", paymentMode: "Cash",
    exclGst: 3200, gst: 576, inclGst: 3776, paid: 3776, pending: 0,
    status: "Paid",
    notes: "",
    documents: [],
  },
  {
    id: "EXP003",
    head: "Tool Purchase", type: "Maintenance",
    vendor: "Snap-on Tools India", invoiceNo: "TOOL-001",
    date: "2025-07-11", paymentMode: "",
    exclGst: 15000, gst: 2700, inclGst: 17700, paid: 0, pending: 17700,
    status: "Pending",
    notes: "Torque wrench set + diagnostics kit.",
    documents: [],
  },
  {
    id: "EXP004",
    head: "Electricity", type: "Indirect",
    vendor: "BESCOM", invoiceNo: "ELEC-JUL25",
    date: "2025-07-05", paymentMode: "Online",
    exclGst: 8500, gst: 0, inclGst: 8500, paid: 8500, pending: 0,
    status: "Paid",
    notes: "Monthly bill.",
    documents: [],
  },
  {
    id: "EXP005",
    head: "Internet & Phone", type: "Indirect",
    vendor: "Airtel Business", invoiceNo: "NET-JUL25",
    date: "2025-07-05", paymentMode: "Auto-debit",
    exclGst: 2500, gst: 450, inclGst: 2950, paid: 2950, pending: 0,
    status: "Paid",
    notes: "Fibre + 3 postpaid lines.",
    documents: [],
  },
  {
    id: "EXP006",
    head: "Salary", type: "Direct",
    vendor: "Staff Payroll", invoiceNo: "SAL-JUL25",
    date: "2025-07-01", paymentMode: "Bank Transfer",
    exclGst: 85000, gst: 0, inclGst: 85000, paid: 85000, pending: 0,
    status: "Paid",
    notes: "July payroll for full-time technicians.",
    documents: [],
  },
  {
    id: "EXP007",
    head: "Rent", type: "Indirect",
    vendor: "Shree Properties", invoiceNo: "RENT-JUL25",
    date: "2025-07-01", paymentMode: "Cheque",
    exclGst: 25000, gst: 0, inclGst: 25000, paid: 25000, pending: 0,
    status: "Paid",
    notes: "Workshop premises rent - July.",
    documents: [],
  },
];

/** Aggregates displayed in the 3 header pills. */
export function computeExpenseTotals(expenses) {
  return expenses.reduce(
    (acc, e) => ({
      inclGst: acc.inclGst + e.inclGst,
      paid:    acc.paid    + e.paid,
      pending: acc.pending + e.pending,
    }),
    { inclGst: 0, paid: 0, pending: 0 }
  );
}