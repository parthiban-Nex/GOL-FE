import { useMemo, useState } from "react";
import clsx from "clsx";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import CatalogueTopNav from "@/components/catalogue/CatalogueTopNav";
import CatalogueCartTable from "@/components/catalogue/CatalogueCartTable";
import CatalogueOrdersTable from "@/components/catalogue/CatalogueOrdersTable";
import OrderDetailsModal from "@/components/catalogue/OrderDetailsModal";
import CatalogueQtyStepper from "@/components/catalogue/CatalogueQtyStepper";
import {
  LUBES_TYPE_TABS,
  LUBES_PRODUCTS,
  INITIAL_CART_ITEMS,
  INITIAL_ORDERS,
  ORDER_DETAILS_BY_ENQUIRY,
} from "@/pages/catalogue/mockCatalogue";
import { showToast } from "@/utils/toast";

const MYTVS_TABS = [
  { key: "catalogue", label: "ITEM LIST" },
  { key: "cart", label: "CART" },
  { key: "orders", label: "MY ORDERS" },
];

// Small helper so the coolant dot cell matches the reference exactly.
const COLOUR_HEX = {
  Red: "#dc2626",
  Blue: "#2563eb",
  Green: "#059669",
  Orange: "#ea580c",
};

export default function MyTvsParts() {
  const [tab, setTab] = useState("catalogue");
  const [typeTab, setTypeTab] = useState(LUBES_TYPE_TABS[0].value);
  const [query, setQuery] = useState("");
  const [selectedPack, setSelectedPack] = useState({}); // { familyKey: partNumber }

  const [cart, setCart] = useState(INITIAL_CART_ITEMS);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [openOrder, setOpenOrder] = useState(null);

  // Group by (category|grade|colour) so multi-pack products collapse
  // into one row with pack picker.
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const byFamily = new Map();
    LUBES_PRODUCTS.filter((p) => p.type === typeTab)
      .filter(
        (p) =>
          !q ||
          p.category.toLowerCase().includes(q) ||
          (p.grade ?? "").toLowerCase().includes(q) ||
          (p.colour ?? "").toLowerCase().includes(q) ||
          (p.ratio ?? "").toLowerCase().includes(q) ||
          p.itemDescription.toLowerCase().includes(q) ||
          p.partNumber.toLowerCase().includes(q),
      )
      .forEach((p) => {
        const key = [p.category, p.grade ?? "-", p.colour ?? "-"].join("|");
        if (!byFamily.has(key))
          byFamily.set(key, {
            key,
            category: p.category,
            grade: p.grade,
            colour: p.colour,
            ratio: p.ratio,
            packs: [],
          });
        byFamily.get(key).packs.push(p);
      });
    return Array.from(byFamily.values()).map((f) => ({
      ...f,
      packs: [...f.packs].sort((a, b) => a.mrp - b.mrp),
    }));
  }, [typeTab, query]);

  const isCoolant = typeTab === "COOLANT";

  function handleAdd(pack, delta = 1) {
    const cartId = pack.partNumber;
    const existing = cart.find((c) => c.cartId === cartId);
    if (existing) {
      const nextQty = Math.max(0, existing.qty + delta);
      if (nextQty === 0) return removeFromCart(cartId);
      setCart((cur) =>
        cur.map((c) => (c.cartId === cartId ? bumpQty(c, delta) : c)),
      );
    } else if (delta > 0) {
      const qty = 1;
      const saleRate = pack.sellingPriceWithoutGst;
      const tax = saleRate * 0.18 * qty;
      setCart((cur) => [
        ...cur,
        {
          cartId,
          name: pack.itemDescription,
          code: pack.partNumber,
          brand: "MYTVS",
          qty,
          mrp: pack.mrp,
          saleRate,
          discountPerUnit: +(pack.mrp - saleRate).toFixed(2),
          golSavings: +(pack.mrp - pack.sellingPriceWithGst).toFixed(2),
          billingPrice: saleRate,
          tax: +tax.toFixed(2),
          totalAmount: +(saleRate * qty + tax).toFixed(2),
          pointsEarned: pack.bronzePoints || 0,
          salesPriceGroup: "PRIMARY",
        },
      ]);
    }
  }

  function updateCartQty(cartId, qty) {
    if (qty <= 0)
      return setCart((cur) => cur.filter((c) => c.cartId !== cartId));
    setCart((cur) =>
      cur.map((c) => (c.cartId === cartId ? bumpQty(c, qty - c.qty) : c)),
    );
  }
  function removeFromCart(cartId) {
    setCart((cur) => cur.filter((c) => c.cartId !== cartId));
  }
  function checkout() {
    if (!cart.length) return;
    const enquiryNo = `ENQF${new Date().getFullYear()}${String(orders.length + 22667).padStart(7, "0")}`;
    setOrders((cur) => [
      {
        enquiryNo,
        customerCode: "NMSA0786",
        source: "GOL",
        status: "PROCESSING",
        orderCreationDate: new Date().toISOString(),
      },
      ...cur,
    ]);
    setCart([]);
    showToast.success(`Order ${enquiryNo} placed.`);
    setTab("orders");
  }
  function viewOrder(order) {
    const detail = ORDER_DETAILS_BY_ENQUIRY[order.enquiryNo] || {
      enquiry_no: order.enquiryNo,
      source: order.source,
      status: order.status,
      message: "Details not available yet.",
      reference_no: "",
      order_nos: [],
      parts: [],
    };
    setOpenOrder(detail);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-ink-800">myTvs Parts</h1>
        <CatalogueTopNav
          current={tab}
          onChange={setTab}
          cartCount={cart.length}
          tabs={MYTVS_TABS}
        />
      </div>

      {tab === "catalogue" && (
        <>
          {/* Type sub-tabs with orange underline */}
          <div className="flex flex-wrap items-center gap-6 border-b border-ink-100 pb-3">
            {LUBES_TYPE_TABS.map((t) => {
              const active = typeTab === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTypeTab(t.value)}
                  className={clsx(
                    "relative px-1 pb-1.5 cursor-pointer text-sm font-semibold transition-colors",
                    active
                      ? "text-accent-600 after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:bg-accent-500"
                      : "text-ink-500 hover:text-ink-700",
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <Card padded={false}>
            <div className="flex flex-wrap items-center gap-3 border-b border-ink-100 px-5 py-4">
              <div className="w-full md:w-[92%]">
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by product name, grade, colour, ratio or part number..."
                />
              </div>
              <span className="text-sm font-semibold text-ink-600">
                {groups.length} {groups.length === 1 ? "products" : "products"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-xs font-medium uppercase tracking-wide text-ink-500">
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">
                      {isCoolant ? "Colour" : "Grade"}
                    </th>
                    <th className="px-4 py-3">Pack</th>
                    {isCoolant && <th className="px-4 py-3">Ratio</th>}
                    <th className="px-4 py-3">TVS Part Number</th>
                    <th className="px-4 py-3 text-center">Description</th>
                    <th className="px-4 py-3 text-right">MRP</th>
                    <th className="px-4 py-3 text-right">Selling W/ GST</th>
                    <th className="px-4 py-3 text-right">Selling W/O GST</th>
                    <th className="px-4 py-3 text-center">Loyalty Pts</th>
                    <th className="px-4 py-3 text-center">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {groups.length === 0 && (
                    <tr>
                      <td
                        colSpan={isCoolant ? 11 : 10}
                        className="px-4 py-14 text-center text-sm text-ink-500"
                      >
                        No products in this category match your search.
                      </td>
                    </tr>
                  )}
                  {groups.map((g) => {
                    const chosen = selectedPack[g.key] ?? g.packs[0].partNumber;
                    const pack =
                      g.packs.find((p) => p.partNumber === chosen) ??
                      g.packs[0];
                    const cartRow = cart.find(
                      (c) => c.cartId === pack.partNumber,
                    );
                    const discounted = pack.sellingPriceWithGst < pack.mrp;
                    return (
                      <tr
                        key={g.key}
                        className="border-b border-ink-100 last:border-b-0"
                      >
                        <td className="px-4 py-4 text-ink-800">{g.category}</td>
                        <td className="px-4 py-4">
                          {isCoolant ? (
                            <span className="inline-flex items-center gap-2 text-ink-800">
                              <span
                                className="inline-block h-2.5 w-2.5 rounded-full"
                                style={{
                                  backgroundColor:
                                    COLOUR_HEX[g.colour] ?? "#64748b",
                                }}
                              />
                              {g.colour} Coolant
                            </span>
                          ) : (
                            <span className="text-ink-800">
                              {g.grade ?? "—"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {g.packs.length > 1 ? (
                            <Select
                              value={pack.partNumber}
                              onChange={(e) =>
                                setSelectedPack((s) => ({
                                  ...s,
                                  [g.key]: e.target.value,
                                }))
                              }
                              options={g.packs.map((p) => ({
                                value: p.partNumber,
                                label: p.pack.replace(/\s/g, ""),
                              }))}
                              className="h-9  rounded-md px-2 text-sm"
                            />
                          ) : (
                            <span className="text-ink-800">
                              {pack.pack.replace(/\s/g, "")}
                            </span>
                          )}
                        </td>
                        {isCoolant && (
                          <td className="px-4 py-4">
                            <span className="inline-block rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                              {g.ratio ?? "—"}
                            </span>
                          </td>
                        )}
                        <td className="px-4 py-4 font-semibold text-ink-800">
                          {pack.partNumber}
                        </td>
                        <td className="px-4 py-4 max-w-[280px] text-ink-800">
                          {pack.itemDescription}
                        </td>
                        <td className="px-4 py-4 text-right">
                          {discounted ? (
                            <span className="text-ink-500 line-through">
                              ₹{Math.round(pack.mrp).toLocaleString("en-IN")}
                            </span>
                          ) : (
                            <span className="text-ink-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center font-semibold text-ink-800">
                          ₹
                          {Math.round(pack.sellingPriceWithGst).toLocaleString(
                            "en-IN",
                          )}
                        </td>
                        <td className="px-4 py-4 text-center font-semibold text-ink-800">
                          ₹
                          {Math.round(
                            pack.sellingPriceWithoutGst,
                          ).toLocaleString("en-IN")}
                        </td>
                        <td className="px-4 py-4 text-center font-semibold text-brand-700">
                          +{pack.bronzePoints}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex justify-center">
                            <CatalogueQtyStepper
                              value={cartRow?.qty ?? 0}
                              onChange={(v) =>
                                cartRow
                                  ? updateCartQty(cartRow.cartId, v)
                                  : v > 0
                                    ? handleAdd(pack, 1)
                                    : null
                              }
                              min={0}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {tab === "cart" && (
        <Card>
          <CatalogueCartTable
            items={cart}
            onRemove={removeFromCart}
            onCheckout={checkout}
          />
        </Card>
      )}
      {tab === "orders" && (
        <Card>
          <CatalogueOrdersTable
            orders={orders}
            onView={viewOrder}
            onRefresh={() => showToast.success("Orders refreshed")}
          />
        </Card>
      )}

      <OrderDetailsModal
        isOpen={Boolean(openOrder)}
        onClose={() => setOpenOrder(null)}
        order={openOrder}
      />
    </div>
  );
}

function bumpQty(row, delta) {
  const qty = Math.max(1, row.qty + delta);
  const tax = row.saleRate * 0.18 * qty;
  return {
    ...row,
    qty,
    tax: +tax.toFixed(2),
    totalAmount: +(row.saleRate * qty + tax).toFixed(2),
  };
}
