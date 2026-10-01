import { axiosClient } from "@/services";

export const appointmentApi = {
  listKey: "appointmentData",
  list(payload) {
    return axiosClient.post("/serviceBooking/listAppointments", payload);
  },
  create(payload) {
    return axiosClient.post("/serviceBooking/createServiceBooking", payload);
  },
  update(payload) {
    return axiosClient.post("/serviceBooking/editServiceBooking", payload);
  },
};

/** Advisor dropdown — toolbar filter + appointment form. */
export const advisorApi = {
  listKey: "employeeData",
  getAll() {
    return axiosClient.get("/employee/getServiceAdvisors");
  },
};

/** Service-type dropdown — same two places. */
export const serviceTypeApi = {
  listKey: "serviceTypeData",
  getAll() {
    return axiosClient.post("/servicetypes/getAllServiceTypes");
  },
};


export const pickupDropDriverApi = {
  listKey: "data",
  getAll() {
    return axiosClient.post("/pickupDropoff/drivers");
  },
};
