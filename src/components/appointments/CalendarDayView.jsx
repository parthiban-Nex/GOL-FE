import { useMemo } from "react";
import clsx from "clsx";
import AppointmentCard from "@/components/appointments/AppointmentCard";
import { formatLong, formatTimeLabel } from "@/utils/dateHelpers";
import {
  GRID_HEIGHT,
  SLOT_HEIGHT,
  TIME_ROWS,
  byStartTime,
  placeAppointment,
} from "@/components/appointments/calendarGrid";

/** Single-day version of the week grid - 30-minute rows (9:00, 9:30 ...). */
export default function CalendarDayView({ date, appointments, onSelect }) {
  const dayAppts = useMemo(
    () =>
      appointments
        .filter((a) => a.date && a.date.toDateString() === date.toDateString())
        .sort(byStartTime),
    [appointments, date],
  );

  return (
    <div>
      <div className="grid grid-cols-[80px_1fr] border-b border-ink-100 text-xs">
        <div className="px-2 py-3 text-ink-500">Time</div>
        <div className="px-2 py-3 text-sm font-semibold text-ink-800">
          {formatLong(date, { weekday: "long", day: "numeric", month: "long" })}
        </div>
      </div>

      <div
        className="relative grid grid-cols-[80px_1fr]"
        style={{ height: GRID_HEIGHT }}
      >
        <TimeLabels />

        <div className="relative border-l border-ink-100">
          <SlotLines />
          {dayAppts.map((appt) => {
            const { top, height, spansMultipleSlots } = placeAppointment(appt);
            return (
              <div
                key={appt.id}
                className="absolute inset-x-2 max-w-md overflow-hidden"
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
      </div>
    </div>
  );
}

/** 9:00, 9:30, 10:00 ... down the left edge. */
export function TimeLabels() {
  return (
    <div className="relative">
      {TIME_ROWS.map((row, i) => (
        <div
          key={row.hhmm}
          className={clsx(
            "absolute left-0 right-0 pl-2 text-xs",
            row.isHour
              ? "font-semibold text-ink-600"
              : "font-medium text-ink-400",
          )}
          style={{ top: i * SLOT_HEIGHT }}
        >
          {formatTimeLabel(row.hhmm)}
        </div>
      ))}
    </div>
  );
}

/** Row lines: solid on the hour, dashed on the half hour. */
export function SlotLines() {
  return TIME_ROWS.map((row, i) => (
    <div
      key={row.hhmm}
      className={clsx(
        "absolute inset-x-0",
        i > 0 &&
          (row.isHour
            ? "border-t border-ink-100"
            : "border-t border-dashed border-ink-100/70"),
      )}
      style={{ top: i * SLOT_HEIGHT, height: SLOT_HEIGHT }}
    />
  ));
}
