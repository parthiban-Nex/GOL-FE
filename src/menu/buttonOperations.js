
export const BUTTON_OPERATIONS = Object.freeze([
  { code: 1, action: "create", label: "Create" },
  { code: 2, action: "view", label: "Read" },
  { code: 3, action: "edit", label: "Update" },
  { code: 4, action: "delete", label: "Delete" },
]);

export const BUTTON_ACTION = Object.fromEntries(
  BUTTON_OPERATIONS.map(({ code, action }) => [code, action]),
);

export function decodeButtons(buttons) {
  return new Set(
    String(buttons ?? "")
      .split(",")
      .map((n) => Number(String(n).trim()))
      .filter((n) => !Number.isNaN(n) && n !== 0),
  );
}

export function encodeButtons(codes) {
  const set = new Set(Array.from(codes ?? []).map(Number));
  return BUTTON_OPERATIONS.filter(({ code }) => set.has(code))
    .map(({ code }) => code)
    .join(",");
}
