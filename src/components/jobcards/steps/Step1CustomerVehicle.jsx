import { useEffect, useMemo, useRef, useState } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useMakeModelOptions } from "@/hooks/useMakeModelOptions";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { insuranceApi, pincodeApi, vehicleApi } from "@/services";
import {
  FUEL_OPTIONS,
  DEFAULT_FUEL_TYPE,
  JOBCARD_TYPE_OPTIONS,
} from "@/constants/vehicleEnums";
import clsx from "clsx";

const REGNO_DEBOUNCE_MS = 500;

const digitsOnly = (value, max) => value.replace(/\D/g, "").slice(0, max);

export default function Step1CustomerVehicle({ jobcard, onChange }) {
  const c = jobcard.customer;
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");
  const regNoTimerRef = useRef(null);

  // The reg-no lookup resolves later - always merge into the latest state.
  const jobcardRef = useRef(jobcard);
  jobcardRef.current = jobcard;

  const { makeOptions, modelOptions } = useMakeModelOptions(c.make, c.model);

  function patchCustomer(patch) {
    const current = jobcardRef.current;
    onChange({ ...current, customer: { ...current.customer, ...patch } });
  }

  function updateCustomer(field, value) {
    if (field === "make") {
      const option = makeOptions.find((m) => m.value === value);
      patchCustomer({
        make: value,
        makeId: option?.id ?? null,
        model: "",
        modelId: null,
        modelSegment: "",
      });
      return;
    }
    if (field === "model") {
      const option = modelOptions.find((m) => m.value === value);
      patchCustomer({
        model: value,
        modelId: option?.id ?? null,
        modelSegment: option?.segment ?? "",
      });
      return;
    }
    if (field === "regNo") {
      patchCustomer({ regNo: value, customerId: null, vehicleId: null });
      setLookupMessage("");
      scheduleRegNoLookup(value);
      return;
    }
    patchCustomer({ [field]: value });
  }

  // POST /vehicle/getVehicleDetailsByRegNo { registrationNumber } - only
  // when the user types a reg. no., so an opened job card isn't overwritten.
  function scheduleRegNoLookup(regNoInput) {
    if (regNoTimerRef.current) clearTimeout(regNoTimerRef.current);
    const regNo = regNoInput.trim();
    if (regNo.length < 4) return;

    regNoTimerRef.current = setTimeout(async () => {
      setIsLookingUp(true);
      try {
        const response = await vehicleApi.getByRegNo(regNo);
        if (jobcardRef.current.customer.regNo.trim() !== regNo) return; // typed on
        const match = response?.requestSuccessful
          ? response.vehicleData?.[0]
          : null;
        if (!match) return;

        const cur = jobcardRef.current.customer;
        const data = match.customerData ?? {};
        patchCustomer({
          name: match.customerName ?? data.name ?? cur.name,
          mobile: match.customerMobileNumber ?? data.mobileNumber ?? cur.mobile,
          pincode: match.pincode ?? data.pinCode ?? cur.pincode,
          address: match.customerAddress ?? data.address1 ?? cur.address,
          customerId: match.customeId ?? data.customerId ?? null,
          vehicleId: match.vehicleId ?? null,
          makeId: match.makeId ?? cur.makeId,
          modelId: match.modelId ?? cur.modelId,
          modelSegment: match.modelSegment ?? cur.modelSegment ?? "",
          customerState:
            match.customerState ?? data.state ?? cur.customerState ?? "",
          // Names are filled from the ids by the effects below.
          make: makeOptions.find((m) => m.id === match.makeId)?.value ?? "",
          model: "",
        });
        setLookupMessage(match.message ?? "");
      } catch {
        /* no match / lookup failed - keep what was typed */
      } finally {
        setIsLookingUp(false);
      }
    }, REGNO_DEBOUNCE_MS);
  }

  useEffect(() => () => clearTimeout(regNoTimerRef.current), []);

  // Make: id -> name (after lookup), or name -> id (opened from the list).
  useEffect(() => {
    if (c.makeId && !c.make) {
      const option = makeOptions.find((m) => m.id === c.makeId);
      if (option) patchCustomer({ make: option.value });
    } else if (c.make && !c.makeId) {
      const option = makeOptions.find(
        (m) => m.value.toLowerCase() === c.make.toLowerCase(),
      );
      if (option) patchCustomer({ make: option.value, makeId: option.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [makeOptions, c.makeId, c.make]);

  // Model: same, once that make's models have loaded.
  useEffect(() => {
    if (c.modelId && !c.model) {
      const option = modelOptions.find((m) => m.id === c.modelId);
      if (option) patchCustomer({ model: option.value });
    } else if (c.model && !c.modelId) {
      const option = modelOptions.find(
        (m) => m.value.toLowerCase() === c.model.toLowerCase(),
      );
      if (option) patchCustomer({ model: option.value, modelId: option.id });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelOptions, c.modelId, c.model]);

  function updateInsurance(field, value) {
    const current = jobcardRef.current;
    onChange({
      ...current,
      insurance: { ...current.insurance, [field]: value },
    });
  }

  // Insurance pincode -> POST /vendors/getPincodeData: fills Location
  // (state) and City, and lists the Area Names (same as Estimate Step 3).
  const [areaNames, setAreaNames] = useState([]);
  const [isPinLookingUp, setIsPinLookingUp] = useState(false);
  const insurancePin = jobcard.insurance?.pincode ?? "";

  useEffect(() => {
    const pin = String(insurancePin).trim();
    if (!/^\d{6}$/.test(pin)) {
      setAreaNames([]);
      return undefined;
    }
    let cancelled = false;
    setIsPinLookingUp(true);
    pincodeApi
      .lookup(pin)
      .then((res) => {
        if (cancelled || !res?.requestSuccessful) return;
        const data = res.pincodeData ?? {};
        setAreaNames((data.areaNames ?? []).map((a) => a.area).filter(Boolean));
        const current = jobcardRef.current;
        onChange({
          ...current,
          insurance: {
            ...current.insurance,
            location: data.state || current.insurance.location,
            city: data.city || current.insurance.city,
          },
        });
      })
      .catch(() => {
        if (!cancelled) setAreaNames([]);
      })
      .finally(() => {
        if (!cancelled) setIsPinLookingUp(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [insurancePin]);

  // Keep an already-saved area selectable even if it isn't in the list.
  const areaOptions = useMemo(() => {
    const names = new Set(areaNames);
    if (jobcard.insurance?.areaName) names.add(jobcard.insurance.areaName);
    return [...names].map((a) => ({ value: a, label: a }));
  }, [areaNames, jobcard.insurance?.areaName]);

  // GET /insurance/getAllInsurances - same list as the Estimate's Step 3.
  const insurers = useDropdownOptions(
    () => insuranceApi.getAll(),
    (i) => ({ value: i.insuranceName, label: i.insuranceName, id: i.id }),
    insuranceApi.allKey,
  );

  function handleInsurerChange(name) {
    const option = insurers.find((i) => i.value === name);
    const current = jobcardRef.current;
    onChange({
      ...current,
      insurance: {
        ...current.insurance,
        insurer: name,
        insuranceId: option?.id ?? null,
      },
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-ink-100 p-5">
        <h2 className="mb-4 text-base font-semibold text-ink-800">
          Customer &amp; Vehicle Details
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 xl:grid-cols-9">
          <Input
            label="Name"
            placeholder="Enter Name"
            value={c.name ?? ""}
            onChange={(e) => updateCustomer("name", e.target.value)}
          />
          <Input
            label="Mobile"
            placeholder="Enter Mobile"
            inputMode="numeric"
            value={c.mobile ?? ""}
            maxLength={10}
            onChange={(e) =>
              updateCustomer("mobile", digitsOnly(e.target.value, 10))
            }
          />
          <Input
            label="Pincode"
            placeholder="Enter Pincode"
            inputMode="numeric"
            maxLength={6}
            value={c.pincode ?? ""}
            onChange={(e) =>
              updateCustomer("pincode", digitsOnly(e.target.value, 6))
            }
          />
          <Input
            label="Address"
            placeholder="Enter Address"
            value={c.address ?? ""}
            onChange={(e) => updateCustomer("address", e.target.value)}
          />
          <Input
            label="Reg.No."
            placeholder="Enter Reg.No."
            value={c.regNo ?? ""}
            onChange={(e) =>
              updateCustomer("regNo", e.target.value.toUpperCase())
            }
            hint={isLookingUp ? "Checking..." : lookupMessage || undefined}
          />
          <Select
            label="Make"
            placeholder="Select Make"
            value={c.make ?? ""}
            onChange={(e) => updateCustomer("make", e.target.value)}
            options={makeOptions}
          />
          <Select
            label="Model"
            placeholder="Select Model"
            value={c.model ?? ""}
            onChange={(e) => updateCustomer("model", e.target.value)}
            options={modelOptions}
            disabled={!c.make}
          />
          <Select
            label="Fuel"
            value={c.fuel ?? DEFAULT_FUEL_TYPE}
            onChange={(e) => updateCustomer("fuel", e.target.value)}
            options={FUEL_OPTIONS}
          />
          <Select
            label="Jobcard Type"
            placeholder="Select Type"
            value={jobcard.jobCardType ?? ""}
            onChange={(e) =>
              onChange({ ...jobcardRef.current, jobCardType: e.target.value })
            }
            options={JOBCARD_TYPE_OPTIONS}
          />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <span className="text-sm font-semibold text-ink-800">
            Insurance Jobcard
          </span>
          <button
            type="button"
            role="switch"
            aria-label="Insurance Jobcard"
            aria-checked={Boolean(jobcard.insuranceEnabled)}
            onClick={() =>
              onChange({
                ...jobcard,
                insuranceEnabled: !jobcard.insuranceEnabled,
              })
            }
            className={clsx(
              "relative cursor-pointer h-6 w-11 shrink-0 rounded-full transition-colors",
              jobcard.insuranceEnabled ? "bg-brand-500" : "bg-accent-500",
            )}
          >
            <span
              className={clsx(
                "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                jobcard.insuranceEnabled ? "translate-x-5" : "translate-x-0",
              )}
            />
          </button>
          <span className="text-sm text-ink-500">
            {jobcard.insuranceEnabled ? "Yes" : "No"}
          </span>
        </div>
      </section>

      {jobcard.insuranceEnabled && (
        <>
          <section className="rounded-xl border border-ink-100 p-5">
            <h3 className="mb-4 text-base font-semibold text-ink-800">
              Insurance Details
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-9">
              <Input
                label="Location"
                placeholder="Filled from pincode"
                value={jobcard.insurance.location ?? ""}
                onChange={(e) => updateInsurance("location", e.target.value)}
              />
              <Select
                label="Insurer Name"
                placeholder="Select Insurer"
                value={jobcard.insurance.insurer ?? ""}
                onChange={(e) => handleInsurerChange(e.target.value)}
                options={insurers}
              />
              <Input
                label="Pincode"
                placeholder="Enter Pincode"
                inputMode="numeric"
                maxLength={6}
                value={jobcard.insurance.pincode ?? ""}
                onChange={(e) =>
                  updateInsurance("pincode", digitsOnly(e.target.value, 6))
                }
                hint={isPinLookingUp ? "Looking up..." : undefined}
              />
              <Select
                label="Area Name"
                placeholder={
                  areaOptions.length ? "Select Area" : "Enter Pincode first"
                }
                value={jobcard.insurance.areaName ?? ""}
                onChange={(e) => updateInsurance("areaName", e.target.value)}
                options={areaOptions}
                disabled={!areaOptions.length}
              />
              <Input
                label="City"
                placeholder="Filled from pincode"
                value={jobcard.insurance.city ?? ""}
                onChange={(e) => updateInsurance("city", e.target.value)}
              />
              <Input
                label="Claim No"
                placeholder="Enter Claim No"
                value={jobcard.insurance.claimNo ?? ""}
                onChange={(e) => updateInsurance("claimNo", e.target.value)}
              />
              <Input
                label="GSTIN Number"
                placeholder="e.g. 33ABCDE1234F1Z5"
                maxLength={15}
                value={jobcard.insurance.gstin ?? ""}
                onChange={(e) =>
                  updateInsurance(
                    "gstin",
                    e.target.value.toUpperCase().replace(/\s/g, ""),
                  )
                }
              />
              <Input
                label="Policy No"
                placeholder="Enter Policy No"
                value={jobcard.insurance.policyNo ?? ""}
                onChange={(e) => updateInsurance("policyNo", e.target.value)}
              />
              <Input
                type="date"
                label="Expiry Date"
                value={jobcard.insurance.expiryDate ?? ""}
                onChange={(e) => updateInsurance("expiryDate", e.target.value)}
              />
            </div>
          </section>

          <section className="rounded-xl border border-ink-100 p-5">
            <h3 className="mb-4 text-base font-semibold text-ink-800">
              Surveyor Details
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
              <Input
                label="Surveyor Name"
                placeholder="Enter Surveyor Name"
                value={jobcard.insurance.surveyorName ?? ""}
                onChange={(e) =>
                  updateInsurance("surveyorName", e.target.value)
                }
              />
              <Input
                label="Surveyor Mobile No"
                required
                placeholder="10-digit mobile"
                inputMode="numeric"
                maxLength={10}
                value={jobcard.insurance.surveyorMobile ?? ""}
                onChange={(e) =>
                  updateInsurance(
                    "surveyorMobile",
                    digitsOnly(e.target.value, 10),
                  )
                }
              />
              <Input
                type="email"
                label="Surveyor Email"
                placeholder="name@example.com"
                value={jobcard.insurance.surveyorEmail ?? ""}
                onChange={(e) =>
                  updateInsurance("surveyorEmail", e.target.value)
                }
              />
              <Input
                label="Estimated Cost (₹)"
                required
                placeholder="e.g. 15000"
                inputMode="decimal"
                value={jobcard.insurance.estimatedCost ?? ""}
                onChange={(e) =>
                  updateInsurance(
                    "estimatedCost",
                    e.target.value
                      .replace(/[^\d.]/g, "")
                      .replace(/(\..*)\./g, "$1"),
                  )
                }
              />
              <Input
                type="date"
                label="Surveyor Intimated Date"
                value={jobcard.insurance.surveyorIntimatedDate ?? ""}
                onChange={(e) =>
                  updateInsurance("surveyorIntimatedDate", e.target.value)
                }
              />
              <Input
                type="date"
                label="Surveyor Proposed Date"
                value={jobcard.insurance.surveyorProposedDate ?? ""}
                onChange={(e) =>
                  updateInsurance("surveyorProposedDate", e.target.value)
                }
              />
              <Input
                type="date"
                label="Surveyor Visited Date"
                value={jobcard.insurance.surveyorVisitedDate ?? ""}
                onChange={(e) =>
                  updateInsurance("surveyorVisitedDate", e.target.value)
                }
              />
              <Input
                type="date"
                label="Surveyor Approved Date"
                value={jobcard.insurance.surveyorApprovedDate ?? ""}
                onChange={(e) =>
                  updateInsurance("surveyorApprovedDate", e.target.value)
                }
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}