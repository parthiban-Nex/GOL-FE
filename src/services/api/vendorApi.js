import { axiosClient } from "@/services";

export const vendorApi = {
  listKey: "vendorData",

  list(body = {}) {
    return axiosClient.post("/vendors/listVendors", body);
  },
  create(payload) {
    return axiosClient.post("/vendors/createVendor", payload);
  },
  update(payload) {
    return axiosClient.post("/vendors/editVendor", payload);
  },
  getOne(id) {
    return axiosClient.get(`/vendors/${id}`);
  },
  listForPo(body = {}) {
    return axiosClient.post("/vendors/listVendorsForPo", body);
  },
};
