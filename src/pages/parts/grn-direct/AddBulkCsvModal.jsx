import { useRef, useState } from "react";
import {
  UploadCloud,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { grnApi } from "@/services/api/grnApi";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

const isExcelFile = (file) => /\.(xlsx|xls)$/i.test(file?.name || "");

// Normalises axios response / axios error response / raw blob / json
async function parseResult(res) {
  const data = res?.data ?? res;

  if (data instanceof Blob) {
    // Failed rows come back as an Excel file
    if (data.type === XLSX_MIME) return { failedBlob: data };

    // JSON may also arrive as a blob (when responseType: "blob")
    try {
      return { json: JSON.parse(await data.text()) };
    } catch {
      return { json: null };
    }
  }
  return { json: data };
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export default function AddBulkCsvModal({ isOpen, onClose, onSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const [summary, setSummary] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  function pickFile(file) {
    if (!isExcelFile(file)) {
      setSelectedFile(null);
      setIsValidated(false);
      setSummary(null);
      setStatus({
        type: "error",
        message: "Only Excel files (.xlsx, .xls) are allowed.",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setSelectedFile(file);
    setIsValidated(false);
    setStatus(null);
    setSummary(null);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) pickFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) pickFile(file);
  }

  function resetAndClose() {
    setSelectedFile(null);
    setIsValidated(false);
    setStatus(null);
    setSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose?.();
  }

  // Shared runner for validate + create
  async function runApi(apiFn, { onOk, setLoading, failMessage }) {
    if (!selectedFile) {
      setStatus({ type: "error", message: "Please upload an Excel file." });
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setLoading(true);
    setStatus(null);

    try {
      const res = await apiFn(formData);
      const { failedBlob, json } = await parseResult(res);

      if (failedBlob) {
        downloadBlob(failedBlob, "FailedGrn.xlsx");
        setIsValidated(false);
        setStatus({
          type: "error",
          message: `${failMessage} Failed rows were downloaded as FailedGrn.xlsx.`,
        });
        return;
      }

      onOk(json);
    } catch (err) {
      const { failedBlob, json } = await parseResult(err?.response);
      if (failedBlob) {
        downloadBlob(failedBlob, "FailedGrn.xlsx");
        setIsValidated(false);
        setStatus({
          type: "error",
          message: `${failMessage} Failed rows were downloaded as FailedGrn.xlsx.`,
        });
      } else {
        setStatus({
          type: "error",
          message: json?.message || err?.message || failMessage,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  function handleValidate() {
    runApi(grnApi.validateBulkGrn, {
      setLoading: setIsValidating,
      failMessage: "File validation failed.",
      onOk: (json) => {
        setSummary(
          json
            ? {
                successCount: json.successCount ?? 0,
                exceptionCount: json.exceptionCount ?? 0,
              }
            : null
        );
        setIsValidated(true);
        setStatus({ type: "success", message: "File validated successfully." });
      },
    });
  }

  function handleSubmit() {
    runApi(grnApi.createBulkGrn, {
      setLoading: setIsUploading,
      failMessage: "File upload failed.",
      onOk: (json) => {
        setStatus({ type: "success", message: "File uploaded successfully." });
        onSuccess?.(json);
        setTimeout(resetAndClose, 800);
      },
    });
  }

  const footer = !isValidated ? (
    <>
      <Button variant="secondary" onClick={resetAndClose}>
        Cancel
      </Button>
      <Button
        onClick={handleValidate}
        disabled={!selectedFile}
        isLoading={isValidating}
      >
        Validate
      </Button>
    </>
  ) : (
    <>
      <Button variant="secondary" onClick={resetAndClose} disabled={isUploading}>
        Cancel
      </Button>
      <Button onClick={handleSubmit} isLoading={isUploading}>
        Submit
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={resetAndClose}
      title="Bulk Upload"
      size="md"
      footer={footer}
    >
      <div className="space-y-4">
        <p className="text-xs text-ink-600">
          Upload an Excel file containing GRN records and line items to import
          multiple entries at once. Validate the file first, then submit.
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
            accept=".xlsx,.xls"
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
                Click to browse or drag &amp; drop Excel file
              </span>
              <span className="text-xs text-ink-400">
                Supports .xlsx and .xls files only
              </span>
            </div>
          )}
        </div>

        {/* Status message */}
        {status && (
          <div
            className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${
              status.type === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {status.type === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <span>{status.message}</span>
          </div>
        )}

        {/* Validation summary */}
        {summary && (
          <div className="flex gap-6 rounded-lg bg-ink-50 px-4 py-2 text-xs">
            <span className="font-semibold text-green-700">
              Success Records: {summary.successCount}
            </span>
            <span className="font-semibold text-red-600">
              Failed Records: {summary.exceptionCount}
            </span>
          </div>
        )}

        {/* Download sample template */}
        <div className="flex items-center justify-between rounded-lg border border-brand-100 bg-brand-50/60 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-brand-600" />
            <span className="text-xs font-medium text-brand-900">
              Sample GRN Template
            </span>
          </div>
          <a
            href={`${import.meta.env.BASE_URL}grnupload.xlsx`}
            download="grnupload.xlsx"
            className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-accent-600 hover:text-accent-700"
          >
            <Download className="h-3.5 w-3.5" />
            Download Template
          </a>
        </div>
      </div>
    </Modal>
  );
}