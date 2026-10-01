import clsx from "clsx";
import ProgressRing from "@/components/jobcards/ProgressRing";
import { STATUS_BADGE } from "@/pages/service/mockJobCards";


export default function JobCardHeader({ jobcard, currentStepLabel, currentStepDetail, progress }) {
  const c = jobcard.customer ?? {};
  const isEmpty = !c.name;

  const fields = [
    { label: "Name", value: c.name },
    { label: "Mobile No", value: c.mobile },
    { label: "Reg No", value: c.regNo },
    { label: "Make", value: c.make },
    { label: "Pincode", value: c.pincode },
    { label: "Status", value: jobcard.status, badge: true },
  ];

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex flex-wrap items-start gap-x-8 gap-y-3">
        <div>
          <h1 className="text-lg font-semibold text-ink-800">Jobcard</h1>
          <span className="mt-1 inline-block rounded-md bg-brand-50 px-2 py-0.5 text-sm font-medium text-brand-700">
            {jobcard.id}
          </span>
        </div>
        {!isEmpty && fields.map((f) => (
          <div key={f.label} className="min-w-0">
            <p className="mb-1 text-xs text-ink-400">{f.label}</p>
            {f.badge ? (
              <span className={clsx("inline-block rounded-md px-2 py-0.5 text-sm font-medium", STATUS_BADGE[f.value] ?? "bg-emerald-50 text-emerald-700")}>
                {f.value || "Open"}
              </span>
            ) : (
              <p className="truncate text-sm font-semibold text-ink-800">{f.value || "-"}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 self-end lg:self-start">
        <ProgressRing value={progress} size={44} color={progress >= 80 ? "emerald" : progress >= 40 ? "amber" : "brand"} />
        <div className="text-right">
          <p className="text-sm font-semibold text-brand-700">{currentStepLabel}</p>
          <p className="text-xs text-ink-500">{currentStepDetail}</p>
        </div>
      </div>
    </div>
  );
}