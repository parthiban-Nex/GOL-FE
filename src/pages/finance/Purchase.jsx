import { useMemo, useState } from "react";
import clsx from "clsx";
import {
  Search,
  Filter,
  Download,
  Building2,
  Plus,
  ChevronDown,
  ChevronRight,
  Pencil,
  Upload,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import Input from "@/components/ui/Input";
import Pagination from "@/components/ui/Pagination";
import { usePagination } from "@/hooks/usePagination";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import AddPurchaseModal from "@/components/finance/AddPurchaseModal";
import AddVendorModal from "@/components/finance/AddVendorModal";
import {
  INITIAL_PURCHASES,
  computePurchaseTotals,
} from "@/pages/finance/mockPurchase";
import { INITIAL_VENDORS } from "@/pages/finance/mockexpense";
import { showToast } from "@/utils/toast";

const STATUS_PILL = {
  Paid: {
    cls: "bg-emerald-50 text-emerald-700 border-emerald-100",
    icon: CheckCircle2,
  },
  Partial: {
    cls: "bg-amber-50  text-amber-700  border-amber-100",
    icon: Clock,
  },
  Pending: {
    cls: "bg-red-50    text-red-700    border-red-100",
    icon: AlertCircle,
  },
};

export default function Purchase() {
  const [purchases, setPurchases] = useState(INITIAL_PURCHASES);
  const [vendors, setVendors] = useState(INITIAL_VENDORS);

  const [query, setQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [expanded, setExpanded] = useState(() => new Set(["PUR001"])); // first row open

  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [vendorModalOpen, setVendorModalOpen] = useState(false);

  const totals = useMemo(() => computePurchaseTotals(purchases), [purchases]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return purchases.filter((p) => {
      if (
        q &&
        ![p.vendor, p.invoiceNo, p.paymentMode, p.notes].some((f) =>
          (f ?? "").toLowerCase().includes(q),
        )
      )
        return false;
      if (dateFrom && p.date < dateFrom) return false;
      if (dateTo && p.date > dateTo) return false;
      return true;
    });
  }, [purchases, query, dateFrom, dateTo]);
  const {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    totalItems,
    pageItems,
  } = usePagination(filtered);
  function toggleExpand(id) {
    setExpanded((cur) => {
      const next = new Set(cur);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleAddPurchase(payload) {
    const id = `PUR${String(purchases.length + 1).padStart(3, "0")}`;
    setPurchases((cur) => [{ id, ...payload }, ...cur]);
    setPurchaseModalOpen(false);
  }
  function handleAddVendor(payload) {
    setVendors((cur) => [payload, ...cur]);
    setVendorModalOpen(false);
  }
  function handleExportCsv() {
    // TODO: BACKEND INTEGRATION - purchaseApi.exportCsv({ query, dateFrom, dateTo })
    showToast.success("Exporting CSV...");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-ink-800">Purchase</h1>

      <div className="flex flex-wrap gap-3">
        <StatPill label="Total Incl GST" amount={totals.inclGst} tone="blue" />
        <StatPill label="Total Paid" amount={totals.paid} tone="emerald" />
        <StatPill label="Total Pending" amount={totals.pending} tone="red" />
      </div>

      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-2 border-b border-ink-100 p-4">
          <div className="relative min-w-[200px] flex-1">
            <Input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search..."
              icon={Search}
              className="h-11"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-400">
              <Calendar className="h-4 w-4" />
            </div>
            <div>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="h-10"
                aria-label="From Date"
              />
            </div>
            <span className="text-ink-400">—</span>
            <div>
              <Input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="h-10"
                aria-label="To Date"
              />
            </div>
            <button
              type="button"
              aria-label="Filter"
              className="flex h-10 w-10  cursor-pointer items-center justify-center rounded-lg border border-ink-200 bg-white text-ink-600 hover:bg-ink-50"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="tertiary"
              icon={Download}
              onClick={handleExportCsv}
            >
              Export CSV
            </Button>
            <Button
              variant="tertiary"
              icon={Building2}
              onClick={() => setVendorModalOpen(true)}
            >
              Add Vendor
            </Button>
            <Button icon={Plus} onClick={() => setPurchaseModalOpen(true)}>
              Add New
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 bg-ink-50/60 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                <th className="w-8 px-2 py-3"></th>
                <th className="px-4 py-3">Vendor / Invoice</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-center">Pay Mode</th>
                <th className="px-4 py-3 text-center">Excl GST</th>
                <th className="px-4 py-3 text-center">Incl GST</th>
                <th className="px-4 py-3 text-center">Paid</th>
                <th className="px-4 py-3 text-center">Pending</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-14 text-center text-sm text-ink-500"
                  >
                    No purchases match your filters.
                  </td>
                </tr>
              )}
              {pageItems.map((p) => (
                <PurchaseRow
                  key={p.id}
                  purchase={p}
                  isExpanded={expanded.has(p.id)}
                  onToggle={() => toggleExpand(p.id)}
                />
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

      <AddPurchaseModal
        isOpen={purchaseModalOpen}
        onClose={() => setPurchaseModalOpen(false)}
        onSubmit={handleAddPurchase}
      />
      <AddVendorModal
        isOpen={vendorModalOpen}
        onClose={() => setVendorModalOpen(false)}
        onSubmit={handleAddVendor}
      />
    </div>
  );
}

function StatPill({ label, amount, tone }) {
  const toneClasses = {
    blue: "border-brand-100 bg-brand-50/60",
    emerald: "border-emerald-100 bg-emerald-50/60",
    red: "border-red-100 bg-red-50/60",
  }[tone];
  const amountClasses = {
    blue: "text-brand-700",
    emerald: "text-emerald-700",
    red: "text-red-700",
  }[tone];
  return (
    <div
      className={clsx(
        "flex items-baseline gap-2 rounded-lg border px-4 py-2.5",
        toneClasses,
      )}
    >
      <span className={clsx("text-sm font-medium", amountClasses)}>
        {label}:
      </span>
      <span className={clsx("text-md font-bold", amountClasses)}>
        ₹{amount.toLocaleString("en-IN")}
      </span>
    </div>
  );
}

function PurchaseRow({ purchase, isExpanded, onToggle }) {
  const statusMeta = STATUS_PILL[purchase.status] ?? STATUS_PILL.Pending;
  const StatusIcon = statusMeta.icon;

  return (
    <>
      <tr className="border-b border-ink-100 hover:bg-ink-50/30">
        <td className="px-2 py-4 align-top">
          <button
            type="button"
            onClick={onToggle}
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-ink-500 hover:bg-ink-100 hover:text-ink-700"
            aria-label={isExpanded ? "Collapse row" : "Expand row"}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </td>
        <td className="px-4 py-4">
          <p className="font-semibold text-ink-800">{purchase.vendor}</p>
          <p className="mt-0.5 text-xs text-ink-500">{purchase.invoiceNo}</p>
        </td>
        <td className="px-4 py-4  text-ink-600">{purchase.date}</td>
        <td className="px-4 py-4 text-center">
          {purchase.paymentMode ? (
            <span className="inline-block rounded-md border border-ink-200 bg-white px-2 py-0.5 text-xs text-ink-700">
              {purchase.paymentMode}
            </span>
          ) : (
            <span className="text-ink-400">—</span>
          )}
        </td>
        <td className="px-4 py-4 text-center text-ink-700">
          ₹{purchase.exclGst.toLocaleString("en-IN")}
        </td>
        <td className="px-4 py-4 text-center font-semibold text-ink-800">
          ₹{purchase.inclGst.toLocaleString("en-IN")}
        </td>
        <td className="px-4 py-4 text-center text-ink-700">
          ₹{purchase.paid.toLocaleString("en-IN")}
        </td>
        <td
          className={clsx(
            "px-4 py-4 text-center font-semibold",
            purchase.pending > 0 ? "text-red-600" : "text-ink-500",
          )}
        >
          ₹{purchase.pending.toLocaleString("en-IN")}
        </td>
        <td className="px-4 py-4 text-center">
          <span
            className={clsx(
              "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium",
              statusMeta.cls,
            )}
          >
            <StatusIcon className="h-3 w-3" />
            {purchase.status}
          </span>
        </td>
        <td className="px-4 py-4">
          <div className="flex justify-center gap-1">
            <button
              type="button"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-ink-500  hover:text-blue-600 transition-colors"
              aria-label="Edit"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded text-ink-500  hover:text-emerald-600 transition-colors"
              aria-label="Upload document"
            >
              <Upload className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>

      {isExpanded && (
        <tr className="bg-ink-50/30">
          <td colSpan={10} className="p-0">
            <div className="flex">
              <div className="w-1 bg-brand-500" aria-hidden />
              <div className="grid flex-1 gap-6 p-5 md:grid-cols-2 xl:grid-cols-4">
                <DetailBlock title="Purchase Details">
                  <DetailRow label="Vendor" value={purchase.vendor} />
                  <DetailRow label="Invoice No" value={purchase.invoiceNo} />
                  <DetailRow label="Date" value={purchase.date} />
                  <DetailRow
                    label="Payment Mode"
                    value={purchase.paymentMode || "—"}
                  />
                </DetailBlock>

                <DetailBlock title="Line Items">
                  {purchase.lineItems.length === 0 ? (
                    <p className="text-sm text-ink-400">No line items</p>
                  ) : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-left text-[10px] font-medium text-ink-500">
                          <th className="pb-1.5">Item</th>
                          <th className="pb-1.5 text-right">Qty</th>
                          <th className="pb-1.5 text-right">Rate</th>
                          <th className="pb-1.5 text-right">Amt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchase.lineItems.map((li, i) => (
                          <tr key={i}>
                            <td className="py-0.5 text-ink-800">{li.name}</td>
                            <td className="py-0.5 text-right text-ink-700">
                              {li.qty}
                            </td>
                            <td className="py-0.5 text-right text-ink-700">
                              ₹{li.rate.toLocaleString("en-IN")}
                            </td>
                            <td className="py-0.5 text-right font-semibold text-ink-800">
                              ₹{li.amount.toLocaleString("en-IN")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </DetailBlock>

                <DetailBlock title="Amount Breakdown">
                  <DetailRow
                    label="Excl. GST"
                    value={`₹${purchase.exclGst.toLocaleString("en-IN")}`}
                  />
                  <DetailRow
                    label="GST"
                    value={`₹${purchase.gst.toLocaleString("en-IN")}`}
                  />
                  <DetailRow
                    label="Incl. GST"
                    value={`₹${purchase.inclGst.toLocaleString("en-IN")}`}
                  />
                  <DetailRow
                    label="Paid"
                    value={`₹${purchase.paid.toLocaleString("en-IN")}`}
                    valueClass="text-emerald-600 font-semibold"
                  />
                  <DetailRow
                    label="Pending"
                    value={`₹${purchase.pending.toLocaleString("en-IN")}`}
                    valueClass={
                      purchase.pending > 0 ? "text-red-600 font-semibold" : ""
                    }
                  />
                </DetailBlock>

                <DetailBlock title="Documents">
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-ink-300 bg-white px-3 py-6 text-center hover:bg-ink-50">
                    <Upload className="h-4 w-4 text-ink-400" />
                    <span className="text-xs text-ink-600">Upload file</span>
                    <input type="file" className="hidden" />
                  </label>
                </DetailBlock>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function DetailBlock({ title, children }) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-ink-500">
        {title}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
function DetailRow({ label, value, valueClass }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <span className="text-ink-600">{label}</span>
      <span className={clsx("text-right text-ink-800", valueClass)}>
        {value}
      </span>
    </div>
  );
}
