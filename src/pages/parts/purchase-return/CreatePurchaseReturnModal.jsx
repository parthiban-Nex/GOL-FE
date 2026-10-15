import { useEffect, useState } from "react";
import { Autocomplete, TextField, CircularProgress } from "@mui/material";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { purchaseReturnApi } from "@/services";

const GRN_SEARCH_MIN_CHARS = 5; // same threshold as the old screen

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
  // GRN autocomplete
  const [grnOptions, setGrnOptions] = useState([]);
  const [selectedGrn, setSelectedGrn] = useState(null);
  const [grnInput, setGrnInput] = useState("");
  const [isGrnLoading, setIsGrnLoading] = useState(false);

  // Full GRN details
  const [rows, setRows] = useState([]); // each row: API row + returnQty
  const [vendor, setVendor] = useState({
    vendorCode: "",
    vendorName: "",
    vendorId: null,
    grnId: null,
  });
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);

  const [rowErrors, setRowErrors] = useState({}); // { [row.id]: message }
  const [formError, setFormError] = useState("");

  // Reset whenever the modal opens.
  useEffect(() => {
    if (isOpen) {
      setGrnOptions([]);
      setSelectedGrn(null);
      setGrnInput("");
      setRows([]);
      setVendor({ vendorCode: "", vendorName: "", vendorId: null, grnId: null });
      setRowErrors({});
      setFormError("");
    }
  }, [isOpen]);

  // Search GRNs as the user types (debounced).
  useEffect(() => {
    const searchKey = grnInput.trim();
    if (searchKey.length < GRN_SEARCH_MIN_CHARS) return;
    if (searchKey === selectedGrn?.grn_no) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsGrnLoading(true);
      try {
        const response = await purchaseReturnApi.listGrns({
          searchKey,
          offset: 0,
          limit: 100,
        });
        if (!cancelled && response?.requestSuccessful) {
          setGrnOptions(response?.data ?? []);
        }
      } catch (err) {
        console.error("Error searching GRNs", err);
      } finally {
        if (!cancelled) setIsGrnLoading(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [grnInput, selectedGrn]);

  if (!isOpen) return null;

  async function handleGrnSelect(option) {
    setSelectedGrn(option);
    setRows([]);
    setRowErrors({});
    setFormError("");
    if (!option) return;

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
        setFormError("Could not load GRN details");
      }
    } catch (err) {
      console.error("Error fetching GRN details", err);
      setFormError("Could not load GRN details");
    } finally {
      setIsDetailsLoading(false);
    }
  }

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
    setFormError("");
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, returnQty: value } : r)),
    );
  }

  const grandTotal = rows.reduce((s, r) => s + Number(calcLineTotal(r)), 0);

  function handleSubmit(e) {
    e.preventDefault();

    if (!selectedGrn) {
      setFormError("Select a GRN");
      return;
    }
    const items = rows.filter((r) => Number(r.returnQty) > 0);
    if (items.length === 0) {
      setFormError("Enter a return quantity for at least one part");
      return;
    }

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
          <Button variant="secondary" onClick={onClose}>
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
        className="space-y-5"
      >
        <div className="max-w-xs">
          <Input
            label="Grand Total"
            variant="underline"
            value={Math.round(grandTotal)}
            readOnly
            className="text-base font-bold"
          />
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-3">
          {/* GRN search */}
          <Autocomplete
            options={grnOptions}
            value={selectedGrn}
            onChange={(_, option) => handleGrnSelect(option)}
            inputValue={grnInput}
            onInputChange={(_, value) => setGrnInput(value)}
            getOptionLabel={(option) => option?.grn_no ?? ""}
            isOptionEqualToValue={(option, val) => option.id === val.id}
            filterOptions={(x) => x} // filtering is done by the API
            loading={isGrnLoading}
            noOptionsText={
              grnInput.trim().length < GRN_SEARCH_MIN_CHARS
                ? `Type ${GRN_SEARCH_MIN_CHARS}+ characters`
                : "No GRNs found"
            }
            renderOption={(props, option) => {
              // eslint-disable-next-line no-unused-vars
              const { key, ...rest } = props;
              return (
                <li key={option.id} {...rest}>
                  {option.grn_no} / {option.invoice_number}
                </li>
              );
            }}
            componentsProps={{ popper: { style: { zIndex: 9999 } } }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="GRN No or Invoice Number"
                required
                variant="standard"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {isGrnLoading ? (
                        <CircularProgress color="inherit" size={16} />
                      ) : null}
                    </>
                  ),
                }}
              />
            )}
          />

          <Input
            label="Vendor Code"
            variant="underline"
            value={vendor.vendorCode}
            readOnly
          />
          <Input
            label="Vendor Name"
            variant="underline"
            value={vendor.vendorName}
            readOnly
          />
        </div>

        {isDetailsLoading && (
          <p className="text-xs text-ink-500">Loading GRN details...</p>
        )}

        {rows.length > 0 && (
          <div className="rounded-xl border border-ink-100 bg-white p-3 shadow-xs">
            {formError && (
              <p className="mb-2 text-xs text-danger-500">{formError}</p>
            )}
            <div className="max-h-[380px] overflow-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b border-ink-100 text-ink-500">
                    <th className="pb-2 font-semibold">Parts Code</th>
                    <th className="pb-2 font-semibold">Description</th>
                    <th className="pb-2 text-center font-semibold">
                      Available Qty
                    </th>
                    <th className="pb-2 font-semibold">Return Qty</th>
                    <th className="pb-2 text-right font-semibold">Cost</th>
                    <th className="pb-2 text-center font-semibold">Discount</th>
                    <th className="pb-2 text-center font-semibold">CGST</th>
                    <th className="pb-2 text-center font-semibold">SGST</th>
                    <th className="pb-2 text-center font-semibold">IGST</th>
                    <th className="pb-2 text-right font-semibold text-brand-700">
                      Total Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-50">
                  {rows.map((row) => {
                    const available = Number(row["Available Qty"]) || 0;
                    const disabled = available <= 0;
                    return (
                      <tr key={row.id} className="hover:bg-ink-50/50">
                        <td className="py-2.5 pr-2 font-medium text-brand-700">
                          {row["Parts Code"]}
                        </td>
                        <td className="py-2.5 pr-2 font-medium text-ink-800">
                          {row.Description}
                        </td>
                        <td className="py-2.5 pr-2 text-center text-ink-700">
                          {available}
                        </td>
                        <td className="py-2.5 pr-2">
                          <input
                            type="number"
                            min="0"
                            max={available}
                            step="any"
                            disabled={disabled}
                            value={row.returnQty}
                            placeholder="Qty"
                            onKeyDown={(e) => {
                              if (["e", "E", "-", "+"].includes(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            onChange={(e) =>
                              handleQtyChange(row.id, e.target.value)
                            }
                            className={`w-20 border-b bg-transparent pb-0.5 text-center text-ink-800 focus:outline-none disabled:cursor-not-allowed disabled:bg-ink-50 ${
                              rowErrors[row.id]
                                ? "border-danger-500"
                                : "border-ink-200 focus:border-brand-600"
                            }`}
                          />
                          {rowErrors[row.id] && (
                            <p className="mt-0.5 max-w-[120px] text-[10px] leading-tight text-danger-500">
                              {rowErrors[row.id]}
                            </p>
                          )}
                        </td>
                        <td className="py-2.5 pr-2 text-right text-ink-700">
                          {row.Cost}
                        </td>
                        <td className="py-2.5 pr-2 text-center text-ink-600">
                          {row.Discount ?? 0}
                        </td>
                        <td className="py-2.5 pr-2 text-center text-ink-600">
                          {row.CGST}
                        </td>
                        <td className="py-2.5 pr-2 text-center text-ink-600">
                          {row.SGST}
                        </td>
                        <td className="py-2.5 pr-2 text-center text-ink-600">
                          {row.IGST}
                        </td>
                        <td className="py-2.5 text-right font-bold text-ink-900">
                          ₹{" "}
                          {Number(calcLineTotal(row)).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {rows.length === 0 && formError && (
          <p className="text-xs text-danger-500">{formError}</p>
        )}
      </form>
    </Modal>
  );
}