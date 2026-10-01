import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { lineTotals, sumSection, formatINR } from "@/utils/estimateMath";
import Input from "@/components/ui/Input";

const CONFIG = {
  parts: {
    headers: [
      { label: "#", align: "text-left" },
      { label: "PART NO", align: "text-left" },
      { label: "PARTS NAME", align: "text-left" },
      { label: "HSN", align: "text-left" },
      { label: "QTY", align: "text-center" },
      { label: "RATE", align: "text-center" },
      { label: "SGST%", align: "text-right" },
      { label: "CGST%", align: "text-right" },
      { label: "IGST%", align: "text-right" },
      { label: "DISC%", align: "text-center" },
      { label: "TOTAL (₹)", align: "text-right" },
      { label: "", align: "center" },
    ],
    qtyKey: "qty",
    totalLabel: "Parts Total",
  },
  labour: {
    headers: [
      { label: "#", align: "text-left" },
      { label: "CODE", align: "text-left" },
      { label: "DESCRIPTION", align: "text-left" },
      { label: "TYPE", align: "text-center" },
      { label: "HRS", align: "text-center" },
      { label: "₹/HR", align: "text-center" },
      { label: "SGST%", align: "text-right" },
      { label: "CGST%", align: "text-right" },
      { label: "IGST%", align: "text-right" },
      { label: "DISC%", align: "text-center" },
      { label: "TOTAL (₹)", align: "text-right" },
      { label: "", align: "center" },
    ],
    qtyKey: "hrs",
    totalLabel: "Labour Total",
  },
  osl: {
    headers: [
      { label: "#", align: "text-left" },
      { label: "CODE", align: "text-left" },
      { label: "DESCRIPTION", align: "text-left" },
      { label: "TYPE", align: "text-center" },
      { label: "HRS", align: "text-center" },
      { label: "₹/HR", align: "text-center" },
      { label: "SGST%", align: "text-right" },
      { label: "CGST%", align: "text-right" },
      { label: "IGST%", align: "text-right" },
      { label: "DISC%", align: "text-center" },
      { label: "TOTAL (₹)", align: "text-right" },
      { label: "", align: "center" },
    ],
    qtyKey: "hrs",
    totalLabel: "OSL Total",
  },
};

export default function EstimateItemsTable({
  variant = "parts",
  rows,
  includeGST,
  onChange,
  onRemove,
}) {
  const cfg = CONFIG[variant];
  const total = sumSection(rows, includeGST).total;

  // NumberCell only calls this with a real number (never for an empty box).
  function updateCell(id, field, num) {
    if (!Number.isFinite(num)) return;
    onChange(rows.map((r) => (r.id === id ? { ...r, [field]: num } : r)));
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-ink-200 p-6 text-center text-sm text-ink-400">
        No {variant} added yet - search above to add.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-ink-100">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b border-ink-100 bg-ink-50/50 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500">
            {cfg.headers.map((h, i) => (
              <th
                key={i}
                className={`px-3 py-2.5 whitespace-nowrap ${h.align}`}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const t = lineTotals(row, includeGST);
            return (
              <tr
                key={row.id}
                className="border-b border-ink-100 last:border-b-0"
              >
                <td className="px-3 py-2.5 align-middle">
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded bg-emerald-50 px-1.5 text-xs font-semibold text-emerald-700">
                    {idx + 1}
                  </span>
                </td>
                {variant === "parts" ? (
                  <>
                    <td className="px-3 py-2.5">
                      <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-semibold text-emerald-700">
                        {row.partNo}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-ink-800">
                      {row.name}
                    </td>
                    <td className="px-3 py-2.5 text-ink-600">{row.hsn}</td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-2.5">
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs font-semibold text-blue-700">
                        {row.code}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-ink-800">
                      {row.description}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600">
                        {row.type}
                      </span>
                    </td>
                  </>
                )}
                <NumberCell
                  value={row[cfg.qtyKey]}
                  onChange={(v) => updateCell(row.id, cfg.qtyKey, v)}
                />
                <NumberCell
                  value={row.rate}
                  onChange={(v) => updateCell(row.id, "rate", v)}
                />
                <PlainNumberCell value={row.sgst} show={includeGST} />
                <PlainNumberCell value={row.cgst} show={includeGST} />
                <PlainNumberCell value={row.igst} show={includeGST} />
                <NumberCell
                  value={row.disc}
                  onChange={(v) => updateCell(row.id, "disc", v)}
                  emptyValue={0}
                />
                <td className="px-3 py-2.5 text-right font-semibold text-ink-800">
                  {t.total.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="px-3 py-2.5">
                  <button
                    onClick={() => onRemove(row.id)}
                    className="text-ink-400 hover:text-danger-500 cursor-pointer transition-colors"
                    aria-label={`Remove ${row.name || row.description}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            );
          })}
          <tr className="bg-brand-50/40">
            <td
              colSpan={cfg.headers.length - 2}
              className="px-3 py-2.5 text-right text-sm font-semibold text-ink-700"
            >
              {cfg.totalLabel}
            </td>
            <td className="px-3 py-2.5 text-right text-sm font-bold text-brand-700">
              {formatINR(total)}
            </td>
            <td />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** "02" -> "2", "007.5" -> "7.5"; "0", "0.5" and "" stay as typed. */
function normaliseNumberText(raw) {
  return raw.replace(/^0+(?=\d)/, "");
}

/**
 * Qty / Rate / Disc input. Keeps exactly what the user types while the box
 * is focused (so it can be emptied and retyped without turning into "0" /
 * "02"), saves the number as they type, and on leaving the box:
 *  - empty + emptyValue given (Disc) -> saves emptyValue (0)
 *  - empty otherwise (Qty / Rate)    -> goes back to the last value
 */
function NumberCell({ value, onChange, emptyValue }) {
  const [draft, setDraft] = useState(value == null ? "" : String(value));
  const [isEditing, setIsEditing] = useState(false);

  // Follow outside changes (reload from the server, etc.) when not typing.
  useEffect(() => {
    if (!isEditing) setDraft(value == null ? "" : String(value));
  }, [value, isEditing]);

  function handleChange(e) {
    const text = normaliseNumberText(e.target.value);
    setDraft(text);
    if (text === "" || text === ".") return; // wait for a real number
    const num = Number(text);
    if (Number.isFinite(num) && num >= 0) onChange(num);
  }

  function handleBlur() {
    setIsEditing(false);
    if (draft === "" || draft === ".") {
      if (emptyValue !== undefined) {
        onChange(emptyValue);
        setDraft(String(emptyValue));
      } else {
        setDraft(value == null ? "" : String(value));
      }
    }
  }

  return (
    <td className="px-3 w-24 py-2.5">
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        value={draft}
        onFocus={() => setIsEditing(true)}
        onChange={handleChange}
        onBlur={handleBlur}
      />
    </td>
  );
}

function PlainNumberCell({ value, show = true }) {
  return (
    <td className="px-3 py-2.5 text-center text-sm text-ink-700">
      {show ? (value ?? 0) : 0}
    </td>
  );
}
