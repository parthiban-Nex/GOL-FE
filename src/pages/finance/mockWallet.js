/**
 * Mock data for Finance > Wallet. Shape mirrors what the eventual
 * walletApi will return so switching to a real backend is a one-line
 * change in each state selector inside pages/finance/Wallet.jsx.
 */

// ─── Balance ─────────────────────────────────────────────────────────────
export const INITIAL_BALANCE = {
  amount: 5000,
  currency: "INR",
  lastUpdated: "2026-04-27 10:30 AM",
};

// ─── Recent + full transactions list ─────────────────────────────────────
export const INITIAL_TRANSACTIONS = [
  { id: "TXN001234", date: "2026-04-26", type: "UPI",    reference: "Ref: UPI123456", amount:  2000, status: "Approved" },
  { id: "TXN001233", date: "2026-04-25", type: "Parts",  reference: "-",              amount:  -850, status: "Success"  },
  { id: "TXN001232", date: "2026-04-24", type: "Online", reference: "-",              amount:  1500, status: "Success"  },
  { id: "TXN001231", date: "2026-04-24", type: "NEFT",   reference: "Ref: NEFT78901", amount:  3000, status: "Approved" },
  { id: "TXN001230", date: "2026-04-23", type: "Parts",  reference: "-",              amount:  -420, status: "Success"  },
  { id: "TXN001229", date: "2026-04-22", type: "UPI",    reference: "Ref: UPI998877", amount:   750, status: "Approved" },
  { id: "TXN001228", date: "2026-04-21", type: "Online", reference: "-",              amount:  1200, status: "Success"  },
  { id: "TXN001227", date: "2026-04-20", type: "Parts",  reference: "-",              amount: -1650, status: "Success"  },
  { id: "TXN001226", date: "2026-04-19", type: "NEFT",   reference: "Ref: NEFT55221", amount:  5000, status: "Approved" },
  { id: "TXN001225", date: "2026-04-18", type: "UPI",    reference: "Ref: UPI334455", amount:   980, status: "Success"  },
];

// ─── Add Funds Quick-select amounts ──────────────────────────────────────
export const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

// ─── Payment mode options (Add Funds manual submission) ──────────────────
export const PAYMENT_MODE_OPTIONS = [
  { value: "NEFT",   label: "NEFT"   },
  { value: "RTGS",   label: "RTGS"   },
  { value: "IMPS",   label: "IMPS"   },
  { value: "UPI",    label: "UPI"    },
  { value: "CHEQUE", label: "Cheque" },
  { value: "CASH",   label: "Cash"   },
];

// ─── Pending Approvals (admin/manager scope) ─────────────────────────────
export const INITIAL_APPROVALS = [
  {
    id: "APR001", garageName: "Speed Auto Garage",  garageId: "G12345",
    amount: 3000, reference: "NEFT789012", mode: "NEFT",
    date: "2026-04-22", description: "Payment for parts inventory", status: "PENDING",
  },
  {
    id: "APR002", garageName: "City Service Center", garageId: "G12346",
    amount: 1500, reference: "UPI987654", mode: "UPI",
    date: "2026-04-25", description: "Payment for parts inventory", status: "PENDING",
  },
];