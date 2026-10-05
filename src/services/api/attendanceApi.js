import { axiosClient } from "@/services";

/**
 * Backend-ready Attendance endpoints. Until the backend exists,
 * pages/attendance/Attendance.jsx reads from local mock data.
 */
export const attendanceApi = {
   getEmployees(params = {}) {
    return axiosClient.get("/attendance/employees", { params });
  },

  submitRegularisation(payload) {
    const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;
    return axiosClient.post("/attendance/regularisations", payload, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
  },

  getTodayMarkList(params = {}) {
    return axiosClient.get("/attendance/mark", { params });
  },

  saveMarks(payload) {
    return axiosClient.post("/attendance/mark", payload);
  },

  getAnalytics(params = {}) {
    return axiosClient.get("/attendance/analytics", { params });
  },

  getDetailsTable(params = {}) {
    return axiosClient.get("/attendance/details", { params });
  },
   exportAnalytics(params = {}) {
    return axiosClient.get("/attendance/analytics/export", {
      params,
      responseType: "blob",
    });
  },

  exportDetails(params = {}) {
    return axiosClient.get("/attendance/details/export", {
      params,
      responseType: "blob",
    });
  },
};
