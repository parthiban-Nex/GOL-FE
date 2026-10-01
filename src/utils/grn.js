/** /parts/GRN list + /parts/Grnpdf detail -> what the GRN screens show. */

const text = (v) => (v == null ? "" : String(v).trim());
const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** "03-08-2026" (DD-MM-YYYY) -> "2026-08-03"; ISO dates pass through. */
export function toIsoDate(value) {
  const v = text(value);
  const m = v.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  return /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : "";
}

/** "2026-05-28" -> "28-05-2026", same format as the list. */
function toDisplayDate(value) {
  const iso = toIsoDate(value);
  if (!iso) return text(value);
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

/** /parts/GRN row -> grid row. */
export function mapGrnRow(r) {
  return {
    id: r.id ?? null,
    grnNumber: text(r.grn_no),
    supplierInvoiceNumber: text(r.invoice_number),
    invoiceDate: text(r.invoice_date),
    vendorCode: text(r.vendor_code),
    grandTotal: num(r.grand_total),
  };
}

/** Vendor code + invoice date range, applied to the loaded page (the list
 * API only takes limit / offset / searchKey). */
export function filterGrnRows(rows, filters = {}) {
  return rows.filter((row) => {
    if (
      filters.vendorCode &&
      filters.vendorCode !== "ALL" &&
      row.vendorCode !== filters.vendorCode
    ) {
      return false;
    }
    const date = toIsoDate(row.invoiceDate);
    if (filters.fromDate && (!date || date < filters.fromDate)) return false;
    if (filters.toDate && (!date || date > filters.toDate)) return false;
    return true;
  });
}

/** /parts/Grnpdf response -> view model (null when it has no GRN). */
export function mapGrnDetail(response) {
  const g = response?.data?.[0];
  if (!g) return null;
  const vendor = g.grnvendormap ?? {};
  const outlet = response.outlet_details ?? {};

  return {
    grnNumber: text(g.grn_no),
    documentType: text(g.document_type),
    poNumber: text(g.pogrnmap?.po_number),
    vendorCode: text(g.vendor_code),
    vendorAddress: [
      vendor.address1,
      vendor.address2,
      vendor.city,
      vendor.state,
      vendor.pincode,
    ]
      .map(text)
      .filter(Boolean)
      .join(", "),
    vendorMobile: text(vendor.mobileNumber),
    invoiceNumber: text(g.invoice_number),
    invoiceDate: toDisplayDate(g.invoice_date),
    eSugamNo: text(g.e_sugam_no),
    transportName: text(g.transport_name),
    lrNumber: text(g.lr_number),
    lrDate: toDisplayDate(g.lr_date),
    freightCharges: num(g.frieght_charges), // backend key is spelt "frieght"
    miscCharges: num(g.mis_charges),
    totals: {
      quantity: num(g.total_quantity),
      cost: num(g.total_cost),
      discount: num(g.total_discount),
      tax: num(g.total_tax),
      grandTotal: num(g.grand_total ?? g.pdf_total),
    },
    items: (g.grnparts ?? []).map((p, i) => ({
      key: `${text(p.item_code)}-${i}`,
      itemCode: text(p.item_code),
      description: text(p.item_description),
      binLocation: p.binlocation ? text(p.binlocation) : "",
      quantity: num(p.quantity),
      cost: num(p.cost),
      discount: num(p.discount),
      tax: num(p.tax),
      total: num(p.total),
    })),
    outlet: {
      name: text(outlet.outlet_name),
      address: [
        outlet.outlet_address1,
        outlet.outlet_address2,
        outlet.outlet_city,
      ]
        .map(text)
        .filter(Boolean)
        .join(", "),
      gstin: text(outlet.outlet_gst),
      branch: text(outlet.branch),
    },
  };
}
