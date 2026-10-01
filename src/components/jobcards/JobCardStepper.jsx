import clsx from "clsx";
import { Check } from "lucide-react";

export const JOBCARD_STEPS = [
  { key: "customer", label: "Customer & Vehicle" },
  { key: "inspection", label: "Inventory & Inspection" },
  { key: "parts", label: "Labour & Parts" },
  { key: "approval", label: "Estimate Approval" },
  { key: "technician", label: "Assign Technician" },
  { key: "repair", label: "Repair Work" },
  { key: "bill", label: "Bill" },
];


export default function JobCardStepper({ current, completed = new Set(), onStepChange }) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[820px] items-center">
        {JOBCARD_STEPS.map((step, idx) => {
          const active = step.key === current;
          const done = completed.has(step.key) && !active;
          const bubble = done ? "bg-emerald-500 text-white" : active ? "bg-brand-600 text-white" : "bg-white text-ink-500 border border-ink-200";
          const label = done ? "text-emerald-600" : active ? "text-brand-700" : "text-ink-500";
          const connector = completed.has(step.key) || active ? "bg-brand-500" : "bg-ink-200";
          return (
            <div key={step.key} className="flex flex-1 items-center last:flex-none">
              <button type="button" onClick={() => onStepChange?.(step.key)} className="flex items-center gap-2">
                <span className={clsx("flex h-8 w-8 shrink-0 items-center cursor-pointer justify-center rounded-full text-sm font-semibold", bubble)}>
                  {done ? <Check className="h-4 w-4" /> : idx + 1}
                </span>
                <span className={clsx("whitespace-nowrap text-sm font-semibold", label)}>{step.label}</span>
              </button>
              {idx < JOBCARD_STEPS.length - 1 && (
                <span className={clsx("mx-3 hidden h-0.5 flex-1 sm:block", connector)} aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}