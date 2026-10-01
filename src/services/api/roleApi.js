import { axiosClient } from "@/services";


export const roleApi = {
  listKey: "menuList",

  list(body = {}) {
    return axiosClient.post("/users/getRoles", body);
  },
  /** Secondary roles selectable alongside a user's primary role. */
  listSecondary(body = {}) {
    return axiosClient.post("/users/getSecondryRoles", body);
  },
};
