import { useEffect, useMemo, useRef, useState } from "react";
import { FileText } from "lucide-react";
import clsx from "clsx";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { insuranceApi, pincodeApi } from "@/services";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";

const CLAIM_OPTIONS = ["Yes", "No", "Decide Later"];

/** Wizard Step 3 - insurance claim + surveyor details. */
export default function Step3Insurance({ value, onChange }) {
  // The pincode lookup resolves later - merge into the latest value.
  const valueRef = useRef(value);
  valueRef.current = value;

  function update(field, val) {
    onChange({ ...valueRef.current, [field]: val });
  }

  // GET /insurance/getAllInsurances
  const insurers = useDropdownOptions(
    () => insuranceApi.getAll(),
    (i) => ({ value: i.insuranceName, label: i.insuranceName, id: i.id }),
    insuranceApi.allKey,
  );

  function handleInsurerChange(name) {
    const option = insurers.find((i) => i.value === name);
    onChange({
      ...valueRef.current,
      insurer: name,
      insuranceId: option?.id ?? null,
    });
  }

  // POST /vendors/getPincodeData -> State (Location), City, Area names.
  const [areaNames, setAreaNames] = useState([]);
  useEffect(() => {
    const pin = String(value.pincode ?? "")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pin.length !== 6) {
      setAreaNames([]);
      return undefined;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await pincodeApi.lookup(pin);
        if (cancelled || !response?.requestSuccessful) return;
        const data = response.pincodeData ?? {};
        setAreaNames((data.areaNames ?? []).map((a) => a.area).filter(Boolean));
        const current = valueRef.current;
        onChange({
          ...current,
          location: data.state ?? current.location,
          city: data.city ?? current.city,
        });
      } catch {
        if (!cancelled) setAreaNames([]);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.pincode]);

  // Keep an already-saved area selectable even if it isn't in the list.
  const areaOptions = useMemo(() => {
    const names = new Set(areaNames);
    if (value.areaName) names.add(value.areaName);
    return [...names].map((a) => ({ value: a, label: a }));
  }, [areaNames, value.areaName]);

  const showDetails = value.claim === "Yes";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-6 rounded-xl border border-ink-100 bg-brand-50/40 px-4 py-3">
        <div className="flex items-center gap-2 font-semibold text-ink-800">
          <FileText className="h-4 w-4 text-brand-600" />
          Insurance Claim
        </div>
        <div className="flex flex-wrap items-center gap-5 ">
          {CLAIM_OPTIONS.map((opt) => (
            <label
              key={opt}
              className="flex cursor-pointer items-center gap-2 text-sm text-ink-700"
            >
              <input
                type="radio"
                name="insurance-claim"
                value={opt}
                checked={value.claim === opt}
                onChange={() => update("claim", opt)}
                className="h-4 w-4 border-ink-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
              {opt}
            </label>
          ))}
        </div>
      </div>

      <div
        className={clsx(
          "space-y-6 transition-opacity",
          !showDetails && "pointer-events-none opacity-40",
        )}
      >
        <section className="rounded-xl border border-ink-100 p-5">
          <h3 className="mb-4 text-base font-semibold text-ink-800">
            Insurance Details
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-9">
            <Input
              label="Location"
              placeholder="Enter Location"
              value={value.location}
              onChange={(e) => update("location", e.target.value)}
            />
            <Select
              label="Insurer Name"
              placeholder="Enter Name"
              value={value.insurer}
              onChange={(e) => handleInsurerChange(e.target.value)}
              options={insurers}
            />
            <Select
              label="Area Name"
              placeholder={
                areaOptions.length ? "Select Area" : "Enter Pincode first"
              }
              value={value.areaName}
              onChange={(e) => update("areaName", e.target.value)}
              options={areaOptions}
              disabled={!areaOptions.length}
            />
            <Input
              label="Pincode"
              placeholder="Enter Pincode"
              value={value.pincode}
              onChange={(e) =>
                update("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))
              }
            />
            <Input
              label="City"
              placeholder="City"
              value={value.city}
              onChange={(e) => update("city", e.target.value)}
            />
            <Input
              label="Claim No"
              placeholder="Enter Claim no"
              value={value.claimNo}
              onChange={(e) => update("claimNo", e.target.value)}
            />
            <Input
              label="GSTIN Number"
              placeholder="Enter GSTIN no"
              value={value.gstin}
              onChange={(e) => update("gstin", e.target.value.toUpperCase())}
            />
            <Input
              label="Policy No"
              placeholder="Enter Policy No"
              value={value.policyNo}
              onChange={(e) => update("policyNo", e.target.value)}
            />
            <Input
              type="date"
              label="Expiry Date"
              value={value.expiryDate}
              onChange={(e) => update("expiryDate", e.target.value)}
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
              placeholder="Enter Name"
              value={value.surveyorName}
              onChange={(e) => update("surveyorName", e.target.value)}
            />
            <Input
              label="Surveyor MobileNo *"
              placeholder="Enter Mobile no"
              value={value.surveyorMobile}
              onChange={(e) => update("surveyorMobile", e.target.value)}
            />
            <Input
              label="Surveyor Email"
              placeholder="Enter Email"
              value={value.surveyorEmail}
              onChange={(e) => update("surveyorEmail", e.target.value)}
            />
            <Input
              label="Estimated Cost *"
              placeholder="15000"
              value={value.estimatedCost}
              onChange={(e) => update("estimatedCost", e.target.value)}
            />
            <Input
              type="date"
              label="Surveyor Intimated Date"
              value={value.surveyorIntimatedDate}
              onChange={(e) => update("surveyorIntimatedDate", e.target.value)}
            />
            <Input
              type="date"
              label="Surveyor Proposed Date"
              value={value.surveyorProposedDate}
              onChange={(e) => update("surveyorProposedDate", e.target.value)}
            />
            <Input
              type="date"
              label="Surveyor Visited Date"
              value={value.surveyorVisitedDate}
              onChange={(e) => update("surveyorVisitedDate", e.target.value)}
            />
            <Input
              type="date"
              label="Surveyor Approved Date"
              value={value.surveyorApprovedDate}
              onChange={(e) => update("surveyorApprovedDate", e.target.value)}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
