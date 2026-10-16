import { axiosClient } from "@/services";

export const purchaseApi = {
  // ─── Purchases (main list) ──────────────────────────────────────────
  listPurchases(body = {}) {
    return axiosClient.post("/financePurchase/listPurchases", body);
  },
  getPurchase(id) {
    return axiosClient.post("/financePurchase/getPurchase", { id });
  },
  createPurchase(payload) {
    if (payload instanceof FormData) {
      return axiosClient.post("/financePurchase/createPurchase", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return axiosClient.post("/financePurchase/createPurchase", payload);
  },
  updatePurchase(idOrPayload, maybePayload) {
    let payload = idOrPayload;
    if (maybePayload !== undefined) {
      if (maybePayload instanceof FormData) {
        maybePayload.set("id", idOrPayload);
        payload = maybePayload;
      } else {
        payload = { ...maybePayload, id: idOrPayload };
      }
    }
    if (payload instanceof FormData) {
      return axiosClient.post("/financePurchase/editPurchase", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return axiosClient.post("/financePurchase/editPurchase", payload);
  },
  addPayment(payload) {
    return axiosClient.post("/financePurchase/addPayment", payload);
  },
  getPurchasePayments(purchaseId) {
    return axiosClient.post("/financePurchase/getPurchasePayments", { purchaseId });
  },
  uploadPurchaseDocument(id, file) {
    const formData = new FormData();
    formData.append("id", id);
    formData.append("document", file);
    return axiosClient.post("/financePurchase/uploadPurchaseDocument", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  exportCsv(params = {}) {
    return axiosClient.post("/financePurchase/listPurchases", params);
  },

  // ─── Finance Purchase Vendors ───────────────────────────────────────
  listVendors(body = {}) {
    return axiosClient.post("/financePurchaseVendor/listFinancePurchaseVendors", body);
  },
  createVendor(payload) {
    if (payload instanceof FormData) {
      return axiosClient.post("/financePurchaseVendor/createFinancePurchaseVendor", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return axiosClient.post("/financePurchaseVendor/createFinancePurchaseVendor", payload);
  },
};
