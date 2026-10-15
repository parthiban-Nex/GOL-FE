import { useEffect, useMemo, useState, useCallback } from "react";
import clsx from "clsx";
import { Check, Pencil, X, Car } from "lucide-react";
import * as Icons from "lucide-react";
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
  catalogueApi,
  getCalculatedSaleRate,
  formatDisplayPartNo,
  TIER_DISCOUNTS,
  isPartMatchingSearch,
} from "@/services/api/catalogueApi";
import { showToast } from "@/utils/toast";
import { storage } from "@/utils/storage";
import { appConfig } from "@/config/appConfig";

const CUSTOMER_CODE = "050";

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
  if (Array.isArray(res.masterList)) return res.masterList;
  if (Array.isArray(res.masterData)) return res.masterData;
  if (Array.isArray(res.modelList)) return res.modelList;
  if (Array.isArray(res.makeList)) return res.makeList;
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

function toOptions(data, valKey = "name", labelKey = "name") {
  const items = extractData(data);
  return items
    .map((item) => {
      if (typeof item === "string" || typeof item === "number") {
        return { value: String(item), label: String(item) };
      }
      if (!item || typeof item !== "object") {
        return { value: "", label: "" };
      }
      const val =
        item.masterName ??
        item.masterValue ??
        item.masterCode ??
        item.value ??
        item.id ??
        item.make ??
        item.model ??
        item.vehicleGeneration ??
        item.generation ??
        item.variant ??
        item.fuelType ??
        item.year ??
        item.aggregate ??
        item.subAggregate ??
        item[valKey] ??
        item.name ??
        item.label ??
        "";
      const lbl =
        item.label ??
        item.masterName ??
        item.masterValue ??
        item.name ??
        item.make ??
        item.model ??
        item.vehicleGeneration ??
        item.generation ??
        item.variant ??
        item.fuelType ??
        item.year ??
        item.aggregate ??
        item.subAggregate ??
        item[labelKey] ??
        item.value ??
        String(val);
      return { value: String(val), label: String(lbl), raw: item };
    })
    .filter((o) => o.value !== "");
}

function toGenerations(data) {
  const items = extractData(data);
  return items.map((item, idx) => {
    if (typeof item === "string" || typeof item === "number") {
      return { value: String(item), label: String(item), url: "" };
    }
    if (!item || typeof item !== "object") {
      return { value: `gen_${idx}`, label: `Gen ${idx + 1}`, url: "" };
    }
    const val =
      item.masterName ??
      item.masterValue ??
      item.masterCode ??
      item.value ??
      item.id ??
      item.code ??
      item.vehicleGeneration ??
      item.generation ??
      item.name ??
      `gen_${idx}`;
    const lbl =
      item.label ??
      item.masterName ??
      item.name ??
      item.vehicleGeneration ??
      item.generation ??
      String(val);
    const url =
      item.imageUrl ??
      item.url ??
      item.image_url ??
      item.image ??
      item.picture ??
      item.img ??
      "";
    return { value: String(val), label: String(lbl), url };
  });
}
function groupPartsByComponent(data) {
  const items = extractData(data);
  if (!items.length) return [];

  if (items[0] && (items[0].oem || items[0].primary || items[0].secondary)) {
    return items;
  }

  // 1. Group items by component into tier arrays so no parts are overwritten
  const componentMap = new Map();
  const seenPartKeys = new Set();

  items.forEach((item, index) => {
    if (!item || typeof item !== "object") return;

    const rawPartNumber = String(item.partNumber || item.oemPartNumber || item.code || "").trim();
    const brandStr = String(item.brandName || item.brand || "").trim().toUpperCase();

    // Deduplicate identical part records from backend response
    const dedupeKey = rawPartNumber
      ? `${rawPartNumber.toUpperCase()}__${brandStr}`
      : `item_${index}`;

    if (seenPartKeys.has(dedupeKey)) {
      return; // Skip duplicate part
    }
    seenPartKeys.add(dedupeKey);

    const compName = (
      item.components ||
      item.component ||
      item.itemDescription ||
      item.partDescription ||
      `Part ${index + 1}`
    ).trim();

    const groupKey = compName.toLowerCase();

    if (!componentMap.has(groupKey)) {
      componentMap.set(groupKey, {
        components: compName,
        aggregate: item.aggregate || "",
        subAggregate: item.subAggregate || "",
        oem: [],
        primary: [],
        secondary: [],
      });
    }

    const compGroup = componentMap.get(groupKey);

    const groupFlag = String(
      item.salesPriceGroup || item.priceGroup || item.group || item.tier || ""
    ).toLowerCase();

    let tierKey = "oem";
    if (groupFlag.includes("primary")) {
      tierKey = "primary";
    } else if (groupFlag.includes("secondary")) {
      tierKey = "secondary";
    } else if (groupFlag.includes("oem")) {
      tierKey = "oem";
    } else if (item.brandPriority === true) {
      tierKey = "primary";
    }

    const discountPct =
      item.partConfig?.discountPercent !== undefined &&
        item.partConfig?.discountPercent !== null
        ? Number(item.partConfig.discountPercent)
        : (TIER_DISCOUNTS[tierKey] ? TIER_DISCOUNTS[tierKey] * 100 : 0);

    const mrpVal = Number(item.mrp || item.listPrice || 0);
    const saleRateVal = getCalculatedSaleRate(mrpVal, tierKey, discountPct);
    const lineCode = item.lineCode || "";
    const displayPartNo = formatDisplayPartNo(rawPartNumber, lineCode);

    const tierPart = {
      code: rawPartNumber,
      partNumber: rawPartNumber,
      displayPartNo: displayPartNo || rawPartNumber,
      brand:
        item.brandName ||
        item.brand ||
        item.oemPartBrand ||
        (tierKey === "oem" ? (item.make || "OEM") : "-"),
      mrp: mrpVal,
      saleRate: saleRateVal,
      discountPercent: discountPct,
      discountPerUnit: +(mrpVal - saleRateVal).toFixed(2),
      golSavings: +(mrpVal - saleRateVal).toFixed(2),
      taxPercent: parseFloat(item.taxpercent || 18),
      warranty: item.warrantyDays ? `${item.warrantyDays} Days` : "No warranty",
      warrantyDays: item.warrantyDays || 0,
      coins: item.partConfig?.loyaltyBasePoints || item.points || 0,
      points: item.partConfig?.loyaltyBasePoints || item.points || 0,
      etd: item.EDA !== undefined ? `${item.EDA} Days` : "Instant",
      eda: item.EDA !== undefined ? item.EDA : null,
      lineCode,
      raw: item,
      tierType: tierKey,
    };

    compGroup[tierKey].push(tierPart);
  });

  // 2. Flatten each component group into rows (one slot per index if multiple parts exist in a tier)
  const resultRows = [];
  let rowCounter = 0;

  componentMap.forEach((compGroup, groupKey) => {
    const maxLen = Math.max(
      compGroup.oem.length,
      compGroup.primary.length,
      compGroup.secondary.length,
      1
    );

    for (let slot = 0; slot < maxLen; slot++) {
      resultRows.push({
        rowId: `row_${rowCounter++}_${groupKey.replace(/[^a-z0-9]/gi, "_")}_${slot}`,
        components: compGroup.components,
        aggregate: compGroup.aggregate,
        subAggregate: compGroup.subAggregate,
        oem: compGroup.oem[slot] || null,
        primary: compGroup.primary[slot] || null,
        secondary: compGroup.secondary[slot] || null,
      });
    }
  });

  return resultRows;
}

function normalizeCartItem(item) {
  if (!item || typeof item !== "object") return null;
  const partNo = item.partNumber || item.part_number || item.code || item.cartId || item.id;
  const desc = item.itemDescription || item.part_desc || item.name || partNo;
  const brand = item.brandName || item.product_brand || item.brand || "MAHINDRA";
  const qty = Number(item.quantity ?? item.qty ?? 1);
  const mrp = Number(item.mrp ?? item.part_mrp ?? item.listPrice ?? 0);
  const listPrice = Number(item.listPrice ?? item.list_price ?? item.billingPrice ?? item.saleRate ?? mrp);
  const billingPrice = Number(item.billingPrice ?? listPrice);
  const tax = Number(item.taxAmount ?? item.tax ?? 0);
  const discountPerUnit = Number(item.discountPerUnit ?? Math.max(0, mrp - listPrice));
  const totalAmount = Number(item.totalAmount ?? item.total ?? (qty * (billingPrice + tax)));

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
    golSavings: item.golSavings || item.savingAmount || 0,
    tax: Number(tax.toFixed(2)),
    totalAmount: Number(totalAmount.toFixed(2)),
    pointsEarned: item.pointsEarned || item.points || item.loyaltyBasePoints || 0,
    raw: item,
  };
}

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

  // Dynamic API Options States
  const [makeOptions, setMakeOptions] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  const [generationOptions, setGenerationOptions] = useState([]);
  const [variantOptions, setVariantOptions] = useState([]);
  const [fuelOptions, setFuelOptions] = useState([]);
  const [yearOptions, setYearOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState([]);

  const [partsList, setPartsList] = useState([]);
  const [isLoadingParts, setIsLoadingParts] = useState(false);

  const [brandGroups, setBrandGroups] = useState(["all"]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [partQuery, setPartQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(partQuery.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [partQuery]);

  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [openOrder, setOpenOrder] = useState(null);

  const fetchCart = () => {
    catalogueApi
      .getCart()
      .then((res) => {
        const raw = extractData(res);
        if (Array.isArray(raw)) {
          setCart(raw.map(normalizeCartItem).filter(Boolean));
        }
      })
      .catch((err) => {
        console.warn("Error fetching cart from backend:", err);
      });
  };

  const fetchOrders = useCallback(async () => {
    const loggedInUser =
      storage.get(appConfig.userStorageKey) ||
      JSON.parse(localStorage.getItem("user") || "{}");
    const workshopId =
      loggedInUser?.outlet_code ||
      loggedInUser?.outletCode ||
      loggedInUser?.workshopId ||
      loggedInUser?.customer_account_id ||
      "";

    try {
      const res = await catalogueApi.getDirectEnquiryOrderList({ workshopId });
      const list = res?.data || res?.orders || extractData(res);
      if (Array.isArray(list)) {
        setOrders(list);
      }
    } catch (err) {
      console.warn("Error fetching direct enquiry orders:", err);
    }
  }, []);

  // 1. Fetch Makes, Top 20 Cars, Cart & Orders on mount
  useEffect(() => {
    catalogueApi
      .getMakes({ customerCode: CUSTOMER_CODE })
      .then((res) => setMakeOptions(toOptions(res, "make", "make")))
      .catch(() => setMakeOptions([]));

    catalogueApi
      .getTop20Cars()
      .then((res) => {
        const list = extractData(res);
        if (list.length) {
          // Top 20 cars received from API
        }
      })
      .catch(() => { });

    fetchCart();
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch orders whenever user switches to the orders tab
  useEffect(() => {
    if (tab === "orders") {
      fetchOrders();
    }
  }, [tab, fetchOrders]);

  // 2. Fetch Models when Makes change
  useEffect(() => {
    if (!makes.length) {
      setModelOptions([]);
      return;
    }
    catalogueApi
      .getModels({ customerCode: CUSTOMER_CODE, make: makes })
      .then((res) => setModelOptions(toOptions(res, "model", "model")))
      .catch(() => setModelOptions([]));
  }, [makes]);

  // 3. Fetch Generations when Models change
  useEffect(() => {
    if (!models.length) {
      setGenerationOptions([]);
      return;
    }
    catalogueApi
      .getGenerations({ customerCode: CUSTOMER_CODE, make: makes, model: models })
      .then((res) => setGenerationOptions(toGenerations(res)))
      .catch(() => setGenerationOptions([]));
  }, [makes, models]);

  // 4. Fetch Variants when Generation changes
  useEffect(() => {
    if (!generation) {
      setVariantOptions([]);
      return;
    }
    catalogueApi
      .getVariants({
        customerCode: CUSTOMER_CODE,
        make: makes,
        model: models,
        vehicleGeneration: generation,
      })
      .then((res) => setVariantOptions(toOptions(res, "variant", "variant")))
      .catch(() => setVariantOptions([]));
  }, [makes, models, generation]);

  // 5. Fetch Fuels when Variants change
  useEffect(() => {
    if (!variants.length) {
      setFuelOptions([]);
      return;
    }
    catalogueApi
      .getFuels({
        customerCode: CUSTOMER_CODE,
        make: makes,
        model: models,
        vehicleGeneration: generation,
        variant: variants,
      })
      .then((res) => {
        const opts = toOptions(res, "fuelType", "fuelType");
        setFuelOptions(opts);
        if (opts.length === 1) {
          setFuels([opts[0].value]);
        }
      })
      .catch(() => setFuelOptions([]));
  }, [makes, models, generation, variants]);

  // 6. Fetch Years when Fuels change
  useEffect(() => {
    if (!fuels.length) {
      setYearOptions([]);
      return;
    }
    catalogueApi
      .getYears({
        customerCode: CUSTOMER_CODE,
        make: makes,
        model: models,
        vehicleGeneration: generation,
        variant: variants,
        fuelType: fuels,
      })
      .then((res) => setYearOptions(toOptions(res, "year", "year")))
      .catch(() => setYearOptions([]));
  }, [makes, models, generation, variants, fuels]);

  // 7. Fetch Categories (Aggregates) when Years change
  useEffect(() => {
    if (!years.length) {
      setCategoryOptions([]);
      return;
    }
    catalogueApi
      .getCategories({
        customerCode: CUSTOMER_CODE,
        make: makes,
        model: models,
        vehicleGeneration: generation,
        variant: variants,
        fuelType: fuels,
        year: years,
      })
      .then((res) =>
        setCategoryOptions(toOptions(res, "aggregate", "aggregate")),
      )
      .catch(() => setCategoryOptions([]));
  }, [makes, models, generation, variants, fuels, years]);

  // 8. Fetch Subcategories (Sub-aggregates) when Categories change
  useEffect(() => {
    if (!categories.length) {
      setSubcategoryOptions([]);
      return;
    }
    catalogueApi
      .getSubcategories({
        customerCode: CUSTOMER_CODE,
        make: makes,
        model: models,
        vehicleGeneration: generation,
        variant: variants,
        fuelType: fuels,
        year: years,
        aggregate: categories,
      })
      .then((res) =>
        setSubcategoryOptions(toOptions(res, "subAggregate", "subAggregate")),
      )
      .catch(() => setSubcategoryOptions([]));
  }, [makes, models, generation, variants, fuels, years, categories]);

  // 9. Fetch Parts List automatically as soon as selection criteria are complete (before clicking View Parts List)
  useEffect(() => {
    if (
      !makes.length ||
      !models.length ||
      !generation ||
      !variants.length ||
      !fuels.length ||
      !years.length ||
      !categories.length ||
      !subcategories.length
    ) {
      setPartsList([]);
      return;
    }
    setIsLoadingParts(true);
    const payload = {
      customerCode: CUSTOMER_CODE,
      make: makes,
      model: models,
      vehicleGeneration: generation,
      variant: variants,
      fuelType: fuels,
      year: years,
      aggregate: categories,
      subAggregate: subcategories,
    };
    if (debouncedQuery) {
      payload.partNumber = debouncedQuery;
      payload.searchKey = debouncedQuery;
    }
    catalogueApi
      .getPartsList(payload)
      .then((res) => setPartsList(groupPartsByComponent(extractData(res))))
      .catch(() => setPartsList([]))
      .finally(() => setIsLoadingParts(false));
  }, [
    makes,
    models,
    generation,
    variants,
    fuels,
    years,
    categories,
    subcategories,
    debouncedQuery,
  ]);

  function handleMakesChange(next) {
    setMakes(next);
    setModels([]);
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

  const activeTiers = brandGroups.includes("all") ? TIER_ORDER : brandGroups;

  const filteredRows = useMemo(() => {
    let rows = partsList.filter((r) => {
      if (categories.length && !categories.includes(r.aggregate)) return false;
      if (subcategories.length && !subcategories.includes(r.subAggregate))
        return false;
      return true;
    });

    if (!brandGroups.includes("all")) {
      rows = rows.filter((r) => activeTiers.some((g) => Boolean(r[g])));
    }

    if (selectedBrands.length) {
      rows = rows.filter((r) =>
        activeTiers.some((k) => r[k] && selectedBrands.includes(r[k].brand)),
      );
    }

    const query = String(partQuery || "").trim().toLowerCase();
    if (!query) return rows;

    return rows.filter((row) => {
      // 1. Match component name / subAggregate / aggregate
      const componentName = String(
        row.components || row.componentName || row.subAggregate || row.aggregate || row.name || ""
      ).toLowerCase();
      if (componentName.includes(query)) {
        return true;
      }

      // 2. Check OEM part column
      const oemPart = row.oem || row.oemPart;
      if (isPartMatchingSearch(oemPart, query)) {
        return true;
      }

      // 3. Check Vendor Primary part column
      const primaryPart = row.primary || row.primaryPart;
      if (isPartMatchingSearch(primaryPart, query)) {
        return true;
      }

      // 4. Check Vendor Secondary part column
      const secondaryPart = row.secondary || row.secondaryPart;
      if (isPartMatchingSearch(secondaryPart, query)) {
        return true;
      }

      // 5. Check if row contains secondaryParts or raw parts array
      if (Array.isArray(row.secondaryParts) && row.secondaryParts.some((p) => isPartMatchingSearch(p, query))) {
        return true;
      }

      if (Array.isArray(row.parts) && row.parts.some((p) => isPartMatchingSearch(p, query))) {
        return true;
      }

      return false;
    });
  }, [
    partsList,
    categories,
    subcategories,
    brandGroups,
    activeTiers,
    selectedBrands,
    partQuery,
  ]);

  const availableBrands = useMemo(() => {
    const set = new Set();
    for (const r of partsList) {
      ["oem", "primary", "secondary"].forEach(
        (k) => r[k] && set.add(r[k].brand),
      );
    }
    return Array.from(set).sort();
  }, [partsList]);

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

  async function addToCart(row, tierKey) {
    const tier = row[tierKey];
    if (!tier || !tier.code) return;
    const partNo = tier.code;
    const mrp = Number(tier.mrp || 0);
    const saleRate = tier.saleRate ?? getCalculatedSaleRate(mrp, tierKey, tier.discountPercent);
    const payload = {
      ...(tier.raw || {}),
      part_number: partNo,
      description: row.components,
      tierType: tierKey,
      mrp,
      saleRate,
      list_price: saleRate,
      quantity: 1,
      tax: tier.taxPercent || 18,
      qty: 1,
      brand_name: tier.brand || "",
    };

    try {
      await catalogueApi.addToCart(payload);
      showToast.success(`${row.components} (${tier.brand}) added to cart`);
      fetchCart();
    } catch (err) {
      console.warn("Backend addToCart error, updating local state:", err);
      showToast.success(`${row.components} (${tier.brand}) added to cart`);
      setCart((cur) => {
        const existing = cur.find((c) => c.code === partNo || c.part_number === partNo);
        if (existing) {
          return cur.map((c) =>
            c.code === partNo || c.part_number === partNo ? { ...c, qty: c.qty + 1 } : c
          );
        }
        return [
          ...cur,
          normalizeCartItem({
            ...payload,
            part_number: partNo,
            part_desc: row.components,
            product_brand: tier.brand,
            mrp,
            saleRate,
            list_price: saleRate,
            tierType: tierKey,
            tax: tier.taxPercent || 18,
            qty: 1,
            quantity: 1,
          }),
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
      console.warn("Backend updateCartQty error, fallback local update:", err);
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
      console.warn("Backend removeCartItem error, fallback local update:", err);
      setCart((cur) => cur.filter((c) => c.cartId !== cartId && c.code !== cartId));
    }
  }

  async function checkout(selectedItems) {
    const itemsToCheckout =
      Array.isArray(selectedItems) && selectedItems.length > 0 ? selectedItems : cart;

    if (!itemsToCheckout.length) {
      showToast.warning("Please select at least one item to proceed to checkout.");
      return;
    }

    const loggedInUser =
      storage.get(appConfig.userStorageKey) ||
      JSON.parse(localStorage.getItem("user") || "{}");
    const workshopId =
      loggedInUser?.outlet_code ||
      loggedInUser?.outletCode ||
      loggedInUser?.workshopId ||
      loggedInUser?.customer_account_id ||
      "";

    const customerCode =
      (loggedInUser?.customer_code && loggedInUser.customer_code !== "050" && loggedInUser.customer_code !== "0046" ? loggedInUser.customer_code : null) ||
      (loggedInUser?.customerCode && loggedInUser.customerCode !== "050" && loggedInUser.customerCode !== "0046" ? loggedInUser.customerCode : null) ||
      loggedInUser?.outlet?.customer_code ||
      loggedInUser?.outlet?.customerCode ||
      "NMSA0786";

    const payload = {
      workshopId: String(workshopId).trim(),
      customer_code: String(customerCode).trim(),
      source: "GOL",
      channel: "B2B-API",
      reference_no: `REF-GOL-${Date.now()}`,
      vehicle_no: "",
      parts: itemsToCheckout.map((item) => ({
        part_no: String(
          item.part_number || item.code || item.partNumber || item.cartId || item.id
        ).trim(),
        qty: Number(item.qty || item.quantity || 1),
      })),
    };

    try {
      const response = await catalogueApi.createDirectEnquiryOrder(payload);

      const isSuccess =
        response?.success === true ||
        Boolean(response?.enquiry_no || response?.data?.enquiry_no || response?.enquiryNo);

      const enqNo =
        response?.enquiry_no ||
        response?.data?.enquiry_no ||
        response?.enquiryNo;

      if (!isSuccess) {
        const errorMsg =
          response?.message ||
          response?.error?.message ||
          response?.data?.message ||
          "Failed to place order";
        showToast.error(errorMsg);
        return;
      }

      showToast.success(`Order Enquiry Created! Ref: ${enqNo}`);

      // Remove only checked-out items from cart
      const checkedOutKeys = new Set(
        itemsToCheckout.map((i) =>
          String(i.part_number || i.code || i.partNumber || i.cartId || i.id).trim()
        )
      );

      setCart((cur) =>
        cur.filter((c) => {
          const key = String(c.part_number || c.code || c.partNumber || c.cartId || c.id).trim();
          return !checkedOutKeys.has(key);
        })
      );

      // Also remove from backend cart to stay in sync
      itemsToCheckout.forEach((item) => {
        const pNo = item.part_number || item.code || item.partNumber;
        if (pNo) catalogueApi.removeCartItem(pNo).catch(() => {});
      });

      setTab("orders");
      fetchOrders();
    } catch (err) {
      console.error("Backend createDirectEnquiryOrder error:", err);
      const errorMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        "Error placing order";
      showToast.error(errorMsg);
    }
  }

  function viewOrder(order) {
    setOpenOrder(order);
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
                makeOptions={makeOptions}
                modelOptions={modelOptions}
                generation={generation}
                generations={generationOptions}
                onPreviewGen={setPreviewGen}
                setGeneration={handleGenerationChange}
                variants={variants}
                onVariantsChange={handleVariantsChange}
                variantOptions={variantOptions}
                fuels={fuels}
                onFuelsChange={handleFuelsChange}
                fuelOptions={fuelOptions}
                years={years}
                onYearsChange={handleYearsChange}
                yearOptions={yearOptions}
                categories={categories}
                onCategoriesChange={handleCategoriesChange}
                categoryOptions={categoryOptions}
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
                isLoadingParts={isLoadingParts}
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
            onUpdateQty={updateCartQty}
            onBrowseParts={() => setTab("catalogue")}
          />
        </Card>
      )}
      {tab === "orders" && (
        <Card>
          <CatalogueOrdersTable
            orders={orders}
            onView={viewOrder}
            onRefresh={fetchOrders}
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
            {previewGen.url ? (
              <img
                src={previewGen.url}
                alt={previewGen.label}
                className="mx-auto h-56 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : null}
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
  makeOptions,
  models,
  onModelsChange,
  modelOptions,
  generation,
  generations,
  setGeneration,
  onPreviewGen,
  variants,
  onVariantsChange,
  variantOptions,
  fuels,
  onFuelsChange,
  fuelOptions,
  years,
  onYearsChange,
  yearOptions,
  categories,
  onCategoriesChange,
  categoryOptions,
  subcategories,
  setSubcategories,
  subcategoryOptions,
  canExplore,
  onExplore,
}) {
  const showModel = makes.length > 0;
  const showGeneration = models.length > 0 || generations.length > 0;
  const showVariant = Boolean(generation) || variantOptions.length > 0;
  const showFuel = variants.length > 0 || fuelOptions.length > 0;
  const showYear = fuels.length > 0 || yearOptions.length > 0;
  const showCategories = years.length > 0 || categoryOptions.length > 0;
  const showSubcategories = categories.length > 0 || subcategoryOptions.length > 0;

  return (
    <div className="space-y-6 p-5">
      <div className="flex flex-wrap gap-6">
        <UnderlineField label="Make">
          <MultiSelect
            options={makeOptions}
            value={makes}
            onChange={onMakesChange}
            placeholder="Select Make"
            sx={{ width: 260 }}
          />
        </UnderlineField>
        {showModel && (
          <UnderlineField label="Model">
            <MultiSelect
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
            {generations.length === 0 ? (
              <div className="py-4 text-sm text-ink-400">Loading generations...</div>
            ) : (
              generations.map((g) => {
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
                        "absolute right-2 top-2 flex h-5 w-5 cursor-pointer items-center justify-center rounded border z-10",
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
                      onClick={() => setGeneration(active ? "" : g.value)}
                      className="block w-full cursor-pointer text-left"
                    >
                      {g.url ? (
                        <img
                          src={g.url}
                          alt={g.label}
                          className="mx-auto h-16 w-auto object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            if (e.currentTarget.nextSibling) {
                              e.currentTarget.nextSibling.style.display = "flex";
                            }
                          }}
                        />
                      ) : null}
                      <div
                        className="mx-auto flex h-16 w-16 items-center justify-center rounded-lg bg-brand-50 text-brand-600"
                        style={{ display: g.url ? "none" : "flex" }}
                      >
                        <Car className="h-8 w-8 text-brand-600" />
                      </div>
                      <p className="mt-2 text-center text-xs font-semibold uppercase text-ink-800">
                        {g.label.split(" (")[0]}
                      </p>
                    </button>
                    {g.url && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewGen(g);
                        }}
                        className="mt-1 block mx-auto text-[10px] text-ink-400 hover:text-ink-600 underline cursor-pointer"
                      >
                        Preview
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {showVariant && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          <UnderlineField label="Variant">
            <MultiSelect
              options={variantOptions}
              value={variants}
              onChange={onVariantsChange}
              placeholder="Select Variant"
            />
          </UnderlineField>
          {showFuel && (
            <UnderlineField label="Fuel Type">
              <MultiSelect
                options={fuelOptions}
                value={fuels}
                onChange={onFuelsChange}
                placeholder="Select Fuel Type"
              />
            </UnderlineField>
          )}
          {showYear && (
            <UnderlineField label="Year">
              <MultiSelect
                options={yearOptions}
                value={years}
                onChange={onYearsChange}
                placeholder="Select Year"
              />
            </UnderlineField>
          )}
          {showCategories && (
            <UnderlineField label="Categories">
              <MultiSelect
                options={categoryOptions}
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
  const chips = [
    makes.length > 0 ? `${makes.join(", ")}` : null,
    models.length > 0 ? `${models.join(", ")}` : null,
    generation ? String(generation) : null,
    variants.length > 0 ? `${variants.join(", ")}` : null,
    fuels.length > 0 ? `${fuels.join(", ")}` : null,
    years.length > 0 ? `${years.join(", ")}` : null,
    categories.length > 0 ? `${categories.join(", ")}` : null,
    subcategories.length > 0 ? `${subcategories.join(", ")}` : null,
  ]
    .filter(Boolean)
    .map((v) => String(v).toUpperCase());

  const brandOptions = availableBrands.map((b) => ({ value: b, label: b }));
  const activeTiers = brandGroups.includes("all") ? TIER_ORDER : brandGroups;

  const totalPartsCount = useMemo(() => {
    let count = 0;
    for (const r of rows) {
      for (const t of activeTiers) {
        const part = r[t];
        if (part && (!selectedBrands.length || selectedBrands.includes(part.brand))) {
          count += 1;
        }
      }
    }
    return count;
  }, [rows, activeTiers, selectedBrands]);

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
              options={brandOptions}
              value={selectedBrands}
              onChange={setSelectedBrands}
              placeholder="All Brands"
            />
          </UnderlineField>
          <UnderlineField label="Columns">
            <MultiSelect
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
              <Icons.PackageOpen className="h-4 w-4 text-accent-500" />
              <span className="font-bold">{totalPartsCount}</span> parts
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
  if (extraColumns.includes("brand")) keys.push("brand");
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
                  (c) =>
                    c.cartId === tier?.code ||
                    c.code === tier?.code ||
                    c.part_number === tier?.code ||
                    c.cartId === `${row.rowId}__${tierKey}`,
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
                        ? onQty(
                          cartRow.cartId || cartRow.code || tier?.code,
                          v > cartRow.qty ? "increase" : "decrease",
                          v,
                        )
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

  const mrp = Number(tier.mrp || 0);
  const saleRate = tier.saleRate ?? getCalculatedSaleRate(mrp, tierKey, tier.discountPercent);
  const partNo = tier.displayPartNo || formatDisplayPartNo(tier.partNumber || tier.code, tier.lineCode);

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
                  {partNo || tier.code}
                </span>
              </td>
            );
          case "brand": {
            const brandName =
              tier.brand && tier.brand !== "-"
                ? tier.brand
                : tierKey === "oem"
                  ? (tier.raw?.make || "OEM")
                  : "—";

            return (
              <td
                key={k}
                className={clsx(
                  cellCls,
                  "text-xs text-ink-600 whitespace-normal break-words" // <-- replaces nowrap
                )}
                title={brandName} // <-- Tooltip showing full name on mouse hover
              >
                {brandName}
              </td>
            );
          }

          case "mrp":
            return (
              <td key={k} className={clsx(cellCls, "text-center text-ink-700")}>
                ₹{Math.round(mrp).toLocaleString("en-IN")}
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
                ₹{Math.round(saleRate).toLocaleString("en-IN")}
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
            const mrp = Number(tier?.mrp || 0);
            const saleRate = tier?.saleRate ?? getCalculatedSaleRate(mrp, tierKey, tier?.discountPercent);
            const partNo = tier?.displayPartNo || formatDisplayPartNo(tier?.partNumber || tier?.code, tier?.lineCode);
            const cartRow = cart.find(
              (c) =>
                c.cartId === tier?.code ||
                c.code === tier?.code ||
                c.part_number === tier?.code ||
                c.cartId === `${row.rowId}__${tierKey}`,
            );
            const qty = cartRow?.qty ?? 0;
            const handleQty = (v) =>
              cartRow
                ? onQty(
                  cartRow.cartId || cartRow.code || tier?.code,
                  v > cartRow.qty ? "increase" : "decrease",
                  v,
                )
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
                        {partNo || tier.code}
                      </span>
                    </td>
                    {showBrand && (
                      <td className="px-3 py-4 text-xs text-ink-600">
                        {tier.brand && tier.brand !== "-"
                          ? tier.brand
                          : tierKey === "oem"
                            ? (tier.raw?.make || "OEM")
                            : "—"}
                      </td>
                    )}
                    <td className="px-3 py-4 text-center text-ink-700">
                      ₹{Math.round(mrp).toLocaleString("en-IN")}
                    </td>
                    <td className="px-3 py-4 text-center font-semibold text-ink-800">
                      ₹{Math.round(saleRate).toLocaleString("en-IN")}
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
      <p className="mb-1 text-xs font-semibold text-ink-500 uppercase tracking-wide">{label}</p>
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
