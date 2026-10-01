import { axiosClient } from "@/services";

/**
 * Backend-ready Salary endpoints for Attendance & Salary > Salary tab.
 */
export const salaryApi = {
  listSalaries(params) {
    // TODO: return axiosClient.get("/salaries", { params });
    return Promise.reject(new Error("salaryApi.listSalaries() not connected"));
  },
  getHeaderStats(params) {
    // TODO: return axiosClient.get("/salaries/stats", { params });
    return Promise.reject(
      new Error("salaryApi.getHeaderStats() not connected"),
    );
  },
  addSalary(payload) {
    // TODO: return axiosClient.post("/salaries", payload);
    return Promise.reject(new Error("salaryApi.addSalary() not connected"));
  },
  updateSalary(id, payload) {
    // TODO: return axiosClient.put(`/salaries/${id}`, payload);
    return Promise.reject(new Error("salaryApi.updateSalary() not connected"));
  },
  downloadSlip(id) {
    // TODO: return axiosClient.get(`/salaries/${id}/slip`, { responseType: "blob" });
    return Promise.reject(new Error("salaryApi.downloadSlip() not connected"));
  },
  listPayslipBatches(params) {
    // TODO: return axiosClient.get("/salaries/batches", { params });
    return Promise.reject(
      new Error("salaryApi.listPayslipBatches() not connected"),
    );
  },
  downloadBankFile(batchId) {
    // TODO: return axiosClient.get(`/salaries/batches/${batchId}/bank`, { responseType: "blob" });
    return Promise.reject(
      new Error("salaryApi.downloadBankFile() not connected"),
    );
  },
};
