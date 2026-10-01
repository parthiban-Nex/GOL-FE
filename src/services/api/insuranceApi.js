import { axiosClient } from "@/services";
 

export const insuranceApi = {
  listKey: "InsuranceData",
  allKey: "InsuracesData",
 
  list(body = {}) {
    return axiosClient.post("/insurance/listInsurances", body);
  },
  create(payload) {
    return axiosClient.post("/insurance/createInsurance", payload);
  },
  update(payload) {
    return axiosClient.post("/insurance/editInsurance", payload);
  },
  getAll() {
    return axiosClient.get("/insurance/getAllInsurances");
  },
};