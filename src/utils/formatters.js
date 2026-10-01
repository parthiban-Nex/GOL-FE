
export function formatDate(value, options = { day: "2-digit", month: "short", year: "numeric" }) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", options);
}

export function formatPhone(value) {
  if (!value) return "-";
  const digits = String(value).replace(/\D/g, "");
  if (digits.length !== 10) return value;
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
}

export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function truncate(text = "", max = 40) {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

const BADGE_TONES = ["brand", "success", "warning", "danger", "neutral"];


export function toneForLabel(label = "") {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
  }
  return BADGE_TONES[hash % BADGE_TONES.length];
}
