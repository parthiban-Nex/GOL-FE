import { useSearchParams } from "react-router-dom";
import clsx from "clsx";
import AttendanceTab from "@/pages/attendance/AttendanceTab";
import SalaryTab from "@/pages/attendance/SalaryTab";

const TABS = [
  { key: "attendance", label: "Attendance" },
  { key: "salary",     label: "Salary" },
];

/**
 * Attendance & Salary page shell. The two tabs are driven by a
 * ?tab= query param so browser back / forward moves between them and
 * each tab is bookmarkable.
 *
 * The active tab pill uses brand-blue fill (matching the reference);
 * inactive tabs are muted grey pills on the same neutral background.
 */
export default function Attendance() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") === "salary" ? "salary" : "attendance";

  function switchTab(next) {
    setSearchParams(next === "attendance" ? {} : { tab: next }, { replace: false });
  }

  return (
    <div className="space-y-4">
      <div className="inline-flex gap-1 rounded-lg p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => switchTab(t.key)}
            className={clsx(
              "rounded-md px-4 cursor-pointer py-1.5 text-sm font-semibold transition-colors",
              tab === t.key ? "bg-brand-600 text-white shadow-sm" : "text-white bg-ink-300"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "attendance" ? <AttendanceTab /> : <SalaryTab />}
    </div>
  );
}