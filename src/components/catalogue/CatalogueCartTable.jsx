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
      [itemKey]: { loading: true, checked: true, qty: 0 },
    }));

    try {
      const res = await catalogueApi.getStockList({ partNumber });
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
        [itemKey]: { loading: false, checked: true, qty: totalQty },
      }));
    } catch (err) {
      console.error("Failed to check stock:", err);
      setStockStatusMap((prev) => ({
        ...prev,
        [itemKey]: { loading: false, checked: true, qty: 0 },
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
      <h2 className="text-lg font-semibold text-ink-800">Cart</h2>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1150px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-xs font-semibold text-ink-500">
              <th className="w-10 px-4 py-3 text-center">
                <input
                  type="checkbox"
                  ref={headerCheckboxRef}
                  checked={allItemsSelected}
                  onChange={handleToggleSelectAll}
                  className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500 cursor-pointer accent-[#EA580C]"
                  aria-label="Select all items"
                />
              </th>
              <th className="px-4 py-3 text-left">Item</th>
              <th className="px-4 py-3 text-left">Brand</th>
              <th className="px-4 py-3 text-center">Qty</th>
              <th className="px-4 py-3 text-right">MRP</th>
              <th className="px-4 py-3 text-right">Disc</th>
              <th className="px-4 py-3 text-right">GOL Savings</th>
              <th className="px-4 py-3 text-right">Billing Price</th>
              <th className="px-4 py-3 text-right">Tax</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-center">MyTVS Coins</th>
              <th className="px-4 py-3 text-center">Stock</th>
              <th className="px-4 py-3 text-center">Action</th>
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
                row.billingPrice ?? row.list_price ?? row.saleRate ?? mrp,
              );
              const tax = Number(row.tax ?? 0);
              const total = Number(
                row.totalAmount ??
                  billingPrice * qty +
                    (tax > 0 ? (billingPrice * qty * tax) / 100 : 0),
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

              return (
                <tr
                  key={itemKey}
                  className={`border-b border-ink-100 last:border-b-0 transition-colors ${
                    isChecked ? "bg-orange-50/30 hover:bg-orange-50/50" : "hover:bg-ink-50/50"
                  }`}
                >
                  {/* Row Checkbox */}
                  <td className="w-10 px-4 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleItem(itemKey)}
                      className="h-4 w-4 rounded border-gray-300 text-accent-600 focus:ring-accent-500 cursor-pointer accent-[#EA580C]"
                      aria-label={`Select item ${partCode}`}
                    />
                  </td>

                  {/* Item */}
                  <td className="max-w-[280px] px-4 py-4">
                    <p className="text-xs font-bold uppercase leading-snug tracking-wide text-ink-800">
                      {partName}
                    </p>
                    <p className="mt-1 text-xs font-medium text-brand-700 font-mono">
                      {partCode}
                    </p>
                  </td>

                  {/* Brand */}
                  <td className="px-4 py-4">
                    <span className="inline-block rounded bg-[#FFF4ED] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#E65100]">
                      {brandName}
                    </span>
                  </td>

                  {/* Qty */}
                  <td className="px-4 py-4 text-center font-semibold text-ink-800">
                    {onUpdateQty ? (
                      <div className="flex items-center justify-center">
                        <CatalogueQtyStepper
                          value={qty}
                          onChange={(newQty) => {
                            const action =
                              newQty > qty ? "increase" : "decrease";
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
                  <td className="px-4 py-4 text-right font-medium text-ink-700">
                    ₹{Math.round(mrp).toLocaleString("en-IN")}
                  </td>

                  {/* Disc */}
                  <td className="px-4 py-4 text-right text-ink-700">
                    {disc > 0
                      ? `₹${Math.round(disc).toLocaleString("en-IN")}`
                      : "₹0"}
                  </td>

                  {/* GOL Savings */}
                  <td className="px-4 py-4 text-right text-ink-700">
                    {golSavings > 0
                      ? `₹${Math.round(golSavings).toLocaleString("en-IN")}`
                      : "—"}
                  </td>

                  {/* Billing Price */}
                  <td className="px-4 py-4 text-right font-medium text-ink-700">
                    ₹{Math.round(billingPrice).toLocaleString("en-IN")}
                  </td>

                  {/* Tax */}
                  <td className="px-4 py-4 text-right text-ink-700">
                    ₹{Math.round(tax).toLocaleString("en-IN")}
                  </td>

                  {/* Total */}
                  <td className="px-4 py-4 text-right font-semibold text-ink-800">
                    ₹{Math.round(total).toLocaleString("en-IN")}
                  </td>

                  {/* MyTVS Coins */}
                  <td className="px-4 py-4 text-center text-ink-500">
                    {coins > 0 ? `+${coins}` : "—"}
                  </td>

                  {/* Stock - Inline status matching screenshot */}
                  <td className="px-4 py-4 text-center">
                    {(() => {
                      const stockInfo = stockStatusMap[itemKey];

                      if (stockInfo?.loading) {
                        return (
                          <div className="flex items-center justify-center gap-1.5 text-xs text-ink-500">
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#EA580C] border-t-transparent" />
                            <span>Checking...</span>
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
                          className="inline-flex items-center gap-1 rounded border border-[#EA580C] px-3 py-1 text-xs font-semibold text-[#EA580C] hover:bg-[#FFF4ED] transition-colors cursor-pointer"
                        >
                          Check Stock
                        </button>
                      );
                    })()}
                  </td>

                  {/* Action (Remove icon) */}
                  <td className="px-4 py-4 text-center">
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

      {/* Summary card with orange top border indicator */}
      <div className="mt-6 rounded-xl border border-ink-200 border-t-2 border-t-accent-500 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Column 1: Cart Icon & Items Count */}
          <div className="flex min-w-[150px] items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold text-ink-800">Cart</p>
              <div className="mt-1 space-y-0.5 text-xs text-ink-600">
                <p>
                  <span className="text-ink-500">Total Items: </span>
                  <span className="font-semibold text-ink-800">
                    {items.length} Items
                  </span>
                </p>
                <p>
                  <span className="text-ink-500">Total Qty: </span>
                  <span className="font-semibold text-ink-800">
                    {summary.totalQuantity}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Column 2: Total Amount & GST */}
          <div className="min-w-[140px] space-y-1 text-xs">
            <p>
              <span className="text-ink-500">Total Amount: </span>
              <span className="font-semibold text-ink-800">
                ₹{Math.round(summary.totalAmount).toLocaleString("en-IN")}
              </span>
            </p>
            <p>
              <span className="text-ink-500">GST: </span>
              <span className="font-semibold text-ink-800">
                ₹{Math.round(summary.totalTax).toLocaleString("en-IN")}
              </span>
            </p>
          </div>

          {/* Column 3: Total Discount & Grand Total */}
          <div className="min-w-[160px] space-y-1 text-xs">
            <p>
              <span className="text-ink-500">Total Discount: </span>
              <span className="font-semibold text-ink-800">
                ₹
                {Math.round(summary.totalDiscountAmount).toLocaleString(
                  "en-IN",
                )}
              </span>
            </p>
            <p>
              <span className="text-ink-500">Grand Total: </span>
              <span className="text-sm font-bold text-accent-600">
                ₹{Math.round(summary.grandTotal).toLocaleString("en-IN")}
              </span>
            </p>
          </div>

          {/* Column 4: GOL Savings Pill Badge */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <Tag className="h-3.5 w-3.5 text-emerald-600" />
              Total GOL Savings:{" "}
              {summary.totalSavings > 0
                ? `₹${Math.round(summary.totalSavings)}`
                : "₹0"}
            </span>
          </div>

          {/* Column 5: MyTVS Coins Pill Badge */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              <DollarSign className="h-3.5 w-3.5 text-blue-600" />+
              {summary.totalPointsEarned} MyTVS Coins Earned!
            </span>
          </div>

          {/* Column 6: Proceed to Checkout Button */}
          <div className="shrink-0">
            <button
              type="button"
              disabled={selectedItems.length === 0}
              onClick={handleCheckoutClick}
              className={`inline-flex w-full items-center justify-center rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors lg:w-auto ${
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
