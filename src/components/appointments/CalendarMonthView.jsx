import { useMemo } from "react";
import clsx from "clsx";
import AppointmentCard from "@/components/appointments/AppointmentCard";
import { getMonthGrid, isSameDay } from "@/utils/dateHelpers";
import { byStartTime } from "@/components/appointments/calendarGrid";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_PER_CELL = 3;

/** 6x7 month grid with compact appointment chips inside each day cell. */
export default function CalendarMonthView({
  month,
  appointments,
  onSelect,
  onSelectDate,
}) {
  const cells = useMemo(() => getMonthGrid(month), [month]);

  const byDay = useMemo(() => {
    const map = new Map();
    for (const appt of appointments) {
      if (!appt.date) continue;
      const key = appt.date.toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(appt);
    }
    // Earliest slot first in each day (9:00, 9:30, 10:00 ...).
    for (const list of map.values()) list.sort(byStartTime);
    return map;
  }, [appointments]);

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[720px]">
        <div className="grid grid-cols-7 border-b border-ink-100">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="px-3 py-3 text-sm font-semibold text-ink-800"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((date, i) => {
            const inMonth = date.getMonth() === month.getMonth();
            const dayAppts = byDay.get(date.toDateString()) ?? [];
            const isToday = isSameDay(date, new Date());
            return (
              <button
                key={i}
                type="button"
                onClick={() => onSelectDate?.(date)}
                className={clsx(
                  "min-h-[110px] border-b border-r border-ink-100 p-2 text-left",
                  !inMonth && "bg-ink-50/40",
                  "hover:bg-brand-50/40",
                )}
              >
                <span
                  className={clsx(
                    "mb-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                    isToday
                      ? "bg-brand-800 text-white"
                      : inMonth
                        ? "text-ink-700"
                        : "text-ink-300",
                  )}
                >
                  {date.getDate()}
                </span>
                <div className="space-y-1">
                  {dayAppts.slice(0, MAX_PER_CELL).map((appt) => (
                    <AppointmentCard
                      key={appt.id}
                      appointment={appt}
                      variant="compact"
                      onClick={(e) => {
                        e?.stopPropagation?.();
                        onSelect?.(appt);
                      }}
                    />
                  ))}
                  {dayAppts.length > MAX_PER_CELL && (
                    <p className="pl-1 text-[11px] font-medium text-ink-500">
                      +{dayAppts.length - MAX_PER_CELL} more
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
