import { useState } from "react";
import clsx from "clsx";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import {
  ATTENDANCE_STATUSES, STATUS_BY_KEY, MONTH_LABELS,
  ATTENDANCE_YEAR_GRID, ATTENDANCE_YEAR_SUMMARY,
  SELECTED_EMPLOYEE, avatarColor,
} from "@/pages/attendance/mockAttendance";
import { showToast } from "@/utils/toast";


export default function AttendanceGrid() {
  const [year, setYear] = useState(2025);
  const [selectedCell, setSelectedCell] = useState({ month: 4, day: 3 }); // Apr 3

  return (
    <Card padded={false}>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <div className={clsx("flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold", avatarColor(SELECTED_EMPLOYEE.name))}>
            {SELECTED_EMPLOYEE.initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-800">{SELECTED_EMPLOYEE.name}</p>
            <p className="text-xs text-ink-500">{SELECTED_EMPLOYEE.id} · {SELECTED_EMPLOYEE.department}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setYear((y) => y - 1)}
            className="flex h-8 w-8 items-center cursor-pointer justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-700" aria-label="Previous year">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-lg font-semibold text-ink-800">{year}</span>
          <button type="button" onClick={() => setYear((y) => y + 1)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-700" aria-label="Next year">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {ATTENDANCE_STATUSES.filter((s) => s.key !== "W").map((s) => (
            <LegendChip key={s.key} status={s} />
          ))}
          <LegendChip status={STATUS_BY_KEY.W} label="Weekend" />
          <Button size="sm" onClick={() => showToast.success("Downloading attendance report...")}>
            <Download className="mr-1 h-3.5 w-3.5" /> Download
          </Button>
        </div>
      </div>

      {/* Grid: months × 31 days */}
      <div className="overflow-x-auto border-y border-ink-100">
        <table className="w-full min-w-[1000px] table-fixed border-separate border-spacing-0 p-4">
          <colgroup>
            <col className="w-14" />
            {Array.from({ length: 31 }, (_, i) => <col key={i} className="w-8" />)}
          </colgroup>
          <thead>
            <tr>
              <th className="sticky left-0 bg-white px-2 py-2 text-left text-[11px] font-medium text-ink-500">Month</th>
              {Array.from({ length: 31 }, (_, i) => (
                <th key={i} className="px-1 py-2 text-center text-[10px] font-medium text-ink-500">{i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MONTH_LABELS.map((m, mi) => (
              <tr key={m}>
                <td className="sticky left-0 bg-white px-2 py-1 text-xs font-medium text-ink-600">{m}</td>
                {ATTENDANCE_YEAR_GRID[mi + 1].map((k, di) => {
                  const status = k ? STATUS_BY_KEY[k] : null;
                  const isSelected = selectedCell.month === mi + 1 && selectedCell.day === di + 1;
                  return (
                    <td key={di} className="p-0.5 text-center">
                      {k === null ? (
                        <span className="block h-6" />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedCell({ month: mi + 1, day: di + 1 })}
                          className={clsx(
                            "flex h-6 w-full items-center justify-center rounded text-[9px] font-bold",
                            status?.bg, status?.text,
                            isSelected && "ring-2 ring-accent-500 ring-offset-1"
                          )}
                          aria-label={`${m} ${di + 1}: ${status?.label}`}
                        >
                          {status?.letter}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 text-xs">
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <SummaryStat status="P"  count={ATTENDANCE_YEAR_SUMMARY.present} />
          <SummaryStat status="A"  count={ATTENDANCE_YEAR_SUMMARY.absent} />
          <SummaryStat status="L"  count={ATTENDANCE_YEAR_SUMMARY.leave} />
          <SummaryStat status="DR" count={ATTENDANCE_YEAR_SUMMARY.dutyRest} />
          <SummaryStat status="OD" count={ATTENDANCE_YEAR_SUMMARY.onDuty} />
        </div>
        <p className="text-ink-500">
          <span className="font-semibold text-ink-800">{ATTENDANCE_YEAR_SUMMARY.attendancePct}%</span> attendance ·{" "}
          <span className="font-semibold text-ink-800">{ATTENDANCE_YEAR_SUMMARY.workingDays}</span> working days
        </p>
      </div>
    </Card>
  );
}

function LegendChip({ status, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ink-600">
      <span className={clsx("h-2 w-2 rounded-full", status.dot)} />
      {label ?? status.label}
    </span>
  );
}

function SummaryStat({ status, count }) {
  const s = STATUS_BY_KEY[status];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={clsx("h-2 w-2 rounded-full", s.dot)} />
      <span className="text-ink-600">{s.label}</span>
      <span className="font-semibold text-ink-800">{count}</span>
    </span>
  );
}