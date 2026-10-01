/**
 * Mock data for Attendance & Salary > Salary tab.
 */

// ─── Header stat cards (5 across) ───────────────────────────────────────
export const SALARY_HEADER_STATS = {
  totalEmployees:  { value: 18, subtitle: "Active Employees" },
  monthPayroll:    { value: 285600, subtitle: "May 2024" },
  paidEmployees:   { value: 12, subtitle: "This Month" },
  pendingEmployees:{ value: 6,  subtitle: "This Month" },
  totalDeductions: { value: 28450, subtitle: "This Month" },
};

// ─── Filter dropdowns ───────────────────────────────────────────────────
export const MONTH_OPTIONS = [
  { value: "2024-05", label: "May 2024" },
  { value: "2024-04", label: "April 2024" },
  { value: "2024-03", label: "March 2024" },
  { value: "2024-02", label: "February 2024" },
];

export const DEPARTMENT_OPTIONS = [
  { value: "",          label: "All Departments" },
  { value: "Service",   label: "Service" },
  { value: "Inventory", label: "Inventory" },
  { value: "Finance",   label: "Finance" },
  { value: "Sales",     label: "Sales" },
];

export const DESIGNATION_OPTIONS = [
  { value: "",                 label: "All Designations" },
  { value: "Service Advisor",  label: "Service Advisor" },
  { value: "Technician",       label: "Technician" },
  { value: "Store Incharge",   label: "Store Incharge" },
  { value: "Mechanic",         label: "Mechanic" },
  { value: "Helper",           label: "Helper" },
  { value: "Electrician",      label: "Electrician" },
  { value: "Accountant",       label: "Accountant" },
  { value: "Parts Executive",  label: "Parts Executive" },
];

export const STATUS_OPTIONS = [
  { value: "",        label: "All Status" },
  { value: "Paid",    label: "Paid" },
  { value: "Pending", label: "Pending" },
];

// ─── Salary List rows ───────────────────────────────────────────────────
export const INITIAL_SALARY_LIST = [
  { id: "EMP001", name: "Arun Kumar",    phone: "+91 98765 43210", initials: "AK", designation: "Service Advisor",  department: "Service",   basic: 25000, total: 28500, status: "Paid"    },
  { id: "EMP002", name: "Ravi Shankar",  phone: "+91 91234 56789", initials: "RS", designation: "Technician",       department: "Service",   basic: 20000, total: 22800, status: "Paid"    },
  { id: "EMP003", name: "Vignesh P",     phone: "+91 99887 66555", initials: "VP", designation: "Store Incharge",   department: "Inventory", basic: 18000, total: 20400, status: "Pending" },
  { id: "EMP004", name: "Manoj S",       phone: "+91 90000 22334", initials: "MS", designation: "Mechanic",         department: "Service",   basic: 17000, total: 19000, status: "Pending" },
  { id: "EMP005", name: "Joshua Kumar",  phone: "+91 93456 77889", initials: "JK", designation: "Helper",           department: "Service",   basic: 13000, total: 14600, status: "Paid"    },
  { id: "EMP006", name: "Sathish K",     phone: "+91 98765 12345", initials: "SK", designation: "Electrician",      department: "Service",   basic: 16000, total: 17900, status: "Pending" },
  { id: "EMP007", name: "Naveen V",      phone: "+91 81234 56789", initials: "NV", designation: "Accountant",       department: "Finance",   basic: 22000, total: 24800, status: "Paid"    },
  { id: "EMP008", name: "Prakash R",     phone: "+91 97979 79797", initials: "PR", designation: "Parts Executive",  department: "Inventory", basic: 15000, total: 16900, status: "Paid"    },
  { id: "EMP009", name: "Suresh Kumar",  phone: "+91 90807 06050", initials: "SK", designation: "Technician",       department: "Service",   basic: 19000, total: 21400, status: "Paid"    },
  { id: "EMP010", name: "Deepak M",      phone: "+91 90807 06051", initials: "DM", designation: "Mechanic",         department: "Service",   basic: 17500, total: 19700, status: "Paid"    },
];

// ─── Salary Added / Payslip Batches (bottom card) ───────────────────────
export const INITIAL_PAYSLIP_BATCHES = [
  {
    id: "SLP-2024-05-01", month: "May 2024", date: "2024-05-16",
    employees: 12, totalAmount: 285600, depositedBy: "Raghav",
    status: "Deposited",
  },
];