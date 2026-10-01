import { useMemo, useState } from "react";
import clsx from "clsx";
import {
  Search,
  Pencil,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  // Category icons - named imports so only these are bundled
  // (import * as Icons pulled in the whole ~740 KB icon library).
  Filter as FilterIcon,
  Disc as DiscIcon,
  Settings as SettingsIcon,
  MoveVertical as MoveVerticalIcon,
  Lightbulb as LightbulbIcon,
  CircleDot as CircleDotIcon,
  BatteryCharging as BatteryChargingIcon,
  Minus as MinusIcon,
  Sparkles as SparklesIcon,
  Settings2 as Settings2Icon,
  Car as CarIcon,
  Wrench as WrenchIcon,
  Cable as CableIcon,
  Boxes as BoxesIcon,
  CircleGauge as CircleGaugeIcon,
  Zap as ZapIcon,
  Droplet as DropletIcon,
  Fuel as FuelIcon,
  Square as SquareIcon,
  Megaphone as MegaphoneIcon,
  PackageOpen as PackageOpenIcon,
} from "lucide-react";
import MultiSelect from "@/components/ui/Multiselect";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
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
  FLAT_PARTS,
  INITIAL_CART_ITEMS,
  INITIAL_ORDERS,
  ORDER_DETAILS_BY_ENQUIRY,
} from "@/pages/catalogue/mockCatalogue";
import { showToast } from "@/utils/toast";

// Category icon mapping - falls back to Settings when the mock icon
// name doesn't map to a lucide icon.
const CAT_ICONS = {
  FILTERS: FilterIcon,
  BRAKE_SYSTEM: DiscIcon,
  ENGINE: SettingsIcon,
  SUSPENSION: MoveVerticalIcon,
  LIGHTING: LightbulbIcon,
  WHEELS_AND_TYRES: CircleDotIcon,
  BATTERY: BatteryChargingIcon,
  BELTS_AND_TENSIONER: MinusIcon,
  ACCESSORIES: SparklesIcon,
  BEARING: Settings2Icon,
  BODY_PARTS: CarIcon,
  BRACKET: WrenchIcon,
  CABLES_AND_WIRES: CableIcon,
  CHILD_PARTS: BoxesIcon,
  CLUTCH_SYSTEM: CircleGaugeIcon,
  ELECTRICAL: ZapIcon,
  ELECTRICALS_AND_ELECTRONICS: ZapIcon,
  FLUIDS_COOLANT_AND_GREASE: DropletIcon,
  FUEL_SYSTEM: FuelIcon,
  GLASS: SquareIcon,
  HORNS: MegaphoneIcon,
};

const GLOBAL_CATEGORIES = [
  ...CATEGORY_OPTIONS,
  { value: "BEARING", label: "Bearing" },
  { value: "BODY_PARTS", label: "Body Parts" },
  { value: "BRACKET", label: "Bracket" },
  { value: "CABLES_AND_WIRES", label: "Cables and Wires" },
  { value: "CHILD_PARTS", label: "Child Parts" },
  { value: "CLUTCH_SYSTEM", label: "Clutch System" },
  { value: "ELECTRICAL", label: "Electrical" },
  {
    value: "ELECTRICALS_AND_ELECTRONICS",
    label: "Electricals and Electronics",
  },
  { value: "FLUIDS_COOLANT_AND_GREASE", label: "Fluids Coolant and Grease" },
  { value: "FUEL_SYSTEM", label: "Fuel System" },
  { value: "GLASS", label: "Glass" },
  { value: "HORNS", label: "Horns" },
];

const GLOBAL_SUBCATEGORY_MAP = {
  ...SUBCATEGORY_MAP,
  BATTERY: [
    { value: "BATTERY_UNIT", label: "Battery" },
    { value: "BATTERY_CHILD_PARTS", label: "Battery Child Parts" },
  ],
  BRAKE_SYSTEM: [
    { value: "ABS_PUMP", label: "ABS Pump" },
    { value: "BRAKE_CALIPER", label: "Brake Caliper" },
    { value: "BRAKE_DISC", label: "Brake Disc" },
    { value: "BRAKE_DRUM", label: "Brake Drum" },
    { value: "BRAKE_FLUID_TANK", label: "Brake Fluid Tank" },
    { value: "BRAKE_HOSE", label: "Brake Hose" },
    { value: "BRAKE_LINING", label: "Brake Lining" },
    { value: "BRAKE_PAD", label: "Brake Pad" },
    { value: "BRAKE_PEDAL", label: "Brake Pedal" },
    { value: "BRAKE_REPAIR_KIT", label: "Brake Repair Kit" },
    { value: "BRAKE_SET", label: "Brake Set" },
    { value: "BRAKE_SHOE", label: "Brake Shoe" },
    { value: "BRAKE_VALVE", label: "Brake Valve" },
    { value: "CALIPER_PINS_AND_ASSY", label: "Caliper Pins & Assy" },
    { value: "MC_AND_BOOSTER", label: "MC & Booster" },
    { value: "WHEEL_CYLINDER", label: "Wheel Cylinder" },
  ],
};

// A few extra brand names to make the multi-select feel realistic.
const BRAND_OPTIONS = [
  "ADD LUB ITEMS",
  "ANAND MOTOR PRODUCTS",
  "BMW",
  "BRAKES INDIA",
  "CASTROL",
  "CHEVROLET",
  "DELPHI TECH",
  "FORD",
  "MARUTI SUZUKI",
  "TATA",
  "TOYOTA",
  "SKODA",
  "HYUNDAI",
  "VALEO",
  "BOSCH",
  "FILTRON",
  "MYTVS",
  "MONROE",
  "FAG",
  "ZF",
];
const BRAND_SELECT_OPTIONS = BRAND_OPTIONS.map((b) => ({ value: b, label: b }));

export default function Global() {
  const [tab, setTab] = useState("catalogue");
  const [mode, setMode] = useState("stock"); // stock | vehicle
  const [phase, setPhase] = useState("select"); // select | explore

  // vehicle mode (all multi-select, progressively revealed)
  const [regNo, setRegNo] = useState("");
  const [generation, setGeneration] = useState(""); // still single-select (card grid)
  const [previewGen, setPreviewGen] = useState(null);
  const [vMakes, setVMakes] = useState([]);
  const [vModels, setVModels] = useState([]);
  const [vVariants, setVVariants] = useState([]);
  const [vFuels, setVFuels] = useState([]);
  const [vYears, setVYears] = useState([]);
  // When true (set by a reg-no lookup), Generation is skipped entirely:
  // hidden from the UI and not required to explore. Manually touching
  // Make or Model turns this back off, dropping the user back into the
  // normal Make → Model → Generation → Variant → Fuel → Year chain.
  const [skipGeneration, setSkipGeneration] = useState(false);

  // stock mode (multi-select, searchable)
  const [stockMakes, setStockMakes] = useState([]);
  const [stockModels, setStockModels] = useState([]);

  // shared category chain (multi-select in both modes)
  const [selectedCats, setSelectedCats] = useState([]);
  const [selectedSubs, setSelectedSubs] = useState([]);
  const [sort, setSort] = useState("default");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [partQuery, setPartQuery] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState(() => new Set());

  const [cart, setCart] = useState(INITIAL_CART_ITEMS);
  const [orders, setOrders] = useState(INITIAL_ORDERS);
  const [openOrder, setOpenOrder] = useState(null);

  // Stock mode: models are the union across every selected make.
  const stockModelOptions = useMemo(() => {
    const set = new Set();
    stockMakes.forEach((mk) =>
      (MODEL_OPTIONS_BY_MAKE[mk] || []).forEach((m) => set.add(m)),
    );
    return Array.from(set).map((m) => ({ value: m, label: m }));
  }, [stockMakes]);

  // Vehicle mode: same union logic, driven by vMakes instead.
  const vModelOptions = useMemo(() => {
    const set = new Set();
    vMakes.forEach((mk) =>
      (MODEL_OPTIONS_BY_MAKE[mk] || []).forEach((m) => set.add(m)),
    );
    return Array.from(set).map((m) => ({ value: m, label: m }));
  }, [vMakes]);

  // Sub-cats merge across every selected category.
  const activeSubcategoryOptions = useMemo(() => {
    if (!selectedCats.length) return [];
    const seen = new Set();
    const merged = [];
    selectedCats.forEach((c) => {
      (GLOBAL_SUBCATEGORY_MAP[c] || []).forEach((s) => {
        if (!seen.has(s.value)) {
          seen.add(s.value);
          merged.push(s);
        }
      });
    });
    return merged;
  }, [selectedCats]);

  function handleStockMakesChange(next) {
    setStockMakes(next);
    const validModels = new Set();
    next.forEach((mk) =>
      (MODEL_OPTIONS_BY_MAKE[mk] || []).forEach((m) => validModels.add(m)),
    );
    setStockModels((cur) => cur.filter((m) => validModels.has(m)));
  }

  // Vehicle mode chain: changing any link resets everything downstream
  // so a stale Generation/Variant/Fuel/Year can't linger after an
  // upstream field changes. Manually touching Make/Model also drops
  // us out of "reg-no search" mode, since the user is now building the
  // selection by hand and Generation is required again.
  function handleVMakesChange(next) {
    setVMakes(next);
    const validModels = new Set();
    next.forEach((mk) =>
      (MODEL_OPTIONS_BY_MAKE[mk] || []).forEach((m) => validModels.add(m)),
    );
    setVModels((cur) => cur.filter((m) => validModels.has(m)));
    setGeneration("");
    setVVariants([]);
    setVFuels([]);
    setVYears([]);
    setSkipGeneration(false);
  }
  function handleVModelsChange(next) {
    setVModels(next);
    setGeneration("");
    setVVariants([]);
    setVFuels([]);
    setVYears([]);
    setSkipGeneration(false);
  }
  function handleGenerationChange(g) {
    setGeneration(g);
    setVVariants([]);
    setVFuels([]);
    setVYears([]);
  }
  function handleVVariantsChange(next) {
    setVVariants(next);
    setVFuels([]);
    setVYears([]);
  }
  function handleVFuelsChange(next) {
    setVFuels(next);
    setVYears([]);
  }

  // Stock mode: multi-select chip grid for categories.
  function toggleCategoryChip(value) {
    setSelectedCats((cur) =>
      cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value],
    );
    setSelectedSubs([]);
  }
  function toggleSubChip(value) {
    setSelectedSubs((cur) =>
      cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value],
    );
  }

  const canExplore =
    mode === "stock"
      ? Boolean(selectedCats.length && selectedSubs.length)
      : Boolean(selectedCats.length && selectedSubs.length);

  function explore() {
    if (!canExplore) {
      showToast.warning("Complete the required selections before exploring.");
      return;
    }
    setPhase("explore");
  }

  function clearAll() {
    setVMakes([]);
    setVModels([]);
    setVVariants([]);
    setVFuels([]);
    setVYears([]);
    setGeneration("");
    setRegNo("");
    setSkipGeneration(false);
    setStockMakes([]);
    setStockModels([]);
    setSelectedCats([]);
    setSelectedSubs([]);
    setSelectedBrands([]);
    setPartQuery("");
    setSort("default");
    setPhase("select");
  }

  function lookupVehicle() {
    if (!regNo.trim())
      return showToast.warning("Enter a vehicle registration number.");
    // Reg-no search only resolves Make → Model → Variant → Fuel → Year.
    // Generation is intentionally left out of this flow: it stays
    // hidden and isn't required to explore.
    setSkipGeneration(true);
    setVMakes(["HYUNDAI"]);
    setVModels(["Creta"]);
    setGeneration("");
    setVVariants(["SX"]);
    setVFuels(["Petrol"]);
    setVYears(["2022"]);
    showToast.success(`Vehicle ${regNo.toUpperCase()} loaded.`);
  }

  const filteredParts = useMemo(() => {
    const q = partQuery.trim().toLowerCase();
    return FLAT_PARTS.filter((p) => {
      if (selectedCats.length && !selectedCats.includes(p.aggregate))
        return false;
      if (selectedSubs.length && !selectedSubs.includes(p.subAggregate))
        return false;
      if (selectedBrands.length && !selectedBrands.includes(p.brandName))
        return false;
      if (
        q &&
        ![p.partNumber, p.itemDescription, p.brandName].some((f) =>
          f.toLowerCase().includes(q),
        )
      )
        return false;
      return true;
    });
  }, [selectedCats, selectedSubs, selectedBrands, partQuery]);

  // Aggregate → sub-aggregate two-level grouping for the results panel.
  const grouped = useMemo(() => {
    const byAgg = new Map();
    for (const p of filteredParts) {
      if (!byAgg.has(p.aggregate))
        byAgg.set(p.aggregate, { agg: p.aggregate, subs: new Map() });
      const grp = byAgg.get(p.aggregate);
      if (!grp.subs.has(p.subAggregate)) grp.subs.set(p.subAggregate, []);
      grp.subs.get(p.subAggregate).push(p);
    }
    return Array.from(byAgg.values()).map((g) => ({
      agg: g.agg,
      aggLabel:
        GLOBAL_CATEGORIES.find((c) => c.value === g.agg)?.label ?? g.agg,
      count: Array.from(g.subs.values()).reduce((s, arr) => s + arr.length, 0),
      subs: Array.from(g.subs.entries()).map(([subKey, parts]) => ({
        sub: subKey,
        subLabel:
          (GLOBAL_SUBCATEGORY_MAP[g.agg] || []).find((s) => s.value === subKey)
            ?.label ?? subKey,
        parts,
      })),
    }));
  }, [filteredParts]);

  const totalParts = filteredParts.length;

  function toggleGroup(key) {
    setCollapsedGroups((cur) => {
      const next = new Set(cur);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function addToCart(part) {
    const cartId = part.partNumber;
    const existing = cart.find((c) => c.cartId === cartId);
    if (existing) {
      setCart((cur) =>
        cur.map((c) =>
          c.cartId === cartId ? bumpQty(c, +1, part.taxpercent) : c,
        ),
      );
    } else {
      const qty = 1;
      const tax = part.saleRate * (part.taxpercent / 100) * qty;
      setCart((cur) => [
        ...cur,
        {
          cartId,
          name: part.itemDescription,
          code: part.partNumber,
          brand: part.brandName,
          qty,
          mrp: part.mrp,
          saleRate: part.saleRate,
          discountPerUnit: +(part.mrp - part.saleRate).toFixed(2),
          golSavings: 0,
          billingPrice: part.saleRate,
          tax: +tax.toFixed(2),
          totalAmount: +(part.saleRate * qty + tax).toFixed(2),
          pointsEarned: part.points || 0,
          salesPriceGroup: part.salesPriceGroup,
        },
      ]);
    }
    showToast.success(`${part.itemDescription} added to cart`);
  }
  function updateCartQty(cartId, qty) {
    if (qty <= 0)
      return setCart((cur) => cur.filter((c) => c.cartId !== cartId));
    setCart((cur) =>
      cur.map((c) => (c.cartId === cartId ? bumpQty(c, qty - c.qty, 18) : c)),
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

  // Breadcrumb sources — both modes are arrays now, so this unifies cleanly.
  const breadcrumbMakes = mode === "stock" ? stockMakes : vMakes;
  const breadcrumbModels = mode === "stock" ? stockModels : vModels;
  const breadcrumbVariant = mode === "vehicle" ? vVariants : [];
  const breadcrumbFuel = mode === "vehicle" ? vFuels : [];
  const breadcrumbYear = mode === "vehicle" ? vYears : [];

  return (
    <div className="space-y-4">
      {/* Header row: title left, tabs right */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-ink-800">Global</h1>
        <CatalogueTopNav
          current={tab}
          onChange={setTab}
          cartCount={cart.length}
        />
      </div>

      {tab === "catalogue" && (
        <>
          {/* Mode toggle bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-ink-50/60 px-4 py-3">
            <div className="flex items-center gap-3">
              <span
                className={clsx(
                  "text-sm font-semibold uppercase tracking-wide",
                  mode === "stock" ? "text-ink-800" : "text-ink-400",
                )}
              >
                Stock Order
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={mode === "vehicle"}
                onClick={() => {
                  setMode(mode === "stock" ? "vehicle" : "stock");
                  clearAll();
                }}
                className={clsx(
                  "relative h-6 cursor-pointer w-11 rounded-full transition-colors",
                  mode === "vehicle" ? "bg-brand-600" : "bg-ink-300",
                )}
              >
                <span
                  className={clsx(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    mode === "vehicle" ? "translate-x-0" : "-translate-x-5",
                  )}
                />
              </button>
              <span
                className={clsx(
                  "text-sm font-semibold uppercase tracking-wide",
                  mode === "vehicle" ? "text-ink-800" : "text-ink-400",
                )}
              >
                Vehicle Order
              </span>
            </div>
            <Button variant="secondary" onClick={clearAll}>
              Clear
            </Button>
          </div>

          <Card padded={false}>
            {phase === "select" ? (
              <SelectionArea
                mode={mode}
                vMakes={vMakes}
                onVMakesChange={handleVMakesChange}
                vModels={vModels}
                onVModelsChange={handleVModelsChange}
                vModelOptions={vModelOptions}
                vVariants={vVariants}
                onVVariantsChange={handleVVariantsChange}
                vFuels={vFuels}
                onVFuelsChange={handleVFuelsChange}
                vYears={vYears}
                setVYears={setVYears}
                generation={generation}
                setGeneration={handleGenerationChange}
                skipGeneration={skipGeneration}
                onPreviewGen={setPreviewGen}
                regNo={regNo}
                setRegNo={setRegNo}
                onLookup={lookupVehicle}
                stockMakes={stockMakes}
                onStockMakesChange={handleStockMakesChange}
                stockModels={stockModels}
                setStockModels={setStockModels}
                stockModelOptions={stockModelOptions}
                selectedCats={selectedCats}
                toggleCategoryChip={toggleCategoryChip}
                setSelectedCats={setSelectedCats}
                selectedSubs={selectedSubs}
                toggleSubChip={toggleSubChip}
                setSelectedSubs={setSelectedSubs}
                activeSubcategoryOptions={activeSubcategoryOptions}
                partQuery={partQuery}
                setPartQuery={setPartQuery}
                selectedBrands={selectedBrands}
                setSelectedBrands={setSelectedBrands}
                onExplore={explore}
                canExplore={canExplore}
              />
            ) : (
              <ExploreArea
                mode={mode}
                makes={breadcrumbMakes}
                models={breadcrumbModels}
                generation={generation}
                skipGeneration={skipGeneration}
                variants={breadcrumbVariant}
                fuels={breadcrumbFuel}
                years={breadcrumbYear}
                selectedCats={selectedCats}
                selectedSubs={selectedSubs}
                activeSubcategoryOptions={activeSubcategoryOptions}
                onClearEdit={clearAll}
                onEditSelection={() => setPhase("select")}
                sort={sort}
                setSort={setSort}
                partQuery={partQuery}
                setPartQuery={setPartQuery}
                selectedBrands={selectedBrands}
                setSelectedBrands={setSelectedBrands}
                totalParts={totalParts}
                grouped={grouped}
                collapsedGroups={collapsedGroups}
                toggleGroup={toggleGroup}
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

/* ─── Selection area ─── */

function SelectionArea({
  mode,
  vMakes,
  onVMakesChange,
  vModels,
  onVModelsChange,
  vModelOptions,
  vVariants,
  onVVariantsChange,
  vFuels,
  onVFuelsChange,
  vYears,
  setVYears,
  generation,
  setGeneration,
  skipGeneration,
  onPreviewGen,
  regNo,
  setRegNo,
  onLookup,
  stockMakes,
  onStockMakesChange,
  stockModels,
  setStockModels,
  stockModelOptions,
  selectedCats,
  toggleCategoryChip,
  setSelectedCats,
  selectedSubs,
  toggleSubChip,
  setSelectedSubs,
  activeSubcategoryOptions,
  partQuery,
  setPartQuery,
  selectedBrands,
  setSelectedBrands,
  onExplore,
  canExplore,
}) {
  const showModelSlot = mode === "stock" || vMakes.length > 0;

  const chainUnlocked =
    mode === "vehicle" && vModels.length > 0 && (skipGeneration || generation);

  return (
    <div className="space-y-6 p-5">
      {mode === "vehicle" && (
        <div className="flex items-center gap-3">
          <div>
            <Input
              type="text"
              value={regNo}
              onChange={(e) => setRegNo(e.target.value.toUpperCase())}
              placeholder="Enter Vehicle Number"
            />
          </div>
          <Button onClick={onLookup}>Search</Button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div
          className={clsx(
            "grid grid-cols-1 gap-4",
            showModelSlot ? "lg:col-span-2 lg:grid-cols-2" : "lg:col-span-1",
          )}
        >
          <FilterField label="Make">
            <MultiSelect
              label="Make"
              options={MAKE_OPTIONS}
              value={mode === "stock" ? stockMakes : vMakes}
              onChange={mode === "stock" ? onStockMakesChange : onVMakesChange}
              placeholder="Select Make"
            />
          </FilterField>
          {showModelSlot && (
            <FilterField label="Model">
              <MultiSelect
                label="Model"
                options={mode === "stock" ? stockModelOptions : vModelOptions}
                value={mode === "stock" ? stockModels : vModels}
                onChange={mode === "stock" ? setStockModels : onVModelsChange}
                placeholder="Select Model"
                disabled={mode === "stock" && !stockMakes.length}
              />
            </FilterField>
          )}
        </div>
        {mode === "stock" && (
          <>
            <FilterField label="Brand">
              <MultiSelect
                label="Brand"
                options={BRAND_SELECT_OPTIONS}
                value={selectedBrands}
                onChange={setSelectedBrands}
                placeholder="Select Brand"
              />
            </FilterField>

            <div>
              <div className="relative">
                <div className="mt-3.5">
                  <Input
                    type="text"
                    value={partQuery}
                    onChange={(e) => setPartQuery(e.target.value)}
                    placeholder="Search parts (e.g., wiper, brake pad)"
                  />
                </div>
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Generation only appears once ≥1 Model is picked, and only for
          the manual chain — a reg-no search skips it entirely. */}
      {mode === "vehicle" && !skipGeneration && vModels.length > 0 && (
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

      {/* Variant only once the chain is unlocked (Generation picked in
          the manual flow, or skipped via reg-no search); Fuel Type
          only once ≥1 Variant is picked; Year only once ≥1 Fuel Type
          is picked. */}
      {chainUnlocked && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <FilterField label="Variant">
            <MultiSelect
              label="Variant"
              options={VARIANT_OPTIONS}
              value={vVariants}
              onChange={onVVariantsChange}
              placeholder="Select Variant"
            />
          </FilterField>
          {vVariants.length > 0 && (
            <FilterField label="Fuel Type">
              <MultiSelect
                label="Fuel Type"
                options={FUEL_OPTIONS}
                value={vFuels}
                onChange={onVFuelsChange}
                placeholder="Select Fuel Type"
              />
            </FilterField>
          )}
          {vFuels.length > 0 && (
            <FilterField label="Year">
              <MultiSelect
                label="Year"
                options={YEAR_OPTIONS}
                value={vYears}
                onChange={setVYears}
                placeholder="Select Year"
              />
            </FilterField>
          )}
        </div>
      )}

      {mode === "vehicle" ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <FilterField label="Categories">
            <MultiSelect
              label="Categories"
              options={GLOBAL_CATEGORIES}
              value={selectedCats}
              onChange={(next) => {
                setSelectedCats(next);
                setSelectedSubs([]);
              }}
              placeholder="Select Categories"
              disabled={!vMakes.length}
              withSelectAll
              selectAllLabel="All"
            />
          </FilterField>
          <FilterField label="Sub Categories">
            <MultiSelect
              label="Sub Categories"
              options={activeSubcategoryOptions}
              value={selectedSubs}
              onChange={setSelectedSubs}
              placeholder="Select Sub Categories"
              disabled={!selectedCats.length}
              withSelectAll
              selectAllLabel="All "
            />
          </FilterField>
          <div className="self-end">
            <Button size="lg" onClick={onExplore} disabled={!canExplore}>
              Explore Products
            </Button>
          </div>
        </div>
      ) : (
        <StockCategoryChips
          selectedCats={selectedCats}
          toggleCategoryChip={toggleCategoryChip}
          setSelectedCats={setSelectedCats}
          selectedSubs={selectedSubs}
          toggleSubChip={toggleSubChip}
          setSelectedSubs={setSelectedSubs}
          activeSubcategoryOptions={activeSubcategoryOptions}
          onExplore={onExplore}
          canExplore={canExplore}
        />
      )}
    </div>
  );
}

function StockCategoryChips({
  selectedCats,
  toggleCategoryChip,
  setSelectedCats,
  selectedSubs,
  toggleSubChip,
  setSelectedSubs,
  activeSubcategoryOptions,
  onExplore,
  canExplore,
}) {
  const allCatsSelected = selectedCats.length === GLOBAL_CATEGORIES.length;
  const allSubsSelected =
    activeSubcategoryOptions.length > 0 &&
    selectedSubs.length === activeSubcategoryOptions.length;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <p className="text-base font-semibold text-ink-800">Categories</p>
          <span
            className={clsx(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
              selectedCats.length
                ? "bg-brand-600 text-white"
                : "bg-brand-100 text-brand-700",
            )}
          >
            {selectedCats.length} selected
          </span>
          {/* <button
            type="button"
            onClick={() =>
              setSelectedCats(
                allCatsSelected ? [] : GLOBAL_CATEGORIES.map((c) => c.value),
              )
            }
            className="ml-auto text-[11px] font-semibold text-brand-700 hover:underline"
          >
            {allCatsSelected ? "Clear all" : "Select all"}
          </button> */}
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {GLOBAL_CATEGORIES.map((c) => {
            const active = selectedCats.includes(c.value);
            const Icon = CAT_ICONS[c.value] ?? SettingsIcon;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => toggleCategoryChip(c.value)}
                className={clsx(
                  "flex items-center gap-2 cursor-pointer rounded-lg border px-3 py-2.5 text-left text-sm font-semibold uppercase tracking-wide transition-colors",
                  active
                    ? "border-accent-500 bg-accent-50 text-accent-700"
                    : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50",
                )}
              >
                <Icon
                  className={clsx(
                    "h-4 w-4",
                    active ? "text-accent-600" : "text-accent-500",
                  )}
                />
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <p className="text-base font-semibold text-ink-800">Sub Categories</p>
          <span
            className={clsx(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
              selectedSubs.length
                ? "bg-brand-600 text-white"
                : "bg-brand-100 text-brand-700",
            )}
          >
            {selectedSubs.length} selected
          </span>
          {/* {activeSubcategoryOptions.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setSelectedSubs(
                  allSubsSelected
                    ? []
                    : activeSubcategoryOptions.map((s) => s.value),
                )
              }
              className="ml-auto text-[11px] font-semibold text-brand-700 hover:underline"
            >
              {allSubsSelected ? "Clear all" : "Select all"}
            </button>
          )} */}
        </div>
        {activeSubcategoryOptions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-ink-200 px-3 py-6 text-center text-xs text-ink-500">
            Select a category to see its sub-categories.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {activeSubcategoryOptions.map((s) => {
                const active = selectedSubs.includes(s.value);
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => toggleSubChip(s.value)}
                    className={clsx(
                      "flex items-center gap-2 cursor-pointer rounded-lg border px-3 py-2.5 text-left text-sm font-semibold uppercase tracking-wide transition-colors",
                      active
                        ? "border-accent-500 bg-accent-50 text-accent-700"
                        : "border-ink-200 bg-white text-ink-700 hover:bg-ink-50",
                    )}
                  >
                    <SettingsIcon
                      className={clsx(
                        "h-4 w-4",
                        active ? "text-accent-600" : "text-accent-500",
                      )}
                    />
                    {s.label}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              {!selectedSubs.length && (
                <p className="text-xs text-ink-400">
                  Pick at least one sub-category to explore.
                </p>
              )}
              <Button onClick={onExplore} disabled={!canExplore}>
                Explore Products
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Explore area (results) ─── */

function ExploreArea({
  mode,
  makes,
  models,
  generation,
  skipGeneration,
  variants,
  fuels,
  years,
  selectedCats,
  selectedSubs,
  activeSubcategoryOptions,
  onClearEdit,
  onEditSelection,
  sort,
  setSort,
  partQuery,
  setPartQuery,
  selectedBrands,
  setSelectedBrands,
  totalParts,
  grouped,
  collapsedGroups,
  toggleGroup,
  cart,
  onAdd,
  onQty,
}) {
  const catLabels = selectedCats
    .map((v) => GLOBAL_CATEGORIES.find((c) => c.value === v)?.label)
    .filter(Boolean);
  const selectedSubLabels = selectedSubs
    .map(
      (value) => activeSubcategoryOptions.find((s) => s.value === value)?.label,
    )
    .filter(Boolean);

  return (
    <div className="p-5">
      {/* Breadcrumb chips */}
      <div className="mb-3 flex flex-wrap gap-2">
        {makes.length > 0 && <BreadChip>{makes.join(", ")}</BreadChip>}
        {models.length > 0 && (
          <BreadChip>{models.map((m) => m.toUpperCase()).join(", ")}</BreadChip>
        )}
        {mode === "vehicle" && !skipGeneration && generation && (
          <BreadChip>
            {
              (
                GENERATIONS.find((g) => g.value === generation)?.label ?? ""
              ).split(" (")[0]
            }
          </BreadChip>
        )}
        {variants.length > 0 && <BreadChip>{variants.join(", ")}</BreadChip>}
        {fuels.length > 0 && <BreadChip>{fuels.join(", ")}</BreadChip>}
        {years.length > 0 && <BreadChip>{years.join(", ")}</BreadChip>}
        {catLabels.length > 0 && (
          <BreadChip>
            {catLabels.map((c) => c.toUpperCase()).join(", ")}
          </BreadChip>
        )}
        {selectedSubLabels.length > 0 && (
          <BreadChip>
            {selectedSubLabels.map((c) => c.toUpperCase()).join(", ")}
          </BreadChip>
        )}
      </div>

      <div className="mb-4 flex flex-wrap justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="border" onClick={onClearEdit}>
            Clear &amp; Edit
          </Button>
          <Button variant="secondary" icon={Pencil} onClick={onEditSelection}>
            Edit Selection
          </Button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_1fr_2fr_auto]">
        <FilterField label="Brand">
          <MultiSelect
            label="Brand"
            options={BRAND_SELECT_OPTIONS}
            value={selectedBrands}
            onChange={setSelectedBrands}
            placeholder="All Brands"
          />
        </FilterField>

        <FilterField label="Sort By">
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            variant="underline"
            options={[
              { value: "default", label: "Default" },
              { value: "price-asc", label: "Price: Low to High" },
              { value: "price-desc", label: "Price: High to Low" },
              { value: "disc-desc", label: "Discount: High to Low" },
            ]}
          />
        </FilterField>

        {/* <FilterField label=" "> */}
        <Input
          type="search"
          value={partQuery}
          onChange={(e) => setPartQuery(e.target.value)}
          placeholder="Search Part"
        />
        {/* </FilterField> */}

        <div className="flex h-11 items-center">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-sm font-semibold text-ink-700">
            <PackageOpenIcon className="h-4 w-4 text-accent-500" />
            <span className="font-bold">{totalParts}</span> Parts
          </span>
        </div>
      </div>

      {grouped.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-200 py-16 text-center text-sm text-ink-500">
          No parts match the current filters.
        </div>
      ) : (
        <div className="space-y-2">
          {grouped.map((g) => {
            const aggOpen = !collapsedGroups.has(`agg:${g.agg}`);
            return (
              <div
                key={g.agg}
                className="overflow-hidden rounded-lg border border-ink-100"
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(`agg:${g.agg}`)}
                  className="flex cursor-pointer w-full items-center justify-between bg-ink-50/60 px-4 py-2.5"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-800">
                    {aggOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    {g.aggLabel}
                  </span>
                  <span className="text-xs text-brand-700">
                    {g.count} parts
                  </span>
                </button>
                {aggOpen && (
                  <div className="space-y-2 bg-white p-3">
                    {g.subs.map((s) => {
                      const subOpen = !collapsedGroups.has(
                        `sub:${g.agg}:${s.sub}`,
                      );
                      return (
                        <div
                          key={s.sub}
                          className="overflow-hidden rounded-lg border border-ink-100"
                        >
                          <button
                            type="button"
                            onClick={() => toggleGroup(`sub:${g.agg}:${s.sub}`)}
                            className="flex w-full cursor-pointer items-center justify-between bg-white px-4 py-2.5"
                          >
                            <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-700">
                              {subOpen ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              {s.subLabel}
                            </span>
                            <span className="text-xs text-brand-700">
                              {s.parts.length} parts
                            </span>
                          </button>
                          {subOpen && (
                            <div className="overflow-x-auto ">
                              <table className="w-full min-w-[960px] text-sm">
                                <thead>
                                  <tr className="border-t border-ink-100 bg-ink-50/60 text-left text-[11px] font-medium text-ink-500">
                                    <th className="px-4 py-2.5">PART NAME</th>
                                    <th className="px-4 py-2.5">BRAND NAME</th>
                                    <th className="px-4 py-2.5 text-center">
                                      MRP
                                      <br />
                                      <span className="text-[9px] normal-case">
                                        (INCL. TAX)
                                      </span>
                                    </th>
                                    <th className="px-4 py-2.5 text-center">
                                      DISC %
                                    </th>
                                    <th className="px-4 py-2.5 text-center">
                                      BILLING PRICE
                                      <br />
                                      <span className="text-[9px] normal-case">
                                        (INCL. TAX)
                                      </span>
                                    </th>
                                    <th className="px-4 py-2.5 text-center">
                                      MYTVS COINS
                                    </th>
                                    <th className="px-4 py-2.5 text-center">
                                      WARRANTY
                                    </th>
                                    <th className="px-4 py-2.5 text-center">
                                      ETD
                                    </th>
                                    <th className="px-4 py-2.5 text-center">
                                      QUANTITY
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {s.parts.map((p) => {
                                    const cartRow = cart.find(
                                      (c) => c.cartId === p.partNumber,
                                    );
                                    const discPct =
                                      p.mrp && p.saleRate < p.mrp
                                        ? Math.round(
                                            ((p.mrp - p.saleRate) / p.mrp) *
                                              100 *
                                              100,
                                          ) / 100
                                        : 0;
                                    const priceIncl = Math.round(
                                      p.saleRate * (1 + p.taxpercent / 100),
                                    );
                                    const mrpIncl = Math.round(p.mrp);
                                    return (
                                      <tr
                                        key={p.partNumber}
                                        className="border-t border-ink-100"
                                      >
                                        <td className="px-4 py-3">
                                          <p className="font-semibold text-ink-800">
                                            {p.itemDescription}
                                          </p>
                                          <p className="mt-0.5 text-xs text-brand-700">
                                            {p.partNumber}
                                          </p>
                                        </td>
                                        <td className="px-4 py-3">
                                          <span className="inline-block rounded bg-brand-600 px-2.5 py-1 text-[11px] font-semibold text-white">
                                            {p.brandName}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-center font-semibold text-ink-800">
                                          ₹{mrpIncl.toLocaleString("en-IN")}
                                        </td>
                                        <td className="px-4 py-3 text-center text-ink-600">
                                          {discPct > 0 ? `${discPct}%` : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-center font-semibold text-ink-800">
                                          ₹{priceIncl.toLocaleString("en-IN")}
                                        </td>
                                        <td className="px-4 py-3 text-center text-ink-500">
                                          {p.points || "—"}
                                        </td>
                                        <td className="px-4 py-3 text-center text-ink-500">
                                          {p.warrantyDays
                                            ? `${p.warrantyDays}d`
                                            : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-center text-ink-500">
                                          {p.eda != null ? `${p.eda}d` : "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="flex justify-center">
                                            <CatalogueQtyStepper
                                              value={cartRow?.qty ?? 0}
                                              onChange={(v) =>
                                                cartRow
                                                  ? onQty(cartRow.cartId, v)
                                                  : v > 0
                                                    ? onAdd(p)
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
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── small building blocks ─── */

function FilterField({ label, children }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-brand-700">{label}</p>
      {children}
    </div>
  );
}

function BreadChip({ children }) {
  return (
    <span className="inline-block rounded-md border border-ink-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink-700">
      {children}
    </span>
  );
}

/** Bump qty + recompute money on a cart row. */
function bumpQty(row, delta, taxPercent) {
  const qty = Math.max(1, row.qty + delta);
  const tax = row.saleRate * ((taxPercent ?? 18) / 100) * qty;
  return {
    ...row,
    qty,
    tax: +tax.toFixed(2),
    totalAmount: +(row.saleRate * qty + tax).toFixed(2),
  };
}
