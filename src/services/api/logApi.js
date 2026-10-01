import { axiosClient } from "@/services";

export const auditLogApi = {
  // Rows and count both sit at the root of the response.
  listKey: null,

  list(body = {}) {
    return axiosClient.post("/logs/getAuditLog", {
      searchKey: "",
      action: "",
      access: "",
      startDate: "",
      endDate: "",
      ...body,
    });
  },
};

export const userLogApi = {
  // Sequelize findAndCountAll -> { data: { count, rows } }.
  listKey: "data",

  list(body = {}) {
    return axiosClient.post("/users/getUserLogs", body);
  },
};

export const AUDIT_ACTIONS = Object.freeze([
  "GET",
  "VIEW",
  "ADD",
  "UPDATE",
  "DELETE",
]);

export const ACCESS_CHANNELS = Object.freeze(["Portal", "Mobile"]);
