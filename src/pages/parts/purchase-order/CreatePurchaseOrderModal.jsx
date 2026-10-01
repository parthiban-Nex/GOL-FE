import { useCallback, useEffect, useRef, useState } from "react";
import { FileText, Loader2, Plus, Trash2 } from "lucide-react";
import clsx from "clsx";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import AsyncSearchInput from "@/components/parts/AsyncSearchInput";
import { useDropdownOptions } from "@/hooks/useDropdownOptions";
import {
  itemApi,
  itemCategoryApi,
  makeApi,
  modelApi,
  partsApi,
  vendorApi,
} from "@/services";
import { extractList, isSuccess, responseMessage } from "@/utils/apiResponse";
import { showToast } from "@/utils/toast";
import { formatINR } from "@/utils/estimateMath";
import {
  buildPoPayload,
  emptyPartRow,
  itemDetailsToRow,
  lineTotal,
  mapPoDetail,
  mapVendor,
  validatePart,
} from "@/utils/purchaseOrder";

const cellInput =
  "w-full rounded border px-2 py-1 text-xs text-ink-800 focus:outline-none disabled:bg-ink-50";
const cellCls = (hasError) =>
  clsx(
    cellInput,
    hasError ? "border-danger-500" : "border-ink-200 focus:border-brand-600",
  );

const todayIso = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
};

export default function CreatePurchaseOrderModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  editPo = null,
}) {
  const poId = editPo?.id ?? null;

  const [isLoadingPo, setIsLoadingPo] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [createdAt, setCreatedAt] = useState(null);
  const [validTillDate, setValidTillDate] = useState("");
  const [vendorQuery, setVendorQuery] = useState("");
  const [vendor, setVendor] = useState(null);
  const [file, setFile] = useState(null);
  const [existingPdfUrl, setExistingPdfUrl] = useState("");
  const [parts, setParts] = useState([]);
  const [errors, setErrors] = useState({});
  const [rowErrors, setRowErrors] = useState({});
  const [detailLoadingKeys, setDetailLoadingKeys] = useState(() => new Set());
  const [modelsByMake, setModelsByMake] = useState({});
  const modelRequestsRef = useRef(new Set());

  // ---- dropdowns ----
  const makeOptions = useDropdownOptions(
    () => makeApi.list(),
    (m) => ({ value: String(m.id), label: m.makeName }),
    makeApi.listKey,
  );
  const categoryOptions = useDropdownOptions(
    () => itemCategoryApi.getAll(),
    (c) => ({ value: String(c.id), label: c.itemCategorie }),
    itemCategoryApi.allKey,
  );

  // Models are per make - fetched once per make and cached.
  const ensureModels = useCallback((makeId) => {
    if (!makeId || modelRequestsRef.current.has(makeId)) return;
    modelRequestsRef.current.add(makeId);
    modelApi
      .getForMake(Number(makeId))
      .then((res) => {
        const options = extractList(res, "ModelData").map((m) => ({
          value: String(m.id),
          label: m.modelName,
        }));
        setModelsByMake((prev) => ({ ...prev, [makeId]: options }));
      })
      .catch(() => {
        modelRequestsRef.current.delete(makeId);
        setModelsByMake((prev) => ({ ...prev, [makeId]: [] }));
      });
  }, []);

  // ---- open: reset (create) or load (edit) ----
  useEffect(() => {
    if (!isOpen) return undefined;
    setErrors({});
    setRowErrors({});
    setFile(null);
    setLoadError("");
    setDetailLoadingKeys(new Set());

    if (!poId) {
      setPoNumber("");
      setCreatedAt(null);
      setValidTillDate("");
      setVendor(null);
      setVendorQuery("");
      setExistingPdfUrl("");
      setParts([emptyPartRow()]);
      return undefined;
    }

    let cancelled = false;
    setIsLoadingPo(true);
    partsApi
      .getPoForView(poId)
      .then((res) => {
        if (cancelled) return;
        const detail = isSuccess(res) ? mapPoDetail(res?.data?.[0]) : null;
        if (!detail) {
          setLoadError(
            responseMessage(res, "Couldn't load the purchase order."),
          );
          return;
        }
        setPoNumber(detail.poNumber);
        setCreatedAt(detail.createdAt);
        setValidTillDate(detail.validTillDate);
        setVendor(detail.vendor);
        setVendorQuery(detail.vendor.vendorCode);
        setExistingPdfUrl(detail.invoicePdfUrl);
        setParts(detail.parts.length ? detail.parts : [emptyPartRow()]);
        detail.parts.forEach((p) => ensureModels(p.makeId));
      })
      .catch((err) => {
        if (!cancelled)
          setLoadError(err.message || "Couldn't load the purchase order.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingPo(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, poId, ensureModels]);

  if (!isOpen) return null;

  // ---- vendor ----
  async function searchVendors(query) {
    const res = await vendorApi.listForPo({
      limit: 50,
      offset: 0,
      searchKey: query,
    });
    return extractList(res, "vendorData").map((v) => ({
      key: v.id,
      label: v.vendorCode,
      sub: v.vendorName,
      data: v,
    }));
  }

  function selectVendor(option) {
    const next = mapVendor(option.data);
    setVendor(next);
    setVendorQuery(next.vendorCode);
    setErrors((e) => ({ ...e, vendor: undefined }));
  }

  // ---- parts ----
  function patchRow(key, patch) {
    setParts((prev) =>
      prev.map((p) => (p.key === key ? { ...p, ...patch } : p)),
    );
    setRowErrors((prev) => {
      if (!prev[key]) return prev;
      const rowErr = { ...prev[key] };
      Object.keys(patch).forEach((f) => delete rowErr[f]);
      return { ...prev, [key]: rowErr };
    });
  }

  async function searchParts(query) {
    const res = await itemApi.poSearch(query, vendor?.itemGroupCodes ?? []);
    return extractList(res, "itemSearchData").map((it) => ({
      key: it.id,
      label: it.itemCode,
      sub: it.itemName,
      data: it,
    }));
  }

  async function selectPart(rowKey, option) {
    patchRow(rowKey, { itemCode: option.data.itemCode, itemId: null });
    setDetailLoadingKeys((s) => new Set(s).add(rowKey));
    try {
      const res = await itemApi.getDetails({
        itemCode: option.data.itemCode,
        modelSegment: "",
        customerState: vendor?.state ?? "",
      });
      const details = isSuccess(res) ? extractList(res, "itemsData")[0] : null;
      if (!details) {
        showToast.error(
          responseMessage(res, "Couldn't load that part's details."),
        );
        return;
      }
      patchRow(rowKey, itemDetailsToRow(details));
    } catch (err) {
      showToast.error(err.message || "Couldn't load that part's details.");
    } finally {
      setDetailLoadingKeys((s) => {
        const next = new Set(s);
        next.delete(rowKey);
        return next;
      });
    }
  }

  function changeMake(rowKey, makeId) {
    patchRow(rowKey, { makeId, modelId: "" });
    ensureModels(makeId);
  }

  function addRow() {
    setParts((prev) => [...prev, emptyPartRow()]);
  }

  function removeRow(key) {
    setParts((prev) =>
      prev.length > 1 ? prev.filter((p) => p.key !== key) : prev,
    );
  }

  // ---- submit ----
  function handleSubmit(e) {
    e.preventDefault();
    const nextErrors = {};
    if (!vendor?.vendorId) nextErrors.vendor = "Select a vendor from the list";
    if (!validTillDate)
      nextErrors.validTillDate = "Valid till date is required";
    if (!poId && !file) nextErrors.file = "Supplier invoice PDF is required";

    const nextRowErrors = {};
    parts.forEach((p) => {
      const err = validatePart(p);
      if (Object.keys(err).length) nextRowErrors[p.key] = err;
    });

    setErrors(nextErrors);
    setRowErrors(nextRowErrors);
    const rowErrorCount = Object.keys(nextRowErrors).length;
    if (Object.keys(nextErrors).length || rowErrorCount) {
      showToast.error(
        rowErrorCount
          ? `Complete the highlighted fields in ${rowErrorCount} part row${rowErrorCount > 1 ? "s" : ""}.`
          : "Complete the highlighted fields.",
      );
      return;
    }

    onSubmit?.({
      ...buildPoPayload({ poId, validTillDate, vendor, parts }),
      file,
    });
  }

  const grandTotal = parts.reduce((sum, p) => sum + lineTotal(p), 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        poId
          ? `Edit Purchase Order: ${poNumber || editPo?.poNumber || poId}`
          : "Create Purchase Order"
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="purchase-order-form"
            isLoading={isSubmitting}
            disabled={isLoadingPo || Boolean(loadError)}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        </>
      }
    >
      {isLoadingPo ? (
        <p className="py-10 text-center text-sm text-ink-500">
          Loading purchase order...
        </p>
      ) : loadError ? (
        <p className="py-10 text-center text-sm text-danger-500">{loadError}</p>
      ) : (
        <form
          id="purchase-order-form"
          onSubmit={handleSubmit}
          noValidate
          className="space-y-6"
        >
          {/* ---------- Header ---------- */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                type="date"
                label="Created Date"
                value={createdAt ? String(createdAt).slice(0, 10) : todayIso()}
                readOnly
                className="bg-ink-50 text-ink-500"
              />
              <Input
                type="date"
                label="Valid Till Date"
                required
                min={todayIso()}
                value={validTillDate}
                onChange={(e) => {
                  setValidTillDate(e.target.value);
                  setErrors((er) => ({ ...er, validTillDate: undefined }));
                }}
                error={errors.validTillDate}
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700">
                  Vendor Code <span className="text-red-500">*</span>
                </label>
                <AsyncSearchInput
                  value={vendorQuery}
                  onInputChange={(v) => {
                    setVendorQuery(v);
                    // Typing again means a different vendor.
                    if (vendor) setVendor(null);
                  }}
                  fetchOptions={searchVendors}
                  onSelect={selectVendor}
                  placeholder="Type vendor code"
                  error={errors.vendor}
                  inputClassName="h-10 text-sm"
                />
              </div>
              <Input
                label="Vendor Name"
                value={vendor?.vendorName ?? ""}
                readOnly
                placeholder="Filled from vendor"
                className="bg-ink-50"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="Vendor Address"
                value={vendor?.vendorAddress ?? ""}
                readOnly
                placeholder="Filled from vendor"
                className="bg-ink-50"
                title={vendor?.vendorAddress}
              />
              <Input
                label="Vendor GSTIN Number"
                value={vendor?.gstin ?? ""}
                readOnly
                placeholder="Filled from vendor"
                className="bg-ink-50"
              />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink-700">
                  Supplier Invoice Pdf{" "}
                  {!poId && <span className="text-red-500">*</span>}
                </label>
                <div className="flex items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-ink-200 bg-ink-50 px-3 py-1.5 text-xs font-medium text-ink-800 transition-colors hover:bg-ink-100">
                    {poId ? "Replace file" : "Choose file"}
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        setFile(e.target.files?.[0] ?? null);
                        setErrors((er) => ({ ...er, file: undefined }));
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <span className="max-w-[180px] truncate text-xs text-ink-500">
                    {file ? file.name : existingPdfUrl ? "" : "No file chosen"}
                  </span>
                  {!file && existingPdfUrl && (
                    <a
                      href={existingPdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline"
                    >
                      <FileText className="h-3.5 w-3.5" /> Current invoice
                    </a>
                  )}
                </div>
                {errors.file && (
                  <p className="mt-1 text-xs text-danger-500">{errors.file}</p>
                )}
              </div>
            </div>
          </div>

          {/* ---------- Parts ---------- */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink-900">Parts details</h3>
              <Button type="button" size="sm" icon={Plus} onClick={addRow}>
                Add Parts Details
              </Button>
            </div>
            {!vendor && (
              <p className="text-xs text-ink-500">
                Select a vendor first - part prices and GST depend on the
                vendor&apos;s state.
              </p>
            )}

            <div className="overflow-x-auto rounded-xl border border-ink-200 bg-white">
              <table className="w-full min-w-[1600px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-ink-200 bg-[#F8F9FF] text-[11px] font-bold uppercase tracking-wider text-ink-500">
                    <th className="w-44 px-2.5 py-2.5">Parts Code *</th>
                    <th className="min-w-[160px] px-2.5 py-2.5">Description</th>
                    <th className="px-2.5 py-2.5">HSN Code</th>
                    <th className="w-32 px-2.5 py-2.5">Make *</th>
                    <th className="w-32 px-2.5 py-2.5">Model *</th>
                    <th className="w-28 px-2.5 py-2.5">Parts Category</th>
                    <th className="w-28 px-2.5 py-2.5">VIN Number</th>
                    <th className="w-28 px-2.5 py-2.5">Reg No *</th>
                    <th className="w-16 px-2.5 py-2.5 text-center">Qty *</th>
                    <th className="w-20 px-2.5 py-2.5 text-right">Rate *</th>
                    <th className="w-20 px-2.5 py-2.5 text-right">Cost *</th>
                    <th className="w-20 px-2.5 py-2.5 text-right">MRP *</th>
                    <th className="w-20 px-2.5 py-2.5 text-right">Discount</th>
                    <th className="px-2.5 py-2.5 text-center">GST %</th>
                    <th className="px-2.5 py-2.5 text-right">Total Amt</th>
                    <th className="w-32 px-2.5 py-2.5">Remarks</th>
                    <th className="w-8 px-1.5 py-2.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {parts.map((p) => {
                    const err = rowErrors[p.key] ?? {};
                    const isFetching = detailLoadingKeys.has(p.key);
                    const models = modelsByMake[p.makeId] ?? [];
                    const gst =
                      Number(p.cgst || 0) +
                      Number(p.sgst || 0) +
                      Number(p.igst || 0);
                    return (
                      <tr key={p.key} className="align-top hover:bg-ink-50/50">
                        <td className="px-2 py-2">
                          <AsyncSearchInput
                            value={p.itemCode}
                            onInputChange={(v) =>
                              patchRow(p.key, { itemCode: v, itemId: null })
                            }
                            fetchOptions={searchParts}
                            onSelect={(o) => selectPart(p.key, o)}
                            placeholder={
                              vendor ? "Type part code" : "Select vendor first"
                            }
                            disabled={!vendor}
                            error={err.itemCode}
                          />
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1.5 pt-1 text-ink-800">
                            {isFetching && (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-ink-400" />
                            )}
                            <span className="line-clamp-2">
                              {p.description || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-2 pt-3 text-ink-700">
                          {p.hsnCode || "-"}
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={p.makeId}
                            onChange={(e) => changeMake(p.key, e.target.value)}
                            className={cellCls(err.makeId)}
                            aria-label="Make"
                          >
                            <option value="">Select</option>
                            {makeOptions.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={p.modelId}
                            onChange={(e) =>
                              patchRow(p.key, { modelId: e.target.value })
                            }
                            disabled={!p.makeId}
                            className={cellCls(err.modelId)}
                            aria-label="Model"
                          >
                            <option value="">
                              {p.makeId ? "Select" : "Pick make"}
                            </option>
                            {/* Keep a saved model visible while its make's list loads. */}
                            {p.modelId &&
                              !models.some((m) => m.value === p.modelId) && (
                                <option value={p.modelId}>
                                  {p.modelName || p.modelId}
                                </option>
                              )}
                            {models.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <select
                            value={p.categoryId}
                            onChange={(e) =>
                              patchRow(p.key, { categoryId: e.target.value })
                            }
                            className={cellCls(false)}
                            aria-label="Parts Category"
                          >
                            <option value="">Select</option>
                            {categoryOptions.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={p.vinNumber}
                            onChange={(e) =>
                              patchRow(p.key, { vinNumber: e.target.value })
                            }
                            className={cellCls(false)}
                            aria-label="VIN Number"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={p.regNo}
                            onChange={(e) =>
                              patchRow(p.key, {
                                regNo: e.target.value.toUpperCase(),
                              })
                            }
                            className={cellCls(err.regNo)}
                            aria-label="Reg No"
                          />
                        </td>
                        <NumCell
                          value={p.quantity}
                          min="1"
                          step="1"
                          center
                          error={err.quantity}
                          onChange={(v) => patchRow(p.key, { quantity: v })}
                          label="Quantity"
                        />
                        <NumCell
                          value={p.rate}
                          error={err.rate}
                          onChange={(v) => patchRow(p.key, { rate: v })}
                          label="Rate"
                        />
                        <NumCell
                          value={p.cost}
                          error={err.cost}
                          onChange={(v) => patchRow(p.key, { cost: v })}
                          label="Cost"
                        />
                        <NumCell
                          value={p.mrp}
                          error={err.mrp}
                          onChange={(v) => patchRow(p.key, { mrp: v })}
                          label="MRP"
                        />
                        <NumCell
                          value={p.discount}
                          onChange={(v) => patchRow(p.key, { discount: v })}
                          label="Discount amount"
                        />
                        <td
                          className="px-2 py-2 pt-3 text-center text-ink-700"
                          title={`CGST ${p.cgst || 0}% · SGST ${p.sgst || 0}% · IGST ${p.igst || 0}%`}
                        >
                          {gst}%
                        </td>
                        <td className="px-2 py-2 pt-3 text-right font-bold text-ink-900">
                          {formatINR(lineTotal(p))}
                        </td>
                        <td className="px-2 py-2">
                          <input
                            value={p.remarks}
                            onChange={(e) =>
                              patchRow(p.key, { remarks: e.target.value })
                            }
                            className={cellCls(false)}
                            aria-label="Remarks"
                          />
                        </td>
                        <td className="px-1 py-2 text-center">
                          {parts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRow(p.key)}
                              className="cursor-pointer p-1 text-ink-400 transition-colors hover:text-danger-500"
                              title="Remove line"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-ink-200 bg-[#F8F9FF] text-xs font-bold text-right text-ink-900">
                    <td className="px-2.5 py-2.5" colSpan={14}>
                      Grand Total
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      {formatINR(grandTotal)}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}

function NumCell({
  value,
  onChange,
  error,
  min = "0",
  step = "0.01",
  center,
  label,
}) {
  return (
    <td className="px-2 py-2">
      <input
        type="number"
        min={min}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={clsx(cellCls(error), center ? "text-center" : "text-right")}
        aria-label={label}
        title={error}
      />
    </td>
  );
}
