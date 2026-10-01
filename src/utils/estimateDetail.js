/**
 * getEstimate response (`data`) -> what the View modal and the wizard use.
 * All backend field names are read here only.
 */

/** "Rajesh null" / "Big street, null, null, 614626" -> "Rajesh" /
 * "Big street, 614626" - the backend joins null parts into its strings. */
export function cleanText(value) {
  if (value == null) return "";
  return String(value)
    .split(",")
    .map((part) =>
      part
        .replace(/\b(null|undefined)\b/gi, "")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean)
    .join(", ");
}

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const pick = (obj, ...keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
};

/** One labour / part / OSL line. Reads the display keys (description,
 * amount, ...) and the updateServiceEstimate keys (partId / laborId,
 * partNo / laborCode, partDescription / laborDescription, discountAmount). */
function mapLine(line, i) {
  // getEstimate items: { name: "NPNBSVIEOSHELDS", description: "BS6 ENGINE
  // OIL ..." } - `name` holds the part / labour CODE when a separate
  // description is present.
  const nameIsCode = line?.description != null && line?.name != null;
  return {
    key: pick(line, "id") ?? i,
    lineId: pick(line, "id"),
    // Backend id of the part / labour itself (partId / laborId in the payload).
    id: pick(
      line,
      "partId",
      "laborId",
      "labourId",
      "itemId",
      "part_id",
      "labor_id",
      "labour_id",
      "item_id",
      "itemid",
      "id",
    ),
    code: cleanText(
      pick(
        line,
        "partNo",
        "laborCode",
        "code",
        "itemCode",
        "labourCode",
        "partNumber",
        "part_no",
        "labor_code",
        "labour_code",
        "item_code",
        "lineItemCode",
      ) ?? (nameIsCode ? line.name : null),
    ),
    name: cleanText(
      pick(
        line,
        "partDescription",
        "laborDescription",
        "description",
        "name",
        "itemName",
        "partName",
        "labourDescription",
        "part_description",
        "labor_description",
        "item_description",
        "itemDescription",
      ),
    ),
    hsn: cleanText(
      pick(line, "hsnCode", "hsn", "hsn_code", "sacCode", "sac_code"),
    ),
    sac: cleanText(pick(line, "sacCode", "sac_code")),
    qty: num(pick(line, "quantity", "qty", "hours")),
    rate: num(pick(line, "rate", "unitPrice", "price")),
    singleAmount: pick(line, "singleAmount"),
    additionalMargin: num(pick(line, "additionalMargin")),
    discount: num(pick(line, "discountAmount", "discount")),
    igst: num(pick(line, "igst")),
    cgst: num(pick(line, "cgst")),
    sgst: num(pick(line, "sgst")),
    igstPct: pick(line, "igstPercent", "igstPercentage", "igstRate"),
    cgstPct: pick(line, "cgstPercent", "cgstPercentage", "cgstRate"),
    sgstPct: pick(line, "sgstPercent", "sgstPercentage", "sgstRate"),
    amount: num(pick(line, "amount", "totalAmount", "total")),
  };
}

function mapTotals(t = {}) {
  return {
    qty: num(t.qty),
    rate: num(t.rate),
    discount: num(t.discount),
    igst: num(t.igst),
    cgst: num(t.cgst),
    sgst: num(t.sgst),
    amount: num(t.amount),
  };
}

export function mapEstimateDetail(data = {}) {
  const booking = data.booking ?? {};
  const branch = data.branch ?? {};
  const customer = data.customer ?? {};
  const totals = data.totals ?? {};

  return {
    // Top-level estimate fields (getEstimate data.id / gstStatus / ...).
    estimateId: data.id ?? null,
    number: cleanText(data.serviceEstimateNumber || booking.documentName),
    status: cleanText(data.status),
    // true / false from the backend; null when it isn't sent.
    gstStatus: typeof data.gstStatus === "boolean" ? data.gstStatus : null,
    booking: {
      number: cleanText(booking.documentName),
      date: cleanText(booking.documentDate),
      branch: cleanText(booking.branch),
      outletName: cleanText(booking.outletName),
      make: cleanText(booking.make),
      model: cleanText(booking.model),
      regNo: cleanText(booking.regNo),
      kmReading: cleanText(booking.kmReading),
    },
    branch: {
      name: cleanText(branch.name),
      outletName: cleanText(branch.outletName),
      address: [branch.address, branch.city, branch.state, branch.pincode]
        .map(cleanText)
        .filter(Boolean)
        .join(", "),
      phone: cleanText(branch.phone || branch.mobile),
      email: cleanText(branch.email),
      gstin: cleanText(branch.dealerGstin),
    },
    customer: {
      name: cleanText(customer.name),
      gstin: cleanText(customer.gstin),
      address: cleanText(customer.address),
      chassisNo: cleanText(customer.chassisNo),
      serviceType: cleanText(customer.serviceType),
      insuranceCompany: cleanText(customer.insuranceCompany),
      insuranceClaimNo: cleanText(customer.insuranceClaimNo),
      insuranceExpiryDate: cleanText(customer.insuranceExpiryDate),
    },
    labours: (data.labours ?? []).map(mapLine),
    items: (data.items ?? []).map(mapLine),
    osl: (data.osl ?? data.oslLabours ?? data.oslLaborEstimate ?? []).map(
      mapLine,
    ),
    // getEstimate doesn't always send OSL - then the screen keeps its OSL
    // lines instead of treating them as deleted.
    hasOsl: ["osl", "oslLabours", "oslLaborEstimate"].some((k) =>
      Array.isArray(data[k]),
    ),
    totals: {
      labours: mapTotals(totals.labours),
      items: mapTotals(totals.items),
      grandTotal: num(totals.grandTotal),
      subTotal: num(totals.subTotal),
      taxTotal: num(totals.taxTotal),
    },
    amountInWords: cleanText(data.amountInWords),
    customerVoice: cleanText(data.customerVoice),
  };
}

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

// GST rates the backend uses - a split made only of these (total <= 28)
// is read as percentages, like the update payload (18igst: ).
const GST_RATES = new Set([0, 2.5, 3, 5, 6, 9, 12, 14, 18, 28]);

/** SGST / CGST / IGST of a saved line as percentages. Explicit percent
 * fields win; otherwise the plain values are percentages when they look
 * like GST rates, else amounts (converted using the line's taxable value). */
function gstPercents(line) {
  if (line.sgstPct != null || line.cgstPct != null || line.igstPct != null) {
    return {
      sgst: num(line.sgstPct),
      cgst: num(line.cgstPct),
      igst: num(line.igstPct),
    };
  }
  const values = [line.sgst, line.cgst, line.igst];
  if (
    values.every((v) => GST_RATES.has(v)) &&
    values.reduce((a, b) => a + b, 0) <= 28
  ) {
    return { sgst: line.sgst, cgst: line.cgst, igst: line.igst };
  }
  const base = line.qty * line.rate - line.discount;
  const pct = (v) => (base > 0 ? round2((v / base) * 100) : 0);
  return { sgst: pct(line.sgst), cgst: pct(line.cgst), igst: pct(line.igst) };
}

/** Discount: API amount (rupees) <-> wizard percent of qty x rate. */
function discountPercent(line) {
  const base = line.qty * line.rate;
  return base > 0 ? round2((line.discount / base) * 100) : 0;
}

/** Saved lines + insurance -> the wizard's parts / labour / OSL / insurance. */
export function detailToWizard(detail) {
  const stamp = Date.now();
  const common = (line, i) => ({
    id: `saved-${line.id ?? i}-${stamp}-${i}`,
    itemId: line.id,
    rate: line.rate,
    ...gstPercents(line),
    disc: discountPercent(line),
    additionalMargin: line.additionalMargin,
    singleAmount: line.singleAmount,
  });
  const labourRow = (line, i) => ({
    ...common(line, i),
    code: line.code,
    description: line.name,
    sac: line.sac || line.hsn,
    hrs: line.qty || 1,
  });

  return {
    parts: detail.items.map((line, i) => ({
      ...common(line, i),
      partNo: line.code,
      name: line.name,
      hsn: line.hsn,
      qty: line.qty || 1,
    })),
    labour: detail.labours.map(labourRow),
    osl: (detail.osl ?? []).map(labourRow),
    insurance: {
      insurer: detail.customer.insuranceCompany,
      claimNo: detail.customer.insuranceClaimNo,
      expiryDate: detail.customer.insuranceExpiryDate,
    },
  };
}

/* ------------------------- update payload ------------------------- */

const numberOr = (v) => {
  const n = Number(v);
  return v !== "" && v != null && Number.isFinite(n) ? n : (v ?? "");
};

function discountAmount(row, qty) {
  return round2(qty * Number(row.rate ?? 0) * (Number(row.disc ?? 0) / 100));
}

function labourLine(row) {
  const quantity = Number(row.hrs ?? row.qty ?? 1);
  return {
    laborId: row.itemId ?? null,
    laborCode: row.code ?? "",
    laborDescription: row.description ?? "",
    sacCode: String(row.sac ?? row.hsn ?? ""),
    quantity,
    singleAmount: Number(row.singleAmount ?? row.rate ?? 0),
    rate: Number(row.rate ?? 0),
    additionalMargin: Number(row.additionalMargin ?? 0),
    discountAmount: discountAmount(row, quantity),
    sgst: Number(row.sgst ?? 0),
    cgst: Number(row.cgst ?? 0),
    igst: Number(row.igst ?? 0),
  };
}

function partLine(row) {
  const quantity = Number(row.qty ?? 1);
  return {
    partId: row.itemId ?? null,
    partNo: row.partNo ?? "",
    partDescription: row.name ?? "",
    hsnCode: numberOr(row.hsn),
    quantity,
    rate: Number(row.rate ?? 0),
    additionalMargin: Number(row.additionalMargin ?? 0),
    discountAmount: discountAmount(row, quantity),
    sgst: Number(row.sgst ?? 0),
    cgst: Number(row.cgst ?? 0),
    igst: Number(row.igst ?? 0),
  };
}

/** Wizard estimate -> POST /serviceEstimate/updateServiceEstimate body. */
export function buildUpdatePayload(estimate) {
  return {
    id: estimate.estimateId,
    gstStatus: Boolean(estimate.includeGST),
    laborEstimate: (estimate.labour ?? []).map(labourLine),
    oslLaborEstimate: (estimate.osl ?? []).map(labourLine),
    partsEstimate: (estimate.parts ?? []).map(partLine),
  };
}

/* --------------------- Step 2 line item details --------------------- */

const LINE_ITEM_TYPE = { Part: "PART", Labour: "LABOUR", OSL: "OSL" };

/** Ticked search results -> getEstimateLineItemDetails body:
 *  { customerState, modelSegment,
 *    lineItems: [{ lineItemType: "PART" | "LABOUR" | "OSL", lineItemCode }] } */
export function buildLineItemDetailsBody(
  items,
  { customerState, modelSegment },
) {
  return {
    customerState: customerState ?? "",
    modelSegment: modelSegment ?? "",
    lineItems: items.map(({ catalog }) => ({
      lineItemType: LINE_ITEM_TYPE[catalog.kind] ?? "PART",
      lineItemCode: catalog.code,
    })),
  };
}

/** One lineItemDetails group entry -> its detail row(s). The API answers
 *  { lineItemCode, details: [{ id, itemCode, hsnCode, list, igst, ... }] };
 *  a plain row (no `details`) is used as-is. */
function flattenDetailEntries(list) {
  return (Array.isArray(list) ? list : []).flatMap((entry) => {
    if (!Array.isArray(entry?.details)) return entry ? [entry] : [];
    // First match is the item for that code.
    const first = entry.details[0];
    return first
      ? [{ ...first, lineItemCode: entry.lineItemCode ?? first.itemCode }]
      : [];
  });
}

/** getEstimateLineItemDetails response -> { "Part-77973": {...},
 *  "Part-code-706F002H280908F8": {...}, ... } so each added row can pick up
 *  its rate, HSN / SAC and GST.
 *  Response: { lineItemDetails: { parts: [{ lineItemCode, details: [...] }],
 *              labour: [...], osl: [...] } } */
export function mapLineItemDetails(response) {
  const root =
    response?.lineItemDetails ??
    response?.results ??
    response?.data ??
    response ??
    {};
  const byKey = {};

  const add = (kind, list) =>
    flattenDetailEntries(list).forEach((r) => {
      const id = pick(r, "id", "partId", "laborId", "itemId");
      const code = pick(
        r,
        "lineItemCode",
        "itemCode",
        "partNo",
        "laborCode",
        "oslCode",
        "code",
      );
      if (id == null && code == null) return;
      const taxPct = pick(r, "taxPercentage", "gstPercentage");
      const sgst = pick(r, "sgst");
      const cgst = pick(r, "cgst");
      const entry = {
        id: id ?? null, // part / labour id (partId / laborId in the update)
        // "list" is the selling rate (same as the PO getItemDetails).
        rate: pick(r, "rate", "list", "price", "singleAmount", "mrp"),
        hsn: cleanText(pick(r, "hsnCode", "hsn")),
        sac: cleanText(pick(r, "sacCode")),
        sgst,
        cgst,
        igst:
          pick(r, "igst") ??
          (taxPct != null && sgst == null && cgst == null ? taxPct : null),
      };
      // Matched by id, or by code (the request identifies items by code).
      if (id != null) byKey[`${kind}-${id}`] = entry;
      if (code != null) byKey[`${kind}-code-${String(code).trim()}`] = entry;
    });

  // Flat list answer: [{ ..., lineItemType: "PART" | "LABOUR" | "OSL" }]
  const flat = Array.isArray(root)
    ? root
    : Array.isArray(root.lineItems)
      ? root.lineItems
      : null;
  if (flat) {
    const kindOfType = {
      part: "Part",
      parts: "Part",
      labour: "Labour",
      labor: "Labour",
      osl: "OSL",
    };
    const grouped = { Part: [], Labour: [], OSL: [] };
    flat.forEach((r) => {
      const kind =
        kindOfType[String(r.lineItemType ?? r.type ?? "").toLowerCase()] ??
        (r.laborCode ? "Labour" : "Part");
      grouped[kind].push(r);
    });
    add("Part", grouped.Part);
    add("Labour", grouped.Labour);
    add("OSL", grouped.OSL);
    return byKey;
  }

  add("Part", root.parts ?? root.items);
  add("Labour", root.labour ?? root.labours);
  add("OSL", root.osl);
  return byKey;
}

/* ------------------- keep line identity on reload ------------------- */

const norm = (v) =>
  String(v ?? "")
    .trim()
    .toLowerCase();

/**
 * After a save the lines are re-read from getEstimate. When a server line
 * comes back without its part / labour id or code, take them from the
 * matching row already on screen (same id, else same code, else same
 * name, else same position), so the next update doesn't send nulls.
 */
export function keepLineIdentity(
  serverRows,
  localRows,
  { codeKey, nameKey, hsnKey, keepTax = false },
) {
  const used = new Set();
  const take = (predicate) => {
    const idx = localRows.findIndex((r, i) => !used.has(i) && predicate(r));
    if (idx === -1) return null;
    used.add(idx);
    return localRows[idx];
  };

  return serverRows.map((row, i) => {
    const hasId = row.itemId != null && row.itemId !== "";
    const hasCode = Boolean(row[codeKey]);
    if (hasId && hasCode && !keepTax) return row;

    const local =
      (hasId && take((r) => String(r.itemId) === String(row.itemId))) ||
      (hasCode && take((r) => norm(r[codeKey]) === norm(row[codeKey]))) ||
      (row[nameKey] && take((r) => norm(r[nameKey]) === norm(row[nameKey]))) ||
      (serverRows.length === localRows.length &&
        !used.has(i) &&
        take((r) => r === localRows[i]));
    if (!local) return row;

    return {
      ...row,
      // GST off: the server line has 0 tax - keep the real rates on screen.
      ...(keepTax
        ? {
            sgst: local.sgst,
            cgst: local.cgst,
            igst: local.igst,
            taxKept: true,
          }
        : {}),
      itemId: hasId ? row.itemId : (local.itemId ?? null),
      [codeKey]: hasCode ? row[codeKey] : (local[codeKey] ?? ""),
      [nameKey]: row[nameKey] || local[nameKey] || "",
      ...(hsnKey ? { [hsnKey]: row[hsnKey] || local[hsnKey] || "" } : {}),
    };
  });
}

/** Drops keepLineIdentity's internal `taxKept` marker from a row. */
export function withoutTaxKept(row) {
  if (!row || !("taxKept" in row)) return row;
  const copy = { ...row };
  delete copy.taxKept;
  return copy;
}

/**
 * Fingerprint of the lines exactly as updateServiceEstimate would send them
 * (qty, rate, discount, GST, ids ...). Two estimates with the same
 * signature have nothing new to save. Used to spot unsaved line edits.
 */
export function linesSignature(estimate) {
  const p = buildUpdatePayload({
    ...estimate,
    estimateId: null,
    includeGST: false,
  });
  return JSON.stringify([p.laborEstimate, p.oslLaborEstimate, p.partsEstimate]);
}
