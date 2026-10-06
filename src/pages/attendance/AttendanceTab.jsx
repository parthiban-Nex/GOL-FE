import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import clsx from "clsx";
import { Users, ArrowUpDown, Download, X, Clock, Image as ImageIcon,} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import AttendanceAnalyticsChart from "@/components/attendance/AttendanceAnalyticsChart";
import { env } from "@/config/env";
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
import { attendanceApi } from "@/services/api/attendanceApi";
import { showToast } from "@/utils/toast";

export default function AttendanceTab() {
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <div className="space-y-4">
      <RegularisationCard onAttendanceUpdated={triggerRefresh} />
      <MarkAttendanceCard onAttendanceUpdated={triggerRefresh} refreshKey={refreshKey} />
      <AttendanceAnalyticsChart refreshKey={refreshKey} />
      <AttendanceDetailsCard refreshKey={refreshKey} />
    </div>
  );
}


function RegularisationCard({ onAttendanceUpdated }) {
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [type, setType] = useState("Forgot Punch");
  const [reason, setReason] = useState("");
  const [pendingCount, setPendingCount] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [subordinates, setSubordinates] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [previewModalImg, setPreviewModalImg] = useState(null);

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      showToast.error("Only PNG and JPG/JPEG images are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast.error("Image file size must be less than 5MB.");
      e.target.value = "";
      return;
    }

    setAttachment(file);
    const objectUrl = URL.createObjectURL(file);
    setAttachmentPreview(objectUrl);
    showToast.success(`Attached "${file.name}"`);
  };

  const handleRemoveAttachment = () => {
    if (attachmentPreview) {
      URL.revokeObjectURL(attachmentPreview);
    }
    setAttachment(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const fetchSubordinates = useCallback(async () => {
    try {
      setLoadingEmployees(true);
      let emps = [];
      try {
        const res = await attendanceApi.getEmployees();
        if (res && res.requestSuccessful && Array.isArray(res.data) && res.data.length > 0) {
          emps = res.data;
        }
      } catch (e) {
        console.warn("attendanceApi.getEmployees error:", e);
      }

      setSubordinates(emps);
      if (!selectedEmpId && emps[0]) {
        setSelectedEmpId(emps[0].id || emps[0].employeeCode);
      }
    } catch (err) {
      console.error("Failed to load subordinates:", err);
    } finally {
      setLoadingEmployees(false);
    }
  }, [selectedEmpId]);

  useEffect(() => {
    fetchSubordinates();
  }, [fetchSubordinates]);

  const subordinateOptions = useMemo(() => {
    return subordinates.map((emp) => {
      const id = emp.id || emp.employeeCode;
      const roleStr = emp.role ? ` · ${emp.role}` : "";
      return {
        value: id,
        label: `${emp.name} (${id})${roleStr}`,
      };
    });
  }, [subordinates]);

  const handleSubmit = async () => {
    if (!selectedEmpId) return showToast.warning("Please select an employee to regularize.");
    if (!reason.trim()) return showToast.warning("Enter a reason.");

    const selectedEmp = subordinates.find(
      (e) => e.id === selectedEmpId || e.employeeId === selectedEmpId,
    ) || subordinates[0];

    try {
      setSubmitting(true);
      const regDate = date || new Date().toISOString().split("T")[0];

      let res;
      if (attachment) {
        const formData = new FormData();
        formData.append("employeeId", selectedEmp.id || selectedEmp.employeeCode);
        formData.append("employeeName", selectedEmp.name || "");
        formData.append("employeeRole", selectedEmp.role || "Technician");
        if (selectedEmp.outletId) formData.append("outletId", selectedEmp.outletId);
        formData.append("date", regDate);
        formData.append("type", type);
        formData.append("reason", reason.trim());
        formData.append("attachment", attachment);
        res = await attendanceApi.submitRegularisation(formData);
      } else {
        const payload = {
          employeeId: selectedEmp.id || selectedEmp.employeeCode,
          employeeName: selectedEmp.name || "",
          employeeRole: selectedEmp.role || "Technician",
          outletId: selectedEmp.outletId || null,
          date: regDate,
          type,
          reason: reason.trim(),
        };
        res = await attendanceApi.submitRegularisation(payload);
      }

      if (res && res.requestSuccessful) {
        showToast.success(`Regularisation submitted for ${selectedEmp.name}.`);
        setReason("");
        handleRemoveAttachment();
        if (onAttendanceUpdated) onAttendanceUpdated(regDate);
      } else {
        showToast.error(res?.message || "Failed to submit regularisation.");
      }
    } catch (err) {
      console.error("Regularisation submit error:", err);
      showToast.error(err?.response?.data?.message || "Error submitting regularisation.");
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-brand-600" />
          <h3 className="text-base font-semibold text-ink-800">Regularisation</h3>
          {/* <span
            className="inline-flex items-center gap-1 rounded-md bg-accent-50 px-2 py-0.5 text-[11px] font-semibold text-accent-700 hover:bg-accent-100 transition-colors"
            title="Click to view and review requests"
          >
            {pendingCount} pending
          </span> */}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.5fr_1fr_1fr_2fr_auto_auto] sm:items-end">
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-700">
            Employee
          </label>
          <Select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            options={subordinateOptions}
            placeholder={loadingEmployees ? "Loading subordinates..." : "Select employee..."}
          />
        </div>

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
          placeholder="Enter reason for regularization..."
        />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/jpg"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* <Button
          variant={attachment ? "primary" : "secondary"}
          icon={attachment ? Check : Upload}
          type="button"
          onClick={handleAttachClick}
          className={clsx(
            attachment && "bg-emerald-600 hover:bg-emerald-700 text-white",
          )}
          title={attachment ? `Attached: ${attachment.name}` : "Attach proof image (PNG/JPG)"}
        >
          {attachment ? "Attached" : "Attach"}
        </Button> */}

        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Submitting..." : "Submit"}
        </Button>
      </div>

      {attachment && (
        <div className="mt-3 flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/70 p-2 text-xs">
          {attachmentPreview && (
            <img
              src={attachmentPreview}
              alt="Proof preview"
              className="h-9 w-9 rounded object-cover border border-emerald-300 shadow-xs cursor-pointer"
              onClick={() => setPreviewModalImg(attachmentPreview)}
            />
          )}
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-emerald-950 truncate block">
              {attachment.name}
            </span>
            <span className="text-[11px] text-emerald-700">
              {(attachment.size / 1024).toFixed(1)} KB · Image attached
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemoveAttachment}
            className="rounded p-1 text-emerald-700 hover:bg-emerald-100 hover:text-red-600 transition-colors cursor-pointer"
            title="Remove attachment"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}


      {previewModalImg && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          onClick={() => setPreviewModalImg(null)}
        >
          <div
            className="relative max-w-2xl max-h-[85vh] overflow-hidden rounded-xl bg-white p-4 shadow-2xl border border-ink-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-ink-100 pb-2 mb-3">
              <span className="text-xs font-semibold text-ink-700">
                Attachment Preview
              </span>
              <div className="flex items-center gap-3">
                <a
                  href={previewModalImg}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-brand-600 hover:underline font-medium"
                >
                  Open Original
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewModalImg(null)}
                  className="rounded p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-700 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <img
              src={previewModalImg}
              alt="Attachment Proof"
              className="max-h-[70vh] w-auto max-w-full rounded object-contain mx-auto shadow-xs"
            />
          </div>
        </div>
      )}
    </Card>
  );
}


function MarkAttendanceCard({ onAttendanceUpdated, refreshKey }) {
  const selectedDate = useMemo(() => new Date().toISOString().split("T")[0], []);
  const [shiftFilter, setShiftFilter] = useState("All Shifts");
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reused Modal state for OD/DR remarks
  const [modalOpen, setModalOpen] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  const [activeStatusKey, setActiveStatusKey] = useState("OD");
  const [remarksText, setRemarksText] = useState("");

  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString("en-IN", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }, []);

  const fetchTodayList = useCallback(async () => {
    try {
      setLoading(true);
      const res = await attendanceApi.getTodayMarkList({
        date: selectedDate,
        shift: shiftFilter === "All Shifts" ? undefined : shiftFilter,
      });
      if (res && res.requestSuccessful) {
        const data = Array.isArray(res.data) ? res.data : [];
        setRows(
          data.map((item) => {
            const hasExistingStatus = Boolean(item.status);
            return {
              ...item,
              isFrozen: hasExistingStatus,
              mark: hasExistingStatus ? (item.mark || item.status) : "",
              notes: item.notes || "",
              isDirty: false,
            };
          }),
        );
      }
    } catch (err) {
      console.error("Failed to fetch mark attendance list:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, shiftFilter]);

  useEffect(() => {
    fetchTodayList();
  }, [fetchTodayList, refreshKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = rows;
    if (shiftFilter !== "All Shifts") {
      out = out.filter((r) => r.shift === shiftFilter);
    }
    if (q) {
      out = out.filter(
        (r) =>
          (r.name && r.name.toLowerCase().includes(q)) ||
          (r.id && r.id.toLowerCase().includes(q)),
      );
    }
    return out;
  }, [rows, query, shiftFilter]);

  const modifiedRecords = useMemo(() => {
    return rows.filter((r) => !r.isFrozen && r.isDirty && r.mark);
  }, [rows]);

  function handleMarkClick(row, key) {
    if (row.isFrozen) return;

    if (key === "OD" || key === "DR") {
      setActiveRow(row);
      setActiveStatusKey(key);
      setRemarksText(row.notes || "");
      setModalOpen(true);
      return;
    }

    setRows((cur) =>
      cur.map((r) => {
        if (r.id === row.id || r.employeeId === row.id) {
          const nextMark = r.mark === key ? "" : key;
          return { ...r, mark: nextMark, isDirty: true };
        }
        return r;
      }),
    );
  }

  function handleConfirmRemarks() {
    if (!activeRow) return;
    setRows((cur) =>
      cur.map((r) => {
        if (r.id === activeRow.id || r.employeeId === activeRow.id) {
          return {
            ...r,
            mark: activeStatusKey,
            notes: remarksText.trim(),
            isDirty: true,
          };
        }
        return r;
      }),
    );
    setModalOpen(false);
  }

  function updateRowShift(empId, shiftValue) {
    setRows((cur) =>
      cur.map((r) =>
        (r.id === empId || r.employeeId === empId) && !r.isFrozen
          ? { ...r, shift: shiftValue, isDirty: true }
          : r,
      ),
    );
  }

  async function saveAll() {
    if (modifiedRecords.length === 0) {
      showToast.warning("No new attendance marks to save.");
      return;
    }

    try {
      setSaving(true);
      // Only send modified records
      const payloadRecords = modifiedRecords.map((r) => ({
        id: r.id,
        employeeId: r.employeeId || r.id,
        name: r.name,
        role: r.role,
        shift: r.shift,
        manager: r.manager,
        outletId: r.outletId,
        mark: r.mark,
        notes: r.notes || "",
      }));

      const res = await attendanceApi.saveMarks({
        date: selectedDate,
        records: payloadRecords,
      });

      if (res && res.requestSuccessful) {
        showToast.success(
          `Attendance marks saved successfully for ${payloadRecords.length} employees.`,
        );
        fetchTodayList();
        if (onAttendanceUpdated) onAttendanceUpdated();
      } else {
        showToast.error(res?.message || "Failed to save attendance marks.");
      }
    } catch (err) {
      console.error("Save marks error:", err);
      showToast.error("Failed to save attendance marks.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Card padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-brand-600" />
              <h3 className="text-base font-semibold text-ink-800">
                Mark Attendance
              </h3>
              <span className="text-xs text-ink-500">
                ({todayFormatted}) · {rows.length} employees
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or ID..."
              className="h-8 w-44 text-xs"
            />

            <Button size="md" onClick={saveAll} disabled={saving || loading || modifiedRecords.length === 0}>
              {saving ? "Saving..." : "Save All"}
            </Button>
          </div>
        </div>

        <div className={clsx("overflow-x-auto border-t border-ink-100", loading && "opacity-60")}>
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Manager</th>
                <th className="px-4 py-3">Shift Timing</th>
                <th className="px-4 py-3">Mark</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-ink-500">
                    Loading employees...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-ink-400">
                    No employees found for this outlet and date.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr
                    key={r.id || r.employeeId}
                    className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={clsx(
                            "flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold",
                            avatarColor(r.name),
                          )}
                        >
                          {r.initials || "EM"}
                        </span>
                        <div>
                          <p className="font-semibold text-ink-800">{r.name}</p>
                          <p className="text-xs text-ink-500">{r.id || r.employeeId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-700">{r.role || "Technician"}</td>
                    <td className="px-4 py-3 text-ink-700">{r.manager || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="w-32">
                        <Select
                          value={r.shift || "1st Shift"}
                          onChange={(e) => updateRowShift(r.id, e.target.value)}
                          options={SHIFT_OPTIONS}
                          disabled={r.isFrozen}
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
                              disabled={r.isFrozen}
                              onClick={() => handleMarkClick(r, k)}
                              className={clsx(
                                "flex h-7 w-8 items-center justify-center rounded text-[10px] font-bold transition-all",
                                r.isFrozen
                                  ? active
                                    ? `${s.bg} ${s.text} ring-1 ring-inset ring-current cursor-not-allowed opacity-80`
                                    : "bg-ink-100 text-ink-400 cursor-not-allowed opacity-50"
                                  : active
                                  ? `${s.bg} ${s.text} ring-1 ring-inset ring-current cursor-pointer`
                                  : "bg-ink-100 text-ink-500 hover:bg-ink-200 cursor-pointer",
                              )}
                              aria-label={`Mark ${s.label}`}
                              title={r.isFrozen ? `${s.label} (Already saved)` : `Click to mark as ${s.label}`}
                            >
                              {s.letter}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {r.mark ? (
                        <div className="flex flex-col items-start gap-1">
                          <span
                            className={clsx(
                              "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium",
                              STATUS_BY_KEY[r.mark]?.bg || "bg-emerald-100",
                              STATUS_BY_KEY[r.mark]?.text || "text-emerald-700",
                              "border-transparent",
                            )}
                          >
                            <span
                              className={clsx(
                                "h-1.5 w-1.5 rounded-full",
                                STATUS_BY_KEY[r.mark]?.dot || "bg-emerald-500",
                              )}
                            />
                            {STATUS_BY_KEY[r.mark]?.label || r.mark}
                          </span>
                          {(r.mark === "OD" || r.mark === "DR") && r.notes && (
                            <span
                              className="text-[11px] text-ink-600 max-w-[200px] truncate"
                              title={r.notes}
                            >
                              Reason: {r.notes}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-ink-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Remarks for ${activeStatusKey === "OD" ? "On Duty (OD)" : "Duty Rest (DR)"}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmRemarks}>
              Confirm
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-ink-600">
            Employee: <span className="font-semibold text-ink-800">{activeRow?.name}</span> ({activeRow?.id || activeRow?.employeeId})
          </p>
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-700">
              Remarks / Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={remarksText}
              onChange={(e) => setRemarksText(e.target.value)}
              placeholder="Enter remarks..."
              className="w-full rounded-md border border-ink-200 p-2 text-xs text-ink-800 placeholder-ink-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

function AttendanceDetailsCard({ refreshKey }) {
  const [rows, setRows] = useState([]);
  const [range, setRange] = useState(ATTENDANCE_DETAILS_RANGE);
  const [fromDate, setFromDate] = useState(() => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split("T")[0];
});
const [toDate, setToDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await attendanceApi.exportDetails({
        from: fromDate,
        to: toDate,
        search: query.trim() || undefined,
      });

      if (!res) {
        showToast.error("Failed to generate attendance details export.");
        return;
      }

      if (res.type === "application/json") {
        const text = await res.text();
        const json = JSON.parse(text);
        showToast.error(json.message || "Export failed.");
        return;
      }

      const blob = new Blob([res], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Attendance_Details_${fromDate}_to_${toDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast.success("Attendance details exported to Excel successfully.");
    } catch (err) {
      console.error("Export attendance details error:", err);
      showToast.error(err.message || "Failed to download attendance details Excel.");
    } finally {
      setExporting(false);
    }
  };

  const fetchDetails = useCallback(async (from, to) => {
    try {
      setLoading(true);
      const res = await attendanceApi.getDetailsTable({
        from: from || fromDate,
        to: to || toDate,
      });
      if (res && res.requestSuccessful) {
        setRows(Array.isArray(res.data) ? res.data : []);
        if (res.range) setRange(res.range);
      }
    } catch (err) {
      console.error("Failed to load attendance details table:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchDetails(fromDate, toDate);
  }, [fetchDetails, fromDate, toDate, refreshKey]);

  const handleApplyPreset = (days) => {
    const today = new Date();
    const toStr = today.toISOString().split("T")[0];
    const past = new Date(today);
    past.setDate(today.getDate() - days);
    const fromStr = past.toISOString().split("T")[0];

    setFromDate(fromStr);
    setToDate(toStr);
  };

  const handleThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    const today = now.toISOString().split("T")[0];
    setFromDate(firstDay);
    setToDate(today);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let out = q
      ? rows.filter(
        (r) =>
          (r.name && r.name.toLowerCase().includes(q)) ||
          (r.id && r.id.toLowerCase().includes(q)),
      )
      : rows;
    if (sortKey) {
      const dir = sortDir === "asc" ? 1 : -1;
      out = [...out].sort((a, b) => ((a[sortKey] || 0) - (b[sortKey] || 0)) * dir);
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
      present: acc.present + (r.present || 0),
      absent: acc.absent + (r.absent || 0),
      leave: acc.leave + (r.leave || 0),
      dutyRest: acc.dutyRest + (r.dutyRest || 0),
      onDuty: acc.onDuty + (r.onDuty || 0),
    }),
    { present: 0, absent: 0, leave: 0, dutyRest: 0, onDuty: 0 },
  );

  const avgPct = Math.round(
    filtered.reduce((s, r) => s + (r.pct || 0), 0) / (filtered.length || 1),
  );

  return (
    <Card padded={false}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-brand-600" />
            <h3 className="text-base font-semibold text-ink-800">
              Employee Attendance Details
            </h3>
          </div>

          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-7 w-29 rounded border border-ink-200 bg-white px-1 text-xs text-ink-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <span>{'->'}</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-7 w-29 rounded border border-ink-200 bg-white px-1 text-xs text-ink-800 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search employee..."
            className="h-8 w-44 text-xs"
          />
          <Button
            size="md"
            variant="secondary"
            icon={Download}
            onClick={handleExport}
            disabled={exporting || loading}
          >
            {exporting ? "Exporting..." : "Export"}
          </Button>
        </div>
      </div>

      <div className={clsx("overflow-x-auto", loading && "opacity-60")}>
        <table className="w-full min-w-[960px] text-sm">
          <thead>
            <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-[11px] font-semibold tracking-wide text-ink-500">
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
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-ink-500">
                  Loading attendance details...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-ink-400">
                  No attendance records found for the selected date range.
                </td>
              </tr>
            ) : (
              <>
                {filtered.map((r) => (
                  <tr
                    key={r.id || r.employeeId}
                    className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/30"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={clsx(
                            "flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold",
                            avatarColor(r.name),
                          )}
                        >
                          {r.initials || "EM"}
                        </span>
                        <div>
                          <p className="font-semibold text-ink-800">{r.name}</p>
                          <p className="text-xs text-ink-500">{r.id || r.employeeId}</p>
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
                            style={{ width: `${Math.min(100, r.pct)}%` }}
                          />
                        </div>
                        <span className="text-xs text-ink-500">{r.progress}d</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length > 0 && (<tr className="bg-ink-50/40">
                  <td className="px-4 py-3 font-semibold text-ink-800">
                    Total / Average ({fromDate} to {toDate})
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
                        style={{ width: `${Math.min(100, avgPct)}%` }}
                      />
                    </div>
                  </td>
                </tr>
                )}
              </>
            )}
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
        className="inline-flex items-center gap-1 hover:text-ink-700 cursor-pointer"
      >
        {label} <ArrowUpDown className="h-3 w-3" />
      </button>
    </th>
  );
}
