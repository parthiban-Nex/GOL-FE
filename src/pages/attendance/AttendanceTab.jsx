import { useMemo, useState } from "react";
import clsx from "clsx";
import { Users, Upload, ArrowUpDown, Download } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import AttendanceGrid from "@/components/attendance/AttendanceGrid";
import AttendanceAnalyticsChart from "@/components/attendance/AttendanceAnalyticsChart";
import {
  STATUS_BY_KEY,
  MARK_STATUS_KEYS,
  INITIAL_MARK_ATTENDANCE,
  SHIFT_OPTIONS,
  REGULARISATION_TYPES,
  INITIAL_ATTENDANCE_DETAILS,
  ATTENDANCE_DETAILS_RANGE,
  avatarColor,
} from "@/pages/attendance/mockAttendance";
import { showToast } from "@/utils/toast";

export default function AttendanceTab() {
  return (
    <div className="space-y-4">
      <AttendanceGrid />
      <RegularisationCard />
      <MarkAttendanceCard />
      <AttendanceAnalyticsChart />
      <AttendanceDetailsCard />
    </div>
  );
}

/* ─── Regularisation card ─── */

function RegularisationCard() {
  const [date, setDate] = useState("");
  const [type, setType] = useState("Forgot Punch");
  const [reason, setReason] = useState("");

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-base font-semibold text-ink-800">Regularisation</h3>
        <span className="inline-block rounded-md bg-accent-50 px-2 py-0.5 text-[11px] font-semibold text-accent-700">
          1 pending
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_2fr_auto_auto] sm:items-end">
        <Input
          type="date"
          label="Date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Select
          label="Type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          options={REGULARISATION_TYPES}
        />
        <Input
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Brief reason..."
        />
        <Button variant="secondary" icon={Upload}>
          Attach
        </Button>
        <Button
          onClick={() => {
            if (!reason.trim()) return showToast.warning("Enter a reason.");
            showToast.success("Regularisation submitted.");
            setReason("");
          }}
        >
          Submit
        </Button>
      </div>
    </Card>
  );
}

/* ─── Mark Attendance card ─── */

function MarkAttendanceCard() {
  const [rows, setRows] = useState(INITIAL_MARK_ATTENDANCE);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) => r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q),
    );
  }, [rows, query]);

  function updateRow(i, field, value) {
    setRows((cur) =>
      cur.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)),
    );
  }

  function saveAll() {
    // TODO: BACKEND INTEGRATION - attendanceApi.saveMarks(rows)
    showToast.success(
      `Marked attendance for ${rows.filter((r) => r.mark).length} employees.`,
    );
  }

  return (
    <Card padded={false}>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-600" />
          <h3 className="text-base font-semibold text-ink-800">
            Mark Attendance
          </h3>
          <span className="text-xs text-ink-500">{rows.length} employees</span>
        </div>
        <div className="flex items-center gap-2">
          <div>
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
            />
          </div>
          <Button size="sm" onClick={saveAll}>
            Save All
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto border-t border-ink-100">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500">
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3 ">Role</th>
              <th className="px-4 py-3">Manager</th>
              <th className="px-4 py-3">Shift Timing</th>
              <th className="px-4 py-3">Mark</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr
                key={r.id + i}
                className="border-b border-ink-100 last:border-b-0"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={clsx(
                        "flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold",
                        avatarColor(r.name),
                      )}
                    >
                      {r.initials}
                    </span>
                    <div>
                      <p className="font-semibold text-ink-800">{r.name}</p>
                      <p className="text-xs text-ink-500">{r.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-700">{r.role}</td>
                <td className="px-4 py-3 text-ink-700">{r.manager}</td>
                <td className="px-4 py-3 ">
                  <div className="w-32">
                    <Select
                      value={r.shift}
                      onChange={(e) => updateRow(i, "shift", e.target.value)}
                      options={SHIFT_OPTIONS}
                      className="h-8 rounded-md px-2 text-xs"
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {MARK_STATUS_KEYS.map((k) => {
                      const s = STATUS_BY_KEY[k];
                      const active = r.mark === k;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => updateRow(i, "mark", k)}
                          className={clsx(
                            "flex h-7 w-8 items-center justify-center rounded text-[10px] font-bold",
                            active
                              ? `${s.bg} ${s.text}`
                              : "bg-ink-100 text-ink-500 hover:bg-ink-200",
                          )}
                          aria-label={`Mark ${s.label}`}
                        >
                          {s.letter}
                        </button>
                      );
                    })}
                  </div>
                </td>
                <td className="px-4 py-3 ">
                  {r.mark ? (
                    <span
                      className={clsx(
                        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium",
                        STATUS_BY_KEY[r.mark].bg,
                        STATUS_BY_KEY[r.mark].text,
                        "border-transparent",
                      )}
                    >
                      <span
                        className={clsx(
                          "h-1.5 w-1.5 rounded-full",
                          STATUS_BY_KEY[r.mark].dot,
                        )}
                      />
                      {STATUS_BY_KEY[r.mark].label}
                    </span>
                  ) : (
                    <span className="text-xs text-ink-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ─── Employee Attendance Details table ─── */

function AttendanceDetailsCard() {
  const [rows] = useState(INITIAL_ATTENDANCE_DETAILS);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = q
      ? rows.filter(
          (r) =>
            r.name.toLowerCase().includes(q) || r.id.toLowerCase().includes(q),
        )
      : rows;
    if (sortKey) {
      const dir = sortDir === "asc" ? 1 : -1;
      out = [...out].sort((a, b) => (a[sortKey] - b[sortKey]) * dir);
    }
    return out;
  }, [rows, query, sortKey, sortDir]);

  function toggleSort(k) {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  }

  const totals = filtered.reduce(
    (acc, r) => ({
      present: acc.present + r.present,
      absent: acc.absent + r.absent,
      leave: acc.leave + r.leave,
      dutyRest: acc.dutyRest + r.dutyRest,
      onDuty: acc.onDuty + r.onDuty,
    }),
    { present: 0, absent: 0, leave: 0, dutyRest: 0, onDuty: 0 },
  );
  const avgPct = Math.round(
    filtered.reduce((s, r) => s + r.pct, 0) / (filtered.length || 1),
  );

  return (
    <Card padded={false}>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-600" />
          <h3 className="text-base font-semibold text-ink-800">
            Employee Attendance Details
          </h3>
          <span className="text-xs text-ink-500">
            {ATTENDANCE_DETAILS_RANGE.from} → {ATTENDANCE_DETAILS_RANGE.to}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div>
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
            />
          </div>
          <Button
            size="sm"
            variant="secondary"
            icon={Download}
            onClick={() => showToast.success("Exporting CSV...")}
          >
            Export CSV
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto border-t border-ink-100">
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-[11px] font-semibold  tracking-wide text-ink-500">
              <th className="px-4 py-3">Employee</th>
              <SortableTh
                label="Present"
                onClick={() => toggleSort("present")}
              />
              <SortableTh label="Absent" onClick={() => toggleSort("absent")} />
              <SortableTh label="Leave" onClick={() => toggleSort("leave")} />
              <SortableTh
                label="Duty Rest"
                onClick={() => toggleSort("dutyRest")}
              />
              <SortableTh
                label="On Duty"
                onClick={() => toggleSort("onDuty")}
              />
              <SortableTh label="Attd %" onClick={() => toggleSort("pct")} />
              <th className="px-4 py-3">Progress</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr
                key={r.id}
                className="border-b border-ink-100 last:border-b-0"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={clsx(
                        "flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold",
                        avatarColor(r.name),
                      )}
                    >
                      {r.initials}
                    </span>
                    <div>
                      <p className="font-semibold text-ink-800">{r.name}</p>
                      <p className="text-xs text-ink-500">{r.id}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-emerald-600">
                  {r.present}
                </td>
                <td className="px-4 py-3 font-semibold text-red-600">
                  {r.absent}
                </td>
                <td className="px-4 py-3 font-semibold text-pink-600">
                  {r.leave}
                </td>
                <td className="px-4 py-3 font-semibold text-violet-600">
                  {r.dutyRest}
                </td>
                <td className="px-4 py-3 font-semibold text-brand-600">
                  {r.onDuty}
                </td>
                <td className="px-4 py-3 font-semibold text-accent-600">
                  {r.pct}%
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 max-w-[120px] overflow-hidden rounded-full bg-ink-100">
                      <div
                        className="h-full rounded-full bg-accent-500"
                        style={{ width: `${r.pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-ink-500">{r.progress}d</span>
                  </div>
                </td>
              </tr>
            ))}
            <tr className="bg-ink-50/40">
              <td className="px-4 py-3 font-semibold text-ink-800">
                Total / Average
              </td>
              <td className="px-4 py-3 font-bold text-ink-800">
                {totals.present}
              </td>
              <td className="px-4 py-3 font-bold text-ink-800">
                {totals.absent}
              </td>
              <td className="px-4 py-3 font-bold text-ink-800">
                {totals.leave}
              </td>
              <td className="px-4 py-3 font-bold text-ink-800">
                {totals.dutyRest}
              </td>
              <td className="px-4 py-3 font-bold text-ink-800">
                {totals.onDuty}
              </td>
              <td className="px-4 py-3 font-bold text-ink-800">{avgPct}%</td>
              <td className="px-4 py-3">
                <div className="h-1.5 max-w-[120px] overflow-hidden rounded-full bg-ink-100">
                  <div
                    className="h-full rounded-full bg-brand-600"
                    style={{ width: `${avgPct}%` }}
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SortableTh({ label, onClick }) {
  return (
    <th className="px-4 py-3">
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 hover:text-ink-700"
      >
        {label} <ArrowUpDown className="h-3 w-3" />
      </button>
    </th>
  );
}
