import { axiosClient } from "@/services";

export const catalogueApi = {
  // ─── vehicle chain (used by all three pages) ───────────────────────────
  getMakes(params) {
    // TODO: return axiosClient.get("/tvs-partsmart/masters/makes", { params });
    return Promise.reject(new Error("catalogueApi.getMakes() not connected"));
  },
  getModels(params) {
    // TODO: return axiosClient.get("/tvs-partsmart/masters/models", { params });
    return Promise.reject(new Error("catalogueApi.getModels() not connected"));
  },
  getGenerations(params) {
    // TODO: return axiosClient.get("/tvs-partsmart/masters/generations", { params });
    return Promise.reject(
      new Error("catalogueApi.getGenerations() not connected"),
    );
  },
  getVariants(params) {
    // TODO: return axiosClient.get("/tvs-partsmart/masters/variants", { params });
    return Promise.reject(
      new Error("catalogueApi.getVariants() not connected"),
    );
  },
  getFuels(params) {
    // TODO: return axiosClient.get("/tvs-partsmart/masters/fuels", { params });
    return Promise.reject(new Error("catalogueApi.getFuels() not connected"));
  },
  getYears(params) {
    // TODO: return axiosClient.get("/tvs-partsmart/masters/years", { params });
    return Promise.reject(new Error("catalogueApi.getYears() not connected"));
  },

  // ─── categories / subcategories ────────────────────────────────────────
  getCategories(params) {
    // TODO: return axiosClient.get("/tvs-partsmart/masters/categories", { params });
    return Promise.reject(
      new Error("catalogueApi.getCategories() not connected"),
    );
  },
  getSubcategories(params) {
    // TODO: return axiosClient.get("/tvs-partsmart/masters/subcategories", { params });
    return Promise.reject(
      new Error("catalogueApi.getSubcategories() not connected"),
    );
  },

  // ─── Vehicle number lookup (Global page - Vehicle Order mode) ─────────
  lookupVehicle(regNo) {
    // TODO: return axiosClient.get(`/tvs-partsmart/vehicle/${regNo}`);
    return Promise.reject(
      new Error("catalogueApi.lookupVehicle() not connected"),
    );
  },

  // ─── Parts search / listing ────────────────────────────────────────────

  getTieredParts(filters) {
    // TODO: return axiosClient.post("/tvs-partsmart/top20/parts", filters);
    return Promise.reject(
      new Error("catalogueApi.getTieredParts() not connected"),
    );
  },
  /** Global page (Stock Order + Vehicle Order): flat parts list. */
  getParts(filters) {
    // TODO: return axiosClient.post("/tvs-partsmart/parts/search", filters);
    return Promise.reject(new Error("catalogueApi.getParts() not connected"));
  },
  /** MyTVS Parts: lubes / brake fluid / coolant catalogue. */
  getLubes(filters) {
    // TODO: return axiosClient.get("/lubes-products", { params: filters });
    return Promise.reject(new Error("catalogueApi.getLubes() not connected"));
  },

  // ─── Cart ──────────────────────────────────────────────────────────────
  getCart() {
    // TODO: return axiosClient.get("/tvs-partsmart/cart");
    return Promise.reject(new Error("catalogueApi.getCart() not connected"));
  },
  addToCart(payload) {
    // TODO: return axiosClient.post("/tvs-partsmart/cart", payload);
    return Promise.reject(new Error("catalogueApi.addToCart() not connected"));
  },
  updateCartItem(cartId, payload) {
    // TODO: return axiosClient.put(`/tvs-partsmart/cart/${cartId}`, payload);
    return Promise.reject(
      new Error("catalogueApi.updateCartItem() not connected"),
    );
  },
  removeCartItem(cartId) {
    // TODO: return axiosClient.delete(`/tvs-partsmart/cart/${cartId}`);
    return Promise.reject(
      new Error("catalogueApi.removeCartItem() not connected"),
    );
  },
  checkout(payload) {
    // TODO: return axiosClient.post("/tvs-partsmart/cart/checkout", payload);
    return Promise.reject(new Error("catalogueApi.checkout() not connected"));
  },

  // ─── Orders ────────────────────────────────────────────────────────────
  getOrders(params) {
    // TODO: return axiosClient.get("/tvs-partsmart/orders", { params });
    return Promise.reject(new Error("catalogueApi.getOrders() not connected"));
  },
  getOrderDetails(enquiryNo) {
    // TODO: return axiosClient.get(`/tvs-partsmart/orders/${enquiryNo}`);
    return Promise.reject(
      new Error("catalogueApi.getOrderDetails() not connected"),
    );
  },
  cancelOrder(enquiryNo, payload) {
    // TODO: return axiosClient.post(`/tvs-partsmart/orders/${enquiryNo}/cancel`, payload);
    return Promise.reject(
      new Error("catalogueApi.cancelOrder() not connected"),
    );
  },
};
