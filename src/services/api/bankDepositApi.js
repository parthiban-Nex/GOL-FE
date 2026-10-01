import { axiosClient } from "@/services";

/**
 * Backend-ready Bank Deposit endpoints for Finance > Bank Deposit.
 * Until the backend exists, pages/finance/BankDeposit.jsx reads from
 * local mock data. Swap each mock initializer for one of the calls
 * below when the backend is live.
 */
export const bankDepositApi = {
  listDeposits(params) {
    // TODO: return axiosClient.get("/finance/bank-deposits", { params });
    return Promise.reject(
      new Error("bankDepositApi.listDeposits() not connected"),
    );
  },
  getStats(params) {
    // TODO: return axiosClient.get("/finance/bank-deposits/stats", { params });
    return Promise.reject(new Error("bankDepositApi.getStats() not connected"));
  },
  createDeposit(payload) {
    // TODO: return axiosClient.post("/finance/bank-deposits", payload);
    return Promise.reject(
      new Error("bankDepositApi.createDeposit() not connected"),
    );
  },
  updateDeposit(id, payload) {
    // TODO: return axiosClient.put(`/finance/bank-deposits/${id}`, payload);
    return Promise.reject(
      new Error("bankDepositApi.updateDeposit() not connected"),
    );
  },
  removeDeposit(id) {
    // TODO: return axiosClient.delete(`/finance/bank-deposits/${id}`);
    return Promise.reject(
      new Error("bankDepositApi.removeDeposit() not connected"),
    );
  },
  uploadSlip(id, file) {
    // TODO: return axiosClient.postForm(`/finance/bank-deposits/${id}/slip`, { file });
    return Promise.reject(
      new Error("bankDepositApi.uploadSlip() not connected"),
    );
  },
};
