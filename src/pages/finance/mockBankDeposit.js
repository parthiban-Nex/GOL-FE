/**
 * Mock data for Finance > Bank Deposit. Shape mirrors what the
 * eventual bankDepositApi will return so switching to a real backend
 * is a one-line change per state selector.
 */

// ─── Dropdown option lists ──────────────────────────────────────────────
export const BANK_ACCOUNT_OPTIONS = [
  { value: "hdfc-5020",     label: "HDFC Bank · A/c 5020...5678" },
  { value: "sbi-3098",      label: "State Bank of India · A/c 3098...4321" },
  { value: "icici-1234",    label: "ICICI Bank · A/c 1234...9012" },
];

export const DEPOSIT_MODE_OPTIONS = [
  { value: "NEFT",   label: "NEFT" },
  { value: "UPI",    label: "UPI" },
  { value: "Cash",   label: "Cash" },
  { value: "Cheque", label: "Cheque" },
  { value: "RTGS",   label: "RTGS" },
  { value: "IMPS",   label: "IMPS" },
];

export const DEPOSIT_STATUS_OPTIONS = [
  { value: "Deposited", label: "Deposited" },
  { value: "Pending",   label: "Pending" },
];

// ─── Header stat cards (4 across the top) ───────────────────────────────
// count is derived from the deposits list at render time when the
// backend is live, but stored here for the mock to match the reference.
export const BANK_DEPOSIT_STATS = {
  today:   { amount: 52672,  count: 2 },
  week:    { amount: 125430, count: 6 },
  month:   { amount: 582190, count: 26 },
  pending: { amount: 18718,  count: 3 },
};

// ─── Deposit rows ───────────────────────────────────────────────────────
// bankAccount stores the display name + a "last 4" for the muted
// second line beneath the bank name.
export const INITIAL_DEPOSITS = [
  {
    id: "BD-240516-001", date: "2024-05-16", time: "10:30 AM",
    bankAccount: { name: "HDFC Bank",             acNo: "50200012345678" },
    depositMode: "NEFT",   reference: "NEFT638291",
    amount:  25000, depositedBy: "Raghav",
    status: "Deposited", notes: "Consolidated Monday collections.",
  },
  {
    id: "BD-240516-002", date: "2024-05-16", time: "02:15 PM",
    bankAccount: { name: "HDFC Bank",             acNo: "50200012345678" },
    depositMode: "UPI",    reference: "UPI422781993112",
    amount:  27672, depositedBy: "Raghav",
    status: "Deposited", notes: "",
  },
  {
    id: "BD-240515-003", date: "2024-05-15", time: "04:45 PM",
    bankAccount: { name: "State Bank of India",   acNo: "30987654321" },
    depositMode: "Cheque", reference: "CHQ884512",
    amount:  12450, depositedBy: "Manoj S",
    status: "Deposited", notes: "Cheque cleared next day.",
  },
  {
    id: "BD-240515-002", date: "2024-05-15", time: "11:20 AM",
    bankAccount: { name: "HDFC Bank",             acNo: "50200012345678" },
    depositMode: "Cash",   reference: "CASH1520",
    amount:  18718, depositedBy: "Manoj S",
    status: "Pending",   notes: "Awaiting slip verification.",
  },
  {
    id: "BD-240514-001", date: "2024-05-14", time: "05:10 PM",
    bankAccount: { name: "ICICI Bank",            acNo: "123456789012" },
    depositMode: "NEFT",   reference: "NEFT336621",
    amount:  32090, depositedBy: "Raghav",
    status: "Deposited", notes: "",
  },
];