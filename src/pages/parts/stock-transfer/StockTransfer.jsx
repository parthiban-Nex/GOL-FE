import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { usePagePermissions } from "@/hooks/usePagePermissions";
import { partsApi } from "@/services";
import { showToast } from "@/utils/toast";

export default function StockTransfer() {
  const { canCreate } = usePagePermissions();

  const [workshops, setWorkshops] = useState([]);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState("");
  const [workshopMobile, setWorkshopMobile] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [partsList, setPartsList] = useState([]);
  const [isLoadingWorkshops, setIsLoadingWorkshops] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load workshops from API / mock data on mount
  useEffect(() => {
    async function fetchWorkshops() {
      setIsLoadingWorkshops(true);
      try {
        const res = await partsApi.getWorkshops();
        setWorkshops(res.items || []);
      } catch {
        showToast.error("Failed to load workshops list");
      } finally {
        setIsLoadingWorkshops(false);
      }
    }
    fetchWorkshops();
  }, []);

  // When a workshop is selected, populate mobile, GST, and load its initial parts
  function handleWorkshopChange(e) {
    const workshopId = e.target.value;
    setSelectedWorkshopId(workshopId);

    if (!workshopId) {
      setWorkshopMobile("");
      setGstNumber("");
      setPartsList([]);
      return;
    }

    const selectedWorkshop = workshops.find((w) => w.id === workshopId);
    if (selectedWorkshop) {
      setWorkshopMobile(
        selectedWorkshop.mobileDisplay || selectedWorkshop.mobile || "",
      );
      setGstNumber(selectedWorkshop.gstNumber || "");
      // Load workshop's initial parts or empty array if none
      const initialParts = (selectedWorkshop.parts || []).map((p) => ({
        ...p,
      }));
      setPartsList(initialParts);
      showToast.success(`Loaded details for ${selectedWorkshop.workshopName}`);
    }
  }

  // Handle inline change for a part row
  function handlePartChange(id, field, value) {
    setPartsList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "quantity" || field === "rate") {
            const qty =
              Number(field === "quantity" ? value : item.quantity) || 0;
            const rate = Number(field === "rate" ? value : item.rate) || 0;
            updated.cost = qty * rate;
            updated.totalAmt = qty * rate;
          }
          return updated;
        }
        return item;
      }),
    );
  }

  // Add a new EMPTY row manually
  function handleAddEmptyPart() {
    if (!selectedWorkshopId) {
      showToast.error("Please select a workshop first");
      return;
    }

    const newEmptyRow = {
      id: `st-part-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      partCode: "",
      description: "",
      hsnCode: "",
      make: "",
      model: "",
      partsCategory: "",
      vinNumber: "",
      regNo: "",
      quantity: "",
      rate: "",
      cost: 0,
      mrp: "",
      totalAmt: 0,
    };

    setPartsList((prev) => [...prev, newEmptyRow]);
    showToast.success("New empty row added");
  }

  function handleRemovePart(id) {
    setPartsList((prev) => prev.filter((item) => item.id !== id));
    showToast.success("Part removed");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!selectedWorkshopId) {
      showToast.error("Please select a Workshop");
      return;
    }

    if (!deliveryDate.trim()) {
      showToast.error("Please enter a Delivery Date");
      return;
    }

    if (partsList.length === 0) {
      showToast.error("Please add at least one part item to the transfer list");
      return;
    }

    // Validate mandatory fields for every part
    for (let i = 0; i < partsList.length; i++) {
      const p = partsList[i];
      if (
        !p.partCode?.trim() ||
        !p.description?.trim() ||
        !p.make?.trim() ||
        !p.model?.trim() ||
        !p.regNo?.trim() ||
        !p.quantity ||
        p.rate === "" ||
        p.rate === undefined ||
        p.mrp === "" ||
        p.mrp === undefined
      ) {
        showToast.error(
          `Please fill all required fields marked with * in row #${i + 1}`,
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const selectedWorkshop = workshops.find(
        (w) => w.id === selectedWorkshopId,
      );
      const payload = {
        workshopId: selectedWorkshopId,
        workshopName: selectedWorkshop?.workshopName || "",
        workshopMobile,
        gstNumber,
        deliveryDate,
        items: partsList,
      };

      const res = await partsApi.createStockTransfer(payload);
      showToast.success(
        `Stock Transfer ${res.transferNo} submitted successfully!`,
      );
    } catch (err) {
      showToast.error(err.message || "Failed to submit stock transfer");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <h1 className="text-lg font-semibold text-ink-800">Stock Transfer</h1>

      {!canCreate && (
        <div className="rounded-xl border border-ink-100 bg-ink-50 p-4 text-sm text-ink-600">
          You don&apos;t have permission to create a stock transfer.
        </div>
      )}

      {/* Top Header Card with Form Fields */}
      <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-xs">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Select Workshop"
            value={selectedWorkshopId}
            onChange={handleWorkshopChange}
            disabled={isLoadingWorkshops || !canCreate}
            options={[
              { value: "", label: "-- Select Workshop --" },
              ...workshops.map((w) => ({
                value: w.id,
                label: w.workshopName,
              })),
            ]}
          />

          <Input
            label="Workshop Mobile"
            readOnly
            value={workshopMobile}
            placeholder="Auto-populated on selection"
          />

          <Input
            label="GST Number"
            readOnly
            value={gstNumber}
            placeholder="Auto-populated on selection"
          />

          <Input
            type="date"
            label="Delivery Date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            disabled={!canCreate}
          />
        </div>
      </div>

      {/* Parts details Container Card */}
      <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-xs">
        {/* Header row */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-ink-900">Parts details</h2>
          {canCreate && (
            <Button size="sm" icon={Plus} onClick={handleAddEmptyPart}>
              Add Parts Details
            </Button>
          )}
        </div>

        {/* Editable Table - a free-form editable grid, which the
            shared Table component doesn't support, so this stays
            hand-built rather than forced into it. */}
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[1200px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-ink-100 bg-[#F8F9FF] text-[11px] font-bold uppercase tracking-wider text-[#5A607F]">
                <th className="px-2.5 py-3">Parts Code</th>
                <th className="px-2.5 py-3">Description</th>
                <th className="px-2.5 py-3">HSN Code</th>
                <th className="px-2.5 py-3">Make *</th>
                <th className="px-2.5 py-3">Model *</th>
                <th className="px-2.5 py-3">Parts Category</th>
                <th className="px-2.5 py-3">VIN Number</th>
                <th className="px-2.5 py-3">Reg No *</th>
                <th className="px-2.5 py-3">Quantity *</th>
                <th className="px-2.5 py-3">Rate *</th>
                <th className="px-2.5 py-3">Cost *</th>
                <th className="px-2.5 py-3">MRP *</th>
                <th className="px-2.5 py-3">Total Amt</th>
                <th className="px-2 py-3 text-center" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-50">
              {!selectedWorkshopId ? (
                <tr>
                  <td
                    colSpan={14}
                    className="py-12 text-center text-sm text-ink-500"
                  >
                    Please select a workshop from above to view and add parts.
                  </td>
                </tr>
              ) : partsList.length === 0 ? (
                <tr>
                  <td
                    colSpan={14}
                    className="py-12 text-center text-sm text-ink-500"
                  >
                    No parts added yet. Click &quot;+ Add Parts Details&quot; to
                    add a new row.
                  </td>
                </tr>
              ) : (
                partsList.map((row, index) => (
                  <tr
                    key={row.id || index}
                    className="hover:bg-ink-50/40 transition-colors"
                  >
                    <td className="px-2 py-2.5">
                      <input
                        type="text"
                        value={row.partCode || ""}
                        placeholder="BRK-1042"
                        disabled={!canCreate}
                        onChange={(e) =>
                          handlePartChange(row.id, "partCode", e.target.value)
                        }
                        className="w-24 rounded border border-ink-200 bg-white px-2 py-1 text-xs text-ink-800 placeholder:text-ink-300 focus:border-brand-500 focus:outline-none disabled:bg-ink-50"
                      />
                    </td>

                    <td className="px-2 py-2.5">
                      <input
                        type="text"
                        value={row.description || ""}
                        placeholder="Part Description"
                        disabled={!canCreate}
                        onChange={(e) =>
                          handlePartChange(
                            row.id,
                            "description",
                            e.target.value,
                          )
                        }
                        className="w-36 rounded border border-ink-200 bg-white px-2 py-1 text-xs text-ink-800 placeholder:text-ink-300 focus:border-brand-500 focus:outline-none disabled:bg-ink-50"
                      />
                    </td>

                    <td className="px-2 py-2.5">
                      <input
                        type="text"
                        value={row.hsnCode || ""}
                        placeholder="87083010"
                        disabled={!canCreate}
                        onChange={(e) =>
                          handlePartChange(row.id, "hsnCode", e.target.value)
                        }
                        className="w-20 rounded border border-ink-200 bg-white px-2 py-1 text-xs text-ink-800 placeholder:text-ink-300 focus:border-brand-500 focus:outline-none disabled:bg-ink-50"
                      />
                    </td>

                    <td className="px-2 py-2.5">
                      <input
                        type="text"
                        value={row.make || ""}
                        placeholder="Make"
                        disabled={!canCreate}
                        onChange={(e) =>
                          handlePartChange(row.id, "make", e.target.value)
                        }
                        className="w-20 rounded border border-ink-200 bg-white px-2 py-1 text-xs text-ink-800 placeholder:text-ink-300 focus:border-brand-500 focus:outline-none disabled:bg-ink-50"
                      />
                    </td>

                    <td className="px-2 py-2.5">
                      <input
                        type="text"
                        value={row.model || ""}
                        placeholder="Model"
                        disabled={!canCreate}
                        onChange={(e) =>
                          handlePartChange(row.id, "model", e.target.value)
                        }
                        className="w-20 rounded border border-ink-200 bg-white px-2 py-1 text-xs text-ink-800 placeholder:text-ink-300 focus:border-brand-500 focus:outline-none disabled:bg-ink-50"
                      />
                    </td>

                    <td className="px-2 py-2.5">
                      <input
                        type="text"
                        value={row.partsCategory || ""}
                        placeholder="Category"
                        disabled={!canCreate}
                        onChange={(e) =>
                          handlePartChange(
                            row.id,
                            "partsCategory",
                            e.target.value,
                          )
                        }
                        className="w-24 rounded border border-ink-200 bg-white px-2 py-1 text-xs text-ink-800 placeholder:text-ink-300 focus:border-brand-500 focus:outline-none disabled:bg-ink-50"
                      />
                    </td>

                    <td className="px-2 py-2.5">
                      <input
                        type="text"
                        value={row.vinNumber || ""}
                        placeholder="VIN"
                        disabled={!canCreate}
                        onChange={(e) =>
                          handlePartChange(row.id, "vinNumber", e.target.value)
                        }
                        className="w-24 rounded border border-ink-200 bg-white px-2 py-1 text-xs text-ink-800 placeholder:text-ink-300 focus:border-brand-500 focus:outline-none disabled:bg-ink-50"
                      />
                    </td>

                    <td className="px-2 py-2.5">
                      <input
                        type="text"
                        value={row.regNo || ""}
                        placeholder="KA-01-4521"
                        disabled={!canCreate}
                        onChange={(e) =>
                          handlePartChange(row.id, "regNo", e.target.value)
                        }
                        className="w-24 rounded border border-ink-200 bg-white px-2 py-1 text-xs text-ink-800 placeholder:text-ink-300 focus:border-brand-500 focus:outline-none disabled:bg-ink-50"
                      />
                    </td>

                    <td className="px-2 py-2.5">
                      <input
                        type="number"
                        min="1"
                        value={row.quantity ?? ""}
                        placeholder="1"
                        disabled={!canCreate}
                        onChange={(e) =>
                          handlePartChange(row.id, "quantity", e.target.value)
                        }
                        className="w-14 rounded border border-ink-200 bg-white px-2 py-1 text-center text-xs text-ink-800 focus:border-brand-500 focus:outline-none disabled:bg-ink-50"
                      />
                    </td>

                    <td className="px-2 py-2.5">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={row.rate ?? ""}
                        placeholder="0"
                        disabled={!canCreate}
                        onChange={(e) =>
                          handlePartChange(row.id, "rate", e.target.value)
                        }
                        className="w-16 rounded border border-ink-200 bg-white px-2 py-1 text-right text-xs text-ink-800 focus:border-brand-500 focus:outline-none disabled:bg-ink-50"
                      />
                    </td>

                    <td className="px-2 py-2.5">
                      <input
                        type="text"
                        readOnly
                        value={Number(row.cost || 0).toLocaleString("en-IN")}
                        className="w-16 rounded border border-ink-100 bg-ink-50 px-2 py-1 text-right text-xs font-medium text-ink-700"
                      />
                    </td>

                    <td className="px-2 py-2.5">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={row.mrp ?? ""}
                        placeholder="0"
                        disabled={!canCreate}
                        onChange={(e) =>
                          handlePartChange(row.id, "mrp", e.target.value)
                        }
                        className="w-16 rounded border border-ink-200 bg-white px-2 py-1 text-right text-xs text-ink-800 focus:border-brand-500 focus:outline-none disabled:bg-ink-50"
                      />
                    </td>

                    <td className="px-2 py-2.5">
                      <input
                        type="text"
                        readOnly
                        value={Number(row.totalAmt || 0).toLocaleString(
                          "en-IN",
                        )}
                        className="w-16 rounded border border-ink-100 bg-ink-50 px-2 py-1 text-right text-xs font-semibold text-ink-900"
                      />
                    </td>

                    <td className="px-2 py-2.5 text-center">
                      {canCreate && (
                        <button
                          type="button"
                          onClick={() => handleRemovePart(row.id)}
                          className="cursor-pointer p-1 text-ink-400 transition-colors hover:text-danger-600"
                          title="Remove Row"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Submit Action */}
        {canCreate && (
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={
                isSubmitting || !selectedWorkshopId || partsList.length === 0
              }
              isLoading={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
