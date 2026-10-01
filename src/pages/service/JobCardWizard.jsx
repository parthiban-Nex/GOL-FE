import { useMemo, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import Card from "@/components/ui/Card";
import JobCardHeader from "@/components/jobcards/JobCardHeader";
import JobCardStepper, {
  JOBCARD_STEPS,
} from "@/components/jobcards/JobCardStepper";
import WizardFooter from "@/components/jobcards/WizardFooter";
import Step1CustomerVehicle from "@/components/jobcards/steps/Step1CustomerVehicle";
import Step2InventoryInspection from "@/components/jobcards/steps/Step2InventoryInspection";
import Step3LabourParts from "@/components/jobcards/steps/Step3LabourParts";
import Step4EstimateApproval from "@/components/jobcards/steps/Step4EstimateApproval";
import Step5AssignTechnician from "@/components/jobcards/steps/Step5AssignTechnician";
import Step6PreDelivery from "@/components/jobcards/steps/Step6PreDelivery";
import Step7Bill from "@/components/jobcards/steps/Step7Bill";
import JobCardSummaryCard from "@/components/jobcards/JobCardSummaryCard";
import { initialJobCardDetail } from "@/pages/service/mockJobCards";
import { estimateApi, jobCardApi } from "@/services";
import { isSuccess, responseMessage } from "@/utils/apiResponse";
import { validate, isRequired, isMobile } from "@/utils/validators";
import {
  buildInitialJobCardPayload,
  buildInspectionPayload,
  idsFromInitialJobCard,
  unratedRequiredCheckpoints,
} from "@/utils/jobCardPayload";
import {
  buildUpdatePayload,
  detailToWizard,
  keepLineIdentity,
  linesSignature,
  mapEstimateDetail,
  withoutTaxKept,
} from "@/utils/estimateDetail";
import { openPdfResponse } from "@/utils/pdf";
import { CarLayout } from "@/assets/images";
import { buildMarkedImageFile } from "@/utils/markedImage";
import { showToast } from "@/utils/toast";
import { DEFAULT_FUEL_TYPE } from "@/constants/vehicleEnums";
import { resolveLineItemContext } from "@/utils/lineItemContext";

const STEP_META = {
  customer: {
    rightLabel: "Customer & Vehicle",
    rightDetail: "Add Customer details",
    showTotals: false,
    showSavings: false,
    primaryLabel: "Continue",
  },
  inspection: {
    rightLabel: "Inventory & Inspection",
    rightDetail: "Add Inventory & Inspection",
    showTotals: false,
    showSavings: false,
    primaryLabel: "Continue",
  },
  parts: {
    rightLabel: "Labour & Parts",
    rightDetail: "Add Labour & Parts",
    showTotals: false,
    showSavings: true,
    primaryLabel: "Update",
  },
  approval: {
    rightLabel: "Estimate & Approval",
    rightDetail: "Estimate Approval",
    showTotals: false,
    showSavings: false,
    primaryLabel: "Update",
  },
  technician: {
    rightLabel: "Repair Work",
    rightDetail: "Assign Technician",
    showTotals: true,
    showSavings: true,
    primaryLabel: "Update",
  },
  repair: {
    rightLabel: "Repair Work",
    rightDetail: "Re-Estimate & Approval",
    showTotals: true,
    showSavings: true,
    primaryLabel: "Update",
  },
  bill: {
    rightLabel: "Repair Work",
    rightDetail: "Billing",
    showTotals: false,
    showSavings: true,
    primaryLabel: "Complete",
  },
};
/** Comparable form of the marks - ignores the client-only ids. */
function marksSignature(marks = []) {
  return JSON.stringify(marks.map(({ type, x, y }) => [type, x, y]));
}

/**
 * Image the user marks on.
 *  - Saved coordinates -> the clean template, marks drawn over it, so old
 *    marks can still be erased.
 *  - Only a saved marked image -> that image is the base (its old marks
 *    are part of the picture); new marks go on top of it.
 *  - Nothing saved -> the configured template.
 */
function resolveMarkingBase({ templateImage, markedImageUrl, damageMarks }) {
  if (damageMarks?.length) return templateImage || CarLayout;
  return markedImageUrl || templateImage || CarLayout;
}

const emptyCustomer = {
  name: "",
  mobile: "",
  pincode: "",
  address: "",
  regNo: "",
  make: "",
  model: "",
  fuel: DEFAULT_FUEL_TYPE,
  makeId: null,
  modelId: null,
  modelSegment: "",
  customerState: "",
  customerId: null,
  vehicleId: null,
};

/** Step 2 starts empty: no mock fuel level, odometer or ticked items, and
 *  no inspection ratings (the inspection item list itself stays). */
function emptyInspectionState() {
  return {
    inventory: { fuelLevel: 0, odometer: "", checked: [], catalog: [] },
    // checklist comes from getInspectionChecklist; ratings are
    // { [paramCode]: ratingReasonCode }.
    inspection: { checklist: null, ratings: {}, notes: "" },
  };
}

/** Insurance + surveyor fields, all empty (no dummy values). */
const emptyJobcardInsurance = {
  location: "",
  insurer: "",
  insuranceId: null,
  areaName: "",
  pincode: "",
  city: "",
  claimNo: "",
  gstin: "",
  policyNo: "",
  expiryDate: "",
  surveyorName: "",
  surveyorMobile: "",
  surveyorEmail: "",
  estimatedCost: "",
  surveyorIntimatedDate: "",
  surveyorProposedDate: "",
  surveyorVisitedDate: "",
  surveyorApprovedDate: "",
};

/** Empty-state jobcard used when no row is passed (Create Jobcard). */
function makeEmptyJobcard() {
  return {
    ...initialJobCardDetail,
    // No number until createInitialPortalJobCard returns one.
    id: "",
    transactionId: null,
    estimateId: null,
    // Step 3 starts empty - items come from the search (no dummy lines).
    parts: [],
    labour: [],
    osl: [],
    customer: { ...emptyCustomer },
    technicians: [],
    insuranceEnabled: false,
    insurance: { ...emptyJobcardInsurance },
    ...emptyInspectionState(),
    markingBaseImage: CarLayout,
    damageMarks: [],
    previousMarkedImages: [],
  };
}

export default function JobCardWizard({
  jobcardRow = null,
  initialStep = "customer",
  onClose,
}) {
  // TODO: BACKEND INTEGRATION - jobCardApi.get(jobcardRow.id) to preload.
  // Saved marking data is read from the row (templateImage,
  // markedImageUrl, damageMarks, previousMarkedImages) until
  // jobCardApi.get() / getPreviousMarkedImages() are connected - the
  // backend field names get mapped onto these then.
  const [jobcard, setJobcard] = useState(() =>
    jobcardRow
      ? {
          ...initialJobCardDetail,
          id: jobcardRow.id ?? initialJobCardDetail.id,
          // listJobCards_v1 `id` - the transaction id the job card APIs use.
          transactionId: jobcardRow.jobcardId ?? null,
          estimateId: jobcardRow.estimateId ?? null,
          ...emptyInspectionState(),
          // No dummy insurance - off until the user switches it on.
          insuranceEnabled: false,
          insurance: { ...emptyJobcardInsurance },
          // Step 3 starts empty - no dummy parts / labour / OSL.
          parts: [],
          labour: [],
          osl: [],
          customer: {
            ...emptyCustomer,
            name: jobcardRow.customer?.name ?? "",
            regNo: jobcardRow.customer?.regNo ?? "",
            make: jobcardRow.customer?.make ?? "",
            model: jobcardRow.customer?.model ?? "",
            vehicleId: jobcardRow.vehicleId ?? null,
          },
          // Loaded from getMechanicMapping in Step 5.
          technicians: [],
          markingBaseImage: resolveMarkingBase(jobcardRow),
          damageMarks: jobcardRow.damageMarks ?? [],
          previousMarkedImages: jobcardRow.previousMarkedImages ?? [],
        }
      : makeEmptyJobcard(),
  );

  // Last marks the backend has - nothing is sent until Continue / Save,
  // and only when the marks differ from this.
  const savedMarksRef = useRef(marksSignature(jobcard.damageMarks));
  const [isSaving, setIsSaving] = useState(false);

  // Step 3 Add -> getEstimateLineItemDetails needs customerState +
  // modelSegment, found the same way as in the Estimate wizard.
  const jobcardRef = useRef(jobcard);
  jobcardRef.current = jobcard;
  const contextCacheRef = useRef({});
  async function getLineItemContext() {
    const c = jobcardRef.current.customer ?? {};
    const context = await resolveLineItemContext(c, contextCacheRef.current);
    if (
      context.customerState !== (c.customerState ?? "") ||
      context.modelSegment !== (c.modelSegment ?? "")
    ) {
      setJobcard((prev) => ({
        ...prev,
        customer: { ...prev.customer, ...context },
      }));
    }
    return context;
  }

  const step1Rules = {
    name: [[isRequired, "Name is required."]],
    mobile: [
      [isRequired, "Mobile is required."],
      [isMobile, "Enter a valid 10-digit mobile number."],
    ],
    regNo: [[isRequired, "Registration number is required."]],
  };

  // Step 1 Save / Add -> POST /jobCard/createInitialPortalJobCard (once;
  // an opened job card already exists, so it just moves on).
  async function saveCustomerStep({ advance }) {
    const current = jobcardRef.current;
    if (current.transactionId) {
      if (advance) goNext();
      else showToast.success("This job card is already created.");
      return;
    }
    const errs = validate(current.customer ?? {}, step1Rules);
    if (Object.keys(errs).length) {
      showToast.error(Object.values(errs)[0]);
      return;
    }
    setIsSaving(true);
    try {
      const response = await jobCardApi.createInitialPortalJobCard(
        buildInitialJobCardPayload(current),
      );
      if (!isSuccess(response)) {
        showToast.error(
          responseMessage(response, "Couldn't create the job card."),
        );
        return;
      }
      const ids = idsFromInitialJobCard(response);
      setJobcard((prev) => ({
        ...prev,
        id: ids.jobCardNo ?? prev.id,
        transactionId: ids.transactionId ?? prev.transactionId,
        estimateId: ids.estimateId ?? prev.estimateId,
        customer: {
          ...prev.customer,
          customerId: ids.customerId ?? prev.customer.customerId,
          vehicleId: ids.vehicleId ?? prev.customer.vehicleId,
        },
      }));
      showToast.success(responseMessage(response, "Job card created."));
      if (advance) goNext();
    } catch (err) {
      showToast.error(err.message || "Couldn't create the job card.");
    } finally {
      setIsSaving(false);
    }
  }

  // ---- Estimate calls (job card lines / GST / share / PDF) ----
  const [isGstSaving, setIsGstSaving] = useState(false);
  const [busyAction, setBusyAction] = useState(null); // "whatsapp" | "pdf"

  /** Lines from GET /serviceEstimate/getEstimate?id= (ids / codes kept). */
  // Lines as last loaded from getEstimate (null until the first load).
  const savedLinesSigRef = useRef(null);

  async function reloadLinesFromEstimate(estimateId) {
    const response = await estimateApi.get(estimateId);
    if (!isSuccess(response) || !response?.data) {
      showToast.error(
        responseMessage(
          response,
          "GST saved, but the lines couldn't be refreshed.",
        ),
      );
      return;
    }
    const detail = mapEstimateDetail(response.data);
    const saved = detailToWizard(detail);
    const strip = withoutTaxKept;
    const prev = jobcardRef.current;
    // getEstimate gstStatus drives the toggle; with GST off the lines
    // come back with 0 tax, so the rates on screen are kept.
    const gstOn = detail.gstStatus ?? prev.includeGST;
    const keepTax = !gstOn;
    const parts = keepLineIdentity(saved.parts, prev.parts ?? [], {
      codeKey: "partNo",
      nameKey: "name",
      hsnKey: "hsn",
      keepTax,
    }).map(strip);
    const labour = keepLineIdentity(saved.labour, prev.labour ?? [], {
      codeKey: "code",
      nameKey: "description",
      hsnKey: "sac",
      keepTax,
    }).map(strip);
    // No OSL in the response -> keep the OSL lines on screen.
    const osl = detail.hasOsl
      ? keepLineIdentity(saved.osl, prev.osl ?? [], {
          codeKey: "code",
          nameKey: "description",
          hsnKey: "sac",
          keepTax,
        }).map(strip)
      : (prev.osl ?? []);
    savedLinesSigRef.current = linesSignature({ parts, labour, osl });
    setJobcard((current) => ({
      ...current,
      includeGST: gstOn,
      parts,
      labour,
      osl,
    }));
  }

  /** Id sent to the estimate APIs for this job card: its linked estimate
   *  (createInitialPortalJobCard -> estimateId), else the job card's own
   *  transaction id (listJobCards_v1 `id`). */
  function estimateIdFor(jc) {
    return jc.estimateId ?? jc.transactionId ?? null;
  }

  // Include GST - same two calls as the Estimate's toggle:
  //  1. POST /serviceEstimate/updateServiceEstimate { id, gstStatus }
  //  2. on success, GET /serviceEstimate/getEstimate?id= to refresh the lines
  // The toggle goes back if either the id is missing or the update fails.
  async function handleToggleGst(next) {
    if (isGstSaving) return;
    const current = jobcardRef.current;
    const id = estimateIdFor(current);
    if (!id) {
      showToast.error("Save Step 1 first - the job card has no id yet.");
      return;
    }
    // Unsaved line edits go in the same call as the flag, so the reload
    // can't bring back the old qty / rate (same rule as the Estimate).
    const hasUnsavedLines =
      linesSignature(current) !== savedLinesSigRef.current;
    if (hasUnsavedLines) {
      const noId = [
        ...(current.parts ?? [])
          .filter((r) => r.itemId == null)
          .map((r) => r.partNo || r.name),
        ...(current.labour ?? [])
          .filter((r) => r.itemId == null)
          .map((r) => r.code || r.description),
        ...(current.osl ?? [])
          .filter((r) => r.itemId == null)
          .map((r) => r.code || r.description),
      ];
      if (noId.length) {
        showToast.error(
          `Couldn't find the id for ${noId.join(", ")} - remove it and add it again from the search.`,
        );
        return;
      }
    }

    setJobcard((prev) => ({ ...prev, includeGST: next }));
    setIsGstSaving(true);
    try {
      const response = await estimateApi.update(
        hasUnsavedLines
          ? buildUpdatePayload({ ...current, estimateId: id, includeGST: next })
          : { id, gstStatus: next },
      );
      if (!isSuccess(response)) {
        setJobcard((prev) => ({ ...prev, includeGST: !next }));
        showToast.error(responseMessage(response, "Couldn't update GST."));
        return;
      }
      await reloadLinesFromEstimate(id);
    } catch (err) {
      setJobcard((prev) => ({ ...prev, includeGST: !next }));
      showToast.error(err.message || "Couldn't update GST.");
    } finally {
      setIsGstSaving(false);
    }
  }

  // Step 4 - POST /serviceEstimate/shareEstimateOnWhatsApp { estimateId }
  async function handleShareWhatsApp() {
    const estimateId = jobcardRef.current.estimateId;
    if (!estimateId || busyAction) return;
    setBusyAction("whatsapp");
    try {
      const response = await estimateApi.shareOnWhatsApp(estimateId);
      if (!isSuccess(response)) {
        showToast.error(
          responseMessage(response, "Couldn't share on WhatsApp."),
        );
        return;
      }
      showToast.success(
        responseMessage(response, "Estimate shared on WhatsApp."),
      );
    } catch (err) {
      showToast.error(err.message || "Couldn't share on WhatsApp.");
    } finally {
      setBusyAction(null);
    }
  }

  // Step 4 - GET /serviceEstimate/generatePDF?id=
  async function handleDownloadPdf() {
    const { estimateId, id } = jobcardRef.current;
    if (!estimateId || busyAction) return;
    setBusyAction("pdf");
    try {
      const blob = await estimateApi.generatePdf(estimateId);
      await openPdfResponse(blob, `${id || `estimate-${estimateId}`}.pdf`);
    } catch (err) {
      showToast.error(err.message || "Couldn't generate the PDF.");
    } finally {
      setBusyAction(null);
    }
  }

  async function persistMarksIfChanged() {
    const signature = marksSignature(jobcard.damageMarks);
    if (signature === savedMarksRef.current) return true;
    setIsSaving(true);
    try {
      const marks = jobcard.damageMarks ?? [];
      // Template + marks flattened into one PNG, built only now (on
      // Continue / Save), never while the user is still marking.
      const file = await buildMarkedImageFile(
        jobcard.markingBaseImage || CarLayout,
        marks,
        `jobcard-${jobcard.id}-marking.png`,
      );
      await jobCardApi.saveMarkedImage(jobcard.id, { file, marks });
      savedMarksRef.current = signature;
      return true;
    } catch (err) {
      showToast.error(err.message || "Couldn't save the marked image.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  const [current, setCurrent] = useState(
    JOBCARD_STEPS.some((s) => s.key === initialStep) ? initialStep : "customer",
  );

  const stepIndex = JOBCARD_STEPS.findIndex((s) => s.key === current);
  const completed = useMemo(() => {
    const s = new Set();
    for (let i = 0; i < stepIndex; i++) s.add(JOBCARD_STEPS[i].key);
    return s;
  }, [stepIndex]);

  const progress = Math.round(
    ((stepIndex + 1) / JOBCARD_STEPS.length) * 100 * 0.8,
  ); // matches screenshot percentages 5/10/20/30/40/60/80

  // Step 2 Save / Continue -> POST /jobCard/savePortalJobCardInspection.
  async function saveInspectionStep() {
    const current = jobcardRef.current;
    if (!current.transactionId) {
      showToast.error("Save Step 1 first - the job card has no id yet.");
      return false;
    }
    const odometer = String(current.inventory?.odometer ?? "").trim();
    if (!odometer || Number(odometer) <= 0) {
      showToast.error("Enter the odometer reading.");
      return false;
    }
    const unrated = unratedRequiredCheckpoints(current.inspection);
    if (unrated.length) {
      showToast.error(
        `Rate every inspection item - ${unrated.length} left (${unrated
          .slice(0, 3)
          .map((cp) => cp.name)
          .join(", ")}${unrated.length > 3 ? ", ..." : ""}).`,
      );
      return false;
    }
    setIsSaving(true);
    try {
      const response = await jobCardApi.savePortalInspection(
        buildInspectionPayload(current, current.inventory?.catalog ?? []),
      );
      if (!isSuccess(response)) {
        showToast.error(
          responseMessage(response, "Couldn't save inventory & inspection."),
        );
        return false;
      }
      showToast.success(
        responseMessage(response, "Inventory & inspection saved."),
      );
      return true;
    } catch (err) {
      showToast.error(err.message || "Couldn't save inventory & inspection.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePrimary() {
    if (isSaving) return;
    if (current === "customer") {
      await saveCustomerStep({ advance: true });
      return;
    }
    // Continue from Inventory & Inspection: save the inventory /
    // inspection, then the damage marks, and only then move on.
    if (current === "inspection") {
      if (!(await saveInspectionStep())) return;
      if (!(await persistMarksIfChanged())) return;
    }
    goNext();
  }

  function goNext() {
    const next =
      JOBCARD_STEPS[Math.min(JOBCARD_STEPS.length - 1, stepIndex + 1)];
    setCurrent(next.key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  async function handleSave() {
    if (isSaving) return;
    if (current === "customer") {
      await saveCustomerStep({ advance: false });
      return;
    }
    if (current === "inspection") {
      if (!(await saveInspectionStep())) return;
      await persistMarksIfChanged();
      return;
    }
    if (!(await persistMarksIfChanged())) return;
    // TODO: BACKEND INTEGRATION - persist current state via jobCardApi.update()
    showToast.success("Jobcard saved");
  }
  function handlePreview() {
    showToast.success("Preview coming soon");
  }
  function handleComplete() {
    // TODO: BACKEND INTEGRATION - jobCardApi.complete(jobcard.id)
    showToast.success("Jobcard completed");
    onClose?.();
  }

  const meta = STEP_META[current];

  return (
    <div className="space-y-4">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-800 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Jobcards
        </button>
      )}
      <Card className="space-y-5">
        <JobCardHeader
          jobcard={jobcard}
          currentStepLabel={meta.rightLabel}
          currentStepDetail={meta.rightDetail}
          progress={progress}
        />
        <JobCardStepper
          current={current}
          completed={completed}
          onStepChange={setCurrent}
        />

        <div className="pt-2">
          {current === "customer" && (
            <Step1CustomerVehicle jobcard={jobcard} onChange={setJobcard} />
          )}
          {current === "inspection" && (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)]">
              <Step2InventoryInspection
                jobcard={jobcard}
                onChange={setJobcard}
              />
            </div>
          )}
          {current === "parts" && (
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <Step3LabourParts
                jobcard={jobcard}
                onChange={setJobcard}
                getLineItemContext={getLineItemContext}
                onToggleGst={handleToggleGst}
                isGstSaving={isGstSaving}
              />
              <div>
                <JobCardSummaryCard
                  jobcard={jobcard}
                  onCouponChange={(v) => setJobcard({ ...jobcard, coupon: v })}
                  onApplyCoupon={() => showToast.success("Coupon applied")}
                />
              </div>
            </div>
          )}
          {current === "approval" && (
            <Step4EstimateApproval
              jobcard={jobcard}
              onChange={setJobcard}
              onShareWhatsApp={
                jobcard.estimateId ? handleShareWhatsApp : undefined
              }
              onDownloadPdf={jobcard.estimateId ? handleDownloadPdf : undefined}
              busyAction={busyAction}
            />
          )}
          {current === "technician" && (
            <Step5AssignTechnician jobcard={jobcard} onChange={setJobcard} />
          )}
          {current === "repair" && (
            <Step6PreDelivery jobcard={jobcard} onChange={setJobcard} />
          )}
          {current === "bill" && (
            <Step7Bill jobcard={jobcard} onChange={setJobcard} />
          )}
        </div>
      </Card>

      {/* Sticky footer */}
      {/* <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
      <div className="flex flex-wrap justify-end gap-2">
          <Button variant="border" onClick={handleSave}>Save</Button>
          <Button variant="border" onClick={handlePreview}>Preview</Button>
          {current === "bill" ? (
            <Button onClick={handleComplete}>Complete</Button>
          ) : current === "customer" && !jobcard.customer.name ? (
            <Button onClick={goNext}>Continue</Button>
          ) : current === "customer" ? (
            <Button onClick={goNext}>Add</Button>
          ) : current === "parts" || current === "approval" || current === "technician" || current === "repair" ? (
            <Button onClick={goNext}>Update</Button>
          ) : (
            <Button onClick={goNext}>Continue</Button>
          )}
        </div>
      </div> */}
      <WizardFooter
        jobcard={jobcard}
        showTotals={meta.showTotals}
        showSavings={meta.showSavings}
        primaryLabel={
          current === "bill"
            ? "Complete"
            : current === "customer" && jobcard.customer.name
              ? "Add"
              : meta.primaryLabel
        }
        onSave={handleSave}
        onPreview={handlePreview}
        onPrimary={current === "bill" ? handleComplete : handlePrimary}
        isBusy={isSaving}
      />
    </div>
  );
}
