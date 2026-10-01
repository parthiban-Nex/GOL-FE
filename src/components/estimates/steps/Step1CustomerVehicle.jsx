import { useEffect, useRef, useState } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useMakeModelOptions } from "@/hooks/useMakeModelOptions";
import { vehicleApi } from "@/services";
import { FUEL_OPTIONS } from "@/constants/vehicleEnums";

const REGNO_DEBOUNCE_MS = 500;

/** Wizard Step 1 - Customer & Vehicle details. */
export default function Step1CustomerVehicle({ value, errors, onChange }) {
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");
  const regNoTimerRef = useRef(null);

  // The reg-no lookup resolves after a delay - always merge into the
  // latest value, not the one captured when the timer started.
  const valueRef = useRef(value);
  valueRef.current = value;

  const { makeOptions, modelOptions } = useMakeModelOptions(
    value.make,
    value.model,
  );

  function emit(patch) {
    onChange({ ...valueRef.current, ...patch });
  }

  function update(field, val) {
    if (field === "make") {
      const option = makeOptions.find((m) => m.value === val);
      emit({
        make: val,
        makeId: option?.id ?? null,
        model: "",
        modelId: null,
        modelSegment: "",
      });
      return;
    }
    if (field === "model") {
      const option = modelOptions.find((m) => m.value === val);
      emit({
        model: val,
        modelId: option?.id ?? null,
        modelSegment: option?.segment ?? "",
      });
      return;
    }
    if (field === "regNo") {
      emit({ regNo: val, customerId: null, vehicleId: null });
      setLookupMessage("");
      scheduleRegNoLookup(val);
      return;
    }
    emit({ [field]: val });
  }

  // POST /vehicle/getVehicleDetailsByRegNo - only fired when the user types
  // a reg. no., so opening an existing estimate never overwrites it.
  function scheduleRegNoLookup(regNoInput) {
    if (regNoTimerRef.current) clearTimeout(regNoTimerRef.current);
    const regNo = regNoInput.trim();
    if (regNo.length < 4) return;

    regNoTimerRef.current = setTimeout(async () => {
      setIsLookingUp(true);
      try {
        const response = await vehicleApi.getByRegNo(regNo);
        if (valueRef.current.regNo.trim() !== regNo) return; // typed on
        const match = response?.requestSuccessful
          ? response.vehicleData?.[0]
          : null;
        if (!match) return;

        const current = valueRef.current;
        const customer = match.customerData ?? {};
        const makeName =
          makeOptions.find((m) => m.id === match.makeId)?.value ?? "";

        emit({
          name: match.customerName ?? customer.name ?? current.name,
          mobile:
            match.customerMobileNumber ??
            customer.mobileNumber ??
            current.mobile,
          pincode: match.pincode ?? customer.pinCode ?? current.pincode,
          address:
            match.customerAddress ?? customer.address1 ?? current.address,
          customerId: match.customeId ?? customer.customerId ?? null,
          vehicleId: match.vehicleId ?? null,
          makeId: match.makeId ?? current.makeId,
          modelId: match.modelId ?? current.modelId,
          modelSegment: match.modelSegment ?? current.modelSegment ?? "",
          customerState:
            match.customerState ??
            customer.state ??
            current.customerState ??
            "",
          // Names are resolved from the ids by the effects below once the
          // make/model options are loaded.
          make: makeName,
          model: "",
        });
        setLookupMessage(match.message ?? "");
      } catch {
        /* no match / lookup failed - leave the fields as typed */
      } finally {
        setIsLookingUp(false);
      }
    }, REGNO_DEBOUNCE_MS);
  }

  useEffect(() => () => clearTimeout(regNoTimerRef.current), []);

  // Fill the Make name from makeId (reg-no lookup, or makes still loading).
  useEffect(() => {
    if (!value.makeId || value.make) return;
    const option = makeOptions.find((m) => m.id === value.makeId);
    if (option) emit({ make: option.value });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [makeOptions, value.makeId, value.make]);

  // Same for Model once that make's models have loaded.
  useEffect(() => {
    if (!value.modelId || value.model) return;
    const option = modelOptions.find((m) => m.id === value.modelId);
    if (option) {
      emit({
        model: option.value,
        modelSegment: value.modelSegment || option.segment || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelOptions, value.modelId, value.model]);

  return (
    <div className="rounded-xl border border-ink-100 p-5">
      <h2 className="mb-4 text-base font-semibold text-ink-800">
        Customer & Vehicle Details
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <Input
          label="Name"
          placeholder="Enter Name"
          value={value.name}
          onChange={(e) => update("name", e.target.value)}
          error={errors?.name}
        />
        <Input
          label="Mobile"
          placeholder="Enter Mobile"
          value={value.mobile}
          maxLength={10}
          onChange={(e) => update("mobile", e.target.value)}
          error={errors?.mobile}
        />
        <Input
          label="Pincode"
          placeholder="Enter Pincode"
          value={value.pincode}
          onChange={(e) => update("pincode", e.target.value)}
          error={errors?.pincode}
        />
        <Input
          label="Address"
          placeholder="Enter Address"
          value={value.address}
          onChange={(e) => update("address", e.target.value)}
        />
        <Input
          label="Reg.No."
          placeholder="Enter Reg.No."
          value={value.regNo}
          onChange={(e) => update("regNo", e.target.value.toUpperCase())}
          error={errors?.regNo}
          hint={isLookingUp ? "Checking..." : lookupMessage || undefined}
        />
        <Select
          label="Make"
          placeholder="Select Make"
          value={value.make}
          onChange={(e) => update("make", e.target.value)}
          options={makeOptions}
        />
        <Select
          label="Model"
          placeholder="Select Model"
          value={value.model}
          onChange={(e) => update("model", e.target.value)}
          options={modelOptions}
          disabled={!value.make}
        />
        <Select
          label="Fuel"
          value={value.fuel}
          onChange={(e) => update("fuel", e.target.value)}
          options={FUEL_OPTIONS}
        />
      </div>
    </div>
  );
}
