import { useState } from "react";
import clsx from "clsx";
import EstimateItemsTable from "@/components/estimates/EstimateItemsTable";
import PartsSearchDropdown from "@/components/estimates/PartsSearchDropdown";
import PartsCatalogueModal, {
  filterCatalogue,
} from "@/components/catalogue/PartsCatalogueModal";
import { CATEGORIES, CATALOG } from "@/pages/service/mockEstimates";
import { estimateApi } from "@/services";
import { isSuccess } from "@/utils/apiResponse";
import { showToast } from "@/utils/toast";
import { ConfirmModal } from "@/components/ui/Modal";
import { Loader2 } from "lucide-react";
import {
  buildLineItemDetailsBody,
  mapLineItemDetails,
} from "@/utils/estimateDetail";

const GST_DEFAULT_SPLIT = { sgst: 9, cgst: 9, igst: 0 };

export default function Step2Items({
  estimate,
  onChange,
  onToggleGst,
  isGstSaving = false,
  getLineItemContext, // async () => ({ customerState, modelSegment })
  // async (section, rowId) => boolean - saves the removal (Estimate wizard).
  // Without it, rows are only removed on screen (e.g. Job Card Step 3).
  onRemoveLine,
  isRefreshing = false, // getEstimate reload in progress
}) {
  const [mode, setMode] = useState("search"); // search | catalog
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [query, setQuery] = useState("");
  // Search By Catalogue opens the Parts Catalogue modal; Explore Product
  // hands back a selection, and the matching parts are listed below.
  const [isCatalogueOpen, setIsCatalogueOpen] = useState(false);
  const [exploredParts, setExploredParts] = useState(null);
  const [isAddingItems, setIsAddingItems] = useState(false);

  // Search "Add": POST /serviceEstimate/getEstimateLineItemDetails for the
  // ticked items, then add them with the rate / HSN / SAC / GST it returns.
  // The search's own Qty / Rate are kept where the details have nothing.
  async function handleAddSelected(items) {
    if (isAddingItems) return;
    setIsAddingItems(true);
    let details = {};
    try {
      const context = getLineItemContext
        ? await getLineItemContext()
        : { customerState: "", modelSegment: "" };
      const response = await estimateApi.getLineItemDetails(
        buildLineItemDetailsBody(items, context),
      );
      if (isSuccess(response)) details = mapLineItemDetails(response);
      else showToast.error(response?.message || "Couldn't load item details.");
    } catch (err) {
      showToast.error(err.message || "Couldn't load item details.");
    } finally {
      setIsAddingItems(false);
    }
    handleAddFromSearch(
      items.map((item) => {
        const d =
          details[`${item.catalog.kind}-${item.catalog.sourceId}`] ??
          details[`${item.catalog.kind}-code-${item.catalog.code}`];
        if (!d) return item;
        return {
          ...item,
          rate:
            d.rate != null && Number(d.rate) > 0 ? Number(d.rate) : item.rate,
          catalog: {
            ...item.catalog,
            hsn: d.hsn || item.catalog.hsn,
            sac: d.sac,
          },
          gst:
            d.sgst != null || d.cgst != null || d.igst != null
              ? {
                  sgst: Number(d.sgst ?? 0),
                  cgst: Number(d.cgst ?? 0),
                  igst: Number(d.igst ?? 0),
                }
              : null,
        };
      }),
    );
  }

  function handleAddFromSearch(items) {
    const nextParts = [...(estimate.parts ?? [])];
    const nextLabour = [...(estimate.labour ?? [])];
    const nextOsl = [...(estimate.osl ?? [])];
    for (const { catalog, qty, rate, gst } of items) {
      const split = gst ?? GST_DEFAULT_SPLIT;
      const base = {
        id: `row-${catalog.rowKey ?? catalog.id}-${Date.now()}`,
        // Backend id of the part / labour / OSL (searchEstimateLineItems).
        itemId: catalog.sourceId ?? null,
        rate,
        sgst: split.sgst,
        cgst: split.cgst,
        igst: split.igst,
        disc: 0,
      };
      if (catalog.kind === "Part") {
        nextParts.push({
          ...base,
          partNo: catalog.code,
          name: catalog.name,
          hsn: catalog.hsn,
          qty,
        });
      } else if (catalog.kind === "Labour") {
        nextLabour.push({
          ...base,
          sac: catalog.sac,
          code: catalog.code,
          description: catalog.name,
          type: catalog.type,
          hrs: qty,
        });
      } else {
        nextOsl.push({
          ...base,
          sac: catalog.sac,
          code: catalog.code,
          description: catalog.name,
          type: catalog.type,
          hrs: qty,
        });
      }
    }
    onChange({
      ...estimate,
      parts: nextParts,
      labour: nextLabour,
      osl: nextOsl,
    });
  }

  function replaceSection(key, rows) {
    onChange({ ...estimate, [key]: rows });
  }

  // Delete icon. With onRemoveLine it asks first, then the wizard sends
  // updateServiceEstimate with the remaining lines.
  const [pendingRemove, setPendingRemove] = useState(null); // { key, row }
  const [isRemoving, setIsRemoving] = useState(false);

  function removeFromSection(key, id) {
    if (onRemoveLine) {
      const row = (estimate[key] ?? []).find((r) => r.id === id);
      if (row) setPendingRemove({ key, row });
      return;
    }
    onChange({ ...estimate, [key]: estimate[key].filter((r) => r.id !== id) });
  }

  async function confirmRemove() {
    if (!pendingRemove || isRemoving) return;
    setIsRemoving(true);
    try {
      const ok = await onRemoveLine(pendingRemove.key, pendingRemove.row.id);
      if (ok) setPendingRemove(null);
    } finally {
      setIsRemoving(false);
    }
  }

  const SECTION_LABEL = { parts: "part", labour: "labour", osl: "OSL" };
  const pendingName = pendingRemove
    ? [
        pendingRemove.row.partNo || pendingRemove.row.code,
        pendingRemove.row.name || pendingRemove.row.description,
      ]
        .filter(Boolean)
        .join(" - ")
    : "";

  const isCatalog = mode === "catalog";
  // After Explore Product, show exactly what the catalogue selection
  // matched; before it, fall back to the category chips below.
  const catalogParts =
    exploredParts ??
    CATALOG.filter((c) => c.kind === "Part" && c.category === category);

  function openCatalogue() {
    setMode("catalog");
    setIsCatalogueOpen(true);
  }

  function handleExplore(selection) {
    setExploredParts(
      filterCatalogue(
        CATALOG.filter((c) => c.kind === "Part"),
        selection,
      ),
    );
    setIsCatalogueOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ">
        <div className="inline-flex items-center gap-3 text-sm font-semibold ">
          <button
            type="button"
            onClick={() => setMode("search")}
            className={clsx(!isCatalog ? "text-ink-800" : "text-ink-500")}
          >
            Labour/ Parts Search
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={isCatalog}
            onClick={() => (isCatalog ? setMode("search") : openCatalogue())}
            className={clsx(
              "relative h-6 w-11 rounded-full transition-colors",
              isCatalog ? "bg-brand-500" : "bg-accent-500",
            )}
          >
            <span
              className={clsx(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                isCatalog ? "translate-x-0.5" : "-translate-x-5",
              )}
            />
          </button>
          <button
            type="button"
            onClick={openCatalogue}
            className={clsx(isCatalog ? "text-ink-800" : "text-ink-500")}
          >
            Search By Catalogue
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-ink-700">Include GST</span>
          <div className="inline-flex items-center gap-2">
            <span
              className={clsx(
                "text-sm",
                !estimate.includeGST
                  ? "font-semibold text-ink-800"
                  : "text-ink-400",
              )}
            >
              No
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={estimate.includeGST}
              disabled={isGstSaving}
              onClick={() =>
                onToggleGst
                  ? onToggleGst(!estimate.includeGST)
                  : onChange({ ...estimate, includeGST: !estimate.includeGST })
              }
              className={clsx(
                "relative h-6 w-11 rounded-full transition-colors disabled:opacity-60",
                estimate.includeGST ? "bg-brand-500" : "bg-ink-300",
              )}
            >
              <span
                className={clsx(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                  estimate.includeGST ? "translate-x-0" : "-translate-x-5",
                )}
              />
            </button>
            <span
              className={clsx(
                "text-sm",
                estimate.includeGST
                  ? "font-semibold text-ink-800"
                  : "text-ink-400",
              )}
            >
              Yes
            </span>
          </div>
        </div>
      </div>

      <PartsSearchDropdown
        query={query}
        onQueryChange={setQuery}
        onAdd={handleAddSelected}
        isAdding={isAddingItems}
      />

      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setCategory(c);
              setExploredParts(null);
              // In search mode a chip searches for that category.
              if (!isCatalog) setQuery(c);
            }}
            className={clsx(
              "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
              category === c
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {isCatalog && exploredParts && catalogParts.length === 0 && (
        <div className="rounded-lg border border-dashed border-ink-200 bg-ink-50/40 p-4 text-sm text-ink-500">
          No parts match that catalogue selection.{" "}
          <button
            type="button"
            onClick={() => setIsCatalogueOpen(true)}
            className="font-semibold text-brand-600 hover:underline"
          >
            Change selection
          </button>
        </div>
      )}

      {isCatalog && catalogParts.length > 0 && (
        <div className="rounded-lg border border-dashed border-ink-200 bg-ink-50/40 p-4 text-sm text-ink-600">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-semibold">
              {exploredParts ? "Catalogue results" : `${category} catalog`}
            </p>
            <button
              type="button"
              onClick={() => setIsCatalogueOpen(true)}
              className="text-xs font-semibold text-brand-600 hover:underline"
            >
              Open Parts Catalogue
            </button>
          </div>
          <ul className="space-y-1.5">
            {catalogParts.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between text-xs"
              >
                <span>
                  {p.name} <span className="text-ink-400">({p.code})</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    handleAddFromSearch([{ catalog: p, qty: 1, rate: p.rate }])
                  }
                  className="rounded-md border border-brand-200 bg-white px-2 py-0.5 text-brand-600 hover:bg-brand-50"
                >
                  + Add
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isRefreshing && (
        <p
          className="flex items-center gap-2 text-xs text-ink-500"
          role="status"
        >
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Refreshing parts, labour and OSL from the saved estimate...
        </p>
      )}

      <EstimateItemsTable
        variant="parts"
        rows={estimate.parts ?? []}
        includeGST={estimate.includeGST}
        onChange={(rows) => replaceSection("parts", rows)}
        onRemove={(id) => removeFromSection("parts", id)}
      />
      <EstimateItemsTable
        variant="labour"
        rows={estimate.labour ?? []}
        includeGST={estimate.includeGST}
        onChange={(rows) => replaceSection("labour", rows)}
        onRemove={(id) => removeFromSection("labour", id)}
      />
      {(estimate.osl ?? []).length > 0 && (
        <EstimateItemsTable
          variant="osl"
          rows={estimate.osl}
          includeGST={estimate.includeGST}
          onChange={(rows) => replaceSection("osl", rows)}
          onRemove={(id) => removeFromSection("osl", id)}
        />
      )}

      <PartsCatalogueModal
        isOpen={isCatalogueOpen}
        onClose={() => setIsCatalogueOpen(false)}
        onExplore={handleExplore}
      />
      <ConfirmModal
        isOpen={Boolean(pendingRemove)}
        onClose={() => !isRemoving && setPendingRemove(null)}
        onConfirm={confirmRemove}
        isLoading={isRemoving}
        title={`Remove ${SECTION_LABEL[pendingRemove?.key] ?? "line"}?`}
        description={`${pendingName || "This line"} will be removed and the estimate saved.`}
      />
    </div>
  );
}
