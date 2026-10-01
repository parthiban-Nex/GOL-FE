import { ShoppingBag, ShoppingCart, DollarSign, Tag } from "lucide-react";
import Button from "@/components/ui/Button";
import { computeCartSummary } from "@/pages/catalogue/mockCatalogue";
import { formatINR } from "@/utils/estimateMath";

export default function CatalogueCartTable({ items, onRemove, onCheckout }) {
  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <ShoppingBag className="mb-3 h-10 w-10 text-ink-300" />
        <p className="text-base font-semibold text-ink-700">
          Your cart is empty
        </p>
        <p className="mt-1 max-w-sm text-sm text-ink-500">
          Add parts from the catalogue to see them here.
        </p>
      </div>
    );
  }

  const summary = computeCartSummary(items);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-ink-800">Cart</h2>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] text-sm">
          <thead>
            <tr className="border-b border-ink-100 text-left text-xs font-medium text-ink-500">
              <th className="px-3 py-3">Item</th>
              <th className="px-3 py-3">Brand</th>
              <th className="px-3 py-3 text-center">Qty</th>
              <th className="px-3 py-3 text-right">MRP</th>
              <th className="px-3 py-3 text-right">Disc</th>
              <th className="px-3 py-3 text-right">GOL Savings</th>
              <th className="px-3 py-3 text-right">Billing Price</th>
              <th className="px-3 py-3 text-right">Tax</th>
              <th className="px-3 py-3 text-right">Total</th>
              <th className="px-3 py-3 text-center">MyTVS Coins</th>
              <th className="px-3 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr
                key={row.cartId}
                className="border-b border-ink-100 last:border-b-0"
              >
                <td className="px-3 py-4">
                  <p className="font-semibold text-ink-800">{row.name}</p>
                  <p className="mt-0.5 text-xs text-brand-700">{row.code}</p>
                </td>
                <td className="px-3 py-4">
                  <span className="inline-block rounded bg-accent-500 px-2.5 py-1 text-[11px] font-semibold text-white">
                    {row.brand}
                  </span>
                </td>
                <td className="px-3 py-4 text-center font-semibold text-ink-800">
                  {row.qty}
                </td>
                <td className="px-3 py-4 text-right text-ink-700">
                  ₹{Math.round(row.mrp).toLocaleString("en-IN")}
                </td>
                <td className="px-3 py-4 text-right text-ink-700">
                  {row.discountPerUnit
                    ? `₹${Math.round(row.discountPerUnit).toLocaleString("en-IN")}`
                    : "—"}
                </td>
                <td className="px-3 py-4 text-right text-emerald-600">
                  {row.golSavings
                    ? `₹${Math.round(row.golSavings).toLocaleString("en-IN")}`
                    : "—"}
                </td>
                <td className="px-3 py-4 text-right text-ink-700">
                  ₹
                  {Math.round(row.billingPrice ?? row.saleRate).toLocaleString(
                    "en-IN",
                  )}
                </td>
                <td className="px-3 py-4 text-right text-ink-700">
                  ₹{Math.round(row.tax || 0).toLocaleString("en-IN")}
                </td>
                <td className="px-3 py-4 text-right font-semibold text-ink-800">
                  ₹{Math.round(row.totalAmount || 0).toLocaleString("en-IN")}
                </td>
                <td className="px-3 py-4 text-center text-ink-500">
                  {row.pointsEarned ? `+${row.pointsEarned}` : "—"}
                </td>
                <td className="px-3 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onRemove(row.cartId)}
                    className="text-sm cursor-pointer font-semibold text-accent-600 hover:text-accent-700"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary card — orange top border */}
      <div className="rounded-xl border border-t-2 border-ink-100 border-t-accent-500 bg-white p-5">
        <div className="grid  lg:grid-cols-6 lg:items-center">
          {/* Cart */}
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent-50 text-accent-600">
              <ShoppingCart className="h-5 w-5" />
            </div>

            <div>
              <p className="text-base font-semibold text-ink-800">Cart</p>

              <div className="mt-1.5 space-y-0.5 text-sm">
                <p>
                  <span className="text-ink-500">Total Items: </span>
                  <span className="font-semibold text-ink-800">
                    {summary.totalItems} Items
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

          {/* Total Amount + GST */}
          <div>
            <p className="text-base font-semibold text-ink-800 mb-7.5"></p>
            <div className="mt-1.5 space-y-0.5 text-sm">
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
          </div>
          {/* Discount + Grand Total */}
          <div>
            <p className="text-base font-semibold text-ink-800 mb-7.5"></p>
            <div className="mt-1.5 space-y-0.5 text-sm">
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
                <span className="font-bold text-accent-600">
                  ₹{Math.round(summary.grandTotal).toLocaleString("en-IN")}
                </span>
              </p>
            </div>
          </div>

          {/* GOL Savings */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <Tag className="h-3.5 w-3.5" />
              Total GOL Savings:
              {summary.totalSavings
                ? ` ₹${Math.round(summary.totalSavings)}`
                : " ₹—"}
            </span>
          </div>

          {/* MyTVS Coins */}
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              <DollarSign className="h-3.5 w-3.5" />+{summary.totalPointsEarned}{" "}
              MyTVS Coins Earned!
            </span>
          </div>

          {/* Checkout */}
          <div>
            <Button onClick={onCheckout}>Proceed to Checkout</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
