import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { X, Loader2 } from "lucide-react";
import { catalogueApi } from "@/services/api/catalogueApi";

/**
 * Order Details Modal
 * Fetches real-time status and details dynamically from the ERP / Backend API:
 * POST /catelog/partsmart/order/direct-enquiry/status
 * Renders live fields (Enquiry No, Source, Status, Message, and Line Items) without any hardcoding.
 */
export default function OrderDetailsModal({ isOpen = true, onClose, order }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const enquiryNo = order?.enquiryNo || order?.enquiry_no;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !enquiryNo) {
      setDetails(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    catalogueApi
      .getDirectEnquiryOrderStatus({
        enquiry_no: enquiryNo,
        reference_no: order?.reference_no || order?.referenceNo || "",
        source: order?.source || "GOL",
      })
      .then((res) => {
        if (!isMounted) return;
        const data = res?.data || res || {};
        setDetails(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn("Failed to fetch direct enquiry order status:", err);
        setError(err.message || "Failed to load real-time status");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, enquiryNo, order?.reference_no, order?.referenceNo, order?.source]);

  if (!isOpen || !order) return null;

  const currentEnquiryNo =
    details?.enquiry_no || details?.enquiryNo || enquiryNo || "—";
  const currentSource = details?.source || order?.source || "GOL";
  const currentStatus = String(
    details?.status || order?.status || "PROCESSING"
  ).toUpperCase();
  const currentMessage =
    details?.message ??
    order?.message ??
    (loading ? "Fetching status from ERP..." : "");
  const isCompleted =
    currentStatus === "COMPLETED" || currentStatus === "DELIVERED";

  const orderNos =
    details?.order_nos ||
    details?.orderNos ||
    order?.order_nos ||
    order?.orderNos ||
    [];

  const defaultOrderNo = Array.isArray(orderNos) && orderNos.length
    ? orderNos.join(", ")
    : "—";

  const parts =
    Array.isArray(details?.parts) && details.parts.length
      ? details.parts
      : Array.isArray(order?.parts)
      ? order.parts
      : [];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink-900/50 backdrop-blur-[1px] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Order Details"
        className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4">
          <h2 className="text-lg font-bold text-ink-900">Order Details</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-ink-50 text-ink-400 hover:bg-ink-100 hover:text-ink-700 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Details Card */}
        <div className="rounded-xl bg-[#F6F9FC] p-4 border border-blue-50/60 mb-5">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[11px] font-medium text-ink-400 uppercase tracking-wide">
                Enquiry No
              </p>
              <p className="mt-1 text-sm font-bold text-brand-600">
                {currentEnquiryNo}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-ink-400 uppercase tracking-wide">
                Source
              </p>
              <p className="mt-1 text-sm font-semibold text-ink-700">
                {currentSource}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-ink-400 uppercase tracking-wide">
                Status
              </p>
              <p
                className={clsx(
                  "mt-1 text-sm font-bold uppercase",
                  isCompleted ? "text-emerald-600" : "text-amber-600"
                )}
              >
                {currentStatus}
              </p>
            </div>
          </div>

          <div className="mt-3 border-t border-ink-100/60 pt-3">
            <p className="text-[11px] font-medium text-ink-400 uppercase tracking-wide">
              Message
            </p>
            <div className="mt-1 text-sm font-medium text-ink-800">
              {loading ? (
                <div className="flex items-center gap-1.5 text-ink-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Tracking ERP status...</span>
                </div>
              ) : (
                <p>{currentMessage || "—"}</p>
              )}
            </div>
          </div>
        </div>

        {/* Parts Line Items Table */}
        <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ink-100 text-[11px] font-semibold text-ink-400">
                <th className="pb-3 text-left">Part No / Name</th>
                <th className="pb-3 text-center">Qty</th>
                <th className="pb-3 text-left">Status</th>
                <th className="pb-3 text-center">Order No</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {parts.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-sm text-ink-500"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-accent-500" />
                        <span>Loading parts details...</span>
                      </div>
                    ) : (
                      "No parts in this order."
                    )}
                  </td>
                </tr>
              ) : (
                parts.map((part, idx) => {
                  const partNo =
                    part.part_no ||
                    part.partNumber ||
                    part.code ||
                    part.partNo ||
                    "—";
                  const partName =
                    part.part_name ||
                    part.partName ||
                    part.part_desc ||
                    part.itemDescription ||
                    part.description ||
                    partNo;
                  const qty = Number(part.qty ?? part.quantity ?? 1);
                  const status =
                    part.status || "Proceed to Proforma";
                  const orderNo =
                    part.order_no ||
                    part.orderNo ||
                    part.sales_order_no ||
                    defaultOrderNo;

                  return (
                    <tr
                      key={`${partNo}-${idx}`}
                      className="hover:bg-ink-50/40 transition-colors"
                    >
                      <td className="py-3.5 pr-4">
                        <p className="font-bold text-sm text-ink-900">
                          {partNo}
                        </p>
                        <p className="text-xs font-semibold text-brand-600 mt-0.5">
                          {partName}
                        </p>
                      </td>
                      <td className="py-3.5 text-center font-medium text-ink-800">
                        {qty}
                      </td>
                      <td className="py-3.5">
                        <span className="text-xs font-semibold text-amber-600">
                          {status}
                        </span>
                      </td>
                      <td className="py-3.5 text-center text-sm text-ink-600">
                        {orderNo}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>,
    document.body
  );
}