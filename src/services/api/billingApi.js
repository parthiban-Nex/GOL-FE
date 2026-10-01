import { axiosClient } from "@/services";

/**
 * Backend-ready Billing endpoints for Finance > Billing. Until the
 * backend exists, pages/finance/Billing.jsx reads from local mock data.
 * Swap each mock initializer for one of the calls below when the
 * backend is live.
 */
export const billingApi = {
  /** Paginated list of invoices with paid/balance/status. */
  listInvoices(params) {
    // TODO: return axiosClient.get("/billing/invoices", { params });
    return Promise.reject(new Error("billingApi.listInvoices() not connected"));
  },

  /** Header stats card - outstanding balance + accrued loyalty points. */
  getHeaderStats() {
    // TODO: return axiosClient.get("/billing/stats");
    return Promise.reject(
      new Error("billingApi.getHeaderStats() not connected"),
    );
  },

  /** Initiate payment on an invoice (opens payment gateway server-side). */
  payInvoice(invoiceId, payload) {
    // TODO: return axiosClient.post(`/billing/invoices/${invoiceId}/pay`, payload);
    return Promise.reject(new Error("billingApi.payInvoice() not connected"));
  },

  /** Download PDF of an invoice. */
  downloadInvoice(invoiceId) {
    // TODO: return axiosClient.get(`/billing/invoices/${invoiceId}/pdf`, { responseType: "blob" });
    return Promise.reject(
      new Error("billingApi.downloadInvoice() not connected"),
    );
  },
};
