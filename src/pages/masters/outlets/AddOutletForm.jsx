import { useEffect, useState } from "react";
import SingleSelect from "@/components/ui/SingleSelect";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { outletApi } from "@/services";
import { bankApi, companyApi, pincodeApi, OUTLET_SEGMENTS } from "@/services";
import { validate, isRequired } from "@/utils/validators";
import { isSuccess, responseMessage } from "@/utils/apiResponse";
import { showToast } from "@/utils/toast";

const segmentOptions = OUTLET_SEGMENTS.map((s) => ({ value: s, label: s }));

const REQUIRED_FIELDS = [
  "outletCode",
  "outletName",
  "oracleSiteCode",
  "oracleCashCustomerCode",
  "oracleLocation",
  "gstIn",
  "email",
  "phoneNumber",
  "contactPhoneNumber",
  "contactEmail",
  "pincode",
  "address1",
  "address2",
  "contactPerson",
  "outletSegment",
  "latitude",
  "longitude",
  "bridgeId",
  "googleRatingLink",
  "bankName",
  "bankAccount",
  "typeofAccount",
  "branch",
  "micrCode",
  "ifscCode",
  "maxLabourDiscountPercentage",
  "maxPartDiscountPercentage",
  "companyId",
];

const rules = Object.fromEntries(
  REQUIRED_FIELDS.map((name) => [
    name,
    [[isRequired, "This field is required."]],
  ]),
);

const blankForm = {
  outletCode: "",
  outletName: "",
  oracleSiteCode: "",
  oracleCashCustomerCode: "",
  oracleLocation: "",
  gstIn: "",
  email: "",
  phoneNumber: "",
  contactPhoneNumber: "",
  contactEmail: "",
  pincode: "",
  state: "",
  city: "",
  address1: "",
  address2: "",
  contactPerson: "",
  outletSegment: "",
  latitude: "",
  longitude: "",
  bridgeId: "",
  googleRatingLink: "",
  bankName: "",
  bankAccount: "",
  typeofAccount: "",
  branch: "",
  micrCode: "",
  ifscCode: "",
  maxLabourDiscountPercentage: "",
  maxPartDiscountPercentage: "",
  companyId: "",
  status: 1,
};

export default function AddOutletForm({ outlet, onCreated, onCancel }) {
  const isEditing = Boolean(outlet);

  const bankOptions = useDropdownOptions(
    () => bankApi.getAll(),
    (b) => ({ value: b.bankName, label: b.bankName }),
    bankApi.listKey,
  );
  const companyOptions = useDropdownOptions(
    () => companyApi.getAll(),
    (c) => ({ value: String(c.id), label: c.name }),
    companyApi.listKey,
  );

  const [form, setForm] = useState(blankForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!outlet) return;
    setForm({
      ...blankForm,
      ...outlet,
      companyId: String(
        outlet.companyId ??
          companyOptions.find((c) => c.label === outlet.companyName)?.value ??
          "",
      ),
      status: outlet.status ? 1 : 0,
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [outlet]);

  // Resolve state/city from the pincode as soon as 6 digits are entered.
  useEffect(() => {
    const pin = String(form.pincode).replace(/\D/g, "").slice(0, 6);
    if (pin.length !== 6) return;

    let cancelled = false;
    (async () => {
      const response = await pincodeApi.lookup(pin);
      if (cancelled || !response?.requestSuccessful) return;
      setForm((f) => ({
        ...f,
        state: response.pincodeData?.state ?? f.state,
        city: response.pincodeData?.city ?? f.city,
      }));
    })();

    return () => {
      cancelled = true;
    };
  }, [form.pincode]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = validate(form, rules);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCompany = companyOptions.find(
        (c) => c.value === form.companyId,
      );

      const payload = {
        ...form,
        companyId: {
          id: Number(form.companyId) || form.companyId,
          name: selectedCompany?.label ?? form.companyName,
        },
      };
      if (isEditing) payload.id = outlet.id;

      const response = isEditing
        ? await outletApi.update(payload)
        : await outletApi.create(payload);

      if (!isSuccess(response)) {
        throw new Error(
          responseMessage(
            response,
            isEditing ? "Couldn't update outlet." : "Couldn't create outlet.",
          ),
        );
      }

      showToast.success(
        responseMessage(
          response,
          `${form.outletName} was ${isEditing ? "updated" : "created"} successfully.`,
        ),
      );
      onCreated?.();
    } catch (err) {
      showToast.error(
        err.message ||
          (isEditing ? "Couldn't update outlet." : "Couldn't create outlet."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6 ">
        <Input
          label="Outlet Code"
          required
          variant="underline"
          value={form.outletCode}
          onChange={(e) => update("outletCode", e.target.value)}
          error={errors.outletCode}
        />
        <Input
          label="Outlet Name"
          required
          variant="underline"
          value={form.outletName}
          onChange={(e) => update("outletName", e.target.value)}
          error={errors.outletName}
        />
        <Input
          label="Oracle Site Code"
          required
          variant="underline"
          value={form.oracleSiteCode}
          onChange={(e) => update("oracleSiteCode", e.target.value)}
          error={errors.oracleSiteCode}
        />

        <Input
          label="Oracle Cash Customer Code"
          required
          variant="underline"
          value={form.oracleCashCustomerCode}
          onChange={(e) => update("oracleCashCustomerCode", e.target.value)}
          error={errors.oracleCashCustomerCode}
        />
        <Input
          label="Oracle Location"
          required
          variant="underline"
          value={form.oracleLocation}
          onChange={(e) => update("oracleLocation", e.target.value)}
          error={errors.oracleLocation}
        />
        <Input
          label="GST In"
          required
          variant="underline"
          value={form.gstIn}
          onChange={(e) => update("gstIn", e.target.value)}
          error={errors.gstIn}
        />

        <Input
          label="Email"
          type="email"
          required
          variant="underline"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
          error={errors.email}
        />
        <Input
          label="Phone Number"
          required
          variant="underline"
          value={form.phoneNumber}
          onChange={(e) => update("phoneNumber", e.target.value)}
          error={errors.phoneNumber}
        />
        <Input
          label="Contact Phone Number"
          required
          variant="underline"
          value={form.contactPhoneNumber}
          onChange={(e) => update("contactPhoneNumber", e.target.value)}
          error={errors.contactPhoneNumber}
        />

        <Input
          label="Contact Email"
          type="email"
          required
          variant="underline"
          value={form.contactEmail}
          onChange={(e) => update("contactEmail", e.target.value)}
          error={errors.contactEmail}
        />
        <Input
          label="Pincode"
          required
          variant="underline"
          placeholder="6 digits - state and city fill in automatically"
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
          label="Contact Person"
          required
          variant="underline"
          value={form.contactPerson}
          onChange={(e) => update("contactPerson", e.target.value)}
          error={errors.contactPerson}
        />
        <div className="-mt-2.5">
          <SingleSelect
            label="Outlet Segment"
            required
            placeholder="Select a segment"
            value={form.outletSegment}
            onChange={(value) => update("outletSegment", value)}
            error={errors.outletSegment}
            options={segmentOptions}
          />
        </div>
        <Input
          label="Latitude"
          required
          variant="underline"
          value={form.latitude}
          onChange={(e) => update("latitude", e.target.value)}
          error={errors.latitude}
        />

        <Input
          label="Longitude"
          required
          variant="underline"
          value={form.longitude}
          onChange={(e) => update("longitude", e.target.value)}
          error={errors.longitude}
        />
        <Input
          label="Bridge ID"
          required
          variant="underline"
          value={form.bridgeId}
          onChange={(e) => update("bridgeId", e.target.value)}
          error={errors.bridgeId}
        />
        <Input
          label="Google Rating Link"
          required
          variant="underline"
          value={form.googleRatingLink}
          onChange={(e) => update("googleRatingLink", e.target.value)}
          error={errors.googleRatingLink}
        />
        <div className="-mt-2.5">
          <SingleSelect
            label="Bank"
            required
            placeholder="Select a bank"
            value={form.bankName}
            onChange={(value) => update("bankName", value)}
            error={errors.bankName}
            options={bankOptions}
          />
        </div>
        <Input
          label="Bank Account"
          type="number"
          required
          variant="underline"
          value={form.bankAccount}
          onChange={(e) => update("bankAccount", e.target.value)}
          error={errors.bankAccount}
        />
        <Input
          label="Type of Account"
          required
          variant="underline"
          value={form.typeofAccount}
          onChange={(e) => update("typeofAccount", e.target.value)}
          error={errors.typeofAccount}
        />

        <Input
          label="Branch"
          required
          variant="underline"
          value={form.branch}
          onChange={(e) => update("branch", e.target.value)}
          error={errors.branch}
        />
        <Input
          label="MICR Code"
          required
          variant="underline"
          value={form.micrCode}
          onChange={(e) => update("micrCode", e.target.value)}
          error={errors.micrCode}
        />
        <Input
          label="IFSC Code"
          required
          variant="underline"
          value={form.ifscCode}
          onChange={(e) => update("ifscCode", e.target.value)}
          error={errors.ifscCode}
        />

        <Input
          label="Max Labour Discount %"
          type="number"
          required
          variant="underline"
          value={form.maxLabourDiscountPercentage}
          onChange={(e) =>
            update("maxLabourDiscountPercentage", e.target.value)
          }
          error={errors.maxLabourDiscountPercentage}
        />
        <Input
          label="Max Part Discount %"
          type="number"
          required
          variant="underline"
          value={form.maxPartDiscountPercentage}
          onChange={(e) => update("maxPartDiscountPercentage", e.target.value)}
          error={errors.maxPartDiscountPercentage}
        />
        <div className="-mt-2.5">
          <SingleSelect
            label="Company"
            required
            placeholder="Select a company"
            value={form.companyId}
            onChange={(value) => update("companyId", value)}
            error={errors.companyId}
            options={companyOptions}
          />
        </div>
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
          {isEditing ? "Save changes" : "Create outlet"}
        </Button>
      </div>
    </form>
  );
}
