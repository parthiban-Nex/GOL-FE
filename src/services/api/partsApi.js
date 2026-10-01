import { axiosClient } from "./axiosClient";
import {
  initialSpareIssues,
  initialGrnDirectList,
  initialAutoGrnList,
  initialPurchaseOrderList,
  initialStockTransfers,
  initialPurchaseReturnInvoices,
  initialPurchaseReturns,
  MOCK_WORKSHOPS,
} from "@/pages/parts/mockPartsData";

const USE_BACKEND_API = false;

let localSpareIssues = [...initialSpareIssues];
let localGrnDirectList = [...initialGrnDirectList];
let localAutoGrnList = [...initialAutoGrnList];
let localPurchaseOrderList = [...initialPurchaseOrderList];
let localStockTransfers = [...initialStockTransfers];
let localPurchaseReturnInvoices = [...initialPurchaseReturnInvoices];
let localPurchaseReturns = [...initialPurchaseReturns];
let localWorkshops = [...MOCK_WORKSHOPS];

export const partsApi = {
  /** POST /purchaseOrder/getPO  */
  poListKey: "data",

  /** body: { limit, offset, searchKey } */
  getPoList(body = {}) {
    return axiosClient.post("/purchaseOrder/getPO", body);
  },

  /** Edit / View -  */
  getPoForView(id) {
    return axiosClient.post("/purchaseOrder/GetPOForView", { id });
  },


  savePo({ podata, poparts, file }) {
    const form = new FormData();
    form.append("podata", JSON.stringify(podata));
    form.append("poparts", JSON.stringify(poparts));
    if (file) form.append("file", file);

    return axiosClient.postForm("/purchaseOrder/createPO", form);
  },

  grnListKey: "data",

  getGrnList(body = {}) {
    return axiosClient.post("/parts/GRN", body);
  },

  getGrnDetail(id) {
    return axiosClient.post("/parts/Grnpdf", { id });
  },

  spareIssueListKey: "data",
  getSpareIssueJobCards(body = {}) {
    return axiosClient.post("/jobCard/getAllJobCardsForOutlets", body);
  },

  async getSpareIssues(params = {}) {
    if (!USE_BACKEND_API) {
      await simulateDelay(150);
      let results = [...localSpareIssues];

      if (params.search) {
        const q = params.search.toLowerCase().trim();
        results = results.filter(
          (item) =>
            item.jobcardNo?.toLowerCase().includes(q) ||
            item.regNo?.toLowerCase().includes(q) ||
            item.make?.toLowerCase().includes(q) ||
            item.model?.toLowerCase().includes(q) ||
            item.items?.some(
              (p) =>
                p.partNo?.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q),
            ),
        );
      }

      if (params.make && params.make !== "ALL") {
        results = results.filter((item) => item.make === params.make);
      }

      if (params.approvedOnly) {
        results = results.filter((item) => item.partsApprove);
      }

      if (params.fromDate) {
        results = results.filter((item) => item.status >= params.fromDate);
      }

      if (params.toDate) {
        results = results.filter((item) => item.status <= params.toDate);
      }

      return {
        items: results,
        total: results.length,
      };
    }

    return axiosClient.get("/parts/spare-issues", { params });
  },

  async getSpareIssueById(id) {
    if (!USE_BACKEND_API) {
      await simulateDelay(100);
      const found = localSpareIssues.find(
        (s) => s.id === id || s.jobcardNo === id,
      );
      if (!found) throw new Error("Spare issue record not found");
      return found;
    }
    return axiosClient.get(`/parts/spare-issues/${id}`);
  },

  async updateSpareIssue(id, updateData) {
    if (!USE_BACKEND_API) {
      await simulateDelay(150);
      localSpareIssues = localSpareIssues.map((item) =>
        item.id === id || item.jobcardNo === id
          ? { ...item, ...updateData }
          : item,
      );
      return localSpareIssues.find((s) => s.id === id || s.jobcardNo === id);
    }
    return axiosClient.put(`/parts/spare-issues/${id}`, updateData);
  },

  async issueParts(jobcardNo, issuedItems) {
    if (!USE_BACKEND_API) {
      await simulateDelay(200);
      localSpareIssues = localSpareIssues.map((item) => {
        if (item.jobcardNo === jobcardNo) {
          return {
            ...item,
            partsApprove: true,
            items: item.items.map((it) => {
              const matching = issuedItems.find((p) => p.partNo === it.partNo);
              if (matching) {
                return {
                  ...it,
                  issuedQty: matching.issuedQty ?? it.reqQty,
                  status: "Issued",
                };
              }
              return it;
            }),
          };
        }
        return item;
      });
      return { success: true, message: "Parts issued successfully" };
    }
    return axiosClient.post(`/parts/spare-issues/${jobcardNo}/issue`, {
      items: issuedItems,
    });
  },

  // ===================== GRN DIRECT =====================

  async getGrnDirectList(params = {}) {
    if (!USE_BACKEND_API) {
      await simulateDelay(150);
      let results = [...localGrnDirectList];

      if (params.search) {
        const q = params.search.toLowerCase().trim();
        results = results.filter(
          (item) =>
            item.grnNumber?.toLowerCase().includes(q) ||
            item.poNumber?.toLowerCase().includes(q) ||
            item.vendorCode?.toLowerCase().includes(q) ||
            item.supplierInvoiceNumber?.toLowerCase().includes(q) ||
            item.vendorName?.toLowerCase().includes(q) ||
            item.items?.some(
              (p) =>
                p.partNo?.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q),
            ),
        );
      }

      if (params.vendorCode && params.vendorCode !== "ALL") {
        results = results.filter(
          (item) => item.vendorCode === params.vendorCode,
        );
      }

      if (params.fromDate) {
        results = results.filter((item) => item.invoiceDate >= params.fromDate);
      }

      if (params.toDate) {
        results = results.filter((item) => item.invoiceDate <= params.toDate);
      }

      return {
        items: results,
        total: results.length,
      };
    }

    return axiosClient.get("/parts/grn-direct", { params });
  },

  async getGrnDirectById(id) {
    if (!USE_BACKEND_API) {
      await simulateDelay(100);
      const found = localGrnDirectList.find(
        (g) => g.id === id || g.grnNumber === id,
      );
      if (!found) throw new Error("GRN record not found");
      return found;
    }
    return axiosClient.get(`/parts/grn-direct/${id}`);
  },

  async createGrnDirect(grnPayload) {
    if (!USE_BACKEND_API) {
      await simulateDelay(250);
      const nextIdNum = String(localGrnDirectList.length + 11).padStart(6, "0");
      const nextGrnNumber = `SNV-VLR26-${nextIdNum}`;

      const newRecord = {
        id: `GRN-${String(localGrnDirectList.length + 1).padStart(3, "0")}`,
        grnNumber: nextGrnNumber,
        poNumber: grnPayload.poNumber || `ASP-VCC819-${nextIdNum}`,
        vendorCode: grnPayload.vendorCode || "RA-14",
        vendorName: grnPayload.vendorName || "Royal Auto Spares",
        supplierInvoiceNumber:
          grnPayload.supplierInvoiceNumber ||
          `INV-${Date.now().toString().slice(-4)}`,
        invoiceDate:
          grnPayload.invoiceDate || new Date().toISOString().slice(0, 10),
        grandTotal: Number(grnPayload.grandTotal || 0),
        hasCart: true,
        lrNumber: grnPayload.lrNumber || "",
        lrDate: grnPayload.lrDate || "",
        transportName: grnPayload.transportName || "",
        eSugamNumber: grnPayload.eSugamNumber || "",
        freightCharges: Number(grnPayload.freightCharges || 0),
        miscellaneousCharges: Number(grnPayload.miscellaneousCharges || 0),
        items: grnPayload.items || [],
      };

      localGrnDirectList = [newRecord, ...localGrnDirectList];
      return newRecord;
    }

    return axiosClient.post("/parts/grn-direct", grnPayload);
  },

  async uploadGrnBulkCsv(file) {
    if (!USE_BACKEND_API) {
      await simulateDelay(400);
      return {
        success: true,
        importedCount: 3,
        message: "CSV processed successfully. 3 GRN records created.",
      };
    }

    const formData = new FormData();
    formData.append("file", file);
    return axiosClient.post("/parts/grn-direct/bulk-csv", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  // ===================== AUTO GRN =====================

  async getAutoGrnList(params = {}) {
    if (!USE_BACKEND_API) {
      await simulateDelay(150);
      let results = [...localAutoGrnList];

      if (params.search) {
        const q = params.search.toLowerCase().trim();
        results = results.filter(
          (item) =>
            item.grnNumber?.toLowerCase().includes(q) ||
            item.vendorCode?.toLowerCase().includes(q) ||
            item.status?.toLowerCase().includes(q) ||
            item.vendorName?.toLowerCase().includes(q),
        );
      }

      if (params.vendorCode && params.vendorCode !== "ALL") {
        results = results.filter(
          (item) => item.vendorCode === params.vendorCode,
        );
      }

      if (params.fromDate) {
        results = results.filter((item) => item.invoiceDate >= params.fromDate);
      }

      if (params.toDate) {
        results = results.filter((item) => item.invoiceDate <= params.toDate);
      }

      return {
        items: results,
        total: results.length,
      };
    }

    return axiosClient.get("/parts/auto-grn", { params });
  },

  async getAutoGrnById(id) {
    if (!USE_BACKEND_API) {
      await simulateDelay(100);
      const found = localAutoGrnList.find(
        (g) => g.id === id || g.grnNumber === id,
      );
      if (!found) throw new Error("Auto GRN record not found");
      return found;
    }
    return axiosClient.get(`/parts/auto-grn/${id}`);
  },

  async createAutoGrn(grnPayload) {
    if (!USE_BACKEND_API) {
      await simulateDelay(250);
      const nextIdNum = String(localAutoGrnList.length + 11).padStart(6, "0");
      const nextGrnNumber = `SNV-VLR26-${nextIdNum}`;

      const newRecord = {
        id: `AGRN-${String(localAutoGrnList.length + 1).padStart(3, "0")}`,
        grnNumber: nextGrnNumber,
        poNumber: grnPayload.poNumber || `ASP-VCC819-${nextIdNum}`,
        vendorCode: grnPayload.vendorCode || "RA-14",
        vendorName: grnPayload.vendorName || "Royal Auto Spares",
        supplierInvoiceNumber:
          grnPayload.supplierInvoiceNumber ||
          `INV-${Date.now().toString().slice(-4)}`,
        invoiceDate:
          grnPayload.invoiceDate || new Date().toISOString().slice(0, 10),
        status: "Completed",
        grandTotal: Number(grnPayload.grandTotal || 0),
        lrNumber: grnPayload.lrNumber || "",
        lrDate: grnPayload.lrDate || "",
        transportName: grnPayload.transportName || "",
        eSugamNumber: grnPayload.eSugamNumber || "",
        freightCharges: Number(grnPayload.freightCharges || 0),
        miscellaneousCharges: Number(grnPayload.miscellaneousCharges || 0),
        items: grnPayload.items || [],
      };

      localAutoGrnList = [newRecord, ...localAutoGrnList];
      return newRecord;
    }

    return axiosClient.post("/parts/auto-grn", grnPayload);
  },

  // ===================== PURCHASE ORDER =====================

  async getPurchaseOrders(params = {}) {
    if (!USE_BACKEND_API) {
      await simulateDelay(150);
      let results = [...localPurchaseOrderList];

      if (params.search) {
        const q = params.search.toLowerCase().trim();
        results = results.filter(
          (item) =>
            item.vendorCode?.toLowerCase().includes(q) ||
            item.vendorName?.toLowerCase().includes(q) ||
            item.vendorAddress?.toLowerCase().includes(q) ||
            item.poNumber?.toLowerCase().includes(q) ||
            item.items?.some(
              (p) =>
                p.description?.toLowerCase().includes(q) ||
                p.partNo?.toLowerCase().includes(q),
            ),
        );
      }

      if (params.fromDate) {
        results = results.filter((item) => item.createdDate >= params.fromDate);
      }

      if (params.toDate) {
        results = results.filter((item) => item.createdDate <= params.toDate);
      }

      return {
        items: results,
        total: results.length,
      };
    }

    return axiosClient.get("/parts/purchase-orders", { params });
  },

  async getPurchaseOrderById(id) {
    if (!USE_BACKEND_API) {
      await simulateDelay(100);
      const found = localPurchaseOrderList.find(
        (p) => p.id === id || p.poNumber === id,
      );
      if (!found) throw new Error("Purchase Order record not found");
      return found;
    }
    return axiosClient.get(`/parts/purchase-orders/${id}`);
  },

  async createPurchaseOrder(poPayload) {
    if (!USE_BACKEND_API) {
      await simulateDelay(250);
      const nextId = `PO-${String(localPurchaseOrderList.length + 1).padStart(3, "0")}`;
      const nextNum = `PO-VLR26-${String(localPurchaseOrderList.length + 1).padStart(6, "0")}`;

      const newRecord = {
        id: nextId,
        createdDate:
          poPayload.createdDate || new Date().toLocaleDateString("en-GB"),
        validTillDate: poPayload.validTillDate || "20/09/2026",
        vendorCode:
          poPayload.vendorCode || "X934-44 | HOOR AUTOPARTS HUB PVT LTD",
        vendorName: poPayload.vendorName || "HOOR AUTOPARTS HOOR AUTOPARTS",
        vendorAddress:
          poPayload.vendorAddress ||
          "SHOP NO 02 SADAR BHAVAN OPP CONNAUGHT PLACE, NEW DELHI",
        vendorGstin: poPayload.vendorGstin || "—",
        supplierInvoicePdf: poPayload.supplierInvoicePdf || null,
        poNumber: nextNum,
        totalAmount: Number(poPayload.totalAmount || 0),
        items: poPayload.items || [],
      };

      localPurchaseOrderList = [newRecord, ...localPurchaseOrderList];
      return newRecord;
    }

    return axiosClient.post("/parts/purchase-orders", poPayload);
  },

  async updatePurchaseOrder(id, updateData) {
    if (!USE_BACKEND_API) {
      await simulateDelay(150);
      localPurchaseOrderList = localPurchaseOrderList.map((item) =>
        item.id === id || item.poNumber === id
          ? { ...item, ...updateData }
          : item,
      );
      return localPurchaseOrderList.find(
        (p) => p.id === id || p.poNumber === id,
      );
    }
    return axiosClient.put(`/parts/purchase-orders/${id}`, updateData);
  },

  // ===================== WORKSHOPS =====================

  async getWorkshops() {
    if (!USE_BACKEND_API) {
      await simulateDelay(100);
      return {
        items: [...localWorkshops],
        total: localWorkshops.length,
      };
    }
    return axiosClient.get("/workshops");
  },

  async getWorkshopById(id) {
    if (!USE_BACKEND_API) {
      await simulateDelay(100);
      const found = localWorkshops.find(
        (w) => w.id === id || w.workshopName === id,
      );
      if (!found) throw new Error("Workshop not found");
      return found;
    }
    return axiosClient.get(`/workshops/${id}`);
  },

  // ===================== STOCK TRANSFER =====================

  async getStockTransfers(params = {}) {
    if (!USE_BACKEND_API) {
      await simulateDelay(150);
      let results = [...localStockTransfers];

      if (params.search) {
        const q = params.search.toLowerCase().trim();
        results = results.filter(
          (item) =>
            item.transferNo?.toLowerCase().includes(q) ||
            item.workshopMobile?.toLowerCase().includes(q) ||
            item.gstNumber?.toLowerCase().includes(q) ||
            item.items?.some(
              (p) =>
                p.partCode?.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q) ||
                p.regNo?.toLowerCase().includes(q),
            ),
        );
      }

      return {
        items: results,
        total: results.length,
      };
    }

    return axiosClient.get("/parts/stock-transfers", { params });
  },

  async getStockTransferById(id) {
    if (!USE_BACKEND_API) {
      await simulateDelay(100);
      const found = localStockTransfers.find(
        (s) => s.id === id || s.transferNo === id,
      );
      if (!found) throw new Error("Stock transfer record not found");
      return found;
    }
    return axiosClient.get(`/parts/stock-transfers/${id}`);
  },

  async createStockTransfer(payload) {
    if (!USE_BACKEND_API) {
      await simulateDelay(250);
      const nextId = `ST-${String(localStockTransfers.length + 1).padStart(3, "0")}`;
      const nextNo = `ST-VLR26-${String(localStockTransfers.length + 1).padStart(6, "0")}`;

      const newRecord = {
        id: nextId,
        transferNo: nextNo,
        transferDate:
          payload.transferDate || new Date().toLocaleDateString("en-GB"),
        workshopMobile:
          payload.workshopMobile || "X934-44 | HOOR AUTOPARTS HUB PVT LTD",
        gstNumber: payload.gstNumber || "HOOR AUTOPARTS HOOR AUTOPARTS",
        deliveryDate: payload.deliveryDate || "20/09/2026",
        status: "Completed",
        totalAmount:
          payload.items?.reduce(
            (sum, it) => sum + Number(it.totalAmt || it.cost || 0),
            0,
          ) || 0,
        items: payload.items || [],
      };

      localStockTransfers = [newRecord, ...localStockTransfers];
      return newRecord;
    }

    return axiosClient.post("/parts/stock-transfers", payload);
  },

  // ===================== PURCHASE RETURN =====================

  async getPurchaseReturnInvoices(params = {}) {
    if (!USE_BACKEND_API) {
      await simulateDelay(150);
      let results = [...localPurchaseReturnInvoices];

      if (params.search) {
        const q = params.search.toLowerCase().trim();
        results = results.filter(
          (item) =>
            item.invoiceNumber?.toLowerCase().includes(q) ||
            item.vendorCode?.toLowerCase().includes(q) ||
            item.vendorName?.toLowerCase().includes(q) ||
            item.items?.some(
              (p) =>
                p.partCode?.toLowerCase().includes(q) ||
                p.description?.toLowerCase().includes(q),
            ),
        );
      }

      return {
        items: results,
        total: results.length,
      };
    }

    return axiosClient.get("/parts/purchase-return/invoices", { params });
  },

  async getPurchaseReturnByInvoice(invoiceNumber) {
    if (!USE_BACKEND_API) {
      await simulateDelay(150);
      if (!invoiceNumber) return null;
      const q = invoiceNumber.toLowerCase().trim();
      const found = localPurchaseReturnInvoices.find(
        (item) =>
          item.invoiceNumber.toLowerCase() === q ||
          item.invoiceNumber.toLowerCase().includes(q),
      );
      if (!found) {
        throw new Error(`No GRN or invoice found for "${invoiceNumber}"`);
      }
      return found;
    }

    return axiosClient.get(`/parts/purchase-return/invoice/${invoiceNumber}`);
  },

  async getPurchaseReturnsList(params = {}) {
    if (!USE_BACKEND_API) {
      await simulateDelay(150);
      return {
        items: localPurchaseReturns,
        total: localPurchaseReturns.length,
      };
    }

    return axiosClient.get("/parts/purchase-returns", { params });
  },

  async createPurchaseReturn(payload) {
    if (!USE_BACKEND_API) {
      await simulateDelay(250);
      const nextId = `PR-${String(localPurchaseReturns.length + 1).padStart(3, "0")}`;
      const nextNo = `PR-VLR26-${String(localPurchaseReturns.length + 1).padStart(6, "0")}`;

      const returnTotal =
        payload.items?.reduce(
          (sum, it) =>
            sum + Number(it.totalAmount || it.cost * it.returnQty || 0),
          0,
        ) || 0;

      const newRecord = {
        id: nextId,
        returnNumber: nextNo,
        invoiceNumber: payload.invoiceNumber || "",
        vendorCode: payload.vendorCode || "",
        vendorName: payload.vendorName || "",
        createdDate: new Date().toISOString().slice(0, 10),
        returnTotal: returnTotal,
        status: "Processed",
        reason: payload.reason || "Returned by workshop",
        items: payload.items || [],
      };

      localPurchaseReturns = [newRecord, ...localPurchaseReturns];

      // Update available quantities in the mock invoice
      localPurchaseReturnInvoices = localPurchaseReturnInvoices.map((inv) => {
        if (inv.invoiceNumber === payload.invoiceNumber) {
          return {
            ...inv,
            items: inv.items.map((it) => {
              const matched = payload.items.find(
                (p) => p.partCode === it.partCode,
              );
              if (matched && matched.returnQty > 0) {
                return {
                  ...it,
                  availableQty: Math.max(
                    0,
                    it.availableQty - matched.returnQty,
                  ),
                  returnQty: 0,
                };
              }
              return it;
            }),
          };
        }
        return inv;
      });

      return newRecord;
    }

    return axiosClient.post("/parts/purchase-returns", payload);
  },
};

function simulateDelay(ms = 100) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
