import { axiosClient } from "@/services/api/axiosClient";

/**
 * Garage Module API Service
 * Connects frontend directly to backend /api/garage routes (MySQL / Sequelize)
 */
export const garageOnboardService = {
  /**
   * 1. CREATE GARAGE (Onboarding Form Submission)
   * POST /api/garage/create
   */
  async createGarage(payload) {
    const res = await axiosClient.post("/garage/create", payload);
    return res?.data || res;
  },

  async submitRequest(payload) {
    return this.createGarage(payload);
  },

  /**
   * 2. MY SUBMISSIONS (User's Submitted Applications)
   * GET /api/garage/my-submissions
   */
  async getMySubmissions() {
    const res = await axiosClient.get("/garage/my-submissions");
    const list = res?.data || res?.requests || res;
    return Array.isArray(list) ? list : [];
  },

  /**
   * 3. GARAGE APPROVALS LIST (Business Admin Dashboard)
   * POST /api/garage/approvals/list
   * @param {Object} filters { status: 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED', search: '' }
   */
  async listGarageApprovals(filters = {}) {
    const res = await axiosClient.post("/garage/approvals/list", {
      status: filters.status || "ALL",
      search: filters.search || "",
    });

    const requests = res?.data?.requests || res?.requests || (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
    const stats = res?.data?.stats || res?.stats || {
      total: requests.length,
      pending: requests.filter((r) => r.status === "PENDING").length,
      approved: requests.filter((r) => r.status === "APPROVED").length,
      rejected: requests.filter((r) => r.status === "REJECTED").length,
    };

    return { requests, stats };
  },

  async getRequests(filters = {}) {
    if (filters.userId) {
      return this.getMySubmissions();
    }
    const { requests } = await this.listGarageApprovals(filters);
    return requests;
  },

  /**
   * 4. SAVE OTHER INFORMATION (Inspect Modal - Tab 4)
   * POST /api/garage/approvals/save-other-info
   */
  async saveOtherInfo(garageId, otherInfo) {
    const res = await axiosClient.post("/garage/approvals/save-other-info", {
      garageId,
      otherInfo,
    });
    return res?.data || res;
  },

  /**
   * 5. SAVE PAYMENT DETAILS (Inspect Modal - Tab 5)
   * POST /api/garage/approvals/save-payment
   */
  async savePaymentDetails(garageId, paymentDetails) {
    const res = await axiosClient.post("/garage/approvals/save-payment", {
      garageId,
      paymentDetails,
    });
    return res?.data || res;
  },

  /**
   * 6. APPROVE ONBOARDING APPLICATION
   * POST /api/garage/approvals/approve
   */
  async approveGarage(garageId, { remarks, commissionTier } = {}) {
    const res = await axiosClient.post("/garage/approvals/approve", {
      garageId,
      remarks,
      commissionTier,
    });
    return res?.data || res;
  },

  async approveRequest(garageId, payload = {}) {
    return this.approveGarage(garageId, {
      remarks: payload.remarks,
      commissionTier: payload.commissionTier,
    });
  },

  /**
   * 7. REJECT ONBOARDING APPLICATION
   * POST /api/garage/approvals/reject
   */
  async rejectGarage(garageId, { rejectionReason, remarks } = {}) {
    const res = await axiosClient.post("/garage/approvals/reject", {
      garageId,
      rejectionReason,
      remarks,
    });
    return res?.data || res;
  },

  async rejectRequest(garageId, payload = {}) {
    return this.rejectGarage(garageId, {
      rejectionReason: payload.reason || payload.rejectionReason,
      remarks: payload.remarks,
    });
  },

  /**
   * 8. SUBMIT GARAGE SETUP CHANGES (By Garage Owner)
   * POST /api/garage/setup/submit
   */
  async submitSetupChanges(garageId, { users, configuration }) {
    const res = await axiosClient.post("/garage/setup/submit", {
      garageId,
      users,
      configuration,
    });
    return res?.data || res;
  },

  /**
   * 9. LIST SETUP APPROVALS (Business Admin)
   * POST /api/garage/setup-approvals/list
   */
  async listSetupApprovals(status = "ALL") {
    const res = await axiosClient.post("/garage/setup-approvals/list", { status });
    const garages = res?.data?.garages || res?.garages || (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
    const stats = res?.data?.stats || res?.stats || {
      total: garages.length,
      pending: garages.filter((g) => g.setupApproval?.status === "PENDING").length,
      approved: garages.filter((g) => g.setupApproval?.status === "APPROVED").length,
    };
    return { garages, stats };
  },

  /**
   * 10. APPROVE SETUP CHANGES (Activates all submitted users to ACTIVE)
   * POST /api/garage/setup-approvals/approve
   */
  async approveSetup(garageId, { remarks } = {}) {
    const res = await axiosClient.post("/garage/setup-approvals/approve", {
      garageId,
      remarks,
    });
    return res?.data || res;
  },

  /**
   * 11. REJECT SETUP CHANGES (Users stay INACTIVE)
   * POST /api/garage/setup-approvals/reject
   */
  async rejectSetup(garageId, { rejectionReason, remarks } = {}) {
    const res = await axiosClient.post("/garage/setup-approvals/reject", {
      garageId,
      rejectionReason,
      remarks,
    });
    return res?.data || res;
  },

  /**
   * Update request adapter for modal saves
   */
  async updateRequest(garageId, updates = {}) {
    if (updates.otherInfo) {
      return this.saveOtherInfo(garageId, updates.otherInfo);
    }
    if (updates.paymentDetails) {
      return this.savePaymentDetails(garageId, updates.paymentDetails);
    }
    if (updates.setupApproval?.status === "APPROVED") {
      return this.approveSetup(garageId, { remarks: updates.setupApproval.remarks });
    }
    if (updates.setupApproval?.status === "REJECTED") {
      return this.rejectSetup(garageId, {
        rejectionReason: updates.setupApproval.rejectionReason,
        remarks: updates.setupApproval.remarks,
      });
    }
    return updates;
  },
};

export default garageOnboardService;
