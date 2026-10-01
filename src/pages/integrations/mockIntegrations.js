/**
 * Mock data for Third Party Integration. Every row on the reference
 * screenshot has a matching entry here so the page reads from one
 * place. When the backend is live, swap the arrays for API calls -
 * the row shape stays the same.
 */

// ─── Header summary tiles (4 across the top) ────────────────────────────
export const INTEGRATION_STATS = {
  total: { value: 10, subtitle: "All Connected", tone: "brand" },
  active: { value: 6, subtitle: "Currently Active", tone: "emerald" },
  inactive: { value: 2, subtitle: "Not Active", tone: "amber" },
  action: { value: 2, subtitle: "Reconnect / Update", tone: "red" },
};

// ─── Filter tabs (top-left of the table area) ──────────────────────────
export const FILTER_TABS = [
  { key: "all", label: "All Integrations" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
  { key: "action", label: "Action Required" },
];

// ─── Category filter (top-right dropdown) ──────────────────────────────
export const CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  { value: "accounting", label: "Accounting" },
  { value: "communication", label: "Communication" },
  { value: "payments", label: "Payments" },
  { value: "insurance", label: "Insurance" },
  { value: "compliance", label: "Compliance" },
  { value: "data", label: "Data / Vehicle" },
];

// ─── Status palettes (used for the pills across every column) ──────────
// The reference uses the same pill treatment across "Request/Status",
// "Activation", and the row's own status tag. Keeping one map avoids
// per-column inconsistency.
export const STATUS_PALETTE = {
  Requested: "bg-accent-50 text-accent-700 border-accent-200",
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Inactive: "bg-amber-50 text-amber-700 border-amber-200",
  "Action Required": "bg-red-50 text-red-700 border-red-200",
  Connected: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

// ─── The 10 integration rows ────────────────────────────────────────────
// `icon` names one of the lucide icons imported in Integrations.jsx.
// `status.key` maps into STATUS_PALETTE above.
// `activation.enabled` drives the toggle switch on the right.
// `action.type` picks which action button label to render.
export const INITIAL_INTEGRATIONS = [
  {
    id: "tally",
    name: "Tally",
    category: "accounting",
    description: "Accounting & billing integration with Tally.",
    icon: "Layers",
    iconTone: "brand",
    request: { key: "Requested", detail: "Partner garage requested" },
    details: {
      icon: "Clock",
      label: "Last Request",
      value: "16 May 2024, 03:45 PM",
    },
    popup: { icon: "Mail", text: "Will notify on approval" },
    activation: { key: "Active", detail: "Tally Activated", enabled: true },
    action: { type: "viewDetails" },
  },
  {
    id: "zoho",
    name: "Zoho",
    category: "accounting",
    description: "CRM & business suite integration.",
    icon: "Layers",
    iconTone: "brand",
    request: { key: "Requested", detail: "Request for Zoho" },
    details: {
      icon: "Clock",
      label: "Last Request",
      value: "16 May 2024, 02:15 PM",
    },
    popup: { icon: "Mail", text: "Super admin will enable it" },
    activation: { key: "Inactive", detail: "Not Active", enabled: false },
    action: { type: "viewDetails" },
  },
  {
    id: "sms",
    name: "SMS Gateway",
    category: "communication",
    description: "Send SMS notifications to customers automatically.",
    icon: "MessageSquare",
    iconTone: "brand",
    request: { key: "Active", detail: "Top up Enabled" },
    details: { icon: "CreditCard", label: "Balance", value: "5,000 SMS" },
    popup: { icon: "Mail", text: "Top up alerts via email" },
    activation: { key: "Active", detail: "Top up", enabled: true },
    action: { type: "topUp" },
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    category: "communication",
    description: "Send WhatsApp messages and notifications.",
    icon: "MessageCircle",
    iconTone: "brand",
    request: { key: "Active", detail: "Connected" },
    details: {
      icon: "BarChart2",
      label: "Messages Sent",
      value: "2,500 / Month",
    },
    popup: { icon: "Mail", text: "Alerts on limit usage" },
    activation: { key: "Active", detail: "Connected", enabled: true },
    action: { type: "settings" },
  },
  {
    id: "payment",
    name: "Payment Gateway",
    category: "payments",
    description: "Accept online payments from customers.",
    icon: "CreditCard",
    iconTone: "brand",
    request: { key: "Action Required", detail: "API to be shared by garage" },
    details: {
      icon: "Clock",
      label: "Last Transaction",
      value: "15 May 2024, 11:20 AM",
    },
    popup: { icon: "Mail", text: "Failure alerts via email" },
    activation: { key: "Inactive", detail: "Not Active", enabled: false },
    action: { type: "updateApi" },
  },
  {
    id: "google",
    name: "Google Rating & Reviews",
    category: "communication",
    description: "Collect and manage customer reviews on Google.",
    icon: "Star",
    iconTone: "brand",
    request: { key: "Active", detail: "Connected" },
    details: {
      icon: "BarChart2",
      label: "Total Reviews",
      value: "120 This Month",
    },
    popup: { icon: "Mail", text: "New review alerts via email" },
    activation: { key: "Active", detail: "Connected", enabled: true },
    action: { type: "settings" },
  },
  {
    id: "vahan",
    name: "Vahan",
    category: "data",
    description: "Fetch vehicle details from Vahan portal.",
    icon: "Database",
    iconTone: "brand",
    request: { key: "Inactive", detail: "Partner requested Tally interface" },
    details: {
      icon: "Clock",
      label: "Last Sync",
      value: "10 May 2024, 10:30 AM",
    },
    popup: { icon: "Mail", text: "Sync status alerts via email" },
    activation: { key: "Inactive", detail: "Vahan Activated", enabled: false },
    action: { type: "activate" },
  },
  {
    id: "gst",
    name: "GST (Tally / Busy)",
    category: "compliance",
    description: "Sync invoices, bills and GST reports.",
    icon: "FileText",
    iconTone: "brand",
    request: { key: "Inactive", detail: "Partner requested Tally interface" },
    details: {
      icon: "Download",
      label: "Last Export",
      value: "10 May 2024, 11:20 AM",
    },
    popup: { icon: "Mail", text: "Export status alerts via email" },
    activation: { key: "Active", detail: "GST Activated", enabled: false },
    action: { type: "syncNow" },
  },
  {
    id: "insurance",
    name: "Insurance (PB / New India / ICICI Lombard / Others)",
    category: "insurance",
    description: "Fetch policy details and claim status.",
    icon: "Shield",
    iconTone: "brand",
    request: {
      key: "Action Required",
      detail: "Reconnect / Update Credentials",
    },
    details: {
      icon: "Clock",
      label: "Last Response",
      value: "Failed · 15 May 2024, 06:05 PM",
    },
    popup: { icon: "Mail", text: "Failure alerts via email" },
    activation: { key: "Action Required", detail: "Reconnect", enabled: false },
    action: { type: "reconnect" },
  },
  {
    id: "wallet",
    name: "Wallet / SMS Credits",
    category: "payments",
    description: "Manage wallet balance and SMS credits.",
    icon: "Wallet",
    iconTone: "brand",
    request: { key: "Active", detail: "Sufficient Balance" },
    details: {
      icon: "CreditCard",
      label: "Wallet Balance",
      value: "₹2,850.00",
    },
    popup: { icon: "Mail", text: "Low balance alerts via email" },
    activation: { key: "Active", detail: "Auto Top-up: On", enabled: true },
    action: { type: "addFunds" },
  },
];
