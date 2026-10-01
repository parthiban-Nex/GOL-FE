/** Purchase Order: list rows, vendor, GetPOForView and the createPO payload. */

const text = (v) => (v == null ? "" : String(v).trim());
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/** "17-07-2026" <-> "2026-07-17" (date input). */
export function ddmmyyyyToIso(value) {
  const m = text(value).match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return /^\d{4}-\d{2}-\d{2}/.test(text(value)) ? text(value).slice(0, 10) : "";
}
export function isoToDdmmyyyy(value) {
  const m = text(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : text(value);
}

/** getPO row -> grid row. */
export function mapPoRow(r) {
  return {
    id: r.id ?? null,
    poNumber: text(r.po_number),
    branch: text(r.Branch ?? r.branch),
    vendorCode: text(r.vendor_code),
    validTillDate: text(r.valid_till_date),
    status: text(r.status),
  };
}

function joinAddress(...parts) {
  return parts.map(text).filter(Boolean).join(", ");
}

/** listVendorsForPo row -> selected vendor. */
export function mapVendor(v) {
  return {
    vendorId: v.id ?? null,
    vendorCode: text(v.vendorCode),
    vendorName: text(v.vendorName),
    vendorAddress: joinAddress(
      v.address1,
      v.address2,
      v.areaName,
      v.city,
      v.state,
      v.pincode,
    ),
    gstin: text(v.gstin),
    state: text(v.state),
    itemGroupCodes: Array.isArray(v.itemGroupCodes) ? v.itemGroupCodes : [],
  };
}

let rowSeq = 0;
export function emptyPartRow() {
  rowSeq += 1;
  return {
    key: `row-${Date.now()}-${rowSeq}`,
    itemId: null,
    itemCode: "",
    description: "",
    hsnCode: "",
    makeId: "",
    modelId: "",
    categoryId: "",
    vinNumber: "",
    regNo: "",
    quantity: 1,
    rate: "",
    cost: "",
    mrp: "",
    discount: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    remarks: "",
  };
}

/** (qty x cost - discount amount) + CGST/SGST/IGST.
 *  e.g. 11 x 966.12 - 10 = 10617.32, +18% = 12528.44 */
export function lineTotal(row) {
  const base = Math.max(
    0,
    num(row.quantity) * num(row.cost) - num(row.discount),
  );
  const taxPct = num(row.cgst) + num(row.sgst) + num(row.igst);
  return round2(base * (1 + taxPct / 100));
}

/** getItemDetails itemsData[0] -> row fields. */
export function itemDetailsToRow(d) {
  return {
    itemId: d.id ?? null,
    itemCode: text(d.itemCode),
    description: text(d.itemDescription || d.itemName),
    hsnCode: text(d.hsnCode),
    rate: num(d.list),
    cost: num(d.cost),
    mrp: num(d.mrp),
    cgst: num(d.cgst),
    sgst: num(d.sgst),
    igst: num(d.igst),
  };
}

/** GetPOForView data[0] -> { header, vendor, parts } for the form / view. */
export function mapPoDetail(po) {
  if (!po) return null;
  return {
    id: po.id ?? null,
    poNumber: text(po.po_number),
    createdAt: po.createdAt ?? null,
    validTillDate: ddmmyyyyToIso(po.valid_till_date),
    invoicePdfUrl: text(po.invoice_pdf_signin_url || po.invoice_pdf_url),
    vendor: {
      vendorId: po.vendor_id ?? null,
      vendorCode: text(po.vendor_code),
      vendorName: text(po.vendorName),
      vendorAddress: joinAddress(
        po.address1,
        po.address2,
        po.areaName,
        po.city,
        po.state,
        po.pincode,
      ),
      gstin: text(po.gstin),
      state: text(po.state),
      itemGroupCodes: Array.isArray(po.itemGroupCodes) ? po.itemGroupCodes : [],
    },
    parts: (po.po_parts ?? []).map((p) => ({
      ...emptyPartRow(),
      itemId: p.itemid ?? null,
      itemCode: text(p["Parts Code"]),
      description: text(p.Description),
      hsnCode: text(p["HSN Code"]),
      makeId: p.Make_Id != null ? String(p.Make_Id) : "",
      makeName: text(p.Make),
      modelId: p.Model_Id != null ? String(p.Model_Id) : "",
      modelName: text(p.Model),
      categoryId:
        p.Parts_Category_Id != null ? String(p.Parts_Category_Id) : "",
      categoryName: text(p["Parts Category"]),
      vinNumber: text(p["Vin Number"]),
      regNo: text(p["Reg No"]),
      quantity: num(p.Quantity),
      rate: num(p.Rate),
      cost: num(p.Cost),
      mrp: num(p.MRP),
      discount: num(p["Discount Amount"]),
      cgst: num(p.CGST),
      sgst: num(p.SGST),
      igst: num(p.IGST),
      remarks: text(p.remarks),
      savedTotal: num(p["Total Amount"]),
    })),
  };
}

const toNumOrNull = (v) => (v === "" || v == null ? null : Number(v));

/** Form -> createPO podata / poparts (see partsApi.savePo). */
export function buildPoPayload({ poId, validTillDate, vendor, parts }) {
  const podata = {
    ...(poId ? { id: poId } : {}),
    valid_till_date: isoToDdmmyyyy(validTillDate),
    vendor_id: vendor.vendorId,
    vendor_code: vendor.vendorCode,
  };
  const poparts = parts.map((p) => ({
    ...(poId ? { po_id: poId } : {}),
    item_id: p.itemId,
    item_code: p.itemCode,
    item_description: p.description,
    quantity: num(p.quantity),
    back_order_quantity: num(p.quantity),
    hsncode: toNumOrNull(p.hsnCode) ?? p.hsnCode,
    make_id: toNumOrNull(p.makeId),
    model_id: toNumOrNull(p.modelId),
    part_category_id: toNumOrNull(p.categoryId),
    vin_number: text(p.vinNumber),
    reg_no: text(p.regNo),
    rate: num(p.rate),
    cost: num(p.cost),
    mrp: num(p.mrp),
    discount: num(p.discount),
    cgst: num(p.cgst),
    sgst: num(p.sgst),
    igst: num(p.igst),
    total: lineTotal(p),
    remarks: text(p.remarks),
  }));
  return { podata, poparts };
}

/** Row fields that must be filled (labels for the error list). */
export function validatePart(p) {
  const errors = {};
  if (!p.itemId) errors.itemCode = "Select a part code";
  if (!p.makeId) errors.makeId = "Make is required";
  if (!p.modelId) errors.modelId = "Model is required";
  if (!text(p.regNo)) errors.regNo = "Reg No is required";
  if (!(num(p.quantity) > 0)) errors.quantity = "Quantity must be more than 0";
  if (!(num(p.rate) > 0)) errors.rate = "Rate is required";
  if (!(num(p.cost) > 0)) errors.cost = "Cost is required";
  if (!(num(p.mrp) > 0)) errors.mrp = "MRP is required";
  return errors;
}
