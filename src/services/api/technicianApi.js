import { axiosClient } from "@/services";


export const technicianApi = {
  listKey: "TechnicianData",

  list(body = {}) {
    return axiosClient.post("/technician/getAllTechnicians", body);
  },
  create(payload) {
    return axiosClient.post("/technician/create", payload);
  },
  update(payload) {
    return axiosClient.post("/technician/editTechnician", payload);
  },
};
