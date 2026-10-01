import { useEffect, useMemo, useState } from "react";
import SingleSelect from "@/components/ui/SingleSelect";
import Multiselect from "@/components/ui/Multiselect";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { vendorApi } from "@/services";
import { companyApi, pincodeApi, VENDOR_TYPES } from "@/services";
import { itemGroupApi } from "@/services";
import { validate, isRequired } from "@/utils/validators";
import { isSuccess, responseMessage } from "@/utils/apiResponse";
import { showToast } from "@/utils/toast";

const vendorTypeOptions = VENDOR_TYPES.map((t) => ({ value: t, label: t }));

const REQUIRED_FIELDS = [
  "vendorCode",
  "vendorName",
  "gstin",
  "panNumber",
  "address1",
  "address2",
  "pincode",
  "areaName",
  "contactPerson",
  "companyId",
  "itemGroupId",
  "vendorType",
  "marginPercentage",
];

const rules = Object.fromEntries(
  REQUIRED_FIELDS.map((name) => [
    name,
    [[isRequired, "This field is required."]],
  ]),
);

const blankForm = {
  vendorCode: "",
  vendorName: "",
  gstin: "",
  panNumber: "",
  address1: "",
  address2: "",
  pincode: "",
  state: "",
  city: "",
  areaName: "",
  mobileNumber: "",
  contactPerson: "",
  contactPersonMobileNo: "",
  companyId: [],
  itemGroupId: [],
  vendorType: "",
  marginPercentage: "",
  status: 1,
};

export default function AddVendorForm({ vendor, onCreated, onCancel }) {
  const isEditing = Boolean(vendor);

  const companyOptions = useDropdownOptions(
    () => companyApi.getAll(),
    (c) => ({ value: String(c.id), label: c.name }),
    companyApi.listKey,
  );
  const itemGroupOptions = useDropdownOptions(
    () => itemGroupApi.getAll(),
    (g) => ({ value: String(g.id), label: g.itemGroupCode }),
    itemGroupApi.listKey,
  );

  const [form, setForm] = useState(blankForm);
  const [areaNames, setAreaNames] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!vendor) return;
    const splitLabels = (value) =>
      String(value ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    setForm({
      ...blankForm,
      ...vendor,
      companyId: splitLabels(vendor.companies)
        .map((name) => companyOptions.find((c) => c.label === name)?.value)
        .filter(Boolean),
      itemGroupId: splitLabels(vendor.itemgroupId)
        .map((code) => itemGroupOptions.find((g) => g.label === code)?.value)
        .filter(Boolean),
      pincode: vendor.pincode ?? "",
      status: vendor.status ? 1 : 0,
    });
  }, [
    vendor,
    companyOptions.length,
    itemGroupOptions.length,
    companyOptions,
    itemGroupOptions,
  ]);

  useEffect(() => {
    const pin = String(form.pincode).replace(/\D/g, "").slice(0, 6);
    if (pin.length !== 6) return;

    let cancelled = false;
    (async () => {
      const response = await pincodeApi.lookup(pin);
      if (cancelled || !response?.requestSuccessful) return;
      const data = response.pincodeData ?? {};
      setAreaNames((data.areaNames ?? []).map((a) => a.area).filter(Boolean));
      setForm((f) => ({
        ...f,
        state: data.state ?? f.state,
        city: data.city ?? f.city,
      }));
    })();

    return () => {
      cancelled = true;
    };
  }, [form.pincode]);

  const areaOptions = useMemo(() => {
    const names = new Set(areaNames);
    if (form.areaName) names.add(form.areaName);
    return Array.from(names).map((a) => ({ value: a, label: a }));
  }, [areaNames, form.areaName]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = validate(
      {
        ...form,
        companyId: form.companyId.length ? "ok" : "",
        itemGroupId: form.itemGroupId.length ? "ok" : "",
      },
      rules,
    );
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        pincode: Number(form.pincode) || form.pincode,
        marginPercentage: Number(form.marginPercentage),
        companyId: form.companyId.map((id) => ({
          id: Number(id),
          name: companyOptions.find((c) => c.value === id)?.label ?? "",
        })),
        itemGroupId: form.itemGroupId.map((id) => ({
          id: Number(id),
          itemGroupCode:
            itemGroupOptions.find((g) => g.value === id)?.label ?? "",
        })),
      };
      if (isEditing) payload.id = vendor.id;

      const response = isEditing
        ? await vendorApi.update(payload)
        : await vendorApi.create(payload);

      if (!isSuccess(response)) {
        throw new Error(
          responseMessage(
            response,
            isEditing ? "Couldn't update vendor." : "Couldn't create vendor.",
          ),
        );
      }

      showToast.success(
        responseMessage(
          response,
          `${form.vendorName} was ${isEditing ? "updated" : "created"} successfully.`,
        ),
      );
      onCreated?.();
    } catch (err) {
      showToast.error(
        err.message ||
          (isEditing ? "Couldn't update vendor." : "Couldn't create vendor."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6 ">
        <Input
          label="Vendor Code"
          required
          variant="underline"
          value={form.vendorCode}
          onChange={(e) => update("vendorCode", e.target.value)}
          error={errors.vendorCode}
        />
        <Input
          label="Vendor Name"
          required
          variant="underline"
          value={form.vendorName}
          onChange={(e) => update("vendorName", e.target.value)}
          error={errors.vendorName}
        />
        <Input
          label="GSTIN"
          required
          variant="underline"
          value={form.gstin}
          onChange={(e) => update("gstin", e.target.value)}
          error={errors.gstin}
        />

        <Input
          label="PAN Number"
          required
          variant="underline"
          value={form.panNumber}
          onChange={(e) => update("panNumber", e.target.value)}
          error={errors.panNumber}
        />
        <Input
          label="Address 1"
          required
          variant="underline"
          value={form.address1}
          onChange={(e) => update("address1", e.target.value)}
          error={errors.address1}
        />
        <Input
          label="Address 2"
          required
          variant="underline"
          value={form.address2}
          onChange={(e) => update("address2", e.target.value)}
          error={errors.address2}
        />

        <Input
          label="Pincode"
          required
          variant="underline"
          placeholder="6 digits - state, city and areas fill in automatically"
          value={form.pincode}
          onChange={(e) => update("pincode", e.target.value)}
          error={errors.pincode}
        />
        {/* Resolved from the pincode above; shown but not editable. */}
        <Input
          label="State"
          variant="underline"
          readOnly
          className="bg-ink-50 text-ink-500"
          value={form.state}
        />
        <Input
          label="City"
          variant="underline"
          readOnly
          className="bg-ink-50 text-ink-500"
          value={form.city}
        />

        <div className="-mt-2.5">
          <SingleSelect
            label="Area Name"
            required
            placeholder={
              form.pincode ? "Select an area" : "Enter a pincode first"
            }
            value={form.areaName}
            onChange={(value) => update("areaName", value)}
            error={errors.areaName}
            options={areaOptions}
          />
        </div>
        <Input
          label="Mobile Number"
          variant="underline"
          maxLength={10}
          value={form.mobileNumber}
          onChange={(e) => update("mobileNumber", e.target.value)}
          error={errors.mobileNumber}
        />
        <Input
          label="Contact Person"
          required
          variant="underline"
          value={form.contactPerson}
          onChange={(e) => update("contactPerson", e.target.value)}
          error={errors.contactPerson}
        />

        <Input
          label="Contact Person Mobile No"
          variant="underline"
          value={form.contactPersonMobileNo}
          onChange={(e) => update("contactPersonMobileNo", e.target.value)}
          error={errors.contactPersonMobileNo}
        />
        <div className="-mt-1.5">
          <Multiselect
            label="Company"
            required
            options={companyOptions}
            value={form.companyId}
            onChange={(value) => update("companyId", value)}
            placeholder="Select companies"
            error={errors.companyId}
          />
        </div>
        <div className="-mt-1.5">
          <Multiselect
            label="Item Group"
            required
            options={itemGroupOptions}
            value={form.itemGroupId}
            onChange={(value) => update("itemGroupId", value)}
            placeholder="Select item groups"
            error={errors.itemGroupId}
          />
        </div>
        <div className="-mt-2.5">
          <SingleSelect
            label="Vendor Type"
            required
            placeholder="Select a vendor type"
            value={form.vendorType}
            onChange={(value) => update("vendorType", value)}
            error={errors.vendorType}
            options={vendorTypeOptions}
          />
        </div>
        <Input
          label="Margin Percentage"
          type="number"
          required
          variant="underline"
          value={form.marginPercentage}
          onChange={(e) => update("marginPercentage", e.target.value)}
          error={errors.marginPercentage}
        />
      </div>

      <div className="flex flex-wrap gap-6 pt-1">
        <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
          <input
            type="checkbox"
            className="h-4 w-4 cursor-pointer rounded border-ink-300 text-brand-600"
            checked={form.status === 1}
            onChange={(e) => update("status", e.target.checked ? 1 : 0)}
          />
          Active
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isEditing ? "Save changes" : "Create vendor"}
        </Button>
      </div>
    </form>
  );
}
