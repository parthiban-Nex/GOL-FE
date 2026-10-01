import { useMemo, useState } from "react";
import clsx from "clsx";
import { Check, Pencil, X, PackageOpen } from "lucide-react";
import MultiSelect from "@/components/ui/Multiselect";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CatalogueTopNav from "@/components/catalogue/CatalogueTopNav";
import CatalogueCartTable from "@/components/catalogue/CatalogueCartTable";
import CatalogueOrdersTable from "@/components/catalogue/CatalogueOrdersTable";
import OrderDetailsModal from "@/components/catalogue/OrderDetailsModal";
import CatalogueQtyStepper from "@/components/catalogue/CatalogueQtyStepper";
import {
  MAKE_OPTIONS,
  MODEL_OPTIONS_BY_MAKE,
  VARIANT_OPTIONS,
  FUEL_OPTIONS,
  YEAR_OPTIONS,
  GENERATIONS,
  CATEGORY_OPTIONS,
  SUBCATEGORY_MAP,
  TIERED_PARTS,
  INITIAL_CART_ITEMS,
  INITIAL_ORDERS,
  ORDER_DETAILS_BY_ENQUIRY,
} from "@/pages/catalogue/mockCatalogue";
import { showToast } from "@/utils/toast";

const BRAND_GROUP_TABS = [
  { value: "all", label: "All" },
  { value: "oem", label: "OEM" },
  { value: "primary", label: "Primary" },
  { value: "secondary", label: "Secondary" },
];

const OPTIONAL_COLUMNS = [
  { value: "brand", label: "Brand" },
  { value: "warranty", label: "Warranty" },
  { value: "coins", label: "MyTVS Coins" },
  { value: "etd", label: "ETD" },
];

const TIER_META = {
  oem: { label: "OEM", headerClass: "bg-accent-100 text-accent-700" },
  primary: {
    label: "Vendor Part - Primary",
    headerClass: "bg-emerald-100 text-emerald-700",
  },
  secondary: {
    label: "Vendor Part - Secondary",
    headerClass: "bg-amber-100 text-amber-700",
  },
};
const TIER_ORDER = ["oem", "primary", "secondary"];

export default function Top20Cars() {
  const [tab, setTab] = useState("catalogue");
  const [phase, setPhase] = useState("select");

  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [generation, setGeneration] = useState("");
  const [previewGen, setPreviewGen] = useState(null);
  const [variants, setVariants] = useState([]);
  const [fuels, setFuels] = useState([]);
  const [years, setYears] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);

  // Now a multi-select array e.g. ["all"] | ["oem"] | ["primary","secondary"]
  const [brandGroups, setBrandGroups] = useState(["all"]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [partQuery, setPartQuery] = useState("");

  const [cart, setCart] = useState(INITIAL_CART_ITEMS);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [openOrder, setOpenOrder] = useState(null);

  const modelOptions = useMemo(() => {
    const set = new Set();
    makes.forEach((mk) =>
      (MODEL_OPTIONS_BY_MAKE[mk] || []).forEach((m) => set.add(m)),
    );
    return Array.from(set).map((m) => ({ value: m, label: m }));
  }, [makes]);

  const subcategoryOptions = useMemo(() => {
    if (!categories.length) return [];
    const seen = new Set();
    const merged = [];
    categories.forEach((c) => {
      (SUBCATEGORY_MAP[c] || []).forEach((s) => {
        if (!seen.has(s.value)) {
          seen.add(s.value);
          merged.push(s);
        }
      });
    });
    return merged;
  }, [categories]);

  function handleMakesChange(next) {
    setMakes(next);
    const validModels = new Set();
    next.forEach((mk) =>
      (MODEL_OPTIONS_BY_MAKE[mk] || []).forEach((m) => validModels.add(m)),
    );
    setModels((cur) => cur.filter((m) => validModels.has(m)));
    setGeneration("");
    setVariants([]);
    setFuels([]);
    setYears([]);
    setCategories([]);
    setSubcategories([]);
  }
  function handleModelsChange(next) {
    setModels(next);
    setGeneration("");
    setVariants([]);
    setFuels([]);
    setYears([]);
    setCategories([]);
    setSubcategories([]);
  }
  function handleGenerationChange(g) {
    setGeneration(g);
    setVariants([]);
    setFuels([]);
    setYears([]);
    setCategories([]);
    setSubcategories([]);
  }
  function handleVariantsChange(next) {
    setVariants(next);
    setFuels([]);
    setYears([]);
    setCategories([]);
    setSubcategories([]);
  }
  function handleFuelsChange(next) {
    setFuels(next);
    setYears([]);
    setCategories([]);
    setSubcategories([]);
  }
  function handleYearsChange(next) {
    setYears(next);
    setCategories([]);
    setSubcategories([]);
  }
  function handleCategoriesChange(next) {
    setCategories(next);
    setSubcategories([]);
  }

  const canExplore = Boolean(
    makes.length &&
    models.length &&
    generation &&
    variants.length &&
    fuels.length &&
    years.length &&
    categories.length &&
    subcategories.length,
  );

  // Which tiers are "active" for filtering/rendering purposes.
  const activeTiers = brandGroups.includes("all") ? TIER_ORDER : brandGroups;

  const filteredRows = useMemo(() => {
    const q = partQuery.trim().toLowerCase();
    let rows = TIERED_PARTS.filter((r) => {
      if (categories.length && !categories.includes(r.aggregate)) return false;
      if (subcategories.length && !subcategories.includes(r.subAggregate))
        return false;
      return true;
    });
    // Keep rows that have at least one of the active tiers present.
    if (!brandGroups.includes("all")) {
      rows = rows.filter((r) => activeTiers.some((g) => Boolean(r[g])));
    }
    if (selectedBrands.length) {
      rows = rows.filter((r) =>
        activeTiers.some((k) => r[k] && selectedBrands.includes(r[k].brand)),
      );
    }
    if (q) rows = rows.filter((r) => r.components.toLowerCase().includes(q));
    return rows;
  }, [
    categories,
    subcategories,
    brandGroups,
    activeTiers,
    selectedBrands,
    partQuery,
  ]);

  const availableBrands = useMemo(() => {
    const set = new Set();
    for (const r of TIERED_PARTS)
      ["oem", "primary", "secondary"].forEach(
        (k) => r[k] && set.add(r[k].brand),
      );
    return Array.from(set).sort();
  }, []);

  function clearAll() {
    setMakes([]);
    setModels([]);
    setGeneration("");
    setVariants([]);
    setFuels([]);
    setYears([]);
    setCategories([]);
    setSubcategories([]);
    setBrandGroups(["all"]);
    setSelectedBrands([]);
    setSelectedColumns([]);
    setPartQuery("");
    setPhase("select");
  }

  function toggleBrandGroup(value) {
    setBrandGroups((cur) => {
      if (value === "all") return ["all"];
      const withoutAll = cur.filter((v) => v !== "all");
      const next = withoutAll.includes(value)
        ? withoutAll.filter((v) => v !== value)
        : [...withoutAll, value];
      return next.length ? next : ["all"];
    });
  }

  function addToCart(row, tierKey) {
    const tier = row[tierKey];
    if (!tier) return;
    const cartId = `${row.rowId}__${tierKey}`;
    const existing = cart.find((c) => c.cartId === cartId);
    if (existing) {
      setCart((cur) =>
        cur.map((c) => (c.cartId === cartId ? bumpQty(c, +1) : c)),
      );
    } else {
      const qty = 1;
      const tax = tier.saleRate * 0.18 * qty;
      setCart((cur) => [
        ...cur,
        {
          cartId,
          name: row.components,
          code: tier.code,
          brand: tier.brand,
          qty,
          mrp: tier.mrp,
          saleRate: tier.saleRate,
          discountPerUnit: +(tier.mrp - tier.saleRate).toFixed(2),
          golSavings: +(tier.mrp - tier.saleRate).toFixed(2),
          billingPrice: tier.saleRate,
          tax: +tax.toFixed(2),
          totalAmount: +(tier.saleRate * qty + tax).toFixed(2),
          pointsEarned: tier.points || 0,
          salesPriceGroup: tierKey.toUpperCase(),
        },
      ]);
    }
    showToast.success(`${row.components} (${tier.brand}) added to cart`);
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
        <h1 className="text-lg font-semibold text-ink-800">Top 20 cars</h1>
        <CatalogueTopNav
          current={tab}
          onChange={setTab}
          cartCount={cart.length}
        />
      </div>

      {tab === "catalogue" && (
        <>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={clearAll}>
              Clear
            </Button>
          </div>

          <Card padded={false}>
            {phase === "select" ? (
              <SelectionPhase
                makes={makes}
                onMakesChange={handleMakesChange}
                models={models}
                onModelsChange={handleModelsChange}
                modelOptions={modelOptions}
                generation={generation}
                onPreviewGen={setPreviewGen}
                setGeneration={handleGenerationChange}
                variants={variants}
                onVariantsChange={handleVariantsChange}
                fuels={fuels}
                onFuelsChange={handleFuelsChange}
                years={years}
                onYearsChange={handleYearsChange}
                categories={categories}
                onCategoriesChange={handleCategoriesChange}
                subcategories={subcategories}
                setSubcategories={setSubcategories}
                subcategoryOptions={subcategoryOptions}
                canExplore={canExplore}
                onExplore={() =>
                  canExplore
                    ? setPhase("explore")
                    : showToast.warning(
                        "Complete every selection to view the parts list.",
                      )
                }
              />
            ) : (
              <ExplorePhase
                makes={makes}
                models={models}
                generation={generation}
                variants={variants}
                fuels={fuels}
                years={years}
                categories={categories}
                subcategories={subcategories}
                subcategoryOptions={subcategoryOptions}
                brandGroups={brandGroups}
                onToggleBrandGroup={toggleBrandGroup}
                availableBrands={availableBrands}
                selectedBrands={selectedBrands}
                setSelectedBrands={setSelectedBrands}
                selectedColumns={selectedColumns}
                setSelectedColumns={setSelectedColumns}
                partQuery={partQuery}
                setPartQuery={setPartQuery}
                onClearEdit={clearAll}
                onEditSelection={() => setPhase("select")}
                rows={filteredRows}
                cart={cart}
                onAdd={addToCart}
                onQty={updateCartQty}
              />
            )}
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
      {previewGen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink-900/50"
            onClick={() => setPreviewGen(null)}
          />
          <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <button
              onClick={() => setPreviewGen(null)}
              className="absolute right-3 top-3 rounded-full bg-white/80 p-1 text-ink-500 hover:bg-ink-100 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            <img
              src={previewGen.url}
              alt={previewGen.label}
              className="mx-auto h-56 w-auto object-contain"
            />
            <p className="mt-3 text-center text-base font-semibold uppercase tracking-wide text-ink-800">
              {previewGen.label}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function SelectionPhase({
  makes,
  onMakesChange,
  models,
  onModelsChange,
  modelOptions,
  generation,
  setGeneration,
  onPreviewGen,
  variants,
  onVariantsChange,
  fuels,
  onFuelsChange,
  years,
  onYearsChange,
  categories,
  onCategoriesChange,
  subcategories,
  setSubcategories,
  subcategoryOptions,
  canExplore,
  onExplore,
}) {
  const showModel = makes.length > 0;
  const showGeneration = models.length > 0;
  const showVariant = Boolean(generation);
  const showFuel = variants.length > 0;
  const showYear = fuels.length > 0;
  const showCategories = years.length > 0;
  const showSubcategories = categories.length > 0;

  return (
    <div className="space-y-6 p-5">
      <div className="flex gap-6">
        <UnderlineField label="Make">
          <MultiSelect
            label="Make"
            options={MAKE_OPTIONS}
            value={makes}
            onChange={onMakesChange}
            placeholder="Select Make"
            sx={{ width: 260 }}
          />
        </UnderlineField>
        {showModel && (
          <UnderlineField label="Model">
            <MultiSelect
              label="Model"
              options={modelOptions}
              value={models}
              onChange={onModelsChange}
              placeholder="Select Model"
              sx={{ width: 260 }}
            />
          </UnderlineField>
        )}
      </div>

      {showGeneration && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
            Generation
          </p>
          <div className="flex flex-wrap gap-3">
            {GENERATIONS.map((g) => {
              const active = generation === g.value;
              return (
                <div
                  key={g.value}
                  className={clsx(
                    "relative w-40 overflow-hidden rounded-xl border p-3 transition-colors",
                    active
                      ? "border-accent-500 bg-accent-50"
                      : "border-ink-200 hover:border-ink-300",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setGeneration(active ? "" : g.value)}
                    className={clsx(
                      "absolute right-2 top-2 flex h-5 w-5 cursor-pointer items-center justify-center rounded border",
                      active
                        ? "border-accent-500 bg-accent-500"
                        : "border-ink-300 bg-white",
                    )}
                    aria-label={`Select ${g.label}`}
                  >
                    {active && <Check className="h-3.5 w-3.5 text-white" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => onPreviewGen(g)}
                    className="block w-full cursor-zoom-in"
                  >
                    <img
                      src={g.url}
                      alt={g.label}
                      className="mx-auto h-16 w-auto object-cover"
                    />
                    <p className="mt-2 text-center text-xs font-semibold uppercase text-ink-800">
                      {g.label.split(" (")[0]}
                    </p>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showVariant && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <UnderlineField label="Variant">
            <MultiSelect
              label="Variant"
              options={VARIANT_OPTIONS}
              value={variants}
              onChange={onVariantsChange}
              placeholder="Select Variant"
            />
          </UnderlineField>
          {showFuel && (
            <UnderlineField label="Fuel Type">
              <MultiSelect
                label="Fuel Type"
                options={FUEL_OPTIONS}
                value={fuels}
                onChange={onFuelsChange}
                placeholder="Select Fuel Type"
              />
            </UnderlineField>
          )}
          {showYear && (
            <UnderlineField label="Year">
              <MultiSelect
                label="Year"
                options={YEAR_OPTIONS}
                value={years}
                onChange={onYearsChange}
                placeholder="Select Year"
              />
            </UnderlineField>
          )}
          {showCategories && (
            <UnderlineField label="Categories">
              <MultiSelect
                label="Categories"
                options={CATEGORY_OPTIONS}
                value={categories}
                onChange={onCategoriesChange}
                placeholder="Select Categories"
                withSelectAll
                selectAllLabel="All"
              />
            </UnderlineField>
          )}
          {showSubcategories && (
            <UnderlineField label="Sub Categories">
              <MultiSelect
                label="Sub Categories"
                options={subcategoryOptions}
                value={subcategories}
                onChange={setSubcategories}
                placeholder="Select Sub Categories"
                withSelectAll
                selectAllLabel="All"
              />
            </UnderlineField>
          )}
        </div>
      )}

      {showSubcategories && (
        <div className="flex justify-end">
          <Button size="lg" onClick={onExplore} disabled={!canExplore}>
            View Parts List
          </Button>
        </div>
      )}
    </div>
  );
}

function ExplorePhase({
  makes,
  models,
  generation,
  variants,
  fuels,
  years,
  categories,
  subcategories,
  subcategoryOptions,
  brandGroups,
  onToggleBrandGroup,
  availableBrands,
  selectedBrands,
  setSelectedBrands,
  selectedColumns,
  setSelectedColumns,
  partQuery,
  setPartQuery,
  onClearEdit,
  onEditSelection,
  rows,
  cart,
  onAdd,
  onQty,
}) {
  const catLabels = categories
    .map((v) => CATEGORY_OPTIONS.find((c) => c.value === v)?.label)
    .filter(Boolean);
  const subLabels = subcategories
    .map((v) => subcategoryOptions.find((s) => s.value === v)?.label)
    .filter(Boolean);

  const chips = [
    makes.length > 0 ? `${makes.join(", ")}` : null,
    models.length > 0 ? `${models.join(", ")}` : null,
    generation &&
      `${
        GENERATIONS.find((g) => g.value === generation)?.label?.split(
          " (",
        )[0] ?? ""
      }`,
    variants.length > 0 ? `${variants.join(", ")}` : null,
    fuels.length > 0 ? `${fuels.join(", ")}` : null,
    years.length > 0 ? `${years.join(", ")}` : null,
    catLabels.length > 0 ? `${catLabels.join(", ")}` : null,
    subLabels.length > 0 ? `${subLabels.join(", ")}` : null,
  ]
    .filter(Boolean)
    .map((v) => String(v).toUpperCase());

  const brandOptions = availableBrands.map((b) => ({ value: b, label: b }));
  const activeTiers = brandGroups.includes("all") ? TIER_ORDER : brandGroups;

  return (
    <div className="p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {chips.map((c, i) => (
            <span
              key={i}
              className="inline-block rounded-md border border-ink-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink-700"
            >
              {c}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="border" onClick={onClearEdit}>
            Clear &amp; Edit
          </Button>
          <Button variant="secondary" icon={Pencil} onClick={onEditSelection}>
            Edit Selection
          </Button>
        </div>
      </div>

      <div className="mb-4 space-y-3">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
            Brand Group
          </p>
          <div className="flex flex-wrap gap-2">
            {BRAND_GROUP_TABS.map((t) => {
              const active = brandGroups.includes(t.value);
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => onToggleBrandGroup(t.value)}
                  className={clsx(
                    "rounded-full px-4 cursor-pointer py-1.5 text-sm font-semibold transition-colors",
                    active
                      ? "border border-accent-500 bg-white text-accent-600"
                      : "border border-ink-200 bg-white text-ink-600 hover:bg-ink-50",
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_2fr_auto]">
          <UnderlineField label="Brand">
            <MultiSelect
              label="Brand"
              options={brandOptions}
              value={selectedBrands}
              onChange={setSelectedBrands}
              placeholder="All Brands"
            />
          </UnderlineField>
          <UnderlineField label="Columns">
            <MultiSelect
              label="Columns"
              options={OPTIONAL_COLUMNS}
              value={selectedColumns}
              onChange={setSelectedColumns}
              placeholder="Add columns"
              withSelectAll
              selectAllLabel="All"
            />
          </UnderlineField>
          <div className="mt-2.5 ">
            <Input
              type="search"
              value={partQuery}
              onChange={(e) => setPartQuery(e.target.value)}
              placeholder="Search Part"
            />
          </div>
          <div className="self-end">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-700">
              <PackageOpen className="h-4 w-4 text-accent-500" />
              <span className="font-bold">{rows.length}</span> parts
            </span>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-200 py-16 text-center text-sm text-ink-500">
          No parts match the current filters.
        </div>
      ) : (
        <CombinedTable
          tiers={activeTiers}
          rows={rows}
          cart={cart}
          onAdd={onAdd}
          onQty={onQty}
          extraColumns={selectedColumns}
        />
      )}
    </div>
  );
}

/* ─── Combined table (Brand Group = All): OEM + Primary + Secondary side by side ─── */
const COL_WIDTH = {
  components: 190,
  partNo: 130,
  brand: 100,
  mrp: 95,
  saleRate: 100,
  qty: 130,
  warranty: 90,
  coins: 75,
  etd: 70,
};

function tierColumnKeys(tierKey, extraColumns) {
  const keys = ["partNo"];
  if (tierKey !== "oem" && extraColumns.includes("brand")) keys.push("brand");
  keys.push("mrp", "saleRate", "qty");
  if (extraColumns.includes("warranty")) keys.push("warranty");
  if (extraColumns.includes("coins")) keys.push("coins");
  if (extraColumns.includes("etd")) keys.push("etd");
  return keys;
}

const TIER_TINT = {
  oem: { header: "bg-accent-100 text-accent-700", cell: "bg-accent-50/50" },
  primary: {
    header: "bg-emerald-100 text-emerald-700",
    cell: "bg-emerald-50/50",
  },
  secondary: { header: "bg-amber-100 text-amber-700", cell: "bg-amber-50/50" },
};

function CombinedTable({ tiers, rows, cart, onAdd, onQty, extraColumns }) {
  const tierColKeys = tiers.map((t) => tierColumnKeys(t, extraColumns));
  const totalWidth =
    COL_WIDTH.components +
    tierColKeys.reduce(
      (sum, keys) => sum + keys.reduce((s, k) => s + COL_WIDTH[k], 0),
      0,
    );

  return (
    <div className="scrollbar-hide overflow-x-auto rounded-xl border border-ink-100">
      <table
        className="border-collapse text-sm"
        style={{ tableLayout: "fixed", width: totalWidth, minWidth: "100%" }}
      >
        <colgroup>
          <col style={{ width: COL_WIDTH.components }} />
          {tierColKeys.map((keys, i) =>
            keys.map((k) => (
              <col key={`${i}-${k}`} style={{ width: COL_WIDTH[k] }} />
            )),
          )}
        </colgroup>
        <thead>
          <tr>
            <th
              rowSpan={2}
              className="border-r border-ink-100 bg-white px-4 py-3 text-left text-xs font-medium text-ink-500 align-middle"
            >
              Components
            </th>
            {tiers.map((tierKey, i) => (
              <th
                key={tierKey}
                colSpan={tierColKeys[i].length}
                className={clsx(
                  "px-2 py-2 text-center",
                  TIER_TINT[tierKey].cell,
                  i < tiers.length - 1 && "border-r border-ink-100",
                )}
              >
                <span
                  className={clsx(
                    "inline-block rounded-md px-3 py-1 text-xs font-semibold uppercase",
                    TIER_TINT[tierKey].header,
                  )}
                >
                  {TIER_META[tierKey].label}
                </span>
              </th>
            ))}
          </tr>
          <tr className="text-[11px] font-medium text-ink-500">
            {tiers.map((tierKey, i) => (
              <SubHeaders
                key={tierKey}
                tierKey={tierKey}
                colKeys={tierColKeys[i]}
                tint={TIER_TINT[tierKey].cell}
                lastGroup={i === tiers.length - 1}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.rowId} className="border-t border-ink-100 align-top">
              <td className="border-r border-ink-100 bg-white px-4 py-4 text-sm font-semibold uppercase text-ink-800 truncate">
                {row.components}
              </td>
              {tiers.map((tierKey, i) => {
                const tier = row[tierKey];
                const cartRow = cart.find(
                  (c) => c.cartId === `${row.rowId}__${tierKey}`,
                );
                return (
                  <TierCells
                    key={tierKey}
                    tierKey={tierKey}
                    tier={tier}
                    colKeys={tierColKeys[i]}
                    tint={TIER_TINT[tierKey].cell}
                    lastGroup={i === tiers.length - 1}
                    qty={cartRow?.qty ?? 0}
                    onQty={(v) =>
                      cartRow
                        ? onQty(cartRow.cartId, v)
                        : v > 0
                          ? onAdd(row, tierKey)
                          : null
                    }
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const COL_LABEL = {
  partNo: { label: "Part No", align: "text-left" },
  brand: { label: "Brand", align: "text-left" },
  mrp: { label: "MRP", align: "text-center" },
  saleRate: { label: "Sale Rate", align: "text-center" },
  qty: { label: "Qty", align: "text-center" },
  warranty: { label: "Warranty", align: "text-center" },
  coins: { label: "Coins", align: "text-center" },
  etd: { label: "ETD", align: "text-center" },
};

function SubHeaders({ colKeys, tint, lastGroup }) {
  return (
    <>
      {colKeys.map((k, i) => (
        <th
          key={k}
          className={clsx(
            "px-3 py-2 truncate",
            tint,
            COL_LABEL[k].align,
            i === colKeys.length - 1 && !lastGroup && "border-r border-ink-100",
          )}
        >
          {COL_LABEL[k].label}
        </th>
      ))}
    </>
  );
}

function TierCells({ tierKey, tier, colKeys, tint, lastGroup, qty, onQty }) {
  if (!tier) {
    return (
      <td
        colSpan={colKeys.length}
        className={clsx(
          "px-3 py-4 text-center text-xs text-ink-400",
          tint,
          !lastGroup && "border-r border-ink-100",
        )}
      >
        Not available
      </td>
    );
  }
  return (
    <>
      {colKeys.map((k, i) => {
        const isLastCol = i === colKeys.length - 1;
        const cellCls = clsx(
          "px-3 py-4 truncate",
          tint,
          isLastCol && !lastGroup && "border-r border-ink-100",
        );
        switch (k) {
          case "partNo":
            return (
              <td key={k} className={cellCls}>
                <span className="text-xs font-semibold text-ink-800">
                  {tier.code}
                </span>
              </td>
            );
          case "brand":
            return (
              <td key={k} className={clsx(cellCls, "text-xs text-ink-600")}>
                {tier.brand}
              </td>
            );
          case "mrp":
            return (
              <td key={k} className={clsx(cellCls, "text-center text-ink-700")}>
                ₹{Math.round(tier.mrp).toLocaleString("en-IN")}
              </td>
            );
          case "saleRate":
            return (
              <td
                key={k}
                className={clsx(
                  cellCls,
                  "text-center font-semibold text-ink-800",
                )}
              >
                ₹{Math.round(tier.saleRate).toLocaleString("en-IN")}
              </td>
            );
          case "qty":
            return (
              <td key={k} className={cellCls}>
                <div className="flex justify-center">
                  <CatalogueQtyStepper value={qty} onChange={onQty} min={0} />
                </div>
              </td>
            );
          case "warranty":
            return (
              <td
                key={k}
                className={clsx(cellCls, "text-center text-xs text-ink-500")}
              >
                {tier.warrantyDays ? `${tier.warrantyDays}d` : "—"}
              </td>
            );
          case "coins":
            return (
              <td
                key={k}
                className={clsx(cellCls, "text-center text-xs text-ink-500")}
              >
                {tier.points || "—"}
              </td>
            );
          case "etd":
            return (
              <td
                key={k}
                className={clsx(cellCls, "text-center text-xs text-ink-500")}
              >
                {tier.eda != null ? `${tier.eda}d` : "—"}
              </td>
            );
          default:
            return null;
        }
      })}
    </>
  );
}
/* ─── Single-tier table (Brand Group = one or two specific tiers) ─── */

function TierTable({
  tierKey,
  label,
  headerClass,
  rows,
  cart,
  onAdd,
  onQty,
  extraColumns,
  showBrand,
}) {
  const restColumns = extraColumns.filter((c) => c !== "brand");
  const colSpan = 4 + (showBrand ? 1 : 0) + restColumns.length;

  return (
    <div className=" scrollbar-hide overflow-x-auto rounded-xl border border-ink-100">
      <table className="w-full min-w-[680px] border-collapse text-sm">
        <thead>
          <tr>
            <th
              rowSpan={2}
              className="border-r border-ink-100 bg-white px-4 py-3 text-left text-xs font-medium text-ink-500 align-middle"
            >
              Components
            </th>
            <th colSpan={colSpan} className="px-2 py-2 text-center">
              <span
                className={clsx(
                  "inline-block rounded-md px-3 py-1 text-xs font-semibold uppercase",
                  headerClass,
                )}
              >
                {label}
              </span>
            </th>
          </tr>
          <tr className="text-[11px] font-medium text-ink-500">
            <th className="bg-ink-50/60 px-3 py-2 text-left">Part No</th>
            {showBrand && (
              <th className="bg-ink-50/60 px-3 py-2 text-left">Brand</th>
            )}
            <th className="bg-ink-50/60 px-3 py-2 text-center">MRP</th>
            <th className="bg-ink-50/60 px-3 py-2 text-center">Sale Rate</th>
            <th className="bg-ink-50/60 px-3 py-2 text-center">Qty</th>
            {restColumns.includes("warranty") && (
              <th className="bg-ink-50/60 px-3 py-2 text-center">Warranty</th>
            )}
            {restColumns.includes("coins") && (
              <th className="bg-ink-50/60 px-3 py-2 text-center">Coins</th>
            )}
            {restColumns.includes("etd") && (
              <th className="bg-ink-50/60 px-3 py-2 text-center">ETD</th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const tier = row[tierKey];
            const cartRow = cart.find(
              (c) => c.cartId === `${row.rowId}__${tierKey}`,
            );
            const qty = cartRow?.qty ?? 0;
            const handleQty = (v) =>
              cartRow
                ? onQty(cartRow.cartId, v)
                : v > 0
                  ? onAdd(row, tierKey)
                  : null;

            return (
              <tr key={row.rowId} className="border-t border-ink-100 align-top">
                <td className="border-r border-ink-100 bg-white px-4 py-4 text-sm font-semibold uppercase text-ink-800">
                  {row.components}
                </td>
                {!tier ? (
                  <td
                    colSpan={colSpan}
                    className="px-3 py-4 text-center text-xs text-ink-400"
                  >
                    Not available
                  </td>
                ) : (
                  <>
                    <td className="px-3 py-4">
                      <span className="text-xs font-semibold text-ink-800">
                        {tier.code}
                      </span>
                    </td>
                    {showBrand && (
                      <td className="px-3 py-4 text-xs text-ink-600">
                        {tier.brand}
                      </td>
                    )}
                    <td className="px-3 py-4 text-center text-ink-700">
                      ₹{Math.round(tier.mrp).toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-4 text-center font-semibold text-ink-800">
                      ₹{Math.round(tier.saleRate).toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-4">
                      <div className="flex justify-center">
                        <CatalogueQtyStepper
                          value={qty}
                          onChange={handleQty}
                          min={0}
                        />
                      </div>
                    </td>
                    {restColumns.includes("warranty") && (
                      <td className="px-3 py-4 text-center text-xs text-ink-500">
                        {tier.warrantyDays ? `${tier.warrantyDays}d` : "—"}
                      </td>
                    )}
                    {restColumns.includes("coins") && (
                      <td className="px-3 py-4 text-center text-xs text-ink-500">
                        {tier.points || "—"}
                      </td>
                    )}
                    {restColumns.includes("etd") && (
                      <td className="px-3 py-4 text-center text-xs text-ink-500">
                        {tier.eda != null ? `${tier.eda}d` : "—"}
                      </td>
                    )}
                  </>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── shared building blocks (kept local to Top20Cars for now) ─── */

function UnderlineField({ label, children }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-brand-700">{label}</p>
      {children}
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
