/**
 * Mock data for Attendance & Salary > Attendance tab. Shape mirrors
 * what the eventual attendanceApi will return so switching to a real
 * backend is a one-line change per state selector.
 */

// ─── Legend / status types ──────────────────────────────────────────────
// `letter` is what shows inside each grid cell; `bg` + `text` are the
// tailwind palette entries used by the grid, mark-attendance toggles,
// and legend chips.
export const ATTENDANCE_STATUSES = [
  { key: "P",  label: "Present",   letter: "P",  bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  { key: "A",  label: "Absent",    letter: "A",  bg: "bg-red-100",     text: "text-red-700",     dot: "bg-red-500" },
  { key: "L",  label: "Leave",     letter: "L",  bg: "bg-pink-100",    text: "text-pink-700",    dot: "bg-pink-500" },
  { key: "DR", label: "Duty Rest", letter: "DR", bg: "bg-violet-100",  text: "text-violet-700",  dot: "bg-violet-500" },
  { key: "OD", label: "On Duty",   letter: "OD", bg: "bg-brand-100",   text: "text-brand-700",   dot: "bg-brand-500" },
  { key: "H",  label: "Holiday",   letter: "H",  bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500" },
  { key: "W",  label: "Weekend",   letter: "",   bg: "bg-ink-50",      text: "text-ink-400",     dot: "bg-ink-300" },
];

export const STATUS_BY_KEY = Object.fromEntries(ATTENDANCE_STATUSES.map((s) => [s.key, s]));

// Days per month for a 2025 calendar (not leap year).
export const DAYS_IN_MONTH_2025 = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── Selected employee for the grid card ────────────────────────────────
export const SELECTED_EMPLOYEE = {
  id: "EMP1004", name: "John Mathew", department: "Sales", initials: "JM",
};

/**
 * Repeating 7-day pattern used to seed the year grid so the visual
 * matches the reference without hand-typing 365 statuses. Weekends
 * (Sat/Sun) fall on days where `weekIndex % 7 === 0 || 6`.
 */
function generateYearGrid(seed = 0) {
  const grid = {};
  // Rotating cycle - roughly matches the density in the reference:
  // mostly Present with periodic Absents / Leaves / Holidays / etc.
  const pattern = ["DR","P","A","P","P","H","L","P","P","OD","P","P","P","P","P","P","P","P","P","P","A","P","P","P","P","P","P","OD","P","P","P"];
  for (let m = 0; m < 12; m++) {
    const row = [];
    const days = DAYS_IN_MONTH_2025[m];
    for (let d = 0; d < 31; d++) {
      if (d >= days) { row.push(null); continue; }
      // Every 7th day of the month = "W" (weekend visual)
      const rotated = (d + m + seed) % pattern.length;
      row.push(pattern[rotated]);
    }
    grid[m + 1] = row;
  }
  return grid;
}

export const ATTENDANCE_YEAR_GRID = generateYearGrid(0);
export const ATTENDANCE_YEAR_SUMMARY = {
  present: 170, absent: 18, leave: 17, dutyRest: 16, onDuty: 15,
  attendancePct: 67, workingDays: 252,
};

// ─── Mark Attendance list (bottom-left card) ────────────────────────────
export const SHIFT_OPTIONS = [
  { value: "1st Shift", label: "1st Shift" },
  { value: "2nd Shift", label: "2nd Shift" },
  { value: "3rd Shift", label: "3rd Shift" },
];

export const MARK_STATUS_KEYS = ["P", "A", "L", "DR", "OD"];

export const INITIAL_MARK_ATTENDANCE = [
  { id: "EMP1001", name: "Rahul Verma",   role: "Technician", manager: "Sunil Sharma", shift: "1st Shift", initials: "RV", mark: "A" },
  { id: "EMP1001", name: "Aditya Joshi",  role: "Technician", manager: "Sunil Sharma", shift: "2nd Shift", initials: "AJ", mark: "P" },
  { id: "EMP1002", name: "Priya Patel",   role: "Technician", manager: "Sunil Sharma", shift: "3rd Shift", initials: "PP", mark: "L" },
  { id: "EMP1003", name: "Siddharth Rao", role: "Technician", manager: "Sunil Sharma", shift: "1st Shift", initials: "SR", mark: "" },
  { id: "EMP1004", name: "Sneha Kapoor",  role: "Technician", manager: "Sunil Sharma", shift: "1st Shift", initials: "SK", mark: "" },
  { id: "EMP1005", name: "Nikhil Gupta",  role: "Technician", manager: "Sunil Sharma", shift: "1st Shift", initials: "NG", mark: "A" },
  { id: "EMP1006", name: "Ananya Sharma", role: "Technician", manager: "Sunil Sharma", shift: "2nd Shift", initials: "AS", mark: "A" },
  { id: "EMP1007", name: "Varun Iyer",    role: "Technician", manager: "Sunil Sharma", shift: "3rd Shift", initials: "VI", mark: "A" },
  { id: "EMP1008", name: "Deepika Nair",  role: "Technician", manager: "Sunil Sharma", shift: "3rd Shift", initials: "DN", mark: "A" },
];

export const REGULARISATION_TYPES = [
  { value: "Forgot Punch",  label: "Forgot Punch" },
  { value: "Wrong Punch",   label: "Wrong Punch" },
  { value: "System Error",  label: "System Error" },
  { value: "Missed Punch",  label: "Missed Punch" },
];

// ─── Analytics chart (per-week averages) ────────────────────────────────
export const ANALYTICS_WEEKS = [
  { week: "Week 1", present: 30, absent: 1, leave: 1, dutyRest: 1, onDuty: 2 },
  { week: "Week 2", present: 40, absent: 1, leave: 1, dutyRest: 1, onDuty: 2 },
  { week: "Week 3", present: 40, absent: 1, leave: 1, dutyRest: 1, onDuty: 2 },
  { week: "Week 4", present: 40, absent: 1, leave: 1, dutyRest: 1, onDuty: 2 },
  { week: "Week 5", present: 20, absent: 1, leave: 1, dutyRest: 1, onDuty: 2 },
];
export const ANALYTICS_SUMMARY = {
  totalEmployees: 10, avgPresent: 17, avgAbsent: 1, avgLeave: 1, avgDutyRest: 1, avgAttendance: 77,
};

// ─── Employee Attendance Details table ──────────────────────────────────
export const ATTENDANCE_DETAILS_RANGE = { from: "2026-06-24", to: "2026-07-23" };

export const INITIAL_ATTENDANCE_DETAILS = [
  { id: "EMP1010", name: "Vijay Anand",     initials: "VA", present: 17, absent: 1, leave: 1, dutyRest: 1, onDuty: 2, pct: 77, progress: 22 },
  { id: "EMP1009", name: "Sanjay Iyer",     initials: "SI", present: 17, absent: 1, leave: 1, dutyRest: 1, onDuty: 2, pct: 77, progress: 22 },
  { id: "EMP1008", name: "Ramesh Kumar",    initials: "RK", present: 17, absent: 1, leave: 1, dutyRest: 1, onDuty: 2, pct: 77, progress: 22 },
  { id: "EMP1007", name: "Karthik Menon",   initials: "KM", present: 17, absent: 1, leave: 1, dutyRest: 1, onDuty: 2, pct: 77, progress: 22 },
  { id: "EMP1006", name: "Manoj Kumar",     initials: "MK", present: 17, absent: 1, leave: 1, dutyRest: 1, onDuty: 2, pct: 77, progress: 22 },
  { id: "EMP1005", name: "Kiran Sundaram",  initials: "KS", present: 17, absent: 1, leave: 1, dutyRest: 1, onDuty: 2, pct: 77, progress: 22 },
  { id: "EMP1004", name: "John Mathew",     initials: "JM", present: 17, absent: 1, leave: 1, dutyRest: 1, onDuty: 2, pct: 77, progress: 22 },
  { id: "EMP1003", name: "Dinesh Krishnan", initials: "DK", present: 17, absent: 1, leave: 1, dutyRest: 1, onDuty: 2, pct: 77, progress: 22 },
  { id: "EMP1002", name: "Bala Murugan",    initials: "BM", present: 17, absent: 1, leave: 1, dutyRest: 1, onDuty: 2, pct: 77, progress: 22 },
  { id: "EMP1001", name: "Arjun Rajan",     initials: "AR", present: 17, absent: 1, leave: 1, dutyRest: 1, onDuty: 2, pct: 77, progress: 22 },
];

/** Small deterministic palette for avatar initials so the same name
 *  always renders with the same color. */
const AVATAR_COLORS = [
  "bg-brand-100 text-brand-700",
  "bg-red-100 text-red-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-violet-100 text-violet-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
  "bg-orange-100 text-orange-700",
];
export function avatarColor(seed) {
  const h = String(seed).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}