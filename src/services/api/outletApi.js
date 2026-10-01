import { axiosClient } from "@/services";

/**
 * Outlet master (Masters > Outlets).
 * List returns { OutletData: { data, totalItems } } - note the
 * capitalised envelope key, which is what the backend actually sends.
 */
export const outletApi = {
  listKey: "OutletData",

  list(body = {}) {
    return axiosClient.post("/outlets/listOutlets", body);
  },
  create(payload) {
    return axiosClient.post("/outlets/createOutlet", payload);
  },
  update(payload) {
    return axiosClient.post("/outlets/editOutlet", payload);
  },
  /** Full unfiltered list, for dropdowns (Bin Location, Technician,
   * Employee outlet mapping). */
  getAll() {
    return axiosClient.get("/outlets/getallOutlets");
  },
};
