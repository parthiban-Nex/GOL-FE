import { axiosClient } from "@/services";

export const purchaseReturnApi = {
  listKey: "purchaseReturnData",
  listGrns(body = {}) {
    return axiosClient.post("/parts/GRN", body);
  },
  list(body = {}) {
    return axiosClient.post("/parts/GetPurchaseReturn", body);
  },
  quickAdd(payload) {
    return axiosClient.post("/parts/CreatePurchaseReturn", payload
);
  },

  getGrnsForPurchaseReturn(payload) {
    return axiosClient.post("/parts/GetGRNForPurchaseReturn", payload);
  },
  getPurchaseReturnReport(payload) {
    return axiosClient.post("/parts/GetPurchaseReturnReport", payload,{
    responseType: "blob",
  });
  },

}



