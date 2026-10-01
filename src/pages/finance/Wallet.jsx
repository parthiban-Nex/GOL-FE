import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import clsx from "clsx";
import {
  ArrowUpRight,
  Download,
  RefreshCw,
  CreditCard,
  Clock,
  CheckCircle2,
  Info,
  X,
  Check,
  Search,
  Filter,
  ArrowLeft,
  Upload,
  IndianRupee,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Pagination from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import {
  INITIAL_BALANCE,
  INITIAL_TRANSACTIONS,
  QUICK_AMOUNTS,
  PAYMENT_MODE_OPTIONS,
  INITIAL_APPROVALS,
} from "@/pages/finance/mockWallet";
import { showToast } from "@/utils/toast";

const VALID_VIEWS = new Set([
  "overview",
  "transactions",
  "pay",
  "add",
  "approvals",
]);

export default function Wallet() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get("view");
  const view = VALID_VIEWS.has(requested) ? requested : "overview";

  const [balance] = useState(INITIAL_BALANCE);
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
  const [approvals, setApprovals] = useState(INITIAL_APPROVALS);
  const pendingCount = approvals.filter((a) => a.status === "PENDING").length;

  function goTo(nextView) {
    setSearchParams(nextView === "overview" ? {} : { view: nextView }, {
      replace: false,
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {view !== "overview" && (
          <button
            type="button"
            onClick={() => goTo("overview")}
            className="flex h-8 w-8 items-center cursor-pointer justify-center rounded-full text-ink-500 hover:bg-ink-100 hover:text-ink-700"
            aria-label="Back to wallet overview"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <h1 className="text-lg font-semibold text-ink-800">Wallet</h1>
      </div>

      {view === "overview" && (
        <OverviewView
          balance={balance}
          transactions={transactions}
          pendingCount={pendingCount}
          onNavigate={goTo}
        />
      )}
      {view === "transactions" && (
        <TransactionsView transactions={transactions} />
      )}
      {view === "pay" && (
        <PayNowView
          onSuccess={(amt) => {
            setTransactions((cur) => [
              {
                id: `TXN${Math.floor(100000 + Math.random() * 900000)}`,
                date: today(),
                type: "Online",
                reference: "Ref: RZP" + Math.floor(Math.random() * 999999),
                amount: amt,
                status: "Success",
              },
              ...cur,
            ]);
            goTo("overview");
          }}
        />
      )}
      {view === "add" && <AddFundsView onSubmit={() => goTo("overview")} />}
      {view === "approvals" && (
        <ApprovalsView
          approvals={approvals}
          onApprove={(id) => {
            setApprovals((cur) =>
              cur.map((a) => (a.id === id ? { ...a, status: "APPROVED" } : a)),
            );
            showToast.success("Request approved.");
          }}
          onReject={(id) => {
            setApprovals((cur) =>
              cur.map((a) => (a.id === id ? { ...a, status: "REJECTED" } : a)),
            );
            showToast.success("Request rejected.");
          }}
        />
      )}
    </div>
  );
}

function OverviewView({ balance, transactions, pendingCount, onNavigate }) {
  const recent = transactions.slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Balance card — brand-blue gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-4 text-white shadow-card w-2/6">
        <div className="mb-2 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
              <CreditCard className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium text-brand-50">Balance</span>
          </div>
          <button
            type="button"
            onClick={() => showToast.success("Balance refreshed")}
            className="rounded-full cursor-pointer p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
            aria-label="Refresh balance"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <p className="text-4xl font-bold tracking-tight">
          ₹{balance.amount.toLocaleString("en-IN")}
        </p>

        <div className="mt-2 flex items-center gap-1.5 text-xs text-brand-100">
          <Clock className="h-3 w-3" />
          {balance.lastUpdated}
        </div>

        <div className="mt-2 flex  gap-3">
          <button
            type="button"
            onClick={() => onNavigate("pay")}
            className="inline-flex items-center justify-center w-1/2 cursor-pointer gap-2 rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-600"
          >
            <ArrowUpRight className="h-4 w-4" /> Pay Now
          </button>
          <button
            type="button"
            onClick={() => onNavigate("add")}
            className="inline-flex items-center justify-center w-1/2 cursor-pointer gap-2 rounded-lg bg-white/15 px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/25 hover:bg-white/25"
          >
            <Download className="h-4 w-4" /> Add Funds
          </button>
        </div>
      </div>

      {/* Recent Transactions preview */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-800">
            Recent Transactions
          </h2>
          <button
            type="button"
            onClick={() => onNavigate("transactions")}
            className="text-sm cursor-pointer font-semibold text-brand-700 hover:text-brand-900"
          >
            View All
          </button>
        </div>
        <TransactionsTable transactions={recent} />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-ink-800">
          Quick Actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            icon={Clock}
            iconClass="bg-brand-600 text-white"
            title="Transactions"
            subtitle="View history"
            onClick={() => onNavigate("transactions")}
          />
          <QuickActionCard
            icon={CheckCircle2}
            iconClass="bg-accent-500 text-white"
            title="Approvals"
            subtitle="Pending"
            badge={pendingCount}
            onClick={() => onNavigate("approvals")}
          />
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
  icon: Icon,
  iconClass,
  title,
  subtitle,
  badge,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex flex-col cursor-pointer items-center justify-center gap-2 rounded-xl border border-ink-100 bg-white p-2 text-center shadow-card transition-shadow hover:shadow-lg"
    >
      {badge > 0 && (
        <span className="absolute right-3 top-3 flex h-6 min-w-6 items-center justify-center rounded-full bg-accent-500 px-1.5 text-xs font-semibold text-white">
          {badge}
        </span>
      )}
      <span
        className={clsx(
          "flex h-11 w-11 items-center justify-center rounded-full",
          iconClass,
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-base font-semibold text-ink-800">{title}</p>
      <p className="text-xs text-ink-500">{subtitle}</p>
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Transactions table (shared: overview preview + full list view)
 * ──────────────────────────────────────────────────────────────────── */

function TransactionsTable({ transactions }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white shadow-card">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-xs font-medium text-ink-500">
            <th className="px-4 py-3">Transaction ID</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Reference</th>
            <th className="px-4 py-3 ">Amount</th>
            <th className="px-4 py-3 text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="px-4 py-10 text-center text-sm text-ink-500"
              >
                No transactions match your search.
              </td>
            </tr>
          )}
          {transactions.map((t) => {
            const positive = t.amount >= 0;
            return (
              <tr
                key={t.id}
                className="border-b border-ink-100 last:border-b-0"
              >
                <td className="px-4 py-4 font-semibold text-ink-800">{t.id}</td>
                <td className="px-4 py-4 text-ink-600">{t.date}</td>
                <td className="px-4 py-4 text-ink-700">{t.type}</td>
                <td className="px-4 py-4 text-ink-600">{t.reference}</td>
                <td
                  className={clsx(
                    "px-4 py-4  font-semibold",
                    positive ? "text-emerald-600" : "text-danger-500",
                  )}
                >
                  {positive ? "+" : "-"}₹
                  {Math.abs(t.amount).toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-4 text-center">
                  <StatusPill status={t.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatusPill({ status }) {
  const styles = {
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Success: "bg-emerald-50 text-emerald-700 border-emerald-100",
    Pending: "bg-amber-50 text-amber-700 border-amber-100",
    Rejected: "bg-red-50 text-red-700 border-red-100",
    Failed: "bg-red-50 text-red-700 border-red-100",
  };
  return (
    <span
      className={clsx(
        "inline-block rounded-md border px-2.5 py-0.5 text-[11px] font-medium",
        styles[status] ?? "bg-ink-100 text-ink-600 border-ink-200",
      )}
    >
      {status}
    </span>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Transactions view (Image 2) — search + filter + full table
 * ──────────────────────────────────────────────────────────────────── */
function TransactionsView({ transactions }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return transactions;
    return transactions.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.date.includes(q) ||
        t.type.toLowerCase().includes(q) ||
        (t.reference ?? "").toLowerCase().includes(q),
    );
  }, [transactions, query]);

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    pageItems,
  } = usePagination(filtered);

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="relative flex-1">
            <Input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by Garage, ID, Reference..."
              icon={Search}
              className="h-11"
            />
          </div>
          <button
            type="button"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
            aria-label="Filter"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-3 text-sm text-ink-500">
          <span className="font-semibold text-ink-700">{filtered.length}</span>{" "}
          transactions found
        </p>
      </Card>

      <Card padded={false}>
        <TransactionsTable transactions={pageItems} />
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

/* ────────────────────────────────────────────────────────────────────
 * Pay Now view (Image 3) — Razorpay-style amount picker + Pay button
 * ──────────────────────────────────────────────────────────────────── */

function PayNowView({ onSuccess }) {
  const [amount, setAmount] = useState(100);
  const gatewayCharges = 0;
  const total = Number(amount || 0) + gatewayCharges;

  function handlePay() {
    if (!amount || amount <= 0)
      return showToast.warning("Enter an amount to pay.");
    // TODO: BACKEND INTEGRATION - walletApi.initiatePayment({ amount })
    //       .then(({ orderId }) => launch Razorpay checkout)
    //       .then(walletApi.confirmPayment)
    showToast.success(`Payment of ₹${total} completed.`);
    onSuccess(total);
  }

  return (
    <div className="max-w-4xl space-y-4">
      {/* Gateway header card */}
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold text-ink-800">
              Payment Gateway
            </p>
            <p className="text-xs text-ink-500">
              Secure payment powered by Razorpay
            </p>
          </div>
        </div>
      </Card>

      {/* Amount + quick-select + summary */}
      <Card className="space-y-5">
        <Input
          label="Enter Amount"
          type="number"
          min={1}
          value={amount}
          onChange={(e) =>
            setAmount(e.target.value === "" ? "" : Number(e.target.value))
          }
          placeholder="100"
          icon={IndianRupee}
        />

        <div>
          <p className="mb-2 text-sm font-semibold text-ink-800">
            Quick Select
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {QUICK_AMOUNTS.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(v)}
                className={clsx(
                  "rounded-lg border cursor-pointer px-4 py-3 text-sm font-semibold transition-colors",
                  Number(amount) === v
                    ? "border-accent-500 bg-accent-50 text-accent-700"
                    : "border-ink-200 bg-white text-ink-800 hover:bg-ink-50",
                )}
              >
                ₹{v.toLocaleString("en-IN")}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 border-t border-dashed border-ink-200 pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-ink-600">Amount</span>
            <span className="font-semibold text-ink-800">
              ₹{Number(amount || 0).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-600">Gateway Charges</span>
            <span className="font-semibold text-ink-800">
              ₹{gatewayCharges}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-ink-100 pt-3">
            <span className="text-base font-semibold text-ink-800">
              Total Amount
            </span>
            <span className="text-xl font-bold text-brand-700">
              ₹{total.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </Card>

      <Button size="lg" icon={CreditCard} onClick={handlePay}>
        Pay ₹{total.toLocaleString("en-IN")}
      </Button>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Add Funds view (Image 4) — manual submission for admin approval
 * ──────────────────────────────────────────────────────────────────── */

function AddFundsView({ onSubmit }) {
  const [form, setForm] = useState({
    paymentMode: "",
    referenceId: "",
    paymentDate: "",
    amount: "",
    remarks: "",
  });
  const [errors, setErrors] = useState({});

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit() {
    const nextErrors = {};
    if (!form.paymentMode) nextErrors.paymentMode = "Payment mode is required";
    if (!form.referenceId) nextErrors.referenceId = "Reference ID is required";
    if (!form.paymentDate) nextErrors.paymentDate = "Payment date is required";
    if (!form.amount || Number(form.amount) <= 0)
      nextErrors.amount = "Enter a valid amount";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    // TODO: BACKEND INTEGRATION - walletApi.submitFundsRequest(form)
    showToast.success("Your request has been submitted for approval.");
    onSubmit();
  }

  return (
    <div className="max-w-3xl">
      <Card className="space-y-2">
        <Select
          label="Payment Mode "
          value={form.paymentMode}
          onChange={(e) => update("paymentMode", e.target.value)}
          options={PAYMENT_MODE_OPTIONS}
          placeholder="Select payment mode"
          error={errors.paymentMode}
          required
        />
        <Input
          label="Reference ID / Transaction ID "
          value={form.referenceId}
          onChange={(e) => update("referenceId", e.target.value)}
          placeholder="Enter reference ID"
          error={errors.referenceId}
          required
        />
        <Input
          label="Payment Date"
          required
          type="date"
          value={form.paymentDate}
          onChange={(e) => update("paymentDate", e.target.value)}
          error={errors.paymentDate}
        />
        <Input
          label="Amount Paid "
          type="number"
          min={0}
          value={form.amount}
          onChange={(e) => update("amount", e.target.value)}
          placeholder="0"
          error={errors.amount}
          prefix="₹"
          required
        />
        <div>
          <Textarea
            label="Remarks (Optional)"
            rows={3}
            value={form.remarks}
            onChange={(e) => update("remarks", e.target.value)}
            placeholder="Add any additional notes..."
          />
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-2">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            <p className="text-sm font-semibold text-blue-700">
              Important Information
            </p>
          </div>
          <ul className="ml-6 mt-2 list-disc space-y-1 text-sm text-ink-700">
            <li>Your request will be marked as "Pending Approval"</li>
            <li>Admin will verify and approve within 24-48 hours</li>
            <li>Amount will be credited after approval</li>
          </ul>
        </div>
      </Card>

      <div className="mt-2">
        <Button size="lg" icon={Upload} onClick={handleSubmit}>
          Submit for Approval
        </Button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Approvals view (Image 5) — admin/manager pending list
 * ──────────────────────────────────────────────────────────────────── */
function ApprovalsView({ approvals, onApprove, onReject }) {
  const pending = approvals.filter((a) => a.status === "PENDING");

  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    pageItems,
  } = usePagination(approvals);

  return (
    <div className="space-y-4">
      <Card className="flex items-center gap-3 max-w-sm">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Info className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-ink-500">Pending Requests</p>
          <p className="text-2xl font-bold text-ink-800">{pending.length}</p>
        </div>
      </Card>

      <h2 className="text-base font-semibold text-ink-800">
        Pending Approvals
      </h2>

      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-xs font-medium text-ink-500">
                <th className="px-4 py-3">Garage Name</th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-10 text-center text-sm text-ink-500"
                  >
                    No approvals pending.
                  </td>
                </tr>
              )}
              {pageItems.map((a) => {
                const isPending = a.status === "PENDING";
                return (
                  <tr
                    key={a.id}
                    className="border-b border-ink-100 last:border-b-0"
                  >
                    <td className="px-4 py-4 font-semibold text-ink-800">
                      {a.garageName}
                    </td>
                    <td className="px-4 py-4 text-ink-700">{a.garageId}</td>
                    <td className="px-4 py-4 text-right font-semibold text-ink-800">
                      ₹{a.amount.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-4 text-ink-700">{a.reference}</td>
                    <td className="px-4 py-4 font-semibold text-ink-800">
                      {a.mode}
                    </td>
                    <td className="px-4 py-4 text-ink-600">{a.date}</td>
                    <td className="px-4 py-4 text-ink-600">{a.description}</td>
                    <td className="px-4 py-4 text-center">
                      <ApprovalStatusPill status={a.status} />
                    </td>
                    <td className="px-4 py-4">
                      {isPending ? (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onReject(a.id)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-accent-500 bg-white px-3 py-1.5 text-xs font-semibold text-accent-600 hover:bg-accent-50"
                          >
                            <X className="h-3.5 w-3.5" /> REJECT
                          </button>
                          <button
                            type="button"
                            onClick={() => onApprove(a.id)}
                            className="inline-flex  cursor-pointer items-center gap-1.5 rounded-lg bg-accent-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-600"
                          >
                            <Check className="h-3.5 w-3.5" /> APPROVE
                          </button>
                        </div>
                      ) : (
                        <span className="block text-right text-xs text-ink-400">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
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

function ApprovalStatusPill({ status }) {
  const styles = {
    PENDING: "bg-accent-50 text-accent-700 border-accent-200",
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span
      className={clsx(
        "inline-block rounded-md border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        styles[status],
      )}
    >
      {status}
    </span>
  );
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
