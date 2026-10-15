import { axiosClient } from "@/services";
import { env } from "@/config/env";

export const TIER_DISCOUNTS = {
  oem: 0.04,        // 4% discount
  primary: 0.13,    // 13% discount
  secondary: 0.20,  // 20% discount
};

export function getCalculatedSaleRate(mrp, tierType, discountPercent = null) {
  const numericMrp = Number(mrp) || 0;
  if (numericMrp <= 0) return numericMrp;

  // 1. If discountPercent is provided (e.g. from partConfig.discountPercent in response)
  if (discountPercent !== null && discountPercent !== undefined && !isNaN(Number(discountPercent))) {
    const rate = Number(discountPercent) / 100;
    return Math.round(numericMrp * (1 - rate));
  }

  // 2. Otherwise fallback to tier-based default discount
  if (!tierType) return numericMrp;
  const rawTier = String(tierType).trim().toLowerCase();
  let discountRate = 0;
  if (rawTier.includes('oem')) {
    discountRate = TIER_DISCOUNTS.oem;
  } else if (rawTier.includes('secondary')) {
    discountRate = TIER_DISCOUNTS.secondary;
  } else if (rawTier.includes('primary')) {
    discountRate = TIER_DISCOUNTS.primary;
  }
  if (!discountRate) return numericMrp;
  return Math.round(numericMrp * (1 - discountRate));
}

export function formatDisplayPartNo(partNumber, lineCode = '') {
  if (!partNumber) return '';
  let str = String(partNumber).trim();
  if (lineCode && str.startsWith(String(lineCode).trim())) {
    str = str.slice(String(lineCode).trim().length);
  }
  return str.replace(/^(215|216|055|703)/, '');
}

export function isPartMatchingSearch(part, query) {
  if (!part) return false;
  if (!query) return true;
  const q = String(query).trim().toLowerCase();
  const cleanQ = q.replace(/[^a-zA-Z0-9]/g, "");
  const rawPartNo = String(part.partNumber || part.part_number || part.code || "").trim().toLowerCase();
  const displayPartNo = String(part.displayPartNo || formatDisplayPartNo(rawPartNo, part.lineCode)).trim().toLowerCase();
  const cleanRaw = rawPartNo.replace(/[^a-zA-Z0-9]/g, "");
  const cleanDisplay = displayPartNo.replace(/[^a-zA-Z0-9]/g, "");
  const desc = String(part.itemDescription || part.part_desc || part.description || part.name || "").toLowerCase();
  const brand = String(part.brandName || part.brand || part.brand_name || "").toLowerCase();
  return (
    rawPartNo.includes(q) ||
    displayPartNo.includes(q) ||
    (cleanQ ? cleanRaw.includes(cleanQ) : false) ||
    (cleanQ ? cleanDisplay.includes(cleanQ) : false) ||
    desc.includes(q) ||
    brand.includes(q)
  );
}

function normalizePayload(params = {}) {
  const payload = {};

  Object.keys(params).forEach((key) => {
    const val = params[key];
    if (val !== null && val !== undefined && val !== "") {
      if (Array.isArray(val)) {
        const cleaned = val.filter((item) => item !== null && item !== undefined && item !== "");
        if (cleaned.length > 0) {
          payload[key] = cleaned;
        }
      } else {
        payload[key] = val;
      }
    }
  });

  const codeVal = payload.customerCode || payload.customerCodes;
  if (codeVal) {
    const strVal = Array.isArray(codeVal) ? String(codeVal[0]) : String(codeVal);
    payload.customerCode = strVal;
    payload.customerCodes = [strVal];
  }

  const makeVal = payload.make || payload.makes || payload.makeName || payload.makesName;
  if (makeVal) {
    const arr = Array.isArray(makeVal) ? makeVal : [makeVal];
    payload.make = arr;
    payload.makes = arr;
    payload.makeName = arr[0];
  }

  const modelVal = payload.model || payload.models || payload.modelName || payload.modelsName;
  if (modelVal) {
    const arr = Array.isArray(modelVal) ? modelVal : [modelVal];
    payload.model = arr;
    payload.models = arr;
    payload.modelName = arr[0];
  }

  const brandVal = payload.brand || payload.brands || payload.brandName || payload.brandsName;
  if (brandVal) {
    const arr = Array.isArray(brandVal) ? brandVal : [brandVal];
    payload.brand = arr;
    payload.brands = arr;
    payload.brandName = arr[0];
  }

  const catVal = payload.aggregate || payload.category || payload.categories || payload.aggregates;
  if (catVal) {
    const arr = Array.isArray(catVal) ? catVal : [catVal];
    payload.aggregate = arr;
    payload.category = arr[0];
    payload.categories = arr;
  }

  const subVal = payload.subAggregate || payload.subcategory || payload.subcategories || payload.subCategory || payload.subCategories || payload.subAggregates;
  if (subVal) {
    const arr = Array.isArray(subVal) ? subVal : [subVal];
    payload.subAggregate = arr;
    payload.subcategory = arr[0];
    payload.subcategories = arr;
  }

  const varVal = payload.variant || payload.variants;
  if (varVal) {
    const arr = Array.isArray(varVal) ? varVal : [varVal];
    payload.variant = arr;
    payload.variants = arr;
  }

  const fuelVal = payload.fuelType || payload.fuel || payload.fuels;
  if (fuelVal) {
    const arr = Array.isArray(fuelVal) ? fuelVal : [fuelVal];
    payload.fuelType = arr;
    payload.fuel = arr[0];
    payload.fuels = arr;
  }

  const yrVal = payload.year || payload.years;
  if (yrVal) {
    const arr = Array.isArray(yrVal) ? yrVal.map(String) : [String(yrVal)];
    payload.year = arr;
    payload.years = arr;
  }

  return payload;
}

export const catalogueApi = {
  TIER_DISCOUNTS,
  getCalculatedSaleRate,
  formatDisplayPartNo,
  isPartMatchingSearch,

  // ─── Top 20 Cars ────────────────────────────────────────────────────────
  getTop20Cars() {
    return axiosClient.get("/catelog/top20cars");
  },
  addTop20Car(data) {
    return axiosClient.post("/catelog/top20cars", data);
  },

  // ─── Dynamic Master List filter (Make, Model, Generation, Variant, etc.) ──
  getMasterList(body = {}) {
    return axiosClient.post("/catelog/partsmart/getMasterList", normalizePayload(body));
  },

  getMakes(params = {}) {
    return axiosClient.post("/catelog/partsmart/getMasterList", normalizePayload({
      masterType: "make",
      ...params,
    }));
  },
  getModels(params = {}) {
    return axiosClient.post("/catelog/partsmart/getMasterList", normalizePayload({
      masterType: "model",
      ...params,
    }));
  },
  getGenerations(params = {}) {
    return axiosClient.post("/catelog/partsmart/getMasterList", normalizePayload({
      masterType: "vehicleGeneration",
      ...params,
    }));
  },
  getVariants(params = {}) {
    return axiosClient.post("/catelog/partsmart/getMasterList", normalizePayload({
      masterType: "variant",
      ...params,
    }));
  },
  getFuels(params = {}) {
    return axiosClient.post("/catelog/partsmart/getMasterList", normalizePayload({
      masterType: "fuelType",
      ...params,
    }));
  },
  getYears(params = {}) {
    return axiosClient.post("/catelog/partsmart/getMasterList", normalizePayload({
      masterType: "year",
      ...params,
    }));
  },
  getCategories(params = {}) {
    return axiosClient.post("/catelog/partsmart/getMasterList", normalizePayload({
      masterType: "aggregate",
      primary: false,
      ...params,
    }));
  },
  getBrands(params = {}) {
    return axiosClient.post("/catelog/partsmart/getMasterList", normalizePayload({
      masterType: "brand",
      primary: false,
      ...params,
    }));
  },
  getSubcategories(params = {}) {
    return axiosClient.post("/catelog/partsmart/getMasterList", normalizePayload({
      masterType: "subAggregate",
      primary: false,
      ...params,
    }));
  },

  // ─── Vehicle number lookup (Vahan / Vehicle Resolve) ─────────────────────
  lookupVehicle(registrationNumber) {
    const cleanRegNo = String(registrationNumber || "").trim().toUpperCase();
    return axiosClient.post("/catelog/vehicleResolve", {
      registrationNumber: cleanRegNo,
      vehicleNumber: cleanRegNo,
    });
  },
  getVahanDetails(registrationNumber) {
    const cleanRegNo = String(registrationNumber || "").trim().toUpperCase();
    return axiosClient.get("/catelog/getVahanDetails", {
      params: { registrationNumber: cleanRegNo },
    });
  },

  // ─── Parts search / listing ────────────────────────────────────────────
  getPartsList(filters = {}) {
    return axiosClient.post("/catelog/partsmart/getPartsList", normalizePayload(filters));
  },
  generalSearch(params = {}) {
    let searchKey = "";
    let customerCode = env.customerCode || "0046";

    if (typeof params === "string") {
      searchKey = params;
    } else if (params && typeof params === "object") {
      searchKey = params.searchKey || params.query || params.search || params.partNumber || "";
      if (params.customerCode) customerCode = params.customerCode;
    }

    const cleanKey = String(searchKey).trim();
    const extraPayload = typeof params === "object" ? normalizePayload(params) : {};
    const payload = {
      ...extraPayload,
      searchKey: cleanKey,
      customerCode: customerCode || "0046",
    };
    if (typeof params === "object") {
      if (params.limit !== undefined) payload.limit = Number(params.limit);
      if (params.offset !== undefined) payload.offset = Number(params.offset);
    }

    return axiosClient.post("/catelog/partsmart/generalSearch", payload)
      .catch(() => axiosClient.post("/jobCards/partsmart/generalSearch", payload));
  },
  getTieredParts(filters = {}) {
    return axiosClient.post("/catelog/partsmart/getPartsList", normalizePayload(filters));
  },
  getParts(filters = {}) {
    return axiosClient.post("/catelog/partsmart/getPartsList", normalizePayload(filters));
  },
  getLubes(filters = {}) {
    return axiosClient.get("/catelog/lubes-products", { params: filters });
  },
  getLubesProducts(params = {}) {
    const queryParams = {
      type: params.type,
      skip: params.skip !== undefined ? Number(params.skip) : 0,
      limit: params.limit !== undefined ? Number(params.limit) : 50,
      _t: Date.now(),
    };
    if (params.search && String(params.search).trim() !== "") {
      queryParams.search = String(params.search).trim();
    }
    return axiosClient.get("/catelog/LubesProducts/list", { params: queryParams });
  },

  // ─── Cart ──────────────────────────────────────────────────────────────
  getCart() {
    return axiosClient
      .get(`/catelog/getCartItems?_t=${Date.now()}`)
      .catch(() => axiosClient.get(`/catelog/getCart?_t=${Date.now()}`));
  },
  addToCart(payload) {
    return axiosClient.post("/catelog/addToCart", payload).catch(() => axiosClient.post("/catelog/cart", payload));
  },
  updateCartQty(part_number, action) {
    return axiosClient.post("/catelog/updateQuantity", { part_number, action });
  },
  updateCartItem(cartId, payload) {
    return axiosClient.put(`/catelog/cart/${cartId}`, payload);
  },
  removeCartItem(part_number) {
    return axiosClient
      .post("/catelog/removeItem", { part_number })
      .catch(() => axiosClient.delete(`/catelog/cart/${part_number}`));
  },
  placeOrder(payload) {
    return axiosClient
      .post("/catelog/placeOrderNew", payload)
      .catch(() => axiosClient.post("/catelog/cart/checkout", payload));
  },
  checkout(payload) {
    return axiosClient
      .post("/catelog/placeOrderNew", payload)
      .catch(() => axiosClient.post("/catelog/cart/checkout", payload));
  },

  // ─── Orders ────────────────────────────────────────────────────────────
  getOrders(params) {
    return axiosClient
      .get("/catelog/getOrderHistories", { params })
      .catch(() => axiosClient.get("/catelog/orders", { params }));
  },
  getOrderHistories(params) {
    return axiosClient
      .get("/catelog/getOrderHistories", { params })
      .catch(() => axiosClient.get("/catelog/orders", { params }));
  },
  getOrderDetails(enquiryNo) {
    return axiosClient.get(`/catelog/orders/${enquiryNo}`);
  },
  cancelOrder(enquiryNo, payload) {
    return axiosClient.post(`/catelog/orders/${enquiryNo}/cancel`, payload);
  },

  // ─── Direct Enquiry Order APIs ─────────────────────────────────────────
  /**
   * 1. Place Order (Direct Enquiry Create)
   * POST /catelog/partsmart/order/direct-enquiry/create
   * @param {Object} payload { workshopId, customer_code, source, channel, reference_no, vehicle_no, parts }
   */
  createDirectEnquiryOrder(payload) {
    return axiosClient.post("/catelog/partsmart/order/direct-enquiry/create", payload);
  },

  /**
   * 2. Order List (Direct Enquiry List)
   * GET /catelog/partsmart/order/direct-enquiry/list?workshopId=...
   * @param {string|Object} params - workshopId string or { workshopId }
   */
  getDirectEnquiryOrderList(params = {}) {
    const queryParams = typeof params === "string" ? { workshopId: params } : params;
    return axiosClient.get("/catelog/partsmart/order/direct-enquiry/list", {
      params: queryParams,
    });
  },

  /**
   * 3. Order Status (Real-time Enquiry Tracking)
   * POST /catelog/partsmart/order/direct-enquiry/status
   * @param {Object} payload { enquiry_no, reference_no, source }
   */
  getDirectEnquiryOrderStatus(payload) {
    return axiosClient.post("/catelog/partsmart/order/direct-enquiry/status", payload);
  },

  // ─── Stock Inventory Checking APIs ────────────────────────────────────
  /**
   * Check stock for a single part or batch of parts
   * POST /catelog/partsmart/getStockList
   * @param {Object} params
   * @param {string} [params.partNumber] - Part number (e.g., '4673220510')
   * @param {Array<string>} [params.parts] - Optional array of part numbers for batch checking
   * @param {string} [params.customerCode] - Optional customer code (defaults to '050')
   * @param {string} [params.software] - Defaults to 'DMS'
   */
  getStockList(params = {}) {
    const payload = {
      customerCode: params.customerCode || '050',
      software: params.software || 'DMS',
      limit: params.limit || 100,
      offset: params.offset || 0,
      sortOrder: params.sortOrder || 'ASC',
      fieldOrder: params.fieldOrder || 'lotAgeDate',
      inventoryName: params.inventoryName ?? null,
      entity: params.entity ?? null,
    };

    // If batch check (array of parts)
    if (Array.isArray(params.parts) && params.parts.length > 0) {
      payload.parts = params.parts;
    } else {
      payload.partNumber = String(
        params.partNumber || params.part_number || params.code || params.partNo || ''
      ).trim();
    }

    return axiosClient.post('/catelog/partsmart/getStockList', payload);
  },

  /**
   * Check stock for all items currently in cart
   * @param {Array<string|Object>} cartItems - Array of cart items or part numbers
   * @param {string} [customerCode]
   */
  checkCartStock(cartItems = [], customerCode = '050') {
    const parts = cartItems
      .map((item) => (typeof item === 'string' ? item : item.part_number || item.partNumber || item.code))
      .filter(Boolean);

    return catalogueApi.getStockList({ parts, customerCode });
  },
};


