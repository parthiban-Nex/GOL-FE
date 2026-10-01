import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import clsx from "clsx";
import SubMasterCrudTab from "@/components/masters/SubMasterCrudTab";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import {
  itemGroupApi,
  itemCategoryApi,
  uomApi,
  hsnApi,
  aggregateApi,
  subAggregateApi,
  HSN_TAX_RATES,
} from "@/services";

const taxOptions = HSN_TAX_RATES.map((t) => ({
  value: String(t),
  label: `${t}%`,
}));

export default function ItemSubMaster() {
  const { canCreate, canUpdate } = usePagePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [aggregateVersion, setAggregateVersion] = useState(0);
  const tabs = [
    {
      key: "item-group",
      label: "Item Group",
      render: () => (
        <SubMasterCrudTab
          title="Item Group"
          api={itemGroupApi}
          canCreate={canCreate}
          canUpdate={canUpdate}
          columns={[
            { key: "itemGroupCode", header: "ItemGroup Code" },
            { key: "itemGroupDescription", header: "Item Description" },
          ]}
          fields={[
            { name: "itemGroupCode", label: "ItemGroup Code", required: true },
            {
              name: "itemGroupDescription",
              label: "ItemGroup Description",
              required: true,
            },
          ]}
          getRowId={(row) => row.itemGroupCode}
        />
      ),
    },
    {
      key: "item-category",
      label: "Item Category",
      render: () => (
        <SubMasterCrudTab
          title="Item Category"
          api={itemCategoryApi}
          canCreate={canCreate}
          canUpdate={canUpdate}
          columns={[
            { key: "itemCategorie", header: "Name" },
            { key: "itemCategorieDescription", header: "Description" },
          ]}
          fields={[
            { name: "itemCategorie", label: "Name", required: true },
            {
              name: "itemCategorieDescription",
              label: "Description",
              required: true,
            },
          ]}
          getRowId={(row) => row.itemCategorie}
        />
      ),
    },
    {
      key: "uom",
      label: "UOM",
      render: () => (
        <SubMasterCrudTab
          title="UOM"
          api={uomApi}
          canCreate={canCreate}
          canUpdate={canUpdate}
          columns={[
            { key: "uomType", header: "Uom Type" },
            { key: "uomDescription", header: "Uom Description" },
          ]}
          fields={[
            { name: "uomType", label: "Uom Type", required: true },
            {
              name: "uomDescription",
              label: "Uom Description",
              required: true,
            },
          ]}
          getRowId={(row) => row.uomType}
        />
      ),
    },
    {
      key: "hsn",
      label: "HSN",
      render: () => (
        <SubMasterCrudTab
          title="HSN"
          api={hsnApi}
          canCreate={canCreate}
          canUpdate={canUpdate}
          columns={[
            { key: "hsnCode", header: "Hsn Code" },
            { key: "tax", header: "Tax" },
          ]}
          fields={[
            { name: "hsnCode", label: "HSN Code", required: true },
            {
              name: "tax",
              label: "Tax",
              type: "select",
              required: true,
              options: taxOptions,
              placeholder: "Select a rate",
            },
          ]}
          getRowId={(row) => row.hsnCode}
          toPayload={(form) => ({ ...form, tax: Number(form.tax) })}
        />
      ),
    },
    {
      key: "aggregate",
      label: "Aggregate",
      render: () => (
        <SubMasterCrudTab
          title="Aggregate"
          api={aggregateApi}
          canCreate={canCreate}
          canUpdate={canUpdate}
          columns={[{ key: "aggregateName", header: "Aggregate Name" }]}
          fields={[
            { name: "aggregateName", label: "Aggregate Name", required: true },
          ]}
          getRowId={(row) => row.aggregateName}
          onSaved={() => setAggregateVersion((v) => v + 1)}
        />
      ),
    },
    {
      key: "sub-aggregate",
      label: "Sub Aggregate",
      render: () => (
        <SubAggregateTab
          canCreate={canCreate}
          canUpdate={canUpdate}
          aggregateVersion={aggregateVersion}
          onAggregateSaved={() => setAggregateVersion((v) => v + 1)}
        />
      ),
    },
  ];

  const requestedTab = searchParams.get("tab");
  const activeTab = tabs.some((t) => t.key === requestedTab)
    ? requestedTab
    : tabs[0].key;

  function switchTab(next) {
    setSearchParams(next === tabs[0].key ? {} : { tab: next }, {
      replace: false,
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink-800">Item SubMaster</h1>
      </div>

      <div className="flex flex-wrap gap-1 rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => switchTab(t.key)}
            className={clsx(
              "cursor-pointer rounded-md px-4 py-1.5 text-sm font-semibold transition-colors",
              activeTab === t.key
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-ink-300 text-white",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tabs.find((t) => t.key === activeTab)?.render()}
    </div>
  );
}
function SubAggregateTab({
  canCreate,
  canUpdate,
  aggregateVersion,
  onAggregateSaved,
}) {
  const aggregateOptions = useDropdownOptions(
    () => aggregateApi.getAll(),
    (a) => ({ value: String(a.id), label: a.aggregateName }),
    aggregateApi.listKey,
    aggregateVersion,
  );

  return (
    <SubMasterCrudTab
      title="Sub Aggregate"
      api={subAggregateApi}
      canCreate={canCreate}
      canUpdate={canUpdate}
      columns={[
        { key: "aggregateName", header: "Aggregate Name" },
        { key: "subAggregateName", header: "Sub Aggregate" },
      ]}
      fields={[
        {
          name: "aggregateId",
          label: "Aggregate",
          type: "select",
          required: true,
          options: aggregateOptions,
        },
        { name: "subAggregateName", label: "SubAggregate", required: true },
      ]}
      getRowId={(row) => row.subAggregateName}
      toFormValues={(row) => ({ aggregateId: String(row.aggregateId ?? "") })}
      toPayload={(form) => ({
        ...form,
        aggregateId: Number(form.aggregateId) || form.aggregateId,
      })}
      onSaved={onAggregateSaved}
    />
  );
}
