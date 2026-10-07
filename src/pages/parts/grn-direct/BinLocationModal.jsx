import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Autocomplete, TextField, CircularProgress } from "@mui/material";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { grnApi } from "@/services/api/grnApi";

const round2 = (n) => Number((Number(n) || 0).toFixed(2));

const newBinRow = (quantity = "") => ({
  rowId: crypto.randomUUID(),
  bin: null, // { id, binLocation, binLocationDescription }
  quantity,
});

/**
 * Bin location autocomplete for one row.
 * Lists via grnApi.listBinLocation (debounced). Loads the first 20 bins
 * on mount so the dropdown isn't empty before the user types.
 */
function BinAutocomplete({ value, onSelect, error }) {
  const [options, setOptions] = useState([]);
  const [inputValue, setInputValue] = useState(value?.binLocation ?? "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchKey = inputValue.trim();
    // The text is just the label of the already-selected bin.
    if (value && searchKey === value.binLocation) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await grnApi.listBinLocation({
          searchKey,
          offset: 0,
          limit: 20,
        });
        if (!cancelled && response?.requestSuccessful) {
          // Handles both { data: [...] } and { data: { data: [...] } }
          const list = Array.isArray(response.data)
            ? response.data
            : (response.data?.data ?? []);
          setOptions(list);
        }
      } catch (err) {
        console.error("Error fetching bin locations", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [inputValue, value]);

  // Keep the selected bin in the list so MUI doesn't warn about a missing option.
  const allOptions =
    value && !options.some((o) => o.id === value.id)
      ? [value, ...options]
      : options;

  return (
    <Autocomplete
      options={allOptions}
      value={value}
      onChange={(_, option) => onSelect(option)}
      inputValue={inputValue}
      onInputChange={(_, text) => setInputValue(text)}
      getOptionLabel={(option) => option?.binLocation ?? ""}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      filterOptions={(x) => x} // filtering is done by the API
      renderOption={(props, option) => {
        // eslint-disable-next-line no-unused-vars
        const { key, ...rest } = props;
        return (
          <li key={option.id} {...rest}>
            {option.binLocation}
            {option.binLocationDescription
              ? ` - ${option.binLocationDescription}`
              : ""}
          </li>
        );
      }}
      loading={loading}
      noOptionsText="No bin locations found"
      componentsProps={{ popper: { style: { zIndex: 9999 } } }}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="standard"
          size="small"
          label="Bin Location"
          error={error}
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
        />
      )}
    />
  );
}

/**
 * Splits a part's received quantity across one or more bin locations.
 * `row` is the Add GRN line item; `onSave(bins)` receives
 * [{ binId, binLocation, quantity }].
 */
export default function BinLocationModal({ isOpen, onClose, row, onSave }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  // Seed from the saved bins, or one row holding the whole received qty.
  useEffect(() => {
    if (!isOpen || !row) return;
    setError("");
    if (row.bins?.length) {
      setRows(
        row.bins.map((b) => ({
          rowId: crypto.randomUUID(),
          bin: { id: b.binId, binLocation: b.binLocation },
          quantity: String(b.quantity),
        })),
      );
    } else {
      setRows([newBinRow(String(row.receivedQty ?? ""))]);
    }
  }, [isOpen, row?.rowId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen || !row) return null;

  const receivedQty = round2(row.receivedQty);
  const allocated = round2(
    rows.reduce((sum, r) => sum + (parseFloat(r.quantity) || 0), 0),
  );
  const remaining = round2(receivedQty - allocated);

  function updateRow(rowId, patch) {
    setRows((prev) => prev.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r)));
    if (error) setError("");
  }

  function handleSave() {
    if (rows.some((r) => !r.bin || !(parseFloat(r.quantity) > 0))) {
      setError("Select a bin and enter a quantity for every row");
      return;
    }
    const ids = rows.map((r) => r.bin.id);
    if (new Set(ids).size !== ids.length) {
      setError("The same bin is selected more than once");
      return;
    }
    if (allocated !== receivedQty) {
      setError(
        `Bin quantities total ${allocated}, but received quantity is ${receivedQty}`,
      );
      return;
    }

    onSave(
      rows.map((r) => ({
        binId: r.bin.id,
        binLocation: r.bin.binLocation,
        quantity: round2(r.quantity),
      })),
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Select bin location: ${row.partNo}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save bins</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-ink-100 bg-ink-50/60 px-4 py-3 text-xs">
          <span className="text-ink-500">
            Received qty{" "}
            <span className="font-semibold text-ink-900">{receivedQty}</span>
          </span>
          <span className="text-ink-500">
            Allocated{" "}
            <span className="font-semibold text-ink-900">{allocated}</span>
          </span>
          <span className={remaining === 0 ? "text-success-700" : "text-danger-500"}>
            Remaining <span className="font-semibold">{remaining}</span>
          </span>
        </div>

        {error && <p className="text-xs text-danger-500">{error}</p>}

        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.rowId} className="flex items-end gap-4">
              <div className="flex-1">
                <BinAutocomplete
                  value={r.bin}
                  onSelect={(bin) => updateRow(r.rowId, { bin })}
                />
              </div>
              <div className="w-28">
                <TextField
                  type="number"
                  variant="standard"
                  size="small"
                  label="Quantity"
                  fullWidth
                  value={r.quantity}
                  onChange={(e) => {
                    const v = e.target.value;
                    // up to 2 decimal places
                    if (/^\d*\.?\d{0,2}$/.test(v)) updateRow(r.rowId, { quantity: v });
                  }}
                  onKeyDown={(e) => {
                    if (["e", "E", "-", "+"].includes(e.key)) e.preventDefault();
                  }}
                  inputProps={{ min: 0, step: "any" }}
                />
              </div>
              <button
                type="button"
                onClick={() => setRows((prev) => prev.filter((x) => x.rowId !== r.rowId))}
                disabled={rows.length <= 1}
                className="pb-1 text-ink-400 transition-colors hover:text-danger-500 disabled:opacity-30"
                title="Remove bin"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            icon={Plus}
            onClick={() => setRows((prev) => [...prev, newBinRow(remaining > 0 ? String(remaining) : "")])}
          >
            Add Bin
          </Button>
        </div>
      </div>
    </Modal>
  );
}