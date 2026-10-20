import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { grnApi } from "@/services";
import { formatINR } from "@/utils/estimateMath";
import BinLocationModal from "./BinLocationModal";
// Shared with AddGrnModal (all four are exported from there).
import {
  PartNoAutocomplete,
  createEmptyItem,
  calcLineTotal,
  isBinsComplete,
} from "./AddGrnModal";

// ---- shared cell styles (same as the Add GRN / Purchase Order modals) ----
const cellInput =
  "w-full rounded border px-2 py-1 text-xs text-ink-800 focus:outline-none disabled:bg-ink-50";
const cellCls = (hasError) =>
  clsx(
    cellInput,
    hasError ? "border-danger-500" : "border-ink-200 focus:border-brand-600",
  );

const money = (v) =>
  Number(v || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// Read-only header field, styled like the Add GRN inputs.
function ReadOnlyInput({ label, value, title }) {
  return (
    <Input
      label={label}
      value={value ?? ""}
      readOnly
      placeholder="-"
      className="bg-ink-50"
      title={title}
    />
  );
}

/**
 * Edit GRN.
 * - Loads the GRN with grnApi.getGrnPdf({ id }) (same API as ViewGrnModal).
 * - Header details and existing line items are READ-ONLY.
 * - The user can only append NEW part rows, each with its bin split.
 * onSubmit({ id, vendorState, grn, newItems }) is called with the new rows only.
 */
export default function EditGrnModal({
  isOpen,
  onClose,
  grn, // list row, only `id` is needed
  onSubmit,
  isSubmitting,
}) {
  const [detail, setDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [newItems, setNewItems] = useState([]);
  const [error, setError] = useState("");

  // rowId of the new line whose bin locations are being edited (null = closed)
  const [binRowId, setBinRowId] = useState(null);

  // rowIds whose part details are being fetched
  const [detailLoadingKeys, setDetailLoadingKeys] = useState(() => new Set());

  // Fetch the GRN every time the modal opens.
  useEffect(() => {
    if (!isOpen || !grn?.id) return;

    let cancelled = false;
    setDetail(null);
    setLoadError("");
    setNewItems([]);
    setError("");
    setBinRowId(null);
    setDetailLoadingKeys(new Set());
    setIsLoading(true);

    (async () => {
      try {
        const res = await grnApi.getGrnPdf({ id: grn.id });
        if (cancelled) return;
        if (res?.requestSuccessful && res?.data?.[0]) {
          setDetail(res.data[0]);
        } else {
          setLoadError(res?.message || "Failed to load GRN details");
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err?.message || "Failed to load GRN details");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, grn?.id]);

  if (!isOpen || !grn) return null;

  const d = detail;
  const vendor = d?.grnvendormap;
  const existingParts = d?.grnparts ?? [];
  const vendorState = vendor?.state;

  const existingTotal =
    Number(d?.pdf_total || 0) +
    Number(d?.frieght_charges || 0) +
    Number(d?.mis_charges || 0);
  const newItemsTotal = newItems.reduce(
    (acc, it) => acc + (Number(it.totalAmount) || 0),
    0,
  );
  const grandTotal = existingTotal + newItemsTotal;

  const vendorAddress = vendor
    ? [
        vendor.address1,
        vendor.address2,
        [vendor.city, vendor.pincode].filter(Boolean).join(" "),
        vendor.state,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  function handleItemChange(index, field, value) {
    setNewItems((prev) => {
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
    if (error) setError("");
  }

  async function handlePartSelect(index, option) {
    if (!option) {
      setNewItems((prev) => {
        const copy = [...prev];
        copy[index] = { ...createEmptyItem(), rowId: copy[index].rowId };
        return copy;
      });
      return;
    }

    const rowId = newItems[index]?.rowId;
    setDetailLoadingKeys((s) => new Set(s).add(rowId));
    try {
      const response = await grnApi.getItemDetails({
        itemCode: option.itemCode,
        modelSegment: "",
        customerState: vendorState, // tax split depends on the vendor state
      });
      const detailRes = response?.itemsData?.[0];
      if (!response?.requestSuccessful || !detailRes) return;

      setNewItems((prev) =>
        prev.map((row) => {
          if (row.rowId !== rowId) return row;
          const target = {
            ...row,
            itemId: detailRes.id,
            partNo: option.itemCode,
            description: detailRes.itemDescription ?? option.itemName ?? "",
            cost: detailRes.cost ?? 0,
            rate: detailRes.list ?? 0,
            mrp: detailRes.mrp ?? 0,
            discount: 0,
            cgst: detailRes.cgst ?? 0,
            sgst: detailRes.sgst ?? 0,
            igst: detailRes.igst ?? 0,
            bins: [], // a different part means the old bin split no longer applies
          };
          target.totalAmount = calcLineTotal(target);
          return target;
        }),
      );
      if (error) setError("");
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
    setNewItems((prev) =>
      prev.map((it) => (it.rowId === binRowId ? { ...it, bins } : it)),
    );
    setBinRowId(null);
    if (error) setError("");
  }

  function handleAddPartRow() {
    setNewItems((prev) => [...prev, createEmptyItem()]);
  }

  function handleRemovePartRow(index) {
    setNewItems((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (newItems.length === 0) {
      setError("Add at least one new part");
      return;
    }
    if (newItems.some((it) => !it.itemId || !it.partNo)) {
      setError("Select a part for every new row");
      return;
    }
    if (newItems.some((it) => !(Number(it.receivedQty) > 0))) {
      setError("Received quantity must be greater than 0");
      return;
    }
    if (newItems.some((it) => !isBinsComplete(it))) {
      setError(
        "Select bin locations for every new row (bin quantities must match Received Qty)",
      );
      return;
    }

    onSubmit?.({
      id: grn.id,
      vendorState,
      grn: d,
      // First bin feeds the single binId / binLocation fields on the grn part;
      // the full split stays in `bins` for bindata.
      // Each new item also carries rate, mrp, discount, cgst, sgst and igst.
      newItems: newItems.map((it) => ({
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
        title={`Edit GRN${d?.grn_no ?? grn.grn_no ? `: ${d?.grn_no ?? grn.grn_no}` : ""}`}
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
              form="edit-grn-form"
              isLoading={isSubmitting}
              disabled={isLoading || !d}
            >
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </>
        }
      >
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-ink-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading GRN details...
          </div>
        )}

        {!isLoading && loadError && (
          <p className="py-12 text-center text-sm text-danger-500">
            {loadError}
          </p>
        )}

        {!isLoading && !loadError && d && (
          <form
            id="edit-grn-form"
            onSubmit={handleSubmit}
            noValidate
            className="space-y-6"
          >
            {/* ---------- Header (read-only) ---------- */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <ReadOnlyInput label="GRN Number" value={d.grn_no} />
                <ReadOnlyInput label="GRN Name" value={d.document_type} />
                <ReadOnlyInput label="Vendor Code" value={d.vendor_code} />
                <ReadOnlyInput
                  label="Vendor Name"
                  value={vendor?.vendor_name ?? vendor?.vendorName}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <ReadOnlyInput
                  label="Vendor Address"
                  value={vendorAddress}
                  title={vendorAddress}
                />
                <ReadOnlyInput
                  label="Vendor GSTIN Number"
                  value={vendor?.gstin ?? vendor?.gst_number}
                />
                <ReadOnlyInput
                  label="Supplier Invoice Number"
                  value={d.invoice_number}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <ReadOnlyInput label="Invoice Date" value={d.invoice_date} />
                <ReadOnlyInput
                  label="ESugam Road Permit Number"
                  value={d.e_sugam_no}
                />
                <ReadOnlyInput label="LR Number" value={d.lr_number} />
                <ReadOnlyInput label="LR Date" value={d.lr_date} />
                <ReadOnlyInput
                  label="Transport Name"
                  value={d.transport_name}
                />
                <ReadOnlyInput
                  label="Freight Charges"
                  value={money(d.frieght_charges)}
                />
                <ReadOnlyInput
                  label="Miscellaneous Charges"
                  value={money(d.mis_charges)}
                />
              </div>
            </div>

            {/* ---------- Parts ---------- */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink-900">
                  Parts details
                </h3>
                <Button
                  type="button"
                  size="sm"
                  icon={Plus}
                  onClick={handleAddPartRow}
                >
                  Add Parts Details
                </Button>
              </div>
              <p className="text-xs text-ink-500">
                Existing parts are read-only. You can only add new parts here.
              </p>
              {error && <p className="text-xs text-danger-500">{error}</p>}

              <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white">
                <table className="w-full min-w-[1500px] border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-ink-200 bg-[#F8F9FF] text-[11px] font-bold uppercase tracking-wider text-ink-500">
                      <th className="w-44 px-2.5 py-2.5">Parts No *</th>
                      <th className="min-w-[160px] px-2.5 py-2.5">
                        Description
                      </th>
                      <th className="w-20 px-2.5 py-2.5 text-center">
                        Sup Inv Qty
                      </th>
                      <th className="w-20 px-2.5 py-2.5 text-center">
                        Received Qty
                      </th>
                      <th className="w-24 px-2.5 py-2.5 text-right">Cost</th>
                      <th className="w-24 px-2.5 py-2.5 text-right">Rate</th>
                      <th className="w-24 px-2.5 py-2.5 text-right">MRP</th>
                      <th className="w-24 px-2.5 py-2.5 text-right">
                        Discount
                      </th>
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
                    {/* Existing items: read-only */}
                    {existingParts.map((it, idx) => (
                      <tr
                        key={`${it.item_code}-${idx}`}
                        className="bg-ink-50/50 align-top text-ink-700"
                      >
                        <td className="px-2.5 py-2.5 font-semibold text-brand-700">
                          {it.item_code}
                        </td>
                        <td className="px-2.5 py-2.5">
                          <span className="line-clamp-2">
                            {it.item_description || "-"}
                          </span>
                        </td>
                        <td className="px-2.5 py-2.5 text-center">
                          {it.sup_invoice_quantity ?? "-"}
                        </td>
                        <td className="px-2.5 py-2.5 text-center">
                          {it.quantity}
                        </td>
                        <td className="px-2.5 py-2.5 text-right">
                          {money(it.cost)}
                        </td>
                        <td className="px-2.5 py-2.5 text-right">
                          {money(it.rate ?? it.list)}
                        </td>
                        <td className="px-2.5 py-2.5 text-right">
                          {money(it.mrp)}
                        </td>
                        <td className="px-2.5 py-2.5 text-right">
                          {money(it.discount)}
                        </td>
                        <td className="px-2.5 py-2.5 text-center">
                          {it.cgst ?? 0}
                        </td>
                        <td className="px-2.5 py-2.5 text-center">
                          {it.sgst ?? 0}
                        </td>
                        <td className="px-2.5 py-2.5 text-center">
                          {it.igst ?? 0}
                        </td>
                        <td className="px-2.5 py-2.5 text-center">
                          {it.binlocation || "-"}
                        </td>
                        <td className="px-2.5 py-2.5 text-right font-bold text-ink-900">
                          {formatINR(Number(it.total) || 0)}
                        </td>
                        <td />
                      </tr>
                    ))}

                    {/* New items: editable */}
                    {newItems.map((row, idx) => {
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
                              onSelect={(option) =>
                                handlePartSelect(idx, option)
                              }
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
                            onChange={(v) =>
                              handleItemChange(idx, "discount", v)
                            }
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
                            <button
                              type="button"
                              onClick={() => handleRemovePartRow(idx)}
                              className="cursor-pointer p-1 text-ink-400 transition-colors hover:text-danger-500"
                              title="Remove line"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-ink-200 bg-[#F8F9FF] text-xs font-bold text-right text-ink-900">
                      <td className="px-2.5 py-2.5" colSpan={12}>
                        Grand Total (existing + new, incl. freight &amp; misc.)
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        {formatINR(grandTotal)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </form>
        )}
      </Modal>

      <BinLocationModal
        isOpen={binRowId !== null}
        onClose={() => setBinRowId(null)}
        row={newItems.find((it) => it.rowId === binRowId)}
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