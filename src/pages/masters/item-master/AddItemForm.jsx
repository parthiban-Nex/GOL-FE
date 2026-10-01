import { useEffect, useState } from "react";
import SingleSelect from "@/components/ui/SingleSelect";
import Multiselect from "@/components/ui/Multiselect";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import { itemApi, makeApi, modelApi } from "@/services";
import {
  itemGroupApi,
  itemCategoryApi,
  uomApi,
  hsnApi,
  aggregateApi,
  subAggregateApi,
} from "@/services";
import { companyApi } from "@/services";
import { extractList, isSuccess, responseMessage } from "@/utils/apiResponse";
import { showToast } from "@/utils/toast";

const REQUIRED_FIELDS = [
  "itemCode",
  "itemName",
  "itemDescription",
  "itemgroupId",
  "itemcategoryId",
  "uomId",
  "hsnId",
  "makeId",
  "modelId",
  "aggregateId",
  "subaggregateId",
  "list",
  "cost",
  "mrp",
];

const blankForm = {
  itemCode: "",
  itemName: "",
  itemDescription: "",
  itemgroupId: "",
  itemcategoryId: "",
  uomId: "",
  hsnId: "",
  hsnCode: "",
  taxPercentage: "",
  makeId: "",
  modelId: "",
  aggregateId: "",
  subaggregateId: "",
  list: "",
  cost: "",
  mrp: "",
  companyId: [],
  status: 1,
};

export default function AddItemForm({ item, onCreated, onCancel }) {
  const isEditing = Boolean(item);

  const itemGroupOptions = useDropdownOptions(
    () => itemGroupApi.getAll(),
    (g) => ({ value: String(g.id), label: g.itemGroupCode }),
    itemGroupApi.listKey,
  );
  const itemCategoryOptions = useDropdownOptions(
    () => itemCategoryApi.getAll(),
    (c) => ({ value: String(c.id), label: c.itemCategorie }),
    itemCategoryApi.allKey,
  );
  const uomOptions = useDropdownOptions(
    () => uomApi.getAll(),
    (u) => ({ value: String(u.id), label: u.uomType }),
    uomApi.listKey,
  );
  const hsnOptions = useDropdownOptions(
    () => hsnApi.getAll(),
    (h) => ({ value: String(h.id), label: h.hsnCode }),
    hsnApi.listKey,
  );
  const aggregateOptions = useDropdownOptions(
    () => aggregateApi.getAll(),
    (a) => ({ value: String(a.id), label: a.aggregateName }),
    aggregateApi.listKey,
  );
  const makeOptions = useDropdownOptions(
    () => makeApi.list(),
    (m) => ({ value: String(m.id), label: m.makeName ?? m.make }),
    makeApi.listKey,
  );
  const companyOptions = useDropdownOptions(
    () => companyApi.getAll(),
    (c) => ({ value: String(c.id), label: c.name }),
    companyApi.listKey,
  );

  const [form, setForm] = useState(blankForm);
  const [modelOptions, setModelOptions] = useState([]);
  const [subAggregateOptions, setSubAggregateOptions] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!item) return;

    const splitLabels = (value) =>
      String(value ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    setForm({
      ...blankForm,
      ...Object.fromEntries(
        Object.keys(blankForm)
          .filter(
            (k) =>
              k !== "companyId" && item[k] !== undefined && item[k] !== null,
          )
          .map((k) => [k, String(item[k])]),
      ),
      companyId: splitLabels(item.companies)
        .map((name) => companyOptions.find((c) => c.label === name)?.value)
        .filter(Boolean),
      status: item.status ? 1 : 0,
    });
  }, [item, companyOptions]);

  useEffect(() => {
    if (!form.makeId) {
      setModelOptions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await modelApi.getForMake(Number(form.makeId));
        if (cancelled) return;
        setModelOptions(
          extractList(response, modelApi.listKey).map((m) => ({
            value: String(m.id),
            label: m.modelName ?? m.model,
          })),
        );
      } catch {
        if (!cancelled) setModelOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.makeId]);

  // Same relationship between aggregate and sub-aggregate.
  useEffect(() => {
    if (!form.aggregateId) {
      setSubAggregateOptions([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = await subAggregateApi.getForAggregate(
          Number(form.aggregateId),
        );
        if (cancelled) return;
        setSubAggregateOptions(
          extractList(response, subAggregateApi.listKey, "subAggregates").map(
            (s) => ({ value: String(s.id), label: s.subAggregateName }),
          ),
        );
      } catch {
        if (!cancelled) setSubAggregateOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [form.aggregateId]);

  // Tax percentage is a property of the HSN code, not something the user
  // sets - pull it whenever the HSN selection changes.
  useEffect(() => {
    if (!form.hsnId) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await hsnApi.getOne(Number(form.hsnId));
        if (cancelled) return;
        const hsn = response?.data ?? {};
        setForm((f) => ({
          ...f,
          taxPercentage: hsn.tax != null ? String(hsn.tax) : f.taxPercentage,
          hsnCode:
            hsn.hsnCode ??
            hsnOptions.find((o) => o.value === f.hsnId)?.label ??
            f.hsnCode,
        }));
      } catch {
        /* leave the previous tax in place */
      }
    })();
    return () => {
      cancelled = true;
    };
    // hsnOptions is only a fallback label source and is stable after load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.hsnId]);

  function update(field, value) {
    setForm((f) => {
      const next = { ...f, [field]: value };
      // Dependent selections are cleared with their parent.
      if (field === "makeId") next.modelId = "";
      if (field === "aggregateId") next.subaggregateId = "";
      return next;
    });
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const missing = {};
    for (const name of REQUIRED_FIELDS) {
      if (!String(form[name] ?? "").trim()) {
        missing[name] = "This field is required.";
      }
    }
    if (!form.companyId.length) missing.companyId = "This field is required.";
    if (Object.keys(missing).length) {
      setErrors(missing);
      return;
    }

    setIsSubmitting(true);
    try {
      const num = (v) => (v === "" || v == null ? null : Number(v));
      const payload = {
        itemCode: form.itemCode,
        itemName: form.itemName,
        itemDescription: form.itemDescription,
        itemgroupId: num(form.itemgroupId),
        itemcategoryId: num(form.itemcategoryId),
        uomId: num(form.uomId),
        hsnId: num(form.hsnId),
        hsnCode: form.hsnCode,
        taxPercentage: num(form.taxPercentage),
        makeId: num(form.makeId),
        modelId: num(form.modelId),
        aggregateId: num(form.aggregateId),
        subaggregateId: num(form.subaggregateId),
        list: num(form.list),
        cost: num(form.cost),
        mrp: num(form.mrp),
        // Plain ids - see the docblock.
        companyId: form.companyId.map(Number),
        // The reference form pins this; there is no vehicle-type field
        // on the screen.
        vehicletypeId: 1,
        status: form.status,
      };
      if (isEditing) payload.id = item.id;

      const response = isEditing
        ? await itemApi.update(payload)
        : await itemApi.create(payload);

      if (!isSuccess(response)) {
        throw new Error(
          responseMessage(
            response,
            isEditing ? "Couldn't update item." : "Couldn't create item.",
          ),
        );
      }

      showToast.success(
        responseMessage(
          response,
          `${form.itemName} was ${isEditing ? "updated" : "created"} successfully.`,
        ),
      );
      onCreated?.();
    } catch (err) {
      showToast.error(
        err.message ||
          (isEditing ? "Couldn't update item." : "Couldn't create item."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6 ">
        <Input
          label="Item Code"
          required
          variant="underline"
          value={form.itemCode}
          onChange={(e) => update("itemCode", e.target.value)}
          error={errors.itemCode}
        />
        <Input
          label="Item Name"
          required
          variant="underline"
          value={form.itemName}
          onChange={(e) => update("itemName", e.target.value)}
          error={errors.itemName}
        />
        <Input
          label="Item Description"
          required
          variant="underline"
          value={form.itemDescription}
          onChange={(e) => update("itemDescription", e.target.value)}
          error={errors.itemDescription}
        />

        <div className="-mt-2.5">
          <SingleSelect
            label="Item Group"
            required
            placeholder="Select an item group"
            value={form.itemgroupId}
            onChange={(value) => update("itemgroupId", value)}
            error={errors.itemgroupId}
            options={itemGroupOptions}
          />
        </div>
        <div className="-mt-2.5">
          <SingleSelect
            label="Item Category"
            required
            placeholder="Select a category"
            value={form.itemcategoryId}
            onChange={(value) => update("itemcategoryId", value)}
            error={errors.itemcategoryId}
            options={itemCategoryOptions}
          />
        </div>
        <div className="-mt-2.5">
          <SingleSelect
            label="UOM"
            required
            placeholder="Select a UOM"
            value={form.uomId}
            onChange={(value) => update("uomId", value)}
            error={errors.uomId}
            options={uomOptions}
          />
        </div>

        <div className="-mt-2.5">
          <SingleSelect
            label="HSN"
            required
            placeholder="Select an HSN code"
            value={form.hsnId}
            onChange={(value) => update("hsnId", value)}
            error={errors.hsnId}
            options={hsnOptions}
          />
        </div>
        {/* Derived from the HSN above; shown but not editable. */}
        <Input
          label="Tax Percentage"
          variant="underline"
          readOnly
          className="bg-ink-50 text-ink-500"
          value={form.taxPercentage}
        />
        <div className="-mt-2.5">
          <SingleSelect
            label="Make"
            required
            placeholder="Select a make"
            value={form.makeId}
            onChange={(value) => update("makeId", value)}
            error={errors.makeId}
            options={makeOptions}
          />
        </div>

        <div className="-mt-2.5">
          <SingleSelect
            label="Model"
            required
            placeholder={form.makeId ? "Select a model" : "Select a make first"}
            value={form.modelId}
            onChange={(value) => update("modelId", value)}
            error={errors.modelId}
            options={modelOptions}
          />
        </div>
        <div className="-mt-2.5">
          <SingleSelect
            label="Aggregate"
            required
            placeholder="Select an aggregate"
            value={form.aggregateId}
            onChange={(value) => update("aggregateId", value)}
            error={errors.aggregateId}
            options={aggregateOptions}
          />
        </div>
        <div className="-mt-2.5">
          <SingleSelect
            label="Sub Aggregate"
            required
            placeholder={
              form.aggregateId
                ? "Select a sub aggregate"
                : "Select an aggregate first"
            }
            value={form.subaggregateId}
            onChange={(value) => update("subaggregateId", value)}
            error={errors.subaggregateId}
            options={subAggregateOptions}
          />
        </div>

        <Input
          label="Price list"
          type="number"
          required
          variant="underline"
          value={form.list}
          onChange={(e) => update("list", e.target.value)}
          error={errors.list}
        />
        <Input
          label="Cost"
          type="number"
          required
          variant="underline"
          value={form.cost}
          onChange={(e) => update("cost", e.target.value)}
          error={errors.cost}
        />
        <Input
          label="MRP"
          type="number"
          required
          variant="underline"
          value={form.mrp}
          onChange={(e) => update("mrp", e.target.value)}
          error={errors.mrp}
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
          {isEditing ? "Save changes" : "Create item"}
        </Button>
      </div>
    </form>
  );
}
