import { axiosClient } from "@/services";

export const dashboardApi = {
  summary(body = {}) {
    return axiosClient.post("/jobCard/dashboard", body);
  },

  /* EPRO trend. Confirmed: needs `type` or the backend defaults oddly - keep it explicit. */
  eproTrend(body = { option: "monthly", type: "RJC" }) {
    return axiosClient.post("/jobCard/dashboard_epro", body);
  },

  revenue(body = {}) {
    return axiosClient.post("/jobCard/dashboard_revenue", body);
  },

  /** Vehicle inflow, split by mech/body per period. Needs sourceTypeId + flow. */
  vehicleFlow(body = { option: "monthly", sourceTypeId: "", flow: "inflow" }) {
    return axiosClient.post("/jobCard/dashboard_vehicle_flow", body);
  },

  /** UNCLEAR PURPOSE: returns the same { period, mech, body } shape as
   * vehicleFlow above, not new/repeat counts - see note in useDashboardAnalytics.
   * Kept wired but not currently rendered anywhere. Confirm with backend. */
  ajcRjc(body = { option: "monthly" }) {
    return axiosClient.post("/jobCard/dashboard_ajc_rjc", body);
  },

  /** Labour vs parts series */
  labourParts(body = { option: "monthly" }) {
    return axiosClient.post("/jobCard/dashboard_labour_parts", body);
  },

  /** Customer summary - this is what actually backs "New vs Repeat". */
  customerSummary(body = { option: "monthly" }) {
    return axiosClient.post("/jobCard/dashboard_customer_summary", body);
  },

  /** Purchase-from-myTVS trend */
  purchaseFromMytvs(body = { option: "monthly" }) {
    return axiosClient.post("/parts/dashboardPurchaseFromMytvs", body);
  },

  inventoryStock() {
    return axiosClient.get("/parts/GetInventoryStockForGMS");
  },
  sourceTypes(body = {}) {
    return axiosClient.post("/sourcetypes/getAllSourceTypes", body);
  },
};
