import { axiosClient } from "@/services";

export const authApi = {
  login({ employeeId, password }) {
    return axiosClient.post("/users/login", {
      employeeCode: employeeId,
      password,
    });
  },

  verifyPin({ pin, employeeId }) {
    return axiosClient.post("/users/authV2", {
      pin,
      userId: employeeId,
    });
  },

  logout() {
    return axiosClient.post("/users/logout");
  },

  forgotPassword(email) {
    return axiosClient.post("/users/forgetPassword", { email });
  },
};
