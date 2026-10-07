import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import {
  Search,
  Pencil,
  ChevronDown,
  ChevronRight,
  X,
  Check,
} from "lucide-react";
import * as Icons from "lucide-react";
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
import { showToast } from "@/utils/toast";
import { catalogueApi } from "@/services/api/catalogueApi";
import Pagination from "@/components/ui/Pagination";

const CUSTOMER_CODE = "0046";

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

function extractVehicleData(res) {
  if (!res) return null;
  const root = res.data ?? res.result ?? res;
  let target = root;
  if (Array.isArray(root)) target = root[0] || {};

  const mytvs = target.mytvsDetails || target.mytvs || {};
  const user = target.userDetails || target.user || {};
  const vahan = target.vahanDetails || target.vahan || target.result || target;

  const make =
    user.userMake ||
    mytvs.mytvsMake ||
    target.make ||
    target.manufacturer ||
    vahan.make ||
    vahan.manufacturer ||
    "";

  const model =
    user.userModel ||
    mytvs.mytvsModel ||
    target.model ||
    target.manufacturerModel ||
    target.manufacturer_model ||
    vahan.model ||
    vahan.manufacturerModel ||
    vahan.manufacturer_model ||
    "";

  const variant =
    user.userVariant ||
    mytvs.mytvsVariant ||
    target.variant ||
    vahan.variant ||
    "";

  const fuelType =
    user.userFuelType ||
    mytvs.mytvsFuelType ||
    target.fuelType ||
    target.fuel_type ||
    vahan.fuelType ||
    vahan.fuel_type ||
    "";

  const rawYear =
    user.userYear ||
    mytvs.mytvsYear ||
    target.year ||
    vahan.yearRegistration ||
    vahan.yearManufacturing ||
    vahan.year ||
    (vahan.registrationDate ? new Date(vahan.registrationDate).getFullYear() : "") ||
    (vahan.registration_date ? new Date(vahan.registration_date).getFullYear() : "");

  const year = rawYear ? String(rawYear) : "";

  return {
    make: make ? String(make).trim() : "",
    model: model ? String(model).trim() : "",
    variant: variant ? String(variant).trim() : "",
    fuelType: fuelType ? String(fuelType).trim() : "",
    year: year ? String(year).trim() : "",
  };
}

function toOptions(data, valKey = "masterName", labelKey = "masterName") {
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
        item[valKey] ??
        item.name ??
        item.label ??
        "";
      const lbl =
        item.label ??
        item.masterName ??
        item.masterValue ??
        item.name ??
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
      item.value ??
      item.id ??
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
      item.url ??
      item.imageUrl ??
      item.image_url ??
      item.image ??
      "";
    return { value: String(val), label: String(lbl), url };
  });
}

function normalizePartItem(item, idx) {
  if (!item || typeof item !== "object") return null;
  const pNo = item.partNumber || item.oemPartNumber || item.code || `PART_${idx}`;
  const desc = item.itemDescription || item.partDescription || item.components || item.name || `Part ${idx + 1}`;
  const brand = item.brandName || item.brand || "-";
  const agg = (item.aggregate || item.category || item.masterName || "PARTS").trim().toUpperCase();
  const sub = (item.subAggregate || item.subcategory || "GENERAL").trim().toUpperCase();
  const mrpVal = parseFloat(item.mrp || item.listPrice || 0);
  const taxVal = parseFloat(item.taxpercent || 18);

  const discPct =
    item.partConfig?.discountPercent !== undefined
      ? parseFloat(item.partConfig.discountPercent)
      : mrpVal > parseFloat(item.listPrice || item.saleRate || mrpVal)
        ? Math.round(((mrpVal - parseFloat(item.listPrice || item.saleRate)) / mrpVal) * 100)
        : 0;

  const saleVal =
    discPct > 0
      ? mrpVal * (1 - discPct / 100)
      : parseFloat(item.listPrice || item.mrp || item.saleRate || 0);

  const priceIncl = Math.round(saleVal * (1 + taxVal / 100));
  const mrpIncl = Math.round(mrpVal);

  return {
    partNumber: pNo,
    itemDescription: desc,
    brandName: brand,
    aggregate: agg,
    subAggregate: sub,
    mrp: mrpVal,
    mrpIncl,
    saleRate: saleVal,
    priceIncl,
    taxpercent: taxVal,
    discPct,
    points: item.partConfig?.loyaltyBasePoints || item.points || 0,
    warrantyDays: item.warrantyDays || 0,
    eda: item.EDA !== undefined ? item.EDA : item.eda,
    raw: item,
  };
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

const ORDER_DETAILS_BY_ENQUIRY = {};

// Category icon mapping - falls back to Settings when the mock icon
// name doesn't map to a lucide icon.
const CAT_ICONS = {
  FILTERS: "Filter",
  BRAKE_SYSTEM: "Disc",
  ENGINE: "Settings",
  SUSPENSION: "MoveVertical",
  LIGHTING: "Lightbulb",
  WHEELS_AND_TYRES: "CircleDot",
  BATTERY: "BatteryCharging",
  BELTS_AND_TENSIONER: "Minus",
  ACCESSORIES: "Sparkles",
  BEARING: "Settings2",
  BODY_PARTS: "Car",
  BRACKET: "Wrench",
  CABLES_AND_WIRES: "Cable",
  CHILD_PARTS: "Boxes",
  CLUTCH_SYSTEM: "CircleGauge",
  ELECTRICAL: "Zap",
  ELECTRICALS_AND_ELECTRONICS: "Zap",
  FLUIDS_COOLANT_AND_GREASE: "Droplet",
  FUEL_SYSTEM: "Fuel",
  GLASS: "Square",
  HORNS: "Megaphone",
};

export default function Global() {
  const [tab, setTab] = useState("catalogue");
  const [mode, setMode] = useState("stock"); // stock | vehicle
  const [phase, setPhase] = useState("select"); // select | explore

  // vehicle mode state
  const [regNo, setRegNo] = useState("");
  const [generation, setGeneration] = useState("");
  const [previewGen, setPreviewGen] = useState(null);
  const [vMakes, setVMakes] = useState([]);
  const [vModels, setVModels] = useState([]);
  const [vVariants, setVVariants] = useState([]);
  const [vFuels, setVFuels] = useState([]);
  const [vYears, setVYears] = useState([]);
  const [skipGeneration, setSkipGeneration] = useState(false);

  // stock mode state
  const [stockMakes, setStockMakes] = useState([]);
  const [stockModels, setStockModels] = useState([]);

  // shared filter selections
  const [selectedCats, setSelectedCats] = useState([]);
  const [selectedSubs, setSelectedSubs] = useState([]);
  const [sort, setSort] = useState("default");
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [partQuery, setPartQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  function handleSearchSubmit(queryToSubmit) {
    const q = queryToSubmit !== undefined ? queryToSubmit : searchInput;
    const clean = String(q || "").trim();
    if (!clean) return;
    setPartQuery(clean);
    setSearchInput(clean);
    setPhase("explore");
    setPage(1);
  }
  const [collapsedGroups, setCollapsedGroups] = useState(() => new Set());

  // Dynamic API options states
  const [makeOptions, setMakeOptions] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  const [generationOptions, setGenerationOptions] = useState([]);
  const [variantOptions, setVariantOptions] = useState([]);
  const [fuelOptions, setFuelOptions] = useState([]);
  const [yearOptions, setYearOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState([]);
  const [brandOptions, setBrandOptions] = useState([]);

  const [partsList, setPartsList] = useState([]);
  const [isLoadingParts, setIsLoadingParts] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPartsCount, setTotalPartsCount] = useState(0);

  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [openOrder, setOpenOrder] = useState(null);

  const currentMakes = mode === "stock" ? stockMakes : vMakes;
  const currentModels = mode === "stock" ? stockModels : vModels;

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [
    mode,
    stockMakes,
    stockModels,
    vMakes,
    vModels,
    generation,
    vVariants,
    vFuels,
    vYears,
    selectedCats,
    selectedSubs,
    selectedBrands,
    partQuery,
  ]);

  // 1. Fetch Makes, Brands, Categories & Cart on mount (customerCode 0046)
  useEffect(() => {
    catalogueApi
      .getMakes({ customerCode: CUSTOMER_CODE })
      .then((res) => setMakeOptions(toOptions(res)))
      .catch(() => setMakeOptions([]));

    catalogueApi
      .getBrands({ customerCode: CUSTOMER_CODE })
      .then((res) => setBrandOptions(toOptions(res)))
      .catch(() => setBrandOptions([]));

    catalogueApi
      .getCategories({ customerCode: CUSTOMER_CODE })
      .then((res) => setCategoryOptions(toOptions(res)))
      .catch(() => setCategoryOptions([]));

    fetchCart();

    catalogueApi
      .getOrders()
      .then((res) => setOrders(extractData(res)))
      .catch(() => setOrders([]));
  }, []);

  // 2. Fetch Models when Makes change
  useEffect(() => {
    if (!currentMakes.length) {
      setModelOptions([]);
      return;
    }
    catalogueApi
      .getModels({ customerCode: CUSTOMER_CODE, make: currentMakes })
      .then((res) => setModelOptions(toOptions(res)))
      .catch(() => setModelOptions([]));
  }, [currentMakes]);

  // 3. Fetch Generations when Models change (Vehicle mode)
  useEffect(() => {
    if (mode !== "vehicle" || !vModels.length) {
      setGenerationOptions([]);
      return;
    }
    catalogueApi
      .getGenerations({ customerCode: CUSTOMER_CODE, make: vMakes, model: vModels })
      .then((res) => setGenerationOptions(toGenerations(res)))
      .catch(() => setGenerationOptions([]));
  }, [vMakes, vModels, mode]);

  // 4. Fetch Variants when Generation changes (or skipped)
  useEffect(() => {
    if (mode !== "vehicle" || (!generation && !skipGeneration)) {
      setVariantOptions([]);
      return;
    }
    catalogueApi
      .getVariants({
        customerCode: CUSTOMER_CODE,
        make: vMakes,
        model: vModels,
        vehicleGeneration: generation || null,
      })
      .then((res) => {
        let opts = toOptions(res);
        vVariants.forEach((v) => {
          if (v && !opts.some((o) => o.value.toUpperCase() === String(v).toUpperCase())) {
            opts.push({ value: String(v), label: String(v) });
          }
        });
        setVariantOptions(opts);
      })
      .catch(() => setVariantOptions([]));
  }, [vMakes, vModels, generation, skipGeneration, mode]);

  // 5. Fetch Fuels when Variants change
  useEffect(() => {
    if (mode !== "vehicle" || !vVariants.length) {
      setFuelOptions([]);
      return;
    }
    catalogueApi
      .getFuels({
        customerCode: CUSTOMER_CODE,
        make: vMakes,
        model: vModels,
        vehicleGeneration: generation || null,
        variant: vVariants,
      })
      .then(async (res) => {
        let opts = toOptions(res);
        const missingSelectedFuel = vFuels.some(
          (f) => !opts.some((o) => o.value.toUpperCase() === String(f).toUpperCase())
        );
        if ((!opts.length || missingSelectedFuel) && vMakes.length && vModels.length) {
          try {
            const fallbackRes = await catalogueApi.getFuels({
              customerCode: CUSTOMER_CODE,
              make: vMakes,
              model: vModels,
            });
            const fallbackOpts = toOptions(fallbackRes);
            const combined = [...opts];
            fallbackOpts.forEach((fo) => {
              if (!combined.some((c) => c.value.toUpperCase() === fo.value.toUpperCase())) {
                combined.push(fo);
              }
            });
            opts = combined;
          } catch (e) {
            console.warn("Fallback getFuels error:", e);
          }
        }
        vFuels.forEach((f) => {
          if (f && !opts.some((o) => o.value.toUpperCase() === String(f).toUpperCase())) {
            opts.push({ value: String(f), label: String(f) });
          }
        });
        setFuelOptions(opts);
      })
      .catch(() => {
        const opts = vFuels.map((f) => ({ value: String(f), label: String(f) }));
        setFuelOptions(opts);
      });
  }, [vMakes, vModels, generation, vVariants, mode]);

  // 6. Fetch Years when Fuels change
  useEffect(() => {
    if (mode !== "vehicle" || !vFuels.length) {
      setYearOptions([]);
      return;
    }
    catalogueApi
      .getYears({
        customerCode: CUSTOMER_CODE,
        make: vMakes,
        model: vModels,
        vehicleGeneration: generation || null,
        variant: vVariants,
        fuelType: vFuels,
      })
      .then(async (res) => {
        let opts = toOptions(res);
        const missingSelectedYear = vYears.some(
          (y) => !opts.some((o) => o.value.toUpperCase() === String(y).toUpperCase())
        );
        if ((!opts.length || missingSelectedYear) && vMakes.length && vModels.length) {
          try {
            const fallbackRes = await catalogueApi.getYears({
              customerCode: CUSTOMER_CODE,
              make: vMakes,
              model: vModels,
            });
            const fallbackOpts = toOptions(fallbackRes);
            const combined = [...opts];
            fallbackOpts.forEach((fo) => {
              if (!combined.some((c) => c.value.toUpperCase() === fo.value.toUpperCase())) {
                combined.push(fo);
              }
            });
            opts = combined;
          } catch (e) {
            console.warn("Fallback getYears error:", e);
          }
        }
        vYears.forEach((y) => {
          if (y && !opts.some((o) => o.value.toUpperCase() === String(y).toUpperCase())) {
            opts.push({ value: String(y), label: String(y) });
          }
        });
        setYearOptions(opts);
      })
      .catch(() => {
        const opts = vYears.map((y) => ({ value: String(y), label: String(y) }));
        setYearOptions(opts);
      });
  }, [vMakes, vModels, generation, vVariants, vFuels, mode]);

  // 7. Fetch Subcategories when Categories change
  useEffect(() => {
    if (!selectedCats.length) {
      setSubcategoryOptions([]);
      return;
    }
    catalogueApi
      .getSubcategories({
        customerCode: CUSTOMER_CODE,
        make: currentMakes,
        model: currentModels,
        aggregate: selectedCats,
      })
      .then((res) => setSubcategoryOptions(toOptions(res)))
      .catch(() => setSubcategoryOptions([]));
  }, [currentMakes, currentModels, selectedCats]);

  // 8. Fetch Parts List (getPartsList or generalSearch) with Limit and Offset Pagination
  useEffect(() => {
    const cleanQuery = partQuery.trim();
    if (phase !== "explore" && !cleanQuery) return;

    setIsLoadingParts(true);
    if (cleanQuery && phase !== "explore") {
      setPhase("explore");
    }

    const offset = (page - 1) * pageSize;
    const basePayload = {
      customerCode: CUSTOMER_CODE,
      make: currentMakes,
      model: currentModels,
      vehicleGeneration: generation || null,
      variant: vVariants,
      fuelType: vFuels,
      year: vYears,
      aggregate: selectedCats,
      subAggregate: selectedSubs,
      brand: selectedBrands,
      partNumber: cleanQuery || null,
      limit: pageSize,
      offset: offset,
    };

    const requestPromise = cleanQuery
      ? catalogueApi.generalSearch({
          customerCode: CUSTOMER_CODE,
          searchKey: cleanQuery,
        })
      : catalogueApi.getPartsList(basePayload);

    requestPromise
      .then((res) => {
        const raw = extractData(res);
        if (
          !cleanQuery &&
          (!raw || raw.length === 0 || res?.success === false) &&
          (vVariants.length || vYears.length)
        ) {
          // Fallback: search by Make + Model + Categories without strict variant string if upstream API returns 0 or error
          return catalogueApi.getPartsList({
            ...basePayload,
            variant: null,
            fuelType: null,
            year: null,
          });
        }
        return res;
      })
      .then((res) => {
        const raw = extractData(res);
        const countVal = res?.count ?? res?.totalCount ?? res?.total ?? raw.length;
        setTotalPartsCount(countVal);
        setPartsList(raw.map((item, idx) => normalizePartItem(item, idx)).filter(Boolean));
      })
      .catch(() => {
        setPartsList([]);
        setTotalPartsCount(0);
      })
      .finally(() => setIsLoadingParts(false));
  }, [
    phase,
    mode,
    currentMakes,
    currentModels,
    generation,
    vVariants,
    vFuels,
    vYears,
    selectedCats,
    selectedSubs,
    selectedBrands,
    partQuery,
    page,
    pageSize,
  ]);

  function handleStockMakesChange(next) {
    setStockMakes(next);
    setStockModels([]);
  }

  function handleVMakesChange(next) {
    setVMakes(next);
    setVModels([]);
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

  const canExplore = Boolean(
    selectedCats.length || currentMakes.length || currentModels.length || partQuery.trim(),
  );

  function explore() {
    if (!canExplore) {
      showToast.warning("Complete selections before exploring.");
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
    setSearchInput("");
    setSort("default");
    setPhase("select");
  }

  function lookupVehicle() {
    const cleanRegNo = regNo.trim().toUpperCase();
    if (!cleanRegNo) {
      showToast.warning("Please enter a vehicle registration number.");
      return;
    }

    catalogueApi
      .getVahanDetails(cleanRegNo)
      .then((res) => {
        let extracted = extractVehicleData(res);
        if (extracted && (extracted.make || extracted.model)) {
          return extracted;
        }
        return catalogueApi.lookupVehicle(cleanRegNo).then((res2) => extractVehicleData(res2));
      })
      .catch((err) => {
        console.warn("getVahanDetails API failed/unauthorized, falling back to lookupVehicle:", err);
        return catalogueApi.lookupVehicle(cleanRegNo).then((res2) => extractVehicleData(res2));
      })
      .then((data) => {
        if (data && (data.make || data.model)) {
          setSkipGeneration(true);
          if (data.make) setVMakes([data.make]);
          if (data.model) setVModels([data.model]);
          if (data.variant) setVVariants([data.variant]);
          if (data.fuelType) setVFuels([data.fuelType]);
          if (data.year) setVYears([data.year]);

          showToast.success(`Vehicle ${cleanRegNo} details loaded successfully!`);
        } else {
          showToast.info(`No exact catalog mapping found for ${cleanRegNo}. Please select manually.`);
        }
      })
      .catch((error) => {
        console.error("Vahan lookup error:", error);
        showToast.error("Failed to fetch vehicle details. Please select manually.");
      });
  }

  const filteredParts = useMemo(() => {
    const list = partsList.filter((p) => {
      if (!p) return false;
      const agg = (p.aggregate || p.category || "").trim();
      const sub = (p.subAggregate || p.subcategory || "").trim();
      const brand = (p.brandName || p.brand || "").trim();

      if (selectedBrands.length && !selectedBrands.includes(brand)) return false;

      if (!partQuery) {
        if (selectedCats.length) {
          const matchCat = selectedCats.some(
            (c) => c === agg || String(c).replace(/_/g, " ").toUpperCase() === agg.replace(/_/g, " ").toUpperCase()
          );
          if (!matchCat) return false;
        }
        if (selectedSubs.length) {
          const matchSub = selectedSubs.some(
            (s) => s === sub || String(s).replace(/_/g, " ").toUpperCase() === sub.replace(/_/g, " ").toUpperCase()
          );
          if (!matchSub) return false;
        }
      }
      return true;
    });

    if (sort === "price-asc") {
      return [...list].sort((a, b) => (a.saleRate || a.mrp || 0) - (b.saleRate || b.mrp || 0));
    }
    if (sort === "price-desc") {
      return [...list].sort((a, b) => (b.saleRate || b.mrp || 0) - (a.saleRate || a.mrp || 0));
    }
    if (sort === "disc-desc") {
      return [...list].sort((a, b) => (b.discPct || 0) - (a.discPct || 0));
    }
    return list;
  }, [partsList, selectedCats, selectedSubs, selectedBrands, partQuery, sort]);

  // Aggregate → sub-aggregate two-level grouping for the results panel.
  const grouped = useMemo(() => {
    const byAgg = new Map();
    for (const p of filteredParts) {
      const aggKey = p.aggregate || "PARTS";
      const subKey = p.subAggregate || "GENERAL";
      if (!byAgg.has(aggKey))
        byAgg.set(aggKey, { agg: aggKey, subs: new Map() });
      const grp = byAgg.get(aggKey);
      if (!grp.subs.has(subKey)) grp.subs.set(subKey, []);
      grp.subs.get(subKey).push(p);
    }
    return Array.from(byAgg.values()).map((g) => ({
      agg: g.agg,
      aggLabel:
        categoryOptions.find((c) => c.value === g.agg || c.value?.replace(/_/g, " ") === g.agg?.replace(/_/g, " "))?.label ?? g.agg,
      count: Array.from(g.subs.values()).reduce((s, arr) => s + arr.length, 0),
      subs: Array.from(g.subs.entries()).map(([subKey, parts]) => ({
        sub: subKey,
        subLabel:
          subcategoryOptions.find((s) => s.value === subKey || s.value?.replace(/_/g, " ") === subKey?.replace(/_/g, " "))?.label ?? subKey,
        parts,
      })),
    }));
  }, [filteredParts, categoryOptions, subcategoryOptions]);

  const totalParts = filteredParts.length;

  function toggleGroup(key) {
    setCollapsedGroups((cur) => {
      const next = new Set(cur);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

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

  async function addToCart(part) {
    const partNo = part.partNumber || part.code;
    const newItem = normalizeCartItem({
      partNumber: partNo,
      part_number: partNo,
      itemDescription: part.itemDescription || part.name,
      brandName: part.brandName || part.brand,
      mrp: part.mrp || 0,
      saleRate: part.saleRate || part.list_price || part.mrp || 0,
      listPrice: part.saleRate || part.list_price || part.mrp || 0,
      taxpercent: part.taxpercent || part.tax || 0,
      quantity: 1,
    });

    // 1. Optimistic UI update
    setCart((cur) => {
      const existingIndex = cur.findIndex(
        (c) =>
          String(c.cartId).toUpperCase() === String(partNo).toUpperCase() ||
          String(c.code).toUpperCase() === String(partNo).toUpperCase(),
      );
      if (existingIndex >= 0) {
        const copy = [...cur];
        copy[existingIndex] = {
          ...copy[existingIndex],
          qty: copy[existingIndex].qty + 1,
        };
        return copy;
      }
      return [...cur, newItem];
    });

    showToast.success(`${part.itemDescription || partNo} added to cart`);

    // 2. Async backend API call & sync
    try {
      await catalogueApi.addToCart({
        part_number: partNo,
        description: part.itemDescription || part.name,
        mrp: part.mrp || 0,
        list_price: part.saleRate || part.list_price || part.mrp || 0,
        tax: part.taxpercent || part.tax || 0,
        qty: 1,
        brand_name: part.brandName || part.brand || "",
      });
      fetchCart();
    } catch (err) {
      console.warn("Backend addToCart error:", err);
    }
  }

  async function updateCartQty(cartId, actionOrQty, newQtyVal) {
    const item = cart.find(
      (c) =>
        String(c.cartId).toUpperCase() === String(cartId).toUpperCase() ||
        String(c.code).toUpperCase() === String(cartId).toUpperCase(),
    );
    const partNumber = item?.part_number || item?.code || cartId;

    let action = "increase";
    if (typeof actionOrQty === "string") {
      action = actionOrQty;
    } else if (item) {
      action = actionOrQty > item.qty ? "increase" : "decrease";
    }

    const targetQty =
      typeof actionOrQty === "number"
        ? actionOrQty
        : action === "increase"
          ? (item?.qty || 0) + 1
          : Math.max(0, (item?.qty || 1) - 1);

    // Optimistic UI update
    setCart((cur) => {
      if (targetQty <= 0) {
        return cur.filter(
          (c) =>
            String(c.cartId).toUpperCase() !== String(cartId).toUpperCase() &&
            String(c.code).toUpperCase() !== String(cartId).toUpperCase(),
        );
      }
      return cur.map((c) =>
        String(c.cartId).toUpperCase() === String(cartId).toUpperCase() ||
        String(c.code).toUpperCase() === String(cartId).toUpperCase()
          ? { ...c, qty: targetQty }
          : c,
      );
    });

    try {
      await catalogueApi.updateCartQty(partNumber, action);
      fetchCart();
    } catch (err) {
      console.warn("Backend updateCartQty error:", err);
    }
  }

  async function removeFromCart(cartId) {
    const item = cart.find(
      (c) =>
        String(c.cartId).toUpperCase() === String(cartId).toUpperCase() ||
        String(c.code).toUpperCase() === String(cartId).toUpperCase(),
    );
    const partNumber = item?.part_number || item?.code || cartId;

    // Optimistic UI update
    setCart((cur) =>
      cur.filter(
        (c) =>
          String(c.cartId).toUpperCase() !== String(cartId).toUpperCase() &&
          String(c.code).toUpperCase() !== String(cartId).toUpperCase(),
      ),
    );

    try {
      await catalogueApi.removeCartItem(partNumber);
      showToast.success("Item removed from cart");
      fetchCart();
    } catch (err) {
      console.warn("Backend removeCartItem error:", err);
    }
  }

  async function checkout() {
    if (!cart.length) return;
    try {
      const res = await catalogueApi.placeOrder();
      showToast.success("Order placed successfully!");
      setCart([]);
      setTab("orders");
      catalogueApi
        .getOrders()
        .then((res) => setOrders(extractData(res)))
        .catch(() => {});
    } catch (err) {
      console.warn("Backend placeOrder error, fallback local update:", err);
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
                makeOptions={makeOptions}
                modelOptions={modelOptions}
                generationOptions={generationOptions}
                variantOptions={variantOptions}
                fuelOptions={fuelOptions}
                yearOptions={yearOptions}
                categoryOptions={categoryOptions}
                subcategoryOptions={subcategoryOptions}
                selectedCats={selectedCats}
                toggleCategoryChip={toggleCategoryChip}
                setSelectedCats={setSelectedCats}
                selectedSubs={selectedSubs}
                toggleSubChip={toggleSubChip}
                setSelectedSubs={setSelectedSubs}
                partQuery={partQuery}
                setPartQuery={setPartQuery}
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                onSearchSubmit={handleSearchSubmit}
                selectedBrands={selectedBrands}
                setSelectedBrands={setSelectedBrands}
                brandOptions={brandOptions}
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
                categoryOptions={categoryOptions}
                activeSubcategoryOptions={subcategoryOptions}
                onClearEdit={clearAll}
                onEditSelection={() => setPhase("select")}
                sort={sort}
                setSort={setSort}
                partQuery={partQuery}
                setPartQuery={setPartQuery}
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                onSearchSubmit={handleSearchSubmit}
                selectedBrands={selectedBrands}
                setSelectedBrands={setSelectedBrands}
                brandOptions={brandOptions}
                totalParts={totalPartsCount}
                grouped={grouped}
                collapsedGroups={collapsedGroups}
                toggleGroup={toggleGroup}
                cart={cart}
                onAdd={addToCart}
                onQty={updateCartQty}
                isLoadingParts={isLoadingParts}
                page={page}
                pageSize={pageSize}
                totalPartsCount={totalPartsCount}
                onPageChange={setPage}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(1);
                }}
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
  makeOptions,
  modelOptions,
  generationOptions,
  variantOptions,
  fuelOptions,
  yearOptions,
  categoryOptions,
  subcategoryOptions,
  selectedCats,
  toggleCategoryChip,
  setSelectedCats,
  selectedSubs,
  toggleSubChip,
  setSelectedSubs,
  partQuery,
  setPartQuery,
  searchInput,
  setSearchInput,
  onSearchSubmit,
  selectedBrands,
  setSelectedBrands,
  brandOptions = [],
  onExplore,
  canExplore,
}) {
  const showModelSlot = mode === "stock" || vMakes.length > 0;

  const chainUnlocked =
    mode === "vehicle" && vModels.length > 0 && (skipGeneration || generation);

  return (
    <div className="space-y-6 p-5">
      {mode === "vehicle" && (
        <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-ink-50 rounded-xl border border-ink-200 mb-6">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={regNo}
              onChange={(e) => setRegNo(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && onLookup()}
              placeholder="ENTER REGISTRATION NO "
              className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm font-semibold uppercase placeholder:normal-case placeholder:font-normal placeholder:text-ink-400 focus:border-accent-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={onLookup}
            className="w-full sm:w-auto px-5 py-2 text-xs font-semibold uppercase tracking-wider text-white bg-accent-500 rounded-lg hover:bg-accent-600 transition-colors cursor-pointer"
          >
            Search Vehicle
          </button>
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
              options={makeOptions}
              value={mode === "stock" ? stockMakes : vMakes}
              onChange={mode === "stock" ? onStockMakesChange : onVMakesChange}
              placeholder="Select Make"
            />
          </FilterField>
          {showModelSlot && (
            <FilterField label="Model">
              <MultiSelect
                options={modelOptions}
                value={mode === "stock" ? stockModels : vModels}
                onChange={mode === "stock" ? setStockModels : onVModelsChange}
                placeholder="Select Model"
                disabled={mode === "stock" ? !stockMakes.length : !vMakes.length}
              />
            </FilterField>
          )}
        </div>
        {mode === "stock" && (
          <>
            <FilterField label="Brand">
              <MultiSelect
                options={brandOptions}
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
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onSearchSubmit();
                      }
                    }}
                    placeholder="Search parts (e.g., wiper, brake pad)"
                  />
                </div>
                <Search
                  className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 cursor-pointer"
                  onClick={() => onSearchSubmit()}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {mode === "vehicle" && !skipGeneration && vModels.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-500">
            Generation
          </p>
          <div className="flex flex-wrap gap-3">
            {generationOptions.length === 0 ? (
              <div className="py-2 text-xs text-ink-400">Loading generations...</div>
            ) : (
              generationOptions.map((g) => {
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
                      onClick={() => onPreviewGen(g)}
                      className="block w-full cursor-zoom-in"
                    >
                      {g.url ? (
                        <img
                          src={g.url}
                          alt={g.label}
                          className="mx-auto h-16 w-auto object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      ) : null}
                      <p className="mt-2 text-center text-xs font-semibold uppercase text-ink-800">
                        {g.label.split(" (")[0]}
                      </p>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {chainUnlocked && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <FilterField label="Variant">
            <MultiSelect
              options={variantOptions}
              value={vVariants}
              onChange={onVVariantsChange}
              placeholder="Select Variant"
            />
          </FilterField>
          {vVariants.length > 0 && (
            <FilterField label="Fuel Type">
              <MultiSelect
                options={fuelOptions}
                value={vFuels}
                onChange={onVFuelsChange}
                placeholder="Select Fuel Type"
              />
            </FilterField>
          )}
          {vFuels.length > 0 && (
            <FilterField label="Year">
              <MultiSelect
                options={yearOptions}
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
              options={categoryOptions}
              value={selectedCats}
              onChange={(next) => {
                setSelectedCats(next);
                setSelectedSubs([]);
              }}
              placeholder="Select Categories"
              withSelectAll
              selectAllLabel="All"
            />
          </FilterField>
          <FilterField label="Sub Categories">
            <MultiSelect
              options={subcategoryOptions}
              value={selectedSubs}
              onChange={setSelectedSubs}
              placeholder="Select Sub Categories"
              disabled={!selectedCats.length}
              withSelectAll
              selectAllLabel="All"
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
          categoryOptions={categoryOptions}
          selectedCats={selectedCats}
          toggleCategoryChip={toggleCategoryChip}
          setSelectedCats={setSelectedCats}
          selectedSubs={selectedSubs}
          toggleSubChip={toggleSubChip}
          setSelectedSubs={setSelectedSubs}
          activeSubcategoryOptions={subcategoryOptions}
          onExplore={onExplore}
          canExplore={canExplore}
        />
      )}
    </div>
  );
}

function StockCategoryChips({
  categoryOptions = [],
  selectedCats,
  toggleCategoryChip,
  setSelectedCats,
  selectedSubs,
  toggleSubChip,
  setSelectedSubs,
  activeSubcategoryOptions = [],
  onExplore,
  canExplore,
}) {
  const catsList = categoryOptions;
  const subsList = activeSubcategoryOptions || [];
  const allCatsSelected = selectedCats.length === catsList.length;
  const allSubsSelected =
    subsList.length > 0 && selectedSubs.length === subsList.length;

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
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {catsList.map((c) => {
            const active = selectedCats.includes(c.value);
            const Icon = Icons[CAT_ICONS[c.value]] ?? Icons.Settings;
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
        </div>
        {subsList.length === 0 ? (
          <div className="rounded-lg border border-dashed border-ink-200 px-3 py-6 text-center text-xs text-ink-500">
            Select a category to see its sub-categories.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {subsList.map((s) => {
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
                    <Icons.Settings
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
  categoryOptions = [],
  activeSubcategoryOptions = [],
  onClearEdit,
  onEditSelection,
  sort,
  setSort,
  partQuery,
  setPartQuery,
  searchInput,
  setSearchInput,
  onSearchSubmit,
  selectedBrands,
  setSelectedBrands,
  brandOptions = [],
  totalParts,
  grouped,
  collapsedGroups,
  toggleGroup,
  cart,
  onAdd,
  onQty,
  isLoadingParts,
  page = 1,
  pageSize = 20,
  totalPartsCount = 0,
  onPageChange,
  onPageSizeChange,
}) {
  const catLabels = selectedCats
    .map((v) => (categoryOptions || []).find((c) => c.value === v)?.label || v)
    .filter(Boolean);
  const selectedSubLabels = selectedSubs
    .map(
      (value) => (activeSubcategoryOptions || []).find((s) => s.value === value)?.label || value,
    )
    .filter(Boolean);

  return (
    <div className="p-5">
      {/* Breadcrumb chips */}
      <div className="mb-3 flex flex-wrap gap-2">
        {makes.length > 0 && <BreadChip>{makes.join(", ")}</BreadChip>}
        {models.length > 0 && (
          <BreadChip>{models.map((m) => String(m).toUpperCase()).join(", ")}</BreadChip>
        )}
        {mode === "vehicle" && !skipGeneration && generation && (
          <BreadChip>
            {String(generation).split(" (")[0]}
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
            options={brandOptions}
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
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onSearchSubmit();
            }
          }}
          placeholder="Search Part"
        />
        {/* </FilterField> */}

        <div className="flex h-11 items-center">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-sm font-semibold text-ink-700">
            <Icons.PackageOpen className="h-4 w-4 text-accent-500" />
            <span className="font-bold">{totalParts}</span> Parts
          </span>
        </div>
      </div>

      {isLoadingParts ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-500 border-t-transparent" />
          <p className="text-sm font-medium text-ink-600">Loading parts list...</p>
        </div>
      ) : grouped.length === 0 ? (
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
                                      (c) => String(c.cartId).toUpperCase() === String(p.partNumber).toUpperCase() || String(c.code).toUpperCase() === String(p.partNumber).toUpperCase() || String(c.part_number).toUpperCase() === String(p.partNumber).toUpperCase(),
                                    );
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
                                          ₹{p.mrpIncl.toLocaleString("en-IN")}
                                        </td>
                                        <td className="px-4 py-3 text-center text-ink-600">
                                          {p.discPct > 0 ? `${p.discPct}%` : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-center font-semibold text-ink-800">
                                          ₹{p.priceIncl.toLocaleString("en-IN")}
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

      {totalPartsCount > 0 && (
        <div className="mt-4 border-t border-ink-100 pt-3">
          <Pagination
            page={page}
            totalPages={Math.ceil(totalPartsCount / pageSize) || 1}
            totalItems={totalPartsCount}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        </div>
      )}
    </div>
  );
}

/* ─── small building blocks ─── */

function FilterField({ label, children }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</p>
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
