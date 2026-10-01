import { axiosClient } from "@/services";

/**
 * Backend-ready Loyalty endpoints for Finance > Loyalty. Until the
 * backend exists, pages/finance/Loyalty.jsx reads from local mock data.
 * Endpoint names below mirror the Vue file's original service calls
 * so switching to a real backend is a one-line swap per handler.
 */
export const loyaltyApi = {
  /** Summary card - current tier, coin balances. */
  getSummary() {
    // TODO: return axiosClient.get("/loyalty/summary");
    return Promise.reject(new Error("loyaltyApi.getSummary() not connected"));
  },

  /** Tier ladder (Bronze/Silver/Gold/Platinum/Elite) with thresholds. */
  getTiers() {
    // TODO: return axiosClient.get("/loyalty/tiers");
    return Promise.reject(new Error("loyaltyApi.getTiers() not connected"));
  },

  /**
   * Coin history for the chart. `range` is one of "6M" | "1Y".
   * Real endpoint likely takes fromDate/toDate query params instead;
   * translate `range` in the component before calling.
   */
  getMonthlyProgress(range = "6M") {
    // TODO: return axiosClient.get("/loyalty/progress", { params: { range } });
    return Promise.reject(
      new Error("loyaltyApi.getMonthlyProgress() not connected"),
    );
  },

  /** Right-sidebar Monthly Performance card. */
  getMonthlyPerformance() {
    // TODO: return axiosClient.get("/loyalty/performance");
    return Promise.reject(
      new Error("loyaltyApi.getMonthlyPerformance() not connected"),
    );
  },

  /** Promotional coin-unlock challenges. */
  getChallenges() {
    // TODO: return axiosClient.get("/loyalty/challenges");
    return Promise.reject(
      new Error("loyaltyApi.getChallenges() not connected"),
    );
  },
};
