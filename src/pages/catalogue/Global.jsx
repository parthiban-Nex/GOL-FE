import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  Search,
  Pencil,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  Car,
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
import { storage } from "@/utils/storage";
import { appConfig } from "@/config/appConfig";
import Pagination from "@/components/ui/Pagination";

const CUSTOMER_CODE = "0046";

/* ─── tiny shared helpers ─── */

const up = (v) => String(v ?? "").toUpperCase();
const sameCI = (a, b) => up(a) === up(b);
const underscoreToSpace = (v) => String(v ?? "").replace(/_/g, " ");
const normKey = (v) => up(underscoreToSpace(v));
const matchesCartId = (c, id) => sameCI(c.cartId, id) || sameCI(c.code, id);
const toggleInArray = (arr, value) => {
  const norm = normKey(value);
  const exists = arr.some((v) => normKey(v) === norm);
  return exists
    ? arr.filter((v) => normKey(v) !== norm)
    : [...arr, value];
};

const SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "mrp-asc", label: "MRP: Low to High" },
  { value: "mrp-desc", label: "MRP: High to Low" },
  { value: "disc-desc", label: "Discount: High to Low" },
  { value: "part-asc", label: "Part Number: A to Z" },
  { value: "part-desc", label: "Part Number: Z to A" },
];

function mapSortParam(sortValue) {
  switch (sortValue) {
    case "price-asc":
      return { fieldOrder: "saleRate", sortOrder: "ASC" };
    case "price-desc":
      return { fieldOrder: "saleRate", sortOrder: "DESC" };
    case "mrp-asc":
      return { fieldOrder: "mrp", sortOrder: "ASC" };
    case "mrp-desc":
      return { fieldOrder: "mrp", sortOrder: "DESC" };
    case "disc-desc":
      return { fieldOrder: "discountPercent", sortOrder: "DESC" };
    case "part-desc":
      return { fieldOrder: "partNumber", sortOrder: "DESC" };
    case "part-asc":
    case "default":
    default:
      return { fieldOrder: "partNumber", sortOrder: "ASC" };
  }
}

const price = (p) => p.saleRate || p.mrp || 0;
const mrp = (p) => p.mrp || 0;
const SORTERS = {
  "price-asc": (a, b) => price(a) - price(b),
  "price-desc": (a, b) => price(b) - price(a),
  "mrp-asc": (a, b) => mrp(a) - mrp(b),
  "mrp-desc": (a, b) => mrp(b) - mrp(a),
  "disc-desc": (a, b) => (b.discPct || 0) - (a.discPct || 0),
  "part-asc": (a, b) => String(a.partNumber || "").localeCompare(String(b.partNumber || "")),
  "part-desc": (a, b) => String(b.partNumber || "").localeCompare(String(a.partNumber || "")),
};

/* ─── response normalisers ─── */

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
  if (typeof res === "object") {
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

const trimStr = (v) => (v ? String(v).trim() : "");

function extractVehicleData(res) {
  if (!res) return null;
  const root = res.data ?? res.result ?? res;
  const target = Array.isArray(root) ? root[0] || {} : root;

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

  const year =
    user.userYear ||
    mytvs.mytvsYear ||
    target.year ||
    vahan.yearRegistration ||
    vahan.yearManufacturing ||
    vahan.year ||
    (vahan.registrationDate ? new Date(vahan.registrationDate).getFullYear() : "") ||
    (vahan.registration_date ? new Date(vahan.registration_date).getFullYear() : "");

  return {
    make: trimStr(make),
    model: trimStr(model),
    variant: trimStr(variant),
    fuelType: trimStr(fuelType),
    year: trimStr(year),
  };
}

function toOptions(data, valKey = "masterName", labelKey = "masterName") {
  return extractData(data)
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
        item[valKey] ??
        item.subAggregate ??
        item.aggregate ??
        item.category ??
        item.variant ??
        item.fuelType ??
        item.year ??
        item.id ??
        item.name ??
        item.label ??
        "";
      const lbl =
        item.label ??
        item.masterName ??
        item.masterValue ??
        item[labelKey] ??
        item.subAggregate ??
        item.aggregate ??
        item.category ??
        item.name ??
        item.variant ??
        item.fuelType ??
        item.year ??
        item.value ??
        String(val);
      return { value: String(val), label: String(lbl), raw: item };
    })
    .filter((o) => o.value !== "");
}

/** Append `extra` options that are not already present (case-insensitive & underscore-insensitive). */
function mergeOptions(base, extra) {
  const seen = new Set((base || []).map((o) => normKey(o.value)));
  const out = [...(base || [])];
  for (const o of extra || []) {
    const k = normKey(o.value);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(o);
    }
  }
  return out;
}

/** Make sure every currently-selected value exists as an option. */
function withSelected(opts, selected) {
  return mergeOptions(
    opts,
    selected.filter(Boolean).map((s) => ({ value: String(s), label: String(s) })),
  );
}

const isMissingSelected = (opts, selected) =>
  selected.some((s) => !opts.some((o) => sameCI(o.value, s)));

/**
 * Build the option list for fuels/years: primary response, a looser fallback
 * request when it is empty / missing a selected value, then the selected values.
 */
async function buildOptionsWithFallback({ res, selected, canFallback, fetchFallback, label }) {
  let opts = toOptions(res);
  if ((!opts.length || isMissingSelected(opts, selected)) && canFallback) {
    try {
      opts = mergeOptions(opts, toOptions(await fetchFallback()));
    } catch (e) {
      console.warn(`Fallback ${label} error:`, e);
    }
  }
  return withSelected(opts, selected);
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

  return {
    partNumber: pNo,
    itemDescription: desc,
    brandName: brand,
    aggregate: agg,
    subAggregate: sub,
    mrp: mrpVal,
    mrpIncl: Math.round(mrpVal),
    saleRate: saleVal,
    priceIncl: Math.round(saleVal),
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
  const brand = item.brandName || item.product_brand || item.brand;
  const qty = Number(item.quantity ?? item.qty ?? 1);
  const mrp = Number(item.mrp ?? item.part_mrp ?? item.listPrice ?? 0);
  const listPrice = Number(item.listPrice ?? item.list_price ?? item.billingPrice ?? item.saleRate ?? mrp);
  const billingPrice = Number(item.billingPrice ?? listPrice);
  const tax = Number(item.taxAmount ?? item.tax ?? 0);
  const discountPerUnit = Number(item.discountPerUnit ?? Math.max(0, mrp - listPrice));
  const totalAmount = Number(item.totalAmount ?? item.total ?? qty * (billingPrice + tax));

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
  const [collapsedGroups, setCollapsedGroups] = useState(() => new Set());

  // Dynamic API options states
  const [makeOptions, setMakeOptions] = useState([]);
  const [modelOptions, setModelOptions] = useState([]);
  const [generationOptions, setGenerationOptions] = useState([]);
  const [isLoadingGenerations, setIsLoadingGenerations] = useState(false);
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

  // Always-fresh view of the cart for stable callbacks.
  const cartRef = useRef(cart);
  cartRef.current = cart;

  const currentMakes = mode === "stock" ? stockMakes : vMakes;
  const currentModels = mode === "stock" ? stockModels : vModels;

  const executeGeneralSearch = useCallback(
    async (query, pageNum = 1, currentLimit = pageSize) => {
      const cleanQuery = String(query || "").trim();
      if (!cleanQuery) return;

      setIsLoadingParts(true);
      setPartQuery(cleanQuery);
      setSearchInput(cleanQuery);
      setPhase("explore");
      setPage(pageNum);

      try {
        const payload = {
          customerCode: CUSTOMER_CODE,
          searchKey: cleanQuery,
          limit: currentLimit,
          offset: (pageNum - 1) * currentLimit,
          customerCodes: [CUSTOMER_CODE],
        };

        const res = await catalogueApi.generalSearch(payload);
        const raw = extractData(res);
        const explicitTotal =
          res?.count ??
          res?.totalCount ??
          res?.total ??
          res?.data?.count ??
          res?.data?.totalCount;

        let total = 0;
        if (explicitTotal !== undefined && explicitTotal !== null) {
          total = Number(explicitTotal);
        } else if (pageNum === 1) {
          total = Array.isArray(raw) ? raw.length : 0;
        } else {
          total = Math.max(0, (pageNum - 1) * currentLimit + (Array.isArray(raw) ? raw.length : 0));
        }

        setTotalPartsCount(total);
        const list = Array.isArray(raw) ? raw.map(normalizePartItem).filter(Boolean) : [];
        setPartsList(list);
      } catch (err) {
        console.warn("Failed to perform generalSearch:", err);
        setPartsList([]);
        setTotalPartsCount(0);
      } finally {
        setIsLoadingParts(false);
      }
    },
    [pageSize],
  );

  function handleSearchSubmit(queryToSubmit) {
    const q = queryToSubmit !== undefined ? queryToSubmit : searchInput;
    const clean = String(q || "").trim();

    if (!clean) {
      setPartQuery("");
      setSearchInput("");
      setPartsList([]);
      setTotalPartsCount(0);
      setPage(1);
      return;
    }

    if (clean.length < 2) {
      showToast.warning("Please enter at least 2 characters to search.");
      return;
    }

    executeGeneralSearch(clean, 1, pageSize);
  }

  const fetchCart = useCallback(() => {
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
  }, []);


  const fetchOrders = useCallback(async () => {
    try {
      // In Live DearO, no query params are sent — backend extracts workshop from auth token
      const res = await catalogueApi.getDirectEnquiryOrderList();

      const list = res?.data || res?.orders || extractData(res);

      if (Array.isArray(list)) {
        setOrders(list);
      }
    } catch (err) {
      console.warn("Failed to load direct enquiry orders:", err.message);
    }
  }, []);

  // Fetch orders whenever user switches to the orders tab
  useEffect(() => {
    if (tab === "orders") {
      fetchOrders();
    }
  }, [tab, fetchOrders]);

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

  // 1. Fetch Makes, Brands, Cart & Orders on mount (customerCode 0046) - run only once
  useEffect(() => {
    catalogueApi
      .getMakes({ customerCode: CUSTOMER_CODE })
      .then((res) => setMakeOptions(toOptions(res)))
      .catch(() => setMakeOptions([]));

    catalogueApi
      .getBrands({ customerCode: CUSTOMER_CODE })
      .then((res) => setBrandOptions(toOptions(res)))
      .catch(() => setBrandOptions([]));

    fetchCart();
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 1b. Fetch Categories when Selected Brands, Makes, or Models change
  useEffect(() => {
    catalogueApi
      .getCategories({
        customerCode: CUSTOMER_CODE,
        brand: selectedBrands,
        make: currentMakes,
        model: currentModels,
        primary: false,
      })
      .then((res) => setCategoryOptions(toOptions(res)))
      .catch(() => setCategoryOptions([]));
  }, [selectedBrands, currentMakes, currentModels]);

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

  // 3. Fetch Generations when Models change (Vehicle & Stock mode)
  useEffect(() => {
    if (!currentModels.length) {
      setGenerationOptions([]);
      setIsLoadingGenerations(false);
      return;
    }
    setIsLoadingGenerations(true);
    const fetchGen = async () => {
      try {
        let res = await catalogueApi.getGenerations({ customerCode: CUSTOMER_CODE, make: currentMakes, model: currentModels });
        let opts = toGenerations(res);
        if (!opts.length) {
          res = await catalogueApi.getGenerations({ customerCode: CUSTOMER_CODE, make: currentMakes, model: currentModels });
          opts = toGenerations(res);
        }
        setGenerationOptions(opts);
        if (opts.length === 0) {
          setSkipGeneration(true);
        }
      } catch (err) {
        console.warn("Failed to fetch generations:", err);
        setGenerationOptions([]);
        setSkipGeneration(true);
      } finally {
        setIsLoadingGenerations(false);
      }
    };
    fetchGen();
  }, [currentMakes, currentModels]);

  // 4. Fetch Variants when Generation changes (or skipped)
  // NOTE: vVariants is intentionally not a dependency (it is only used to keep
  // already-selected values visible in the list).
  useEffect(() => {
    if (!currentModels.length || (!generation && !skipGeneration)) {
      setVariantOptions([]);
      return;
    }
    const fetchVariants = async () => {
      try {
        let res = await catalogueApi.getVariants({
          customerCode: CUSTOMER_CODE,
          make: currentMakes,
          model: currentModels,
          vehicleGeneration: generation || null,
        });
        let opts = toOptions(res, "variant", "variant");
        if (!opts.length && generation) {
          res = await catalogueApi.getVariants({
            make: currentMakes,
            model: currentModels,
          });
          opts = toOptions(res, "variant", "variant");
        }
        if (!opts.length) {
          res = await catalogueApi.getVariants({
            customerCode: CUSTOMER_CODE,
            make: currentMakes,
            model: currentModels,
            vehicleGeneration: generation || null,
          });
          opts = toOptions(res, "variant", "variant");
        }
        setVariantOptions(withSelected(opts, vVariants));
      } catch (err) {
        console.warn("Failed to fetch variants:", err);
        setVariantOptions(withSelected([], vVariants));
      }
    };
    fetchVariants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMakes, currentModels, generation, skipGeneration]);

  // 5. Fetch Fuels when Variants change
  useEffect(() => {
    if (!currentModels.length || !vVariants.length) {
      setFuelOptions([]);
      return;
    }
    const applyFuels = (opts) => {
      setFuelOptions(opts);
      if (opts.length === 1) setVFuels([opts[0].value]);
    };
    catalogueApi
      .getFuels({
        customerCode: CUSTOMER_CODE,
        make: currentMakes,
        model: currentModels,
        vehicleGeneration: generation || null,
        variant: vVariants,
      })
      .then(async (res) =>
        applyFuels(
          await buildOptionsWithFallback({
            res,
            selected: vFuels,
            canFallback: currentMakes.length && currentModels.length,
            fetchFallback: () =>
              catalogueApi.getFuels({
                customerCode: CUSTOMER_CODE,
                make: currentMakes,
                model: currentModels,
              }),
            label: "getFuels",
          }),
        ),
      )
      .catch(() => applyFuels(withSelected([], vFuels)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMakes, currentModels, generation, vVariants]);

  // 6. Fetch Years when Fuels change
  useEffect(() => {
    if (!currentModels.length || !vFuels.length) {
      setYearOptions([]);
      return;
    }
    catalogueApi
      .getYears({
        customerCode: CUSTOMER_CODE,
        make: currentMakes,
        model: currentModels,
        vehicleGeneration: generation || null,
        variant: vVariants,
        fuelType: vFuels,
      })
      .then(async (res) =>
        setYearOptions(
          await buildOptionsWithFallback({
            res,
            selected: vYears,
            canFallback: currentMakes.length && currentModels.length,
            fetchFallback: () =>
              catalogueApi.getYears({
                customerCode: CUSTOMER_CODE,
                make: currentMakes,
                model: currentModels,
              }),
            label: "getYears",
          }),
        ),
      )
      .catch(() => setYearOptions(withSelected([], vYears)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMakes, currentModels, generation, vVariants, vFuels]);

  // 7. Fetch Subcategories when Categories or Brands change
  useEffect(() => {
    if (!selectedCats.length) {
      setSubcategoryOptions([]);
      setSelectedSubs([]);
      return;
    }
    catalogueApi
      .getSubcategories({
        customerCode: CUSTOMER_CODE,
        make: currentMakes,
        model: currentModels,
        aggregate: selectedCats,
        brand: selectedBrands,
        primary: false,
      })
      .then((res) => {
        const options = toOptions(res, "subAggregate", "subAggregate");
        // Merge with existing options so expanding categories never drops previously loaded subcategories
        setSubcategoryOptions((prev) => mergeOptions(options, prev));
      })
      .catch(() => {
        // Keep existing options if an API error occurs
      });
  }, [currentMakes, currentModels, selectedCats, selectedBrands]);


  function handleStockMakesChange(next) {
    setStockMakes(next);
    setStockModels([]);
    setGeneration("");
    setVVariants([]);
    setVFuels([]);
    setVYears([]);
    setSkipGeneration(false);
  }

  function handleStockModelsChange(next) {
    setStockModels(next);
    setGeneration("");
    setVVariants([]);
    setVFuels([]);
    setVYears([]);
    setSkipGeneration(false);
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
    setSelectedCats((cur) => toggleInArray(cur, value));
  }
  function toggleSubChip(value) {
    setSelectedSubs((cur) => toggleInArray(cur, value));
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

    const fallbackLookup = () =>
      catalogueApi.lookupVehicle(cleanRegNo).then(extractVehicleData);

    catalogueApi
      .getVahanDetails(cleanRegNo)
      .then((res) => {
        const extracted = extractVehicleData(res);
        return extracted && (extracted.make || extracted.model)
          ? extracted
          : fallbackLookup();
      })
      .catch((err) => {
        console.warn("getVahanDetails API failed/unauthorized, falling back to lookupVehicle:", err);
        return fallbackLookup();
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
    const brandKeys = selectedBrands.length
      ? new Set(selectedBrands.map((b) => up(String(b).trim())))
      : null;

    const list = partsList.filter((p) => {
      if (!p) return false;
      if (brandKeys && !brandKeys.has(up((p.brandName || p.brand || "").trim()))) return false;
      return true;
    });

    const sorter = SORTERS[sort];
    return sorter ? [...list].sort(sorter) : list;
  }, [partsList, selectedBrands, sort]);

  // Aggregate → sub-aggregate two-level grouping for the results panel.
  const grouped = useMemo(() => {
    // Label lookups (first match wins, matching on value or underscore-less value).
    const buildLabelMap = (options) => {
      const m = new Map();
      for (const o of options) {
        const k = underscoreToSpace(o.value);
        if (!m.has(k)) m.set(k, o.label);
      }
      return m;
    };
    const catLabels = buildLabelMap(categoryOptions);
    const subLabels = buildLabelMap(subcategoryOptions);

    const byAgg = new Map();
    for (const p of filteredParts) {
      const aggKey = p.aggregate || "PARTS";
      const subKey = p.subAggregate || "GENERAL";
      let grp = byAgg.get(aggKey);
      if (!grp) {
        grp = { agg: aggKey, subs: new Map(), count: 0 };
        byAgg.set(aggKey, grp);
      }
      let arr = grp.subs.get(subKey);
      if (!arr) {
        arr = [];
        grp.subs.set(subKey, arr);
      }
      arr.push(p);
      grp.count += 1;
    }

    return Array.from(byAgg.values(), (g) => ({
      agg: g.agg,
      aggLabel: catLabels.get(underscoreToSpace(g.agg)) ?? g.agg,
      count: g.count,
      subs: Array.from(g.subs, ([subKey, parts]) => ({
        sub: subKey,
        subLabel: subLabels.get(underscoreToSpace(subKey)) ?? subKey,
        parts,
      })),
    }));
  }, [filteredParts, categoryOptions, subcategoryOptions]);

  const availableBrands = useMemo(() => {
    const set = new Set();
    for (const item of partsList) {
      if (!item) continue;
      const b = (item.brandName || item.brand || "").trim();
      if (b) set.add(b);
    }
    for (const sb of selectedBrands) {
      if (sb) set.add(String(sb).trim());
    }
    return Array.from(set)
      .sort()
      .map((b) => ({ value: b, label: b }));
  }, [partsList, selectedBrands]);

  // part number (upper-cased) -> { qty, cartId } for O(1) row lookups.
  const cartLookup = useMemo(() => {
    const m = new Map();
    for (const c of cart) {
      for (const k of [c.cartId, c.code, c.part_number]) {
        const key = up(k);
        if (key && !m.has(key)) m.set(key, { qty: c.qty, cartId: c.cartId });
      }
    }
    return m;
  }, [cart]);

  const toggleGroup = useCallback((key) => {
    setCollapsedGroups((cur) => {
      const next = new Set(cur);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const addToCart = useCallback(
    async (part) => {
      const partNo = part.partNumber || part.code;
      const listPrice = part.saleRate || part.list_price || part.mrp || 0;
      const newItem = normalizeCartItem({
        partNumber: partNo,
        part_number: partNo,
        itemDescription: part.itemDescription || part.name,
        brandName: part.brandName || part.brand,
        mrp: part.mrp || 0,
        saleRate: listPrice,
        listPrice,
        taxpercent: part.taxpercent || part.tax || 0,
        quantity: 1,
      });

      // 1. Optimistic UI update
      setCart((cur) => {
        const idx = cur.findIndex((c) => matchesCartId(c, partNo));
        if (idx >= 0) {
          const copy = [...cur];
          copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
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
          list_price: listPrice,
          tax: part.taxpercent || part.tax || 0,
          qty: 1,
          brand_name: part.brandName || part.brand || "",
        });
        fetchCart();
      } catch (err) {
        console.warn("Backend addToCart error:", err);
      }
    },
    [fetchCart],
  );

  const updateCartQty = useCallback(
    async (cartId, actionOrQty) => {
      const item = cartRef.current.find((c) => matchesCartId(c, cartId));
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
      setCart((cur) =>
        targetQty <= 0
          ? cur.filter((c) => !matchesCartId(c, cartId))
          : cur.map((c) => (matchesCartId(c, cartId) ? { ...c, qty: targetQty } : c)),
      );

      try {
        await catalogueApi.updateCartQty(partNumber, action);
        fetchCart();
      } catch (err) {
        console.warn("Backend updateCartQty error:", err);
      }
    },
    [fetchCart],
  );

  const removeFromCart = useCallback(
    async (cartId) => {
      const item = cartRef.current.find((c) => matchesCartId(c, cartId));
      const partNumber = item?.part_number || item?.code || cartId;

      // Optimistic UI update
      setCart((cur) => cur.filter((c) => !matchesCartId(c, cartId)));

      try {
        await catalogueApi.removeCartItem(partNumber);
        showToast.success("Item removed from cart");
        fetchCart();
      } catch (err) {
        console.warn("Backend removeCartItem error:", err);
      }
    },
    [fetchCart],
  );

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
      loggedInUser?.outlet?.outlet_code ||
      loggedInUser?.outlet?.outletCode ||
      loggedInUser?.outlet?.code ||
      loggedInUser?.outlet_code ||
      loggedInUser?.outletCode ||
      loggedInUser?.workshopId ||
      loggedInUser?.outlet?.workshopId ||
      loggedInUser?.outlet?.id ||
      "";

    const customerCode =
      (loggedInUser?.customer_account_id && loggedInUser.customer_account_id !== "KAHD" ? loggedInUser.customer_account_id : null) ||
      (loggedInUser?.customer_code && loggedInUser.customer_code !== "050" && loggedInUser.customer_code !== "0046" ? loggedInUser.customer_code : null) ||
      "NMSA0786";

    const payload = {
      workshopId: String(workshopId).trim(),
      customer_code: String(customerCode).trim(),
      source: "GOL",
      channel: "B2B-API",
      reference_no: `REF-GOL-${Date.now()}`,
      vehicle_no:
        mode === "vehicle" && vahanData?.registrationNumber
          ? vahanData.registrationNumber
          : "",
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
        response?.data?.success === true ||
        Boolean(response?.enquiry_no || response?.data?.enquiry_no || response?.enquiryNo);

      const enqNo =
        response?.enquiry_no ||
        response?.data?.enquiry_no ||
        response?.enquiryNo ||
        response?.data?.enquiryNo ||
        "Direct Enquiry";

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
        if (pNo) catalogueApi.removeCartItem(pNo).catch(() => { });
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

  const isVehicle = mode === "vehicle";

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
                  !isVehicle ? "text-ink-800" : "text-ink-400",
                )}
              >
                Stock Order
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={isVehicle}
                onClick={() => {
                  setMode(isVehicle ? "stock" : "vehicle");
                  clearAll();
                }}
                className={clsx(
                  "relative h-6 cursor-pointer w-11 rounded-full transition-colors",
                  isVehicle ? "bg-brand-600" : "bg-ink-300",
                )}
              >
                <span
                  className={clsx(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    isVehicle ? "translate-x-0" : "-translate-x-5",
                  )}
                />
              </button>
              <span
                className={clsx(
                  "text-sm font-semibold uppercase tracking-wide",
                  isVehicle ? "text-ink-800" : "text-ink-400",
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
                setSkipGeneration={setSkipGeneration}
                isLoadingGenerations={isLoadingGenerations}
                onPreviewGen={setPreviewGen}
                regNo={regNo}
                setRegNo={setRegNo}
                onLookup={lookupVehicle}
                stockMakes={stockMakes}
                onStockMakesChange={handleStockMakesChange}
                stockModels={stockModels}
                setStockModels={handleStockModelsChange}
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
                makes={currentMakes}
                models={currentModels}
                generation={generation}
                skipGeneration={skipGeneration}
                variants={vVariants}
                fuels={vFuels}
                years={vYears}
                selectedCats={selectedCats}
                selectedSubs={selectedSubs}
                categoryOptions={categoryOptions}
                activeSubcategoryOptions={subcategoryOptions}
                onClearEdit={clearAll}
                onEditSelection={() => setPhase("select")}
                sort={sort}
                setSort={setSort}
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                onSearchSubmit={handleSearchSubmit}
                selectedBrands={selectedBrands}
                setSelectedBrands={setSelectedBrands}
                brandOptions={brandOptions.length ? brandOptions : availableBrands}
                collapsedGroups={collapsedGroups}
                toggleGroup={toggleGroup}
                cartLookup={cartLookup}
                onAdd={addToCart}
                onQty={updateCartQty}
                partQuery={partQuery}
                setPartQuery={setPartQuery}
                partsList={partsList}
                setPartsList={setPartsList}
                filteredParts={filteredParts}
                isLoadingParts={isLoadingParts}
                totalPartsCount={totalPartsCount}
                setTotalPartsCount={setTotalPartsCount}
                page={page}
                onPageChange={(p) => {
                  setPage(p);
                  if (partQuery) executeGeneralSearch(partQuery, p, pageSize);
                }}
                pageSize={pageSize}
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  setPage(1);
                  if (partQuery) executeGeneralSearch(partQuery, 1, sz);
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

const EMPTY_ARRAY = [];

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
  setSkipGeneration,
  isLoadingGenerations,
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
  searchInput,
  setSearchInput,
  onSearchSubmit,
  selectedBrands,
  setSelectedBrands,
  brandOptions = [],
  onExplore,
  canExplore,
}) {
  const isStock = mode === "stock";
  const currentMakesList = isStock ? stockMakes : vMakes;
  const currentModelsList = isStock ? stockModels : vModels;
  const showModelSlot = currentMakesList.length > 0;

  const chainUnlocked =
    currentModelsList.length > 0 && (skipGeneration || generation);

  return (
    <div className="space-y-6 p-5">
      {!isStock && (
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
              value={isStock ? stockMakes : vMakes}
              onChange={isStock ? onStockMakesChange : onVMakesChange}
              placeholder="Select Make"
            />
          </FilterField>
          {showModelSlot && (
            <FilterField label="Model">
              <MultiSelect
                options={modelOptions}
                value={isStock ? stockModels : vModels}
                onChange={isStock ? setStockModels : onVModelsChange}
                placeholder="Select Model"
                disabled={isStock ? !stockMakes.length : !vMakes.length}
              />
            </FilterField>
          )}
        </div>
        {isStock && (
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
              <div className="relative mt-3.5">
                <Input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onSearchSubmit();
                    }
                  }}
                  placeholder="Search parts (Eg.Brake pad, Wiper, etc..)"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => onSearchSubmit()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-ink-400 hover:text-accent-600 transition-colors cursor-pointer"
                  title="Search parts"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {!skipGeneration && currentModelsList.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Generation
            </p>
            <button
              type="button"
              onClick={() => setSkipGeneration(true)}
              className="text-xs font-medium text-brand-600 hover:text-brand-700 underline cursor-pointer"
            >
              Skip Generation
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {isLoadingGenerations ? (
              <div className="flex items-center gap-2 py-3 text-xs text-ink-400">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
                Loading generations...
              </div>
            ) : generationOptions.length === 0 ? (
              <div className="py-2 text-xs text-ink-400">
                No generations available for this model.{" "}
                <button
                  type="button"
                  onClick={() => setSkipGeneration(true)}
                  className="font-medium text-brand-600 hover:text-brand-700 underline cursor-pointer"
                >
                  Proceed to variants
                </button>
              </div>
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
                        <Car className="h-8 w-8" />
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

      {!isStock ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_auto]">
          <FilterField label="Categories">
            <MultiSelect
              options={categoryOptions}
              value={selectedCats}
              onChange={(next) => {
                setSelectedCats(next);
              }}
              placeholder="Select Categories"
              withSelectAll
              selectAllLabel="All"
            />
          </FilterField>
          <FilterField label="Sub Categories">
            <MultiSelect
              options={withSelected(subcategoryOptions, selectedSubs)}
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
          selectedSubs={selectedSubs}
          toggleSubChip={toggleSubChip}
          activeSubcategoryOptions={subcategoryOptions}
          onExplore={onExplore}
          canExplore={canExplore}
        />
      )}
    </div>
  );
}

function SelectedCount({ count }) {
  return (
    <span
      className={clsx(
        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
        count ? "bg-brand-600 text-white" : "bg-brand-100 text-brand-700",
      )}
    >
      {count} selected
    </span>
  );
}

function StockCategoryChips({
  categoryOptions = [],
  selectedCats,
  toggleCategoryChip,
  selectedSubs,
  toggleSubChip,
  activeSubcategoryOptions = [],
  onExplore,
  canExplore,
}) {
  // Always merge with selected subs so selected items never disappear from the list
  const subsList = useMemo(() => {
    return withSelected(activeSubcategoryOptions || [], selectedSubs);
  }, [activeSubcategoryOptions, selectedSubs]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <p className="text-base font-semibold text-ink-800">Categories</p>
          <SelectedCount count={selectedCats.length} />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {categoryOptions.map((c) => {
            const active = selectedCats.some(
              (cat) =>
                normKey(cat) === normKey(c.value) ||
                normKey(cat) === normKey(c.label),
            );
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
          <SelectedCount count={selectedSubs.length} />
        </div>
        {subsList.length === 0 ? (
          <div className="rounded-lg border border-dashed border-ink-200 px-3 py-6 text-center text-xs text-ink-500">
            Select a category to see its sub-categories.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {subsList.map((s) => {
                const active = selectedSubs.some(
                  (sub) =>
                    normKey(sub) === normKey(s.value) ||
                    normKey(sub) === normKey(s.label),
                );
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

const TH_BASE = "px-4 py-2.5";

/** One memoised table row so qty changes only re-render the affected part. */
const PartRow = memo(function PartRow({ p, qty = 0, cartId, onAdd, onQty }) {
  const inCart = cartId !== undefined;
  return (
    <tr className="border-t border-ink-100">
      <td className="px-4 py-3">
        <p className="font-semibold text-ink-800">{p.itemDescription}</p>
        <p className="mt-0.5 text-xs text-brand-700">{p.partNumber}</p>
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
      <td className="px-4 py-3 text-center text-ink-500">{p.points || "—"}</td>
      <td className="px-4 py-3 text-center text-ink-500">
        {p.warrantyDays ? `${p.warrantyDays}d` : "—"}
      </td>
      <td className="px-4 py-3 text-center text-ink-500">
        {p.eda != null ? `${p.eda}d` : "—"}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-center">
          <CatalogueQtyStepper
            value={qty}
            onChange={(v) =>
              inCart ? onQty(cartId, v) : v > 0 ? onAdd(p) : null
            }
            min={0}
          />
        </div>
      </td>
    </tr>
  );
});

function PartsTable({ parts, cartLookup, onAdd, onQty }) {
  return (
    <div className="overflow-x-auto ">
      <table className="w-full min-w-[960px] text-sm">
        <thead>
          <tr className="border-t border-ink-100 bg-ink-50/60 text-left text-[11px] font-medium text-ink-500">
            <th className={TH_BASE}>PART NAME</th>
            <th className={TH_BASE}>BRAND NAME</th>
            <th className={clsx(TH_BASE, "text-center")}>
              MRP
              <br />
              <span className="text-[9px] normal-case">(INCL. TAX)</span>
            </th>
            <th className={clsx(TH_BASE, "text-center")}>DISC %</th>
            <th className={clsx(TH_BASE, "text-center")}>
              BILLING PRICE
              <br />
              <span className="text-[9px] normal-case">(INCL. TAX)</span>
            </th>
            <th className={clsx(TH_BASE, "text-center")}>MYTVS COINS</th>
            <th className={clsx(TH_BASE, "text-center")}>WARRANTY</th>
            <th className={clsx(TH_BASE, "text-center")}>ETD</th>
            <th className={clsx(TH_BASE, "text-center")}>QUANTITY</th>
          </tr>
        </thead>
        <tbody>
          {parts.map((p) => {
            const cartRow = cartLookup.get(up(p.partNumber));
            return (
              <PartRow
                key={p.partNumber}
                p={p}
                qty={cartRow?.qty}
                cartId={cartRow?.cartId}
                onAdd={onAdd}
                onQty={onQty}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SubcategorySection({
  agg,
  sub,
  subLabel,
  isOpen,
  onToggle,
  basePayload,
  selectedBrands,
  cleanQuery,
  sort,
  cartLookup,
  onAdd,
  onQty,
  onTotalCountChange,
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [parts, setParts] = useState([]);
  const [totalCount, setTotalCount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Reset page to 1 when search query, selected brands, vehicle payload, or sort changes
  useEffect(() => {
    setPage(1);
  }, [
    cleanQuery,
    selectedBrands,
    sort,
    basePayload.make,
    basePayload.model,
    basePayload.vehicleGeneration,
    basePayload.variant,
    basePayload.fuelType,
    basePayload.year,
  ]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    const { fieldOrder, sortOrder } = mapSortParam(sort);

    const payload = {
      ...basePayload,
      customerCode: "0046",
      isGlobal: true,
      aggregate: [agg],
      subAggregate: [sub],
      brand: selectedBrands && selectedBrands.length > 0 ? selectedBrands : undefined,
      partNumber: cleanQuery || null,
      limit: pageSize,
      offset: (page - 1) * pageSize,
      fieldOrder,
      sortOrder,
    };

    const requestPromise = cleanQuery
      ? catalogueApi.generalSearch({
        ...payload,
        searchKey: cleanQuery,
      })
      : catalogueApi.getPartsList(payload, true);

    requestPromise
      .then((res) => {
        const raw = extractData(res);
        if (
          !cleanQuery &&
          (!raw || raw.length === 0 || res?.success === false) &&
          (basePayload.variant?.length || basePayload.year?.length)
        ) {
          return catalogueApi.getPartsList({
            ...payload,
            variant: null,
            fuelType: null,
            year: null,
          }, true);
        }
        return res;
      })
      .then((res) => {
        if (cancelled) return;
        const raw = extractData(res);
        const explicitTotal =
          res?.count ??
          res?.totalCount ??
          res?.total ??
          res?.data?.count ??
          res?.data?.totalCount;
        let total = 0;
        if (explicitTotal !== undefined && explicitTotal !== null) {
          total = Number(explicitTotal);
        } else if (page === 1) {
          total = raw.length;
        } else {
          total = Math.max(0, (page - 1) * pageSize + raw.length);
        }

        setTotalCount(total);
        if (onTotalCountChange) {
          onTotalCountChange(agg, sub, total);
        }
        // Replace current page parts
        setParts(raw.map(normalizePartItem).filter(Boolean));
      })
      .catch(() => {
        if (cancelled) return;
        setParts([]);
        setTotalCount(0);
        if (onTotalCountChange) {
          onTotalCountChange(agg, sub, 0);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    agg,
    sub,
    page,
    pageSize,
    cleanQuery,
    selectedBrands,
    sort,
    basePayload.make,
    basePayload.model,
    basePayload.vehicleGeneration,
    basePayload.variant,
    basePayload.fuelType,
    basePayload.year,
    onTotalCountChange,
  ]);

  const displayParts = useMemo(() => {
    let list = parts;
    if (selectedBrands && selectedBrands.length > 0) {
      const brandKeys = new Set(selectedBrands.map((b) => up(String(b).trim())));
      list = list.filter((p) => {
        if (!p) return false;
        return brandKeys.has(up((p.brandName || p.brand || "").trim()));
      });
    }
    const sorter = SORTERS[sort];
    return sorter ? [...list].sort(sorter) : list;
  }, [parts, selectedBrands, sort]);

  return (
    <div className="overflow-hidden rounded-lg border border-ink-100 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full cursor-pointer items-center justify-between bg-white px-4 py-2.5 transition-colors hover:bg-ink-50/50"
      >
        <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-700">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-ink-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-ink-500" />
          )}
          {subLabel}
        </span>
        <span className="text-xs font-semibold text-brand-700">
          {totalCount !== null ? `${totalCount} parts` : "..."}
        </span>
      </button>

      {isOpen && (
        <div className="border-t border-ink-100 bg-white">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
              <p className="text-xs text-ink-500">Loading parts for {subLabel}...</p>
            </div>
          ) : displayParts.length === 0 ? (
            <div className="py-8 text-center text-sm text-ink-500">
              No parts found in this subcategory.
            </div>
          ) : (
            <>
              <PartsTable
                parts={displayParts}
                cartLookup={cartLookup}
                onAdd={onAdd}
                onQty={onQty}
              />
              {totalCount > 0 && (
                <div className="border-t border-ink-100 bg-white">
                  <Pagination
                    page={page}
                    totalPages={Math.ceil(totalCount / pageSize) || 1}
                    totalItems={totalCount}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={(newSize) => {
                      setPageSize(newSize);
                      setPage(1);
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

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
  searchInput,
  setSearchInput,
  onSearchSubmit,
  selectedBrands,
  setSelectedBrands,
  brandOptions = [],
  collapsedGroups,
  toggleGroup,
  cartLookup,
  onAdd,
  onQty,
  partQuery = "",
  setPartQuery,
  partsList = [],
  setPartsList,
  filteredParts = [],
  isLoadingParts = false,
  totalPartsCount = 0,
  setTotalPartsCount,
  page = 1,
  onPageChange,
  pageSize = 20,
  onPageSizeChange,
}) {
  const [subCounts, setSubCounts] = useState({});

  // Reset counts when query or vehicle/category selection changes
  useEffect(() => {
    setSubCounts({});
  }, [makes, models, generation, variants, fuels, years, selectedCats, selectedSubs, partQuery, selectedBrands]);

  const handleTotalCountChange = useCallback((agg, sub, count) => {
    const key = `${normKey(agg)}:${normKey(sub)}`;
    setSubCounts((prev) => {
      if (prev[key] === count) return prev;
      return { ...prev, [key]: count };
    });
  }, []);

  const catLabels = selectedCats.map(
    (v) => categoryOptions.find((c) => c.value === v)?.label || v,
  );
  const selectedSubLabels = selectedSubs.map(
    (v) => activeSubcategoryOptions.find((s) => s.value === v)?.label || v,
  );

  const basePayload = useMemo(
    () => ({
      customerCode: CUSTOMER_CODE,
      make: makes,
      model: models,
      vehicleGeneration: generation || null,
      variant: variants,
      fuelType: fuels,
      year: years,
    }),
    [makes, models, generation, variants, fuels, years]
  );

  const groupsToDisplay = useMemo(() => {
    const buildLabelMap = (options) => {
      const m = new Map();
      for (const o of options) {
        const k = underscoreToSpace(o.value);
        if (!m.has(k)) m.set(k, o.label);
      }
      return m;
    };
    const catLabelsMap = buildLabelMap(categoryOptions);
    const subLabelsMap = buildLabelMap(activeSubcategoryOptions);

    let cats = selectedCats.length > 0 ? selectedCats : categoryOptions.map((c) => c.value);
    if (!cats.length && selectedSubs.length > 0) {
      cats = ["PARTS"];
    }

    return cats.map((cat) => {
      const aggLabel = catLabelsMap.get(underscoreToSpace(cat)) || cat;

      let subsForCat = [];
      if (selectedSubs.length > 0) {
        const matchingSubs = activeSubcategoryOptions.filter((o) => {
          const itemAgg = o.raw?.aggregate || o.raw?.category;
          if (itemAgg) {
            return (
              normKey(itemAgg) === normKey(cat) &&
              selectedSubs.some((s) => normKey(s) === normKey(o.value))
            );
          }
          return selectedSubs.some((s) => normKey(s) === normKey(o.value));
        });

        if (matchingSubs.length > 0) {
          subsForCat = matchingSubs.map((o) => ({
            sub: o.value,
            subLabel: o.label || o.value,
          }));
        } else {
          subsForCat = selectedSubs.map((s) => {
            const opt = activeSubcategoryOptions.find((o) => normKey(o.value) === normKey(s));
            return {
              sub: s,
              subLabel: opt?.label || subLabelsMap.get(underscoreToSpace(s)) || s,
            };
          });
        }
      } else {
        const matchingSubs = activeSubcategoryOptions.filter((o) => {
          const itemAgg = o.raw?.aggregate || o.raw?.category;
          if (itemAgg) {
            return normKey(itemAgg) === normKey(cat);
          }
          return true;
        });

        if (matchingSubs.length > 0) {
          subsForCat = matchingSubs.map((o) => ({
            sub: o.value,
            subLabel: o.label || o.value,
          }));
        } else {
          subsForCat = activeSubcategoryOptions.map((o) => ({
            sub: o.value,
            subLabel: o.label || o.value,
          }));
        }
      }

      const seenSubs = new Set();
      const uniqueSubs = [];
      for (const s of subsForCat) {
        const k = normKey(s.sub);
        if (!seenSubs.has(k)) {
          seenSubs.add(k);
          uniqueSubs.push(s);
        }
      }

      return {
        agg: cat,
        aggLabel,
        subs: uniqueSubs,
      };
    });
  }, [selectedCats, categoryOptions, selectedSubs, activeSubcategoryOptions]);

  const grandTotal = useMemo(() => {
    if (partQuery) return totalPartsCount;
    return Object.values(subCounts).reduce((sum, n) => sum + (Number(n) || 0), 0);
  }, [partQuery, totalPartsCount, subCounts]);

  return (
    <div className="p-5">
      {/* Breadcrumb chips */}
      <div className="mb-3 flex flex-wrap gap-2">
        {makes.length > 0 && <BreadChip>{makes.join(", ")}</BreadChip>}
        {models.length > 0 && (
          <BreadChip>{models.map((m) => String(m).toUpperCase()).join(", ")}</BreadChip>
        )}
        {!skipGeneration && generation && (
          <BreadChip>{String(generation).split(" (")[0]}</BreadChip>
        )}
        {variants.length > 0 && <BreadChip>{variants.join(", ")}</BreadChip>}
        {fuels.length > 0 && <BreadChip>{fuels.join(", ")}</BreadChip>}
        {years.length > 0 && <BreadChip>{years.join(", ")}</BreadChip>}
        {catLabels.length > 0 && (
          <BreadChip>{catLabels.map((c) => c.toUpperCase()).join(", ")}</BreadChip>
        )}
        {selectedSubLabels.length > 0 && (
          <BreadChip>{selectedSubLabels.map((c) => c.toUpperCase()).join(", ")}</BreadChip>
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
            options={SORT_OPTIONS}
          />
        </FilterField>

        <div className="relative">
          <Input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSearchSubmit();
              }
            }}
            placeholder="Search Part (min. 4 chars)"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => onSearchSubmit()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-ink-400 hover:text-accent-600 transition-colors cursor-pointer"
            title="Search Part (min. 4 characters)"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        <div className="flex h-11 items-center">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-sm font-semibold text-ink-700">
            <Icons.PackageOpen className="h-4 w-4 text-accent-500" />
            <span className="font-bold">{grandTotal}</span> Parts
          </span>
        </div>
      </div>

      {partQuery ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-800">
              Search Results for &ldquo;{partQuery}&rdquo; ({totalPartsCount} {totalPartsCount === 1 ? "part" : "parts"})
            </h3>
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                if (setPartQuery) setPartQuery("");
                if (setPartsList) setPartsList([]);
                if (setTotalPartsCount) setTotalPartsCount(0);
              }}
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 underline cursor-pointer"
            >
              Clear Search
            </button>
          </div>

          {isLoadingParts ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
              <p className="text-sm text-ink-500">Searching parts for &ldquo;{partQuery}&rdquo;...</p>
            </div>
          ) : filteredParts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-ink-200 py-16 text-center text-sm text-ink-500">
              No parts found matching &ldquo;{partQuery}&rdquo;.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-ink-100 bg-white">
              <PartsTable
                parts={filteredParts}
                cartLookup={cartLookup}
                onAdd={onAdd}
                onQty={onQty}
              />
              {totalPartsCount > 0 && (
                <div className="border-t border-ink-100 bg-white">
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
          )}
        </div>
      ) : groupsToDisplay.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-200 py-16 text-center text-sm text-ink-500">
          No categories match the current selection.
        </div>
      ) : (
        <div className="space-y-2">
          {groupsToDisplay.map((g) => {
            const aggOpen = !collapsedGroups.has(`agg:${g.agg}`);
            const catTotal = g.subs.reduce(
              (sum, s) => sum + (subCounts[`${normKey(g.agg)}:${normKey(s.sub)}`] ?? 0),
              0
            );

            return (
              <div
                key={g.agg}
                className="overflow-hidden rounded-lg border border-ink-100"
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(`agg:${g.agg}`)}
                  className="flex cursor-pointer w-full items-center justify-between bg-ink-50/60 px-4 py-2.5 transition-colors hover:bg-ink-100/60"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-800">
                    {aggOpen ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    {g.aggLabel}
                  </span>
                  <span className="text-xs font-semibold text-brand-700">{catTotal} parts</span>
                </button>
                {aggOpen && (
                  <div className="space-y-2 bg-white p-3">
                    {g.subs.map((s) => {
                      const subKey = `sub:${g.agg}:${s.sub}`;
                      const subOpen = !collapsedGroups.has(subKey);
                      return (
                        <SubcategorySection
                          key={s.sub}
                          agg={g.agg}
                          sub={s.sub}
                          subLabel={s.subLabel}
                          isOpen={subOpen}
                          onToggle={() => toggleGroup(subKey)}
                          basePayload={basePayload}
                          selectedBrands={selectedBrands}
                          cleanQuery={partQuery}
                          sort={sort}
                          cartLookup={cartLookup}
                          onAdd={onAdd}
                          onQty={onQty}
                          onTotalCountChange={handleTotalCountChange}
                        />
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