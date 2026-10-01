import { axiosClient } from "@/services";

/**
 * Backend-ready Receipt endpoints for Finance > Receipt. Until the
 * backend exists, pages/finance/Receipt.jsx reads from local mock
 * data. Swap each mock initializer for one of the calls below when
 * the backend is live.
 */
export const receiptApi = {
  /** Paginated list of receipts (payments recorded against invoices). */
  listReceipts(params) {
    // TODO: return axiosClient.get("/receipts", { params });
    return Promise.reject(new Error("receiptApi.listReceipts() not connected"));
  },

  /** Fetch a single receipt with line-level detail. */
  getReceipt(receiptId) {
    // TODO: return axiosClient.get(`/receipts/${receiptId}`);
    return Promise.reject(new Error("receiptApi.getReceipt() not connected"));
  },

  /** Download PDF for a receipt. */
  downloadReceipt(receiptId) {
    // TODO: return axiosClient.get(`/receipts/${receiptId}/pdf`, { responseType: "blob" });
    return Promise.reject(
      new Error("receiptApi.downloadReceipt() not connected"),
    );
  },
};
