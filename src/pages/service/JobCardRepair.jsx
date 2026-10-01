import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MoreVertical,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  Clock,
  Pencil,
  Wrench,
  FileCheck,
  UserCog,
  Receipt,
} from "lucide-react";
import clsx from "clsx";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Dropdown from "@/components/ui/Dropdown";
import JobCardStatCard from "@/components/jobcards/JobCardStatCard";
import Pagination from "@/components/ui/Pagination";
import { useServerTable } from "@/hooks/useServerTable";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import {
  jobCardApi,
  jobCardSubstatusApi,
  employeeApi,
  serviceTypeApi,
} from "@/services";
import JobCardWizard from "@/pages/service/JobCardWizard";
import { JOBCARD_KPIS } from "@/pages/service/mockJobCards";

/**
 * Row actions in the three-dot menu. Each opens the wizard on the step
 * that does that job, so the menu is a shortcut into existing screens
 * rather than new behaviour. `needs` is the button permission required.
 */
const ROW_ACTIONS = [
  {
    key: "edit",
    label: "Edit Jobcard",
    step: "customer",
    icon: Pencil,
    needs: "canUpdate",
  },
  {
    key: "parts",
    label: "Labour & Parts",
    step: "parts",
    icon: Wrench,
    needs: "canUpdate",
  },
  {
    key: "approval",
    label: "Estimate Approval",
    step: "approval",
    icon: FileCheck,
    needs: "canUpdate",
  },
  {
    key: "technician",
    label: "Assign Technician",
    step: "technician",
    icon: UserCog,
    needs: "canUpdate",
  },
  {
    key: "bill",
    label: "View Bill",
    step: "bill",
    icon: Receipt,
    needs: "canRead",
  },
];

const SEARCH_DEBOUNCE_MS = 400;

/** status_value -> badge colour. */
const STATUS_BADGE = {
  Open: "bg-blue-50 text-blue-700",
  "Work In Progress": "bg-amber-50 text-amber-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Delivered: "bg-emerald-50 text-emerald-700",
  Closed: "bg-ink-100 text-ink-600",
  Cancelled: "bg-red-50 text-red-700",
};

const trimText = (v) => (v == null ? "" : String(v).trim());

/** listJobCards_v1 row (JobCardData.data[]) -> grid row. */
function mapJobCardRow(r) {
  const make = trimText(r.vehicle?.make?.makeName);
  const model = trimText(r.vehicle?.model?.modelName);
  return {
    id: trimText(r.job_card_no), // shown as the job card number
    jobcardId: r.id ?? null, // transaction id for the other job card APIs
    vehicleId: r.vehicle_id ?? null,
    outletId: r.outlet_id ?? null,
    documentType: trimText(r.document_type),
    jobType: trimText(r.jobType),
    status: trimText(r.status_value),
    statusCode: r.status ?? null,
    subStatus: trimText(r.sub_status),
    subStatusReason: trimText(r.sub_status_reason),
    updatedAt: r.updatedAt ?? null,
    customer: {
      name: trimText(r.customer_name),
      regNo: trimText(r.reg_no),
      make,
      model,
      chassisNo: trimText(r.vehicle?.chassisNumber),
    },
  };
}

function formatUpdatedAt(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function JobCardRepair() {
  const permissions = usePagePermissions();
  const rowActions = ROW_ACTIONS.filter((a) => permissions[a.needs]);

  // Which job card the wizard is showing, and on which step - held here
  // and passed down as props (users-style) instead of a /:id URL.
  // `row: null` means Create Jobcard.
  const [activeJobcard, setActiveJobcard] = useState(null);

  function openJobcard(row, step = "customer") {
    setActiveJobcard({ row, step });
  }

  const fetchJobCards = useCallback((body) => jobCardApi.list(body), []);
  const {
    rows: rawRows,
    totalItems,
    totalPages,
    isLoading,
    page,
    setPage,
    pageSize,
    setPageSize,
    search,
    refetch,
  } = useServerTable(fetchJobCards, jobCardApi.listKey);

  const rows = useMemo(() => rawRows.map(mapJobCardRow), [rawRows]);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [mechanic, setMechanic] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [dateRange, setDateRange] = useState("This Month");

  // Search goes to the server (searchKey) once typing pauses.
  useEffect(() => {
    const t = setTimeout(() => search(query.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query, search]);

  // GET /jobCard/getTransactionSubstatuses
  const statusOptions = useDropdownOptions(
    () => jobCardSubstatusApi.getAll(),
    (s) => ({ value: s.title, label: s.title }),
    jobCardSubstatusApi.listKey,
  );
  // POST /employee/getMechanics
  const mechanicOptions = useDropdownOptions(
    () => employeeApi.getMechanics(),
    (m) => ({
      value: String(m.id),
      label: m.employeeName ?? m.name ?? m.label ?? String(m.id),
    }),
    employeeApi.mechanicsListKey,
  );
  // POST /servicetypes/getAllServiceTypes
  const serviceTypeOptions = useDropdownOptions(
    () => serviceTypeApi.getAll(),
    (s) => ({ value: String(s.id), label: s.serviceTypeName }),
    serviceTypeApi.listKey,
  );

  // listJobCards_v1 only takes searchKey/offset/limit, so Status is
  // matched on the loaded page (against sub_status). Mechanic / Service
  // Type have no field in the list rows yet.
  const visibleRows = useMemo(
    () => (status ? rows.filter((r) => r.subStatus === status) : rows),
    [rows, status],
  );

  if (activeJobcard) {
    return (
      <JobCardWizard
        // Keyed so opening a different job card starts a fresh wizard.
        key={activeJobcard.row?.id ?? "new"}
        jobcardRow={activeJobcard.row}
        initialStep={activeJobcard.step}
        onClose={() => {
          setActiveJobcard(null);
          refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-ink-800">Jobcard</h1>
        {permissions.canCreate && (
          <Button icon={Plus} onClick={() => openJobcard(null)}>
            Create Jobcard
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {JOBCARD_KPIS.map((kpi) => (
          <JobCardStatCard
            key={kpi.key}
            value={kpi.value}
            label={kpi.label}
            icon={kpi.icon}
          />
        ))}
      </div>

      <Card className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Job Card, Customer, Reg. N..."
              icon={Search}
              className="h-11"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex lg:items-center lg:gap-2">
            <FilterSelect
              label="Status"
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
              placeholder="All Status"
              options={statusOptions}
            />
            <FilterSelect
              label="Mechanic"
              value={mechanic}
              onChange={(v) => {
                setMechanic(v);
                setPage(1);
              }}
              placeholder="All Mechanics"
              options={mechanicOptions}
            />
            <FilterSelect
              label="Service Type"
              value={serviceType}
              onChange={(v) => {
                setServiceType(v);
                setPage(1);
              }}
              placeholder="All"
              options={serviceTypeOptions}
            />
            <FilterSelect
              label="Date Range"
              value={dateRange}
              onChange={(v) => {
                setDateRange(v);
                setPage(1);
              }}
              options={[
                "Today",
                "This Week",
                "This Month",
                "Last Month",
                "Custom",
              ]}
            />
          </div>
          <Button variant="secondary" icon={Filter} className="lg:ml-2">
            More Filters
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1240px] border-collapse">
            <thead>
              <tr className="border-b border-ink-100 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                <th className="w-[140px] px-2 py-3 text-left font-semibold">
                  Job Card Details
                </th>
                <th className="w-[180px] px-2 py-3 text-left font-semibold">
                  Customer &amp; Vehicle
                </th>
                <th className="w-[150px] px-2 py-3 text-left font-semibold">
                  Estimate
                </th>
                <th className="w-[120px] px-2 py-3 text-left font-semibold">
                  Discount
                </th>
                <th className="w-[180px] px-2 py-3 text-left font-semibold">
                  Insurance / Claims
                </th>
                <th className="w-[150px] px-2 py-3 text-left font-semibold">
                  Assigned To
                </th>
                <th className="w-[100px] px-2 py-3 text-center font-semibold">
                  Progress
                </th>
                <th className="w-[190px] px-2 py-3 text-left font-semibold">
                  Delivery Timeline &amp; Status
                </th>
                <th className="w-[170px] px-2 py-3 text-left font-semibold">
                  Dates
                </th>
                <th className="w-[40px] px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-2 py-10 text-center text-sm text-ink-500"
                  >
                    Loading job cards...
                  </td>
                </tr>
              ) : visibleRows.length > 0 ? (
                visibleRows.map((row) => (
                  <JobCardRow
                    key={row.jobcardId ?? row.id}
                    row={row}
                    actions={rowActions}
                    canOpen={permissions.canUpdate || permissions.canRead}
                    onAction={(step) => openJobcard(row, step)}
                  />
                ))
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="px-2 py-10 text-center text-sm text-ink-500"
                  >
                    No job cards match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      </Card>
    </div>
  );
}

function FilterSelect({ label, value, onChange, placeholder, options }) {
  return (
    <div className="relative">
      <label className="absolute -top-1.5 left-3 z-10 bg-white px-1 text-[10px] font-medium text-ink-400">
        {label}
      </label>
      <Select
        className="h-10 sm:min-w-[140px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        options={[
          ...(placeholder ? [{ value: "", label: placeholder }] : []),
          ...options.map((o) =>
            typeof o === "string" ? { value: o, label: o } : o,
          ),
        ]}
      />
    </div>
  );
}

const Dash = () => <span className="text-sm text-ink-400">-</span>;

function JobCardRow({ row, actions, canOpen, onAction }) {
  const subtitle = [row.documentType, row.jobType].filter(Boolean).join(" · ");
  const makeModel = [row.customer.make, row.customer.model]
    .filter(Boolean)
    .join(" ");

  return (
    <tr className="border-b border-ink-100 align-top last:border-b-0 hover:bg-ink-50/40">
      <td className="px-2 py-4">
        {row.status && (
          <span
            className={clsx(
              "mb-1.5 inline-block rounded-md px-2 py-0.5 text-[11px] font-medium",
              STATUS_BADGE[row.status] ?? "bg-ink-100 text-ink-600",
            )}
          >
            {row.status}
          </span>
        )}
        {canOpen ? (
          <button
            type="button"
            onClick={() => onAction("customer")}
            className="block text-left text-sm font-semibold text-ink-800 hover:text-brand-700 cursor-pointer"
          >
            {row.id || "-"}
          </button>
        ) : (
          <p className="text-sm font-semibold text-ink-800">{row.id || "-"}</p>
        )}
        {subtitle && <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>}
      </td>

      <td className="min-w-0 px-2 py-4">
        <p className="truncate text-sm font-semibold text-ink-800">
          {row.customer.name || "-"}
        </p>
        <p className="mt-0.5 truncate text-xs text-ink-500">
          {row.customer.regNo}
        </p>
        <p className="truncate text-xs text-ink-500">{makeModel}</p>
      </td>

      {/* Estimate / Discount / Insurance / Assigned To / Progress are not
          in listJobCards_v1 yet. */}
      <td className="px-2 py-4">
        <Dash />
      </td>
      <td className="px-2 py-4">
        <Dash />
      </td>
      <td className="px-2 py-4">
        <p className="flex items-center gap-1 text-sm text-ink-400">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> -
        </p>
      </td>
      <td className="px-2 py-4">
        <Dash />
      </td>
      <td className="px-2 py-4 text-center">
        <Dash />
      </td>

      <td className="min-w-0 px-2 py-4">
        {row.subStatus ? (
          <span className="mb-1 inline-block rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
            {row.subStatus}
          </span>
        ) : (
          <Dash />
        )}
        {row.subStatusReason && (
          <p className="truncate text-sm text-ink-700">{row.subStatusReason}</p>
        )}
      </td>

      <td className="px-2 py-4">
        <p className="flex items-center gap-1 text-xs text-ink-500">
          <Clock className="h-3 w-3" /> Updated:{" "}
          {formatUpdatedAt(row.updatedAt)}
        </p>
      </td>

      <td className="px-2 py-4">
        {/* The whole menu is hidden when the role holds none of the
            actions, rather than opening an empty popover. */}
        {actions.length > 0 && (
          <div className="flex justify-end">
            <Dropdown
              trigger={
                <button
                  type="button"
                  className="rounded-md p-1 text-ink-400 cursor-pointer hover:bg-ink-100 hover:text-ink-600"
                  aria-label={`Actions for ${row.id}`}
                  aria-haspopup="menu"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              }
            >
              {actions.map((action) => (
                <Dropdown.Item
                  key={action.key}
                  icon={action.icon}
                  onClick={() => onAction(action.step)}
                  className="cursor-pointer text-ink-700"
                >
                  {action.label}
                </Dropdown.Item>
              ))}
            </Dropdown>
          </div>
        )}
      </td>
    </tr>
  );
}
