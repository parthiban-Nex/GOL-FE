import { axiosClient } from "@/services";
/** Item Group. List -> { ItemGroupData: { data, totalItems } } */
export const itemGroupApi = {
  listKey: "ItemGroupData",
  list(body = {}) {
    return axiosClient.post("/itemgroups/listItemGroups", body);
  },
  create(payload) {
    return axiosClient.post("/itemgroups/create", payload);
  },
  update(payload) {
    return axiosClient.post("/itemgroups/editItemGroup", payload);
  },
  getAll() {
    return axiosClient.get("/itemgroups/getItemGroups");
  },
};

/** Item Category. List -> { itemData: { data, totalItems } } */
export const itemCategoryApi = {
  listKey: "itemData",
  allKey: "ItemCategorieData",
  list(body = {}) {
    return axiosClient.post("/itemcategories/getItemCategoryList", body);
  },
  create(payload) {
    return axiosClient.post("/itemcategories/createItemCategory", payload);
  },
  update(payload) {
    return axiosClient.post("/itemcategories/updateItemCategory", payload);
  },
  getAll() {
    return axiosClient.get("/itemcategories/getAllItemCategory");
  },
};

/** UOM. List -> { UomData: { data, totalItems } } */
export const uomApi = {
  listKey: "UomData",
  list(body = {}) {
    return axiosClient.post("/uom/getUomList", body);
  },
  create(payload) {
    return axiosClient.post("/uom/addUom", payload);
  },
  update(payload) {
    return axiosClient.post("/uom/editUom", payload);
  },
  getAll() {
    return axiosClient.get("/uom/listUom");
  },
};

/** HSN. List -> { hsnData: { data, totalItems } } */
export const hsnApi = {
  listKey: "hsnData",
  list(body = {}) {
    return axiosClient.post("/hsns/listHsn", body);
  },
  create(payload) {
    return axiosClient.post("/hsns/create", payload);
  },
  update(payload) {
    return axiosClient.post("/hsns/editHsn", payload);
  },
  getAll() {
    return axiosClient.get("/hsns/getAllHsn");
  },
  /** One HSN record - Item Master reads `tax` off this to fill its
   * read-only Tax Percentage field. */
  getOne(id) {
    return axiosClient.post("/hsns/getHsn", { id });
  },
};

/** Aggregate. List -> { aggregateData: { data, totalItems } } */
export const aggregateApi = {
  listKey: "aggregateData",
  list(body = {}) {
    return axiosClient.post("/aggregates/listAggregates", body);
  },
  create(payload) {
    return axiosClient.post("/aggregates/create", payload);
  },
  update(payload) {
    return axiosClient.post("/aggregates/editAggregate", payload);
  },
  getAll() {
    return axiosClient.get("/aggregates/allAggregates");
  },
};

/** Sub Aggregate. List -> { subAggregateData: { data, totalItems } }
 * Rows carry `aggregateName` alongside `aggregateId`. */
export const subAggregateApi = {
  listKey: "subAggregateData",
  list(body = {}) {
    return axiosClient.post("/subaggregates/listSubaggregates", body);
  },
  create(payload) {
    return axiosClient.post("/subaggregates/create", payload);
  },
  update(payload) {
    return axiosClient.post("/subaggregates/editSubAggregate", payload);
  },
  getAll() {
    return axiosClient.get("/subaggregates/allSubaggregates");
  },
  /** Sub-aggregates under one aggregate - Item Master's dependent
   * dropdown. */
  getForAggregate(id) {
    return axiosClient.post("/subaggregates/getSubaggregates", { id });
  },
};


export const HSN_TAX_RATES = Object.freeze([12, 18, 28]);
