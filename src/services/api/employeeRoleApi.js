import { axiosClient } from "@/services";


export const employeeRoleApi = {
  listKey: "employeeRoleData",

  list(body = {}) {
    return axiosClient.post("/employeerole/listEmployeeRoles", body);
  },
  create(payload) {
    return axiosClient.post("/employeerole/createEmployeeRole", payload);
  },
  update(payload) {
    return axiosClient.post("/employeerole/editEmployeeRole", payload);
  },
  /** Full unfiltered list, for dropdowns (e.g. Employee master's Role field). */
  getAll() {
    return axiosClient.get("/employeerole/getAllEmployeeRoles");
  },
};
