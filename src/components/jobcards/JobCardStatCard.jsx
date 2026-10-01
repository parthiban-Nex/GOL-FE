import {
  Wrench,
  Truck,
  Calendar,
  Clipboard,
  CreditCard,
  CheckCircle2,
} from "lucide-react";

const ICONS = {
  wrench: Wrench,
  truck: Truck,
  calendar: Calendar,
  clipboard: Clipboard,
  "credit-card": CreditCard,
  "check-circle": CheckCircle2,
};

/** Compact pill-style KPI stat shown in the row above the jobcard list table. */
export default function JobCardStatCard({ value, label, icon, active }) {
  const Icon = ICONS[icon] ?? Wrench;
  return (
    <div
      className={`flex items-center gap-2.5 rounded-full border px-4 py-2.5 shadow-card ${
        active ? "border-brand-500 bg-brand-500" : "border-ink-100 bg-white"
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          active ? "bg-white/20" : "bg-brand-500"
        }`}
      >
        <Icon className="h-4 w-4 text-white" aria-hidden="true" />
      </div>
      <span
        className={`whitespace-nowrap text-sm font-medium ${
          active ? "text-white" : "text-ink-600"
        }`}
      >
        {label}
      </span>
      <span
        className={`text-base font-bold ${
          active ? "text-white" : "text-ink-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
