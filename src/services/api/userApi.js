import { axiosClient } from "@/services";

export const userApi = {
  listKey: "userdata",

  list(body = {}) {
    return axiosClient.post("/users/listUsers", body);
  },
  create(payload) {
    return axiosClient.post("/users/createUser", payload);
  },
  update(payload) {
    return axiosClient.post("/users/updateUser", payload);
  },
  remove(payload) {
    return axiosClient.post("/users/deleteUser", payload);
  },
  resetPassword(payload) {
    return axiosClient.post("/users/resetPassword", payload);
  },
};
