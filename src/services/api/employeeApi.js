import { axiosClient } from "@/services";

export const employeeApi = {
  listKey: "employeeData",

  list(body = {}) {
    return axiosClient.post("/employee/listEmployee", body);
  },
  create(payload) {
    return axiosClient.post("/employee/createEmployee", payload);
  },
  update(payload) {
    return axiosClient.post("/employee/editEmployee", payload);
  },
  remove(payload) {
    return axiosClient.post("/employee/deleteEmployee", payload);
  },
  getAll() {
    return axiosClient.get("/employee/getAllEmployee");
  },
  mechanicsListKey: "employeeData",
  getMechanics(body = {}) {
    return axiosClient.post("/employee/getMechanics", body);
  },
};
