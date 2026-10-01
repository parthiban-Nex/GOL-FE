import { axiosClient } from "@/services/api/axiosClient";

 
export const reportsApi = {
  /** Stock adjustments. */
  stockAdjustment(body = {}) {
    return axiosClient.post("/parts/GetStockAdjustmentReport", body);
  },
  /** Current stock, one row per GRN line (item_code, item_description,
   * quantity, mrp, cost, uomType, ...). Inventory aggregates it per part. */
  stockPosition(body = {}) {
    return axiosClient.post("/parts/GetStockPositionReport", body);
  },
  /** Stock received by transfer from another outlet. */
  stockTransferInward(body = {}) {
    return axiosClient.post("/parts/GetStockTransferInwardReport", body);
  },
};
