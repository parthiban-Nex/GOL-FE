
export const isRequired = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

export const isEmail = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || ""));

export const isMobile = (value) => /^[6-9]\d{9}$/.test(String(value || "").trim());

export const isPincode = (value) => /^\d{6}$/.test(String(value || "").trim());

export const minLength = (value, len) => String(value || "").length >= len;


export function validate(values, rules) {
  const errors = {};
  for (const field of Object.keys(rules)) {
    for (const [check, message] of rules[field]) {
      if (!check(values[field])) {
        errors[field] = message;
        break;
      }
    }
  }
  return errors;
}
