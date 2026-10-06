import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Autocomplete, TextField, CircularProgress } from "@mui/material";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import SingleSelect from "@/components/ui/SingleSelect";
import Button from "@/components/ui/Button";
import { grnApi } from "@/services/api/grnApi";
import { GRN_NAME_OPTIONS } from "../mockPartsData";
import BinLocationModal from "./BinLocationModal";

// Exported so EditGrnModal can reuse them.
export const createEmptyItem = () => ({
  rowId: crypto.randomUUID(), // stable key, so per-row autocomplete state survives deletes
  itemId: 0,
  partNo: "",
  description: "",
  poNumber: "",
  supInvQty: 1,
  receivedQty: 1,
  cost: 0,
  mrp: 0,
  rate: 0,
  cgst: 0,
  sgst: 0,
  igst: 0,
  totalAmount: "0.00",
  bins: [], // [{ binId, binLocation, quantity }]
});

// (qty * cost) + tax, where tax = CGST + SGST + IGST percentages
export function calcLineTotal(item) {
  const qty = Number(item.receivedQty) || 0;
  const cost = Number(item.cost) || 0;
  const taxPct =
    (Number(item.cgst) || 0) +
    (Number(item.sgst) || 0) +
    (Number(item.igst) || 0);
  const base = qty * cost;
  return (base + (base * taxPct) / 100).toFixed(2);
}

// True when the saved bins add up to the received qty.
export function isBinsComplete(row) {
  const bins = row.bins ?? [];
  if (bins.length === 0) return false;
  const total = bins.reduce((s, b) => s + (Number(b.quantity) || 0), 0);
  return (
    Number(total.toFixed(2)) === Number((Number(row.receivedQty) || 0).toFixed(2))
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
 * Part No autocomplete for a single row.
 * Searches grnApi.searchItemDetails as the user types (debounced, min 3 chars).
 * Selection is reported via onSelect(option | null); the parent fetches details.
 */
export function PartNoAutocomplete({ value, disabled, onSelect }) {
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState(value || "");
  const [loading, setLoading] = useState(false);

  // Keep the text in sync when the row is populated / reset from outside.
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  useEffect(() => {
    const searchKey = inputValue.trim();

    // Too short, or the text is just the already-selected part code.
    if (searchKey.length < 3 || searchKey === value) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await grnApi.searchItemDetails({
          itemCode: searchKey,
        });
        if (!cancelled && response?.requestSuccessful) {
          setOptions(response?.itemSearchData ?? []);
        }
      } catch (err) {
        console.error("Error searching parts", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [inputValue, value]);

  return (
    <Autocomplete
      options={options}
      value={value ? { itemCode: value } : null}
      onChange={(_, option) => onSelect(option)}
      inputValue={inputValue}
      onInputChange={(_, text) => setInputValue(text)}
      getOptionLabel={(option) => option?.itemCode ?? ""}
      isOptionEqualToValue={(option, val) => option.itemCode === val.itemCode}
      filterOptions={(x) => x} // filtering is done by the API
      renderOption={(props, option) => {
        // eslint-disable-next-line no-unused-vars
        const { key, ...rest } = props;
        return (
          <li key={option.itemCode} {...rest}>
            {option.displayText || `${option.itemCode} - ${option.itemName}`}
          </li>
        );
      }}
      loading={loading}
      disabled={disabled}
      noOptionsText={
        inputValue.trim().length < 3 ? "Type 3+ characters" : "No parts found"
      }
      componentsProps={{ popper: { style: { zIndex: 9999, width: 320 } } }}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="standard"
          size="small"
          placeholder={disabled ? "Select vendor first" : "Search part"}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? (
                  <CircularProgress color="inherit" size={14} />
                ) : null}
              </>
            ),
          }}
          sx={{ minWidth: 110 }}
        />
      )}
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

  // Vendor autocomplete state
  const [vendorOptions, setVendorOptions] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorInput, setVendorInput] = useState("");
  const [isVendorLoading, setIsVendorLoading] = useState(false);

  // Reset everything when the modal opens.
  useEffect(() => {
    if (isOpen) {
      setFormData(emptyFormData);
      setItems([createEmptyItem()]);
      setErrors({});
      setBinRowId(null);
      setVendorOptions([]);
      setSelectedVendor(null);
      setVendorInput("");
    }
  }, [isOpen]);

  // Fetch vendors as the user types (debounced). Only search when there is a search key.
  useEffect(() => {
    const searchKey = vendorInput.trim();

    // Nothing typed, or the text is just the selected vendor's label.
    if (!searchKey || searchKey === selectedVendor?.vendorCode) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsVendorLoading(true);
      try {
        const response = await grnApi.getVendor({
          searchKey,
          offset: 0,
          limit: 10,
        });
        if (!cancelled && response?.requestSuccessful) {
          setVendorOptions(response?.vendorData?.data ?? []);
        }
      } catch (err) {
        console.error("Error fetching vendor data", err);
      } finally {
        if (!cancelled) setIsVendorLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [vendorInput, selectedVendor]);

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

  function handleVendorChange(vendor) {
    setSelectedVendor(vendor);
    handleChange("vendorCode", vendor?.id ?? "");
    // Tax split (CGST/SGST vs IGST) depends on the vendor state,
    // so previously fetched part details are no longer valid.
    setItems([createEmptyItem()]);
  }

  function handleItemChange(index, field, value) {
    setItems((prev) => {
      const copy = [...prev];
      const target = { ...copy[index], [field]: value };

      // Recalculate line total if qty or cost changes.
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

    try {
      const response = await grnApi.getItemDetails({
        itemCode: option.itemCode,
        modelSegment: "",
        customerState: selectedVendor?.state,
      });

      const detail = response?.itemsData?.[0];
      if (!response?.requestSuccessful || !detail) return;

      setItems((prev) => {
        const copy = [...prev];
        const target = {
          ...copy[index],
          itemId: detail.id,
          partNo: option.itemCode,
          description: detail.itemDescription ?? option.itemName ?? "",
          poNumber: "",
          cost: detail.cost ?? 0,
          rate: detail.list ?? 0,
          mrp: detail.mrp ?? 0,
          cgst: detail.cgst ?? 0,
          sgst: detail.sgst ?? 0,
          igst: detail.igst ?? 0,
          bins: [], // a different part means the old bin split no longer applies
        };
        target.totalAmount = calcLineTotal(target);
        copy[index] = target;
        return copy;
      });
      setErrors((prev) => (prev.items ? { ...prev, items: null } : prev));
    } catch (err) {
      console.error("Error fetching part details", err);
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

  function handleSubmit(e) {
    e.preventDefault();

    const newErrors = {};
    if (!formData.grnName) newErrors.grnName = "GRN Name is required";
    if (!selectedVendor) newErrors.vendorCode = "Vendor Code is required";
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
      // First bin feeds the single binId / binLocation fields on the grn part;
      // the full split stays in `bins` for bindata.
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
            <Button variant="secondary" onClick={onClose}>
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
          className="space-y-5"
        >
          {/* Grand Total */}
          <div className="max-w-xs">
            <Input
              label="Grand Total"
              required
              variant="underline"
              value={formData.grandTotal}
              onChange={(e) => handleChange("grandTotal", e.target.value)}
              className="text-base font-bold"
            />
          </div>

          {/* Form Fields - 3 column grid */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
            <div className="-mt-2.5">
              <SingleSelect
                label="GRN Name"
                required
                value={formData.grnName}
                onChange={(value) => handleChange("grnName", value)}
                options={GRN_NAME_OPTIONS}
                error={errors.grnName}
              />
            </div>

            {/* Vendor Code - MUI Autocomplete, fetches from grnApi.getVendor */}
            <div>
              <Autocomplete
                options={vendorOptions}
                value={selectedVendor}
                onChange={(_, vendor) => handleVendorChange(vendor)}
                inputValue={vendorInput}
                onInputChange={(_, value) => setVendorInput(value)}
                getOptionLabel={(option) => option?.vendorCode ?? ""}
                isOptionEqualToValue={(option, val) => option.id === val.id}
                filterOptions={(x) => x} // filtering is done by the API
                loading={isVendorLoading}
                noOptionsText={
                  vendorInput.trim() ? "No vendors found" : "Type to search"
                }
                // Portal + high z-index so the list isn't clipped by the modal body
                componentsProps={{ popper: { style: { zIndex: 9999 } } }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Vendor Code"
                    required
                    variant="standard"
                    error={!!errors.vendorCode}
                    helperText={errors.vendorCode || ""}
                    fullWidth
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isVendorLoading ? (
                            <CircularProgress color="inherit" size={16} />
                          ) : null}
                        </>
                      ),
                    }}
                  />
                )}
              />
            </div>

            <Input
              label="Supplier Invoice Number"
              required
              variant="underline"
              value={formData.supplierInvoiceNumber}
              onChange={(e) =>
                handleChange("supplierInvoiceNumber", e.target.value)
              }
              placeholder="e.g. CSCR-VLR-0010"
              error={errors.supplierInvoiceNumber}
            />

            <Input
              type="date"
              label="Invoice Date"
              variant="underline"
              value={formData.invoiceDate}
              onChange={(e) => handleChange("invoiceDate", e.target.value)}
            />
            <Input
              type="number"
              step="0.01"
              label="Invoice Amount"
              variant="underline"
              value={formData.invoiceAmount}
              onChange={(e) => handleChange("invoiceAmount", e.target.value)}
              placeholder="0.00"
            />
            <Input
              label="ESugam Road Permit Number"
              variant="underline"
              value={formData.eSugamNumber}
              onChange={(e) => handleChange("eSugamNumber", e.target.value)}
              placeholder="e.g. ESUGAM-99201"
            />

            <Input
              label="LR Number"
              variant="underline"
              value={formData.lrNumber}
              onChange={(e) => handleChange("lrNumber", e.target.value)}
              placeholder="e.g. LR-89201"
            />
            <Input
              type="date"
              label="LR Date"
              variant="underline"
              value={formData.lrDate}
              onChange={(e) => handleChange("lrDate", e.target.value)}
            />
            <Input
              label="Transport Name"
              variant="underline"
              value={formData.transportName}
              onChange={(e) => handleChange("transportName", e.target.value)}
              placeholder="e.g. SafeXpress Logistics"
            />

            <Input
              type="number"
              step="0.01"
              label="Freight Charges"
              variant="underline"
              value={formData.freightCharges}
              onChange={(e) => handleChange("freightCharges", e.target.value)}
              placeholder="0.00"
            />
            <Input
              type="number"
              step="0.01"
              label="Miscellaneous Charges"
              variant="underline"
              value={formData.miscellaneousCharges}
              onChange={(e) =>
                handleChange("miscellaneousCharges", e.target.value)
              }
              placeholder="0.00"
            />
          </div>

          {/* Parts Line Items - a free-form editable grid, which the
              shared Table component doesn't support, so this stays
              hand-built rather than forced into it. */}
          <div className="rounded-xl border border-ink-100 bg-white p-3 shadow-xs">
            {errors.items && (
              <p className="mb-2 text-xs text-danger-500">{errors.items}</p>
            )}
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
                  {items.map((row, idx) => (
                    <tr key={row.rowId} className="hover:bg-ink-50/50">
                      <td className="py-2.5 pr-2">
                        <PartNoAutocomplete
                          value={row.partNo}
                          disabled={!selectedVendor}
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
                            handleItemChange(idx, "receivedQty", e.target.value)
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
                          variant={isBinsComplete(row) ? "primary" : "secondary"}
                          disabled={!row.itemId}
                          onClick={() => setBinRowId(row.rowId)}
                        >
                          {isBinsComplete(row) ? "Selected" : "Select"}
                        </Button>
                      </td>
                      <td className="py-2.5 pr-2 font-bold text-ink-900">
                        ₹{" "}
                        {Number(row.totalAmount || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-2.5 text-right">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePartRow(idx)}
                            className="text-ink-400 transition-colors hover:text-danger-500"
                            title="Remove row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
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
                disabled={!selectedVendor}
              >
                Add Part
              </Button>
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