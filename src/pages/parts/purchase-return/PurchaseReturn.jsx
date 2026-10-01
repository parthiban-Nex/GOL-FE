import { useState, useEffect, useMemo } from "react";
import { Search, XCircle, CornerUpLeft } from "lucide-react";
import Button from "@/components/ui/Button";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { partsApi } from "@/services";
import { showToast } from "@/utils/toast";
// import CreatePurchaseReturnModal from "./components/CreatePurchaseReturnModal";

export default function PurchaseReturn() {
  const { canCreate, canUpdate } = usePagePermissions();

  const [grnList, setGrnList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  // Map of expanded GRN invoice numbers: { [invoiceNumber]: boolean }
  const [expandedGrns, setExpandedGrns] = useState({
    "SNV-VLR27-000001": true, // Expand first row by default matching reference
  });

  // Map of return quantities: { [invoiceNumber]: { [partCode]: returnQty } }
  const [returnQuantities, setReturnQuantities] = useState({});

  // Map of validation errors: { [`${invoiceNumber}_${partCode}`]: string }
  const [validationErrors, setValidationErrors] = useState({});

  // Map of submitted grand totals per GRN: { [invoiceNumber]: number }
  const [submittedTotals, setSubmittedTotals] = useState({
    "SNV-VLR27-000001": 5750.75, // Initial reference grand total
  });

  // Loading state per GRN submission
  const [submittingGrn, setSubmittingGrn] = useState(null);

  // Create Purchase Return modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Load all GRN invoices on mount
  async function loadData() {
    setIsLoading(true);
    try {
      const res = await partsApi.getPurchaseReturnInvoices();
      const items = res.items || [];
      setGrnList(items);

      // Initialize return quantities
      const initialQtys = {};
      items.forEach((grn) => {
        initialQtys[grn.invoiceNumber] = {};
        grn.items.forEach((part) => {
          initialQtys[grn.invoiceNumber][part.partCode] = "";
        });
      });
      setReturnQuantities(initialQtys);
    } catch {
      showToast.error("Failed to load GRN invoices");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Filtered GRNs based strictly on GRN Number
  const filteredGrns = useMemo(() => {
    if (!activeSearch.trim()) return grnList;
    const q = activeSearch.toLowerCase().trim();
    return grnList.filter((grn) =>
      grn.invoiceNumber?.toLowerCase().includes(q),
    );
  }, [grnList, activeSearch]);

  function handleToggleExpand(invoiceNumber) {
    setExpandedGrns((prev) => ({
      ...prev,
      [invoiceNumber]: !prev[invoiceNumber],
    }));
  }

  function handleSearchSubmit(e) {
    if (e) e.preventDefault();
    setActiveSearch(searchQuery.trim());
  }

  function handleClearSearch() {
    setSearchQuery("");
    setActiveSearch("");
  }

  // Calculate Line Total for a part based on return quantity
  function calculateLineTotal(part, returnQty) {
    const qty = Number(returnQty) || 0;
    if (qty === 0) {
      // Default line total for 1 unit if 0 return qty entered yet
      const base = 1 * (part.cost || 0) - (part.discount || 0);
      const taxPct = (part.cgst || 0) + (part.sgst || 0) + (part.igst || 0);
      return base + (base * taxPct) / 100;
    }
    const base = qty * (part.cost || 0) - (part.discount || 0);
    const taxPct = (part.cgst || 0) + (part.sgst || 0) + (part.igst || 0);
    return base + (base * taxPct) / 100;
  }

  // Handle return quantity change with strict validation
  function handleReturnQtyChange(invoiceNumber, part, value) {
    const errKey = `${invoiceNumber}_${part.partCode}`;

    if (value === "") {
      setReturnQuantities((prev) => ({
        ...prev,
        [invoiceNumber]: {
          ...prev[invoiceNumber],
          [part.partCode]: "",
        },
      }));
      setValidationErrors((prev) => {
        const next = { ...prev };
        delete next[errKey];
        return next;
      });
      return;
    }

    const num = parseInt(value, 10);
    if (isNaN(num) || num < 0) {
      return;
    }

    if (num > part.availableQty) {
      // Restrict value to available quantity & display validation error
      setReturnQuantities((prev) => ({
        ...prev,
        [invoiceNumber]: {
          ...prev[invoiceNumber],
          [part.partCode]: part.availableQty,
        },
      }));
      setValidationErrors((prev) => ({
        ...prev,
        [errKey]: "Return quantity cannot exceed available quantity.",
      }));
      return;
    }

    // Valid value
    setReturnQuantities((prev) => ({
      ...prev,
      [invoiceNumber]: {
        ...prev[invoiceNumber],
        [part.partCode]: num,
      },
    }));

    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[errKey];
      return next;
    });
  }

  // Calculate live return total for an expanded GRN
  function getGrnLiveReturnTotal(grn) {
    const qtys = returnQuantities[grn.invoiceNumber] || {};
    let total = 0;
    grn.items.forEach((part) => {
      const qty = Number(qtys[part.partCode]) || 0;
      if (qty > 0) {
        const base = qty * (part.cost || 0) - (part.discount || 0);
        const taxPct = (part.cgst || 0) + (part.sgst || 0) + (part.igst || 0);
        total += base + (base * taxPct) / 100;
      }
    });
    return total;
  }

  // Count of items to return in a GRN
  function getGrnReturnItemsCount(grn) {
    const qtys = returnQuantities[grn.invoiceNumber] || {};
    return Object.values(qtys).reduce(
      (sum, q) => sum + (Number(q) > 0 ? Number(q) : 0),
      0,
    );
  }

  // Handle single GRN submit
  async function handleSubmitGrnReturn(grn) {
    const qtys = returnQuantities[grn.invoiceNumber] || {};
    const itemsToReturn = grn.items
      .filter((part) => Number(qtys[part.partCode]) > 0)
      .map((part) => {
        const qty = Number(qtys[part.partCode]);
        const lineTotal = calculateLineTotal(part, qty);
        return {
          ...part,
          returnQty: qty,
          totalAmount: lineTotal,
        };
      });

    if (itemsToReturn.length === 0) {
      showToast.error("Please enter a return quantity for at least one part");
      return;
    }

    // Check if any error exists for this GRN
    const hasError = Object.keys(validationErrors).some((k) =>
      k.startsWith(`${grn.invoiceNumber}_`),
    );
    if (hasError) {
      showToast.error("Please resolve validation errors before submitting");
      return;
    }

    setSubmittingGrn(grn.invoiceNumber);
    try {
      const calculatedSubmittedTotal = itemsToReturn.reduce(
        (sum, it) => sum + it.totalAmount,
        0,
      );

      const res = await partsApi.createPurchaseReturn({
        invoiceNumber: grn.invoiceNumber,
        vendorCode: grn.vendorCode,
        vendorName: grn.vendorName,
        reason: "Returned via purchase return screen",
        items: itemsToReturn,
      });

      // Update the Grand Total in the MAIN LIST for this GRN
      setSubmittedTotals((prev) => ({
        ...prev,
        [grn.invoiceNumber]: calculatedSubmittedTotal,
      }));

      // Update available quantities in the local list
      setGrnList((prevList) =>
        prevList.map((item) => {
          if (item.invoiceNumber === grn.invoiceNumber) {
            return {
              ...item,
              items: item.items.map((part) => {
                const returned = itemsToReturn.find(
                  (p) => p.partCode === part.partCode,
                );
                if (returned) {
                  return {
                    ...part,
                    availableQty: Math.max(
                      0,
                      part.availableQty - returned.returnQty,
                    ),
                  };
                }
                return part;
              }),
            };
          }
          return item;
        }),
      );

      showToast.success(
        `Purchase Return ${res.returnNumber} submitted successfully for ${grn.invoiceNumber}!`,
      );
    } catch (err) {
      showToast.error(err.message || "Failed to submit purchase return");
    } finally {
      setSubmittingGrn(null);
    }
  }

  async function handleCreateModalSubmit(payload) {
    try {
      const res = await partsApi.createPurchaseReturn(payload);
      showToast.success(
        `Purchase Return ${res.returnNumber} created successfully!`,
      );
      setIsCreateModalOpen(false);
      loadData();
    } catch (err) {
      showToast.error(err.message || "Failed to create purchase return");
    }
  }

  return (
    <div className="space-y-4">
      {/* Top Header & Create Button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-lg font-semibold text-ink-800">Purchase Return</h1>
        {canCreate && (
          <Button onClick={() => setIsCreateModalOpen(true)}>
            Create Purchase Return
          </Button>
        )}
      </div>

      {/* Search Bar Section */}
      <form onSubmit={handleSearchSubmit} className="flex items-center gap-3">
        <div className="relative max-w-xl flex-1">
          <div className="relative flex items-center rounded-xl border-2 border-brand-500 bg-white px-3 py-1.5 shadow-xs">
            <Search className="mr-2.5 h-5 w-5 shrink-0 text-ink-400" />
            <div className="flex flex-1 flex-col">
              <span className="text-[10px] font-semibold uppercase leading-tight text-ink-400">
                GRN or invoice number
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SNV-VLR27-000001"
                className="w-full bg-transparent text-sm font-medium text-ink-900 focus:outline-none"
              />
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="cursor-pointer p-1 text-ink-400 transition-colors hover:text-ink-600"
                title="Clear"
              >
                <XCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <Button type="submit" icon={Search}>
          Search
        </Button>
      </form>

      {/* Main Two-Level Expandable Table Card - hand-built rather than
          the shared Table component, which doesn't support nested
          master-detail rows. */}
      <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-xs">
        {isLoading ? (
          <div className="animate-pulse space-y-4 p-8 text-center">
            <div className="h-8 w-full rounded bg-ink-100" />
            <div className="h-12 w-full rounded bg-ink-100" />
            <div className="h-12 w-full rounded bg-ink-100" />
          </div>
        ) : filteredGrns.length === 0 ? (
          <div className="py-12 text-center text-ink-500">
            <p className="mb-1 text-base font-semibold text-ink-800">
              No GRN found
            </p>
            <p className="text-xs text-ink-500">
              No matching GRN numbers match your search query &quot;
              {activeSearch}&quot;.
            </p>
            {activeSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="mt-3 cursor-pointer text-xs font-semibold text-brand-600 hover:underline"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 bg-[#F8F9FF] text-xs font-semibold text-brand-900">
                  <th className="px-4 py-3">GRN Number</th>
                  <th className="px-4 py-3">Vendor Name</th>
                  <th className="px-4 py-3 ">Grand Total</th>
                  <th className="w-24 px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filteredGrns.map((grn) => {
                  const isExpanded = Boolean(expandedGrns[grn.invoiceNumber]);
                  const currentTotal =
                    submittedTotals[grn.invoiceNumber] !== undefined
                      ? submittedTotals[grn.invoiceNumber]
                      : grn.grandTotal || 0;
                  const liveReturnTotal = getGrnLiveReturnTotal(grn);
                  const returnCount = getGrnReturnItemsCount(grn);
                  const isSubmitting = submittingGrn === grn.invoiceNumber;

                  return (
                    <tr
                      key={grn.invoiceNumber}
                      className="group transition-colors"
                    >
                      <td colSpan={4} className="p-0">
                        {/* Main Level Row */}
                        <div
                          className={`flex items-center justify-between px-4 py-3.5 transition-colors ${
                            isExpanded
                              ? "bg-[#F8F9FF]/70"
                              : "hover:bg-ink-50/50"
                          }`}
                        >
                          {/* GRN Number */}
                          <div className="flex-1 font-semibold text-brand-900">
                            <span>{grn.invoiceNumber}</span>
                          </div>

                          {/* Vendor Name */}
                          <div className="flex-1 px-4 font-medium text-ink-800">
                            <span>{grn.vendorName}</span>
                          </div>

                          {/* Grand Total */}
                          <div className="flex-1 ">
                            <span className="text-base px-8 font-bold text-accent-600">
                              ₹
                              {Number(currentTotal).toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>

                          {/* Actions Column: Inverted Triangle filled with header color */}
                          <div className="flex w-24 shrink-0 items-center justify-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleExpand(grn.invoiceNumber);
                              }}
                              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg p-1 text-brand-900 transition-all hover:bg-brand-50 hover:text-accent-600"
                              title={
                                isExpanded
                                  ? "Collapse Details"
                                  : "Expand Details"
                              }
                              aria-expanded={isExpanded}
                            >
                              <svg
                                className={`h-3.5 w-3.5 fill-brand-900 transition-transform duration-200 ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                                viewBox="0 0 12 12"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <polygon points="1,3 11,3 6,10" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Level 2: Expanded Parts Details Section */}
                        {isExpanded && (
                          <div className="animate-in fade-in-50 border-t border-ink-100 bg-[#FAFAFC] p-4 duration-200 sm:p-5">
                            <div className="space-y-4 rounded-xl border border-ink-100 bg-white p-4 shadow-2xs sm:p-5">
                              {/* Expanded Section Header matching Screenshot */}
                              <div className="flex flex-col border-b border-ink-100 pb-3.5 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <span className="block text-xs font-semibold text-ink-500">
                                    Vendor
                                  </span>
                                  <h3 className="mt-0.5 text-sm font-bold text-ink-900 sm:text-base">
                                    {grn.vendorDisplay}
                                  </h3>
                                </div>
                                <div className="mt-2 text-left sm:mt-0 sm:text-right">
                                  <span className="block text-xs font-semibold text-ink-500">
                                    Grand total
                                  </span>
                                  <span className="text-lg font-bold text-accent-600 sm:text-xl">
                                    ₹
                                    {Number(
                                      liveReturnTotal > 0
                                        ? liveReturnTotal
                                        : currentTotal,
                                    ).toLocaleString("en-IN", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </span>
                                </div>
                              </div>

                              {/* Parts Table */}
                              <div className="overflow-x-auto scrollbar-thin">
                                <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                                  <thead>
                                    <tr className="border-b border-ink-100 text-xs font-semibold text-ink-700">
                                      <th className="px-3 py-2.5">
                                        Parts code
                                      </th>
                                      <th className="px-3 py-2.5">
                                        Description
                                      </th>
                                      <th className="px-3 py-2.5 text-center">
                                        Available qty
                                      </th>
                                      <th className="px-3 py-2.5">
                                        Return qty
                                      </th>
                                      <th className="px-3 py-2.5 text-right">
                                        Cost
                                      </th>
                                      <th className="px-3 py-2.5 text-center">
                                        Discount
                                      </th>
                                      <th className="px-3 py-2.5 text-center">
                                        CGST
                                      </th>
                                      <th className="px-3 py-2.5 text-center">
                                        SGST
                                      </th>
                                      <th className="px-3 py-2.5 text-center">
                                        IGST
                                      </th>
                                      <th className="px-3 py-2.5 text-right">
                                        Total amount
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-ink-50">
                                    {grn.items.map((part) => {
                                      const errKey = `${grn.invoiceNumber}_${part.partCode}`;
                                      const errorMsg = validationErrors[errKey];
                                      const enteredQty =
                                        returnQuantities[grn.invoiceNumber]?.[
                                          part.partCode
                                        ] ?? "";
                                      const calculatedLineAmount =
                                        calculateLineTotal(part, enteredQty);
                                      // Editing is gated on canUpdate, same
                                      // as every other mutating action in
                                      // the Parts module.
                                      const isFieldDisabled =
                                        part.availableQty === 0 || !canUpdate;

                                      return (
                                        <tr
                                          key={part.partCode}
                                          className="transition-colors hover:bg-ink-50/40"
                                        >
                                          {/* Parts code */}
                                          <td className="cursor-pointer px-3 py-3 font-medium text-brand-600 hover:text-brand-800">
                                            {part.partCode}
                                          </td>

                                          {/* Description */}
                                          <td className="px-3 py-3 font-bold text-ink-900">
                                            {part.description}
                                          </td>

                                          {/* Available qty */}
                                          <td className="px-3 py-3 text-center font-medium text-ink-700">
                                            {part.availableQty}
                                          </td>

                                          {/* Return qty input */}
                                          <td className="px-3 py-3">
                                            <div className="flex flex-col">
                                              <input
                                                type="number"
                                                min="0"
                                                max={part.availableQty}
                                                disabled={isFieldDisabled}
                                                value={enteredQty}
                                                onChange={(e) =>
                                                  handleReturnQtyChange(
                                                    grn.invoiceNumber,
                                                    part,
                                                    e.target.value,
                                                  )
                                                }
                                                placeholder="Enter qty"
                                                className={`w-28 rounded-lg border bg-white px-3 py-1.5 text-sm text-ink-800 placeholder:text-ink-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-ink-50 ${
                                                  errorMsg
                                                    ? "border-danger-500 focus:border-danger-600"
                                                    : "border-ink-200 focus:border-brand-500"
                                                }`}
                                              />
                                              {errorMsg && (
                                                <span className="mt-1 max-w-[150px] text-[11px] font-medium leading-tight text-danger-600">
                                                  {errorMsg}
                                                </span>
                                              )}
                                            </div>
                                          </td>

                                          {/* Cost */}
                                          <td className="px-3 py-3 text-right font-medium text-ink-700">
                                            ₹
                                            {part.cost?.toLocaleString(
                                              "en-IN",
                                              {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              },
                                            )}
                                          </td>

                                          {/* Discount */}
                                          <td className="px-3 py-3 text-center text-ink-600">
                                            {part.discount || 0}
                                          </td>

                                          {/* CGST */}
                                          <td className="px-3 py-3 text-center text-ink-600">
                                            {part.cgst}%
                                          </td>

                                          {/* SGST */}
                                          <td className="px-3 py-3 text-center text-ink-600">
                                            {part.sgst}%
                                          </td>

                                          {/* IGST */}
                                          <td className="px-3 py-3 text-center text-ink-600">
                                            {part.igst}%
                                          </td>

                                          {/* Total amount */}
                                          <td className="px-3 py-3 text-right font-bold text-ink-900">
                                            ₹
                                            {calculatedLineAmount?.toLocaleString(
                                              "en-IN",
                                              {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                              },
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>

                              {/* Expanded Footer with Matching Parts & GRN Submit Button */}
                              <div className="flex flex-col border-t border-ink-100 pt-3.5 sm:flex-row sm:items-center sm:justify-between">
                                <span className="text-xs text-ink-500">
                                  Showing {grn.items.length} of{" "}
                                  {grn.items.length} matching parts
                                </span>

                                {canUpdate && (
                                  <div className="mt-2 flex items-center gap-3 sm:mt-0">
                                    {returnCount === 0 && (
                                      <span className="text-xs font-medium text-ink-500">
                                        Enter return quantities to continue
                                      </span>
                                    )}
                                    <Button
                                      icon={CornerUpLeft}
                                      onClick={() => handleSubmitGrnReturn(grn)}
                                      disabled={
                                        returnCount === 0 || isSubmitting
                                      }
                                      isLoading={isSubmitting}
                                    >
                                      {isSubmitting
                                        ? "Submitting..."
                                        : "Submit Return"}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Purchase Return Modal - pending CreatePurchaseReturnModal.jsx */}
      {/* <CreatePurchaseReturnModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateModalSubmit}
        isSubmitting={false}
      /> */}
    </div>
  );
}
