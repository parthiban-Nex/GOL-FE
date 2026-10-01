import { axiosClient } from "@/services/api/axiosClient";

export const estimateApi = {
  /** listServiceEstimate  */
  listKey: "ServiceEstimateData",

  list(body = {}) {
    return axiosClient.post("/serviceEstimate/listServiceEstimate", body);
  },

  searchLineItems(searchQuery) {
    return axiosClient.post("/serviceEstimate/searchEstimateLineItems", {
      searchQuery,
    });
  },

  /** Always a fresh copy: the backend sends `Cache-Control: public,
   *  max-age=10` on this GET, so without `_ts` the browser can answer from
   *  its disk cache with data from before the last update (e.g. the old
   *  gstStatus right after the GST toggle). `_ts` is ignored by the API. */
  get(id) {
    return axiosClient.get("/serviceEstimate/getEstimate", {
      params: { id, _ts: Date.now() },
    });
  },

  generatePdf(id) {
    return axiosClient.get("/serviceEstimate/generatePDF", {
      // Fresh PDF after every save, never a cached one (see get()).
      params: { id, _ts: Date.now() },
      responseType: "blob",
    });
  },

  create(payload) {
    return axiosClient.post("/serviceEstimate/createServiceEstimate", payload);
  },

  update(payload) {
    return axiosClient.post("/serviceEstimate/updateServiceEstimate", payload);
  },

  getLineItemDetails(body) {
    return axiosClient.post(
      "/serviceEstimate/getEstimateLineItemDetails",
      body,
    );
  },
  shareOnWhatsApp(estimateId) {
    return axiosClient.post("/serviceEstimate/shareEstimateOnWhatsApp", {
      estimateId,
    });
  },
  /** Create Jobcard*/
  approve(estimateId) {
    return axiosClient.post("/serviceEstimate/approveServiceEstimate", {
      estimateId,
    });
  },
};
