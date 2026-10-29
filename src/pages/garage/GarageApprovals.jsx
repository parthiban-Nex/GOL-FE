import { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Search,
  Building2,
  MapPin,
  FileCheck2,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Users as UsersIcon,
  CreditCard,
  Settings,
  Calendar,
  QrCode,
  Upload,
  Check,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Table from "@/components/ui/Table";
import { useAuth } from "@/hooks/useAuth";
import { garageOnboardService } from "@/services/api/garageOnboardService";
import { showToast } from "@/utils/toast";
import { formatDate } from "@/utils/formatters";
import { WORKSHOP_TYPES_STEP5, ZONES, AREAS, CITIES, CITY_TYPES, ZH_LIST, ABH_LIST, FBM_LIST, APM_LIST, HUBS_LIST, } from "./GarageOnboard";

const COMMISSION_TIERS = [
  { value: "Silver Partner (8% Commission)", label: "Silver Partner (8% Commission)" },
  { value: "Standard Partner (10% Commission)", label: "Standard Partner (10% Commission)" },
  { value: "Gold Tier Partner (12% Commission)", label: "Gold Tier Partner (12% Commission)" },
  { value: "Platinum Flagship Partner (15% Commission)", label: "Platinum Flagship Partner (15% Commission)" },
];

const REJECTION_REASONS = [
  { value: "Incomplete KYC / GST / PAN Documentation", label: "Incomplete KYC / GST / PAN Documentation" },
  { value: "Bank / Virtual Account Details Mismatch", label: "Bank / Virtual Account Details Mismatch" },
  { value: "Workshop Bays / Infrastructure Non-Compliant", label: "Workshop Bays / Infrastructure Non-Compliant" },
  { value: "Plant Code / Supply Hub Allocation Issue", label: "Plant Code / Supply Hub Allocation Issue" },
  { value: "Other Operational Compliance Reason", label: "Other Operational Compliance Reason" },
];

// export const CONFIGURATION_OPTIONS = [
//   { key: "notification", label: "Notification", description: "Automated SMS, email & WhatsApp customer notifications" },
//   { key: "inventory", label: "Inventory", description: "Workshop inventory tracking, stock levels and bin allocations" },
//   { key: "jobCard", label: "Job Card", description: "Digital repair orders, bay tracking and digital estimate conversion" },
//   { key: "misLabour", label: "MIS Labour", description: "Management analytics, technician productivity & labor efficiency" },
//   { key: "part", label: "Part", description: "OEM / OES spares catalog and pricing integrations" },
//   { key: "labour", label: "Labour", description: "Standard labor operation schedules, rate charts and hourly allowances" },
//   { key: "appointment", label: "Appointment", description: "Online customer booking calendar and slot scheduling" },
//   { key: "accidental", label: "Accidental", description: "Body shop claim estimates, survey approvals and dent/paint tracking" },
//   { key: "customerView", label: "Customer View", description: "Live vehicle service progression tracking portal for vehicle owners" },
//   { key: "vehicleType", label: "Vehicle Type", description: "Multi-category support (2W, 4W, Commercial, EV, Luxury)" },
//   { key: "purchaseOrder", label: "Purchase Order", description: "Direct supply hub procurement, PO creation and GRN processing" },
// ];

const INITIAL_OTHER_INFO = {
  plantCode: "",
  workshopType: "",
  zone: "",
  area: "",
  city: "",
  cityType: "",
  zh: "",
  abh: "",
  fbm: "",
  apm: "",
  hub: "",
  activationDate: "",
  targets: {
    mechanicalInflow: "",
    mechanicalRevenue: "",
    bodyRepairInflow: "",
    bodyRepairRevenue: "",
    partsOfftake: "",
  },
  qrImage: "",
};

const INITIAL_PAYMENT_DETAILS = {
  paymentMode: "",
  paymentType: "",
  amountPaid: "",
};

export default function GarageApprovals() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

  // Modals state
  const [reviewItem, setReviewItem] = useState(null);
  const [reviewTab, setReviewTab] = useState("step1");

  const [otherInfo, setOtherInfo] = useState(INITIAL_OTHER_INFO);
  const [paymentDetails, setPaymentDetails] = useState(INITIAL_PAYMENT_DETAILS);

  const [actionModal, setActionModal] = useState(null);
  const [qrVerified, setQrVerified] = useState(false);

  const [actionForm, setActionForm] = useState({
    commissionTier: "Standard Partner (10% Commission)",
    rejectionReason: "Incomplete KYC / GST / PAN Documentation",
    remarks: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRequests = async () => {
    try {
      const { requests: list, stats: apiStats } =
        await garageOnboardService.listGarageApprovals({
          status: statusFilter,
          search: searchQuery,
        });

      const onboardingRequests = (list || []).filter(
        (garage) => garage.setupApproval?.status !== "PENDING"
      );

      setRequests(onboardingRequests);
      if (apiStats) {
        setStats(apiStats);
      }
    } catch (err) {
      console.error("Failed to fetch approvals:", err);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, searchQuery]);

  const handleOpenReview = (item) => {
    setReviewItem(item);
    setReviewTab("step1");

    setOtherInfo({
      plantCode: item.otherInfo?.plantCode || "",
      workshopType: item.otherInfo?.workshopType || "",
      zone: item.otherInfo?.zone || "",
      area: item.otherInfo?.area || "",
      city: item.otherInfo?.city || "",
      cityType: item.otherInfo?.cityType || "",
      zh: item.otherInfo?.zh || "",
      abh: item.otherInfo?.abh || "",
      fbm: item.otherInfo?.fbm || "",
      apm: item.otherInfo?.apm || "",
      hub: item.otherInfo?.hub || "",
      activationDate: item.otherInfo?.activationDate || "",
      targets: {
        mechanicalInflow:
          item.otherInfo?.targets?.mechanicalInflow || "",
        mechanicalRevenue:
          item.otherInfo?.targets?.mechanicalRevenue || "",
        bodyRepairInflow:
          item.otherInfo?.targets?.bodyRepairInflow || "",
        bodyRepairRevenue:
          item.otherInfo?.targets?.bodyRepairRevenue || "",
        partsOfftake:
          item.otherInfo?.targets?.partsOfftake || "",
      },
      qrImage: item.otherInfo?.qrImage || "",
    });
    setQrVerified(Boolean(item.otherInfo?.qrImage));

    setPaymentDetails({
      paymentMode: item.paymentDetails?.paymentMode || "",
      paymentType:
        item.paymentDetails?.paymentType === "Full Payment"
          ? "FULL"
          : item.paymentDetails?.paymentType === "Partial Payment"
            ? "PARTIAL"
            : item.paymentDetails?.paymentType || "",
      amountPaid:
        item.paymentDetails?.amountPaid ||
        item.paymentDetails?.amount ||
        "",
    });
  };

  const handleOpenApproveModal = (item) => {
    setActionModal({ type: "APPROVE", item });
    setActionForm({
      commissionTier: "Gold Tier Partner (12% Commission)",
      rejectionReason: "",
      remarks: "Workshop identity, bank accounts, bays, and staff verified. Approved for activation.",
    });
  };

  const handleOpenRejectModal = (item) => {
    setActionModal({ type: "REJECT", item });
    setActionForm({
      commissionTier: "",
      rejectionReason: "Workshop Bays / Infrastructure Non-Compliant",
      remarks: "Facility bays do not meet the minimum equipment standards required for certified partner onboarding.",
    });
  };

  const handleApproveConfirm = async () => {
    if (!actionModal?.item) return;
    setIsProcessing(true);
    try {
      await garageOnboardService.approveGarage(actionModal.item.id, {
        reviewer: user,
        commissionTier: actionForm.commissionTier,
        remarks: actionForm.remarks,
      });
      showToast.success(`Garage request ${actionModal.item.requestNumber} approved successfully!`);
      setActionModal(null);
      if (reviewItem?.id === actionModal.item.id) {
        setReviewItem(null);
      }
      await fetchRequests();
    } catch (err) {
      showToast.error(err.message || "Failed to approve request.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!actionModal?.item) return;
    setIsProcessing(true);
    try {
      await garageOnboardService.rejectGarage(actionModal.item.id, {
        reviewer: user,
        rejectionReason: actionForm.rejectionReason,
        remarks: actionForm.remarks,
      });
      showToast.error(`Garage request ${actionModal.item.requestNumber} rejected.`);
      setActionModal(null);
      if (reviewItem?.id === actionModal.item.id) {
        setReviewItem(null);
      }
      await fetchRequests();
    } catch (err) {
      showToast.error(err.message || "Failed to reject request.");
    } finally {
      setIsProcessing(false);
    }
  };

  const updateOtherInfo = (field, value) => {
    setOtherInfo((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateTarget = (field, value) => {
    setOtherInfo((prev) => ({
      ...prev,
      targets: {
        ...prev.targets,
        [field]: value,
      },
    }));
  };

  const updatePaymentDetails = (field, value) => {
    setPaymentDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveOtherInfo = async () => {
    if (!reviewItem?.id) return;
    try {
      const updated = await garageOnboardService.saveOtherInfo(reviewItem.id, otherInfo);
      if (updated) setReviewItem(updated);
      await fetchRequests();
      showToast.success("Other Information saved.");
    } catch (err) {
      showToast.error(err.message || "Failed to save Other Information.");
    }
  };

  const handleSavePayment = async () => {
    if (!reviewItem?.id) return;
    try {
      const updated = await garageOnboardService.savePaymentDetails(reviewItem.id, paymentDetails);
      if (updated) setReviewItem(updated);
      await fetchRequests();
      showToast.success("Payment Details saved.");
    } catch (err) {
      showToast.error(err.message || "Failed to save Payment Details.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return <Badge tone="success">Approved</Badge>;
      case "REJECTED":
        return <Badge tone="danger">Rejected</Badge>;
      case "PENDING":
      default:
        return <Badge tone="warning">Pending Review</Badge>;
    }
  };

  const columns = [
    {
      key: "requestNumber",
      header: "Req No.",
      render: (row) => (
        <span className="font-semibold text-brand-700">{row.requestNumber}</span>
      ),
    },
    {
      key: "garageName",
      header: "Workshop & Registered Name",
      render: (row) => (
        <div>
          <p className="font-bold text-ink-900">{row.workshopDetails?.displayName}</p>
          <p className="text-xs text-ink-500">
            {row.workshopDetails?.registeredName} · 📱 {row.workshopDetails?.mobile}
          </p>
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      render: (row) => (
        <span className="text-xs text-ink-800">
          {row.registeredAddress?.city || "-"}, {row.registeredAddress?.state} ({row.registeredAddress?.stateCode})
        </span>
      ),
    },
    {
      key: "submittedDate",
      header: "Submitted Date",
      render: (row) => (
        <span className="text-xs font-semibold text-ink-800">
          {formatDate(row.submittedAt)}
        </span>
      ),
    },
    {
      key: "hubZone",
      header: "Supply Hub / Zone",
      render: (row) => (
        <div>
          <p className="text-xs font-semibold text-ink-800">{row.otherInfo?.hub || "N/A"}</p>
          <p className="text-[11px] text-ink-500">{row.otherInfo?.zone || ""}</p>
        </div>
      ),
    },
    {
      key: "baysUsers",
      header: "Bays / Staff",
      render: (row) => (
        <div className="flex items-center gap-2 text-xs text-ink-700">
          <span className="inline-flex items-center gap-1 font-semibold text-brand-700">
            <Layers className="h-3 w-3" /> {row.workshopBays?.length || 0}
          </span>
          <span className="text-ink-300">|</span>
          <span className="inline-flex items-center gap-1 font-semibold text-accent-700">
            <UsersIcon className="h-3 w-3" /> {row.users?.length || 0}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: "actions",
      header: "Review Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            icon={Eye}
            onClick={() => handleOpenReview(row)}
          >
            Inspect
          </Button>

          {row.status === "PENDING" && (
            <>
              <Button
                size="sm"
                variant="primary"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                icon={CheckCircle2}
                onClick={() => handleOpenApproveModal(row)}
              >
                Approve
              </Button>
              <Button
                size="sm"
                variant="danger"
                icon={XCircle}
                onClick={() => handleOpenRejectModal(row)}
              >
                Reject
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 pb-12">
      {/* Header Card */}
      <div className="flex flex-col gap-3 rounded-xl border border-ink-100 bg-white p-4 shadow-card">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 mb-1">
              <ShieldCheck className="h-3.5 w-3.5" /> Business Admin Portal
            </div>
            <h1 className="text-xl font-bold text-ink-900">
              Garage Approval
            </h1>
            <p className="text-xs text-ink-500">
              Evaluate and process submitted garage onboarding applications. Inspect details and assign partner approval or rejection.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 text-xs">
            <span className="rounded-lg bg-amber-50 px-3 py-1.5 font-bold text-amber-700 border border-amber-200">
              Pending: {stats.pending}
            </span>
            <span className="rounded-lg bg-emerald-50 px-3 py-1.5 font-bold text-emerald-700 border border-emerald-200">
              Approved: {stats.approved}
            </span>
            <span className="rounded-lg bg-red-50 px-3 py-1.5 font-bold text-red-700 border border-red-200">
              Rejected: {stats.rejected}
            </span>
            {/* <Button
              size="sm"
              variant="outline"
              onClick={() => {
                garageOnboardService.resetDefaults();
                fetchRequests();
                showToast.info("Sample requests reset to defaults.");
              }}
            >
              Reset Samples
            </Button> */}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors cursor-pointer ${statusFilter === status
                  ? "bg-brand-600 text-white shadow-xs"
                  : "bg-ink-100 text-ink-600 hover:bg-ink-200"
                }`}
            >
              {status === "ALL" ? "All Requests" : status}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search garage, city, mobile..."
            icon={Search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </Card>

      {/* Requests Data Table */}
      <Card padded={false}>
        <Table
          columns={columns}
          data={requests}
          emptyTitle="No garage onboarding requests found"
          emptyDescription="There are currently no requests matching your filter criteria. When Business users submit applications, they will appear here."
        />
      </Card>

      {/* Full 5-Step Application Inspector Modal */}
      {reviewItem && (
        <Modal
          isOpen={Boolean(reviewItem)}
          onClose={() => setReviewItem(null)}
          title={`Review Application — ${reviewItem.requestNumber}`}
          size="xl"
          footer={
            <div className="flex w-full items-center justify-between">
              <div>{getStatusBadge(reviewItem.status)}</div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setReviewItem(null)}>
                  Close
                </Button>
                {reviewItem.status === "PENDING" && (
                  <>
                    <Button
                      variant="danger"
                      icon={XCircle}
                      onClick={() => handleOpenRejectModal(reviewItem)}
                    >
                      Reject Application
                    </Button>
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      icon={CheckCircle2}
                      onClick={() => handleOpenApproveModal(reviewItem)}
                    >
                      Approve & Verify
                    </Button>
                  </>
                )}
              </div>
            </div>
          }
        >
          <div className="space-y-4">
            {/* 5-Step Inspector Tabs */}
            <div className="flex  justify-between border-b border-ink-200 text-xs font-semibold">
              <button
                onClick={() => setReviewTab("step1")}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 cursor-pointer ${reviewTab === "step1"
                    ? "border-brand-600 text-brand-600 bg-brand-50/50"
                    : "border-transparent text-ink-500 hover:text-ink-800"
                  }`}
              >
                <Building2 className="h-3.5 w-3.5" /> 1. Workshop & Bank
              </button>
              <button
                onClick={() => setReviewTab("step2")}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 cursor-pointer ${reviewTab === "step2"
                    ? "border-brand-600 text-brand-600 bg-brand-50/50"
                    : "border-transparent text-ink-500 hover:text-ink-800"
                  }`}
              >
                <MapPin className="h-3.5 w-3.5" /> 2. Address & Bays
              </button>
              <button
                onClick={() => setReviewTab("step3")}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 cursor-pointer ${reviewTab === "step3"
                    ? "border-brand-600 text-brand-600 bg-brand-50/50"
                    : "border-transparent text-ink-500 hover:text-ink-800"
                  }`}
              >
                <UsersIcon className="h-3.5 w-3.5" /> 3. Users ({reviewItem.users?.length || 0})
              </button>
              <button
                onClick={() => setReviewTab("step4")}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 cursor-pointer ${reviewTab === "step4"
                    ? "border-brand-600 text-brand-600 bg-brand-50/50"
                    : "border-transparent text-ink-500 hover:text-ink-800"
                  }`}
              >
                <Settings className="h-3.5 w-3.5" /> 4. Other Information
              </button>
              <button
                onClick={() => setReviewTab("step5")}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 cursor-pointer ${reviewTab === "step5"
                    ? "border-brand-600 text-brand-600 bg-brand-50/50"
                    : "border-transparent text-ink-500 hover:text-ink-800"
                  }`}
              >
                <CreditCard className="h-3.5 w-3.5" />5. Payment Details
              </button>
            </div>

            {/* TAB 1: Workshop & Bank */}
            {reviewTab === "step1" && (
              <div className="space-y-4 text-xs">
                <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-4 space-y-2">
                  <p className="font-bold uppercase tracking-wider text-brand-700">1. Workshop Details</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div>
                      <span className="text-ink-400">1. Display Name:</span>
                      <p className="font-semibold text-ink-900">{reviewItem.workshopDetails?.displayName}</p>
                    </div>
                    <div>
                      <span className="text-ink-400">2. Mobile Number:</span>
                      <p className="font-semibold text-ink-900">{reviewItem.workshopDetails?.mobile}</p>
                    </div>
                    <div>
                      <span className="text-ink-400">3. Registered Name:</span>
                      <p className="font-semibold text-ink-900">{reviewItem.workshopDetails?.registeredName}</p>
                    </div>
                    <div>
                      <span className="text-ink-400">4. Alternate Contact:</span>
                      <p className="font-medium text-ink-800">{reviewItem.workshopDetails?.alternateContactNumber || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-ink-400">5. GST Number:</span>
                      <p className="font-mono font-medium text-ink-800">{reviewItem.workshopDetails?.gstNumber || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-ink-400">6. Email:</span>
                      <p className="font-medium text-ink-800">{reviewItem.workshopDetails?.email || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-ink-400">7. PAN Number:</span>
                      <p className="font-mono font-medium text-ink-800">{reviewItem.workshopDetails?.panNumber || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-ink-400">8. Remarks:</span>
                      <p className="font-medium text-ink-800">{reviewItem.workshopDetails?.remarks || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-ink-400">9. CIN Number:</span>
                      <p className="font-mono font-medium text-ink-800">{reviewItem.workshopDetails?.cinNumber || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-4 space-y-2">
                  <p className="font-bold uppercase tracking-wider text-accent-700">2. Bank Details</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <span className="text-ink-400">10. Bank Name:</span>
                      <p className="font-semibold text-ink-900">{reviewItem.bankDetails?.bankName || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-ink-400">11. Account Number:</span>
                      <p className="font-mono font-semibold text-ink-900">{reviewItem.bankDetails?.accountNumber || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-ink-400">12. Branch Name:</span>
                      <p className="font-medium text-ink-800">{reviewItem.bankDetails?.branchName || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-ink-400">13. IFSC Code:</span>
                      <p className="font-mono font-semibold text-ink-900">{reviewItem.bankDetails?.ifscCode || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-4 space-y-2">
                  <p className="font-bold uppercase tracking-wider text-brand-700">3. Virtual Account Details</p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <span className="text-ink-400">14. Google Link Available:</span>
                      <p className="font-semibold text-ink-900">{reviewItem.virtualAccountDetails?.isGoogleLinkAvailable || "No"}</p>
                    </div>
                    <div>
                      <span className="text-ink-400">15. Payment In Name:</span>
                      <p className="font-semibold text-ink-900">{reviewItem.virtualAccountDetails?.paymentInNameOf || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-ink-400">16. Virtual Bank:</span>
                      <p className="font-medium text-ink-800">{reviewItem.virtualAccountDetails?.virtualBankName || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-ink-400">17. Virtual Branch:</span>
                      <p className="font-medium text-ink-800">{reviewItem.virtualAccountDetails?.virtualBranchName || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-ink-400">18. Virtual Account:</span>
                      <p className="font-mono font-semibold text-ink-900">{reviewItem.virtualAccountDetails?.virtualAccountNumber || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-ink-400">19. Virtual IFSC:</span>
                      <p className="font-mono font-semibold text-ink-900">{reviewItem.virtualAccountDetails?.virtualIfscCode || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-ink-400">20. UPI ID:</span>
                      <p className="font-semibold text-brand-700">{reviewItem.virtualAccountDetails?.upiId || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-ink-400">21. Insurance Company:</span>
                      <p className="font-semibold text-ink-900">{reviewItem.virtualAccountDetails?.insuranceCompany || "N/A"}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Addresses & Bays */}
            {reviewTab === "step2" && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-4 space-y-1.5">
                    <p className="font-bold uppercase tracking-wider text-brand-700">1. Registered Address</p>
                    <p><span className="text-ink-400">Street:</span> <span className="font-medium text-ink-900">{reviewItem.registeredAddress?.street || "N/A"}</span></p>
                    <p><span className="text-ink-400">Location:</span> <span className="font-medium text-ink-900">{reviewItem.registeredAddress?.location || "N/A"}</span></p>
                    <p><span className="text-ink-400">Pin Code:</span> <span className="font-semibold text-ink-900">{reviewItem.registeredAddress?.pincode}</span></p>
                    <p><span className="text-ink-400">City / State:</span> <span className="font-medium text-ink-900">{reviewItem.registeredAddress?.city}, {reviewItem.registeredAddress?.state}</span></p>
                    <p><span className="text-ink-400">State Code:</span> <span className="font-mono font-bold text-ink-900">{reviewItem.registeredAddress?.stateCode}</span></p>
                  </div>

                  <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="font-bold uppercase tracking-wider text-accent-700">2. Corporate Address</p>
                      {reviewItem.corporateAddress?.sameAsRegistered && (
                        <span className="rounded bg-accent-100 px-1.5 py-0.5 text-[10px] font-bold text-accent-800">
                          Same as Registered
                        </span>
                      )}
                    </div>
                    <p><span className="text-ink-400">Street:</span> <span className="font-medium text-ink-900">{reviewItem.corporateAddress?.street || "N/A"}</span></p>
                    <p><span className="text-ink-400">Location:</span> <span className="font-medium text-ink-900">{reviewItem.corporateAddress?.location || "N/A"}</span></p>
                    <p><span className="text-ink-400">Pin Code:</span> <span className="font-semibold text-ink-900">{reviewItem.corporateAddress?.pincode}</span></p>
                    <p><span className="text-ink-400">City / State:</span> <span className="font-medium text-ink-900">{reviewItem.corporateAddress?.city}, {reviewItem.corporateAddress?.state}</span></p>
                    <p><span className="text-ink-400">State Code:</span> <span className="font-mono font-bold text-ink-900">{reviewItem.corporateAddress?.stateCode}</span></p>
                  </div>
                </div>

                <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-4 space-y-2">
                  <p className="font-bold uppercase tracking-wider text-brand-700">
                    3. Workshop Bays ({reviewItem.workshopBays?.length || 0})
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {(reviewItem.workshopBays || []).map((b, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg bg-white p-2.5 border border-ink-100">
                        <span className="font-bold text-ink-900">{b.name}</span>
                        <span className="rounded bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 border border-brand-100">
                          {b.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: Users */}
            {reviewTab === "step3" && (
              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-bold uppercase tracking-wider text-brand-700">
                      Onboarding Users
                    </p>

                    <p className="text-ink-500">
                      Users added by the Business user during
                      garage onboarding.
                    </p>
                  </div>

                  <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-brand-700">
                    {reviewItem.users?.length || 0} Users
                  </span>
                </div>

                <div className="space-y-2">

                  {(reviewItem.users || []).map((usr, index) => (
                    <div key={usr.id || index} className="rounded-xl border border-ink-200 bg-white p-3">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        <div>
                          <span className="text-ink-400">
                            Name
                          </span>
                          <p className="font-bold text-ink-900">
                            {usr.name || "N/A"}
                          </p>
                        </div>

                        <div>
                          <span className="text-ink-400">
                            Mobile
                          </span>
                          <p className="text-ink-800">
                            {usr.mobile || "N/A"}
                          </p>
                        </div>
                        <div>
                          <span className="text-ink-400">
                            Alternate Mobile
                          </span>
                          <p className="text-ink-800">
                            {usr.alternateMobile || "N/A"}
                          </p>
                        </div>

                        <div>
                          <span className="text-ink-400">
                            Email
                          </span>
                          <p className="text-ink-800">
                            {usr.email || "N/A"}
                          </p>
                        </div>

                        <div>
                          <span className="text-ink-400">
                            Role
                          </span>
                          <p className="font-semibold text-ink-900">
                            {usr.role || "N/A"}
                          </p>
                        </div>

                        <div>
                          <span className="text-ink-400">Status</span>
                          <p className="font-semibold text-ink-800">
                            {usr.status || "INACTIVE"}
                          </p>
                        </div>
                      </div>

                      {usr.remarks && (
                        <div className="mt-3 border-t border-ink-100 pt-3">
                          <span className="text-ink-400">
                            Remarks
                          </span>

                          <p className="text-ink-800">
                            {usr.remarks}
                          </p>
                        </div>
                      )}

                    </div>
                  )
                  )}

                </div>
              </div>
            )}

            {/* {reviewTab === "step4" && (
              <div className="space-y-4 text-xs">

                <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-4">

                  <div className="mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-brand-600" />

                      <div>
                        <h2 className="text-sm font-bold text-ink-900">
                          Other Information
                        </h2>

                        <p className="text-xs text-ink-500">
                          Enter the additional garage information
                          before approval.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Input
                      label="Plant Code"
                      value={otherInfo.plantCode}
                      onChange={(e) =>
                        updateOtherInfo(
                          "plantCode",
                          e.target.value
                        )
                      }/>

                    <Input
                      label="Workshop Type"
                      value={otherInfo.workshopType}
                      onChange={(e) =>
                        updateOtherInfo(
                          "workshopType",
                          e.target.value
                        )
                      }/>

                    <Input
                      label="Zone"
                      value={otherInfo.zone}
                      onChange={(e) =>
                        updateOtherInfo(
                          "zone",
                          e.target.value
                        )
                      }
                    />

                    <Input
                      label="Area"
                      value={otherInfo.area}
                      onChange={(e) =>
                        updateOtherInfo(
                          "area",
                          e.target.value
                        )
                      }
                    />

                    <Input
                      label="City"
                      value={otherInfo.city}
                      onChange={(e) =>
                        updateOtherInfo(
                          "city",
                          e.target.value
                        )
                      }
                    />

                    <Input
                      label="City Type"
                      value={otherInfo.cityType}
                      onChange={(e) =>
                        updateOtherInfo(
                          "cityType",
                          e.target.value
                        )
                      }
                    />

                    <Input
                      label="ZH"
                      value={otherInfo.zh}
                      onChange={(e) =>
                        updateOtherInfo(
                          "zh",
                          e.target.value
                        )
                      }
                    />

                    <Input
                      label="ABH"
                      value={otherInfo.abh}
                      onChange={(e) =>
                        updateOtherInfo(
                          "abh",
                          e.target.value
                        )
                      }
                    />

                    <Input
                      label="FBM"
                      value={otherInfo.fbm}
                      onChange={(e) =>
                        updateOtherInfo(
                          "fbm",
                          e.target.value
                        )
                      }
                    />

                    <Input
                      label="APM"
                      value={otherInfo.apm}
                      onChange={(e) =>
                        updateOtherInfo(
                          "apm",
                          e.target.value
                        )
                      }
                    />

                    <Input
                      label="Hub"
                      value={otherInfo.hub}
                      onChange={(e) =>
                        updateOtherInfo(
                          "hub",
                          e.target.value
                        )
                      }
                    />

                    <Input
                      label="Activation Date"
                      type="date"
                      value={otherInfo.activationDate}
                      onChange={(e) =>
                        updateOtherInfo(
                          "activationDate",
                          e.target.value
                        )
                      }
                    />

                  </div>
                </div>

                <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-4">

                  <p className="mb-3 font-bold uppercase tracking-wider text-brand-700">
                    Monthly Targets
                  </p>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                    <Input
                      label="Mechanical Inflow"
                      value={
                        otherInfo.targets.mechanicalInflow
                      }
                      onChange={(e) =>
                        updateTarget(
                          "mechanicalInflow",
                          e.target.value
                        )
                      }
                    />

                    <Input
                      label="Mechanical Revenue"
                      value={
                        otherInfo.targets.mechanicalRevenue
                      }
                      onChange={(e) =>
                        updateTarget(
                          "mechanicalRevenue",
                          e.target.value
                        )
                      }
                    />

                    <Input
                      label="Body Repair Inflow"
                      value={
                        otherInfo.targets.bodyRepairInflow
                      }
                      onChange={(e) =>
                        updateTarget(
                          "bodyRepairInflow",
                          e.target.value
                        )
                      }
                    />

                    <Input
                      label="Body Repair Revenue"
                      value={
                        otherInfo.targets.bodyRepairRevenue
                      }
                      onChange={(e) =>
                        updateTarget(
                          "bodyRepairRevenue",
                          e.target.value
                        )
                      }
                    />

                    <Input
                      label="Parts Offtake"
                      value={
                        otherInfo.targets.partsOfftake
                      }
                      onChange={(e) =>
                        updateTarget(
                          "partsOfftake",
                          e.target.value
                        )
                      }
                    />

                    <Input
                      label="QR Image"
                      value={otherInfo.qrImage}
                      onChange={(e) =>
                        updateOtherInfo(
                          "qrImage",
                          e.target.value
                        )
                      }
                    />

                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleSaveOtherInfo}
                  >
                    Save Other Information
                  </Button>
                </div>
              </div>
            )} */}

            {/* TAB 4: Other Information */}
            {reviewTab === "step4" && (
              <div className="space-y-6 pt-1 text-xs">

                {/* 1. Workshop Information */}
                <div className="space-y-4 rounded-xl border border-ink-100 bg-ink-50/40 p-4">
                  <div className="flex items-center gap-2.5 border-b border-ink-100 pb-2">
                    <Building2 className="h-4 w-4 text-brand-600" />
                    <h2 className="text-sm font-bold text-ink-900">
                      Workshop Information
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                    <Input
                      label="Plant Code"
                      placeholder="e.g. PLT-DEL-042"
                      value={otherInfo.plantCode}
                      onChange={(e) =>
                        updateOtherInfo(
                          "plantCode",
                          e.target.value.toUpperCase()
                        )
                      }
                    />

                    <Select
                      label="Workshop Type"
                      value={otherInfo.workshopType}
                      onChange={(e) =>
                        updateOtherInfo("workshopType", e.target.value)
                      }
                      options={WORKSHOP_TYPES_STEP5}
                    />

                    <Select
                      label="Zone"
                      value={otherInfo.zone}
                      onChange={(e) =>
                        updateOtherInfo("zone", e.target.value)
                      }
                      options={ZONES}
                    />

                    <Select
                      label="Area"
                      value={otherInfo.area}
                      onChange={(e) =>
                        updateOtherInfo("area", e.target.value)
                      }
                      options={AREAS}
                    />

                    <Select
                      label="City"
                      value={otherInfo.city}
                      onChange={(e) =>
                        updateOtherInfo("city", e.target.value)
                      }
                      options={CITIES}
                    />

                    <Select
                      label="City Type"
                      value={otherInfo.cityType}
                      onChange={(e) =>
                        updateOtherInfo("cityType", e.target.value)
                      }
                      options={CITY_TYPES}
                    />

                  </div>
                </div>

                {/* 2. Users Section */}
                <div className="space-y-4 rounded-xl border border-ink-100 bg-ink-50/40 p-4">
                  <div className="flex items-center gap-2.5 border-b border-ink-100 pb-2">
                    <UsersIcon className="h-4 w-4 text-accent-600" />
                    <h2 className="text-sm font-bold text-ink-900">
                      USERS Section
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 ">

                    <Select
                      label="ZH (Zonal Head)"
                      value={otherInfo.zh}
                      onChange={(e) =>
                        updateOtherInfo("zh", e.target.value)
                      }
                      options={ZH_LIST}
                    />

                    <Select
                      label="ABH (Area Business Head)"
                      value={otherInfo.abh}
                      onChange={(e) =>
                        updateOtherInfo("abh", e.target.value)
                      }
                      options={ABH_LIST}
                    />

                    <Select
                      label="FBM (Franchise Business Manager)"
                      value={otherInfo.fbm}
                      onChange={(e) =>
                        updateOtherInfo("fbm", e.target.value)
                      }
                      options={FBM_LIST}
                    />

                    <Select
                      label="APM (Area Parts Manager)"
                      value={otherInfo.apm}
                      onChange={(e) =>
                        updateOtherInfo("apm", e.target.value)
                      }
                      options={APM_LIST}
                    />

                  </div>
                </div>

                {/* 3. HUBS Section */}
                <div className="space-y-4 rounded-xl border border-ink-100 bg-ink-50/40 p-4">
                  <div className="flex items-center gap-2.5 border-b border-ink-100 pb-2">
                    <Layers className="h-4 w-4 text-brand-600" />
                    <h2 className="text-sm font-bold text-ink-900">
                      HUBS Section
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                    <Select
                      label="HUBS"
                      value={otherInfo.hub}
                      onChange={(e) =>
                        updateOtherInfo("hub", e.target.value)
                      }
                      options={HUBS_LIST}
                    />

                    <Input
                      label="Activation Date"
                      type="date"
                      icon={Calendar}
                      value={otherInfo.activationDate}
                      onChange={(e) =>
                        updateOtherInfo(
                          "activationDate",
                          e.target.value
                        )
                      }
                    />

                  </div>
                </div>

                {/* 4. TARGET Section */}
                <div className="space-y-4 rounded-xl border border-ink-100 bg-ink-50/40 p-4">
                  <div className="flex items-center gap-2.5 border-b border-ink-100 pb-2">
                    <Layers className="h-4 w-4 text-brand-600" />
                    <h2 className="text-sm font-bold text-ink-900">
                      TARGET Section
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                    <Input
                      label="Mechanical Inflow"
                      placeholder="e.g. 180 Vehicles"
                      value={otherInfo.targets.mechanicalInflow}
                      onChange={(e) =>
                        updateTarget(
                          "mechanicalInflow",
                          e.target.value
                        )
                      }
                    />

                    <Input
                      label="Mechanical Revenue"
                      placeholder="e.g. ₹9,50,000"
                      value={otherInfo.targets.mechanicalRevenue}
                      onChange={(e) =>
                        updateTarget(
                          "mechanicalRevenue",
                          e.target.value
                        )
                      }
                    />

                    <Input
                      label="Body Repair Inflow"
                      placeholder="e.g. 45 Vehicles"
                      value={otherInfo.targets.bodyRepairInflow}
                      onChange={(e) =>
                        updateTarget(
                          "bodyRepairInflow",
                          e.target.value
                        )
                      }
                    />

                    <Input
                      label="Body Repair Revenue"
                      placeholder="e.g. ₹4,20,000"
                      value={otherInfo.targets.bodyRepairRevenue}
                      onChange={(e) =>
                        updateTarget(
                          "bodyRepairRevenue",
                          e.target.value
                        )
                      }
                    />

                    <Input
                      label="Parts Offtake"
                      placeholder="e.g. ₹5,00,000"
                      value={otherInfo.targets.partsOfftake}
                      onChange={(e) =>
                        updateTarget(
                          "partsOfftake",
                          e.target.value
                        )
                      }
                    />

                  </div>
                </div>

                {/* 5. QR Image Section */}
                <div className="space-y-4 rounded-xl border border-ink-100 bg-ink-50/40 p-4">
                  <div className="flex items-center gap-2.5 border-b border-ink-100 pb-2">
                    <QrCode className="h-4 w-4 text-accent-600" />
                    <h2 className="text-sm font-bold text-ink-900">
                      QR Image Section
                    </h2>
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">

                    <div className="flex-1">
                      <label className="mb-1.5 block text-xs font-semibold text-ink-700">
                        QR Image
                      </label>

                      <div className="flex items-center gap-3">

                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-ink-300 bg-white px-3.5 py-2 text-xs font-semibold text-ink-700 shadow-xs transition-colors hover:bg-ink-50">
                          <Upload className="h-3.5 w-3.5 text-brand-600" />

                          Choose File

                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                updateOtherInfo(
                                  "qrImage",
                                  e.target.files[0].name
                                );

                                setQrVerified(true);

                                showToast.success(
                                  `Attached ${e.target.files[0].name}`
                                );
                              }
                            }}
                          />
                        </label>

                        <span className="max-w-xs truncate text-xs font-medium text-ink-600">
                          {otherInfo.qrImage || "No file chosen"}
                        </span>

                      </div>
                    </div>

                    <div className="flex items-center gap-2">

                      <button
                        type="button"
                        onClick={() => {
                          setQrVerified((v) => !v);

                          showToast.info(
                            qrVerified
                              ? "QR Verification toggled off"
                              : "QR Image verified!"
                          );
                        }}
                        className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-full transition-all ${qrVerified
                          ? "bg-success-500 text-white shadow-xs"
                          : "bg-ink-200 text-ink-500 hover:bg-ink-300"
                          }`}
                        title={
                          qrVerified
                            ? "QR Code Verified"
                            : "Click to mark QR Verified"
                        }
                      >
                        <Check className="h-4 w-4 stroke-[2.5]" />
                      </button>

                      <span className="text-xs font-medium text-ink-500">
                        {qrVerified ? "QR Verified" : "Mark Verified"}
                      </span>

                    </div>

                  </div>
                </div>

                {/* Save */}
                <div className="flex justify-end">
                  <Button type="button" onClick={handleSaveOtherInfo}> Save </Button>
                </div>
              </div>
            )}

            {reviewTab === "step5" && (
              <div className="space-y-4 text-xs">

                <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-4">

                  <div className="mb-4 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-brand-600" />

                    <div>
                      <h2 className="text-sm font-bold text-ink-900"> Payment Details </h2>
                      <p className="text-xs text-ink-500"> Enter payment information before approving the garage. </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Select label="Payment Mode" value={paymentDetails.paymentMode}
                      onChange={(e) =>
                        updatePaymentDetails(
                          "paymentMode",
                          e.target.value
                        )
                      }
                      options={[
                        {
                          value: "ONLINE",
                          label: "Online",
                        },
                        {
                          value: "BANK_TRANSFER",
                          label: "Bank Transfer",
                        },
                        {
                          value: "UPI",
                          label: "UPI",
                        },
                        {
                          value: "CASH",
                          label: "Cash",
                        },]} />

                    <Select label="Payment Type" value={paymentDetails.paymentType}
                      onChange={(e) =>
                        updatePaymentDetails(
                          "paymentType",
                          e.target.value
                        )}
                      options={[
                        {
                          value: "FULL",
                          label: "Full Payment",
                        },
                        {
                          value: "PARTIAL",
                          label: "Partial Payment",
                        },]} />
                    <Input label="Amount Paid" type="number" value={paymentDetails.amountPaid}
                      onChange={(e) =>
                        updatePaymentDetails(
                          "amountPaid",
                          e.target.value
                        )
                      } />
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button type="button" onClick={handleSavePayment} > Save Payment Details </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Approval Confirmation Modal */}
      {actionModal?.type === "APPROVE" && (
        <Modal
          isOpen={true}
          onClose={() => setActionModal(null)}
          title={`Approve Garage Onboarding — ${actionModal.item.requestNumber}`}
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setActionModal(null)}>
                Cancel
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                icon={CheckCircle2}
                isLoading={isProcessing}
                onClick={handleApproveConfirm}
              >
                Confirm Approval
              </Button>
            </div>
          }
        >
          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-emerald-50/80 border border-emerald-200 p-3.5 text-xs text-emerald-900">
              You are approving <span className="font-bold">{actionModal.item.workshopDetails?.displayName}</span> ({actionModal.item.workshopDetails?.registeredName}).
            </div>

            {/* <Select
              label="Select Partner Commission Tier *"
              value={actionForm.commissionTier}
              onChange={(e) =>
                setActionForm((prev) => ({ ...prev, commissionTier: e.target.value }))
              }
              options={COMMISSION_TIERS}
            /> */}

            <Input
              label="Approval Remarks & Certification Notes"
              placeholder="e.g. Workshop bays and compliance verified."
              value={actionForm.remarks}
              onChange={(e) =>
                setActionForm((prev) => ({ ...prev, remarks: e.target.value }))
              }
            />
          </div>
        </Modal>
      )}

      {/* Rejection Confirmation Modal */}
      {actionModal?.type === "REJECT" && (
        <Modal
          isOpen={true}
          onClose={() => setActionModal(null)}
          title={`Reject Garage Onboarding — ${actionModal.item.requestNumber}`}
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="secondary" onClick={() => setActionModal(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                icon={XCircle}
                isLoading={isProcessing}
                onClick={handleRejectConfirm}
              >
                Confirm Rejection
              </Button>
            </div>
          }
        >
          <div className="space-y-4 py-2">
            <div className="rounded-xl bg-red-50/80 border border-red-200 p-3.5 text-xs text-red-900">
              You are rejecting <span className="font-bold">{actionModal.item.workshopDetails?.displayName}</span> ({actionModal.item.requestNumber}).
            </div>

            <Select
              label="Select Rejection Reason *"
              value={actionForm.rejectionReason}
              onChange={(e) =>
                setActionForm((prev) => ({ ...prev, rejectionReason: e.target.value }))
              }
              options={REJECTION_REASONS}
            />

            <Input
              label="Detailed Feedback for Business Partner"
              placeholder="Explain required corrections or non-compliance..."
              value={actionForm.remarks}
              onChange={(e) =>
                setActionForm((prev) => ({ ...prev, remarks: e.target.value }))
              }
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
