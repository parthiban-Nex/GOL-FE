import { useEffect, useState } from "react";
import clsx from "clsx";
import {
  Users as UsersIcon,
  Settings,
  Plus,
  Trash2,
  Save,
  Info,
  Building2,
  ShieldCheck,
  Store,
  Clock,
  Eye,
  EyeOff,
  Lock,
  KeyRound,
  Route,
} from "lucide-react";

import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";

import { useAuth } from "@/hooks/useAuth";
import { garageOnboardService } from "@/services/api/garageOnboardService";
import { showToast } from "@/utils/toast";

const USER_ROLES = [
  { value: "Owner / Director", label: "Owner / Director" },
  { value: "Workshop Manager", label: "Workshop Manager" },
  { value: "Service Advisor", label: "Service Advisor" },
  { value: "Head Technician", label: "Head Technician" },
  {
    value: "Store & Inventory Incharge",
    label: "Store & Inventory Incharge",
  },
  {
    value: "Cashier & Billing Accountant",
    label: "Cashier & Billing Accountant",
  },
];

export const ROLE_ROUTE_PERMISSIONS = {
  "Owner / Director": [
    "Full Dashboard",
    "Customer Management",
    "Service & Job Cards",
    "Parts & Procurement",
    "Finance & Accounts",
    "Analytics & Reports",
    "Workshop Settings",
  ],
  "Workshop Manager": [
    "Operational Dashboard",
    "Job Card Oversight",
    "Service Estimate Approval",
    "Technician Bay Tracking",
    "Inventory Inflow/Outflow",
    "Customer Management",
    "Productivity Reports",
  ],
  "Service Advisor": [
    "Digital Job Cards",
    "Customer Directory",
    "Service Estimates",
    "Appointment Calendar",
    "Live Progress Tracking",
  ],
  "Head Technician": [
    "Assigned Job Cards",
    "Bay Repair Progression",
    "Spares Requisition",
    "Quality Check & Inspection",
  ],
  "Store & Inventory Incharge": [
    "Parts Master Catalog",
    "Spares Issue & Returns",
    "Purchase Orders (PO)",
    "Direct GRN & Stock Transfer",
    "Bin Locations",
  ],
  "Cashier & Billing Accountant": [
    "Invoice Billing",
    "Payment Receipts",
    "Garage Wallet & Loyalty",
    "Expense Tracking",
    "Bank Deposits",
  ],
};

export const CONFIGURATION_LABELS = {
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

export const ROUTE_REQUIRED_MODULE = {
  "Digital Job Cards": "jobCard",
  "Service & Job Cards": "jobCard",
  "Job Card Oversight": "jobCard",
  "Assigned Job Cards": "jobCard",
  "Bay Repair Progression": "jobCard",
  "Technician Bay Tracking": "misLabour",
  "Productivity Reports": "misLabour",
  "Service Estimate Approval": "labour",
  "Service Estimates": "labour",
  "Appointment Calendar": "appointment",
  "Live Progress Tracking": "customerView",
  "Parts & Procurement": "part",
  "Parts Master Catalog": "part",
  "Spares Issue & Returns": "part",
  "Spares Requisition": "part",
  "Inventory Inflow/Outflow": "inventory",
  "Workshop inventory tracking": "inventory",
  "Bin Locations": "inventory",
  "Purchase Orders (PO)": "purchaseOrder",
  "Direct GRN & Stock Transfer": "purchaseOrder",
};

export const createEmptyUser = () => ({
  id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  name: "",
  mobile: "",
  alternateMobile: "",
  email: "",
  role: "Service Advisor",
  defaultPassword: "Welcome@123",
  defaultPin: "1234",
  remarks: "",
  status: "INACTIVE",
});

export const CONFIGURATION_OPTIONS = [
  {
    key: "notification",
    label: "Notification",
    description: "Automated SMS, email & WhatsApp customer notifications",
  },
  {
    key: "inventory",
    label: "Inventory",
    description: "Workshop inventory tracking, stock levels and bin allocations",
  },
  {
    key: "jobCard",
    label: "Job Card",
    description: "Digital repair orders, bay tracking and digital estimate conversion",
  },
  {
    key: "misLabour",
    label: "MIS Labour",
    description: "Management analytics, technician productivity & labor efficiency",
  },
  {
    key: "part",
    label: "Part",
    description: "OEM / OES spares catalog and pricing integrations",
  },
  {
    key: "labour",
    label: "Labour",
    description: "Standard labor operation schedules, rate charts and hourly allowances",
  },
  {
    key: "appointment",
    label: "Appointment",
    description: "Online customer booking calendar and slot scheduling",
  },
  {
    key: "accidental",
    label: "Accidental",
    description: "Body shop claim estimates, survey approvals and dent/paint tracking",
  },
  {
    key: "customerView",
    label: "Customer View",
    description: "Live vehicle service progression tracking portal for vehicle owners",
  },
  {
    key: "vehicleType",
    label: "Vehicle Type",
    description: "Multi-category support (2W, 4W, Commercial, EV, Luxury)",
  },
  {
    key: "purchaseOrder",
    label: "Purchase Order",
    description: "Direct supply hub procurement, PO creation and GRN processing",
  },
];

export default function GarageSetup() {
  const { user } = useAuth();
  const [garage, setGarage] = useState(null);
  const [availableGarages, setAvailableGarages] = useState([]);
  const [selectedGarageId, setSelectedGarageId] = useState(() => localStorage.getItem("gol_active_garage_id") || "");
  const [users, setUsers] = useState([createEmptyUser()]);
  const [showPasswords, setShowPasswords] = useState({});
  const [configuration, setConfiguration] = useState({});
  const [pageTab, setPageTab] = useState("setup");
  const [activeTab, setActiveTab] = useState("users");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  const loadGarage = async (forcedGarageId = null) => {
    try {
      const [{ requests }, mySubmissions] = await Promise.all([
        garageOnboardService.listGarageApprovals({ status: "APPROVED" }).catch(() => ({ requests: [] })),
        garageOnboardService.getMySubmissions().catch(() => []),
      ]);

      const allApproved = [];
      const seenIds = new Set();

      const addGarage = (g) => {
        if (!g) return;
        const key = String(g.id || g.requestNumber || "");
        if (!key || seenIds.has(key)) return;
        seenIds.add(key);
        allApproved.push(g);
      };

      // Check user's own approved submissions first
      (mySubmissions || []).filter((s) => s.status === "APPROVED").forEach(addGarage);
      // Then all approved requests from system
      (requests || []).filter((r) => r.status === "APPROVED").forEach(addGarage);

      // Sort descending by latest approved / created date
      allApproved.sort((a, b) => {
        const dateA = new Date(a.approvedAt || a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.approvedAt || b.updatedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      setAvailableGarages(allApproved);

      const targetId =
        forcedGarageId ||
        selectedGarageId ||
        localStorage.getItem("gol_active_garage_id") ||
        user?.garageId ||
        "";

      let currentGarage = null;
      if (targetId) {
        currentGarage = allApproved.find(
          (item) =>
            String(item.id) === String(targetId) ||
            String(item.requestNumber) === String(targetId) ||
            String(item.customerCode) === String(targetId)
        );
      }

      // If still not matched, check user outlet
      if (!currentGarage && user?.outlet) {
        const outletVal = String(user.outlet.id || user.outlet.outletId || user.outlet);
        currentGarage = allApproved.find(
          (item) =>
            String(item.id) === outletVal ||
            String(item.outletId) === outletVal ||
            String(item.requestNumber) === outletVal ||
            String(item.customerCode) === outletVal
        );
      }

      // If still not matched, take the NEWEST approved garage (first in descending sorted list)
      if (!currentGarage && allApproved.length > 0) {
        currentGarage = allApproved[0];
      }

      if (!currentGarage) {
        setGarage(null);
        return;
      }

      setGarage(currentGarage);
      const activeId = currentGarage.id || currentGarage.requestNumber;
      setSelectedGarageId(activeId);
      localStorage.setItem("gol_active_garage_id", activeId);

      const setupStatus = currentGarage.setupApproval?.status || "NONE";
      if (setupStatus === "PENDING" && currentGarage.pendingSetup?.users?.length) {
        // While pending review, show the submitted pending users as read-only
        setUsers(currentGarage.pendingSetup.users);
        setConfiguration(currentGarage.pendingSetup.configuration || {});
      } else {
        // Initially, and after approval has been done, form MUST start empty
        setUsers([createEmptyUser()]);
        setConfiguration({});
      }
    } catch (err) {
      console.error("Failed to load garage setup:", err);
    }
  };

  useEffect(() => {
    loadGarage();
  }, [user?.garageId]);

  const handleSelectWorkshop = (garageId) => {
    setSelectedGarageId(garageId);
    localStorage.setItem("gol_active_garage_id", garageId);
    loadGarage(garageId);
  };

  const addUser = () => {
    setUsers((prev) => [
      ...prev,
      createEmptyUser(),
    ]);
  };

  const updateUser = (index, field, value) => {
    setUsers((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      return updated;
    });
  };

  const togglePasswordVisibility = (index) => {
    setShowPasswords((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const removeUser = (index) => {
    if (users.length <= 1) {
      showToast.error("At least one user must be listed.");
      return;
    }
    setUsers((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleConfiguration = (key) => {
    setConfiguration((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const selectAllConfigurations = () => {
    const all = {};

    CONFIGURATION_OPTIONS.forEach((item) => {
      all[item.key] = true;
    });

    setConfiguration(all);
  };

  const deselectAllConfigurations = () => {
    const none = {};
    CONFIGURATION_OPTIONS.forEach((item) => {
      none[item.key] = false;
    });
    setConfiguration(none);
  };

  const handleSave = async () => {
    if (!garage?.id) {
      showToast.error("Garage not found.");
      return;
    }
    for (let i = 0; i < users.length; i++) {
      const u = users[i];
      if (!u.name?.trim()) {
        showToast.error(`User ${i + 1}: Name is required.`);
        return;
      }
      if (!u.mobile?.trim() || u.mobile.replace(/\D/g, "").length !== 10) {
        showToast.error(`User ${i + 1}: Enter a valid 10-digit mobile number.`);
        return;
      }
      if (!u.defaultPassword?.trim()) {
        showToast.error(`User ${i + 1}: Default Password is required.`);
        return;
      }
      if (!u.defaultPin?.trim() || u.defaultPin.replace(/\D/g, "").length !== 4) {
        showToast.error(`User ${i + 1}: Enter a valid 4-digit numeric PIN.`);
        return;
      }
    }

    if (garage.setupApproval?.status === "PENDING") {
      showToast.error("A setup change is already waiting for approval.");
      return;
    }

    setIsSaving(true);

    try {
      const updatedGarage = await garageOnboardService.submitSetupChanges(
        garage.id,
        { users, configuration }
      );
      if (updatedGarage) setGarage(updatedGarage);
      setUsers([createEmptyUser()]);
      setConfiguration({});
      await loadGarage(garage.id);
      showToast.success("Setup changes with user login credentials submitted for Business Admin approval.");
    } catch (err) {
      showToast.error(
        err.message || "Failed to submit setup changes."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleReinitiate = (submission) => {
    if (submission?.status !== "REJECTED") return;

    setUsers(submission.users?.length ? submission.users : [createEmptyUser()]);
    setConfiguration(submission.configuration || {});
    setActiveTab("users");
    setPageTab("setup");
    setSelectedSubmission(null);

    showToast.info("Rejected setup loaded. Review and resubmit your changes.");
  };

  if (!garage) {
    return (
      <div className="space-y-4 pb-12">
        <div className="flex flex-col gap-4 rounded-xl border border-ink-100 bg-white p-4 shadow-card">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
            <ShieldCheck className="h-3.5 w-3.5" /> Garage Owner & Director Portal
          </div>
          <h1 className="mt-1 text-xl font-bold text-ink-900">Garage Setup </h1>
          <p className="text-xs text-ink-500">  No approved garage is assigned to this Owner / Director account.</p>
        </div>

        <Card className="py-12 text-center">
          <Store className="mx-auto h-8 w-8 text-amber-500" />
          <h2 className="mt-3 text-base font-bold"> No Garage Assigned </h2>
          <p className="mx-auto mt-1 max-w-md text-xs text-ink-500"> Your Owner / Director account has not been assigned to an approved garage. </p>
        </Card>
      </div>
    );
  }

  const setupStatus = garage.setupApproval?.status || "NONE";
  const submissions = [...(garage.setupSubmissions || [])].sort(
    (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

  return (
    <div className="space-y-4 pb-12">
      <div className="flex flex-col rounded-xl border border-ink-100 bg-white p-4 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700"><ShieldCheck className="h-3.5 w-3.5" /> Garage Owner & Director Portal </div>
            <h1 className="mt-1 text-xl font-bold text-ink-900"> Garage Setup & Configuration   </h1>
            <p className="text-xs text-ink-500"> Manage users and operational modules for your approved workshop.</p>
          </div>

          {setupStatus === "PENDING" && (
            <Badge tone="warning">  <Clock className="mr-1 inline h-3 w-3" /> Waiting for Approval</Badge>
          )}

          {setupStatus === "REJECTED" && (
            <Badge tone="danger">  Setup Rejected  </Badge>
          )}

          {setupStatus === "APPROVED" && (
            <Badge tone="success">  Setup Approved  </Badge>
          )}
        </div>


        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-ink-100 pt-3">

          {/* Left - Active Workshop */}
          <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs">
            <Building2 className="h-4 w-4 shrink-0 text-brand-600" />

            <span className="text-ink-500 whitespace-nowrap">
              Active Workshop:
            </span>

            {availableGarages.length > 1 ? (
              <select
                value={garage.id || garage.requestNumber}
                onChange={(e) => handleSelectWorkshop(e.target.value)}
                className="cursor-pointer rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs font-bold text-ink-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 max-w-[260px] truncate"
              >
                {availableGarages.map((g) => (
                  <option key={g.id || g.requestNumber} value={g.id || g.requestNumber}>
                    {g.workshopDetails?.displayName || "Workshop"} ({g.customerCode || g.requestNumber})
                  </option>
                ))}
              </select>
            ) : (
              <span className="truncate font-bold text-ink-900">
                {garage.workshopDetails?.displayName || "Workshop"}
              </span>
            )}

            <Badge tone="success">APPROVED</Badge>

            <span className="shrink-0 font-mono text-[11px] text-ink-400">
              ({garage.customerCode || garage.requestNumber})
            </span>
          </div>

          {/* Right - Main Tabs */}
          <div className="flex shrink-0 gap-1.5 rounded-xl bg-ink-100/80 p-1">

            <button
              type="button"
              onClick={() => {
                setPageTab("setup");
                setActiveTab("users");
              }}
              className={clsx(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer",
                pageTab === "setup"
                  ? "bg-brand-600 text-white shadow-sm ring-2 ring-brand-500/20"
                  : "text-ink-600 hover:bg-white/50 hover:text-ink-900"
              )}
            >
              <Settings className="h-3.5 w-3.5" />
              Setup
            </button>

            <button
              type="button"
              onClick={() => setPageTab("submissions")}
              className={clsx(
                "relative flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer",
                pageTab === "submissions"
                  ? "bg-brand-600 text-white shadow-sm ring-2 ring-brand-500/20"
                  : "text-ink-600 hover:bg-white/50 hover:text-ink-900"
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              My Submissions

              {submissions.length > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
                  {submissions.length}
                </span>
              )}
            </button>

          </div>
        </div>
      </div>

      {/* APPROVED GARAGES & MAPPED USERS DIRECTORY */}
      {availableGarages.length > 0 && (
        <div className="rounded-xl border border-ink-200 bg-white p-4 shadow-card space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between border-b border-ink-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-brand-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink-700">
                Approved Workshops & Mapped Staff ({availableGarages.length})
              </h2>
            </div>
            <span className="text-[11px] text-ink-400">
              Select a workshop to manage its staff accounts and operational configuration
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {availableGarages.map((g) => {
              const isSelected = String(g.id || g.requestNumber) === String(garage.id || garage.requestNumber);
              const gUsers = g.users || [];
              const gModules = g.configuration ? Object.values(g.configuration).filter(Boolean).length : 0;

              return (
                <div
                  key={g.id || g.requestNumber}
                  onClick={() => handleSelectWorkshop(g.id || g.requestNumber)}
                  className={clsx(
                    "cursor-pointer rounded-xl border p-3.5 transition-all text-left",
                    isSelected
                      ? "border-brand-500 bg-brand-50/40 shadow-sm ring-2 ring-brand-500/20"
                      : "border-ink-200 bg-white hover:border-brand-300 hover:bg-ink-50/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={clsx(
                          "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold",
                          isSelected ? "bg-brand-600 text-white" : "bg-ink-100 text-ink-700"
                        )}
                      >
                        <Building2 className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-ink-900">
                          {g.workshopDetails?.displayName || g.workshopDetails?.workshopName || "Workshop"}
                        </h3>
                        <p className="font-mono text-[11px] text-ink-400">
                          {g.customerCode || g.requestNumber}
                        </p>
                      </div>
                    </div>
                    {isSelected ? (
                      <span className="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                        Approved
                      </span>
                    )}
                  </div>

                  {/* Location & Bays */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-ink-500 border-t border-ink-100 pt-2">
                    <span className="truncate">
                      {g.workshopDetails?.city ? `${g.workshopDetails.city}, ${g.workshopDetails.state || ""}` : "Workshop Location"}
                    </span>
                    <span className="font-medium text-ink-700 shrink-0">
                      {g.workshopDetails?.bays ? `${g.workshopDetails.bays} Bays` : "2 Bays"}
                    </span>
                  </div>

                  {/* Users inside this garage */}
                  <div className="mt-2 rounded-lg bg-white/90 p-2.5 border border-ink-100 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-ink-500">
                      <span className="flex items-center gap-1 font-bold text-ink-700">
                        <UsersIcon className="h-3 w-3 text-brand-600" />
                        Users Inside Workshop ({gUsers.length})
                      </span>
                      {gModules > 0 && <span className="text-emerald-700 font-bold">{gModules} modules active</span>}
                    </div>

                    {gUsers.length > 0 ? (
                      <div className="space-y-1">
                        {gUsers.map((u, ui) => (
                          <div key={u.id || ui} className="flex items-center justify-between text-[11px] text-ink-800 bg-ink-50/60 rounded px-2 py-1">
                            <span className="font-medium truncate">{u.name || `User ${ui + 1}`}</span>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-semibold text-brand-700 bg-brand-50 px-1.5 py-0.5 rounded border border-brand-200">
                                {u.role || "Staff"}
                              </span>
                              {u.mobile && (
                                <span className="text-[10px] font-mono text-ink-400">
                                  {u.mobile}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] italic text-ink-400 py-0.5">No staff users configured yet</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {setupStatus === "PENDING" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          Your Users and Configuration changes have been
          submitted to Business Admin. They will become active
          only after approval.
        </div>
      )}

      {setupStatus === "REJECTED" && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          <p className="font-bold">  Setup changes were rejected.</p>
          <p className="mt-1">
            {garage.setupApproval?.rejectionReason ||
              "Please review your changes and resubmit."}
          </p>
        </div>
      )}

      {pageTab === "setup" && (
        <Card>
          <div className="mb-5 flex border-b border-ink-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("users")}
              className={clsx(
                "flex items-center gap-2 border-b-2 px-4 py-2.5",
                activeTab === "users"
                  ? "border-brand-600 bg-brand-50/50 text-brand-600"
                  : "border-transparent text-ink-500"
              )}>
              <UsersIcon className="h-4 w-4" /> 1. User Details ({users.length}) </button>
            <button
              type="button"
              onClick={() => setActiveTab("configuration")}
              className={clsx(
                "flex items-center gap-2 border-b-2 px-4 py-2.5",
                activeTab === "configuration"
                  ? "border-brand-600 bg-brand-50/50 text-brand-600"
                  : "border-transparent text-ink-500"
              )}
            >
              <Settings className="h-4 w-4" />   2. Module Configuration </button>
          </div>

          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-ink-100 pb-3">
                <div>
                  <h2 className="text-sm font-bold text-ink-900">
                    Staff Users & Login Credentials
                  </h2>
                  <p className="text-xs text-ink-500">
                    Enter staff details and login credentials to map under {garage.workshopDetails?.displayName || "this workshop"}.
                  </p>
                </div>
                <Button type="button" size="sm" variant="outline" icon={Plus} onClick={addUser} disabled={setupStatus === "PENDING"}>
                  Add User
                </Button>
              </div>

              {users.map((usr, index) => (
                <div key={usr.id || index} className="space-y-3 rounded-xl border border-ink-200 bg-ink-50/40 p-4" >
                  <div className="flex items-center justify-between border-b border-ink-200 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">  {index + 1}  </span>
                      <span className="text-xs font-bold">   {usr.name?.trim() ? usr.name : `New User ${index + 1}`} </span>
                    </div>
                    {users.length > 1 && (
                      <button type="button" onClick={() => removeUser(index)} disabled={setupStatus === "PENDING"} className="text-danger-500 disabled:opacity-40" >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Input
                      label="Full Name *"
                      placeholder="Full Name"
                      value={usr.name || ""}
                      disabled={setupStatus === "PENDING"}
                      onChange={(e) =>
                        updateUser(
                          index,
                          "name",
                          e.target.value
                        )
                      }
                    />

                    <Input
                      label="Mobile Number (Login ID) *"
                      placeholder="10-digit mobile"
                      maxLength={10}
                      value={usr.mobile || ""}
                      disabled={setupStatus === "PENDING"}
                      onChange={(e) =>
                        updateUser(
                          index,
                          "mobile",
                          e.target.value.replace(/\D/g, "")
                        )
                      }
                    />

                    <Input
                      label="Alternate Mobile Number"
                      value={usr.alternateMobile || ""}
                      disabled={setupStatus === "PENDING"}
                      onChange={(e) =>
                        updateUser(
                          index,
                          "alternateMobile",
                          e.target.value
                        )
                      }
                    />

                    <Input
                      label="Email"
                      type="email"
                      value={usr.email || ""}
                      disabled={setupStatus === "PENDING"}
                      onChange={(e) =>
                        updateUser(
                          index,
                          "email",
                          e.target.value
                        )
                      }
                    />

                    <Select
                      label="Role *"
                      value={
                        usr.role || "Service Advisor"
                      }
                      disabled={setupStatus === "PENDING"}
                      onChange={(e) =>
                        updateUser(
                          index,
                          "role",
                          e.target.value
                        )
                      }
                      options={USER_ROLES}
                    />

                    <Input
                      label="Remarks"
                      value={usr.remarks || ""}
                      disabled={setupStatus === "PENDING"}
                      onChange={(e) =>
                        updateUser(
                          index,
                          "remarks",
                          e.target.value
                        )
                      }
                    />

                    {/* Default Password */}
                    <div className="relative">
                      <Input
                        label="Default Password *"
                        type={showPasswords[index] ? "text" : "password"}
                        placeholder="Default Login Password"
                        value={usr.defaultPassword || ""}
                        disabled={setupStatus === "PENDING"}
                        onChange={(e) =>
                          updateUser(
                            index,
                            "defaultPassword",
                            e.target.value
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(index)}
                        className="absolute right-3 top-[34px] text-ink-400 hover:text-ink-700"
                        tabIndex={-1}
                      >
                        {showPasswords[index] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Default 4-digit PIN */}
                    <Input
                      label="Default Secret PIN (4 digits) *"
                      placeholder="e.g. 1234"
                      maxLength={4}
                      value={usr.defaultPin || ""}
                      disabled={setupStatus === "PENDING"}
                      onChange={(e) =>
                        updateUser(
                          index,
                          "defaultPin",
                          e.target.value.replace(/\D/g, "")
                        )
                      }
                    />
                  </div>

                  {/* Role Route Permissions Confirmation */}
                  <div className="rounded-lg border border-brand-100 bg-brand-50/50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] font-bold text-brand-900">
                      <div className="flex items-center gap-1.5">
                        <Route className="h-3.5 w-3.5 text-brand-600" />
                        Accessible Routes & Permissions for {usr.role || "Service Advisor"}:
                      </div>
                      <span className="text-[10px] font-normal text-ink-500">
                        Synchronized with{" "}
                        <button
                          type="button"
                          onClick={() => setActiveTab("configuration")}
                          className="font-semibold text-brand-600 underline hover:text-brand-800"
                        >
                          Module Configuration
                        </button>
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(ROLE_ROUTE_PERMISSIONS[usr.role || "Service Advisor"] || []).map((route) => {
                        const reqMod = ROUTE_REQUIRED_MODULE[route];
                        const active = !reqMod || !!configuration[reqMod];
                        return (
                          <span
                            key={route}
                            title={
                              active
                                ? reqMod
                                  ? `Active: "${CONFIGURATION_LABELS[reqMod] || reqMod}" is enabled`
                                  : "Core module feature"
                                : `Disabled: Enable "${CONFIGURATION_LABELS[reqMod] || reqMod}" in Module Configuration tab`
                            }
                            className={clsx(
                              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] border transition-all",
                              active
                                ? "border-emerald-200 bg-white font-medium text-emerald-800 shadow-2xs"
                                : "border-ink-200 bg-ink-100/70 font-normal text-ink-400 line-through opacity-70"
                            )}
                          >
                            <span
                              className={clsx(
                                "h-1.5 w-1.5 rounded-full",
                                active ? "bg-emerald-500" : "bg-ink-300"
                              )}
                            />
                            {route}
                            {!active && reqMod && (
                              <span className="text-[9px] no-underline font-semibold text-amber-700 bg-amber-50 px-1 rounded border border-amber-200">
                                Requires {CONFIGURATION_LABELS[reqMod] || reqMod}
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-end border-t border-ink-100 pt-3">
                <Button type="button" variant="primary" icon={Save} isLoading={isSaving} onClick={handleSave} disabled={setupStatus === "PENDING"} > Submit for Approval </Button>
              </div>
            </div>
          )}

          {activeTab === "configuration" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 border-b border-ink-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-bold text-ink-900">
                    Module & Feature Configuration
                  </h2>

                  <p className="text-xs text-ink-500">
                    Select operational modules for your workshop.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={selectAllConfigurations}
                    disabled={setupStatus === "PENDING"}
                  >
                    Select All
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={deselectAllConfigurations}
                    disabled={setupStatus === "PENDING"}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {CONFIGURATION_OPTIONS.map((item) => {
                  const checked = Boolean(
                    configuration[item.key]
                  );

                  return (
                    <label
                      key={item.key}
                      className={clsx(
                        "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5",
                        checked
                          ? "border-brand-500 bg-brand-50/40"
                          : "border-ink-200 bg-white",
                        setupStatus === "PENDING" &&
                        "cursor-not-allowed opacity-60"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          toggleConfiguration(item.key)
                        }
                        disabled={setupStatus === "PENDING"}
                        className="mt-0.5 h-4 w-4"
                      />

                      <div>
                        <div className="text-xs font-bold">
                          {item.label}
                        </div>

                        <p className="text-[11px] text-ink-500">
                          {item.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-brand-200 bg-brand-50/70 p-3 text-xs text-brand-900">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />

                <span>
                  Configuration changes require Business Admin
                  approval before they become active.
                </span>
              </div>

              <div className="flex justify-end border-t border-ink-100 pt-3">
                <Button
                  type="button"
                  variant="primary"
                  icon={Save}
                  isLoading={isSaving}
                  onClick={handleSave}
                  disabled={setupStatus === "PENDING"}
                >
                  Submit for Approval
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

      {pageTab === "submissions" && (
        <Card>
          <div className="mb-4 flex items-center justify-between border-b border-ink-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-ink-900"> My Submissions </h2>
              <p className="text-xs text-ink-500">  View your Users and Configuration setup submissions.</p>
            </div>

            <Badge tone="neutral"> {submissions.length} Submissions </Badge>
          </div>

          {!submissions.length ? (
            <div className="py-10 text-center">
              <Clock className="mx-auto h-8 w-8 text-ink-300" />

              <h3 className="mt-3 text-sm font-bold text-ink-700">
                No Setup Submissions
              </h3>

              <p className="mt-1 text-xs text-ink-500">
                Your Users and Configuration submissions will appear
                here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-ink-200">
                    <th className="px-3 py-3"> Submission </th>
                    <th className="px-3 py-3"> Users  </th>
                    <th className="px-3 py-3"> Modules</th>
                    <th className="px-3 py-3"> Submitted Date</th>
                    <th className="px-3 py-3"> Status</th>
                    <th className="px-3 py-3 text-right"> Action</th>
                  </tr>
                </thead>

                <tbody>
                  {submissions.map((submission) => {
                    const subUsers = Array.isArray(submission.users)
                      ? submission.users
                      : typeof submission.users === "string"
                      ? (() => {
                          try {
                            return JSON.parse(submission.users);
                          } catch {
                            return [];
                          }
                        })()
                      : [];
                    const subConfig =
                      submission.configuration && typeof submission.configuration === "string"
                        ? (() => {
                            try {
                              return JSON.parse(submission.configuration);
                            } catch {
                              return {};
                            }
                          })()
                        : submission.configuration || {};
                    const enabledModules = Object.values(subConfig).filter(Boolean).length;

                    return (
                      <tr key={submission.id} className="border-b border-ink-100">
                        <td className="px-3 py-3">
                          <div className="font-semibold text-brand-700">  {submission.submissionNumber}    </div>
                          <div className="text-[10px] text-ink-400">    {submission.submittedByName || "-"}  </div>
                        </td>
                        <td className="px-3 py-3"> {subUsers.length} </td>
                        <td className="px-3 py-3">    {enabledModules}  </td>
                        <td className="px-3 py-3">
                          {submission.submittedAt
                            ? new Date(
                              submission.submittedAt
                            ).toLocaleDateString()
                            : "-"}
                        </td>

                        <td className="px-3 py-3">
                          {submission.status === "APPROVED" && (
                            <Badge tone="success">   APPROVED </Badge>
                          )}

                          {submission.status === "PENDING" && (
                            <Badge tone="warning">   PENDING </Badge>
                          )}

                          {submission.status === "REJECTED" && (
                            <Badge tone="danger">   REJECTED </Badge>
                          )}
                        </td>

                        <td className="px-3 py-3 text-right">
                          <Button type="button" size="sm" variant="outline" icon={Eye} onClick={() => setSelectedSubmission(submission)} >   View </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {selectedSubmission && (() => {
        const modalUsers = Array.isArray(selectedSubmission.users)
          ? selectedSubmission.users
          : typeof selectedSubmission.users === "string"
          ? (() => {
              try {
                return JSON.parse(selectedSubmission.users);
              } catch {
                return [];
              }
            })()
          : [];
        const modalConfig =
          selectedSubmission.configuration && typeof selectedSubmission.configuration === "string"
            ? (() => {
                try {
                  return JSON.parse(selectedSubmission.configuration);
                } catch {
                  return {};
                }
              })()
            : selectedSubmission.configuration || {};

        return (
          <Modal isOpen={Boolean(selectedSubmission)} onClose={() => setSelectedSubmission(null)} title={`Setup Submission — ${selectedSubmission.submissionNumber}`} size="xl" >
            <div className="space-y-5">
              <div className="rounded-xl border border-ink-200 bg-ink-50/50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-ink-900">  {selectedSubmission.submissionNumber}</h2>
                    <p className="mt-1 text-xs text-ink-500"> Submitted by{" "}  {selectedSubmission.submittedByName || "-"}  </p>
                  </div>
                  {selectedSubmission.status === "APPROVED" && (
                    <Badge tone="success"> APPROVED </Badge>
                  )}
                  {selectedSubmission.status === "PENDING" && (
                    <Badge tone="warning"> PENDING </Badge>
                  )}
                  {selectedSubmission.status === "REJECTED" && (
                    <Badge tone="danger">  REJECTED   </Badge>
                  )}
                </div>
              </div>
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <UsersIcon className="h-4 w-4 text-brand-600" />
                  <h3 className="text-sm font-bold"> Submitted Users ({modalUsers.length})</h3>
                </div>

                <div className="space-y-3">
                  {modalUsers.map(
                    (usr, index) => (
                      <div key={usr.id || index} className="rounded-xl border border-ink-200 bg-white p-3.5 space-y-2">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div>
                            <p className="text-[10px] text-ink-400">Name</p>
                            <p className="text-xs font-semibold">{usr.name || "-"}</p>
                          </div>

                          <div>
                            <p className="text-[10px] text-ink-400">Mobile (Login ID)</p>
                            <p className="text-xs font-semibold font-mono">{usr.mobile || "-"}</p>
                          </div>

                          <div>
                            <p className="text-[10px] text-ink-400">Role</p>
                            <p className="text-xs font-semibold text-brand-700">{usr.role || "-"}</p>
                          </div>

                          <div>
                            <p className="text-[10px] text-ink-400">Email</p>
                            <p className="text-xs font-semibold">{usr.email || "-"}</p>
                          </div>

                          <div>
                            <p className="text-[10px] text-ink-400">Default Password</p>
                            <p className="text-xs font-semibold font-mono text-ink-700">{usr.defaultPassword || "Welcome@123"}</p>
                          </div>

                          <div>
                            <p className="text-[10px] text-ink-400">Default 4-digit PIN</p>
                            <p className="text-xs font-semibold font-mono text-ink-700">{usr.defaultPin || "1234"}</p>
                          </div>

                          <div className="sm:col-span-2">
                            <p className="text-[10px] text-ink-400">Remarks</p>
                            <p className="text-xs font-semibold">{usr.remarks || "-"}</p>
                          </div>
                        </div>

                        {usr.role && (
                          <div className="border-t border-ink-100 pt-2 flex flex-wrap items-center gap-1">
                            <span className="text-[10px] text-ink-500 font-semibold">Allowed Routes:</span>
                            {(ROLE_ROUTE_PERMISSIONS[usr.role] || []).map((r) => (
                              <span key={r} className="rounded bg-brand-50 px-1.5 py-0.5 text-[9px] font-medium text-brand-700 border border-brand-200">
                                {r}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4 text-brand-600" />
                <h3 className="text-sm font-bold">   Submitted Configuration </h3>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(
                  selectedSubmission.configuration || {}
                ).map(([key, value]) => (
                  <div
                    key={key}
                    className={clsx(
                      "rounded-lg border p-3",
                      value
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-ink-200 bg-ink-50"
                    )}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">
                        {CONFIGURATION_OPTIONS.find(
                          (item) => item.key === key
                        )?.label || key}
                      </span>
                      <span
                        className={clsx(
                          "text-[10px] font-bold",
                          value ? "text-emerald-700" : "text-ink-400")}>
                        {value ? "ENABLED" : "DISABLED"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {selectedSubmission.status === "REJECTED" &&
              selectedSubmission.rejectionReason && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  <p className="font-bold"> Rejection Reason </p>
                  <p className="mt-1"> {selectedSubmission.rejectionReason} </p>
                </div>
              )}

            {selectedSubmission.reviewedAt && (
              <div className="rounded-lg border border-ink-200 bg-ink-50 p-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink-500">  Reviewed By</span>

                  <span className="font-semibold">  {selectedSubmission.reviewedBy || "-"} </span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-ink-500">   Reviewed Date </span>

                  <span className="font-semibold">
                    {new Date(
                      selectedSubmission.reviewedAt
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 border-t border-ink-200 pt-4">
              <Button type="button" variant="outline" onClick={() => setSelectedSubmission(null)}>
                Close
              </Button>

              {selectedSubmission.status === "REJECTED" && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => handleReinitiate(selectedSubmission)}
                >
                  Re-initiate
                </Button>
              )}
            </div>
          </div>
                </Modal>
        );
      })()}
    </div>
  );
}
