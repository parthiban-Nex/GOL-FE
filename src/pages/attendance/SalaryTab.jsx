import { useMemo, useState } from "react";
import clsx from "clsx";
import {
  Users,
  Wallet,
  CheckCircle2,
  Clock,
  MinusCircle,
  Plus,
  Eye,
  Pencil,
  Download,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Pagination from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import AddSalaryModal from "@/components/attendance/AddSalaryModal";
import {
  SALARY_HEADER_STATS,
  INITIAL_SALARY_LIST,
  INITIAL_PAYSLIP_BATCHES,
  MONTH_OPTIONS,
  DEPARTMENT_OPTIONS,
  DESIGNATION_OPTIONS,
  STATUS_OPTIONS,
} from "@/pages/attendance/mockSalary";
import { avatarColor } from "@/pages/attendance/mockAttendance";
import { showToast } from "@/utils/toast";
import Select from "@/components/ui/Select";

const STATUS_PILL = {
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Pending: "bg-amber-50   text-amber-700   border-amber-100",
  Deposited: "bg-emerald-50 text-emerald-700 border-emerald-100",
};

/**
 * Salary tab body. Composed of:
 *   1. 5 header stat cards
 *   2. Salary List card - filter row + paginated table with Add Salary modal
 *   3. Salary Added card - payslip batch table with Download-for-Bank
 */
export default function SalaryTab() {
  const [salaries, setSalaries] = useState(INITIAL_SALARY_LIST);
  const [batches] = useState(INITIAL_PAYSLIP_BATCHES);

  const [monthFilter, setMonthFilter] = useState("2024-05");
  const [deptFilter, setDeptFilter] = useState("");
  const [designationFilter, setDesignationFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return salaries.filter((s) => {
      if (deptFilter && s.department !== deptFilter) return false;
      if (designationFilter && s.designation !== designationFilter)
        return false;
      if (statusFilter && s.status !== statusFilter) return false;
      if (
        q &&
        !s.name.toLowerCase().includes(q) &&
        !s.id.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
  }, [salaries, deptFilter, designationFilter, statusFilter, query]);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    pageItems,
  } = usePagination(filtered);

  function handleAdd(payload) {
    // TODO: BACKEND INTEGRATION - salaryApi.addSalary(payload)
    setSalaries((cur) =>
      cur.map((s) =>
        s.id === payload.employeeId
          ? { ...s, total: payload.amount, status: "Paid" }
          : s,
      ),
    );
    setModalOpen(false);
  }

  return (
    <div className="space-y-4">
      {/* Header stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={Users}
          tone="blue"
          label="Total Employees"
          value={SALARY_HEADER_STATS.totalEmployees.value.toString()}
          subtitle={SALARY_HEADER_STATS.totalEmployees.subtitle}
        />
        <StatCard
          icon={Wallet}
          tone="emerald"
          label="This Month Payroll"
          value={`₹${SALARY_HEADER_STATS.monthPayroll.value.toLocaleString("en-IN")}`}
          subtitle={SALARY_HEADER_STATS.monthPayroll.subtitle}
        />
        <StatCard
          icon={CheckCircle2}
          tone="emerald"
          label="Paid Employees"
          value={SALARY_HEADER_STATS.paidEmployees.value.toString()}
          subtitle={SALARY_HEADER_STATS.paidEmployees.subtitle}
        />
        <StatCard
          icon={Clock}
          tone="amber"
          label="Pending Employees"
          value={SALARY_HEADER_STATS.pendingEmployees.value.toString()}
          subtitle={SALARY_HEADER_STATS.pendingEmployees.subtitle}
        />
        <StatCard
          icon={MinusCircle}
          tone="red"
          label="Total Deductions"
          value={`₹${SALARY_HEADER_STATS.totalDeductions.value.toLocaleString("en-IN")}`}
          subtitle={SALARY_HEADER_STATS.totalDeductions.subtitle}
        />
      </div>

      {/* Salary List */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-ink-800">Salary List</h2>
        <Button icon={Plus} onClick={() => setModalOpen(true)}>
          Add Salary
        </Button>
      </div>

      <Card padded={false}>
        <div className="flex  items-center gap-2 border-b border-ink-100 p-4">
          <Select
            value={monthFilter}
            onChange={(e) => {
              setMonthFilter(e.target.value);
              setPage(1);
            }}
            options={MONTH_OPTIONS}
            className="w-[100px] shrink-0"
          />

          <Select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setPage(1);
            }}
            options={DEPARTMENT_OPTIONS}
            className="w-[100px] shrink-0"
          />

          <Select
            value={designationFilter}
            onChange={(e) => {
              setDesignationFilter(e.target.value);
              setPage(1);
            }}
            options={DESIGNATION_OPTIONS}
            className="w-[100px] shrink-0"
          />

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={STATUS_OPTIONS}
            className="w-[100px] shrink-0"
          />

          <Input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by employee name or ID..."
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Emp ID</th>
                <th className="px-4 py-3">Designation</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3 text-center">Basic Salary (₹)</th>
                <th className="px-4 py-3 text-center">Total Salary (₹)</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-14 text-center text-sm text-ink-500"
                  >
                    No salary records match your filters.
                  </td>
                </tr>
              )}
              {pageItems.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-ink-100 last:border-b-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={clsx(
                          "flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold",
                          avatarColor(s.name),
                        )}
                      >
                        {s.initials}
                      </span>
                      <div>
                        <p className="font-semibold text-ink-800">{s.name}</p>
                        <p className="text-xs text-ink-500">{s.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-700">{s.id}</td>
                  <td className="px-4 py-3 text-ink-700">{s.designation}</td>
                  <td className="px-4 py-3 text-ink-700">{s.department}</td>
                  <td className="px-4 py-3 text-center font-medium text-ink-800">
                    {s.basic.toLocaleString("en-IN")}.00
                  </td>
                  <td className="px-4 py-3 text-center font-semibold text-ink-800">
                    {s.total.toLocaleString("en-IN")}.00
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={clsx(
                        "inline-block rounded-md border px-2.5 py-0.5 text-[11px] font-medium",
                        STATUS_PILL[s.status],
                      )}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-1">
                      <IconBtn
                        icon={Eye}
                        label="View"
                        hoverColor="hover:text-brand-600"
                        onClick={() => showToast.success(`Viewing ${s.id}`)}
                      />
                      <IconBtn
                        icon={Pencil}
                        label="Edit"
                        hoverColor="hover:text-blue-600"
                        onClick={() => showToast.success(`Edit ${s.id}`)}
                      />
                      <IconBtn
                        icon={Download}
                        label="Download"
                        hoverColor="hover:text-emerald-600"
                        onClick={() =>
                          showToast.success(`Downloading slip for ${s.id}`)
                        }
                      />
                    </div>
                  </td>
                </tr>
              ))}
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

      {/* Salary Added / Payslip Batches */}
      <Card padded={false}>
        <div className="p-4">
          <h3 className="text-base font-semibold text-ink-800">Salary Added</h3>
          <p className="mt-0.5 text-sm text-ink-500">
            View and download salary records that have been processed.
          </p>
        </div>
        <div className="overflow-x-auto border-t border-ink-100">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                <th className="px-4 py-3">Pay Slip ID</th>
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Date of Salary</th>
                <th className="px-4 py-3">Employees</th>
                <th className="px-4 py-3 text-right">Total Amount (₹)</th>
                <th className="px-4 py-3">Deposited By</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-ink-100 last:border-b-0"
                >
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      className="font-semibold text-brand-700 hover:text-brand-900"
                    >
                      {b.id}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-ink-700">{b.month}</td>
                  <td className="px-4 py-4 text-ink-700">
                    {formatDate(b.date)}
                  </td>
                  <td className="px-4 py-4 text-ink-800 font-medium">
                    {b.employees}
                  </td>
                  <td className="px-4 py-4 text-right font-semibold text-ink-800">
                    ₹{b.totalAmount.toLocaleString("en-IN")}.00
                  </td>
                  <td className="px-4 py-4 text-ink-700">{b.depositedBy}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          "inline-block rounded-md border px-2.5 py-0.5 text-[11px] font-medium",
                          STATUS_PILL[b.status],
                        )}
                      >
                        {b.status}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          showToast.success(`Downloading bank file for ${b.id}`)
                        }
                        className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 hover:bg-brand-100"
                      >
                        <Download className="h-3 w-3" /> Download for Bank
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end">
                      <IconBtn
                        icon={Eye}
                        label="View"
                        hoverColor="hover:text-brand-600"
                        onClick={() => showToast.success(`Viewing ${b.id}`)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-ink-100 p-4">
          <button
            type="button"
            className="text-sm font-semibold text-brand-700 hover:text-brand-900"
          >
            View all salary records →
          </button>
        </div>
      </Card>

      <AddSalaryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleAdd}
      />
    </div>
  );
}

/* ─── building blocks ─── */

function StatCard({ icon: Icon, tone, label, value, subtitle }) {
  const tones = {
    blue: "bg-brand-50 text-brand-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-accent-50 text-accent-600",
    red: "bg-red-50 text-red-600",
  }[tone];
  return (
    <Card>
      <div className="flex items-center gap-3">
        <div
          className={clsx(
            "flex h-11 w-11 items-center justify-center rounded-xl",
            tones,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
            {label}
          </p>
          <p className="mt-0.5 truncate text-lg font-bold text-ink-800">
            {value}
          </p>
          <p className="text-xs text-ink-500">{subtitle}</p>
        </div>
      </div>
    </Card>
  );
}

function IconBtn({
  icon: Icon,
  label,
  onClick,
  disabled,
  hoverColor = "hover:text-ink-700",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={clsx(
        "flex h-7 w-7 cursor-pointer items-center justify-center rounded text-ink-500 transition-colors",
        hoverColor,
        disabled && "cursor-not-allowed opacity-40",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function formatDate(iso) {
  try {
    const [y, m, d] = iso.split("-");
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]} ${y}`;
  } catch {
    return iso;
  }
}
