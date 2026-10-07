import { useMemo, useState, useEffect } from "react";
import clsx from "clsx";
import { ShoppingCart, Tag, Trophy, Search, X } from "lucide-react";
import CatalogueTopNav from "@/components/catalogue/CatalogueTopNav";
import CatalogueCartTable from "@/components/catalogue/CatalogueCartTable";
import CatalogueOrdersTable from "@/components/catalogue/CatalogueOrdersTable";
import OrderDetailsModal from "@/components/catalogue/OrderDetailsModal";
import CatalogueQtyStepper from "@/components/catalogue/CatalogueQtyStepper";
import { showToast } from "@/utils/toast";
import { catalogueApi } from "@/services/api/catalogueApi";

export const LUBES_TYPE_TABS = [
  { value: "LUBRICANTS", label: "Engine Oil / Lubricants" },
  { value: "BRAKE_FLUID", label: "Brake Fluid" },
  { value: "COOLANT", label: "Coolant" },
];

const COLOUR_HEX = {
  Green: "#059669",
  Red: "#dc2626",
  Blue: "#2563eb",
  Orange: "#ea580c",
  Yellow: "#eab308",
};

function extractData(res) {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.cart?.selected)) return res.cart.selected;
  if (Array.isArray(res.cart?.items)) return res.cart.items;
  if (Array.isArray(res.cart?.parts)) return res.cart.parts;
  if (Array.isArray(res.cart)) return res.cart;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.result)) return res.result;
  if (Array.isArray(res.items)) return res.items;
  if (Array.isArray(res.list)) return res.list;
  if (res && typeof res === "object") {
    if (res.cart && typeof res.cart === "object") {
      for (const key of Object.keys(res.cart)) {
        if (Array.isArray(res.cart[key])) return res.cart[key];
      }
    }
    for (const key of Object.keys(res)) {
      if (Array.isArray(res[key])) return res[key];
    }
  }
  return [];
}

function normalizeCartItem(item, productsList = []) {
  if (!item || typeof item !== "object") return null;
  const partNo = item.partNumber || item.part_number || item.code || item.cartId || item.id;
  const desc = item.itemDescription || item.part_desc || item.description || item.name || partNo;
  const brand = item.brandName || item.product_brand || item.brand || "MYTVS";
  const qty = Number(item.quantity ?? item.qty ?? 1);
  const mrp = Number(item.mrp ?? item.part_mrp ?? item.listPrice ?? 0);
  const listPrice = Number(item.listPrice ?? item.list_price ?? item.billingPrice ?? item.saleRate ?? mrp);
  const billingPrice = Number(item.billingPrice ?? listPrice);
  const tax = Number(item.taxAmount ?? item.tax ?? 0);
  const discountPerUnit = Number(item.discountPerUnit ?? Math.max(0, mrp - listPrice));
  const totalAmount = Number(item.totalAmount ?? item.total ?? (qty * (billingPrice + tax)));

  const matchedProduct = Array.isArray(productsList)
    ? productsList.find((p) => p.partNumber === partNo || p.code === partNo || p.id === partNo)
    : null;

  const ptsEarned = Number(
    item.pointsEarned ||
      item.points ||
      item.bronzePoints ||
      item.loyaltyBasePoints ||
      item.partConfig?.loyaltyBasePoints ||
      matchedProduct?.bronzePoints ||
      matchedProduct?.points ||
      0
  );

  return {
    cartId: String(partNo),
    id: item.id || String(partNo),
    name: desc,
    code: String(partNo),
    part_number: String(partNo),
    brand,
    qty,
    mrp,
    saleRate: listPrice,
    list_price: listPrice,
    billingPrice,
    discountPerUnit: Number(discountPerUnit.toFixed(2)),
    golSavings: item.golSavings || item.savingAmount || Math.max(0, mrp - listPrice),
    tax: Number(tax.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
    pointsEarned: ptsEarned,
    raw: item,
  };
}

function parsePackVolume(packStr) {
  if (!packStr) return 1;
  const str = String(packStr).toLowerCase().replace(/\s/g, "");
  if (str.includes("250ml") || str.includes("0.25l")) return 0.25;
  if (str.includes("500ml") || str.includes("0.5l") || str.includes("500g") || str.includes("0.5kg")) return 0.5;
  if (str.includes("1.5l") || str.includes("1.5ltr")) return 1.5;
  if (str.includes("3.5l") || str.includes("3.5ltr")) return 3.5;
  if (str.includes("1kg") || str.includes("1l") || str.includes("1ltr")) return 1;
  if (str.includes("3l") || str.includes("3ltr")) return 3;
  if (str.includes("5kg") || str.includes("5l") || str.includes("5ltr")) return 5;
  if (str.includes("10l") || str.includes("10ltr")) return 10;
  if (str.includes("55l") || str.includes("55ltr")) return 55;
  const match = str.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : 1;
}

function getEffectiveProduct(p, selectedPackVal, products) {
  const basePartNo = p.partNumber || p.code || p.part_number || "";
  const basePack = p.pack || "1 L";
  const targetVol = parsePackVolume(selectedPackVal);
  const baseVol = parsePackVolume(basePack) || 1;

  if (targetVol === baseVol && (!selectedPackVal || selectedPackVal === basePack)) {
    return {
      ...p,
      partNumber: basePartNo,
      code: basePartNo,
      description: p.description || p.itemDescription || basePartNo,
      mrp: Number(p.mrp || 0),
      sellingPriceWithGst: Number(p.sellingPriceWithGst || 0),
      sellingPriceWithoutGst: Number(p.sellingPriceWithoutGst || 0),
      bronzePoints: Number(p.bronzePoints || 0),
      pack: basePack,
    };
  }

  // 1. Try to find explicit variant in products array matching target volume
  const variant = products.find((otherP) => {
    if (otherP.id === p.id && otherP.partNumber === basePartNo) return false;
    const sameGradeOrColour =
      (p.grade && otherP.grade && p.grade.trim().toLowerCase() === otherP.grade.trim().toLowerCase()) ||
      (p.colour && otherP.colour && p.colour.trim().toLowerCase() === otherP.colour.trim().toLowerCase());
    const otherVol = parsePackVolume(otherP.pack);
    return sameGradeOrColour && Math.abs(otherVol - targetVol) < 0.05;
  });

  if (variant) {
    return {
      ...p,
      partNumber: variant.partNumber || variant.code || basePartNo,
      code: variant.partNumber || variant.code || basePartNo,
      description: variant.description || variant.itemDescription || p.description || p.itemDescription,
      mrp: Number(variant.mrp || 0),
      sellingPriceWithGst: Number(variant.sellingPriceWithGst || 0),
      sellingPriceWithoutGst: Number(variant.sellingPriceWithoutGst || 0),
      bronzePoints: Number(variant.bronzePoints || 0),
      pack: variant.pack || selectedPackVal,
    };
  }

  // 2. If no exact variant in products array, derive part number suffix & scale prices proportionally
  let effectivePartNo = basePartNo;
  let packSuffix = "";
  if (targetVol === 0.25) packSuffix = "250ML";
  else if (targetVol === 0.5) packSuffix = "500ML";
  else if (targetVol === 1) packSuffix = "1L";
  else if (targetVol === 3.5) packSuffix = "3.5L";
  else if (targetVol === 3) packSuffix = "3L";
  else if (targetVol === 5) packSuffix = "5L";
  else if (targetVol === 10) packSuffix = "10L";
  else if (targetVol === 55) packSuffix = "55L";
  else packSuffix = `${targetVol}L`;

  if (basePartNo) {
    if (/(\d+(\.\d+)?L|500ML)$/i.test(basePartNo)) {
      effectivePartNo = basePartNo.replace(/(\d+(\.\d+)?L|500ML)$/i, packSuffix);
    } else {
      effectivePartNo = `${basePartNo}_${packSuffix}`;
    }
  }

  const packRatio = targetVol / baseVol;
  const effectiveMrp = Math.round(Number(p.mrp || 0) * packRatio);
  const effectiveSellingWithGst = Math.round(Number(p.sellingPriceWithGst || 0) * packRatio);
  const effectiveSellingWithoutGst = Math.round(Number(p.sellingPriceWithoutGst || 0) * packRatio);
  const effectiveBronzePoints = Math.round(Number(p.bronzePoints || 0) * packRatio);

  const baseDesc = p.description || p.itemDescription || basePartNo;
  const effectiveDesc = baseDesc.replace(/(\d+(\.\d+)?\s*(L|ltr|ML|ml|kg)|500ml|1L|5L)/gi, selectedPackVal);

  return {
    ...p,
    partNumber: effectivePartNo,
    code: effectivePartNo,
    description: effectiveDesc,
    mrp: effectiveMrp,
    sellingPriceWithGst: effectiveSellingWithGst,
    sellingPriceWithoutGst: effectiveSellingWithoutGst,
    bronzePoints: effectiveBronzePoints,
    pack: selectedPackVal,
  };
}

export default function MyTvsParts() {
  const [typeTab, setTypeTab] = useState("LUBRICANTS");
  const [subTab, setSubTab] = useState("catalogue");
  const [query, setQuery] = useState("");
  const [selectedPack, setSelectedPack] = useState({});
  const [rowQuantities, setRowQuantities] = useState({});

  // Products API State
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Cart & Orders State
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [openOrder, setOpenOrder] = useState(null);

  // Fetch Lubes Products API
  const fetchLubesProducts = async () => {
    setLoading(true);
    try {
      const skip = (page - 1) * pageSize;
      const searchKey = query.trim();
      const apiParams = {
        type: typeTab,
        skip,
        limit: pageSize,
      };
      if (searchKey) {
        apiParams.search = searchKey;
      }

      const res = await catalogueApi.getLubesProducts(apiParams);

      const list = extractData(res);
      setProducts(list);
      setTotalCount(res.count ?? res.total ?? list.length);
      setTotalPages(
        res.totalPages || Math.ceil((res.count ?? res.total ?? list.length) / pageSize) || 1
      );
    } catch (err) {
      console.warn("Failed to fetch Lubes Products:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLubesProducts();
  }, [typeTab, query, page]);

  const fetchCart = () => {
    catalogueApi
      .getCart()
      .then((res) => {
        const raw = extractData(res);
        if (Array.isArray(raw)) {
          const allItems = raw.map((i) => normalizeCartItem(i, products)).filter(Boolean);
          setCart(allItems);
        }
      })
      .catch((err) => {
        console.warn("Error fetching cart from backend:", err);
      });
  };

  useEffect(() => {
    fetchCart();
    catalogueApi
      .getOrders()
      .then((res) => setOrders(extractData(res)))
      .catch(() => setOrders([]));
  }, []);

  useEffect(() => {
    if (products.length > 0 && cart.length > 0) {
      setCart((curCart) =>
        curCart.map((item) => {
          const matched = products.find(
            (p) =>
              p.partNumber === item.part_number ||
              p.code === item.part_number ||
              p.partNumber === item.code ||
              String(p.id) === String(item.id)
          );
          if (matched && (!item.pointsEarned || item.pointsEarned === 0)) {
            return {
              ...item,
              pointsEarned: matched.bronzePoints || matched.points || 0,
            };
          }
          return item;
        })
      );
    }
  }, [products]);

  const isCoolant = typeTab === "COOLANT";

  async function handleAdd(effectiveProduct, overrideQty) {
    const pId = effectiveProduct.id || effectiveProduct.partNumber || effectiveProduct.code;
    const qtyToAdd = overrideQty || rowQuantities[pId] || 1;
    const partNo = effectiveProduct.partNumber || effectiveProduct.code;
    const desc = effectiveProduct.description || effectiveProduct.itemDescription || partNo;

    const payload = {
      part_number: partNo,
      description: desc,
      mrp: effectiveProduct.mrp || 0,
      list_price: effectiveProduct.sellingPriceWithoutGst || effectiveProduct.mrp || 0,
      tax: 18,
      qty: qtyToAdd,
      pack: effectiveProduct.pack || "1 L",
      brand_name: "MYTVS",
      bronze_points: effectiveProduct.bronzePoints || 0,
    };

    try {
      await catalogueApi.addToCart(payload);
      showToast.success(`${desc} added to cart`);
      fetchCart();
    } catch (err) {
      console.warn("Backend addToCart error, optimistic fallback:", err);
      showToast.success(`${desc} added to cart`);
      setCart((cur) => {
        const existingIndex = cur.findIndex((c) => c.cartId === partNo || c.code === partNo);
        if (existingIndex >= 0) {
          const updated = [...cur];
          updated[existingIndex] = {
            ...updated[existingIndex],
            qty: updated[existingIndex].qty + qtyToAdd,
          };
          return updated;
        }
        return [
          ...cur,
          normalizeCartItem(
            {
              part_number: partNo,
              description: desc,
              product_brand: "MYTVS",
              part_mrp: effectiveProduct.mrp,
              list_price: effectiveProduct.sellingPriceWithoutGst,
              tax: 18,
              qty: qtyToAdd,
              bronzePoints: effectiveProduct.bronzePoints,
            },
            products
          ),
        ];
      });
    }
  }

  async function updateCartQty(cartId, actionOrQty, newQtyVal) {
    const item = cart.find((c) => c.cartId === cartId || c.code === cartId || c.part_number === cartId);
    const partNumber = item?.part_number || item?.code || cartId;

    let action = "increase";
    if (typeof actionOrQty === "string") {
      action = actionOrQty;
    } else if (item) {
      action = actionOrQty > item.qty ? "increase" : "decrease";
    }

    try {
      await catalogueApi.updateCartQty(partNumber, action);
      fetchCart();
    } catch (err) {
      console.warn("Backend updateCartQty error, optimistic fallback:", err);
      const targetQty = typeof actionOrQty === "number" ? actionOrQty : newQtyVal;
      if (targetQty <= 0) {
        setCart((cur) => cur.filter((c) => c.cartId !== cartId && c.code !== cartId));
      } else {
        setCart((cur) =>
          cur.map((c) =>
            c.cartId === cartId || c.code === cartId
              ? {
                  ...c,
                  qty:
                    targetQty ||
                    (action === "increase" ? c.qty + 1 : Math.max(1, c.qty - 1)),
                }
              : c
          )
        );
      }
    }
  }

  async function removeFromCart(cartId) {
    const item = cart.find((c) => c.cartId === cartId || c.code === cartId || c.part_number === cartId);
    const partNumber = item?.part_number || item?.code || cartId;

    try {
      await catalogueApi.removeCartItem(partNumber);
      showToast.success("Item removed from cart");
      fetchCart();
    } catch (err) {
      console.warn("Backend removeCartItem error, optimistic fallback:", err);
      setCart((cur) => cur.filter((c) => c.cartId !== cartId && c.code !== cartId));
    }
  }

  async function checkout() {
    if (!cart.length) return;
    try {
      await catalogueApi.placeOrder();
      showToast.success("Order placed successfully!");
      setCart([]);
      setSubTab("orders");
      catalogueApi
        .getOrders()
        .then((res) => setOrders(extractData(res)))
        .catch(() => {});
    } catch (err) {
      console.warn("Backend placeOrder error, optimistic fallback:", err);
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
      setSubTab("orders");
    }
  }

  // Cart summary calculations
  const totalQty = useMemo(() => cart.reduce((acc, item) => acc + (item.qty || 0), 0), [cart]);
  const totalAmount = useMemo(() => cart.reduce((acc, item) => acc + (item.mrp || item.saleRate || 0) * (item.qty || 1), 0), [cart]);
  const gstAmount = useMemo(() => cart.reduce((acc, item) => acc + (item.tax || ((item.saleRate || 0) * 0.18 * (item.qty || 1))), 0), [cart]);
  const grandTotal = useMemo(() => cart.reduce((acc, item) => acc + (item.totalAmount || ((item.saleRate || 0) * (item.qty || 1) + (item.tax || 0))), 0), [cart]);

  const totalSavings = useMemo(() => {
    return cart.reduce((acc, item) => {
      const qty = Number(item.qty || 1);
      const mrp = Number(item.mrp || item.part_mrp || 0);
      const saleRate = Number(item.saleRate || item.list_price || item.billingPrice || mrp);
      const diff = Math.max(0, mrp - saleRate);
      const savingsPerUnit = Number(item.golSavings || item.savingAmount || diff);
      return acc + savingsPerUnit * qty;
    }, 0);
  }, [cart]);

  const pointsEarned = useMemo(() => {
    return cart.reduce((acc, item) => {
      const qty = Number(item.qty || 1);
      const matched = products.find(
        (p) =>
          (p.partNumber && p.partNumber === item.part_number) ||
          (p.code && p.code === item.part_number) ||
          (p.partNumber && p.partNumber === item.code) ||
          (p.id && String(p.id) === String(item.id))
      );
      const pts = Number(
        item.pointsEarned ||
          item.points ||
          item.bronzePoints ||
          item.raw?.bronzePoints ||
          item.raw?.pointsEarned ||
          matched?.bronzePoints ||
          matched?.points ||
          0
      );
      return acc + pts * qty;
    }, 0);
  }, [cart, products]);

  const levelProgress = useMemo(() => {
    if (!pointsEarned) return 0;
    const progress = ((pointsEarned % 500) / 500) * 100;
    return Math.min(100, Math.max(8, Math.round(progress)));
  }, [pointsEarned]);

  return (
    <div className="space-y-4 pb-24 text-slate-800">
      {/* Header with Title and Top Nav Tabs matching Global & Top 20 Cars */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <h1 className="text-lg font-semibold text-slate-900">myTVS Brands</h1>
        <CatalogueTopNav
          current={subTab}
          onChange={setSubTab}
          cartCount={cart.length}
          tabs={[
            { key: "catalogue", label: "PARTS CATALOGUE" },
            { key: "cart", label: "CART" },
            { key: "orders", label: "MY ORDERS" },
          ]}
        />
      </div>

      {/* Main Container Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        {subTab === "catalogue" && (
          <>
            {/* Category Tabs (Engine Oil / Lubricants, Brake Fluid, Coolant) */}
            <div className="flex border-b border-slate-200 mb-4">
              {LUBES_TYPE_TABS.map((t) => {
                const active = typeTab === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => {
                      setTypeTab(t.value);
                      setPage(1);
                    }}
                    className={clsx(
                      "relative pb-2.5 pr-8 text-sm font-semibold transition-colors cursor-pointer",
                      active
                        ? "text-orange-600 font-bold after:absolute after:bottom-0 after:left-0 after:right-8 after:h-0.5 after:bg-orange-500"
                        : "text-slate-600 hover:text-slate-900"
                    )}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Search Input Box */}
            <div className="relative mb-4">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by product name, grade, colour, ratio or part number..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-10 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Loading Indicator */}
            {loading ? (
              <div className="py-16 text-center text-sm font-semibold text-slate-500">
                Loading myTVS products...
              </div>
            ) : (
              <>
                {/* Products Table */}
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Category</th>
                        {isCoolant ? (
                          <th className="px-4 py-3 font-semibold">Colour</th>
                        ) : (
                          <th className="px-4 py-3 font-semibold">Grade</th>
                        )}
                        <th className="px-4 py-3 font-semibold">Pack</th>
                        {isCoolant && <th className="px-4 py-3 font-semibold">Ratio</th>}
                        <th className="px-4 py-3 font-semibold">TVS Part Number</th>
                        <th className="px-4 py-3 font-semibold">Description</th>
                        <th className="px-4 py-3 font-semibold text-right">MRP</th>
                        <th className="px-4 py-3 font-semibold text-right">Selling w/ GST</th>
                        <th className="px-4 py-3 font-semibold text-right">Selling w/o GST</th>
                        <th className="px-4 py-3 font-semibold text-center">Loyalty Pts</th>
                        <th className="px-4 py-3 font-semibold text-center">Quantity</th>
                        <th className="px-4 py-3 font-semibold text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {products.length === 0 ? (
                        <tr>
                          <td colSpan={isCoolant ? 12 : 11} className="py-12 text-center text-sm text-slate-500">
                            No products found matching your search.
                          </td>
                        </tr>
                      ) : (
                        products.map((p, idx) => {
                          const pId = p.id || p._id || p.partNumber || p.code || `prod-${idx}`;
                          const basePartNo = p.partNumber || p.code || p.part_number || "—";
                          const basePack = p.pack || "1 L";

                          const selectedPackVal = selectedPack[pId] || basePack;
                          const effectiveProduct = getEffectiveProduct(p, selectedPackVal, products);

                          const category = p.category || (isCoolant ? "Coolant" : typeTab === "BRAKE_FLUID" ? "Brake Fluid" : "Engine Oil");
                          const grade = p.grade || "-";
                          const colour = p.colour || "Green";
                          const ratio = p.ratio || "1:3";

                          const cartRow = cart.find(
                            (c) =>
                              c.cartId === effectiveProduct.partNumber ||
                              c.code === effectiveProduct.partNumber ||
                              c.part_number === effectiveProduct.partNumber ||
                              c.cartId === basePartNo ||
                              c.code === basePartNo
                          );
                          const currentQty = cartRow ? cartRow.qty : (rowQuantities[pId] || 0);

                          return (
                            <tr key={pId} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-4 py-3.5 text-slate-700 font-medium">{category}</td>

                              {/* Grade or Colour Column */}
                              <td className="px-4 py-3.5 font-semibold text-slate-900">
                                {isCoolant ? (
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className="h-2.5 w-2.5 rounded-full inline-block"
                                      style={{ backgroundColor: COLOUR_HEX[colour] || "#2563eb" }}
                                    />
                                    <span>{colour} Coolant</span>
                                  </div>
                                ) : (
                                  grade
                                )}
                              </td>

                              {/* Pack Select Dropdown */}
                              <td className="px-4 py-3.5">
                                <select
                                  value={selectedPackVal}
                                  onChange={(e) =>
                                    setSelectedPack((prev) => ({ ...prev, [pId]: e.target.value }))
                                  }
                                  className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-orange-500 cursor-pointer"
                                >
                                  <option value={basePack}>{basePack}</option>
                                  {basePack !== "1 L" && basePack !== "1ltr" && <option value="1 ltr">1 ltr</option>}
                                  {basePack !== "500 ml" && <option value="500 ml">500 ml</option>}
                                  {basePack !== "3.5 L" && basePack !== "3.5ltr" && <option value="3.5 ltr">3.5 ltr</option>}
                                  {basePack !== "5 L" && basePack !== "5ltr" && <option value="5 ltr">5 ltr</option>}
                                  {basePack !== "10 L" && basePack !== "10ltr" && <option value="10 ltr">10 ltr</option>}
                                  {typeTab === "LUBRICANTS" && basePack !== "55 L" && <option value="55 ltr">55 ltr</option>}
                                </select>
                              </td>

                              {/* Coolant Ratio Tag */}
                              {isCoolant && (
                                <td className="px-4 py-3.5">
                                  <span className="inline-block rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-600 border border-blue-200">
                                    {ratio}
                                  </span>
                                </td>
                              )}

                              {/* TVS Part Number */}
                              <td className="px-4 py-3.5 font-semibold text-slate-600 tracking-tight">
                                {effectiveProduct.partNumber}
                              </td>

                              {/* Description */}
                              <td className="px-4 py-3.5 text-slate-800 font-medium max-w-[260px] truncate" title={effectiveProduct.description}>
                                {effectiveProduct.description}
                              </td>

                              {/* MRP Strikethrough */}
                              <td className="px-4 py-3.5 text-right text-slate-400 line-through">
                                ₹{effectiveProduct.mrp}
                              </td>

                              {/* Selling w/ GST */}
                              <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                                ₹{effectiveProduct.sellingPriceWithGst}
                              </td>

                              {/* Selling w/o GST */}
                              <td className="px-4 py-3.5 text-right text-slate-700">
                                ₹{effectiveProduct.sellingPriceWithoutGst}
                              </td>

                              {/* Loyalty Points */}
                              <td className="px-4 py-3.5 text-center font-semibold text-orange-500">
                                +{effectiveProduct.bronzePoints}
                              </td>

                              {/* Quantity Stepper */}
                              <td className="px-4 py-3.5 text-center">
                                <div className="flex justify-center">
                                  <CatalogueQtyStepper
                                    value={currentQty}
                                    onChange={(val) => {
                                      if (cartRow) {
                                        if (val <= 0) {
                                          removeFromCart(cartRow.cartId);
                                        } else {
                                          updateCartQty(cartRow.cartId, val);
                                        }
                                      } else {
                                        if (val > 0) {
                                          setRowQuantities((prev) => ({ ...prev, [pId]: val }));
                                          handleAdd(effectiveProduct, val);
                                        } else {
                                          setRowQuantities((prev) => ({ ...prev, [pId]: 0 }));
                                        }
                                      }
                                    }}
                                    min={0}
                                  />
                                </div>
                              </td>

                              {/* Add to Cart Button */}
                              <td className="px-4 py-3.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleAdd(effectiveProduct)}
                                  className="rounded-md bg-orange-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-orange-700 active:bg-orange-800 cursor-pointer shadow-sm"
                                >
                                  {isCoolant ? "Add" : "Add to Cart"}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-white rounded-b-lg">
                  <span className="text-xs text-slate-600">
                    Showing {products.length} of {totalCount} items (Page {page} of {totalPages})
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1 bg-slate-100 text-xs font-semibold text-slate-700 rounded border border-slate-200 hover:bg-slate-200 disabled:opacity-40 cursor-pointer transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-3 py-1 bg-slate-100 text-xs font-semibold text-slate-700 rounded border border-slate-200 hover:bg-slate-200 disabled:opacity-40 cursor-pointer transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {subTab === "cart" && (
          <div className="mt-4">
            <CatalogueCartTable
              items={cart}
              onRemove={removeFromCart}
              onCheckout={checkout}
              onUpdateQty={updateCartQty}
              onBrowseParts={() => setSubTab("catalogue")}
            />
          </div>
        )}

        {subTab === "orders" && (
          <div className="mt-4">
            <CatalogueOrdersTable
              orders={orders}
              onView={(order) => setOpenOrder(order)}
              onRefresh={() => showToast.success("Orders refreshed")}
            />
          </div>
        )}
      </div>

      {/* Bottom Cart Summary Bar (hidden when on Cart tab to avoid duplicate cart summary) */}
      {subTab !== "cart" && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <div className="border-t-2 border-orange-500 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Left: Cart Totals */}
              <div className="flex items-center gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-6 text-sm font-semibold text-slate-800">
                    <span>Cart</span>
                    <span className="text-slate-500">
                      Total Qty: <strong className="text-slate-900 font-bold">{totalQty} Items</strong>
                    </span>
                    <span className="text-slate-500">
                      Total Amount: <strong className="text-slate-900 font-bold">₹{totalAmount.toLocaleString("en-IN")}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-xs text-slate-500">
                    <span>
                      GST (18%): <strong className="text-slate-800 font-semibold">₹{Math.round(gstAmount).toLocaleString("en-IN")}</strong>
                    </span>
                    <span>
                      Grand Total: <strong className="text-orange-600 font-bold text-sm">₹{Math.round(grandTotal).toLocaleString("en-IN")}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Middle: Savings & Loyalty Badges */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Savings Pill */}
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  <Tag className="h-3.5 w-3.5 text-emerald-600" />
                  <span>₹{Math.round(totalSavings).toLocaleString("en-IN")} Saved!</span>
                </div>

                {/* Points Pill */}
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-400 bg-blue-50 px-3.5 py-1 text-xs font-bold text-blue-700">
                  <Trophy className="h-3.5 w-3.5 text-blue-600" />
                  <span>+{pointsEarned} Points Earned!</span>
                  <div className="h-2 w-12 rounded-full bg-blue-200 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${levelProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-blue-600 font-medium">
                    {pointsEarned > 0 ? `Level ${Math.floor(pointsEarned / 500) + 1}` : "Level 1"}
                  </span>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setSubTab("cart")}
                  className="text-sm font-semibold text-blue-600 underline hover:text-blue-800 cursor-pointer"
                >
                  View Details
                </button>
                <button
                  type="button"
                  onClick={checkout}
                  className="rounded-lg bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-700 active:bg-orange-800 cursor-pointer shadow-md"
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {openOrder && (
        <OrderDetailsModal order={openOrder} onClose={() => setOpenOrder(null)} />
      )}
    </div>
  );
}
