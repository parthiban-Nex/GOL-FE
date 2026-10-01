

export const ADVISORS = [
  "Arun Kumar",
  "Naveen Kumar",
  "Vikram Singh",
  "Deepak Sharma",
  "Priya Nair",
  "Ramesh R",
];

export const SERVICE_TYPES = [
  "General Service",
  "AC Service",
  "AC Repair",
  "Oil Change",
  "Brake Service",
  "Brake Replacement",
  "Suspension Check",
  "Battery Check",
  "Wheel Alignment",
  "Vehicle Wash",
  "Periodic Service",
  "Paint Touch Up",
];

export const STATUSES = ["Confirmed", "Pending", "Cancelled", "Completed"];

/** Fixed palette used for the coloured appointment cards. */
export const APPOINTMENT_COLORS = {
  blue: {
    bar: "bg-blue-500",
    bg: "bg-blue-50",
    time: "text-blue-600",
    border: "border-l-blue-500",
  },
  green: {
    bar: "bg-emerald-500",
    bg: "bg-emerald-50",
    time: "text-emerald-600",
    border: "border-l-emerald-500",
  },
  red: {
    bar: "bg-red-500",
    bg: "bg-red-50",
    time: "text-red-600",
    border: "border-l-red-500",
  },
  yellow: {
    bar: "bg-amber-500",
    bg: "bg-amber-50",
    time: "text-amber-600",
    border: "border-l-amber-500",
  },
  purple: {
    bar: "bg-violet-500",
    bg: "bg-violet-50",
    time: "text-violet-600",
    border: "border-l-violet-500",
  },
};

export const STATUS_BADGE = {
  Confirmed: "bg-blue-50 text-blue-600",
  Pending: "bg-amber-50 text-amber-600",
  Cancelled: "bg-red-50 text-red-600",
  Completed: "bg-emerald-50 text-emerald-600",
};


export const REFERENCE_WEEK_START = new Date(2024, 4, 13);

export const initialAppointments = [
  { id: "a1", dayOffset: 0, start: "09:00", end: "10:00", customer: "Arun Kumar", vehicle: "TN 09 CH 1234", service: "General Service", advisor: "Arun Kumar", color: "blue", status: "Confirmed" },
  { id: "a2", dayOffset: 0, start: "11:00", end: "12:00", customer: "Vikram Singh", vehicle: "TN 07 AB 5678", service: "AC Service", advisor: "Vikram Singh", color: "green", status: "Confirmed" },
  { id: "a3", dayOffset: 0, start: "14:00", end: "15:00", customer: "Priya Nair", vehicle: "KA 05 MF 4321", service: "Periodic Service", advisor: "Priya Nair", color: "purple", status: "Confirmed" },
  { id: "a4", dayOffset: 0, start: "16:00", end: "17:00", customer: "Suresh Babu", vehicle: "TN 11 X 9876", service: "General Service", advisor: "Arun Kumar", color: "yellow", status: "Pending" },

  { id: "a5", dayOffset: 1, start: "10:00", end: "11:00", customer: "Deepak Sharma", vehicle: "KA 03 MJ 1122", service: "Brake Service", advisor: "Deepak Sharma", color: "red", status: "Confirmed" },
  { id: "a6", dayOffset: 1, start: "13:00", end: "14:00", customer: "Ramesh R", vehicle: "TN 05 AQ 7788", service: "Battery Check", advisor: "Ramesh R", color: "yellow", status: "Confirmed" },
  { id: "a7", dayOffset: 1, start: "17:00", end: "18:00", customer: "Ananya Iyer", vehicle: "KA 04 ND 6789", service: "General Service", advisor: "Naveen Kumar", color: "green", status: "Confirmed" },

  { id: "a8", dayOffset: 2, start: "09:30", end: "10:30", customer: "Naveen Kumar", vehicle: "TN 09 BD 2211", service: "General Service", advisor: "Naveen Kumar", color: "green", status: "Confirmed" },
  { id: "a9", dayOffset: 2, start: "12:00", end: "13:00", customer: "Kavya K", vehicle: "TN 10 Z 3344", service: "Oil Change", advisor: "Arun Kumar", color: "blue", status: "Pending" },
  { id: "a10", dayOffset: 2, start: "15:00", end: "16:00", customer: "Harish Rao", vehicle: "KA 01 MP 5566", service: "Suspension Check", advisor: "Deepak Sharma", color: "red", status: "Confirmed" },

  { id: "a11", dayOffset: 3, start: "10:30", end: "11:30", customer: "Manoj Patel", vehicle: "TN 07 CD 8899", service: "General Service", advisor: "Priya Nair", color: "yellow", status: "Confirmed" },
  { id: "a12", dayOffset: 3, start: "14:30", end: "15:30", customer: "Divya S", vehicle: "TN 09 EF 6677", service: "AC Service", advisor: "Vikram Singh", color: "green", status: "Confirmed" },
  { id: "a13", dayOffset: 3, start: "17:30", end: "18:30", customer: "Aravind T", vehicle: "TN 11 AJ 9900", service: "General Service", advisor: "Naveen Kumar", color: "purple", status: "Pending" },

  { id: "a14", dayOffset: 4, start: "09:00", end: "11:00", customer: "Arun Kumar", vehicle: "TN 09 CH 1234", service: "Vehicle Wash", advisor: "Arun Kumar", color: "purple", status: "Confirmed" },
  { id: "a15", dayOffset: 4, start: "13:00", end: "14:30", customer: "Deepak Sharma", vehicle: "KA 03 MJ 1122", service: "Wheel Alignment", advisor: "Deepak Sharma", color: "blue", status: "Confirmed" },
  { id: "a16", dayOffset: 4, start: "16:00", end: "17:30", customer: "Vikram Singh", vehicle: "TN 07 AB 5678", service: "Paint Touch Up", advisor: "Vikram Singh", color: "yellow", status: "Confirmed" },

  { id: "a17", dayOffset: 5, start: "10:00", end: "12:00", customer: "Priya Nair", vehicle: "KA 05 MF 4321", service: "AC Repair", advisor: "Priya Nair", color: "green", status: "Confirmed" },
  { id: "a18", dayOffset: 5, start: "14:00", end: "16:00", customer: "Ramesh R", vehicle: "TN 05 AQ 7788", service: "Brake Replacement", advisor: "Ramesh R", color: "red", status: "Confirmed" },
];