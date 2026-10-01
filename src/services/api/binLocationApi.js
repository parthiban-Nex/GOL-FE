import { axiosClient } from "@/services";

/**
 * Bin Location master (Masters > Bin Locations).
 * List returns { BinLocationsData: { data, totalItems } }.
 */
export const binLocationApi = {
  listKey: "BinLocationsData",

  list(body = {}) {
    return axiosClient.post("/binLocations/listBinLocations", body);
  },
  create(payload) {
    return axiosClient.post("/binLocations/createBinLocation", payload);
  },
  update(payload) {
    return axiosClient.post("/binLocations/editBinLocation", payload);
  },
  /** Bins scoped to one outlet, for parts issue/receipt dropdowns. */
  listForOutlet(payload) {
    return axiosClient.post("/binLocations/listBinLocationsForOutlet", payload);
  },
};
