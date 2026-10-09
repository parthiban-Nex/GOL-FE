import { axiosClient } from "@/services";


export const expenseApi = {
  // ─── Expenses (main list) ──────────────────────────────────────────
  listExpenses(body = {}) {
    return axiosClient.post("/expense/listExpenses", body);
  },
  getExpense(id) {
    return axiosClient.post("/expense/getExpense", { id });
  },
  createExpense(payload) {
    if (payload instanceof FormData) {
      return axiosClient.post("/expense/createExpense", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return axiosClient.post("/expense/createExpense", payload);
  },
  updateExpense(idOrPayload, maybePayload) {
    let payload = idOrPayload;
    if (maybePayload !== undefined) {
      if (maybePayload instanceof FormData) {
        maybePayload.append("id", idOrPayload);
        payload = maybePayload;
      } else {
        payload = { ...maybePayload, id: idOrPayload };
      }
    }
    if (payload instanceof FormData) {
      return axiosClient.post("/expense/editExpense", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return axiosClient.post("/expense/editExpense", payload);
  },
  removeExpense(id) {
    // TODO: return axiosClient.delete(`/expenses/${id}`);
    return Promise.reject(
      new Error("expenseApi.removeExpense() not connected"),
    );
  },
  uploadExpenseDocument(id, file) {
    const formData = new FormData();
    formData.append("id", id);
    formData.append("document", file);
    return axiosClient.post("/expense/uploadExpenseDocument", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  exportCsv(params = {}) {
    return axiosClient.post("/expense/listExpenses", params);
  },

  // ─── Vendors ───────────────────────────────────────────────────────
  listVendors(body = {}) {
    return axiosClient.post("/expenseVendor/listExpenseVendors", body);
  },
  createVendor(payload) {
    if (payload instanceof FormData) {
      return axiosClient.post("/expenseVendor/createExpenseVendor", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return axiosClient.post("/expenseVendor/createExpenseVendor", payload);
  },
  uploadVendorDocument(id, file) {
    const formData = new FormData();
    formData.append("document", file);
    formData.append("id", id);
    return axiosClient.post("/expenseVendor/createExpenseVendor", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
