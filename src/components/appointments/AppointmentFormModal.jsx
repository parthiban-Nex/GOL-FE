import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { UserRound, CalendarClock, Truck, ClipboardCheck } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { useMakeModelOptions } from "@/hooks/useMakeModelOptions";
import { FUEL_OPTIONS, DEFAULT_FUEL_TYPE } from "@/constants/vehicleEnums";
import {
  advisorApi,
  serviceTypeApi,
  pickupDropDriverApi,
  vehicleApi,
  pincodeApi,
} from "@/services";
import {
  APPOINTMENT_CREATE_STATUS,
  APPOINTMENT_EDIT_STATUSES,
  STATUS_RESCHEDULED,
  STATUS_PROCEED_TO_JOBCARD,
  fieldsForStatus,
  validateStatusFields,
  slotOptionsFor,
} from "@/constants/appointmentStatus";
import {
  emptyPickupDrop,
  validatePickupDrop,
} from "@/constants/appointmentPickupDrop";
import { validate, isRequired, isMobile, isPincode } from "@/utils/validators";

const emptyForm = {
  customer: "",
  customerMobile: "",
  customerId: null,
  vehicle: "",
  vehicleId: null,
  make: "",
  makeId: null,
  model: "",
  modelId: null,
  fuelType: DEFAULT_FUEL_TYPE,
  customerAddress: "",
  pinCode: "",
  customerCity: "",
  customerState: "",
  service: "",
  advisor: "",
  date: "",
  start: "", // slot start "HH:MM"
  status: APPOINTMENT_CREATE_STATUS,
  // Edit only
  remarks: "",
  statusValues: {}, // inputs of the selected status, see STATUS_FIELDS
  createEstimate: false, // Proceed to Jobcard toggle
  ...emptyPickupDrop,
};

const REGNO_DEBOUNCE_MS = 500;

/** POST /vehicle/getVehicleDetailsByRegNo -> first match, or null. */
async function lookupVehicle(regNo) {
  const response = await vehicleApi.getByRegNo(regNo);
  return response?.requestSuccessful
    ? (response.vehicleData?.[0] ?? null)
    : null;
}

/** customerId / vehicleId from a getVehicleDetailsByRegNo match. The
 * backend spells the customer id "customeId" at the top level. */
function idsFromMatch(match) {
  return {
    customerId: match?.customeId ?? match?.customerData?.customerId ?? null,
    vehicleId: match?.vehicleId ?? null,
  };
}

// Customer / vehicle identity can't be changed on an existing appointment.
const READ_ONLY_CLASS = "bg-ink-50 text-ink-500 cursor-not-allowed";

const rules = {
  customer: [[isRequired, "Customer name is required."]],
  customerMobile: [
    [isRequired, "Customer mobile is required."],
    [isMobile, "Enter a valid 10-digit mobile number."],
  ],
  vehicle: [[isRequired, "Vehicle registration is required."]],
  // Optional, but must be 6 digits when given.
  pinCode: [[(v) => !v || isPincode(v), "Enter a valid 6-digit pincode."]],
  make: [[isRequired, "Make is required."]],
  model: [[isRequired, "Model is required."]],
  service: [[isRequired, "Service type is required."]],
  advisor: [[isRequired, "Advisor is required."]],
  date: [[isRequired, "Date is required."]],
  start: [[isRequired, "Slot is required."]],
};

const editRules = {
  ...rules,
  make: [],
  model: [],
  status: [[isRequired, "Status is required."]],
};

const todayISO = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

function submitLabel(form, isEdit) {
  if (!isEdit) return "Create";
  if (form.status === STATUS_RESCHEDULED) return "Proceed to Reschedule";
  if (form.status === STATUS_PROCEED_TO_JOBCARD) {
    return form.createEstimate ? "Proceed to Estimate" : "Proceed to Jobcard";
  }
  return "Save";
}

export default function AppointmentFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialValues,
  defaultDate,
  isSubmitting = false,
}) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupMessage, setLookupMessage] = useState("");
  const [isResolving, setIsResolving] = useState(false);

  // Pincode -> City / State (POST /vendors/getPincodeData), filled when
  // the user types a full pincode; both stay editable.
  const [isPinLookingUp, setIsPinLookingUp] = useState(false);
  const pinRequestRef = useRef(0);

  async function handlePincodeChange(raw) {
    const pin = raw.replace(/\D/g, "").slice(0, 6);
    update("pinCode", pin);
    if (pin.length !== 6) return;
    const requestId = ++pinRequestRef.current;
    setIsPinLookingUp(true);
    try {
      const res = await pincodeApi.lookup(pin);
      if (requestId !== pinRequestRef.current || !res?.requestSuccessful)
        return;
      const data = res.pincodeData ?? {};
      setForm((f) => ({
        ...f,
        customerCity: data.city || f.customerCity,
        customerState: data.state || f.customerState,
      }));
    } catch {
      /* keep what was typed */
    } finally {
      if (requestId === pinRequestRef.current) setIsPinLookingUp(false);
    }
  }

  // Make / Model - same hook and id <-> name handling as Estimate Step 1.
  const { makeOptions, modelOptions } = useMakeModelOptions(
    form.make,
    form.model,
  );

  function handleMakeChange(value) {
    const option = makeOptions.find((m) => m.value === value);
    setForm((f) => ({
      ...f,
      make: value,
      makeId: option?.id ?? null,
      model: "",
      modelId: null,
    }));
    setErrors((e) => ({ ...e, make: undefined, model: undefined }));
  }

  function handleModelChange(value) {
    const option = modelOptions.find((m) => m.value === value);
    setForm((f) => ({ ...f, model: value, modelId: option?.id ?? null }));
    if (errors.model) setErrors((e) => ({ ...e, model: undefined }));
  }

  // Make: id -> name (after a reg. no. lookup) or name -> id (saved name).
  useEffect(() => {
    if (form.makeId && !form.make) {
      const option = makeOptions.find(
        (m) => String(m.id) === String(form.makeId),
      );
      if (option) setForm((f) => ({ ...f, make: option.value }));
    } else if (form.make && !form.makeId) {
      const option = makeOptions.find(
        (m) => m.value.toLowerCase() === form.make.toLowerCase(),
      );
      if (option)
        setForm((f) => ({ ...f, make: option.value, makeId: option.id }));
    }
  }, [makeOptions, form.makeId, form.make]);

  // Model: same, once that make's models have loaded.
  useEffect(() => {
    if (form.modelId && !form.model) {
      const option = modelOptions.find(
        (m) => String(m.id) === String(form.modelId),
      );
      if (option) setForm((f) => ({ ...f, model: option.value }));
    } else if (form.model && !form.modelId) {
      const option = modelOptions.find(
        (m) => m.value.toLowerCase() === form.model.toLowerCase(),
      );
      if (option)
        setForm((f) => ({ ...f, model: option.value, modelId: option.id }));
    }
  }, [modelOptions, form.modelId, form.model]);
  const regNoTimerRef = useRef(null);
  // Latest form for async lookups.
  const formRef = useRef(form);
  formRef.current = form;
  const isEdit = Boolean(initialValues);
  const statusFields = isEdit ? fieldsForStatus(form.status) : [];
  const showCreateEstimate =
    isEdit && form.status === STATUS_PROCEED_TO_JOBCARD;

  const advisorOptions = useDropdownOptions(
    () => advisorApi.getAll(),
    (a) => ({ value: a.id, label: a.employeeName }),
    advisorApi.listKey,
  );
  const driverOptions = useDropdownOptions(
    () => pickupDropDriverApi.getAll(),
    (d) => ({ value: String(d.id), label: d.label }),
    pickupDropDriverApi.listKey,
  );
  const serviceOptions = useDropdownOptions(
    () => serviceTypeApi.getAll(),
    (s) => ({ value: s.serviceTypeName, label: s.serviceTypeName }),
    serviceTypeApi.listKey,
  );
  useEffect(() => {
    if (!isOpen) return;
    if (initialValues) {
      setForm({
        ...emptyForm,
        ...initialValues,
        // Statuses outside the edit list (e.g. "Confirmed") - the user
        // picks the new one.
        status: APPOINTMENT_EDIT_STATUSES.includes(initialValues.status)
          ? initialValues.status
          : "",
      });
    } else {
      setForm({
        ...emptyForm,
        date: defaultDate ? defaultDate.toISOString().slice(0, 10) : "",
      });
    }
    setErrors({});
    setLookupMessage("");
  }, [isOpen, initialValues, defaultDate]);

  // Edit: appointments saved before the lookup existed have no ids - fill
  // them from the (read-only) reg. no. without touching anything else.
  useEffect(() => {
    if (!isOpen || !initialValues?.vehicle) return undefined;
    if (
      initialValues.customerId &&
      initialValues.vehicleId &&
      initialValues.makeId &&
      initialValues.modelId &&
      initialValues.customerAddress &&
      initialValues.pinCode
    ) {
      return undefined;
    }
    let cancelled = false;
    lookupVehicle(initialValues.vehicle.trim())
      .then((match) => {
        if (cancelled || !match) return;
        const ids = idsFromMatch(match);
        setForm((f) => ({
          ...f,
          customerId: f.customerId ?? ids.customerId,
          vehicleId: f.vehicleId ?? ids.vehicleId,
          // Names are filled from the ids by the make / model effects.
          makeId: f.makeId ?? match.makeId ?? null,
          modelId: f.modelId ?? match.modelId ?? null,
          customerAddress:
            f.customerAddress ||
            match.customerAddress ||
            match.customerData?.address1 ||
            "",
          pinCode:
            f.pinCode || match.pincode || match.customerData?.pinCode || "",
          customerCity:
            f.customerCity ||
            match.customerCity ||
            match.customerData?.city ||
            "",
          customerState:
            f.customerState ||
            match.customerState ||
            match.customerData?.state ||
            "",
        }));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen, initialValues]);

  useEffect(() => () => clearTimeout(regNoTimerRef.current), []);

  // Create: typing a reg. no. looks the vehicle up and fills the customer
  // + both ids. A new vehicle simply stays without ids.
  function handleRegNoChange(value) {
    setForm((f) => ({
      ...f,
      vehicle: value,
      customerId: null,
      vehicleId: null,
    }));
    if (errors.make || errors.model) {
      setErrors((e) => ({ ...e, make: undefined, model: undefined }));
    }
    if (errors.vehicle) setErrors((e) => ({ ...e, vehicle: undefined }));
    setLookupMessage("");
    if (regNoTimerRef.current) clearTimeout(regNoTimerRef.current);
    const regNo = value.trim();
    if (regNo.length < 4) return;

    regNoTimerRef.current = setTimeout(async () => {
      setIsLookingUp(true);
      try {
        const match = await lookupVehicle(regNo);
        if (formRef.current.vehicle.trim() !== regNo) return; // typed on
        if (!match) {
          setLookupMessage("New vehicle");
          return;
        }
        setForm((f) => ({
          ...f,
          ...idsFromMatch(match),
          // Names are filled from the ids by the make / model effects.
          makeId: match.makeId ?? f.makeId,
          modelId: match.modelId ?? f.modelId,
          make: match.makeId ? "" : f.make,
          model: match.modelId ? "" : f.model,
          customer:
            match.customerName ?? match.customerData?.name ?? f.customer,
          customerAddress:
            match.customerAddress ??
            match.customerData?.address1 ??
            f.customerAddress,
          pinCode: match.pincode ?? match.customerData?.pinCode ?? f.pinCode,
          customerCity:
            match.customerCity ?? match.customerData?.city ?? f.customerCity,
          customerState:
            match.customerState ?? match.customerData?.state ?? f.customerState,
          customerMobile:
            match.customerMobileNumber ??
            match.customerData?.mobileNumber ??
            f.customerMobile,
        }));
        setLookupMessage(match.message ?? "Existing customer");
      } catch {
        /* lookup failed - keep what was typed */
      } finally {
        setIsLookingUp(false);
      }
    }, REGNO_DEBOUNCE_MS);
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  // Ticking a section pre-fills its date & time from the appointment's
  // date + slot, when those are set and the field is still empty.
  function togglePickupDrop(statusKey, dateTimeKey, checked) {
    setForm((f) => ({
      ...f,
      [statusKey]: checked,
      [dateTimeKey]:
        checked && !f[dateTimeKey] && f.date && f.start
          ? `${f.date}T${f.start}`
          : f[dateTimeKey],
    }));
    if (!checked) {
      // Errors of a hidden section no longer apply.
      const prefix = statusKey === "pickupStatus" ? "pickup" : "drop";
      setErrors((e) =>
        Object.fromEntries(
          Object.entries(e).filter(
            ([k]) => !k.toLowerCase().startsWith(prefix),
          ),
        ),
      );
    }
  }

  function updateStatus(status) {
    setForm((f) => ({
      ...f,
      status,
      createEstimate:
        status === STATUS_PROCEED_TO_JOBCARD ? f.createEstimate : false,
    }));
    // Errors of the previous status's inputs no longer apply.
    setErrors((e) => ({ ...e, status: undefined, statusValues: undefined }));
  }

  function updateStatusValue(key, value) {
    setForm((f) => ({
      ...f,
      statusValues: { ...f.statusValues, [key]: value },
    }));
    setErrors((e) =>
      e.statusValues?.[key]
        ? { ...e, statusValues: { ...e.statusValues, [key]: undefined } }
        : e,
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (isResolving) return;
    const next = {
      ...validate(form, isEdit ? editRules : rules),
      ...validatePickupDrop(form),
    };
    if (isEdit) {
      const statusErrors = validateStatusFields(form.status, form.statusValues);
      if (Object.keys(statusErrors).length) next.statusValues = statusErrors;
    }
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }

    // Never send the ids as null just because the lookup hadn't finished
    // (or never ran): resolve them from the reg. no. first.
    let values = form;
    if ((!values.customerId || !values.vehicleId) && values.vehicle?.trim()) {
      setIsResolving(true);
      try {
        const match = await lookupVehicle(values.vehicle.trim());
        if (match) {
          const ids = idsFromMatch(match);
          values = {
            ...values,
            customerId: values.customerId ?? ids.customerId,
            vehicleId: values.vehicleId ?? ids.vehicleId,
          };
          setForm(values);
        }
      } catch {
        /* no match - a new vehicle is saved without ids */
      } finally {
        setIsResolving(false);
      }
    }

    onSubmit(
      isEdit ? values : { ...values, status: APPOINTMENT_CREATE_STATUS },
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Appointment" : "Create Appointment"}
      size="2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="appointment-form"
            isLoading={isSubmitting || isResolving}
          >
            {submitLabel(form, isEdit)}
          </Button>
        </>
      }
    >
      <form
        id="appointment-form"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6"
      >
        {/* 1. Who - fixed once the appointment exists */}
        <FormSection
          icon={UserRound}
          title="Customer & Vehicle"
          hint={
            isEdit
              ? "Name, mobile and reg. no. can't be changed"
              : "Reg. no. fills the details for existing customers"
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Input
              label="Customer Name"
              placeholder="Enter customer name"
              value={form.customer}
              onChange={(e) => update("customer", e.target.value)}
              error={errors.customer}
              required={!isEdit}
              readOnly={isEdit}
              className={isEdit ? READ_ONLY_CLASS : undefined}
            />
            <Input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              label="Mobile Number"
              placeholder="10-digit mobile"
              value={form.customerMobile ?? ""}
              onChange={(e) =>
                update(
                  "customerMobile",
                  e.target.value.replace(/\D/g, "").slice(0, 10),
                )
              }
              error={errors.customerMobile}
              required={!isEdit}
              readOnly={isEdit}
              className={isEdit ? READ_ONLY_CLASS : undefined}
            />
            <Input
              label="Vehicle Reg. No."
              placeholder="Enter vehicle reg. no."
              value={form.vehicle}
              onChange={(e) => handleRegNoChange(e.target.value.toUpperCase())}
              error={errors.vehicle}
              hint={
                !isEdit &&
                (isLookingUp ? "Checking..." : lookupMessage || undefined)
              }
              required={!isEdit}
              readOnly={isEdit}
              className={isEdit ? READ_ONLY_CLASS : undefined}
            />
            <Select
              label="Make"
              placeholder="Select make"
              value={form.make}
              onChange={(e) => handleMakeChange(e.target.value)}
              options={makeOptions}
              error={errors.make}
              required={!isEdit}
            />
            <Select
              label="Model"
              placeholder={form.make ? "Select model" : "Select a make first"}
              value={form.model}
              onChange={(e) => handleModelChange(e.target.value)}
              options={modelOptions}
              disabled={!form.make}
              error={errors.model}
              required={!isEdit}
            />
            <Select
              label="Fuel Type"
              placeholder="Select fuel type"
              value={form.fuelType ?? ""}
              onChange={(e) => update("fuelType", e.target.value)}
              options={FUEL_OPTIONS}
            />
            <div className="sm:col-span-3">
              <Input
                label="Address"
                placeholder="e.g. 12 Test Road"
                value={form.customerAddress ?? ""}
                onChange={(e) => update("customerAddress", e.target.value)}
              />
            </div>
            <Input
              label="Pincode"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit pincode"
              value={form.pinCode ?? ""}
              onChange={(e) => handlePincodeChange(e.target.value)}
              error={errors.pinCode}
              hint={isPinLookingUp ? "Looking up city & state..." : undefined}
            />
            <Input
              label="City"
              placeholder="City"
              value={form.customerCity ?? ""}
              onChange={(e) => update("customerCity", e.target.value)}
            />
            <Input
              label="State"
              placeholder="State"
              value={form.customerState ?? ""}
              onChange={(e) => update("customerState", e.target.value)}
            />
          </div>
        </FormSection>

        {/* 2. What & when */}
        <FormSection icon={CalendarClock} title="Appointment Details">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Service"
              placeholder="Select service"
              value={form.service}
              onChange={(e) => update("service", e.target.value)}
              options={serviceOptions}
              error={errors.service}
              required
            />
            <Select
              label="Advisor"
              placeholder="Select advisor"
              value={form.advisor}
              onChange={(e) => update("advisor", e.target.value)}
              options={advisorOptions}
              error={errors.advisor}
              required
            />
            <Input
              type="date"
              label="Date"
              value={form.date}
              onChange={(e) => update("date", e.target.value)}
              error={errors.date}
              required
            />
            <Select
              label="Slot"
              placeholder="Select slot"
              value={form.start}
              onChange={(e) => update("start", e.target.value)}
              options={slotOptionsFor(form.start)}
              error={errors.start}
              required
            />
          </div>
        </FormSection>

        {/* 3. Optional logistics - side by side, tick to open */}
        <FormSection
          icon={Truck}
          title="Pickup & Drop"
          hint="Optional - tick to add"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PickupDropSection
              title="Pickup"
              checked={form.pickupStatus}
              onToggle={(c) =>
                togglePickupDrop("pickupStatus", "pickupDateTime", c)
              }
              address={form.pickupAddress}
              onAddress={(v) => update("pickupAddress", v)}
              dateTime={form.pickupDateTime}
              onDateTime={(v) => update("pickupDateTime", v)}
              driverId={form.pickupDriverId}
              onDriver={(v) => update("pickupDriverId", v)}
              driverOptions={driverOptions}
              errors={{
                address: errors.pickupAddress,
                dateTime: errors.pickupDateTime,
                driver: errors.pickupDriverId,
              }}
            />
            <PickupDropSection
              title="Drop"
              checked={form.dropoffStatus}
              onToggle={(c) =>
                togglePickupDrop("dropoffStatus", "dropOffDateTime", c)
              }
              address={form.dropOffAddress}
              onAddress={(v) => update("dropOffAddress", v)}
              dateTime={form.dropOffDateTime}
              onDateTime={(v) => update("dropOffDateTime", v)}
              driverId={form.dropoffDriverId}
              onDriver={(v) => update("dropoffDriverId", v)}
              driverOptions={driverOptions}
              errors={{
                address: errors.dropOffAddress,
                dateTime: errors.dropOffDateTime,
                driver: errors.dropoffDriverId,
              }}
              sameAsPickup={
                form.pickupStatus && form.pickupAddress
                  ? () => update("dropOffAddress", form.pickupAddress)
                  : undefined
              }
            />
          </div>
        </FormSection>

        {/* 4. Outcome of the follow-up call - edit only */}
        {isEdit && (
          <FormSection icon={ClipboardCheck} title="Status Update">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Status"
                placeholder="Select status"
                value={form.status}
                onChange={(e) => updateStatus(e.target.value)}
                options={APPOINTMENT_EDIT_STATUSES.map((s) => ({
                  value: s,
                  label: s,
                }))}
                error={errors.status}
                required
              />

              {statusFields.map((field) => (
                <StatusFieldInput
                  key={`${form.status}-${field.key}`}
                  field={field}
                  value={form.statusValues[field.key] ?? ""}
                  error={errors.statusValues?.[field.key]}
                  onChange={(v) => updateStatusValue(field.key, v)}
                />
              ))}

              {showCreateEstimate && (
                <div>
                  <p className="mb-1.5 text-sm font-medium text-ink-700">
                    Proceed to Estimate
                  </p>
                  <div className="flex h-10 items-center gap-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={form.createEstimate}
                      aria-label="Convert to Estimate"
                      onClick={() =>
                        update("createEstimate", !form.createEstimate)
                      }
                      className={clsx(
                        "relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors",
                        form.createEstimate ? "bg-brand-500" : "bg-ink-300",
                      )}
                    >
                      <span
                        className={clsx(
                          "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                          form.createEstimate
                            ? "translate-x-5"
                            : "translate-x-0",
                        )}
                      />
                    </button>
                    <span className="text-sm font-medium text-ink-700">
                      {form.createEstimate ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              )}

              <div className="sm:col-span-2">
                <Textarea
                  label="Remarks"
                  placeholder="Enter remarks"
                  value={form.remarks}
                  onChange={(e) => update("remarks", e.target.value)}
                />
              </div>
            </div>
          </FormSection>
        )}
      </form>
    </Modal>
  );
}

/** Titled group of fields: icon + heading (+ optional hint) over a divider. */
function FormSection({ icon, title, hint, children }) {
  const Icon = icon;
  return (
    <section>
      <div className="mb-3 flex items-center gap-2 border-b border-ink-100 pb-2">
        <Icon className="h-4 w-4 text-brand-600" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-ink-800">{title}</h3>
        {hint && <span className="text-xs text-ink-400">- {hint}</span>}
      </div>
      {children}
    </section>
  );
}

/** One input from STATUS_FIELDS. */
function StatusFieldInput({ field, value, error, onChange }) {
  if (field.type === "date") {
    return (
      <Input
        type="date"
        label={field.label}
        min={field.minToday ? todayISO() : undefined}
        max={field.maxToday ? todayISO() : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        error={error}
        required
      />
    );
  }
  if (field.type === "mobile") {
    return (
      <Input
        type="tel"
        inputMode="numeric"
        maxLength={10}
        label={field.label}
        placeholder={field.placeholder}
        value={value}
        onChange={(e) =>
          onChange(e.target.value.replace(/\D/g, "").slice(0, 10))
        }
        error={error}
      />
    );
  }
  return (
    <Input
      label={field.label}
      placeholder={field.placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      error={error}
      required
    />
  );
}

/** Tick-to-enable Pickup / Drop card: address, date & time, driver. */
function PickupDropSection({
  title,
  checked,
  onToggle,
  address,
  onAddress,
  dateTime,
  onDateTime,
  driverId,
  onDriver,
  driverOptions,
  errors,
  sameAsPickup,
}) {
  return (
    <div
      className={clsx(
        "rounded-lg border p-4 transition-colors",
        checked ? "border-brand-200 bg-brand-50/40" : "border-ink-200",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink-700">
          <input
            type="checkbox"
            className="h-4 w-4 cursor-pointer rounded border-ink-300 text-brand-600"
            checked={checked}
            onChange={(e) => onToggle(e.target.checked)}
          />
          {title}
        </label>
        {checked && sameAsPickup && (
          <button
            type="button"
            onClick={sameAsPickup}
            className="text-xs font-medium text-brand-600 hover:text-brand-800 cursor-pointer"
          >
            Same as pickup
          </button>
        )}
      </div>

      {checked && (
        <div className="mt-4 space-y-4">
          <Input
            label={`${title} Address`}
            placeholder="Enter address"
            value={address}
            onChange={(e) => onAddress(e.target.value)}
            error={errors.address}
            required
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              type="datetime-local"
              label="Date & Time"
              value={dateTime}
              onChange={(e) => onDateTime(e.target.value)}
              error={errors.dateTime}
              required
            />
            <Select
              label="Driver"
              placeholder="Select driver"
              value={driverId}
              onChange={(e) => onDriver(e.target.value)}
              options={driverOptions}
              error={errors.driver}
              required
            />
          </div>
        </div>
      )}
    </div>
  );
}
