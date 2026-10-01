import clsx from "clsx";
import { APPOINTMENT_COLORS } from "@/pages/service/mockAppointments";
import { formatTimeLabel } from "@/utils/dateHelpers";

export default function AppointmentCard({
  appointment,
  onClick,
  variant = "full",
  showRange = false,
}) {
  const color =
    APPOINTMENT_COLORS[appointment.color] || APPOINTMENT_COLORS.blue;
  const timeLabel = showRange
    ? `${formatTimeLabel(appointment.start)} - ${formatTimeLabel(appointment.end).replace(/ (AM|PM)$/, "")}`
    : formatTimeLabel(appointment.start);

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={onClick}
        className={clsx(
          "flex w-full items-center cursor-pointer gap-1.5 truncate rounded px-1.5 py-1 text-left text-[11px] font-medium transition-colors",
          color.bg,
          "hover:brightness-95",
        )}
        title={`${timeLabel} · ${appointment.customer}`}
      >
        <span
          className={clsx("h-1.5 w-1.5 shrink-0 rounded-full", color.bar)}
          aria-hidden="true"
        />
        <span className={clsx("shrink-0", color.time)}>
          {formatTimeLabel(appointment.start).replace(/^0/, "")}
        </span>
        <span className="truncate text-ink-700">{appointment.customer}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "flex w-full flex-col cursor-pointer gap-0.5 rounded-md border-l-[3px] p-2 text-left transition-shadow hover:shadow-card",
        color.bg,
        color.border,
      )}
    >
      <span className={clsx("text-[11px] font-semibold", color.time)}>
        {timeLabel}
      </span>
      <span className="truncate text-sm font-semibold text-ink-800">
        {appointment.customer}
      </span>
      <span className="truncate text-xs text-ink-500">
        {appointment.vehicle}
      </span>
      <span className="truncate text-xs text-ink-500">
        {appointment.service}
      </span>
    </button>
  );
}
