import { axiosClient } from "@/services";

/**
 * Backend-ready Profit & Loss endpoints for Finance > P&L. Until the
 * backend exists, pages/finance/ProfitLoss.jsx reads from local mock
 * data. Swap each mock read for the calls below when the backend is
 * live.
 */
export const profitLossApi = {
  /** Combined P&L + Cash Flow for a given date range. */
  getStatements(params) {
    // TODO: return axiosClient.get("/finance/pl", { params: { from, to } });
    return Promise.reject(
      new Error("profitLossApi.getStatements() not connected"),
    );
  },

  /** Export a single statement as CSV (kind: "pnl" | "cashFlow"). */
  exportCsv(kind, params) {
    // TODO: return axiosClient.get(`/finance/pl/export/${kind}`, { params, responseType: "blob" });
    return Promise.reject(new Error("profitLossApi.exportCsv() not connected"));
  },
};
