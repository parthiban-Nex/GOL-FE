/** Job card Step 1 -> POST /jobCard/createInitialPortalJobCard body. */

const text = (v) => (v == null ? "" : String(v).trim());
const numOrNull = (v) =>
  v === "" || v == null ? null : Number.isFinite(Number(v)) ? Number(v) : v;

export function buildInitialJobCardPayload(jobcard) {
  const c = jobcard.customer ?? {};
  const ins = jobcard.insurance ?? {};
  const payload = {
    name: text(c.name),
    mobileNumber: text(c.mobile),
    pinCode: text(c.pincode),
    address1: text(c.address),
    registrationNumber: text(c.regNo),
    makeId: numOrNull(c.makeId),
    modelId: numOrNull(c.modelId),
    fuelType: c.fuel ?? "",
    jobCardType: jobcard.jobCardType || null, // RAC / Accidental / Minor / Major
  };

  // Only when the Insurance section is switched on.
  if (jobcard.insuranceEnabled) {
    // Same keys as /customer/updateCustomerVehicleInsurance.
    payload.insurance = {
      insuranceProviderId: ins.insuranceId ?? null,
      location: text(ins.location),
      areaName: text(ins.areaName),
      pincode: text(ins.pincode),
      city: text(ins.city),
      claimNo: text(ins.claimNo),
      gstinNumber: text(ins.gstin),
      policyNo: text(ins.policyNo),
      expiryDate: text(ins.expiryDate),
    };
    // Surveyor object - key names to be confirmed with the backend.
    payload.surveyor = {
      surveyorName: text(ins.surveyorName),
      surveyorMobile: text(ins.surveyorMobile),
      surveyorEmail: text(ins.surveyorEmail),
      estimatedCost: numOrNull(ins.estimatedCost),
      intimatedDate: text(ins.surveyorIntimatedDate),
      proposedDate: text(ins.surveyorProposedDate),
      visitedDate: text(ins.surveyorVisitedDate),
      approvedDate: text(ins.surveyorApprovedDate),
    };
  }
  return payload;
}

/** createInitialPortalJobCard response -> ids the other job card /
 *  estimate APIs need (whichever of these the backend returns). */
export function idsFromInitialJobCard(response) {
  const d = response?.data ?? response?.JobCardData ?? response ?? {};
  const row = Array.isArray(d) ? (d[0] ?? {}) : d;
  return {
    transactionId:
      row.id ??
      row.jobCardId ??
      row.transaction_id ??
      row.transactionId ??
      null,
    jobCardNo:
      row.job_card_no ??
      row.jobCardNo ??
      row.jobCardNumber ??
      row.documentName ??
      null,
    estimateId:
      row.estimateId ?? row.serviceEstimateId ?? row.estimate_id ?? null,
    customerId: row.customerId ?? row.customer_id ?? null,
    vehicleId: row.vehicleId ?? row.vehicle_id ?? null,
  };
}

/** One listInventoryCheckList row -> the chip / payload shape. */
export function mapInventoryItem(r) {
  return {
    id: r.ID,
    code: String(r.INVENTORY_CODE ?? "").trim(),
    label: String(r.INVENTORY_DESC ?? r.INVENTORY_CODE ?? "").trim(),
    version: String(r.INVENTORY_VER ?? "1.0"),
    type: String(r.INVENTORY_TYPE ?? "CUSTOMER"),
    sortOrder: Number(r.SORT_ORDER ?? 0),
    active: r.ACTIVE == null ? true : Number(r.ACTIVE) === 1,
  };
}

const isActive = (v) => v == null || Number(v) === 1;

/** getInspectionChecklist response -> { checkListTypeCode, categories:
 *  [{ code, name, checkpoints: [{ paramCode, name, inspectionType, version,
 *  required, options: [{ code, label }] }] }] } (active only, sorted). */
export function mapInspectionChecklist(response) {
  const data = response?.inspectionChecklistData ?? {};
  const typeCode = String(data.checkListTypeCode ?? "CHK_LIST_MAJOR");
  const categories = (data.categories ?? [])
    .filter((c) => isActive(c.status))
    .map((c) => ({
      code: String(c.subsystemCode ?? c.subsystemId),
      name: String(c.subsystemName ?? c.subsystemCode ?? ""),
      checkpoints: (c.checkpoints ?? [])
        .filter((cp) => isActive(cp.status) && cp.paramCode)
        .sort((x, y) => (x.sortOrder ?? 0) - (y.sortOrder ?? 0))
        .map((cp) => ({
          paramCode: String(cp.paramCode),
          name: String(cp.paramName ?? cp.paramCode),
          inspectionType: cp.inspectionType ?? "Major",
          checkListTypeCode:
            cp.checkListTypeCode ?? c.checkListTypeCode ?? typeCode,
          version: String(cp.checkListVersion ?? "1.0"),
          // optional: 0 + valueRequired: 1 -> must be rated before saving
          required:
            Number(cp.optional ?? 0) === 0 &&
            Number(cp.valueRequired ?? 1) === 1,
          options: (cp.ratingOptions ?? [])
            .filter((o) => isActive(o.status) && o.ratingReasonCode)
            .map((o) => ({
              code: String(o.ratingReasonCode),
              label: String(o.ratingReasonDesc ?? o.ratingReasonCode),
            })),
        })),
    }));
  return { checkListTypeCode: typeCode, categories };
}

/** Required checkpoints that have no rating yet. */
export function unratedRequiredCheckpoints(inspection) {
  const ratings = inspection?.ratings ?? {};
  return (inspection?.checklist?.categories ?? [])
    .flatMap((c) => c.checkpoints)
    .filter((cp) => cp.required && cp.options.length && !ratings[cp.paramCode]);
}

/**
 * Job card Step 2 -> POST /jobCard/savePortalJobCardInspection body.
 *  - inventory: every ticked checklist item, condition "Present".
 *  - inspection: every rated checkpoint with its paramCode and the chosen
 *    rating's ratingReasonCode.
 */
export function buildInspectionPayload(jobcard, inventoryItems = []) {
  const inv = jobcard.inventory ?? {};
  const byCode = new Map(inventoryItems.map((i) => [i.code, i]));
  const ticked = (inv.checked ?? [])
    .map((code) => byCode.get(code))
    .filter(Boolean);

  const ratings = jobcard.inspection?.ratings ?? {};
  const checkpoints = (jobcard.inspection?.checklist?.categories ?? []).flatMap(
    (c) => c.checkpoints,
  );
  const inspection = checkpoints
    .filter((cp) => ratings[cp.paramCode])
    .map((cp) => ({
      paramCode: cp.paramCode,
      ratingReasonCode: ratings[cp.paramCode],
      inspectionType: cp.inspectionType,
      checklistTypeCode: cp.checkListTypeCode,
      checklistVersion: cp.version,
      remarks: "",
    }));

  return {
    jobCardId: jobcard.transactionId,
    odometer: Number(String(inv.odometer ?? "").replace(/\D/g, "")) || 0,
    inventory: ticked.map((i) => ({
      code: i.code,
      version: i.version,
      type: i.type,
      condition: "Present",
    })),
    inspection,
  };
}
