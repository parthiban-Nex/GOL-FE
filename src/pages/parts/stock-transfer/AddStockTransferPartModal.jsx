import { useState } from "react";
import { Plus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";
import { SAMPLE_CATALOGUE_PARTS } from "../mockPartsData";

const emptyForm = {
  partCode: "",
  description: "",
  hsnCode: "",
  make: "",
  model: "",
  partsCategory: "",
  vinNumber: "",
  regNo: "",
  quantity: 1,
  rate: 0,
  mrp: 0,
};

const NUMERIC_FIELDS = new Set(["quantity", "rate", "mrp"]);

const CATALOGUE_OPTIONS = [
  { value: "", label: "-- Select Catalogue Part --" },
  ...SAMPLE_CATALOGUE_PARTS.map((p) => ({
    value: p.partNo,
    label: `${p.partNo} - ${p.description} (₹${p.cost})`,
  })),
];

export default function AddStockTransferPartModal({
  isOpen,
  onClose,
  onAddPart,
}) {
  const [formData, setFormData] = useState(emptyForm);

  if (!isOpen) return null;

  function handleSelectCataloguePart(e) {
    const selectedPartNo = e.target.value;
    if (!selectedPartNo) return;
    const catPart = SAMPLE_CATALOGUE_PARTS.find(
      (p) => p.partNo === selectedPartNo,
    );
    if (catPart) {
      setFormData((prev) => ({
        ...prev,
        partCode: catPart.partNo,
        description: catPart.description,
        rate: catPart.cost,
        mrp: Math.round(catPart.cost * 1.15),
      }));
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: NUMERIC_FIELDS.has(name) ? Number(value) || 0 : value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!formData.partCode || !formData.description) {
      return;
    }
    const cost = Number(formData.quantity) * Number(formData.rate);

    onAddPart({
      ...formData,
      cost,
      totalAmt: cost,
      id: `st-part-${Date.now()}`,
    });

    setFormData(emptyForm);
    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Parts Details"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="stock-transfer-part-form" icon={Plus}>
            Add Part
          </Button>
        </>
      }
    >
      <form
        id="stock-transfer-part-form"
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <Select
          label="Quick Pick From Catalogue"
          onChange={handleSelectCataloguePart}
          options={CATALOGUE_OPTIONS}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input
            label="Parts Code"
            required
            name="partCode"
            value={formData.partCode}
            onChange={handleChange}
            placeholder="e.g. BRK-1042"
          />
          <div className="sm:col-span-2">
            <Input
              label="Description"
              required
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="e.g. Brake Pad Set Front"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input
            label="HSN Code"
            name="hsnCode"
            value={formData.hsnCode}
            onChange={handleChange}
            placeholder="87083010"
          />
          <Input
            label="Make"
            required
            name="make"
            value={formData.make}
            onChange={handleChange}
            placeholder="Bosch"
          />
          <Input
            label="Model"
            required
            name="model"
            value={formData.model}
            onChange={handleChange}
            placeholder="BP-200X"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input
            label="Parts Category"
            name="partsCategory"
            value={formData.partsCategory}
            onChange={handleChange}
            placeholder="Brake System"
          />
          <Input
            label="VIN Number"
            name="vinNumber"
            value={formData.vinNumber}
            onChange={handleChange}
            placeholder="WBA3A5C55F"
          />
          <Input
            label="Reg No"
            required
            name="regNo"
            value={formData.regNo}
            onChange={handleChange}
            placeholder="KA-01-4521"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input
            type="number"
            min="1"
            label="Quantity"
            required
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
          />
          <Input
            type="number"
            min="0"
            step="any"
            label="Rate (₹)"
            required
            name="rate"
            value={formData.rate}
            onChange={handleChange}
          />
          <Input
            type="number"
            min="0"
            step="any"
            label="MRP (₹)"
            required
            name="mrp"
            value={formData.mrp}
            onChange={handleChange}
          />
        </div>
      </form>
    </Modal>
  );
}
