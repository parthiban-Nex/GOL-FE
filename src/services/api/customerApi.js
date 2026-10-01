import { axiosClient } from "@/services";

export const customerApi = {
  listKey: "customerData",

  list(body = {}) {
    return axiosClient.post("/customer/listCustomers", body);
  },
  /** POST /customer/quickAddCustomer — used by the quick-add row for brand-new customers. */
  quickAdd(payload) {
    return axiosClient.post("/customer/quickAddCustomer", payload);
  },

  updateDetails(payload) {
    return axiosClient.post("/customer/updateCustomerVehicleDetails", payload);
  },

  updateVehicleInsurance(payload) {
    return axiosClient.post(
      "/customer/updateCustomerVehicleInsurance",
      payload,
    );
  },
  getOne(body) {
    return axiosClient.post("/customer/getCustomerData", body);
  },
  search(body) {
    return axiosClient.post("/customer/searchCustomer", body);
  },
  getVehicleNumbers(payload) {
    return axiosClient.post("/customer/getCustomerVehicleNumbers", payload);
  },
  approve(payload) {
    return axiosClient.post("/customer/approveCustomer", payload);
  },
};

/** Profile Category dropdown in the details modal. */
export const customerCategoryApi = {
  listKey: "customercategoryData",
  getAll() {
    return axiosClient.get("/customer/getAllCustomercategories");
  },
};

/** Reg.No. autofill in the quick-add row. */
export const vehicleApi = {
  getByRegNo(registrationNumber) {
    return axiosClient.post("/vehicle/getVehicleDetailsByRegNo", {
      registrationNumber,
    });
  },
};

// billTypeApi still commented out — no spec for it yet.
// export const billTypeApi = {
//   listKey: "billTypesData",
//   getAll() {
//     return axiosClient.get("/customer/getAllBilltypes");
//   },
// };
