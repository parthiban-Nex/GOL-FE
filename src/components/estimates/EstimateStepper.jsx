import clsx from "clsx";
import { Check } from "lucide-react";

const STEPS = [
  { key: "customer", label: "Customer & Vehicle" },
  { key: "items", label: "Estimate" },
  { key: "insurance", label: "Insurance" },
  { key: "final", label: "Final Estimate" },
];


export default function EstimateStepper({ current, completed = new Set(), onStepChange }) {
  const activeStep = STEPS.find((step) => step.key === current);
  const activeIndex = STEPS.findIndex((step) => step.key === current);

  return (
    <div className="w-full">
      <div className="flex items-center">
        {STEPS.map((step, idx) => {
          const isActive = step.key === current;
          const isDone = completed.has(step.key) && !isActive;
          const bubbleColor = isDone
            ? "bg-emerald-500 text-white"
            : isActive
              ? "bg-brand-600 text-white"
              : "bg-ink-100 text-ink-500";
          const labelColor = isDone
            ? "text-emerald-600"
            : isActive
              ? "text-brand-700"
              : "text-ink-500";
          const connectorColor = completed.has(step.key) || isActive ? "bg-brand-500" : "bg-ink-200";

          return (
            <div key={step.key} className="flex flex-1 items-center last:flex-none">
              <button
                type="button"
                onClick={() => onStepChange?.(step.key)}
                className="flex items-center gap-2"
                aria-current={isActive ? "step" : undefined}
                aria-label={step.label}
              >
                <span
                  className={clsx(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors cursor-pointer",
                    "sm:h-8 sm:w-8 sm:text-sm",
                    bubbleColor
                  )}
                >
                  {isDone ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : idx + 1}
                </span>
                <span
                  className={clsx(
                    "hidden whitespace-nowrap text-sm font-semibold sm:inline",
                    labelColor
                  )}
                >
                  {step.label}
                </span>
              </button>
              {idx < STEPS.length - 1 && (
                <span
                  className={clsx(
                    "mx-2 h-0.5 flex-1 sm:mx-3",
                    connectorColor
                  )}
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile-only caption: since labels are hidden below `sm`, show
          which step is active and its position in the sequence. */}
      {activeStep && (
        <p className="mt-2 text-center text-sm font-semibold text-brand-700 sm:hidden">
          Step {activeIndex + 1} of {STEPS.length}: {activeStep.label}
        </p>
      )}
    </div>
  );
}