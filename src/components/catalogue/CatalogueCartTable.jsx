import { useState, useMemo, useRef, useEffect } from "react";
import { ShoppingCart, Tag, DollarSign, X } from "lucide-react";
import CatalogueQtyStepper from "@/components/catalogue/CatalogueQtyStepper";
import { catalogueApi } from "@/services/api/catalogueApi";

export function computeCartSummary(items = []) {
  const totalItems = items.length;
  const totalQuantity = items.reduce(
    (sum, item) => sum + (Number(item.qty) || 1),
    0,
  );

  let totalAmount = 0;
  let totalTax = 0;
  let totalDiscountAmount = 0;
  let totalSavings = 0;
  let totalPointsEarned = 0;

  items.forEach((item) => {
    const qty = Number(item.qty) || 1;
    const mrp = Number(item.part_mrp ?? item.mrp ?? 0);
    const billingPrice = Number(
      item.list_price ?? item.billingPrice ?? item.saleRate ?? mrp,
    );
    const taxVal = Number(item.tax ?? 0);

    const lineBilling = billingPrice * qty;
    totalAmount += lineBilling > 0 ? lineBilling : mrp * qty;

    const taxAmt =
      item.taxAmount !== undefined
        ? Number(item.taxAmount)
        : taxVal > 0 && taxVal < 100
          ? (lineBilling * taxVal) / 100
          : taxVal;
    totalTax += taxAmt;

    const discount = Number(item.discountPerUnit ?? 0);
    totalDiscountAmount += discount * qty;
    totalSavings += Number(item.golSavings ?? Math.max(0, mrp - billingPrice)) * qty;
    totalPointsEarned += Number(
      item.pointsEarned ||
        item.points ||
        item.coins ||
        item.bronzePoints ||
        item.raw?.bronzePoints ||
        item.raw?.pointsEarned ||
        0
    ) * qty;
  });

  const grandTotal = totalAmount + totalTax;

  return {
    totalItems,
    totalQuantity,
    totalAmount,
    totalTax,
    totalDiscountAmount,
    grandTotal,
    totalSavings,
    totalPointsEarned,
  };
}

function getItemKey(item, idx) {
  return String(item?.cartId || item?.part_number || item?.code || item?.id || idx);
}

export default function CatalogueCartTable({
  items = [],
  onRemove,
  onCheckout,
  onUpdateQty,
  onBrowseParts,
}) {
  // Selection state for selective checkout (default empty = 0 selected)
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  // Stock status map for inline stock display (key -> { loading, checked, qty })
  const [stockStatusMap, setStockStatusMap] = useState({});

  // Prune deleted items from selectedIds if items change
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const currentKeys = new Set(items.map((it, idx) => getItemKey(it, idx)));
      let changed = false;
      const next = new Set();
      prev.forEach((id) => {
        if (currentKeys.has(id)) {
          next.add(id);
        } else {
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [items]);

  // Selected items list
  const selectedItems = useMemo(
    () => items.filter((item, idx) => selectedIds.has(getItemKey(item, idx))),
    [items, selectedIds]
  );

  const allItemsSelected = items.length > 0 && selectedItems.length === items.length;
  const isIndeterminate = selectedItems.length > 0 && selectedItems.length < items.length;
  const headerCheckboxRef = useRef(null);

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const handleToggleSelectAll = () => {
    if (allItemsSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((it, idx) => getItemKey(it, idx))));
    }
  };

  const handleToggleItem = (key) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleCheckStock = async (row, itemKey) => {
    const partNumber = String(
      row.part_number || row.code || row.partNumber || row.cartId || ""
    ).trim();

    if (!partNumber) return;

    setStockStatusMap((prev) => ({
      ...prev,
      [itemKey]: { loading: true, checked: true, qty: 0, unavailable: false },
    }));

    try {
      const res = await catalogueApi.getStockList({ partNumber });

      if (res?.isEndpointUnavailable) {
        setStockStatusMap((prev) => ({
          ...prev,
          [itemKey]: { loading: false, checked: true, qty: null, unavailable: true },
        }));
        return;
      }

      const totalQty =
        Number(
          res?.totalAvailableQty ??
            res?.availableQty ??
            res?.data?.totalAvailableQty ??
            (Array.isArray(res?.data)
              ? res.data.reduce((sum, d) => sum + Number(d.qty ?? d.availableQty ?? 0), 0)
              : 0),
        ) || 0;

      setStockStatusMap((prev) => ({
        ...prev,
        [itemKey]: { loading: false, checked: true, qty: totalQty, unavailable: false },
      }));
    } catch (err) {
      console.error("Failed to check stock:", err);
      setStockStatusMap((prev) => ({
        ...prev,
        [itemKey]: { loading: false, checked: true, qty: null, unavailable: true },
      }));
    }
  };

  const handleCheckoutClick = () => {
    if (selectedItems.length === 0) return;
    onCheckout?.(selectedItems);
  };

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-ink-50">
          <ShoppingCart className="h-8 w-8 text-ink-300 stroke-[1.5]" />
        </div>
        <p className="text-sm font-semibold text-ink-600">Your cart is empty</p>
        <div className="mt-5">
          <button
            type="button"
            onClick={onBrowseParts}
            className="inline-flex items-center justify-center rounded-lg bg-accent-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-accent-600 cursor-pointer"
          >
            Browse Parts
          </button>
        </div>
      </div>
    );
  }

  // If user selected items, calculate summary for the selected items to checkout;
  // If no items are selected, show summary for all cart items (matches default view).
  const summaryItems = selectedItems.length > 0 ? selectedItems : items;
  const summary = computeCartSummary(summaryItems);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink-800">Cart</h2>
        <span className="text-xs font-medium text-ink-500">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>

      {/* ─── Mobile Card View (< 768px) ─── */}
      <div className="space-y-3 md:hidden">
        <div className="flex items-center justify-between rounded-lg border border-ink-100 bg-ink-50/60 px-3.5 py-2">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-ink-700">
            <input
              type="checkbox"
              checked={allItemsSelected}
              onChange={handleToggleSelectAll}
              className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500 accent-[#EA580C]"
            />
            Select All ({selectedItems.length}/{items.length})
          </label>
        </div>

        {items.map((row, idx) => {
          const itemKey = getItemKey(row, idx);
          const cartId = row.cartId || row.part_number || row.id || row.code;
          const partName =
            row.name || row.part_desc || row.itemDescription || row.part_number;
          const partCode = row.code || row.part_number;
          const brandName = row.brand || row.product_brand || "MAHINDRA";
          const qty = Number(row.qty || 1);
          const mrp = Number(row.mrp ?? row.part_mrp ?? 0);
          const disc = Number(row.discountPerUnit ?? row.disc ?? 0);
          const golSavings = Number(
            row.golSavings ?? Math.max(0, mrp - (row.billingPrice ?? row.list_price ?? mrp))
          );
          const billingPrice = Number(
            row.billingPrice ?? row.list_price ?? row.saleRate ?? mrp
          );
          const tax = Number(row.tax ?? 0);
          const total = Number(
            row.totalAmount ??
              billingPrice * qty + (tax > 0 ? (billingPrice * qty * tax) / 100 : 0)
          );
          const coins = Number(
            row.pointsEarned ||
              row.points ||
              row.coins ||
              row.bronzePoints ||
              row.raw?.bronzePoints ||
              row.raw?.pointsEarned ||
              0
          );
          const isChecked = selectedIds.has(itemKey);
          const stockInfo = stockStatusMap[itemKey];

          return (
            <div
              key={`m-${itemKey}`}
              className={`rounded-xl border transition-colors p-4 space-y-3.5 ${
                isChecked
                  ? "border-accent-300 bg-orange-50/20 shadow-xs"
                  : "border-ink-200 bg-white shadow-xs"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleItem(itemKey)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500 cursor-pointer accent-[#EA580C]"
                    aria-label={`Select item ${partCode}`}
                  />
                  <div>
                    <p className="text-xs font-bold uppercase leading-snug text-ink-800">
                      {partName}
                    </p>
                    <p className="mt-0.5 text-xs font-mono font-medium text-brand-700">
                      {partCode}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="rounded bg-[#FFF4ED] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#E65100]">
                    {brandName}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemove(cartId)}
                    title="Remove item"
                    className="p-1 text-ink-400 hover:text-rose-600 cursor-pointer transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Price Details Grid */}
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-ink-50/60 p-2.5 text-xs">
                <div>
                  <span className="text-ink-400">MRP: </span>
                  <span className="font-medium text-ink-700">
                    ₹{Math.round(mrp).toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-ink-400">Discount: </span>
                  <span className="font-medium text-ink-700">
                    {disc > 0 ? `₹${Math.round(disc).toLocaleString("en-IN")}` : "₹0"}
                  </span>
                </div>
                <div>
                  <span className="text-ink-400">Billing: </span>
                  <span className="font-semibold text-ink-800">
                    ₹{Math.round(billingPrice).toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-ink-400">Tax: </span>
                  <span className="font-medium text-ink-700">
                    ₹{Math.round(tax).toLocaleString("en-IN")}
                  </span>
                </div>
                {golSavings > 0 && (
                  <div className="col-span-2 text-emerald-700 font-medium">
                    <span>GOL Savings: </span>
                    <span>₹{Math.round(golSavings).toLocaleString("en-IN")}</span>
                  </div>
                )}
                {coins > 0 && (
                  <div className="col-span-2 text-blue-600 font-medium">
                    <span>MyTVS Coins: </span>
                    <span>+{coins}</span>
                  </div>
                )}
                <div className="col-span-2 pt-1 border-t border-ink-200/60 flex items-center justify-between">
                  <span className="font-semibold text-ink-700">Item Total:</span>
                  <span className="font-bold text-sm text-ink-900">
                    ₹{Math.round(total).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Quantity & Stock Check */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div>
                  {onUpdateQty ? (
                    <CatalogueQtyStepper
                      value={qty}
                      onChange={(newQty) => {
                        const action = newQty > qty ? "increase" : "decrease";
                        onUpdateQty(cartId, action, newQty);
                      }}
                      min={1}
                    />
                  ) : (
                    <span className="text-xs font-semibold text-ink-800">Qty: {qty}</span>
                  )}
                </div>

                <div>
                  {stockInfo?.loading ? (
                    <div className="flex items-center gap-1.5 text-xs text-ink-500">
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#EA580C] border-t-transparent" />
                      <span>Checking...</span>
                    </div>
                  ) : stockInfo?.unavailable ? (
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-xs font-medium text-amber-600 whitespace-nowrap"
                        title="Stock checking service not yet deployed on server"
                      >
                        Stock N/A
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCheckStock(row, itemKey)}
                        className="text-[11px] font-medium text-blue-500 hover:text-blue-700 cursor-pointer"
                      >
                        Retry
                      </button>
                    </div>
                  ) : stockInfo?.checked ? (
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-xs font-semibold whitespace-nowrap ${
                          stockInfo.qty > 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        Available: {stockInfo.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCheckStock(row, itemKey)}
                        className="text-[11px] font-medium text-blue-500 hover:text-blue-700 cursor-pointer"
                      >
                        Recheck
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleCheckStock(row, itemKey)}
                      className="inline-flex items-center gap-1 rounded border border-[#EA580C] px-2.5 py-1 text-xs font-semibold text-[#EA580C] hover:bg-[#FFF4ED] transition-colors cursor-pointer"
                    >
                      Check Stock
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Desktop / Tablet Table View (>= 768px) ─── */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-ink-200">
        <table className="w-full min-w-[1050px] text-left text-sm border-separate border-spacing-0">
          <thead>
            <tr className="border-b border-ink-100 text-xs font-semibold text-ink-500 bg-ink-50/50">
              {/* Sticky Checkbox */}
              <th className="sticky left-0 z-20 w-12 px-3 py-3 text-center bg-white border-b border-ink-100">
                <input
                  type="checkbox"
                  ref={headerCheckboxRef}
                  checked={allItemsSelected}
                  onChange={handleToggleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500 cursor-pointer accent-[#EA580C]"
                  aria-label="Select all items"
                />
              </th>
              {/* Sticky Item (Part Name & Code) */}
              <th className="sticky left-12 z-20 min-w-[200px] max-w-[260px] px-3 py-3 text-left bg-white border-b border-r border-ink-200 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                Item
              </th>
              <th className="px-3 py-3 text-left border-b border-ink-100">Brand</th>
              <th className="px-3 py-3 text-center border-b border-ink-100">Qty</th>
              <th className="px-3 py-3 text-right border-b border-ink-100">MRP</th>
              <th className="px-3 py-3 text-right border-b border-ink-100">Disc</th>
              <th className="px-3 py-3 text-right border-b border-ink-100">GOL Savings</th>
              <th className="px-3 py-3 text-right border-b border-ink-100">Billing Price</th>
              <th className="px-3 py-3 text-right border-b border-ink-100">Tax</th>
              <th className="px-3 py-3 text-right border-b border-ink-100">Total</th>
              <th className="px-3 py-3 text-center border-b border-ink-100">MyTVS Coins</th>
              <th className="px-3 py-3 text-center border-b border-ink-100">Stock</th>
              <th className="px-3 py-3 text-center border-b border-ink-100">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row, idx) => {
              const itemKey = getItemKey(row, idx);
              const cartId = row.cartId || row.part_number || row.id || row.code;
              const partName =
                row.name || row.part_desc || row.itemDescription || row.part_number;
              const partCode = row.code || row.part_number;
              const brandName = row.brand || row.product_brand || "MAHINDRA";
              const qty = Number(row.qty || 1);
              const mrp = Number(row.mrp ?? row.part_mrp ?? 0);
              const disc = Number(row.discountPerUnit ?? row.disc ?? 0);
              const golSavings = Number(
                row.golSavings ?? Math.max(0, mrp - (row.billingPrice ?? row.list_price ?? mrp))
              );
              const billingPrice = Number(
                row.billingPrice ?? row.list_price ?? row.saleRate ?? mrp
              );
              const tax = Number(row.tax ?? 0);
              const total = Number(
                row.totalAmount ??
                  billingPrice * qty + (tax > 0 ? (billingPrice * qty * tax) / 100 : 0)
              );
              const coins = Number(
                row.pointsEarned ||
                  row.points ||
                  row.coins ||
                  row.bronzePoints ||
                  row.raw?.bronzePoints ||
                  row.raw?.pointsEarned ||
                  0
              );
              const isChecked = selectedIds.has(itemKey);
              const stockInfo = stockStatusMap[itemKey];
              const stickyBg = isChecked ? "bg-[#FFF9F5]" : "bg-white";

              return (
                <tr
                  key={itemKey}
                  className={`border-b border-ink-100 last:border-b-0 transition-colors ${
                    isChecked ? "bg-orange-50/30 hover:bg-orange-50/50" : "hover:bg-ink-50/50"
                  }`}
                >
                  {/* Sticky Row Checkbox */}
                  <td
                    className={`sticky left-0 z-10 w-12 px-3 py-3.5 text-center border-b border-ink-100 ${stickyBg}`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleItem(itemKey)}
                      className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500 cursor-pointer accent-[#EA580C]"
                      aria-label={`Select item ${partCode}`}
                    />
                  </td>

                  {/* Sticky Item (Part Name & Code) */}
                  <td
                    className={`sticky left-12 z-10 min-w-[200px] max-w-[260px] px-3 py-3.5 border-b border-r border-ink-200 shadow-[2px_0_4px_rgba(0,0,0,0.03)] ${stickyBg}`}
                  >
                    <p className="text-xs font-bold uppercase leading-snug tracking-wide text-ink-800 line-clamp-2">
                      {partName}
                    </p>
                    <p className="mt-1 text-xs font-medium text-brand-700 font-mono">
                      {partCode}
                    </p>
                  </td>

                  {/* Brand */}
                  <td className="px-3 py-3.5 border-b border-ink-100">
                    <span className="inline-block rounded bg-[#FFF4ED] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#E65100]">
                      {brandName}
                    </span>
                  </td>

                  {/* Qty */}
                  <td className="px-3 py-3.5 text-center font-semibold text-ink-800 border-b border-ink-100">
                    {onUpdateQty ? (
                      <div className="flex items-center justify-center">
                        <CatalogueQtyStepper
                          value={qty}
                          onChange={(newQty) => {
                            const action = newQty > qty ? "increase" : "decrease";
                            onUpdateQty(cartId, action, newQty);
                          }}
                          min={1}
                        />
                      </div>
                    ) : (
                      qty
                    )}
                  </td>

                  {/* MRP */}
                  <td className="px-3 py-3.5 text-right font-medium text-ink-700 border-b border-ink-100 whitespace-nowrap">
                    ₹{Math.round(mrp).toLocaleString("en-IN")}
                  </td>

                  {/* Disc */}
                  <td className="px-3 py-3.5 text-right text-ink-700 border-b border-ink-100 whitespace-nowrap">
                    {disc > 0 ? `₹${Math.round(disc).toLocaleString("en-IN")}` : "₹0"}
                  </td>

                  {/* GOL Savings */}
                  <td className="px-3 py-3.5 text-right text-ink-700 border-b border-ink-100 whitespace-nowrap">
                    {golSavings > 0 ? `₹${Math.round(golSavings).toLocaleString("en-IN")}` : "—"}
                  </td>

                  {/* Billing Price */}
                  <td className="px-3 py-3.5 text-right font-medium text-ink-700 border-b border-ink-100 whitespace-nowrap">
                    ₹{Math.round(billingPrice).toLocaleString("en-IN")}
                  </td>

                  {/* Tax */}
                  <td className="px-3 py-3.5 text-right text-ink-700 border-b border-ink-100 whitespace-nowrap">
                    ₹{Math.round(tax).toLocaleString("en-IN")}
                  </td>

                  {/* Total */}
                  <td className="px-3 py-3.5 text-right font-semibold text-ink-800 border-b border-ink-100 whitespace-nowrap">
                    ₹{Math.round(total).toLocaleString("en-IN")}
                  </td>

                  {/* MyTVS Coins */}
                  <td className="px-3 py-3.5 text-center text-ink-500 border-b border-ink-100 whitespace-nowrap">
                    {coins > 0 ? `+${coins}` : "—"}
                  </td>

                  {/* Stock - Inline status */}
                  <td className="px-3 py-3.5 text-center border-b border-ink-100">
                    {(() => {
                      if (stockInfo?.loading) {
                        return (
                          <div className="flex items-center justify-center gap-1.5 text-xs text-ink-500">
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#EA580C] border-t-transparent" />
                            <span>Checking...</span>
                          </div>
                        );
                      }

                      if (stockInfo?.unavailable) {
                        return (
                          <div className="flex flex-col items-center justify-center">
                            <span
                              className="text-xs font-semibold whitespace-nowrap text-amber-600"
                              title="Stock checking service not yet deployed on server"
                            >
                              Stock N/A
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCheckStock(row, itemKey)}
                              className="mt-0.5 text-[11px] font-medium text-blue-500 hover:text-blue-700 cursor-pointer transition-colors"
                            >
                              Retry
                            </button>
                          </div>
                        );
                      }

                      if (stockInfo?.checked) {
                        const isPositive = stockInfo.qty > 0;
                        return (
                          <div className="flex flex-col items-center justify-center">
                            <span
                              className={`text-xs font-semibold whitespace-nowrap ${
                                isPositive ? "text-emerald-600" : "text-rose-600"
                              }`}
                            >
                              Available Stock: {stockInfo.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCheckStock(row, itemKey)}
                              className="mt-0.5 text-[11px] font-medium text-blue-500 hover:text-blue-700 cursor-pointer transition-colors"
                            >
                              Recheck
                            </button>
                          </div>
                        );
                      }

                      return (
                        <button
                          type="button"
                          onClick={() => handleCheckStock(row, itemKey)}
                          className="inline-flex items-center gap-1 rounded border border-[#EA580C] px-3 py-1 text-xs font-semibold text-[#EA580C] hover:bg-[#FFF4ED] transition-colors cursor-pointer whitespace-nowrap"
                        >
                          Check Stock
                        </button>
                      );
                    })()}
                  </td>

                  {/* Action (Remove icon) */}
                  <td className="px-3 py-3.5 text-center border-b border-ink-100">
                    <button
                      type="button"
                      onClick={() => onRemove(cartId)}
                      title="Remove item"
                      className="inline-flex items-center justify-center rounded p-1.5 text-[#EA580C] hover:bg-[#FFF4ED] hover:text-[#C2410C] transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4 stroke-[2.5]" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─── Fully Responsive Summary Card ─── */}
      <div className="mt-6 rounded-xl border border-ink-200 border-t-2 border-t-accent-500 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          {/* Section 1: Cart Icon & Items Count */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold text-ink-800">Cart Summary</p>
              <div className="flex items-center gap-2 text-xs text-ink-500">
                <span>
                  Total Items:{" "}
                  <strong className="text-ink-800">{items.length}</strong>
                </span>
                <span>•</span>
                <span>
                  Total Qty:{" "}
                  <strong className="text-ink-800">{summary.totalQuantity}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Financial Stats & Rewards Badges */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            {/* Financials Breakdown */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <div className="whitespace-nowrap">
                <span className="text-ink-500">Total Amount: </span>
                <span className="font-semibold text-ink-800">
                  ₹{Math.round(summary.totalAmount).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="whitespace-nowrap">
                <span className="text-ink-500">GST: </span>
                <span className="font-semibold text-ink-800">
                  ₹{Math.round(summary.totalTax).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="whitespace-nowrap">
                <span className="text-ink-500">Total Disc: </span>
                <span className="font-semibold text-ink-800">
                  ₹{Math.round(summary.totalDiscountAmount).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="whitespace-nowrap rounded-md bg-orange-50/80 px-2.5 py-1 text-xs border border-orange-200/50">
                <span className="text-ink-600">Grand Total: </span>
                <span className="text-sm font-bold text-accent-600">
                  ₹{Math.round(summary.grandTotal).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Savings & Coins Badges (Strictly whitespace-nowrap and shrink-0 to prevent circular distortion) */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 whitespace-nowrap shadow-xs">
                <Tag className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span>
                  Total GOL Savings:{" "}
                  {summary.totalSavings > 0
                    ? `₹${Math.round(summary.totalSavings).toLocaleString("en-IN")}`
                    : "₹0"}
                </span>
              </span>

              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 whitespace-nowrap shadow-xs">
                <DollarSign className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                <span>+{summary.totalPointsEarned} MyTVS Coins Earned!</span>
              </span>
            </div>
          </div>

          {/* Section 3: Proceed to Checkout Button */}
          <div className="shrink-0 w-full xl:w-auto">
            <button
              type="button"
              disabled={selectedItems.length === 0}
              onClick={handleCheckoutClick}
              className={`inline-flex w-full xl:w-auto items-center justify-center rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors cursor-pointer ${
                selectedItems.length === 0
                  ? "bg-[#C87A50] opacity-60 cursor-not-allowed pointer-events-none"
                  : "bg-accent-500 hover:bg-accent-600 cursor-pointer"
              }`}
            >
              Proceed to Checkout ({selectedItems.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
