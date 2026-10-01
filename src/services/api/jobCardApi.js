import { axiosClient } from "@/services/api/axiosClient";

export const jobCardApi = {
  /** listJobCards_v1 -> { JobCardData: { totalItems, data: [] } } */
  listKey: "JobCardData",

  /** POST /jobCard/listJobCards_v1 - body: { searchKey, offset, limit } */
  list(body = {}) {
    return axiosClient.post("/jobCard/listJobCards_v1", body);
  },
  kpis() {
    // TODO: return axiosClient.get("/jobcards/kpis");
    return Promise.reject(new Error("jobCardApi.kpis() is not connected yet."));
  },
  get(id) {
    // TODO: return axiosClient.get(`/jobcards/${id}`);
    return Promise.reject(new Error("jobCardApi.get() is not connected yet."));
  },
  create(payload) {
    // TODO: return axiosClient.post("/jobcards", payload);
    return Promise.reject(
      new Error("jobCardApi.create() is not connected yet."),
    );
  },
  update(id, payload) {
    // TODO: return axiosClient.put(`/jobcards/${id}`, payload);
    return Promise.reject(
      new Error("jobCardApi.update() is not connected yet."),
    );
  },
  remove(id) {
    // TODO: return axiosClient.delete(`/jobcards/${id}`);
    return Promise.reject(
      new Error("jobCardApi.remove() is not connected yet."),
    );
  },
  uploadInspectionImage(id, file) {
    // TODO: return axiosClient.postForm(`/jobcards/${id}/inspection-images`, { file });
    return Promise.reject(
      new Error("jobCardApi.uploadInspectionImage() is not connected yet."),
    );
  },
  /** Uploads the marked template (template + dent/scratch/damage dots
   * flattened into one PNG) for cloud storage. `marks` ({ type, x, y },
   * x/y in percent) go along in case the backend stores them too.
   * Called only on Continue from Inventory & Inspection or on Save, and
   * only when the marks changed.
   * Endpoint + form fields to be connected from the backend spec. */
  saveMarkedImage(jobcardId, { file, marks }) {
    // TODO: connect the backend endpoint (spec pending), e.g. multipart:
    //   const form = new FormData(); form.append(<file field>, file); ...
    //   return axiosClient.postForm(<route>, form);
    return Promise.reject(
      new Error("jobCardApi.saveMarkedImage() is not connected yet."),
    );
  },
  /** Marked images (cloud URLs) from this customer's / vehicle's previous
   * jobcards. Endpoint + params to be connected from the backend spec. */
  getPreviousMarkedImages(params) {
    // TODO: connect the backend endpoint (spec pending).
    return Promise.reject(
      new Error("jobCardApi.getPreviousMarkedImages() is not connected yet."),
    );
  },
  /** Step 1 Save / Add - POST /jobCard/createInitialPortalJobCard
   *  { name, mobileNumber, pinCode, address1, registrationNumber, makeId,
   *    modelId, fuelType, insurance?: {...}, surveyor?: {...} } */
  createInitialPortalJobCard(payload) {
    return axiosClient.post("/jobCard/createInitialPortalJobCard", payload);
  },
  /** Step 2 Save / Continue - POST /jobCard/savePortalJobCardInspection
   *  { jobCardId, odometer, inventory: [{ code, version, type, condition }],
   *    inspection: [{ paramCode, ratingReasonCode, inspectionType,
   *                   checklistTypeCode, checklistVersion, remarks }] } */
  savePortalInspection(payload) {
    return axiosClient.post("/jobCard/savePortalJobCardInspection", payload);
  },
  /** Step 5 - POST /jobCard/getMechanicMapping { transaction_id }
   *  -> { JobCardData: [] } */
  getMechanicMapping(transactionId) {
    return axiosClient.post("/jobCard/getMechanicMapping", {
      transaction_id: transactionId,
    });
  },
  /** Step 5 Submit - POST /jobCard/createMechanicMapping. Payload is the
   * form's own fields for now (backend contract to follow). */
  createMechanicMapping(payload) {
    return axiosClient.post("/jobCard/createMechanicMapping", payload);
  },
  complete(id) {
    // TODO: return axiosClient.post(`/jobcards/${id}/complete`);
    return Promise.reject(
      new Error("jobCardApi.complete() is not connected yet."),
    );
  },
};

/** Status dropdown - job card list filter + Step 6.
 *  GET /jobCard/getTransactionSubstatuses
 *  -> { TransactionSubstatusData: [{ id, title, status }] } */
export const jobCardSubstatusApi = {
  listKey: "TransactionSubstatusData",
  getAll() {
    return axiosClient.get("/jobCard/getTransactionSubstatuses");
  },
};

/** Sub Status dropdown - Step 6. GET /jobCard/getOTDFailureReasons
 *  -> { OTDFailureReasonsData: [] } */
export const otdFailureReasonApi = {
  listKey: "OTDFailureReasonsData",
  getAll() {
    return axiosClient.get("/jobCard/getOTDFailureReasons");
  },
};

/** Step 2 inventory chips - POST /inventoryCheckList/listInventoryCheckList
 *  { searchKey, vehicleType, offset, limit }
 *  -> { InventoryCheckListData: { totalItems, data: [{ ID, INVENTORY_CODE,
 *       INVENTORY_DESC, INVENTORY_VER, INVENTORY_TYPE, SORT_ORDER, ACTIVE }] } } */
export const inventoryCheckListApi = {
  listKey: "InventoryCheckListData",
  list({ vehicleType = "CAR", searchKey = "", offset = 0, limit = 100 } = {}) {
    return axiosClient.post("/inventoryCheckList/listInventoryCheckList", {
      searchKey,
      vehicleType,
      offset,
      limit,
    });
  },
};

/** Step 2 inspection checklist - POST /inspectionCheckList/getInspectionChecklist
 *  { checkListTypeCode } -> { inspectionChecklistData: { checkListTypeCode,
 *     categories: [{ subsystemCode, subsystemName, checkpoints: [{ paramCode,
 *     paramName, inspectionType, checkListVersion, sortOrder, optional,
 *     ratingOptions: [{ ratingReasonCode, ratingReasonDesc }] }] }] } } */
export const inspectionCheckListApi = {
  get(checkListTypeCode = "CHK_LIST_MAJOR") {
    return axiosClient.post("/inspectionCheckList/getInspectionChecklist", {
      checkListTypeCode,
    });
  },
};
