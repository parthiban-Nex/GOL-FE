import { useMemo, useState } from "react";
import clsx from "clsx";
import {
  Plus,
  Search,
  ChevronDown,
  MoreVertical,
  Layers,
  MessageSquare,
  MessageCircle,
  CreditCard,
  Star,
  Database,
  FileText,
  Shield,
  Wallet,
  Clock,
  Mail,
  BarChart2,
  Download,
  CheckCircle2,
  MinusCircle,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import {
  INTEGRATION_STATS,
  FILTER_TABS,
  CATEGORY_OPTIONS,
  STATUS_PALETTE,
  INITIAL_INTEGRATIONS,
} from "@/pages/integrations/mockIntegrations";
import { showToast } from "@/utils/toast";

// String → icon component map (mock rows reference icons by name).
const ICONS = {
  Layers,
  MessageSquare,
  MessageCircle,
  CreditCard,
  Star,
  Database,
  FileText,
  Shield,
  Wallet,
  Clock,
  Mail,
  BarChart2,
  Download,
};

// Action button label + click behaviour keyed by row.action.type.
const ACTION_LABELS = {
  viewDetails: "View Details",
  topUp: "Top Up",
  settings: "Settings",
  updateApi: "Update API",
  activate: "Activate",
  syncNow: "Sync Now",
  reconnect: "Reconnect",
  addFunds: "Add Funds",
};

/**
 * Third Party Integration dashboard. Reads from mockIntegrations.js:
 *   - 4 top summary tiles with tinted progress bars
 *   - 4 tab filters (All / Active / Inactive / Action Required) +
 *     search-by-name + category dropdown
 *   - 6-column table (Integration / Request-Status / Details /
 *     Popup-Email / Activation / Actions)
 *   - Blue Need-help card at the bottom
 *   - Add-New-Integration modal launched from the top-right button
 *
 * TODO: BACKEND INTEGRATION - swap INITIAL_INTEGRATIONS for
 * integrationsApi.list(); wire toggle changes to
 * integrationsApi.setEnabled(id, enabled); action buttons open the
 * matching per-integration flow (payment gateway API entry, insurance
 * reconnect, wallet top-up, etc.).
 */
export default function Integrations() {
  const [rows, setRows] = useState(INITIAL_INTEGRATIONS);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (category && r.category !== category) return false;
      if (q && !r.name.toLowerCase().includes(q)) return false;
      if (tab === "active" && r.activation.key !== "Active") return false;
      if (tab === "inactive" && r.activation.key !== "Inactive") return false;
      if (tab === "action" && r.activation.key !== "Action Required")
        return false;
      return true;
    });
  }, [rows, tab, query, category]);

  function toggleEnabled(id) {
    setRows((cur) =>
      cur.map((r) =>
        r.id === id
          ? {
              ...r,
              activation: { ...r.activation, enabled: !r.activation.enabled },
            }
          : r,
      ),
    );
  }

  function handleAction(row) {
    // TODO: BACKEND INTEGRATION - each action.type maps to its own flow
    showToast.success(`${ACTION_LABELS[row.action.type]} for ${row.name}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-800">
            Third Party Integration
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Manage and connect external platforms to streamline your garage
            operations.
          </p>
        </div>
        <Button icon={Plus} onClick={() => setAddOpen(true)}>
          Add New Integration
        </Button>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile
          label="TOTAL INTEGRATIONS"
          stat={INTEGRATION_STATS.total}
          icon={Layers}
        />
        <SummaryTile
          label="ACTIVE INTEGRATIONS"
          stat={INTEGRATION_STATS.active}
          icon={CheckCircle2}
        />
        <SummaryTile
          label="INACTIVE INTEGRATIONS"
          stat={INTEGRATION_STATS.inactive}
          icon={MinusCircle}
        />
        <SummaryTile
          label="ACTION REQUIRED"
          stat={INTEGRATION_STATS.action}
          icon={Clock}
        />
      </div>

      <Card padded={false}>
        {/* Tabs + search + category */}
        <div className="flex flex-wrap items-center gap-3 border-b border-ink-100 px-4 py-3">
          <div className="flex flex-wrap items-center gap-1 border-b-0">
            {FILTER_TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={clsx(
                  "-mb-3 rounded-none cursor-pointer border-b-2 px-3 pb-3 pt-1 text-sm font-semibold transition-colors",
                  tab === t.key
                    ? "border-brand-600 text-brand-700"
                    : "border-transparent text-ink-500 hover:text-ink-700",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative w-72">
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search integration by name..."
                className="w rounded-lg border border-ink-200 bg-white pl-4 pr-3 text-sm text-ink-700 placeholder:text-ink-400 focus-visible:outline-2 focus-visible:outline-brand-500"
              />
            </div>
            <div className="relative">
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-10 appearance-none rounded-lg border border-ink-200 bg-white pl-3 pr-9 text-sm text-ink-700 focus-visible:outline-2 focus-visible:outline-brand-500"
              >
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-left text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                <th className="px-4 py-3">Integration</th>
                <th className="px-4 py-3">Request / Status</th>
                <th className="px-4 py-3">Details</th>
                <th className="px-4 py-3 ">Pop-up / Email</th>
                <th className="px-4 py-3">Activation</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-14 text-center text-sm text-ink-500"
                  >
                    No integrations match your filters.
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <IntegrationRow
                  key={r.id}
                  row={r}
                  onToggle={() => toggleEnabled(r.id)}
                  onAction={() => handleAction(r)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Help footer */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-brand-100 bg-brand-50/60 p-4">
        <div className="flex flex-1 items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-ink-800">
              Need help with integration?
            </p>
            <p className="mt-0.5 text-xs text-ink-600">
              Our support team can help you set up and manage third party
              integrations.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => showToast.success("Support ticket opened.")}
          className="rounded-lg border cursor-pointer border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-ink-50"
        >
          Contact Support
        </button>
      </div>

      <AddIntegrationModal isOpen={addOpen} onClose={() => setAddOpen(false)} />
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Summary tile (top row - 4 across)
 * ──────────────────────────────────────────────────────────────────── */

function SummaryTile({ label, stat, icon: Icon }) {
  const toneClasses = {
    brand: { icon: "bg-brand-50 text-brand-600", bar: "bg-brand-500" },
    emerald: { icon: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
    amber: { icon: "bg-amber-50 text-amber-600", bar: "bg-amber-500" },
    red: { icon: "bg-red-50 text-red-600", bar: "bg-red-500" },
  }[stat.tone];
  return (
    <Card padded={false}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div
            className={clsx(
              "flex h-11 w-11 items-center justify-center rounded-full",
              toneClasses.icon,
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold text-ink-800">{stat.value}</p>
            <p className="mt-0.5 text-xs text-ink-500">{stat.subtitle}</p>
          </div>
        </div>
      </div>
      {/* progress bar at the bottom of the card */}
      <div className={clsx("h-1", toneClasses.bar)} aria-hidden />
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * IntegrationRow - one row of the table
 * ──────────────────────────────────────────────────────────────────── */

function IntegrationRow({ row, onToggle, onAction }) {
  const NameIcon = ICONS[row.icon] ?? Layers;
  const DetailIcon = ICONS[row.details.icon] ?? Clock;
  const PopupIcon = ICONS[row.popup.icon] ?? Mail;

  return (
    <tr className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50/30 align-top">
      {/* INTEGRATION */}
      <td className="px-4 py-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <NameIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 max-w-xs">
            <p className="text-sm font-bold text-ink-800">{row.name}</p>
            <p className="mt-0.5 text-xs text-ink-500">{row.description}</p>
          </div>
        </div>
      </td>

      {/* REQUEST / STATUS */}
      <td className="px-4 py-4">
        <StatusPill statusKey={row.request.key} />
        <p className="mt-1.5 text-xs text-ink-600">{row.request.detail}</p>
      </td>

      {/* DETAILS */}
      <td className="px-4 py-4">
        <div className="flex items-start gap-2 text-xs text-ink-600">
          <DetailIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" />
          <div>
            <p className="font-medium text-ink-700">
              {row.details.label} <span className="text-ink-400">·</span>
            </p>
            <p>{row.details.value}</p>
          </div>
        </div>
      </td>

      {/* POP-UP / EMAIL */}
      <td className="px-4 py-4">
        <div className="flex items-start gap-2 text-xs text-ink-600">
          <PopupIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400" />
          <span>{row.popup.text}</span>
        </div>
      </td>

      {/* ACTIVATION */}
      <td className="px-4 py-4">
        <StatusPill statusKey={row.activation.key} />
        <p className="mt-1.5 text-xs text-ink-600">{row.activation.detail}</p>
      </td>

      {/* ACTIONS */}
      <td className="px-4 py-4">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onAction}
            className="rounded-lg cursor-pointer bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700"
          >
            {ACTION_LABELS[row.action.type]}
          </button>
          <Toggle enabled={row.activation.enabled} onChange={onToggle} />
          <button
            type="button"
            className="rounded-md cursor-pointer p-1 text-ink-400 hover:bg-ink-100 hover:text-ink-600"
            aria-label="More"
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function StatusPill({ statusKey }) {
  const cls =
    STATUS_PALETTE[statusKey] ?? "bg-ink-100 text-ink-600 border-ink-200";
  const Icon =
    statusKey === "Active" || statusKey === "Connected"
      ? CheckCircle2
      : statusKey === "Inactive"
        ? MinusCircle
        : statusKey === "Action Required"
          ? AlertCircle
          : Clock;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold",
        cls,
      )}
    >
      <Icon className="h-3 w-3" />
      {statusKey}
    </span>
  );
}

function Toggle({ enabled, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onChange}
      className={clsx(
        "relative cursor-pointer inline-flex h-5 w-9 items-center rounded-full transition-colors",
        enabled ? "bg-brand-600" : "bg-ink-300",
      )}
    >
      <span
        className={clsx(
          "inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
          enabled ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────
 * Add New Integration modal
 * ──────────────────────────────────────────────────────────────────── */

function AddIntegrationModal({ isOpen, onClose }) {
  const [form, setForm] = useState({
    name: "",
    category: "",
    apiKey: "",
    notes: "",
  });
  const [errors, setErrors] = useState({});

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit() {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Integration name is required";
    if (!form.category) nextErrors.category = "Select a category";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    // TODO: BACKEND INTEGRATION - integrationsApi.create(form)
    showToast.success(`Integration “${form.name}” added.`);
    setForm({ name: "", category: "", apiKey: "", notes: "" });
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={
        <span className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Plus className="h-5 w-5" />
          </span>
          <span>Add New Integration</span>
        </span>
      }
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Add Integration</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="Integration Name *"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          placeholder="e.g. FreshBooks, Xero, Slack..."
          error={errors.name}
        />
        <Select
          label="Category *"
          value={form.category}
          onChange={(e) => update("category", e.target.value)}
          options={CATEGORY_OPTIONS.filter((o) => o.value)}
          placeholder="Select category"
          error={errors.category}
        />
        <Input
          label="API Key / Credentials"
          value={form.apiKey}
          onChange={(e) => update("apiKey", e.target.value)}
          placeholder="Paste your API key (optional)"
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-ink-700">
            Notes{" "}
            <span className="text-xs font-normal text-ink-500">(Optional)</span>
          </label>
          <Textarea
            rows={3}
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            placeholder="What should this integration do?"
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-700 placeholder:text-ink-400 focus-visible:outline-2 focus-visible:outline-brand-500"
          />
        </div>
      </div>
    </Modal>
  );
}
