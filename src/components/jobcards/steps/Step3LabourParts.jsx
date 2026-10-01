import Step2Items from "@/components/estimates/steps/Step2Items";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { CreditCard } from "lucide-react";

export default function Step3LabourParts({
  jobcard,
  onChange,
  getLineItemContext,
  onToggleGst,
  isGstSaving = false,
}) {
  function updatePayment(field, value) {
    onChange({ ...jobcard, payment: { ...jobcard.payment, [field]: value } });
  }

  return (
    <div className="space-y-6">
      <Step2Items
        estimate={jobcard}
        onChange={onChange}
        getLineItemContext={getLineItemContext}
        onToggleGst={onToggleGst}
        isGstSaving={isGstSaving}
      />

      <section className="rounded-xl border border-ink-100 p-5">
        <div className="mb-4 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-brand-600" />
          <h3 className="text-base font-semibold text-ink-800">
            Payment Details
          </h3>
        </div>
        <p className="mb-4 text-xs text-ink-500">
          Record payment received from customer
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Select
            label="Payment Mode *"
            value={jobcard.payment.mode}
            onChange={(e) => updatePayment("mode", e.target.value)}
            options={[
              { value: "UPI", label: "UPI" },
              { value: "Cash", label: "Cash" },
              { value: "Card", label: "Card" },
              { value: "NetBanking", label: "NetBanking" },
            ]}
          />
          <Input
            type="date"
            label="Payment Date *"
            value={jobcard.payment.date}
            onChange={(e) => updatePayment("date", e.target.value)}
          />
          <Input
            label="Amount Received *"
            value={jobcard.payment.received}
            onChange={(e) => updatePayment("received", e.target.value)}
          />
          <Input
            label="Balance Amount"
            value={jobcard.payment.balance}
            onChange={(e) => updatePayment("balance", e.target.value)}
          />
          <Input
            label="UPI ID"
            value={jobcard.payment.upi}
            onChange={(e) => updatePayment("upi", e.target.value)}
          />
          <Input
            label="Remarks (Optional)"
            value={jobcard.payment.remarks}
            onChange={(e) => updatePayment("remarks", e.target.value)}
          />
        </div>
      </section>
    </div>
  );
}
