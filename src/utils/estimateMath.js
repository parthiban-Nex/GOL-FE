
function baseValue(row) {
  const q = Number(row.qty ?? row.hrs ?? 0);
  const r = Number(row.rate ?? 0);
  return q * r;
}

function taxRate(row) {
  return Number(row.sgst ?? 0) + Number(row.cgst ?? 0) + Number(row.igst ?? 0);
}

export function lineTotals(row, includeGST = true) {
  const base = baseValue(row);
  const disc = Number(row.disc ?? 0);
  const afterDisc = base * (1 - disc / 100);
  const discAmt = base - afterDisc;
  const tax = includeGST ? afterDisc * (taxRate(row) / 100) : 0;
  return {
    base,
    discAmt,
    afterDisc,
    tax,
    total: afterDisc + tax,
  };
}

export function sumSection(rows, includeGST = true) {
  return rows.reduce(
    (acc, row) => {
      const t = lineTotals(row, includeGST);
      acc.total += t.total;
      acc.tax += t.tax;
      acc.discount += t.discAmt;
      return acc;
    },
    { total: 0, tax: 0, discount: 0 }
  );
}

export function estimateTotals({ parts = [], labour = [], osl = [], includeGST = true }) {
  const p = sumSection(parts, includeGST);
  const l = sumSection(labour, includeGST);
  const o = sumSection(osl, includeGST);
  const subTotal = p.total + l.total + o.total;
  return {
    parts: p.total,
    labour: l.total,
    osl: o.total,
    subTotal,
    discount: p.discount + l.discount + o.discount,
    tax: p.tax + l.tax + o.tax,
    grandTotal: subTotal,
    counts: { parts: parts.length, labour: labour.length, osl: osl.length },
  };
}

export function formatINR(value) {
  const n = Number(value ?? 0);
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}