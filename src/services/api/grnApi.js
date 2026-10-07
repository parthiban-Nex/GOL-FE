import { axiosClient } from "@/services";

export const grnApi = {
  listKey: "grnData",

  list(body = {}) {
    return axiosClient.post("/parts/listGrns", body);
  },
  /** POST /grn/quickAddGrn — used by the quick-add row for brand-new grns. */
  quickAdd(payload) {
    return axiosClient.post("/parts/createGrn", payload);
  },

  getVendor(payload) {
    console.log("getVendor payload", payload);
    return axiosClient.post("/vendors/listVendors", payload);
  },
  searchItemDetails(body) {
    return axiosClient.post("/items/searchItemDetails", body);
  },
  getItemDetails(body) {
    return axiosClient.post("/items/getItemDetails", body);
  },
  getGrns(payload) {
    return axiosClient.post("/parts/GRN", payload);
  },
  getGrnPdf(payload) {
    return axiosClient.post("/parts/Grnpdf", payload);
  },
 validateBulkGrn(formData) {
  return axiosClient.post("/bulkUpload/validateGrnUploads", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    responseType: "blob",
  });
},
createBulkGrn(formData) {
  return axiosClient.post("/bulkUpload/BulkCreateGrn", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    responseType: "blob",
  });
},
updateGrn(payload) {
  return axiosClient.post("/parts/updateGrn", payload);
},
listBinLocation(payload) {
  return axiosClient.post("/binLocations/listBinLocationsForOutlet", payload);
}
}



