/**
 * Mock data for Finance > P&L. Shape mirrors what the eventual
 * profitLossApi will return so switching to a real backend is a
 * one-line change per state selector.
 *
 * Each period key ("month" | "year" | "6m" | "custom") returns a
 * bundle with:
 *   - `range`   : ISO from/to for the subtitle line
 *   - `pnl`     : { rows[], total }
 *   - `cashFlow`: { rows[], total }
 *
 * Row shape is `{ label, amount, kind }` where `kind` is
 * "sales" | "deduction" | "total". Deduction rows are prefixed with
 * "Less-" in the label and render as positive numbers - the total
 * cell renders in parentheses when negative.
 */

export const PL_TIME_RANGES = [
  { key: "month",  label: "This Month" },
  { key: "year",   label: "This Year" },
  { key: "6m",     label: "Last 6 Months" },
  { key: "custom", label: "Custom" },
];

const MONTH = {
  range: { from: "2025-07-01", to: "2025-07-31" },
  pnl: {
    rows: [
      { label: "Total Sales",             amount:  206736, kind: "sales" },
      { label: "Less- Cost of parts issued", amount: 71390, kind: "deduction" },
      { label: "Less- Expense",           amount:  148236, kind: "deduction" },
    ],
    total: { label: "Profit/-Loss", amount: -12890 },
  },
  cashFlow: {
    rows: [
      { label: "Total Sales",         amount:  154800, kind: "sales" },
      { label: "Less- Purchase Paid", amount:   52672, kind: "deduction" },
      { label: "Less- Expense",       amount:  130536, kind: "deduction" },
    ],
    total: { label: "Cash Flow", amount: -28408 },
  },
};

const YEAR = {
  range: { from: "2025-01-01", to: "2025-12-31" },
  pnl: {
    rows: [
      { label: "Total Sales",                amount: 2480832, kind: "sales" },
      { label: "Less- Cost of parts issued", amount:  856680, kind: "deduction" },
      { label: "Less- Expense",              amount: 1778832, kind: "deduction" },
    ],
    total: { label: "Profit/-Loss", amount: -154680 },
  },
  cashFlow: {
    rows: [
      { label: "Total Sales",         amount: 1857600, kind: "sales" },
      { label: "Less- Purchase Paid", amount:  632064, kind: "deduction" },
      { label: "Less- Expense",       amount: 1566432, kind: "deduction" },
    ],
    total: { label: "Cash Flow", amount: -340896 },
  },
};

const SIX_M = {
  range: { from: "2025-02-01", to: "2025-07-31" },
  pnl: {
    rows: [
      { label: "Total Sales",                amount: 1240416, kind: "sales" },
      { label: "Less- Cost of parts issued", amount:  428340, kind: "deduction" },
      { label: "Less- Expense",              amount:  889416, kind: "deduction" },
    ],
    total: { label: "Profit/-Loss", amount: -77340 },
  },
  cashFlow: {
    rows: [
      { label: "Total Sales",         amount: 928800, kind: "sales" },
      { label: "Less- Purchase Paid", amount: 316032, kind: "deduction" },
      { label: "Less- Expense",       amount: 783216, kind: "deduction" },
    ],
    total: { label: "Cash Flow", amount: -170448 },
  },
};

export const PL_DATA_BY_RANGE = {
  month:  MONTH,
  year:   YEAR,
  "6m":   SIX_M,
  custom: MONTH, // mock: custom starts pre-populated from "this month"
};

export const GARAGE_NAME = "myTVS Garage";