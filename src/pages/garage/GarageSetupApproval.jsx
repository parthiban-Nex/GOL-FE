import { useEffect, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Users,
  Settings,
  Building2,
  Clock,
  Search,
  Lock,
  KeyRound,
  Route,
  ShieldCheck,
  Phone,
  MapPin,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { garageOnboardService } from "@/services/api/garageOnboardService";
import { showToast } from "@/utils/toast";
import { ROLE_ROUTE_PERMISSIONS } from "./GarageSetup";

const CONFIGURATION_LABELS = {
  notification: "Notification",
  inventory: "Inventory",
  jobCard: "Job Card",
  misLabour: "MIS Labour",
  part: "Part",
  labour: "Labour",
  appointment: "Appointment",
  accidental: "Accidental",
  customerView: "Customer View",
  vehicleType: "Vehicle Type",
  purchaseOrder: "Purchase Order",
};

const REJECTION_REASONS = [
  { value: "Invalid user details", label: "Invalid user details" },
  { value: "Incorrect configuration", label: "Incorrect configuration" },
  { value: "Missing information", label: "Missing information" },
  { value: "Compliance issue", label: "Compliance issue" },
  { value: "Other", label: "Other" },
];

export default function GarageSetupApproval() {
  const [requests, setRequests] = useState([]);
  const [selected, setSelected] = useState(null);

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  const [action, setAction] = useState(null);

  const [actionForm, setActionForm] = useState({
    remarks: "",
    rejectionReason: "",
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [showPasswordMap, setShowPasswordMap] = useState({});
  const [showPinMap, setShowPinMap] = useState({});

  const togglePasswordVisibility = (index) => {
    setShowPasswordMap((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const togglePinVisibility = (index) => {
    setShowPinMap((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const loadRequests = async () => {
    try {
      const { garages, stats: apiStats } =
        await garageOnboardService.listSetupApprovals(statusFilter);

      let filtered = garages || [];
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (g) =>
            (g.requestNumber || "").toLowerCase().includes(q) ||
            (g.workshopDetails?.displayName || "").toLowerCase().includes(q) ||
            (g.customerCode || "").toLowerCase().includes(q)
        );
      }

      setRequests(filtered);
      if (apiStats) {
        setStats(apiStats);
      }
    } catch (err) {
      console.error("Failed to load setup requests:", err);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter, searchQuery]);

  const openInspect = (garage) => {
    setSelected(garage);
    setShowPasswordMap({});
    setShowPinMap({});
  };

  const closeInspect = () => {
    setSelected(null);
    setAction(null);
    setActionForm({
      remarks: "",
      rejectionReason: "",
    });
    setShowPasswordMap({});
    setShowPinMap({});
  };

  const openApproveModal = () => {
    if (!selected) return;

    setActionForm({
      remarks: "Workshop staff, roles, and route access verified. Approved for login activation.",
      rejectionReason: "",
    });

    setAction("approve");
  };

  const openRejectModal = () => {
    if (!selected) return;

    setActionForm({
      remarks: "",
      rejectionReason: "",
    });

    setAction("reject");
  };

  const handleApprove = async () => {
    if (!selected?.id) return;

    if (!actionForm.remarks.trim()) {
      showToast.error("Please enter approval remarks.");
      return;
    }

    setIsProcessing(true);

    try {
      await garageOnboardService.approveSetup(selected.id, {
        remarks: actionForm.remarks.trim(),
      });

      showToast.success("Garage setup approved successfully. Staff users are now ACTIVE.");
      closeInspect();
      await loadRequests();
    } catch (error) {
      showToast.error(
        error.message || "Failed to approve garage setup."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selected?.id) return;

    if (!actionForm.rejectionReason.trim()) {
      showToast.error("Please select rejection reason.");
      return;
    }

    if (!actionForm.remarks.trim()) {
      showToast.error("Please enter rejection feedback.");
      return;
    }

    setIsProcessing(true);

    try {
      await garageOnboardService.rejectSetup(selected.id, {
        rejectionReason: actionForm.rejectionReason.trim(),
        remarks: actionForm.remarks.trim(),
      });

      showToast.success("Garage setup rejected.");
      closeInspect();
      await loadRequests();
    } catch (error) {
      showToast.error(
        error.message || "Failed to reject garage setup."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const getSetupData = (garage) => {
    if (!garage) return { users: [], configuration: {} };

    let pending = garage.pendingSetup;
    if (typeof pending === "string") {
      try {
        pending = JSON.parse(pending);
      } catch (e) {
        // fallback
      }
    }

    if (pending && (pending.users?.length || Object.keys(pending.configuration || {}).length)) {
      return {
        users: Array.isArray(pending.users) ? pending.users : [],
        configuration: pending.configuration || {},
      };
    }

    let submissions = garage.setupSubmissions || [];
    if (typeof submissions === "string") {
      try {
        submissions = JSON.parse(submissions);
      } catch (e) {
        // fallback
      }
    }

    const latest = Array.isArray(submissions) && submissions.length > 0
      ? submissions[submissions.length - 1]
      : null;

    if (latest && (latest.users?.length || Object.keys(latest.configuration || {}).length)) {
      return {
        users: Array.isArray(latest.users) ? latest.users : [],
        configuration: latest.configuration || {},
      };
    }

    let users = garage.users || [];
    if (typeof users === "string") {
      try {
        users = JSON.parse(users);
      } catch (e) {}
    }

    let configuration = garage.configuration || {};
    if (typeof configuration === "string") {
      try {
        configuration = JSON.parse(configuration);
      } catch (e) {}
    }

    return {
      users: Array.isArray(users) ? users : [],
      configuration: configuration || {},
    };
  };

  return (
    <div className="space-y-4 pb-12">
      <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
          <Settings className="h-3.5 w-3.5" />
          Business Admin
        </div>

        <h1 className="mt-1 text-xl font-bold text-ink-900">
          Garage Setup Approvals
        </h1>

        <p className="text-xs text-ink-500">
          Confirm workshop details, map staff accounts with correct roles and routes, and activate login credentials.
        </p>
      </div>

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {[
            {
              key: "ALL",
              label: "All Requests",
              count: stats.total,
            },
            {
              key: "PENDING",
              label: "Pending",
              count: stats.pending,
            },
            {
              key: "APPROVED",
              label: "Approved",
              count: stats.approved,
            },
            {
              key: "REJECTED",
              label: "Rejected",
              count: stats.rejected,
            },
          ].map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setStatusFilter(item.key)}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-colors ${
                statusFilter === item.key
                  ? "bg-brand-600 text-white shadow-xs"
                  : "bg-ink-100 text-ink-600 hover:bg-ink-200"
              }`}
            >
              {item.label} ({item.count})
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search garage, customer code, req #..."
            icon={Search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </Card>

      <Card>
        {requests.length === 0 ? (
          <div className="py-12 text-center">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />

            <h2 className="mt-3 text-sm font-bold text-ink-900">
              No Setup Requests Found
            </h2>

            <p className="mt-1 text-xs text-ink-500">
              There are no setup requests matching your current filter or search.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-ink-200 text-ink-500 font-semibold">
                  <th className="px-4 py-3">Garage / Workshop</th>
                  <th className="px-4 py-3">Users</th>
                  <th className="px-4 py-3">Modules</th>
                  <th className="px-4 py-3">Submitted By</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {requests.map((garage) => {
                  const { users, configuration } = getSetupData(garage);
                  const enabledModules = Object.values(configuration).filter(Boolean).length;

                  return (
                    <tr key={garage.id} className="border-b border-ink-100 hover:bg-ink-50/50 transition-colors">
                      {/* GARAGE */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                            <Building2 className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-bold text-ink-900">
                              {garage.workshopDetails?.displayName || garage.workshopDetails?.workshopName || "Workshop"}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-ink-400">
                              <span>{garage.requestNumber}</span>
                              {garage.customerCode && (
                                <span className="rounded bg-brand-50 px-1 font-semibold text-brand-700 border border-brand-200">
                                  {garage.customerCode}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* USERS */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-medium text-ink-800">
                          <Users className="h-3.5 w-3.5 text-brand-600" />
                          <span>{users.length} {users.length === 1 ? "staff" : "staff"}</span>
                        </div>
                      </td>

                      {/* MODULES */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-medium text-ink-800">
                          <Settings className="h-3.5 w-3.5 text-brand-600" />
                          <span>{enabledModules} modules</span>
                        </div>
                      </td>

                      {/* SUBMITTED BY */}
                      <td className="px-4 py-3">
                        <span className="text-ink-700">
                          {garage.setupApproval?.submittedByName || "-"}
                        </span>
                      </td>

                      {/* STATUS */}
                      <td className="px-4 py-3">
                        {(!garage.setupApproval?.status || garage.setupApproval?.status === "PENDING") && (
                          <Badge tone="warning">
                            <Clock className="mr-1 inline h-3 w-3" />
                            PENDING
                          </Badge>
                        )}

                        {garage.setupApproval?.status === "APPROVED" && (
                          <Badge tone="success">
                            <CheckCircle2 className="mr-1 inline h-3 w-3" />
                            APPROVED
                          </Badge>
                        )}

                        {garage.setupApproval?.status === "REJECTED" && (
                          <Badge tone="danger">
                            <XCircle className="mr-1 inline h-3 w-3" />
                            REJECTED
                          </Badge>
                        )}
                      </td>

                      {/* ACTION */}
                      <td className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          icon={Eye}
                          onClick={() => openInspect(garage)}
                        >
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* INSPECT MODAL */}
      {selected && (
        <Modal isOpen={true} onClose={closeInspect} title="Inspect Garage Setup & Credentials" size="xl">
          <div className="space-y-5">
            {/* WORKSHOP CONFIRMATION BANNER */}
            <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-xs">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-ink-900">
                        {selected.workshopDetails?.displayName || selected.workshopDetails?.workshopName || "Workshop"}
                      </h2>
                      {selected.customerCode ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-brand-100 px-2 py-0.5 text-xs font-bold text-brand-800 border border-brand-300">
                          <ShieldCheck className="h-3.5 w-3.5 text-brand-600" />
                          Outlet Code: {selected.customerCode}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          Outlet Code Pending
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-500">
                      <span>Req #: <span className="font-semibold text-ink-700">{selected.requestNumber}</span></span>
                      {selected.workshopDetails?.city && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-ink-400" />
                          {selected.workshopDetails.city}, {selected.workshopDetails.state}
                        </span>
                      )}
                      {selected.workshopDetails?.mobileNumber && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3 w-3 text-ink-400" />
                          {selected.workshopDetails.mobileNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="success">
                    <ShieldCheck className="mr-1 inline h-3 w-3" />
                    Verified Workshop
                  </Badge>
                </div>
              </div>
            </div>

            {/* USERS & CREDENTIALS VERIFICATION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-brand-600" />
                  <h3 className="text-sm font-bold text-ink-900">
                    Workshop Users & Login Mapping ({getSetupData(selected).users.length})
                  </h3>
                </div>
                <span className="text-xs text-ink-500">
                  Verify staff roles, routes & login credentials before approval
                </span>
              </div>

              {getSetupData(selected).users.length > 0 ? (
                <div className="space-y-3">
                  {getSetupData(selected).users.map((user, index) => {
                    const routes = ROLE_ROUTE_PERMISSIONS[user.role] || [
                      "Operational Dashboard",
                      "Workshop Settings",
                    ];
                    const isApproved = selected.setupApproval?.status === "APPROVED";
                    const isPasswordShown = !!showPasswordMap[index];
                    const isPinShown = !!showPinMap[index];

                    return (
                      <div
                        key={user.id || index}
                        className="rounded-xl border border-ink-200 bg-white p-4 shadow-xs transition-shadow hover:shadow-sm"
                      >
                        {/* Top row: Name, Role, Status badge */}
                        <div className="flex flex-col gap-2 border-b border-ink-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100 font-bold text-ink-700">
                              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-ink-900">
                                {user.name || "Unnamed User"}
                              </h4>
                              <p className="text-[11px] text-ink-500">
                                Login Mobile ID: <span className="font-semibold text-ink-800">{user.mobile || "-"}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 border border-brand-200">
                              {user.role}
                            </span>
                            {isApproved ? (
                              <Badge tone="success">
                                <CheckCircle2 className="mr-1 inline h-3 w-3" />
                                ACTIVE
                              </Badge>
                            ) : (
                              <Badge tone="warning">
                                <Clock className="mr-1 inline h-3 w-3" />
                                PENDING ACTIVATION
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Info grid */}
                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                          <div>
                            <span className="text-[11px] text-ink-400">Mobile (Login ID)</span>
                            <p className="font-semibold text-ink-800">{user.mobile || "-"}</p>
                          </div>
                          <div>
                            <span className="text-[11px] text-ink-400">Alternate Mobile</span>
                            <p className="font-semibold text-ink-800">{user.alternateMobile || "-"}</p>
                          </div>
                          <div>
                            <span className="text-[11px] text-ink-400">Email Address</span>
                            <p className="font-semibold text-ink-800 truncate" title={user.email}>{user.email || "-"}</p>
                          </div>
                          <div>
                            <span className="text-[11px] text-ink-400">Remarks</span>
                            <p className="font-semibold text-ink-800">{user.remarks || "Standard Staff"}</p>
                          </div>
                        </div>

                        {/* Credentials Row */}
                        <div className="mt-3 rounded-lg border border-brand-100 bg-brand-50/30 p-3">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap items-center gap-4 text-xs">
                              {/* Default Password */}
                              <div className="flex items-center gap-1.5">
                                <Lock className="h-3.5 w-3.5 text-brand-600" />
                                <span className="font-medium text-ink-500">Default Password:</span>
                                <span className="rounded bg-white px-2 py-0.5 font-mono text-xs font-bold text-ink-900 border border-ink-200">
                                  {isPasswordShown ? (user.defaultPassword || "Welcome@123") : "••••••••"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => togglePasswordVisibility(index)}
                                  className="text-ink-400 hover:text-ink-700"
                                  title={isPasswordShown ? "Hide" : "Show"}
                                >
                                  {isPasswordShown ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                              </div>

                              {/* Default PIN */}
                              <div className="flex items-center gap-1.5">
                                <KeyRound className="h-3.5 w-3.5 text-brand-600" />
                                <span className="font-medium text-ink-500">Default 4-digit PIN:</span>
                                <span className="rounded bg-white px-2 py-0.5 font-mono text-xs font-bold text-ink-900 border border-ink-200">
                                  {isPinShown ? (user.defaultPin || "1234") : "••••"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => togglePinVisibility(index)}
                                  className="text-ink-400 hover:text-ink-700"
                                  title={isPinShown ? "Hide" : "Show"}
                                >
                                  {isPinShown ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                              </div>
                            </div>

                            <div className="text-[11px] text-ink-400 flex items-center gap-1">
                              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 inline" />
                              Auth V1 (Password) & Auth V2 (PIN) Ready
                            </div>
                          </div>
                        </div>

                        {/* Role Routes Preview */}
                        <div className="mt-3">
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-600">
                            <Route className="h-3 w-3 text-brand-600" />
                            <span>Authorized Modules & Route Access for {user.role}:</span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {routes.map((rt) => (
                              <span
                                key={rt}
                                className="inline-flex items-center rounded-md bg-ink-50 px-2 py-0.5 text-[10px] font-semibold text-ink-700 border border-ink-200"
                              >
                                {rt}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptySection text="No users requested for this workshop." />
              )}
            </div>

            {/* CONFIGURATION */}
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4 text-brand-600" />
                <h3 className="text-sm font-bold">Requested Configuration</h3>
              </div>
              {Object.keys(getSetupData(selected).configuration).length > 0 ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(getSetupData(selected).configuration).map(([key, value]) => (
                    <div
                      key={key}
                      className={`rounded-lg border p-3 ${
                        value
                          ? "border-emerald-200 bg-emerald-50"
                          : "border-ink-200 bg-ink-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">
                          {CONFIGURATION_LABELS[key] || key}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${
                            value ? "text-emerald-700" : "text-ink-400"
                          }`}
                        >
                          {value ? "ENABLED" : "DISABLED"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptySection text="No configuration submitted." />
              )}
            </div>

            {/* PREVIOUS APPROVAL/REJECTION DETAILS */}
            {selected.setupApproval?.status && selected.setupApproval?.status !== "PENDING" && (
              <div
                className={`rounded-xl border p-4 ${
                  selected.setupApproval?.status === "APPROVED"
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-red-200 bg-red-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  {selected.setupApproval?.status === "APPROVED" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}

                  <h3 className="text-sm font-bold">
                    {selected.setupApproval?.status === "APPROVED"
                      ? "Approval Details"
                      : "Rejection Details"}
                  </h3>
                </div>

                {selected.setupApproval?.rejectionReason && (
                  <div className="mt-3">
                    <p className="text-[10px] font-semibold text-ink-400">
                      Rejection Reason
                    </p>
                    <p className="text-xs font-semibold text-ink-800">
                      {selected.setupApproval.rejectionReason}
                    </p>
                  </div>
                )}

                {selected.setupApproval?.remarks && (
                  <div className="mt-3">
                    <p className="text-[10px] font-semibold text-ink-400">
                      Admin Remarks
                    </p>
                    <p className="text-xs text-ink-800">
                      {selected.setupApproval.remarks}
                    </p>
                  </div>
                )}

                {selected.setupApproval?.reviewedBy && (
                  <div className="mt-3">
                    <p className="text-[10px] font-semibold text-ink-400">
                      Reviewed By
                    </p>
                    <p className="text-xs font-semibold text-ink-800">
                      {selected.setupApproval.reviewedBy}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ACTION BUTTONS */}
            {(!selected.setupApproval?.status || selected.setupApproval?.status === "PENDING") && (
              <div className="flex justify-end gap-2 border-t border-ink-200 pt-4">
                <Button type="button" variant="outline" icon={XCircle} onClick={openRejectModal}>
                  Reject
                </Button>
                <Button type="button" variant="primary" icon={CheckCircle2} onClick={openApproveModal}>
                  Approve Setup
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* APPROVE MODAL */}
      {selected && action === "approve" && (
        <Modal
          isOpen={true}
          onClose={() => setAction(null)}
          title="Approve Garage Setup & Activate Users"
          size="md"
        >
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-900">
              <p className="font-semibold">
                You are approving setup for:
              </p>
              <p className="mt-1 text-sm font-bold text-ink-900">
                {selected.workshopDetails?.displayName || selected.workshopDetails?.workshopName}{" "}
                {selected.customerCode ? `(${selected.customerCode})` : `(${selected.requestNumber})`}
              </p>
              <p className="mt-2 text-[11px] text-emerald-800">
                ✓ All {getSetupData(selected).users.length} requested staff accounts will be marked as <span className="font-bold">ACTIVE</span> with verified roles and default login credentials.
              </p>
            </div>

            <Input
              label="Approval Remarks & Certification Notes *"
              placeholder="e.g. Workshop staff and roles verified. Approved for activation."
              value={actionForm.remarks}
              onChange={(e) =>
                setActionForm((prev) => ({
                  ...prev,
                  remarks: e.target.value,
                }))
              }
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAction(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                icon={CheckCircle2}
                isLoading={isProcessing}
                onClick={handleApprove}
              >
                Confirm & Activate Users
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* REJECT MODAL */}
      {selected && action === "reject" && (
        <Modal
          isOpen={true}
          onClose={() => setAction(null)}
          title="Reject Garage Setup"
          size="md"
        >
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-900">
              You are rejecting{" "}
              <span className="font-bold">
                {selected.workshopDetails?.displayName || selected.workshopDetails?.workshopName}
              </span>{" "}
              ({selected.requestNumber}).
            </div>

            <Select
              label="Select Rejection Reason *"
              value={actionForm.rejectionReason}
              onChange={(e) =>
                setActionForm((prev) => ({
                  ...prev,
                  rejectionReason: e.target.value,
                }))
              }
              options={REJECTION_REASONS}
            />

            <Input
              label="Detailed Feedback for Garage Owner *"
              placeholder="Explain required corrections or non-compliance..."
              value={actionForm.remarks}
              onChange={(e) =>
                setActionForm((prev) => ({
                  ...prev,
                  remarks: e.target.value,
                }))
              }
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAction(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                icon={XCircle}
                isLoading={isProcessing}
                onClick={handleReject}
              >
                Reject Setup
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-[10px] text-ink-400">{label}</p>
      <p className="text-xs font-semibold text-ink-800">{value || "-"}</p>
    </div>
  );
}

function EmptySection({ text }) {
  return (
    <div className="rounded-lg border border-dashed border-ink-200 p-5 text-center text-xs text-ink-400">
      {text}
    </div>
  );
}

