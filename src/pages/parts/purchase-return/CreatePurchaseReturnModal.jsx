import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import clsx from "clsx";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AsyncSearchInput from "@/components/parts/AsyncSearchInput";
import { purchaseReturnApi } from "@/services";
import { formatINR } from "@/utils/estimateMath";

const GRN_SEARCH_MIN_CHARS = 5; // same threshold as the old screen

const emptyVendor = {
  vendorCode: "",
  vendorName: "",
  vendorId: null,
  grnId: null,
};

// Same formula as the old table: cost * return qty.
function calcLineTotal(row) {
  const qty = Number(row.returnQty) || 0;
  const cost = parseFloat(row.Cost) || 0;
  return (qty * cost).toFixed(2);
}

export default function CreatePurchaseReturnModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) {
  // GRN search
  const [selectedGrn, setSelectedGrn] = useState(null);
  const [grnInput, setGrnInput] = useState("");

  // Full GRN details
  const [rows, setRows] = useState([]); // each row: API row + returnQty
  const [vendor, setVendor] = useState(emptyVendor);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  const [rowErrors, setRowErrors] = useState({}); // { [row.id]: message }
  const [errors, setErrors] = useState({}); // { grn, items }

  // Reset whenever the modal opens.
  useEffect(() => {
    if (isOpen) {
      setSelectedGrn(null);
      setGrnInput("");
      setRows([]);
      setVendor(emptyVendor);
      setRowErrors({});
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // ---- GRN ----
  async function searchGrns(query) {
    const searchKey = query.trim();
    if (searchKey.length < GRN_SEARCH_MIN_CHARS) return [];
    const res = await purchaseReturnApi.listGrns({
      searchKey,
      offset: 0,
      limit: 100,
    });
    if (!res?.requestSuccessful) return [];
    return (res?.data ?? []).map((g) => ({
      key: g.id,
      label: g.grn_no,
      sub: g.invoice_number,
      data: g,
    }));
  }

  function resetGrnDetails() {
    setSelectedGrn(null);
    setRows([]);
    setVendor(emptyVendor);
    setRowErrors({});
    setErrors({});
  }

  async function selectGrn(o) {
    const option = o.data;
    setGrnInput(option.grn_no);
    setSelectedGrn(option);
    setRows([]);
    setRowErrors({});
    setErrors({});

    setIsDetailsLoading(true);
    try {
      const res = await purchaseReturnApi.getGrnsForPurchaseReturn({
        id: option.id,
      });
      if (res?.requestSuccessful && res?.data) {
        setRows(res.data.map((r) => ({ ...r, returnQty: "" })));
        setVendor({
          vendorCode: option.vendor_code ?? "",
          vendorName: res.vendorName ?? "",
          vendorId: res.vendor_id ?? null,
          grnId: res.grnid ?? option.id,
        });
      } else {
        setErrors({ grn: "Could not load GRN details" });
      }
    } catch (err) {
      console.error("Error fetching GRN details", err);
      setErrors({ grn: "Could not load GRN details" });
    } finally {
      setIsDetailsLoading(false);
    }
  }

  // ---- return qty ----
  function handleQtyChange(rowId, value) {
    // Up to 2 decimals, no negatives / exponent.
    if (value !== "" && !/^\d*\.?\d{0,2}$/.test(value)) return;

    const row = rows.find((r) => r.id === rowId);
    const available = Number(row?.["Available Qty"]) || 0;

    if (value !== "" && Number(value) > available) {
      setRowErrors((prev) => ({
        ...prev,
        [rowId]: "Cannot exceed available qty",
      }));
      return;
    }

    setRowErrors((prev) => ({ ...prev, [rowId]: null }));
    setErrors((prev) => (prev.items ? { ...prev, items: null } : prev));
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, returnQty: value } : r)),
    );
  }

  const grandTotal = rows.reduce((s, r) => s + Number(calcLineTotal(r)), 0);

  // ---- submit ----
  function handleSubmit(e) {
    e.preventDefault();

    const newErrors = {};
    if (!selectedGrn) newErrors.grn = "Select a GRN from the list";
    else if (!rows.some((r) => Number(r.returnQty) > 0)) {
      newErrors.items = "Enter a return quantity for at least one part";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const items = rows.filter((r) => Number(r.returnQty) > 0);
    onSubmit?.({
      grnNo: selectedGrn.grn_no,
      grnId: vendor.grnId,
      vendorCode: vendor.vendorCode,
      vendorName: vendor.vendorName,
      vendorId: vendor.vendorId,
      items: items.map((r) => ({
        ...r,
        returnQty: Number(r.returnQty),
        totalAmount: calcLineTotal(r),
      })),
    });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Purchase Return"
      size="xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-purchase-return-form"
            isLoading={isSubmitting}
            disabled={rows.length === 0}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </>
      }
    >
      <form
        id="create-purchase-return-form"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6"
      >
        {/* ---------- Header ---------- */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">
              GRN No or Invoice Number <span className="text-red-500">*</span>
            </label>
            <AsyncSearchInput
              value={grnInput}
              onInputChange={(v) => {
                setGrnInput(v);
                // Typing again means a different GRN.
                if (selectedGrn) resetGrnDetails();
              }}
              fetchOptions={searchGrns}
              onSelect={selectGrn}
              placeholder={`Type ${GRN_SEARCH_MIN_CHARS}+ characters`}
              error={errors.grn}
              inputClassName="h-10 text-sm"
            />
            {errors.grn && (
              <p className="mt-1 text-xs text-danger-500">{errors.grn}</p>
            )}
          </div>
          <Input
            label="Vendor Code"
            value={vendor.vendorCode}
            readOnly
            placeholder="Filled from GRN"
            className="bg-ink-50"
          />
          <Input
            label="Vendor Name"
            value={vendor.vendorName}
            readOnly
            placeholder="Filled from GRN"
            className="bg-ink-50"
          />
          <Input
            label="Grand Total"
            value={Math.round(grandTotal)}
            readOnly
            className="bg-ink-50 font-bold"
          />
        </div>

        {/* ---------- Parts ---------- */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-900">Parts details</h3>
            {isDetailsLoading && (
              <span className="flex items-center gap-1.5 text-xs text-ink-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading GRN details...
              </span>
            )}
          </div>
          {!selectedGrn && (
            <p className="text-xs text-ink-500">
              Select a GRN first - its parts will be listed here.
            </p>
          )}
          {errors.items && (
            <p className="text-xs text-danger-500">{errors.items}</p>
          )}

          <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white">
            <table className="w-full min-w-[1000px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-ink-200 bg-[#F8F9FF] text-[11px] font-bold uppercase tracking-wider text-ink-500">
                  <th className="px-2.5 py-2.5">Parts Code</th>
                  <th className="min-w-[160px] px-2.5 py-2.5">Description</th>
                  <th className="w-24 px-2.5 py-2.5 text-center">
                    Available Qty
                  </th>
                  <th className="w-28 px-2.5 py-2.5 text-center">Return Qty</th>
                  <th className="w-24 px-2.5 py-2.5 text-right">Cost</th>
                  <th className="w-20 px-2.5 py-2.5 text-center">Discount</th>
                  <th className="w-16 px-2.5 py-2.5 text-center">CGST</th>
                  <th className="w-16 px-2.5 py-2.5 text-center">SGST</th>
                  <th className="w-16 px-2.5 py-2.5 text-center">IGST</th>
                  <th className="px-2.5 py-2.5 text-right">Total Amt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-2.5 py-6 text-center text-ink-400"
                    >
                      No parts to show
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => {
                    const available = Number(row["Available Qty"]) || 0;
                    const disabled = available <= 0;
                    const error = rowErrors[row.id];
                    return (
                      <tr
                        key={row.id}
                        className="align-top hover:bg-ink-50/50"
                      >
                        <td className="px-2.5 py-2 pt-3 font-medium text-brand-700">
                          {row["Parts Code"]}
                        </td>
                        <td className="px-2.5 py-2 pt-3 text-ink-800">
                          <span className="line-clamp-2">
                            {row.Description || "-"}
                          </span>
                        </td>
                        <td className="px-2.5 py-2 pt-3 text-center text-ink-700">
                          {available}
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            min="0"
                            max={available}
                            step="any"
                            disabled={disabled}
                            value={row.returnQty}
                            placeholder="Qty"
                            aria-label="Return quantity"
                            onKeyDown={(e) => {
                              if (["e", "E", "-", "+"].includes(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) =>
                              handleQtyChange(row.id, e.target.value)
                            }
                            className={clsx(
                              "w-full rounded border px-2 py-1 text-center text-xs text-ink-800 focus:outline-none disabled:cursor-not-allowed disabled:bg-ink-50",
                              error
                                ? "border-danger-500"
                                : "border-ink-200 focus:border-brand-600",
                            )}
                          />
                          {error && (
                            <p className="mt-0.5 text-[10px] leading-tight text-danger-500">
                              {error}
                            </p>
                          )}
                        </td>
                        <td className="px-2.5 py-2 pt-3 text-right text-ink-700">
                          {row.Cost}
                        </td>
                        <td className="px-2.5 py-2 pt-3 text-center text-ink-700">
                          {row.Discount ?? 0}
                        </td>
                        <td className="px-2.5 py-2 pt-3 text-center text-ink-700">
                          {row.CGST}
                        </td>
                        <td className="px-2.5 py-2 pt-3 text-center text-ink-700">
                          {row.SGST}
                        </td>
                        <td className="px-2.5 py-2 pt-3 text-center text-ink-700">
                          {row.IGST}
                        </td>
                        <td className="px-2.5 py-2 pt-3 text-right font-bold text-ink-900">
                          {formatINR(Number(calcLineTotal(row)) || 0)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {rows.length > 0 && (
                <tfoot>
                  <tr className="border-t border-ink-200 bg-[#F8F9FF] text-right text-xs font-bold text-ink-900">
                    <td className="px-2.5 py-2.5" colSpan={9}>
                      Grand Total
                    </td>
                    <td className="px-2.5 py-2.5 text-right">
                      {formatINR(grandTotal)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </form>
    </Modal>
  );
}