import { axiosClient } from "@/services/api/axiosClient";

export const bankDepositApi = {
  listDeposits(body = {}) {
    return axiosClient.post("/bankDeposit/listBankDeposits", body);
  },

  getStats(body = {}) {
    return axiosClient.post("/bankDeposit/getBankDepositStats", body);
  },

  getDeposit(id) {
    return axiosClient.post("/bankDeposit/getBankDeposit", { id });
  },

  createDeposit(payload) {
    if (payload instanceof FormData) {
      return axiosClient.post("/bankDeposit/createBankDeposit", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return axiosClient.post("/bankDeposit/createBankDeposit", payload);
  },

  updateDeposit(idOrPayload, maybePayload) {
    let payload = idOrPayload;
    if (maybePayload !== undefined) {
      if (maybePayload instanceof FormData) {
        maybePayload.set("id", idOrPayload);
        payload = maybePayload;
      } else {
        payload = { ...maybePayload, id: idOrPayload };
      }
    }
    if (payload instanceof FormData) {
      return axiosClient.post("/bankDeposit/editBankDeposit", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return axiosClient.post("/bankDeposit/editBankDeposit", payload);
  },

  removeDeposit(id) {
    return axiosClient.post("/bankDeposit/deleteBankDeposit", { id });
  },

  uploadSlip(id, file) {
    const formData = new FormData();
    formData.append("id", id);
    formData.append("slip", file);
    return axiosClient.post("/bankDeposit/uploadDepositSlip", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  exportCsv(params = {}) {
    return axiosClient.post("/bankDeposit/listBankDeposits", params);
  },

  listEditHistories(body = {}) {
    return axiosClient.post("/bankDeposit/listEditHistories", body);
  },
};
