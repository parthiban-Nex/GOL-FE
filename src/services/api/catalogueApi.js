import { axiosClient } from "@/services";
import { env } from "@/config/env";

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

  if (payload.make) {
    if (Array.isArray(payload.make)) {
      payload.makes = payload.make;
      payload.makeName = payload.make[0];
      payload.make = payload.make[0];
    } else {
      payload.makes = [payload.make];
      payload.makeName = payload.make;
    }
  }

  if (payload.model) {
    if (Array.isArray(payload.model)) {
      payload.models = payload.model;
      payload.modelName = payload.model[0];
      payload.model = payload.model[0];
    } else {
      payload.models = [payload.model];
      payload.modelName = payload.model;
    }
  }

  if (payload.aggregate || payload.category) {
    const catVal = payload.aggregate || payload.category;
    if (Array.isArray(catVal)) {
      payload.aggregate = catVal;
      payload.category = catVal[0];
      payload.categories = catVal;
    } else {
      payload.aggregate = catVal;
      payload.category = catVal;
      payload.categories = [catVal];
    }
  }

  if (payload.subAggregate || payload.subcategory) {
    const subVal = payload.subAggregate || payload.subcategory;
    if (Array.isArray(subVal)) {
      payload.subAggregate = subVal;
      payload.subcategory = subVal[0];
      payload.subcategories = subVal;
    } else {
      payload.subAggregate = subVal;
      payload.subcategory = subVal;
      payload.subcategories = [subVal];
    }
  }

  if (payload.variant) {
    if (Array.isArray(payload.variant)) {
      payload.variants = payload.variant;
      payload.variant = payload.variant[0];
    } else {
      payload.variants = [payload.variant];
    }
  }

  if (payload.fuelType || payload.fuel) {
    const fVal = payload.fuelType || payload.fuel;
    if (Array.isArray(fVal)) {
      payload.fuels = fVal;
      payload.fuelType = fVal[0];
      payload.fuel = fVal[0];
    } else {
      payload.fuels = [fVal];
      payload.fuelType = fVal;
      payload.fuel = fVal;
    }
  }

  if (payload.year) {
    if (Array.isArray(payload.year)) {
      payload.years = payload.year;
      payload.year = String(payload.year[0]);
    } else {
      payload.years = [String(payload.year)];
      payload.year = String(payload.year);
    }
  }

  return payload;
}

export const catalogueApi = {
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
      ...params,
    }));
  },
  getBrands(params = {}) {
    return axiosClient.post("/catelog/partsmart/getMasterList", normalizePayload({
      masterType: "brand",
      ...params,
    }));
  },
  getSubcategories(params = {}) {
    return axiosClient.post("/catelog/partsmart/getMasterList", normalizePayload({
      masterType: "subAggregate",
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
    const payload = {
      searchKey: cleanKey,
      customerCode: customerCode || "0046",
    };

    return axiosClient.post("/jobCards/partsmart/generalSearch", payload);
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
      type: params.type || "LUBRICANTS",
      skip: params.skip !== undefined ? Number(params.skip) : 0,
      limit: params.limit !== undefined ? Number(params.limit) : 50,
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
};


