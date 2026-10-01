import { axiosClient } from "@/services";

export const makeApi = {
  listKey: "MakeData",
  isPaged: false,
 
  list(body = {}) {
    return axiosClient.post("/makes/listMakes", body);
  },
  create(payload) {
    return axiosClient.post("/makes/create", payload);
  },
  update(payload) {
    return axiosClient.post("/makes/editMake", payload);
  },
  getAll(body = {}) {
    return axiosClient.post("/makes/getAllMakes", body);
  },
  /** Single make WITH its company mappings - the list endpoint omits
   * them, so the edit form has to fetch this to prefill Company. */
  getOne(id) {
    return axiosClient.get(`/makes/${id}`);
  },
};