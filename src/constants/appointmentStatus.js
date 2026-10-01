import { APPOINTMENT_COLORS } from "@/pages/service/mockAppointments";
import { isMobile } from "@/utils/validators";

/** Status sent for every newly created appointment (no status picker). */
export const APPOINTMENT_CREATE_STATUS = "Confirmed";

export const STATUS_RESCHEDULED = "Appointment Rescheduled";
export const STATUS_PROCEED_TO_JOBCARD = "Proceed to Jobcard";

/** Status options when editing an appointment. */
export const APPOINTMENT_EDIT_STATUSES = Object.freeze([
  "Appointment Rescheduled",
  STATUS_PROCEED_TO_JOBCARD,
  "Not Contactable",
  "Call Back/Under Follow Up",
  "Hung Up/Refuse to Speak",
  "Service Done from Outside",
  "Service Not required",
  "Vehicle Sold",
  "Wrong Number",
  "Appointment Cancelled",

  "Others",
]);

/* ----------------------- Per-status inputs ----------------------- */

const followupDate = {
  key: "followupDate",
  label: "Follow Up Date",
  type: "date",
  minToday: true,
};
const reason = (placeholder) => ({
  key: "reason",
  label: "Reason",
  type: "text",
  placeholder,
});

export const STATUS_FIELDS = Object.freeze({
  "Appointment Rescheduled": [followupDate],
  "Not Contactable": [reason("e.g. Call was not answered")],
  "Call Back/Under Follow Up": [followupDate],
  "Hung Up/Refuse to Speak": [reason("e.g. Customer ended the call")],
  "Service Done from Outside": [
    {
      key: "serviceProvider",
      label: "Service Provider",
      type: "text",
      placeholder: "e.g. Independent Auto Care",
    },
  ],
  "Service Not required": [reason("e.g. Customer does not need service now")],
  "Vehicle Sold": [
    {
      key: "saleDate",
      group: "saleDetails",
      label: "Sale Date",
      type: "date",
      maxToday: true,
    },
    {
      key: "buyerName",
      group: "saleDetails",
      label: "Buyer Name",
      type: "text",
      placeholder: "Enter buyer name",
    },
  ],
  "Wrong Number": [
    {
      key: "correctContactNumber",
      label: "Correct Contact Number",
      type: "mobile",
      placeholder: "Enter 10-digit number",
    },
  ],
  "Appointment Cancelled": [reason("e.g. Customer cancelled the appointment")],
  Others: [],
});

export function fieldsForStatus(status) {
  return STATUS_FIELDS[status] ?? [];
}

/** Form values for one status's inputs -> its payload fields. */
export function buildStatusPayload(status, values = {}) {
  const payload = {};
  for (const field of fieldsForStatus(status)) {
    const value = String(values[field.key] ?? "").trim();
    if (field.group) {
      payload[field.group] = {
        ...(payload[field.group] ?? {}),
        [field.key]: value,
      };
    } else {
      payload[field.key] = value;
    }
  }
  return payload;
}

/** Saved booking row -> form values for every status field (flattens the
 * groups back out), used to prefill the edit form. */
export function statusValuesFromRow(row = {}) {
  const values = {};
  for (const fields of Object.values(STATUS_FIELDS)) {
    for (const field of fields) {
      const raw = field.group ? row[field.group]?.[field.key] : row[field.key];
      if (raw == null || raw === "") continue;
      values[field.key] =
        field.type === "date" ? String(raw).slice(0, 10) : String(raw);
    }
  }
  return values;
}

/** Required + format checks for the selected status's inputs. */
export function validateStatusFields(status, values = {}) {
  const errors = {};
  for (const field of fieldsForStatus(status)) {
    const value = String(values[field.key] ?? "").trim();
    if (!value) {
      errors[field.key] = `${field.label} is required.`;
    } else if (field.type === "mobile" && !isMobile(value)) {
      errors[field.key] = "Enter a valid 10-digit mobile number.";
    }
  }
  return errors;
}

/* ---------------------------- Slots ---------------------------- */

/** Length of one appointment slot. The end time sent to the backend is
 * slot start + this. */
export const APPOINTMENT_SLOT_MINUTES = 30;
/** Working day - shared by the Slot dropdown and the Day / Week calendar
 * rows, so a bookable slot always has a row on the calendar. */
export const APPOINTMENT_DAY_START = "09:00";
export const APPOINTMENT_DAY_END = "18:00"; // last slot is 5:30 - 6:00 PM
const SLOT_DAY_START = APPOINTMENT_DAY_START;
const SLOT_DAY_END = APPOINTMENT_DAY_END;

const toMin = (hhmm) => {
  const [h, m] = String(hhmm).split(":").map(Number);
  return h * 60 + m;
};
const toHHMM = (mins) =>
  `${String(Math.floor(mins / 60) % 24).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
const toLabel = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
};

/** [{ value: "09:30", label: "9:30 AM - 10:00 AM" }, ...] */
export const APPOINTMENT_SLOTS = Object.freeze(
  (() => {
    const slots = [];
    for (
      let t = toMin(SLOT_DAY_START);
      t + APPOINTMENT_SLOT_MINUTES <= toMin(SLOT_DAY_END);
      t += APPOINTMENT_SLOT_MINUTES
    ) {
      const start = toHHMM(t);
      const end = toHHMM(t + APPOINTMENT_SLOT_MINUTES);
      slots.push({
        value: start,
        label: `${toLabel(start)} - ${toLabel(end)}`,
      });
    }
    return slots;
  })(),
);

/** Slot options, keeping an already-saved time selectable even when it
 * isn't on the slot grid. */
export function slotOptionsFor(currentStart) {
  if (
    !currentStart ||
    APPOINTMENT_SLOTS.some((s) => s.value === currentStart)
  ) {
    return APPOINTMENT_SLOTS;
  }
  return [
    { value: currentStart, label: toLabel(currentStart) },
    ...APPOINTMENT_SLOTS,
  ].sort((a, b) => toMin(a.value) - toMin(b.value));
}

/** "HH:MM" end of the slot that starts at `start`. */
export function slotEnd(start) {
  return start ? toHHMM(toMin(start) + APPOINTMENT_SLOT_MINUTES) : "";
}

/* --------------------------- Colours --------------------------- */

const COLOR_KEYS = Object.keys(APPOINTMENT_COLORS);

export function colorForAppointment(id) {
  const key = String(id ?? "");
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return COLOR_KEYS[hash % COLOR_KEYS.length];
}
