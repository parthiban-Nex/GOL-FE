import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { addTime, getMonthGrid, isSameDay } from "@/utils/dateHelpers";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Compact month grid used in the right sidebar for quick date jumps. */
export default function MiniCalendar({ month, selectedDate, onSelectDate, onChangeMonth }) {
  const days = getMonthGrid(month);
  const monthLabel = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(month);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-800">{monthLabel}</h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onChangeMonth(addTime(month, -1, "month"))}
            className="rounded-md p-1 text-ink-500 hover:bg-ink-100"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onChangeMonth(addTime(month, 1, "month"))}
            className="rounded-md p-1 text-ink-500 hover:bg-ink-100"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((day) => (
          <div key={day} className="pb-1.5 text-[11px] font-medium text-ink-400">
            {day}
          </div>
        ))}
        {days.map((date) => {
          const inMonth = date.getMonth() === month.getMonth();
          const selected = isSameDay(date, selectedDate);
          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => onSelectDate(date)}
              aria-pressed={selected}
              className={clsx(
                "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs transition-colors",
                selected && "bg-brand-800 font-semibold text-white",
                !selected && inMonth && "text-ink-700 hover:bg-ink-100",
                !selected && !inMonth && "text-ink-300 hover:bg-ink-100"
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}