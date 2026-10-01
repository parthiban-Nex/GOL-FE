import { axiosClient } from "@/services";


export const expenseApi = {
  // ─── Expenses (main list) ──────────────────────────────────────────
  listExpenses(params) {
    // TODO: return axiosClient.get("/expenses", { params });
    return Promise.reject(new Error("expenseApi.listExpenses() not connected"));
  },
  getExpense(id) {
    // TODO: return axiosClient.get(`/expenses/${id}`);
    return Promise.reject(new Error("expenseApi.getExpense() not connected"));
  },
  createExpense(payload) {
    // TODO: return axiosClient.post("/expenses", payload);
    return Promise.reject(
      new Error("expenseApi.createExpense() not connected"),
    );
  },
  updateExpense(id, payload) {
    // TODO: return axiosClient.put(`/expenses/${id}`, payload);
    return Promise.reject(
      new Error("expenseApi.updateExpense() not connected"),
    );
  },
  removeExpense(id) {
    // TODO: return axiosClient.delete(`/expenses/${id}`);
    return Promise.reject(
      new Error("expenseApi.removeExpense() not connected"),
    );
  },
  uploadExpenseDocument(id, file) {
    // TODO: return axiosClient.postForm(`/expenses/${id}/documents`, { file });
    return Promise.reject(
      new Error("expenseApi.uploadExpenseDocument() not connected"),
    );
  },
  exportCsv(params) {
    // TODO: return axiosClient.get("/expenses/export", { params, responseType: "blob" });
    return Promise.reject(new Error("expenseApi.exportCsv() not connected"));
  },

  // ─── Vendors ───────────────────────────────────────────────────────
  listVendors(params) {
    // TODO: return axiosClient.get("/vendors", { params });
    return Promise.reject(new Error("expenseApi.listVendors() not connected"));
  },
  createVendor(payload) {
    // TODO: return axiosClient.post("/vendors", payload);
    return Promise.reject(new Error("expenseApi.createVendor() not connected"));
  },
  uploadVendorDocument(id, file) {
    // TODO: return axiosClient.postForm(`/vendors/${id}/documents`, { file });
    return Promise.reject(
      new Error("expenseApi.uploadVendorDocument() not connected"),
    );
  },
};
