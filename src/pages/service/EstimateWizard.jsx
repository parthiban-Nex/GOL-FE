import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import EstimateHeaderMeta from "@/components/estimates/EstimateHeaderMeta";
import EstimateStepper from "@/components/estimates/EstimateStepper";
import EstimateSummaryCard from "@/components/estimates/EstimateSummaryCard";
import Step1CustomerVehicle from "@/components/estimates/steps/Step1CustomerVehicle";
import Step2Items from "@/components/estimates/steps/Step2Items";
import Step3Insurance from "@/components/estimates/steps/Step3Insurance";
import Step4FinalEstimate from "@/components/estimates/steps/Step4FinalEstimate";
import { DEFAULT_FUEL_TYPE } from "@/constants/vehicleEnums";
import { ROUTES } from "@/constants/routes";
import { showToast } from "@/utils/toast";
import { validate, isRequired, isMobile } from "@/utils/validators";
import EstimateViewModal from "@/components/estimates/EstimateViewModal";
import { customerApi, estimateApi, vehicleApi } from "@/services";
import { isSuccess, responseMessage } from "@/utils/apiResponse";
import {
  buildLineItemDetailsBody,
  buildUpdatePayload,
  detailToWizard,
  keepLineIdentity,
  linesSignature,
  mapEstimateDetail,
  mapLineItemDetails,
  withoutTaxKept,
} from "@/utils/estimateDetail";
import { openPdfResponse } from "@/utils/pdf";
import { resolveLineItemContext } from "@/utils/lineItemContext";

const STEP_ORDER = ["customer", "items", "insurance", "final"];

const emptyInsurance = {
  claim: "",
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
  coverage: "",
  settlementType: "",
  policyPeriod: "",
};

/** Wizard state for one estimate, built from the list row plus, on Edit,
 * `row.saved` - the lines and insurance loaded from getEstimate. */
function buildEstimate(row) {
  const saved = row?.saved ?? {};
  return {
    id: row?.id ?? "",
    estimateId: row?.estimateId ?? null,
    status: row?.status || "Open",
    customer: {
      name: row?.customer ?? "",
      mobile: row?.mobile ?? "",
      pincode: row?.pincode ?? "",
      address: row?.address ?? "",
      regNo: row?.regNo ?? "",
      make: row?.make ?? "",
      model: row?.model ?? "",
      fuel: row?.fuel || DEFAULT_FUEL_TYPE,
      makeId: row?.makeId ?? null,
      modelId: row?.modelId ?? null,
      modelSegment: row?.modelSegment ?? "",
      customerState: row?.customerState ?? "",
      customerId: row?.customerId ?? null,
      vehicleId: row?.vehicleId ?? null,
    },
    includeGST: row?.includeGST ?? true,
    parts: saved.parts ?? [],
    labour: saved.labour ?? [],
    osl: saved.osl ?? [],
    insurance: { ...emptyInsurance, ...(saved.insurance ?? {}) },
    discount: { total: 0 },
    remarks: "",
  };
}

const step1Rules = {
  name: [[isRequired, "Name is required."]],
  mobile: [
    [isRequired, "Mobile is required."],
    [isMobile, "Enter a valid 10-digit mobile number."],
  ],
  regNo: [[isRequired, "Registration number is required."]],
};

export default function EstimateWizard({
  estimateRow,
  initialStep = "customer",
  onClose,
}) {
  const navigate = useNavigate();

  const [estimate, setEstimate] = useState(() => buildEstimate(estimateRow));

  const [step, setStep] = useState(
    STEP_ORDER.includes(initialStep) ? initialStep : "customer",
  );
  const [completed, setCompleted] = useState(() => new Set());
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isGstSaving, setIsGstSaving] = useState(false);
  const [busyAction, setBusyAction] = useState(null); // "whatsapp" | "pdf" | "jobcard"
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Latest estimate for the async API calls.
  const estimateRef = useRef(estimate);
  estimateRef.current = estimate;

  const [isLoadingDetail, setIsLoadingDetail] = useState(
    Boolean(estimateRow?.estimateId),
  );

  /** Fills from POST /serviceEstimate/getEstimateLineItemDetails (by code):
   *  - the part / labour id when a line has none
   *  - with `needTax`, the real GST % of lines whose rate wasn't kept from
   *    the screen (getEstimate sends 0 tax while GST is off). */
  async function fillFromLineItemDetails(
    { parts, labour, osl },
    { needTax = false } = {},
  ) {
    const wants = (r) => r.itemId == null || (needTax && !r.taxKept);
    const missing = [
      ...parts
        .filter((r) => wants(r) && r.partNo)
        .map((r) => ({ kind: "Part", code: r.partNo })),
      ...labour
        .filter((r) => wants(r) && r.code)
        .map((r) => ({ kind: "Labour", code: r.code })),
      ...osl
        .filter((r) => wants(r) && r.code)
        .map((r) => ({ kind: "OSL", code: r.code })),
    ];
    const strip = withoutTaxKept;
    if (missing.length === 0) {
      return {
        parts: parts.map(strip),
        labour: labour.map(strip),
        osl: osl.map(strip),
      };
    }

    let details = {};
    try {
      const context = await getLineItemContext();
      const response = await estimateApi.getLineItemDetails(
        buildLineItemDetailsBody(
          missing.map((m) => ({ catalog: { kind: m.kind, code: m.code } })),
          context,
        ),
      );
      if (isSuccess(response)) details = mapLineItemDetails(response);
    } catch {
      /* keep what we have - saving names any line still without an id */
    }
    const fill = (kind, codeKey) => (r) => {
      const d = details[`${kind}-code-${String(r[codeKey] ?? "").trim()}`];
      let next = r;
      if (d && r.itemId == null && d.id != null)
        next = { ...next, itemId: d.id };
      if (
        d &&
        needTax &&
        !r.taxKept &&
        (d.sgst != null || d.cgst != null || d.igst != null)
      ) {
        next = {
          ...next,
          sgst: Number(d.sgst ?? 0),
          cgst: Number(d.cgst ?? 0),
          igst: Number(d.igst ?? 0),
        };
      }
      return strip(next);
    };
    return {
      parts: parts.map(fill("Part", "partNo")),
      labour: labour.map(fill("Labour", "code")),
      osl: osl.map(fill("OSL", "code")),
    };
  }

  /** customerId + vehicleId for the customer APIs - from the list row /
   *  reg. no. lookup already done, else POST /vehicle/getVehicleDetailsByRegNo. */
  async function ensureCustomerVehicleIds() {
    const c = estimateRef.current.customer;
    if (c.customerId && c.vehicleId)
      return { customerId: c.customerId, vehicleId: c.vehicleId };
    const regNo = String(c.regNo ?? "").trim();
    if (!regNo) return { customerId: c.customerId, vehicleId: c.vehicleId };
    try {
      const res = await vehicleApi.getByRegNo(regNo);
      const match = res?.requestSuccessful ? res.vehicleData?.[0] : null;
      const ids = {
        customerId:
          c.customerId ??
          match?.customeId ??
          match?.customerData?.customerId ??
          null,
        vehicleId: c.vehicleId ?? match?.vehicleId ?? null,
      };
      setEstimate((prev) => ({
        ...prev,
        customer: { ...prev.customer, ...ids },
      }));
      return ids;
    } catch {
      return { customerId: c.customerId, vehicleId: c.vehicleId };
    }
  }

  /** GET /serviceEstimate/getEstimate?id= -> Steps 1-4 (lines, insurance,
   *  customer / vehicle names). Runs on open and after every successful
   *  save or GST change, so every step shows what the backend has. */
  // Only the newest getEstimate may update the screen (toggle + save in
  // quick succession would otherwise let an older answer land last).
  const reloadSeqRef = useRef(0);
  // Lines as last loaded from getEstimate (null until the first load).
  const savedLinesSigRef = useRef(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function reloadFromServer() {
    const estimateId = estimateRef.current.estimateId;
    if (!estimateId) return;
    const seq = ++reloadSeqRef.current;
    setIsRefreshing(true);
    try {
      const response = await estimateApi.get(estimateId);
      if (seq !== reloadSeqRef.current) return; // a newer reload is running
      if (!isSuccess(response) || !response?.data) {
        showToast.error(
          responseMessage(response, "Couldn't load the estimate."),
        );
        return;
      }
      const detail = mapEstimateDetail(response.data);
      const saved = detailToWizard(detail);
      const prev = estimateRef.current;
      // getEstimate gstStatus drives the Include GST toggle.
      const gstOn = detail.gstStatus ?? prev.includeGST;
      // With GST off the lines come back with 0 tax - keep their real rates.
      const keepTax = !gstOn;

      let parts = keepLineIdentity(saved.parts, prev.parts, {
        codeKey: "partNo",
        nameKey: "name",
        hsnKey: "hsn",
        keepTax,
      });
      let labour = keepLineIdentity(saved.labour, prev.labour, {
        codeKey: "code",
        nameKey: "description",
        hsnKey: "sac",
        keepTax,
      });
      // No OSL in the response -> keep the OSL lines on screen.
      let osl = detail.hasOsl
        ? keepLineIdentity(saved.osl, prev.osl, {
            codeKey: "code",
            nameKey: "description",
            hsnKey: "sac",
            keepTax,
          })
        : (prev.osl ?? []);

      // Missing ids (and, with GST off, missing real rates) by code.
      ({ parts, labour, osl } = await fillFromLineItemDetails(
        { parts, labour, osl },
        { needTax: keepTax },
      ));
      if (seq !== reloadSeqRef.current) return; // superseded while filling

      // What the backend now has - later edits differ from this.
      savedLinesSigRef.current = linesSignature({ parts, labour, osl });

      const keep = (next, old) => (next ? next : old);
      setEstimate((current) => ({
        ...current,
        estimateId: detail.estimateId ?? current.estimateId,
        id: keep(detail.number, current.id),
        includeGST: gstOn,
        parts,
        labour,
        osl,
        insurance: {
          ...current.insurance,
          insurer: keep(saved.insurance.insurer, current.insurance.insurer),
          claimNo: keep(saved.insurance.claimNo, current.insurance.claimNo),
          expiryDate: keep(
            saved.insurance.expiryDate,
            current.insurance.expiryDate,
          ),
        },
        customer: {
          ...current.customer,
          name: keep(detail.customer.name, current.customer.name),
          regNo: keep(detail.booking.regNo, current.customer.regNo),
          make: keep(detail.booking.make, current.customer.make),
          model: keep(detail.booking.model, current.customer.model),
        },
      }));
    } catch (err) {
      showToast.error(err.message || "Couldn't load the estimate.");
    } finally {
      if (seq === reloadSeqRef.current) {
        setIsRefreshing(false);
        setIsLoadingDetail(false);
      }
    }
  }

  useEffect(() => {
    reloadFromServer();
    // Once per opened estimate - the wizard is keyed by estimate id.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // customerState + modelSegment for getEstimateLineItemDetails - shared
  // lookup order (see utils/lineItemContext.js).
  const contextCacheRef = useRef({});
  async function getLineItemContext() {
    const c = estimateRef.current.customer;
    const { customerState, modelSegment } = await resolveLineItemContext(
      c,
      contextCacheRef.current,
    );

    // Keep what was found so the next Add doesn't look it up again.
    if (customerState !== c.customerState || modelSegment !== c.modelSegment) {
      setEstimate((prev) => ({
        ...prev,
        customer: { ...prev.customer, customerState, modelSegment },
      }));
    }
    return { customerState, modelSegment };
  }

  /** POST /serviceEstimate/updateServiceEstimate with the current lines.
   *  Returns true when the backend saved it. */
  async function persist({ successMessage, estimate: override } = {}) {
    // `override`: save this version instead of what's on screen (delete
    // sends the lines that remain before the screen is updated).
    const current = override ?? estimateRef.current;
    if (!current.estimateId) {
      showToast.error(
        "This estimate isn't saved yet - add it from the Estimate list first.",
      );
      return false;
    }
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
      return false;
    }
    setIsSaving(true);
    try {
      const response = await estimateApi.update(buildUpdatePayload(current));
      if (!isSuccess(response)) {
        showToast.error(
          responseMessage(response, "Couldn't save the estimate."),
        );
        return false;
      }
      if (successMessage)
        showToast.success(responseMessage(response, successMessage));
      if (override) {
        estimateRef.current = override;
        setEstimate(override);
      }
      await reloadFromServer();
      return true;
    } catch (err) {
      showToast.error(err.message || "Couldn't save the estimate.");
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  // Delete icon on a part / labour / OSL line: send updateServiceEstimate
  // with that line removed from its array, then reload getEstimate.
  // The line stays on screen if the save fails.
  async function handleRemoveLine(section, rowId) {
    const current = estimateRef.current;
    const next = {
      ...current,
      [section]: (current[section] ?? []).filter((r) => r.id !== rowId),
    };
    return persist({ estimate: next, successMessage: "Line removed." });
  }

  // Include GST: saved straight away with { id, gstStatus }; the toggle
  // goes back if the backend refuses.
  async function handleToggleGst(next) {
    if (isGstSaving) return;
    const current = estimateRef.current;
    const estimateId = current.estimateId;
    setEstimate((prev) => ({ ...prev, includeGST: next }));
    if (!estimateId) return;

    // Unsaved line edits (e.g. qty 3 -> 4 not saved yet): sending only the
    // flag would let the reload bring back qty 3. Save the lines together
    // with the new gstStatus in one updateServiceEstimate instead.
    const hasUnsavedLines =
      linesSignature(current) !== savedLinesSigRef.current;

    setIsGstSaving(true);
    try {
      if (hasUnsavedLines) {
        const ok = await persist({
          estimate: { ...current, includeGST: next },
          successMessage: "GST updated and line changes saved.",
        });
        if (!ok) setEstimate((prev) => ({ ...prev, includeGST: !next }));
        return;
      }

      // No line edits: just the flag, then refresh every step.
      const response = await estimateApi.update({
        id: estimateId,
        gstStatus: next,
      });
      if (!isSuccess(response)) {
        setEstimate((prev) => ({ ...prev, includeGST: !next }));
        showToast.error(responseMessage(response, "Couldn't update GST."));
        return;
      }
      await reloadFromServer();
    } catch (err) {
      setEstimate((prev) => ({ ...prev, includeGST: !next }));
      showToast.error(err.message || "Couldn't update GST.");
    } finally {
      setIsGstSaving(false);
    }
  }

  async function handleShareWhatsApp() {
    const estimateId = estimateRef.current.estimateId;
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

  // GET /serviceEstimate/generatePDF?id= - saves first so the PDF shows
  // the lines on screen.
  async function handleDownloadPdf() {
    const current = estimateRef.current;
    if (!current.estimateId || busyAction) return;
    setBusyAction("pdf");
    try {
      if (!(await persist())) return;
      const blob = await estimateApi.generatePdf(current.estimateId);
      await openPdfResponse(
        blob,
        `${current.id || `estimate-${current.estimateId}`}.pdf`,
      );
    } catch (err) {
      showToast.error(err.message || "Couldn't generate the PDF.");
    } finally {
      setBusyAction(null);
    }
  }

  function updateEstimate(patch) {
    setEstimate((prev) =>
      typeof patch === "function" ? patch(prev) : { ...prev, ...patch },
    );
  }

  function markComplete(key) {
    setCompleted((prev) => new Set(prev).add(key));
  }

  function goToStep(next) {
    if (!STEP_ORDER.includes(next)) return;
    setStep(next);
  }

  // Save / Update on every step -> updateServiceEstimate.
  // Step 1 Save / Update -> POST /customer/updateCustomerVehicleDetails
  // (same payload as the Customers page), then reload getEstimate.
  async function handleStep1Save({ advance }) {
    const errs = validate(estimate.customer, step1Rules);
    if (Object.keys(errs).length) {
      setErrors(errs);
      showToast.error("Fix the highlighted fields to continue.");
      return;
    }
    setErrors({});
    setIsSaving(true);
    try {
      const { customerId, vehicleId } = await ensureCustomerVehicleIds();
      if (!customerId || !vehicleId) {
        showToast.error(
          "This vehicle isn't registered to a customer yet - add it from the Customers page first.",
        );
        return;
      }
      const c = estimateRef.current.customer;
      const response = await customerApi.updateDetails({
        customerId,
        vehicleId,
        name: c.name,
        mobileNumber: c.mobile,
        pinCode: c.pincode,
        address1: c.address,
        customerCategory: "",
        state: c.customerState ?? "",
        city: c.customerCity ?? "",
        registrationNumber: c.regNo,
        makeId: c.makeId,
        modelId: c.modelId,
        fuelType: c.fuel,
        chassisNumber: "",
        engineNumber: "",
        manufacturingYear: "",
        insurance: {},
        otherDetails: {},
      });
      if (!isSuccess(response)) {
        showToast.error(
          responseMessage(
            response,
            "Couldn't save customer & vehicle details.",
          ),
        );
        return;
      }
      showToast.success(
        responseMessage(response, "Customer & vehicle details saved."),
      );
      markComplete("customer");
      await reloadFromServer();
      if (advance) goToStep("items");
    } catch (err) {
      showToast.error(
        err.message || "Couldn't save customer & vehicle details.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStep2Save({ advance }) {
    if (!(await persist({ successMessage: "Estimate items saved." }))) return;
    markComplete("items");
    if (advance) goToStep("insurance");
  }

  // Step 3 Save / Update -> POST /customer/updateCustomerVehicleInsurance,
  // then reload getEstimate.
  async function handleStep3Save({ advance, skip }) {
    if (skip) {
      showToast.success("Insurance skipped.");
      goToStep("final");
      return;
    }
    setIsSaving(true);
    try {
      const { customerId, vehicleId } = await ensureCustomerVehicleIds();
      if (!customerId || !vehicleId) {
        showToast.error(
          "This vehicle isn't registered to a customer yet - add it from the Customers page first.",
        );
        return;
      }
      const ins = estimateRef.current.insurance;
      const response = await customerApi.updateVehicleInsurance({
        customerId,
        vehicleId,
        insurance: {
          insuranceProviderId: ins.insuranceId ?? null,
          location: ins.location ?? "",
          areaName: ins.areaName ?? "",
          pincode: ins.pincode ?? "",
          city: ins.city ?? "",
          claimNo: ins.claimNo ?? "",
          gstinNumber: ins.gstin ?? "",
          policyNo: ins.policyNo ?? "",
          expiryDate: ins.expiryDate ?? "",
        },
      });
      if (!isSuccess(response)) {
        showToast.error(
          responseMessage(response, "Couldn't save insurance details."),
        );
        return;
      }
      showToast.success(responseMessage(response, "Insurance details saved."));
      markComplete("insurance");
      await reloadFromServer();
      if (advance) goToStep("final");
    } catch (err) {
      showToast.error(err.message || "Couldn't save insurance details.");
    } finally {
      setIsSaving(false);
    }
  }

  // Create Jobcard -> save, then POST /serviceEstimate/approveServiceEstimate.
  async function handleCreateJobcard() {
    const estimateId = estimateRef.current.estimateId;
    if (!estimateId || busyAction) return;
    setBusyAction("jobcard");
    try {
      if (!(await persist())) return;
      const response = await estimateApi.approve(estimateId);
      if (!isSuccess(response)) {
        showToast.error(
          responseMessage(response, "Couldn't create the job card."),
        );
        return;
      }
      markComplete("final");
      showToast.success(
        responseMessage(response, "Job Card created from this estimate."),
      );
      navigate(ROUTES.SERVICE_JOB_CARD);
    } catch (err) {
      showToast.error(err.message || "Couldn't create the job card.");
    } finally {
      setBusyAction(null);
    }
  }

  const StepBody = useMemo(() => {
    switch (step) {
      case "customer":
        return (
          <Step1CustomerVehicle
            value={estimate.customer}
            errors={errors}
            onChange={(next) => updateEstimate({ customer: next })}
          />
        );
      case "items":
        return (
          <Step2Items
            estimate={estimate}
            onChange={setEstimate}
            onToggleGst={handleToggleGst}
            isGstSaving={isGstSaving}
            getLineItemContext={getLineItemContext}
            onRemoveLine={estimate.estimateId ? handleRemoveLine : undefined}
            isRefreshing={isRefreshing}
          />
        );
      case "insurance":
        return (
          <Step3Insurance
            value={estimate.insurance}
            onChange={(next) => updateEstimate({ insurance: next })}
          />
        );
      case "final":
        return (
          <Step4FinalEstimate
            estimate={estimate}
            onEdit={goToStep}
            onShareWhatsApp={
              estimate.estimateId ? handleShareWhatsApp : undefined
            }
            onDownloadPdf={estimate.estimateId ? handleDownloadPdf : undefined}
            busyAction={busyAction}
          />
        );
      default:
        return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, estimate, errors, isGstSaving, busyAction, isRefreshing]);

  const showSummarySidebar = step === "items";
  const idAsInput = step === "insurance" || step === "final";

  return (
    <div className="space-y-4 ">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-800 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Estimates
        </button>
      )}
      <Card className="space-y-5">
        <EstimateHeaderMeta estimate={estimate} idAsInput={idAsInput} />
        <EstimateStepper
          current={step}
          completed={completed}
          onStepChange={goToStep}
        />
      </Card>

      <div
        className={
          showSummarySidebar
            ? "grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]"
            : ""
        }
      >
        <Card className="space-y-4">
          {isLoadingDetail ? (
            <p className="py-10 text-center text-sm text-ink-500">
              Loading estimate...
            </p>
          ) : (
            StepBody
          )}
        </Card>
        {showSummarySidebar && (
          <EstimateSummaryCard
            estimate={estimate}
            onRemarksChange={(remarks) => updateEstimate({ remarks })}
          />
        )}
      </div>

      <StickyFooter
        step={step}
        onSave={() => stepSave(step, false)}
        onSaveAndAdvance={() => stepSave(step, true)}
        onSkip={() => handleStep3Save({ skip: true })}
        onCreateJobcard={handleCreateJobcard}
        onPreview={
          estimate.estimateId ? () => setIsPreviewOpen(true) : undefined
        }
        isSaving={isSaving}
        isCreatingJobcard={busyAction === "jobcard"}
      />

      {/* Preview - same view as the list's eye icon (getEstimate). */}
      <EstimateViewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        estimate={{
          estimateId: estimate.estimateId,
          id: estimate.id,
          status: estimate.status,
        }}
        onDownloadPdf={handleDownloadPdf}
        isDownloading={busyAction === "pdf"}
      />
    </div>
  );

  function stepSave(currentStep, advance) {
    if (currentStep === "customer") handleStep1Save({ advance });
    else if (currentStep === "items") handleStep2Save({ advance });
    else if (currentStep === "insurance") handleStep3Save({ advance });
    else if (currentStep === "final") {
      persist({ successMessage: "Estimate saved." }).then((ok) => {
        if (ok) markComplete("final");
      });
    }
  }
}

function StickyFooter({
  step,
  onSave,
  onSaveAndAdvance,
  onSkip,
  onCreateJobcard,
  onPreview,
  isSaving = false,
  isCreatingJobcard = false,
}) {
  if (step === "final") {
    return (
      <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-start gap-3 rounded-lg bg-amber-50 px-4 py-3 text-sm">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-800">Important Note</p>
              <p className="text-xs text-amber-700">
                Final approval from customer is required before creating Job
                Card and starting repair work.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="border"
              onClick={onSave}
              isLoading={isSaving && !isCreatingJobcard}
            >
              Save
            </Button>
            <Button variant="border" onClick={onPreview} disabled={!onPreview}>
              Preview
            </Button>
            <Button onClick={onCreateJobcard} isLoading={isCreatingJobcard}>
              Create Jobcard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="border" onClick={onSave} disabled={isSaving}>
          Save
        </Button>
        {step === "insurance" && (
          <Button variant="border" onClick={onSkip} disabled={isSaving}>
            Skip
          </Button>
        )}
        <Button onClick={onSaveAndAdvance} isLoading={isSaving}>
          {step === "customer"
            ? "Update"
            : step === "insurance"
              ? "Continue"
              : "Update"}
        </Button>
      </div>
    </div>
  );
}
