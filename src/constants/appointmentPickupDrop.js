/**
 * Pickup & Drop on the appointment form (create + edit).
 *
 * Form keeps the datetime in <input type="datetime-local"> format
 * ("2026-10-01T09:30"); the API uses "2026-10-01 09:30:00".
 */

export const emptyPickupDrop = Object.freeze({
  pickupStatus: false,
  pickupAddress: "",
  pickupDateTime: "",
  pickupDriverId: "",
  dropoffStatus: false,
  dropOffAddress: "",
  dropOffDateTime: "",
  dropoffDriverId: "",
});

/** "2026-10-01T09:30" -> "2026-10-01 09:30:00" */
export function toApiDateTime(local) {
  if (!local) return null;
  const [date, time = "00:00"] = String(local).split("T");
  return `${date} ${time.slice(0, 5)}:00`;
}

/** "2026-10-01 09:30:00" / ISO -> "2026-10-01T09:30" */
export function toLocalDateTime(api) {
  if (!api) return "";
  const m = String(api).match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
  return m ? `${m[1]}T${m[2]}` : "";
}

/** Driver id back to the type the API gave us (numbers stay numbers). */
function toDriverId(value) {
  if (value === "" || value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) && String(n) === String(value) ? n : value;
}

/** Form values -> create / update payload fields. Details of an
 * unticked section are sent as null. */
export function buildPickupDropPayload(v) {
  const pickup = Boolean(v.pickupStatus);
  const dropoff = Boolean(v.dropoffStatus);
  return {
    pickupStatus: pickup,
    pickupDateTime: pickup ? toApiDateTime(v.pickupDateTime) : null,
    pickupAddress: pickup ? v.pickupAddress.trim() : null,
    pickupDriverId: pickup ? toDriverId(v.pickupDriverId) : null,
    dropoffStatus: dropoff,
    dropOffDateTime: dropoff ? toApiDateTime(v.dropOffDateTime) : null,
    dropOffAddress: dropoff ? v.dropOffAddress.trim() : null,
    dropoffDriverId: dropoff ? toDriverId(v.dropoffDriverId) : null,
  };
}

/** Saved booking row (same field names as the payload) -> form values. */
export function pickupDropFromRow(row = {}) {
  return {
    pickupStatus: Boolean(row.pickupStatus),
    pickupAddress: row.pickupAddress ?? "",
    pickupDateTime: toLocalDateTime(row.pickupDateTime),
    pickupDriverId:
      row.pickupDriverId != null ? String(row.pickupDriverId) : "",
    dropoffStatus: Boolean(row.dropoffStatus),
    dropOffAddress: row.dropOffAddress ?? "",
    dropOffDateTime: toLocalDateTime(row.dropOffDateTime),
    dropoffDriverId:
      row.dropoffDriverId != null ? String(row.dropoffDriverId) : "",
  };
}

/** Required fields of each ticked section; drop must be after pickup. */
export function validatePickupDrop(v) {
  const errors = {};
  if (v.pickupStatus) {
    if (!v.pickupAddress?.trim())
      errors.pickupAddress = "Pickup address is required.";
    if (!v.pickupDateTime)
      errors.pickupDateTime = "Pickup date & time is required.";
    if (!v.pickupDriverId) errors.pickupDriverId = "Pickup driver is required.";
  }
  if (v.dropoffStatus) {
    if (!v.dropOffAddress?.trim())
      errors.dropOffAddress = "Drop address is required.";
    if (!v.dropOffDateTime)
      errors.dropOffDateTime = "Drop date & time is required.";
    if (!v.dropoffDriverId) errors.dropoffDriverId = "Drop driver is required.";
  }
  if (
    v.pickupStatus &&
    v.dropoffStatus &&
    v.pickupDateTime &&
    v.dropOffDateTime &&
    v.dropOffDateTime <= v.pickupDateTime
  ) {
    errors.dropOffDateTime = "Drop must be after pickup.";
  }
  return errors;
}
