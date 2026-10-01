import { useEffect, useRef, useState } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { useMakeModelOptions } from "@/hooks/useMakeModelOptions";
import { vehicleApi } from "@/services";
import { FUEL_OPTIONS, DEFAULT_FUEL_TYPE } from "@/constants/vehicleEnums";
import { validate, isRequired, isMobile, isPincode } from "@/utils/validators";

export const emptyQuickAddForm = {
  name: "",
  mobile: "",
  pincode: "",
  address: "",
  regNo: "",
  make: "",
  model: "",
  fuel: DEFAULT_FUEL_TYPE,
};

const REGNO_DEBOUNCE_MS = 500;

const rules = {
  name: [[isRequired, "Name is required."]],
  mobile: [
    [isRequired, "Mobile number is required."],
    [isMobile, "Enter a valid 10-digit mobile number."],
  ],
  pincode: [[isPincode, "Enter a valid 6-digit pincode."]],
  regNo: [[isRequired, "Registration number is required."]],
};

// Used when the backend needs the vehicle's make/model ids (Estimate).
const makeModelRules = {
  make: [[isRequired, "Make is required."]],
  model: [[isRequired, "Model is required."]],
};

export default function CustomerQuickAddForm({
  value,
  onSubmit,
  requireMakeModel = false,
  isSubmitting = false,
}) {
  const [form, setForm] = useState(value ?? emptyQuickAddForm);
  const [errors, setErrors] = useState({});
  const [isLookingUp, setIsLookingUp] = useState(false);
  const matchRef = useRef(null);
  const regNoTimerRef = useRef(null);

  const { makeOptions, modelOptions, makeId, modelId } = useMakeModelOptions(
    form.make,
    form.model,
  );

  useEffect(() => {
    setForm(value ?? emptyQuickAddForm);
    setErrors({});
    matchRef.current = null;
  }, [value]);

  function update(field, val) {
    setForm((f) => {
      const next = { ...f, [field]: val };
      if (field === "make") next.model = "";
      return next;
    });
    if (field === "regNo") matchRef.current = null;
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  useEffect(() => {
    if (regNoTimerRef.current) clearTimeout(regNoTimerRef.current);
    const regNo = form.regNo.trim();
    if (regNo.length < 4) return undefined;

    regNoTimerRef.current = setTimeout(async () => {
      setIsLookingUp(true);
      try {
        const response = await vehicleApi.getByRegNo(regNo);
        const match = response?.vehicleData?.[0];
        if (match) {
          matchRef.current = {
            customerId: match.customeId,
            vehicleId: match.vehicleId,
          };
          setForm((f) => ({
            ...f,
            name: match.customerName ?? f.name,
            mobile: match.customerMobileNumber ?? f.mobile,
            pincode: match.pincode ?? f.pincode,
            address: match.customerAddress ?? f.address,
          }));
        }
      } catch {
        /* no match / lookup failed - leave the row as typed */
      } finally {
        setIsLookingUp(false);
      }
    }, REGNO_DEBOUNCE_MS);

    return () => clearTimeout(regNoTimerRef.current);
  }, [form.regNo]);

  function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = validate(
      form,
      requireMakeModel ? { ...rules, ...makeModelRules } : rules,
    );
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    onSubmit({ ...form, makeId, modelId }, matchRef.current);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 2xl:grid-cols-9"
    >
      <Input
        label="Name"
        placeholder="Enter Name"
        value={form.name}
        onChange={(e) => update("name", e.target.value)}
        error={errors.name}
      />
      <Input
        label="Mobile"
        placeholder="Enter Mobile"
        value={form.mobile}
        maxLength={10}
        onChange={(e) => update("mobile", e.target.value)}
        error={errors.mobile}
      />
      <Input
        label="Pincode"
        placeholder="Enter Pincode"
        value={form.pincode}
        onChange={(e) => update("pincode", e.target.value)}
        error={errors.pincode}
      />
      <Input
        label="Address"
        placeholder="Enter Address"
        value={form.address}
        onChange={(e) => update("address", e.target.value)}
      />
      <Input
        label="Reg.No."
        placeholder="Enter Reg.No."
        value={form.regNo}
        onChange={(e) => update("regNo", e.target.value.toUpperCase())}
        error={errors.regNo}
        hint={isLookingUp ? "Checking..." : undefined}
      />
      <Select
        label="Make"
        placeholder="Enter Make"
        value={form.make}
        onChange={(e) => update("make", e.target.value)}
        options={makeOptions}
        error={errors.make}
      />
      <Select
        label="Model"
        placeholder={form.make ? "Enter Model" : "Select a make first"}
        value={form.model}
        onChange={(e) => update("model", e.target.value)}
        options={modelOptions}
        disabled={!form.make}
        error={errors.model}
      />
      <Select
        label="Fuel"
        value={form.fuel}
        onChange={(e) => update("fuel", e.target.value)}
        options={FUEL_OPTIONS}
      />
      <Button
        type="submit"
        className="w-full xl:w-auto"
        isLoading={isSubmitting}
      >
        Add
      </Button>
    </form>
  );
}
