import { useMemo, useState } from "react";
import clsx from "clsx";
import { Search, Filter, Award } from "lucide-react";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import {
  INITIAL_INVOICES,
  BILLING_HEADER_STATS,
} from "@/pages/finance/mockBillingReceipt";
import { showToast } from "@/utils/toast";

const PAGE_SIZE = 5;

const STATUS_PILL = {
  Paid: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Unpaid: "bg-red-50 text-red-700 border-red-100",
  "Partially Paid": "bg-amber-50 text-amber-700 border-amber-100",
};

export default function Billing() {
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [payTarget, setPayTarget] = useState(null); // invoice being paid via modal

  // Header stats recompute from the invoices list so the outstanding
  // total drops as invoices get paid.
  const stats = useMemo(
    () => ({
      outstandingBalance: invoices.reduce((sum, i) => sum + i.balance, 0),
      loyaltyPoints: BILLING_HEADER_STATS.loyaltyPoints,
    }),
    [invoices],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter(
      (i) =>
        i.id.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.date.includes(q) ||
        i.status.toLowerCase().includes(q),
    );
  }, [invoices, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  function handlePay(inv) {
    // TODO: BACKEND INTEGRATION - billingApi.payInvoice(inv.id, {...})
    setInvoices((cur) =>
      cur.map((i) =>
        i.id === inv.id
          ? { ...i, paid: i.amount, balance: 0, status: "Paid" }
          : i,
      ),
    );
    showToast.success(
      `Payment of ₹${inv.balance.toLocaleString("en-IN")} received for ${inv.id}.`,
    );
    setPayTarget(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink-800">
            Invoices &amp; Billings
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Manage outstanding payments and automotive service invoices
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-ink-100 bg-ink-100 px-3.5 py-2">
            <p className="text-sm font-medium text-ink-600">
              Outstanding Balance:{" "}
              <span className="font-bold text-orange-500">
                ₹{stats.outstandingBalance.toLocaleString("en-IN")}
              </span>
            </p>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3.5 py-2">
            <p className="text-sm font-medium text-emerald-600">
              Loyalty Points:{" "}
              <span className="font-bold text-emerald-700">
                {stats.loyaltyPoints} PTS
              </span>
            </p>
          </div>
        </div>
      </div>

      <Card padded={false}>
        <div className="flex items-center gap-2 border-b border-ink-100 p-4">
          <div className="relative flex-1">
            <Input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by Billing"
              icon={Search}
              className="h-11"
            />
          </div>

          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
            aria-label="Filter invoices"
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-xs font-medium text-ink-500">
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 ">Paid</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-14 text-center text-sm text-ink-500"
                  >
                    No invoices match your search.
                  </td>
                </tr>
              )}
              {pageRows.map((inv) => (
                <BillingRow
                  key={inv.id}
                  invoice={inv}
                  onPay={() => setPayTarget(inv)}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 p-4">
          <p className="text-sm text-ink-600">
            Showing{" "}
            <span className="font-semibold text-ink-800">
              {filtered.length}
            </span>{" "}
            invoices
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="rounded-lg border cursor-pointer border-ink-200 px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="flex h-8 min-w-8 items-center justify-center rounded-md bg-accent-500 px-2 text-sm font-semibold text-white">
              {currentPage}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="rounded-lg border cursor-pointer border-ink-200 px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </Card>

      <PayNowModal
        invoice={payTarget}
        onClose={() => setPayTarget(null)}
        onConfirm={handlePay}
      />
    </div>
  );
}

/** One invoice row + optional loyalty-deadline banner directly under it. */
function BillingRow({ invoice, onPay }) {
  const isPaid = invoice.status === "Paid";
  return (
    <tr className="border-b border-ink-100 last:border-b-0 align-top">
      <td className="px-4 py-4">
        <p className="font-semibold text-ink-800">{invoice.id}</p>
        {invoice.loyaltyDeadline && !isPaid && (
          <div className="mt-2 inline-flex items-start gap-1.5 rounded-md border border-blue-100 bg-blue-50/60 px-2.5 py-1.5 text-[11px] text-ink-700">
            <Award className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
            <span>
              Pay before{" "}
              <span className="font-semibold text-blue-700">
                {invoice.loyaltyDeadline}
              </span>{" "}
              to receive{" "}
              <span className="font-semibold text-accent-600">
                {invoice.loyaltyPoints} loyalty points
              </span>
            </span>
          </div>
        )}
      </td>
      <td className="px-4 py-4 text-ink-600">{invoice.date}</td>
      <td
        className="max-w-[220px] truncate px-4 py-4 text-ink-700"
        title={invoice.description}
      >
        {invoice.description}
      </td>
      <td className="px-4 py-4  font-semibold text-ink-800">
        ₹{invoice.amount.toLocaleString("en-IN")}
      </td>
      <td className="px-4 py-4">
        <span
          className={clsx(
            "inline-block rounded-md border px-2.5 py-0.5 text-[11px] font-medium",
            STATUS_PILL[invoice.status],
          )}
        >
          {invoice.status}
        </span>
      </td>
      <td className="px-4 py-4  text-ink-700">
        ₹{invoice.paid.toLocaleString("en-IN")}
      </td>
      <td
        className={clsx(
          "px-4 py-4  font-semibold",
          invoice.balance > 0 ? "text-accent-600" : "text-ink-500",
        )}
      >
        ₹{invoice.balance.toLocaleString("en-IN")}
      </td>
      <td className="px-4 py-4 text-center">
        {isPaid ? (
          <span className="text-ink-400">—</span>
        ) : (
          <Button size="sm" onClick={onPay}>
            PAY NOW
          </Button>
        )}
      </td>
    </tr>
  );
}

function PayNowModal({ invoice, onClose, onConfirm }) {
  if (!invoice) return null;
  return (
    <Modal
      isOpen={Boolean(invoice)}
      onClose={onClose}
      title={`Pay Invoice ${invoice.id}`}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(invoice)}>
            Confirm &amp; Pay ₹{invoice.balance.toLocaleString("en-IN")}
          </Button>
        </div>
      }
    >
      <div className="space-y-3 text-sm">
        <p className="text-ink-700">
          You're about to pay the outstanding balance for:
        </p>
        <div className="rounded-lg border border-ink-100 bg-ink-50/40 p-3">
          <p className="font-semibold text-ink-800">{invoice.description}</p>
          <p className="mt-0.5 text-xs text-ink-500">
            Invoice date: {invoice.date}
          </p>
        </div>
        <dl className="space-y-1.5 border-t border-dashed border-ink-200 pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-600">Total Amount</dt>
            <dd className="font-semibold text-ink-800">
              ₹{invoice.amount.toLocaleString("en-IN")}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-600">Paid so far</dt>
            <dd className="font-semibold text-ink-800">
              ₹{invoice.paid.toLocaleString("en-IN")}
            </dd>
          </div>
          <div className="flex justify-between text-base">
            <dt className="font-semibold text-ink-800">Balance Due</dt>
            <dd className="font-bold text-accent-600">
              ₹{invoice.balance.toLocaleString("en-IN")}
            </dd>
          </div>
        </dl>
        {invoice.loyaltyDeadline && (
          <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-xs text-ink-700">
            <Award className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <span>
              Pay before{" "}
              <span className="font-semibold text-blue-700">
                {invoice.loyaltyDeadline}
              </span>{" "}
              to receive{" "}
              <span className="font-semibold text-accent-600">
                {invoice.loyaltyPoints} loyalty points
              </span>
              .
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}
