import { useEffect, useState } from "react";
import { Filter as FilterIcon } from "lucide-react";
import { Autocomplete, TextField, CircularProgress } from "@mui/material";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { grnApi } from "@/services/api/grnApi";
import { showToast } from "@/utils/toast";

const MIN_CHARS = 3;
const DEFAULT_FILTERS = { vendorCode: "ALL", fromDate: "", toDate: "" };

// Applied filters only store the vendor code, so rebuild a minimal option from it.
const vendorFromCode = (code) =>
  code && code !== "ALL" ? { vendorCode: code } : null;

export default function GrnDirectFilterModal({
  isOpen,
  onClose,
  filters,
  onApply,
  onReset,
}) {
  // Draft values: nothing reaches the page until "Apply Filters" is clicked.
  const [local, setLocal] = useState({ ...DEFAULT_FILTERS, ...filters });

  // Vendor autocomplete state
  const [vendorOptions, setVendorOptions] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(
    vendorFromCode(filters?.vendorCode),
  );
  const [vendorInput, setVendorInput] = useState(filters?.vendorCode ?? "");
  const [isVendorLoading, setIsVendorLoading] = useState(false);

  // Sync the draft with the applied filters each time the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    setLocal({ ...DEFAULT_FILTERS, ...filters });
    const vendor = vendorFromCode(filters?.vendorCode);
    setSelectedVendor(vendor);
    setVendorInput(vendor?.vendorCode ?? "");
    setVendorOptions([]);
  }, [isOpen, filters]);

  // Fetch vendors as the user types (debounced, min 3 chars, limit 10).
  useEffect(() => {
    const searchKey = vendorInput.trim();

    // Too short, or the text is just the selected vendor's code.
    if (searchKey.length < MIN_CHARS || searchKey === selectedVendor?.vendorCode) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsVendorLoading(true);
      try {
        const res = await grnApi.getVendor({
          searchKey,
          offset: 0,
          limit: 10,
        });
        if (!cancelled && res?.requestSuccessful) {
          setVendorOptions(res?.vendorData?.data ?? []);
        }
      } catch (err) {
        console.error("Error fetching vendor data", err);
        if (!cancelled) showToast.error("Failed to load vendors");
      } finally {
        if (!cancelled) setIsVendorLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [vendorInput, selectedVendor]);

  if (!isOpen) return null;

  function setField(field, value) {
    setLocal((prev) => ({ ...prev, [field]: value }));
  }

  function handleVendorChange(vendor) {
    setSelectedVendor(vendor);
    setField("vendorCode", vendor?.vendorCode ?? "ALL");
  }

  function handleApply() {
    // Guard against a reversed range.
    if (local.fromDate && local.toDate && local.fromDate > local.toDate) {
      showToast.error("From Date cannot be later than To Date");
      return;
    }
    onApply?.({
      vendorCode: local.vendorCode || "ALL",
      fromDate: local.fromDate || "",
      toDate: local.toDate || "",
    });
    onClose();
  }

  function handleReset() {
    setLocal(DEFAULT_FILTERS);
    setSelectedVendor(null);
    setVendorInput("");
    setVendorOptions([]);
    onReset?.({ ...DEFAULT_FILTERS });
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <FilterIcon className="h-4 w-4 text-brand-600" />
          Filter GRN Direct Records
        </span>
      }
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleReset}>
            Reset
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApply}>Apply Filters</Button>
        </>
      }
    >
      <div className="space-y-5">
        {/* Vendor Code - MUI Autocomplete, fetches from grnApi.getVendor */}
        <Autocomplete
          options={vendorOptions}
          value={selectedVendor}
          onChange={(_, vendor) => handleVendorChange(vendor)}
          inputValue={vendorInput}
          onInputChange={(_, value) => {
            setVendorInput(value);
            // Don't keep stale suggestions once the text drops below the minimum.
            if (value.trim().length < MIN_CHARS) setVendorOptions([]);
          }}
          getOptionLabel={(option) => option?.vendorCode ?? ""}
          isOptionEqualToValue={(option, val) =>
            option.vendorCode === val.vendorCode
          }
          filterOptions={(x) => x} // filtering is done by the API
          renderOption={(props, option) => {
            // eslint-disable-next-line no-unused-vars
            const { key, ...rest } = props;
            const name = option.vendorName ?? option.name;
            return (
              <li key={option.id ?? option.vendorCode} {...rest}>
                {name ? `${option.vendorCode} - ${name}` : option.vendorCode}
              </li>
            );
          }}
          loading={isVendorLoading}
          noOptionsText={
            vendorInput.trim().length < MIN_CHARS
              ? `Type ${MIN_CHARS}+ characters`
              : "No vendors found"
          }
          // Portal + high z-index so the list isn't clipped by the modal body
          componentsProps={{ popper: { style: { zIndex: 9999 } } }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Vendor Code"
              placeholder="All Vendors"
              variant="standard"
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            type="date"
            label="From Date"
            value={local.fromDate ?? ""}
            max={local.toDate || undefined}
            onChange={(e) => setField("fromDate", e.target.value)}
          />
          <Input
            type="date"
            label="To Date"
            value={local.toDate ?? ""}
            min={local.fromDate || undefined}
            onChange={(e) => setField("toDate", e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}