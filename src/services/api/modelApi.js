import { axiosClient } from "@/services";

export const modelApi = {
  listKey: "ItemGroupData",

  list(body = {}) {
    return axiosClient.post("/models/getModelList", body);
  },
  create(payload) {
    return axiosClient.post("/models/createmodel", payload);
  },
  update(payload) {
    return axiosClient.post("/models/updateModel", payload);
  },
  getAll(body = {}) {
    return axiosClient.post("/models/getAllModels", body);
  },
  /** Models under one make - used by Item Master's dependent dropdown. */
  getForMake(makeId) {
    return axiosClient.post("/models/getModelsByMake", { makeId });
  },
  /** Variants mapped to one model. Returns { VarientData: [...] }. */
  getVariantsForModel(modelId) {
    return axiosClient.post("/models/getVarientByModel", { modelId });
  },
};
export const MODEL_SEGMENTS = Object.freeze(["A", "B", "C", "D", "E"]);
