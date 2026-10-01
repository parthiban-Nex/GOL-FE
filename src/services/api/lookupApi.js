import { axiosClient } from "@/services";


export const companyApi = {
  listKey: "companyData",
  getAll() {
    return axiosClient.get("/companies/getAllCompany");
  },
};

export const bankApi = {
  listKey: "BankData",
  getAll() {
    return axiosClient.get("/dsaagent/getAllBanks");
  },
};


export const pincodeApi = {
  lookup(pinCode) {
    return axiosClient.post("/vendors/getPincodeData", { pinCode });
  },

  searchArea(searchKey) {
    return axiosClient.post("/vendors/searchAreaName", { searchKey });
  },
};


export const OUTLET_SEGMENTS = Object.freeze(["A", "B", "C", "D"]);

export const VENDOR_TYPES = Object.freeze(["OSL", "Parts"]);
