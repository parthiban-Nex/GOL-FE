import { axiosClient } from "@/services";

/**
 * Backend-ready Wallet endpoints for Finance > Wallet. Until the
 * backend exists, pages/finance/Wallet.jsx reads from local mock data.
 * Swap the mock reads for these calls in one place per handler when
 * the backend is available.
 */
export const walletApi = {
  // ─── Balance ────────────────────────────────────────────────────────
  getBalance() {
    // TODO: return axiosClient.get("/wallet/balance");
    return Promise.reject(new Error("walletApi.getBalance() not connected"));
  },

  // ─── Transactions ───────────────────────────────────────────────────
  listTransactions(params) {
    // TODO: return axiosClient.get("/wallet/transactions", { params });
    return Promise.reject(
      new Error("walletApi.listTransactions() not connected"),
    );
  },

  // ─── Payment Gateway (Pay Now via Razorpay) ─────────────────────────
  initiatePayment(payload) {
    // TODO: return axiosClient.post("/wallet/payments/initiate", payload);
    return Promise.reject(
      new Error("walletApi.initiatePayment() not connected"),
    );
  },
  confirmPayment(payload) {
    // TODO: return axiosClient.post("/wallet/payments/confirm", payload);
    return Promise.reject(
      new Error("walletApi.confirmPayment() not connected"),
    );
  },

  // ─── Add Funds (manual submission for admin approval) ───────────────
  submitFundsRequest(payload) {
    // TODO: return axiosClient.post("/wallet/funds-requests", payload);
    return Promise.reject(
      new Error("walletApi.submitFundsRequest() not connected"),
    );
  },

  // ─── Approvals (admin/manager scope) ────────────────────────────────
  listPendingApprovals(params) {
    // TODO: return axiosClient.get("/wallet/approvals", { params });
    return Promise.reject(
      new Error("walletApi.listPendingApprovals() not connected"),
    );
  },
  approveRequest(id) {
    // TODO: return axiosClient.post(`/wallet/approvals/${id}/approve`);
    return Promise.reject(
      new Error("walletApi.approveRequest() not connected"),
    );
  },
  rejectRequest(id, payload) {
    // TODO: return axiosClient.post(`/wallet/approvals/${id}/reject`, payload);
    return Promise.reject(new Error("walletApi.rejectRequest() not connected"));
  },
};
