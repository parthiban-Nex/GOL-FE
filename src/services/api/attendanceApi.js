import { axiosClient } from "@/services";

/**
 * Backend-ready Attendance endpoints. Until the backend exists,
 * pages/attendance/Attendance.jsx reads from local mock data.
 */
export const attendanceApi = {
  /** Full year attendance grid for one employee (Jan..Dec). */
  getYearGrid(employeeId, year) {
    // TODO: return axiosClient.get(`/attendance/${employeeId}/year/${year}`);
    return Promise.reject(
      new Error("attendanceApi.getYearGrid() not connected"),
    );
  },

  /** Regularisation request (Forgot Punch / Wrong Punch / etc.). */
  submitRegularisation(payload) {
    // TODO: return axiosClient.post("/attendance/regularisations", payload);
    return Promise.reject(
      new Error("attendanceApi.submitRegularisation() not connected"),
    );
  },

  /** Today's mark-attendance list for shift managers. */
  getTodayMarkList(params) {
    // TODO: return axiosClient.get("/attendance/mark", { params });
    return Promise.reject(
      new Error("attendanceApi.getTodayMarkList() not connected"),
    );
  },

  /** Batch-save marks for the mark-attendance table. */
  saveMarks(payload) {
    // TODO: return axiosClient.post("/attendance/mark/bulk", payload);
    return Promise.reject(new Error("attendanceApi.saveMarks() not connected"));
  },

  /** Analytics chart data (per-week averages) for a date range. */
  getAnalytics(params) {
    // TODO: return axiosClient.get("/attendance/analytics", { params });
    return Promise.reject(
      new Error("attendanceApi.getAnalytics() not connected"),
    );
  },

  /** Employee attendance details table for a date range. */
  getDetailsTable(params) {
    // TODO: return axiosClient.get("/attendance/details", { params });
    return Promise.reject(
      new Error("attendanceApi.getDetailsTable() not connected"),
    );
  },

  exportCsv(params) {
    // TODO: return axiosClient.get("/attendance/export", { params, responseType: "blob" });
    return Promise.reject(new Error("attendanceApi.exportCsv() not connected"));
  },
};
