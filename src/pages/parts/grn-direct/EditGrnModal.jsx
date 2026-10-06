import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { grnApi } from "@/services/api/grnApi";
import BinLocationModal from "./BinLocationModal";
// Shared with AddGrnModal (all four are exported from there).
import {
  PartNoAutocomplete,
  createEmptyItem,
  calcLineTotal,
  isBinsComplete,
} from "./AddGrnModal";

const money = (v) =>
  Number(v || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function Field({ label, children }) {
  return (
    <div>
      <span className="block text-ink-500">{label}</span>
      <span className="font-semibold text-ink-900">{children || "-"}</span>
    </div>
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

  // Fetch the GRN every time the modal opens.
  useEffect(() => {
    if (!isOpen || !grn?.id) return;

    let cancelled = false;
    setDetail(null);
    setLoadError("");
    setNewItems([]);
    setError("");
    setBinRowId(null);
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
  const poNumber = d?.pogrnmap?.po_number ?? "";
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
      if (field === "receivedQty" || field === "cost") {
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

    try {
      const response = await grnApi.getItemDetails({
        itemCode: option.itemCode,
        modelSegment: "",
        customerState: vendorState, // tax split depends on the vendor state
      });
      const detailRes = response?.itemsData?.[0];
      if (!response?.requestSuccessful || !detailRes) return;

      setNewItems((prev) => {
        const copy = [...prev];
        const target = {
          ...copy[index],
          itemId: detailRes.id,
          partNo: option.itemCode,
          description: detailRes.itemDescription ?? option.itemName ?? "",
          poNumber: "",
          cost: detailRes.cost ?? 0,
          rate: detailRes.list ?? 0,
          mrp: detailRes.mrp ?? 0,
          cgst: detailRes.cgst ?? 0,
          sgst: detailRes.sgst ?? 0,
          igst: detailRes.igst ?? 0,
          bins: [], // a different part means the old bin split no longer applies
        };
        target.totalAmount = calcLineTotal(target);
        copy[index] = target;
        return copy;
      });
      if (error) setError("");
    } catch (err) {
      console.error("Error fetching part details", err);
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
            <Button variant="secondary" onClick={onClose}>
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
            className="space-y-5"
          >
            {/* Grand total (existing + new rows) */}
            <div className="max-w-xs">
              <Input
                label="Grand Total"
                variant="underline"
                value={grandTotal.toFixed(2)}
                readOnly
                className="text-base font-bold"
              />
            </div>

            {/* Header details: read-only */}
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-ink-100 bg-ink-50/60 p-4 text-xs sm:grid-cols-4">
              <Field label="GRN Number">{d.grn_no}</Field>
              <Field label="GRN Name">{d.document_type}</Field>
              <Field label="Vendor Code">{d.vendor_code}</Field>
              <Field label="PO Number">{poNumber}</Field>
              <Field label="Supplier Invoice No">{d.invoice_number}</Field>
              <Field label="Invoice Date">{d.invoice_date}</Field>
              <Field label="E-Sugam / Road Permit No">{d.e_sugam_no}</Field>
              <Field label="Transport Name">{d.transport_name}</Field>
              <Field label="LR Number">{d.lr_number}</Field>
              <Field label="LR Date">{d.lr_date}</Field>
              <Field label="Freight Charges">₹ {money(d.frieght_charges)}</Field>
              <Field label="Miscellaneous Charges">
                ₹ {money(d.mis_charges)}
              </Field>
              <div className="col-span-2 sm:col-span-4">
                <Field label="Supplier Address">{vendorAddress}</Field>
              </div>
            </div>

            {/* Line items */}
            <div className="rounded-xl border border-ink-100 bg-white p-3 shadow-xs">
              {error && <p className="mb-2 text-xs text-danger-500">{error}</p>}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-ink-100 text-ink-500">
                      <th className="pb-2 font-semibold">Parts No</th>
                      <th className="pb-2 font-semibold">Description</th>
                      <th className="pb-2 font-semibold">PO Number</th>
                      <th className="pb-2 font-semibold">Sup Inv Qty</th>
                      <th className="pb-2 font-semibold">Received Qty</th>
                      <th className="pb-2 font-semibold">Cost</th>
                      <th className="pb-2 font-semibold">Bin Location</th>
                      <th className="pb-2 font-semibold text-brand-700">
                        Total Amount
                      </th>
                      <th className="w-8 pb-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-50">
                    {/* Existing items: read-only */}
                    {existingParts.map((it, idx) => (
                      <tr
                        key={`${it.item_code}-${idx}`}
                        className="bg-ink-50/50 text-ink-700"
                      >
                        <td className="py-2.5 pr-2 font-semibold text-brand-700">
                          {it.item_code}
                        </td>
                        <td className="py-2.5 pr-2">{it.item_description}</td>
                        <td className="py-2.5 pr-2">{poNumber || "-"}</td>
                        <td className="py-2.5 pr-2 text-center">
                          {it.sup_invoice_quantity ?? "-"}
                        </td>
                        <td className="py-2.5 pr-2 text-center">
                          {it.quantity}
                        </td>
                        <td className="py-2.5 pr-2">{money(it.cost)}</td>
                        <td className="py-2.5 pr-2">
                          {it.binlocation || "-"}
                        </td>
                        <td className="py-2.5 pr-2 font-bold text-ink-900">
                          ₹ {money(it.total)}
                        </td>
                        <td />
                      </tr>
                    ))}

                    {/* New items: editable */}
                    {newItems.map((row, idx) => (
                      <tr key={row.rowId} className="hover:bg-ink-50/50">
                        <td className="py-2.5 pr-2">
                          <PartNoAutocomplete
                            value={row.partNo}
                            onSelect={(option) => handlePartSelect(idx, option)}
                          />
                        </td>
                        <td className="py-2.5 pr-2">
                          <input
                            type="text"
                            value={row.description}
                            readOnly
                            className="w-44 truncate border-b border-ink-200 bg-transparent pb-0.5 font-medium text-ink-800 focus:outline-none"
                          />
                        </td>
                        <td className="py-2.5 pr-2">
                          <input
                            type="text"
                            value={row.poNumber}
                            onChange={(e) =>
                              handleItemChange(idx, "poNumber", e.target.value)
                            }
                            className="w-20 border-b border-ink-200 bg-transparent pb-0.5 font-semibold text-brand-700 focus:border-brand-600 focus:outline-none"
                          />
                        </td>
                        <td className="py-2.5 pr-2">
                          <input
                            type="number"
                            min="1"
                            value={row.supInvQty}
                            onChange={(e) =>
                              handleItemChange(idx, "supInvQty", e.target.value)
                            }
                            className="w-14 border-b border-ink-200 bg-transparent pb-0.5 text-center text-ink-800 focus:border-brand-600 focus:outline-none"
                          />
                        </td>
                        <td className="py-2.5 pr-2">
                          <input
                            type="number"
                            min="1"
                            value={row.receivedQty}
                            onChange={(e) =>
                              handleItemChange(
                                idx,
                                "receivedQty",
                                e.target.value,
                              )
                            }
                            className="w-14 border-b border-ink-200 bg-transparent pb-0.5 text-center text-ink-800 focus:border-brand-600 focus:outline-none"
                          />
                        </td>
                        <td className="py-2.5 pr-2">
                          <input
                            type="number"
                            step="0.01"
                            value={row.cost}
                            onChange={(e) =>
                              handleItemChange(idx, "cost", e.target.value)
                            }
                            className="w-20 border-b border-ink-200 bg-transparent pb-0.5 font-semibold text-ink-900 focus:border-brand-600 focus:outline-none"
                          />
                        </td>
                        <td className="py-2.5 pr-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={
                              isBinsComplete(row) ? "primary" : "secondary"
                            }
                            disabled={!row.itemId}
                            onClick={() => setBinRowId(row.rowId)}
                          >
                            {isBinsComplete(row) ? "Selected" : "Select"}
                          </Button>
                        </td>
                        <td className="py-2.5 pr-2 font-bold text-ink-900">
                          ₹ {money(row.totalAmount)}
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemovePartRow(idx)}
                            className="text-ink-400 transition-colors hover:text-danger-500"
                            title="Remove row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-3 flex justify-end border-t border-ink-100 pt-3">
                <Button
                  type="button"
                  size="sm"
                  icon={Plus}
                  onClick={handleAddPartRow}
                >
                  Add Part
                </Button>
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