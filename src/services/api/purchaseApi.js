import { axiosClient } from "@/services";

/**
 * Backend-ready Purchase endpoints for Finance > Purchase. Until the
 * backend exists, pages/finance/Purchase.jsx reads from local mock
 * data.
 */
export const purchaseApi = {
  listPurchases(params) {
    // TODO: return axiosClient.get("/finance/purchases", { params });
    return Promise.reject(
      new Error("purchaseApi.listPurchases() not connected"),
    );
  },
  getPurchase(id) {
    // TODO: return axiosClient.get(`/finance/purchases/${id}`);
    return Promise.reject(new Error("purchaseApi.getPurchase() not connected"));
  },
  createPurchase(payload) {
    // TODO: return axiosClient.post("/finance/purchases", payload);
    return Promise.reject(
      new Error("purchaseApi.createPurchase() not connected"),
    );
  },
  updatePurchase(id, payload) {
    // TODO: return axiosClient.put(`/finance/purchases/${id}`, payload);
    return Promise.reject(
      new Error("purchaseApi.updatePurchase() not connected"),
    );
  },
  removePurchase(id) {
    // TODO: return axiosClient.delete(`/finance/purchases/${id}`);
    return Promise.reject(
      new Error("purchaseApi.removePurchase() not connected"),
    );
  },
  uploadPurchaseDocument(id, file) {
    // TODO: return axiosClient.postForm(`/finance/purchases/${id}/documents`, { file });
    return Promise.reject(
      new Error("purchaseApi.uploadPurchaseDocument() not connected"),
    );
  },
  exportCsv(params) {
    // TODO: return axiosClient.get("/finance/purchases/export", { params, responseType: "blob" });
    return Promise.reject(new Error("purchaseApi.exportCsv() not connected"));
  },
};
