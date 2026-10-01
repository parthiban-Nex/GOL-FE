import { useRef, useState } from "react";
import { UploadCloud, FileText, Download, CheckCircle2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export default function AddBulkCsvModal({
  isOpen,
  onClose,
  onUpload,
  isUploading,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith(".csv") || file.name.endsWith(".xlsx"))) {
      setSelectedFile(file);
    }
  }

  function handleDownloadTemplate() {
    const csvContent =
      "GRN_Name,Vendor_Code,Supplier_Invoice_Number,Invoice_Date,Part_No,Description,PO_Number,Sup_Inv_Qty,Received_Qty,Cost\n" +
      "SNV(Spare Purchase inv..,8784,INV-2026-001,2025-12-09,54636,AIR CLEANER FILTER ELEMENT,54636,2,2,2288.00\n" +
      "SNV(Spare Purchase inv..,RA-14,INV-2026-002,2025-12-10,88912,SYNTHETIC ENGINE OIL 5W30,88912,1,1,2450.00";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "grn_direct_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleSubmit() {
    if (!selectedFile) return;
    onUpload?.(selectedFile);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Bulk CSV"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedFile}
            isLoading={isUploading}
          >
            Import CSV
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-ink-600">
          Upload a CSV containing GRN records and line items to import multiple
          entries simultaneously.
        </p>

        {/* Drag & Drop Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
            dragOver
              ? "border-accent-500 bg-accent-50/40"
              : "border-ink-200 bg-ink-50/50 hover:bg-ink-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx"
            className="hidden"
            onChange={handleFileChange}
          />
          {selectedFile ? (
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="h-10 w-10 text-success-500" />
              <span className="text-sm font-semibold text-ink-900">
                {selectedFile.name}
              </span>
              <span className="text-xs text-ink-500">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <UploadCloud className="h-10 w-10 text-ink-400" />
              <span className="text-sm font-semibold text-ink-700">
                Click to browse or drag &amp; drop CSV file
              </span>
              <span className="text-xs text-ink-400">
                Supports .csv and .xlsx files up to 10MB
              </span>
            </div>
          )}
        </div>

        {/* Download sample CSV template */}
        <div className="flex items-center justify-between rounded-lg border border-brand-100 bg-brand-50/60 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand-600" />
            <span className="text-xs font-medium text-brand-900">
              Sample GRN Direct Template
            </span>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-accent-600 hover:text-accent-700"
          >
            <Download className="h-3.5 w-3.5" />
            Download Template
          </button>
        </div>
      </div>
    </Modal>
  );
}
