import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import {
  Trash2,
  Plus,
  MoreVertical,
  Play,
  Upload,
  MessageCircle,
  Mail,
  MessageSquare,
  Download,
} from "lucide-react";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { employeeApi, jobCardApi } from "@/services";
import { extractList, isSuccess, responseMessage } from "@/utils/apiResponse";
import { showToast } from "@/utils/toast";

const LABOUR_TYPES = ["Labour", "Body Shop", "Paint", "Detailing"];
const STATUS_OPTIONS = [
  "Work in Progress",
  "Yet to Start",
  "On Hold",
  "Completed",
];

const newTechRow = () => ({
  id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  labour: "Labour",
  stdHrs: "",
  mechanicId: "",
  mechanicName: "",
  workAllocated: "",
  startAt: "",
  endAt: "",
  mechanicHrs: "",
  reason: "",
  status: "Yet to Start",
});

/** "2026-10-01 09:30:00" / ISO -> "2026-10-01T09:30" for datetime-local. */
function toLocalDateTime(v) {
  const m = String(v ?? "").match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2})/);
  return m ? `${m[1]}T${m[2]}` : "";
}

/** getMechanicMapping row -> form row. The mapping is saved with the
 * form's own field names, so those are read first. */
function mapSavedRow(r, i) {
  return {
    ...newTechRow(),
    id: r.id != null ? `saved-${r.id}` : `saved-${i}`,
    mappingId: r.id ?? null,
    labour: r.labour ?? r.labourType ?? "Labour",
    stdHrs: r.stdHrs ?? r.std_hrs ?? "",
    mechanicId: String(r.mechanicId ?? r.mechanic_id ?? ""),
    mechanicName: r.mechanicName ?? r.mechanic_name ?? "",
    workAllocated: r.workAllocated ?? r.work_allocated ?? "",
    startAt: toLocalDateTime(r.startAt ?? r.start_date_time),
    endAt: toLocalDateTime(r.endAt ?? r.end_date_time),
    mechanicHrs: r.mechanicHrs ?? r.mechanic_hrs ?? "",
    reason: r.reason ?? "",
    status: r.status ?? "Yet to Start",
  };
}

/** Step 5 - Assign technicians + list completed works with videos. */
export default function Step5AssignTechnician({ jobcard, onChange }) {
  const transactionId = jobcard.transactionId;
  const [isLoadingMapping, setIsLoadingMapping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Latest state for async merges.
  const jobcardRef = useRef(jobcard);
  jobcardRef.current = jobcard;

  // POST /employee/getMechanics
  const mechanicOptions = useDropdownOptions(
    () => employeeApi.getMechanics(),
    (m) => ({
      value: String(m.id),
      label: m.employeeName ?? m.name ?? m.label ?? String(m.id),
    }),
    employeeApi.mechanicsListKey,
  );

  // Existing assignments: once per opened job card (not on every visit to
  // this step, so unsaved edits survive switching steps).
  useEffect(() => {
    if (jobcard.techniciansLoaded) return;
    if (!transactionId) {
      onChange({
        ...jobcardRef.current,
        technicians: jobcardRef.current.technicians?.length
          ? jobcardRef.current.technicians
          : [newTechRow()],
        techniciansLoaded: true,
      });
      return;
    }

    let cancelled = false;
    setIsLoadingMapping(true);
    jobCardApi
      .getMechanicMapping(transactionId)
      .then((response) => {
        if (cancelled) return;
        const saved = isSuccess(response)
          ? extractList(response, "JobCardData").map(mapSavedRow)
          : [];
        onChange({
          ...jobcardRef.current,
          technicians: saved.length ? saved : [newTechRow()],
          techniciansLoaded: true,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        showToast.error(err.message || "Couldn't load technician assignments.");
        onChange({
          ...jobcardRef.current,
          technicians: [newTechRow()],
          techniciansLoaded: true,
        });
      })
      .finally(() => {
        if (!cancelled) setIsLoadingMapping(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId, jobcard.techniciansLoaded]);

  const technicians = jobcard.technicians ?? [];

  function updateTech(id, field, value) {
    onChange({
      ...jobcard,
      technicians: technicians.map((t) => {
        if (t.id !== id) return t;
        if (field === "mechanicId") {
          const option = mechanicOptions.find((m) => m.value === value);
          return { ...t, mechanicId: value, mechanicName: option?.label ?? "" };
        }
        return { ...t, [field]: value };
      }),
    });
  }
  function addTech() {
    onChange({ ...jobcard, technicians: [...technicians, newTechRow()] });
  }
  function removeTech(id) {
    onChange({
      ...jobcard,
      technicians: technicians.filter((t) => t.id !== id),
    });
  }

  // POST /jobCard/createMechanicMapping - the form's fields as-is for now.
  async function handleSubmit() {
    if (isSubmitting) return;
    const rows = technicians.filter((t) => t.mechanicId);
    if (rows.length === 0) {
      showToast.error("Select a mechanic for at least one row.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await jobCardApi.createMechanicMapping({
        transaction_id: transactionId,
        // Client-only row ids aren't sent.
        mechanics: rows.map((row) =>
          Object.fromEntries(Object.entries(row).filter(([k]) => k !== "id")),
        ),
      });
      if (!isSuccess(response)) {
        showToast.error(
          responseMessage(response, "Couldn't assign technicians."),
        );
        return;
      }
      showToast.success(responseMessage(response, "Technicians assigned."));
    } catch (err) {
      showToast.error(err.message || "Couldn't assign technicians.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function updateCompletedWork(id, patch) {
    onChange({
      ...jobcard,
      completedWorks: jobcard.completedWorks.map((w) =>
        w.id === id ? { ...w, ...patch } : w,
      ),
    });
  }

  function attachVideo(id, file) {
    const url = URL.createObjectURL(file);
    // best-effort duration read for the "0:32" style badge; falls back gracefully
    const tempVideo = document.createElement("video");
    tempVideo.preload = "metadata";
    tempVideo.src = url;
    tempVideo.onloadedmetadata = () => {
      const total = Math.round(tempVideo.duration || 0);
      const mins = Math.floor(total / 60);
      const secs = String(total % 60).padStart(2, "0");
      updateCompletedWork(id, {
        videoUrl: url,
        videoLen: `${mins}:${secs}`,
        videoFile: file,
      });
    };
  }

  function removeVideo(id) {
    const work = jobcard.completedWorks.find((w) => w.id === id);
    if (work?.videoUrl) URL.revokeObjectURL(work.videoUrl);
    updateCompletedWork(id, {
      videoUrl: null,
      videoLen: null,
      videoFile: null,
    });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        {isLoadingMapping ? (
          <p className="text-sm text-ink-500">Loading assignments...</p>
        ) : (
          technicians.map((t) => (
            <TechRow
              key={t.id}
              row={t}
              mechanicOptions={mechanicOptions}
              onUpdate={updateTech}
              onRemove={removeTech}
            />
          ))
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={addTech}
            className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
          >
            <Plus className="h-4 w-4" /> Add New
          </button>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={isLoadingMapping || !transactionId}
            title={!transactionId ? "Save the job card first" : undefined}
          >
            Submit
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-ink-100 p-5">
        <h3 className="mb-4 text-base font-semibold text-ink-800">
          Completed Works
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                <th className="w-8 pb-3">#</th>
                <th className="pb-3">Work Description</th>
                <th className="pb-3">Assigned Technician</th>
                <th className="pb-3">Videos &amp; Notes</th>
                <th className="w-12 pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {jobcard.completedWorks.map((w, idx) => (
                <CompletedWorkRow
                  key={w.id}
                  idx={idx + 1}
                  work={w}
                  onAttachVideo={(file) => attachVideo(w.id, file)}
                  onRemoveVideo={() => removeVideo(w.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ShareCompletedCard />
    </div>
  );
}

function TechRow({ row, mechanicOptions, onUpdate, onRemove }) {
  return (
    <div className="grid w-full grid-cols-[repeat(9,minmax(0,1fr))_40px] items-end gap-3">
      <Select
        label="Labours"
        value={row.labour}
        onChange={(e) => onUpdate(row.id, "labour", e.target.value)}
        options={LABOUR_TYPES.map((l) => ({ value: l, label: l }))}
      />
      <Input
        label="STD Hrs"
        placeholder="e.g. 2"
        value={row.stdHrs}
        onChange={(e) => onUpdate(row.id, "stdHrs", e.target.value)}
      />
      <Select
        label="Mechanic"
        placeholder="Select mechanic"
        value={row.mechanicId}
        onChange={(e) => onUpdate(row.id, "mechanicId", e.target.value)}
        options={mechanicOptions}
      />
      <Input
        label="Work Allocated"
        value={row.workAllocated}
        onChange={(e) => onUpdate(row.id, "workAllocated", e.target.value)}
      />
      <Input
        type="datetime-local"
        label="Start Date Time"
        value={row.startAt}
        onChange={(e) => onUpdate(row.id, "startAt", e.target.value)}
      />
      <Input
        type="datetime-local"
        label="End Date Time"
        min={row.startAt || undefined}
        value={row.endAt}
        onChange={(e) => onUpdate(row.id, "endAt", e.target.value)}
      />
      <Input
        label="Mechanic Hrs"
        placeholder="2Hrs"
        value={row.mechanicHrs}
        onChange={(e) => onUpdate(row.id, "mechanicHrs", e.target.value)}
      />
      <Input
        label="Reason"
        value={row.reason}
        onChange={(e) => onUpdate(row.id, "reason", e.target.value)}
      />
      <Select
        label="Status"
        value={row.status}
        onChange={(e) => onUpdate(row.id, "status", e.target.value)}
        options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
      />
      <button
        type="button"
        onClick={() => onRemove(row.id)}
        className="mb-2.5 flex h-9 w-9 items-center justify-center text-red-500 hover:text-red-600"
        aria-label="Remove"
      >
        <Trash2 className="h-4 w-4 cursor-pointer" />
      </button>
    </div>
  );
}

function CompletedWorkRow({ idx, work, onAttachVideo, onRemoveVideo }) {
  const fileInputRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      e.target.value = "";
      return;
    }
    const MAX_SIZE = 100 * 1024 * 1024; // 100MB
    if (file.size > MAX_SIZE) {
      e.target.value = "";
      return;
    }

    onAttachVideo(file);
    e.target.value = ""; // allow re-selecting the same file later
  }

  return (
    <tr className="border-b border-ink-100 last:border-b-0">
      <td className="py-4 text-sm text-ink-500">{idx}</td>
      <td className="py-4 pr-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-ink-800">{work.description}</p>
          <span
            className={clsx(
              "rounded-md px-2 py-0.5 text-[11px] font-medium",
              work.kind === "Labour"
                ? "bg-blue-50 text-blue-700"
                : "bg-amber-50 text-amber-700",
            )}
          >
            {work.kind}
          </span>
        </div>
        <p className="mt-1 text-xs text-ink-500">
          {work.partNo && (
            <>
              Part No:{" "}
              <span className="font-medium text-ink-700">{work.partNo}</span>{" "}
              |{" "}
            </>
          )}
          Estimated Time:{" "}
          <span className="font-medium text-ink-700">{work.estTime}</span>
        </p>
      </td>
      <td className="py-4 pr-3">
        <p className="font-semibold text-ink-800">{work.technician}</p>
        <p className="text-xs text-ink-500">{work.techRole}</p>
      </td>
      <td className="py-4 pr-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileChange}
        />
        {work.videoUrl ? (
          <div className="relative inline-flex h-16 w-24 items-center justify-center overflow-hidden rounded-md bg-ink-900">
            <video
              src={work.videoUrl}
              className="h-full w-full object-cover opacity-80"
              muted
            />
            <Play className="pointer-events-none absolute h-5 w-5 text-white" />
            {work.videoLen && (
              <span className="absolute bottom-1 right-1 rounded-sm bg-ink-900 px-1 text-[10px] font-medium text-white">
                {work.videoLen}
              </span>
            )}
            <button
              type="button"
              onClick={onRemoveVideo}
              className="absolute top-1 right-1 rounded-full bg-white cursor-pointer p-0.5 text-red-500 hover:bg-white"
              aria-label="Remove video"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center cursor-pointer gap-1.5 rounded-md border border-dashed border-brand-300 bg-brand-50/50 px-3 py-2 text-xs font-medium text-brand-700 hover:bg-brand-50"
          >
            <Upload className="h-3.5 w-3.5" /> Upload Video
          </button>
        )}
      </td>
      <td className="py-4 text-right">
        <button
          type="button"
          className="rounded-md p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-600"
          aria-label="Row actions"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

function ShareCompletedCard() {
  return (
    <section className="rounded-xl border border-ink-100 p-5">
      <div className="mb-1 flex items-center gap-2 font-semibold text-ink-800">
        <Upload className="h-4 w-4" /> Share Completed Works
      </div>
      <p className="mb-3 text-xs text-ink-500">Share bill with customer via</p>
      <div className="grid gap-2 sm:grid-cols-4 lg:w-3/5">
        <ShareBtn
          icon={MessageCircle}
          label="WhatsApp"
          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        />
        <ShareBtn
          icon={Mail}
          label="Email"
          className="bg-blue-50 text-blue-700 hover:bg-blue-100"
        />
        <ShareBtn
          icon={MessageSquare}
          label="SMS"
          className="bg-amber-50 text-amber-700 hover:bg-amber-100"
        />
        <ShareBtn
          icon={Download}
          label="Download PDF"
          className="bg-white text-ink-700 border border-ink-200 hover:bg-ink-50"
        />
      </div>
    </section>
  );
}

function ShareBtn({ icon: Icon, label, className }) {
  return (
    <button
      className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${className}`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}
