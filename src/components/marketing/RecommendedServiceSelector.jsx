import clsx from "clsx";
import { Check } from "lucide-react";

export default function RecommendedServiceSelector({
  services = [],
  selectedId,
  onSelect,
}) {
  return (
    <div className="space-y-2.5">
      <h3 className="text-sm font-bold text-ink-900">Recommended Service</h3>

      <div className="flex flex-wrap items-center gap-3">
        {services.map((service) => {
          const isSelected = service.id === selectedId;

          return (
            <button
              key={service.id}
              onClick={() => onSelect?.(service.id)}
              type="button"
              className={clsx(
                "inline-flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer shadow-2xs",
                isSelected
                  ? "border-emerald-500 bg-white text-ink-900 ring-1 ring-emerald-500/30"
                  : "border-ink-200/80 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50/40",
              )}
            >
              <span>{service.title}</span>

              {/* Selection indicator */}
              <div
                className={clsx(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors",
                  isSelected
                    ? "bg-emerald-500 text-white"
                    : "border border-ink-300 bg-transparent text-transparent",
                )}
              >
                <Check className="h-3 w-3 stroke-[3]" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
