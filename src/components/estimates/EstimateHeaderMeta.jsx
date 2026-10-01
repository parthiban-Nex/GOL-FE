import clsx from "clsx";
import { STATUS_BADGE } from "@/pages/service/mockEstimates";
import Input from "@/components/ui/Input";

export default function EstimateHeaderMeta({ estimate, idAsInput = false }) {
  const c = estimate.customer ?? {};

  const fields = [
    { label: "Estimate No", value: estimate.id, wide: idAsInput },
    { label: "Reg No", value: c.regNo },
    { label: "Make", value: c.make },
    { label: "Name", value: c.name },
    { label: "Mobile No", value: c.mobile },
    { label: "Pincode", value: c.pincode },
  ];

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex flex-wrap items-start gap-x-8 gap-y-3">
        <h1 className="text-lg font-semibold text-ink-800">Estimate</h1>
        {fields.map((f) => (
          <div key={f.label} className="min-w-0">
            <p className="mb-1 text-xs text-ink-400">{f.label}</p>
            {idAsInput && f.label === "Estimate No" ? (
              <Input
                readOnly
                value={f.value ?? ""}
                className="h-9 w-44 rounded-md px-2 text-sm font-medium"
              />
            ) : (
              <p className="truncate text-sm font-semibold text-ink-800">
                {f.value || "-"}
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="min-w-0 shrink-0">
        <p className="mb-1 text-xs text-ink-400">Status</p>
        <span
          className={clsx(
            "inline-block rounded-md px-2.5 py-0.5 text-sm font-medium",
            STATUS_BADGE[estimate.status] ?? "bg-ink-100 text-ink-600",
          )}
        >
          {estimate.status}
        </span>
      </div>
    </div>
  );
}
