import { axiosClient } from "@/services";

export const itemApi = {
  listKey: "itemData",

  list(body = {}) {
    return axiosClient.post("/items/getItems", body);
  },
  create(payload) {
    return axiosClient.post("/items/createItem", payload);
  },
  update(payload) {
    return axiosClient.post("/items/updateItem", payload);
  },
  getOne(id) {
    return axiosClient.get(`/items/${id}`);
  },
  /** PO part-code search  */
  poSearch(itemCode, itemGroupCodes = []) {
    return axiosClient.post("/items/poSearchItemDetails", {
      itemCode,
      itemGroupCodes,
    });
  },
  /** Price / tax of one item */
  getDetails({ itemCode, modelSegment = "", customerState = "" }) {
    return axiosClient.post("/items/getItemDetails", {
      itemCode,
      modelSegment,
      customerState,
    });
  },
};
