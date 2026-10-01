
import {
  APPOINTMENT_DAY_END,
  APPOINTMENT_DAY_START,
  APPOINTMENT_SLOT_MINUTES,
} from "@/constants/appointmentStatus";
import { toMinutes } from "@/utils/dateHelpers";

export const DAY_START_MIN = toMinutes(APPOINTMENT_DAY_START);
export const DAY_END_MIN = toMinutes(APPOINTMENT_DAY_END);
export const SLOT_MIN = APPOINTMENT_SLOT_MINUTES;
/** Height of one 30-minute row (px). */
export const SLOT_HEIGHT = 100;

/** Every row start, including the closing time as the last label:
 *  [{ minutes, hhmm, isHour }] */
export const TIME_ROWS = Array.from(
  { length: (DAY_END_MIN - DAY_START_MIN) / SLOT_MIN + 1 },
  (_, i) => {
    const minutes = DAY_START_MIN + i * SLOT_MIN;
    const hhmm = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
    return { minutes, hhmm, isHour: minutes % 60 === 0 };
  },
);

export const GRID_HEIGHT = TIME_ROWS.length * SLOT_HEIGHT;

/** Pixel top / height of an appointment inside the grid. */
export function placeAppointment(appt) {
  const start = appt.start ? toMinutes(appt.start) : DAY_START_MIN;
  const end = appt.end ? toMinutes(appt.end) : start + SLOT_MIN;
  const duration = Math.max(SLOT_MIN, end - start);

  const rawTop = ((start - DAY_START_MIN) / SLOT_MIN) * SLOT_HEIGHT;
  const top = Math.min(Math.max(rawTop, 0), GRID_HEIGHT - SLOT_HEIGHT);
  const rawHeight = (duration / SLOT_MIN) * SLOT_HEIGHT - 8;
  const height = Math.min(
    Math.max(rawHeight, SLOT_HEIGHT - 8),
    GRID_HEIGHT - top - 4,
  );

  return { top: top + 4, height, spansMultipleSlots: duration > SLOT_MIN };
}

/** Appointments of one day, earliest first. */
export function byStartTime(a, b) {
  return (
    (a.start ? toMinutes(a.start) : 0) - (b.start ? toMinutes(b.start) : 0)
  );
}
