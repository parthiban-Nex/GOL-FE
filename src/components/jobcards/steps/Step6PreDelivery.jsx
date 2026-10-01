import { useState } from "react";
import clsx from "clsx";
import { Play, Trash2, Plus } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import DamageMarkerCard from "@/components/jobcards/DamageMarkerCard";
import Step2InventoryInspection from "@/components/jobcards/steps/Step2InventoryInspection";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { jobCardSubstatusApi, otdFailureReasonApi } from "@/services";

export default function Step6PreDelivery({ jobcard, onChange }) {
  const [videoTitle, setVideoTitle] = useState("Water Wash Completed Session");

  // GET /jobCard/getTransactionSubstatuses -> [{ id, title }]
  const statusOptions = useDropdownOptions(
    () => jobCardSubstatusApi.getAll(),
    (s) => ({ value: String(s.id), label: s.title }),
    jobCardSubstatusApi.listKey,
  );
  // GET /jobCard/getOTDFailureReasons -> OTDFailureReasonsData
  const subStatusOptions = useDropdownOptions(
    () => otdFailureReasonApi.getAll(),
    (r) => ({
      value: String(r.id),
      label: r.title ?? r.reason ?? r.name ?? String(r.id),
    }),
    otdFailureReasonApi.listKey,
  );

  function updateReturn(id, name) {
    onChange({
      ...jobcard,
      returnOldParts: jobcard.returnOldParts.map((p) =>
        p.id === id ? { ...p, name } : p,
      ),
    });
  }
  function addReturn() {
    onChange({
      ...jobcard,
      returnOldParts: [
        ...jobcard.returnOldParts,
        { id: `r-${Date.now()}`, name: "" },
      ],
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-end gap-3 sm:flex-row">
        <div className="w-full sm:w-48">
          <Select
            label="Status"
            placeholder="Select status"
            value={jobcard.deliverySubstatusId ?? ""}
            onChange={(e) =>
              onChange({ ...jobcard, deliverySubstatusId: e.target.value })
            }
            options={statusOptions}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            label="Sub Status"
            placeholder={
              subStatusOptions.length
                ? "Select sub status"
                : "No reasons available"
            }
            value={jobcard.otdFailureReasonId ?? ""}
            onChange={(e) =>
              onChange({ ...jobcard, otdFailureReasonId: e.target.value })
            }
            options={subStatusOptions}
            disabled={subStatusOptions.length === 0}
          />
        </div>
      </div>

      <h2 className="text-base font-semibold text-ink-800">
        Pre Delivery Checklist
      </h2>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Left column: reuses Step 2's UI (minus its own sidebar since we render our own here). */}
        <div className="space-y-4">
          <InlineInventoryInspection jobcard={jobcard} onChange={onChange} />

          {/* Return Old Parts section (unique to Step 6). */}
          <section className="rounded-xl border border-ink-100 p-5">
            <h3 className="mb-3 text-base font-semibold text-ink-800">
              Return Old Parts
            </h3>
            {jobcard.returnOldParts.map((r) => (
              <div
                key={r.id}
                className="mb-2 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_100px] sm:items-center"
              >
                <Input
                  value={r.name}
                  onChange={(e) => updateReturn(r.id, e.target.value)}
                />
                <Input placeholder="Add Parts" />
                <Button variant="primary" size="sm">
                  Add
                </Button>
              </div>
            ))}
            <button
              type="button"
              onClick={addReturn}
              className="mt-3 inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
            >
              <Plus className="h-4 w-4" /> Add New
            </button>
          </section>

          <PaymentRecap payment={jobcard.payment} />
        </div>

        {/* Right column: damage marker + video uploads */}
        <div className="space-y-4">
          <DamageMarkerCard
            jobcardId="JC-2405-0348"
            statusLabel="Completed"
            imagesLabel="Vehicle Images (After Repair work)"
            images={jobcard.vehicleImages ?? []}
            templateImage={jobcard.markingBaseImage || undefined}
            marks={jobcard.damageMarks ?? []}
            readOnly
          />

          <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
            <p className="mb-2 text-sm font-medium text-ink-700">
              Add Video Title / Label
            </p>
            <Input
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
            />
            <button className="mt-3 w-full rounded-lg border border-brand-500 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50">
              Upload
            </button>
          </div>

          <VideoCard
            title="Water Wash Video"
            hint="Record or upload the video"
            videoLen="00:45"
            uploadedAt="16 May 2024, 09:45 AM"
          />
          <VideoCard
            title="Ready for Delivery Video"
            hint="Record or upload the video"
            videoLen="00:30"
            uploadedAt="16 May 2024, 10:20 AM"
          />
        </div>
      </div>
    </div>
  );
}

function InlineInventoryInspection({ jobcard, onChange }) {
  return (
    <div className="[&_.jc-side]:hidden">
      <Step2InventoryInspection
        jobcard={jobcard}
        onChange={onChange}
        hideSidebar
      />
    </div>
  );
}

function PaymentRecap({ payment }) {
  return (
    <section className="rounded-xl border border-ink-100 p-5">
      <h3 className="mb-1 flex items-center gap-2 text-base font-semibold text-ink-800">
        Payment Details
      </h3>
      <p className="mb-4 text-xs text-ink-500">
        Record payment received from customer
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Input label="Payment Mode *" value={payment.mode} readOnly />
        <Input label="Payment Date *" value={payment.date} readOnly />
        <Input label="Amount Received *" value={payment.received} readOnly />
        <Input label="Balance Amount" value={payment.balance} readOnly />
        <Input label="UPI ID" value={payment.upi} readOnly />
        <Input label="Remarks (Optional)" value={payment.remarks} readOnly />
      </div>
    </section>
  );
}

function VideoCard({ title, hint, videoLen, uploadedAt }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
      <p className="text-sm font-semibold text-ink-800">{title}</p>
      <p className="mb-3 text-xs text-ink-500">{hint}</p>
      <div className="flex items-center gap-3">
        <div className="relative inline-flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-ink-800">
          <Play className="h-5 w-5 text-white" />
          <span className="absolute bottom-1 right-1 rounded-sm bg-ink-900/70 px-1 text-[10px] font-medium text-white">
            {videoLen}
          </span>
        </div>
        <div className="min-w-0 flex-1 text-xs">
          <p className="flex items-center gap-1 text-emerald-600">
            <span className="inline-block h-3.5 w-3.5 rounded-full bg-emerald-500 text-white text-[10px] leading-3 text-center">
              ✓
            </span>
            Uploaded
          </p>
          <p className="mt-1 text-ink-500">{uploadedAt}</p>
          <button className="mt-1 text-brand-700 hover:text-brand-800 cursor-pointer inline-flex items-center gap-1 text-xs font-semibold">
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
