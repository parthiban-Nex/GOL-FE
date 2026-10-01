import clsx from "clsx";
import { ChevronRight } from "lucide-react";

const TONE_MAP = {
  blue: {
    bg: "bg-blue-50",
    text: "text-blue-600",
    border: "border-blue-100",
    hoverBorder: "hover:border-blue-300",
  },
  emerald: {
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    border: "border-emerald-100",
    hoverBorder: "hover:border-emerald-300",
  },
  purple: {
    bg: "bg-purple-50",
    text: "text-purple-600",
    border: "border-purple-100",
    hoverBorder: "hover:border-purple-300",
  },
  amber: {
    bg: "bg-amber-50",
    text: "text-amber-600",
    border: "border-amber-100",
    hoverBorder: "hover:border-amber-300",
  },
};

export default function ReminderStatCard({
  title,
  count,
  label,
  icon: Icon,
  tone = "blue",
  isActive = false,
  onClick,
}) {
  const styles = TONE_MAP[tone] || TONE_MAP.blue;

  return (
    <div
      onClick={onClick}
      className={clsx(
        "group relative flex items-center justify-between rounded-xl border bg-white p-4.5 transition-all duration-200 shadow-xs cursor-pointer",
        isActive
          ? `${styles.border} ring-2 ring-offset-1 ring-${tone}-400`
          : "border-ink-100/80 hover:shadow-md",
        styles.hoverBorder,
      )}
    >
      <div className="flex items-center gap-3.5">
        {/* Icon box */}
        <div
          className={clsx(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105",
            styles.bg,
            styles.text,
          )}
        >
          {Icon && <Icon className="h-6 w-6 stroke-[2.2]" aria-hidden="true" />}
        </div>

        {/* Content */}
        <div className="space-y-0.5">
          <p
            className={clsx("text-xs font-semibold tracking-wide", styles.text)}
          >
            {title}
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-ink-900">
              {count}
            </span>
            <span className="text-xs font-normal text-ink-400">{label}</span>
          </div>
        </div>
      </div>

      {/* Right chevron */}
      <div className="text-ink-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-ink-500">
        <ChevronRight className="h-4 w-4 stroke-[2.5]" aria-hidden="true" />
      </div>
    </div>
  );
}
