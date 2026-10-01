import { useMemo } from "react";
import AppointmentCard from "@/components/appointments/AppointmentCard";
import { addTime } from "@/utils/dateHelpers";
import {
  GRID_HEIGHT,
  byStartTime,
  placeAppointment,
} from "@/components/appointments/calendarGrid";
import {
  SlotLines,
  TimeLabels,
} from "@/components/appointments/CalendarDayView";
const DAY_HEADERS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function CalendarWeekView({
  weekStart,
  appointments,
  onSelect,
}) {
  const dayDates = useMemo(
    () => Array.from({ length: 6 }, (_, i) => addTime(weekStart, i, "day")),
    [weekStart],
  );

  const byDay = useMemo(() => {
    const map = new Map();
    for (const appt of appointments) {
      if (!appt.date) continue;
      const key = appt.date.toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(appt);
    }
    return map;
  }, [appointments]);

  const gridHeight = GRID_HEIGHT;

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[840px]">
        <div className="grid grid-cols-[80px_repeat(6,minmax(0,1fr))] border-b border-ink-100 text-xs">
          <div className="px-2 py-3 text-ink-500">Time</div>
          {dayDates.map((date, i) => (
            <div
              key={i}
              className="px-2 py-3 text-center text-sm font-semibold text-ink-800"
            >
              {DAY_HEADERS[i]}
            </div>
          ))}
        </div>

        <div
          className="relative grid grid-cols-[80px_repeat(6,minmax(0,1fr))] overflow-hidden"
          style={{ height: gridHeight }}
        >
          <TimeLabels />

          {dayDates.map((date, colIdx) => {
            const dayAppts = [...(byDay.get(date.toDateString()) ?? [])].sort(
              byStartTime,
            );
            return (
              <div key={colIdx} className="relative border-l border-ink-100">
                <SlotLines />
                {dayAppts.map((appt) => {
                  const { top, height, spansMultipleSlots } =
                    placeAppointment(appt);
                  return (
                    <div
                      key={appt.id}
                      className="absolute inset-x-1 overflow-hidden"
                      style={{ top, height }}
                    >
                      <AppointmentCard
                        appointment={appt}
                        onClick={() => onSelect?.(appt)}
                        showRange={spansMultipleSlots}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
