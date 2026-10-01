import { Filter } from "lucide-react";
import clsx from "clsx";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { advisorApi, serviceTypeApi } from "@/services";

const VIEWS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

export default function AppointmentToolbar({
  view,
  onViewChange,
  advisor,
  onAdvisorChange,
  service,
  onServiceChange,
  onOpenFilters,
}) {
  const advisorOptions = useDropdownOptions(
    () => advisorApi.getAll(),
    (a) => ({
      value: a.id,
      label: a.employeeName,
    }),
    advisorApi.listKey,
  );

  const serviceOptions = useDropdownOptions(
    () => serviceTypeApi.getAll(),
    (s) => ({
      value: s.serviceTypeName,
      label: s.serviceTypeName,
    }),
    serviceTypeApi.listKey,
  );

  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      {/* View switcher */}
      <div className="w-full xl:w-auto">
        <div className="flex w-full rounded-lg border border-ink-200 bg-white p-1 xl:w-auto">
          {VIEWS.map((v) => (
            <button
              key={v.value}
              type="button"
              onClick={() => onViewChange(v.value)}
              aria-pressed={view === v.value}
              className={clsx(
                "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors cursor-pointer sm:min-w-[68px] sm:flex-none",
                view === v.value
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-500 hover:text-ink-700",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_auto] xl:w-auto">
        <Select
          wrapperClassName="w-full lg:w-[220px]"
          className="h-10 w-full"
          value={advisor}
          onChange={(e) => onAdvisorChange(e.target.value)}
          options={[{ value: "", label: "All Advisors" }, ...advisorOptions]}
        />

        <Select
          wrapperClassName="w-full lg:w-[220px]"
          className="h-10 w-full"
          value={service}
          onChange={(e) => onServiceChange(e.target.value)}
          options={[{ value: "", label: "All Services" }, ...serviceOptions]}
        />

        <Button
          variant="secondary"
          icon={Filter}
          onClick={onOpenFilters}
          className="w-full lg:w-auto"
        >
          Filters
        </Button>
      </div>
    </div>
  );
}
