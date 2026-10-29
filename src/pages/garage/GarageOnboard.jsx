import { useState, useEffect, useMemo } from "react";
import clsx from "clsx";
import {
  Check,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Eye,
  RefreshCw,
  Info,
  ShieldAlert,
  Calendar,
  Upload,
  QrCode,
  Save,
  Building2,
  MapPin,
  Users as UsersIcon,
  Settings,
  FileText,
  CreditCard,
  Landmark,
  Layers,
  Target,
  Sparkles,
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
import { pincodeApi } from "@/services";
import { validate, isRequired, isMobile, isPincode } from "@/utils/validators";
import { showToast } from "@/utils/toast";
import { formatDate } from "@/utils/formatters";

// 5-Step Stepper Definitions (Job Card Stepper Design)
export const ONBOARD_STEPS = [
  { key: "workshop", label: "Workshop", icon: Building2 },
  { key: "address_bay", label: "Address & Bay", icon: MapPin },
  { key: "users", label: "Users", icon: UsersIcon },
  // { key: "configuration", label: "Configuration", icon: Settings },
  // { key: "other_info", label: "Other Information", icon: FileText },
];

// Dropdown Constants
export const STATE_MAPPING = [
  { state: "Delhi", code: "07" },
  { state: "Maharashtra", code: "27" },
  { state: "Karnataka", code: "29" },
  { state: "Tamil Nadu", code: "33" },
  { state: "Telangana", code: "36" },
  { state: "Andhra Pradesh", code: "37" },
  { state: "Gujarat", code: "24" },
  { state: "Haryana", code: "06" },
  { state: "Uttar Pradesh", code: "09" },
  { state: "Rajasthan", code: "08" },
  { state: "West Bengal", code: "19" },
  { state: "Kerala", code: "32" },
  { state: "Punjab", code: "03" },
  { state: "Madhya Pradesh", code: "23" },
  { state: "Bihar", code: "10" },
  { state: "Odisha", code: "21" },
  { state: "Assam", code: "18" },
  { state: "Jharkhand", code: "20" },
  { state: "Chhattisgarh", code: "22" },
  { state: "Uttarakhand", code: "05" },
  { state: "Goa", code: "30" },
  { state: "Himachal Pradesh", code: "02" },
];

const STATE_OPTIONS = STATE_MAPPING.map((s) => ({ value: s.state, label: s.state }));

export function resolveStateInfo(stateInput, codeInput) {
  if (!stateInput && !codeInput) return { state: "", code: "" };
  const cleaned = String(stateInput || "").trim().toLowerCase();
  const codeStr = String(codeInput || "").trim();
  const found = STATE_MAPPING.find(
    (s) =>
      s.state.toLowerCase() === cleaned ||
      (codeStr && s.code === codeStr) ||
      (cleaned.length >= 4 && (s.state.toLowerCase().includes(cleaned) || cleaned.includes(s.state.toLowerCase())))
  );
  if (found) {
    return { state: found.state, code: found.code };
  }
  return { state: stateInput || "", code: codeInput || "" };
}

export const INSURANCE_COMPANIES = [
  { value: "HDFC ERGO General Insurance", label: "HDFC ERGO General Insurance" },
  { value: "ICICI Lombard General Insurance", label: "ICICI Lombard General Insurance" },
  { value: "Bajaj Allianz General Insurance", label: "Bajaj Allianz General Insurance" },
  { value: "Tata AIG General Insurance", label: "Tata AIG General Insurance" },
  { value: "SBI General Insurance", label: "SBI General Insurance" },
  { value: "United India Insurance Company", label: "United India Insurance Company" },
  { value: "The New India Assurance Co.", label: "The New India Assurance Co." },
  { value: "National Insurance Company", label: "National Insurance Company" },
  { value: "Oriental Insurance Company", label: "Oriental Insurance Company" },
  { value: "Go Digit General Insurance", label: "Go Digit General Insurance" },
  { value: "Acko General Insurance", label: "Acko General Insurance" },
  { value: "Cholamandalam MS General Insurance", label: "Cholamandalam MS General Insurance" },
  { value: "Reliance General Insurance", label: "Reliance General Insurance" },
];

export const BAY_TYPES = [
  { value: "Mechanical 2-Post Lift Bay", label: "Mechanical 2-Post Lift Bay" },
  { value: "Mechanical 4-Post Lift Bay", label: "Mechanical 4-Post Lift Bay" },
  { value: "Scissor Lift Bay", label: "Scissor Lift Bay" },
  { value: "Wheel Alignment & Balancing Bay", label: "Wheel Alignment & Balancing Bay" },
  { value: "Washing & Water Wash Bay", label: "Washing & Water Wash Bay" },
  { value: "Detailing & Ceramic Coating Bay", label: "Detailing & Ceramic Coating Bay" },
  { value: "Paint Booth & Baking Oven", label: "Paint Booth & Baking Oven" },
  { value: "Body Repair & Crash Jig Bay", label: "Body Repair & Crash Jig Bay" },
  { value: "Quick Inspection & Express Bay", label: "Quick Inspection & Express Bay" },
  { value: "EV & High-Voltage Diagnostic Bay", label: "EV & High-Voltage Diagnostic Bay" },
  { value: "Engine Overhaul & Transmission Bay", label: "Engine Overhaul & Transmission Bay" },
  { value: "General Service Bay", label: "General Service Bay" },
];

const USER_ROLES = [
  { value: "Owner / Director", label: "Owner / Director" },
  { value: "Workshop Manager", label: "Workshop Manager" },
  { value: "Service Advisor", label: "Service Advisor" },
  { value: "Head Technician", label: "Head Technician" },
  { value: "Store & Inventory Incharge", label: "Store & Inventory Incharge" },
  { value: "Cashier & Billing Accountant", label: "Cashier & Billing Accountant" },
];

export const WORKSHOP_TYPES_STEP5 = [
  { value: "COCO (Company Owned Company Operated)", label: "COCO (Company Owned Company Operated)" },
  { value: "FOFO (Franchise Owned Franchise Operated)", label: "FOFO (Franchise Owned Franchise Operated)" },
  { value: "FICO (Franchise Invested Company Operated)", label: "FICO (Franchise Invested Company Operated)" },
  { value: "PASC (Primary Authorized Service Center)", label: "PASC (Primary Authorized Service Center)" },
  { value: "Franchise Partner", label: "Franchise Partner" },
  { value: "Independent Certified Workshop", label: "Independent Certified Workshop" },
];

export const ZONES = [
  { value: "North Zone", label: "North Zone" },
  { value: "South Zone", label: "South Zone" },
  { value: "East Zone", label: "East Zone" },
  { value: "West Zone", label: "West Zone" },
  { value: "Central Zone", label: "Central Zone" },
];

export const AREAS = [
  { value: "Area 1 - North Delhi & Okhla", label: "Area 1 - North Delhi & Okhla" },
  { value: "Area 2 - Gurugram & Manesar", label: "Area 2 - Gurugram & Manesar" },
  { value: "Area 3 - Noida & Greater Noida", label: "Area 3 - Noida & Greater Noida" },
  { value: "Area 4 - Bengaluru Urban & Whitefield", label: "Area 4 - Bengaluru Urban & Whitefield" },
  { value: "Area 5 - Pune Central & PCMC", label: "Area 5 - Pune Central & PCMC" },
  { value: "Area 6 - Mumbai Metro & Thane", label: "Area 6 - Mumbai Metro & Thane" },
  { value: "Area 7 - Chennai Central & OMR", label: "Area 7 - Chennai Central & OMR" },
];

export const CITIES = [
  { value: "New Delhi", label: "New Delhi" },
  { value: "Gurugram", label: "Gurugram" },
  { value: "Noida", label: "Noida" },
  { value: "Bengaluru", label: "Bengaluru" },
  { value: "Mumbai", label: "Mumbai" },
  { value: "Pune", label: "Pune" },
  { value: "Chennai", label: "Chennai" },
  { value: "Hyderabad", label: "Hyderabad" },
  { value: "Kolkata", label: "Kolkata" },
  { value: "Ahmedabad", label: "Ahmedabad" },
];

export const CITY_TYPES = [
  { value: "Metro / Tier 1", label: "Metro / Tier 1" },
  { value: "Tier 2", label: "Tier 2" },
  { value: "Tier 3", label: "Tier 3" },
];

export const ZH_LIST = [
  { value: "Rajesh Nair (ZH - North)", label: "Rajesh Nair (ZH - North)" },
  { value: "Suresh Reddy (ZH - South)", label: "Suresh Reddy (ZH - South)" },
  { value: "Amit Kulkarni (ZH - West)", label: "Amit Kulkarni (ZH - West)" },
  { value: "Pradeep Sen (ZH - East)", label: "Pradeep Sen (ZH - East)" },
];

export const ABH_LIST = [
  { value: "Deepak Sharma (ABH - Delhi NCR)", label: "Deepak Sharma (ABH - Delhi NCR)" },
  { value: "Praveen Kumar (ABH - Karnataka)", label: "Praveen Kumar (ABH - Karnataka)" },
  { value: "Rohit Verma (ABH - Maharashtra)", label: "Rohit Verma (ABH - Maharashtra)" },
  { value: "Manish Gupta (ABH - Tamil Nadu)", label: "Manish Gupta (ABH - Tamil Nadu)" },
];

export const FBM_LIST = [
  { value: "Sandeep Patil (FBM)", label: "Sandeep Patil (FBM)" },
  { value: "Ankit Singh (FBM)", label: "Ankit Singh (FBM)" },
  { value: "Vivek Mishra (FBM)", label: "Vivek Mishra (FBM)" },
  { value: "Nitin Joshi (FBM)", label: "Nitin Joshi (FBM)" },
];

export const APM_LIST = [
  { value: "Alok Verma (APM)", label: "Alok Verma (APM)" },
  { value: "Harish Pillai (APM)", label: "Harish Pillai (APM)" },
  { value: "Manoj Joshi (APM)", label: "Manoj Joshi (APM)" },
  { value: "Kailash Das (APM)", label: "Kailash Das (APM)" },
];

export const HUBS_LIST = [
  { value: "North Master Hub - Delhi (WHS-01)", label: "North Master Hub - Delhi (WHS-01)" },
  { value: "South Central Hub - Bengaluru (WHS-03)", label: "South Central Hub - Bengaluru (WHS-03)" },
  { value: "West Logistics Hub - Bhiwandi (WHS-02)", label: "West Logistics Hub - Bhiwandi (WHS-02)" },
  { value: "East Regional Hub - Kolkata (WHS-04)", label: "East Regional Hub - Kolkata (WHS-04)" },
];

export const CONFIGURATION_OPTIONS = [
  { key: "notification", label: "Notification", description: "Automated SMS, email & WhatsApp customer notifications" },
  { key: "inventory", label: "Inventory", description: "Workshop inventory tracking, stock levels and bin allocations" },
  { key: "jobCard", label: "Job Card", description: "Digital repair orders, bay tracking and digital estimate conversion" },
  { key: "misLabour", label: "MIS Labour", description: "Management analytics, technician productivity & labor efficiency" },
  { key: "part", label: "Part", description: "OEM / OES spares catalog and pricing integrations" },
  { key: "labour", label: "Labour", description: "Standard labor operation schedules, rate charts and hourly allowances" },
  { key: "appointment", label: "Appointment", description: "Online customer booking calendar and slot scheduling" },
  { key: "accidental", label: "Accidental", description: "Body shop claim estimates, survey approvals and dent/paint tracking" },
  { key: "customerView", label: "Customer View", description: "Live vehicle service progression tracking portal for vehicle owners" },
  { key: "vehicleType", label: "Vehicle Type", description: "Multi-category support (2W, 4W, Commercial, EV, Luxury)" },
  { key: "purchaseOrder", label: "Purchase Order", description: "Direct supply hub procurement, PO creation and GRN processing" },
];

const INITIAL_FORM = {
  // Step 1: Workshop, Bank & Virtual Account Details
  workshopDetails: {
    displayName: "",
    mobile: "",
    registeredName: "",
    alternateContactNumber: "",
    gstNumber: "",
    email: "",
    panNumber: "",
    remarks: "",
    cinNumber: "",
  },
  bankDetails: {
    bankName: "",
    accountNumber: "",
    branchName: "",
    ifscCode: "",
  },
  virtualAccountDetails: {
    isGoogleLinkAvailable: "No",
    paymentInNameOf: "",
    virtualBankName: "",
    virtualBranchName: "",
    virtualAccountNumber: "",
    virtualIfscCode: "",
    upiId: "",
    insuranceCompany: "",
  },
  // Step 2: Address & Bay
  registeredAddress: {
    street: "",
    location: "",
    pincode: "",
    state: "Delhi",
    city: "",
    stateCode: "07",
  },
  corporateAddress: {
    sameAsRegistered: true,
    street: "",
    location: "",
    pincode: "",
    state: "Delhi",
    city: "",
    stateCode: "07",
  },
  workshopBays: [
    { id: "bay-1", name: "Bay 1", type: "Mechanical 2-Post Lift Bay" },
    { id: "bay-2", name: "Bay 2", type: "Wheel Alignment & Balancing Bay" },
  ],
  // Step 3: Users
  users: [
    {
      id: "usr-1",
      name: "",
      mobile: "",
      alternateMobile: "",
      email: "",
      remarks: "",
      role: "Owner / Director",
      status: "INACTIVE",
    },
  ],
  // Step 4: Configuration
  configuration: {
    notification: false,
    inventory: false,
    jobCard: false,
    misLabour: false,
    part: false,
    labour: false,
    appointment: false,
    accidental: false,
    customerView: false,
    vehicleType: false,
    purchaseOrder: false,
  },
  // Step 5: Other Information
  otherInfo: {
    plantCode: "",
    workshopType: "FOFO (Franchise Owned Franchise Operated)",
    zone: "North Zone",
    area: "Area 1 - North Delhi & Okhla",
    city: "New Delhi",
    cityType: "Metro / Tier 1",
    zh: "Rajesh Nair (ZH - North)",
    abh: "Deepak Sharma (ABH - Delhi NCR)",
    fbm: "Sandeep Patil (FBM)",
    apm: "Alok Verma (APM)",
    hub: "North Master Hub - Delhi (WHS-01)",
    activationDate: "",
    targets: {
      mechanicalInflow: "",
      mechanicalRevenue: "",
      bodyRepairInflow: "",
      bodyRepairRevenue: "",
      partsOfftake: "",
    },
    qrImage: "",
  },
};

const step1ValidationRules = {
  displayName: [[isRequired, "Display Name is required."]],
  mobile: [
    [isRequired, "Mobile Number is required."],
    [isMobile, "Enter a valid 10-digit mobile number."],
  ],
  registeredName: [[isRequired, "Registered Name is required."]],
};

const step2ValidationRules = {
  pincode: [
    [isRequired, "Pin Code is required."],
    [isPincode, "Enter a valid 6-digit pin code."],
  ],
};

export default function GarageOnboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("apply"); // "apply" | "tracker"
  const [currentStepKey, setCurrentStepKey] = useState("workshop");
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [successModal, setSuccessModal] = useState(null);
  const [qrVerified, setQrVerified] = useState(false);

  const stepIndex = ONBOARD_STEPS.findIndex((s) => s.key === currentStepKey);

  const completedSteps = useMemo(() => {
    const s = new Set();
    for (let i = 0; i < stepIndex; i++) {
      s.add(ONBOARD_STEPS[i].key);
    }
    return s;
  }, [stepIndex]);

  const loadData = async () => {
    try {
      const list = await garageOnboardService.getMySubmissions();
      setApplications(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Failed to load submissions:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const [isRegPinLoading, setIsRegPinLoading] = useState(false);
  const [isCorpPinLoading, setIsCorpPinLoading] = useState(false);

  // Auto lookup pincode data for Registered Address (POST /vendors/getPincodeData)
  useEffect(() => {
    const pin = String(form.registeredAddress.pincode ?? "")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pin.length !== 6) return;

    let cancelled = false;
    (async () => {
      try {
        setIsRegPinLoading(true);
        const res = await pincodeApi.lookup(pin);
        if (cancelled || !res?.requestSuccessful) return;
        const data = res.pincodeData ?? res.data ?? {};
        const stateInfo = resolveStateInfo(data.state, data.stateCode);

        setForm((prev) => {
          const updatedReg = {
            ...prev.registeredAddress,
            city: data.city || prev.registeredAddress.city,
            state: stateInfo.state || prev.registeredAddress.state,
            stateCode: stateInfo.code || prev.registeredAddress.stateCode,
          };

          const updatedCorp = prev.corporateAddress.sameAsRegistered
            ? {
                ...prev.corporateAddress,
                street: updatedReg.street,
                location: updatedReg.location,
                pincode: updatedReg.pincode,
                city: updatedReg.city,
                state: updatedReg.state,
                stateCode: updatedReg.stateCode,
              }
            : prev.corporateAddress;

          return {
            ...prev,
            registeredAddress: updatedReg,
            corporateAddress: updatedCorp,
          };
        });
      } catch (err) {
        console.error("Registered pincode lookup failed:", err);
      } finally {
        if (!cancelled) setIsRegPinLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [form.registeredAddress.pincode]);

  // Auto lookup pincode data for Corporate Address (POST /vendors/getPincodeData)
  useEffect(() => {
    if (form.corporateAddress.sameAsRegistered) return;
    const pin = String(form.corporateAddress.pincode ?? "")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pin.length !== 6) return;

    let cancelled = false;
    (async () => {
      try {
        setIsCorpPinLoading(true);
        const res = await pincodeApi.lookup(pin);
        if (cancelled || !res?.requestSuccessful) return;
        const data = res.pincodeData ?? res.data ?? {};
        const stateInfo = resolveStateInfo(data.state, data.stateCode);

        setForm((prev) => ({
          ...prev,
          corporateAddress: {
            ...prev.corporateAddress,
            city: data.city || prev.corporateAddress.city,
            state: stateInfo.state || prev.corporateAddress.state,
            stateCode: stateInfo.code || prev.corporateAddress.stateCode,
          },
        }));
      } catch (err) {
        console.error("Corporate pincode lookup failed:", err);
      } finally {
        if (!cancelled) setIsCorpPinLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [form.corporateAddress.pincode, form.corporateAddress.sameAsRegistered]);

  // Nested Updaters
  const updateWorkshopDetails = (field, val) => {
    setForm((prev) => ({
      ...prev,
      workshopDetails: { ...prev.workshopDetails, [field]: val },
    }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const updateBankDetails = (field, val) => {
    setForm((prev) => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [field]: val },
    }));
  };

  const updateVirtualAccountDetails = (field, val) => {
    setForm((prev) => ({
      ...prev,
      virtualAccountDetails: { ...prev.virtualAccountDetails, [field]: val },
    }));
  };

  const updateRegisteredAddress = (field, val) => {
    setForm((prev) => {
      let nextStateCode = prev.registeredAddress.stateCode;
      if (field === "state") {
        const found = STATE_MAPPING.find((s) => s.state === val);
        if (found) nextStateCode = found.code;
      }
      const updatedReg = {
        ...prev.registeredAddress,
        [field]: val,
        ...(field === "state" ? { stateCode: nextStateCode } : {}),
      };

      const updatedCorp = prev.corporateAddress.sameAsRegistered
        ? {
          ...prev.corporateAddress,
          street: updatedReg.street,
          location: updatedReg.location,
          pincode: updatedReg.pincode,
          state: updatedReg.state,
          city: updatedReg.city,
          stateCode: updatedReg.stateCode,
        }
        : prev.corporateAddress;

      return {
        ...prev,
        registeredAddress: updatedReg,
        corporateAddress: updatedCorp,
      };
    });
    if (errors[`reg_${field}`]) setErrors((prev) => ({ ...prev, [`reg_${field}`]: undefined }));
  };

  const updateCorporateAddress = (field, val) => {
    setForm((prev) => {
      if (field === "sameAsRegistered") {
        if (val) {
          return {
            ...prev,
            corporateAddress: {
              sameAsRegistered: true,
              street: prev.registeredAddress.street,
              location: prev.registeredAddress.location,
              pincode: prev.registeredAddress.pincode,
              state: prev.registeredAddress.state,
              city: prev.registeredAddress.city,
              stateCode: prev.registeredAddress.stateCode,
            },
          };
        } else {
          return {
            ...prev,
            corporateAddress: {
              ...prev.corporateAddress,
              sameAsRegistered: false,
            },
          };
        }
      }

      let nextStateCode = prev.corporateAddress.stateCode;
      if (field === "state") {
        const found = STATE_MAPPING.find((s) => s.state === val);
        if (found) nextStateCode = found.code;
      }

      return {
        ...prev,
        corporateAddress: {
          ...prev.corporateAddress,
          [field]: val,
          ...(field === "state" ? { stateCode: nextStateCode } : {}),
        },
      };
    });
    if (errors[`corp_${field}`]) setErrors((prev) => ({ ...prev, [`corp_${field}`]: undefined }));
  };

  // Workshop Bays
  const addBay = () => {
    const nextNum = form.workshopBays.length + 1;
    setForm((prev) => ({
      ...prev,
      workshopBays: [
        ...prev.workshopBays,
        { id: `bay-${Date.now()}`, name: `Bay ${nextNum}`, type: "General Service Bay" },
      ],
    }));
  };

  const updateBay = (index, field, val) => {
    setForm((prev) => {
      const copy = [...prev.workshopBays];
      copy[index] = { ...copy[index], [field]: val };
      return { ...prev, workshopBays: copy };
    });
  };

  const removeBay = (index) => {
    if (form.workshopBays.length <= 1) {
      showToast.error("At least one workshop bay is required.");
      return;
    }
    setForm((prev) => ({
      ...prev,
      workshopBays: prev.workshopBays.filter((_, i) => i !== index),
    }));
  };

  // Users (Step 3)
  const addUser = () => {
    setForm((prev) => ({
      ...prev,
      users: [
        ...prev.users,
        {
          id: `usr-${Date.now()}`,
          name: "",
          mobile: "",
          alternateMobile: "",
          email: "",
          remarks: "",
          role: "Service Advisor",
          status: "INACTIVE",
        },
      ],
    }));
  };

  const updateUser = (index, field, val) => {
    setForm((prev) => {
      const copy = [...prev.users];
      copy[index] = { ...copy[index], [field]: val };
      return { ...prev, users: copy };
    });
  };

  const removeUser = (index) => {
    if (form.users.length <= 1) {
      showToast.error("At least one user must be listed.");
      return;
    }
    setForm((prev) => ({
      ...prev,
      users: prev.users.filter((_, i) => i !== index),
    }));
  };

  // Step 4 Configuration Updaters
  const toggleConfiguration = (key) => {
    setForm((prev) => ({
      ...prev,
      configuration: {
        ...prev.configuration,
        [key]: !prev.configuration?.[key],
      },
    }));
  };

  const selectAllConfigurations = () => {
    const all = {};
    CONFIGURATION_OPTIONS.forEach((item) => {
      all[item.key] = true;
    });
    setForm((prev) => ({
      ...prev,
      configuration: all,
    }));
  };

  const deselectAllConfigurations = () => {
    const none = {};
    CONFIGURATION_OPTIONS.forEach((item) => {
      none[item.key] = false;
    });
    setForm((prev) => ({
      ...prev,
      configuration: none,
    }));
  };

  // Step 5 Updaters
  const updateOtherInfo = (field, val) => {
    setForm((prev) => ({
      ...prev,
      otherInfo: { ...prev.otherInfo, [field]: val },
    }));
  };

  const updateTarget = (field, val) => {
    setForm((prev) => ({
      ...prev,
      otherInfo: {
        ...prev.otherInfo,
        targets: { ...prev.otherInfo.targets, [field]: val },
      },
    }));
  };

  // Autofill Sample Stepper Data
  const handleAutofill = () => {
    setForm({
      workshopDetails: {
        displayName: "Speedy Auto Care & Services",
        mobile: "9876543210",
        registeredName: "Speedy Auto Care Solutions Pvt Ltd",
        alternateContactNumber: "9876543211",
        gstNumber: "07AAAAA0000A1Z5",
        email: user?.email || "business@example.com",
        panNumber: "AAAAA0000A",
        remarks: "Flagship multi-brand workshop with certified collision & EV diagnostic bays.",
        cinNumber: "U50100DL2021PTC384920",
      },
      bankDetails: {
        bankName: "HDFC Bank",
        accountNumber: "50200012345678",
        branchName: "Okhla Industrial Area Branch",
        ifscCode: "HDFC0001234",
      },
      virtualAccountDetails: {
        isGoogleLinkAvailable: "Yes",
        paymentInNameOf: "Speedy Auto Care Solutions Pvt Ltd",
        virtualBankName: "HDFC Bank Virtual Escrow",
        virtualBranchName: "Digital CMS Branch",
        virtualAccountNumber: "MYTVSGOB9876543210",
        virtualIfscCode: "HDFC0000001",
        upiId: "speedyauto@hdfcbank",
        insuranceCompany: "HDFC ERGO General Insurance",
      },
      registeredAddress: {
        street: "Plot 42, Sector 18, Phase 3",
        location: "Okhla Industrial Area",
        pincode: "110020",
        state: "Delhi",
        city: "New Delhi",
        stateCode: "07",
      },
      corporateAddress: {
        sameAsRegistered: true,
        street: "Plot 42, Sector 18, Phase 3",
        location: "Okhla Industrial Area",
        pincode: "110020",
        state: "Delhi",
        city: "New Delhi",
        stateCode: "07",
      },
      workshopBays: [
        { id: "bay-1", name: "Bay 1 - Express Service", type: "Mechanical 2-Post Lift Bay" },
        { id: "bay-2", name: "Bay 2 - Heavy Mechanical", type: "Mechanical 4-Post Lift Bay" },
        { id: "bay-3", name: "Bay 3 - Wheel Alignment", type: "Wheel Alignment & Balancing Bay" },
        { id: "bay-4", name: "Bay 4 - Wash & Detailing", type: "Washing & Water Wash Bay" },
      ],
      users: [
        {
          id: "usr-1",
          name: "Rajesh Sharma",
          mobile: "9876543210",
          alternateMobile: "9876543211",
          email: "rajesh@speedyauto.in",
          remarks: "Primary workshop owner and authorized signatory.",
          role: "Owner / Director",
          status: "INACTIVE",
        },
        {
          id: "usr-2",
          name: "Vikram Kumar",
          mobile: "9812345670",
          alternateMobile: "",
          email: "vikram.service@speedyauto.in",
          remarks: "Head Service Advisor & Floor Supervisor.",
          role: "Service Advisor",
          status: "INACTIVE",
        },
      ],
      configuration: {
        notification: true,
        inventory: true,
        jobCard: true,
        misLabour: false,
        part: true,
        labour: true,
        appointment: true,
        accidental: false,
        customerView: true,
        vehicleType: true,
        purchaseOrder: true,
      },
      otherInfo: {
        plantCode: "PLT-DEL-042",
        workshopType: "FOFO (Franchise Owned Franchise Operated)",
        zone: "North Zone",
        area: "Area 1 - North Delhi & Okhla",
        city: "New Delhi",
        cityType: "Metro / Tier 1",
        zh: "Rajesh Nair (ZH - North)",
        abh: "Deepak Sharma (ABH - Delhi NCR)",
        fbm: "Sandeep Patil (FBM)",
        apm: "Alok Verma (APM)",
        hub: "North Master Hub - Delhi (WHS-01)",
        activationDate: "2026-09-15",
        targets: {
          mechanicalInflow: "180 Vehicles / Month",
          mechanicalRevenue: "₹9,50,000",
          bodyRepairInflow: "45 Vehicles / Month",
          bodyRepairRevenue: "₹4,20,000",
          partsOfftake: "₹5,00,000",
        },
        qrImage: "speedy_upi_qr_code.png",
      },
    });
    setErrors({});
    setQrVerified(true);
    showToast.info("Complete 3-step sample data autofilled!");
  };

  // Save Progress Action on every step
  const handleSaveDraft = () => {
    showToast.success("Garage Onboard draft saved successfully!");
  };

  // Step Validation & Navigation
  const handleNextStep = () => {
    if (currentStepKey === "workshop") {
      const errs = validate(form.workshopDetails, step1ValidationRules);
      if (Object.keys(errs).length) {
        setErrors(errs);
        showToast.error("Please fill in the required Workshop Details (*).");
        return;
      }
    } else if (currentStepKey === "address_bay") {
      const regErrs = validate(form.registeredAddress, step2ValidationRules);
      const corpErrs = !form.corporateAddress.sameAsRegistered
        ? validate(form.corporateAddress, step2ValidationRules)
        : {};
      const combined = {
        ...(regErrs.pincode ? { reg_pincode: regErrs.pincode } : {}),
        ...(corpErrs.pincode ? { corp_pincode: corpErrs.pincode } : {}),
      };
      if (Object.keys(combined).length) {
        setErrors(combined);
        showToast.error("Please provide valid 6-digit Pin Codes.");
        return;
      }
    } else if (currentStepKey === "users") {
      const firstUser = form.users[0];
      if (!firstUser?.name || !firstUser?.mobile) {
        showToast.error("Please enter at least one user Name and Mobile number.");
        return;
      }
    }
    setErrors({});
    const nextIndex = Math.min(stepIndex + 1, ONBOARD_STEPS.length - 1);
    setCurrentStepKey(ONBOARD_STEPS[nextIndex].key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrevStep = () => {
    const prevIndex = Math.max(stepIndex - 1, 0);
    setCurrentStepKey(ONBOARD_STEPS[prevIndex].key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Final Submit on Step 5
  const handleFinish = async (e) => {
    e?.preventDefault?.();
    setIsSubmitting(true);
    try {
      const created = await garageOnboardService.createGarage(form);
      showToast.success("Garage Onboard form submitted successfully!");
      setForm(INITIAL_FORM);
      setCurrentStepKey("workshop");
      await loadData();
      setSuccessModal(created);
    } catch (err) {
      showToast.error(err.message || "Failed to submit onboarding application.");
    } finally {
      setIsSubmitting(false);
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

  const tableColumns = [
    {
      key: "requestNumber",
      header: "Request No.",
      render: (row) => (
        <span className="font-semibold text-brand-700">{row.requestNumber}</span>
      ),
    },
    {
      key: "displayName",
      header: "Workshop & Registered Name",
      render: (row) => (
        <div>
          <p className="font-semibold text-ink-900">{row.workshopDetails?.displayName}</p>
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
        <span className="text-xs text-ink-700">
          {row.registeredAddress?.city || "-"}, {row.registeredAddress?.state} ({row.registeredAddress?.stateCode})
        </span>
      ),
    },
    {
      key: "submittedDate",
      header: "Submitted Date",
      render: (row) => (
        <span className="text-xs font-medium text-ink-700">
          {formatDate(row.submittedAt)}
        </span>
      ),
    },
    {
      key: "hub",
      header: "Hub / Zone",
      render: (row) => (
        <div>
          <p className="text-xs font-medium text-ink-800">{row.otherInfo?.hub || "N/A"}</p>
          <p className="text-[11px] text-ink-500">{row.otherInfo?.zone || ""}</p>
        </div>
      ),
    },
    {
      key: "baysCount",
      header: "Bays",
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-800">
          <Layers className="h-3.5 w-3.5 text-brand-600" /> {row.workshopBays?.length || 0} Bays
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: "action",
      header: "Action",
      render: (row) => (
        <Button
          size="sm"
          variant="secondary"
          icon={Eye}
          onClick={() => setSelectedApp(row)}
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4 pb-12">
      {/* Top Header Card with Bold Highlighted Tab Switcher */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-ink-100 bg-white p-4 shadow-card">
        <div>
          <h1 className="text-xl font-bold text-ink-900">Garage Onboard</h1>
          <p className="text-xs text-ink-500">
            Complete the 3-step registration process to onboard your garage onto the myTVS network.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 rounded-xl bg-ink-100/80 p-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab("apply");
              setCurrentStepKey("workshop");
            }}
            className={clsx(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer",
              activeTab === "apply"
                ? "bg-brand-600 text-white shadow-sm ring-2 ring-brand-500/20"
                : "text-ink-600 hover:text-ink-900 hover:bg-white/50"
            )}
          >
            <Plus className="h-3.5 w-3.5" /> Create Garage
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("tracker");
              loadData();
            }}
            className={clsx(
              "relative flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all cursor-pointer",
              activeTab === "tracker"
                ? "bg-brand-600 text-white shadow-sm ring-2 ring-brand-500/20"
                : "text-ink-600 hover:text-ink-900 hover:bg-white/50"
            )}
          >
            <Clock className="h-3.5 w-3.5" /> My Submissions
            {applications.length > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
                {applications.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab 1: Stepper Application Form */}
      {activeTab === "apply" && (
        <Card className="space-y-5">
          {/* Clean Horizontal Job Card Style Stepper */}
          <div className="overflow-x-auto border-b border-ink-100 pb-4">
            <div className="flex min-w-[700px] items-center">
              {ONBOARD_STEPS.map((step, idx) => {
                const active = step.key === currentStepKey;
                const done = completedSteps.has(step.key) && !active;
                const bubble = done
                  ? "bg-emerald-500 text-white"
                  : active
                    ? "bg-brand-600 text-white shadow-xs"
                    : "bg-white text-ink-500 border border-ink-200";
                const label = done
                  ? "text-emerald-600"
                  : active
                    ? "text-brand-700"
                    : "text-ink-500";
                const connector =
                  completedSteps.has(step.key) || active
                    ? "bg-brand-500"
                    : "bg-ink-200";

                return (
                  <div
                    key={step.key}
                    className="flex flex-1 items-center last:flex-none"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setErrors({});
                        setCurrentStepKey(step.key);
                      }}
                      className="flex items-center gap-2.5 cursor-pointer text-left"
                    >
                      <span
                        className={clsx(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors",
                          bubble
                        )}
                      >
                        {done ? <Check className="h-4 w-4 stroke-[2.5]" /> : idx + 1}
                      </span>
                      <span
                        className={clsx(
                          "whitespace-nowrap text-xs font-bold tracking-tight",
                          label
                        )}
                      >
                        {step.label}
                      </span>
                    </button>
                    {idx < ONBOARD_STEPS.length - 1 && (
                      <span
                        className={clsx("mx-3 hidden h-0.5 flex-1 sm:block", connector)}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Tools Bar with Info Banner */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 pb-3">
            <div className="flex items-center gap-2 text-xs text-ink-600">
              <Info className="h-4 w-4 text-brand-600" />
              <span>
                Step {stepIndex + 1} of 3 · Fields marked with <span className="font-bold text-danger-500">*</span> are mandatory.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Save}
                onClick={handleSaveDraft}
              >
                Save Draft
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Sparkles}
                onClick={handleAutofill}
              >
                Autofill Sample Data
              </Button>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* STEP 1: Workshop, Bank & Virtual Account Details */}
          {/* ========================================================================= */}
          {currentStepKey === "workshop" && (
            <div className="space-y-6 pt-1">
              {/* 1. Workshop */}
              <div className="space-y-4 rounded-xl border border-ink-100 bg-ink-50/40 p-4">
                <div className="flex items-center gap-2.5 border-b border-ink-100 pb-2">
                  <Building2 className="h-4 w-4 text-brand-600" />
                  <h2 className="text-sm font-bold text-ink-900">1. Workshop</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Input
                    label="1. Display Name *"
                    placeholder="e.g. Speedy Auto Care"
                    value={form.workshopDetails.displayName}
                    onChange={(e) => updateWorkshopDetails("displayName", e.target.value)}
                    error={errors.displayName}
                  />

                  <Input
                    label="2. Mobile Number *"
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    value={form.workshopDetails.mobile}
                    onChange={(e) =>
                      updateWorkshopDetails("mobile", e.target.value.replace(/\D/g, ""))
                    }
                    error={errors.mobile}
                  />

                  <Input
                    label="3. Registered Name *"
                    placeholder="e.g. Speedy Auto Care Solutions Pvt Ltd"
                    value={form.workshopDetails.registeredName}
                    onChange={(e) => updateWorkshopDetails("registeredName", e.target.value)}
                    error={errors.registeredName}
                  />

                  <Input
                    label="4. Alternate Contact Number"
                    placeholder="Landline / Mobile"
                    value={form.workshopDetails.alternateContactNumber}
                    onChange={(e) => updateWorkshopDetails("alternateContactNumber", e.target.value)}
                  />

                  <Input
                    label="5. GST Number"
                    placeholder="15-character GSTIN"
                    maxLength={15}
                    value={form.workshopDetails.gstNumber}
                    onChange={(e) =>
                      updateWorkshopDetails("gstNumber", e.target.value.toUpperCase())
                    }
                  />

                  <Input
                    label="6. Email"
                    type="email"
                    placeholder="workshop@example.com"
                    value={form.workshopDetails.email}
                    onChange={(e) => updateWorkshopDetails("email", e.target.value)}
                  />

                  <Input
                    label="7. PAN Number"
                    placeholder="10-character PAN"
                    maxLength={10}
                    value={form.workshopDetails.panNumber}
                    onChange={(e) =>
                      updateWorkshopDetails("panNumber", e.target.value.toUpperCase())
                    }
                  />

                  <Input
                    label="8. Remarks"
                    placeholder="Specialization notes"
                    value={form.workshopDetails.remarks}
                    onChange={(e) => updateWorkshopDetails("remarks", e.target.value)}
                  />

                  <Input
                    label="9. CIN Number"
                    placeholder="Corporate Identity No."
                    value={form.workshopDetails.cinNumber}
                    onChange={(e) =>
                      updateWorkshopDetails("cinNumber", e.target.value.toUpperCase())
                    }
                  />
                </div>
              </div>

              {/* 2. Bank Details */}
              <div className="space-y-4 rounded-xl border border-ink-100 bg-ink-50/40 p-4">
                <div className="flex items-center gap-2.5 border-b border-ink-100 pb-2">
                  <Landmark className="h-4 w-4 text-accent-600" />
                  <h2 className="text-sm font-bold text-ink-900">2. Bank Details</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Input
                    label="10. Bank Name"
                    placeholder="Bank name"
                    value={form.bankDetails.bankName}
                    onChange={(e) => updateBankDetails("bankName", e.target.value)}
                  />

                  <Input
                    label="11. Account Number"
                    placeholder="Bank Account Number"
                    value={form.bankDetails.accountNumber}
                    onChange={(e) => updateBankDetails("accountNumber", e.target.value)}
                  />

                  <Input
                    label="12. Branch Name"
                    placeholder="Branch name"
                    value={form.bankDetails.branchName}
                    onChange={(e) => updateBankDetails("branchName", e.target.value)}
                  />

                  <Input
                    label="13. IFSC Code"
                    placeholder="11-character IFSC"
                    maxLength={11}
                    value={form.bankDetails.ifscCode}
                    onChange={(e) =>
                      updateBankDetails("ifscCode", e.target.value.toUpperCase())
                    }
                  />
                </div>
              </div>

              {/* 3. Virtual Account Details */}
              <div className="space-y-4 rounded-xl border border-ink-100 bg-ink-50/40 p-4">
                <div className="flex items-center gap-2.5 border-b border-ink-100 pb-2">
                  <CreditCard className="h-4 w-4 text-brand-600" />
                  <h2 className="text-sm font-bold text-ink-900">3. Virtual Account Details</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-xs font-semibold text-ink-700">
                      14. Is Google Link Available
                    </label>
                    <div className="flex items-center gap-4 pt-1">
                      <label className="flex items-center gap-2 text-xs font-medium text-ink-800 cursor-pointer">
                        <input
                          type="radio"
                          name="isGoogleLinkAvailable"
                          value="Yes"
                          checked={form.virtualAccountDetails.isGoogleLinkAvailable === "Yes"}
                          onChange={(e) =>
                            updateVirtualAccountDetails("isGoogleLinkAvailable", e.target.value)
                          }
                          className="h-4 w-4 text-brand-600 focus:ring-brand-500"
                        />
                        Yes
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium text-ink-800 cursor-pointer">
                        <input
                          type="radio"
                          name="isGoogleLinkAvailable"
                          value="No"
                          checked={form.virtualAccountDetails.isGoogleLinkAvailable === "No"}
                          onChange={(e) =>
                            updateVirtualAccountDetails("isGoogleLinkAvailable", e.target.value)
                          }
                          className="h-4 w-4 text-brand-600 focus:ring-brand-500"
                        />
                        No
                      </label>
                    </div>
                  </div>

                  <Input
                    label="15. Payment in the Name of"
                    placeholder="Beneficiary Name"
                    value={form.virtualAccountDetails.paymentInNameOf}
                    onChange={(e) => updateVirtualAccountDetails("paymentInNameOf", e.target.value)}
                  />

                  <Input
                    label="16. Bank Name"
                    placeholder="Virtual Bank Name"
                    value={form.virtualAccountDetails.virtualBankName}
                    onChange={(e) => updateVirtualAccountDetails("virtualBankName", e.target.value)}
                  />

                  <Input
                    label="17. Branch Name"
                    placeholder="Virtual Branch"
                    value={form.virtualAccountDetails.virtualBranchName}
                    onChange={(e) =>
                      updateVirtualAccountDetails("virtualBranchName", e.target.value)
                    }
                  />

                  <Input
                    label="18. Account Number"
                    placeholder="Virtual Account Number"
                    value={form.virtualAccountDetails.virtualAccountNumber}
                    onChange={(e) =>
                      updateVirtualAccountDetails("virtualAccountNumber", e.target.value)
                    }
                  />

                  <Input
                    label="19. IFSC Code"
                    placeholder="11-character IFSC"
                    maxLength={11}
                    value={form.virtualAccountDetails.virtualIfscCode}
                    onChange={(e) =>
                      updateVirtualAccountDetails("virtualIfscCode", e.target.value.toUpperCase())
                    }
                  />

                  <Input
                    label="20. UPI ID"
                    placeholder="e.g. workshop@bankupi"
                    value={form.virtualAccountDetails.upiId}
                    onChange={(e) => updateVirtualAccountDetails("upiId", e.target.value)}
                  />

                  <Select
                    label="21. Insurance Companies"
                    placeholder="Select Insurance Company"
                    value={form.virtualAccountDetails.insuranceCompany}
                    onChange={(e) =>
                      updateVirtualAccountDetails("insuranceCompany", e.target.value)
                    }
                    options={INSURANCE_COMPANIES}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: Address & Bay */}
          {/* ========================================================================= */}
          {currentStepKey === "address_bay" && (
            <div className="space-y-6 pt-1">
              {/* 1. Registered Address */}
              <div className="space-y-4 rounded-xl border border-ink-100 bg-ink-50/40 p-4">
                <div className="flex items-center gap-2.5 border-b border-ink-100 pb-2">
                  <MapPin className="h-4 w-4 text-brand-600" />
                  <h2 className="text-sm font-bold text-ink-900">1. Registered Address</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="sm:col-span-2">
                    <Input
                      label="Street"
                      placeholder="Street address, building name, plot number"
                      value={form.registeredAddress.street}
                      onChange={(e) => updateRegisteredAddress("street", e.target.value)}
                    />
                  </div>

                  <Input
                    label="Location"
                    placeholder="Locality / Area / Landmark"
                    value={form.registeredAddress.location}
                    onChange={(e) => updateRegisteredAddress("location", e.target.value)}
                  />

                  <Input
                    label="Pin Code *"
                    placeholder="6-digit pincode"
                    maxLength={6}
                    value={form.registeredAddress.pincode}
                    onChange={(e) =>
                      updateRegisteredAddress("pincode", e.target.value.replace(/\D/g, ""))
                    }
                    error={errors.reg_pincode}
                    hint={isRegPinLoading ? "Fetching city & state..." : undefined}
                  />

                  <Select
                    label="State"
                    value={form.registeredAddress.state}
                    onChange={(e) => updateRegisteredAddress("state", e.target.value)}
                    options={STATE_OPTIONS}
                  />

                  <Input
                    label="City"
                    placeholder="City name"
                    value={form.registeredAddress.city}
                    onChange={(e) => updateRegisteredAddress("city", e.target.value)}
                  />

                  <Input
                    label="State Code"
                    placeholder="State code"
                    value={form.registeredAddress.stateCode}
                    onChange={(e) => updateRegisteredAddress("stateCode", e.target.value)}
                  />
                </div>
              </div>

              {/* 2. Corporate Address */}
              <div className="space-y-4 rounded-xl border border-ink-100 bg-ink-50/40 p-4">
                <div className="flex items-center justify-between border-b border-ink-100 pb-2">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="h-4 w-4 text-accent-600" />
                    <h2 className="text-sm font-bold text-ink-900">2. Corporate Address</h2>
                  </div>

                  <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-ink-700 cursor-pointer border border-ink-200 hover:bg-ink-50">
                    <input
                      type="checkbox"
                      checked={form.corporateAddress.sameAsRegistered}
                      onChange={(e) =>
                        updateCorporateAddress("sameAsRegistered", e.target.checked)
                      }
                      className="h-3.5 w-3.5 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                    />
                    Same as Registered Address
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="sm:col-span-2">
                    <Input
                      label="Street"
                      placeholder="Corporate street address"
                      value={form.corporateAddress.street}
                      disabled={form.corporateAddress.sameAsRegistered}
                      onChange={(e) => updateCorporateAddress("street", e.target.value)}
                    />
                  </div>

                  <Input
                    label="Location"
                    placeholder="Locality / Area"
                    value={form.corporateAddress.location}
                    disabled={form.corporateAddress.sameAsRegistered}
                    onChange={(e) => updateCorporateAddress("location", e.target.value)}
                  />

                  <Input
                    label="Pin Code *"
                    placeholder="6-digit pincode"
                    maxLength={6}
                    value={form.corporateAddress.pincode}
                    disabled={form.corporateAddress.sameAsRegistered}
                    onChange={(e) =>
                      updateCorporateAddress("pincode", e.target.value.replace(/\D/g, ""))
                    }
                    error={errors.corp_pincode}
                    hint={!form.corporateAddress.sameAsRegistered && isCorpPinLoading ? "Fetching city & state..." : undefined}
                  />

                  <Select
                    label="State"
                    value={form.corporateAddress.state}
                    disabled={form.corporateAddress.sameAsRegistered}
                    onChange={(e) => updateCorporateAddress("state", e.target.value)}
                    options={STATE_OPTIONS}
                  />

                  <Input
                    label="City"
                    placeholder="Corporate City"
                    value={form.corporateAddress.city}
                    disabled={form.corporateAddress.sameAsRegistered}
                    onChange={(e) => updateCorporateAddress("city", e.target.value)}
                  />

                  <Input
                    label="State Code"
                    placeholder="State code"
                    value={form.corporateAddress.stateCode}
                    disabled={form.corporateAddress.sameAsRegistered}
                    onChange={(e) => updateCorporateAddress("stateCode", e.target.value)}
                  />
                </div>
              </div>

              {/* 3. Workshop Bays */}
              <div className="space-y-4 rounded-xl border border-ink-100 bg-ink-50/40 p-4">
                <div className="flex items-center justify-between border-b border-ink-100 pb-2">
                  <div className="flex items-center gap-2.5">
                    <Layers className="h-4 w-4 text-brand-600" />
                    <h2 className="text-sm font-bold text-ink-900">3. Workshop Bays</h2>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    icon={Plus}
                    onClick={addBay}
                  >
                    Add Workshop Bay
                  </Button>
                </div>

                <div className="space-y-3">
                  {form.workshopBays.map((bay, idx) => (
                    <div
                      key={bay.id || idx}
                      className="flex flex-col gap-3 rounded-lg border border-ink-200 bg-white p-3 sm:flex-row sm:items-end"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-50 text-xs font-bold text-ink-700 border border-ink-200">
                        #{idx + 1}
                      </div>

                      <div className="flex-1">
                        <Input
                          label="Name"
                          placeholder="e.g. Bay 1, Lift Bay"
                          value={bay.name}
                          onChange={(e) => updateBay(idx, "name", e.target.value)}
                        />
                      </div>

                      <div className="flex-1">
                        <Select
                          label="Type"
                          value={bay.type}
                          onChange={(e) => updateBay(idx, "type", e.target.value)}
                          options={BAY_TYPES}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => removeBay(idx)}
                        title="Remove Bay"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-danger-200 bg-white text-danger-500 hover:bg-danger-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: Users */}
          {/* ========================================================================= */}
          {currentStepKey === "users" && (
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between border-b border-ink-100 pb-2">
                <div className="flex items-center gap-2.5">
                  <UsersIcon className="h-4 w-4 text-brand-600" />
                  <div>
                    <h2 className="text-sm font-bold text-ink-900">User Details</h2>
                    <p className="text-xs text-ink-500">
                      Configure workshop staff accounts. Accounts are initialized with <span className="font-semibold text-amber-600">INACTIVE</span> status.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  icon={Plus}
                  onClick={addUser}
                >
                  Add User
                </Button>
              </div>

              <div className="space-y-4">
                {form.users.map((usr, idx) => (
                  <div
                    key={usr.id || idx}
                    className="rounded-xl border border-ink-200 bg-ink-50/40 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-ink-200/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                          {idx + 1}
                        </span>
                        <h3 className="text-xs font-bold text-ink-800">
                          {usr.name ? usr.name : `User ${idx + 1}`}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
                          Status: INACTIVE
                        </span>
                        {form.users.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeUser(idx)}
                            className="text-danger-500 hover:text-danger-700 p-1 cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <Input
                        label="Name *"
                        placeholder="Full Name"
                        value={usr.name}
                        onChange={(e) => updateUser(idx, "name", e.target.value)}
                      />

                      <Input
                        label="Mobile Number *"
                        placeholder="10-digit mobile"
                        maxLength={10}
                        value={usr.mobile}
                        onChange={(e) =>
                          updateUser(idx, "mobile", e.target.value.replace(/\D/g, ""))
                        }
                      />

                      <Input
                        label="Alternate Mobile Number"
                        placeholder="Alternate mobile"
                        value={usr.alternateMobile}
                        onChange={(e) => updateUser(idx, "alternateMobile", e.target.value)}
                      />

                      <Input
                        label="Email"
                        type="email"
                        placeholder="user@example.com"
                        value={usr.email}
                        onChange={(e) => updateUser(idx, "email", e.target.value)}
                      />

                      <Select
                        label="Role"
                        value={usr.role}
                        onChange={(e) => updateUser(idx, "role", e.target.value)}
                        options={USER_ROLES}
                      />

                      <Input
                        label="Remarks"
                        placeholder="Designation notes"
                        value={usr.remarks}
                        onChange={(e) => updateUser(idx, "remarks", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: Configuration */}
          {/* ========================================================================= */}
          {currentStepKey === "configuration" && (
            <div className="space-y-4 pt-1">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-ink-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <Settings className="h-4 w-4 text-brand-600" />
                  <div>
                    <h2 className="text-sm font-bold text-ink-900">Module & Feature Configuration</h2>
                    <p className="text-xs text-ink-500">
                      Select which platform features and operational modules should be enabled for this workshop.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={selectAllConfigurations}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={deselectAllConfigurations}
                  >
                    Clear All
                  </Button>
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700 border border-brand-200">
                    Selected: {CONFIGURATION_OPTIONS.filter((c) => form.configuration?.[c.key]).length} / {CONFIGURATION_OPTIONS.length}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {CONFIGURATION_OPTIONS.map((item) => {
                  const isChecked = Boolean(form.configuration?.[item.key]);
                  return (
                    <label
                      key={item.key}
                      htmlFor={`config-${item.key}`}
                      className={clsx(
                        "flex items-start gap-3 rounded-xl border p-3.5 transition-all cursor-pointer select-none",
                        isChecked
                          ? "border-brand-500 bg-brand-50/40 ring-1 ring-brand-500/20 shadow-xs"
                          : "border-ink-200 bg-white hover:border-ink-300 hover:bg-ink-50/50"
                      )}
                    >
                      <input
                        type="checkbox"
                        id={`config-${item.key}`}
                        name={`config_${item.key}`}
                        checked={isChecked}
                        onChange={() => toggleConfiguration(item.key)}
                        className="mt-0.5 h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={clsx("text-xs font-bold", isChecked ? "text-brand-900" : "text-ink-800")}>
                            {item.label}
                          </span>
                          {isChecked && (
                            <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                              Enabled
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-ink-500 leading-tight">
                          {item.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="rounded-lg bg-brand-50/70 border border-brand-200 p-3 flex items-start gap-2.5 text-xs text-brand-900">
                <Info className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
                <span>
                  Configurations checked above will be sent for review and will be verified by the Business Admin.
                </span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 5: Other Information */}
          {/* ========================================================================= */}
          {currentStepKey === "other_info" && (
            <div className="space-y-6 pt-1">
              {/* 1. Workshop Information */}
              <div className="space-y-4 rounded-xl border border-ink-100 bg-ink-50/40 p-4">
                <div className="flex items-center gap-2.5 border-b border-ink-100 pb-2">
                  <Building2 className="h-4 w-4 text-brand-600" />
                  <h2 className="text-sm font-bold text-ink-900">Workshop Information</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Input
                    label="Plant Code"
                    placeholder="e.g. PLT-DEL-042"
                    value={form.otherInfo.plantCode}
                    onChange={(e) => updateOtherInfo("plantCode", e.target.value.toUpperCase())}
                  />

                  <Select
                    label="Workshop Type"
                    value={form.otherInfo.workshopType}
                    onChange={(e) => updateOtherInfo("workshopType", e.target.value)}
                    options={WORKSHOP_TYPES_STEP5}
                  />

                  <Select
                    label="Zone"
                    value={form.otherInfo.zone}
                    onChange={(e) => updateOtherInfo("zone", e.target.value)}
                    options={ZONES}
                  />

                  <Select
                    label="Area"
                    value={form.otherInfo.area}
                    onChange={(e) => updateOtherInfo("area", e.target.value)}
                    options={AREAS}
                  />

                  <Select
                    label="City"
                    value={form.otherInfo.city}
                    onChange={(e) => updateOtherInfo("city", e.target.value)}
                    options={CITIES}
                  />

                  <Select
                    label="City Type"
                    value={form.otherInfo.cityType}
                    onChange={(e) => updateOtherInfo("cityType", e.target.value)}
                    options={CITY_TYPES}
                  />
                </div>
              </div>

              {/* 2. USERS Section */}
              <div className="space-y-4 rounded-xl border border-ink-100 bg-ink-50/40 p-4">
                <div className="flex items-center gap-2.5 border-b border-ink-100 pb-2">
                  <UsersIcon className="h-4 w-4 text-accent-600" />
                  <h2 className="text-sm font-bold text-ink-900">USERS Section</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Select
                    label="ZH (Zonal Head)"
                    value={form.otherInfo.zh}
                    onChange={(e) => updateOtherInfo("zh", e.target.value)}
                    options={ZH_LIST}
                  />

                  <Select
                    label="ABH (Area Business Head)"
                    value={form.otherInfo.abh}
                    onChange={(e) => updateOtherInfo("abh", e.target.value)}
                    options={ABH_LIST}
                  />

                  <Select
                    label="FBM (Franchise Business Manager)"
                    value={form.otherInfo.fbm}
                    onChange={(e) => updateOtherInfo("fbm", e.target.value)}
                    options={FBM_LIST}
                  />

                  <Select
                    label="APM (Area Parts Manager)"
                    value={form.otherInfo.apm}
                    onChange={(e) => updateOtherInfo("apm", e.target.value)}
                    options={APM_LIST}
                  />
                </div>
              </div>

              {/* 3. HUBS Section */}
              <div className="space-y-4 rounded-xl border border-ink-100 bg-ink-50/40 p-4">
                <div className="flex items-center gap-2.5 border-b border-ink-100 pb-2">
                  <Layers className="h-4 w-4 text-brand-600" />
                  <h2 className="text-sm font-bold text-ink-900">HUBS Section</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Select
                    label="HUBS"
                    value={form.otherInfo.hub}
                    onChange={(e) => updateOtherInfo("hub", e.target.value)}
                    options={HUBS_LIST}
                  />

                  <Input
                    label="Activation Date"
                    type="date"
                    icon={Calendar}
                    value={form.otherInfo.activationDate}
                    onChange={(e) => updateOtherInfo("activationDate", e.target.value)}
                  />
                </div>
              </div>

              {/* 4. TARGET Section */}
              <div className="space-y-4 rounded-xl border border-ink-100 bg-ink-50/40 p-4">
                <div className="flex items-center gap-2.5 border-b border-ink-100 pb-2">
                  <Target className="h-4 w-4 text-brand-600" />
                  <h2 className="text-sm font-bold text-ink-900">TARGET Section</h2>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Input
                    label="Mechanical Inflow"
                    placeholder="e.g. 180 Vehicles"
                    value={form.otherInfo.targets.mechanicalInflow}
                    onChange={(e) => updateTarget("mechanicalInflow", e.target.value)}
                  />

                  <Input
                    label="Mechanical Revenue"
                    placeholder="e.g. ₹9,50,000"
                    value={form.otherInfo.targets.mechanicalRevenue}
                    onChange={(e) => updateTarget("mechanicalRevenue", e.target.value)}
                  />

                  <Input
                    label="Body Repair Inflow"
                    placeholder="e.g. 45 Vehicles"
                    value={form.otherInfo.targets.bodyRepairInflow}
                    onChange={(e) => updateTarget("bodyRepairInflow", e.target.value)}
                  />

                  <Input
                    label="Body Repair Revenue"
                    placeholder="e.g. ₹4,20,000"
                    value={form.otherInfo.targets.bodyRepairRevenue}
                    onChange={(e) => updateTarget("bodyRepairRevenue", e.target.value)}
                  />

                  <Input
                    label="Parts Offtake"
                    placeholder="e.g. ₹5,00,000"
                    value={form.otherInfo.targets.partsOfftake}
                    onChange={(e) => updateTarget("partsOfftake", e.target.value)}
                  />
                </div>
              </div>

              {/* 5. QR Image Section */}
              <div className="space-y-4 rounded-xl border border-ink-100 bg-ink-50/40 p-4">
                <div className="flex items-center gap-2.5 border-b border-ink-100 pb-2">
                  <QrCode className="h-4 w-4 text-accent-600" />
                  <h2 className="text-sm font-bold text-ink-900">QR Image Section</h2>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <label className="mb-1.5 block text-xs font-semibold text-ink-700">
                      QR Image
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="inline-flex items-center gap-2 rounded-lg border border-ink-300 bg-white px-3.5 py-2 text-xs font-semibold text-ink-700 hover:bg-ink-50 transition-colors cursor-pointer shadow-xs">
                        <Upload className="h-3.5 w-3.5 text-brand-600" />
                        Choose File
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              updateOtherInfo("qrImage", e.target.files[0].name);
                              setQrVerified(true);
                              showToast.success(`Attached ${e.target.files[0].name}`);
                            }
                          }}
                        />
                      </label>
                      <span className="text-xs text-ink-600 truncate max-w-xs font-medium">
                        {form.otherInfo.qrImage || "No file chosen"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setQrVerified((v) => !v);
                        showToast.info(
                          qrVerified ? "QR Verification toggled off" : "QR Image verified!"
                        );
                      }}
                      className={`flex h-9 w-9 items-center justify-center rounded-full transition-all cursor-pointer ${qrVerified
                          ? "bg-success-500 text-white shadow-xs"
                          : "bg-ink-200 text-ink-500 hover:bg-ink-300"
                        }`}
                      title={qrVerified ? "QR Code Verified" : "Click to mark QR Verified"}
                    >
                      <Check className="h-4 w-4 stroke-[2.5]" />
                    </button>
                    <span className="text-xs text-ink-500 font-medium">
                      {qrVerified ? "QR Verified" : "Mark Verified"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Footer Navigation matching Job Card style */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4">
            <div>
              {stepIndex > 0 ? (
                <Button
                  type="button"
                  variant="border"
                  onClick={handlePrevStep}
                >
                  Back
                </Button>
              ) : (
                <div />
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="border"
                icon={Save}
                onClick={handleSaveDraft}
              >
                Save
              </Button>

              {stepIndex < ONBOARD_STEPS.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                >
                  Continue
                </Button>
              ) : (
                <Button
                  type="button"
                  isLoading={isSubmitting}
                  onClick={handleFinish}
                >
                  Finish
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Tab 2: Submissions Tracker */}
      {activeTab === "tracker" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-ink-900">
                My Onboarding Submissions
              </h2>
              <p className="text-xs text-ink-500">
                Track status and review evaluations from Business Admins.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={loadData}
            >
              Refresh
            </Button>
          </div>

          <Card padded={false}>
            <Table
              columns={tableColumns}
              data={applications}
              emptyTitle="No applications found"
              emptyDescription="You haven't submitted any garage onboarding applications yet. Click 'New Application' to begin."
            />
          </Card>
        </div>
      )}

      {/* Success Submission Modal */}
      {successModal && (
        <Modal
          isOpen={Boolean(successModal)}
          onClose={() => setSuccessModal(null)}
          title="Onboarding Application Submitted"
          size="md"
          footer={
            <Button
              onClick={() => {
                setSuccessModal(null);
                setActiveTab("tracker");
              }}
            >
              Go to Submissions Tracker
            </Button>
          }
        >
          <div className="space-y-4 py-2 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-50 text-success-500">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-ink-900">
                Request {successModal.requestNumber}
              </h3>
              <p className="mt-1 text-xs text-ink-600">
                Your garage onboarding application for{" "}
                <span className="font-semibold text-ink-800">
                  {successModal.workshopDetails?.displayName}
                </span>{" "}
                has been submitted to the Business Admin queue for review and approval.
              </p>
            </div>
            <div className="rounded-xl border border-ink-100 bg-ink-50 p-3 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-ink-500">Submitted By:</span>
                <span className="font-medium text-ink-800">
                  {successModal.submittedBy?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Submitted Date:</span>
                <span className="font-medium text-ink-800">
                  {formatDate(successModal.submittedAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Status:</span>
                <span className="font-semibold text-warning-500">PENDING REVIEW</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-500">Assigned Hub:</span>
                <span className="font-medium text-ink-800">
                  {successModal.otherInfo?.hub || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Detail Inspector Modal for Submitted Application */}
      {selectedApp && (
        <Modal
          isOpen={Boolean(selectedApp)}
          onClose={() => setSelectedApp(null)}
          title={`Application Details — ${selectedApp.requestNumber}`}
          size="lg"
          footer={
            <Button variant="secondary" onClick={() => setSelectedApp(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Status Header Banner */}
            <div
              className={`flex items-start justify-between rounded-xl p-3.5 border ${selectedApp.status === "APPROVED"
                  ? "bg-success-50/60 border-success-200"
                  : selectedApp.status === "REJECTED"
                    ? "bg-danger-50/60 border-danger-200"
                    : "bg-warning-50/60 border-warning-200"
                }`}
            >
              <div>
                <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wide">
                  Application Status
                </span>
                <div className="mt-1">{getStatusBadge(selectedApp.status)}</div>
              </div>
              <div className="text-right text-[11px] text-ink-500">
                <p>Submitted Date: <span className="font-semibold text-ink-700">{formatDate(selectedApp.submittedAt)}</span></p>
                <p>Submitted By: <span className="font-semibold text-ink-700">{selectedApp.submittedBy?.name}</span></p>
              </div>
            </div>

            {/* Admin Review Feedback */}
            {selectedApp.reviewDetails && (
              <div
                className={`rounded-xl border p-3.5 space-y-1.5 ${selectedApp.status === "APPROVED"
                    ? "bg-emerald-50/50 border-emerald-200 text-emerald-900"
                    : "bg-red-50/50 border-red-200 text-red-900"
                  }`}
              >
                <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                  {selectedApp.status === "APPROVED" ? (
                    <CheckCircle2 className="h-4 w-4 text-success-500" />
                  ) : (
                    <ShieldAlert className="h-4 w-4 text-danger-500" />
                  )}
                  Admin Review Notes ({selectedApp.reviewDetails.reviewedBy})
                </div>
                {selectedApp.reviewDetails.commissionTier && (
                  <p>
                    <span className="font-semibold">Commission Tier:</span>{" "}
                    {selectedApp.reviewDetails.commissionTier}
                  </p>
                )}
                {selectedApp.reviewDetails.reason && (
                  <p>
                    <span className="font-semibold">Rejection Reason:</span>{" "}
                    {selectedApp.reviewDetails.reason}
                  </p>
                )}
                <p>
                  <span className="font-semibold">Remarks:</span>{" "}
                  {selectedApp.reviewDetails.remarks}
                </p>
              </div>
            )}

            {/* Step 1: Workshop & Bank Details */}
            <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-3.5 space-y-2">
              <p className="font-bold uppercase tracking-wide text-brand-700">
                1. Workshop & Identification
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <div>
                  <span className="text-ink-400">Display Name:</span>{" "}
                  <p className="font-semibold text-ink-900">
                    {selectedApp.workshopDetails?.displayName}
                  </p>
                </div>
                <div>
                  <span className="text-ink-400">Registered Name:</span>{" "}
                  <p className="font-semibold text-ink-900">
                    {selectedApp.workshopDetails?.registeredName}
                  </p>
                </div>
                <div>
                  <span className="text-ink-400">Mobile Number:</span>{" "}
                  <p className="font-semibold text-ink-900">
                    {selectedApp.workshopDetails?.mobile}
                  </p>
                </div>
                <div>
                  <span className="text-ink-400">GST Number:</span>{" "}
                  <p className="font-medium text-ink-800">
                    {selectedApp.workshopDetails?.gstNumber || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-ink-400">PAN Number:</span>{" "}
                  <p className="font-medium text-ink-800">
                    {selectedApp.workshopDetails?.panNumber || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-ink-400">CIN Number:</span>{" "}
                  <p className="font-medium text-ink-800">
                    {selectedApp.workshopDetails?.cinNumber || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Step 2: Addresses & Bays */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-3.5 space-y-1">
                <p className="font-bold uppercase tracking-wide text-brand-700">
                  Registered Address
                </p>
                <p><span className="text-ink-400">Street:</span> <span className="font-medium text-ink-800">{selectedApp.registeredAddress?.street || "N/A"}</span></p>
                <p><span className="text-ink-400">City / State:</span> <span className="font-medium text-ink-800">{selectedApp.registeredAddress?.city}, {selectedApp.registeredAddress?.state}</span></p>
                <p><span className="text-ink-400">Pin / State Code:</span> <span className="font-medium text-ink-800">{selectedApp.registeredAddress?.pincode} ({selectedApp.registeredAddress?.stateCode})</span></p>
              </div>

              <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-3.5 space-y-1">
                <p className="font-bold uppercase tracking-wide text-accent-700">
                  Corporate Address
                </p>
                <p><span className="text-ink-400">Street:</span> <span className="font-medium text-ink-800">{selectedApp.corporateAddress?.street || "N/A"}</span></p>
                <p><span className="text-ink-400">City / State:</span> <span className="font-medium text-ink-800">{selectedApp.corporateAddress?.city}, {selectedApp.corporateAddress?.state}</span></p>
                <p><span className="text-ink-400">Pin / State Code:</span> <span className="font-medium text-ink-800">{selectedApp.corporateAddress?.pincode} ({selectedApp.corporateAddress?.stateCode})</span></p>
              </div>
            </div>

            {/* Step 3: Users */}
            <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-3.5 space-y-2">
              <p className="font-bold uppercase tracking-wide text-brand-700">
                Staff & Users ({selectedApp.users?.length || 0})
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(selectedApp.users || []).map((u, i) => (
                  <div key={i} className="rounded-lg bg-white p-2.5 border border-ink-100">
                    <p className="font-bold text-ink-900">{u.name}</p>
                    <p className="text-ink-600">{u.role} · 📱 {u.mobile}</p>
                    <span className="rounded bg-amber-50 px-1.5 py-0.2 text-[10px] font-bold text-amber-700">
                      {u.status || "INACTIVE"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 4: Configuration */}
            {/* {(() => {
              const enabledConfigs = CONFIGURATION_OPTIONS.filter(
                (opt) => Boolean(selectedApp.configuration?.[opt.key])
              );
              return (
                <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-3.5 space-y-2">
                  <p className="font-bold uppercase tracking-wide text-brand-700">
                    4. Enabled Configurations ({enabledConfigs.length})
                  </p>
                  {enabledConfigs.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {enabledConfigs.map((c) => (
                        <span
                          key={c.key}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200"
                        >
                          <Check className="h-3 w-3 text-emerald-600" />
                          {c.label}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-ink-500">None selected</p>
                  )}
                </div>
              );
            })()} */}

            {/* Step 5: Other Information */}
            {/* <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-3.5 space-y-2">
              <p className="font-bold uppercase tracking-wide text-brand-700">
                Hub, Targets & Allocation
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <p><span className="text-ink-400">Plant Code:</span> <span className="font-semibold text-ink-800">{selectedApp.otherInfo?.plantCode || "N/A"}</span></p>
                <p><span className="text-ink-400">Hub:</span> <span className="font-semibold text-ink-800">{selectedApp.otherInfo?.hub || "N/A"}</span></p>
                <p><span className="text-ink-400">Activation Date:</span> <span className="font-semibold text-ink-800">{selectedApp.otherInfo?.activationDate || "N/A"}</span></p>
                <p><span className="text-ink-400">ZH / ABH:</span> <span className="font-semibold text-ink-800">{selectedApp.otherInfo?.zh} / {selectedApp.otherInfo?.abh}</span></p>
                <p><span className="text-ink-400">Mech Target:</span> <span className="font-semibold text-ink-800">{selectedApp.otherInfo?.targets?.mechanicalInflow || "N/A"}</span></p>
                <p><span className="text-ink-400">QR Image:</span> <span className="font-semibold text-ink-800">{selectedApp.otherInfo?.qrImage || "Attached"}</span></p>
              </div>
            </div> */}
          </div>
        </Modal>
      )}
    </div>
  );
}
