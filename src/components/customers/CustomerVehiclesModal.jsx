import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Car, CircleCheck, CircleAlert, Star } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { customerApi } from "@/services";
import { formatDate, initials as toInitials } from "@/utils/formatters";

const HISTORY_PAGE_SIZE = 3;



const pick = (obj, ...keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return null;
};

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function mapLine(line, kind) {
  if (kind === "part") {
    return {
      name: pick(line, "partName", "name", "description") ?? "-",
      qty: toNumber(pick(line, "quantity", "qty")),
      rate: toNumber(pick(line, "unitPrice", "price", "rate")),
      amount: toNumber(pick(line, "amount", "totalAmount", "total")),
    };
  }
  return {
    name:
      pick(line, "labourDescription", "description", "labourName", "name") ??
      "-",
    qty: toNumber(pick(line, "hours", "qty", "quantity")),
    rate: toNumber(pick(line, "rate", "unitPrice", "price")),
    amount: toNumber(pick(line, "amount", "totalAmount", "total")),
  };
}

const lineAmount = (l) =>
  l.amount ?? (l.qty != null && l.rate != null ? l.qty * l.rate : 0);
const sumAmounts = (lines) => lines.reduce((s, l) => s + lineAmount(l), 0);

function mapTextItems(list) {
  return (list ?? [])
    .map((item) =>
      typeof item === "string"
        ? { text: item, due: null }
        : {
            text: pick(item, "description", "text", "name", "title") ?? "",
            due: pick(item, "dueDate", "due", "dueOn"),
          },
    )
    .filter((i) => i.text);
}

function mapServiceEntry(e) {
  const parts = (pick(e, "parts", "partsDetails") ?? []).map((l) =>
    mapLine(l, "part"),
  );
  const labour = (pick(e, "labour", "labourDetails") ?? []).map((l) =>
    mapLine(l, "labour"),
  );
  const partsTotal =
    toNumber(pick(e, "partsTotal", "totalPartsAmount")) ?? sumAmounts(parts);
  const labourTotal =
    toNumber(pick(e, "labourTotal", "totalLabourAmount")) ?? sumAmounts(labour);
  const taxes = toNumber(pick(e, "taxAmount", "taxes", "totalTax"));
  const completed = pick(e, "serviceCompleted", "isCompleted");

  return {
    id: pick(e, "jobCardId", "id", "invoiceId"),
    invoiceId: pick(e, "invoiceNumber", "invoiceId", "invoiceNo"),
    status: pick(e, "status", "jobCardStatus"),
    serviceDate: pick(e, "serviceDate", "jobCardDate", "createdAt"),
    location: pick(e, "serviceLocation", "location", "outletName"),
    serviceType: pick(e, "serviceType"),
    serviceProduct: pick(e, "serviceProduct"),
    garageType: pick(e, "garageType"),
    odometer: pick(e, "odometer", "odometerReading"),
    parts,
    labour,
    issuesResolved: mapTextItems(pick(e, "issuesResolved", "resolvedIssues")),
    recommendations: mapTextItems(pick(e, "recommendations")),
    partsTotal,
    labourTotal,
    taxes,
    taxPercent: pick(e, "taxPercent", "taxPercentage"),
    grandTotal:
      toNumber(pick(e, "grandTotal", "totalAmount", "netAmount")) ??
      partsTotal + labourTotal + (taxes ?? 0),
    paymentMode: pick(e, "paymentMode", "paymentType"),
    rating: pick(e, "rating"),
    serviceCompleted:
      completed == null
        ? null
        : completed === true || /^(yes|true|1)$/i.test(String(completed)),
  };
}

function mapVehicle(v, customer) {
  // Customer list row already carries make/model/insurance for its own
  // vehicle - use it when the vehicles API doesn't send them.
  const own = customer?.vehicleId != null && customer.vehicleId === v.vehicleId;
  const history = (v.serviceHistory ?? []).map(mapServiceEntry);
  const latest = [...history]
    .filter((h) => h.serviceDate)
    .sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate))[0];

  const make = pick(v, "makeName", "make") ?? (own ? customer.make : null);
  const model = pick(v, "modelName", "model") ?? (own ? customer.model : null);
  const insurer =
    pick(v, "insuranceName", "insurerName") ??
    (own ? customer.insInsurerName : null);
  const insExpiry =
    pick(v, "insuranceExpDate", "insuranceExpiryDate") ??
    (own ? customer.insExpiryDate : null);

  return {
    id: v.vehicleId,
    regNo: v.registrationNumber ?? "-",
    makeModel: [make, model].filter(Boolean).join(" "),
    vehicleType: pick(v, "vehicleType", "vehicleCategory"),
    status: pick(v, "vehicleStatus", "status"),
    lastService: pick(v, "lastServiceDate") ?? latest?.serviceDate ?? null,
    nextDue: pick(v, "nextServiceDueDate", "nextDueDate"),
    odometer:
      pick(v, "odometer", "odometerReading") ?? latest?.odometer ?? null,
    insurer,
    insExpiry,
    history,
  };
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});
const money = (v) => (v == null ? "-" : inr.format(v));
const km = (v) => (v == null ? "-" : `${Number(v).toLocaleString("en-IN")} km`);
const shortDate = (v) =>
  formatDate(v, { day: "2-digit", month: "short", year: "numeric" });
const monthDate = (v) =>
  formatDate(v, { month: "short", day: "2-digit", year: "numeric" });

function formatPhoneIN(value) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (digits.length !== 10) return value || "-";
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

const isPast = (d) => {
  if (!d) return false;
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return t < today;
};

/** Pill colours from the design, keyed on the status text. */
function statusPillClass(status = "") {
  const s = String(status).toLowerCase();
  if (/(active|completed|scheduled|yes)/.test(s))
    return "bg-success-50 text-success-500";
  if (/(garage|progress|overdue|pending)/.test(s))
    return "bg-accent-50 text-accent-600";
  if (/(cancel|inactive|rejected)/.test(s))
    return "bg-danger-50 text-danger-500";
  return "bg-ink-100 text-ink-600";
}

function Pill({ children, className }) {
  if (children == null || children === "") return null;
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium",
        className ?? statusPillClass(children),
      )}
    >
      {children}
    </span>
  );
}

function Field({ label, value, valueClassName, className }) {
  return (
    <div className={className}>
      <p className="text-xs text-ink-400">{label}</p>
      <p
        className={clsx(
          "mt-0.5 text-sm font-semibold text-ink-800",
          valueClassName,
        )}
      >
        {value ?? "-"}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function CustomerVehiclesModal({ isOpen, onClose, customer }) {
  const [rawVehicles, setRawVehicles] = useState([]);
  const [totalVehicles, setTotalVehicles] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);

  useEffect(() => {
    if (!isOpen || !customer?.id) return;

    let cancelled = false;
    setIsLoading(true);
    customerApi
      .getVehicleNumbers({ customerId: customer.id })
      .then((response) => {
        if (cancelled || !response?.requestSuccessful) return;
        const list = response.vehicleNumbers ?? [];
        setRawVehicles(list);
        setTotalVehicles(response.totalVehicles ?? list.length);
        const preferred = list.find((v) => v.vehicleId === customer.vehicleId);
        setSelectedId((preferred ?? list[0])?.vehicleId ?? null);
        setHistoryPage(0);
      })
      .catch(() => {
        if (!cancelled) {
          setRawVehicles([]);
          setTotalVehicles(0);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, customer?.id, customer?.vehicleId]);

  const vehicles = useMemo(
    () => rawVehicles.map((v) => mapVehicle(v, customer)),
    [rawVehicles, customer],
  );
  const selectedVehicle = vehicles.find((v) => v.id === selectedId);
  const history = selectedVehicle?.history ?? [];
  const historyStart = historyPage * HISTORY_PAGE_SIZE;
  const historyPageItems = history.slice(
    historyStart,
    historyStart + HISTORY_PAGE_SIZE,
  );
  const hasPrev = historyPage > 0;
  const hasNext = historyStart + HISTORY_PAGE_SIZE < history.length;

  // Service Calendar - built only from dates the API returned.
  const calendar = useMemo(() => {
    const items = [];
    for (const v of vehicles) {
      const name = v.makeModel || v.regNo;
      if (v.nextDue) {
        const overdue = isPast(v.nextDue);
        items.push({
          key: `svc-${v.id}`,
          title: "Periodic Maintenance Due",
          vehicle: name,
          date: v.nextDue,
          label: overdue ? "Overdue" : "Upcoming",
          bar: overdue ? "bg-accent-500" : "bg-warning-500",
          pill: overdue
            ? "bg-accent-50 text-accent-600"
            : "bg-ink-100 text-ink-600",
        });
      }
      if (v.insExpiry) {
        items.push({
          key: `ins-${v.id}`,
          title: "Insurance Renewal Due",
          vehicle: name,
          date: v.insExpiry,
          label: "Action Required",
          bar: "bg-brand-800",
          pill: "bg-ink-100 text-ink-600",
        });
      }
    }
    return items.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [vehicles]);

  function selectVehicle(id) {
    setSelectedId(id);
    setHistoryPage(0);
  }

  const customerCode = customer?.customerCode || customer?.id;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customer & Vehicle Details"
      size="xl"
    >
      {!customer ? null : (
        <div className="space-y-6">
          {/* ---------------- Customer summary ---------------- */}
          <div className="flex flex-wrap items-center gap-6 rounded-xl bg-white p-5 shadow-card ring-1 ring-ink-100">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-50 text-lg font-semibold text-accent-600">
                {toInitials(customer.name) || "?"}
              </div>
              <div>
                <p className="text-lg font-semibold text-ink-800">
                  {customer.name || "-"}
                </p>
                <p className="text-sm text-ink-500">
                  Customer ID: {customerCode ?? "-"}
                </p>
              </div>
            </div>

            <div className="ml-auto flex flex-wrap gap-x-10 gap-y-3">
              <SummaryField
                label="Phone"
                value={customer.mobile}
              />
              <SummaryField label="Email" value={customer.email || "-"} />
              <div>
                <p className="text-xs uppercase tracking-wide text-ink-400">
                  No. of Vehicles
                </p>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-sm font-semibold text-ink-800">
                    {totalVehicles}
                  </span>
                  <Pill>{customer.status}</Pill>
                </div>
              </div>
              <SummaryField
                label="Member Since"
                value={
                  customer.memberSince ? monthDate(customer.memberSince) : "-"
                }
              />
              <SummaryField label="Type" value={customer.customerType || "-"} />
            </div>
          </div>

          {/* ---------------- Vehicles ---------------- */}
          <div>
            <h3 className="mb-3 text-xl font-semibold text-ink-800">
              Vehicles
            </h3>
            {isLoading ? (
              <p className="text-sm text-ink-500">Loading vehicles...</p>
            ) : vehicles.length === 0 ? (
              <p className="text-sm text-ink-500">No vehicles found.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {vehicles.map((v) => {
                  const active = v.id === selectedId;
                  const overdue = isPast(v.nextDue);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => selectVehicle(v.id)}
                      className={clsx(
                        "rounded-xl border bg-white p-5 text-left transition cursor-pointer",
                        active
                          ? "border-accent-500 shadow-card"
                          : "border-ink-200 hover:border-ink-300",
                      )}
                    >
                      <div className="flex items-center gap-4 border-b border-ink-100 pb-4">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ink-50">
                          <Car className="h-5 w-5 text-accent-500" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-lg font-semibold text-ink-800">
                            {v.regNo}
                          </p>
                          <p className="truncate text-sm text-ink-500">
                            {[v.makeModel, v.vehicleType]
                              .filter(Boolean)
                              .join(" - ") || "-"}
                          </p>
                        </div>
                        <Pill>{v.status}</Pill>
                      </div>
                      <div className="flex flex-wrap gap-x-6 gap-y-3 pt-4">
                        <Field
                          label="Last Service"
                          value={v.lastService ? monthDate(v.lastService) : "-"}
                        />
                        <Field
                          label="Next Due Service"
                          value={
                            v.nextDue
                              ? `${monthDate(v.nextDue)}${overdue ? " (Overdue)" : ""}`
                              : "-"
                          }
                          valueClassName={
                            v.nextDue
                              ? overdue
                                ? "text-accent-600"
                                : "text-success-500"
                              : undefined
                          }
                        />
                        <Field label="Odometer" value={km(v.odometer)} />
                        <Field
                          label="Insurance Policy"
                          value={
                            v.insurer || v.insExpiry
                              ? [
                                  v.insurer,
                                  v.insExpiry &&
                                    formatDate(v.insExpiry, {
                                      month: "short",
                                      year: "numeric",
                                    }),
                                ]
                                  .filter(Boolean)
                                  .join(" • ")
                              : "-"
                          }
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ---------------- History + Calendar ---------------- */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-ink-800">
                  Service History{" "}
                  {history.length > 0 && (
                    <span className="ml-1 text-base font-normal text-ink-400">
                      {historyStart + 1}-
                      {historyStart + historyPageItems.length} of{" "}
                      {history.length}
                    </span>
                  )}
                </h3>
                {history.length > HISTORY_PAGE_SIZE && (
                  <div className="flex gap-2">
                    <PagerButton
                      disabled={!hasPrev}
                      onClick={() => setHistoryPage((p) => p - 1)}
                    >
                      Prev
                    </PagerButton>
                    <PagerButton
                      disabled={!hasNext}
                      onClick={() => setHistoryPage((p) => p + 1)}
                    >
                      Next
                    </PagerButton>
                  </div>
                )}
              </div>

              {historyPageItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-ink-200 p-6 text-center text-sm text-ink-500">
                  No service history for this vehicle yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {historyPageItems.map((entry, i) => (
                    <ServiceHistoryCard
                      key={entry.id ?? historyStart + i}
                      entry={entry}
                      vehicle={selectedVehicle}
                    />
                  ))}
                </div>
              )}
            </div>

            <ServiceCalendar items={calendar} />
          </div>
        </div>
      )}
    </Modal>
  );
}

function SummaryField({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-ink-800">{value}</p>
    </div>
  );
}

function PagerButton({ disabled, onClick, children }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "rounded-md px-4 py-1.5 text-sm font-medium",
        disabled
          ? "bg-ink-100 text-ink-500 cursor-not-allowed"
          : "bg-accent-50 text-accent-600 hover:bg-accent-100 cursor-pointer",
      )}
    >
      {children}
    </button>
  );
}

function LinesTable({ title, headers, lines, qtyFormat }) {
  if (!lines.length) return null;
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold text-ink-800">{title}</h4>
      <div className="overflow-x-auto rounded-lg border border-ink-200">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-ink-500">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium">
                {headers[0]}
              </th>
              <th className="px-3 py-2.5 text-center font-medium">
                {headers[1]}
              </th>
              <th className="px-3 py-2.5 text-right font-medium">
                {headers[2]}
              </th>
              <th className="px-3 py-2.5 text-right font-medium">
                {headers[3]}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-100">
            {lines.map((l, i) => (
              <tr key={i}>
                <td className="px-3 py-2.5 text-ink-700">{l.name}</td>
                <td className="px-3 py-2.5 text-center text-ink-700">
                  {l.qty == null ? "-" : qtyFormat(l.qty)}
                </td>
                <td className="px-3 py-2.5 text-right text-ink-700">
                  {money(l.rate)}
                </td>
                <td className="px-3 py-2.5 text-right font-semibold text-ink-800">
                  {money(lineAmount(l))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ServiceHistoryCard({ entry, vehicle }) {
  const title = [vehicle?.makeModel, vehicle?.regNo && `(${vehicle.regNo})`]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-5 rounded-xl border border-ink-200 bg-white p-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h4 className="text-base font-semibold text-ink-800">
            {title || "-"}
          </h4>
          <Pill>{entry.status}</Pill>
        </div>
        {entry.invoiceId && (
          <p className="text-sm text-ink-400">Invoice ID: #{entry.invoiceId}</p>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-x-8 gap-y-3 rounded-lg bg-ink-50 p-3">
        <Field
          label="Service Date"
          value={entry.serviceDate ? shortDate(entry.serviceDate) : "-"}
        />
        <Field label="Service Location" value={entry.location} />
        <Field label="Service Type" value={entry.serviceType} />
        <Field label="Service Product" value={entry.serviceProduct} />
        <Field label="Garage Type" value={entry.garageType} />
        <Field label="Odometer" value={km(entry.odometer)} />
      </div>

      <LinesTable
        title="Parts Details"
        headers={["Part Name", "Qty", "Unit Price", "Amount"]}
        lines={entry.parts}
        qtyFormat={(q) => q}
      />
      <LinesTable
        title="Labour Details"
        headers={["Labour Description", "Hours", "Rate", "Amount"]}
        lines={entry.labour}
        qtyFormat={(q) => Number(q).toFixed(1)}
      />

      {(entry.issuesResolved.length > 0 ||
        entry.recommendations.length > 0) && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h4 className="mb-2 text-sm font-semibold text-ink-800">
              Issues Resolved
            </h4>
            {entry.issuesResolved.length === 0 ? (
              <p className="text-sm text-ink-400">-</p>
            ) : (
              <ul className="space-y-2">
                {entry.issuesResolved.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-ink-700"
                  >
                    <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-success-500" />
                    {item.text}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold text-ink-800">
              Recommendations
            </h4>
            {entry.recommendations.length === 0 ? (
              <p className="text-sm text-ink-400">-</p>
            ) : (
              <ul className="space-y-2">
                {entry.recommendations.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-ink-700"
                  >
                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
                    <span className="flex-1">{item.text}</span>
                    {item.due && (
                      <span className="shrink-0 text-xs text-ink-400">
                        {Number.isNaN(new Date(item.due).getTime())
                          ? item.due
                          : formatDate(item.due, {
                              month: "short",
                              year: "numeric",
                            })}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-ink-100 pt-4">
        <div className="space-y-1 text-sm text-ink-500">
          <p>
            Parts Total:{" "}
            <span className="ml-1 font-semibold text-ink-800">
              {money(entry.partsTotal)}
            </span>
          </p>
          <p>
            Labour Total:{" "}
            <span className="ml-1 font-semibold text-ink-800">
              {money(entry.labourTotal)}
            </span>
          </p>
          <p>
            Taxes (CGST + SGST
            {entry.taxPercent != null ? ` ${entry.taxPercent}%` : ""}):
            <span className="ml-1 font-semibold text-ink-800">
              {money(entry.taxes)}
            </span>
          </p>
        </div>
        <div className="rounded-lg bg-accent-50 px-6 py-3 text-right">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent-600">
            Grand Total Paid
          </p>
          <p className="text-3xl font-bold text-accent-600">
            {money(entry.grandTotal)}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 pt-4 text-sm">
        <div className="flex flex-wrap items-center gap-6 text-ink-500">
          <span>
            Payment:{" "}
            <span className="ml-1 font-semibold text-ink-800">
              {entry.paymentMode ?? "-"}
            </span>
          </span>
          <span className="flex items-center gap-1">
            Rating:
            {entry.rating != null ? (
              <>
                <Star className="ml-1 h-4 w-4 text-warning-500" />
                <span className="font-semibold text-ink-800">
                  {entry.rating}
                </span>
              </>
            ) : (
              <span className="ml-1 font-semibold text-ink-800">-</span>
            )}
          </span>
        </div>
        <span className="flex items-center gap-2 text-ink-500">
          Service Completed:
          {entry.serviceCompleted == null ? (
            <span className="font-semibold text-ink-800">-</span>
          ) : (
            <Pill>{entry.serviceCompleted ? "Yes" : "No"}</Pill>
          )}
        </span>
      </div>
    </div>
  );
}

function ServiceCalendar({ items }) {
  return (
    <div className="h-fit rounded-xl border border-ink-200 bg-white p-5">
      <h3 className="text-lg font-semibold text-ink-800">Service Calendar</h3>
      <p className="text-sm text-ink-500">Upcoming alerts &amp; milestones</p>
      <div className="mt-4 space-y-5 border-t border-ink-100 pt-4">
        {items.length === 0 ? (
          <p className="text-sm text-ink-400">No upcoming alerts.</p>
        ) : (
          items.map((item) => (
            <div key={item.key} className="flex gap-3">
              <span className={clsx("w-1 shrink-0 rounded-full", item.bar)} />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-ink-800">
                  {item.title}
                </p>
                <p className="text-sm text-ink-500">
                  {item.vehicle} • {shortDate(item.date)}
                </p>
                <span
                  className={clsx(
                    "inline-flex rounded-full px-3 py-0.5 text-sm font-medium",
                    item.pill,
                  )}
                >
                  {item.label}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
