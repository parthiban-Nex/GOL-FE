import { useState } from "react";
import clsx from "clsx";
import { ArrowUpRight } from "lucide-react";
import Button from "@/components/ui/Button";

const THEMES = {
  emerald: {
    iconBg: "bg-emerald-50 text-emerald-600",
    headerBg: "bg-emerald-50/80 text-emerald-900 border-emerald-100",
    linkText: "text-emerald-600 hover:text-emerald-700",
    headerIcon: "text-emerald-600",
  },
  purple: {
    iconBg: "bg-purple-50 text-purple-600",
    headerBg: "bg-purple-50/80 text-purple-900 border-purple-100",
    linkText: "text-purple-600 hover:text-purple-700",
    headerIcon: "text-purple-600",
  },
  amber: {
    iconBg: "bg-amber-50 text-amber-600",
    headerBg: "bg-amber-50/80 text-amber-900 border-amber-100",
    linkText: "text-amber-600 hover:text-amber-700",
    headerIcon: "text-amber-600",
  },
};

const STATUS_PILLS = {
  emerald: "bg-emerald-100/90 text-emerald-700 border border-emerald-200/60",
  amber: "bg-amber-100/90 text-amber-700 border border-amber-200/60",
  purple: "bg-purple-100/90 text-purple-700 border border-purple-200/60",
  rose: "bg-rose-100/90 text-rose-700 border border-rose-200/60",
  indigo: "bg-indigo-100/90 text-indigo-700 border border-indigo-200/60",
  blue: "bg-blue-100/90 text-blue-700 border border-blue-200/60",
};

export default function MiniReminderCard({
  title,
  icon: Icon,
  theme = "emerald",
  columns = [],
  data = [],
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const styles = THEMES[theme] || THEMES.emerald;

  // Show top 3 items by default, or all items when View All is toggled
  const displayData = isExpanded ? data : data.slice(0, 3);

  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-xl border border-ink-100 bg-white shadow-xs transition-all duration-300">
      {/* Card Title Bar */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-ink-100/70">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div
              className={clsx(
                "flex h-7 w-7 items-center justify-center rounded-lg",
                styles.iconBg,
              )}
            >
              <Icon className="h-4 w-4 stroke-[2.2]" />
            </div>
          )}
          <h3 className="text-sm font-bold text-ink-900">{title}</h3>
        </div>

        {data.length > 3 && (
          <Button
            onClick={() => setIsExpanded((prev) => !prev)}
            variant="plain"
            className={clsx(
              "inline-flex items-center gap-1 text-xs font-semibold cursor-pointer transition-colors",
              styles.linkText,
            )}
          >
            <span>{isExpanded ? "View Less" : "View All"}</span>
            <ArrowUpRight
              className={clsx(
                "h-3.5 w-3.5 stroke-[2.5] transition-transform duration-200",
                isExpanded && "rotate-180",
              )}
            />
          </Button>
        )}
      </div>

      {/* Compact Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr
              className={clsx(
                "border-b font-semibold tracking-wider text-[11px] uppercase",
                styles.headerBg,
              )}
            >
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-3.5 py-2.5 font-semibold text-ink-700"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100/70">
            {displayData.map((row) => (
              <tr key={row.id} className="hover:bg-ink-50/40 transition-colors">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="whitespace-nowrap px-3.5 py-2.5 text-ink-700"
                  >
                    {col.key === "status" ? (
                      <span
                        className={clsx(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold",
                          STATUS_PILLS[row.tone] || STATUS_PILLS.emerald,
                        )}
                      >
                        {row.status}
                      </span>
                    ) : col.render ? (
                      col.render(row)
                    ) : (
                      row[col.key]
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
