import { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { useMakeModelOptions } from "@/hooks/useMakeModelOptions";
import {
  customerApi,
  customerCategoryApi,
  insuranceApi,
  pincodeApi,
} from "@/services";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { FUEL_OPTIONS, YES_NO_OPTIONS } from "@/constants/vehicleEnums";
import { validate, isRequired, isMobile, isPincode } from "@/utils/validators";
import { showToast } from "@/utils/toast";
import { responseMessage } from "@/utils/apiResponse";

const emptyDetails = {
  name: "",
  mobile: "",
  pincode: "",
  address: "",
  profileCategory: "",
  regNo: "",
  make: "",
  model: "",
  fuel: "",
  chassisNo: "",
  engineNo: "",
  manufacturerYear: "",
  state: "",
  city: "",
  insLocation: "",
  insInsurerName: "",
  insAreaName: "",
  insPincode: "",
  insCity: "",
  insClaimNo: "",
  insGstin: "",
  insPolicyNo: "",
  insExpiryDate: "",
  permitDue: "",
  taxDue: "",
  contranceFlag: "",
  fcRenewalDate: "",
  hyplotication: "",
};

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => String(currentYear - i));

const rules = {
  name: [[isRequired, "Name is required."]],
  mobile: [
    [isRequired, "Mobile number is required."],
    [isMobile, "Enter a valid 10-digit mobile number."],
  ],
  pincode: [[isPincode, "Enter a valid 6-digit pincode."]],
  regNo: [[isRequired, "Registration number is required."]],
};

export default function CustomerDetailsModal({
  isOpen,
  onClose,
  onSubmit,
  customer,
}) {
  const [form, setForm] = useState(emptyDetails);
  const [errors, setErrors] = useState({});
  const [areaOptions, setAreaOptions] = useState([]);
  const { makeOptions, modelOptions, makeId, modelId } = useMakeModelOptions(
    form.make,
    form.model,
  );

  const categoryOptions = useDropdownOptions(
    () => customerCategoryApi.getAll(),
    (c) => ({ value: c.customerCategory, label: c.customerCategory }),
    customerCategoryApi.listKey,
  );

  const insurers = useDropdownOptions(
    () => insuranceApi.getAll(),
    (i) => ({ value: i.insuranceName, label: i.insuranceName, id: i.id }),
    insuranceApi.allKey,
  );

  useEffect(() => {
    if (isOpen) {
      setForm({ ...emptyDetails, ...customer });
      setErrors({});
    }
  }, [isOpen, customer]);
  useEffect(() => {
    const pin = String(form.insPincode ?? "")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pin.length !== 6) {
      setAreaOptions([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await pincodeApi.lookup(pin);
        if (cancelled || !response?.requestSuccessful) return;
        const data = response.pincodeData ?? {};
        setForm((f) => ({
          ...f,
          insLocation: data.state ?? f.insLocation,
          insCity: data.city ?? f.insCity,
        }));
        setAreaOptions(
          (data.areaNames ?? []).map((a) => ({ value: a.area, label: a.area })),
        );
      } catch {
        setAreaOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.insPincode]);
  useEffect(() => {
    const pin = String(form.pincode ?? "")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pin.length !== 6) return;

    let cancelled = false;
    (async () => {
      try {
        const response = await pincodeApi.lookup(pin);
        if (cancelled || !response?.requestSuccessful) return;
        const data = response.pincodeData ?? {};
        setForm((f) => ({
          ...f,
          state: data.state ?? f.state,
          city: data.city ?? f.city,
        }));
      } catch {
        /* leave whatever is already there */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.pincode]);

  function update(field, value) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      // Model options depend on Make - clear a now-invalid selection.
      if (field === "make") next.model = "";
      return next;
    });
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = validate(form, rules);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    const insurerId =
      insurers.find((i) => i.value === form.insInsurerName)?.id ?? null;

    try {
      const response = await customerApi.updateDetails({
        customerId: customer.id,
        vehicleId: customer.vehicleId,
        name: form.name,
        mobileNumber: form.mobile,
        pinCode: form.pincode,
        address1: form.address,
        customerCategory: form.profileCategory,
        state: form.state,
        city: form.city,
        registrationNumber: form.regNo,
        makeId,
        modelId,
        fuelType: form.fuel,
        chassisNumber: form.chassisNo,
        engineNumber: form.engineNo,
        manufacturingYear: form.manufacturerYear,
        insurance: {
          insuranceProviderId: insurerId,
          location: form.insLocation,
          areaName: form.insAreaName,
          pincode: form.insPincode,
          city: form.insCity,
          claimNo: form.insClaimNo,
          gstinNumber: form.insGstin,
          policyNo: form.insPolicyNo,
          expiryDate: form.insExpiryDate,
        },
        otherDetails: {
          permitDue: form.permitDue,
          taxDue: form.taxDue,
          contranceFlag: form.contranceFlag,
          fcRenewalDate: form.fcRenewalDate,
          hypothecationAmount: form.hyplotication || null,
        },
      });
      showToast.success(
        responseMessage(response, "Customer updated successfully."),
      );
      onSubmit();
    } catch (err) {
      showToast.error(err.message || "Couldn't update customer.");
    }
  }
  const fieldGrid =
    "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Customer & Vehicle Details"
      size="xl"
      footer={
        <Button type="submit" form="customer-details-form">
          Update
        </Button>
      }
    >
      <form
        id="customer-details-form"
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <div className={fieldGrid}>
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

          <Select
            label="Profile Category"
            placeholder="Select category"
            value={form.profileCategory}
            onChange={(e) => update("profileCategory", e.target.value)}
            options={categoryOptions}
          />
          <Input
            label="Reg.No."
            placeholder="Enter Reg.No."
            value={form.regNo}
            onChange={(e) => update("regNo", e.target.value.toUpperCase())}
            error={errors.regNo}
          />
          <Select
            label="Make"
            placeholder="Enter Make"
            value={form.make}
            onChange={(e) => update("make", e.target.value)}
            options={makeOptions}
          />
          <Select
            label="Model"
            placeholder={form.make ? "Enter Model" : "Select a make first"}
            value={form.model}
            onChange={(e) => update("model", e.target.value)}
            options={modelOptions}
            disabled={!form.make}
          />
          <Select
            label="Fuel"
            placeholder="Select fuel"
            value={form.fuel}
            onChange={(e) => update("fuel", e.target.value)}
            options={FUEL_OPTIONS}
          />

          <Input
            label="Chassis No"
            placeholder="Enter Chassis No"
            value={form.chassisNo}
            onChange={(e) => update("chassisNo", e.target.value)}
          />
          <Input
            label="Engine No"
            placeholder="Enter Engine No"
            value={form.engineNo}
            onChange={(e) => update("engineNo", e.target.value)}
          />
          <Select
            label="Manufacturer Year"
            placeholder="Select year"
            value={form.manufacturerYear}
            onChange={(e) => update("manufacturerYear", e.target.value)}
            options={YEARS.map((y) => ({ value: y, label: y }))}
          />
          {/* Filled from the pincode above. */}
          <Input
            label="State"
            readOnly
            className="bg-ink-50 text-ink-500"
            value={form.state}
          />
          <Input
            label="City"
            readOnly
            className="bg-ink-50 text-ink-500"
            value={form.city}
          />
        </div>

        <div>
          <h3 className="mb-3 text-base font-semibold text-ink-800">
            Insurance Details
          </h3>
          <div className={fieldGrid}>
            <Input
              label="Location"
              placeholder="Enter Location"
              value={form.insLocation}
              onChange={(e) => update("insLocation", e.target.value)}
            />
            <Select
              label="Insurer Name"
              placeholder="Select insurer"
              value={form.insInsurerName}
              onChange={(e) => update("insInsurerName", e.target.value)}
              options={insurers}
            />
            <Select
              label="Area Name"
              placeholder={
                areaOptions.length ? "Select area" : "Enter pincode first"
              }
              value={form.insAreaName}
              onChange={(e) => update("insAreaName", e.target.value)}
              options={areaOptions}
              disabled={!areaOptions.length}
            />
            <Input
              label="Pincode"
              placeholder="Enter Pincode"
              value={form.insPincode}
              onChange={(e) => update("insPincode", e.target.value)}
            />
            <Input
              label="City"
              placeholder="Enter City"
              value={form.insCity}
              onChange={(e) => update("insCity", e.target.value)}
            />
            <Input
              label="Claim No"
              placeholder="Enter Claim no"
              value={form.insClaimNo}
              onChange={(e) => update("insClaimNo", e.target.value)}
            />
            <Input
              label="GSTIN Number"
              placeholder="Enter GSTIN no"
              value={form.insGstin}
              onChange={(e) => update("insGstin", e.target.value)}
            />
            <Input
              label="Policy No"
              placeholder="Enter Policy No"
              value={form.insPolicyNo}
              onChange={(e) => update("insPolicyNo", e.target.value)}
            />
            <Input
              type="date"
              label="Expiry Date"
              value={form.insExpiryDate}
              onChange={(e) => update("insExpiryDate", e.target.value)}
            />
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-base font-semibold text-ink-800">
            Other Details
          </h3>
          <div className={fieldGrid}>
            <Input
              type="date"
              label="Permit Due"
              value={form.permitDue}
              onChange={(e) => update("permitDue", e.target.value)}
            />
            <Input
              type="date"
              label="Tax Due"
              value={form.taxDue}
              onChange={(e) => update("taxDue", e.target.value)}
            />
            <Select
              label="Contrance Flag"
              placeholder="Select flag"
              value={form.contranceFlag}
              onChange={(e) => update("contranceFlag", e.target.value)}
              options={YES_NO_OPTIONS}
            />
            <Input
              type="date"
              label="FC Renewal Date"
              value={form.fcRenewalDate}
              onChange={(e) => update("fcRenewalDate", e.target.value)}
            />
            <Input
              label="Hyplotication"
              placeholder="Enter amount"
              value={form.hyplotication}
              onChange={(e) => update("hyplotication", e.target.value)}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
