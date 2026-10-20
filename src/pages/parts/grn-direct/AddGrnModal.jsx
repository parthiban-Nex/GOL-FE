import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AsyncSearchInput from "@/components/parts/AsyncSearchInput";
import { grnApi } from "@/services";
import { formatINR } from "@/utils/estimateMath";
import { GRN_NAME_OPTIONS } from "../mockPartsData";
import BinLocationModal from "./BinLocationModal";

// ---- shared cell styles (same as the Purchase Order modal) ----
const cellInput =
  "w-full rounded border px-2 py-1 text-xs text-ink-800 focus:outline-none disabled:bg-ink-50";
const cellCls = (hasError) =>
  clsx(
    cellInput,
    hasError ? "border-danger-500" : "border-ink-200 focus:border-brand-600",
  );

// Exported so EditGrnModal can reuse them.
export const createEmptyItem = () => ({
  rowId: crypto.randomUUID(), // stable key, so per-row state survives deletes
  itemId: 0,
  partNo: "",
  description: "",
  supInvQty: 1,
  receivedQty: 1,
  cost: 0,
  mrp: 0,
  rate: 0,
  discount: 0,
  cgst: 0,
  sgst: 0,
  igst: 0,
  totalAmount: "0.00",
  bins: [], // [{ binId, binLocation, quantity }]
});

// ((qty * cost) - discount) + tax, where tax = CGST + SGST + IGST percentages
export function calcLineTotal(item) {
  const qty = Number(item.receivedQty) || 0;
  const cost = Number(item.cost) || 0;
  const discount = Number(item.discount) || 0;
  const taxPct =
    (Number(item.cgst) || 0) +
    (Number(item.sgst) || 0) +
    (Number(item.igst) || 0);
  const base = Math.max(qty * cost - discount, 0);
  return (base + (base * taxPct) / 100).toFixed(2);
}

// True when the saved bins add up to the received qty.
export function isBinsComplete(row) {
  const bins = row.bins ?? [];
  if (bins.length === 0) return false;
  const total = bins.reduce((s, b) => s + (Number(b.quantity) || 0), 0);
  return (
    Number(total.toFixed(2)) ===
    Number((Number(row.receivedQty) || 0).toFixed(2))
  );
}

const emptyFormData = {
  grandTotal: "0.00",
  grnName: GRN_NAME_OPTIONS[0]?.value ?? "",
  vendorCode: "", // holds the selected vendor id
  supplierInvoiceNumber: "",
  invoiceDate: "",
  invoiceAmount: "",
  eSugamNumber: "",
  lrNumber: "",
  lrDate: "",
  transportName: "",
  freightCharges: "0.00",
  miscellaneousCharges: "0.00",
};

/**
 * Part No search for a single row (built on AsyncSearchInput, like the PO modal).
 * Searches grnApi.searchItemDetails as the user types (min 3 chars).
 * Selection is reported via onSelect(item | null); the parent fetches details.
 * Typing after a part is selected resets the row (onSelect(null)).
 */
export function PartNoAutocomplete({ value, disabled, onSelect, error }) {
  const [text, setText] = useState(value || "");

  // Keep the text in sync when the row is populated from outside.
  useEffect(() => {
    if (value) setText(value);
  }, [value]);

  async function fetchOptions(query) {
    const searchKey = query.trim();
    if (searchKey.length < 3) return [];
    const res = await grnApi.searchItemDetails({ itemCode: searchKey });
    if (!res?.requestSuccessful) return [];
    return (res.itemSearchData ?? []).map((it) => ({
      key: it.itemCode,
      label: it.itemCode,
      sub: it.itemName,
      data: it,
    }));
  }

  return (
    <AsyncSearchInput
      value={text}
      onInputChange={(v) => {
        setText(v);
        // Typing again means a different part.
        if (value) onSelect(null);
      }}
      fetchOptions={fetchOptions}
      onSelect={(o) => onSelect(o.data)}
      placeholder={disabled ? "Select vendor first" : "Type part code"}
      disabled={disabled}
      error={error}
    />
  );
}

export default function AddGrnModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}) {
  const [formData, setFormData] = useState(emptyFormData);
  const [items, setItems] = useState(() => [createEmptyItem()]);
  const [errors, setErrors] = useState({});

  // rowId of the line whose bin locations are being edited (null = closed)
  const [binRowId, setBinRowId] = useState(null);

  // rowIds whose part details are being fetched
  const [detailLoadingKeys, setDetailLoadingKeys] = useState(() => new Set());

  // Vendor state
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorInput, setVendorInput] = useState("");
  const [invoicePdf, setInvoicePdf] = useState(null);

  // Reset everything when the modal opens.
  useEffect(() => {
    if (isOpen) {
      setFormData(emptyFormData);
      setItems([createEmptyItem()]);
      setErrors({});
      setBinRowId(null);
      setDetailLoadingKeys(new Set());
      setSelectedVendor(null);
      setVendorInput("");
      setInvoicePdf(null);
    }
  }, [isOpen]);

  // Recalculate grand total.
  useEffect(() => {
    const itemsSum = items.reduce(
      (acc, it) => acc + (Number(it.totalAmount) || 0),
      0,
    );
    const freight = Number(formData.freightCharges) || 0;
    const misc = Number(formData.miscellaneousCharges) || 0;
    const total = (itemsSum + freight + misc).toFixed(2);
    setFormData((prev) => ({ ...prev, grandTotal: total }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, formData.freightCharges, formData.miscellaneousCharges]);

  if (!isOpen) return null;

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  }

  // ---- vendor ----
  async function searchVendors(query) {
    const searchKey = query.trim();
    if (!searchKey) return [];
    const res = await grnApi.getVendor({ searchKey, offset: 0, limit: 10 });
    if (!res?.requestSuccessful) return [];
    return (res?.vendorData?.data ?? []).map((v) => ({
      key: v.id,
      label: v.vendorCode,
      sub: v.vendorName,
      data: v,
    }));
  }

  function handleVendorChange(vendor) {
    setSelectedVendor(vendor);
    handleChange("vendorCode", vendor?.id ?? "");
    // Tax split (CGST/SGST vs IGST) depends on the vendor state,
    // so previously fetched part details are no longer valid.
    setItems([createEmptyItem()]);
  }

  function selectVendor(option) {
    setVendorInput(option.data.vendorCode);
    handleVendorChange(option.data);
  }

  // ---- parts ----
  function handleItemChange(index, field, value) {
    setItems((prev) => {
      const copy = [...prev];
      const target = { ...copy[index], [field]: value };

      // Recalculate line total if qty, cost or discount changes.
      if (field === "receivedQty" || field === "cost" || field === "discount") {
        target.totalAmount = calcLineTotal(target);
      }

      // A new received qty invalidates the saved bin split.
      if (field === "receivedQty") {
        target.bins = [];
      }

      copy[index] = target;
      return copy;
    });
    if (errors.items) {
      setErrors((prev) => ({ ...prev, items: null }));
    }
  }

  async function handlePartSelect(index, option) {
    // Cleared -> reset the row but keep its rowId
    if (!option) {
      setItems((prev) => {
        const copy = [...prev];
        copy[index] = { ...createEmptyItem(), rowId: copy[index].rowId };
        return copy;
      });
      return;
    }

    const rowId = items[index]?.rowId;
    setDetailLoadingKeys((s) => new Set(s).add(rowId));
    try {
      const response = await grnApi.getItemDetails({
        itemCode: option.itemCode,
        modelSegment: "",
        customerState: selectedVendor?.state,
      });

      const detail = response?.itemsData?.[0];
      if (!response?.requestSuccessful || !detail) return;

      setItems((prev) =>
        prev.map((row) => {
          if (row.rowId !== rowId) return row;
          const target = {
            ...row,
            itemId: detail.id,
            partNo: option.itemCode,
            description: detail.itemDescription ?? option.itemName ?? "",
            cost: detail.cost ?? 0,
            rate: detail.list ?? 0,
            mrp: detail.mrp ?? 0,
            discount: 0,
            cgst: detail.cgst ?? 0,
            sgst: detail.sgst ?? 0,
            igst: detail.igst ?? 0,
            bins: [], // a different part means the old bin split no longer applies
          };
          target.totalAmount = calcLineTotal(target);
          return target;
        }),
      );
      setErrors((prev) => (prev.items ? { ...prev, items: null } : prev));
    } catch (err) {
      console.error("Error fetching part details", err);
    } finally {
      setDetailLoadingKeys((s) => {
        const next = new Set(s);
        next.delete(rowId);
        return next;
      });
    }
  }

  function handleSaveBins(bins) {
    setItems((prev) =>
      prev.map((it) => (it.rowId === binRowId ? { ...it, bins } : it)),
    );
    setBinRowId(null);
    setErrors((prev) => (prev.items ? { ...prev, items: null } : prev));
  }

  function handleAddPartRow() {
    setItems((prev) => [...prev, createEmptyItem()]);
  }

  function handleRemovePartRow(index) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  // ---- submit ----
  function handleSubmit(e) {
    e.preventDefault();

    const newErrors = {};
    if (!formData.grnName) newErrors.grnName = "GRN Name is required";
    if (!selectedVendor) newErrors.vendorCode = "Select a vendor from the list";
    if (!formData.supplierInvoiceNumber) {
      newErrors.supplierInvoiceNumber = "Supplier Invoice Number is required";
    }
    if (items.some((it) => !it.itemId || !it.partNo)) {
      newErrors.items = "Select a part for every row";
    } else if (items.some((it) => !isBinsComplete(it))) {
      newErrors.items =
        "Select bin locations for every row (bin quantities must match Received Qty)";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit?.({
      ...formData,
      vendorId: selectedVendor.id,
      vendorCode: selectedVendor.vendorCode,
      vendorState: selectedVendor.state,
      invoicePdf,
      // First bin feeds the single binId / binLocation fields on the grn part;
      // the full split stays in `bins` for bindata.
      // Each item also carries rate, mrp, discount, cgst, sgst and igst.
      items: items.map((it) => ({
        ...it,
        binId: it.bins[0]?.binId,
        binLocation: it.bins[0]?.binLocation,
      })),
    });
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Add GRN"
        size="xl"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-auto-grn-form"
              isLoading={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </>
        }
      >
        <form
          id="add-auto-grn-form"
          onSubmit={handleSubmit}
          noValidate
          className="space-y-6"
        >
          {/* ---------- Header ---------- */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700">
                  GRN Name <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.grnName}
                  onChange={(e) => handleChange("grnName", e.target.value)}
                  className={clsx(
                    "h-10 w-full rounded-md border bg-white px-3 text-sm text-ink-800 focus:outline-none",
                    errors.grnName
                      ? "border-danger-500"
                      : "border-ink-200 focus:border-brand-600",
                  )}
                  aria-label="GRN Name"
                >
                  {GRN_NAME_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
                {errors.grnName && (
                  <p className="mt-1 text-xs text-danger-500">
                    {errors.grnName}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700">
                  Vendor Code <span className="text-red-500">*</span>
                </label>
                <AsyncSearchInput
                  value={vendorInput}
                  onInputChange={(v) => {
                    setVendorInput(v);
                    // Typing again means a different vendor.
                    if (selectedVendor) handleVendorChange(null);
                  }}
                  fetchOptions={searchVendors}
                  onSelect={selectVendor}
                  placeholder="Type vendor code"
                  error={errors.vendorCode}
                  inputClassName="h-10 text-sm"
                />
              </div>
              <Input
                label="Vendor Name"
                value={selectedVendor?.vendorName ?? ""}
                readOnly
                placeholder="Filled from vendor"
                className="bg-ink-50"
              />
              <Input
                label="Supplier Invoice Number"
                required
                value={formData.supplierInvoiceNumber}
                onChange={(e) =>
                  handleChange("supplierInvoiceNumber", e.target.value)
                }
                placeholder="e.g. CSCR-VLR-0010"
                error={errors.supplierInvoiceNumber}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="Vendor Address"
                value={
                  selectedVendor?.vendorAddress ?? selectedVendor?.address ?? ""
                }
                readOnly
                placeholder="Filled from vendor"
                className="bg-ink-50"
                title={
                  selectedVendor?.vendorAddress ?? selectedVendor?.address
                }
              />
              <Input
                label="Vendor GSTIN Number"
                value={selectedVendor?.gstin ?? selectedVendor?.gstNumber ?? ""}
                readOnly
                placeholder="Filled from vendor"
                className="bg-ink-50"
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700">
                  Supplier Invoice Pdf <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-ink-200 bg-ink-50 px-3 py-1.5 text-xs font-medium text-ink-800 transition-colors hover:bg-ink-100">
                    Choose file
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      className="hidden"
                      onChange={(e) => {
                        setInvoicePdf(e.target.files?.[0] ?? null);
                        if (errors.invoicePdf) {
                          setErrors((prev) => ({ ...prev, invoicePdf: null }));
                        }
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <span className="max-w-[180px] truncate text-xs text-ink-500">
                    {invoicePdf ? invoicePdf.name : "No file chosen"}
                  </span>
                </div>
                {errors.invoicePdf && (
                  <p className="mt-1 text-xs text-danger-500">
                    {errors.invoicePdf}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                type="date"
                label="Invoice Date"
                value={formData.invoiceDate}
                onChange={(e) => handleChange("invoiceDate", e.target.value)}
              />
              <Input
                type="number"
                step="0.01"
                label="Invoice Amount"
                value={formData.invoiceAmount}
                onChange={(e) => handleChange("invoiceAmount", e.target.value)}
                placeholder="0.00"
              />
              <Input
                label="ESugam Road Permit Number"
                value={formData.eSugamNumber}
                onChange={(e) => handleChange("eSugamNumber", e.target.value)}
                placeholder="e.g. ESUGAM-99201"
              />
              <Input
                label="LR Number"
                value={formData.lrNumber}
                onChange={(e) => handleChange("lrNumber", e.target.value)}
                placeholder="e.g. LR-89201"
              />
              <Input
                type="date"
                label="LR Date"
                value={formData.lrDate}
                onChange={(e) => handleChange("lrDate", e.target.value)}
              />
              <Input
                label="Transport Name"
                value={formData.transportName}
                onChange={(e) => handleChange("transportName", e.target.value)}
                placeholder="e.g. SafeXpress Logistics"
              />
              <Input
                type="number"
                step="0.01"
                label="Freight Charges"
                value={formData.freightCharges}
                onChange={(e) => handleChange("freightCharges", e.target.value)}
                placeholder="0.00"
              />
              <Input
                type="number"
                step="0.01"
                label="Miscellaneous Charges"
                value={formData.miscellaneousCharges}
                onChange={(e) =>
                  handleChange("miscellaneousCharges", e.target.value)
                }
                placeholder="0.00"
              />
            </div>
          </div>

          {/* ---------- Parts ---------- */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink-900">Parts details</h3>
              <Button
                type="button"
                size="sm"
                icon={Plus}
                onClick={handleAddPartRow}
                disabled={!selectedVendor}
              >
                Add Parts Details
              </Button>
            </div>
            {!selectedVendor && (
              <p className="text-xs text-ink-500">
                Select a vendor first - part prices and GST depend on the
                vendor&apos;s state.
              </p>
            )}
            {errors.items && (
              <p className="text-xs text-danger-500">{errors.items}</p>
            )}

            <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white">
              <table className="w-full min-w-[1500px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-ink-200 bg-[#F8F9FF] text-[11px] font-bold uppercase tracking-wider text-ink-500">
                    <th className="w-44 px-2.5 py-2.5">Parts No *</th>
                    <th className="min-w-[160px] px-2.5 py-2.5">Description</th>
                    <th className="w-20 px-2.5 py-2.5 text-center">
                      Sup Inv Qty
                    </th>
                    <th className="w-20 px-2.5 py-2.5 text-center">
                      Received Qty
                    </th>
                    <th className="w-24 px-2.5 py-2.5 text-right">Cost</th>
                    <th className="w-24 px-2.5 py-2.5 text-right">Rate</th>
                    <th className="w-24 px-2.5 py-2.5 text-right">MRP</th>
                    <th className="w-24 px-2.5 py-2.5 text-right">Discount</th>
                    <th className="w-16 px-2.5 py-2.5 text-center">CGST %</th>
                    <th className="w-16 px-2.5 py-2.5 text-center">SGST %</th>
                    <th className="w-16 px-2.5 py-2.5 text-center">IGST %</th>
                    <th className="w-24 px-2.5 py-2.5 text-center">
                      Bin Location
                    </th>
                    <th className="px-2.5 py-2.5 text-right">Total Amt</th>
                    <th className="w-8 px-1.5 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {items.map((row, idx) => {
                    const isFetching = detailLoadingKeys.has(row.rowId);
                    const binsDone = isBinsComplete(row);
                    return (
                      <tr
                        key={row.rowId}
                        className="align-top hover:bg-ink-50/50"
                      >
                        <td className="px-2 py-2">
                          <PartNoAutocomplete
                            value={row.partNo}
                            disabled={!selectedVendor}
                            onSelect={(option) => handlePartSelect(idx, option)}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1.5 pt-1 text-ink-800">
                            {isFetching && (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-400" />
                            )}
                            <span className="line-clamp-2">
                              {row.description || "-"}
                            </span>
                          </div>
                        </td>
                        <NumCell
                          value={row.supInvQty}
                          min="1"
                          step="1"
                          center
                          onChange={(v) =>
                            handleItemChange(idx, "supInvQty", v)
                          }
                          label="Supplier invoice quantity"
                        />
                        <NumCell
                          value={row.receivedQty}
                          min="1"
                          step="1"
                          center
                          onChange={(v) =>
                            handleItemChange(idx, "receivedQty", v)
                          }
                          label="Received quantity"
                        />
                        <NumCell
                          value={row.cost}
                          onChange={(v) => handleItemChange(idx, "cost", v)}
                          label="Cost"
                        />
                        <NumCell
                          value={row.rate}
                          onChange={(v) => handleItemChange(idx, "rate", v)}
                          label="Rate"
                        />
                        <NumCell
                          value={row.mrp}
                          onChange={(v) => handleItemChange(idx, "mrp", v)}
                          label="MRP"
                        />
                        <NumCell
                          value={row.discount}
                          onChange={(v) => handleItemChange(idx, "discount", v)}
                          label="Discount amount"
                        />
                        <td className="px-2 py-2 pt-3 text-center text-ink-700">
                          {row.cgst || 0}
                        </td>
                        <td className="px-2 py-2 pt-3 text-center text-ink-700">
                          {row.sgst || 0}
                        </td>
                        <td className="px-2 py-2 pt-3 text-center text-ink-700">
                          {row.igst || 0}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <Button
                            type="button"
                            size="sm"
                            variant={binsDone ? "primary" : "secondary"}
                            disabled={!row.itemId}
                            onClick={() => setBinRowId(row.rowId)}
                          >
                            {binsDone ? "Selected" : "Select"}
                          </Button>
                        </td>
                        <td className="px-2 py-2 pt-3 text-right font-bold text-ink-900">
                          {formatINR(Number(row.totalAmount) || 0)}
                        </td>
                        <td className="px-1 py-2 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemovePartRow(idx)}
                              className="cursor-pointer p-1 text-ink-400 transition-colors hover:text-danger-500"
                              title="Remove line"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-ink-200 bg-[#F8F9FF] text-xs font-bold text-right text-ink-900">
                    <td className="px-2.5 py-2.5" colSpan={12}>
                      Grand Total (incl. freight &amp; misc.)
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      {formatINR(Number(formData.grandTotal) || 0)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </form>
      </Modal>

      <BinLocationModal
        isOpen={binRowId !== null}
        onClose={() => setBinRowId(null)}
        row={items.find((it) => it.rowId === binRowId)}
        onSave={handleSaveBins}
      />
    </>
  );
}

function NumCell({
  value,
  onChange,
  error,
  min = "0",
  step = "0.01",
  center,
  label,
}) {
  return (
    <td className="px-2 py-2">
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={clsx(cellCls(error), center ? "text-center" : "text-right")}
        aria-label={label}
        title={error}
      />
    </td>
  );
}