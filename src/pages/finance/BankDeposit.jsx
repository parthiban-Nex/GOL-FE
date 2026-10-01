import { useMemo, useState } from "react";
import clsx from "clsx";
import {
  Plus,
  Calendar,
  CalendarCheck,
  CalendarDays,
  Clock,
  Search,
  Eye,
  Pencil,
  Printer,
  Trash2,
} from "lucide-react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Pagination from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import NewBankDepositDrawer from "@/components/finance/NewBankDepositDrawer";
import {
  INITIAL_DEPOSITS,
  BANK_DEPOSIT_STATS,
  BANK_ACCOUNT_OPTIONS,
  DEPOSIT_MODE_OPTIONS,
  DEPOSIT_STATUS_OPTIONS,
} from "@/pages/finance/mockBankDeposit";
import { showToast } from "@/utils/toast";

const STATUS_PILL = {
  Deposited: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Pending: "bg-amber-50  text-amber-700  border-amber-100",
};

export default function BankDeposit() {
  const [deposits, setDeposits] = useState(INITIAL_DEPOSITS);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [bankFilter, setBankFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [query, setQuery] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return deposits.filter((d) => {
      if (fromDate && d.date < fromDate) return false;
      if (toDate && d.date > toDate) return false;

      if (
        bankFilter &&
        !d.bankAccount.name
          .toLowerCase()
          .includes(bankFilter.split("·")[0].trim().toLowerCase())
      ) {
        return false;
      }

      if (modeFilter && d.depositMode !== modeFilter) return false;
      if (statusFilter && d.status !== statusFilter) return false;

      if (
        q &&
        ![d.id, d.reference, d.notes, d.depositedBy].some((f) =>
          (f ?? "").toLowerCase().includes(q),
        )
      ) {
        return false;
      }

      return true;
    });
  }, [deposits, fromDate, toDate, bankFilter, modeFilter, statusFilter, query]);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    pageItems,
  } = usePagination(filtered);

  function handleSubmit(payload) {
    if (editing) {
      setDeposits((cur) =>
        cur.map((d) => (d.id === editing.id ? { ...d, ...payload } : d)),
      );
    } else {
      const id = `BD-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${String(deposits.length + 1).padStart(3, "0")}`;
      setDeposits((cur) => [
        {
          id,
          date: payload.dateTime.slice(0, 10),
          time: payload.dateTime.slice(11, 16),
          bankAccount: BANK_ACCOUNT_OPTIONS.find(
            (b) => b.value === payload.bankAccount,
          )?.label.split(" · ")[0]
            ? {
                name: BANK_ACCOUNT_OPTIONS.find(
                  (b) => b.value === payload.bankAccount,
                ).label.split(" · ")[0],
                acNo: "—",
              }
            : { name: "—", acNo: "—" },
          depositMode: payload.depositMode,
          reference: payload.reference,
          amount: payload.amount,
          depositedBy: "You",
          status: "Deposited",
          notes: payload.notes,
        },
        ...cur,
      ]);
    }
    setDrawerOpen(false);
    setEditing(null);
  }

  function handleDelete(id) {
    setDeposits((cur) => cur.filter((d) => d.id !== id));
    showToast.success(`Deposit ${id} removed.`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink-800">Bank Deposit</h1>
        <Button
          icon={Plus}
          onClick={() => {
            setEditing(null);
            setDrawerOpen(true);
          }}
        >
          New Bank Deposit
        </Button>
      </div>

      {/* 4 header stat cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Calendar}
          tone="blue"
          label="Today's Deposit"
          amount={BANK_DEPOSIT_STATS.today.amount}
          count={BANK_DEPOSIT_STATS.today.count}
        />
        <StatCard
          icon={CalendarCheck}
          tone="emerald"
          label="This Week"
          amount={BANK_DEPOSIT_STATS.week.amount}
          count={BANK_DEPOSIT_STATS.week.count}
        />
        <StatCard
          icon={CalendarDays}
          tone="amber"
          label="This Month"
          amount={BANK_DEPOSIT_STATS.month.amount}
          count={BANK_DEPOSIT_STATS.month.count}
        />
        <StatCard
          icon={Clock}
          tone="violet"
          label="Pending Deposit"
          amount={BANK_DEPOSIT_STATS.pending.amount}
          count={BANK_DEPOSIT_STATS.pending.count}
        />
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_1.4fr_1fr_1fr_1.6fr]">
          <FilterField label="Date Range">
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
                aria-label="From Date"
              />
              <span className="text-sm text-ink-400">to</span>
              <Input
                type="date"
                value={toDate}
                min={fromDate || undefined}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
                aria-label="To Date"
              />
            </div>
          </FilterField>
          <FilterField label="Bank Account">
            <Select
              value={bankFilter}
              onChange={(e) => {
                setBankFilter(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "", label: "All Accounts" },
                ...BANK_ACCOUNT_OPTIONS.map((o) => ({
                  value: o.label,
                  label: o.label,
                })),
              ]}
            />
          </FilterField>
          <FilterField label="Deposit Mode">
            <Select
              value={modeFilter}
              onChange={(e) => {
                setModeFilter(e.target.value);
                setPage(1);
              }}
              options={[{ value: "", label: "All" }, ...DEPOSIT_MODE_OPTIONS]}
            />
          </FilterField>
          <FilterField label="Status">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              options={[{ value: "", label: "All" }, ...DEPOSIT_STATUS_OPTIONS]}
            />
          </FilterField>
          <div className="self-end">
            <Input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by Deposit ID, Reference, Notes..."
              icon={Search}
              className="h-10"
            />
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                <th className="px-4 py-3">Deposit ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Bank Account</th>
                <th className="px-4 py-3">Deposit Mode</th>
                <th className="px-4 py-3">Reference No.</th>
                <th className="px-4 py-3 text-center">Amount (₹)</th>
                <th className="px-4 py-3 text-center">Deposited By</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-14 text-center text-sm text-ink-500"
                  >
                    No deposits match your filters.
                  </td>
                </tr>
              )}
              {pageItems.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/30"
                >
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing({
                          ...d,
                          dateTime: `${d.date}T${to24h(d.time)}`,
                        });
                        setDrawerOpen(true);
                      }}
                      className="cursor-pointer font-semibold text-brand-700 hover:text-brand-900"
                    >
                      {d.id}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-ink-800">
                      {formatDate(d.date)}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-500">{d.time}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-medium text-ink-800">
                      {d.bankAccount.name}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      A/c No. {d.bankAccount.acNo}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-ink-700">{d.depositMode}</td>
                  <td className="px-4 py-4 text-ink-700">{d.reference}</td>
                  <td className="px-4 py-4 text-center font-semibold text-ink-800">
                    ₹
                    {d.amount.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-4 text-ink-700 text-center">
                    {d.depositedBy}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span
                      className={clsx(
                        "inline-block rounded-md border px-2.5 py-0.5 text-[11px] font-medium",
                        STATUS_PILL[d.status],
                      )}
                    >
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center gap-1">
                      <IconAction
                        icon={Eye}
                        label="View"
                        onClick={() => showToast.success(`Viewing ${d.id}`)}
                        tone="brand"
                      />
                      <IconAction
                        icon={Pencil}
                        label="Edit"
                        tone="edit"
                        onClick={() => {
                          setEditing({
                            ...d,
                            dateTime: `${d.date}T${to24h(d.time)}`,
                          });
                          setDrawerOpen(true);
                        }}
                      />
                      <IconAction
                        icon={Printer}
                        label="Print"
                        tone="print"
                        onClick={() => showToast.success(`Printing ${d.id}`)}
                      />
                      <IconAction
                        icon={Trash2}
                        label="Delete"
                        tone="danger"
                        onClick={() => handleDelete(d.id)}
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

      <NewBankDepositDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        initial={editing}
      />
    </div>
  );
}

/* ─── building blocks ─── */

function StatCard({ icon: Icon, tone, label, amount, count }) {
  const tones = {
    blue: "bg-brand-50 text-brand-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-accent-50 text-accent-600",
    violet: "bg-violet-50 text-violet-600",
  }[tone];
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div
          className={clsx(
            "flex h-12 w-12 items-center justify-center rounded-xl",
            tones,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-ink-500">{label}</p>
          <p className="mt-0.5 text-xl font-bold text-ink-800">
            ₹{amount.toLocaleString("en-IN")}
          </p>
          <p className="mt-0.5 text-xs text-ink-500">{count} Deposits</p>
        </div>
      </div>
    </Card>
  );
}

function FilterField({ label, children }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-ink-500">{label}</p>
      {children}
    </div>
  );
}

function IconAction({ icon: Icon, label, onClick, disabled, tone }) {
  const toneCls =
    tone === "danger"
      ? "text-ink-500 hover:text-red-600"
      : tone === "brand"
        ? "text-ink-500 hover:text-brand-700"
        : tone === "edit"
          ? "text-ink-500 hover:text-blue-600"
          : tone === "print"
            ? "text-ink-500 hover:text-violet-600"
            : "text-ink-500 hover:text-ink-700";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={clsx(
        "flex h-7 w-7 cursor-pointer items-center justify-center rounded transition-colors",
        toneCls,
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

/** "10:30 AM" → "10:30" for a `datetime-local` input value. */
function to24h(display) {
  if (!display) return "00:00";
  const [time, ampm] = display.split(" ");
  const [h, m] = time.split(":").map(Number);
  const hh =
    ampm === "PM" && h < 12 ? h + 12 : ampm === "AM" && h === 12 ? 0 : h;
  return `${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
