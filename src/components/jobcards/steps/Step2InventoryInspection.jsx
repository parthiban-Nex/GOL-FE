import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { Fuel, CheckCircle2, Loader2, Plus } from "lucide-react";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import DamageMarkerCard from "@/components/jobcards/DamageMarkerCard";
import { inspectionCheckListApi, inventoryCheckListApi } from "@/services";
import { extractList, isSuccess } from "@/utils/apiResponse";
import {
  mapInspectionChecklist,
  mapInventoryItem,
} from "@/utils/jobCardPayload";

const CHECKLIST_TYPE = "CHK_LIST_MAJOR";

/** Rating button colour from its label (Good / Average / Fair ...); any
 *  other label falls back to its position (1st green, 2nd amber, 3rd red). */
const RATING_STYLES = {
  green: "bg-emerald-500 border-emerald-500 text-white",
  orange: "bg-amber-500 border-amber-500 text-white",
  red: "bg-red-500 border-red-500 text-white",
};
function ratingColor(label, index) {
  const l = String(label).toLowerCase();
  if (/good|ok|excellent/.test(l)) return "green";
  if (/average|moderate|medium/.test(l)) return "orange";
  if (/fair|poor|bad|replace|critical/.test(l)) return "red";
  return ["green", "orange", "red"][index] ?? "red";
}

/** Step 2 - Inventory & Inspection. Big screen; split into three parts. */
export default function Step2InventoryInspection({
  jobcard,
  onChange,
  hideSidebar = false,
}) {
  const [inspectionTab, setInspectionTab] = useState("All");

  const inv = jobcard.inventory;
  const insp = jobcard.inspection;

  // Every update is a function of the LATEST job card (setJobcard(prev =>
  // ...)). Both checklists load at the same time; writing a copy of the
  // job card from the last render let the second response overwrite the
  // first one's data, so the chips or the checklist sometimes vanished.
  // `patch` may itself be a function of the current section.
  function update(fn) {
    onChange((prev) => fn(prev));
  }
  function patchInventory(patch) {
    update((prev) => {
      const current = prev.inventory ?? {};
      const next = typeof patch === "function" ? patch(current) : patch;
      return { ...prev, inventory: { ...current, ...next } };
    });
  }

  // Inventory chips - POST /inventoryCheckList/listInventoryCheckList,
  // once per job card. The list is kept on the job card (`catalog`) so the
  // save can send each ticked item's code / version / type.
  const vehicleType = jobcard.vehicleType || "CAR";
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [inventoryError, setInventoryError] = useState("");
  useEffect(() => {
    if (inv.catalog?.length) return undefined;
    let cancelled = false;
    setIsLoadingInventory(true);
    setInventoryError("");
    inventoryCheckListApi
      .list({ vehicleType, searchKey: "", offset: 0, limit: 100 })
      .then((res) => {
        if (cancelled) return;
        const items = extractList(res, inventoryCheckListApi.listKey)
          .map(mapInventoryItem)
          .filter((i) => i.code && i.active)
          .sort((x, y) => x.sortOrder - y.sortOrder);
        patchInventory({ catalog: items });
      })
      .catch((err) => {
        if (!cancelled)
          setInventoryError(
            err.message || "Couldn't load the inventory checklist.",
          );
      })
      .finally(() => {
        if (!cancelled) setIsLoadingInventory(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleType]);

  function toggleInventory(code) {
    patchInventory((inv) => {
      const checked = inv.checked ?? [];
      return {
        checked: checked.includes(code)
          ? checked.filter((c) => c !== code)
          : [...checked, code],
      };
    });
  }
  // Inspection checklist - POST /inspectionCheckList/getInspectionChecklist
  // { checkListTypeCode }, once per job card (kept on jobcard.inspection).
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(false);
  const [checklistError, setChecklistError] = useState("");
  function patchInspection(patch) {
    update((prev) => {
      const current = prev.inspection ?? {};
      const next = typeof patch === "function" ? patch(current) : patch;
      return { ...prev, inspection: { ...current, ...next } };
    });
  }
  useEffect(() => {
    if (insp.checklist?.categories?.length) return undefined;
    let cancelled = false;
    setIsLoadingChecklist(true);
    setChecklistError("");
    inspectionCheckListApi
      .get(CHECKLIST_TYPE)
      .then((res) => {
        if (cancelled) return;
        if (!isSuccess(res)) {
          setChecklistError(
            res?.message || "Couldn't load the inspection checklist.",
          );
          return;
        }
        patchInspection({ checklist: mapInspectionChecklist(res) });
      })
      .catch((err) => {
        if (!cancelled) {
          setChecklistError(
            err.message || "Couldn't load the inspection checklist.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingChecklist(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ratings: { [paramCode]: ratingReasonCode }; tapping the chosen
  // rating again clears it.
  function setRating(paramCode, ratingReasonCode) {
    patchInspection((insp) => {
      const next = { ...(insp.ratings ?? {}) };
      if (next[paramCode] === ratingReasonCode) delete next[paramCode];
      else next[paramCode] = ratingReasonCode;
      return { ratings: next };
    });
  }
  function addComplaint() {
    update((prev) => ({
      ...prev,
      complaints: [
        ...(prev.complaints ?? []),
        { id: `c-${Date.now()}`, complaint: "", advice: "", attended: false },
      ],
    }));
  }
  function updateComplaint(id, field, value) {
    update((prev) => ({
      ...prev,
      complaints: (prev.complaints ?? []).map((c) =>
        c.id === id ? { ...c, [field]: value } : c,
      ),
    }));
  }

  const categories = insp.checklist?.categories ?? [];
  const tabs = ["All", ...categories.map((c) => c.name)];
  const activeTab = tabs.includes(inspectionTab) ? inspectionTab : "All";
  const visibleItems =
    activeTab === "All"
      ? categories.flatMap((c) => c.checkpoints)
      : (categories.find((c) => c.name === activeTab)?.checkpoints ?? []);
  const columnLength = Math.ceil(visibleItems.length / 2);
  const leftCol = visibleItems.slice(0, columnLength);
  const rightCol = visibleItems.slice(columnLength);

  return (
    <div
      className={
        hideSidebar ? "" : "grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]"
      }
    >
      <div className="space-y-4">
        <InventoryChecklist
          inv={inv}
          items={inv.catalog ?? []}
          isLoading={isLoadingInventory}
          error={inventoryError}
          onOdo={(v) => patchInventory({ odometer: v })}
          onFuel={(v) => patchInventory({ fuelLevel: v })}
          onToggle={toggleInventory}
        />

        <InspectionCard
          tabs={tabs}
          tab={activeTab}
          onTab={setInspectionTab}
          leftCol={leftCol}
          rightCol={rightCol}
          ratings={insp.ratings ?? {}}
          onRate={setRating}
          isLoading={isLoadingChecklist}
          error={checklistError}
          isEmpty={visibleItems.length === 0}
          notes={insp.notes ?? ""}
          onNotes={(v) => patchInspection({ notes: v })}
        />

        <ComplaintsCard
          complaints={jobcard.complaints}
          onUpdate={updateComplaint}
          onAdd={addComplaint}
        />
      </div>

      {!hideSidebar && (
        <DamageMarkerCard
          jobcardId="JC-2405-0348"
          timestamp="16 May 2024, 10:30 AM"
          statusLabel="In Progress"
          images={jobcard.vehicleImages ?? []}
          templateImage={jobcard.markingBaseImage || undefined}
          marks={jobcard.damageMarks ?? []}
          onMarksChange={(damageMarks) =>
            update((prev) => ({ ...prev, damageMarks }))
          }
          previousMarkedImages={jobcard.previousMarkedImages ?? []}
        />
      )}
    </div>
  );
}

function InventoryChecklist({
  inv,
  items,
  isLoading,
  error,
  onOdo,
  onFuel,
  onToggle,
}) {
  const checked = inv.checked ?? [];
  return (
    <section className="rounded-xl border border-ink-100 p-5">
      <h3 className="mb-4 text-base font-semibold text-ink-800">
        Car Inventory Checklist
      </h3>

      <div className="grid gap-5 md:grid-cols-[220px_1fr]">
        <div>
          {/* Fuel gauge, then the odometer. */}
          <FuelGauge value={inv.fuelLevel ?? 0} onChange={onFuel} />
          <p className="mb-1.5 mt-3 text-sm font-medium text-ink-700">
            Odometer Reading
          </p>
          <Input
            inputMode="numeric"
            value={inv.odometer ?? ""}
            onChange={(e) =>
              onOdo(e.target.value.replace(/\D/g, "").slice(0, 7))
            }
            placeholder="e.g. 23859 KM"
          />
        </div>

        <div className="flex flex-wrap gap-2 content-start">
          {isLoading ? (
            <p className="flex items-center gap-2 text-sm text-ink-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading checklist...
            </p>
          ) : error ? (
            <p className="text-sm text-danger-500">{error}</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-ink-500">
              No inventory items for this vehicle type.
            </p>
          ) : (
            items.map((item) => {
              const active = checked.includes(item.code);
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => onToggle(item.code)}
                  aria-pressed={active}
                  className={clsx(
                    "rounded-md border cursor-pointer px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50",
                  )}
                >
                  {item.label}
                </button>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

/** Half-circle fuel gauge, pure SVG — ticks inside the arc, E/F level with arc base. */
function FuelGauge({ value = 0, onChange }) {
  const clamped = Math.min(1, Math.max(0, Number(value) || 0));
  const percent = Math.round(clamped * 100);
  const svgRef = useRef(null);
  const draggingRef = useRef(false);

  // Pointer position -> fraction along the arc (E = 0, F = 1), 5% steps.
  function fractionFromPointer(e) {
    const svg = svgRef.current;
    if (!svg) return clamped;
    const box = svg.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * 200;
    const y = ((e.clientY - box.top) / box.height) * 120;
    let angle = (Math.atan2(100 - y, x - 100) * 180) / Math.PI; // 180 = E, 0 = F
    if (angle < 0) angle = x < 100 ? 180 : 0; // below the base line
    const f = 1 - angle / 180;
    return Math.round(Math.min(1, Math.max(0, f)) * 20) / 20;
  }
  function onPointerDown(e) {
    if (!onChange) return;
    draggingRef.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    onChange(fractionFromPointer(e));
  }
  function onPointerMove(e) {
    if (draggingRef.current) onChange(fractionFromPointer(e));
  }
  function onPointerUp() {
    draggingRef.current = false;
  }
  function onKeyDown(e) {
    if (!onChange) return;
    const step =
      e.key === "ArrowRight" || e.key === "ArrowUp"
        ? 0.05
        : e.key === "ArrowLeft" || e.key === "ArrowDown"
          ? -0.05
          : 0;
    if (!step) return;
    e.preventDefault();
    onChange(Math.round(Math.min(1, Math.max(0, clamped + step)) * 20) / 20);
  }

  const cx = 100;
  const cy = 100;
  const R = 80;

  // f=0 -> E (left, 180deg), f=1 -> F (right, 0deg), sweeping over the top
  const angleForFraction = (f) => 180 - f * 180;
  const pointOnArc = (f, radius = R) => {
    const rad = (angleForFraction(f) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy - radius * Math.sin(rad) };
  };

  const knob = pointOnArc(clamped, R);
  const arcLength = Math.PI * R; // half circumference
  const dashLength = clamped * arcLength;

  const ticks = [
    { f: 0.25, label: "1/4" },
    { f: 0.5, label: "1/2" },
    { f: 0.75, label: "3/4" },
  ];

  return (
    <div className="relative mx-auto max-w-[220px]">
      <svg
        ref={svgRef}
        viewBox="0 0 200 120"
        className={clsx(
          // No browser focus box on click / drag; keyboard users (Tab) get
          // a soft ring instead.
          "w-full touch-none select-none rounded-md outline-none focus:outline-none",
          "focus-visible:ring-2 focus-visible:ring-brand-300",
          onChange && "cursor-pointer",
        )}
        role="slider"
        tabIndex={onChange ? 0 : -1}
        aria-label="Fuel level"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-valuetext={`${percent}%`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
      >
        <defs>
          <linearGradient id="fuelGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="45%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#e5e7eb" />
          </linearGradient>
        </defs>

        {/* background track */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#f3f4f6"
          strokeWidth="16"
          strokeLinecap="round"
        />

        {/* filled gradient arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#fuelGrad)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${dashLength} ${arcLength}`}
        />

        {/* quarter tick labels — sit just inside the arc, closer to center */}
        {ticks.map((t) => {
          const p = pointOnArc(t.f, R - 22);
          return (
            <text
              key={t.label}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-ink-400"
              fontSize="10"
              fontWeight="500"
            >
              {t.label}
            </text>
          );
        })}

        {/* E / F labels — level with the arc's base line */}
        <text
          x="18"
          y="120"
          textAnchor="middle"
          className="fill-ink-900"
          fontSize="11"
          fontWeight="600"
        >
          E
        </text>
        <text
          x="182"
          y="120"
          textAnchor="middle"
          className="fill-ink-900"
          fontSize="11"
          fontWeight="600"
        >
          F
        </text>

        {/* knob sitting directly on the arc */}
        <circle
          cx={knob.x}
          cy={knob.y}
          r="9"
          fill="#ffffff"
          stroke="#d1d5db"
          strokeWidth="2"
        />
      </svg>

      <p className="-mt-3 flex items-center justify-center gap-1.5 text-base font-bold text-ink-900">
        <Fuel className="h-4 w-4 text-brand-600" /> {percent}%
      </p>
      <p className="text-center text-xs text-ink-500">
        Fuel Level{onChange ? " - drag or tap the gauge" : ""}
      </p>
    </div>
  );
}
function InspectionCard({
  tabs,
  tab,
  onTab,
  leftCol,
  rightCol,
  ratings,
  onRate,
  isLoading,
  error,
  isEmpty,
  notes,
  onNotes,
}) {
  return (
    <section className="rounded-xl border border-ink-100 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-ink-800">
          Inspection Checklist
        </h3>
        <div className="flex items-center gap-2 text-xs">
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-600">
            Good
          </span>
          <span className="rounded-md bg-amber-50 px-2 py-0.5 font-medium text-amber-600">
            Average
          </span>
          <span className="rounded-md bg-red-50 px-2 py-0.5 font-medium text-red-600">
            Fair
          </span>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onTab(t)}
            className={clsx(
              "rounded-md border cursor-pointer px-3 py-1.5 text-sm font-medium transition-colors",
              tab === t
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-ink-200 bg-white text-ink-600 hover:bg-ink-50",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="flex items-center gap-2 py-4 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading checklist...
        </p>
      ) : error ? (
        <p className="py-4 text-sm text-danger-500">{error}</p>
      ) : isEmpty ? (
        <p className="py-4 text-sm text-ink-500">No checkpoints in {tab}.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <InspectionColumn items={leftCol} ratings={ratings} onRate={onRate} />
          <InspectionColumn
            items={rightCol}
            ratings={ratings}
            onRate={onRate}
          />
        </div>
      )}

      <div className="relative mt-5">
        <Textarea
          label=" Inspection Notes (Internal)"
          value={notes}
          onChange={(e) => onNotes(e.target.value)}
          placeholder="Add inspection notes (Internal use only)"
          rows={3}
          maxLength={250}
          className="pr-14"
        />
        <span className="pointer-events-none absolute bottom-2 right-3 text-[11px] text-ink-400">
          {notes.length}/250
        </span>
      </div>
    </section>
  );
}

/** One checkpoint per row; one button per ratingOption (some checkpoints
 *  have only Good / Average). */
function InspectionColumn({ items, ratings, onRate }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-ink-500">
        <span>Item</span>
        <span>Status</span>
      </div>
      <ul className="space-y-2.5">
        {items.map((cp) => {
          const chosen = ratings[cp.paramCode];
          return (
            <li
              key={cp.paramCode}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="flex items-center gap-2 text-ink-900">
                <CheckCircle2
                  className={clsx(
                    "h-4 w-4",
                    chosen ? "text-emerald-500" : "text-ink-400",
                  )}
                />
                {cp.name}
              </span>
              <div className="flex items-center gap-2">
                {cp.options.map((opt, i) => {
                  const active = chosen === opt.code;
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => onRate(cp.paramCode, opt.code)}
                      aria-label={`${cp.name}: ${opt.label}`}
                      aria-pressed={active}
                      title={opt.label}
                      className={clsx(
                        "h-5 w-5 cursor-pointer rounded-full border transition-all",
                        active
                          ? RATING_STYLES[ratingColor(opt.label, i)]
                          : "border-ink-200 bg-white hover:bg-ink-50",
                      )}
                    >
                      {active && (
                        <svg viewBox="0 0 12 12" className="mx-auto h-3 w-3">
                          <path
                            d="M2 6.5l2.5 2.5L10 3"
                            stroke="currentColor"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ComplaintsCard({ complaints, onUpdate, onAdd }) {
  return (
    <section className="rounded-xl border border-ink-100 p-5">
      <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_120px]">
        <p className="text-sm font-medium text-ink-700">Customer Complaints</p>
        <p className="text-sm font-medium text-ink-700">Service Advice</p>
        <p className="text-sm font-medium text-ink-700">Attended</p>
      </div>
      <div className="space-y-3">
        {complaints.map((c) => (
          <div
            key={c.id}
            className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_120px] md:items-center"
          >
            <Input
              value={c.complaint}
              onChange={(e) => onUpdate(c.id, "complaint", e.target.value)}
              placeholder="Complaint"
            />
            <Input
              value={c.advice}
              onChange={(e) => onUpdate(c.id, "advice", e.target.value)}
              placeholder="Service advice"
            />
            <div className="flex items-center gap-2">
              <span
                className={clsx(
                  "text-sm",
                  !c.attended ? "font-semibold text-ink-800" : "text-ink-400",
                )}
              >
                No
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={c.attended}
                onClick={() => onUpdate(c.id, "attended", !c.attended)}
                className={clsx(
                  "relative h-6 w-11  cursor-pointer rounded-full transition-colors",
                  c.attended ? "bg-brand-500" : "bg-ink-300",
                )}
              >
                <span
                  className={clsx(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    c.attended ? "translate-x-0" : "-translate-x-5",
                  )}
                />
              </button>
              <span
                className={clsx(
                  "text-sm",
                  c.attended ? "font-semibold text-ink-800" : "text-ink-400",
                )}
              >
                Yes
              </span>
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 cursor-pointer inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
      >
        <Plus className="h-4 w-4 " /> Add New
      </button>
    </section>
  );
}
