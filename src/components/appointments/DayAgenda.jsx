import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { APPOINTMENT_COLORS, STATUS_BADGE } from "@/pages/service/mockAppointments";
import { formatLong, formatTimeLabel } from "@/utils/dateHelpers";


export default function DayAgenda({ date, appointments, onView, onSelect }) {
  const label = formatLong(date, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <h3 className="mb-4 text-sm font-semibold text-ink-800">{label}</h3>

      {appointments.length === 0 ? (
        <p className="text-sm text-ink-400">No appointments scheduled for this day.</p>
      ) : (
        <ul className="space-y-4">
          {appointments.map((appt) => {
            const color = APPOINTMENT_COLORS[appt.color] || APPOINTMENT_COLORS.blue;
            return (
              <li key={appt.id}>
                <button
                  type="button"
                  onClick={() => onSelect?.(appt)}
                  className="flex w-full items-center gap-3 text-left cursor-pointer "
                >
                  <span className="w-16 shrink-0 text-xs font-medium text-ink-500">
                    {formatTimeLabel(appt.start)}
                  </span>
                  <span className={clsx("h-9 w-0.5 shrink-0 rounded-full", color.bar)} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-800">{appt.customer}</p>
                    <p className="truncate text-xs text-ink-500">{appt.vehicle}</p>
                  </div>
                  <span
                    className={clsx(
                      "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium",
                      STATUS_BADGE[appt.status] ?? "bg-ink-100 text-ink-600"
                    )}
                  >
                    {appt.status}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={onView}
        className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 cursor-pointer"
      >
        View All Appointments <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}