
const ROW_KEYS = ["data", "result", "list", "items", "records", "rows"];
const TOTAL_KEYS = ["totalItems", "total", "totalCount", "count"];

/** Rows array, looked for under `envelopeKeys` first, then at the root. */
export function extractList(response, ...envelopeKeys) {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== "object") return [];

  for (const key of envelopeKeys.filter(Boolean)) {
    const envelope = response[key];
    if (Array.isArray(envelope)) return envelope;
    if (envelope && typeof envelope === "object") {
      const rows = firstArray(envelope, ROW_KEYS);
      if (rows) return rows;
    }
  }

  return firstArray(response, ROW_KEYS) ?? [];
}


export function extractTotal(response, ...envelopeKeys) {
  if (!response || typeof response !== "object") return null;

  for (const key of envelopeKeys.filter(Boolean)) {
    const envelope = response[key];
    if (envelope && typeof envelope === "object" && !Array.isArray(envelope)) {
      const total = firstNumber(envelope, TOTAL_KEYS);
      if (total !== null) return total;
    }
  }

  return firstNumber(response, TOTAL_KEYS);
}


export function isSuccess(response) {
  if (!response) return false;
  if (response.validationErrors) return false;
  if (response.resultText) return response.resultText === "Success";
  if (typeof response.requestSuccessful === "boolean") {
    return response.requestSuccessful;
  }
  if (typeof response.success === "boolean") return response.success;
  return true; 
}


export function responseMessage(response, fallback) {
  return response?.validationErrors || response?.message || fallback;
}

function firstArray(object, keys) {
  for (const key of keys) {
    if (Array.isArray(object[key])) return object[key];
  }
  return null;
}

function firstNumber(object, keys) {
  for (const key of keys) {
    const value = Number(object[key]);
    if (!Number.isNaN(value) && object[key] !== null && object[key] !== undefined) {
      return value;
    }
  }
  return null;
}
