
import { axiosClient } from "@/services";

export const variantApi = {
  listKey: "varientData",
 
  list(body = {}) {
    return axiosClient.post("/varient/listVarients", body);
  },
  create(payload) {
    return axiosClient.post("/varient/createVarient", payload);
  },
  update(payload) {
    return axiosClient.post("/varient/editVarient", payload);
  },
  getAll() {
    return axiosClient.get("/varient/getAllVariants");
  },
  /** Fuel types, for forms that need them. */
  getFuelTypes() {
    return axiosClient.get("/varient/getFuelTypes");
  },
};
 