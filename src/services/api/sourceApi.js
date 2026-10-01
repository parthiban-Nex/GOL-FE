import { axiosClient } from "@/services";

export const sourceApi = {
  listKey: "sourceData",

  list(body = {}) {
    return axiosClient.post("/sources/listSource", body);
  },
  create(payload) {
    return axiosClient.post("/sources/createSource", payload);
  },
  update(payload) {
    return axiosClient.post("/sources/editSource", payload);
  },
  getAll(body = {}) {
    return axiosClient.post("/sources/getAllSources", body);
  },
};

export const sourceTypeApi = {
  listKey: "sourceTypeData",

  list(body = {}) {
    return axiosClient.post("/sourcetypes/listSourceTypes", body);
  },
  create(payload) {
    return axiosClient.post("/sourcetypes/createSourceType", payload);
  },
  update(payload) {
    return axiosClient.post("/sourcetypes/editSourceType", payload);
  },
  getForSource(sourceId) {
    return axiosClient.post("/sourcetypes/getSourceTypesBySource", {
      sourceId,
    });
  },
};
