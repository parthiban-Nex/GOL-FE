export const FUEL_TYPES = Object.freeze(["Petrol", "Diesel", "CNG"]);

export const DEFAULT_FUEL_TYPE = FUEL_TYPES[0];

export const FUEL_OPTIONS = FUEL_TYPES.map((f) => ({ value: f, label: f }));

/** Yes/No flags (Contrance Flag on the vehicle details form). */
export const YES_NO_OPTIONS = Object.freeze([
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
]);

/** Job card type - Step 1 of the job card, after Fuel. */
export const JOBCARD_TYPES = Object.freeze(["RAC", "Accidental", "Minor", "Major"]);
export const JOBCARD_TYPE_OPTIONS = JOBCARD_TYPES.map((t) => ({ value: t, label: t }));